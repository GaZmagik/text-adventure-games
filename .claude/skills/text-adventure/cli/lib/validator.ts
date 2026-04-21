// tag CLI — State Validator
// Validates gmState structure against the contract in types.ts

import { STAT_NAMES, VALID_TIERS, VALID_PRONOUNS, KNOWN_MODULES } from './constants';
import type { RollType, StatName } from '../types';
import { collectUnexpectedStatePaths } from './state-schema';

const VALID_ROLL_TYPES_ARRAY: readonly string[] = [
  'contested_roll', 'hazard_save', 'encounter_roll', 'levelup_result',
] satisfies readonly RollType[];

const VALID_ROLL_TYPES = new Set(VALID_ROLL_TYPES_ARRAY);
const STAT_NAME_SET = new Set<string>(STAT_NAMES);
const VALID_PRONOUN_SET = new Set<string>(VALID_PRONOUNS);
const VALID_TIER_SET = new Set<string>(VALID_TIERS);
const KNOWN_MODULE_SET = new Set<string>(KNOWN_MODULES);

/** Result of a state validation check. */
type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

/**
 * Validate a game state object against the gmState contract.
 *
 * Checks:
 * - _version is a number
 * - character is null or has required fields (name, stats with all 6 attrs, hp, maxHp, level)
 * - rosterMutations is an array where each entry has: id, name, pronouns, tier, stats
 * - factions values are all numbers between -100 and +100
 * - time has required fields (period, date, elapsed, hour)
 */
export function validateState(state: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (state === null || state === undefined || typeof state !== 'object') {
    errors.push('State must be a non-null object.');
    return { valid: false, errors, warnings };
  }

  const s = state as Record<string, unknown>;
  const unexpectedPaths = collectUnexpectedStatePaths(s);
  for (const path of unexpectedPaths) {
    errors.push(`Unexpected state key "${path}".`);
  }

  // _version
  if (typeof s._version !== 'number') {
    errors.push('_version must be a number.');
  }

  // character
  if (s.character !== null && s.character !== undefined) {
    validateCharacter(s.character, errors, warnings);
  }

  // rosterMutations
  if (s.rosterMutations !== undefined) {
    if (!Array.isArray(s.rosterMutations)) {
      errors.push('rosterMutations must be an array.');
    } else {
      const seenNpcIds = new Set<string>();
      for (let i = 0; i < s.rosterMutations.length; i++) {
        validateNpc(s.rosterMutations[i], i, errors, warnings);
        const npc = s.rosterMutations[i] as Record<string, unknown> | null;
        if (npc && typeof npc === 'object' && typeof npc.id === 'string' && npc.id.length > 0) {
          if (seenNpcIds.has(npc.id)) {
            errors.push(`Duplicate NPC id "${npc.id}" at rosterMutations[${i}].`);
          }
          seenNpcIds.add(npc.id);
        }
      }
    }
  }

  // factions
  if (s.factions !== undefined && s.factions !== null) {
    if (typeof s.factions !== 'object') {
      errors.push('factions must be an object.');
    } else {
      const factions = s.factions as Record<string, unknown>;
      for (const [key, value] of Object.entries(factions)) {
        if (typeof value !== 'number') {
          errors.push(`faction "${key}" value must be a number, got ${typeof value}.`);
        } else if (value < -100 || value > 100) {
          errors.push(`faction "${key}" value ${value} is outside the valid range (-100 to +100).`);
        }
      }
    }
  }

  // time
  if (s.time !== undefined && s.time !== null) {
    validateTime(s.time, errors);
  }

  // scene — should be a non-negative number
  if (s.scene !== undefined) {
    if (typeof s.scene !== 'number' || s.scene < 0) {
      warnings.push('scene should be a non-negative number.');
    }
  }

  // currentRoom — should be a string
  if (s.currentRoom !== undefined && typeof s.currentRoom !== 'string') {
    warnings.push('currentRoom should be a string.');
  }

  // rollHistory — should be an array with valid entries
  if (s.rollHistory !== undefined && !Array.isArray(s.rollHistory)) {
    warnings.push('rollHistory should be an array.');
  } else if (Array.isArray(s.rollHistory)) {
    for (let i = 0; i < s.rollHistory.length; i++) {
      const entry = s.rollHistory[i] as Record<string, unknown> | undefined;
      if (!entry || typeof entry !== 'object') continue;
      if (typeof entry.type === 'string' && !VALID_ROLL_TYPES.has(entry.type)) {
        warnings.push(`rollHistory[${i}].type "${entry.type}" is not a recognised RollType.`);
      }
      if (entry.stat !== undefined && typeof entry.stat === 'string'
          && !STAT_NAME_SET.has(entry.stat)) {
        warnings.push(`rollHistory[${i}].stat "${entry.stat}" is not a recognised StatName.`);
      }
    }
  }

  // quests — must be an array; validate each entry
  if (s.quests !== undefined) {
    if (!Array.isArray(s.quests)) {
      errors.push('quests must be an array.');
    } else {
      for (let i = 0; i < s.quests.length; i++) {
        validateQuest(s.quests[i], i, errors, warnings);
      }
    }
  }

  // modulesActive — warn on unknown module names
  if (Array.isArray(s.modulesActive)) {
    for (const mod of s.modulesActive as unknown[]) {
      if (typeof mod === 'string' && !KNOWN_MODULE_SET.has(mod)) {
        warnings.push(`modulesActive contains unknown module "${mod}".`);
      }
    }
  }

  // seed — should be a string
  if (s.seed !== undefined && typeof s.seed !== 'string') {
    warnings.push('seed should be a string.');
  }

  return { valid: errors.length === 0, errors, warnings };
}

function validateCharacter(char: unknown, errors: string[], warnings: string[]): void {
  if (typeof char !== 'object' || char === null) {
    errors.push('character must be an object.');
    return;
  }

  const c = char as Record<string, unknown>;

  if (typeof c.name !== 'string' || c.name.length === 0) {
    errors.push('character.name must be a non-empty string.');
  }

  if (typeof c.class !== 'string' || c.class.length === 0) {
    errors.push('character.class must be a non-empty string.');
  }

  if (typeof c.hp !== 'number') {
    errors.push('character.hp must be a number.');
  } else if (c.hp < 0) {
    errors.push('character.hp must not be < 0.');
  }

  if (typeof c.maxHp !== 'number') {
    errors.push('character.maxHp must be a number.');
  } else if (c.maxHp <= 0) {
    errors.push('character.maxHp must not be <= 0.');
  }

  if (typeof c.hp === 'number' && typeof c.maxHp === 'number' && c.hp > c.maxHp) {
    errors.push('character.hp must not exceed character.maxHp.');
  }

  if (typeof c.level !== 'number') {
    errors.push('character.level must be a number.');
  } else if (c.level < 1 || c.level > 10) {
    warnings.push('character.level should be between 1 and 10.');
  }

  if (typeof c.ac !== 'number') {
    warnings.push('character.ac should be a number.');
  } else if (c.ac < 0) {
    warnings.push('character.ac should be >= 0.');
  }

  if (typeof c.xp !== 'number' || c.xp < 0) {
    warnings.push('character.xp should be a non-negative number.');
  }

  if (typeof c.currency !== 'number') {
    warnings.push('character.currency should be a number.');
  }

  if (typeof c.currencyName !== 'string') {
    warnings.push('character.currencyName should be a string.');
  }

  if (typeof c.proficiencyBonus !== 'number') {
    warnings.push('character.proficiencyBonus should be a number.');
  }

  if (!Array.isArray(c.proficiencies)) {
    warnings.push('character.proficiencies should be an array.');
  }

  if (!Array.isArray(c.abilities)) {
    warnings.push('character.abilities should be an array.');
  }

  if (!Array.isArray(c.inventory)) {
    warnings.push('character.inventory should be an array.');
  }

  if (!Array.isArray(c.conditions)) {
    warnings.push('character.conditions should be an array.');
  }

  // modifiers — StatBlock
  if (typeof c.modifiers !== 'object' || c.modifiers === null) {
    warnings.push('character.modifiers should be an object.');
  } else {
    const mods = c.modifiers as Record<string, unknown>;
    for (const stat of STAT_NAMES) {
      if (typeof mods[stat] !== 'number') {
        warnings.push(`character.modifiers.${stat} should be a number.`);
      }
    }
  }

  // equipment
  if (typeof c.equipment !== 'object' || c.equipment === null) {
    warnings.push('character.equipment should be an object.');
  } else {
    const eq = c.equipment as Record<string, unknown>;
    if (typeof eq.weapon !== 'string') warnings.push('character.equipment.weapon should be a string.');
    if (typeof eq.armour !== 'string') warnings.push('character.equipment.armour should be a string.');
  }

  // stats
  if (typeof c.stats !== 'object' || c.stats === null) {
    errors.push('character.stats must be an object.');
  } else {
    const stats = c.stats as Record<string, unknown>;
    for (const stat of STAT_NAMES) {
      if (typeof stats[stat] !== 'number') {
        errors.push(`character.stats.${stat} must be a number.`);
      }
    }
  }
}

const VALID_QUEST_STATUSES = new Set(['active', 'completed', 'failed']);

function validateQuest(quest: unknown, index: number, errors: string[], warnings: string[]): void {
  if (typeof quest !== 'object' || quest === null) {
    errors.push(`quests[${index}] must be an object.`);
    return;
  }
  const q = quest as Record<string, unknown>;
  const prefix = `quests[${index}]`;
  if (typeof q.id !== 'string' || q.id.length === 0) {
    errors.push(`${prefix}.id must be a non-empty string.`);
  }
  if (typeof q.title !== 'string') {
    warnings.push(`${prefix}.title should be a string.`);
  }
  if (typeof q.status !== 'string' || !VALID_QUEST_STATUSES.has(q.status)) {
    warnings.push(`${prefix}.status should be 'active', 'completed', or 'failed'.`);
  }
  if (!Array.isArray(q.objectives)) {
    warnings.push(`${prefix}.objectives should be an array.`);
  }
  if (!Array.isArray(q.clues)) {
    warnings.push(`${prefix}.clues should be an array.`);
  }
}

function validateNpc(npc: unknown, index: number, errors: string[], warnings: string[]): void {
  if (typeof npc !== 'object' || npc === null) {
    errors.push(`rosterMutations[${index}] must be an object.`);
    return;
  }

  const n = npc as Record<string, unknown>;
  const prefix = `rosterMutations[${index}]`;

  if (typeof n.id !== 'string' || n.id.length === 0) {
    errors.push(`${prefix}.id must be a non-empty string.`);
  }

  if (typeof n.name !== 'string' || n.name.length === 0) {
    errors.push(`${prefix}.name must be a non-empty string.`);
  }

  if (typeof n.pronouns !== 'string' || !VALID_PRONOUN_SET.has(n.pronouns)) {
    errors.push(`${prefix}.pronouns must be one of: ${VALID_PRONOUNS.join(', ')}.`);
  }

  if (typeof n.tier !== 'string' || !VALID_TIER_SET.has(n.tier)) {
    errors.push(`${prefix}.tier must be one of: ${VALID_TIERS.join(', ')}.`);
  }

  // stats
  if (typeof n.stats !== 'object' || n.stats === null) {
    errors.push(`${prefix}.stats must be an object.`);
  } else {
    const stats = n.stats as Record<string, unknown>;
    for (const stat of STAT_NAMES) {
      if (typeof stats[stat] !== 'number') {
        errors.push(`${prefix}.stats.${stat} must be a number.`);
      }
    }
  }

  // hp / maxHp
  if (typeof n.hp !== 'number') {
    warnings.push(`${prefix}.hp should be a number.`);
  } else if (n.hp < 0) {
    warnings.push(`${prefix}.hp should be >= 0.`);
  }

  if (typeof n.maxHp !== 'number') {
    warnings.push(`${prefix}.maxHp should be a number.`);
  } else if (n.maxHp <= 0) {
    warnings.push(`${prefix}.maxHp should be > 0.`);
  }

  if (typeof n.hp === 'number' && typeof n.maxHp === 'number' && n.hp > n.maxHp) {
    warnings.push(`${prefix}.hp should not exceed ${prefix}.maxHp.`);
  }

  // status — optional string
  if (n.status !== undefined && typeof n.status !== 'string') {
    warnings.push(`${prefix}.status should be a string if present.`);
  }

  // modifiers — optional object with numeric values
  if (n.modifiers !== undefined) {
    if (typeof n.modifiers !== 'object' || n.modifiers === null) {
      warnings.push(`${prefix}.modifiers should be an object if present.`);
    } else {
      const mods = n.modifiers as Record<string, unknown>;
      for (const [key, val] of Object.entries(mods)) {
        if (typeof val !== 'number') {
          warnings.push(`${prefix}.modifiers.${key} should be a number.`);
        }
      }
    }
  }
}

function validateTime(time: unknown, errors: string[]): void {
  if (typeof time !== 'object' || time === null) {
    errors.push('time must be an object.');
    return;
  }

  const t = time as Record<string, unknown>;

  if (typeof t.period !== 'string') {
    errors.push('time.period must be a string.');
  }

  if (typeof t.date !== 'string') {
    errors.push('time.date must be a string.');
  }

  if (typeof t.elapsed !== 'number') {
    errors.push('time.elapsed must be a number.');
  }

  if (typeof t.hour !== 'number') {
    errors.push('time.hour must be a number.');
  }
}
