import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleProseCheck } from './prose-check';
import { handleState } from './state';
import { tryLoadState, saveState } from '../lib/state-store';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(async () => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-prose-check-test-'));
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

// ── Helpers ────────────────────────────────────────────────────────

const narrativeHtml = '<div id="narrative"><p>The corridor stretched ahead. Rust covered the walls. A distant hum echoed through the passages. Cold pressed into your bones from the metal floor.</p></div>';

function writeTempHtml(content: string): string {
  const path = join(tempDir, 'scene.html');
  writeFileSync(path, content, 'utf-8');
  return path;
}

// ── manual mode (default — proseMode unset) ────────────────────────

describe('tag prose-check manual mode (default)', () => {
  test('returns ok when proseMode is unset', async () => {
    const path = writeTempHtml(narrativeHtml);
    const result = await handleProseCheck([path]);
    expect(result.ok).toBe(true);
  });

  test('data.mode is manual', async () => {
    const path = writeTempHtml(narrativeHtml);
    const result = await handleProseCheck([path]);
    expect((result.data as { mode: string }).mode).toBe('manual');
  });

  test('data.checklist is an array of 6 items', async () => {
    const path = writeTempHtml(narrativeHtml);
    const result = await handleProseCheck([path]);
    const data = result.data as { checklist: unknown[] };
    expect(Array.isArray(data.checklist)).toBe(true);
    expect(data.checklist).toHaveLength(6);
  });

  test('each checklist item has id and question fields', async () => {
    const path = writeTempHtml(narrativeHtml);
    const result = await handleProseCheck([path]);
    const data = result.data as { checklist: Array<{ id: string; question: string }> };
    for (const item of data.checklist) {
      expect(typeof item.id).toBe('string');
      expect(item.id.length).toBeGreaterThan(0);
      expect(typeof item.question).toBe('string');
      expect(item.question.length).toBeGreaterThan(0);
    }
  });

  test('data.proseExtracted is true', async () => {
    const path = writeTempHtml(narrativeHtml);
    const result = await handleProseCheck([path]);
    expect((result.data as { proseExtracted: boolean }).proseExtracted).toBe(true);
  });

  test('data.wordCount is a positive number', async () => {
    const path = writeTempHtml(narrativeHtml);
    const result = await handleProseCheck([path]);
    expect((result.data as { wordCount: number }).wordCount).toBeGreaterThan(0);
  });
});

// ── manual mode (explicit) ─────────────────────────────────────────

describe('tag prose-check manual mode (explicit)', () => {
  test('returns ok when proseMode is explicitly manual', async () => {
    const state = await tryLoadState();
    state!.worldFlags.proseMode = 'manual';
    await saveState(state!);

    const path = writeTempHtml(narrativeHtml);
    const result = await handleProseCheck([path]);
    expect(result.ok).toBe(true);
    expect((result.data as { mode: string }).mode).toBe('manual');
  });

  test('checklist has 6 items in explicit manual mode', async () => {
    const state = await tryLoadState();
    state!.worldFlags.proseMode = 'manual';
    await saveState(state!);

    const path = writeTempHtml(narrativeHtml);
    const result = await handleProseCheck([path]);
    const data = result.data as { checklist: unknown[] };
    expect(data.checklist).toHaveLength(6);
  });
});

// ── llm mode ───────────────────────────────────────────────────────

describe('tag prose-check llm mode', () => {
  test('returns ok when proseMode is llm', async () => {
    const state = await tryLoadState();
    state!.worldFlags.proseMode = 'llm';
    await saveState(state!);

    const path = writeTempHtml(narrativeHtml);
    const result = await handleProseCheck([path]);
    expect(result.ok).toBe(true);
  });

  test('data.mode is llm', async () => {
    const state = await tryLoadState();
    state!.worldFlags.proseMode = 'llm';
    await saveState(state!);

    const path = writeTempHtml(narrativeHtml);
    const result = await handleProseCheck([path]);
    expect((result.data as { mode: string }).mode).toBe('llm');
  });

  test('data.command contains system prompt and schema flags', async () => {
    const state = await tryLoadState();
    state!.worldFlags.proseMode = 'llm';
    await saveState(state!);

    const path = writeTempHtml(narrativeHtml);
    const result = await handleProseCheck([path]);
    const command = (result.data as { command: string }).command;
    expect(command).toContain('claude -p');
    expect(command).toContain('voice_differentiation');
    expect(command).toContain('exposition_dump');
    expect(command).toContain('--json-schema');
    expect(command).toContain('--system-prompt');
  });

  test('data.inputFile is /tmp/prose-check-input.txt', async () => {
    const state = await tryLoadState();
    state!.worldFlags.proseMode = 'llm';
    await saveState(state!);

    const path = writeTempHtml(narrativeHtml);
    const result = await handleProseCheck([path]);
    expect((result.data as { inputFile: string }).inputFile).toBe('/tmp/prose-check-input.txt');
  });

  test('data.outputFile is /tmp/prose-check-result.json', async () => {
    const state = await tryLoadState();
    state!.worldFlags.proseMode = 'llm';
    await saveState(state!);

    const path = writeTempHtml(narrativeHtml);
    const result = await handleProseCheck([path]);
    expect((result.data as { outputFile: string }).outputFile).toBe('/tmp/prose-check-result.json');
  });

  test('data.nextStep contains prose-gate command and output file', async () => {
    const state = await tryLoadState();
    state!.worldFlags.proseMode = 'llm';
    await saveState(state!);

    const path = writeTempHtml(narrativeHtml);
    const result = await handleProseCheck([path]);
    const nextStep = (result.data as { nextStep: string }).nextStep;
    expect(typeof nextStep).toBe('string');
    expect(nextStep.length).toBeGreaterThan(0);
    expect(nextStep).toContain('prose-gate --llm');
    expect(nextStep).toContain('/tmp/prose-check-result.json');
  });

  test('writes narrative text to input file', async () => {
    const state = await tryLoadState();
    state!.worldFlags.proseMode = 'llm';
    await saveState(state!);

    const path = writeTempHtml(narrativeHtml);
    await handleProseCheck([path]);
    expect(existsSync('/tmp/prose-check-input.txt')).toBe(true);
    const content = await Bun.file('/tmp/prose-check-input.txt').text();
    expect(content).toContain('corridor stretched ahead');
  });
});

// ── no narrative HTML ──────────────────────────────────────────────

describe('tag prose-check no narrative', () => {
  test('returns ok with proseExtracted false when no narrative div', async () => {
    const path = writeTempHtml('<div class="scene"><p>Some content without narrative wrapper.</p></div>');
    const result = await handleProseCheck([path]);
    expect(result.ok).toBe(true);
    expect((result.data as { proseExtracted: boolean }).proseExtracted).toBe(false);
  });
});

// ── error cases ────────────────────────────────────────────────────

describe('tag prose-check error cases', () => {
  test('returns fail for missing file', async () => {
    const result = await handleProseCheck([join(tempDir, 'nonexistent.html')]);
    expect(result.ok).toBe(false);
  });

  test('returns fail for no args', async () => {
    const result = await handleProseCheck([]);
    expect(result.ok).toBe(false);
  });

  test('returns fail when no state exists', async () => {
    const { unlinkSync } = await import('node:fs');
    const { join: pathJoin } = await import('node:path');
    unlinkSync(pathJoin(tempDir, 'state.json'));

    const path = writeTempHtml(narrativeHtml);
    const result = await handleProseCheck([path]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/no game state/i);
  });
});

// ── clearance sentinel (A6) ──────────────────────────────────────

describe('tag prose-check clearance sentinels', () => {
  test('manual mode nextStep mentions prose-gate', async () => {
    const path = writeTempHtml(narrativeHtml);
    const result = await handleProseCheck([path]);
    expect((result.data as { nextStep: string }).nextStep).toContain('prose-gate');
  });
});
