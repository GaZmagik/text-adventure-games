import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleRender } from './render';
import { saveState, loadState, createDefaultState } from '../lib/state-store';
import type { GmState } from '../types';
import { TIER1_MODULES } from '../lib/constants';
import { extractJsonTagAttr, extractTagAttr } from '../tests/support/rendered-widget';

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
    state._modulesRead = [...TIER1_MODULES];
    state._proseCraftEpoch = 0;
    state._styleReadEpoch = 0;
  });

  test('craftGuidance includes prose and rendering guidance', async () => {
    state.modulesActive = ['core-systems'];
    await saveState(state);
    const result = await handleRender(['ticker']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const guidance = data.craftGuidance as {
      proseChecklist: string[];
      renderingRules: string[];
    };
    expect(Array.isArray(guidance.proseChecklist)).toBe(true);
    expect(Array.isArray(guidance.renderingRules)).toBe(true);
    expect(guidance.proseChecklist.some(item => item.includes('Zero meta-commentary'))).toBe(true);
    expect(guidance.renderingRules.some(item => item.includes('div#scene-meta[data-meta]'))).toBe(true);
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
    state._modulesRead = [...TIER1_MODULES];
    state._proseCraftEpoch = 0;
    state._styleReadEpoch = 0;
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
    expect(elems.some(e => e.includes("class='atmo-strip'"))).toBe(true);
  });

  test('requiredElements includes audio toggle when audio is active', async () => {
    state.modulesActive = ['audio'];
    await saveState(state);
    const result = await handleRender(['ticker']);
    const data = result.data as Record<string, unknown>;
    const elems = data.requiredElements as string[];
    expect(elems.some(e => e.includes("id='audio-btn'"))).toBe(true);
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
    expect(skel).toContain('<!-- [BRIEF:');
    expect(skel).toContain('<!-- [NARRATIVE:');
    expect(skel).toContain('<!-- [FOOTER:');
  });

  test('skeleton uses semantic class names', async () => {
    state.modulesActive = ['atmosphere', 'audio'];
    await saveState(state);
    const result = await handleRender(['scene']);
    const data = result.data as Record<string, unknown>;
    const skel = data.skeleton as string;
    expect(skel).toContain('id="scene-content"');
    expect(skel).toContain('class="loc-bar"');
    expect(skel).toContain('class="narrative"');
    expect(skel).toContain('class="status-bar"');
    expect(skel).toContain('class="atmo-strip"');
    expect(skel).toContain('id="audio-btn"');
    expect(skel).toContain('class="footer-row"');
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
    state._modulesRead = [...TIER1_MODULES];
    state._proseCraftEpoch = 0;
    state._styleReadEpoch = 0;
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
    expect(html).toContain('<ta-footer');
  });

  test('scene --data renders action cards, POIs, audio recipe, and compact panels', async () => {
    state.modulesActive = ['prose-craft', 'core-systems', 'geo-map'];
    state.quests = [
      {
        id: 'main',
        title: 'Find the Signal',
        status: 'active',
        objectives: [{ id: 'locate', description: 'Locate the source', completed: false }],
        clues: [],
      },
    ];
    state.worldFlags.trackedQuestId = 'main';
    state.worldFlags.questToast = 'Quest updated: Find the Signal';
    state.mapState = {
      currentZone: 'bridge',
      visitedZones: ['bridge'],
      revealedZones: ['bridge'],
      doorStates: {},
      zones: [{ id: 'bridge', name: 'Bridge', status: 'current' }],
      connections: [],
    };
    await saveState(state);
    const payload = JSON.stringify({
      brief: 'The signal cuts through the static.',
      text: 'Cold air pools beneath the bridge console as the signal repeats.',
      atmosphere: ['static hiss', 'cold rails', 'ozone'],
      pois: [
        {
          id: 'console',
          title: 'Inspect Console',
          description: 'The last packet is still buffered.',
          prompt: 'Inspect the console buffer.',
        },
      ],
      actions: [
        {
          title: 'Trace Signal',
          description: 'Follow the packet route.',
          prompt: 'Trace the signal route.',
          type: 'investigate',
          roll: { type: 'hazard', stat: 'INT', dc: 14 },
        },
        {
          title: 'Call Crew',
          description: 'Ask for a second read.',
          prompt: 'Call the crew to the bridge.',
          type: 'dialogue',
        },
      ],
      audioRecipe: 'mystery',
      panelMode: 'compact',
    });

    const result = await handleRender(['scene', '--raw', '--data', payload]);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('<ta-action-card');
    expect(html).toContain('data-poi="console"');
    expect(html).toContain('data-roll-type="hazard"');
    expect(html).toContain('data-audio-recipe="mystery"');
    expect(html).toContain('tracked-quest-badge');
    expect(html).toContain('<ta-quest-toast');
    expect(html).toContain('compact-panel');
    expect(extractTagAttr(html, 'ta-scene', 'data-panel-mode')).toBe('compact');
  });

  test('scene --data panelMode full keeps full standalone panel custom elements', async () => {
    state.modulesActive = ['prose-craft', 'core-systems'];
    state.quests = [
      {
        id: 'main',
        title: 'Find the Signal',
        status: 'active',
        objectives: [{ id: 'locate', description: 'Locate the source', completed: false }],
        clues: [],
      },
    ];
    await saveState(state);

    const result = await handleRender([
      'scene',
      '--raw',
      '--data',
      JSON.stringify({
        text: 'The room waits in a hush.',
        actions: [
          { title: 'Search', description: 'Look over the room.', prompt: 'Search the room.', type: 'investigate' },
          { title: 'Leave', description: 'Move on.', prompt: 'Leave the room.', type: 'travel' },
        ],
        panelMode: 'full',
      }),
    ]);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(extractTagAttr(html, 'ta-scene', 'data-panel-mode')).toBe('full');
    expect(html).toContain('<ta-quest-log');
    expect(html).not.toContain('compact-panel');
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
    const config = extractJsonTagAttr<{ dieType: string; stat: string; modifier: number; dc?: number }>(
      html,
      'ta-dice',
      'data-config',
    );
    expect(html).toContain('<ta-dice');
    expect(config.dieType).toBe('d20');
    expect(config.stat).toBe('STR');
    expect(config.modifier).toBe(3);
    expect(config.dc).toBe(15);
  });

  test('dice-pool widget renders grouped pre-roll state', async () => {
    const result = await handleRender([
      'dice-pool',
      '--raw',
      '--data',
      '{"label":"Boss Damage","pool":[{"dieType":"d6","count":2},{"dieType":"d8","count":2},{"dieType":"d10","count":3},{"dieType":"d20","count":1}],"modifier":4}',
    ]);
    const html = result.data as string;
    const config = extractJsonTagAttr<{
      label: string;
      expression: string;
      modifier: number;
      pool: Array<{ dieType: string; count: number }>;
    }>(html, 'ta-dice-pool', 'data-config');
    expect(html).toContain('<ta-dice-pool');
    expect(config.label).toBe('Boss Damage');
    expect(config.expression).toBe('2d6 + 2d8 + 3d10 + 1d20');
    expect(config.modifier).toBe(4);
    expect(config.pool).toHaveLength(4);
  });

  test('ticker widget shows time data', async () => {
    const result = await handleRender(['ticker', '--raw']);
    const html = result.data as string;
    expect(html).toContain('evening');
    expect(html).toContain('Day 5');
  });

  test('footer widget emits ta-footer element', async () => {
    const result = await handleRender(['footer', '--raw']);
    const html = result.data as string;
    expect(html).toContain('<ta-footer');
    expect(html).toContain('data-dim-panels="quests"');
  });

  test('recap widget contains session summary elements', async () => {
    const result = await handleRender(['recap', '--raw']);
    const html = result.data as string;
    const recap = extractJsonTagAttr<{ char: { name: string }; time: { period: string; date: string } }>(
      html,
      'ta-recap',
      'data-recap',
    );
    expect(html).toContain('<ta-recap');
    expect(recap.char.name).toBe('Aldric');
    expect(recap.time.period).toBe('evening');
    expect(recap.time.date).toBe('Day 5');
  });

  test('save-div widget contains hidden save data with valid JSON payload', async () => {
    const result = await handleRender(['save-div', '--raw']);
    const html = result.data as string;
    expect(html).toContain('id="save-data"');
    expect(html).toContain('display:none');
    // Extract data-payload attribute and verify it contains valid JSON with _version
    const payloadMatch = html.match(/data-payload="([^"]*)"/);
    expect(payloadMatch).not.toBeNull();
    const payload = JSON.parse(
      payloadMatch![1]!
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'"),
    );
    expect(payload._version).toBe(1);
    expect(payload.scene).toBe(0);
    expect(payload.character.name).toBe('Aldric');
  });
});

// ── Pending roll persistence ──────────────────────────────────────────

describe('render pending roll persistence', () => {
  let state: GmState;
  beforeEach(async () => {
    state = createDefaultState();
    state.visualStyle = 'terminal';
    state.character = {
      name: 'Kael',
      class: 'Scout',
      hp: 12,
      maxHp: 12,
      ac: 12,
      level: 1,
      xp: 0,
      currency: 0,
      currencyName: 'credits',
      stats: { STR: 10, DEX: 14, CON: 12, INT: 10, WIS: 11, CHA: 8 },
      modifiers: { STR: 0, DEX: 2, CON: 1, INT: 0, WIS: 0, CHA: -1 },
      proficiencyBonus: 2,
      proficiencies: [],
      abilities: [],
      inventory: [],
      conditions: [],
      equipment: { weapon: 'blaster', armour: 'light' },
    };
    state.modulesActive = ['core-systems'];
    state._modulesRead = [...TIER1_MODULES];
    state._proseCraftEpoch = 0;
    state._styleReadEpoch = 0;
    await saveState(state);
  });

  test('scene with roll actions persists _pendingRolls', async () => {
    const data = JSON.stringify({
      actions: [{ text: 'Deceive', roll: { type: 'contest', stat: 'CHA', npc: 'faal_01' } }],
    });
    await handleRender(['scene', '--raw', '--data', data]);
    const updated = await loadState();
    expect(updated._pendingRolls).toBeDefined();
    expect(updated._pendingRolls!.length).toBe(1);
    expect(updated._pendingRolls![0]!.stat).toBe('CHA');
  });

  test('scene without roll actions does NOT write _pendingRolls', async () => {
    const data = JSON.stringify({ actions: [{ text: 'Walk away' }] });
    await handleRender(['scene', '--raw', '--data', data]);
    const updated = await loadState();
    expect(updated._pendingRolls).toBeUndefined();
  });

  test('scene rerender clears stale _pendingRolls when roll metadata is removed', async () => {
    state._pendingRolls = [{ action: 1, type: 'hazard', stat: 'DEX', dc: 13 }];
    await saveState(state);

    const data = JSON.stringify({ actions: [{ text: 'Duck behind the crate' }] });
    await handleRender(['scene', '--raw', '--data', data]);

    const updated = await loadState();
    expect(updated._pendingRolls).toBeUndefined();
  });

  test('recap widget formats contested rolls without raw internal labels or fake DCs', async () => {
    state.rosterMutations = [
      {
        id: 'broker_01',
        name: 'Sil Vey',
        pronouns: 'they/them',
        role: 'broker',
        tier: 'rival',
        level: 2,
        stats: { STR: 10, DEX: 12, CON: 10, INT: 14, WIS: 11, CHA: 15 },
        modifiers: { STR: 0, DEX: 1, CON: 0, INT: 2, WIS: 0, CHA: 2 },
        hp: 16,
        maxHp: 16,
        ac: 12,
        soak: 0,
        damageDice: '1d6',
        status: 'active',
        alive: true,
        trust: 35,
        disposition: 'neutral',
        dispositionSeed: 11,
      },
    ];
    state.rollHistory = [
      {
        scene: 1,
        type: 'contested_roll',
        stat: 'CHA',
        roll: 14,
        modifier: 1,
        total: 15,
        npcId: 'broker_01',
        outcome: 'narrow_success',
      },
    ];
    await saveState(state);

    const result = await handleRender(['recap', '--raw']);
    const html = result.data as string;
    const recap = extractJsonTagAttr<{ rolls: Array<Record<string, unknown>> }>(html, 'ta-recap', 'data-recap');
    const roll = recap.rolls[0]!;
    expect(String(roll.stat)).toBe('CHA');
    expect(String(roll.npcId)).toBe('broker_01');
    expect(roll.dc).toBeUndefined();
  });
});
