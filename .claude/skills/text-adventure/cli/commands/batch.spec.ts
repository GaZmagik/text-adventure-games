import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { BATCH_COMMAND_HANDLERS, handleBatch } from './batch';
import { TOP_LEVEL_COMMANDS } from '../metadata';
import { saveState, createDefaultState, loadState, STATE_STORE_RUNTIME } from '../lib/state-store';
import type { NpcMutation } from '../types';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

function makeNpc(): NpcMutation {
  return {
    id: 'merchant_01', name: 'Greel', pronouns: 'they/them', role: 'merchant',
    tier: 'rival', level: 4,
    stats: { STR: 10, DEX: 12, CON: 12, INT: 14, WIS: 14, CHA: 12 },
    modifiers: { STR: 0, DEX: 1, CON: 1, INT: 2, WIS: 2, CHA: 1 },
    hp: 16, maxHp: 16, ac: 12, soak: 2, damageDice: '1d8',
    status: 'active', alive: true, trust: 50,
    disposition: 'neutral', dispositionSeed: 0.5,
  };
}

beforeEach(async () => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-batch-'));
  process.env.TAG_STATE_DIR = tempDir;
  const state = createDefaultState();
  state.rosterMutations = [makeNpc()];
  state.character = {
    name: 'Hero', class: 'Scout', hp: 20, maxHp: 20, ac: 13,
    level: 3, xp: 500, currency: 100, currencyName: 'credits',
    stats: { STR: 10, DEX: 16, CON: 10, INT: 10, WIS: 14, CHA: 12 },
    modifiers: { STR: 0, DEX: 3, CON: 0, INT: 0, WIS: 2, CHA: 1 },
    proficiencyBonus: 2, proficiencies: ['Stealth'],
    abilities: [], inventory: [], conditions: [],
    equipment: { weapon: 'Blaster', armour: 'Vest' },
  };
  await saveState(state);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) process.env.TAG_STATE_DIR = originalEnv;
  else delete process.env.TAG_STATE_DIR;
});

describe('batch mode', () => {
  test('executes multiple commands sequentially', async () => {
    const result = await handleBatch(['--commands', 'state get character.name; state get scene']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const results = data.results as Record<string, unknown>[];
    expect(results).toHaveLength(2);
    expect((results[0] as Record<string, unknown>).ok).toBe(true);
    expect((results[1] as Record<string, unknown>).ok).toBe(true);
  });

  test('supports label syntax with as keyword', async () => {
    const result = await handleBatch(['--commands', 'state get character.hp as hp; state get scene as sc']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const labelled = data.labelled as Record<string, unknown>;
    expect(labelled.hp).toBe(20);
    expect(labelled.sc).toBe(0);
  });

  test('resolves $label.field references in subsequent commands', async () => {
    // Run batch where second command uses $ref from first
    // "state get character" returns the full character object as label "char"
    // "state set scene $char.hp" should resolve $char.hp to 20 (from beforeEach setup)
    const result = await handleBatch([
      '--commands',
      'state get character as char; state set scene $char.hp',
    ]);
    expect(result.ok).toBe(true);

    // Verify the label was resolved — scene should now be 20 (from char.hp)
    const updated = await loadState();
    expect(updated.scene).toBe(20);
  });

  test('continues on failure', async () => {
    const result = await handleBatch(['--commands', 'state get nonexistent.path; state get character.name']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const results = data.results as Record<string, unknown>[];
    expect(results).toHaveLength(2);
    // First fails, second succeeds
    expect((results[0] as Record<string, unknown>).ok).toBe(false);
    expect((results[1] as Record<string, unknown>).ok).toBe(true);
  });

  test('includes state_snapshot with multiple fields', async () => {
    const result = await handleBatch(['--commands', 'state set scene 5']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.state_snapshot).toBeDefined();
    const snapshot = data.state_snapshot as Record<string, unknown>;
    expect(snapshot.scene).toBe(5);
    const char = snapshot.character as Record<string, unknown>;
    expect(char.name).toBe('Hero');
    expect(char.hp).toBe(20);
    expect(snapshot._version).toBe(1);
  });

  test('includes errors array', async () => {
    const result = await handleBatch(['--commands', 'state get bad.path']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const errors = data.errors as unknown[];
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });

  test('dry-run validates without executing', async () => {
    const result = await handleBatch(['--dry-run', '--commands', 'state set scene 99']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.dryRun).toBe(true);

    // State should NOT have changed
    const state = await loadState();
    expect(state.scene).toBe(0);
  });

  test('returns error with no input', async () => {
    const result = await handleBatch([]);
    expect(result.ok).toBe(false);
  });

  test('skips comment and blank lines in command string', async () => {
    const result = await handleBatch(['--commands', 'state get scene; # comment; ; state get character.name']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const results = data.results as Record<string, unknown>[];
    expect(results).toHaveLength(2);
  });

  test('reports unresolved $ref as warning in errors array', async () => {
    const result = await handleBatch(['--commands', 'state set scene $undeclared.field']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const errors = data.errors as { line: number; raw: string; error: string }[];
    expect(errors.some(e => e.error.includes('Unresolved reference'))).toBe(true);
  });

  test('dry-run assigns null to labelled values', async () => {
    const result = await handleBatch(['--dry-run', '--commands', 'state get scene as sc']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const labelled = data.labelled as Record<string, unknown>;
    expect(labelled.sc).toBeUndefined();
  });

  test('$$ is treated as literal dollar sign, not a reference', async () => {
    // '$$50' starts with $$ so it must NOT be treated as an unresolved $ref
    const result = await handleBatch(['--commands', 'state set worldFlags.price $$50']);
    // Should not produce an unresolved reference error
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const errors = data.errors as { line: number; raw: string; error: string }[];
    expect(errors.some(e => e.error.includes('Unresolved reference'))).toBe(false);
  });

  test('handles compute commands in batch with correct type', async () => {
    const result = await handleBatch(['--commands', 'compute contest CHA merchant_01 as roll']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const labelled = data.labelled as Record<string, unknown>;
    const roll = labelled.roll as Record<string, unknown>;
    expect(roll.type).toBe('contested_roll');
  });

  // T2-TEST2: MAX_BATCH_COMMANDS limit
  test('rejects a batch exceeding MAX_BATCH_COMMANDS (100) commands', async () => {
    // Build a semicolon-separated string of 101 identical commands
    const commands = Array.from({ length: 101 }, () => 'state get scene').join(';');
    const result = await handleBatch(['--commands', commands]);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toMatch(/too large/i);
    expect(result.error?.corrective).toMatch(/split into smaller batches/i);
  });

  test('accepts a batch of exactly MAX_BATCH_COMMANDS (100) commands', async () => {
    // Edge: exactly 100 commands must not be rejected
    const commands = Array.from({ length: 100 }, () => 'state get scene').join(';');
    const result = await handleBatch(['--commands', commands]);
    expect(result.ok).toBe(true);
  });

  test('parses semicolons inside quoted strings', async () => {
    const result = await handleBatch([
      '--commands',
      'state set currentRoom "alpha;beta"; state get currentRoom as room',
    ]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const labelled = data.labelled as Record<string, unknown>;
    expect(labelled.room).toBe('alpha;beta');
  });

  test('parses semicolons inside JSON payloads', async () => {
    const characterJson = JSON.stringify({
      name: 'Semi;Colon',
      class: 'Scout',
      hp: 12,
      maxHp: 12,
      ac: 12,
      level: 1,
      xp: 0,
      currency: 0,
      currencyName: 'credits',
      stats: { STR: 10, DEX: 14, CON: 10, INT: 10, WIS: 12, CHA: 11 },
      modifiers: { STR: 0, DEX: 2, CON: 0, INT: 0, WIS: 1, CHA: 0 },
      proficiencyBonus: 2,
      proficiencies: [],
      abilities: [],
      inventory: [],
      conditions: [],
      equipment: { weapon: 'Knife', armour: 'Vest' },
    });
    const result = await handleBatch([
      '--commands',
      `state set character ${characterJson}; state get character.name as name`,
    ]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const labelled = data.labelled as Record<string, unknown>;
    expect(labelled.name).toBe('Semi;Colon');
  });

  test('preserves escaped separators inside quoted strings', async () => {
    const result = await handleBatch([
      '--commands',
      'state set currentRoom "alpha\\;beta"; state get currentRoom as room',
    ]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const labelled = data.labelled as Record<string, unknown>;
    expect(labelled.room).toBe('alpha\\;beta');
  });

  test('treats nested references into primitive labels as unresolved', async () => {
    const result = await handleBatch([
      '--commands',
      'state get scene as sc; state set currentRoom $sc.value',
    ]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const errors = data.errors as { error: string }[];
    expect(errors.some(e => e.error.includes('Unresolved reference: $sc.value'))).toBe(true);
  });

  test('dry-run reports unresolved label references', async () => {
    const result = await handleBatch([
      '--dry-run',
      '--commands',
      'state set scene $missing.value',
    ]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const errors = data.errors as { error: string }[];
    expect(errors.some(e => e.error.includes('Unresolved reference: $missing.value'))).toBe(true);
  });

  test('dispatches save, render, quest, rules, and export commands', async () => {
    const result = await handleBatch([
      '--commands',
      [
        'save validate deadbeef.SF2:not-base64!!!',
        'render settings --style terminal --raw',
        'quest list',
        'rules output',
        'export validate not-a-path',
      ].join('; '),
    ]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const results = data.results as { command: string }[];
    expect(results).toHaveLength(5);
    expect(results[0]!.command).toBe('save validate');
    expect(results[1]!.command).toBe('render');
    expect(results[2]!.command).toBe('quest list');
    expect(results[3]!.command).toBe('rules');
    expect(results[4]!.command).toBe('export validate');
  });

  test('reports unknown commands through the dispatch failure path', async () => {
    const result = await handleBatch(['--commands', 'banana split']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const results = data.results as { ok: boolean; error?: { message?: string } }[];
    expect(results[0]!.ok).toBe(false);
    expect(results[0]!.error?.message).toContain('Unknown command in batch: banana');
  });

  test('wraps unexpected handler throws as batch errors', async () => {
    const originalSave = BATCH_COMMAND_HANDLERS.save!;
    BATCH_COMMAND_HANDLERS.save = async () => {
      throw new Error('boom from mocked save');
    };
    try {
      const result = await handleBatch(['--commands', 'save validate anything']);
      expect(result.ok).toBe(true);
      const data = result.data as Record<string, unknown>;
      const results = data.results as { ok: boolean; error?: { message?: string } }[];
      expect(results[0]!.ok).toBe(false);
      expect(results[0]!.error?.message).toContain('boom from mocked save');
    } finally {
      BATCH_COMMAND_HANDLERS.save = originalSave;
    }
  });

  test('persists successful mutations once even when a later command fails', async () => {
    const result = await handleBatch([
      '--commands',
      'state set scene 5; state set time.season winter; state get scene',
    ]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.bufferedWrites).toBe(1);
    expect(data.persistedWrites).toBe(1);
    const state = await loadState();
    expect(state.scene).toBe(5);
  });

  test('post-batch flush error is captured in errors array', async () => {
    // Sabotage writeFileSync so flushStateStoreContext throws during disk write
    const originalWrite = STATE_STORE_RUNTIME.writeFileSync;
    STATE_STORE_RUNTIME.writeFileSync = (...args: Parameters<typeof originalWrite>) => {
      // Only fail on .tmp files (the atomic write path used by saveStateToDisk)
      if (String(args[0]).endsWith('.tmp')) {
        throw new Error('simulated disk full');
      }
      return originalWrite(...args);
    };

    // Suppress the dirty-state console.error from withStateStoreContext's finally block
    const origErr = console.error;
    console.error = () => {};

    try {
      const result = await handleBatch([
        '--commands',
        'state set scene 99',
      ]);
      expect(result.ok).toBe(true);
      const data = result.data as Record<string, unknown>;
      const errors = data.errors as { line: number; raw: string; error: string }[];
      expect(errors.some(e => e.raw === '(post-batch flush)' && e.error.includes('simulated disk full'))).toBe(true);
    } finally {
      STATE_STORE_RUNTIME.writeFileSync = originalWrite;
      console.error = origErr;
    }
  });
});

// ── Handler parity ────────────────────────────────────────────────

describe('batch handler parity', () => {
  const NON_BATCHABLE = new Set(['help', 'batch', 'build-css', 'compact']);

  test('BATCH_COMMAND_HANDLERS covers all batchable TOP_LEVEL_COMMANDS', () => {
    const expected = TOP_LEVEL_COMMANDS.filter(c => !NON_BATCHABLE.has(c)).sort();
    const actual = Object.keys(BATCH_COMMAND_HANDLERS).sort();
    expect(actual).toEqual(expected);
  });
});
