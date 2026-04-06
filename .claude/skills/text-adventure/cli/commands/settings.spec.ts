import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleSettings } from './settings';
import { handleState } from './state';
import { tryLoadState } from '../lib/state-store';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(async () => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-settings-test-'));
  process.env.TAG_STATE_DIR = tempDir;
  await handleState(['reset']);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) {
    process.env.TAG_STATE_DIR = originalEnv;
  } else {
    delete process.env.TAG_STATE_DIR;
  }
});

// ── tag settings prose llm ─────────────────────────────────────────

describe('tag settings prose llm', () => {
  test('returns ok result', async () => {
    const result = await handleSettings(['prose', 'llm']);
    expect(result.ok).toBe(true);
  });

  test('data.mode is llm', async () => {
    const result = await handleSettings(['prose', 'llm']);
    expect((result.data as { mode: string }).mode).toBe('llm');
  });

  test('persists worldFlags.proseMode as llm', async () => {
    await handleSettings(['prose', 'llm']);
    const state = await tryLoadState();
    expect(state!.worldFlags.proseMode).toBe('llm');
  });
});

// ── tag settings prose manual ──────────────────────────────────────

describe('tag settings prose manual', () => {
  test('returns ok result', async () => {
    const result = await handleSettings(['prose', 'manual']);
    expect(result.ok).toBe(true);
  });

  test('data.mode is manual', async () => {
    const result = await handleSettings(['prose', 'manual']);
    expect((result.data as { mode: string }).mode).toBe('manual');
  });

  test('persists worldFlags.proseMode as manual', async () => {
    await handleSettings(['prose', 'manual']);
    const state = await tryLoadState();
    expect(state!.worldFlags.proseMode).toBe('manual');
  });

  test('overwrites a previously set llm mode', async () => {
    await handleSettings(['prose', 'llm']);
    await handleSettings(['prose', 'manual']);
    const state = await tryLoadState();
    expect(state!.worldFlags.proseMode).toBe('manual');
  });
});

// ── tag settings prose (no arg) ────────────────────────────────────

describe('tag settings prose (no arg)', () => {
  test('returns ok result', async () => {
    const result = await handleSettings(['prose']);
    expect(result.ok).toBe(true);
  });

  test('data includes current mode', async () => {
    const result = await handleSettings(['prose']);
    const data = result.data as { mode: string; usage: string };
    expect(data.mode).toBeDefined();
    expect(typeof data.mode).toBe('string');
  });

  test('data includes usage hint', async () => {
    const result = await handleSettings(['prose']);
    const data = result.data as { usage: string };
    expect(data.usage).toContain('tag settings prose');
    expect(data.usage).toContain('llm');
    expect(data.usage).toContain('manual');
  });

  test('defaults to manual when proseMode is unset', async () => {
    const result = await handleSettings(['prose']);
    expect((result.data as { mode: string }).mode).toBe('manual');
  });

  test('reflects previously set llm mode', async () => {
    await handleSettings(['prose', 'llm']);
    const result = await handleSettings(['prose']);
    expect((result.data as { mode: string }).mode).toBe('llm');
  });

  test('does not mutate state (no disk write changes mode)', async () => {
    const before = await tryLoadState();
    const beforeMode = before!.worldFlags.proseMode;
    await handleSettings(['prose']);
    const after = await tryLoadState();
    expect(after!.worldFlags.proseMode).toBe(beforeMode);
  });
});

// ── tag settings prose <invalid> ───────────────────────────────────

describe('tag settings prose <invalid mode>', () => {
  test('returns fail result', async () => {
    const result = await handleSettings(['prose', 'turbo']);
    expect(result.ok).toBe(false);
  });

  test('error message mentions unknown mode', async () => {
    const result = await handleSettings(['prose', 'turbo']);
    expect(result.error!.message).toMatch(/unknown mode/i);
  });

  test('corrective mentions llm and manual', async () => {
    const result = await handleSettings(['prose', 'turbo']);
    expect(result.error!.corrective).toContain('llm');
    expect(result.error!.corrective).toContain('manual');
  });
});

// ── tag settings (no subcommand / unknown subcommand) ───────────────

describe('tag settings (no subcommand)', () => {
  test('returns fail result for empty args', async () => {
    const result = await handleSettings([]);
    expect(result.ok).toBe(false);
  });

  test('returns fail result for unknown subcommand', async () => {
    const result = await handleSettings(['volume']);
    expect(result.ok).toBe(false);
  });

  test('corrective includes prose subcommand', async () => {
    const result = await handleSettings([]);
    expect(result.error!.corrective).toContain('prose');
  });
});

// ── no state ───────────────────────────────────────────────────────

describe('tag settings no state', () => {
  test('returns fail when no state exists', async () => {
    const { unlinkSync } = await import('node:fs');
    const { join: pathJoin } = await import('node:path');
    unlinkSync(pathJoin(tempDir, 'state.json'));

    const result = await handleSettings(['prose', 'llm']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/no game state/i);
  });
});
