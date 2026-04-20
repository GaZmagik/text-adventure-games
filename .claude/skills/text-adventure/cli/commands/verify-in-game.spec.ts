import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleVerify } from './verify';
import { handleState } from './state';
import { handleRender } from './render';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-verify-ingame-'));
  process.env.TAG_STATE_DIR = tempDir;
  const { signMarker, clearStateDirCache } = require('./verify');
  clearStateDirCache();
  writeFileSync(join(tempDir, '.last-sync'), signMarker(999), 'utf-8');
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) process.env.TAG_STATE_DIR = originalEnv;
  else delete process.env.TAG_STATE_DIR;
});

async function setupState(): Promise<void> {
  await handleState(['reset']);
  const { signMarker } = require('./verify');
  writeFileSync(join(tempDir, '.last-sync'), signMarker(999), 'utf-8');
  await handleState(['set', 'visualStyle', 'station']);
  await handleState(['set', 'scene', '3']);
  await handleState(['set', 'currentRoom', 'bridge']);
  await handleState(['set', 'character', JSON.stringify({
    name: 'Test', class: 'Scout', hp: 10, maxHp: 10, ac: 12,
    level: 2, xp: 120, currency: 0, currencyName: 'credits',
    stats: { STR: 10, DEX: 12, CON: 10, INT: 11, WIS: 13, CHA: 9 },
    modifiers: { STR: 0, DEX: 1, CON: 0, INT: 0, WIS: 1, CHA: -1 },
    proficiencyBonus: 2, proficiencies: [], abilities: [],
    inventory: [], conditions: [],
    equipment: { weapon: 'Knife', armour: 'Vest' },
  })]);
}

async function renderToFile(args: string[], fileName: string): Promise<string> {
  const result = await handleRender(args);
  expect(result.ok).toBe(true);
  const data = result.data as Record<string, unknown> | string;
  const html = typeof data === 'string' ? data : (data.html as string);
  const path = join(tempDir, fileName);
  writeFileSync(path, html, 'utf-8');
  return path;
}

describe('tag verify in-game widgets', () => {
  test('passes for a valid dialogue widget with copyable prompt fallbacks', async () => {
    await setupState();
    const path = await renderToFile([
      'dialogue',
      '--style', 'station',
      '--data', JSON.stringify({
        text: 'Fen keeps one hand on the console while waiting for your answer.',
        choices: [
          { label: 'Ask about the signal', prompt: 'I ask Fen about the signal.' },
          { label: 'Tell Fen to hold position', prompt: 'I tell Fen to hold position.' },
        ],
      }),
    ], 'dialogue.html');
    const result = await handleVerify(['dialogue', path]);
    expect(result.ok).toBe(true);
    const data = result.data as { verified: boolean; failures: string[] };
    expect(data.verified).toBe(true);
    expect(data.failures).toEqual([]);
  });

  test('passes for a valid dice widget with continue button', async () => {
    await setupState();
    await handleState(['set', '_lastComputation', JSON.stringify({
      type: 'hazard_save', stat: 'CON', roll: 15, modifier: 2,
      total: 17, dc: 14, outcome: 'success', margin: 3,
    })]);
    const path = await renderToFile(['dice', '--style', 'station'], 'dice.html');
    const result = await handleVerify(['dice', path]);
    expect(result.ok).toBe(true);
    const data = result.data as { verified: boolean; failures: string[] };
    expect(data.verified).toBe(true);
    expect(data.failures).toEqual([]);
  });

  test('fails dice verify when the ta-dice payload attribute is missing', async () => {
    await setupState();
    await handleState(['set', '_lastComputation', JSON.stringify({
      type: 'hazard_save', stat: 'CON', roll: 15, modifier: 2,
      total: 17, dc: 14, outcome: 'success', margin: 3,
    })]);
    const goodPath = await renderToFile(['dice', '--style', 'station'], 'bad-dice.html');
    const broken = readFileSync(goodPath, 'utf-8').replace(/\sdata-config="[^"]*"/, '');
    writeFileSync(goodPath, broken, 'utf-8');
    const path = goodPath;
    const result = await handleVerify(['dice', path]);
    expect(result.ok).toBe(true);
    const data = result.data as { verified: boolean; failures: string[] };
    expect(data.verified).toBe(false);
    expect(data.failures.some(f => f.includes('data-config'))).toBe(true);
  });

  test('fails arc-complete verify when the ta-arc-complete payload attribute is missing', async () => {
    await setupState();
    const goodPath = await renderToFile(['arc-complete', '--style', 'station'], 'bad-arc-complete.html');
    const broken = readFileSync(goodPath, 'utf-8').replace(/\sdata-arc="[^"]*"/, '');
    writeFileSync(goodPath, broken, 'utf-8');
    const path = goodPath;
    const result = await handleVerify(['arc-complete', path]);
    expect(result.ok).toBe(true);
    const data = result.data as { verified: boolean; failures: string[] };
    expect(data.verified).toBe(false);
    expect(data.failures.some(f => f.includes('data-arc'))).toBe(true);
  });
});
