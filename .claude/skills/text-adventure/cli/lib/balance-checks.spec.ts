import { describe, test, expect } from 'bun:test';
import { checkBalance } from './balance-checks';
import type { GmState } from '../types';

describe('checkBalance', () => {
  const baseState: Partial<GmState> = {
    scene: 1,
    character: {
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
      equipment: { weapon: 'Sword', armour: 'Leather' }
    },
    quests: [],
    factions: {},
    worldFlags: {},
    rosterMutations: [],
    codexMutations: [],
    _stateHistory: []
  };

  test('flags level requirement blockers', () => {
    const state = {
      ...baseState,
      quests: [{
        id: 'q1',
        title: 'High Level Quest',
        status: 'active',
        objectives: [{
          id: 'o1',
          description: 'Kill the Dragon',
          completed: false,
          requirements: { minLevel: 5 }
        }]
      }]
    } as GmState;

    const failures = checkBalance(state);
    expect(failures.some(f => f.severity === 'blocker' && f.message.includes('Level 5'))).toBe(true);
  });

  test('flags impossible DC checks', () => {
    const state = {
      ...baseState,
      quests: [{
        id: 'q1',
        title: 'Hard Quest',
        status: 'active',
        objectives: [{
          id: 'o1',
          description: 'Lift the Rock',
          completed: false,
          requirements: { stat: 'STR', dc: 25 }
        }]
      }]
    } as GmState;

    const failures = checkBalance(state);
    expect(failures.some(f => f.severity === 'blocker' && f.message.includes('DC 25'))).toBe(true);
  });

  test('flags high DC warnings', () => {
    const state = {
      ...baseState,
      quests: [{
        id: 'q1',
        title: 'Hard Quest',
        status: 'active',
        objectives: [{
          id: 'o1',
          description: 'Lift the Rock',
          completed: false,
          requirements: { stat: 'STR', dc: 18 }
        }]
      }]
    } as GmState;

    const failures = checkBalance(state);
    expect(failures.some(f => f.severity === 'warning' && f.message.includes('(18 STR)'))).toBe(true);
  });

  test('flags missing item requirements', () => {
    const state = {
      ...baseState,
      quests: [{
        id: 'q1',
        title: 'Fetch Quest',
        status: 'active',
        objectives: [{
          id: 'o1',
          description: 'Bring the Amulet',
          completed: false,
          requirements: { item: 'Amulet' }
        }]
      }],
      worldData: { rooms: { r1: { loot: [] } } }
    } as any as GmState;

    const failures = checkBalance(state);
    expect(failures.some(f => f.severity === 'blocker' && f.message.includes('Amulet'))).toBe(true);
  });

  test('passes if item is in world loot', () => {
    const state = {
      ...baseState,
      quests: [{
        id: 'q1',
        title: 'Fetch Quest',
        status: 'active',
        objectives: [{
          id: 'o1',
          description: 'Bring the Amulet',
          completed: false,
          requirements: { item: 'Amulet' }
        }]
      }],
      worldData: { rooms: { r1: { loot: ['Amulet'] } } }
    } as any as GmState;

    const failures = checkBalance(state);
    expect(failures.some(f => f.message.includes('Amulet'))).toBe(false);
  });
});
