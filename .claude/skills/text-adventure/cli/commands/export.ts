import type { CommandResult, GmState } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState, saveState, createDefaultState } from '../lib/state-store';
import { attachChecksum, validateAndDecode } from '../lib/fnv32';
import { VALID_TOP_KEYS } from '../lib/constants';
import { containsForbiddenKeys } from '../lib/security';
import { validateState } from '../lib/validator';
import {
  extractMechanicalData,
  encodeLorePayload,
  buildLoreMarkdown,
  extractLorePayload,
  extractFrontmatterField,
} from '../lib/lore-serialiser';
import { readSafeTextFile, resolveSafeReadPath } from '../lib/path-security';
import { stripUnknownStateKeys } from '../lib/state-schema';

// ── Read and extract payload from .lore.md file ──────────────────────

async function readLoreFile(filePath: string): Promise<{
  content: string;
  payloadString: string;
  editedFlag: string | null;
}> {
  const content = await readSafeTextFile(filePath, 'Lore');
  const payloadString = extractLorePayload(content);
  if (!payloadString) {
    throw new Error('No LORE payload found in file.');
  }
  const editedFlag = extractFrontmatterField(content, 'edited');
  return { content, payloadString, editedFlag };
}

// ── Decode payload into GmState ──────────────────────────────────────

function decodeAndBuildState(payloadString: string): {
  state: GmState;
  warnings: string[];
} {
  const decoded = validateAndDecode(payloadString);
  if (!decoded.valid) {
    throw new Error(`Lore payload validation failed: ${decoded.error}`);
  }

  const payload = decoded.payload;

  // Filter payload keys against VALID_TOP_KEYS
  const filtered: Record<string, unknown> = {};
  for (const key of Object.keys(payload)) {
    if (VALID_TOP_KEYS.has(key)) {
      const value = (payload as Record<string, unknown>)[key];
      if (!containsForbiddenKeys(value)) {
        filtered[key] = value;
      }
    }
  }

  // Merge onto defaults
  const { _lastComputation: _, ...defaults } = createDefaultState();
  let state: Record<string, unknown> = {
    ...defaults,
    ...filtered,
  };

  // Reset session fields
  state.scene = 0;
  state.visitedRooms = [];
  state.rollHistory = [];
  state.character = null;
  state._stateHistory = [];

  const { sanitized, strippedPaths } = stripUnknownStateKeys(state);
  state = sanitized as Record<string, unknown>;
  const strippedWarnings = strippedPaths.map(path =>
    `Stripped unexpected state key "${path}" while loading lore data.`);

  // Validate
  const validation = validateState(state);
  if (!validation.valid) {
    throw new Error(`Lore state is structurally invalid: ${validation.errors.join('; ')}`);
  }

  // Cast is safe here — validateState has confirmed structural validity
  const validState = state as unknown as GmState;
  return { state: validState, warnings: [...strippedWarnings, ...validation.warnings] };
}

// ── generate ─────────────────────────────────────────────────────────

async function generate(): Promise<CommandResult> {
  const state = await tryLoadState();
  if (!state) return noState('export generate');

  const cloned = structuredClone(state);
  const mechData = extractMechanicalData(cloned);
  const loreCode = encodeLorePayload(mechData);
  const checksummed = attachChecksum(loreCode);
  const markdown = buildLoreMarkdown(cloned);
  const loreContent = markdown + '\n\n<!-- LORE:' + checksummed + ' -->\n';

  const title = extractFrontmatterField(loreContent, 'title') ?? 'Untitled';

  return ok({
    loreContent,
    title,
    npcCount: state.rosterMutations.length,
    factionCount: Object.keys(state.factions).length,
    questCount: state.quests.length,
    characterName: state.character?.name ?? null,
    scene: state.scene,
  }, 'export generate');
}

// ── load ─────────────────────────────────────────────────────────────

async function load(args: string[]): Promise<CommandResult> {
  if (args.length < 1) {
    return fail(
      'Usage: tag export load <file.lore.md>',
      'tag export load /path/to/adventure.lore.md',
      'export load',
    );
  }

  let filePath: string;
  try {
    const resolved = resolveSafeReadPath(args[0]!, {
      kind: 'Lore',
      extensions: ['.md'],
    });
    if (!resolved) {
      throw new Error('Lore file path must look like a readable file path.');
    }
    filePath = resolved;
  } catch (err) {
    return fail(
      err instanceof Error ? err.message : 'Failed to resolve lore file path.',
      'Provide a path within your home or temp directory.',
      'export load',
    );
  }

  let payloadString: string;
  let editedFlag: string | null = null;
  try {
    const loreFile = await readLoreFile(filePath);
    payloadString = loreFile.payloadString;
    editedFlag = loreFile.editedFlag;
  } catch (err) {
    return fail(
      err instanceof Error ? err.message : 'Failed to read lore file.',
      'Check the file exists and contains a valid LORE payload.',
      'export load',
    );
  }

  let state: GmState;
  let warnings: string[];
  try {
    const result = decodeAndBuildState(payloadString);
    state = result.state;
    warnings = result.warnings;
  } catch (err) {
    return fail(
      err instanceof Error ? err.message : 'Failed to decode lore payload.',
      'Check the lore file for corruption.',
      'export load',
    );
  }

  await saveState(state);

  return ok({
    message: 'Lore file loaded successfully.',
    npcCount: state.rosterMutations.length,
    factionCount: Object.keys(state.factions).length,
    edited: editedFlag === 'true',
    ...(warnings.length > 0 ? { warnings } : {}),
  }, 'export load');
}

// ── validate ─────────────────────────────────────────────────────────

async function validate(args: string[]): Promise<CommandResult> {
  if (args.length < 1) {
    return fail(
      'Usage: tag export validate <file.lore.md>',
      'tag export validate /path/to/adventure.lore.md',
      'export validate',
    );
  }

  let filePath: string;
  try {
    const resolved = resolveSafeReadPath(args[0]!, {
      kind: 'Lore',
      extensions: ['.md'],
    });
    if (!resolved) {
      throw new Error('Lore file path must look like a readable file path.');
    }
    filePath = resolved;
  } catch (err) {
    return fail(
      err instanceof Error ? err.message : 'Failed to resolve lore file path.',
      'Provide a path within your home or temp directory.',
      'export validate',
    );
  }

  let payloadString: string;
  let editedFlag: string | null = null;
  try {
    const loreFile = await readLoreFile(filePath);
    payloadString = loreFile.payloadString;
    editedFlag = loreFile.editedFlag;
  } catch (err) {
    return ok({
      valid: false,
      npcCount: 0,
      factionCount: 0,
      edited: false,
      errors: [err instanceof Error ? err.message : 'Failed to read lore file.'],
    }, 'export validate');
  }

  try {
    const { state, warnings } = decodeAndBuildState(payloadString);
    return ok({
      valid: true,
      npcCount: state.rosterMutations.length,
      factionCount: Object.keys(state.factions).length,
      edited: editedFlag === 'true',
      errors: [],
      ...(warnings.length > 0 ? { warnings } : {}),
    }, 'export validate');
  } catch (err) {
    return ok({
      valid: false,
      npcCount: 0,
      factionCount: 0,
      edited: editedFlag === 'true',
      errors: [err instanceof Error ? err.message : 'Decode failed.'],
    }, 'export validate');
  }
}

// ── Dispatch ─────────────────────────────────────────────────────────

export async function handleExport(args: string[]): Promise<CommandResult> {
  const sub = args[0];
  switch (sub) {
    case 'generate': return generate();
    case 'load': return load(args.slice(1));
    case 'validate': return validate(args.slice(1));
    default:
      return fail(
        `Unknown export subcommand: ${sub ?? '(none)'}. Available: generate, load, validate`,
        'tag export generate',
        'export',
      );
  }
}
