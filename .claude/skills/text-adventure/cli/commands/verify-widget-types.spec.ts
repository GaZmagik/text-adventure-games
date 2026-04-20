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
  tempDir = mkdtempSync(join(tmpdir(), 'tag-verify-wt-'));
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
}

describe('verify: dice widget type', () => {
  test('dice widget passes verify when type specified', async () => {
    await setupState();
    const renderResult = await handleRender(['dice', '--style', 'station', '--raw', '--data', '{"dieType":"d20"}']);
    expect(renderResult.ok).toBe(true);
    const html = renderResult.data as string;
    const path = join(tempDir, 'dice.html');
    writeFileSync(path, html, 'utf-8');

    const result = await handleVerify(['dice', path]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.verified).toBe(true);
    expect(data.widgetType).toBe('dice');
  });

  test('dice widget fails scene verify without type hint', async () => {
    await setupState();
    const renderResult = await handleRender(['dice', '--style', 'station', '--raw', '--data', '{"dieType":"d20"}']);
    expect(renderResult.ok).toBe(true);
    const html = renderResult.data as string;
    const path = join(tempDir, 'dice.html');
    writeFileSync(path, html, 'utf-8');

    // Without type hint, verify treats as scene — should fail
    const result = await handleVerify([path]);
    const data = result.data as Record<string, unknown>;
    expect(data.verified).toBe(false);
  });

  test('dice verify does not flag WebGL or canvas as hand-coded', async () => {
    await setupState();
    const renderResult = await handleRender(['dice', '--style', 'station', '--raw', '--data', '{"dieType":"d20"}']);
    const html = renderResult.data as string;
    const path = join(tempDir, 'dice.html');
    writeFileSync(path, html, 'utf-8');

    const result = await handleVerify(['dice', path]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.filter(f => f.includes('hand-coded')).length).toBe(0);
  });

  test('dice verify does not flag internal CSS aliases', async () => {
    await setupState();
    const renderResult = await handleRender(['dice', '--style', 'station', '--raw', '--data', '{"dieType":"d20"}']);
    const html = renderResult.data as string;
    const path = join(tempDir, 'dice.html');
    writeFileSync(path, html, 'utf-8');

    const result = await handleVerify(['dice', path]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.filter(f => f.includes('CSS variable')).length).toBe(0);
  });
});

describe('verify: dialogue widget type', () => {
  test('dialogue widget passes verify when type specified', async () => {
    await setupState();
    const renderResult = await handleRender(['dialogue', '--style', 'station', '--raw']);
    expect(renderResult.ok).toBe(true);
    const html = renderResult.data as string;
    const path = join(tempDir, 'dialogue.html');
    writeFileSync(path, html, 'utf-8');

    const result = await handleVerify(['dialogue', path]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.verified).toBe(true);
    expect(data.widgetType).toBe('dialogue');
  });

  test('dialogue widget fails when the ta-dialogue element is missing', async () => {
    await setupState();
    const path = join(tempDir, 'dialogue-handcoded.html');
    writeFileSync(path, '<div class="widget-dialogue"><div class="dialogue-area">Hi</div></div>', 'utf-8');

    const result = await handleVerify(['dialogue', path]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.verified).toBe(false);
    const failures = data.failures as string[];
    expect(failures.some(f => f.includes('render-origin marker') || f.includes('ta-dialogue'))).toBe(true);
  });

  test('dialogue widget fails when bootstrap markers are forged without a valid render-origin marker', async () => {
    await setupState();
    const path = join(tempDir, 'dialogue-forged.html');
    writeFileSync(
      path,
      [
        '<div id="shadow-host"></div>',
        '<script>',
        "const host = document.getElementById('shadow-host');",
        "const root = host.attachShadow({ mode: 'open' });",
        "root.innerHTML = `<div class=\"widget-dialogue\"><div class=\"dialogue-area\">Fake</div></div>`;",
        '</script>',
      ].join('\n'),
      'utf-8',
    );

    const result = await handleVerify(['dialogue', path]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.verified).toBe(false);
    const failures = data.failures as string[];
    expect(failures.some(f => f.includes('exact render-origin marker'))).toBe(true);
  });
});

describe('verify: levelup widget type', () => {
  test('levelup widget passes verify when type specified', async () => {
    await setupState();
    const renderResult = await handleRender(['levelup', '--style', 'station', '--raw']);
    expect(renderResult.ok).toBe(true);
    const html = renderResult.data as string;
    const path = join(tempDir, 'levelup.html');
    writeFileSync(path, html, 'utf-8');

    const result = await handleVerify(['levelup', path]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.verified).toBe(true);
  });
});

describe('verify: combat-turn widget type', () => {
  test('combat-turn widget passes verify when type specified', async () => {
    await setupState();
    const renderResult = await handleRender(['combat-turn', '--style', 'station', '--raw']);
    expect(renderResult.ok).toBe(true);
    const html = renderResult.data as string;
    const path = join(tempDir, 'combat.html');
    writeFileSync(path, html, 'utf-8');

    const result = await handleVerify(['combat-turn', path]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.verified).toBe(true);
  });
});

describe('verify: arc-complete widget type', () => {
  test('arc-complete widget passes verify when type specified', async () => {
    await setupState();
    const renderResult = await handleRender(['arc-complete', '--style', 'station', '--raw']);
    expect(renderResult.ok).toBe(true);
    const html = renderResult.data as string;
    const path = join(tempDir, 'arc.html');
    writeFileSync(path, html, 'utf-8');

    const result = await handleVerify(['arc-complete', path]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.verified).toBe(true);
  });
});

describe('verify: pre-game types still work', () => {
  test('scenario type still works as before', async () => {
    await setupState();
    const renderResult = await handleRender(['scenario-select', '--style', 'station', '--raw',
      '--data', '{"scenarios":[{"title":"A","description":"Test A"},{"title":"B","description":"Test B"}]}']);
    expect(renderResult.ok).toBe(true);
    const html = renderResult.data as string;
    const path = join(tempDir, 'scenario.html');
    writeFileSync(path, html, 'utf-8');

    const result = await handleVerify(['scenario', path]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.widgetType).toBe('scenario');
  });
});

describe('verify: broken serialisation still caught for non-scene widgets', () => {
  test('dice widget with [object Object] still fails', async () => {
    await setupState();
    const html = '<div class="widget-dice">[object Object] broken content</div>';
    const path = join(tempDir, 'bad-dice.html');
    writeFileSync(path, html, 'utf-8');

    const result = await handleVerify(['dice', path]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('[object Object]'))).toBe(true);
  });

  test('dice widget fails when the roll surface/result structure is missing', async () => {
    await setupState();
    const path = join(tempDir, 'bad-dice-empty.html');
    writeFileSync(path, '<div class="widget-dice"></div>', 'utf-8');

    const result = await handleVerify(['dice', path]);
    const data = result.data as Record<string, unknown>;
    expect(data.verified).toBe(false);
    const failures = data.failures as string[];
    expect(failures.some(f => f.includes('id="ra"'))).toBe(true);
  });

  test('save-div widget fails when payload container is missing', async () => {
    await setupState();
    const path = join(tempDir, 'bad-save-div.html');
    writeFileSync(path, '<div></div>', 'utf-8');

    const result = await handleVerify(['save-div', path]);
    const data = result.data as Record<string, unknown>;
    expect(data.verified).toBe(false);
    const failures = data.failures as string[];
    expect(failures.some(f => f.includes('save-data'))).toBe(true);
  });
});
