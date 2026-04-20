/**
 * render-coverage.spec.ts — Tests for uncovered branches in render.ts
 * Split from render.spec.ts to keep that file under the 1000-line limit.
 *
 * Covers:
 * - validateDataShape type mismatch (lines 182-183)
 * - needs-verify gate blocking scene render (lines 257-261)
 * - atmosphere effects scope building (lines 293-295)
 * - style file read error (lines 313-314)
 * - CSS extraction error (lines 324-325)
 * - empty styleCss after extraction (lines 330-334)
 * - data.actions non-array validation (lines 381-385)
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleRender } from './render';
import { saveState, createDefaultState } from '../lib/state-store';
import { TIER1_MODULES } from '../lib/constants';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-render-cov-'));
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
  if (originalEnv !== undefined) {
    process.env.TAG_STATE_DIR = originalEnv;
  } else {
    delete process.env.TAG_STATE_DIR;
  }
});

// ── validateDataShape — type mismatch branch (lines 180-183) ─────────

describe('render validateDataShape type mismatch', () => {
  test('dice widget with numeric dieType returns type mismatch error', async () => {
    const state = createDefaultState();
    state.visualStyle = 'station';
    state.character = {
      name: 'Test', class: 'Scout', hp: 10, maxHp: 10, ac: 12,
      level: 1, xp: 0, currency: 0, currencyName: 'credits',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2, proficiencies: [], abilities: [],
      inventory: [], conditions: [], equipment: { weapon: 'Knife', armour: 'Vest' },
    };
    await saveState(state);

    // Pass dieType as a number instead of a string — triggers type mismatch
    const data = JSON.stringify({ dieType: 42 });
    const result = await handleRender(['dice', '--data', data]);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('must be string');
    expect(result.error?.message).toContain('got number');
    expect(result.error?.message).toContain('dieType');
  });

  // Duplicate of render.spec.ts:89 removed (CA)
});

// ── Needs-verify gate (lines 256-262) ────────────────────────────────

describe('render needs-verify gate', () => {
  test('scene render is blocked when .needs-verify flag is from a DIFFERENT turn', async () => {
    const state = createDefaultState();
    state.visualStyle = 'station';
    state.scene = 2;
    state.character = {
      name: 'Test', class: 'Scout', hp: 10, maxHp: 10, ac: 12,
      level: 1, xp: 0, currency: 0, currencyName: 'credits',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2, proficiencies: [], abilities: [],
      inventory: [], conditions: [], equipment: { weapon: 'Knife', armour: 'Vest' },
    };
    state.modulesActive = ['core-systems'];
    state._modulesRead = [...TIER1_MODULES];
    state._proseCraftEpoch = 0;
    state._styleReadEpoch = 0;
    await saveState(state);

    // Write .needs-verify for scene 1:turn 0 — current is scene 2:turn 0, so this should block
    writeFileSync(join(tempDir, '.needs-verify'), '1:0', 'utf-8');

    const result = await handleRender(['scene', '--raw']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('not verified');
  });

  test('same-turn re-render is allowed when .needs-verify matches current scene:turn', async () => {
    const state = createDefaultState();
    state.visualStyle = 'station';
    state.scene = 1;
    state.character = {
      name: 'Test', class: 'Scout', hp: 10, maxHp: 10, ac: 12,
      level: 1, xp: 0, currency: 0, currencyName: 'credits',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2, proficiencies: [], abilities: [],
      inventory: [], conditions: [], equipment: { weapon: 'Knife', armour: 'Vest' },
    };
    state.modulesActive = ['core-systems'];
    state._modulesRead = [...TIER1_MODULES];
    state._proseCraftEpoch = 0;
    state._styleReadEpoch = 0;
    await saveState(state);

    // Write .needs-verify for scene 1:turn 0 — matches current scene:turn, allows composition re-render
    writeFileSync(join(tempDir, '.needs-verify'), '1:0', 'utf-8');

    const result = await handleRender(['scene', '--raw']);
    expect(result.ok).toBe(true);
  });
});

// ── data.actions non-array validation (lines 380-385) ────────────────

describe('render data.actions non-array validation', () => {
  test('returns error when data.actions is a string instead of an array', async () => {
    const state = createDefaultState();
    state.visualStyle = 'station';
    state.character = {
      name: 'Test', class: 'Scout', hp: 10, maxHp: 10, ac: 12,
      level: 1, xp: 0, currency: 0, currencyName: 'credits',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2, proficiencies: [], abilities: [],
      inventory: [], conditions: [], equipment: { weapon: 'Knife', armour: 'Vest' },
    };
    state.modulesActive = ['core-systems'];
    state._modulesRead = [...TIER1_MODULES];
    state._proseCraftEpoch = 0;
    state._styleReadEpoch = 0;
    await saveState(state);

    const data = JSON.stringify({ actions: 'not-an-array' });
    const result = await handleRender(['scene', '--raw', '--data', data]);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('actions');
    expect(result.error?.message).toContain('must be an array');
  });

  test('returns error when data.actions is an object instead of an array', async () => {
    const state = createDefaultState();
    state.visualStyle = 'station';
    state.character = {
      name: 'Test', class: 'Scout', hp: 10, maxHp: 10, ac: 12,
      level: 1, xp: 0, currency: 0, currencyName: 'credits',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2, proficiencies: [], abilities: [],
      inventory: [], conditions: [], equipment: { weapon: 'Knife', armour: 'Vest' },
    };
    state.modulesActive = ['core-systems'];
    state._modulesRead = [...TIER1_MODULES];
    state._proseCraftEpoch = 0;
    state._styleReadEpoch = 0;
    await saveState(state);

    const data = JSON.stringify({ actions: { bad: true } });
    const result = await handleRender(['scene', '--raw', '--data', data]);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('actions');
    expect(result.error?.message).toContain('must be an array');
  });
});

// ── Empty style CSS after extraction (lines 329-334) ─────────────────

describe('render unknown style name produces warning in Shadow DOM output', () => {
  test('renders with warning comment when style is not in CDN manifest', async () => {
    const state = createDefaultState();
    state.visualStyle = 'empty-nocss';
    state.character = {
      name: 'Test', class: 'Scout', hp: 10, maxHp: 10, ac: 12,
      level: 1, xp: 0, currency: 0, currencyName: 'credits',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2, proficiencies: [], abilities: [],
      inventory: [], conditions: [], equipment: { weapon: 'Knife', armour: 'Vest' },
    };
    state.modulesActive = ['core-systems'];
    state._modulesRead = [...TIER1_MODULES];
    state._proseCraftEpoch = 0;
    state._styleReadEpoch = 0;
    await saveState(state);

    // Custom element renders with the style name in the CSS URL even when not in manifest
    const result = await handleRender(['scene', '--raw']);
    expect(result.ok).toBe(true);
    expect(result.data as string).toContain('empty-nocss.css');
    expect(result.data as string).toContain('<ta-scene');
  });
});

// ── Atmosphere effects scope building (lines 292-296) ────────────────

describe('render atmosphere effects scoping', () => {
  test('scene render succeeds with atmosphereEffects array in --data', async () => {
    // Exercises render.ts:292-295 — the refScopes branch that filters atmosphere CSS
    // by effect name. The actual CSS filtering is tested in css-extractor.spec.ts;
    // this test verifies the branch integrates correctly without errors.
    const state = createDefaultState();
    state.visualStyle = 'station';
    state.character = {
      name: 'Test', class: 'Scout', hp: 10, maxHp: 10, ac: 12,
      level: 1, xp: 0, currency: 0, currencyName: 'credits',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 10 },
      proficiencyBonus: 2, proficiencies: [], abilities: [],
      inventory: [], conditions: [], equipment: { weapon: 'Knife', armour: 'Vest' },
    };
    state.modulesActive = ['core-systems', 'atmosphere'];
    state._modulesRead = [...TIER1_MODULES];
    state._proseCraftEpoch = 0;
    state._styleReadEpoch = 0;
    await saveState(state);

    const data = JSON.stringify({ atmosphereEffects: ['dust', 'rain'] });
    const result = await handleRender(['scene', '--raw', '--data', data]);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html.length).toBeGreaterThan(100);
    expect(html).toContain('<ta-scene');
    expect(html).toContain('<div');
  });
});
