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
  tempDir = mkdtempSync(join(tmpdir(), 'tag-verify-struct-'));
  process.env.TAG_STATE_DIR = tempDir;
  const { signMarker } = require('./verify');
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

/** Render a valid scene and inject narrative so the narrative check passes. */
async function buildSceneHtml(): Promise<string> {
  const renderResult = await handleRender(['scene', '--style', 'station', '--raw']);
  expect(renderResult.ok).toBe(true);
  const html = (renderResult.data as string)
    .replace(
      '<p><!-- Narrative content rendered by the GM --></p>',
      '<p class="narrative">The corridor stretches ahead, dimly lit by emergency strips.</p>'
      + '<p class="narrative">A faint vibration pulses through the deck plates beneath your boots.</p>',
    );
  return html;
}

// ── checkTagRenderOrigin: progressive reveal ────────────────────────

describe('verify: checkTagRenderOrigin — progressive reveal', () => {
  test('fails when reveal-brief is removed from valid scene HTML', async () => {
    await setupState();
    const html = (await buildSceneHtml())
      .replace('id="reveal-brief"', 'id="reveal-something-else"');
    const path = join(tempDir, 'scene.html');
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify([path]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(
      f => f.includes('progressive reveal') || f.includes('NOT produced by tag render'),
    )).toBe(true);
  });
});

// ── checkTagRenderOrigin: CDN script ────────────────────────────────

describe('verify: checkTagRenderOrigin — CDN script', () => {
  test('fails when tag-scene.js reference is removed from valid scene HTML', async () => {
    await setupState();
    const html = (await buildSceneHtml())
      .replace(/tag-scene\.js/g, 'removed-script.js');
    const path = join(tempDir, 'scene.html');
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify([path]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(
      f => f.includes('tag-scene.js') || f.includes('hand-coded'),
    )).toBe(true);
  });
});

// ── checkPanelNesting ───────────────────────────────────────────────

describe('verify: checkPanelNesting', () => {
  test('fails when panel-overlay is nested inside scene-content', async () => {
    await setupState();
    let html = await buildSceneHtml();

    // Extract the panel-overlay div block from its correct sibling position
    // and re-inject it inside scene-content so open divs > close divs between
    // the two id attributes.
    const overlayStart = html.indexOf('<div id="panel-overlay"');
    expect(overlayStart).toBeGreaterThan(-1);

    // Find the end of the panel-overlay block — it closes with </div> at root level.
    // We need to extract the full block. Find its matching close tag by counting nesting.
    let depth = 0;
    let overlayEnd = overlayStart;
    for (let i = overlayStart; i < html.length; i++) {
      if (html.startsWith('<div', i)) depth++;
      if (html.startsWith('</div>', i)) {
        depth--;
        if (depth === 0) {
          overlayEnd = i + '</div>'.length;
          break;
        }
      }
    }
    const overlayBlock = html.substring(overlayStart, overlayEnd);

    // Remove the overlay from its original position
    html = html.substring(0, overlayStart) + html.substring(overlayEnd);

    // Insert the overlay block inside scene-content (just before its closing </div>)
    const sceneContentPos = html.indexOf('id="scene-content"');
    expect(sceneContentPos).toBeGreaterThan(-1);

    // Find first </div> after scene-content — insert overlay just before it
    // so that the overlay sits inside scene-content
    const insertionPoint = html.indexOf('</div>', sceneContentPos);
    expect(insertionPoint).toBeGreaterThan(-1);
    html = html.substring(0, insertionPoint) + overlayBlock + html.substring(insertionPoint);

    const path = join(tempDir, 'scene.html');
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify([path]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('nested inside'))).toBe(true);
  });
});

// ── checkStatusBar ──────────────────────────────────────────────────

describe('verify: checkStatusBar', () => {
  test('fails when hp-pips and status-bar are removed from valid scene HTML', async () => {
    await setupState();
    const html = (await buildSceneHtml())
      .replace(/hp-pips/g, 'xx-xxxx')
      .replace(/status-bar/g, 'xxxxxx-xxx');
    const path = join(tempDir, 'scene.html');
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify([path]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('status bar'))).toBe(true);
  });
});
