import type { StatName, BestiaryTier, Pronouns, GmState } from '../types';

export const STAT_NAMES: readonly StatName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
export const VALID_TIERS: readonly BestiaryTier[] = ['minion', 'rival', 'nemesis'];
export const VALID_PRONOUNS: readonly Pronouns[] = ['she/her', 'he/him', 'they/them'];

export const MAX_ROLL_HISTORY = 50;
export const MAX_STATE_HISTORY = 100;
export const MAX_DICE_COUNT = 1000;

/** Maximum file size in bytes (10 MB) — shared guard for state and save file reads. */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

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
  '_lastComputation', '_stateHistory', '_schemaVersion',
] as const satisfies readonly (keyof GmState)[];
export const VALID_TOP_KEYS = new Set<string>(VALID_TOP_KEYS_ARRAY);

/** Commands that mutate state — used by batch to decide whether to capture a state snapshot. */
export const MUTATING_COMMANDS = new Set<string>(['state', 'save', 'compute', 'quest', 'export']);

/** Canonical list of renderable widget types — mirrors the TEMPLATES registry in commands/render.ts.
 *  Duplicated here so that help.ts can list widget types without importing the entire render pipeline. */
export const WIDGET_TYPE_NAMES = [
  'scene', 'ticker', 'character', 'dice', 'ship', 'crew', 'codex', 'map',
  'starchart', 'footer', 'save-div', 'levelup', 'recap', 'combat-turn',
  'dialogue', 'settings', 'scenario-select', 'character-creation',
] as const;

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
