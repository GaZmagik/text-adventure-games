import { resolve } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { realpathSync } from 'node:fs';
import type { CommandResult, GmState } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState, saveState, createDefaultState } from '../lib/state-store';
import { validateState } from '../lib/validator';
import { attachChecksum, validateAndDecode } from '../lib/fnv32';
import { VALID_TOP_KEYS, FORBIDDEN_KEYS, MAX_STATE_HISTORY, SCHEMA_VERSION } from '../lib/constants';

/** Recursively check for forbidden keys (__proto__, constructor, prototype) in a parsed value. */
function containsForbiddenKeys(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key)) return true;
    if (containsForbiddenKeys((obj as Record<string, unknown>)[key])) return true;
  }
  return false;
}

/** Numeric semver comparison — avoids lexicographic string comparison pitfalls (e.g. '2.0.0' < '10.0.0'). */
function semverLessThan(a: string, b: string): boolean {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return true;
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return false;
  }
  return false;
}

const RE_SAVE_IN_FENCE = /```[\s\S]*?([\da-fA-F]{8}\.SF[12]:[\S]+)[\s\S]*?```/;
const RE_SAVE_BARE = /([\da-fA-F]{8}\.SF[12]:[\S]+)/;

async function resolveSaveString(input: string): Promise<string> {
  if (input.startsWith('/') || input.startsWith('./') || input.endsWith('.md') || input.endsWith('.save')) {
    // Restrict file access to home directory or temp directory to prevent path traversal.
    // Use realpathSync to resolve symlinks before the prefix check.
    // NOTE: TOCTOU gap — realpathSync resolves at this point but Bun.file().text() reads
    // later. Acceptable in the current single-user sandboxed environment; would need an
    // open-by-fd approach (O_NOFOLLOW + fstat) for multi-user or untrusted-filesystem deployment.
    let resolved: string;
    try {
      resolved = realpathSync(resolve(input));
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err
        ? (err as NodeJS.ErrnoException).code
        : undefined;
      if (code !== 'ENOENT' && code !== 'ENOTDIR') throw err;
      // Path doesn't exist as a file — treat as raw save string.
      // If input looks like a file path (contains / or \), note that the file wasn't found.
      if (input.includes('/') || input.includes('\\')) {
        return input;  // Warning added to result by caller if needed
      }
      return input;
    }
    const home = homedir();
    const tmp = tmpdir();
    if (home === '/') {
      throw new Error('Save path validation requires a non-root home directory.');
    }
    const homePrefix = home + '/';
    const tmpPrefix = tmp === '/' ? tmp : tmp + '/';
    if (!resolved.startsWith(homePrefix) && !resolved.startsWith(tmpPrefix)) {
      throw new Error('Save file path must be within the home or temp directory.');
    }

    try {
      const file = Bun.file(resolved);
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Save file exceeds 10 MB size limit.');
      }
      const content = await file.text();
      const match = content.match(RE_SAVE_IN_FENCE);
      if (match) return match[1]!;
      const lineMatch = content.match(RE_SAVE_BARE);
      if (lineMatch) return lineMatch[1]!;
      return content.trim();
    } catch (err: unknown) {
      // Re-throw deliberate validation errors (e.g. size limit); only swallow I/O failures.
      if (err instanceof Error && err.message.includes('size limit')) throw err;
      // File path detected but unreadable — fall through to treat as raw save string
      return input;
    }
  }
  return input;
}

async function generate(): Promise<CommandResult> {
  const state = await tryLoadState();
  if (!state) return noState();

  // Build payload — full state minus session-only computation, SF2: uncompressed base64 (no LZ)
  // Destructuring exclusion ensures new GmState fields are included by default.
  // _stateHistory is intentionally kept in the payload for determinism auditing.
  const { _lastComputation, ...gameFields } = state;
  const payload = { v: 1, mode: 'full', ...gameFields };

  const json = JSON.stringify(payload);
  const code = 'SF2:' + btoa(json);
  const saveString = attachChecksum(code);

  return ok({
    saveString,
    mode: 'full',
    format: 'SF2',
    characterName: state.character?.name ?? null,
    scene: state.scene,
    byteLength: saveString.length,
  }, 'save generate');
}

async function load(args: string[]): Promise<CommandResult> {
  if (args.length < 1) {
    return fail(
      'Usage: tag save load <file.save.md | save-string>',
      'tag save load /path/to/game.save.md',
      'save load',
    );
  }

  let saveString: string;
  try {
    saveString = await resolveSaveString(args[0]!);
  } catch (err) {
    return fail(
      err instanceof Error ? err.message : 'Failed to resolve save file path.',
      'Provide a path within your home or temp directory.',
      'save load',
    );
  }

  const decoded = validateAndDecode(saveString);

  if (!decoded.valid) {
    return fail(
      `Save validation failed: ${decoded.error}`,
      'Check the save string for corruption or truncation.',
      'save load',
    );
  }

  const payload = decoded.payload;

  // Filter payload to only recognised top-level keys, stripping prototype-pollution vectors.
  // This prevents a crafted save from injecting arbitrary keys into GmState.
  // Nested values are also checked recursively for forbidden keys (__proto__, constructor, prototype).
  const filtered: Record<string, unknown> = {};
  for (const key of Object.keys(payload)) {
    if (VALID_TOP_KEYS.has(key)) {
      const value = (payload as Record<string, unknown>)[key];
      if (!containsForbiddenKeys(value)) {
        filtered[key] = value;
      }
    }
  }

  // Rebuild GmState from filtered payload — spread merge ensures new fields inherit defaults
  // and saved fields always win. _lastComputation is session-only and always reset.
  const defaults = createDefaultState();
  defaults._lastComputation = undefined;
  const state: GmState = {
    ...defaults,
    ...filtered as Partial<GmState>,
  };

  // Phase 10: Schema versioning — read version from payload, default to '1.2.0' for legacy saves
  const loadedVersion = typeof filtered._schemaVersion === 'string'
    ? filtered._schemaVersion
    : '1.2.0';

  // Run migrations for pre-1.3.0 saves
  if (semverLessThan(loadedVersion, '1.3.0')) {
    // Phase 3: HP clamping migration — normalise out-of-range HP values
    if (state.character && typeof state.character.hp === 'number' && typeof state.character.maxHp === 'number') {
      state.character.hp = Math.max(0, Math.min(state.character.hp, state.character.maxHp));
    }
  }

  // Stamp current schema version after migrations
  state._schemaVersion = SCHEMA_VERSION;

  // Phase 2: Preserve loaded _stateHistory, cap at MAX_STATE_HISTORY
  if (state._stateHistory && state._stateHistory.length > MAX_STATE_HISTORY) {
    state._stateHistory = state._stateHistory.slice(-MAX_STATE_HISTORY);
  }

  // Validate reconstructed state — reject if structurally invalid, warn on minor issues
  const validation = validateState(state);

  if (!validation.valid) {
    return fail(
      `Save contains invalid state: ${validation.errors.join('; ')}`,
      'Fix the save data or use a different save file.',
      'save load',
    );
  }

  await saveState(state);

  return ok({
    message: 'Save loaded successfully.',
    mode: decoded.mode,
    scene: state.scene,
    characterName: state.character?.name ?? null,
    ...(validation.valid ? {} : { warnings: validation.errors }),
  }, 'save load');
}

async function validate(args: string[]): Promise<CommandResult> {
  if (args.length < 1) {
    return fail('Usage: tag save validate <save-string>', 'tag save validate <checksummed-string>', 'save validate');
  }

  let saveString: string;
  try {
    saveString = await resolveSaveString(args[0]!);
  } catch (err) {
    return fail(
      err instanceof Error ? err.message : 'Failed to resolve save file path.',
      'Provide a path within your home or temp directory.',
      'save validate',
    );
  }

  const decoded = validateAndDecode(saveString);

  if (!decoded.valid) {
    return ok({
      valid: false,
      mode: null,
      error: decoded.error,
      scene: null,
      characterName: null,
    }, 'save validate');
  }

  return ok({
    valid: true,
    mode: decoded.mode,
    error: null,
    scene: decoded.payload.scene ?? null,
    characterName: typeof decoded.payload.character === 'object' && decoded.payload.character !== null
      ? (decoded.payload.character as Record<string, unknown>).name
      : null,
  }, 'save validate');
}

export async function handleSave(args: string[]): Promise<CommandResult> {
  const sub = args[0];
  switch (sub) {
    case 'generate': return generate();
    case 'load': return load(args.slice(1));
    case 'validate': return validate(args.slice(1));
    case 'migrate':
      return fail(
        'Save migration is not yet required — only format version 1 exists.',
        'tag save validate <save-string>',
        'save migrate',
      );
    default:
      return fail(
        `Unknown save subcommand: ${sub ?? '(none)'}. Available: generate, load, validate, migrate`,
        'tag save generate',
        'save',
      );
  }
}
