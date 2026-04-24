import { describe, expect, test } from 'bun:test';
import { createDefaultState } from '../../lib/state-store';
import { applyWorldSeedPayload, buildWorldSeedPayload } from '../../lib/map-adapter';
import { generateWorld } from '../../lib/worldgen';
import { extractJsonTagAttr } from '../../tests/support/rendered-widget';
import { renderRoutePlanner } from './route-planner';

type RoutePayload = {
  reachable: boolean;
  path: string[];
  pathLabels: string[];
  zones: Array<{ id: string; label: string }>;
  blockers: string[];
  prompt: string;
};

function generatedState() {
  const state = createDefaultState();
  applyWorldSeedPayload(state, buildWorldSeedPayload(generateWorld('panel-seed', 'space')));
  return state;
}

function readRoute(html: string): RoutePayload {
  return extractJsonTagAttr<RoutePayload>(html, 'ta-route-planner', 'data-route');
}

describe('renderRoutePlanner', () => {
  test('plans across discovered unlocked map connections', () => {
    const state = generatedState();
    const target = state.mapState!.revealedZones.find(zone => zone !== state.mapState!.currentZone)!;

    const route = readRoute(
      renderRoutePlanner(state, '', {
        data: { from: state.mapState!.currentZone, to: target },
      }),
    );

    expect(route.reachable).toBe(true);
    expect(route.path[0]).toBe(state.mapState!.currentZone);
    expect(route.path.at(-1)).toBe(target);
    expect(route.pathLabels.length).toBe(route.path.length);
    expect(route.prompt).toContain('Travel from');
  });

  test('exposes only known zones as route choices', () => {
    const state = generatedState();
    const route = readRoute(renderRoutePlanner(state, ''));
    const known = new Set(state.mapState!.revealedZones);

    expect(route.zones.length).toBeGreaterThan(0);
    expect(route.zones.every(zone => known.has(zone.id) || zone.id === state.mapState!.currentZone)).toBe(true);
  });

  test('returns an unreachable payload when map data is absent', () => {
    const route = readRoute(renderRoutePlanner(null, '', { data: { from: 'alpha', to: 'omega' } }));

    expect(route.reachable).toBe(false);
    expect(route.blockers).toEqual(['No map data']);
    expect(route.prompt).toContain('Find or unlock a route');
  });
});
