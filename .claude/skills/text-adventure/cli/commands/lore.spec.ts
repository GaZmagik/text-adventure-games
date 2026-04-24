import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleLore } from './lore';
import { saveState, createDefaultState, loadState } from '../lib/state-store';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(async () => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-lore-'));
  process.env.TAG_STATE_DIR = tempDir;
  const state = createDefaultState();
  await saveState(state);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) process.env.TAG_STATE_DIR = originalEnv;
  else delete process.env.TAG_STATE_DIR;
});

describe('tag lore defaults', () => {
  test('returns _loreDefaults from state', async () => {
    const state = await loadState();
    state._loreDefaults = { difficulty: 'hard', pacing: 'slow', rulebook: 'd20_system', visualStyle: 'holographic' };
    await saveState(state);

    const result = await handleLore(['defaults']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.defaults).toEqual({
      difficulty: 'hard',
      pacing: 'slow',
      rulebook: 'd20_system',
      visualStyle: 'holographic',
    });
  });

  test('returns empty when no _loreDefaults exist', async () => {
    const result = await handleLore(['defaults']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.defaults).toBeNull();
    expect(data.message).toContain('No lore defaults');
  });
});

describe('tag lore pregen', () => {
  test('returns _lorePregen characters from state', async () => {
    const state = await loadState();
    state._lorePregen = [
      {
        name: 'Rian Vale',
        class: 'Diver',
        pronouns: 'he/him',
        hook: 'Explorer',
        stats: { STR: 12, DEX: 14, CON: 10, INT: 13, WIS: 11, CHA: 9 },
        hp: 10,
        ac: 12,
        proficiencies: ['Athletics', 'Survival'],
      },
      {
        name: 'Suri Kade',
        class: 'Engineer',
        pronouns: 'she/her',
        hook: 'Steady hand',
        stats: { STR: 8, DEX: 10, CON: 12, INT: 16, WIS: 14, CHA: 10 },
        hp: 8,
        ac: 11,
        proficiencies: ['Mechanics'],
      },
    ];
    await saveState(state);

    const result = await handleLore(['pregen']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.count).toBe(2);
    expect(Array.isArray(data.characters)).toBe(true);
    const chars = data.characters as Array<Record<string, unknown>>;
    expect(chars[0]!.name).toBe('Rian Vale');
    expect(chars[1]!.name).toBe('Suri Kade');
  });

  test('returns empty when no _lorePregen exist', async () => {
    const result = await handleLore(['pregen']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.count).toBe(0);
    expect(data.message).toContain('No pre-generated characters');
  });
});

describe('tag lore status', () => {
  test('reports healthy pipeline when all data present and module active', async () => {
    const state = await loadState();
    state._loreSource = '/tmp/test.lore.md';
    state._loreDefaults = { difficulty: 'hard', rulebook: 'd20_system' };
    state._lorePregen = [
      {
        name: 'Rian',
        class: 'Diver',
        pronouns: 'he/him',
        hook: 'x',
        stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
        hp: 10,
        ac: 10,
        proficiencies: [],
      },
    ];
    state.modulesActive = ['pre-generated-characters', ...state.modulesActive];
    await saveState(state);

    const result = await handleLore(['status']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.loreSource).toBe('/tmp/test.lore.md');
    expect(data.hasDefaults).toBe(true);
    expect(data.hasPregen).toBe(true);
    expect(data.pregenModuleActive).toBe(true);
    expect((data.issues as string[]).length).toBe(0);
  });

  test('reports issues when _lorePregen exists but module not active', async () => {
    const state = await loadState();
    state._loreSource = '/tmp/test.lore.md';
    state._lorePregen = [
      {
        name: 'Rian',
        class: 'Diver',
        pronouns: 'he/him',
        hook: 'x',
        stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
        hp: 10,
        ac: 10,
        proficiencies: [],
      },
    ];
    await saveState(state);

    const result = await handleLore(['status']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.pregenModuleActive).toBe(false);
    const issues = data.issues as string[];
    expect(issues.some(i => i.includes('pre-generated-characters'))).toBe(true);
  });

  test('reports no lore source when _loreSource is absent', async () => {
    const result = await handleLore(['status']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.loreSource).toBeNull();
    expect(data.hasDefaults).toBe(false);
    expect(data.hasPregen).toBe(false);
  });
});

describe('tag lore dispatch', () => {
  test('returns error for no subcommand', async () => {
    const result = await handleLore([]);
    expect(result.ok).toBe(false);
  });

  test('returns error for unknown subcommand', async () => {
    const result = await handleLore(['banana']);
    expect(result.ok).toBe(false);
  });
});
