import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { join } from 'path';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { loadState, saveState, stateExists, createDefaultState, getStatePath } from './state-store';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-test-'));
  process.env.TAG_STATE_DIR = tempDir;
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) {
    process.env.TAG_STATE_DIR = originalEnv;
  } else {
    delete process.env.TAG_STATE_DIR;
  }
});

describe('getStatePath', () => {
  test('uses TAG_STATE_DIR env var', () => {
    expect(getStatePath()).toBe(join(tempDir, 'state.json'));
  });
});

describe('createDefaultState', () => {
  test('returns valid state with version 1', () => {
    const state = createDefaultState();
    expect(state._version).toBe(1);
    expect(state.scene).toBe(0);
    expect(state.character).toBeNull();
    expect(state.rosterMutations).toEqual([]);
    expect(state.factions).toEqual({});
    expect(state.quests).toEqual([]);
    expect(state._stateHistory).toEqual([]);
    expect(state.time.period).toBe('morning');
    expect(state.time.elapsed).toBe(0);
  });
});

describe('stateExists', () => {
  test('returns false when no state file', async () => {
    expect(await stateExists()).toBe(false);
  });

  test('returns true after saving state', async () => {
    await saveState(createDefaultState());
    expect(await stateExists()).toBe(true);
  });
});

describe('saveState and loadState', () => {
  test('round-trips state correctly', async () => {
    const state = createDefaultState();
    state.scene = 5;
    state.factions = { rebels: 42, empire: -30 };
    await saveState(state);
    const loaded = await loadState();
    expect(loaded.scene).toBe(5);
    expect(loaded.factions).toEqual({ rebels: 42, empire: -30 });
    expect(loaded._version).toBe(1);
  });

  test('loadState throws when file is missing', async () => {
    expect(loadState()).rejects.toThrow();
  });

  test('creates directory if it does not exist', async () => {
    const nested = join(tempDir, 'nested', 'deep');
    process.env.TAG_STATE_DIR = nested;
    await saveState(createDefaultState());
    expect(await stateExists()).toBe(true);
  });
});
