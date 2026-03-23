import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { handleBatch } from './batch';
import { saveState, createDefaultState, loadState } from '../lib/state-store';
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
    expect(labelled.hp).toBeDefined();
    expect(labelled.sc).toBeDefined();
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

  test('includes state_snapshot in response', async () => {
    const result = await handleBatch(['--commands', 'state set scene 5']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.state_snapshot).toBeDefined();
    const snapshot = data.state_snapshot as Record<string, unknown>;
    expect(snapshot.scene).toBe(5);
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

  test('handles compute commands in batch', async () => {
    const result = await handleBatch(['--commands', 'compute contest CHA merchant_01 as roll']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const labelled = data.labelled as Record<string, unknown>;
    expect(labelled.roll).toBeDefined();
  });
});
