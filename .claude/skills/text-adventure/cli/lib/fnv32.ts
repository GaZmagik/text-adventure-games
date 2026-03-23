// FNV-1a 32-bit hash — ported from modules/save-codex.md § Checksum System

export function fnv32(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function attachChecksum(code: string): string {
  return fnv32(code) + '.' + code;
}

interface DecodeResult {
  valid: boolean;
  error?: string;
  payload?: Record<string, unknown>;
  mode?: 'compact' | 'full';
}

export function validateAndDecode(saveString: string): DecodeResult {
  const dotIdx = saveString.indexOf('.');
  if (dotIdx !== 8) return { valid: false, error: 'BAD_FORMAT' };

  const checksum = saveString.slice(0, 8);
  const code = saveString.slice(9);

  if (fnv32(code) !== checksum) return { valid: false, error: 'CHECKSUM_FAIL' };

  try {
    let mode: 'compact' | 'full';
    if (code.startsWith('SC1:')) mode = 'compact';
    else if (code.startsWith('SF1:') || code.startsWith('SF2:')) mode = 'full';
    else return { valid: false, error: 'UNKNOWN_VERSION' };

    const encoded = code.slice(4);

    // SC1 and SF2 use plain base64. SF1 uses LZ compression (not supported in tag v1.3.0).
    if (code.startsWith('SF1:')) {
      return { valid: false, error: 'SF1_COMPRESSED_NOT_SUPPORTED — save was created with LZ compression. Use the in-game resume flow or upgrade to tag v1.4.0+.' };
    }

    const json = atob(encoded);
    const payload = JSON.parse(json) as Record<string, unknown>;
    return { valid: true, payload, mode };
  } catch {
    return { valid: false, error: 'DECODE_FAIL' };
  }
}
