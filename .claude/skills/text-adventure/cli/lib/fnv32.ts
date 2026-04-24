// FNV-1a 32-bit hash — ported from modules/save-codex.md § Checksum System

/**
 * Calculates a 32-bit FNV-1a hash of a string.
 *
 * @param {string} str - The input string to hash.
 * @returns {string} - An 8-character hex string representing the hash.
 *
 * @remarks
 * This is the engine's primary checksum algorithm.
 *
 * **Warning**: This implementation uses JS UTF-16 code units (`charCodeAt`)
 * rather than UTF-8 bytes. Multi-byte characters are hashed as their surrogate
 * pair values. This is a permanent architectural constraint; changing this
 * would invalidate all existing save files and verification markers.
 */
export function fnv32(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/**
 * Attaches an FNV32 checksum prefix to a string.
 * @param {string} code - The string to sign (e.g., "SF2:eyJ...").
 * @returns {string} - The signed string (e.g., "a1b2c3d4.SF2:eyJ...").
 */
export function attachChecksum(code: string): string {
  return fnv32(code) + '.' + code;
}

/** Result of a save-string decoding operation. */
type DecodeResult =
  | { valid: true; payload: Record<string, unknown>; mode: 'compact' | 'full' | 'lore' }
  | { valid: false; error: string };

/**
 * Parses a save string into its component parts, supporting both new and legacy formats.
 *
 * New format (v1.3.0+): `CHECKSUM.FORMAT:PAYLOAD`
 * Legacy format: `FORMAT:CHECKSUM:PAYLOAD`
 */
function parseSaveString(saveString: string): { checksum: string; format: string; encoded: string } | null {
  // New format: 8 hex chars, dot, then format:payload
  const dotIdx = saveString.indexOf('.');
  if (dotIdx === 8 && /^[0-9a-f]{8}$/i.test(saveString.slice(0, 8))) {
    const code = saveString.slice(9);
    const colonIdx = code.indexOf(':');
    if (colonIdx === -1) return null;
    return {
      checksum: saveString.slice(0, 8),
      format: code.slice(0, colonIdx),
      encoded: code.slice(colonIdx + 1),
    };
  }

  // Legacy format: FORMAT:CHECKSUM:PAYLOAD
  const parts = saveString.split(':');
  if (parts.length >= 3 && /^(SF[12]|SC1)$/i.test(parts[0]!) && /^[0-9a-f]{8}$/i.test(parts[1]!)) {
    return {
      checksum: parts[1]!,
      format: parts[0]!.toUpperCase(),
      encoded: parts.slice(2).join(':'), // rejoin in case payload contains colons
    };
  }

  return null;
}

/**
 * Validates the checksum and decodes the Base64 payload of a save/lore string.
 *
 * @param {string} saveString - The raw string to decode.
 * @returns {DecodeResult} - The decoded payload and metadata.
 *
 * @remarks
 * This function handles the "Master Decoding" logic:
 * 1. Resolves the format (SF1, SF2, SC1, LF1).
 * 2. Validates the FNV32 checksum against both the raw payload and the `format:payload` string.
 * 3. Handles LZ-String compression error reporting (for legacy SF1 saves).
 * 4. Parses the JSON payload.
 */
export function validateAndDecode(saveString: string): DecodeResult {
  const parsed = parseSaveString(saveString);
  if (!parsed) return { valid: false, error: 'BAD_FORMAT' };

  const { checksum, format, encoded } = parsed;

  // Validate checksum — try against payload, then against format:payload
  const checksumOverPayload = fnv32(encoded);
  const checksumOverCode = fnv32(format + ':' + encoded);
  if (checksum !== checksumOverPayload && checksum !== checksumOverCode) {
    return { valid: false, error: 'CHECKSUM_FAIL' };
  }

  // Determine mode
  let mode: 'compact' | 'full' | 'lore';
  if (format === 'SC1') mode = 'compact';
  else if (format === 'SF1' || format === 'SF2') mode = 'full';
  else if (format === 'LF1') mode = 'lore';
  else return { valid: false, error: 'UNKNOWN_VERSION' };

  try {
    // Try plain base64 first (works for SF2, SC1, and most SF1 saves)
    const json = Buffer.from(encoded, 'base64').toString('utf-8');
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { valid: false, error: 'BAD_FORMAT' as const };
    }
    const payload = parsed as Record<string, unknown>;
    return { valid: true, payload, mode };
  } catch {
    // If base64 fails on SF1, it may genuinely be LZ-compressed
    if (format === 'SF1') {
      return {
        valid: false,
        error:
          'SF1_LZ_COMPRESSED — this save uses LZ-String compression. Vendor lz-string to decode, or re-save from an active session.',
      };
    }
    return { valid: false, error: 'DECODE_FAIL' };
  }
}
