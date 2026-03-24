import { describe, test, expect } from 'bun:test';
import { STAT_NAMES, VALID_TIERS, VALID_PRONOUNS } from './constants';

describe('constants', () => {
  test('STAT_NAMES contains all 6 ability scores', () => {
    expect(STAT_NAMES).toHaveLength(6);
    for (const stat of ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']) {
      expect(STAT_NAMES).toContain(stat);
    }
  });
  test('VALID_TIERS contains minion, rival, nemesis', () => {
    expect(VALID_TIERS).toHaveLength(3);
    for (const tier of ['minion', 'rival', 'nemesis']) {
      expect(VALID_TIERS).toContain(tier);
    }
  });
  test('VALID_PRONOUNS contains she/her, he/him, they/them', () => {
    expect(VALID_PRONOUNS).toHaveLength(3);
    for (const p of ['she/her', 'he/him', 'they/them']) {
      expect(VALID_PRONOUNS).toContain(p);
    }
  });
});
