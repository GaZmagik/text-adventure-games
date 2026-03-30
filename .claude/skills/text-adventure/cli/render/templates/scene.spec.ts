import { describe, test, expect } from 'bun:test';
import { renderScene } from './scene';
import { createDefaultState } from '../../lib/state-store';
import { MODULE_PANEL_MAP } from '../../lib/module-panel-map';

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

  test('module with no renderer and not quests produces empty panel div', () => {
    // Temporarily add a fake module→panel mapping with no renderer
    MODULE_PANEL_MAP['test-module'] = 'test-panel';
    try {
      const state = createDefaultState();
      state.modulesActive = ['test-module'];
      const html = renderScene(state, '');
      // The fallback branch produces an empty panel-content div
      expect(html).toContain('data-panel="test-panel"');
      // It should be an empty div — no content inside
      expect(html).toMatch(/data-panel="test-panel"><\/div>/);
    } finally {
      delete MODULE_PANEL_MAP['test-module'];
    }
  });
});

describe('renderScene font-family fallback', () => {
  test('panel-content has inline font-family to prevent monospace flash', () => {
    const state = createDefaultState();
    const html = renderScene(state, '');
    expect(html).toMatch(/\.panel-content[^}]*font-family:/);
    expect(html).toMatch(/\.panel-content[^}]*sans-serif/);
  });
});

describe('renderScene multi-phase reveal', () => {
  test('default (no phases option) has no scene-phase wrappers', () => {
    const state = createDefaultState();
    const html = renderScene(state, '');
    expect(html).not.toContain('scene-phase');
    expect(html).not.toContain('phase-continue');
  });

  test('phases: 1 has no scene-phase wrappers (backward compat)', () => {
    const state = createDefaultState();
    const html = renderScene(state, '', { phases: 1 });
    expect(html).not.toContain('scene-phase');
  });

  test('phases: 2 renders two phase divs', () => {
    const state = createDefaultState();
    const html = renderScene(state, '', { phases: 2 });
    expect(html).toContain('data-phase="1"');
    expect(html).toContain('data-phase="2"');
    expect(html).not.toContain('data-phase="3"');
  });

  test('phases: 3 renders three phase divs', () => {
    const state = createDefaultState();
    const html = renderScene(state, '', { phases: 3 });
    expect(html).toContain('data-phase="1"');
    expect(html).toContain('data-phase="2"');
    expect(html).toContain('data-phase="3"');
  });

  test('phase 1 is visible, subsequent phases are hidden', () => {
    const state = createDefaultState();
    const html = renderScene(state, '', { phases: 2 });
    expect(html).toMatch(/data-phase="1">/);
    expect(html).toMatch(/data-phase="2"[^>]*style="display:none"/);
  });

  test('non-final phases have Continue buttons with data-reveal-phase', () => {
    const state = createDefaultState();
    const html = renderScene(state, '', { phases: 3 });
    expect(html).toContain('data-reveal-phase="2"');
    expect(html).toContain('data-reveal-phase="3"');
    // Final phase has no Continue
    expect(html).not.toContain('data-reveal-phase="4"');
  });

  test('each phase has a narrative placeholder', () => {
    const state = createDefaultState();
    const html = renderScene(state, '', { phases: 2 });
    expect(html).toContain('<!-- [NARRATIVE: Phase 1');
    expect(html).toContain('<!-- [NARRATIVE: Phase 2');
  });
});
