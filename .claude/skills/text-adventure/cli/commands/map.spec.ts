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
  tempDir = mkdtempSync(join(tmpdir(), 'tag-map-'));
  process.env.TAG_STATE_DIR = tempDir;
  await handleState(['reset']);
  await handleWorld(['generate', '--seed', 'map-command-seed', '--theme', 'space', '--apply']);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) process.env.TAG_STATE_DIR = originalEnv;
  else delete process.env.TAG_STATE_DIR;
});

describe('map command dispatch', () => {
  test('requires a subcommand', async () => {
    const result = await handleMap([]);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('No subcommand');
  });

  test('inspect returns zone and world room details', async () => {
    const state = await tryLoadState();
    const current = state!.mapState!.currentZone;
    const result = await handleMap(['inspect', current]);

    expect(result.ok).toBe(true);
    const data = result.data as { zone: { id: string }; room: { id: string }; current: boolean };
    expect(data.zone.id).toBe(current);
    expect(data.room.id).toBe(current);
    expect(data.current).toBe(true);
  });

  test('route returns a non-mutating path plan', async () => {
    const state = await tryLoadState();
    const current = state!.mapState!.currentZone;
    const target = state!.mapState!.revealedZones.find(zone => zone !== current)!;

    const result = await handleMap(['route', current, target]);

    expect(result.ok).toBe(true);
    const data = result.data as { reachable: boolean; path: string[]; steps: number };
    expect(data.reachable).toBe(true);
    expect(data.path[0]).toBe(current);
    expect(data.path.at(-1)).toBe(target);
    const updated = await tryLoadState();
    expect(updated!._stateHistory.some(entry => entry.command === 'map route')).toBe(false);
    expect(updated!.mapState!.currentZone).toBe(current);
    expect(data.steps).toBeGreaterThanOrEqual(1);
  });
});

describe('map reveal/discover/unlock/enter', () => {
  test('reveals a known generated zone', async () => {
    const state = await tryLoadState();
    const hidden = state!.mapState!.zones!.find(zone => !state!.mapState!.revealedZones.includes(zone.id))!;

    const result = await handleMap(['reveal', hidden.id]);
    expect(result.ok).toBe(true);

    const updated = await tryLoadState();
    expect(updated!.mapState!.revealedZones).toContain(hidden.id);
  });

  test('discovers a hidden route and reveals the destination', async () => {
    const state = await tryLoadState();
    const hidden = state!.mapState!.connections!.find(connection => connection.discovered === false)!;

    const result = await handleMap(['discover', hidden.from, hidden.to]);
    expect(result.ok).toBe(true);

    const updated = await tryLoadState();
    const route = updated!.mapState!.connections!.find(connection => connection.id === hidden.id)!;
    expect(route.discovered).toBe(true);
    expect(updated!.mapState!.revealedZones).toContain(hidden.to);
  });

  test('unlocks a route by connection id', async () => {
    const state = await tryLoadState();
    const connection = state!.mapState!.connections![0]!;
    connection.locked = true;
    connection.status = 'locked';
    state!.mapState!.doorStates[`${connection.from}:${connection.to}`] = 'locked';
    await saveState(state!);

    const result = await handleMap(['unlock', connection.id!]);
    expect(result.ok).toBe(true);

    const updated = await tryLoadState();
    const route = updated!.mapState!.connections!.find(item => item.id === connection.id)!;
    expect(route.locked).toBe(false);
    expect(route.status).toBe('open');
    expect(updated!.mapState!.doorStates[`${connection.from}:${connection.to}`]).toBe('open');
  });

  test('enters an adjacent discovered unlocked zone', async () => {
    const state = await tryLoadState();
    const current = state!.mapState!.currentZone;
    const route = state!.mapState!.connections!.find(
      connection =>
        connection.discovered !== false &&
        !connection.locked &&
        (connection.from === current || connection.to === current),
    )!;
    const destination = route.from === current ? route.to : route.from;

    const result = await handleMap(['enter', destination]);
    expect(result.ok).toBe(true);

    const updated = await tryLoadState();
    expect(updated!.currentRoom).toBe(destination);
    expect(updated!.mapState!.currentZone).toBe(destination);
    expect(updated!.mapState!.visitedZones).toContain(destination);
    expect(updated!._stateHistory.some(entry => entry.command === 'map enter')).toBe(true);
  });
});
