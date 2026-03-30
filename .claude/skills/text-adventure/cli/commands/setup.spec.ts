import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleSetup } from './setup';
import { tryLoadState } from '../lib/state-store';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-setup-test-'));
  process.env.TAG_STATE_DIR = tempDir;
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) process.env.TAG_STATE_DIR = originalEnv;
  else delete process.env.TAG_STATE_DIR;
});

describe('tag setup apply', () => {
  test('applies settings and character in one call', async () => {
    const settings = JSON.stringify({
      rulebook: 'd20_system',
      difficulty: 'normal',
      pacing: 'slow',
      visualStyle: 'station',
      modules: ['gm-checklist', 'prose-craft', 'core-systems', 'die-rolls', 'character-creation', 'save-codex'],
    });
    const character = JSON.stringify({
      name: 'Test Char',
      archetypeLabel: 'Scout',
      pronouns: 'they/them',
      stats: { STR: 10, DEX: 16, CON: 10, INT: 10, WIS: 14, CHA: 10 },
      hp: 9, ac: 13,
      proficiencies: ['Stealth', 'Perception'],
      abilities: ['Sneak Attack'],
    });

    const result = await handleSetup(['apply', '--settings', settings, '--character', character]);
    expect(result.ok).toBe(true);

    const state = await tryLoadState();
    expect(state).not.toBeNull();
    expect(state!.visualStyle).toBe('station');
    expect(state!.worldFlags.rulebook).toBe('d20_system');
    expect(state!.character?.name).toBe('Test Char');
    expect(state!.character?.stats.DEX).toBe(16);
    expect(state!.character?.hp).toBe(9);
    expect(state!.modulesActive).toContain('gm-checklist');
  });

  test('fails without --settings flag', async () => {
    const result = await handleSetup(['apply']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('--settings');
  });

  test('fails without --character flag', async () => {
    const settings = JSON.stringify({ rulebook: 'd20_system', visualStyle: 'station', modules: [] });
    const result = await handleSetup(['apply', '--settings', settings]);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('--character');
  });

  test('sets pronouns in worldFlags', async () => {
    const settings = JSON.stringify({ rulebook: 'd20_system', visualStyle: 'station', modules: ['gm-checklist'] });
    const character = JSON.stringify({
      name: 'Dren', pronouns: 'he/them',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      hp: 10, ac: 10, proficiencies: [], abilities: [],
    });
    const result = await handleSetup(['apply', '--settings', settings, '--character', character]);
    expect(result.ok).toBe(true);
    const state = await tryLoadState();
    expect(state!.worldFlags.pronouns).toBe('he/them');
  });

  test('calculates modifiers from stats', async () => {
    const settings = JSON.stringify({ rulebook: 'd20_system', visualStyle: 'station', modules: [] });
    const character = JSON.stringify({
      name: 'Test', pronouns: 'she/her',
      stats: { STR: 16, DEX: 8, CON: 14, INT: 10, WIS: 12, CHA: 9 },
      hp: 12, ac: 14, proficiencies: [], abilities: [],
    });
    const result = await handleSetup(['apply', '--settings', settings, '--character', character]);
    expect(result.ok).toBe(true);
    const state = await tryLoadState();
    expect(state!.character?.modifiers.STR).toBe(3);
    expect(state!.character?.modifiers.DEX).toBe(-1);
    expect(state!.character?.modifiers.CON).toBe(2);
    expect(state!.character?.modifiers.WIS).toBe(1);
    expect(state!.character?.modifiers.CHA).toBe(-1);
  });
});
