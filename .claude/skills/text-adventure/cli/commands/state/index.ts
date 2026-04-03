// tag CLI — State Command
// Source of truth for all game data. Subcommands: get, set, create-npc, validate, reset, history.

import type { CommandResult, GmState, BestiaryTier, Pronouns, StateHistoryEntry } from '../../types';
import { ok, fail, noState } from '../../lib/errors';
import { tryLoadState, saveState, createDefaultState } from '../../lib/state-store';
import { generateNpcFromTier } from '../../data/bestiary-tiers';
import { validateState } from '../../lib/validator';
import { VALID_TIERS, VALID_PRONOUNS, MAX_STATE_HISTORY, FORBIDDEN_KEYS, TIER1_MODULES } from '../../lib/constants';
import { parseArgs } from '../../lib/args';
import { MODULE_DIGESTS } from '../../data/module-digests';
import { containsForbiddenKeys } from '../../lib/security';
import { validateStatePath, describeStateShape } from '../../lib/state-schema';
import { clearWorkflowMarkers } from '../../lib/workflow-markers';

const VALID_SUBCOMMANDS = ['get', 'set', 'create-npc', 'validate', 'reset', 'history', 'context', 'sync', 'schema', 'codex', 'crew', 'ship'] as const;

function isBestiaryTier(s: string): s is BestiaryTier {
  return (VALID_TIERS as readonly string[]).includes(s);
}

function isPronouns(s: string): s is Pronouns {
  return (VALID_PRONOUNS as readonly string[]).includes(s);
}

/**
 * Navigate a state object by dot-separated path.
 * Returns { found: true, value } or { found: false }.
 */
const MAX_PATH_DEPTH = 10;

function getByPath(obj: unknown, path: string): { found: boolean; value: unknown } {
  if (!path || path.length === 0) {
    return { found: true, value: obj };
  }

  const parts = path.split('.');
  if (parts.length > MAX_PATH_DEPTH) {
    return { found: false, value: undefined };
  }
  let current: unknown = obj;

  for (const part of parts) {
    if (FORBIDDEN_KEYS.has(part)) {
      return { found: false, value: undefined };
    }
    if (current === null || current === undefined || typeof current !== 'object') {
      return { found: false, value: undefined };
    }
    const rec = current as Record<string, unknown>;
    if (!(part in rec)) {
      return { found: false, value: undefined };
    }
    current = rec[part];
  }

  return { found: true, value: current };
}

/**
 * Set a value in a state object by dot-separated path.
 * Creates intermediate objects if they do not exist.
 * Returns the old value at that path.
 */
function setByPath(obj: Record<string, unknown>, path: string, value: unknown): unknown {
  const parts = path.split('.');

  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    if (FORBIDDEN_KEYS.has(part)) {
      throw new Error(`Forbidden path segment: "${part}"`);
    }
    if (typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  const lastKey = parts[parts.length - 1]!;
  if (FORBIDDEN_KEYS.has(lastKey)) {
    throw new Error(`Forbidden path segment: "${lastKey}"`);
  }
  const oldValue = current[lastKey];
  current[lastKey] = value;
  return oldValue;
}

export const __stateTestInternals = {
  setByPath,
};

/** Coerce a string value to the appropriate JS type.
 *  Note: numeric strings like "42" are coerced to numbers. To store a string
 *  that looks like a number, wrap it in a JSON object: '{"value":"42"}'. */
function coerceValue(raw: string): unknown {
  raw = raw.trim();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null') return null;
  const num = Number(raw);
  if (!Number.isNaN(num) && Number.isFinite(num) && raw.length > 0 && !/^0x/i.test(raw)) return num;
  // Attempt JSON parse for objects and arrays
  if (raw.startsWith('{') || raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (containsForbiddenKeys(parsed)) return raw; // Reject prototype-polluting objects
      return parsed;
    } catch {
      // Not valid JSON — fall through to string
    }
  }
  return raw;
}

/** Record a mutation in the state history. */
export function recordHistory(
  state: GmState,
  command: string,
  path: string,
  oldValue: unknown,
  newValue: unknown,
): void {
  const entry: StateHistoryEntry = {
    timestamp: new Date().toISOString(),
    command,
    path,
    oldValue,
    newValue,
  };
  if (state._stateHistory.length >= MAX_STATE_HISTORY) {
    state._stateHistory.shift();
  }
  state._stateHistory.push(entry);
}

/** Suggest similar top-level keys for corrective messages. */
function suggestKeys(state: GmState, attempted: string): string {
  const keys = Object.keys(state);
  const close = keys.filter(k => k.toLowerCase().startsWith(attempted.slice(0, 3).toLowerCase()));
  if (close.length > 0) {
    return `Did you mean: ${close.join(', ')}? Available top-level keys: ${keys.join(', ')}`;
  }
  return `Available top-level keys: ${keys.join(', ')}`;
}

// ── Subcommand handlers ──────────────────────────────────────────

async function handleGet(args: string[]): Promise<CommandResult> {
  const state = await tryLoadState();
  if (!state) return noState();

  const path = args[0] ?? '';
  const result = getByPath(state, path);

  if (!result.found) {
    return fail(
      `Path "${path}" not found in state.`,
      suggestKeys(state, path.split('.')[0]!),
      'state get',
    );
  }

  return ok(result.value, 'state get');
}

async function handleSet(args: string[]): Promise<CommandResult> {
  const state = await tryLoadState();
  if (!state) return noState();
  const path = args[0];

  if (!path) {
    return fail('No path provided.', 'Usage: tag state set <dot.path> <value>', 'state set');
  }

  const pathValidation = validateStatePath(path);
  if (!pathValidation.valid) {
    return fail(
      pathValidation.error ?? `Path "${path}" is not allowed.`,
      'Use only allowlisted state paths from the documented schema.',
      'state set',
    );
  }

  // Detect += and -= operators
  const operator = args[1];
  let newValue: unknown;
  let rawValue: string;

  if (operator === '+=' || operator === '-=') {
    rawValue = args[2]!;
    if (!rawValue) {
      return fail(`No value provided for ${operator} operation.`, `Usage: tag state set ${path} ${operator} <number>`, 'state set');
    }
    const delta = Number(rawValue);
    if (Number.isNaN(delta)) {
      return fail(`Cannot ${operator} with non-numeric value "${rawValue}".`, 'Provide a numeric value.', 'state set');
    }
    const current = getByPath(state, path);
    if (!current.found || typeof current.value !== 'number') {
      return fail(`Path "${path}" is not a number; cannot apply ${operator}.`, 'Ensure the target path holds a numeric value.', 'state set');
    }
    newValue = operator === '+=' ? current.value + delta : current.value - delta;
  } else {
    rawValue = args[1]!;
    if (rawValue === undefined) {
      return fail('No value provided.', `Usage: tag state set ${path} <value>`, 'state set');
    }
    newValue = coerceValue(rawValue);
  }

  const oldValue = setByPath(state as Record<string, unknown>, path, newValue); // GmState lacks index sig

  // Validate state integrity after mutation — reject structurally invalid changes before persisting
  const validation = validateState(state);
  if (!validation.valid) {
    // Rollback the mutation before returning
    try {
      setByPath(state as Record<string, unknown>, path, oldValue);
    } catch {
      // Rollback failed — state is already invalid, do not save
    }
    return fail(
      `Mutation would produce invalid state: ${validation.errors.join('; ')}`,
      `Run \`tag state schema ${path}\` to see the expected fields.`,
      'state set',
    );
  }

  recordHistory(state, 'state set', path, oldValue, newValue);
  await saveState(state);

  return ok({ path, oldValue, newValue }, 'state set');
}

async function handleCreateNpc(args: string[]): Promise<CommandResult> {
  const npcId = args[0];
  if (!npcId) {
    return fail('No NPC id provided.', 'Usage: tag state create-npc <id> --name <n> --tier <tier> --pronouns <p> --role <r>', 'state create-npc');
  }

  const flags = parseArgs(args.slice(1), [], ['name', 'pronouns', 'tier', 'role']).flags;

  // Validate required flags
  if (!flags.name) {
    return fail(
      'Missing --name flag.',
      "Usage: tag state create-npc <id> --name 'Maren Dray' --tier <tier> --pronouns <p>. Names with spaces must be quoted.",
      'state create-npc',
    );
  }

  if (!flags.tier) {
    return fail(
      'Missing --tier flag.',
      `Usage: tag state create-npc <id> --tier <tier>. Valid tiers: ${VALID_TIERS.join(', ')}`,
      'state create-npc',
    );
  }

  if (!isBestiaryTier(flags.tier)) {
    return fail(
      `Invalid tier "${flags.tier}".`,
      `Valid tiers: ${VALID_TIERS.join(', ')}. Example: --tier rival`,
      'state create-npc',
    );
  }

  if (!flags.pronouns) {
    return fail(
      'Missing --pronouns flag. NPC pronouns are mandatory.',
      `Usage: tag state create-npc <id> --pronouns <p>. Valid pronouns: ${VALID_PRONOUNS.join(', ')}`,
      'state create-npc',
    );
  }

  if (!isPronouns(flags.pronouns)) {
    return fail(
      `Invalid pronouns "${flags.pronouns}".`,
      `Valid pronouns: ${VALID_PRONOUNS.join(', ')}. Example: --pronouns she/her`,
      'state create-npc',
    );
  }

  const role = flags.role ?? 'unspecified';

  const state = await tryLoadState();
  if (!state) return noState();

  // Check for duplicate id
  if (state.rosterMutations.some(n => n.id === npcId)) {
    return fail(`NPC "${npcId}" already exists in the roster.`, `Use a different id or modify the existing NPC with: tag state set rosterMutations.<field>`, 'state create-npc');
  }

  const npc = generateNpcFromTier(
    flags.tier,
    npcId,
    flags.name,
    flags.pronouns,
    role,
  );

  state.rosterMutations.push(npc);
  recordHistory(state, 'state create-npc', `rosterMutations.${npcId}`, null, npc);
  await saveState(state);

  return ok(npc, 'state create-npc');
}

async function handleValidate(): Promise<CommandResult> {
  const state = await tryLoadState();
  if (!state) return noState();
  const result = validateState(state);

  return ok(result, 'state validate');
}

async function handleReset(): Promise<CommandResult> {
  const state = createDefaultState();
  await saveState(state);
  clearWorkflowMarkers({ includePreGameVerify: true });
  return ok({
    message: 'State reset to defaults.',
    hint: 'Run `tag state schema <path>` to see expected field shapes (e.g. `tag state schema character`, `tag state schema quests.0`).',
  }, 'state reset');
}

function handleSchema(args: string[]): CommandResult {
  const path = args[0] ?? '';
  const shape = describeStateShape(path);
  return ok({ path: path || '(root)', shape }, 'state schema');
}

async function handleContext(): Promise<CommandResult> {
  const state = await tryLoadState();
  if (!state) return noState();

  const active: string[] = state.modulesActive ?? [];
  const required = active.map(m => `modules/${m}.md`);

  const tier1 = TIER1_MODULES.slice();
  const activeSet = new Set(active);
  const missingTier1 = tier1.filter(m => !activeSet.has(m));
  const missingHint = missingTier1.length > 0
    ? `Missing tier 1 modules: ${missingTier1.join(', ')}. These should be loaded before first widget render.`
    : '';

  const moduleDigests: Record<string, string> = {};
  for (const m of active) {
    if (MODULE_DIGESTS[m]) {
      moduleDigests[m] = MODULE_DIGESTS[m];
    }
  }

  return ok({
    required,
    tier1: [...tier1],
    missingHint,
    moduleDigests,
    totalModules: active.length,
    modulesActive: active,
  }, 'state context');
}

async function handleHistory(args: string[]): Promise<CommandResult> {
  const state = await tryLoadState();
  if (!state) return noState();
  const flags = parseArgs(args).flags;
  const limit = Math.max(1, Math.min(Number(flags.limit) || 10, MAX_STATE_HISTORY));

  const history = state._stateHistory;
  const recent = history.slice(-limit);

  return ok(recent, 'state history');
}

// ── Main handler ─────────────────────────────────────────────────

export async function handleState(args: string[]): Promise<CommandResult> {
  const subcommand = args[0];

  if (!subcommand) {
    return fail(
      'No subcommand provided.',
      `Valid subcommands: ${VALID_SUBCOMMANDS.join(', ')}. Run: tag state --help`,
      'state',
    );
  }

  switch (subcommand) {
    case 'get':
      return handleGet(args.slice(1));
    case 'set':
      return handleSet(args.slice(1));
    case 'create-npc':
      return handleCreateNpc(args.slice(1));
    case 'validate':
      return handleValidate();
    case 'reset':
      return handleReset();
    case 'history':
      return handleHistory(args.slice(1));
    case 'context':
      return handleContext();
    case 'schema':
      return handleSchema(args.slice(1));
    case 'sync': {
      const { handleSync } = await import('./sync');
      return handleSync(args.slice(1));
    }
    case 'codex': {
      const { handleCodex } = await import('./codex');
      return handleCodex(args.slice(1));
    }
    case 'crew': {
      const { handleCrew } = await import('./crew');
      return handleCrew(args.slice(1));
    }
    case 'ship': {
      const { handleShip } = await import('./ship');
      return handleShip(args.slice(1));
    }
    default:
      return fail(
        `Unknown subcommand: "${subcommand}".`,
        `Valid subcommands: ${VALID_SUBCOMMANDS.join(', ')}`,
        'state',
      );
  }
}
