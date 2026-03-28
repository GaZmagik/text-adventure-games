import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
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
  test('fails when contest is missing the npc id', async () => {
    const result = await handleCompute(['contest', 'CHA']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Usage');
  });

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
    expect(result.error!.corrective).toContain('tag state get rosterMutations');
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
    expect((state._lastComputation as Record<string, unknown>).npcId).toBe('test_npc');
  });

  test('sets dieType to d20', async () => {
    await handleCompute(['contest', 'CHA', 'test_npc']);
    const state = await loadState();
    expect(state._lastComputation!.dieType).toBe('d20');
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

  test('fails without a stat argument', async () => {
    const result = await handleCompute(['hazard']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Usage: tag compute hazard <ATTR> --dc <N>');
  });

  test('fails without --dc flag', async () => {
    const result = await handleCompute(['hazard', 'CON']);
    expect(result.ok).toBe(false);
  });

  test('sets dieType to d20', async () => {
    await handleCompute(['hazard', 'CON', '--dc', '14']);
    const state = await loadState();
    expect(state._lastComputation!.dieType).toBe('d20');
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

  test('works without state file (no-state path)', async () => {
    rmSync(tempDir, { recursive: true, force: true });
    const result = await handleCompute(['encounter']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.type).toBe('encounter_roll');
    expect(['quiet', 'alert', 'hostile']).toContain(data.encounter as string);
  });

  test('sets dieType to d20', async () => {
    await handleCompute(['encounter']);
    const state = await loadState();
    expect(state._lastComputation!.dieType).toBe('d20');
  });

  test('rejects non-numeric escalation value', async () => {
    const result = await handleCompute(['encounter', '--escalation', 'banana']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Invalid escalation');
    expect(result.error!.message).toContain('banana');
    expect(result.error!.message).toContain('non-negative integer');
  });

  test('rejects negative escalation value', async () => {
    const result = await handleCompute(['encounter', '--escalation', '-3']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Invalid escalation');
    expect(result.error!.message).toContain('-3');
  });

  test('rejects fractional escalation value', async () => {
    const result = await handleCompute(['encounter', '--escalation', '2.5']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Invalid escalation');
  });
});

describe('compute with no subcommand', () => {
  test('returns error', async () => {
    const result = await handleCompute([]);
    expect(result.ok).toBe(false);
  });
});

// ── T3+T4: Deterministic outcome branches via Math.random mocking ────

// Helper: Math.random value that produces a specific rollD20 result.
// rollDie(20) = Math.floor(Math.random() * 20) + 1
// To get roll R, we need Math.floor(v * 20) + 1 = R, so v = (R - 1) / 20.
function randomForD20(roll: number): number {
  return (roll - 1) / 20;
}

describe('compute contest — deterministic outcomes', () => {
  // Player uses CHA (modifier=1), NPC opposes with WIS (modifier=2).
  // margin = (playerRoll + 1) - (npcRoll + 2)

  const originalRandom = Math.random;
  afterEach(() => { Math.random = originalRandom; });

  test('decisive_success when margin >= 5', async () => {
    // playerRoll=20, npcRoll=1 → margin = (20+1) - (1+2) = 18
    const spy = spyOn(Math, 'random')
      .mockReturnValueOnce(randomForD20(20))  // player roll
      .mockReturnValueOnce(randomForD20(1));   // NPC roll
    const result = await handleCompute(['contest', 'CHA', 'test_npc']);
    spy.mockRestore();
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.outcome).toBe('decisive_success');
    expect(data.roll).toBe(20);
    expect(data.npcRoll).toBe(1);
  });

  test('narrow_success when margin is 1-4', async () => {
    // playerRoll=4, npcRoll=2 → margin = (4+1) - (2+2) = 1
    const spy = spyOn(Math, 'random')
      .mockReturnValueOnce(randomForD20(4))
      .mockReturnValueOnce(randomForD20(2));
    const result = await handleCompute(['contest', 'CHA', 'test_npc']);
    spy.mockRestore();
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.outcome).toBe('narrow_success');
  });

  test('narrow_failure when margin is 0 (tie favours NPC)', async () => {
    // playerRoll=3, npcRoll=2 → margin = (3+1) - (2+2) = 0
    const spy = spyOn(Math, 'random')
      .mockReturnValueOnce(randomForD20(3))
      .mockReturnValueOnce(randomForD20(2));
    const result = await handleCompute(['contest', 'CHA', 'test_npc']);
    spy.mockRestore();
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.outcome).toBe('narrow_failure');
  });

  test('failure when margin is -4 to -1', async () => {
    // playerRoll=2, npcRoll=2 → margin = (2+1) - (2+2) = -1
    const spy = spyOn(Math, 'random')
      .mockReturnValueOnce(randomForD20(2))
      .mockReturnValueOnce(randomForD20(2));
    const result = await handleCompute(['contest', 'CHA', 'test_npc']);
    spy.mockRestore();
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.outcome).toBe('failure');
  });

  test('decisive_failure when margin <= -5', async () => {
    // playerRoll=1, npcRoll=20 → margin = (1+1) - (20+2) = -20
    const spy = spyOn(Math, 'random')
      .mockReturnValueOnce(randomForD20(1))
      .mockReturnValueOnce(randomForD20(20));
    const result = await handleCompute(['contest', 'CHA', 'test_npc']);
    spy.mockRestore();
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.outcome).toBe('decisive_failure');
    expect(data.roll).toBe(1);
    expect(data.npcRoll).toBe(20);
  });
});

describe('compute hazard — deterministic outcomes', () => {
  // Player CON modifier = 0. DC = 14.

  const originalRandom = Math.random;
  afterEach(() => { Math.random = originalRandom; });

  test('critical_success when roll is 20', async () => {
    const spy = spyOn(Math, 'random').mockReturnValue(randomForD20(20));
    const result = await handleCompute(['hazard', 'CON', '--dc', '14']);
    spy.mockRestore();
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.outcome).toBe('critical_success');
    expect(data.roll).toBe(20);
  });

  test('critical_failure when roll is 1', async () => {
    const spy = spyOn(Math, 'random').mockReturnValue(randomForD20(1));
    const result = await handleCompute(['hazard', 'CON', '--dc', '1']);
    spy.mockRestore();
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.outcome).toBe('critical_failure');
    expect(data.roll).toBe(1);
  });

  test('success when total >= dc', async () => {
    // roll=15, modifier=0, total=15 >= dc=14
    const spy = spyOn(Math, 'random').mockReturnValue(randomForD20(15));
    const result = await handleCompute(['hazard', 'CON', '--dc', '14']);
    spy.mockRestore();
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.outcome).toBe('success');
  });

  test('partial_success when total is within 3 below dc', async () => {
    // roll=12, modifier=0, total=12, dc=14 → 12 >= 14-3=11 → partial_success
    const spy = spyOn(Math, 'random').mockReturnValue(randomForD20(12));
    const result = await handleCompute(['hazard', 'CON', '--dc', '14']);
    spy.mockRestore();
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.outcome).toBe('partial_success');
  });

  test('failure when total is more than 3 below dc', async () => {
    // roll=10, modifier=0, total=10, dc=14 → 10 < 11 → failure
    const spy = spyOn(Math, 'random').mockReturnValue(randomForD20(10));
    const result = await handleCompute(['hazard', 'CON', '--dc', '14']);
    spy.mockRestore();
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.outcome).toBe('failure');
  });
});

describe('compute encounter — deterministic outcomes', () => {
  const originalRandom = Math.random;
  afterEach(() => { Math.random = originalRandom; });

  test('quiet when roll <= 8 (escalation=0)', async () => {
    const spy = spyOn(Math, 'random').mockReturnValue(randomForD20(5));
    const result = await handleCompute(['encounter', '--escalation', '0']);
    spy.mockRestore();
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.encounter).toBe('quiet');
  });

  test('alert when roll is 9-15 (escalation=0)', async () => {
    const spy = spyOn(Math, 'random').mockReturnValue(randomForD20(12));
    const result = await handleCompute(['encounter', '--escalation', '0']);
    spy.mockRestore();
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.encounter).toBe('alert');
  });

  test('hostile when roll >= 16 (escalation=0)', async () => {
    const spy = spyOn(Math, 'random').mockReturnValue(randomForD20(18));
    const result = await handleCompute(['encounter', '--escalation', '0']);
    spy.mockRestore();
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.encounter).toBe('hostile');
  });

  test('escalation shifts thresholds — roll=7 + escalation=2 = 9 → alert', async () => {
    const spy = spyOn(Math, 'random').mockReturnValue(randomForD20(7));
    const result = await handleCompute(['encounter', '--escalation', '2']);
    spy.mockRestore();
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.encounter).toBe('alert');
  });
});

// ── Phase 1: rollHistory auto-append ──────────────────────────────────

describe('rollHistory — contest', () => {
  test('contest appends a record to rollHistory', async () => {
    await handleCompute(['contest', 'CHA', 'test_npc']);
    const state = await loadState();
    expect(state.rollHistory.length).toBeGreaterThanOrEqual(1);
    const last = state.rollHistory[state.rollHistory.length - 1]!;
    expect(last.type).toBe('contested_roll');
  });

  test('contest record has correct scene number', async () => {
    // Default state scene = 0; set it to 5 to verify
    const state = await loadState();
    state.scene = 5;
    await saveState(state);

    await handleCompute(['contest', 'CHA', 'test_npc']);
    const updated = await loadState();
    const last = updated.rollHistory[updated.rollHistory.length - 1]!;
    expect(last.scene).toBe(5);
  });

  test('contest record has correct type discriminant', async () => {
    await handleCompute(['contest', 'CHA', 'test_npc']);
    const state = await loadState();
    const last = state.rollHistory[state.rollHistory.length - 1]!;
    expect(last.type).toBe('contested_roll');
    expect(last.stat).toBe('CHA');
    expect(typeof last.roll).toBe('number');
    expect(typeof last.modifier).toBe('number');
    expect(typeof last.total).toBe('number');
  });

  test('contest record has undefined dc (contests have no DC)', async () => {
    await handleCompute(['contest', 'CHA', 'test_npc']);
    const state = await loadState();
    const last = state.rollHistory[state.rollHistory.length - 1]!;
    expect(last.dc).toBeUndefined();
  });
});

describe('rollHistory — hazard', () => {
  test('hazard appends a record to rollHistory', async () => {
    await handleCompute(['hazard', 'CON', '--dc', '14']);
    const state = await loadState();
    expect(state.rollHistory.length).toBeGreaterThanOrEqual(1);
    const last = state.rollHistory[state.rollHistory.length - 1]!;
    expect(last.type).toBe('hazard_save');
    expect(last.dc).toBe(14);
    expect(last.stat).toBe('CON');
  });
});

describe('rollHistory — encounter', () => {
  test('encounter appends a record to rollHistory', async () => {
    await handleCompute(['encounter', '--escalation', '0']);
    const state = await loadState();
    expect(state.rollHistory.length).toBeGreaterThanOrEqual(1);
    const last = state.rollHistory[state.rollHistory.length - 1]!;
    expect(last.type).toBe('encounter_roll');
  });

  test('encounter record has undefined stat and dc', async () => {
    await handleCompute(['encounter']);
    const state = await loadState();
    const last = state.rollHistory[state.rollHistory.length - 1]!;
    expect(last.stat).toBeUndefined();
    expect(last.dc).toBeUndefined();
  });
});

describe('rollHistory — cap', () => {
  test('rollHistory is capped at 50 entries by saveState', async () => {
    // Pre-fill with 49 entries, then push two more via contest calls
    const state = await loadState();
    for (let i = 0; i < 49; i++) {
      state.rollHistory.push({
        scene: i, type: 'hazard_save', stat: 'CON',
        roll: 10, modifier: 0, total: 10, dc: 12, outcome: 'failure',
      });
    }
    await saveState(state);

    // Two more pushes → 51 total; saveState should cap to 50
    await handleCompute(['contest', 'CHA', 'test_npc']);
    await handleCompute(['hazard', 'CON', '--dc', '14']);

    const updated = await loadState();
    expect(updated.rollHistory.length).toBeLessThanOrEqual(50);
  });
});

// ── Phase 6: compute levelup ──────────────────────────────────────────

describe('compute levelup', () => {
  test('succeeds when character has enough XP', async () => {
    // Level 3, xp=500 → needs 500 for level 4 (threshold met exactly)
    const result = await handleCompute(['levelup']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.eligible).toBe(true);
    expect(data.newLevel).toBe(4);
  });

  test('applies HP gain to character', async () => {
    // Level 3→4: hpGain=4 from LEVEL_REWARDS[4]
    const before = await loadState();
    const hpBefore = before.character!.hp;
    const maxHpBefore = before.character!.maxHp;

    await handleCompute(['levelup']);

    const after = await loadState();
    expect(after.character!.hp).toBe(hpBefore + 4);
    expect(after.character!.maxHp).toBe(maxHpBefore + 4);
    expect(after.character!.level).toBe(4);
  });

  test('returns improvement text from reward table', async () => {
    const result = await handleCompute(['levelup']);
    const data = result.data as Record<string, unknown>;
    expect(data.improvement).toBe('+1 attribute');
  });

  test('returns ineligible when XP is insufficient', async () => {
    const state = await loadState();
    state.character!.xp = 100; // Need 250 for level 4
    state.character!.level = 3;
    await saveState(state);

    const result = await handleCompute(['levelup']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.eligible).toBe(false);
    expect(data.reason).toBe('insufficient_xp');
    expect(typeof data.xpNeeded).toBe('number');
  });

  test('returns ineligible at max level (8)', async () => {
    const state = await loadState();
    state.character!.level = 8;
    state.character!.xp = 9999;
    await saveState(state);

    const result = await handleCompute(['levelup']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.eligible).toBe(false);
    expect(data.reason).toBe('already_max');
  });

  test('fails when no character exists', async () => {
    const state = await loadState();
    state.character = null;
    await saveState(state);

    const result = await handleCompute(['levelup']);
    expect(result.ok).toBe(false);
  });

  test('sets _lastComputation to LevelupResult', async () => {
    await handleCompute(['levelup']);
    const state = await loadState();
    expect(state._lastComputation).toBeDefined();
    expect(state._lastComputation!.type).toBe('levelup_result');
  });

  test('does NOT append to rollHistory (levelup is not a roll)', async () => {
    const before = await loadState();
    const historyLenBefore = before.rollHistory.length;

    await handleCompute(['levelup']);

    const after = await loadState();
    expect(after.rollHistory.length).toBe(historyLenBefore);
  });

  test('persists updated state to disk', async () => {
    await handleCompute(['levelup']);
    const state = await loadState();
    // Character should now be level 4 on disk
    expect(state.character!.level).toBe(4);
    expect(state.character!.xp).toBe(500);
  });

  // AK: proficiencyBonus at level 4→5 transition
  test('AK: proficiencyBonus becomes 3 when levelling to 5', async () => {
    const state = await loadState();
    state.character!.level = 4;
    state.character!.xp = 800; // threshold for level 5
    state.character!.proficiencyBonus = 2;
    await saveState(state);

    const result = await handleCompute(['levelup']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.eligible).toBe(true);
    expect(data.newLevel).toBe(5);

    const after = await loadState();
    expect(after.character!.proficiencyBonus).toBe(3);
  });

  test('AK: proficiencyBonus stays 2 when levelling 1→2', async () => {
    const state = await loadState();
    state.character!.level = 1;
    state.character!.xp = 100; // threshold for level 2
    state.character!.proficiencyBonus = 2;
    await saveState(state);

    const result = await handleCompute(['levelup']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.newLevel).toBe(2);

    const after = await loadState();
    expect(after.character!.proficiencyBonus).toBe(2);
  });
});

// ── T8: Contest validation ────────────────────────────────────────────

describe('compute contest — validation', () => {
  test('rejects invalid stat name', async () => {
    const result = await handleCompute(['contest', 'FOO', 'test_npc']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Invalid attribute');
    expect(result.error!.message).toContain('FOO');
    expect(result.error!.message).toContain('STR');
  });
});

// ── T9: Hazard validation ────────────────────────────────────────────

describe('compute hazard — validation', () => {
  test('rejects invalid stat name', async () => {
    const result = await handleCompute(['hazard', 'FOO', '--dc', '14']);
    expect(result.ok).toBe(false);
  });

  test('rejects non-numeric DC value', async () => {
    const result = await handleCompute(['hazard', 'CON', '--dc', 'abc']);
    expect(result.ok).toBe(false);
  });
});
