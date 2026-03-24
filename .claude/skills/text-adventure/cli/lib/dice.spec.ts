import { describe, test, expect, afterEach, spyOn } from 'bun:test';
import { rollD20, rollDice, rollDie, rollD4, rollD6, rollD8, rollD10, rollD12, rollD100 } from './dice';

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

describe('rollDie', () => {
  test('returns value in range 1..sides for various sides', () => {
    for (const sides of [2, 4, 6, 8, 10, 12, 20]) {
      for (let i = 0; i < 50; i++) {
        const result = rollDie(sides);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(sides);
      }
    }
  });

  test('returns an integer', () => {
    expect(Number.isInteger(rollDie(6))).toBe(true);
  });
});

describe('convenience roll functions', () => {
  test('rollD4 returns 1-4', () => {
    for (let i = 0; i < 50; i++) {
      const r = rollD4();
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(4);
    }
  });

  test('rollD6 returns 1-6', () => {
    for (let i = 0; i < 50; i++) {
      const r = rollD6();
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(6);
    }
  });

  test('rollD8 returns 1-8', () => {
    for (let i = 0; i < 50; i++) {
      const r = rollD8();
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(8);
    }
  });

  test('rollD10 returns 1-10', () => {
    for (let i = 0; i < 50; i++) {
      const r = rollD10();
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(10);
    }
  });

  test('rollD12 returns 1-12', () => {
    for (let i = 0; i < 50; i++) {
      const r = rollD12();
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(12);
    }
  });

  test('rollD100 returns 1-100', () => {
    for (let i = 0; i < 100; i++) {
      const r = rollD100();
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(100);
    }
  });

  test('rollD100 returns an integer', () => {
    expect(Number.isInteger(rollD100())).toBe(true);
  });
});

describe('rollD100 deterministic boundaries', () => {
  const originalRandom = Math.random;
  afterEach(() => { Math.random = originalRandom; });

  test('returns 1 when both d10 rolls are 1 (Math.random returns 0.0)', () => {
    // rollD100 = (rollDie(10) - 1) * 10 + rollDie(10)
    // rollDie(10) with Math.random()=0.0 → Math.floor(0.0 * 10) + 1 = 1
    // result = (1 - 1) * 10 + 1 = 1
    const spy = spyOn(Math, 'random').mockReturnValue(0.0);
    expect(rollD100()).toBe(1);
    spy.mockRestore();
  });

  test('returns 100 when both d10 rolls are 10 (Math.random returns 0.95)', () => {
    // rollDie(10) with Math.random()=0.95 → Math.floor(0.95 * 10) + 1 = 9 + 1 = 10
    // result = (10 - 1) * 10 + 10 = 90 + 10 = 100
    const spy = spyOn(Math, 'random').mockReturnValue(0.95);
    expect(rollD100()).toBe(100);
    spy.mockRestore();
  });

  test('returns 91 when tens die is 10 and units die is 1', () => {
    // First call: 0.95 → rollDie(10)=10, second call: 0.0 → rollDie(10)=1
    // result = (10 - 1) * 10 + 1 = 91
    const spy = spyOn(Math, 'random')
      .mockReturnValueOnce(0.95)
      .mockReturnValueOnce(0.0);
    expect(rollD100()).toBe(91);
    spy.mockRestore();
  });

  test('returns 10 when tens die is 1 and units die is 10', () => {
    // First call: 0.0 → rollDie(10)=1, second call: 0.95 → rollDie(10)=10
    // result = (1 - 1) * 10 + 10 = 10
    const spy = spyOn(Math, 'random')
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(0.95);
    expect(rollD100()).toBe(10);
    spy.mockRestore();
  });
});
