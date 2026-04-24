import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import type { CommandResult, GmState } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState, saveState, createDefaultState, getSyncMarkerPath, getStateDir } from '../lib/state-store';
import { validateState } from '../lib/validator';
import { attachChecksum, validateAndDecode } from '../lib/fnv32';
import { VALID_TOP_KEYS, MAX_STATE_HISTORY, SCHEMA_VERSION } from '../lib/constants';
import { containsForbiddenKeys } from '../lib/security';
import { readSafeTextFile, resolveSafeReadPath } from '../lib/path-security';
import { stripUnknownStateKeys } from '../lib/state-schema';
import { signMarker, getVerifyMarkerPath, getNeedsVerifyPath } from './verify';

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
type DecodeMode = 'compact' | 'full' | 'lore';

type PreparedSaveState =
  | { ok: true; state: GmState; warnings: string[] }
  | { ok: false; message: string; corrective: string };

async function resolveSaveString(input: string): Promise<string> {
  const resolved = resolveSafeReadPath(input, {
    kind: 'Save',
    extensions: ['.md', '.save'],
  });
  if (!resolved) {
    return input;
  }

  const content = await readSafeTextFile(resolved, 'Save');
  const match = content.match(RE_SAVE_IN_FENCE);
  if (match) return match[1]!;
  const lineMatch = content.match(RE_SAVE_BARE);
  if (lineMatch) return lineMatch[1]!;
  return content.trim();
}

function encodeStateAsSaveString(state: GmState): string {
  // Build payload: full state minus session-only computation, SF2 uncompressed base64.
  // Destructuring exclusion ensures new GmState fields are included by default.
  // _stateHistory is intentionally kept in the payload for determinism auditing.
  const { _lastComputation, ...gameFields } = state;
  const payload = { v: 1, mode: 'full', ...gameFields };
  const json = JSON.stringify(payload);
  const code = 'SF2:' + Buffer.from(json, 'utf-8').toString('base64');
  return attachChecksum(code);
}

function prepareSaveState(payload: Record<string, unknown>): PreparedSaveState {
  // Filter payload to only recognised top-level keys, stripping prototype-pollution vectors.
  // This prevents a crafted save from injecting arbitrary keys into GmState.
  // Nested values are also checked recursively for forbidden keys (__proto__, constructor, prototype).
  const filtered: Record<string, unknown> = {};
  for (const key of Object.keys(payload)) {
    if (VALID_TOP_KEYS.has(key)) {
      const value = payload[key];
      if (!containsForbiddenKeys(value)) {
        filtered[key] = value;
      }
    }
  }

  // Rebuild GmState from filtered payload: spread merge ensures new fields inherit defaults
  // and saved fields always win. _lastComputation is session-only and always reset.
  const { _lastComputation: _, ...defaults } = createDefaultState();
  let state: Record<string, unknown> = {
    ...defaults,
    ...filtered,
  };

  // Schema versioning: read version from payload, default to '1.2.0' for legacy saves.
  const loadedVersion = typeof filtered._schemaVersion === 'string' ? filtered._schemaVersion : '1.2.0';

  // Run migrations for pre-1.3.0 saves.
  if (semverLessThan(loadedVersion, '1.3.0')) {
    // HP clamping migration: normalise out-of-range HP values.
    const char = state.character;
    if (char && typeof char === 'object' && !Array.isArray(char)) {
      const c = char as Record<string, unknown>;
      if (typeof c.hp === 'number' && typeof c.maxHp === 'number') {
        c.hp = Math.max(0, Math.min(c.hp, c.maxHp));
      }
    }
  }

  // Stamp current schema version after migrations.
  state._schemaVersion = SCHEMA_VERSION;

  // Preserve loaded _stateHistory, cap at MAX_STATE_HISTORY.
  const history = state._stateHistory;
  if (Array.isArray(history) && history.length > MAX_STATE_HISTORY) {
    state._stateHistory = history.slice(-MAX_STATE_HISTORY);
  }

  const { sanitized, strippedPaths } = stripUnknownStateKeys(state);
  state = sanitized as Record<string, unknown>;
  const strippedWarnings = strippedPaths.map(
    path => `Stripped unexpected state key "${path}" while loading save data.`,
  );

  // Validate reconstructed state: reject if structurally invalid, warn on minor issues.
  const validation = validateState(state);

  if (!validation.valid) {
    return {
      ok: false,
      message: `Save contains invalid state: ${validation.errors.join('; ')}`,
      corrective: 'Fix the save data or use a different save file.',
    };
  }

  // Cast is safe here: validateState has confirmed structural validity.
  return {
    ok: true,
    state: state as unknown as GmState,
    warnings: [...strippedWarnings, ...validation.warnings],
  };
}

async function generate(): Promise<CommandResult> {
  const state = await tryLoadState();
  if (!state) return noState('save');

  const saveString = encodeStateAsSaveString(state);

  const frontmatter: Record<string, string | number | null> = {
    format: 'text-adventure-save',
    version: 1,
    'skill-version': SCHEMA_VERSION,
    character: state.character?.name ?? null,
    class: state.character?.class ?? null,
    level: state.character?.level ?? null,
    scene: state.scene,
    location: state.currentRoom,
    'date-saved': new Date().toISOString(),
    theme: state.theme ?? null,
    'visual-style': state.visualStyle ?? null,
    mode: 'full',
    seed: state.seed ?? null,
    arc: state.arc ?? 1,
    'arc-type': state.arcType ?? 'standard',
  };

  return ok(
    {
      saveString,
      mode: 'full',
      format: 'SF2',
      characterName: state.character?.name ?? null,
      scene: state.scene,
      byteLength: saveString.length,
      frontmatter,
    },
    'save generate',
  );
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

  const prepared = prepareSaveState(payload);
  if (!prepared.ok) {
    return fail(prepared.message, prepared.corrective, 'save load');
  }

  const validState = prepared.state;
  await saveState(validState);

  // Stamp workflow markers — the save captures a fully-synced, fully-verified state.
  // Without these markers, the render/sync pipeline would deadlock (render needs sync,
  // sync needs verify, verify needs rendered HTML that doesn't exist yet).
  const stateDir = getStateDir();
  const scene = validState.scene;
  writeFileSync(getSyncMarkerPath(), signMarker(scene), 'utf-8');
  writeFileSync(getVerifyMarkerPath(), signMarker(scene), 'utf-8');
  // Pre-game gates: these were all passed before the save was created
  for (const type of ['scenario', 'rules', 'character']) {
    writeFileSync(join(stateDir, `.verified-${type}`), signMarker(0), 'utf-8');
  }
  // Clear any stale needs-verify marker
  try {
    unlinkSync(getNeedsVerifyPath());
  } catch {
    /* already absent */
  }

  return ok(
    {
      message: 'Save loaded successfully.',
      mode: decoded.mode,
      scene: validState.scene,
      characterName: validState.character?.name ?? null,
      ...(prepared.warnings.length > 0 ? { warnings: prepared.warnings } : {}),
    },
    'save load',
  );
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
    return ok(
      {
        valid: false,
        mode: null,
        error: decoded.error,
        scene: null,
        characterName: null,
      },
      'save validate',
    );
  }

  const prepared = prepareSaveState(decoded.payload);
  if (!prepared.ok) {
    return ok(
      {
        valid: false,
        mode: decoded.mode,
        error: prepared.message,
        scene: null,
        characterName: null,
      },
      'save validate',
    );
  }

  return ok(
    {
      valid: true,
      mode: decoded.mode,
      error: null,
      scene: prepared.state.scene,
      characterName: prepared.state.character?.name ?? null,
      ...(prepared.warnings.length > 0 ? { warnings: prepared.warnings } : {}),
    },
    'save validate',
  );
}

async function migrate(args: string[]): Promise<CommandResult> {
  if (args.length < 1) {
    return fail('Usage: tag save migrate <save-string>', 'tag save migrate <checksummed-string>', 'save migrate');
  }

  let saveString: string;
  try {
    saveString = await resolveSaveString(args[0]!);
  } catch (err) {
    return fail(
      err instanceof Error ? err.message : 'Failed to resolve save file path.',
      'Provide a path within your home or temp directory.',
      'save migrate',
    );
  }

  const decoded = validateAndDecode(saveString);
  if (!decoded.valid) {
    return fail(
      `Save validation failed: ${decoded.error}`,
      'Check the save string for corruption or truncation.',
      'save migrate',
    );
  }

  const sourceMode: DecodeMode = decoded.mode;
  if (sourceMode === 'lore') {
    return fail(
      'Lore exports are not save files and cannot be migrated with tag save migrate.',
      'Use tag export load <file.lore.md> for lore payloads.',
      'save migrate',
    );
  }

  const prepared = prepareSaveState(decoded.payload);
  if (!prepared.ok) {
    return fail(prepared.message, prepared.corrective, 'save migrate');
  }

  const migratedSaveString = encodeStateAsSaveString(prepared.state);
  return ok(
    {
      message: 'Save migrated to current SF2 format.',
      sourceMode,
      mode: 'full',
      format: 'SF2',
      saveString: migratedSaveString,
      byteLength: migratedSaveString.length,
      scene: prepared.state.scene,
      characterName: prepared.state.character?.name ?? null,
      ...(prepared.warnings.length > 0 ? { warnings: prepared.warnings } : {}),
    },
    'save migrate',
  );
}

export async function handleSave(args: string[]): Promise<CommandResult> {
  const sub = args[0];
  switch (sub) {
    case 'generate':
      return generate();
    case 'load':
      return load(args.slice(1));
    case 'validate':
      return validate(args.slice(1));
    case 'migrate':
      return migrate(args.slice(1));
    default:
      return fail(
        `Unknown save subcommand: ${sub ?? '(none)'}. Available: generate, load, validate, migrate`,
        'tag save generate',
        'save',
      );
  }
}
