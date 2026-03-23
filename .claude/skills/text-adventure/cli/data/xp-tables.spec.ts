import { describe, test, expect } from 'bun:test';
import { XP_THRESHOLDS, LEVEL_REWARDS } from './xp-tables';

describe('XP_THRESHOLDS', () => {
  test('defines all 8 levels', () => {
    expect(XP_THRESHOLDS).toHaveLength(8);
  });

  test('level 1 starts at 0 XP', () => {
    expect(XP_THRESHOLDS[0].level).toBe(1);
    expect(XP_THRESHOLDS[0].xp).toBe(0);
  });

  test('level 2 requires 100 XP', () => {
    expect(XP_THRESHOLDS[1].level).toBe(2);
    expect(XP_THRESHOLDS[1].xp).toBe(100);
  });

  test('level 8 requires 2300 XP', () => {
    expect(XP_THRESHOLDS[7].level).toBe(8);
    expect(XP_THRESHOLDS[7].xp).toBe(2300);
  });

  test('thresholds are monotonically increasing', () => {
    for (let i = 1; i < XP_THRESHOLDS.length; i++) {
      expect(XP_THRESHOLDS[i].xp).toBeGreaterThan(XP_THRESHOLDS[i - 1].xp);
    }
  });

  test('levels are sequential from 1 to 8', () => {
    for (let i = 0; i < XP_THRESHOLDS.length; i++) {
      expect(XP_THRESHOLDS[i].level).toBe(i + 1);
    }
  });
});

describe('LEVEL_REWARDS', () => {
  test('defines rewards for all 8 levels', () => {
    expect(Object.keys(LEVEL_REWARDS)).toHaveLength(8);
  });

  test('each reward has hpGain and improvement', () => {
    for (let level = 1; level <= 8; level++) {
      const reward = LEVEL_REWARDS[level];
      expect(reward).toBeDefined();
      expect(typeof reward.hpGain).toBe('number');
      expect(typeof reward.improvement).toBe('string');
    }
  });

  test('level 1 has 0 HP gain (starting stats)', () => {
    expect(LEVEL_REWARDS[1].hpGain).toBe(0);
  });

  test('HP gains increase over levels', () => {
    expect(LEVEL_REWARDS[2].hpGain).toBe(3);
    expect(LEVEL_REWARDS[5].hpGain).toBe(4);
    expect(LEVEL_REWARDS[8].hpGain).toBe(6);
  });
});
