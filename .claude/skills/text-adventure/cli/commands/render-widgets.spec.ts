import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleRender } from './render';
import { saveState, createDefaultState } from '../lib/state-store';
import type { GmState } from '../types';
import { extractJsonTagAttr } from '../tests/support/rendered-widget';

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
    const ship = extractJsonTagAttr<{
      name: string;
      repairParts: number;
      systems: Array<{ name: string; status: string; integrity: number }>;
      powerAllocations: Record<string, number>;
    }>(html, 'ta-ship', 'data-ship');
    expect(html).toContain('<ta-ship');
    expect(ship.name).toBe('Astral Wanderer');
    expect(ship.repairParts).toBe(5);
    expect(ship.systems.map(system => system.name)).toEqual(['engines', 'shields']);
    expect(ship.powerAllocations.engines).toBe(3);
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
    const crew = extractJsonTagAttr<Array<{ name: string; role: string; task: string }>>(html, 'ta-crew', 'data-crew');
    expect(html).toContain('<ta-crew');
    expect(crew).toHaveLength(1);
    expect(crew[0]!.name).toBe('Mara Voss');
    expect(crew[0]!.role).toBe('engineer');
    expect(crew[0]!.task).toBe('Repairing shields');
  });

  test('crew widget renders empty-state when no crew', async () => {
    const result = await handleRender(['crew', '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    const crew = extractJsonTagAttr<unknown[]>(html, 'ta-crew', 'data-crew');
    expect(html).toContain('<ta-crew');
    expect(crew).toEqual([]);
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
    const entries = extractJsonTagAttr<Array<{ id: string; state: string; discoveredAt?: number }>>(
      html,
      'ta-codex',
      'data-entries',
    );
    expect(html).toContain('<ta-codex');
    expect(entries.map(entry => entry.id)).toEqual(['ancient_beacon', 'dark_signal']);
    expect(entries[0]!.state).toBe('discovered');
    expect(entries[0]!.discoveredAt).toBe(3);
  });

  test('codex widget renders empty-state when no entries', async () => {
    const result = await handleRender(['codex', '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    const entries = extractJsonTagAttr<unknown[]>(html, 'ta-codex', 'data-entries');
    expect(html).toContain('<ta-codex');
    expect(entries).toEqual([]);
  });

  test('quest-log widget renders normalized quest data', async () => {
    state.quests = [
      {
        id: 'main',
        title: 'Secure the Bridge',
        status: 'active',
        objectives: [
          { id: 'door', description: 'Open the blast door', completed: true },
          { id: 'console', description: 'Reach the command console', completed: false },
        ],
        clues: ['The captain carried an override key.'],
      },
    ];
    await saveState(state);
    const result = await handleRender(['quest-log', '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    const quests = extractJsonTagAttr<
      Array<{
        title: string;
        currentObjectiveId: string;
        clues: Array<{ text: string }>;
      }>
    >(html, 'ta-quest-log', 'data-quests');
    expect(html).toContain('<ta-quest-log');
    expect(quests[0]!.title).toBe('Secure the Bridge');
    expect(quests[0]!.currentObjectiveId).toBe('console');
    expect(quests[0]!.clues[0]!.text).toBe('The captain carried an override key.');
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
    const map = extractJsonTagAttr<{
      current: string;
      nodes: Array<{ id: string }>;
      doorStates: Record<string, string>;
    }>(html, 'ta-map', 'data-map');
    expect(html).toContain('<ta-map');
    expect(map.current).toBe('Docking Bay 7');
    expect(map.nodes.some(node => node.id === 'Bridge')).toBe(true);
    expect(map.doorStates['bay-door']).toBe('locked');
  });

  test('map widget accepts --data route overlay', async () => {
    state.mapState = {
      activeMapType: 'dungeon',
      currentZone: 'bridge',
      visitedZones: ['bridge'],
      revealedZones: ['bridge', 'hall', 'engine'],
      doorStates: {},
      zones: [
        { id: 'bridge', name: 'Bridge', status: 'current' },
        { id: 'hall', name: 'Central Hall', status: 'revealed' },
        { id: 'engine', name: 'Engine Room', status: 'revealed' },
      ],
      connections: [
        { id: 'bridge-hall', from: 'bridge', to: 'hall', discovered: true },
        { id: 'hall-engine', from: 'hall', to: 'engine', discovered: true },
      ],
    };
    await saveState(state);
    const result = await handleRender(['map', '--raw', '--data', '{"route":{"from":"bridge","to":"engine"}}']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    const map = extractJsonTagAttr<{ route: { reachable: boolean; path: string[]; pathLabels: string[] } }>(
      html,
      'ta-map',
      'data-map',
    );
    expect(map.route.reachable).toBe(true);
    expect(map.route.path).toEqual(['bridge', 'hall', 'engine']);
    expect(map.route.pathLabels).toEqual(['Bridge', 'Central Hall', 'Engine Room']);
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
    const chart = extractJsonTagAttr<{
      current: string;
      systems: Array<{ name: string }>;
      plottedCourse: string[] | null;
    }>(html, 'ta-starchart', 'data-chart');
    expect(html).toContain('<ta-starchart');
    expect(chart.current).toBe('Sol System');
    expect(chart.systems.some(system => system.name === 'Alpha Centauri')).toBe(true);
    expect(chart.plottedCourse).toBeNull();
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
    const combat = extractJsonTagAttr<{ computation: { context?: { damage?: number } } }>(
      html,
      'ta-combat-turn',
      'data-combat',
    );
    expect(combat.computation.context?.damage).toBe(8);
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
    const combat = extractJsonTagAttr<{
      computation: { stat: string; total: number; outcome: string };
    }>(html, 'ta-combat-turn', 'data-combat');
    expect(html).toContain('<ta-combat-turn');
    expect(combat.computation.stat).toBe('DEX');
    expect(combat.computation.total).toBe(15);
    expect(combat.computation.outcome).toBe('success');
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
  test('settings widget emits ta-settings custom element', async () => {
    const data = JSON.stringify({ options: ['easy', 'hard'] });
    const result = await handleRender(['settings', '--style', 'terminal', '--data', data, '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('<ta-settings');
    expect(html).toContain('data-config=');
  });

  test('scenario-select widget works with --data and no state', async () => {
    const data = JSON.stringify({ scenarios: [{ title: 'Test', description: 'A test scenario' }] });
    const result = await handleRender(['scenario-select', '--style', 'terminal', '--data', data, '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('<ta-scenario-select');
    expect(html).toContain('Test');
    expect(html).toContain('A test scenario');
  });

  test('character-creation widget emits ta-character-creation custom element', async () => {
    const data = JSON.stringify({ archetypes: [{ name: 'Warrior', stats: {} }] });
    const result = await handleRender(['character-creation', '--style', 'terminal', '--data', data, '--raw']);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('<ta-character-creation');
    expect(html).toContain('Warrior');
  });
});
