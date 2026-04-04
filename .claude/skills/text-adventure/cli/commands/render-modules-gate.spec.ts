import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleRender } from './render';
import { saveState, createDefaultState } from '../lib/state-store';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-modgate-test-'));
  process.env.TAG_STATE_DIR = tempDir;
  const { signMarker, clearStateDirCache } = require('./verify');
  clearStateDirCache();
  writeFileSync(join(tempDir, '.last-sync'), signMarker(999, '{}'), 'utf-8');
  writeFileSync(join(tempDir, '.verified-scenario'), signMarker(0), 'utf-8');
  writeFileSync(join(tempDir, '.verified-rules'), signMarker(0), 'utf-8');
  writeFileSync(join(tempDir, '.verified-character'), signMarker(0), 'utf-8');
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) process.env.TAG_STATE_DIR = originalEnv;
  else delete process.env.TAG_STATE_DIR;
});

describe('_modulesRead render gate', () => {
  test('scene render fails when _modulesRead is empty', async () => {
    const state = createDefaultState();
    state.scene = 1;
    state.currentRoom = 'bridge';
    state.visualStyle = 'station';
    state.modulesActive = [
      'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
      'character-creation', 'save-codex',
    ];
    state._modulesRead = [];
    state.character = {
      name: 'Test', class: 'Scout', hp: 10, maxHp: 10, ac: 12,
      level: 1, xp: 0, currency: 0, currencyName: 'credits',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2, proficiencies: [], abilities: [],
      inventory: [], conditions: [],
      equipment: { weapon: 'Knife', armour: 'Vest' },
    };
    await saveState(state);

    const result = await handleRender(['scene', '--style', 'station']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('_modulesRead');
    expect(result.error?.corrective).toContain('tag module activate-tier 1');
  });

  test('scene render fails when only some Tier 1 modules read', async () => {
    const state = createDefaultState();
    state.scene = 1;
    state.currentRoom = 'bridge';
    state.visualStyle = 'station';
    state.modulesActive = [
      'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
      'character-creation', 'save-codex',
    ];
    state._modulesRead = ['gm-checklist', 'prose-craft'];
    state.character = {
      name: 'Test', class: 'Scout', hp: 10, maxHp: 10, ac: 12,
      level: 1, xp: 0, currency: 0, currencyName: 'credits',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2, proficiencies: [], abilities: [],
      inventory: [], conditions: [],
      equipment: { weapon: 'Knife', armour: 'Vest' },
    };
    await saveState(state);

    const result = await handleRender(['scene', '--style', 'station']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('Tier 1');
  });

  test('scene render succeeds when all Tier 1 modules in _modulesRead', async () => {
    const state = createDefaultState();
    state.scene = 1;
    state.currentRoom = 'bridge';
    state.visualStyle = 'station';
    state.modulesActive = [
      'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
      'character-creation', 'save-codex',
    ];
    state._modulesRead = [
      'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
      'character-creation', 'save-codex',
    ];
    state.character = {
      name: 'Test', class: 'Scout', hp: 10, maxHp: 10, ac: 12,
      level: 1, xp: 0, currency: 0, currencyName: 'credits',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2, proficiencies: [], abilities: [],
      inventory: [], conditions: [],
      equipment: { weapon: 'Knife', armour: 'Vest' },
    };
    state._proseCraftEpoch = 0;
    state._styleReadEpoch = 0;
    await saveState(state);

    const result = await handleRender(['scene', '--style', 'station']);
    expect(result.ok).toBe(true);
  });

  test('gate does not apply to pre-game widgets', async () => {
    const state = createDefaultState();
    state._modulesRead = [];
    await saveState(state);

    const result = await handleRender(['settings', '--style', 'station']);
    expect(result.ok).toBe(true);
  });

  test('gate does not apply to non-scene in-game widgets', async () => {
    const state = createDefaultState();
    state.scene = 1;
    state.currentRoom = 'bridge';
    state.visualStyle = 'station';
    state.modulesActive = [
      'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
      'character-creation', 'save-codex',
    ];
    state._modulesRead = [];
    state.character = {
      name: 'Test', class: 'Scout', hp: 10, maxHp: 10, ac: 12,
      level: 1, xp: 0, currency: 0, currencyName: 'credits',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2, proficiencies: [], abilities: [],
      inventory: [], conditions: [],
      equipment: { weapon: 'Knife', armour: 'Vest' },
    };
    await saveState(state);

    // character widget is not gated
    const result = await handleRender(['character', '--style', 'station']);
    expect(result.ok).toBe(true);
  });

  test('error message lists missing modules', async () => {
    const state = createDefaultState();
    state.scene = 1;
    state.currentRoom = 'bridge';
    state.visualStyle = 'station';
    state.modulesActive = [
      'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
      'character-creation', 'save-codex',
    ];
    state._modulesRead = ['gm-checklist', 'prose-craft', 'core-systems'];
    state.character = {
      name: 'Test', class: 'Scout', hp: 10, maxHp: 10, ac: 12,
      level: 1, xp: 0, currency: 0, currencyName: 'credits',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2, proficiencies: [], abilities: [],
      inventory: [], conditions: [],
      equipment: { weapon: 'Knife', armour: 'Vest' },
    };
    await saveState(state);

    const result = await handleRender(['scene', '--style', 'station']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('die-rolls');
    expect(result.error?.message).toContain('character-creation');
    expect(result.error?.message).toContain('save-codex');
  });
});
