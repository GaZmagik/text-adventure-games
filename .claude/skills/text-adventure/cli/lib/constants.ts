import type { StatName, BestiaryTier, Pronouns, GmState } from '../types';

export const STAT_NAMES: readonly StatName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
export const VALID_TIERS: readonly BestiaryTier[] = ['minion', 'rival', 'nemesis'];
export const VALID_PRONOUNS: readonly Pronouns[] = ['she/her', 'he/him', 'they/them'];

export const MAX_ROLL_HISTORY = 50;
export const MAX_STATE_HISTORY = 100;
export const MAX_DICE_COUNT = 1000;

/** Keys that must never be traversed or assigned — prevents prototype pollution. */
export const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** All valid top-level keys of GmState — prevents arbitrary key creation via dot-path.
 *  The `satisfies` constraint ensures compile-time parity with the GmState interface. */
const VALID_TOP_KEYS_ARRAY = [
  '_version', 'scene', 'currentRoom', 'visitedRooms', 'rollHistory',
  'character', 'worldFlags', 'seed', 'theme', 'visualStyle', 'modulesActive',
  'rosterMutations', 'codexMutations', 'time', 'factions', 'quests',
  'storyArchitect', 'shipState', 'crewMutations', 'mapState', 'systemResources',
  'navPlottedCourse', 'arc', 'arcType', 'carryForward', 'arcHistory',
  '_lastComputation', '_stateHistory',
] as const satisfies readonly (keyof GmState)[];
export const VALID_TOP_KEYS = new Set<string>(VALID_TOP_KEYS_ARRAY);

/** Commands that mutate state — used by batch to decide whether to capture a state snapshot. */
export const MUTATING_COMMANDS = new Set<string>(['state', 'save', 'compute']);
