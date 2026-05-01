import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleQuest } from './quest';
import { handleState } from './state/index';
import { handleSync } from './state/sync';
import { loadState, saveState } from '../lib/state-store';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-quest-deadline-test-'));
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

describe('quest deadlines', () => {
  test('create quest with deadline', async () => {
    await handleState(['reset']);
    const result = await handleQuest([
      'create',
      '--id',
      'time_sensitive',
      '--title',
      'Quick!',
      '--objective-id',
      'rush',
      '--objective',
      'Rush to the base',
      '--deadline',
      '5'
    ]);
    expect(result.ok).toBe(true);

    const state = await loadState();
    const quest = state.quests.find(q => q.id === 'time_sensitive')!;
    expect(quest.objectives[0]!.requirements?.deadline).toBe(5);
  });

  test('add objective with deadline', async () => {
    await handleState(['reset']);
    await handleQuest([
      'create',
      '--id',
      'q1',
      '--title',
      'Q1',
      '--objective-id',
      'o1',
      '--objective',
      'O1'
    ]);

    const result = await handleQuest([
      'add-objective',
      'q1',
      '--id',
      'o2',
      '--desc',
      'Timed O2',
      '--deadline',
      '10'
    ]);
    expect(result.ok).toBe(true);

    const state = await loadState();
    const quest = state.quests.find(q => q.id === 'q1')!;
    const o2 = quest.objectives.find(o => o.id === 'o2')!;
    expect(o2.addedAtScene).toBe(0);
    expect(o2.requirements?.deadline).toBe(10);
  });

  test('late-added objective deadline starts from the objective scene, not quest creation', async () => {
    await handleState(['reset']);
    await handleQuest([
      'create',
      '--id',
      'q1',
      '--title',
      'Q1',
      '--objective-id',
      'o1',
      '--objective',
      'O1'
    ]);

    const state = await loadState();
    state.scene = 5;
    state.time.elapsed = 5;
    await saveState(state);

    await handleQuest([
      'add-objective',
      'q1',
      '--id',
      'o2',
      '--desc',
      'Timed O2',
      '--deadline',
      '2'
    ]);

    const updated = await loadState();
    const objective = updated.quests.find(q => q.id === 'q1')!.objectives.find(o => o.id === 'o2')!;
    expect(objective.addedAtScene).toBe(5);

    const syncResult = await handleSync([]);
    expect(syncResult.ok).toBe(true);
    const syncData = syncResult.data as { warnings: string[] };
    expect(syncData.warnings.some(w => w.includes('q1/o2'))).toBe(false);
  });

  test('sync blocks if deadline is exceeded', async () => {
    await handleState(['reset']);
    await handleQuest([
      'create',
      '--id',
      'q1',
      '--title',
      'Q1',
      '--objective-id',
      'o1',
      '--objective',
      'O1',
      '--deadline',
      '2'
    ]);

    // Move to scene 3
    const state = await loadState();
    state.scene = 3;
    state.time.elapsed = 3;
    await saveState(state);

    const syncResult = await handleSync([]);
    expect(syncResult.ok).toBe(true);
    const data = syncResult.data as any;
    expect(data.warnings.some((w: string) => w.includes('BLOCK: Quest objective "q1/o1" has FAILED'))).toBe(true);
  });
});
