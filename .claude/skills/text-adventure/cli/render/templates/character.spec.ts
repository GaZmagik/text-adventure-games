import { describe, test, expect } from 'bun:test';
import { renderCharacter } from './character';
import { createDefaultState } from '../../lib/state-store';

describe('renderCharacter', () => {
  test('renders character configuration as data attribute', () => {
    const state = createDefaultState();
    state.character = {
      name: 'Kael',
      class: 'Marine',
      hp: 8,
      maxHp: 10,
      ac: 14,
      level: 3,
      poiMax: 2,
      xp: 500,
      proficiencyBonus: 2,
      currency: 50,
      currencyName: 'Credits',
      stats: { STR: 10, DEX: 14, CON: 12, INT: 16, WIS: 10, CHA: 8 },
      modifiers: { STR: 0, DEX: 2, CON: 1, INT: 3, WIS: 0, CHA: -1 },
      proficiencies: ['Athletics'],
      abilities: [],
      inventory: [],
      conditions: [],
      equipment: { weapon: 'Pulse Rifle', armour: 'Tactical Vest' },
    };
    const html = renderCharacter(state, '');
    expect(html).toContain('<ta-character');
    expect(html).toContain('data-config=');
    expect(html).toContain('Kael');
    expect(html).toContain('Marine');
  });

  test('returns empty state when character is missing', () => {
    const state = createDefaultState();
    state.character = null;
    const html = renderCharacter(state, '');
    expect(html).toContain('No character data available');
  });

  test('escapes fallback character name and class text', () => {
    const state = createDefaultState();
    state.character = {
      name: '<img src=x onerror=alert("x")> "quote" &',
      class: 'Marine & <img src=x onerror=alert(1)>',
      hp: 8,
      maxHp: 10,
      ac: 14,
      level: 3,
      poiMax: 2,
      xp: 500,
      proficiencyBonus: 2,
      currency: 50,
      currencyName: 'Credits',
      stats: { STR: 10, DEX: 14, CON: 12, INT: 16, WIS: 10, CHA: 8 },
      modifiers: { STR: 0, DEX: 2, CON: 1, INT: 3, WIS: 0, CHA: -1 },
      proficiencies: [],
      abilities: [],
      inventory: [],
      conditions: [],
      equipment: { weapon: 'Pulse Rifle', armour: 'Tactical Vest' },
    };
    const html = renderCharacter(state, '');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(&quot;x&quot;)&gt;');
    expect(html).toContain('Marine &amp;');
  });
});
