import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleQuest } from './quest';
import { handleState } from './state';
import { loadState, saveState } from '../lib/state-store';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-quest-test-'));
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

/** Seed a state with a test quest containing two objectives. */
async function seedQuest(): Promise<void> {
  await handleState(['reset']);
  const state = await loadState();
  state.quests.push({
    id: 'q1',
    title: 'Find the Signal',
    status: 'active',
    objectives: [
      { id: 'obj_a', description: 'Locate the transmitter', completed: false },
      { id: 'obj_b', description: 'Decode the message', completed: false },
    ],
    clues: [],
  });
  await saveState(state);
}

// ── complete ───────────────────────────────────────────────────────

describe('quest complete', () => {
  test('requires a quest id', async () => {
    const result = await handleQuest(['complete']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('No quest-id');
  });

  test('requires an objective id', async () => {
    const result = await handleQuest(['complete', 'q1']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('No objective-id');
  });

  test('marks objective as completed', async () => {
    await seedQuest();
    const result = await handleQuest(['complete', 'q1', 'obj_a']);
    expect(result.ok).toBe(true);

    const state = await loadState();
    const quest = state.quests.find(q => q.id === 'q1')!;
    const obj = quest.objectives.find(o => o.id === 'obj_a')!;
    expect(obj.completed).toBe(true);
  });

  test('sets canonical worldFlag quest:<qid>:<oid>:complete', async () => {
    await seedQuest();
    await handleQuest(['complete', 'q1', 'obj_a']);

    const state = await loadState();
    expect(state.worldFlags['quest:q1:obj_a:complete']).toBe(true);
  });

  test('completing final objective sets quest:<qid>:complete worldFlag', async () => {
    await seedQuest();
    await handleQuest(['complete', 'q1', 'obj_a']);
    await handleQuest(['complete', 'q1', 'obj_b']);

    const state = await loadState();
    expect(state.worldFlags['quest:q1:complete']).toBe(true);
  });

  test('completing final objective sets quest.status to completed', async () => {
    await seedQuest();
    await handleQuest(['complete', 'q1', 'obj_a']);
    await handleQuest(['complete', 'q1', 'obj_b']);

    const state = await loadState();
    const quest = state.quests.find(q => q.id === 'q1')!;
    expect(quest.status).toBe('completed');
  });
});

// ── add-objective ──────────────────────────────────────────────────

describe('quest add-objective', () => {
  test('requires a quest id', async () => {
    const result = await handleQuest(['add-objective']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('No quest-id');
  });

  test('appends to quest objectives', async () => {
    await seedQuest();
    const result = await handleQuest(['add-objective', 'q1', '--id', 'obj_c', '--desc', 'Repair the antenna']);
    expect(result.ok).toBe(true);

    const state = await loadState();
    const quest = state.quests.find(q => q.id === 'q1')!;
    expect(quest.objectives).toHaveLength(3);
    const added = quest.objectives.find(o => o.id === 'obj_c')!;
    expect(added.description).toBe('Repair the antenna');
    expect(added.completed).toBe(false);
  });

  test('requires an --id flag', async () => {
    await seedQuest();
    const result = await handleQuest(['add-objective', 'q1', '--desc', 'Repair the antenna']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Missing --id');
  });

  test('rejects invalid objective ids', async () => {
    await seedQuest();
    const result = await handleQuest(['add-objective', 'q1', '--id', 'bad id', '--desc', 'Repair the antenna']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Invalid objective id');
  });

  test('requires a --desc flag', async () => {
    await seedQuest();
    const result = await handleQuest(['add-objective', 'q1', '--id', 'obj_c']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Missing --desc');
  });
});

// ── add-clue ───────────────────────────────────────────────────────

describe('quest add-clue', () => {
  test('requires a quest id', async () => {
    const result = await handleQuest(['add-clue']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('No quest-id');
  });

  test('requires clue text', async () => {
    const result = await handleQuest(['add-clue', 'q1']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('No clue text');
  });

  test('appends to quest clues', async () => {
    await seedQuest();
    const result = await handleQuest(['add-clue', 'q1', 'A faint signal from the north']);
    expect(result.ok).toBe(true);

    const state = await loadState();
    const quest = state.quests.find(q => q.id === 'q1')!;
    expect(quest.clues).toContain('A faint signal from the north');
  });

  test('duplicate clue is still added (no dedup)', async () => {
    await seedQuest();
    await handleQuest(['add-clue', 'q1', 'Same clue']);
    await handleQuest(['add-clue', 'q1', 'Same clue']);

    const state = await loadState();
    const quest = state.quests.find(q => q.id === 'q1')!;
    const matches = quest.clues.filter(c => c === 'Same clue');
    expect(matches).toHaveLength(2);
  });
});

// ── status ─────────────────────────────────────────────────────────

describe('quest status', () => {
  test('requires a quest id', async () => {
    await seedQuest();
    const result = await handleQuest(['status']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('No quest-id');
  });

  test('returns correct progress for a quest', async () => {
    await seedQuest();
    await handleQuest(['complete', 'q1', 'obj_a']);

    const result = await handleQuest(['status', 'q1']);
    expect(result.ok).toBe(true);

    const data = result.data as {
      title: string;
      completed: number;
      total: number;
      percentage: number;
      clueCount: number;
    };
    expect(data.title).toBe('Find the Signal');
    expect(data.completed).toBe(1);
    expect(data.total).toBe(2);
    expect(data.percentage).toBe(50);
    expect(data.clueCount).toBe(0);
  });
});

// ── inspect / track / create ───────────────────────────────────────

describe('quest inspect track create', () => {
  test('inspect returns full quest progress and canonical flags', async () => {
    await seedQuest();
    await handleQuest(['complete', 'q1', 'obj_a']);

    const result = await handleQuest(['inspect', 'q1']);
    expect(result.ok).toBe(true);
    const data = result.data as {
      id: string;
      progress: { completed: number; total: number; percentage: number };
      canonicalFlags: { objectives: string[] };
    };
    expect(data.id).toBe('q1');
    expect(data.progress.completed).toBe(1);
    expect(data.canonicalFlags.objectives).toContain('quest:q1:obj_a:complete');
  });

  test('track stores tracked quest flags and quest toast', async () => {
    await seedQuest();
    const result = await handleQuest(['track', 'q1']);
    expect(result.ok).toBe(true);

    const state = await loadState();
    expect(state.worldFlags.trackedQuestId).toBe('q1');
    expect(state.worldFlags.trackedQuest).toBe('q1');
    expect(state.worldFlags.questToast).toBe('Tracking quest: Find the Signal');
  });

  test('create generates an existing-compatible quest object', async () => {
    await handleState(['reset']);
    const result = await handleQuest([
      'create',
      '--id',
      'signal_return',
      '--title',
      'Signal Return',
      '--objective-id',
      'decode',
      '--objective',
      'Decode the signal',
    ]);
    expect(result.ok).toBe(true);

    const state = await loadState();
    const quest = state.quests.find(q => q.id === 'signal_return')!;
    expect(quest.title).toBe('Signal Return');
    expect(quest.status).toBe('active');
    expect(quest.currentObjectiveId).toBe('decode');
    expect(quest.objectives[0]!.description).toBe('Decode the signal');
    expect(state.worldFlags.questToast).toBe('Quest started: Signal Return');
  });

  test('create rejects duplicate quest ids', async () => {
    await seedQuest();
    const result = await handleQuest([
      'create',
      '--id',
      'q1',
      '--title',
      'Duplicate',
      '--objective-id',
      'start',
      '--objective',
      'Start',
    ]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('already exists');
  });
});

// ── list ───────────────────────────────────────────────────────────

describe('quest list', () => {
  test('returns all quests with percentages', async () => {
    await seedQuest();
    // Add a second quest
    const state = await loadState();
    state.quests.push({
      id: 'q2',
      title: 'Rescue the Crew',
      status: 'active',
      objectives: [{ id: 'obj_x', description: 'Find survivors', completed: true }],
      clues: ['Heard screaming from deck 3'],
    });
    await saveState(state);

    const result = await handleQuest(['list']);
    expect(result.ok).toBe(true);

    const data = result.data as Array<{
      id: string;
      title: string;
      percentage: number;
    }>;
    expect(data).toHaveLength(2);

    const q1 = data.find(q => q.id === 'q1')!;
    expect(q1.percentage).toBe(0);

    const q2 = data.find(q => q.id === 'q2')!;
    expect(q2.percentage).toBe(100);
  });
});

// ── no-state error paths ──────────────────────────────────────────

describe('quest no-state errors', () => {
  test('complete without state returns noState error', async () => {
    const result = await handleQuest(['complete', 'q1', 'obj_a']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toMatch(/no game state/i);
  });

  test('add-objective without state returns noState error', async () => {
    const result = await handleQuest(['add-objective', 'q1', '--id', 'obj_x', '--desc', 'Test']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toMatch(/no game state/i);
  });

  test('add-clue without state returns noState error', async () => {
    const result = await handleQuest(['add-clue', 'q1', 'Some clue']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toMatch(/no game state/i);
  });

  test('status without state returns noState error', async () => {
    const result = await handleQuest(['status', 'q1']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toMatch(/no game state/i);
  });

  test('list without state returns noState error', async () => {
    const result = await handleQuest(['list']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toMatch(/no game state/i);
  });
});

// ── validation errors ──────────────────────────────────────────────

describe('quest validation', () => {
  test('missing quest-id returns error', async () => {
    await seedQuest();
    const result = await handleQuest(['complete', 'nonexistent', 'obj_a']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('nonexistent');
  });

  test('missing objective-id returns error', async () => {
    await seedQuest();
    const result = await handleQuest(['complete', 'q1', 'nonexistent']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('nonexistent');
  });
});

describe('quest dispatch', () => {
  test('missing subcommand returns error', async () => {
    const result = await handleQuest([]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('No subcommand');
  });

  test('unknown subcommand returns error', async () => {
    const result = await handleQuest(['mystery']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Unknown subcommand');
  });
});

// ── round-trip ─────────────────────────────────────────────────────

describe('quest round-trip', () => {
  test('add objectives then complete them', async () => {
    await seedQuest();

    // Add a third objective
    await handleQuest(['add-objective', 'q1', '--id', 'obj_c', '--desc', 'Power the relay']);

    // Complete all three
    await handleQuest(['complete', 'q1', 'obj_a']);
    await handleQuest(['complete', 'q1', 'obj_b']);
    await handleQuest(['complete', 'q1', 'obj_c']);

    const state = await loadState();
    const quest = state.quests.find(q => q.id === 'q1')!;
    expect(quest.objectives.every(o => o.completed)).toBe(true);
    expect(state.worldFlags['quest:q1:complete']).toBe(true);
  });
});

// ── persistence ────────────────────────────────────────────────────

describe('quest persistence', () => {
  test('state persists after quest mutation', async () => {
    await seedQuest();
    await handleQuest(['complete', 'q1', 'obj_a']);
    await handleQuest(['add-clue', 'q1', 'Persistent clue']);

    // Re-load from disk
    const state = await loadState();
    const quest = state.quests.find(q => q.id === 'q1')!;
    expect(quest.objectives.find(o => o.id === 'obj_a')!.completed).toBe(true);
    expect(quest.clues).toContain('Persistent clue');
  });
});
