import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleCompact } from './compact';
import { saveState, tryLoadState, createDefaultState } from '../lib/state-store';
import { STATE_STORE_RUNTIME } from '../lib/state-store';
import { writeCompactionBlock, isCompactionBlocked } from '../lib/workflow-markers';

let tempDir: string;
let transcriptsDir: string | null = null;
const originalEnv = process.env.TAG_STATE_DIR;
const originalTranscriptsEnv = process.env.TAG_TRANSCRIPTS_DIR;
const originalHomedir = STATE_STORE_RUNTIME.homedir;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-compact-test-'));
  process.env.TAG_STATE_DIR = tempDir;
  STATE_STORE_RUNTIME.homedir = () => tmpdir();
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (transcriptsDir) {
    rmSync(transcriptsDir, { recursive: true, force: true });
    transcriptsDir = null;
  }
  if (originalEnv !== undefined) process.env.TAG_STATE_DIR = originalEnv;
  else delete process.env.TAG_STATE_DIR;
  if (originalTranscriptsEnv !== undefined) process.env.TAG_TRANSCRIPTS_DIR = originalTranscriptsEnv;
  else delete process.env.TAG_TRANSCRIPTS_DIR;
  STATE_STORE_RUNTIME.homedir = originalHomedir;
});

describe('tag compact', () => {
  test('unknown subcommand returns error', async () => {
    const result = await handleCompact(['bogus']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('Unknown');
  });

  test('no subcommand returns error with guidance', async () => {
    const result = await handleCompact([]);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('Unknown compact subcommand');
    expect(result.error?.message).toContain('(none)');
    expect(result.error?.corrective).toContain('tag compact restore');
  });
});

describe('tag compact restore', () => {
  test('clears compaction block marker', async () => {
    const state = createDefaultState();
    await saveState(state);
    writeCompactionBlock('test compaction');
    expect(isCompactionBlocked()).toBe(true);

    const result = await handleCompact(['restore']);
    expect(result.ok).toBe(true);
    expect(isCompactionBlocked()).toBe(false);
  });

  test('succeeds even when no state exists and returns empty payload', async () => {
    writeCompactionBlock('test');
    const result = await handleCompact(['restore']);
    expect(result.ok).toBe(true);
    expect(isCompactionBlocked()).toBe(false);
    const data = result.data as Record<string, unknown>;
    expect(data.restored).toBe(true);
    expect(data.loreSource).toBeNull();
    expect(data.modulesActive).toEqual([]);
    expect(Array.isArray(data.nextSteps)).toBe(true);
    expect((data.nextSteps as string[]).some(s => s.includes('state reset'))).toBe(true);
  });

  test('succeeds even when no block marker exists and resets freshness', async () => {
    const state = createDefaultState();
    state._proseCraftEpoch = 5;
    state._styleReadEpoch = 3;
    state._modulesRead = ['gm-checklist'];
    await saveState(state);
    const result = await handleCompact(['restore']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.restored).toBe(true);

    const restored = await tryLoadState();
    expect(restored!._modulesRead).toEqual([]);
    expect(restored!._proseCraftEpoch).toBeUndefined();
    expect(restored!._styleReadEpoch).toBeUndefined();
  });

  test('returns loreSource path when present in state', async () => {
    const state = createDefaultState();
    state._loreSource = '/tmp/test-adventure.lore.md';
    await saveState(state);
    writeCompactionBlock('test');

    const result = await handleCompact(['restore']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.loreSource).toBe('/tmp/test-adventure.lore.md');
  });

  test('returns null loreSource when not present in state', async () => {
    const state = createDefaultState();
    await saveState(state);
    writeCompactionBlock('test');

    const result = await handleCompact(['restore']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.loreSource).toBeNull();
  });

  test('returns modulesActive from state', async () => {
    const state = createDefaultState();
    state.modulesActive = ['gm-checklist', 'prose-craft', 'core-systems'];
    await saveState(state);
    writeCompactionBlock('test');

    const result = await handleCompact(['restore']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.modulesActive).toEqual(['gm-checklist', 'prose-craft', 'core-systems']);
  });

  test('resets _modulesRead to empty array', async () => {
    const state = createDefaultState();
    state._modulesRead = ['gm-checklist', 'prose-craft'];
    await saveState(state);
    writeCompactionBlock('test');

    const result = await handleCompact(['restore']);
    expect(result.ok).toBe(true);

    const restored = await tryLoadState();
    expect(restored!._modulesRead).toEqual([]);
  });

  test('resets freshness epochs to force re-reads', async () => {
    const state = createDefaultState();
    state._proseCraftEpoch = 2;
    state._styleReadEpoch = 2;
    await saveState(state);
    writeCompactionBlock('test');

    const result = await handleCompact(['restore']);
    expect(result.ok).toBe(true);

    const restored = await tryLoadState();
    expect(restored!._proseCraftEpoch).toBeUndefined();
    expect(restored!._styleReadEpoch).toBeUndefined();
  });

  test('provides recovery instructions including lore-specific step in nextSteps', async () => {
    const state = createDefaultState();
    state._loreSource = '/tmp/adventure.lore.md';
    state.modulesActive = ['gm-checklist', 'prose-craft'];
    await saveState(state);
    writeCompactionBlock('test');

    const result = await handleCompact(['restore']);
    const data = result.data as Record<string, unknown>;
    const steps = data.nextSteps as string[];
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps.some(s => s.includes('module activate-tier'))).toBe(true);
    expect(steps.some(s => s.includes('style activate'))).toBe(true);
    expect(steps.some(s => s.includes('state sync'))).toBe(true);
    expect(steps.some(s => s.includes('/tmp/adventure.lore.md'))).toBe(true);
  });

  test('updates _compactionCount to match filesystem transcript count', async () => {
    transcriptsDir = mkdtempSync(join(tmpdir(), 'tag-transcripts-'));
    process.env.TAG_TRANSCRIPTS_DIR = transcriptsDir;

    // journal.txt is excluded from count; 3 transcript files = count of 3
    writeFileSync(join(transcriptsDir, 'journal.txt'), 'log');
    writeFileSync(join(transcriptsDir, 'transcript-1.txt'), 'data');
    writeFileSync(join(transcriptsDir, 'transcript-2.txt'), 'data');
    writeFileSync(join(transcriptsDir, 'transcript-3.txt'), 'data');

    const state = createDefaultState();
    state._compactionCount = 0;
    await saveState(state);
    writeCompactionBlock('test compaction');

    const result = await handleCompact(['restore']);
    expect(result.ok).toBe(true);

    const restored = await tryLoadState();
    expect(restored!._compactionCount).toBe(3);
  });

  test('preserves _compactionCount when transcripts dir does not exist', async () => {
    process.env.TAG_TRANSCRIPTS_DIR = join(tmpdir(), `nonexistent-${Date.now()}`);

    const state = createDefaultState();
    state._compactionCount = 5;
    await saveState(state);
    writeCompactionBlock('test');

    const result = await handleCompact(['restore']);
    expect(result.ok).toBe(true);

    const restored = await tryLoadState();
    expect(restored!._compactionCount).toBe(5);
  });

  test('returns recoveryBatch command string for one-step recovery', async () => {
    const state = createDefaultState();
    state.modulesActive = ['gm-checklist', 'prose-craft'];
    state._loreSource = '/tmp/test.lore.md';
    await saveState(state);
    writeCompactionBlock('test');

    const result = await handleCompact(['restore']);
    const data = result.data as Record<string, unknown>;
    expect(typeof data.recoveryBatch).toBe('string');
    const batch = data.recoveryBatch as string;
    expect(batch).toContain('module activate-tier 1');
    expect(batch).toContain('module activate-tier 2');
    expect(batch).toContain('style activate');
  });

  test('recoveryBatch includes lore reload when _loreSource is set', async () => {
    const state = createDefaultState();
    state._loreSource = '/tmp/adventure.lore.md';
    await saveState(state);
    writeCompactionBlock('test');

    const result = await handleCompact(['restore']);
    const data = result.data as Record<string, unknown>;
    const batch = data.recoveryBatch as string;
    expect(batch).toContain("export load '/tmp/adventure.lore.md'");
  });

  test('recoveryBatch omits lore reload when no _loreSource', async () => {
    const state = createDefaultState();
    await saveState(state);
    writeCompactionBlock('test');

    const result = await handleCompact(['restore']);
    const data = result.data as Record<string, unknown>;
    const batch = data.recoveryBatch as string;
    expect(batch).not.toContain('export load');
  });
});
