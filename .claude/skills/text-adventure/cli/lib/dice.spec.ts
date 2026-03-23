import { describe, test, expect } from 'bun:test';
import { rollD20, rollDice, parseDice } from './dice';

describe('rollD20', () => {
  test('returns a number between 1 and 20', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollD20();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(20);
    }
  });

  test('returns an integer', () => {
    const result = rollD20();
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('parseDice', () => {
  test('parses 1d20', () => {
    expect(parseDice('1d20')).toEqual({ count: 1, sides: 20, modifier: 0 });
  });

  test('parses 2d6+3', () => {
    expect(parseDice('2d6+3')).toEqual({ count: 2, sides: 6, modifier: 3 });
  });

  test('parses 1d8-1', () => {
    expect(parseDice('1d8-1')).toEqual({ count: 1, sides: 8, modifier: -1 });
  });

  test('parses d20 (implied 1)', () => {
    expect(parseDice('d20')).toEqual({ count: 1, sides: 20, modifier: 0 });
  });

  test('returns null for invalid notation', () => {
    expect(parseDice('banana')).toBeNull();
  });
});

describe('rollDice', () => {
  test('1d6 returns 1-6', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDice(1, 6, 0);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    }
  });

  test('2d6 returns 2-12', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDice(2, 6, 0);
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(12);
    }
  });

  test('modifier is added', () => {
    const result = rollDice(1, 1, 5);
    expect(result).toBe(6);
  });

  test('negative modifier is subtracted', () => {
    const result = rollDice(1, 1, -1);
    expect(result).toBe(0);
  });
});
