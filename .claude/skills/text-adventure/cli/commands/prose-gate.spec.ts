import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleProseGate } from './prose-gate';
import { handleState } from './state';
import { tryLoadState } from '../lib/state-store';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(async () => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-prose-gate-test-'));
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

// ── Test fixtures ──────────────────────────────────────────────────

const PASS_RESULT = JSON.stringify({
  rules: {
    voice_differentiation: { result: 'PASS' },
    exposition_dump:        { result: 'PASS' },
    earned_length:          { result: 'PASS' },
    thesaurus_abuse:        { result: 'PASS' },
    sensory_quality:        { result: 'PASS' },
    redefinition_overuse:   { result: 'PASS' },
  },
  total_pass: 6,
  total_fail: 0,
  overall: 'PASS',
});

const FAIL_RESULT = JSON.stringify({
  rules: {
    voice_differentiation: { result: 'FAIL', count: 1, citations: ['"Move," Kira said. "Move," Orin said.'], suggestion: 'Give Orin a distinctive verbal tic.' },
    exposition_dump:        { result: 'PASS' },
    earned_length:          { result: 'PASS' },
    thesaurus_abuse:        { result: 'PASS' },
    sensory_quality:        { result: 'PASS' },
    redefinition_overuse:   { result: 'PASS' },
  },
  total_pass: 5,
  total_fail: 1,
  overall: 'FAIL',
});

function writeResultFile(content: string): string {
  const path = join(tempDir, 'prose-result.json');
  writeFileSync(path, content, 'utf-8');
  return path;
}

// ── --manual ──────────────────────────────────────────────────────

describe('tag prose-gate --manual', () => {
  test('returns ok result', async () => {
    const result = await handleProseGate(['--manual']);
    expect(result.ok).toBe(true);
  });

  test('data.clearance contains PROSE GATE: MANUAL CLEARANCE', async () => {
    const result = await handleProseGate(['--manual']);
    expect((result.data as { clearance: string }).clearance).toContain('PROSE GATE: MANUAL CLEARANCE');
  });

  test('data.verified is true', async () => {
    const result = await handleProseGate(['--manual']);
    expect((result.data as { verified: boolean }).verified).toBe(true);
  });

  test('data.mode is manual', async () => {
    const result = await handleProseGate(['--manual']);
    expect((result.data as { mode: string }).mode).toBe('manual');
  });

  test('records worldFlags.proseGatedAt', async () => {
    await handleProseGate(['--manual']);
    const state = await tryLoadState();
    expect(state!.worldFlags.proseGatedAt).toBeDefined();
  });

  test('worldFlags.proseGatedAt is a number (timestamp)', async () => {
    const before = Date.now();
    await handleProseGate(['--manual']);
    const state = await tryLoadState();
    const gatedAt = state!.worldFlags.proseGatedAt as number;
    expect(typeof gatedAt).toBe('number');
    expect(gatedAt).toBeGreaterThanOrEqual(before);
  });
});

// ── --llm PASS ────────────────────────────────────────────────────

describe('tag prose-gate --llm (PASS result)', () => {
  test('returns ok result', async () => {
    const path = writeResultFile(PASS_RESULT);
    const result = await handleProseGate(['--llm', path]);
    expect(result.ok).toBe(true);
  });

  test('data.clearance contains PROSE GATE: LLM CLEARANCE', async () => {
    const path = writeResultFile(PASS_RESULT);
    const result = await handleProseGate(['--llm', path]);
    expect((result.data as { clearance: string }).clearance).toContain('PROSE GATE: LLM CLEARANCE');
  });

  test('data.verified is true', async () => {
    const path = writeResultFile(PASS_RESULT);
    const result = await handleProseGate(['--llm', path]);
    expect((result.data as { verified: boolean }).verified).toBe(true);
  });

  test('data.mode is llm', async () => {
    const path = writeResultFile(PASS_RESULT);
    const result = await handleProseGate(['--llm', path]);
    expect((result.data as { mode: string }).mode).toBe('llm');
  });
});

// ── --llm FAIL ────────────────────────────────────────────────────

describe('tag prose-gate --llm (FAIL result)', () => {
  test('returns ok result (gate records failure, not an error)', async () => {
    const path = writeResultFile(FAIL_RESULT);
    const result = await handleProseGate(['--llm', path]);
    expect(result.ok).toBe(true);
  });

  test('data.verified is false', async () => {
    const path = writeResultFile(FAIL_RESULT);
    const result = await handleProseGate(['--llm', path]);
    expect((result.data as { verified: boolean }).verified).toBe(false);
  });

  test('data.failures array has 1 item', async () => {
    const path = writeResultFile(FAIL_RESULT);
    const result = await handleProseGate(['--llm', path]);
    const data = result.data as { failures: string[] };
    expect(Array.isArray(data.failures)).toBe(true);
    expect(data.failures).toHaveLength(1);
  });

  test('failure entry mentions voice_differentiation', async () => {
    const path = writeResultFile(FAIL_RESULT);
    const result = await handleProseGate(['--llm', path]);
    const data = result.data as { failures: string[] };
    expect(data.failures[0]).toContain('voice_differentiation');
  });
});

// ── --llm with overall FAIL override ─────────────────────────────

describe('tag prose-gate --llm (overall FAIL even if rules look fine)', () => {
  test('data.verified is false when overall is FAIL regardless of rule results', async () => {
    // overall says FAIL but all individual rules say PASS — overall wins
    const overallFailOverride = JSON.stringify({
      rules: {
        voice_differentiation: { result: 'PASS' },
        exposition_dump:        { result: 'PASS' },
        earned_length:          { result: 'PASS' },
        thesaurus_abuse:        { result: 'PASS' },
        sensory_quality:        { result: 'PASS' },
        redefinition_overuse:   { result: 'PASS' },
      },
      total_pass: 5,
      total_fail: 1,
      overall: 'FAIL',
    });
    const path = writeResultFile(overallFailOverride);
    const result = await handleProseGate(['--llm', path]);
    expect(result.ok).toBe(true);
    expect((result.data as { verified: boolean }).verified).toBe(false);
  });
});

// ── --llm error cases ─────────────────────────────────────────────

describe('tag prose-gate --llm error cases', () => {
  test('returns fail when result file is missing', async () => {
    const result = await handleProseGate(['--llm', join(tempDir, 'nonexistent.json')]);
    expect(result.ok).toBe(false);
  });

  test('returns fail when result file contains malformed JSON', async () => {
    const path = writeResultFile('{ not valid json ]]]');
    const result = await handleProseGate(['--llm', path]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/malformed json/i);
  });
});

// ── no args / unknown flag ─────────────────────────────────────────

describe('tag prose-gate no args', () => {
  test('returns fail for empty args', async () => {
    const result = await handleProseGate([]);
    expect(result.ok).toBe(false);
  });

  test('returns fail for unknown flag', async () => {
    const result = await handleProseGate(['--auto']);
    expect(result.ok).toBe(false);
  });

  test('corrective mentions --manual and --llm', async () => {
    const result = await handleProseGate([]);
    expect(result.error!.corrective).toContain('--manual');
    expect(result.error!.corrective).toContain('--llm');
  });
});

// ── no state ──────────────────────────────────────────────────────

describe('tag prose-gate no state', () => {
  test('--manual returns fail when no state exists', async () => {
    const { unlinkSync } = await import('node:fs');
    const { join: pathJoin } = await import('node:path');
    unlinkSync(pathJoin(tempDir, 'state.json'));

    const result = await handleProseGate(['--manual']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/no game state/i);
  });

  test('--llm returns fail when no state exists', async () => {
    const { unlinkSync } = await import('node:fs');
    const { join: pathJoin } = await import('node:path');

    const path = writeResultFile(PASS_RESULT);
    unlinkSync(pathJoin(tempDir, 'state.json'));

    const result = await handleProseGate(['--llm', path]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/no game state/i);
  });
});
