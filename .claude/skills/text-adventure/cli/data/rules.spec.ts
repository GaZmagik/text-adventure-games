import { describe, test, expect } from 'bun:test';
import { RULES, CATEGORIES } from './rules';

describe('RULES data', () => {
  test('contains at least 20 rules', () => {
    expect(RULES.length).toBeGreaterThanOrEqual(20);
  });

  test('every rule has required fields', () => {
    for (const rule of RULES) {
      expect(rule.id).toBeGreaterThan(0);
      expect(rule.category).toBeTruthy();
      expect(rule.rule).toBeTruthy();
      expect(rule.ref).toBeTruthy();
    }
  });

  test('every rule category is in CATEGORIES', () => {
    for (const rule of RULES) {
      expect(CATEGORIES as readonly string[]).toContain(rule.category);
    }
  });

  test('rule IDs are unique', () => {
    const ids = RULES.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every category has at least one rule', () => {
    for (const cat of CATEGORIES) {
      const count = RULES.filter(r => r.category === cat).length;
      expect(count).toBeGreaterThan(0);
    }
  });

  test('every ref contains a file name', () => {
    for (const rule of RULES) {
      expect(rule.ref).toMatch(/\.(md|ts)[:\s§]/);
    }
  });
});
