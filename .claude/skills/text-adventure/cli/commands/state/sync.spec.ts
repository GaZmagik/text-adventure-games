import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleState } from './index';
import { handleSync, JOURNAL_FILENAME } from './sync';
import { loadState, saveState, createDefaultState, getStatePath } from '../../lib/state-store';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-test-'));
  process.env.TAG_STATE_DIR = tempDir;
  // Satisfy verify gate for tests that use --apply — properly signed marker
  const { signMarker } = require('../verify');
  writeFileSync(join(tempDir, '.last-verify'), signMarker(999), 'utf-8');
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) {
    process.env.TAG_STATE_DIR = originalEnv;
  } else {
    delete process.env.TAG_STATE_DIR;
  }
});

describe('state/sync', () => {
  test('returns noState when no state exists', async () => {
    const result = await handleSync([]);
    expect(result.ok).toBe(false);
  });

  test('returns clean status when no issues', async () => {
    await handleState(['reset']);
    await handleState(['set', 'scene', '3']);
    await handleState(['set', 'currentRoom', 'bridge']);
    await handleState(['set', 'modulesActive', JSON.stringify([
      'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
      'character-creation', 'save-codex',
    ])]);
    await handleState(['set', 'worldFlags.rulebook', 'narrative_engine']);

    const result = await handleSync([]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.status).toBe('clean');
    expect((data.warnings as string[]).length).toBe(0);
    expect((data.errors as string[]).length).toBe(0);
    expect(data.applied).toBe(false);
  });

  test('diff shows scene increment', async () => {
    await handleState(['reset']);
    await handleState(['set', 'scene', '5']);

    const result = await handleSync([]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const diff = data.diff as Record<string, { from: unknown; to: unknown }>;
    expect(diff.scene).toBeDefined();
    expect(diff.scene!.from).toBe(5);
    expect(diff.scene!.to).toBe(6);
  });

  test('--apply applies mutations atomically', async () => {
    await handleState(['reset']);
    await handleState(['set', 'scene', '5']);
    await handleState(['set', 'modulesActive', JSON.stringify([
      'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
      'character-creation', 'save-codex',
    ])]);

    const result = await handleSync(['--apply']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.applied).toBe(true);

    const state = await loadState();
    expect(state.scene).toBe(6);
  });

  test('--apply succeeds when no errors present', async () => {
    await handleState(['reset']);
    const result = await handleSync(['--apply']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.applied).toBe(true);
    expect((data.errors as string[]).length).toBe(0);
  });

  test('dry run does not modify state', async () => {
    await handleState(['reset']);
    await handleState(['set', 'scene', '5']);

    const stateBefore = await loadState();
    expect(stateBefore.scene).toBe(5);

    const result = await handleSync([]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.applied).toBe(false);

    const stateAfter = await loadState();
    expect(stateAfter.scene).toBe(5);
  });

  test('detects pending computation not in rollHistory', async () => {
    await handleState(['reset']);
    await handleState(['set', 'scene', '3']);
    const comp = JSON.stringify({ type: 'contested_roll', stat: 'STR', roll: 14, modifier: 2, total: 16, margin: 3, outcome: 'success', npcId: 'guard_01', npcModifier: 1 });
    await handleState(['set', '_lastComputation', comp]);

    const result = await handleSync([]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const warnings = data.warnings as string[];
    expect(warnings.some(w => w.includes('Pending computation') && w.includes('contested_roll'))).toBe(true);
  });

  test('flags missing Tier 1 modules', async () => {
    await handleState(['reset']);
    await handleState(['set', 'modulesActive', JSON.stringify([
      'gm-checklist', 'core-systems', 'die-rolls',
      'character-creation', 'save-codex',
    ])]);

    const result = await handleSync([]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const warnings = data.warnings as string[];
    expect(warnings.some(w => w.includes('Missing Tier 1') && w.includes('prose-craft'))).toBe(true);
  });

  test('detects quest/worldFlag canonical mismatch', async () => {
    await handleState(['reset']);
    const quests = JSON.stringify([{
      id: 'find_signal', title: 'Find the Signal', status: 'active',
      objectives: [{ id: 'locate_tower', description: 'Locate the tower', completed: true }],
      clues: [],
    }]);
    await handleState(['set', 'quests', quests]);

    const result = await handleSync([]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const warnings = data.warnings as string[];
    expect(warnings.some(w =>
      w.includes('find_signal') && w.includes('locate_tower') && w.includes('worldFlag'),
    )).toBe(true);
  });

  test('detects reverse mismatch — flag set but objective not complete', async () => {
    await handleState(['reset']);
    const quests = JSON.stringify([{
      id: 'find_signal', title: 'Find the Signal', status: 'active',
      objectives: [{ id: 'locate_tower', description: 'Locate the tower', completed: false }],
      clues: [],
    }]);
    await handleState(['set', 'quests', quests]);
    await handleState(['set', 'worldFlags.quest:find_signal:locate_tower:complete', 'true']);

    const result = await handleSync([]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const warnings = data.warnings as string[];
    expect(warnings.some(w =>
      w.includes('quest:find_signal:locate_tower:complete') && w.includes('not marked complete'),
    )).toBe(true);
  });

  test('warns about level-up eligibility', async () => {
    await handleState(['reset']);
    const char = JSON.stringify({
      name: 'Kael', class: 'Scout', hp: 12, maxHp: 12, ac: 12,
      level: 2, xp: 250, currency: 0, currencyName: 'credits',
      stats: { STR: 10, DEX: 14, CON: 12, INT: 10, WIS: 11, CHA: 8 },
      modifiers: { STR: 0, DEX: 2, CON: 1, INT: 0, WIS: 0, CHA: -1 },
      proficiencyBonus: 2, proficiencies: [], abilities: [],
      inventory: [], conditions: [], equipment: { weapon: 'blaster', armour: 'light' },
    });
    await handleState(['set', 'character', char]);

    const result = await handleSync([]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const warnings = data.warnings as string[];
    expect(warnings.some(w => w.includes('Level-up') && w.includes('level 3'))).toBe(true);
  });

  test('detects NPC reference gap', async () => {
    await handleState(['reset']);
    await handleState(['set', 'worldFlags.npc_ghost_appeared', 'true']);

    const result = await handleSync([]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const warnings = data.warnings as string[];
    expect(warnings.some(w => w.includes('npc_ghost_appeared') && w.includes('ghost'))).toBe(true);
  });

  test('--room changes currentRoom in diff', async () => {
    await handleState(['reset']);
    await handleState(['set', 'scene', '3']);

    const result = await handleSync(['--room', 'engine-room']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const diff = data.diff as Record<string, { from: unknown; to: unknown }>;
    expect(diff.currentRoom).toBeDefined();
    expect(diff.currentRoom!.to).toBe('engine-room');
  });

  test('--time updates time in diff', async () => {
    await handleState(['reset']);
    const timeJson = JSON.stringify({ period: 'evening', hour: 20 });

    const result = await handleSync(['--time', timeJson]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const diff = data.diff as Record<string, { from: unknown; to: unknown }>;
    expect(diff.time).toBeDefined();
    const timeTo = diff.time!.to as Record<string, unknown>;
    expect(timeTo.period).toBe('evening');
    expect(timeTo.hour).toBe(20);
  });

  test('--apply persists parsed time updates', async () => {
    await handleState(['reset']);
    const timeJson = JSON.stringify({ period: 'evening', hour: 20 });

    const result = await handleSync(['--apply', '--time', timeJson]);
    expect(result.ok).toBe(true);

    const state = await loadState();
    expect(state.time.period).toBe('evening');
    expect(state.time.hour).toBe(20);
  });

  test('--time with invalid JSON produces warning', async () => {
    await handleState(['reset']);

    const result = await handleSync(['--time', '{not valid json']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const warnings = data.warnings as string[];
    expect(warnings.some(w => w.includes('invalid JSON'))).toBe(true);
  });

  test('returns featureChecklist based on active modules', async () => {
    await handleState(['reset']);
    await handleState(['set', 'modulesActive', JSON.stringify(['prose-craft', 'audio'])]);

    const result = await handleSync([]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const checklist = data.featureChecklist as string[];
    expect(checklist.length).toBe(2);
    expect(checklist.some(c => c.startsWith('prose-craft ON'))).toBe(true);
    expect(checklist.some(c => c.startsWith('audio ON'))).toBe(true);
  });

  test('warns when worldFlags.rulebook is not set after scene 0', async () => {
    await handleState(['reset']);
    await handleState(['set', 'scene', '2']);

    const result = await handleSync([]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const warnings = data.warnings as string[];
    expect(warnings.some(w => w.includes('worldFlags.rulebook'))).toBe(true);
  });

  test('no rulebook warning when worldFlags.rulebook is set', async () => {
    await handleState(['reset']);
    await handleState(['set', 'scene', '2']);
    await handleState(['set', 'worldFlags.rulebook', 'd20_system']);

    const result = await handleSync([]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const warnings = data.warnings as string[];
    expect(warnings.some(w => w.includes('worldFlags.rulebook'))).toBe(false);
  });

  test('no rulebook warning at scene 0 (pre-game)', async () => {
    await handleState(['reset']);

    const result = await handleSync([]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const warnings = data.warnings as string[];
    expect(warnings.some(w => w.includes('worldFlags.rulebook'))).toBe(false);
  });
});

describe('state/sync scene overrides', () => {
  test('valid --scene override shows change in diff', async () => {
    await handleState(['reset']);
    await handleState(['set', 'scene', '3']);

    const result = await handleSync(['--scene', '5']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const diff = data.diff as Record<string, { from: unknown; to: unknown }>;
    expect(diff.scene).toBeDefined();
    expect(diff.scene!.from).toBe(3);
    expect(diff.scene!.to).toBe(5);
  });

  test('negative --scene returns fail with appropriate error', async () => {
    await handleState(['reset']);
    const result = await handleSync(['--scene', '-1']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('-1');
  });

  test('non-finite --scene returns fail', async () => {
    await handleState(['reset']);
    const result = await handleSync(['--scene', 'NaN']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('NaN');
  });
});

describe('state/sync edge cases', () => {
  test('warns when --time is not a JSON object', async () => {
    await handleState(['reset']);
    const result = await handleSync(['--time', '5']);
    expect(result.ok).toBe(true);
    const data = result.data as { warnings: string[] };
    expect(data.warnings).toContain('--time flag must be a JSON object.');
  });

  test('warns when --time contains forbidden keys', async () => {
    await handleState(['reset']);
    const result = await handleSync(['--time', '{"constructor":{"prototype":{"polluted":true}}}']);
    expect(result.ok).toBe(true);
    const data = result.data as { warnings: string[] };
    expect(data.warnings.some(w => w.includes('forbidden keys'))).toBe(true);
  });

  test('warns when --time contains unknown fields', async () => {
    await handleState(['reset']);
    const result = await handleSync(['--time', '{"season":"winter","hour":12}']);
    expect(result.ok).toBe(true);
    const data = result.data as { warnings: string[] };
    expect(data.warnings.some(w => w.includes('"season"'))).toBe(true);
  });

  test('warns when a quest has no objectives', async () => {
    await handleState(['reset']);
    const state = await loadState();
    state.quests.push({
      id: 'q-empty',
      title: 'Empty Quest',
      status: 'active',
      objectives: [],
      clues: [],
    });
    await saveState(state);

    const result = await handleSync([]);
    expect(result.ok).toBe(true);
    const data = result.data as { warnings: string[] };
    expect(data.warnings.some(w => w.includes('has no objectives'))).toBe(true);
  });

  test('apply fails when the loaded state is structurally invalid', async () => {
    const invalidState = createDefaultState() as Record<string, unknown>;
    invalidState._version = 'broken';
    writeFileSync(getStatePath(), JSON.stringify(invalidState), 'utf-8');

    const result = await handleSync(['--apply']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Sync would produce invalid state');
  });

  describe('compaction detection', () => {
    let transcriptsDir: string;
    const originalTranscriptsEnv = process.env.TAG_TRANSCRIPTS_DIR;

    function setUpTranscriptsDir(): string {
      transcriptsDir = mkdtempSync(join(tmpdir(), 'tag-transcripts-'));
      process.env.TAG_TRANSCRIPTS_DIR = transcriptsDir;
      return transcriptsDir;
    }

    afterEach(() => {
      if (transcriptsDir) rmSync(transcriptsDir, { recursive: true, force: true });
      if (originalTranscriptsEnv !== undefined) {
        process.env.TAG_TRANSCRIPTS_DIR = originalTranscriptsEnv;
      } else {
        delete process.env.TAG_TRANSCRIPTS_DIR;
      }
    });

    async function initState(modules?: string[]): Promise<void> {
      await handleState(['reset']);
      await handleState(['set', 'scene', '3']);
      await handleState(['set', 'currentRoom', 'bridge']);
      const mods = modules ?? ['gm-checklist', 'prose-craft', 'core-systems', 'die-rolls', 'character-creation', 'save-codex'];
      await handleState(['set', 'modulesActive', JSON.stringify(mods)]);
    }

    function addTranscriptFiles(dir: string, count: number, includeJournal = true): void {
      if (includeJournal) writeFileSync(join(dir, JOURNAL_FILENAME), 'compaction log');
      for (let i = 0; i < count; i++) {
        writeFileSync(join(dir, `2026-03-24-${String(i).padStart(2, '0')}-00-00-transcript.txt`), 'transcript');
      }
    }

    test('no transcripts directory — compactionDetected is false, no compaction warnings', async () => {
      process.env.TAG_TRANSCRIPTS_DIR = '/tmp/nonexistent-transcripts-dir-that-does-not-exist';
      await initState();

      const result = await handleSync([]);
      expect(result.ok).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.compactionDetected).toBe(false);
      const warnings = data.warnings as string[];
      expect(warnings.some(w => w.includes('compaction'))).toBe(false);
    });

    test('empty transcripts directory — compactionDetected is false', async () => {
      setUpTranscriptsDir();
      await initState();

      const result = await handleSync([]);
      expect(result.ok).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.compactionDetected).toBe(false);
    });

    test('first compaction detected — warning includes module re-read list', async () => {
      const dir = setUpTranscriptsDir();
      addTranscriptFiles(dir, 1);
      await initState(['prose-craft', 'die-rolls', 'core-systems']);

      const result = await handleSync([]);
      expect(result.ok).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.compactionDetected).toBe(true);
      const warnings = data.warnings as string[];
      const compactionWarning = warnings.find(w => w.includes('compaction'));
      expect(compactionWarning).toBeDefined();
      expect(compactionWarning).toContain('modules/prose-craft.md');
      expect(compactionWarning).toContain('modules/die-rolls.md');
      expect(compactionWarning).toContain('modules/core-systems.md');
    });

    test('count matches stored — compactionDetected is false', async () => {
      const dir = setUpTranscriptsDir();
      addTranscriptFiles(dir, 2);
      await initState();
      const state = await loadState();
      state._compactionCount = 2;
      await saveState(state);

      const result = await handleSync([]);
      expect(result.ok).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.compactionDetected).toBe(false);
    });

    test('new compaction since last sync — warning mentions count difference', async () => {
      const dir = setUpTranscriptsDir();
      addTranscriptFiles(dir, 2);
      await initState();
      const state = await loadState();
      state._compactionCount = 1;
      await saveState(state);

      const result = await handleSync([]);
      expect(result.ok).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.compactionDetected).toBe(true);
      const warnings = data.warnings as string[];
      expect(warnings.some(w => w.includes('1 new compaction'))).toBe(true);
    });

    test('--apply updates _compactionCount in persisted state', async () => {
      const dir = setUpTranscriptsDir();
      addTranscriptFiles(dir, 2);
      await initState();

      await handleSync(['--apply']);
      const updated = await loadState();
      expect(updated._compactionCount).toBe(2);
    });

    test('dry run does NOT update _compactionCount', async () => {
      const dir = setUpTranscriptsDir();
      addTranscriptFiles(dir, 2);
      await initState();

      await handleSync([]);
      const unchanged = await loadState();
      expect(unchanged._compactionCount).toBeUndefined();
    });

    test('journal-only directory (zero transcripts) — compactionDetected is false', async () => {
      const dir = setUpTranscriptsDir();
      addTranscriptFiles(dir, 0, true);
      await initState();

      const result = await handleSync([]);
      expect(result.ok).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.compactionDetected).toBe(false);
    });

    test('negative delta (stored count exceeds filesystem) — no warning, no regression', async () => {
      const dir = setUpTranscriptsDir();
      addTranscriptFiles(dir, 1);
      await initState();
      const state = await loadState();
      state._compactionCount = 5;
      await saveState(state);

      const result = await handleSync(['--apply']);
      expect(result.ok).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.compactionDetected).toBe(false);
      const warnings = data.warnings as string[];
      expect(warnings.some(w => w.includes('compaction'))).toBe(false);
      const updated = await loadState();
      expect(updated._compactionCount).toBe(5);
    });
  });

  describe('pending roll enforcement', () => {
    async function initStateWithModules(): Promise<void> {
      await handleState(['reset']);
      await handleState(['set', 'scene', '3']);
      await handleState(['set', 'currentRoom', 'bridge']);
      await handleState(['set', 'modulesActive', JSON.stringify([
        'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
        'character-creation', 'save-codex',
      ])]);
    }

    test('unresolved _pendingRolls produces a warning', async () => {
      await initStateWithModules();
      const state = await loadState();
      state._pendingRolls = [
        { action: 1, type: 'contest', stat: 'CHA', npc: 'faal_01' },
      ];
      await saveState(state);

      const result = await handleSync([]);
      expect(result.ok).toBe(true);
      const data = result.data as { warnings: string[] };
      expect(data.warnings.some(w => w.includes('pending') && w.includes('CHA'))).toBe(true);
      expect(data.warnings.some(w => w.includes('tag compute'))).toBe(true);
    });

    test('--apply with unresolved _pendingRolls returns fail', async () => {
      await initStateWithModules();
      const state = await loadState();
      state._pendingRolls = [
        { action: 1, type: 'hazard', stat: 'DEX', dc: 15 },
      ];
      await saveState(state);

      const result = await handleSync(['--apply']);
      expect(result.ok).toBe(false);
      expect(result.error!.message).toContain('pending');
    });

    test('--apply with resolved rolls succeeds and clears _pendingRolls', async () => {
      await initStateWithModules();
      const state = await loadState();
      state._pendingRolls = [
        { action: 1, type: 'contest', stat: 'CHA', npc: 'faal_01' },
      ];
      state.rollHistory = [
        { scene: 3, type: 'contested_roll', stat: 'CHA', roll: 14, outcome: 'success' },
      ];
      await saveState(state);

      const result = await handleSync(['--apply']);
      expect(result.ok).toBe(true);

      const updated = await loadState();
      expect(updated._pendingRolls).toEqual([]);
    });
  });

  describe('roll ratio backstop', () => {
    async function initWithRulebook(rulebook: string, scene: number): Promise<void> {
      await handleState(['reset']);
      await handleState(['set', 'scene', String(scene)]);
      await handleState(['set', 'currentRoom', 'bridge']);
      await handleState(['set', 'modulesActive', JSON.stringify([
        'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
        'character-creation', 'save-codex',
      ])]);
      await handleState(['set', `worldFlags.rulebook`, rulebook]);
    }

    test('warns at 3 rollless scenes with d20_system', async () => {
      await initWithRulebook('d20_system', 4);

      const result = await handleSync([]);
      expect(result.ok).toBe(true);
      const data = result.data as { warnings: string[] };
      expect(data.warnings.some(w => w.includes('rollless') && w.includes('4'))).toBe(true);
    });

    test('blocks at 5 rollless scenes with d20_system', async () => {
      await initWithRulebook('d20_system', 6);

      const result = await handleSync([]);
      expect(result.ok).toBe(true);
      const data = result.data as { warnings: string[] };
      expect(data.warnings.some(w => w.includes('BLOCK') || w.includes('block'))).toBe(true);
    });

    test('does NOT warn for narrative_engine rulebook', async () => {
      await initWithRulebook('narrative_engine', 6);

      const result = await handleSync([]);
      expect(result.ok).toBe(true);
      const data = result.data as { warnings: string[] };
      expect(data.warnings.some(w => w.includes('rollless'))).toBe(false);
    });
  });

  // ── Compaction check — outside-allowed-paths warning (lines 174-179) ──

  describe('compaction path security', () => {
    const originalTranscriptsEnv = process.env.TAG_TRANSCRIPTS_DIR;

    afterEach(() => {
      if (originalTranscriptsEnv !== undefined) {
        process.env.TAG_TRANSCRIPTS_DIR = originalTranscriptsEnv;
      } else {
        delete process.env.TAG_TRANSCRIPTS_DIR;
      }
    });

    test('warns when TAG_TRANSCRIPTS_DIR is outside allowed paths', async () => {
      // /etc is outside home, tmp, and /mnt — triggers the security guard
      process.env.TAG_TRANSCRIPTS_DIR = '/etc';
      await handleState(['reset']);
      await handleState(['set', 'scene', '2']);

      const result = await handleSync([]);
      expect(result.ok).toBe(true);
      const data = result.data as { warnings: string[]; compactionDetected: boolean };
      expect(data.warnings.some(w =>
        w.includes('Compaction check skipped') && w.includes('outside allowed paths'),
      )).toBe(true);
      expect(data.compactionDetected).toBe(false);
    });

    test('readdir non-ENOENT error produces a warning', async () => {
      // Point at a file rather than a directory — readdirSync on a file gives ENOTDIR
      const filePath = join(tempDir, 'not-a-dir.txt');
      writeFileSync(filePath, 'I am a file', 'utf-8');
      process.env.TAG_TRANSCRIPTS_DIR = filePath;
      await handleState(['reset']);
      await handleState(['set', 'scene', '2']);

      const result = await handleSync([]);
      expect(result.ok).toBe(true);
      const data = result.data as { warnings: string[]; compactionDetected: boolean };
      expect(data.warnings.some(w =>
        w.includes('Compaction check skipped') && w.includes('could not read'),
      )).toBe(true);
      expect(data.compactionDetected).toBe(false);
    });
  });

  // ── Verify gate during --apply (lines 326-335) ────────────────────────

  describe('apply verify gate', () => {
    test('--apply blocks when last verify scene is behind current scene', async () => {
      await handleState(['reset']);
      await handleState(['set', 'scene', '5']);
      await handleState(['set', 'modulesActive', JSON.stringify([
        'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
        'character-creation', 'save-codex',
      ])]);
      await handleState(['set', 'worldFlags.rulebook', 'narrative_engine']);

      // Write a verify marker for scene 3, but state is at scene 5
      const { signMarker } = require('../verify');
      writeFileSync(join(tempDir, '.last-verify'), signMarker(3), 'utf-8');

      const result = await handleSync(['--apply']);
      expect(result.ok).toBe(false);
      expect(result.error!.message).toContain('has not been verified');
      expect(result.error!.message).toContain('Scene 5');
    });
  });

  // ── Deadline coercion in --apply --time (lines 369-377) ────────────────

  describe('apply time deadline coercion', () => {
    test('--apply with deadline object coerces label and remainingScenes', async () => {
      await handleState(['reset']);
      await handleState(['set', 'modulesActive', JSON.stringify([
        'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
        'character-creation', 'save-codex',
      ])]);
      await handleState(['set', 'worldFlags.rulebook', 'narrative_engine']);

      const timeJson = JSON.stringify({
        period: 'night',
        deadline: { label: 'Reactor meltdown', remainingScenes: 3 },
      });
      const result = await handleSync(['--apply', '--time', timeJson]);
      expect(result.ok).toBe(true);

      const state = await loadState();
      expect(state.time.period).toBe('night');
      expect(state.time.deadline).toEqual({ label: 'Reactor meltdown', remainingScenes: 3 });
    });

    test('--apply with deadline null clears deadline', async () => {
      await handleState(['reset']);
      await handleState(['set', 'modulesActive', JSON.stringify([
        'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
        'character-creation', 'save-codex',
      ])]);
      await handleState(['set', 'worldFlags.rulebook', 'narrative_engine']);

      // First set a deadline
      const timeWith = JSON.stringify({
        deadline: { label: 'Bomb', remainingScenes: 2 },
      });
      await handleSync(['--apply', '--time', timeWith]);
      let state = await loadState();
      expect(state.time.deadline).toEqual({ label: 'Bomb', remainingScenes: 2 });

      // Now clear it with null
      const timeClear = JSON.stringify({ deadline: null });
      // Reset verify marker for next apply
      const { signMarker } = require('../verify');
      writeFileSync(join(tempDir, '.last-verify'), signMarker(999), 'utf-8');
      const result = await handleSync(['--apply', '--time', timeClear]);
      expect(result.ok).toBe(true);

      state = await loadState();
      expect(state.time.deadline).toBeNull();
    });
  });

  describe('inlineGuidance', () => {
    test('always includes proseChecklist with 11 items', async () => {
      await handleState(['reset']);
      await handleState(['set', 'modulesActive', JSON.stringify([
        'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
        'character-creation', 'save-codex',
      ])]);
      await handleState(['set', 'worldFlags.rulebook', 'narrative_engine']);

      const result = await handleSync([]);
      expect(result.ok).toBe(true);
      const data = result.data as Record<string, unknown>;
      const guidance = data.inlineGuidance as Record<string, unknown>;
      expect(guidance).toBeDefined();
      const checklist = guidance.proseChecklist as string[];
      expect(checklist.length).toBe(11);
      expect(checklist[0]).toContain('Second person');
    });

    test('always includes renderingRules', async () => {
      await handleState(['reset']);
      await handleState(['set', 'modulesActive', JSON.stringify([
        'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
        'character-creation', 'save-codex',
      ])]);
      await handleState(['set', 'worldFlags.rulebook', 'narrative_engine']);

      const result = await handleSync([]);
      const data = result.data as Record<string, unknown>;
      const guidance = data.inlineGuidance as Record<string, unknown>;
      const rules = guidance.renderingRules as string[];
      expect(rules.length).toBeGreaterThanOrEqual(3);
      expect(rules.some(r => r.includes('show_widget'))).toBe(true);
    });

    test('always includes sceneStructure', async () => {
      await handleState(['reset']);
      await handleState(['set', 'modulesActive', JSON.stringify([
        'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
        'character-creation', 'save-codex',
      ])]);
      await handleState(['set', 'worldFlags.rulebook', 'narrative_engine']);

      const result = await handleSync([]);
      const data = result.data as Record<string, unknown>;
      const guidance = data.inlineGuidance as Record<string, unknown>;
      const structure = guidance.sceneStructure as string[];
      expect(structure.length).toBeGreaterThanOrEqual(5);
      expect(structure.some(s => s.includes('Location'))).toBe(true);
      expect(structure.some(s => s.includes('Footer'))).toBe(true);
    });

    test('includes densityGuidance', async () => {
      await handleState(['reset']);
      await handleState(['set', 'worldFlags.rulebook', 'narrative_engine']);

      const result = await handleSync([]);
      const data = result.data as Record<string, unknown>;
      const guidance = data.inlineGuidance as Record<string, unknown>;
      const density = guidance.densityGuidance as Record<string, string>;
      expect(density.actOpener).toContain('6');
      expect(density.standard).toContain('2');
      expect(density.transition).toContain('1');
    });
  });
});
