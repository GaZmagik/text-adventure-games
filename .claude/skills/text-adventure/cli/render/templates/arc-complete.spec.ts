import { describe, test, expect } from 'bun:test';
import { renderArcComplete } from './arc-complete';
import { createDefaultState } from '../../lib/state-store';

describe('renderArcComplete', () => {
  test('renders arc summary with character name', () => {
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
    expect(html).toContain('Kira');
    expect(html).toContain('Act 1');
  });

  test('renders save, export, and continue buttons', () => {
    const state = createDefaultState();
    state.arc = 2;
    const html = renderArcComplete(state, '');
    expect(html).toContain('data-prompt');
    expect(html).toMatch(/save/i);
    expect(html).toMatch(/export/i);
    expect(html).toMatch(/continue/i);
  });

  test('shows quest completion stats', () => {
    const state = createDefaultState();
    state.quests = [
      { id: 'q1', title: 'Main Quest', status: 'completed',
        objectives: [{ id: 'o1', description: 'Do thing', completed: true }], clues: [] },
      { id: 'q2', title: 'Side Quest', status: 'active',
        objectives: [{ id: 'o2', description: 'Other thing', completed: false }], clues: [] },
    ];
    const html = renderArcComplete(state, '');
    expect(html).toContain('1'); // 1 completed
    expect(html).toContain('2'); // 2 total
  });

  test('renders without state (fallback)', () => {
    const html = renderArcComplete(null, '');
    expect(html).toContain('Act');
    expect(html).toContain('data-prompt');
  });

  test('includes --data summary text when provided', () => {
    const state = createDefaultState();
    const html = renderArcComplete(state, '', { data: { summary: 'The station fell silent.' } });
    expect(html).toContain('The station fell silent.');
  });

  test('action script copies prompts when sendPrompt is unavailable', () => {
    const html = renderArcComplete(null, '');
    expect(html).toContain("document.execCommand('copy')");
    expect(html).toContain("btn.textContent = 'Copied! Paste as your reply.'");
  });
});
