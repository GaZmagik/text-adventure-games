import { describe, test, expect } from 'bun:test';
import { TIERS, generateNpcFromTier } from './bestiary-tiers';
import type { BestiaryTier, Pronouns } from '../types';

describe('TIERS', () => {
  test('defines minion, rival, and nemesis tiers', () => {
    expect(TIERS.minion).toBeDefined();
    expect(TIERS.rival).toBeDefined();
    expect(TIERS.nemesis).toBeDefined();
  });

  test('minion HP range is 4-8', () => {
    expect(TIERS.minion.hpMin).toBe(4);
    expect(TIERS.minion.hpMax).toBe(8);
  });

  test('minion damage dice are 1d4-1d6', () => {
    expect(TIERS.minion.damageDiceOptions).toContain('1d4');
    expect(TIERS.minion.damageDiceOptions).toContain('1d6');
  });

  test('minion resistance modifier is +0 to +2', () => {
    expect(TIERS.minion.resistMin).toBe(0);
    expect(TIERS.minion.resistMax).toBe(2);
  });

  test('rival HP range is 12-20', () => {
    expect(TIERS.rival.hpMin).toBe(12);
    expect(TIERS.rival.hpMax).toBe(20);
  });

  test('rival damage dice are 1d8-2d6', () => {
    expect(TIERS.rival.damageDiceOptions).toContain('1d8');
    expect(TIERS.rival.damageDiceOptions).toContain('2d6');
  });

  test('rival resistance modifier is +3 to +5', () => {
    expect(TIERS.rival.resistMin).toBe(3);
    expect(TIERS.rival.resistMax).toBe(5);
  });

  test('nemesis HP range is 25-40', () => {
    expect(TIERS.nemesis.hpMin).toBe(25);
    expect(TIERS.nemesis.hpMax).toBe(40);
  });

  test('nemesis damage dice are 2d8-3d6', () => {
    expect(TIERS.nemesis.damageDiceOptions).toContain('2d8');
    expect(TIERS.nemesis.damageDiceOptions).toContain('3d6');
  });

  test('nemesis resistance modifier is +5 to +8', () => {
    expect(TIERS.nemesis.resistMin).toBe(5);
    expect(TIERS.nemesis.resistMax).toBe(8);
  });
});

describe('generateNpcFromTier', () => {
  const tiers: BestiaryTier[] = ['minion', 'rival', 'nemesis'];

  for (const tier of tiers) {
    test(`generates ${tier} with all required fields`, () => {
      const npc = generateNpcFromTier(tier, `test_${tier}`, `Test ${tier}`, 'they/them', 'guard');
      expect(npc.id).toBe(`test_${tier}`);
      expect(npc.name).toBe(`Test ${tier}`);
      expect(npc.tier).toBe(tier);
      expect(npc.role).toBe('guard');
      expect(npc.pronouns).toBe('they/them');
      expect(npc.stats).toBeDefined();
      expect(npc.stats.STR).toBeGreaterThanOrEqual(1);
      expect(npc.stats.DEX).toBeGreaterThanOrEqual(1);
      expect(npc.stats.CON).toBeGreaterThanOrEqual(1);
      expect(npc.stats.INT).toBeGreaterThanOrEqual(1);
      expect(npc.stats.WIS).toBeGreaterThanOrEqual(1);
      expect(npc.stats.CHA).toBeGreaterThanOrEqual(1);
      expect(npc.modifiers).toBeDefined();
      expect(npc.hp).toBeGreaterThanOrEqual(TIERS[tier].hpMin);
      expect(npc.hp).toBeLessThanOrEqual(TIERS[tier].hpMax);
      expect(npc.maxHp).toBe(npc.hp);
      expect(npc.ac).toBeGreaterThanOrEqual(1);
      expect(npc.soak).toBeGreaterThanOrEqual(0);
      expect(TIERS[tier].damageDiceOptions).toContain(npc.damageDice);
      expect(npc.status).toBe('active');
      expect(npc.alive).toBe(true);
      expect(npc.trust).toBe(0);
      expect(npc.disposition).toBe('neutral');
    });
  }

  test('pronouns are always set on generated NPC', () => {
    const pronounOptions: Pronouns[] = ['she/her', 'he/him', 'they/them'];
    for (const p of pronounOptions) {
      const npc = generateNpcFromTier('minion', 'ptest', 'Pronoun Test', p, 'scout');
      expect(npc.pronouns).toBe(p);
    }
  });

  test('generated minion HP falls within tier range', () => {
    for (let i = 0; i < 20; i++) {
      const npc = generateNpcFromTier('minion', `m${i}`, 'Minion', 'they/them', 'grunt');
      expect(npc.hp).toBeGreaterThanOrEqual(4);
      expect(npc.hp).toBeLessThanOrEqual(8);
    }
  });

  test('generated rival HP falls within tier range', () => {
    for (let i = 0; i < 20; i++) {
      const npc = generateNpcFromTier('rival', `r${i}`, 'Rival', 'he/him', 'enforcer');
      expect(npc.hp).toBeGreaterThanOrEqual(12);
      expect(npc.hp).toBeLessThanOrEqual(20);
    }
  });

  test('generated nemesis HP falls within tier range', () => {
    for (let i = 0; i < 20; i++) {
      const npc = generateNpcFromTier('nemesis', `n${i}`, 'Nemesis', 'she/her', 'warlord');
      expect(npc.hp).toBeGreaterThanOrEqual(25);
      expect(npc.hp).toBeLessThanOrEqual(40);
    }
  });
});
