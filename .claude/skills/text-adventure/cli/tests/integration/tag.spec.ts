import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
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
    expect(result.data).toEqual(expect.stringContaining('footer-row'));
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
    expect((data.total as number)).toBeGreaterThan(0);
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

  test('compaction preflight injects _compactionAlert on any command when transcripts exist', async () => {
    const transcriptsDir = mkdtempSync(join(tmpdir(), 'tag-transcripts-'));
    writeFileSync(join(transcriptsDir, 'journal.txt'), 'log');
    writeFileSync(join(transcriptsDir, '2026-01-01-00-00-00-transcript.txt'), 'transcript');

    try {
      const result = await runTag(['version'], { TAG_TRANSCRIPTS_DIR: transcriptsDir });
      expect(result.exitCode).toBe(0);
      const alert = result.json._compactionAlert as { detected: boolean; message: string } | undefined;
      expect(alert).toBeDefined();
      expect(alert!.detected).toBe(true);
      expect(alert!.message).toContain('COMPACTION ALERT');
      expect(alert!.message).toContain('1 new compaction');
    } finally {
      rmSync(transcriptsDir, { recursive: true, force: true });
    }
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
});
