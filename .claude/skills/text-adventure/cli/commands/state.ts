// tag CLI — State Command
// Source of truth for all game data. Subcommands: get, set, create-npc, validate, reset, history.

import type { CommandResult, GmState, BestiaryTier, Pronouns, StateHistoryEntry } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState, saveState, createDefaultState } from '../lib/state-store';
import { generateNpcFromTier } from '../data/bestiary-tiers';
import { validateState } from '../lib/validator';
import { VALID_TIERS, VALID_PRONOUNS, MAX_STATE_HISTORY, FORBIDDEN_KEYS, VALID_TOP_KEYS, TIER1_MODULES } from '../lib/constants';
import { parseArgs } from '../lib/args';
import { MODULE_DIGESTS } from '../data/module-digests';
import { XP_THRESHOLDS } from '../data/xp-tables';
import { buildFeatureChecklist } from './render';

const VALID_SUBCOMMANDS = ['get', 'set', 'create-npc', 'validate', 'reset', 'history', 'context', 'sync'] as const;

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

  // Reject writes to unknown top-level keys — prevents arbitrary state expansion.
  const topKey = parts[0]!;
  if (!VALID_TOP_KEYS.has(topKey)) {
    throw new Error(`Unknown top-level key: "${topKey}". Valid keys: ${[...VALID_TOP_KEYS].join(', ')}`);
  }

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

import { containsForbiddenKeys } from './save';

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
    state._stateHistory = state._stateHistory.slice(-(MAX_STATE_HISTORY - 1));
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

  let oldValue: unknown;
  try {
    oldValue = setByPath(state as unknown as Record<string, unknown>, path, newValue); // GmState lacks index sig
  } catch (err) {
    return fail((err as Error).message, 'Path contains a forbidden segment (__proto__, constructor, prototype).', 'state set');
  }

  // Validate state integrity after mutation — reject structurally invalid changes before persisting
  const validation = validateState(state);
  if (!validation.valid) {
    // Rollback the mutation before returning
    try {
      setByPath(state as unknown as Record<string, unknown>, path, oldValue);
    } catch {
      // Rollback failed — state is already invalid, do not save
    }
    return fail(
      `Mutation would produce invalid state: ${validation.errors.join('; ')}`,
      `Check the value being set at "${path}" conforms to the state contract.`,
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
  return ok({ message: 'State reset to defaults.' }, 'state reset');
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

// ── Sync helper functions ────────────────────────────────────────

/** Build scene/room/time diff entries from --scene, --room, --time flags. */
function buildSyncDiff(
  state: GmState,
  flags: Record<string, string>,
  warnings: string[],
): { diff: Record<string, { from: unknown; to: unknown }>; nextScene: number; parsedTime: Record<string, unknown> | null; earlyReturn: CommandResult | null } {
  const diff: Record<string, { from: unknown; to: unknown }> = {};

  // 1. Scene should increment (default +1 when --scene not provided)
  let nextScene: number;
  if (flags.scene) {
    nextScene = Number(flags.scene);
    if (!Number.isFinite(nextScene) || nextScene < 0) {
      return {
        diff, nextScene: state.scene, parsedTime: null,
        earlyReturn: fail(
          `Invalid --scene value "${flags.scene}": must be a finite non-negative number.`,
          'Provide an integer scene number, e.g. --scene 5',
          'state sync',
        ),
      };
    }
  } else {
    nextScene = state.scene + 1;
  }
  if (nextScene !== state.scene) {
    diff.scene = { from: state.scene, to: nextScene };
  }

  // 2. Room might change
  if (flags.room && flags.room !== state.currentRoom) {
    diff.currentRoom = { from: state.currentRoom, to: flags.room };
  }

  // 3. Time might advance — parse once and reuse in the apply block
  let parsedTime: Record<string, unknown> | null = null;
  if (flags.time) {
    try {
      const raw: unknown = JSON.parse(flags.time);
      if (typeof raw !== 'object' || raw === null) {
        warnings.push('--time flag must be a JSON object.');
      } else if (containsForbiddenKeys(raw)) {
        warnings.push('--time flag contains forbidden keys (__proto__, constructor, prototype).');
      } else {
        const VALID_TIME_KEYS = new Set<string>([
          'period', 'date', 'elapsed', 'hour',
          'playerKnowsDate', 'playerKnowsTime', 'calendarSystem', 'deadline',
        ]);
        const filtered: Record<string, unknown> = {};
        for (const key of Object.keys(raw as Record<string, unknown>)) {
          if (VALID_TIME_KEYS.has(key)) {
            filtered[key] = (raw as Record<string, unknown>)[key];
          } else {
            warnings.push(`--time key "${key}" is not a valid TimeState field; ignored.`);
          }
        }
        parsedTime = filtered;
        diff.time = { from: state.time, to: filtered };
      }
    } catch {
      warnings.push('--time flag contains invalid JSON.');
    }
  }

  return { diff, nextScene, parsedTime, earlyReturn: null };
}

/** Check 4: pending computation not reflected in rollHistory. */
function checkPendingComputation(state: GmState, warnings: string[]): void {
  if (state._lastComputation && state._lastComputation.type !== 'levelup_result') {
    const lastType = state._lastComputation.type;
    const lastRoll = state.rollHistory[state.rollHistory.length - 1];
    if (!lastRoll || lastRoll.type !== lastType || lastRoll.scene !== state.scene) {
      warnings.push(
        `Pending computation (${lastType}) may not be reflected in rollHistory.`,
      );
    }
  }
}

/** Check 5: missing Tier 1 modules. */
function checkMissingModules(state: GmState, activeSet: Set<string>, warnings: string[]): void {
  const missingTier1 = TIER1_MODULES.filter(m => !activeSet.has(m));
  if (missingTier1.length > 0) {
    warnings.push(
      `Missing Tier 1 modules: ${missingTier1.join(', ')}. Re-read these files.`,
    );
  }
}

/** Check 6: quest/worldFlag cross-validation (canonical format). */
function checkQuestWorldFlagSync(state: GmState, warnings: string[]): void {
  for (const quest of state.quests) {
    if (quest.objectives.length === 0) {
      warnings.push(`Quest "${quest.id}" has no objectives to validate.`);
      continue;
    }
    let allComplete = quest.objectives.length > 0;
    for (const obj of quest.objectives) {
      const canonicalKey = `quest:${quest.id}:${obj.id}:complete`;
      const flagSet = state.worldFlags[canonicalKey] === true;
      if (obj.completed && !flagSet) {
        warnings.push(
          `Quest objective "${quest.id}/${obj.id}" is complete but worldFlag `
          + `"${canonicalKey}" is not set. Use \`tag quest complete\` to sync.`,
        );
      }
      if (flagSet && !obj.completed) {
        warnings.push(
          `WorldFlag "${canonicalKey}" is set but quest objective `
          + `"${quest.id}/${obj.id}" is not marked complete.`,
        );
      }
      if (!obj.completed) allComplete = false;
    }
    const questFlag = `quest:${quest.id}:complete`;
    if (allComplete && state.worldFlags[questFlag] !== true) {
      warnings.push(
        `All objectives of quest "${quest.id}" are complete but worldFlag `
        + `"${questFlag}" is not set.`,
      );
    }
  }
}

/** Check 7: level-up eligibility. */
function checkLevelUpEligibility(state: GmState, warnings: string[]): void {
  if (state.character) {
    const { level, xp } = state.character;
    const nextThreshold = XP_THRESHOLDS.find(t => t.level === level + 1);
    if (nextThreshold && xp >= nextThreshold.xp) {
      warnings.push(
        `Level-up available! XP ${xp} >= ${nextThreshold.xp} `
        + `(level ${level + 1}). Run \`tag compute levelup\`.`,
      );
    }
  }
}

/** Check 8: NPC worldFlag references without roster entries. */
function checkNpcReferenceGaps(state: GmState, npcIds: Set<string>, warnings: string[]): void {
  const npcPattern = /^npc_([a-z0-9_]+)_/;
  for (const key of Object.keys(state.worldFlags)) {
    const match = npcPattern.exec(key);
    if (match) {
      const npcId = match[1]!;
      if (!npcIds.has(npcId) && !npcIds.has(`npc_${npcId}`)) {
        warnings.push(
          `WorldFlag "${key}" references NPC "${npcId}" `
          + 'not found in rosterMutations.',
        );
      }
    }
  }
}

// ── Sync orchestrator ────────────────────────────────────────────

async function handleSync(args: string[]): Promise<CommandResult> {
  const state = await tryLoadState();
  if (!state) return noState();

  const parsed = parseArgs(args, ['apply']);
  const apply = parsed.booleans.has('apply');
  const flags = parsed.flags;

  const warnings: string[] = [];
  const errors: string[] = [];

  // Checks 1–3: build scene/room/time diff
  const { diff, nextScene, parsedTime, earlyReturn } = buildSyncDiff(state, flags, warnings);
  if (earlyReturn) return earlyReturn;

  // Check 4: pending computation not in rollHistory
  checkPendingComputation(state, warnings);

  // Check 5: missing Tier 1 modules
  const active: string[] = state.modulesActive ?? [];
  const activeSet = new Set(active);
  checkMissingModules(state, activeSet, warnings);

  // Check 6: quest/worldFlag cross-validation
  checkQuestWorldFlagSync(state, warnings);

  // Check 7: level-up eligibility
  checkLevelUpEligibility(state, warnings);

  // Check 8: NPC reference gaps
  const npcIds = new Set<string>();
  for (const n of state.rosterMutations) npcIds.add(n.id);
  checkNpcReferenceGaps(state, npcIds, warnings);

  // Check 9: feature checklist
  const featureChecklist = buildFeatureChecklist(state);

  const status = errors.length > 0
    ? 'errors'
    : warnings.length > 0 ? 'warnings' : 'clean';

  // Apply mutations if requested and no errors
  if (apply) {
    if (errors.length > 0) {
      return fail(
        `Cannot apply sync: ${errors.join('; ')}`,
        'Fix errors before applying sync.',
        'state sync',
      );
    }
    if (diff.scene) state.scene = nextScene;
    if (diff.currentRoom && flags.room) state.currentRoom = flags.room;
    if (parsedTime) {
      Object.assign(state.time, parsedTime);
    }

    // Validate state integrity before persisting — mirror state set behaviour
    const validation = validateState(state);
    if (!validation.valid) {
      return fail(
        `Sync would produce invalid state: ${validation.errors.join('; ')}`,
        'Fix the sync flags so the resulting state is structurally valid.',
        'state sync',
      );
    }

    recordHistory(state, 'state sync', 'sync', null, diff);
    await saveState(state);
  }

  return ok({
    status,
    diff,
    warnings,
    errors,
    featureChecklist,
    applied: apply && errors.length === 0,
    rollHistoryCount: state.rollHistory.length,
    stateHistoryCount: state._stateHistory.length,
  }, 'state sync');
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
    case 'sync':
      return handleSync(args.slice(1));
    default:
      return fail(
        `Unknown subcommand: "${subcommand}".`,
        `Valid subcommands: ${VALID_SUBCOMMANDS.join(', ')}`,
        'state',
      );
  }
}
