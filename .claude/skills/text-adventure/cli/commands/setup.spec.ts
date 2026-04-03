import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleSetup } from './setup';
import { tryLoadState } from '../lib/state-store';
import { handleState } from './state/index';
import { signMarker } from './verify';

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

  test('stores explicit pre-generated opening metadata', async () => {
    const settings = JSON.stringify({ rulebook: 'd20_system', visualStyle: 'station', modules: ['gm-checklist'] });
    const character = JSON.stringify({
      name: 'Rian Vale',
      class: 'Cartographer',
      characterOrigin: 'pregen',
      openingLens: 'rian',
      prologueVariant: 'pregen_rian',
      stats: { STR: 9, DEX: 13, CON: 10, INT: 16, WIS: 14, CHA: 12 },
      hp: 10,
      ac: 12,
      proficiencies: ['Investigation', 'Navigation'],
      startingInventory: [{ name: 'Folded route-slate', type: 'key_item', effect: 'Compares live routes against known charts' }],
      startingCurrency: 90,
    });

    const result = await handleSetup(['apply', '--settings', settings, '--character', character]);
    expect(result.ok).toBe(true);

    const state = await tryLoadState();
    expect(state!.openingLens).toBe('rian');
    expect(state!.prologueVariant).toBe('pregen_rian');
    expect(state!.characterOrigin).toBe('pregen');
    expect(state!.prologueComplete).toBe(false);
    expect(state!.character?.currency).toBe(90);
    expect(state!.character?.inventory[0]?.name).toBe('Folded route-slate');
    expect(state!.worldFlags.openingLens).toBe('rian');
  });

  test('infers a custom opening lens from build shape', async () => {
    const settings = JSON.stringify({ rulebook: 'd20_system', visualStyle: 'station', modules: ['gm-checklist'] });
    const character = JSON.stringify({
      name: 'Custom Diver',
      class: 'Salvage Diver',
      stats: { STR: 12, DEX: 15, CON: 13, INT: 11, WIS: 13, CHA: 10 },
      hp: 12,
      ac: 13,
      proficiencies: ['Athletics', 'Survival'],
      abilities: ['Glass hook'],
    });

    const result = await handleSetup(['apply', '--settings', settings, '--character', character]);
    expect(result.ok).toBe(true);

    const state = await tryLoadState();
    expect(state!.openingLens).toBe('suri');
    expect(state!.prologueVariant).toBe('custom_suri');
    expect(state!.characterOrigin).toBe('custom');
  });

  test('reinitialises state instead of merging with an older campaign', async () => {
    await handleState(['reset']);
    await handleState(['set', 'scene', '9']);
    await handleState(['set', 'currentRoom', 'engine_room']);
    await handleState(['set', 'visitedRooms', '["bridge","engine_room"]']);
    await handleState(['set', 'quests', '[{"id":"old","title":"Old Quest","status":"active","objectives":[]}]']);

    const settings = JSON.stringify({ rulebook: 'd20_system', visualStyle: 'station', modules: ['gm-checklist'] });
    const character = JSON.stringify({
      name: 'New Hero', pronouns: 'they/them',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      hp: 10, ac: 10, proficiencies: [], abilities: [],
    });

    const result = await handleSetup(['apply', '--settings', settings, '--character', character]);
    expect(result.ok).toBe(true);

    const state = await tryLoadState();
    expect(state!.scene).toBe(0);
    expect(state!.currentRoom).toBe('');
    expect(state!.visitedRooms).toEqual([]);
    expect(state!.quests).toEqual([]);
    expect(state!.character?.name).toBe('New Hero');
  });

  test('clears stale turn markers but preserves current pre-game verify markers', async () => {
    writeFileSync(join(tempDir, '.verified-scenario'), signMarker(0), 'utf-8');
    writeFileSync(join(tempDir, '.verified-rules'), signMarker(0), 'utf-8');
    writeFileSync(join(tempDir, '.verified-character'), signMarker(0), 'utf-8');
    writeFileSync(join(tempDir, '.last-sync'), signMarker(7), 'utf-8');
    writeFileSync(join(tempDir, '.last-verify'), signMarker(7), 'utf-8');
    writeFileSync(join(tempDir, '.needs-verify'), '7:0', 'utf-8');

    const settings = JSON.stringify({ rulebook: 'd20_system', visualStyle: 'station', modules: ['gm-checklist'] });
    const character = JSON.stringify({
      name: 'Clean Slate', pronouns: 'they/them',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      hp: 10, ac: 10, proficiencies: [], abilities: [],
    });

    const result = await handleSetup(['apply', '--settings', settings, '--character', character]);
    expect(result.ok).toBe(true);

    expect(existsSync(join(tempDir, '.last-sync'))).toBe(false);
    expect(existsSync(join(tempDir, '.last-verify'))).toBe(false);
    expect(existsSync(join(tempDir, '.needs-verify'))).toBe(false);
    expect(existsSync(join(tempDir, '.verified-scenario'))).toBe(true);
    expect(existsSync(join(tempDir, '.verified-rules'))).toBe(true);
    expect(existsSync(join(tempDir, '.verified-character'))).toBe(true);
  });
});
