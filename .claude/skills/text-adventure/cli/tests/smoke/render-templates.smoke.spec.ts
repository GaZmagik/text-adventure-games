import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleRender } from '../../commands/render';
import { createDefaultState, saveState } from '../../lib/state-store';
import type { GmState } from '../../types';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-render-smoke-'));
  process.env.TAG_STATE_DIR = tempDir;
  const { signMarker, clearStateDirCache } = require('../../commands/verify');
  clearStateDirCache();
  writeFileSync(join(tempDir, '.last-sync'), signMarker(999), 'utf-8');
  writeFileSync(join(tempDir, '.verified-scenario'), signMarker(0), 'utf-8');
  writeFileSync(join(tempDir, '.verified-rules'), signMarker(0), 'utf-8');
  writeFileSync(join(tempDir, '.verified-character'), signMarker(0), 'utf-8');
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) process.env.TAG_STATE_DIR = originalEnv;
  else delete process.env.TAG_STATE_DIR;
});

async function seedState(mutator?: (state: GmState) => void): Promise<GmState> {
  const state = createDefaultState();
  state.visualStyle = 'terminal';
  mutator?.(state);
  await saveState(state);
  return state;
}

async function renderRaw(args: string[]): Promise<string> {
  const result = await handleRender([...args, '--raw']);
  expect(result.ok).toBe(true);
  return result.data as string;
}

describe('render template smoke via handleRender', () => {
  test('character widget covers empty and populated character states', async () => {
    await seedState();
    expect(await renderRaw(['character'])).toContain('No character data available');

    await seedState(state => {
      state.character = {
        name: 'Kira',
        class: 'Pilot',
        hp: 18,
        maxHp: 24,
        ac: 14,
        level: 4,
        xp: 3200,
        currency: 150,
        currencyName: 'credits',
        stats: { STR: 10, DEX: 16, CON: 12, INT: 14, WIS: 11, CHA: 13 },
        modifiers: { STR: 0, DEX: 3, CON: 1, INT: 2, WIS: 0, CHA: 1 },
        proficiencyBonus: 2,
        proficiencies: ['STR', 'Piloting'],
        abilities: ['Quick Draw'],
        inventory: [{ name: 'Blaster', type: 'weapon', slots: 1 }],
        conditions: ['Inspired'],
        equipment: { weapon: 'Blaster', armour: 'Flight Suit' },
      };
    });

    const html = await renderRaw(['character']);
    expect(html).toContain('inv-item');
    expect(html).toContain('condition-badge');
    expect(html).toContain('stat-cell proficient');
    expect(html).toContain('Quick Draw');
  });

  test('codex widget renders discovery metadata and secret chips', async () => {
    await seedState(state => {
      state.codexMutations = [{
        id: 'ancient_beacon',
        state: 'discovered',
        discoveredAt: 4,
        via: 'salvage',
        secrets: ['Phase Key'],
      }];
    });

    const html = await renderRaw(['codex']);
    expect(html).toContain('Scene 4');
    expect(html).toContain('via salvage');
    expect(html).toContain('codex-secret');
    expect(html).toContain('Phase Key');
  });

  test('combat-turn widget accepts top-level data options and renders damage context', async () => {
    await seedState(state => {
      state.character = {
        name: 'Kira',
        class: 'Pilot',
        hp: 18,
        maxHp: 24,
        ac: 14,
        level: 4,
        xp: 3200,
        currency: 150,
        currencyName: 'credits',
        stats: { STR: 10, DEX: 16, CON: 12, INT: 14, WIS: 11, CHA: 13 },
        modifiers: { STR: 0, DEX: 3, CON: 1, INT: 2, WIS: 0, CHA: 1 },
        proficiencyBonus: 2,
        proficiencies: ['STR', 'Piloting'],
        abilities: ['Quick Draw'],
        inventory: [{ name: 'Blaster', type: 'weapon', slots: 1 }],
        conditions: ['Inspired'],
        equipment: { weapon: 'Blaster', armour: 'Flight Suit' },
      };
      state.rosterMutations = [{
        id: 'raider_1',
        name: 'Raider',
        pronouns: 'they/them',
        role: 'raider',
        tier: 'rival',
        level: 2,
        stats: { STR: 12, DEX: 12, CON: 10, INT: 10, WIS: 10, CHA: 10 },
        modifiers: { STR: 1, DEX: 1, CON: 0, INT: 0, WIS: 0, CHA: 0 },
        hp: 8,
        maxHp: 12,
        ac: 12,
        soak: 0,
        damageDice: '1d6',
        status: 'active',
        alive: true,
        trust: 0,
        disposition: 'hostile',
        dispositionSeed: 0.5,
      }];
      state._lastComputation = {
        type: 'contested_roll',
        stat: 'STR',
        roll: 18,
        modifier: 2,
        total: 20,
        dc: 12,
        margin: 8,
        outcome: 'critical_success',
        npcId: 'raider_1',
        npcModifier: 1,
        context: { damage: 5, damageType: 'fire' },
      };
    });

    const html = await renderRaw(['combat-turn', '--data', '{"combatantCount":3}']);
    expect(html).toContain('Combat (3 combatants)');
    expect(html).toContain('Raider');
    expect(html).toContain('damage (critical)');
    expect(html).toContain('fire');
  });

  test('dialogue widget accepts npcId via --data and renders explicit choices', async () => {
    await seedState(state => {
      state.rosterMutations = [{
        id: 'broker_1',
        name: 'Broker',
        pronouns: 'she/her',
        role: 'broker',
        tier: 'rival',
        level: 2,
        stats: { STR: 8, DEX: 12, CON: 10, INT: 14, WIS: 12, CHA: 16 },
        modifiers: { STR: -1, DEX: 1, CON: 0, INT: 2, WIS: 1, CHA: 3 },
        hp: 12,
        maxHp: 12,
        ac: 11,
        soak: 0,
        damageDice: '1d6',
        status: 'active',
        alive: true,
        trust: 45,
        disposition: 'friendly',
        dispositionSeed: 0.25,
      }];
    });

    const html = await renderRaw([
      'dialogue',
      '--data',
      '{"npcId":"broker_1","text":"The broker leans in.","choices":[{"label":"Ask about the cargo","prompt":"Tell me about the cargo; now."}]}',
    ]);
    expect(html).toContain('The broker leans in.');
    expect(html).toContain('<ta-dialogue');
    expect(html).toContain('Tell me about the cargo');
  });

  test('dice-pool widget falls back to default pools when data is missing or invalid', async () => {
    const fallback = await renderRaw(['dice-pool', '--data', '{"label":"Fallback Pool"}']);
    expect(fallback).toContain('Fallback Pool');
    expect(fallback).toContain('2d6');

    const broken = await renderRaw(['dice-pool', '--data', '{"label":"Broken Pool","pool":[{"dieType":"bogus","count":99}]}']);
    expect(broken).toContain('Broken Pool');
    expect(broken).toContain('2d6');
  });

  test('footer widget renders module-aware buttons and export controls', async () => {
    await seedState(state => {
      state.modulesActive = [
        'adventure-exporting',
        'audio',
        'lore-codex',
        'ship-systems',
        'crew-manifest',
        'star-chart',
        'geo-map',
        'core-systems',
      ];
    });

    const html = await renderRaw(['footer']);
    expect(html).toContain('<ta-footer');
    expect(html).toContain('data-modules=');
    expect(html).toContain('lore-codex');
    expect(html).toContain('data-has-export="true"');
    expect(html).toContain('data-has-audio="true"');
  });

  test('map widget renders supplies without a doors section when no doors exist', async () => {
    await seedState(state => {
      state.mapState = {
        currentZone: 'Docking Bay',
        visitedZones: ['Docking Bay'],
        revealedZones: ['Docking Bay', 'Cargo Hold'],
        doorStates: {},
        supplies: { rations: 3, water: 5 },
      };
    });

    const html = await renderRaw(['map']);
    expect(html).toContain('Supplies');
    expect(html).toContain('Rations');
    expect(html).not.toContain('<div class="map-section-label">Doors</div>');
  });

  test('recap widget renders active quests, completed quests, and mixed roll types', async () => {
    await seedState(state => {
      state.scene = 7;
      state.currentRoom = 'Bridge';
      state.quests = [
        {
          id: 'q1',
          title: 'Restore Power',
          status: 'active',
          objectives: [
            { id: 'o1', description: 'Reach the relay', completed: true },
            { id: 'o2', description: 'Restart the core', completed: false },
          ],
          clues: [],
        },
        {
          id: 'q2',
          title: 'Escape the Station',
          status: 'completed',
          objectives: [{ id: 'o3', description: 'Launch', completed: true }],
          clues: [],
        },
      ];
      state.rollHistory = [
        { scene: 6, type: 'encounter_roll', roll: 9, outcome: 'hostile' },
        { scene: 7, type: 'contested_roll', stat: 'CHA', roll: 14, modifier: 1, total: 15, npcId: 'warden_01', outcome: 'narrow_success' },
        { scene: 7, type: 'hazard_save', stat: 'DEX', roll: 12, modifier: 3, total: 15, dc: 14, outcome: 'success' },
      ];
      state.rosterMutations = [
        {
          id: 'warden_01',
          name: 'Warden Sile',
          pronouns: 'they/them',
          role: 'warden',
          tier: 'rival',
          level: 2,
          stats: { STR: 12, DEX: 11, CON: 12, INT: 10, WIS: 13, CHA: 11 },
          modifiers: { STR: 1, DEX: 0, CON: 1, INT: 0, WIS: 1, CHA: 0 },
          hp: 18,
          maxHp: 18,
          ac: 12,
          soak: 0,
          damageDice: '1d6',
          status: 'active',
          alive: true,
          trust: 25,
          disposition: 'suspicious',
          dispositionSeed: 7,
        },
      ];
    });

    const html = await renderRaw(['recap']);
    expect(html).toContain('Active Quests (1)');
    expect(html).toContain('Completed Quests (1)');
    expect(html).toContain('Encounter');
    expect(html).toContain('Warden Sile');
    expect(html).toContain('12+3=15 vs DC 14');
    expect(html).not.toContain('contested_roll');
    expect(html).not.toContain('vs DC 0');
    expect(html).toContain('roll-outcome-success');
    expect(html).toContain('roll-outcome-failure');
  });

  test('settings widget supports aliases and extracts ids, labels, and names from option objects', async () => {
    const html = await renderRaw([
      'settings',
      '--style',
      'terminal',
      '--data',
      '{"rules":["core",{"id":"narrative_engine"}],"difficulty":["easy",{"label":"story"}],"pacing":["fast"],"styles":["terminal"],"activeModules":["audio",{"name":"crew-manifest"}],"defaults":{"difficulty":"easy"}}',
    ]);
    expect(html).toContain('data-value="narrative_engine"');
    expect(html).toContain('data-value="story"');
    expect(html).toContain('data-value="crew-manifest"');
    expect(html).toContain('var selections = {"difficulty":"easy"}');
  });

  test('starchart widget renders plotted course steps', async () => {
    await seedState(state => {
      state.currentRoom = 'Sol';
      state.visitedRooms = ['Sol', 'Alpha Centauri'];
      state.navPlottedCourse = ['Sol', 'Barnards Star', 'Sirius'];
    });

    const html = await renderRaw(['starchart']);
    expect(html).toContain('course-list');
    expect(html).toContain('Barnards Star');
    expect(html).toContain('step-current');
  });

  test('character-creation widget supports alias fields and default names', async () => {
    const empty = await renderRaw(['character-creation']);
    expect(empty).toContain('Create Your Character');
    expect(empty).not.toContain('<button class="archetype-card"');
    expect(empty).toContain('Athletics');
    expect(empty).toContain('Stealth');
    expect(empty).toContain('confirm-btn');

    const html = await renderRaw([
      'character-creation',
      '--data',
      '{"defaultName":"Nova","archetypes":[{"name":"Saboteur","flavour":"Covert specialist","baseStats":{"DEX":16,"INT":14},"equipment":["Wire kit"],"fixedProficiencies":["Stealth"],"hp":8,"ac":13}],"proficiencies":["Stealth","Hacking"]}',
    ]);
    expect(html).toContain('value="Nova"');
    expect(html).toContain('Covert specialist');
    expect(html).toContain('DEX 16');
    expect(html).toContain('Wire kit');
    expect(html).toContain('Proficiencies: Stealth');
  });

  test('scenario-select widget covers empty state, hook fallback, and prompt wiring', async () => {
    const empty = await renderRaw(['scenario-select']);
    expect(empty).toContain('empty-scenarios');
    expect(empty).toContain('No scenarios provided');
    expect(empty).toContain('--data');

    const html = await renderRaw([
      'scenario-select',
      '--data',
      '{"scenarios":[{"title":"Cold Freight","description":"A chilling mystery","genre":["survival","mystery"],"difficulty":"normal"},{"title":"The Grit Anvil","hook":"Something is not rock","genres":["horror"],"players":"1-3"},{"title":"Hook Test","hook":"Hook text here"}]}',
    ]);
    expect(html).toContain('Cold Freight');
    expect(html).toContain('The Grit Anvil');
    expect(html).toContain('genre-pill');
    expect(html).toContain('survival');
    expect(html).toContain('Hook text here');
    expect(html).toContain('I choose scenario: The Grit Anvil');
  });

  test('crew widget renders idle, injured, and dead states with clamped bars', async () => {
    await seedState(state => {
      state.crewMutations = [
        {
          id: 'eng_1',
          name: 'Mara',
          pronouns: 'she/her',
          role: 'engineer',
          morale: 140,
          stress: -5,
          loyalty: 70,
          status: 'injured',
          task: '',
        },
        {
          id: 'sec_1',
          name: 'Bren',
          pronouns: 'he/him',
          role: 'security',
          morale: 30,
          stress: 50,
          loyalty: 50,
          status: 'dead',
          task: '',
        },
      ];
    });

    const html = await renderRaw(['crew']);
    expect(html).toContain('Idle');
    expect(html).toContain('badge-warn');
    expect(html).toContain('badge-danger');
    expect(html).toContain('Morale: 100%');
    expect(html).toContain('Stress: 0%');
  });
});
