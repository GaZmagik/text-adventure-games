import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { __stateTestInternals, handleState } from './index';
import { loadState, saveState } from '../../lib/state-store';
import { MAX_STATE_HISTORY } from '../../lib/constants';
import type { GmState } from '../../types';

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
    const last = state._stateHistory[state._stateHistory.length - 1]!;
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

  test('set JSON object values — parses rather than storing as string', async () => {
    await handleState(['reset']);
    const charJson = JSON.stringify({ name: 'Rhian', class: 'Medic', hp: 9, maxHp: 9, level: 1, stats: { STR: 10, DEX: 12, CON: 10, INT: 14, WIS: 11, CHA: 13 } });
    const result = await handleState(['set', 'character', charJson]);
    expect(result.ok).toBe(true);

    const state = await loadState();
    expect(typeof state.character).toBe('object');
    expect(state.character).not.toBeNull();
    expect(state.character!.name).toBe('Rhian');
    expect(state.character!.hp).toBe(9);
  });

  test('set JSON array values — parses rather than storing as string', async () => {
    await handleState(['reset']);
    const arrJson = JSON.stringify([{ id: 'quest_1', title: 'Find the signal' }]);
    const result = await handleState(['set', 'quests', arrJson]);
    expect(result.ok).toBe(true);

    const state = await loadState();
    expect(Array.isArray(state.quests)).toBe(true);
    expect(state.quests.length).toBe(1);
    expect(state.quests[0]!.id).toBe('quest_1');
  });

  test('set plain string that looks numeric-ish stays string when not a number', async () => {
    await handleState(['reset']);
    const result = await handleState(['set', 'currentRoom', 'room_42']);
    expect(result.ok).toBe(true);

    const state = await loadState();
    expect(state.currentRoom).toBe('room_42');
    expect(typeof state.currentRoom).toBe('string');
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

  test('reports unexpected nested keys in polluted state', async () => {
    await handleState(['reset']);
    const state = await loadState();
    (state.time as Record<string, unknown>).season = 'winter';
    await saveState(state);

    const result = await handleState(['validate']);
    expect(result.ok).toBe(true);
    const data = result.data as { valid: boolean; errors: string[] };
    expect(data.valid).toBe(false);
    expect(data.errors.some(error => error.includes('time.season'))).toBe(true);
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

// ── set — negative paths ──────────────────────────────────────────

describe('state set — negative paths', () => {
  test('blocks prototype pollution via __proto__', async () => {
    await handleState(['reset']);
    const result = await handleState(['set', '__proto__.polluted', 'true']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Forbidden path segment');
  });

  test('blocks prototype pollution via constructor', async () => {
    await handleState(['reset']);
    const result = await handleState(['set', 'constructor.x', '1']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Forbidden path segment');
  });

  test('+= on a non-numeric path fails', async () => {
    await handleState(['reset']);
    await handleState(['set', 'currentRoom', 'bridge']);
    const result = await handleState(['set', 'currentRoom', '+=', '5']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('not a number');
    expect(result.error!.message).toContain('+=');
  });

  test('fails with no path provided', async () => {
    await handleState(['reset']);
    const result = await handleState(['set']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('No path');
  });

  test('fails with no value provided', async () => {
    await handleState(['reset']);
    const result = await handleState(['set', 'scene']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('No value');
  });

  test('rejects unknown top-level keys', async () => {
    await handleState(['reset']);
    const result = await handleState(['set', 'nonexistent.deep.key', 'somevalue']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Unknown path segment');
  });

  test('rejects unknown nested keys under allowlisted objects', async () => {
    await handleState(['reset']);
    const result = await handleState(['set', 'time.season', 'winter']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Unknown path segment "season"');
  });
});

// ── create-npc — negative paths ──────────────────────────────────

describe('state create-npc — negative paths', () => {
  test('fails with no id provided', async () => {
    await handleState(['reset']);
    const result = await handleState(['create-npc']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('No NPC id');
  });

  test('fails with invalid tier', async () => {
    await handleState(['reset']);
    const result = await handleState([
      'create-npc', 'npc1',
      '--name', 'Dragon Lord',
      '--tier', 'dragon',
      '--pronouns', 'he/him',
      '--role', 'boss',
    ]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Invalid tier');
    expect(result.error!.message).toContain('dragon');
  });

  test('fails with invalid pronouns', async () => {
    await handleState(['reset']);
    const result = await handleState([
      'create-npc', 'npc1',
      '--name', 'Golem',
      '--tier', 'rival',
      '--pronouns', 'it/its',
      '--role', 'construct',
    ]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Invalid pronouns');
    expect(result.error!.message).toContain('it/its');
  });
});

// ── containsForbiddenKeys recursion ──────────────────────────────

describe('state set — containsForbiddenKeys rejects nested __proto__', () => {
  test('stores raw string when JSON value contains __proto__ at depth', async () => {
    await handleState(['reset']);
    const result = await handleState([
      'set', 'worldFlags.test',
      '{"nested": {"__proto__": {"polluted": true}}}',
    ]);
    expect(result.ok).toBe(true);

    const state = await loadState();
    const root = state as unknown as Record<string, unknown>;
    const worldFlags = root.worldFlags as Record<string, unknown>;
    expect(typeof worldFlags.test).toBe('string');
  });
});

// ── context ───────────────────────────────────────────────────────

describe('state context', () => {
  test('returns required module paths and tier1 list', async () => {
    await handleState(['reset']);
    await handleState(['set', 'modulesActive', '["gm-checklist","prose-craft","core-systems","die-rolls","character-creation","save-codex","audio"]']);
    const result = await handleState(['context']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.required).toBeDefined();
    expect(Array.isArray(data.required)).toBe(true);
    expect((data.required as string[])[0]).toMatch(/^modules\//);
    expect(data.tier1).toBeDefined();
    expect(Array.isArray(data.tier1)).toBe(true);
  });

  test('flags missing tier1 modules', async () => {
    await handleState(['reset']);
    // Only activate 2 of 6 tier1 modules — 4 should be flagged missing
    await handleState(['set', 'modulesActive', '["gm-checklist","prose-craft"]']);
    const result = await handleState(['context']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.missingHint).toBeDefined();
    expect(typeof data.missingHint).toBe('string');
    expect((data.missingHint as string).length).toBeGreaterThan(0);
  });

  test('includes module digests', async () => {
    await handleState(['reset']);
    await handleState(['set', 'modulesActive', '["prose-craft","audio"]']);
    const result = await handleState(['context']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.moduleDigests).toBeDefined();
    const digests = data.moduleDigests as Record<string, string>;
    expect(digests['prose-craft']).toBeDefined();
    expect(digests['audio']).toBeDefined();
  });

  test('returns noState error when no state exists', async () => {
    const result = await handleState(['context']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toMatch(/no game state/i);
  });

  test('handles empty modulesActive gracefully', async () => {
    await handleState(['reset']);
    const result = await handleState(['context']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.totalModules).toBe(0);
    expect((data.required as string[]).length).toBe(0);
    // All tier1 should be flagged missing
    expect((data.missingHint as string).length).toBeGreaterThan(0);
  });

  test('reports totalModules matching modulesActive length', async () => {
    await handleState(['reset']);
    await handleState(['set', 'modulesActive', '["audio","atmosphere","bestiary"]']);
    const result = await handleState(['context']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.totalModules).toBe(3);
    expect(data.modulesActive).toEqual(['audio', 'atmosphere', 'bestiary']);
  });
});

// ── create-npc — Phase 9 improved errors ──────────────────────────

describe('state create-npc — Phase 9 improved error messages', () => {
  test('clear error for invalid pronouns lists valid values', async () => {
    await handleState(['reset']);
    const result = await handleState([
      'create-npc', 'npc_p9a',
      '--name', 'Golem',
      '--tier', 'rival',
      '--pronouns', 'it/its',
      '--role', 'construct',
    ]);
    expect(result.ok).toBe(false);
    expect(result.error!.corrective).toContain('she/her');
    expect(result.error!.corrective).toContain('he/him');
    expect(result.error!.corrective).toContain('they/them');
  });

  test('clear error for invalid tier lists valid values', async () => {
    await handleState(['reset']);
    const result = await handleState([
      'create-npc', 'npc_p9b',
      '--name', 'Dragon Lord',
      '--tier', 'dragon',
      '--pronouns', 'he/him',
      '--role', 'boss',
    ]);
    expect(result.ok).toBe(false);
    expect(result.error!.corrective).toContain('minion');
    expect(result.error!.corrective).toContain('rival');
    expect(result.error!.corrective).toContain('nemesis');
  });

  test('helpful message for missing name includes quoted example', async () => {
    await handleState(['reset']);
    const result = await handleState([
      'create-npc', 'npc_p9c',
      '--tier', 'minion',
      '--pronouns', 'he/him',
      '--role', 'guard',
    ]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/name/i);
    expect(result.error!.corrective).toContain("--name 'Maren Dray'");
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

describe('state get edge cases', () => {
  test('rejects overly deep paths', async () => {
    await handleState(['reset']);
    const result = await handleState(['get', 'a.b.c.d.e.f.g.h.i.j.k']);
    expect(result.ok).toBe(false);
  });

  test('rejects forbidden path segments', async () => {
    await handleState(['reset']);
    const result = await handleState(['get', 'time.__proto__']);
    expect(result.ok).toBe(false);
  });

  test('fails when traversing through a primitive value', async () => {
    await handleState(['reset']);
    const result = await handleState(['get', 'scene.value']);
    expect(result.ok).toBe(false);
  });

  test('suggests similar top-level keys for typos', async () => {
    await handleState(['reset']);
    const result = await handleState(['get', 'sce']);
    expect(result.ok).toBe(false);
    expect(result.error!.corrective).toContain('Did you mean: scene');
  });
});

describe('state set edge cases', () => {
  test('setByPath rejects forbidden intermediate and terminal segments', () => {
    expect(() => __stateTestInternals.setByPath({}, 'time.__proto__.hour', 12))
      .toThrow('Forbidden path segment: "__proto__"');
    expect(() => __stateTestInternals.setByPath({ time: {} }, 'time.prototype', 12))
      .toThrow('Forbidden path segment: "prototype"');
  });

  test('stores invalid JSON-like input as a raw string', async () => {
    await handleState(['reset']);
    const result = await handleState(['set', 'currentRoom', '{not-json']);
    expect(result.ok).toBe(true);

    const state = await loadState();
    expect(state.currentRoom).toBe('{not-json');
  });

  test('creates nested nullable objects when setting deadline fields', async () => {
    await handleState(['reset']);
    const result = await handleState(['set', 'time.deadline.label', 'Evac Window']);
    expect(result.ok).toBe(true);

    const state = await loadState();
    expect(state.time.deadline).toMatchObject({ label: 'Evac Window' });
  });

  test('caps history length when recording a new mutation', async () => {
    await handleState(['reset']);
    const state = await loadState();
    state._stateHistory = Array.from({ length: MAX_STATE_HISTORY }, (_, i) => ({
      timestamp: `2026-03-26T00:${String(i).padStart(2, '0')}:00Z`,
      command: 'seed',
      path: `scene.${i}`,
      oldValue: i,
      newValue: i + 1,
    }));
    await saveState(state);

    const result = await handleState(['set', 'scene', '5']);
    expect(result.ok).toBe(true);

    const updated = await loadState();
    expect(updated._stateHistory).toHaveLength(MAX_STATE_HISTORY);
    expect(updated._stateHistory[0]!.path).not.toBe('scene.0');
  });

  test('requires a numeric delta for += and -= operations', async () => {
    await handleState(['reset']);
    const noValue = await handleState(['set', 'scene', '+=']);
    expect(noValue.ok).toBe(false);
    expect(noValue.error!.message).toContain('No value provided');

    const badValue = await handleState(['set', 'scene', '+=', 'nope']);
    expect(badValue.ok).toBe(false);
    expect(badValue.error!.message).toContain('non-numeric');
  });

  test('rolls back invalid mutations instead of persisting them', async () => {
    await handleState(['reset']);
    await handleState(['set', 'character', JSON.stringify({
      name: 'Rhian',
      class: 'Medic',
      hp: 9,
      maxHp: 9,
      ac: 12,
      level: 1,
      xp: 0,
      currency: 0,
      currencyName: 'credits',
      stats: { STR: 10, DEX: 12, CON: 10, INT: 14, WIS: 11, CHA: 13 },
      modifiers: { STR: 0, DEX: 1, CON: 0, INT: 2, WIS: 0, CHA: 1 },
      proficiencyBonus: 2,
      proficiencies: [],
      abilities: [],
      inventory: [],
      conditions: [],
      equipment: { weapon: 'Scalpel', armour: 'Coat' },
    })]);

    const result = await handleState(['set', 'character.hp', '99']);
    expect(result.ok).toBe(false);

    const state = await loadState();
    expect(state.character!.hp).toBe(9);
  });
});

describe('state sync dispatch', () => {
  test('dispatches the sync subcommand through the split sync module', async () => {
    await handleState(['reset']);
    const result = await handleState(['sync']);
    expect(result.ok).toBe(true);
    expect(result.command).toBe('state sync');
  });
});

describe('state dispatch edge cases', () => {
  test('returns an error when no subcommand is provided', async () => {
    const result = await handleState([]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('No subcommand provided');
  });
});
