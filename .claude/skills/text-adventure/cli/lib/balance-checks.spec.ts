import { describe, test, expect } from 'bun:test';
import { checkBalance } from './balance-checks';
import { createDefaultState } from './state-store';
import type { GmState, Quest, QuestObjective, WorldData } from '../types';

describe('checkBalance', () => {
  function makeState(): GmState {
    const state = createDefaultState();
    state.scene = 1;
    state.character = {
      name: 'Test',
      class: 'Fighter',
      level: 1,
      xp: 0,
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      hp: 10,
      maxHp: 10,
      ac: 10,
      currency: 0,
      currencyName: 'Gold',
      proficiencyBonus: 2,
      proficiencies: [],
      abilities: [],
      inventory: [],
      conditions: [],
      equipment: { weapon: 'Sword', armour: 'Leather' },
    };
    return state;
  }

  function makeQuest(title: string, objective: QuestObjective): Quest {
    return {
      id: 'q1',
      title,
      status: 'active',
      objectives: [objective],
      clues: [],
    };
  }

  function makeWorldData(loot: string[]): WorldData {
    return {
      seed: 'balance-test',
      theme: 'space',
      mapName: 'Test Map',
      rooms: {
        r1: {
          id: 'r1',
          name: 'Room 1',
          type: 'hub',
          description: 'Test room',
          exits: [],
          loot,
          encounters: [],
        },
      },
      startRoom: 'r1',
      bossRoom: 'r1',
      factions: { factions: [], relations: {} },
      roster: [],
      hooks: { main: 'Test', side: [], factionA: 'A', factionB: 'B' },
      meta: { roomCount: 1, npcCount: 0, generatedAt: 0, generatorVersion: 1 },
    };
  }

  test('flags level requirement blockers', () => {
    const state = makeState();
    state.quests = [
      makeQuest('High Level Quest', {
        id: 'o1',
        description: 'Kill the Dragon',
        completed: false,
        requirements: { minLevel: 5 },
      }),
    ];

    const failures = checkBalance(state);
    expect(failures.some(f => f.severity === 'blocker' && f.message.includes('Level 5'))).toBe(true);
  });

  test('flags impossible DC checks', () => {
    const state = makeState();
    state.quests = [
      makeQuest('Hard Quest', {
        id: 'o1',
        description: 'Lift the Rock',
        completed: false,
        requirements: { stat: 'STR', dc: 25 },
      }),
    ];

    const failures = checkBalance(state);
    expect(failures.some(f => f.severity === 'blocker' && f.message.includes('DC 25'))).toBe(true);
  });

  test('flags high DC warnings', () => {
    const state = makeState();
    state.quests = [
      makeQuest('Hard Quest', {
        id: 'o1',
        description: 'Lift the Rock',
        completed: false,
        requirements: { stat: 'STR', dc: 18 },
      }),
    ];

    const failures = checkBalance(state);
    expect(failures.some(f => f.severity === 'warning' && f.message.includes('(18 STR)'))).toBe(true);
  });

  test('flags missing item requirements', () => {
    const state = makeState();
    state.quests = [
      makeQuest('Fetch Quest', {
        id: 'o1',
        description: 'Bring the Amulet',
        completed: false,
        requirements: { item: 'Amulet' },
      }),
    ];
    state.worldData = makeWorldData([]);

    const failures = checkBalance(state);
    expect(failures.some(f => f.severity === 'blocker' && f.message.includes('Amulet'))).toBe(true);
  });

  test('passes if item is in world loot', () => {
    const state = makeState();
    state.quests = [
      makeQuest('Fetch Quest', {
        id: 'o1',
        description: 'Bring the Amulet',
        completed: false,
        requirements: { item: 'Amulet' },
      }),
    ];
    state.worldData = makeWorldData(['Amulet']);

    const failures = checkBalance(state);
    expect(failures.some(f => f.message.includes('Amulet'))).toBe(false);
  });
});
