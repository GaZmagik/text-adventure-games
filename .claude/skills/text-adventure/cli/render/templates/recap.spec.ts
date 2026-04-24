import { describe, expect, test } from 'bun:test';
import { createDefaultState } from '../../lib/state-store';
import { extractJsonTagAttr } from '../../tests/support/rendered-widget';
import { renderRecap } from './recap';

type RecapPayload = {
  scene: number;
  char: { name: string; class: string; level: number; hp: number; maxHp: number } | null;
  room: string;
  quests: unknown[];
  rolls: unknown[];
};

function readRecap(html: string): RecapPayload {
  return extractJsonTagAttr<RecapPayload>(html, 'ta-recap', 'data-recap');
}

describe('renderRecap', () => {
  test('serialises session orientation data', () => {
    const state = createDefaultState();
    state.scene = 12;
    state.currentRoom = 'cargo_hold';
    state.character = {
      name: 'Test Hero',
      class: 'Scout',
      hp: 9,
      maxHp: 12,
      ac: 13,
      level: 2,
      xp: 100,
      currency: 0,
      currencyName: 'credits',
      stats: { STR: 10, DEX: 14, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 2, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2,
      proficiencies: [],
      abilities: [],
      inventory: [],
      conditions: [],
      equipment: { weapon: 'Blaster', armour: 'Vest' },
    };
    state.quests = [{ id: 'main', title: 'Find the Beacon', status: 'active', objectives: [], clues: [] }];
    state.rollHistory = [{ scene: 11, type: 'hazard_save', roll: 15, total: 17, outcome: 'success' }];

    const recap = readRecap(renderRecap(state, ''));

    expect(recap.scene).toBe(12);
    expect(recap.room).toBe('cargo_hold');
    expect(recap.char).toMatchObject({ name: 'Test Hero', class: 'Scout', level: 2 });
    expect(recap.quests).toHaveLength(1);
    expect(recap.rolls).toHaveLength(1);
  });
});
