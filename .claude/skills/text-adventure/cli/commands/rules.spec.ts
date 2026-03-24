import { describe, test, expect } from 'bun:test';
import { handleRules } from './rules';
import { RULES } from '../data/rules';

describe('handleRules', () => {
  test('returns all rules with no arguments', async () => {
    const result = await handleRules([]);
    expect(result.ok).toBe(true);
    expect(result.command).toBe('rules');
    const data = result.data as { rules: unknown[]; category: string; hint: string };
    expect(data.rules.length).toBeGreaterThanOrEqual(20);
    expect(data.category).toBe('ALL');
    expect(data.hint).toContain('tag rules');
  });

  test('filters by category name', async () => {
    const result = await handleRules(['output']);
    expect(result.ok).toBe(true);
    const data = result.data as { rules: { category: string }[]; category: string };
    expect(data.category).toBe('output');
    expect(data.rules.length).toBeGreaterThanOrEqual(3);
    for (const rule of data.rules) {
      expect(rule.category).toBe('output');
    }
  });

  test('category filter is case-insensitive', async () => {
    const result = await handleRules(['OUTPUT']);
    expect(result.ok).toBe(true);
    const data = result.data as { rules: unknown[]; category: string };
    expect(data.category).toBe('output');
    expect(data.rules.length).toBeGreaterThanOrEqual(3);
  });

  test('filters by keyword when not a category', async () => {
    // Derive a keyword from actual rules data that is NOT a category name
    const categories = new Set(['output', 'agency', 'cli', 'prose', 'technical']);
    const keyword = RULES.flatMap(r => r.rule.split(' '))
      .map(w => w.toLowerCase().replace(/[^a-z]/g, ''))
      .find(w => w.length > 4 && !categories.has(w))!;
    const result = await handleRules([keyword]);
    expect(result.ok).toBe(true);
    const data = result.data as { rules: { rule: string }[] };
    expect(data.rules.length).toBeGreaterThan(0);
    for (const rule of data.rules) {
      expect(rule.rule.toLowerCase()).toContain(keyword);
    }
  });

  test('returns empty results for unmatched keyword', async () => {
    const result = await handleRules(['xyznonexistent']);
    expect(result.ok).toBe(true);
    const data = result.data as { rules: unknown[]; total: number };
    expect(data.rules.length).toBe(0);
    expect(data.total).toBe(0);
  });

  test('agency category returns player agency rules', async () => {
    const result = await handleRules(['agency']);
    expect(result.ok).toBe(true);
    const data = result.data as { rules: { rule: string }[] };
    expect(data.rules.length).toBeGreaterThanOrEqual(5);
    const hasAutoResolve = data.rules.some(r => r.rule.includes('auto-resolve'));
    expect(hasAutoResolve).toBe(true);
  });

  test('cli category returns CLI usage rules', async () => {
    const result = await handleRules(['cli']);
    expect(result.ok).toBe(true);
    const data = result.data as { rules: { rule: string }[] };
    expect(data.rules.length).toBeGreaterThanOrEqual(3);
    const hasNpc = data.rules.some(r => r.rule.includes('create-npc'));
    expect(hasNpc).toBe(true);
  });
});
