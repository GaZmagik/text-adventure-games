import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleRender } from './render';
import { saveState, createDefaultState } from '../lib/state-store';
import type { GmState } from '../types';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-render-test-'));
  process.env.TAG_STATE_DIR = tempDir;
  // Sync gate: write a properly signed marker so render doesn't block
  // State doesn't exist yet at beforeEach time, so we sign with empty JSON
  // and the render gate will pass because scene 999 >= any test scene
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
    expect(html).toContain('ship-schematic');
    expect(html).toContain('system-card');
    expect(html).toContain('Power Allocation');
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
    expect(html).toContain('map-schematic');
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
    expect(html).toContain('starchart-canvas');
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

  test('levelup widget renders ta-levelup element with ability options from --data', async () => {
    const data = JSON.stringify({ abilities: ['Power Strike', 'Shield Bash'] });
    const result = await handleRender(['levelup', '--raw', '--data', data]);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('<ta-levelup');
    expect(html).toContain('Power Strike');
    expect(html).toContain('Shield Bash');
  });

  test('levelup widget renders without --data (no ability options)', async () => {
    const result = await handleRender(['levelup', '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('<ta-levelup');
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

  test('dialogue widget renders ta-dialogue element with NPC name from rosterMutations', async () => {
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
    expect(html).toContain('<ta-dialogue');
    expect(html).toContain('Jax Renner');
  });

  test('dialogue widget renders with no NPCs in roster', async () => {
    const result = await handleRender(['dialogue', '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('<ta-dialogue');
  });
});

// ── Pre-game widgets ─────────────────────────────────────────────────

describe('render pre-game widgets', () => {
  test('settings widget contains radiogroup and option-card', async () => {
    const data = JSON.stringify({ options: ['easy', 'hard'] });
    const result = await handleRender(['settings', '--style', 'terminal', '--data', data, '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('aria-pressed=');
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
