import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, existsSync, unlinkSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleProseGate } from './prose-gate';
import { handleState } from './state';
import { tryLoadState } from '../lib/state-store';
import { fnv32 } from '../lib/fnv32';
import { PROSE_GATE_FILE } from '../lib/constants';

const SCENE_HTML =
  '<div id="narrative"><p>The corridor stretched ahead. Rust covered the walls. A distant hum echoed.</p></div>';
let scenePath: string;

function writeGateFile(
  path: string,
  html: string,
  mode: string,
  errors: string[],
  warnings: string[],
  acknowledged = false,
): void {
  const gate = {
    scenePath: path,
    sceneHash: fnv32(html),
    mode,
    timestamp: Date.now(),
    deterministicErrors: errors,
    deterministicWarnings: warnings,
    warningsAcknowledged: acknowledged,
  };
  writeFileSync(PROSE_GATE_FILE, JSON.stringify(gate), 'utf-8');
}

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(async () => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-prose-gate-test-'));
  process.env.TAG_STATE_DIR = tempDir;
  await handleState(['reset']);
  // Create a scene file and a clean gate file for each test
  scenePath = join(tempDir, 'scene.html');
  writeFileSync(scenePath, SCENE_HTML, 'utf-8');
  writeGateFile(scenePath, SCENE_HTML, 'manual', [], []);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (existsSync(PROSE_GATE_FILE)) unlinkSync(PROSE_GATE_FILE);
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
    exposition_dump: { result: 'PASS' },
    earned_length: { result: 'PASS' },
    thesaurus_abuse: { result: 'PASS' },
    sensory_quality: { result: 'PASS' },
    redefinition_overuse: { result: 'PASS' },
  },
  total_pass: 6,
  total_fail: 0,
  overall: 'PASS',
});

const FAIL_RESULT = JSON.stringify({
  rules: {
    voice_differentiation: {
      result: 'FAIL',
      count: 1,
      citations: ['"Move," Kira said. "Move," Orin said.'],
      suggestion: 'Give Orin a distinctive verbal tic.',
    },
    exposition_dump: { result: 'PASS' },
    earned_length: { result: 'PASS' },
    thesaurus_abuse: { result: 'PASS' },
    sensory_quality: { result: 'PASS' },
    redefinition_overuse: { result: 'PASS' },
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

  test('data.clearance contains Proceed to show_widget', async () => {
    const result = await handleProseGate(['--manual']);
    expect((result.data as { clearance: string }).clearance).toContain('Proceed to show_widget');
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

  test('stamps worldFlags.proseGatedAt on LLM PASS', async () => {
    const path = writeResultFile(PASS_RESULT);
    await handleProseGate(['--llm', path]);
    const stateAfter = await tryLoadState();
    expect(typeof stateAfter?.worldFlags.proseGatedAt).toBe('number');
  });

  test('worldFlags.proseGatedAt is a recent timestamp', async () => {
    const before = Date.now();
    const path = writeResultFile(PASS_RESULT);
    await handleProseGate(['--llm', path]);
    const after = Date.now();
    const stateAfter = await tryLoadState();
    const gatedAt = stateAfter?.worldFlags.proseGatedAt as number;
    expect(gatedAt).toBeGreaterThanOrEqual(before);
    expect(gatedAt).toBeLessThanOrEqual(after);
  });

  test('data.clearance contains Proceed to show_widget', async () => {
    const path = writeResultFile(PASS_RESULT);
    const result = await handleProseGate(['--llm', path]);
    expect((result.data as { clearance: string }).clearance).toContain('Proceed to show_widget');
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
        exposition_dump: { result: 'PASS' },
        earned_length: { result: 'PASS' },
        thesaurus_abuse: { result: 'PASS' },
        sensory_quality: { result: 'PASS' },
        redefinition_overuse: { result: 'PASS' },
      },
      total_pass: 5,
      total_fail: 1,
      overall: 'FAIL',
    });
    const path = writeResultFile(overallFailOverride);
    const result = await handleProseGate(['--llm', path]);
    expect(result.ok).toBe(true);
    expect((result.data as { verified: boolean }).verified).toBe(false);
    const data = result.data as { failures: string[] };
    expect(Array.isArray(data.failures)).toBe(true);
    expect(data.failures.length).toBeGreaterThan(0);
    expect(data.failures[0]).toContain('[overall] FAIL');
  });
});

// ── --llm error cases ─────────────────────────────────────────────

describe('tag prose-gate --llm error cases', () => {
  test('returns fail when --llm given but no path', async () => {
    const result = await handleProseGate(['--llm']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/missing result file path/i);
  });

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

// ── --llm FAIL does not stamp proseGatedAt (S5) ──────────────────

describe('tag prose-gate --llm (FAIL does not stamp)', () => {
  test('does not stamp worldFlags.proseGatedAt on FAIL', async () => {
    const path = writeResultFile(FAIL_RESULT);
    await handleProseGate(['--llm', path]);
    const stateAfter = await tryLoadState();
    expect(stateAfter?.worldFlags.proseGatedAt).toBeUndefined();
  });
});

// ── --llm shape validation (B7) ──────────────────────────────────

describe('--llm shape validation', () => {
  test('rejects JSON missing rules field', async () => {
    const path = writeResultFile(JSON.stringify({ overall: 'PASS', total_pass: 6, total_fail: 0 }));
    const result = await handleProseGate(['--llm', path]);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toMatch(/missing required fields/i);
  });

  test('rejects JSON with null rules', async () => {
    const path = writeResultFile(JSON.stringify({ overall: 'PASS', rules: null }));
    const result = await handleProseGate(['--llm', path]);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toMatch(/missing required fields/i);
  });

  test('rejects JSON with array rules', async () => {
    const path = writeResultFile(JSON.stringify({ overall: 'PASS', rules: [] }));
    const result = await handleProseGate(['--llm', path]);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toMatch(/missing required fields/i);
  });

  test('rejects JSON with empty rules object', async () => {
    const path = writeResultFile(JSON.stringify({ overall: 'PASS', rules: {} }));
    const result = await handleProseGate(['--llm', path]);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toMatch(/missing required fields/i);
  });

  test('rejects JSON where a rule entry has result: null', async () => {
    const path = writeResultFile(
      JSON.stringify({
        overall: 'PASS',
        rules: { voice_differentiation: { result: null } },
        total_pass: 0,
        total_fail: 0,
      }),
    );
    const result = await handleProseGate(['--llm', path]);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toMatch(/malformed rule/i);
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
    const { unlinkSync: ul } = await import('node:fs');
    const { join: pathJoin } = await import('node:path');
    ul(pathJoin(tempDir, 'state.json'));

    const result = await handleProseGate(['--manual']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/no game state/i);
  });

  test('--llm returns fail when no state exists', async () => {
    const { unlinkSync: ul } = await import('node:fs');
    const { join: pathJoin } = await import('node:path');

    const path = writeResultFile(PASS_RESULT);
    ul(pathJoin(tempDir, 'state.json'));

    const result = await handleProseGate(['--llm', path]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/no game state/i);
  });
});

// ── gate file enforcement (--manual) ──────────────────────────────

describe('tag prose-gate gate file enforcement (--manual)', () => {
  test('fails when gate file is missing', async () => {
    unlinkSync(PROSE_GATE_FILE);
    const result = await handleProseGate(['--manual']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/prose-check/i);
  });

  test('fails when gate file has malformed JSON', async () => {
    writeFileSync(PROSE_GATE_FILE, '{ not valid json }', 'utf-8');
    const result = await handleProseGate(['--manual']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/gate file/i);
  });

  test('fails when scene has changed since prose-check (hash mismatch)', async () => {
    writeFileSync(scenePath, SCENE_HTML + '<!-- modified -->', 'utf-8');
    const result = await handleProseGate(['--manual']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/scene has changed/i);
  });

  test('fails when gate has deterministic errors', async () => {
    writeGateFile(
      scenePath,
      SCENE_HTML,
      'manual',
      ['Prose: [filter-words] "noticed" at line 1. Fix: replace with active verb.'],
      [],
    );
    const result = await handleProseGate(['--manual']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/filter-words/i);
  });

  test('fails on first call when gate has unacknowledged warnings', async () => {
    writeGateFile(
      scenePath,
      SCENE_HTML,
      'manual',
      [],
      ['Prose warning: [word-repetition-window] "corridor" repeated 3 times.'],
    );
    const result = await handleProseGate(['--manual']);
    expect(result.ok).toBe(false);
  });

  test('warning message mentions the warning', async () => {
    writeGateFile(
      scenePath,
      SCENE_HTML,
      'manual',
      [],
      ['Prose warning: [word-repetition-window] "corridor" repeated 3 times.'],
    );
    const result = await handleProseGate(['--manual']);
    expect(result.error!.message).toContain('word-repetition-window');
  });

  test('gate file updated with warningsAcknowledged=true after first warning block', async () => {
    writeGateFile(
      scenePath,
      SCENE_HTML,
      'manual',
      [],
      ['Prose warning: [word-repetition-window] "corridor" repeated 3 times.'],
    );
    await handleProseGate(['--manual']);
    const gate = JSON.parse(readFileSync(PROSE_GATE_FILE, 'utf-8'));
    expect(gate.warningsAcknowledged).toBe(true);
  });

  test('passes on second call when warnings already acknowledged', async () => {
    writeGateFile(
      scenePath,
      SCENE_HTML,
      'manual',
      [],
      ['Prose warning: [word-repetition-window] "corridor" repeated 3 times.'],
      true,
    );
    const result = await handleProseGate(['--manual']);
    expect(result.ok).toBe(true);
    expect((result.data as { verified: boolean }).verified).toBe(true);
  });

  test('gate file deleted after successful clearance', async () => {
    const result = await handleProseGate(['--manual']);
    expect(result.ok).toBe(true);
    expect(existsSync(PROSE_GATE_FILE)).toBe(false);
  });

  test('returns fail when scene file has been deleted since prose-check', async () => {
    const fakePath = join(tempDir, 'deleted-scene.html');
    // Gate points to fakePath but the file is never written — it does not exist
    const gateData = {
      scenePath: fakePath,
      sceneHash: '00000000',
      mode: 'manual',
      timestamp: Date.now(),
      deterministicErrors: [],
      deterministicWarnings: [],
      warningsAcknowledged: false,
    };
    writeFileSync(PROSE_GATE_FILE, JSON.stringify(gateData), { encoding: 'utf-8' });

    const result = await handleProseGate(['--manual']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toMatch(/scene file not found/i);
  });
});

// ── path security ─────────────────────────────────────────────────

describe('tag prose-gate path security', () => {
  test('returns fail when gate file references a scene path outside allowed directories', async () => {
    const gateData = {
      scenePath: '/etc/passwd',
      sceneHash: '00000000',
      mode: 'manual',
      timestamp: Date.now(),
      deterministicErrors: [],
      deterministicWarnings: [],
      warningsAcknowledged: false,
    };
    writeFileSync(PROSE_GATE_FILE, JSON.stringify(gateData), { encoding: 'utf-8' });

    const result = await handleProseGate(['--manual']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toMatch(/outside allowed/i);
  });
});

// ── gate file enforcement (--llm) ─────────────────────────────────

describe('tag prose-gate gate file enforcement (--llm)', () => {
  test('fails when gate file is missing', async () => {
    unlinkSync(PROSE_GATE_FILE);
    const path = writeResultFile(PASS_RESULT);
    const result = await handleProseGate(['--llm', path]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/prose-check/i);
  });

  test('fails when scene has changed (hash mismatch)', async () => {
    writeFileSync(scenePath, SCENE_HTML + '<!-- modified -->', 'utf-8');
    const path = writeResultFile(PASS_RESULT);
    const result = await handleProseGate(['--llm', path]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/scene has changed/i);
  });

  test('fails when gate has deterministic errors', async () => {
    writeGateFile(scenePath, SCENE_HTML, 'llm', ['Prose: [filter-words] "noticed" at line 1.'], []);
    const path = writeResultFile(PASS_RESULT);
    const result = await handleProseGate(['--llm', path]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/filter-words/i);
  });

  test('passes on second call with acknowledged warnings', async () => {
    writeGateFile(
      scenePath,
      SCENE_HTML,
      'llm',
      [],
      ['Prose warning: [word-repetition-window] "corridor" repeated.'],
      true,
    );
    const path = writeResultFile(PASS_RESULT);
    const result = await handleProseGate(['--llm', path]);
    expect(result.ok).toBe(true);
    expect((result.data as { verified: boolean }).verified).toBe(true);
  });

  test('gate file deleted after successful LLM clearance', async () => {
    const path = writeResultFile(PASS_RESULT);
    await handleProseGate(['--llm', path]);
    expect(existsSync(PROSE_GATE_FILE)).toBe(false);
  });

  test('gate file NOT deleted after LLM FAIL (verified: false)', async () => {
    const path = writeResultFile(FAIL_RESULT);
    await handleProseGate(['--llm', path]);
    expect(existsSync(PROSE_GATE_FILE)).toBe(true);
  });
});
