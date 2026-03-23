import { describe, test, expect } from 'bun:test';
import { abilityModifier, proficiencyBonus, computeModifiers } from './modifier';
import type { StatBlock } from '../types';

describe('abilityModifier', () => {
  test('score 8 gives -1', () => {
    expect(abilityModifier(8)).toBe(-1);
  });

  test('score 9 gives -1', () => {
    expect(abilityModifier(9)).toBe(-1);
  });

  test('score 10 gives 0', () => {
    expect(abilityModifier(10)).toBe(0);
  });

  test('score 11 gives 0', () => {
    expect(abilityModifier(11)).toBe(0);
  });

  test('score 12 gives +1', () => {
    expect(abilityModifier(12)).toBe(1);
  });

  test('score 14 gives +2', () => {
    expect(abilityModifier(14)).toBe(2);
  });

  test('score 15 gives +2', () => {
    expect(abilityModifier(15)).toBe(2);
  });

  test('score 20 gives +5', () => {
    expect(abilityModifier(20)).toBe(5);
  });

  test('score 1 gives -5', () => {
    expect(abilityModifier(1)).toBe(-5);
  });
});

describe('proficiencyBonus', () => {
  test('levels 1-4 give +2', () => {
    expect(proficiencyBonus(1)).toBe(2);
    expect(proficiencyBonus(2)).toBe(2);
    expect(proficiencyBonus(3)).toBe(2);
    expect(proficiencyBonus(4)).toBe(2);
  });

  test('levels 5-8 give +3', () => {
    expect(proficiencyBonus(5)).toBe(3);
    expect(proficiencyBonus(6)).toBe(3);
    expect(proficiencyBonus(7)).toBe(3);
    expect(proficiencyBonus(8)).toBe(3);
  });
});

describe('computeModifiers', () => {
  test('computes modifier for each stat', () => {
    const stats: StatBlock = { STR: 16, DEX: 12, CON: 14, INT: 8, WIS: 10, CHA: 15 };
    const mods = computeModifiers(stats);
    expect(mods.STR).toBe(3);
    expect(mods.DEX).toBe(1);
    expect(mods.CON).toBe(2);
    expect(mods.INT).toBe(-1);
    expect(mods.WIS).toBe(0);
    expect(mods.CHA).toBe(2);
  });
});
