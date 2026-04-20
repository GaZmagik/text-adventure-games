import { describe, test, expect } from 'bun:test';
import { renderLevelup } from './levelup';
import { createDefaultState } from '../../lib/state-store';

describe('renderLevelup', () => {
  test('renders ability options as data attributes', () => {
    const state = createDefaultState();
    state.character = {
      name: 'Kira', class: 'Pilot', hp: 18, maxHp: 24, ac: 14,
      level: 4, xp: 3200, currency: 150, currencyName: 'credits',
      stats: { STR: 10, DEX: 16, CON: 12, INT: 14, WIS: 11, CHA: 13 },
      modifiers: { STR: 0, DEX: 3, CON: 1, INT: 2, WIS: 0, CHA: 1 },
      proficiencyBonus: 2, proficiencies: [],
      abilities: [], inventory: [], conditions: [],
      equipment: { weapon: 'Blaster', armour: 'Flight Suit' },
    };
    const html = renderLevelup(state, '', { data: { abilities: ['Quick Draw', 'Fast Talk'] } });
    expect(html).toContain('data-abilities="Quick Draw,Fast Talk"');
  });
});

