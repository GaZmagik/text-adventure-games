import { describe, test, expect } from 'bun:test';
import { handleScenario } from './scenario';

describe('tag scenario bundled', () => {
  test('returns ok with scenarios array', async () => {
    const result = await handleScenario(['bundled']);
    expect(result.ok).toBe(true);
    expect(result.command).toBe('scenario');
    expect(Array.isArray((result.data as Record<string, unknown>).scenarios)).toBe(true);
  });

  test('includes Glass Reef Atlas from story/*.base64.lore.md', async () => {
    const result = await handleScenario(['bundled']);
    const scenarios = (result.data as Record<string, unknown>).scenarios as Record<string, unknown>[];
    expect(scenarios.length).toBeGreaterThanOrEqual(1);
    const glassReef = scenarios.find(s => s.title === 'The Glass Reef Atlas');
    expect(glassReef).toBeDefined();
  });

  test('maps frontmatter fields to scenario shape', async () => {
    const result = await handleScenario(['bundled']);
    const scenarios = (result.data as Record<string, unknown>).scenarios as Record<string, unknown>[];
    const glassReef = scenarios.find(s => s.title === 'The Glass Reef Atlas')!;
    expect(typeof glassReef.description).toBe('string');
    expect((glassReef.description as string).length).toBeGreaterThan(10);
    expect(glassReef.difficulty).toBe('hard');
    expect(glassReef.players).toBe('1');
  });

  test('derives id from filename', async () => {
    const result = await handleScenario(['bundled']);
    const scenarios = (result.data as Record<string, unknown>).scenarios as Record<string, unknown>[];
    const glassReef = scenarios.find(s => s.title === 'The Glass Reef Atlas')!;
    expect(glassReef.id).toBe('the-glass-reef-atlas');
  });

  test('sets featured: true on bundled scenarios', async () => {
    const result = await handleScenario(['bundled']);
    const scenarios = (result.data as Record<string, unknown>).scenarios as Record<string, unknown>[];
    for (const s of scenarios) {
      expect(s.featured).toBe(true);
    }
  });

  test('builds genres from theme and tone', async () => {
    const result = await handleScenario(['bundled']);
    const scenarios = (result.data as Record<string, unknown>).scenarios as Record<string, unknown>[];
    const glassReef = scenarios.find(s => s.title === 'The Glass Reef Atlas')!;
    const genres = glassReef.genres as string[];
    expect(Array.isArray(genres)).toBe(true);
    expect(genres).toContain('sci-fi');
    expect(genres).toContain('mystery');
  });

  test('includes lore filename for loading', async () => {
    const result = await handleScenario(['bundled']);
    const scenarios = (result.data as Record<string, unknown>).scenarios as Record<string, unknown>[];
    const glassReef = scenarios.find(s => s.title === 'The Glass Reef Atlas')!;
    expect(glassReef.loreFile).toBe('the-glass-reef-atlas.base64.lore.md');
  });

  test('includes coverFront CDN URL when front cover PNG exists', async () => {
    const result = await handleScenario(['bundled']);
    const scenarios = (result.data as Record<string, unknown>).scenarios as Record<string, unknown>[];
    const glassReef = scenarios.find(s => s.title === 'The Glass Reef Atlas')!;
    expect(typeof glassReef.coverFront).toBe('string');
    expect(glassReef.coverFront as string).toContain('the-glass-reef-atlas-front-cover.png');
    expect(glassReef.coverFront as string).toMatch(/^https:\/\//);
  });

  test('includes coverBack CDN URL when back cover PNG exists', async () => {
    const result = await handleScenario(['bundled']);
    const scenarios = (result.data as Record<string, unknown>).scenarios as Record<string, unknown>[];
    const glassReef = scenarios.find(s => s.title === 'The Glass Reef Atlas')!;
    expect(typeof glassReef.coverBack).toBe('string');
    expect(glassReef.coverBack as string).toContain('the-glass-reef-atlas-back-cover.png');
  });
});

describe('tag scenario subcommand routing', () => {
  test('no subcommand returns error', async () => {
    const result = await handleScenario([]);
    expect(result.ok).toBe(false);
    expect(result.error?.corrective).toContain('bundled');
  });

  test('unknown subcommand returns error', async () => {
    const result = await handleScenario(['nonsense']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('nonsense');
  });
});
