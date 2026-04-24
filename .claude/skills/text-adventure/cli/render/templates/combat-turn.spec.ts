import { describe, expect, test } from 'bun:test';
import { createDefaultState } from '../../lib/state-store';
import { extractJsonTagAttr } from '../../tests/support/rendered-widget';
import { renderCombatTurn } from './combat-turn';

type CombatPayload = {
  char: { name: string; hp: number; maxHp: number } | null;
  roster: unknown[];
};

function readCombat(html: string): CombatPayload {
  return extractJsonTagAttr<CombatPayload>(html, 'ta-combat-turn', 'data-combat');
}

describe('renderCombatTurn', () => {
  test('serialises character vitals and roster mutations for the combat widget', () => {
    const state = createDefaultState();
    state.character = {
      name: 'Test Hero',
      class: 'Scout',
      hp: 8,
      maxHp: 12,
      ac: 13,
      level: 1,
      xp: 0,
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

    const combat = readCombat(renderCombatTurn(state, ''));

    expect(combat.char).toEqual({ name: 'Test Hero', hp: 8, maxHp: 12 });
    expect(combat.roster).toEqual([]);
  });

  test('emits CDN assets when rendered standalone', () => {
    const html = renderCombatTurn(createDefaultState(), 'station');

    expect(html).toContain('<ta-combat-turn');
    expect(html).toContain('ta-components.js');
    expect(html).toContain('station.css');
  });
});
