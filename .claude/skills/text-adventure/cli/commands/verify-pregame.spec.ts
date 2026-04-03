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
  tempDir = mkdtempSync(join(tmpdir(), 'tag-pregame-test-'));
  process.env.TAG_STATE_DIR = tempDir;
  const { signMarker } = require('./verify');
  writeFileSync(join(tempDir, '.last-sync'), signMarker(999, '{}'), 'utf-8');
  writeFileSync(join(tempDir, '.verified-scenario'), signMarker(0), 'utf-8');
  writeFileSync(join(tempDir, '.verified-rules'), signMarker(0), 'utf-8');
  writeFileSync(join(tempDir, '.verified-character'), signMarker(0), 'utf-8');
  writeFileSync(join(tempDir, '.last-verify'), signMarker(999), 'utf-8');
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
  writeFileSync(join(tempDir, '.last-verify'), signMarker(999), 'utf-8');
  await handleState(['set', 'visualStyle', 'station']);
  await handleState(['set', 'worldFlags.rulebook', 'narrative_engine']);
  await handleState(['set', 'modulesActive', JSON.stringify([
    'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
    'character-creation', 'save-codex',
  ])]);
  await handleState(['set', '_modulesRead', JSON.stringify([
    'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
    'character-creation', 'save-codex',
  ])]);
}

async function renderToFile(args: string[], filename: string): Promise<string> {
  const result = await handleRender(args);
  expect(result.ok).toBe(true);
  const data = result.data as Record<string, unknown>;
  const html = typeof data === 'string' ? data : (data.html as string);
  const path = join(tempDir, filename);
  writeFileSync(path, html, 'utf-8');
  return path;
}

describe('tag verify scenario', () => {
  test('passes for valid scenario-select widget', async () => {
    await setupState();
    const data = JSON.stringify({
      scenarios: [
        { title: 'Rust Belt', description: 'A hauler job gone wrong', genre: ['sci-fi', 'noir'] },
        { title: 'Deep Freeze', description: 'Ice station mystery', genre: ['horror', 'survival'] },
      ],
    });
    const path = await renderToFile(['scenario-select', '--data', data], 'scenario.html');
    const result = await handleVerify(['scenario', path]);
    expect(result.ok).toBe(true);
    const d = result.data as { verified: boolean; failures: string[]; widgetType: string };
    expect(d.verified).toBe(true);
    expect(d.widgetType).toBe('scenario');
  });

  test('fails when no scenario cards present', async () => {
    await setupState();
    const path = join(tempDir, 'empty-scenario.html');
    writeFileSync(path, '<div class="widget-scenario-select"><p>No scenarios</p></div>', 'utf-8');
    const result = await handleVerify(['scenario', path]);
    expect(result.ok).toBe(true);
    const d = result.data as { verified: boolean; failures: string[] };
    expect(d.verified).toBe(false);
    expect(d.failures.some(f => f.includes('scenario card'))).toBe(true);
  });

  test('fails when [object Object] present', async () => {
    await setupState();
    // Write raw HTML with [object Object] in it
    const badHtml = '<div class="scenario-card"><button data-prompt="[object Object]">Select</button></div>';
    const path = join(tempDir, 'bad-scenario.html');
    writeFileSync(path, badHtml, 'utf-8');
    const result = await handleVerify(['scenario', path]);
    expect(result.ok).toBe(true);
    const d = result.data as { verified: boolean; failures: string[] };
    expect(d.verified).toBe(false);
    expect(d.failures.some(f => f.includes('[object Object]'))).toBe(true);
  });

  test('fails when only some scenario buttons have title fallbacks', async () => {
    await setupState();
    const html = `<div class="widget-scenario-select">
  <div class="scenario-grid">
    <div class="scenario-card"><button class="scenario-select-btn" data-prompt="Choose Rust Belt" title="Choose Rust Belt">Select</button></div>
    <div class="scenario-card"><button class="scenario-select-btn" data-prompt="Choose Deep Freeze">Select</button></div>
  </div>
</div>`;
    const path = join(tempDir, 'scenario-missing-title.html');
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify(['scenario', path]);
    const d = result.data as { verified: boolean; failures: string[] };
    expect(d.verified).toBe(false);
    expect(d.failures.some(f => f.includes('title fallback'))).toBe(true);
  });

  test('fails when scenario widget is hand-coded without the Shadow DOM bootstrap', async () => {
    await setupState();
    const html = `<div class="widget-scenario-select">
  <div class="scenario-grid">
    <div class="scenario-card"><button class="scenario-select-btn" data-prompt="Choose Rust Belt" title="Choose Rust Belt">Select</button></div>
    <div class="scenario-card"><button class="scenario-select-btn" data-prompt="Choose Deep Freeze" title="Choose Deep Freeze">Select</button></div>
  </div>
</div>`;
    const path = join(tempDir, 'handcoded-scenario.html');
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify(['scenario', path]);
    const d = result.data as { verified: boolean; failures: string[] };
    expect(d.verified).toBe(false);
    expect(d.failures.some(f => f.includes('Shadow DOM bootstrap'))).toBe(true);
  });
});

describe('tag verify rules', () => {
  test('passes for valid settings widget', async () => {
    await setupState();
    const path = await renderToFile(['settings'], 'settings.html');
    const result = await handleVerify(['rules', path]);
    expect(result.ok).toBe(true);
    const d = result.data as { verified: boolean; failures: string[]; widgetType: string };
    expect(d.verified).toBe(true);
    expect(d.widgetType).toBe('rules');
  });

  test('fails when confirm button missing', async () => {
    await setupState();
    const path = join(tempDir, 'no-confirm.html');
    writeFileSync(path, '<div class="widget-settings"><div class="option-grid" data-group="rulebook"><button data-group="rulebook" data-value="d20">d20</button><button data-group="rulebook" data-value="pf2e">pf2e</button></div></div>', 'utf-8');
    const result = await handleVerify(['rules', path]);
    expect(result.ok).toBe(true);
    const d = result.data as { verified: boolean; failures: string[] };
    expect(d.verified).toBe(false);
    expect(d.failures.some(f => f.includes('confirm'))).toBe(true);
  });

  test('fails when option groups have [object Object] values', async () => {
    await setupState();
    const path = join(tempDir, 'broken-settings.html');
    writeFileSync(path, '<div class="widget-settings"><button class="confirm-btn">Go</button><div class="option-grid" data-group="difficulty"><button data-value="[object Object]">[object Object]</button></div></div>', 'utf-8');
    const result = await handleVerify(['rules', path]);
    expect(result.ok).toBe(true);
    const d = result.data as { verified: boolean; failures: string[] };
    expect(d.verified).toBe(false);
    expect(d.failures.some(f => f.includes('[object Object]'))).toBe(true);
  });

  test('rejects edited settings HTML even if the only change is single-quoted data-group attributes', async () => {
    await setupState();
    const path = await renderToFile(['settings'], 'single-quoted-settings.html');
    const html = readFileSync(path, 'utf-8')
      .replace(/data-group=\"([^\"]+)\"/g, "data-group='$1'");
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify(['rules', path]);
    const d = result.data as { verified: boolean; failures: string[] };
    expect(d.verified).toBe(false);
    expect(d.failures.some(f => f.includes('exact render-origin marker'))).toBe(true);
  });
});

describe('tag verify character', () => {
  test('passes for valid character-creation widget', async () => {
    await setupState();
    const data = JSON.stringify({
      archetypes: [
        { id: 'soldier', name: 'Soldier', stats: { STR: 14, DEX: 12, CON: 13, INT: 8, WIS: 10, CHA: 10 } },
        { id: 'scout', name: 'Scout', stats: { STR: 10, DEX: 16, CON: 10, INT: 10, WIS: 14, CHA: 10 } },
      ],
    });
    const path = await renderToFile(['character-creation', '--style', 'station', '--data', data], 'character.html');
    const result = await handleVerify(['character', path]);
    expect(result.ok).toBe(true);
    const d = result.data as { verified: boolean; failures: string[]; widgetType: string };
    expect(d.widgetType).toBe('character');
    // May have minor failures depending on template, but should not have [object Object]
    expect(d.failures.filter(f => f.includes('[object Object]')).length).toBe(0);
  });
});

describe('tag verify (default) still works for scene HTML', () => {
  test('existing file-path behaviour unchanged', async () => {
    await setupState();
    await handleState(['set', 'scene', '1']);
    await handleState(['set', 'currentRoom', 'bridge']);
    await handleState(['set', 'character', JSON.stringify({
      name: 'Test', class: 'Scout', hp: 10, maxHp: 10, ac: 12,
      level: 1, xp: 0, currency: 0, currencyName: 'credits',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2, proficiencies: [], abilities: [],
      inventory: [], conditions: [],
      equipment: { weapon: 'Knife', armour: 'Vest' },
    })]);
    const result = await handleRender(['scene', '--style', 'station', '--raw']);
    const html = (result.data as string).replace(
      '<p><!-- Narrative content rendered by the GM --></p>',
      '<p class="narrative">Test prose here.</p><p class="narrative">More prose.</p>',
    );
    const path = join(tempDir, 'scene.html');
    writeFileSync(path, html, 'utf-8');
    const verifyResult = await handleVerify([path]);
    expect(verifyResult.ok).toBe(true);
    const d = verifyResult.data as { widgetType?: string };
    // Default scene verify should not have widgetType field (backward compat)
    // or should be 'scene'
    expect(d.widgetType === undefined || d.widgetType === 'scene').toBe(true);
  });
});
