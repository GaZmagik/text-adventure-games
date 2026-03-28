import { describe, test, expect } from 'bun:test';
import { createDefaultState } from './state-store';
import {
  collectUnexpectedStatePaths,
  stripUnknownStateKeys,
  validateStatePath,
  describeStateShape,
} from './state-schema';

describe('collectUnexpectedStatePaths', () => {
  test('finds unexpected nested keys', () => {
    const state = createDefaultState();
    (state.time as Record<string, unknown>).season = 'winter';
    state.rosterMutations.push({
      id: 'npc_1',
      name: 'Ghost',
      pronouns: 'they/them',
      role: 'scout',
      tier: 'rival',
      level: 2,
      stats: { STR: 10, DEX: 12, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 1, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      hp: 8,
      maxHp: 8,
      ac: 12,
      soak: 0,
      damageDice: '1d6',
      status: 'active',
      alive: true,
      trust: 0,
      disposition: 'neutral',
      dispositionSeed: 0.5,
      alias: 'Whisper',
    } as any);

    const paths = collectUnexpectedStatePaths(state);
    expect(paths).toContain('time.season');
    expect(paths).toContain('rosterMutations.0.alias');
  });

  test('detects array where object expected (equipment type mismatch)', () => {
    const state = createDefaultState();
    state.character = {
      name: 'Test', class: 'Scout', hp: 10, maxHp: 10, ac: 12,
      level: 1, xp: 0, currency: 0, currencyName: 'credits',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2, proficiencies: [], abilities: [],
      inventory: [], conditions: [],
      equipment: ['Sword', 'Shield'] as any,
    };
    const paths = collectUnexpectedStatePaths(state);
    expect(paths).toContain('character.equipment');
  });

  test('does not flag valid object equipment', () => {
    const state = createDefaultState();
    state.character = {
      name: 'Test', class: 'Scout', hp: 10, maxHp: 10, ac: 12,
      level: 1, xp: 0, currency: 0, currencyName: 'credits',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2, proficiencies: [], abilities: [],
      inventory: [], conditions: [],
      equipment: { weapon: 'Sword', armour: 'Chainmail' },
    };
    const paths = collectUnexpectedStatePaths(state);
    expect(paths).not.toContain('character.equipment');
  });
});

describe('describeStateShape', () => {
  test('describes top-level keys', () => {
    const desc = describeStateShape('');
    expect(desc).toContain('character');
    expect(desc).toContain('quests');
    expect(desc).toContain('worldFlags');
    expect(desc).toContain('scene');
  });

  test('describes character shape with all fields', () => {
    const desc = describeStateShape('character');
    expect(desc).toContain('name');
    expect(desc).toContain('class');
    expect(desc).toContain('hp');
    expect(desc).toContain('equipment');
    expect(desc).toContain('weapon');
    expect(desc).toContain('armour');
    expect(desc).toContain('inventory');
    expect(desc).toContain('proficiencies');
  });

  test('describes quest shape', () => {
    const desc = describeStateShape('quests.0');
    expect(desc).toContain('id');
    expect(desc).toContain('title');
    expect(desc).toContain('status');
    expect(desc).toContain('objectives');
    expect(desc).toContain('description');
    expect(desc).toContain('completed');
    expect(desc).toContain('clues');
  });

  test('describes inventory item shape', () => {
    const desc = describeStateShape('character.inventory.0');
    expect(desc).toContain('name');
    expect(desc).toContain('type');
    expect(desc).toContain('slots');
    expect(desc).toContain('description');
  });

  test('returns error for invalid path', () => {
    const desc = describeStateShape('nonexistent');
    expect(desc).toContain('Unknown');
  });
});

describe('stripUnknownStateKeys', () => {
  test('removes unexpected nested keys and reports their paths', () => {
    const state = createDefaultState();
    (state.time as Record<string, unknown>).season = 'winter';
    state.worldFlags.safe = true;

    const polluted = {
      ...state,
      character: {
        name: 'Hero',
        class: 'Scout',
        hp: 10,
        maxHp: 10,
        ac: 12,
        level: 1,
        xp: 0,
        currency: 0,
        currencyName: 'credits',
        stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
        modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
        proficiencyBonus: 2,
        proficiencies: [],
        abilities: [],
        inventory: [],
        conditions: [],
        equipment: { weapon: 'Knife', armour: 'Vest' },
        alias: 'Ghost',
      },
    };

    const result = stripUnknownStateKeys(polluted);
    expect(result.strippedPaths).toContain('time.season');
    expect(result.strippedPaths).toContain('character.alias');
    expect('season' in ((result.sanitized as Record<string, unknown>).time as Record<string, unknown>)).toBe(false);
    expect('alias' in ((result.sanitized as Record<string, unknown>).character as Record<string, unknown>)).toBe(false);
    expect(((result.sanitized as Record<string, unknown>).worldFlags as Record<string, unknown>).safe).toBe(true);
  });
});

describe('validateStatePath', () => {
  test('rejects empty paths and empty segments', () => {
    expect(validateStatePath('').valid).toBe(false);
    expect(validateStatePath('time..hour').error).toContain('empty segment');
  });

  test('rejects extending beyond a leaf node', () => {
    const result = validateStatePath('scene.value');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('extends beyond');
  });

  test('requires numeric indices for array paths', () => {
    const result = validateStatePath('quests.first.objectives.0.completed');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('numeric index');
  });

  test('accepts valid array, record, and nullable object paths', () => {
    expect(validateStatePath('quests.0.objectives.0.completed').valid).toBe(true);
    expect(validateStatePath('worldFlags.quest_started').valid).toBe(true);
    expect(validateStatePath('time.deadline.label').valid).toBe(true);
  });
});
