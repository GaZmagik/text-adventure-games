import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleState } from './state';
import { handleWorld } from './world';
import { tryLoadState } from '../lib/state-store';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-world-'));
  process.env.TAG_STATE_DIR = tempDir;
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) process.env.TAG_STATE_DIR = originalEnv;
  else delete process.env.TAG_STATE_DIR;
});

describe('world generate', () => {
  test('requires a seed', async () => {
    const result = await handleWorld(['generate']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('Missing --seed');
  });

  test('rejects invalid themes', async () => {
    const result = await handleWorld(['generate', '--seed', 'x', '--theme', 'western']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('Invalid --theme');
  });

  test('returns preview data without requiring or writing state', async () => {
    const result = await handleWorld(['generate', '--seed', 'preview-seed', '--theme', 'space']);
    expect(result.ok).toBe(true);
    const data = result.data as { applied: boolean; worldData: { seed: string }; mapState: { currentZone: string } };
    expect(data.applied).toBe(false);
    expect(data.worldData.seed).toBe('preview-seed');
    expect(data.mapState.currentZone).toBeTruthy();
    expect(await tryLoadState()).toBeNull();
  });

  test('applies generated world to state', async () => {
    await handleState(['reset']);
    const result = await handleWorld(['generate', '--seed', 'apply-seed', '--theme', 'dungeon', '--apply']);
    expect(result.ok).toBe(true);

    const state = await tryLoadState();
    expect(state?.worldData?.seed).toBe('apply-seed');
    expect(state?.theme).toBe('dungeon');
    expect(state?.mapState?.currentZone).toBe(state?.worldData?.startRoom);
    expect(state?.currentRoom).toBe(state?.worldData?.startRoom);
    expect(state?.quests.some(quest => quest.id === 'world_main')).toBe(true);
    expect(state?.codexMutations.some(entry => entry.via === 'worldgen')).toBe(true);
    expect(state?._stateHistory.some(entry => entry.command === 'world generate')).toBe(true);
  });
});
