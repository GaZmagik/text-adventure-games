import { describe, test, expect } from 'bun:test';
import { renderMap } from './map';
import { createDefaultState } from '../../lib/state-store';

describe('renderMap', () => {
  test('renders map data attribute', () => {
    const state = createDefaultState();
    state.mapState = {
      currentZone: 'Bridge',
      visitedZones: ['Corridor', 'Bridge'],
      revealedZones: ['Corridor', 'Bridge', 'Engineering'],
      doorStates: {},
      supplies: { rations: 10, water: 10 }
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
      supplies: null
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
});
