import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleRender } from './render';
import { saveState, createDefaultState } from '../lib/state-store';
import type { GmState } from '../types';
import { WIDGET_CSS_SCOPES } from '../metadata';
import {
  MAX_DICE_POOL_CANVAS_HEIGHT,
  MAX_DICE_POOL_TOTAL,
} from '../render/templates/dice-pool';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-render-test-'));
  process.env.TAG_STATE_DIR = tempDir;
  writeFileSync(join(tempDir, '.last-sync'), '999', 'utf-8'); // sync gate pass
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

  test('data-driven dice-pool widget renders without state', async () => {
    const result = await handleRender([
      'dice-pool',
      '--raw',
      '--data',
      '{"label":"Volley","pool":[{"dieType":"d6","count":2},{"dieType":"d8","count":1}],"modifier":2}',
    ]);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('Volley');
    expect(html).toContain('2d6 + 1d8');
    expect(html).toContain('id="dice-pool-canvas"');
  });

  test('dice-pool safely serialises hostile inline-script payloads', async () => {
    const result = await handleRender([
      'dice-pool',
      '--raw',
      '--data',
      '{"label":"</script><script>alert(1)</script>","pool":[{"dieType":"d6","count":2}],"modifier":0}',
    ]);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect((html.match(/<script>/g) ?? [])).toHaveLength(1);
    expect(html).not.toContain('</script><script>alert(1)</script>');
    expect(html).toContain('\\u003c/script\\u003e\\u003cscript\\u003ealert(1)\\u003c/script\\u003e');
  });

  test('rejects render data with forbidden keys', async () => {
    const result = await handleRender([
      'settings',
      '--raw',
      '--style',
      'terminal',
      '--data',
      '{"__proto__":{"polluted":true}}',
    ]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('forbidden keys');
  });

  test('settings safely serialises hostile defaults inside inline scripts', async () => {
    const hostileDefaults = JSON.stringify({
      defaults: {
        rulebook: '</script><script>alert(1)</script>',
      },
    });
    const result = await handleRender(['settings', '--raw', '--style', 'terminal', '--data', hostileDefaults]);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect((html.match(/<script>/g) ?? [])).toHaveLength(1);
    expect(html).toContain('\\u003c/script\\u003e\\u003cscript\\u003ealert(1)\\u003c/script\\u003e');
  });

  test('dice-pool caps total logical dice and canvas size deterministically', async () => {
    const result = await handleRender([
      'dice-pool',
      '--raw',
      '--data',
      '{"label":"Crowd Control","pool":[{"dieType":"d6","count":24},{"dieType":"d8","count":24}],"modifier":1}',
    ]);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    const canvasHeight = Number(html.match(/height="(\d+)"/)?.[1] ?? '0');
    expect(html).toContain(`Displaying ${MAX_DICE_POOL_TOTAL} of 48 dice`);
    expect(canvasHeight).toBeLessThanOrEqual(MAX_DICE_POOL_CANVAS_HEIGHT);
    expect(html).toContain(`var POOL_MAX_DICE=${MAX_DICE_POOL_TOTAL}`);
  });

  test('returns style error when state has no visualStyle', async () => {
    const state = createDefaultState();
    await saveState(state);
    const result = await handleRender(['ticker']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('No visual style');
  });

  test('requires state sync before rendering in-game widgets', async () => {
    const state = createDefaultState();
    state.visualStyle = 'terminal';
    state.scene = 4;
    await saveState(state);
    writeFileSync(join(tempDir, '.last-sync'), '2', 'utf-8');

    const result = await handleRender(['ticker']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('State sync required');
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

  test('rejects style names with invalid characters', async () => {
    const result = await handleRender(['settings', '--style', '../bad-style']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('invalid characters');
  });

  test('fails when a valid widget has no CSS scope mapping', async () => {
    const original = WIDGET_CSS_SCOPES.settings!;
    delete (WIDGET_CSS_SCOPES as Record<string, readonly string[]>).settings;
    try {
      const result = await handleRender(['settings', '--style', 'terminal']);
      expect(result.ok).toBe(false);
      expect(result.error!.message).toContain('no CSS scope mapping');
    } finally {
      (WIDGET_CSS_SCOPES as Record<string, readonly string[]>).settings = original;
    }
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

// ── Widget smoke tests ───────────────────────────────────────────────

describe('render widget smoke tests', () => {
  let state: GmState;

  beforeEach(async () => {
    state = createDefaultState();
    state.visualStyle = 'terminal';
    state.character = {
      name: 'Kira',
      class: 'Pilot',
      hp: 20,
      maxHp: 24,
      ac: 14,
      level: 4,
      xp: 3200,
      currency: 100,
      currencyName: 'Credits',
      stats: { STR: 10, DEX: 16, CON: 12, INT: 14, WIS: 11, CHA: 13 },
      modifiers: { STR: 0, DEX: 3, CON: 1, INT: 2, WIS: 0, CHA: 1 },
      proficiencyBonus: 2,
      proficiencies: ['Piloting', 'Stealth'],
      abilities: ['Evasive Manoeuvres', 'Quick Reflexes'],
      inventory: [{ name: 'Blaster', type: 'weapon', slots: 1 }],
      conditions: [],
      equipment: { weapon: 'Blaster', armour: 'Light Armour' },
    };
    state._lastComputation = {
      type: 'contested_roll',
      stat: 'DEX',
      roll: 12,
      modifier: 3,
      total: 15,
      dc: 13,
      margin: 2,
      outcome: 'success',
      npcId: 'test_npc',
      npcModifier: 1,
    };
    await saveState(state);
  });

  test('ship widget renders widget-ship element with ship data', async () => {
    state.shipState = {
      name: 'Astral Wanderer',
      systems: {
        engines: { integrity: 85, status: 'operational', conditions: [] },
        shields: { integrity: 40, status: 'degraded', conditions: ['overloaded'] },
      },
      powerAllocations: { engines: 3, shields: 2 },
      repairParts: 5,
      scenesSinceRepair: 2,
    };
    await saveState(state);
    const result = await handleRender(['ship', '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('widget-ship');
    expect(html).toContain('Astral Wanderer');
    expect(html).toContain('system-card');
    expect(html).toContain('engines');
  });

  test('ship widget renders empty-state when no shipState', async () => {
    // state has no shipState — should still render ok with an empty-state message
    const result = await handleRender(['ship', '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('widget-ship');
    expect(html).toContain('empty-state');
  });

  test('crew widget renders crew-table with NPC crew member', async () => {
    state.crewMutations = [
      {
        id: 'engineer_01',
        name: 'Mara Voss',
        pronouns: 'she/her',
        role: 'engineer',
        morale: 80,
        stress: 25,
        loyalty: 70,
        status: 'active',
        task: 'Repairing shields',
      },
    ];
    await saveState(state);
    const result = await handleRender(['crew', '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('widget-crew');
    expect(html).toContain('crew-table');
    expect(html).toContain('Mara Voss');
    expect(html).toContain('engineer');
  });

  test('crew widget renders empty-state when no crew', async () => {
    const result = await handleRender(['crew', '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('widget-crew');
    expect(html).toContain('empty-state');
  });

  test('codex widget renders entries with state badges', async () => {
    state.codexMutations = [
      { id: 'ancient_beacon', state: 'discovered', discoveredAt: 3, via: 'exploration' },
      { id: 'dark_signal', state: 'partial' },
    ];
    await saveState(state);
    const result = await handleRender(['codex', '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('widget-codex');
    expect(html).toContain('codex-entry');
    expect(html).toContain('ancient_beacon');
    expect(html).toContain('dark_signal');
    expect(html).toContain('codex-badge');
  });

  test('codex widget renders empty-state when no entries', async () => {
    const result = await handleRender(['codex', '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('widget-codex');
    expect(html).toContain('empty-state');
  });

  test('map widget renders zone list with current zone', async () => {
    state.mapState = {
      currentZone: 'Docking Bay 7',
      visitedZones: ['Docking Bay 7', 'Cargo Hold'],
      revealedZones: ['Docking Bay 7', 'Cargo Hold', 'Bridge'],
      doorStates: { 'bay-door': 'locked' },
    };
    await saveState(state);
    const result = await handleRender(['map', '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('widget-map');
    expect(html).toContain('Docking Bay 7');
    expect(html).toContain('zone-current');
    expect(html).toContain('zone-list');
  });

  test('map widget renders empty-state when no mapState', async () => {
    const result = await handleRender(['map', '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('widget-map');
    expect(html).toContain('empty-state');
  });

  test('starchart widget renders known systems list', async () => {
    state.currentRoom = 'Sol System';
    state.visitedRooms = ['Sol System', 'Alpha Centauri', 'Proxima'];
    await saveState(state);
    const result = await handleRender(['starchart', '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('widget-starchart');
    expect(html).toContain('Sol System');
    expect(html).toContain('system-current');
    expect(html).toContain('system-list');
    expect(html).toContain('Alpha Centauri');
  });

  test('starchart widget shows empty state when no rooms visited', async () => {
    // visitedRooms is absent on a fresh default state — empty-state branch fires
    const result = await handleRender(['starchart', '--style', 'terminal']);
    expect(result.ok).toBe(true);
    const html = (result.data as { html: string }).html;
    expect(html).toContain('empty-state');
  });

  test('combat-turn widget shows damage when hit with context.damage', async () => {
    state._lastComputation = {
      type: 'contested_roll',
      stat: 'STR',
      roll: 18,
      modifier: 3,
      total: 21,
      margin: 6,
      outcome: 'success',
      npcId: 'test_npc',
      npcModifier: 1,
      context: { damage: 8, damageType: 'slashing' },
    };
    await saveState(state);
    const result = await handleRender(['combat-turn', '--style', 'terminal']);
    expect(result.ok).toBe(true);
    const html = (result.data as { html: string }).html;
    expect(html).toContain('8'); // damage value
  });

  test('levelup widget renders level-up banner with ability options from --data', async () => {
    const data = JSON.stringify({ abilities: ['Power Strike', 'Shield Bash'] });
    const result = await handleRender(['levelup', '--raw', '--data', data]);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('widget-levelup');
    expect(html).toContain('levelup-banner');
    expect(html).toContain('Power Strike');
    expect(html).toContain('Shield Bash');
    expect(html).toContain('ability-card');
  });

  test('levelup widget renders without --data (no ability options)', async () => {
    const result = await handleRender(['levelup', '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('widget-levelup');
    expect(html).toContain('levelup-banner');
    expect(html).toContain('Level Up!');
  });

  test('combat-turn widget renders roll breakdown and outcome badge', async () => {
    const result = await handleRender(['combat-turn', '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('widget-combat');
    expect(html).toContain('combat-roll');
    expect(html).toContain('combat-outcome');
    expect(html).toContain('DEX');
    expect(html).toContain('15'); // total
  });

  test('dialogue widget renders NPC name and disposition badge from rosterMutations', async () => {
    state.rosterMutations = [
      {
        id: 'trader_01',
        name: 'Jax Renner',
        pronouns: 'he/him',
        role: 'trader',
        tier: 'rival',
        level: 2,
        stats: { STR: 10, DEX: 12, CON: 10, INT: 14, WIS: 11, CHA: 15 },
        modifiers: { STR: 0, DEX: 1, CON: 0, INT: 2, WIS: 0, CHA: 2 },
        hp: 18,
        maxHp: 18,
        ac: 12,
        soak: 0,
        damageDice: '1d6',
        status: 'active',
        alive: true,
        trust: 40,
        disposition: 'neutral',
        dispositionSeed: 42,
      },
    ];
    await saveState(state);
    const result = await handleRender(['dialogue', '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('widget-dialogue');
    expect(html).toContain('dialogue-header');
    expect(html).toContain('Jax Renner');
    expect(html).toContain('dialogue-disposition');
  });

  test('dialogue widget renders with no NPCs in roster', async () => {
    // rosterMutations is empty by default — renders with fallback NPC name
    const result = await handleRender(['dialogue', '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('widget-dialogue');
    expect(html).toContain('dialogue-header');
  });
});

// ── Pre-game widgets ─────────────────────────────────────────────────

describe('render pre-game widgets', () => {
  test('settings widget contains radiogroup and option-card', async () => {
    const data = JSON.stringify({ options: ['easy', 'hard'] });
    const result = await handleRender(['settings', '--style', 'terminal', '--data', data, '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('class="option-card');
  });

  test('scenario-select widget works with --data and no state', async () => {
    const data = JSON.stringify({ scenarios: [{ title: 'Test', description: 'A test scenario' }] });
    const result = await handleRender(['scenario-select', '--style', 'terminal', '--data', data, '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('Test');
    expect(html).toContain('A test scenario');
    expect(html).toContain('scenario-select-btn');
  });

  test('character-creation widget contains archetype-card and aria-pressed', async () => {
    const data = JSON.stringify({ archetypes: [{ name: 'Warrior', stats: {} }] });
    const result = await handleRender(['character-creation', '--style', 'terminal', '--data', data, '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('class="archetype-card"');
    expect(html).toContain('aria-pressed');
  });
});

// ── Phase 5: Module checklist ────────────────────────────────────────

describe('render modulesRequired and featureChecklist', () => {
  let state: GmState;

  beforeEach(async () => {
    state = createDefaultState();
    state.visualStyle = 'terminal';
    state.character = {
      name: 'Kira',
      class: 'Pilot',
      hp: 20,
      maxHp: 24,
      ac: 14,
      level: 4,
      xp: 3200,
      currency: 100,
      currencyName: 'Credits',
      stats: { STR: 10, DEX: 16, CON: 12, INT: 14, WIS: 11, CHA: 13 },
      modifiers: { STR: 0, DEX: 3, CON: 1, INT: 2, WIS: 0, CHA: 1 },
      proficiencyBonus: 2,
      proficiencies: ['Piloting'],
      abilities: ['Evasive Manoeuvres'],
      inventory: [],
      conditions: [],
      equipment: { weapon: 'Blaster', armour: 'Light Armour' },
    };
    state._lastComputation = {
      type: 'contested_roll',
      stat: 'DEX',
      roll: 12,
      modifier: 3,
      total: 15,
      dc: 13,
      margin: 2,
      outcome: 'success',
      npcId: 'test_npc',
      npcModifier: 1,
    };
  });

  test('modulesRequired is present in render output', async () => {
    state.modulesActive = ['core-systems'];
    await saveState(state);
    const result = await handleRender(['ticker']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.modulesRequired).toBeDefined();
    expect(Array.isArray(data.modulesRequired)).toBe(true);
  });

  test('modulesRequired always includes prose-craft', async () => {
    state.modulesActive = ['core-systems', 'audio'];
    await saveState(state);
    const result = await handleRender(['ticker']);
    const data = result.data as Record<string, unknown>;
    const paths = data.modulesRequired as string[];
    expect(paths).toContain('modules/prose-craft.md');
  });

  test('modulesRequired maps active modules to correct file paths', async () => {
    state.modulesActive = ['audio', 'atmosphere'];
    await saveState(state);
    const result = await handleRender(['ticker']);
    const data = result.data as Record<string, unknown>;
    const paths = data.modulesRequired as string[];
    expect(paths).toContain('modules/audio.md');
    expect(paths).toContain('modules/atmosphere.md');
  });

  test('featureChecklist is present in render output', async () => {
    state.modulesActive = ['prose-craft'];
    await saveState(state);
    const result = await handleRender(['ticker']);
    const data = result.data as Record<string, unknown>;
    expect(data.featureChecklist).toBeDefined();
    expect(Array.isArray(data.featureChecklist)).toBe(true);
  });

  test('featureChecklist includes audio instruction when audio is active', async () => {
    state.modulesActive = ['audio', 'core-systems'];
    await saveState(state);
    const result = await handleRender(['ticker']);
    const data = result.data as Record<string, unknown>;
    const items = data.featureChecklist as string[];
    expect(items.some(i => i.includes('audio') && i.includes('Web Audio'))).toBe(true);
  });

  test('non-scene widget still gets modulesRequired and featureChecklist', async () => {
    state.modulesActive = ['prose-craft', 'atmosphere'];
    await saveState(state);
    const result = await handleRender(['dice']);
    const data = result.data as Record<string, unknown>;
    expect(data.modulesRequired).toBeDefined();
    expect(data.featureChecklist).toBeDefined();
    expect((data.modulesRequired as string[]).length).toBeGreaterThan(0);
  });
});

// ── Phase 11: Required elements and skeleton ────────────────────────

describe('render requiredElements and skeleton', () => {
  let state: GmState;

  beforeEach(async () => {
    state = createDefaultState();
    state.visualStyle = 'terminal';
    state.character = {
      name: 'Kira',
      class: 'Pilot',
      hp: 20,
      maxHp: 24,
      ac: 14,
      level: 4,
      xp: 3200,
      currency: 100,
      currencyName: 'Credits',
      stats: { STR: 10, DEX: 16, CON: 12, INT: 14, WIS: 11, CHA: 13 },
      modifiers: { STR: 0, DEX: 3, CON: 1, INT: 2, WIS: 0, CHA: 1 },
      proficiencyBonus: 2,
      proficiencies: ['Piloting'],
      abilities: ['Evasive Manoeuvres'],
      inventory: [],
      conditions: [],
      equipment: { weapon: 'Blaster', armour: 'Light Armour' },
    };
    state._lastComputation = {
      type: 'contested_roll',
      stat: 'DEX',
      roll: 12,
      modifier: 3,
      total: 15,
      dc: 13,
      margin: 2,
      outcome: 'success',
      npcId: 'test_npc',
      npcModifier: 1,
    };
  });

  test('requiredElements is present in render output', async () => {
    state.modulesActive = ['core-systems'];
    await saveState(state);
    const result = await handleRender(['ticker']);
    const data = result.data as Record<string, unknown>;
    expect(data.requiredElements).toBeDefined();
    expect(Array.isArray(data.requiredElements)).toBe(true);
    expect((data.requiredElements as string[]).length).toBeGreaterThan(0);
  });

  test('requiredElements includes atmosphere when atmosphere is active', async () => {
    state.modulesActive = ['atmosphere'];
    await saveState(state);
    const result = await handleRender(['ticker']);
    const data = result.data as Record<string, unknown>;
    const elems = data.requiredElements as string[];
    expect(elems.some(e => e.includes('scene-atmosphere'))).toBe(true);
  });

  test('requiredElements includes audio toggle when audio is active', async () => {
    state.modulesActive = ['audio'];
    await saveState(state);
    const result = await handleRender(['ticker']);
    const data = result.data as Record<string, unknown>;
    const elems = data.requiredElements as string[];
    expect(elems.some(e => e.includes('scene-audio-toggle'))).toBe(true);
  });

  test('skeleton is non-empty string for scene widget', async () => {
    state.modulesActive = ['prose-craft', 'core-systems'];
    await saveState(state);
    const result = await handleRender(['scene']);
    const data = result.data as Record<string, unknown>;
    expect(typeof data.skeleton).toBe('string');
    expect((data.skeleton as string).length).toBeGreaterThan(0);
  });

  test('skeleton contains placeholder markers', async () => {
    state.modulesActive = ['prose-craft'];
    await saveState(state);
    const result = await handleRender(['scene']);
    const data = result.data as Record<string, unknown>;
    const skel = data.skeleton as string;
    expect(skel).toContain('<!-- [NARRATIVE:');
    expect(skel).toContain('<!-- [ACTIONS:');
    expect(skel).toContain('<!-- [META:');
  });

  test('skeleton uses semantic class names', async () => {
    state.modulesActive = ['atmosphere', 'audio'];
    await saveState(state);
    const result = await handleRender(['scene']);
    const data = result.data as Record<string, unknown>;
    const skel = data.skeleton as string;
    expect(skel).toContain('scene-container');
    expect(skel).toContain('scene-narrative');
    expect(skel).toContain('scene-actions');
    expect(skel).toContain('scene-footer');
    expect(skel).toContain('scene-atmosphere');
    expect(skel).toContain('scene-audio-toggle');
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
      npcId: 'test_npc',
      npcModifier: 1,
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

  test('dice widget starts in pre-roll state', async () => {
    const result = await handleRender(['dice', '--raw']);
    const html = result.data as string;
    expect(html).toContain('STR');
    expect(html).toContain('id="hi"');
    expect(html).toContain('CLICK THE DIE TO ROLL');
    expect(html).toContain('id="ra"');
    expect(html).toContain('class="tt"');
    expect(html).toContain('id="cv"');
    expect(html).toContain('var MOD=3,DC=15,rolling=false,locked=false;');
    expect(html).not.toContain('id="dice-result"');
    expect(html).not.toContain('aria-label=');
    expect(html).not.toContain('<span class="rv">14</span>');
    expect(html).not.toContain('rolled 14+3 = 17');
  });

  test('dice-pool widget renders grouped pre-roll state', async () => {
    const result = await handleRender([
      'dice-pool',
      '--raw',
      '--data',
      '{"label":"Boss Damage","pool":[{"dieType":"d6","count":2},{"dieType":"d8","count":2},{"dieType":"d10","count":3},{"dieType":"d20","count":1}],"modifier":4}',
    ]);
    const html = result.data as string;
    expect(html).toContain('Boss Damage');
    expect(html).toContain('2d6 + 2d8 + 3d10 + 1d20');
    expect(html).toContain('id="dice-pool-hint"');
    expect(html).toContain('CLICK THE POOL TO ROLL');
    expect(html).toContain('id="dice-pool-result"');
    expect(html).toContain('var POOL_MODIFIER=4;');
    expect(html).toContain('aria-label="Boss Damage. Click to roll the dice pool."');
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

  test('save-div widget contains hidden save data with valid JSON payload', async () => {
    const result = await handleRender(['save-div', '--raw']);
    const html = result.data as string;
    expect(html).toContain('id="save-data"');
    expect(html).toContain('display:none');
    // Extract data-payload attribute and verify it contains valid JSON with _version
    const payloadMatch = html.match(/data-payload='([^']*)'/);
    expect(payloadMatch).not.toBeNull();
    const payload = JSON.parse(payloadMatch![1]!.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"));
    expect(payload._version).toBe(1);
    expect(payload.scene).toBe(0);
    expect(payload.character.name).toBe('Aldric');
  });
});
