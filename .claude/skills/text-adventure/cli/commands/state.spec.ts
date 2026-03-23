import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { handleState } from './state';
import { loadState, saveState, createDefaultState } from '../lib/state-store';
import type { GmState } from '../types';

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

// ── reset ─────────────────────────────────────────────────────────

describe('state reset', () => {
  test('creates a valid default state', async () => {
    const result = await handleState(['reset']);
    expect(result.ok).toBe(true);
    expect(result.command).toBe('state reset');

    const state = await loadState();
    expect(state._version).toBe(1);
    expect(state.character).toBeNull();
    expect(state.rosterMutations).toEqual([]);
    expect(state._stateHistory).toBeInstanceOf(Array);
  });
});

// ── get ───────────────────────────────────────────────────────────

describe('state get', () => {
  test('returns error when no state exists', async () => {
    const result = await handleState(['get', '_version']);
    expect(result.ok).toBe(false);
  });

  test('navigates dot paths correctly', async () => {
    await handleState(['reset']);
    const result = await handleState(['get', '_version']);
    expect(result.ok).toBe(true);
    expect(result.data).toBe(1);
  });

  test('navigates nested dot paths', async () => {
    await handleState(['reset']);
    const result = await handleState(['get', 'time.period']);
    expect(result.ok).toBe(true);
    expect(result.data).toBe('morning');
  });

  test('returns error for non-existent path', async () => {
    await handleState(['reset']);
    const result = await handleState(['get', 'nonexistent.path']);
    expect(result.ok).toBe(false);
    expect(result.error?.corrective).toBeDefined();
  });

  test('returns the full state when path is empty', async () => {
    await handleState(['reset']);
    const result = await handleState(['get']);
    expect(result.ok).toBe(true);
    expect((result.data as GmState)._version).toBe(1);
  });
});

// ── set ───────────────────────────────────────────────────────────

describe('state set', () => {
  test('returns error when no state exists', async () => {
    const result = await handleState(['set', 'scene', '5']);
    expect(result.ok).toBe(false);
  });

  test('modifies a value', async () => {
    await handleState(['reset']);
    const result = await handleState(['set', 'scene', '5']);
    expect(result.ok).toBe(true);

    const state = await loadState();
    expect(state.scene).toBe(5);
  });

  test('modifies a nested value', async () => {
    await handleState(['reset']);
    const result = await handleState(['set', 'time.period', 'evening']);
    expect(result.ok).toBe(true);

    const state = await loadState();
    expect(state.time.period).toBe('evening');
  });

  test('set with += increments a numeric value', async () => {
    await handleState(['reset']);
    await handleState(['set', 'scene', '10']);
    const result = await handleState(['set', 'scene', '+=', '5']);
    expect(result.ok).toBe(true);

    const state = await loadState();
    expect(state.scene).toBe(15);
  });

  test('set with -= decrements a numeric value', async () => {
    await handleState(['reset']);
    await handleState(['set', 'scene', '10']);
    const result = await handleState(['set', 'scene', '-=', '3']);
    expect(result.ok).toBe(true);

    const state = await loadState();
    expect(state.scene).toBe(7);
  });

  test('set records history entry', async () => {
    await handleState(['reset']);
    await handleState(['set', 'scene', '5']);

    const state = await loadState();
    expect(state._stateHistory.length).toBeGreaterThanOrEqual(1);
    const last = state._stateHistory[state._stateHistory.length - 1];
    expect(last.path).toBe('scene');
    expect(last.newValue).toBe(5);
    expect(last.command).toBe('state set');
  });

  test('set boolean values', async () => {
    await handleState(['reset']);
    const result = await handleState(['set', 'time.playerKnowsDate', 'true']);
    expect(result.ok).toBe(true);

    const state = await loadState();
    expect(state.time.playerKnowsDate).toBe(true);
  });

  test('set string values', async () => {
    await handleState(['reset']);
    const result = await handleState(['set', 'currentRoom', 'bridge']);
    expect(result.ok).toBe(true);

    const state = await loadState();
    expect(state.currentRoom).toBe('bridge');
  });
});

// ── create-npc ────────────────────────────────────────────────────

describe('state create-npc', () => {
  test('generates NPC with correct tier stats', async () => {
    await handleState(['reset']);
    const result = await handleState([
      'create-npc', 'guard_01',
      '--name', 'Gate Guard',
      '--tier', 'minion',
      '--pronouns', 'he/him',
      '--role', 'guard',
    ]);
    expect(result.ok).toBe(true);

    const state = await loadState();
    const npc = state.rosterMutations.find(n => n.id === 'guard_01');
    expect(npc).toBeDefined();
    expect(npc!.name).toBe('Gate Guard');
    expect(npc!.tier).toBe('minion');
    expect(npc!.pronouns).toBe('he/him');
    expect(npc!.role).toBe('guard');
    expect(npc!.hp).toBeGreaterThanOrEqual(4);
    expect(npc!.hp).toBeLessThanOrEqual(8);
    expect(npc!.stats.STR).toBeGreaterThanOrEqual(1);
  });

  test('requires --pronouns flag (fails without it)', async () => {
    await handleState(['reset']);
    const result = await handleState([
      'create-npc', 'guard_02',
      '--name', 'Broken Guard',
      '--tier', 'minion',
      '--role', 'guard',
    ]);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toMatch(/pronouns/i);
  });

  test('rejects duplicate NPC ids', async () => {
    await handleState(['reset']);
    await handleState([
      'create-npc', 'guard_03',
      '--name', 'First Guard',
      '--tier', 'minion',
      '--pronouns', 'she/her',
      '--role', 'guard',
    ]);
    const result = await handleState([
      'create-npc', 'guard_03',
      '--name', 'Second Guard',
      '--tier', 'minion',
      '--pronouns', 'they/them',
      '--role', 'guard',
    ]);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toMatch(/already exists/i);
  });

  test('requires --name flag', async () => {
    await handleState(['reset']);
    const result = await handleState([
      'create-npc', 'guard_04',
      '--tier', 'minion',
      '--pronouns', 'he/him',
      '--role', 'guard',
    ]);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toMatch(/name/i);
  });

  test('requires --tier flag', async () => {
    await handleState(['reset']);
    const result = await handleState([
      'create-npc', 'guard_05',
      '--name', 'Guard',
      '--pronouns', 'he/him',
      '--role', 'guard',
    ]);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toMatch(/tier/i);
  });

  test('returns error when no state exists', async () => {
    const result = await handleState([
      'create-npc', 'guard_06',
      '--name', 'Guard',
      '--tier', 'minion',
      '--pronouns', 'he/him',
      '--role', 'guard',
    ]);
    expect(result.ok).toBe(false);
  });
});

// ── validate ──────────────────────────────────────────────────────

describe('state validate', () => {
  test('passes on valid state', async () => {
    await handleState(['reset']);
    const result = await handleState(['validate']);
    expect(result.ok).toBe(true);
    expect((result.data as { valid: boolean }).valid).toBe(true);
  });

  test('catches invalid state', async () => {
    await handleState(['reset']);
    // Corrupt the state manually
    const state = await loadState();
    (state as any)._version = 'broken';
    await saveState(state);

    const result = await handleState(['validate']);
    expect(result.ok).toBe(true); // validate always returns ok; the data carries the result
    expect((result.data as { valid: boolean }).valid).toBe(false);
    expect((result.data as { errors: string[] }).errors.length).toBeGreaterThan(0);
  });
});

// ── history ───────────────────────────────────────────────────────

describe('state history', () => {
  test('returns empty history on fresh state', async () => {
    await handleState(['reset']);
    const result = await handleState(['history']);
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  test('returns recent mutations', async () => {
    await handleState(['reset']);
    await handleState(['set', 'scene', '1']);
    await handleState(['set', 'scene', '2']);
    await handleState(['set', 'scene', '3']);

    const result = await handleState(['history']);
    expect(result.ok).toBe(true);
    expect((result.data as unknown[]).length).toBe(3);
  });

  test('respects --limit flag', async () => {
    await handleState(['reset']);
    await handleState(['set', 'scene', '1']);
    await handleState(['set', 'scene', '2']);
    await handleState(['set', 'scene', '3']);
    await handleState(['set', 'scene', '4']);
    await handleState(['set', 'scene', '5']);

    const result = await handleState(['history', '--limit', '2']);
    expect(result.ok).toBe(true);
    expect((result.data as unknown[]).length).toBe(2);
  });

  test('defaults to 10 entries limit', async () => {
    await handleState(['reset']);
    for (let i = 0; i < 15; i++) {
      await handleState(['set', 'scene', String(i)]);
    }

    const result = await handleState(['history']);
    expect(result.ok).toBe(true);
    expect((result.data as unknown[]).length).toBe(10);
  });

  test('returns error when no state exists', async () => {
    const result = await handleState(['history']);
    expect(result.ok).toBe(false);
  });
});

// ── unknown subcommand ────────────────────────────────────────────

describe('state unknown subcommand', () => {
  test('returns error for unknown subcommand', async () => {
    const result = await handleState(['banana']);
    expect(result.ok).toBe(false);
    expect(result.error?.corrective).toBeDefined();
  });
});
