import { describe, test, expect } from 'bun:test';
import { FACTION_STANDINGS, getFactionStanding } from './faction-thresholds';

describe('FACTION_STANDINGS', () => {
  test('defines 5 standing tiers', () => {
    expect(FACTION_STANDINGS).toHaveLength(5);
  });

  test('ranges cover the full -100 to +100 spectrum', () => {
    const minValue = Math.min(...FACTION_STANDINGS.map(s => s.min));
    const maxValue = Math.max(...FACTION_STANDINGS.map(s => s.max));
    expect(minValue).toBe(-100);
    expect(maxValue).toBe(100);
  });

  test('ranges are contiguous with no gaps', () => {
    const sorted = [...FACTION_STANDINGS].sort((a, b) => a.min - b.min);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]!.min).toBe(sorted[i - 1]!.max + 1);
    }
  });

  test('labels match expected values', () => {
    const labels = FACTION_STANDINGS.map(s => s.label);
    expect(labels).toContain('Hostile');
    expect(labels).toContain('Unfriendly');
    expect(labels).toContain('Neutral');
    expect(labels).toContain('Friendly');
    expect(labels).toContain('Allied');
  });

  test('each standing has a priceModifier', () => {
    for (const standing of FACTION_STANDINGS) {
      expect(typeof standing.priceModifier).toBe('number');
    }
  });

  test('Hostile has +50% price modifier (same as Unfriendly) or higher', () => {
    const hostile = FACTION_STANDINGS.find(s => s.label === 'Hostile');
    expect(hostile).toBeDefined();
    expect(hostile!.priceModifier).toBeGreaterThanOrEqual(0.5);
  });

  test('Allied has -40% price modifier', () => {
    const allied = FACTION_STANDINGS.find(s => s.label === 'Allied');
    expect(allied).toBeDefined();
    expect(allied!.priceModifier).toBe(-0.4);
  });

  test('Neutral has 0% price modifier', () => {
    const neutral = FACTION_STANDINGS.find(s => s.label === 'Neutral');
    expect(neutral).toBeDefined();
    expect(neutral!.priceModifier).toBe(0);
  });
});

describe('getFactionStanding', () => {
  test('returns Hostile for -100', () => {
    expect(getFactionStanding(-100).label).toBe('Hostile');
  });

  test('returns Hostile for -50', () => {
    expect(getFactionStanding(-50).label).toBe('Hostile');
  });

  test('returns Unfriendly for -49', () => {
    expect(getFactionStanding(-49).label).toBe('Unfriendly');
  });

  test('returns Neutral for 0', () => {
    expect(getFactionStanding(0).label).toBe('Neutral');
  });

  test('returns Friendly for +10', () => {
    expect(getFactionStanding(10).label).toBe('Friendly');
  });

  test('returns Allied for +50', () => {
    expect(getFactionStanding(50).label).toBe('Allied');
  });

  test('returns Allied for +100', () => {
    expect(getFactionStanding(100).label).toBe('Allied');
  });

  test('clamps score above +100 to Allied', () => {
    const standing = getFactionStanding(200);
    expect(standing.label).toBe('Allied');
    expect(standing.min).toBe(50);
    expect(standing.max).toBe(100);
  });

  test('clamps score below -100 to Hostile', () => {
    const standing = getFactionStanding(-200);
    expect(standing.label).toBe('Hostile');
    expect(standing.min).toBe(-100);
    expect(standing.max).toBe(-50);
  });
});
