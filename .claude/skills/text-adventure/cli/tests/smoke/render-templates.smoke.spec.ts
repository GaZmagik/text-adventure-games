import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleRender } from '../../commands/render';
import { createDefaultState, saveState } from '../../lib/state-store';
import type { GmState } from '../../types';
import { extractJsonTagAttr } from '../support/rendered-widget';

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
    const config = extractJsonTagAttr<{
      name: string;
      proficiencies: string[];
      inventory: Array<{ name: string }>;
      conditions: string[];
      abilities: string[];
    }>(html, 'ta-character', 'data-config');
    expect(config.name).toBe('Kira');
    expect(config.inventory[0]!.name).toBe('Blaster');
    expect(config.conditions).toContain('Inspired');
    expect(config.proficiencies).toContain('Piloting');
    expect(config.abilities).toContain('Quick Draw');
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
    const entries = extractJsonTagAttr<Array<{ id: string; discoveredAt?: number; via?: string; secrets?: string[] }>>(
      html,
      'ta-codex',
      'data-entries',
    );
    expect(entries[0]!.id).toBe('ancient_beacon');
    expect(entries[0]!.discoveredAt).toBe(4);
    expect(entries[0]!.via).toBe('salvage');
    expect(entries[0]!.secrets).toContain('Phase Key');
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
    const combat = extractJsonTagAttr<{
      computation: { context?: { damage?: number; damageType?: string }; npcId?: string };
      roster: Array<{ name: string }>;
    }>(html, 'ta-combat-turn', 'data-combat');
    expect(combat.roster[0]!.name).toBe('Raider');
    expect(combat.computation.context?.damage).toBe(5);
    expect(combat.computation.context?.damageType).toBe('fire');
    expect(combat.computation.npcId).toBe('raider_1');
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
    const map = extractJsonTagAttr<{
      current: string;
      supplies: { rations: number; water: number };
      doorStates: Record<string, string>;
    }>(html, 'ta-map', 'data-map');
    expect(map.current).toBe('Docking Bay');
    expect(map.supplies.rations).toBe(3);
    expect(map.supplies.water).toBe(5);
    expect(map.doorStates).toEqual({});
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
    const recap = extractJsonTagAttr<{
      room: string;
      quests: Array<{ title: string; status: string }>;
      rolls: Array<Record<string, unknown>>;
    }>(html, 'ta-recap', 'data-recap');
    expect(recap.room).toBe('Bridge');
    expect(recap.quests.filter(quest => quest.status === 'active')).toHaveLength(1);
    expect(recap.quests.filter(quest => quest.status === 'completed')).toHaveLength(1);
    expect(recap.rolls).toHaveLength(3);
    expect(recap.rolls.some(roll => roll.npcId === 'warden_01')).toBe(true);
    expect(recap.rolls.some(roll => roll.dc === 14)).toBe(true);
  });

  test('settings widget supports aliases and extracts ids, labels, and names from option objects', async () => {
    const html = await renderRaw([
      'settings',
      '--style',
      'terminal',
      '--data',
      '{"rules":["core",{"id":"narrative_engine"}],"difficulty":["easy",{"label":"story"}],"pacing":["fast"],"styles":["terminal"],"activeModules":["audio",{"name":"crew-manifest"}],"defaults":{"difficulty":"easy"}}',
    ]);
    const config = extractJsonTagAttr<{
      rulebooks: string[];
      difficulties: string[];
      modules: string[];
      defaults: { difficulty: string };
    }>(html, 'ta-settings', 'data-config');
    expect(config.rulebooks).toContain('narrative_engine');
    expect(config.difficulties).toContain('story');
    expect(config.modules).toContain('crew-manifest');
    expect(config.defaults.difficulty).toBe('easy');
  });

  test('starchart widget renders plotted course steps', async () => {
    await seedState(state => {
      state.currentRoom = 'Sol';
      state.visitedRooms = ['Sol', 'Alpha Centauri'];
      state.navPlottedCourse = ['Sol', 'Barnards Star', 'Sirius'];
    });

    const html = await renderRaw(['starchart']);
    const chart = extractJsonTagAttr<{
      current: string;
      systems: Array<{ name: string }>;
      plottedCourse: string[];
    }>(html, 'ta-starchart', 'data-chart');
    expect(chart.current).toBe('Sol');
    expect(chart.systems.some(system => system.name === 'Barnards Star')).toBe(true);
    expect(chart.plottedCourse).toEqual(['Sol', 'Barnards Star', 'Sirius']);
  });

  test('character-creation widget supports alias fields and default names', async () => {
    const empty = await renderRaw(['character-creation']);
    const emptyConfig = extractJsonTagAttr<{
      archetypes: unknown[];
      proficiencies: string[];
      defaultName: string;
    }>(empty, 'ta-character-creation', 'data-config');
    expect(empty).toContain('<ta-character-creation');
    expect(emptyConfig.archetypes).toEqual([]);
    expect(emptyConfig.proficiencies).toContain('Athletics');
    expect(emptyConfig.proficiencies).toContain('Stealth');
    expect(emptyConfig.defaultName).toBe('');

    const html = await renderRaw([
      'character-creation',
      '--data',
      '{"defaultName":"Nova","archetypes":[{"name":"Saboteur","flavour":"Covert specialist","baseStats":{"DEX":16,"INT":14},"equipment":["Wire kit"],"fixedProficiencies":["Stealth"],"hp":8,"ac":13}],"proficiencies":["Stealth","Hacking"]}',
    ]);
    const config = extractJsonTagAttr<{
      defaultName: string;
      archetypes: Array<Record<string, unknown>>;
      proficiencies: string[];
    }>(html, 'ta-character-creation', 'data-config');
    expect(config.defaultName).toBe('Nova');
    expect(config.archetypes[0]!.name).toBe('Saboteur');
    expect(config.archetypes[0]!.flavour).toBe('Covert specialist');
    expect((config.archetypes[0]!.baseStats as Record<string, number>).DEX).toBe(16);
    expect(config.proficiencies).toEqual(['Stealth', 'Hacking']);
  });

  test('scenario-select widget covers empty state, hook fallback, and prompt wiring', async () => {
    const empty = await renderRaw(['scenario-select']);
    const emptyScenarios = extractJsonTagAttr<unknown[]>(empty, 'ta-scenario-select', 'data-scenarios');
    expect(empty).toContain('<ta-scenario-select');
    expect(emptyScenarios).toEqual([]);

    const html = await renderRaw([
      'scenario-select',
      '--data',
      '{"scenarios":[{"title":"Cold Freight","description":"A chilling mystery","genre":["survival","mystery"],"difficulty":"normal"},{"title":"The Grit Anvil","hook":"Something is not rock","genres":["horror"],"players":"1-3"},{"title":"Hook Test","hook":"Hook text here"}]}',
    ]);
    const scenarios = extractJsonTagAttr<Array<Record<string, unknown>>>(html, 'ta-scenario-select', 'data-scenarios');
    expect(scenarios.map(scenario => scenario.title)).toEqual(['Cold Freight', 'The Grit Anvil', 'Hook Test']);
    expect(scenarios[0]!.genre).toEqual(['survival', 'mystery']);
    expect(scenarios[1]!.hook).toBe('Something is not rock');
    expect(scenarios[1]!.players).toBe('1-3');
    expect(scenarios[2]!.hook).toBe('Hook text here');
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
    const crew = extractJsonTagAttr<Array<{ name: string; morale: number; stress: number; status: string }>>(
      html,
      'ta-crew',
      'data-crew',
    );
    expect(crew).toHaveLength(2);
    expect(crew[0]!.name).toBe('Mara');
    expect(crew[0]!.morale).toBe(140);
    expect(crew[0]!.stress).toBe(-5);
    expect(crew[0]!.status).toBe('injured');
    expect(crew[1]!.status).toBe('dead');
  });
});
