import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleMap } from './map';
import { handleState } from './state';
import { handleWorld } from './world';
import { saveState, tryLoadState } from '../lib/state-store';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(async () => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-map-hazards-'));
  process.env.TAG_STATE_DIR = tempDir;
  await handleState(['reset']);
  await handleWorld(['generate', '--seed', 'hazard-test-seed', '--theme', 'space', '--apply']);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) process.env.TAG_STATE_DIR = originalEnv;
  else delete process.env.TAG_STATE_DIR;
});

describe('map hazards and encounters', () => {
  test('triggers hazards when entering a zone with connection hazards', async () => {
    const state = await tryLoadState();
    const mapState = state?.mapState;
    if (!mapState) throw new Error('No map state');

    const current = mapState.currentZone;
    const connections = mapState.connections || [];
    const route = connections.find(c => c.from === current || (c.bidirectional !== false && c.to === current));
    if (!route) throw new Error('No route found');

    const dest = route.from === current ? route.to : route.from;

    // Inject a hazard into the connection
    route.hazards = [{ id: 'test_hazard', type: 'trap', dc: 15, description: 'A deadly trap' }];
    if (state) await saveState(state);

    const result = await handleMap(['enter', dest]);
    expect(result.ok).toBe(true);
    
    const updated = await tryLoadState();
    const pending = updated?._pendingRolls || [];
    expect(pending.length).toBeGreaterThan(0);
    const first = pending[0];
    if (first) {
      expect(first.type).toBe('hazard');
      expect(first.dc).toBe(15);
      expect(String(first.action)).toContain('test_hazard');
    }
  });

  test('triggers encounter when encounterChance is met', async () => {
    const state = await tryLoadState();
    const mapState = state?.mapState;
    if (!mapState) throw new Error('No map state');

    const current = mapState.currentZone;
    const connections = mapState.connections || [];
    const route = connections.find(c => c.from === current || (c.bidirectional !== false && c.to === current));
    if (!route) throw new Error('No route found');
    
    const dest = route.from === current ? route.to : route.from;

    // Force encounter chance to 100%
    route.encounterChance = 1.0;
    if (state) await saveState(state);

    const result = await handleMap(['enter', dest]);
    expect(result.ok).toBe(true);
    expect((result.data as any).encounterTriggered).toBe(true);
  });

  test('triggers zone hazards when entering a dangerous zone', async () => {
    const state = await tryLoadState();
    const mapState = state?.mapState;
    if (!mapState) throw new Error('No map state');
    
    const current = mapState.currentZone;
    const connections = mapState.connections || [];
    const route = connections.find(c => c.from === current || (c.bidirectional !== false && c.to === current));
    if (!route) throw new Error('No route found');
    
    const dest = route.from === current ? route.to : route.from;

    // Inject a hazard into the destination zone
    const zone = mapState.zones?.find(z => z.id === dest);
    if (zone) {
      zone.hazards = [{ id: 'zone_hazard', type: 'environmental', dc: 10, description: 'Radiation leak' }];
    }
    if (state) await saveState(state);

    const result = await handleMap(['enter', dest]);
    expect(result.ok).toBe(true);

    const updated = await tryLoadState();
    const pending = updated?._pendingRolls || [];
    expect(pending.some(r => String(r.action).includes('zone_hazard'))).toBe(true);
  });
});
