import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { handleCompute } from './compute';
import { saveState, createDefaultState, loadState } from '../lib/state-store';
import type { NpcMutation } from '../types';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

function makeNpc(overrides: Partial<NpcMutation> = {}): NpcMutation {
  return {
    id: 'test_npc', name: 'Test NPC', pronouns: 'they/them', role: 'guard',
    tier: 'rival', level: 4,
    stats: { STR: 14, DEX: 12, CON: 12, INT: 10, WIS: 14, CHA: 10 },
    modifiers: { STR: 2, DEX: 1, CON: 1, INT: 0, WIS: 2, CHA: 0 },
    hp: 16, maxHp: 16, ac: 12, soak: 2, damageDice: '1d8',
    status: 'active', alive: true, trust: 50,
    disposition: 'neutral', dispositionSeed: 0.5,
    ...overrides,
  };
}

beforeEach(async () => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-compute-'));
  process.env.TAG_STATE_DIR = tempDir;
  const state = createDefaultState();
  state.rosterMutations = [makeNpc()];
  state.character = {
    name: 'Hero', class: 'Scout', hp: 20, maxHp: 20, ac: 13,
    level: 3, xp: 500, currency: 100, currencyName: 'credits',
    stats: { STR: 10, DEX: 16, CON: 10, INT: 10, WIS: 14, CHA: 12 },
    modifiers: { STR: 0, DEX: 3, CON: 0, INT: 0, WIS: 2, CHA: 1 },
    proficiencyBonus: 2, proficiencies: ['Stealth', 'Perception'],
    abilities: [], inventory: [], conditions: [],
    equipment: { weapon: 'Blaster Pistol', armour: 'Light Vest' },
  };
  await saveState(state);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) process.env.TAG_STATE_DIR = originalEnv;
  else delete process.env.TAG_STATE_DIR;
});

describe('compute contest', () => {
  test('returns result with margin and outcome', async () => {
    const result = await handleCompute(['contest', 'CHA', 'test_npc']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.type).toBe('contested_roll');
    expect(data.stat).toBe('CHA');
    expect(data.npcId).toBe('test_npc');
    expect(typeof data.roll).toBe('number');
    expect(typeof data.npcRoll).toBe('number');
    expect(typeof data.margin).toBe('number');
    expect(typeof data.outcome).toBe('string');
  });

  test('reads NPC WIS modifier from state for CHA contest', async () => {
    const result = await handleCompute(['contest', 'CHA', 'test_npc']);
    const data = result.data as Record<string, unknown>;
    expect(data.npcModifier).toBe(2); // test_npc WIS modifier
  });

  test('fails on undefined NPC', async () => {
    const result = await handleCompute(['contest', 'CHA', 'nonexistent']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('nonexistent');
    expect(result.error!.corrective).toContain('tag state create-npc');
  });

  test('fails without state file', async () => {
    rmSync(tempDir, { recursive: true, force: true });
    const result = await handleCompute(['contest', 'CHA', 'test_npc']);
    expect(result.ok).toBe(false);
    expect(result.error!.corrective).toContain('tag state reset');
  });

  test('writes _lastComputation to state', async () => {
    await handleCompute(['contest', 'CHA', 'test_npc']);
    const state = await loadState();
    expect(state._lastComputation).toBeDefined();
    expect(state._lastComputation!.type).toBe('contested_roll');
    expect(state._lastComputation!.npcId).toBe('test_npc');
  });

  test('outcome values are valid', async () => {
    const validOutcomes = ['decisive_success', 'narrow_success', 'narrow_failure', 'failure', 'decisive_failure'];
    for (let i = 0; i < 30; i++) {
      const result = await handleCompute(['contest', 'CHA', 'test_npc']);
      const data = result.data as Record<string, unknown>;
      expect(validOutcomes).toContain(data.outcome as string);
    }
  });
});

describe('compute hazard', () => {
  test('returns save result against DC', async () => {
    const result = await handleCompute(['hazard', 'CON', '--dc', '14']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.type).toBe('hazard_save');
    expect(data.dc).toBe(14);
    expect(typeof data.roll).toBe('number');
    expect(typeof data.total).toBe('number');
    expect(typeof data.outcome).toBe('string');
  });

  test('fails without --dc flag', async () => {
    const result = await handleCompute(['hazard', 'CON']);
    expect(result.ok).toBe(false);
  });
});

describe('compute encounter', () => {
  test('returns encounter type', async () => {
    const result = await handleCompute(['encounter', '--escalation', '1']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.type).toBe('encounter_roll');
    expect(['quiet', 'alert', 'hostile']).toContain(data.encounter as string);
  });

  test('defaults escalation to 0', async () => {
    const result = await handleCompute(['encounter']);
    expect(result.ok).toBe(true);
  });
});

describe('compute with no subcommand', () => {
  test('returns error', async () => {
    const result = await handleCompute([]);
    expect(result.ok).toBe(false);
  });
});
