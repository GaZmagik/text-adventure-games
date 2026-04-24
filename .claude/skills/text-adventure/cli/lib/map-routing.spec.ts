import { describe, expect, test } from 'bun:test';
import type { MapState } from '../types';
import { planMapRoute } from './map-routing';

function mapState(): MapState {
  return {
    currentZone: 'bridge',
    visitedZones: ['bridge'],
    revealedZones: ['bridge', 'cargo', 'engine', 'vault'],
    doorStates: {},
    supplies: { rations: 4, water: 4 },
    zones: [
      { id: 'bridge', name: 'Bridge' },
      { id: 'cargo', name: 'Cargo' },
      { id: 'engine', name: 'Engine' },
      { id: 'vault', name: 'Vault' },
    ],
    connections: [
      { id: 'bridge-cargo', from: 'bridge', to: 'cargo', status: 'open' },
      { id: 'cargo-engine', from: 'cargo', to: 'engine', status: 'open' },
      { id: 'engine-vault', from: 'engine', to: 'vault', status: 'locked', locked: true },
    ],
  };
}

describe('planMapRoute', () => {
  test('returns the shortest discovered unlocked path', () => {
    const route = planMapRoute(mapState(), 'bridge', 'engine');

    expect(route.reachable).toBe(true);
    expect(route.path).toEqual(['bridge', 'cargo', 'engine']);
    expect(route.steps).toBe(2);
    expect(route.supplyCost).toEqual({ rations: 2, water: 2 });
  });

  test('reports blockers at the reachable frontier', () => {
    const route = planMapRoute(mapState(), 'bridge', 'vault');

    expect(route.reachable).toBe(false);
    expect(route.blockers).toContain('engine-vault locked');
  });

  test('rejects unknown endpoints', () => {
    const route = planMapRoute(mapState(), 'bridge', 'void');

    expect(route.reachable).toBe(false);
    expect(route.blockers).toEqual(['Unknown zone: void']);
  });
});
