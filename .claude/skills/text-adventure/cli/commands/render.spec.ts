import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { handleRender } from './render';
import { saveState, createDefaultState } from '../lib/state-store';
import type { GmState } from '../types';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-render-test-'));
  process.env.TAG_STATE_DIR = tempDir;
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) {
    process.env.TAG_STATE_DIR = originalEnv;
  } else {
    delete process.env.TAG_STATE_DIR;
  }
});

// ── Argument validation ──────────────────────────────────────────────

describe('render argument validation', () => {
  test('returns error when no widget type specified', async () => {
    const result = await handleRender([]);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('No widget type');
  });

  test('returns error for unknown widget type', async () => {
    const result = await handleRender(['nonexistent']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('Unknown widget type');
  });
});

// ── State requirement ────────────────────────────────────────────────

describe('render state requirement', () => {
  test('returns error when no state exists for in-game widget', async () => {
    const result = await handleRender(['ticker']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('No game state');
  });

  test('returns style error when state has no visualStyle', async () => {
    const state = createDefaultState();
    await saveState(state);
    const result = await handleRender(['ticker']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('No visual style');
  });
});

// ── Style resolution ─────────────────────────────────────────────────

describe('render style resolution', () => {
  test('--style flag overrides state visualStyle', async () => {
    const state = createDefaultState();
    state.visualStyle = 'parchment';
    await saveState(state);

    // terminal style exists in the styles/ directory
    const result = await handleRender(['ticker', '--style', 'terminal']);
    expect(result.ok).toBe(true);
    const data = result.data as { style: string };
    expect(data.style).toBe('terminal');
  });

  test('falls back to state visualStyle when no --style flag', async () => {
    const state = createDefaultState();
    state.visualStyle = 'terminal';
    await saveState(state);

    const result = await handleRender(['ticker']);
    expect(result.ok).toBe(true);
    const data = result.data as { style: string };
    expect(data.style).toBe('terminal');
  });

  test('returns error for nonexistent style file', async () => {
    const state = createDefaultState();
    state.visualStyle = 'does-not-exist-xyz';
    await saveState(state);

    const result = await handleRender(['ticker']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('not found or contains no CSS');
  });
});

// ── Output modes ─────────────────────────────────────────────────────

describe('render output modes', () => {
  test('returns JSON-wrapped output by default', async () => {
    const state = createDefaultState();
    state.visualStyle = 'terminal';
    await saveState(state);

    const result = await handleRender(['ticker']);
    expect(result.ok).toBe(true);
    const data = result.data as { widget: string; style: string; html: string };
    expect(data.widget).toBe('ticker');
    expect(data.style).toBe('terminal');
    expect(typeof data.html).toBe('string');
    expect(data.html).toContain('<style>');
  });

  test('--raw flag returns HTML string directly', async () => {
    const state = createDefaultState();
    state.visualStyle = 'terminal';
    await saveState(state);

    const result = await handleRender(['ticker', '--raw']);
    expect(result.ok).toBe(true);
    expect(typeof result.data).toBe('string');
    expect(result.data as string).toContain('<style>');
  });
});

// ── Pre-game widgets ─────────────────────────────────────────────────

describe('render pre-game widgets', () => {
  test('settings widget works with --data and no state', async () => {
    const data = JSON.stringify({ options: ['easy', 'hard'] });
    const result = await handleRender(['settings', '--style', 'terminal', '--data', data]);
    expect(result.ok).toBe(true);
  });

  test('scenario-select widget works with --data and no state', async () => {
    const data = JSON.stringify({ scenarios: [{ title: 'Test', description: 'A test scenario' }] });
    const result = await handleRender(['scenario-select', '--style', 'terminal', '--data', data]);
    expect(result.ok).toBe(true);
  });

  test('character-creation widget works with --data and no state', async () => {
    const data = JSON.stringify({ archetypes: [{ name: 'Warrior', stats: {} }] });
    const result = await handleRender(['character-creation', '--style', 'terminal', '--data', data]);
    expect(result.ok).toBe(true);
  });
});

// ── Template rendering ───────────────────────────────────────────────

describe('render template output', () => {
  let state: GmState;

  beforeEach(async () => {
    state = createDefaultState();
    state.visualStyle = 'terminal';
    state.character = {
      name: 'Aldric',
      class: 'Fighter',
      hp: 28,
      maxHp: 35,
      ac: 16,
      level: 3,
      xp: 2400,
      currency: 50,
      currencyName: 'Gold',
      stats: { STR: 16, DEX: 12, CON: 14, INT: 10, WIS: 13, CHA: 8 },
      modifiers: { STR: 3, DEX: 1, CON: 2, INT: 0, WIS: 1, CHA: -1 },
      proficiencyBonus: 2,
      proficiencies: ['Athletics', 'Intimidation'],
      abilities: ['Second Wind', 'Action Surge'],
      inventory: [{ name: 'Longsword', type: 'weapon', slots: 1 }],
      conditions: [],
      equipment: { weapon: 'Longsword', armour: 'Chain Mail' },
    };
    state.modulesActive = ['prose-craft', 'core-systems', 'ai-npc'];
    state._lastComputation = {
      type: 'contested_roll',
      stat: 'STR',
      roll: 14,
      modifier: 3,
      total: 17,
      dc: 15,
      margin: 2,
      outcome: 'success',
    };
    state.time = {
      period: 'evening',
      date: 'Day 5',
      elapsed: 5,
      hour: 19,
      playerKnowsDate: true,
      playerKnowsTime: true,
      calendarSystem: 'elapsed-only',
      deadline: null,
    };
    await saveState(state);
  });

  test('scene widget contains progressive reveal structure', async () => {
    const result = await handleRender(['scene', '--raw']);
    const html = result.data as string;
    expect(html).toContain('id="reveal-brief"');
    expect(html).toContain('id="reveal-full"');
    expect(html).toContain('id="scene-content"');
    expect(html).toContain('id="panel-overlay"');
    expect(html).toContain('id="scene-meta"');
    expect(html).toContain('footer-row');
  });

  test('character widget shows stats and inventory', async () => {
    const result = await handleRender(['character', '--raw']);
    const html = result.data as string;
    expect(html).toContain('Aldric');
    expect(html).toContain('Fighter');
    expect(html).toContain('Longsword');
    expect(html).toContain('STR');
  });

  test('dice widget shows roll result', async () => {
    const result = await handleRender(['dice', '--raw']);
    const html = result.data as string;
    expect(html).toContain('STR');
    expect(html).toContain('14');
    expect(html).toContain('+3');
    expect(html).toContain('17');
    expect(html).toContain('DC 15');
  });

  test('ticker widget shows time data', async () => {
    const result = await handleRender(['ticker', '--raw']);
    const html = result.data as string;
    expect(html).toContain('evening');
    expect(html).toContain('Day 5');
  });

  test('footer widget includes Character and Save buttons', async () => {
    const result = await handleRender(['footer', '--raw']);
    const html = result.data as string;
    expect(html).toContain('data-panel="character"');
    expect(html).toContain('id="save-btn"');
    expect(html).toContain('data-panel="quests"'); // core-systems is active
  });

  test('recap widget contains session summary elements', async () => {
    const result = await handleRender(['recap', '--raw']);
    const html = result.data as string;
    expect(html).toContain('Aldric');
    expect(html).toContain('widget-recap');
  });

  test('save-div widget contains hidden save data', async () => {
    const result = await handleRender(['save-div', '--raw']);
    const html = result.data as string;
    expect(html).toContain('id="save-data"');
    expect(html).toContain('display:none');
  });
});
