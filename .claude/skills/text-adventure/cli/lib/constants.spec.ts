import { describe, test, expect } from 'bun:test';
import { STAT_NAMES, VALID_TIERS, VALID_PRONOUNS } from './constants';

describe('constants', () => {
  test('STAT_NAMES has 6 entries', () => {
    expect(STAT_NAMES).toHaveLength(6);
    expect(STAT_NAMES).toContain('STR');
    expect(STAT_NAMES).toContain('CHA');
  });
  test('VALID_TIERS has 3 entries', () => {
    expect(VALID_TIERS).toHaveLength(3);
    expect(VALID_TIERS).toContain('minion');
    expect(VALID_TIERS).toContain('nemesis');
  });
  test('VALID_PRONOUNS has 3 entries', () => {
    expect(VALID_PRONOUNS).toHaveLength(3);
  });
});
