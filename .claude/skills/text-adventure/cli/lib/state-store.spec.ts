import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { join } from 'node:path';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { loadState, saveState, createDefaultState, getStatePath, tryLoadState } from './state-store';

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

  test('generates a random seed string', () => {
    const state = createDefaultState();
    expect(typeof state.seed).toBe('string');
    expect(state.seed!.length).toBeGreaterThan(0);
  });

  test('generates different seeds on successive calls', () => {
    const s1 = createDefaultState();
    const s2 = createDefaultState();
    expect(s1.seed).not.toBe(s2.seed);
  });
});

describe('tryLoadState existence check', () => {
  test('returns null when no state file', async () => {
    expect(await tryLoadState()).toBeNull();
  });

  test('returns state after saving', async () => {
    await saveState(createDefaultState());
    expect(await tryLoadState()).not.toBeNull();
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
    expect(await tryLoadState()).not.toBeNull();
  });
});

// ── T5: saveState caps rollHistory at 50 entries ─────────────────────

describe('saveState rollHistory capping', () => {
  test('caps rollHistory to 50 entries, dropping the oldest', async () => {
    const state = createDefaultState();
    // Create 51 entries with ascending scene numbers to identify order
    state.rollHistory = [];
    for (let i = 0; i < 51; i++) {
      state.rollHistory.push({
        scene: i,
        type: 'test',
        stat: 'STR',
        roll: 10,
        modifier: 0,
        total: 10,
        dc: 10,
        outcome: 'success',
      });
    }
    await saveState(state);
    const loaded = await loadState();
    expect(loaded.rollHistory.length).toBe(50);
    // The oldest entry (scene=0) should have been dropped; first entry is scene=1
    expect(loaded.rollHistory[0]!.scene).toBe(1);
    // The last entry should still be scene=50
    expect(loaded.rollHistory[49]!.scene).toBe(50);
  });
});

// ── T6: tryLoadState returns null gracefully ─────────────────────────

describe('tryLoadState', () => {
  test('returns null when no state file exists', async () => {
    // tempDir is empty — no state.json written in this test
    const result = await tryLoadState();
    expect(result).toBeNull();
  });

  test('returns null for invalid JSON without throwing', async () => {
    const statePath = getStatePath();
    writeFileSync(statePath, '{{not valid json!!!');
    const result = await tryLoadState();
    expect(result).toBeNull();
  });
});
