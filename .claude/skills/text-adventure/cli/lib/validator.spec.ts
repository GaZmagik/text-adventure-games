import { describe, test, expect } from 'bun:test';
import { validateState } from './validator';
import { createDefaultState } from './state-store';
import type { NpcMutation, RollRecord, Character } from '../types';

/** Builds a minimal valid Character with overrides. */
function mkChar(overrides: Partial<Character> = {}): Character {
  return {
    name: 'Hero', class: 'Soldier', hp: 10, maxHp: 10, ac: 12,
    level: 1, xp: 0, currency: 0, currencyName: 'gold',
    stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
    proficiencyBonus: 2, proficiencies: [], abilities: [],
    inventory: [], conditions: [],
    equipment: { weapon: 'knife', armour: 'none' },
    ...overrides,
  };
}

/** Builds a minimal valid NpcMutation with overrides. */
function mkNpc(overrides: Partial<NpcMutation> = {}): NpcMutation {
  return {
    id: 'npc_01', name: 'Guard', pronouns: 'he/him', role: 'guard',
    tier: 'minion', level: 1,
    stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
    hp: 6, maxHp: 6, ac: 8, soak: 1, damageDice: '1d6',
    status: 'active', alive: true, trust: 0,
    disposition: 'neutral', dispositionSeed: 0.5,
    ...overrides,
  };
}

describe('validateState', () => {
  test('valid default state passes validation', () => {
    const state = createDefaultState();
    const result = validateState(state);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('null input fails validation', () => {
    const result = validateState(null);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('missing _version fails', () => {
    const state = createDefaultState() as unknown as Record<string, unknown>;
    delete state._version;
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('_version'))).toBe(true);
  });

  test('non-numeric _version fails', () => {
    const state = createDefaultState() as unknown as Record<string, unknown>;
    state._version = 'abc';
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('_version'))).toBe(true);
  });

  test('valid state with character passes', () => {
    const state = createDefaultState();
    state.character = {
      name: 'Test Hero',
      class: 'Soldier',
      hp: 12,
      maxHp: 12,
      ac: 14,
      level: 1,
      xp: 0,
      currency: 0,
      currencyName: 'credits',
      stats: { STR: 16, DEX: 10, CON: 14, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 3, DEX: 0, CON: 2, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2,
      proficiencies: ['Athletics', 'Intimidation'],
      abilities: [],
      inventory: [],
      conditions: [],
      equipment: { weapon: 'Combat knife', armour: 'Light armour' },
    };
    const result = validateState(state);
    expect(result.valid).toBe(true);
  });

  test('character missing name fails', () => {
    const state = createDefaultState();
    state.character = {
      name: '',
      class: 'Soldier',
      hp: 12,
      maxHp: 12,
      ac: 14,
      level: 1,
      xp: 0,
      currency: 0,
      currencyName: 'credits',
      stats: { STR: 16, DEX: 10, CON: 14, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 3, DEX: 0, CON: 2, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2,
      proficiencies: [],
      abilities: [],
      inventory: [],
      conditions: [],
      equipment: { weapon: 'knife', armour: 'none' },
    };
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('character.name'))).toBe(true);
  });

  test('character missing stats attribute fails', () => {
    const state = createDefaultState();
    state.character = {
      name: 'Hero',
      class: 'Soldier',
      hp: 12,
      maxHp: 12,
      ac: 14,
      level: 1,
      xp: 0,
      currency: 0,
      currencyName: 'credits',
      stats: { STR: 16, DEX: 10, CON: 14, INT: 10, WIS: 10 } as any,
      modifiers: { STR: 3, DEX: 0, CON: 2, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2,
      proficiencies: [],
      abilities: [],
      inventory: [],
      conditions: [],
      equipment: { weapon: 'knife', armour: 'none' },
    };
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('CHA'))).toBe(true);
  });

  test('invalid faction range fails', () => {
    const state = createDefaultState();
    state.factions = { rebels: 150 };
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('faction'))).toBe(true);
  });

  test('valid faction range passes', () => {
    const state = createDefaultState();
    state.factions = { rebels: 50, empire: -30 };
    const result = validateState(state);
    expect(result.valid).toBe(true);
  });

  test('NPC without pronouns fails', () => {
    const state = createDefaultState();
    state.rosterMutations = [
      {
        id: 'npc_01',
        name: 'Guard',
        pronouns: undefined as any,
        role: 'guard',
        tier: 'minion',
        level: 1,
        stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
        modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
        hp: 6,
        maxHp: 6,
        ac: 8,
        soak: 1,
        damageDice: '1d6',
        status: 'active',
        alive: true,
        trust: 0,
        disposition: 'neutral',
        dispositionSeed: 0.5,
      },
    ];
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('pronouns'))).toBe(true);
  });

  test('NPC without tier fails', () => {
    const state = createDefaultState();
    state.rosterMutations = [
      {
        id: 'npc_01',
        name: 'Guard',
        pronouns: 'they/them',
        role: 'guard',
        tier: undefined as any,
        level: 1,
        stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
        modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
        hp: 6,
        maxHp: 6,
        ac: 8,
        soak: 1,
        damageDice: '1d6',
        status: 'active',
        alive: true,
        trust: 0,
        disposition: 'neutral',
        dispositionSeed: 0.5,
      },
    ];
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('tier'))).toBe(true);
  });

  test('time missing required fields fails', () => {
    const state = createDefaultState() as any;
    state.time = { period: 'morning' };
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('time'))).toBe(true);
  });

  test('valid NPC with all fields passes', () => {
    const state = createDefaultState();
    state.rosterMutations = [
      {
        id: 'npc_01',
        name: 'Guard',
        pronouns: 'he/him',
        role: 'guard',
        tier: 'minion',
        level: 1,
        stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
        modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
        hp: 6,
        maxHp: 6,
        ac: 8,
        soak: 1,
        damageDice: '1d6',
        status: 'active',
        alive: true,
        trust: 0,
        disposition: 'neutral',
        dispositionSeed: 0.5,
      },
    ];
    const result = validateState(state);
    expect(result.valid).toBe(true);
  });

  test('rosterMutations as non-array object fails', () => {
    const state = createDefaultState() as unknown as Record<string, unknown>;
    state.rosterMutations = {};
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('rosterMutations must be an array'))).toBe(true);
  });

  test('factions as non-object fails', () => {
    const state = createDefaultState() as unknown as Record<string, unknown>;
    state.factions = 'not-an-object';
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('factions must be an object'))).toBe(true);
  });

  test('faction with non-numeric value fails', () => {
    const state = createDefaultState();
    state.factions = { rebels: 'high' as unknown as number };
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('rebels') && e.includes('number'))).toBe(true);
  });

  test('undefined input fails validation', () => {
    const result = validateState(undefined);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('non-null object'))).toBe(true);
  });

  test('time as non-object fails', () => {
    const state = createDefaultState() as unknown as Record<string, unknown>;
    state.time = 'not-an-object';
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('time must be an object'))).toBe(true);
  });

  test('character as non-object fails', () => {
    const state = createDefaultState() as unknown as Record<string, unknown>;
    state.character = 'not-an-object';
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('character must be an object'))).toBe(true);
  });

  test('character with missing hp and level fails', () => {
    const state = createDefaultState() as unknown as Record<string, unknown>;
    state.character = { name: 'Hero', stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 } };
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('character.hp'))).toBe(true);
    expect(result.errors.some(e => e.includes('character.maxHp'))).toBe(true);
    expect(result.errors.some(e => e.includes('character.level'))).toBe(true);
  });

  test('character with null stats fails', () => {
    const state = createDefaultState() as unknown as Record<string, unknown>;
    state.character = { name: 'Hero', hp: 10, maxHp: 10, level: 1, stats: null };
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('character.stats must be an object'))).toBe(true);
  });

  test('NPC entry that is null fails', () => {
    const state = createDefaultState();
    state.rosterMutations = [null as any];
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('rosterMutations[0] must be an object'))).toBe(true);
  });

  test('NPC with empty id fails', () => {
    const state = createDefaultState();
    state.rosterMutations = [
      {
        id: '',
        name: 'Guard',
        pronouns: 'he/him',
        role: 'guard',
        tier: 'minion',
        level: 1,
        stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
        modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
        hp: 6, maxHp: 6, ac: 8, soak: 1, damageDice: '1d6',
        status: 'active', alive: true, trust: 0,
        disposition: 'neutral', dispositionSeed: 0.5,
      },
    ];
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('rosterMutations[0].id'))).toBe(true);
  });

  test('NPC with null stats fails', () => {
    const state = createDefaultState();
    state.rosterMutations = [
      {
        id: 'npc_01',
        name: 'Guard',
        pronouns: 'he/him',
        role: 'guard',
        tier: 'minion',
        level: 1,
        stats: null as any,
        modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
        hp: 6, maxHp: 6, ac: 8, soak: 1, damageDice: '1d6',
        status: 'active', alive: true, trust: 0,
        disposition: 'neutral', dispositionSeed: 0.5,
      },
    ];
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('rosterMutations[0].stats must be an object'))).toBe(true);
  });

  // ── Range validation warnings ─────────────────────────────────────

  test('character.hp < 0 produces an error (upgraded from warning)', () => {
    const state = createDefaultState();
    state.character = mkChar({ hp: -1, maxHp: 10 });
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('character.hp') && e.includes('< 0'))).toBe(true);
  });

  test('character.maxHp <= 0 produces an error (upgraded from warning)', () => {
    const state = createDefaultState();
    state.character = mkChar({ hp: 0, maxHp: 0 });
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('character.maxHp') && e.includes('<= 0'))).toBe(true);
  });

  test('character.level outside 1-10 produces a warning', () => {
    const state = createDefaultState();
    state.character = {
      name: 'Hero',
      class: 'Soldier',
      hp: 10,
      maxHp: 10,
      ac: 12,
      level: 11,
      xp: 0,
      currency: 0,
      currencyName: 'gold',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2,
      proficiencies: [],
      abilities: [],
      inventory: [],
      conditions: [],
      equipment: { weapon: 'knife', armour: 'none' },
    };
    const result = validateState(state);
    expect(result.warnings.some(w => w.includes('character.level') && w.includes('1 and 10'))).toBe(true);
  });

  // ── Phase 3: HP invariant upgrades (warnings → errors) ────────────

  test('character.hp < 0 produces an error', () => {
    const state = createDefaultState();
    state.character = mkChar({ hp: -1, maxHp: 10 });
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('character.hp') && e.includes('< 0'))).toBe(true);
  });

  test('character.maxHp <= 0 produces an error', () => {
    const state = createDefaultState();
    state.character = mkChar({ hp: 0, maxHp: 0 });
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('character.maxHp') && e.includes('<= 0'))).toBe(true);
  });

  test('character.hp > character.maxHp produces an error', () => {
    const state = createDefaultState();
    state.character = mkChar({ hp: 15, maxHp: 10 });
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('character.hp') && e.includes('exceed'))).toBe(true);
  });

  // AT/AZ: level=0 is outside 1-10, should produce a warning
  test('AT/AZ: character.level = 0 produces a warning about level being out of range', () => {
    const state = createDefaultState();
    state.character = mkChar({ level: 0 });
    const result = validateState(state);
    // level=0 is outside [1,10] → warning (not error, consistent with existing level=11 test)
    expect(result.warnings.some(w => w.includes('character.level') && w.includes('1 and 10'))).toBe(true);
  });

  test('character.ac < 0 produces a warning', () => {
    const state = createDefaultState();
    state.character = {
      name: 'Hero',
      class: 'Soldier',
      hp: 10,
      maxHp: 10,
      ac: -1,
      level: 1,
      xp: 0,
      currency: 0,
      currencyName: 'gold',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2,
      proficiencies: [],
      abilities: [],
      inventory: [],
      conditions: [],
      equipment: { weapon: 'knife', armour: 'none' },
    };
    const result = validateState(state);
    expect(result.warnings.some(w => w.includes('character.ac') && w.includes('>= 0'))).toBe(true);
  });
});

// ── Phase 3: NPC ID uniqueness ───────────────────────────────────────

describe('validateState — NPC ID uniqueness', () => {
  test('duplicate NPC IDs produce an error', () => {
    const state = createDefaultState();
    state.rosterMutations = [mkNpc({ id: 'npc_dup' }), mkNpc({ id: 'npc_dup', name: 'Clone' })];
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('duplicate') || e.includes('Duplicate'))).toBe(true);
  });

  test('unique NPC IDs pass', () => {
    const state = createDefaultState();
    state.rosterMutations = [mkNpc({ id: 'npc_a' }), mkNpc({ id: 'npc_b', name: 'Scout' })];
    const result = validateState(state);
    expect(result.valid).toBe(true);
  });
});

// ── Phase 3: rollHistory entry validation ────────────────────────────

describe('validateState — rollHistory entries', () => {
  test('invalid RollType produces a warning', () => {
    const state = createDefaultState();
    state.rollHistory = [
      { scene: 1, type: 'bogus_roll' as any, roll: 15, outcome: 'success' },
    ];
    const result = validateState(state);
    expect(result.warnings.some(w => w.includes('type') && w.includes('rollHistory'))).toBe(true);
  });

  test('invalid StatName in roll produces a warning', () => {
    const state = createDefaultState();
    state.rollHistory = [
      { scene: 1, type: 'contested_roll', stat: 'FOO' as any, roll: 12, outcome: 'success' },
    ];
    const result = validateState(state);
    expect(result.warnings.some(w => w.includes('stat') && w.includes('rollHistory'))).toBe(true);
  });
});

// ── Phase 3: modulesActive validation ────────────────────────────────

describe('validateState — modulesActive', () => {
  test('unknown module name produces a warning', () => {
    const state = createDefaultState();
    state.modulesActive = ['core-systems', 'not-a-real-module'];
    const result = validateState(state);
    expect(result.warnings.some(w => w.includes('not-a-real-module'))).toBe(true);
  });

  test('valid module names pass without warnings', () => {
    const state = createDefaultState();
    state.modulesActive = ['core-systems', 'die-rolls', 'prose-craft'];
    const result = validateState(state);
    expect(result.warnings.filter(w => w.includes('module'))).toHaveLength(0);
  });
});
