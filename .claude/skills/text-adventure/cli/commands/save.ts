import { resolve } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { realpathSync } from 'node:fs';
import type { CommandResult, GmState } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState, saveState, createDefaultState } from '../lib/state-store';
import { validateState } from '../lib/validator';
import { attachChecksum, validateAndDecode } from '../lib/fnv32';
import { VALID_TOP_KEYS } from '../lib/constants';

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
      const code = (err as NodeJS.ErrnoException).code;
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
    const homePrefix = home === '/' ? home : home + '/';
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

  // Build payload — full state minus session-only fields, SF2: uncompressed base64 (no LZ)
  // Destructuring exclusion ensures new GmState fields are included by default.
  const { _stateHistory, _lastComputation, ...gameFields } = state;
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
  const filtered: Record<string, unknown> = {};
  for (const key of Object.keys(payload)) {
    if (VALID_TOP_KEYS.has(key) && !['__proto__', 'constructor', 'prototype'].includes(key)) {
      filtered[key] = (payload as Record<string, unknown>)[key];
    }
  }

  // Rebuild GmState from filtered payload — spread merge ensures new fields inherit defaults
  // and saved fields always win. Session-only fields (_stateHistory, _lastComputation) are
  // explicitly reset so they never leak from a previous save format.
  const defaults = createDefaultState();
  defaults._stateHistory = [];
  defaults._lastComputation = undefined;
  const state: GmState = {
    ...defaults,
    ...filtered as Partial<GmState>,
  };

  // Validate reconstructed state — warn but still save (user may want partially valid data)
  const validation = validateState(state);

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
    characterName: decoded.payload.character
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
