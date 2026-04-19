import { describe, test, expect } from 'bun:test';
import { BASE_DC, DC_BY_LEVEL, DIFFICULTY_MODIFIERS, getDcForLevel } from './dc-tables';

describe('BASE_DC', () => {
  test('has all difficulty levels', () => {
    expect(BASE_DC.Trivial).toBe(5);
    expect(BASE_DC.Easy).toBe(8);
    expect(BASE_DC.Moderate).toBe(12);
    expect(BASE_DC.Hard).toBe(16);
    expect(BASE_DC['Very Hard']).toBe(20);
    expect(BASE_DC['Near-impossible']).toBe(25);
  });
});

describe('DC_BY_LEVEL', () => {
  test('has entries for level ranges 1-2 through 9-10', () => {
    expect(DC_BY_LEVEL).toHaveLength(5);
  });

  test('moderate DCs increase with level', () => {
    for (let i = 1; i < DC_BY_LEVEL.length; i++) {
      expect(DC_BY_LEVEL[i]!.moderate).toBeGreaterThanOrEqual(DC_BY_LEVEL[i - 1]!.moderate);
    }
  });

  test('level 1-2 moderate DC is 10', () => {
    expect(DC_BY_LEVEL[0]!.moderate).toBe(10);
  });

  test('level 7-8 hard DC is 17', () => {
    expect(DC_BY_LEVEL[3]!.hard).toBe(17);
  });
});

describe('DIFFICULTY_MODIFIERS', () => {
  test('Easy is -2', () => { expect(DIFFICULTY_MODIFIERS.easy).toBe(-2); });
  test('Normal is 0', () => { expect(DIFFICULTY_MODIFIERS.normal).toBe(0); });
  test('Hard is +2', () => { expect(DIFFICULTY_MODIFIERS.hard).toBe(2); });
  test('Brutal is +4', () => { expect(DIFFICULTY_MODIFIERS.brutal).toBe(4); });
});

describe('getDcForLevel', () => {
  test('returns correct DC for level 1 moderate', () => {
    expect(getDcForLevel(1, 'moderate')).toBe(10);
  });

  test('returns correct DC for level 5 hard', () => {
    expect(getDcForLevel(5, 'hard')).toBe(16);
  });

  test('applies difficulty modifier', () => {
    expect(getDcForLevel(1, 'moderate', 'hard')).toBe(12);
  });

  test('clamps level to valid range', () => {
    expect(getDcForLevel(15, 'moderate')).toBe(15);
  });
});
