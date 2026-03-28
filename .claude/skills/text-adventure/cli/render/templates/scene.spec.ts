import { describe, test, expect } from 'bun:test';
import { renderScene } from './scene';
import { createDefaultState } from '../../lib/state-store';

describe('renderScene panel pre-population', () => {
  test('character panel contains character data when character exists', () => {
    const state = createDefaultState();
    state.character = {
      name: 'Kira', class: 'Pilot', hp: 18, maxHp: 24, ac: 14,
      level: 4, xp: 3200, currency: 150, currencyName: 'credits',
      stats: { STR: 10, DEX: 16, CON: 12, INT: 14, WIS: 11, CHA: 13 },
      modifiers: { STR: 0, DEX: 3, CON: 1, INT: 2, WIS: 0, CHA: 1 },
      proficiencyBonus: 2, proficiencies: ['Piloting'],
      abilities: ['Quick Draw'],
      inventory: [{ name: 'Blaster', type: 'weapon', slots: 1 }],
      conditions: [],
      equipment: { weapon: 'Blaster Pistol', armour: 'Flight Suit' },
    };
    const html = renderScene(state, '');
    // Character panel should contain the character's name, not be empty
    expect(html).toContain('data-panel="character"');
    expect(html).toMatch(/data-panel="character"[^>]*>[\s\S]*?Kira/);
  });

  test('codex panel contains entries when codex module active', () => {
    const state = createDefaultState();
    state.modulesActive = ['lore-codex'];
    state.codexMutations = [
      { id: 'ancient-signal', state: 'discovered', discoveredAt: 1, via: 'sensor sweep', secrets: [] },
    ];
    const html = renderScene(state, '');
    expect(html).toContain('data-panel="codex"');
    expect(html).toMatch(/data-panel="codex"[^>]*>[\s\S]*?ancient-signal/);
  });

  test('quests panel contains quest data when core-systems active', () => {
    const state = createDefaultState();
    state.modulesActive = ['core-systems'];
    state.quests = [{
      id: 'find-beacon', title: 'Find the Beacon', status: 'active',
      objectives: [{ id: 'locate', description: 'Locate the signal source', completed: false }],
      clues: ['Signal originates from sector 7'],
    }];
    const html = renderScene(state, '');
    expect(html).toContain('data-panel="quests"');
    expect(html).toMatch(/data-panel="quests"[^>]*>[\s\S]*?Find the Beacon/);
  });

  test('map panel contains zone data when geo-map active', () => {
    const state = createDefaultState();
    state.modulesActive = ['geo-map'];
    state.mapState = {
      currentZone: 'Cargo Bay',
      visitedZones: ['Cargo Bay', 'Airlock'],
      revealedZones: ['Cargo Bay', 'Airlock', 'Bridge'],
      doorStates: {},
      supplies: null,
    };
    const html = renderScene(state, '');
    expect(html).toContain('data-panel="map"');
    expect(html).toMatch(/data-panel="map"[^>]*>[\s\S]*?Cargo Bay/);
  });

  test('empty character panel shows fallback when no character', () => {
    const state = createDefaultState();
    const html = renderScene(state, '');
    expect(html).toContain('data-panel="character"');
    expect(html).toMatch(/data-panel="character"[^>]*>[\s\S]*?No character data/);
  });
});
