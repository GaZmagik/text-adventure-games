// tag CLI — State Command
// Source of truth for all game data. Subcommands: get, set, create-npc, validate, reset, history.

import type { CommandResult, GmState, BestiaryTier, Pronouns, StateHistoryEntry } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState, saveState, createDefaultState } from '../lib/state-store';
import { generateNpcFromTier } from '../data/bestiary-tiers';
import { validateState } from '../lib/validator';
import { VALID_TIERS, VALID_PRONOUNS, MAX_STATE_HISTORY, FORBIDDEN_KEYS, VALID_TOP_KEYS } from '../lib/constants';
import { parseArgs } from '../lib/args';

const VALID_SUBCOMMANDS = ['get', 'set', 'create-npc', 'validate', 'reset', 'history'];

/**
 * Navigate a state object by dot-separated path.
 * Returns { found: true, value } or { found: false }.
 */
function getByPath(obj: unknown, path: string): { found: boolean; value: unknown } {
  if (!path || path.length === 0) {
    return { found: true, value: obj };
  }

  const parts = path.split('.');
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

  // Reject writes to unknown top-level keys — prevents arbitrary state expansion.
  const topKey = parts[0];
  if (!VALID_TOP_KEYS.has(topKey)) {
    throw new Error(`Unknown top-level key: "${topKey}". Valid keys: ${[...VALID_TOP_KEYS].join(', ')}`);
  }

  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (FORBIDDEN_KEYS.has(part)) {
      throw new Error(`Forbidden path segment: "${part}"`);
    }
    if (typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  const lastKey = parts[parts.length - 1];
  if (FORBIDDEN_KEYS.has(lastKey)) {
    throw new Error(`Forbidden path segment: "${lastKey}"`);
  }
  const oldValue = current[lastKey];
  current[lastKey] = value;
  return oldValue;
}

/** Recursively check for forbidden keys in a parsed JSON value. */
function containsForbiddenKeys(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key)) return true;
    if (containsForbiddenKeys((obj as Record<string, unknown>)[key])) return true;
  }
  return false;
}

/** Coerce a string value to the appropriate JS type.
 *  Note: numeric strings like "42" are coerced to numbers. To store a string
 *  that looks like a number, wrap it in a JSON object: '{"value":"42"}'. */
function coerceValue(raw: string): unknown {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null') return null;
  const num = Number(raw);
  if (!Number.isNaN(num) && Number.isFinite(num) && raw.trim().length > 0 && !/^0x/i.test(raw.trim())) return num;
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
function recordHistory(
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
  state._stateHistory.push(entry);
  if (state._stateHistory.length > MAX_STATE_HISTORY) {
    state._stateHistory = state._stateHistory.slice(-MAX_STATE_HISTORY);
  }
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
      suggestKeys(state, path.split('.')[0]),
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

  // Detect += and -= operators
  const operator = args[1];
  let newValue: unknown;
  let rawValue: string;

  if (operator === '+=' || operator === '-=') {
    rawValue = args[2];
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
    rawValue = args[1];
    if (rawValue === undefined) {
      return fail('No value provided.', `Usage: tag state set ${path} <value>`, 'state set');
    }
    newValue = coerceValue(rawValue);
  }

  let oldValue: unknown;
  try {
    oldValue = setByPath(state as unknown as Record<string, unknown>, path, newValue); // GmState lacks index sig
  } catch (err) {
    return fail((err as Error).message, 'Path contains a forbidden segment (__proto__, constructor, prototype).', 'state set');
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

  const flags = parseArgs(args.slice(1)).flags;

  // Validate required flags
  if (!flags.name) {
    return fail('Missing --name flag.', 'tag state create-npc requires --name <name>.', 'state create-npc');
  }

  if (!flags.tier) {
    return fail('Missing --tier flag.', 'tag state create-npc requires --tier <minion|rival|nemesis>.', 'state create-npc');
  }

  if (!VALID_TIERS.includes(flags.tier as BestiaryTier)) {
    return fail(`Invalid tier "${flags.tier}".`, `Valid tiers: ${VALID_TIERS.join(', ')}`, 'state create-npc');
  }

  if (!flags.pronouns) {
    return fail('Missing --pronouns flag. NPC pronouns are mandatory.', 'tag state create-npc requires --pronouns <she/her|he/him|they/them>.', 'state create-npc');
  }

  if (!VALID_PRONOUNS.includes(flags.pronouns as Pronouns)) {
    return fail(`Invalid pronouns "${flags.pronouns}".`, `Valid pronouns: ${VALID_PRONOUNS.join(', ')}`, 'state create-npc');
  }

  const role = flags.role ?? 'unspecified';

  const state = await tryLoadState();
  if (!state) return noState();

  // Check for duplicate id
  if (state.rosterMutations.some(n => n.id === npcId)) {
    return fail(`NPC "${npcId}" already exists in the roster.`, `Use a different id or modify the existing NPC with: tag state set rosterMutations.<field>`, 'state create-npc');
  }

  const npc = generateNpcFromTier(
    flags.tier as BestiaryTier,
    npcId,
    flags.name,
    flags.pronouns as Pronouns,
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
  return ok({ message: 'State reset to defaults.' }, 'state reset');
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
    default:
      return fail(
        `Unknown subcommand: "${subcommand}".`,
        `Valid subcommands: ${VALID_SUBCOMMANDS.join(', ')}`,
        'state',
      );
  }
}
