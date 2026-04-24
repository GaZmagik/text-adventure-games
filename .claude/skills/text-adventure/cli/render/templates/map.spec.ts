import { describe, test, expect } from 'bun:test';
import { renderMap } from './map';
import { createDefaultState } from '../../lib/state-store';
import { extractJsonTagAttr } from '../../tests/support/rendered-widget';

describe('renderMap', () => {
  test('renders map data attribute', () => {
    const state = createDefaultState();
    state.mapState = {
      currentZone: 'Bridge',
      visitedZones: ['Corridor', 'Bridge'],
      revealedZones: ['Corridor', 'Bridge', 'Engineering'],
      doorStates: {},
      supplies: { rations: 10, water: 10 },
    };
    const html = renderMap(state, '');
    expect(html).toContain('data-map=');
    expect(html).toContain('Bridge');
  });

  test('includes fallback HTML content', () => {
    const state = createDefaultState();
    state.mapState = {
      currentZone: 'Alpha',
      visitedZones: ['Alpha'],
      revealedZones: ['Alpha', 'Beta'],
      doorStates: {},
      supplies: null,
    };
    const html = renderMap(state, '');
    expect(html).toContain('widget-map');
    expect(html).toContain('Current: Alpha');
    expect(html).toContain('Beta');
  });

  test('renders empty state when no map data available', () => {
    const state = createDefaultState();
    state.mapState = null as any;
    const html = renderMap(state, '');
    expect(html).toContain('No map data available');
  });

  test('escapes fallback map zone text', () => {
    const state = createDefaultState();
    state.mapState = {
      currentZone: '<img src=x onerror=alert("x")> "quote" &',
      visitedZones: ['Alpha'],
      revealedZones: ['Alpha', '<img src=x onerror=alert(1)> & Beta'],
      doorStates: {},
      supplies: null,
    };
    const html = renderMap(state, '');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(&quot;x&quot;)&gt;');
    expect(html).toContain('&amp; Beta');
  });

  test('serializes rich map zones and visible connections', () => {
    const state = createDefaultState();
    state.mapState = {
      activeMapType: 'dungeon',
      mapName: 'Vault Deck',
      currentZone: 'bridge',
      visitedZones: ['bridge'],
      revealedZones: ['bridge', 'armoury', 'lift'],
      doorStates: { 'bridge:armoury': 'locked' },
      supplies: null,
      zones: [
        {
          id: 'bridge',
          name: 'Bridge',
          x: 40,
          y: 40,
          width: 90,
          height: 50,
          status: 'visited',
          loot: ['keycard'],
          encounters: ['guard'],
        },
        { id: 'armoury', name: 'Armoury', x: 180, y: 40, width: 90, height: 50, status: 'locked' },
        { id: 'lift', name: 'Lift', x: 320, y: 40, width: 70, height: 50, status: 'revealed', icon: 'stairs' },
        { id: 'sealed', name: 'Sealed Room', x: 460, y: 40, width: 90, height: 50, status: 'unexplored' },
      ],
      connections: [
        { from: 'bridge', to: 'armoury', type: 'door' },
        { from: 'armoury', to: 'lift', type: 'stairs', bidirectional: false },
        { from: 'bridge', to: 'sealed', type: 'hidden', discovered: false },
      ],
    };

    const html = renderMap(state, '');
    const config = extractJsonTagAttr<any>(html, 'ta-map', 'data-map');

    expect(config.type).toBe('dungeon');
    expect(config.name).toBe('Vault Deck');
    expect(config.zones.map((zone: any) => zone.id)).toEqual(['bridge', 'armoury', 'lift']);
    expect(config.zones.find((zone: any) => zone.id === 'bridge').status).toBe('current');
    expect(config.zones.find((zone: any) => zone.id === 'bridge').loot).toEqual(['keycard']);
    expect(config.zones.find((zone: any) => zone.id === 'bridge').encounters).toEqual(['guard']);
    expect(config.connections).toHaveLength(2);
    expect(config.connections[0].status).toBe('locked');
  });
});
