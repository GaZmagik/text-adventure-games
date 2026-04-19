import { describe, test, expect, beforeEach } from 'bun:test';
import { handleStyle } from './style';
import { createDefaultState, saveState, tryLoadState } from '../lib/state-store';
import type { GmState } from '../types';

let state: GmState;

beforeEach(async () => {
  state = createDefaultState();
  state.visualStyle = 'station';
  await saveState(state);
});

describe('tag style activate', () => {
  test('returns active style file content and style-reference content', async () => {
    const result = await handleStyle(['activate']);
    expect(result.ok).toBe(true);
    expect(result.data).toHaveProperty('style', 'station');
    expect(result.data).toHaveProperty('stylePath');
    expect(result.data).toHaveProperty('referencePath');
    expect(typeof (result.data as { stylePath: string }).stylePath).toBe('string');
    expect(typeof (result.data as { referencePath: string }).referencePath).toBe('string');
  });

  test('stamps _styleReadEpoch with current _compactionCount', async () => {
    state._compactionCount = 3;
    await saveState(state);

    const result = await handleStyle(['activate']);
    expect(result.ok).toBe(true);

    const updated = await tryLoadState();
    expect(updated!._styleReadEpoch).toBe(3);
  });

  test('stamps _styleReadEpoch as 0 when _compactionCount is undefined', async () => {
    const result = await handleStyle(['activate']);
    expect(result.ok).toBe(true);

    const updated = await tryLoadState();
    expect(updated!._styleReadEpoch).toBe(0);
  });

  test('fails when no state exists', async () => {
    const { unlinkSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { homedir } = await import('node:os');
    const stateDir = process.env.TAG_STATE_DIR || join(homedir(), '.tag');
    try { unlinkSync(join(stateDir, 'state.json')); } catch {}

    const result = await handleStyle(['activate']);
    expect(result.ok).toBe(false);
  });

  test('fails when visualStyle is not set', async () => {
    delete state.visualStyle;
    await saveState(state);

    const result = await handleStyle(['activate']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/visual style/i);
  });

  test('fails when style file does not exist', async () => {
    state.visualStyle = 'nonexistent-style-that-does-not-exist';
    await saveState(state);

    const result = await handleStyle(['activate']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/unknown style/i);
  });

  test('returns char counts for both files', async () => {
    const result = await handleStyle(['activate']);
    expect(result.ok).toBe(true);
    const data = result.data as { styleChars: number; referenceChars: number };
    expect(data.styleChars).toBeGreaterThan(0);
    expect(data.referenceChars).toBeGreaterThan(0);
  });
});

describe('tag style (no subcommand)', () => {
  test('fails with usage hint', async () => {
    const result = await handleStyle([]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/subcommand/i);
  });

  test('fails for unknown subcommand', async () => {
    const result = await handleStyle(['unknown']);
    expect(result.ok).toBe(false);
  });
});
