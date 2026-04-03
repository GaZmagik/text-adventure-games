import { describe, test, expect } from 'bun:test';
import { generatePregenCharacters } from './pregen-generator';
import type { PreGeneratedCharacter } from '../types';

const STAT_KEYS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

describe('generatePregenCharacters', () => {
  test('generates exactly 3 characters', () => {
    const result = generatePregenCharacters({ theme: 'sci-fi' });
    expect(result).toHaveLength(3);
  });

  test('all characters have required fields', () => {
    const result = generatePregenCharacters({ theme: 'fantasy' });
    for (const char of result) {
      expect(typeof char.name).toBe('string');
      expect(char.name.length).toBeGreaterThan(0);
      expect(typeof char.class).toBe('string');
      expect(typeof char.pronouns).toBe('string');
      expect(typeof char.hook).toBe('string');
      expect(char.hook.length).toBeGreaterThan(0);
      expect(typeof char.hp).toBe('number');
      expect(char.hp).toBeGreaterThan(0);
      expect(typeof char.ac).toBe('number');
      expect(char.ac).toBeGreaterThan(0);
      expect(Array.isArray(char.proficiencies)).toBe(true);
      expect(char.proficiencies.length).toBeGreaterThan(0);
      for (const key of STAT_KEYS) {
        expect(typeof char.stats[key]).toBe('number');
        expect(char.stats[key]).toBeGreaterThanOrEqual(8);
        expect(char.stats[key]).toBeLessThanOrEqual(20);
      }
    }
  });

  test('characters have distinct primary stats', () => {
    const result = generatePregenCharacters({ theme: 'sci-fi' });
    const primaries = result.map(c => {
      const entries = Object.entries(c.stats);
      entries.sort((a, b) => b[1] - a[1]);
      return entries[0]![0];
    });
    const unique = new Set(primaries);
    expect(unique.size).toBe(3);
  });

  test('theme adapts class names for sci-fi', () => {
    const result = generatePregenCharacters({ theme: 'sci-fi' });
    const classes = result.map(c => c.class);
    // Should NOT contain the generic default names
    for (const cls of classes) {
      expect(['Soldier', 'Scout', 'Engineer', 'Medic', 'Diplomat', 'Smuggler']).not.toContain(cls);
    }
  });

  test('theme adapts class names for fantasy', () => {
    const result = generatePregenCharacters({ theme: 'fantasy' });
    const classes = result.map(c => c.class);
    for (const cls of classes) {
      expect(['Soldier', 'Scout', 'Engineer', 'Medic', 'Diplomat', 'Smuggler']).not.toContain(cls);
    }
  });

  test('uses default names when theme is unset', () => {
    const result = generatePregenCharacters({ theme: 'unset' });
    expect(result).toHaveLength(3);
    // Should still produce valid characters using fallback names
    for (const char of result) {
      expect(char.name.length).toBeGreaterThan(0);
      expect(char.class.length).toBeGreaterThan(0);
    }
  });

  test('deterministic from same seed + theme', () => {
    const a = generatePregenCharacters({ theme: 'sci-fi', seed: 'alpha-42' });
    const b = generatePregenCharacters({ theme: 'sci-fi', seed: 'alpha-42' });
    expect(a).toEqual(b);
  });

  test('different seeds produce different selections', () => {
    const a = generatePregenCharacters({ theme: 'sci-fi', seed: 'alpha-42' });
    const b = generatePregenCharacters({ theme: 'sci-fi', seed: 'beta-99' });
    // At least one character name should differ
    const namesA = a.map(c => c.name);
    const namesB = b.map(c => c.name);
    expect(namesA).not.toEqual(namesB);
  });

  test('each character has starting inventory', () => {
    const result = generatePregenCharacters({ theme: 'fantasy' });
    for (const char of result) {
      expect(Array.isArray(char.startingInventory)).toBe(true);
      expect(char.startingInventory!.length).toBeGreaterThan(0);
      for (const item of char.startingInventory!) {
        expect(typeof item.name).toBe('string');
      }
    }
  });

  test('pronouns are valid strings', () => {
    const result = generatePregenCharacters({ theme: 'sci-fi', seed: 'pronoun-test' });
    const valid = ['she/her', 'he/him', 'they/them', 'it/its'];
    for (const char of result) {
      expect(valid).toContain(char.pronouns);
    }
  });
});
