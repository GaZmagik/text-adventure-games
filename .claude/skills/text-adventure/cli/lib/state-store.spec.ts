import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { join } from 'node:path';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import {
  loadState,
  saveState,
  createDefaultState,
  flushStateStoreContext,
  getStatePath,
  STATE_STORE_RUNTIME,
  tryLoadState,
  withStateStoreContext,
} from './state-store';

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
        type: 'contested_roll',
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

// ── T1-1: isPlausibleGmState validation guard ───────────────────────

describe('loadState rejects non-object JSON', () => {
  test('throws when state.json contains a JSON array', async () => {
    const statePath = getStatePath();
    writeFileSync(statePath, JSON.stringify([1, 2, 3]));
    expect(loadState()).rejects.toThrow('does not contain a valid object');
  });

  test('throws when state.json contains a JSON string primitive', async () => {
    const statePath = getStatePath();
    writeFileSync(statePath, JSON.stringify('hello'));
    expect(loadState()).rejects.toThrow('does not contain a valid object');
  });

  test('throws when state.json contains JSON null', async () => {
    const statePath = getStatePath();
    writeFileSync(statePath, JSON.stringify(null));
    expect(loadState()).rejects.toThrow('does not contain a valid object');
  });
});

describe('tryLoadState returns null for non-object JSON', () => {
  test('returns null when state.json contains a JSON array', async () => {
    const statePath = getStatePath();
    writeFileSync(statePath, JSON.stringify([1, 2, 3]));
    const result = await tryLoadState();
    expect(result).toBeNull();
  });

  test('returns null when state.json contains a JSON string primitive', async () => {
    const statePath = getStatePath();
    writeFileSync(statePath, JSON.stringify('hello'));
    const result = await tryLoadState();
    expect(result).toBeNull();
  });

  test('returns null when state.json contains JSON null', async () => {
    const statePath = getStatePath();
    writeFileSync(statePath, JSON.stringify(null));
    const result = await tryLoadState();
    expect(result).toBeNull();
  });
});

describe('state-store edge cases', () => {
  test('rejects TAG_STATE_DIR outside the home or temp directory', () => {
    process.env.TAG_STATE_DIR = '/etc/tag-state';
    expect(() => getStatePath()).toThrow('within the home or temp directory');
  });

  test('loadState rejects structurally invalid objects', async () => {
    const invalid = createDefaultState() as Record<string, unknown>;
    invalid._version = 'broken';
    writeFileSync(getStatePath(), JSON.stringify(invalid), 'utf-8');

    await expect(loadState()).rejects.toThrow('structurally invalid');
  });

  test('returns null when the file disappears between exists and read', async () => {
    const bunApi = Bun as any;
    const originalFile = bunApi.file;
    bunApi.file = () => ({
      exists: async () => true,
      size: 0,
      json: async () => {
        const err = new Error('gone') as Error & { code: string };
        err.code = 'ENOENT';
        throw err;
      },
    });

    try {
      expect(await tryLoadState()).toBeNull();
    } finally {
      bunApi.file = originalFile;
    }
  });

  test('rethrows unexpected read errors from tryLoadState', async () => {
    // Write a real file so statSync() finds it on disk before the mock's json() runs
    const state = createDefaultState();
    writeFileSync(getStatePath(), JSON.stringify(state), 'utf-8');

    const bunApi = Bun as any;
    const originalFile = bunApi.file;
    bunApi.file = () => ({
      exists: async () => true,
      json: async () => {
        const err = new Error('blocked') as Error & { code: string };
        err.code = 'EACCES';
        throw err;
      },
    });

    try {
      await expect(tryLoadState()).rejects.toThrow('blocked');
    } finally {
      bunApi.file = originalFile;
    }
  });

  test('rejects nested state-store contexts', async () => {
    await expect(withStateStoreContext(async () => withStateStoreContext(async () => 1))).rejects.toThrow(
      'Nested state-store contexts',
    );
  });

  test('requires an active context before flushing', async () => {
    await expect(flushStateStoreContext()).rejects.toThrow('No active state-store context');
  });

  test('loadState throws when an active context has already cached null', async () => {
    await withStateStoreContext(async () => {
      expect(await tryLoadState()).toBeNull();
      await expect(loadState()).rejects.toThrow('State file not found');
    });
  });

  test('requires a non-root home directory during state-dir validation', () => {
    const originalHomedir = STATE_STORE_RUNTIME.homedir;
    STATE_STORE_RUNTIME.homedir = () => '/';
    try {
      expect(() => getStatePath()).toThrow('non-root home directory');
    } finally {
      STATE_STORE_RUNTIME.homedir = originalHomedir;
    }
  });

  test('preserves the original write error when temp-file cleanup also fails', async () => {
    const originalRename = STATE_STORE_RUNTIME.renameSync;
    const originalUnlink = STATE_STORE_RUNTIME.unlinkSync;

    STATE_STORE_RUNTIME.renameSync = () => {
      throw new Error('rename failed');
    };
    STATE_STORE_RUNTIME.unlinkSync = () => {
      throw new Error('unlink failed');
    };

    try {
      await expect(
        import('./state-store').then(({ saveState: writeState }) => writeState(createDefaultState())),
      ).rejects.toThrow('rename failed');
    } finally {
      STATE_STORE_RUNTIME.renameSync = originalRename;
      STATE_STORE_RUNTIME.unlinkSync = originalUnlink;
    }
  });

  test('rejects invalid state writes inside an active context', async () => {
    const invalid = createDefaultState() as Record<string, unknown>;
    invalid._version = 'broken';

    await withStateStoreContext(async () => {
      await expect(saveState(invalid as any)).rejects.toThrow('State is structurally invalid');
    });
  });

  test('loadState reads from disk once inside an active context and then returns clones', async () => {
    const state = createDefaultState();
    state.scene = 7;
    await saveState(state);

    await withStateStoreContext(async () => {
      const first = await loadState();
      const second = await loadState();
      first.scene = 99;
      expect(second.scene).toBe(7);
    });
  });

  test('logs warning when context drops with dirty unsaved state', async () => {
    const state = createDefaultState();
    await saveState(state);

    const errors: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      errors.push(String(args[0]));
    };

    try {
      await withStateStoreContext(async () => {
        // Load state, mutate it (makes context dirty), then throw
        const loaded = await loadState();
        loaded.scene = 42;
        await saveState(loaded);
        throw new Error('deliberate test exception');
      }).catch(() => {
        /* swallow the rethrown error */
      });

      // The finally block should have logged a dirty-state warning
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('unsaved changes');
      expect(errors[0]).toContain('virtual write');
    } finally {
      console.error = originalError;
    }
  });
});
