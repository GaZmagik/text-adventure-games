import type { StatName, BestiaryTier, Pronouns, GmState } from '../types';
export { MUTATING_COMMANDS, WIDGET_TYPE_NAMES } from '../metadata';

export const STAT_NAMES: readonly StatName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
export const VALID_TIERS: readonly BestiaryTier[] = ['minion', 'rival', 'nemesis'];
export const VALID_PRONOUNS: readonly Pronouns[] = ['she/her', 'he/him', 'they/them', 'it/its'];

export const VALID_CODEX_STATES = ['locked', 'partial', 'discovered', 'redacted'] as const;
export const VALID_CREW_STATUSES = ['active', 'injured', 'incapacitated', 'missing', 'defected', 'dead'] as const;
export const DEFAULT_SHIP_SYSTEMS = ['hull', 'engines', 'power_core', 'life_support', 'weapons', 'sensors', 'shields'] as const;

export const MAX_ROLL_HISTORY = 50;
export const MAX_STATE_HISTORY = 100;
export const MAX_DICE_COUNT = 1000;

/** Maximum file size in bytes (10 MB) — shared guard for state and save file reads. */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Keys that must never be traversed or assigned — prevents prototype pollution. */
export const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** All valid top-level keys of GmState — prevents arbitrary key creation via dot-path.
 *  The `satisfies` constraint verifies exhaustiveness: a compile error here means a
 *  GmState key was added without updating this array. */
const VALID_TOP_KEYS_ARRAY = [
  '_version', 'scene', 'currentRoom', 'visitedRooms', 'rollHistory',
  'character', 'worldFlags', 'openingLens', 'prologueVariant', 'prologueComplete', 'characterOrigin',
  'seed', 'theme', 'visualStyle', 'modulesActive',
  'rosterMutations', 'codexMutations', 'time', 'factions', 'quests',
  'storyArchitect', 'shipState', 'crewMutations', 'mapState', 'systemResources',
  'navPlottedCourse', 'arc', 'arcType', 'carryForward', 'arcHistory',
  '_lastComputation', '_stateHistory', '_schemaVersion', '_compactionCount', '_pendingRolls', '_turnCount',
  '_modulesRead', '_proseCraftEpoch', '_styleReadEpoch', '_levelupPending',
  'authoredBody', 'outputStyle', 'pacingProfile', 'authoredSourceId', '_authoredLoreReads',
] as const satisfies readonly (keyof Required<GmState>)[];
// Exhaustiveness check: ensures every key of GmState is present in the array above.
// If this line errors, add the missing key(s) to VALID_TOP_KEYS_ARRAY.
type _AssertExhaustive = keyof GmState extends (typeof VALID_TOP_KEYS_ARRAY)[number] ? true : never;
const _exhaustiveCheck: _AssertExhaustive = true; void _exhaustiveCheck;
export const VALID_TOP_KEYS = new Set<string>(VALID_TOP_KEYS_ARRAY);

export const SCHEMA_VERSION = '1.3.0' as const;

/** All known module filenames (without .md extension), matching modulesActive format. */
export const KNOWN_MODULES = [
  'adventure-authoring', 'adventure-exporting', 'ai-npc', 'arc-patterns', 'atmosphere', 'audio',
  'bestiary', 'character-creation', 'core-systems', 'crew-manifest', 'die-rolls',
  'genre-mechanics', 'geo-map', 'gm-checklist', 'lore-codex', 'procedural-world-gen',
  'prose-craft', 'rpg-systems', 'save-codex', 'scenarios', 'ship-systems',
  'star-chart', 'story-architect', 'world-history',
] as const;

/** Tier 1 modules — always load before first widget render. */
export const TIER1_MODULES = [
  'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
  'character-creation', 'save-codex',
] as const;
