import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleVerify } from './verify';
import { handleRender } from './render';
import { handleState } from './state/index';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-verify-prose-'));
  process.env.TAG_STATE_DIR = tempDir;
  const { signMarker, clearStateDirCache } = require('./verify');
  clearStateDirCache();
  writeFileSync(join(tempDir, '.last-sync'), signMarker(999, '{}'), 'utf-8');
  writeFileSync(join(tempDir, '.verified-scenario'), signMarker(0), 'utf-8');
  writeFileSync(join(tempDir, '.verified-rules'), signMarker(0), 'utf-8');
  writeFileSync(join(tempDir, '.verified-character'), signMarker(0), 'utf-8');
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) process.env.TAG_STATE_DIR = originalEnv;
  else delete process.env.TAG_STATE_DIR;
});

async function setupState(): Promise<void> {
  await handleState(['reset']);
  const { signMarker } = require('./verify');
  writeFileSync(join(tempDir, '.last-sync'), signMarker(999, '{}'), 'utf-8');
  writeFileSync(join(tempDir, '.verified-scenario'), signMarker(0), 'utf-8');
  writeFileSync(join(tempDir, '.verified-rules'), signMarker(0), 'utf-8');
  writeFileSync(join(tempDir, '.verified-character'), signMarker(0), 'utf-8');
  await handleState(['set', 'scene', '1']);
  await handleState(['set', 'currentRoom', 'bridge']);
  await handleState(['set', 'visualStyle', 'station']);
  await handleState(['set', 'modulesActive', JSON.stringify([
    'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
    'character-creation', 'save-codex',
  ])]);
  await handleState(['set', '_modulesRead', JSON.stringify([
    'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
    'character-creation', 'save-codex',
  ])]);
  await handleState(['set', 'character', JSON.stringify({
    name: 'Test', class: 'Scout', hp: 10, maxHp: 10, ac: 12,
    level: 1, xp: 0, currency: 0, currencyName: 'credits',
    stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
    proficiencyBonus: 2, proficiencies: [], abilities: [],
    inventory: [], conditions: [],
    equipment: { weapon: 'Knife', armour: 'Vest' },
  })]);
  await handleState(['set', '_proseCraftEpoch', '0']);
  await handleState(['set', '_styleReadEpoch', '0']);
}

/** Render a structurally valid scene, then inject custom narrative text. */
async function buildSceneWithNarrative(narrative: string): Promise<string> {
  const renderResult = await handleRender(['scene', '--style', 'station', '--raw']);
  expect(renderResult.ok).toBe(true);
  return (renderResult.data as string).replace(
    '<p><!-- Narrative content rendered by the GM --></p>',
    `<p class="narrative">${narrative}</p>`,
  );
}

describe('tag verify prose checks (integration)', () => {
  test('scene with clean prose passes verify', async () => {
    await setupState();
    const html = await buildSceneWithNarrative(
      'The corridor stretches ahead, dimly lit by emergency strips. '
      + 'A faint vibration pulses through the deck plates beneath your boots.',
    );
    const path = join(tempDir, 'scene.html');
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify([path]);
    expect(result.ok).toBe(true);
    const data = result.data as { verified: boolean; failures: string[] };
    const proseFailures = data.failures.filter(f => f.startsWith('Prose:'));
    expect(proseFailures).toHaveLength(0);
  });

  test('scene with filter words fails with prose error', async () => {
    await setupState();
    const html = await buildSceneWithNarrative(
      'She noticed the crack spreading across the viewport. '
      + 'You felt the vibration intensify beneath the deck plates.',
    );
    const path = join(tempDir, 'scene.html');
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify([path]);
    expect(result.ok).toBe(true);
    const data = result.data as { verified: boolean; failures: string[] };
    const proseFailures = data.failures.filter(f => f.startsWith('Prose:'));
    expect(proseFailures.length).toBeGreaterThan(0);
    expect(proseFailures.some(f => f.includes('filter-words'))).toBe(true);
  });

  test('scene with said-bookism fails with prose error', async () => {
    await setupState();
    const html = await buildSceneWithNarrative(
      '"Watch out!" she exclaimed as the conduit burst overhead.',
    );
    const path = join(tempDir, 'scene.html');
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify([path]);
    expect(result.ok).toBe(true);
    const data = result.data as { verified: boolean; failures: string[] };
    const proseFailures = data.failures.filter(f => f.startsWith('Prose:'));
    expect(proseFailures.some(f => f.includes('said-bookisms'))).toBe(true);
  });

  test('scene with stat names in prose fails with prose error', async () => {
    await setupState();
    const html = await buildSceneWithNarrative(
      'With your DEX modifier, you dodge the falling beam.',
    );
    const path = join(tempDir, 'scene.html');
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify([path]);
    expect(result.ok).toBe(true);
    const data = result.data as { verified: boolean; failures: string[] };
    const proseFailures = data.failures.filter(f => f.startsWith('Prose:'));
    expect(proseFailures.some(f => f.includes('stat-names-in-prose'))).toBe(true);
  });

  test('non-scene widget is unaffected by prose checks', async () => {
    await setupState();
    await handleState(['set', '_lastComputation', JSON.stringify({
      type: 'hazard_save', stat: 'CON', roll: 15, modifier: 2,
      total: 17, dc: 14, outcome: 'success', margin: 3,
    })]);
    const renderResult = await handleRender(['dice', '--style', 'station']);
    expect(renderResult.ok).toBe(true);
    const html = typeof renderResult.data === 'string'
      ? renderResult.data
      : (renderResult.data as Record<string, unknown>).html as string;
    const path = join(tempDir, 'dice.html');
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify(['dice', path]);
    expect(result.ok).toBe(true);
    const data = result.data as { verified: boolean; failures: string[] };
    const proseFailures = data.failures.filter(f => f.startsWith('Prose:'));
    expect(proseFailures).toHaveLength(0);
  });
});
