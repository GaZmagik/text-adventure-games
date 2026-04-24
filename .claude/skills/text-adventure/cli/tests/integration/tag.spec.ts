import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

type TagRunResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  json: Record<string, unknown>;
};

let tempDir: string;
const cliDir = join(import.meta.dir, '..', '..');

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-cli-blackbox-'));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

async function runTag(args: string[], extraEnv: Record<string, string> = {}): Promise<TagRunResult> {
  const proc = Bun.spawn(['bun', './tag.ts', ...args], {
    cwd: cliDir,
    env: {
      ...process.env,
      TAG_STATE_DIR: tempDir,
      ...extraEnv,
    },
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
  const exitCode = await proc.exited;

  return {
    exitCode,
    stdout,
    stderr,
    json: JSON.parse(stdout.trim()) as Record<string, unknown>,
  };
}

async function expectOk(args: string[]): Promise<Record<string, unknown>> {
  const result = await runTag(args);
  expect(result.stderr).toBe('');
  expect(result.exitCode).toBe(0);
  expect(result.json.ok).toBe(true);
  return result.json;
}

async function expectFail(args: string[]): Promise<Record<string, unknown>> {
  const result = await runTag(args);
  expect(result.stderr).toBe('');
  expect(result.exitCode).toBe(1);
  expect(result.json.ok).toBe(false);
  return result.json;
}

describe('tag CLI black-box', () => {
  test('state happy path allows nested allowlisted writes', async () => {
    await expectOk(['state', 'reset']);
    const result = await expectOk(['state', 'set', 'time.hour', '9']);
    const data = result.data as Record<string, unknown>;
    expect(data.path).toBe('time.hour');
    expect(data.newValue).toBe(9);
  });

  test('state failure rejects unknown nested paths', async () => {
    await expectOk(['state', 'reset']);
    const result = await expectFail(['state', 'set', 'time.season', 'winter']);
    const error = result.error as Record<string, string>;
    expect(error.message).toContain('Unknown path segment "season" under "time"');
  });

  test('compute happy path runs a hazard save', async () => {
    await expectOk(['state', 'reset']);
    const result = await expectOk(['compute', 'hazard', 'CON', '--dc', '14']);
    const data = result.data as Record<string, unknown>;
    expect(data.type).toBe('hazard_save');
    expect(typeof data.roll).toBe('number');
    expect(data.dc).toBe(14);
  });

  test('compute failure rejects invalid stats', async () => {
    await expectOk(['state', 'reset']);
    const result = await expectFail(['compute', 'hazard', 'FOO', '--dc', '14']);
    const error = result.error as Record<string, string>;
    expect(error.message).toContain('Invalid stat');
  });

  test('render happy path works after sync for in-game widgets', async () => {
    await expectOk(['state', 'reset']);
    await expectOk(['state', 'set', 'visualStyle', 'terminal']);
    await expectOk(['state', 'sync', '--apply']);
    const result = await expectOk(['render', 'footer', '--raw']);
    expect(result.data).toEqual(expect.stringContaining('<ta-footer'));
  });

  test('render failure enforces the sync gate', async () => {
    await expectOk(['state', 'reset']);
    await expectOk(['state', 'set', 'visualStyle', 'terminal']);
    const result = await expectFail(['render', 'footer', '--raw']);
    const error = result.error as Record<string, string>;
    expect(error.message).toContain('State sync required before rendering scene 0');
  });

  test('save happy path generates an SF2 save string', async () => {
    await expectOk(['state', 'reset']);
    const result = await expectOk(['save', 'generate']);
    const data = result.data as Record<string, unknown>;
    expect(typeof data.saveString).toBe('string');
    expect(data.saveString).toEqual(expect.stringContaining('.SF2:'));
  });

  test('save migrate re-emits a current SF2 save without loading it', async () => {
    await expectOk(['state', 'reset']);
    await expectOk(['state', 'set', 'scene', '4']);
    const generated = await expectOk(['save', 'generate']);
    const saveString = (generated.data as Record<string, unknown>).saveString as string;
    await expectOk(['state', 'set', 'scene', '9']);

    const migrated = await expectOk(['save', 'migrate', saveString]);
    const data = migrated.data as Record<string, unknown>;
    expect(data.format).toBe('SF2');
    expect(data.scene).toBe(4);
    expect(data.saveString).toEqual(expect.stringContaining('.SF2:'));

    const current = await expectOk(['state', 'get', 'scene']);
    expect(current.data).toBe(9);
  });

  test('save failure does not reinterpret missing file paths as raw save strings', async () => {
    const result = await expectFail(['save', 'load', './missing.save.md']);
    const error = result.error as Record<string, string>;
    expect(error.message).toContain('Save file not found');
    expect(error.message).not.toContain('Save validation failed');
  });

  test('batch happy path preserves semicolons inside quoted payloads', async () => {
    const result = await expectOk([
      'batch',
      '--commands',
      'state reset; state set worldFlags.memo "alpha; beta"; state get worldFlags.memo',
    ]);
    const data = result.data as Record<string, unknown>;
    const snapshot = data.state_snapshot as Record<string, unknown>;
    expect(data.commandCount).toBe(3);
    expect((snapshot.worldFlags as Record<string, unknown>).memo).toBe('alpha; beta');
    expect(data.errors).toEqual([]);
    expect(data.persistedWrites).toBe(1);
  });

  test('batch failure path rejects missing command input', async () => {
    const result = await expectFail(['batch']);
    const error = result.error as Record<string, string>;
    expect(error.message).toContain('No commands provided');
  });

  test('rules happy path returns filtered rules', async () => {
    const result = await expectOk(['rules', 'output']);
    const data = result.data as Record<string, unknown>;
    expect(data.category).toBe('output');
    expect(typeof data.total).toBe('number');
    expect(data.total as number).toBeGreaterThan(0);
  });

  test('rules no-match path reports zero results cleanly', async () => {
    const result = await expectOk(['rules', 'no-such-rule-token']);
    const data = result.data as Record<string, unknown>;
    expect(data.total).toBe(0);
    expect(data.hint).toEqual(expect.stringContaining('No rules match'));
  });

  test('quest happy path completes an objective', async () => {
    await expectOk(['state', 'reset']);
    await expectOk([
      'state',
      'set',
      'quests',
      '[{"id":"main","title":"Main Quest","status":"active","objectives":[{"id":"find_beacon","description":"Find the beacon","completed":false}],"clues":[]}]',
    ]);
    const result = await expectOk(['quest', 'complete', 'main', 'find_beacon']);
    const data = result.data as Record<string, unknown>;
    expect(data.completed).toBe(true);
    expect(data.allObjectivesComplete).toBe(true);
  });

  test('quest failure reports missing quests', async () => {
    await expectOk(['state', 'reset']);
    const result = await expectFail(['quest', 'status', 'missing']);
    const error = result.error as Record<string, string>;
    expect(error.message).toContain('Quest "missing" not found');
  });

  test('quest create, inspect, and track work through the CLI', async () => {
    await expectOk(['state', 'reset']);
    const created = await expectOk([
      'quest',
      'create',
      '--id',
      'cleanup_q',
      '--title',
      'Cleanup Quest',
      '--objective-id',
      'start',
      '--objective',
      'Start the cleanup pass',
    ]);
    const createdData = created.data as { quest: { id: string; title: string }; tracked: boolean };
    expect(createdData.quest.id).toBe('cleanup_q');
    expect(createdData.tracked).toBe(true);

    const inspected = await expectOk(['quest', 'inspect', 'cleanup_q']);
    const inspectedData = inspected.data as Record<string, unknown>;
    expect(inspectedData.title).toBe('Cleanup Quest');
    expect(inspectedData.tracked).toBe(true);

    const tracked = await expectOk(['quest', 'track', 'cleanup_q']);
    const trackedData = tracked.data as Record<string, unknown>;
    expect(trackedData.tracked).toBe(true);
    expect(trackedData.toast).toEqual(expect.stringContaining('Tracking quest'));
  });

  test('faction inspect works through the CLI after world generation', async () => {
    await expectOk(['state', 'reset']);
    await expectOk(['world', 'generate', '--seed', 'cleanup-pass', '--theme', 'space', '--apply']);
    const factions = await expectOk(['state', 'get', 'worldData.factions.factions']);
    const firstFaction = (factions.data as Array<{ id: string; name: string }>)[0]!;
    const result = await expectOk(['faction', 'inspect', firstFaction.id]);
    const data = result.data as Record<string, unknown>;
    expect(data.id).toBe(firstFaction.id);
    expect(typeof data.name).toBe('string');
    expect(data.standingLabel).toBe('neutral');
    expect(Array.isArray(data.relations)).toBe(true);
  });

  test('export happy path generates lore content', async () => {
    await expectOk(['state', 'reset']);
    const result = await expectOk(['export', 'generate']);
    const data = result.data as Record<string, unknown>;
    expect(typeof data.loreContent).toBe('string');
    expect(data.loreContent).toEqual(expect.stringContaining('<!-- LORE:'));
  });

  test('export failure reports missing lore files', async () => {
    const result = await expectFail(['export', 'load', './missing.lore.md']);
    const error = result.error as Record<string, string>;
    expect(error.message).toContain('Lore file not found');
  });

  test('compaction preflight auto-syncs and returns recovered alert when transcripts exist', async () => {
    const transcriptsDir = mkdtempSync(join(tmpdir(), 'tag-transcripts-'));

    // Initialise state BEFORE creating transcripts (auto-recovery fires on every command)
    await runTag(['state', 'reset']);

    // Create transcripts after state setup
    writeFileSync(join(transcriptsDir, 'journal.txt'), 'log');
    writeFileSync(join(transcriptsDir, '2026-01-01-00-00-00-transcript.txt'), 'transcript');

    try {
      const result = await runTag(['version'], { TAG_TRANSCRIPTS_DIR: transcriptsDir });
      expect(result.exitCode).toBe(0);
      const alert = result.json._compactionAlert as
        | {
            detected: boolean;
            recovered: boolean;
            message: string;
            modulesRequired?: string[];
          }
        | undefined;
      expect(alert).toBeDefined();
      expect(alert!.detected).toBe(true);
      expect(alert!.recovered).toBe(true);
      expect(alert!.message).toContain('COMPACTION DETECTED');
      expect(alert!.message).toContain('1 new compaction');
      expect(Array.isArray(alert!.modulesRequired)).toBe(true);
    } finally {
      rmSync(transcriptsDir, { recursive: true, force: true });
    }
  });

  test('compaction auto-recovery updates _compactionCount in state', async () => {
    const transcriptsDir = mkdtempSync(join(tmpdir(), 'tag-transcripts-'));

    // Initialise state BEFORE creating transcripts (auto-recovery fires on every command)
    await runTag(['state', 'reset']);

    // Create transcripts after state setup
    writeFileSync(join(transcriptsDir, 'journal.txt'), 'log');
    writeFileSync(join(transcriptsDir, '2026-01-01-00-00-00-transcript.txt'), 'transcript');
    writeFileSync(join(transcriptsDir, '2026-01-02-00-00-00-transcript.txt'), 'transcript2');

    try {
      // First call with TAG_TRANSCRIPTS_DIR triggers auto-sync for 2 new compactions
      const result = await runTag(['version'], { TAG_TRANSCRIPTS_DIR: transcriptsDir });
      expect(result.exitCode).toBe(0);
      const alert = result.json._compactionAlert as {
        detected: boolean;
        recovered: boolean;
        message: string;
      };
      expect(alert.recovered).toBe(true);
      expect(alert.message).toContain('2 new compaction');

      // Read the state file directly to verify _compactionCount was persisted
      const stateRaw = JSON.parse(readFileSync(join(tempDir, 'state.json'), 'utf-8'));
      expect(stateRaw._compactionCount).toBe(2);
    } finally {
      rmSync(transcriptsDir, { recursive: true, force: true });
    }
  });

  test('compaction auto-recovery populates modulesRequired from context', async () => {
    const transcriptsDir = mkdtempSync(join(tmpdir(), 'tag-transcripts-'));

    // Initialise state and set modulesActive BEFORE creating transcripts
    // (auto-recovery fires on every command, so transcripts must appear after setup)
    await runTag(['state', 'reset']);
    await runTag(['state', 'set', 'modulesActive', '["save-codex","die-rolls"]']);

    // Now create transcript files — the next command will detect compaction
    writeFileSync(join(transcriptsDir, 'journal.txt'), 'log');
    writeFileSync(join(transcriptsDir, '2026-01-01-00-00-00-transcript.txt'), 'transcript');

    try {
      const result = await runTag(['version'], { TAG_TRANSCRIPTS_DIR: transcriptsDir });
      expect(result.exitCode).toBe(0);
      const alert = result.json._compactionAlert as {
        detected: boolean;
        recovered: boolean;
        message: string;
        modulesRequired?: string[];
      };
      expect(alert.recovered).toBe(true);
      expect(alert.modulesRequired).toContain('modules/save-codex.md');
      expect(alert.modulesRequired).toContain('modules/die-rolls.md');
    } finally {
      rmSync(transcriptsDir, { recursive: true, force: true });
    }
  });

  test('compaction block gate rejects render commands with exit 1', async () => {
    await runTag(['state', 'reset']);
    writeFileSync(join(tempDir, '.compaction-blocked'), 'test block', 'utf-8');

    const result = await runTag(['render', 'footer', '--raw']);
    expect(result.exitCode).toBe(1);
    expect(result.json.ok).toBe(false);
    const error = result.json.error as Record<string, string>;
    expect(error.message).toContain('BLOCKED');
    expect(error.corrective).toContain('tag compact restore');
  });

  test('compaction block gate allows exempt commands through', async () => {
    await runTag(['state', 'reset']);
    writeFileSync(join(tempDir, '.compaction-blocked'), 'test block', 'utf-8');

    const versionResult = await runTag(['version']);
    expect(versionResult.exitCode).toBe(0);
    expect(versionResult.json.ok).toBe(true);

    const helpResult = await runTag(['help']);
    expect(helpResult.exitCode).toBe(0);
    expect(helpResult.json.ok).toBe(true);
  });

  test('compaction block gate allows compact restore through', async () => {
    await runTag(['state', 'reset']);
    writeFileSync(join(tempDir, '.compaction-blocked'), 'test block', 'utf-8');

    const result = await runTag(['compact', 'restore']);
    expect(result.exitCode).toBe(0);
    expect(result.json.ok).toBe(true);
    const data = result.json.data as Record<string, unknown>;
    expect(data.restored).toBe(true);
  });

  test('no _compactionAlert when transcripts directory is empty', async () => {
    const transcriptsDir = mkdtempSync(join(tmpdir(), 'tag-transcripts-'));

    try {
      const result = await runTag(['version'], { TAG_TRANSCRIPTS_DIR: transcriptsDir });
      expect(result.exitCode).toBe(0);
      expect(result.json._compactionAlert).toBeUndefined();
    } finally {
      rmSync(transcriptsDir, { recursive: true, force: true });
    }
  });

  test('compaction block allows state commands through for diagnostics', async () => {
    await runTag(['state', 'reset']);
    writeFileSync(join(tempDir, '.compaction-blocked'), 'test block', 'utf-8');

    const result = await runTag(['state', 'get', 'scene']);
    expect(result.exitCode).toBe(0);
    expect(result.json.ok).toBe(true);
    expect(result.json.data).toBe(0);
  });

  test('compaction block allows module commands through for recovery', async () => {
    await runTag(['state', 'reset']);
    writeFileSync(join(tempDir, '.compaction-blocked'), 'test block', 'utf-8');

    const result = await runTag(['module', 'status']);
    expect(result.exitCode).toBe(0);
    expect(result.json.ok).toBe(true);
  });

  test('compaction block allows compute commands through', async () => {
    await runTag(['state', 'reset']);
    writeFileSync(join(tempDir, '.compaction-blocked'), 'test block', 'utf-8');

    const result = await runTag(['compute', 'hazard', 'CON', '--dc', '14']);
    expect(result.exitCode).toBe(0);
    expect(result.json.ok).toBe(true);
  });

  test('compaction block still hard-blocks render commands', async () => {
    await runTag(['state', 'reset']);
    writeFileSync(join(tempDir, '.compaction-blocked'), 'test block', 'utf-8');

    const result = await runTag(['render', 'footer', '--raw']);
    expect(result.exitCode).toBe(1);
    expect(result.json.ok).toBe(false);
    const error = result.json.error as Record<string, string>;
    expect(error.message).toContain('BLOCKED');
  });

  test('no _compactionAlert when _compactionCount matches transcript count', async () => {
    const transcriptsDir = mkdtempSync(join(tmpdir(), 'tag-transcripts-'));
    writeFileSync(join(transcriptsDir, 'journal.txt'), 'log');
    writeFileSync(join(transcriptsDir, '2026-01-01-00-00-00-transcript.txt'), 'transcript');

    // Initialise state and set _compactionCount to 1 (matches the 1 transcript)
    await runTag(['state', 'reset'], { TAG_TRANSCRIPTS_DIR: transcriptsDir });
    await runTag(['state', 'set', '_compactionCount', '1'], { TAG_TRANSCRIPTS_DIR: transcriptsDir });

    try {
      const result = await runTag(['version'], { TAG_TRANSCRIPTS_DIR: transcriptsDir });
      expect(result.exitCode).toBe(0);
      expect(result.json._compactionAlert).toBeUndefined();
    } finally {
      rmSync(transcriptsDir, { recursive: true, force: true });
    }
  });
});
