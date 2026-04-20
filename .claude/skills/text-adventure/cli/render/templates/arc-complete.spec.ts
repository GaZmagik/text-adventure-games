import { describe, test, expect } from 'bun:test';
import { renderArcComplete } from './arc-complete';
import { createDefaultState } from '../../lib/state-store';
import { extractJsonTagAttr } from '../../tests/support/rendered-widget';

type ArcConfig = {
  arc: number;
  charName: string;
  charLevel: number;
  questsCompleted: number;
  questsTotal: number;
  rollCount: number;
  sceneCount: number;
  summary: string;
};

function readConfig(html: string): ArcConfig {
  return extractJsonTagAttr<ArcConfig>(html, 'ta-arc-complete', 'data-arc');
}

describe('renderArcComplete', () => {
  test('renders arc summary payload with character identity', () => {
    const state = createDefaultState();
    state.arc = 1;
    state.character = {
      name: 'Kira', class: 'Pilot', hp: 18, maxHp: 24, ac: 14,
      level: 4, xp: 3200, currency: 150, currencyName: 'credits',
      stats: { STR: 10, DEX: 16, CON: 12, INT: 14, WIS: 11, CHA: 13 },
      modifiers: { STR: 0, DEX: 3, CON: 1, INT: 2, WIS: 0, CHA: 1 },
      proficiencyBonus: 2, proficiencies: [],
      abilities: [], inventory: [], conditions: [],
      equipment: { weapon: 'Blaster', armour: 'Flight Suit' },
    };
    const html = renderArcComplete(state, '');
    const config = readConfig(html);
    expect(html).toContain('<ta-arc-complete');
    expect(config.arc).toBe(1);
    expect(config.charName).toBe('Kira');
    expect(config.charLevel).toBe(4);
  });

  test('summarises quest completion counts and roll history', () => {
    const state = createDefaultState();
    state.quests = [
      { id: 'q1', title: 'Main Quest', status: 'completed', objectives: [{ id: 'o1', description: 'Do thing', completed: true }], clues: [] },
      { id: 'q2', title: 'Side Quest', status: 'active', objectives: [{ id: 'o2', description: 'Other thing', completed: false }], clues: [] },
    ];
    state.rollHistory = [{ scene: 1, type: 'encounter_roll', roll: 7, outcome: 'hostile' }];
    const config = readConfig(renderArcComplete(state, ''));
    expect(config.questsCompleted).toBe(1);
    expect(config.questsTotal).toBe(2);
    expect(config.rollCount).toBe(1);
  });

  test('renders a stable fallback payload without state', () => {
    const config = readConfig(renderArcComplete(null, ''));
    expect(config.arc).toBe(1);
    expect(config.charName).toBe('Adventurer');
    expect(config.charLevel).toBe(1);
    expect(config.summary).toBe('');
  });

  test('includes --data summary text when provided', () => {
    const state = createDefaultState();
    const config = readConfig(renderArcComplete(state, '', { data: { summary: 'The station fell silent.' } }));
    expect(config.summary).toBe('The station fell silent.');
  });
});
