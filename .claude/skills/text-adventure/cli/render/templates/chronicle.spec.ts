import { describe, test, expect } from 'bun:test';
import { renderChronicle } from './chronicle';
import { createDefaultState } from '../../lib/state-store';
import { extractJsonTagAttr } from '../../tests/support/rendered-widget';

type ChronicleConfig = {
  scenes: Array<{ scene: number; events: Array<{ type: string; desc: string }>; travel: unknown[] }>;
  currentChar: string;
  currentLocation: string;
};

function buildState() {
  const state = createDefaultState();
  state.currentRoom = 'Bridge';
  state.scene = 5;
  state.arc = 1;
  state.theme = 'sci-fi';
  state.modulesActive = ['core-systems'];
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
    proficiencies: ['Athletics', 'Perception'],
    abilities: ['Second Wind'],
    equipment: { weapon: 'Pulse Rifle', armour: 'Tactical Vest' },
    inventory: [{ name: 'Medkit', type: 'gear', slots: 1, description: 'Emergency supplies' }],
    conditions: [],
  };
  state.time = {
    period: 'evening',
    date: 'Day 3',
    elapsed: 3,
    hour: 19,
    playerKnowsDate: false,
    playerKnowsTime: false,
    calendarSystem: 'elapsed-only',
    deadline: null,
  };
  state._stateHistory = [
    { command: 'scene 1', timestamp: '2026-04-28T00:00:01Z', path: 'scene', oldValue: 0, newValue: 1 },
    {
      command: 'quest complete q1 o1',
      timestamp: '2026-04-28T00:00:02Z',
      path: 'quests.q1.objectives.o1',
      oldValue: false,
      newValue: true,
    },
    { command: 'scene 2', timestamp: '2026-04-28T00:00:03Z', path: 'scene', oldValue: 1, newValue: 2 },
    {
      command: 'compute hazard CON --dc 12',
      timestamp: '2026-04-28T00:00:04Z',
      path: 'rollHistory.0',
      oldValue: null,
      newValue: { type: 'hazard_save', stat: 'CON', dc: 12 },
    },
  ];
  state.mapState = {
    currentZone: 'Bridge',
    visitedZones: ['Bridge'],
    revealedZones: ['Bridge'],
    doorStates: {},
    travelLog: [{ from: 'Bay', to: 'Bridge', scene: 1, time: 'morning' }],
  };
  return state;
}

function readConfig(html: string): ChronicleConfig {
  return extractJsonTagAttr<ChronicleConfig>(html, 'ta-chronicle', 'data-config');
}

describe('renderChronicle', () => {
  test('emits a <ta-chronicle> custom element', () => {
    const html = renderChronicle(buildState(), 'station');
    expect(html).toContain('<ta-chronicle');
    expect(html).toContain('</ta-chronicle>');
  });

  test('renders error message when state is null', () => {
    const html = renderChronicle(null, 'station');
    expect(html).toContain('No state available');
  });

  test('includes data-config attribute with history data', () => {
    const config = readConfig(renderChronicle(buildState(), 'station'));
    expect(config.currentChar).toBe('Kael');
    expect(config.currentLocation).toBe('Bridge');
  });

  test('groups history events and travel into structured scene buckets', () => {
    const config = readConfig(renderChronicle(buildState(), 'station'));
    expect(config.scenes.map(scene => scene.scene)).toEqual([5, 2, 1]);
    expect(config.scenes[0]?.events.map(event => event.type)).toEqual(['quest', 'roll']);
    expect(config.scenes[2]?.travel).toHaveLength(1);
  });

  test('includes travel log data', () => {
    const config = readConfig(renderChronicle(buildState(), 'station'));
    expect(config.scenes[2]?.travel).toEqual([{ from: 'Bay', to: 'Bridge', scene: 1, time: 'morning' }]);
  });
});
