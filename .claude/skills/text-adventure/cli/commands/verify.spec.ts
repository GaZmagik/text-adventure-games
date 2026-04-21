import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleVerify, getVerifyMarkerPath, signMarker, readSignedMarker, clearStateDirCache } from './verify';
import { handleState } from './state';
import { handleRender } from './render';
import { loadState } from '../lib/state-store';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  clearStateDirCache();
  tempDir = mkdtempSync(join(tmpdir(), 'tag-verify-test-'));
  process.env.TAG_STATE_DIR = tempDir;
  const { signMarker } = require('./verify');
  writeFileSync(join(tempDir, '.last-sync'), signMarker(999), 'utf-8');
  writeFileSync(join(tempDir, '.verified-scenario'), signMarker(0), 'utf-8');
  writeFileSync(join(tempDir, '.verified-rules'), signMarker(0), 'utf-8');
  writeFileSync(join(tempDir, '.verified-character'), signMarker(0), 'utf-8');
});

afterEach(() => {
  clearStateDirCache();
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) process.env.TAG_STATE_DIR = originalEnv;
  else delete process.env.TAG_STATE_DIR;
});

async function setupState(): Promise<void> {
  await handleState(['reset']);
  writeFileSync(join(tempDir, '.last-sync'), signMarker(999), 'utf-8');
  writeFileSync(join(tempDir, '.verified-scenario'), signMarker(0), 'utf-8');
  writeFileSync(join(tempDir, '.verified-rules'), signMarker(0), 'utf-8');
  writeFileSync(join(tempDir, '.verified-character'), signMarker(0), 'utf-8');
  await handleState(['set', 'scene', '1']);
  await handleState(['set', 'currentRoom', 'bridge']);
  await handleState(['set', 'visualStyle', 'station']);
  await handleState(['set', 'worldFlags.rulebook', 'narrative_engine']);
  await handleState(['set', 'modulesActive', JSON.stringify([
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
  await handleState(['set', '_modulesRead', JSON.stringify([
    'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
    'character-creation', 'save-codex',
  ])]);
  await handleState(['set', '_proseCraftEpoch', '0']);
  await handleState(['set', '_styleReadEpoch', '0']);
}

function injectSceneActions(html: string, actions: string): string {
  return html.replace(
    `<!-- [ACTIONS: Insert POI buttons and action cards here.
           Each button MUST use <strong class="btn-title"> for the title:

           POI:    <button class="poi-btn" data-poi="id" data-prompt="..." title="..."><strong class="btn-title">Title</strong>Description text.</button>
           Action: <button class="action-btn" data-prompt="..." title="..."><strong class="btn-title">Title</strong>Description text.</button>

           tag verify will reject buttons without <strong> title structure.] -->`,
    actions,
  );
}

async function renderComposedScene(args: string[] = ['scene', '--style', 'station', '--raw']): Promise<string> {
  const renderResult = await handleRender(args);
  expect(renderResult.ok).toBe(true);
  let html = (renderResult.data as string).replace(
    '<p><!-- Narrative content rendered by the GM --></p>',
    '<p class="narrative">The bridge hums with recycled air while warning lights crawl along the bulkheads.</p>'
    + '<p class="narrative">Something deliberate stirs beyond the viewport and every crew member waits for your call.</p>',
  );
  html = injectSceneActions(
    html,
    '<button class="action-card" data-prompt="Examine the sonar." title="Examine the sonar."><strong class="btn-title">Examine sonar</strong></button>'
    + '<button class="action-card" data-prompt="Speak to the captain." title="Speak to the captain."><strong class="btn-title">Speak to captain</strong></button>',
  );
  return html;
}

describe('tag verify', () => {
  test('passes for valid tag render scene output with composed narrative', async () => {
    await setupState();
    const renderResult = await handleRender(['scene', '--style', 'station', '--raw']);
    expect(renderResult.ok).toBe(true);
    // Inject narrative and action cards (simulates GM composition step)
    let html = (renderResult.data as string)
      .replace(
        '<p><!-- Narrative content rendered by the GM --></p>',
        '<p class="narrative">The bridge hums with the sound of recycled air and quiet tension.</p>'
        + '<p class="narrative">Something moves beyond the viewport, dark against the deeper dark.</p>',
      );
    html = injectSceneActions(
      html,
      '<button class="action-card" data-prompt="Examine the sonar." title="Examine the sonar."><strong class="btn-title">Examine sonar</strong></button>'
      + '<button class="action-card" data-prompt="Speak to the captain." title="Speak to the captain."><strong class="btn-title">Speak to captain</strong></button>',
    );
    const filePath = join(tempDir, 'scene.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect((data.failures as string[]).length).toBe(0);
  });

  test('fails when footer buttons are missing', async () => {
    await setupState();
    const html = '<div class="root"><div id="narrative"><p>Story</p></div></div>';
    const filePath = join(tempDir, 'bad.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    expect(result.ok).toBe(true);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('Missing footer (<ta-footer>)'))).toBe(true);
  });

  test('fails when scene-meta is missing', async () => {
    await setupState();
    const html = '<div class="root"><ta-footer></ta-footer></div>';
    const filePath = join(tempDir, 'nometa.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    expect(result.ok).toBe(true);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('scene-meta'))).toBe(true);
  });

  test('fails when narrative is empty', async () => {
    await setupState();
    const html = '<style>' + 'x'.repeat(10000) + '</style><div id="scene-meta" data-meta="{}"></div><ta-footer></ta-footer><div id="narrative"><!-- empty --></div>';
    const filePath = join(tempDir, 'empty-narrative.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    expect(result.ok).toBe(true);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('narrative'))).toBe(true);
  });

  test('fails when CSS is below minimum threshold', async () => {
    await setupState();
    const html = '<style>.tiny{}</style><div id="scene-meta" data-meta="{}"></div><ta-footer></ta-footer><div id="narrative"><p>Story</p></div>';
    const filePath = join(tempDir, 'thin-css.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    expect(result.ok).toBe(true);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('CSS'))).toBe(true);
  });

  test('writes verify marker on pass', async () => {
    await setupState();
    const renderResult = await handleRender(['scene', '--style', 'station', '--raw']);
    let html = (renderResult.data as string)
      .replace(
        '<p><!-- Narrative content rendered by the GM --></p>',
        '<p class="narrative">The corridor stretches ahead, lit by emergency strips.</p><p class="narrative">A sound echoes from below.</p>',
      );
    html = injectSceneActions(
      html,
      '<button class="action-card" data-prompt="Go left." title="Go left through the corridor."><strong class="btn-title">Go left</strong></button>'
      + '<button class="action-card" data-prompt="Go right." title="Go right toward the reactor stairs."><strong class="btn-title">Go right</strong></button>',
    );
    const filePath = join(tempDir, 'scene.html');
    writeFileSync(filePath, html, 'utf-8');

    await handleVerify([filePath]);
    const markerPath = getVerifyMarkerPath();
    expect(existsSync(markerPath)).toBe(true);
    const marker = readFileSync(markerPath, 'utf-8').trim();
    expect(marker.startsWith('1:')).toBe(true);
    expect(marker.split(':').length).toBeGreaterThanOrEqual(3);
  });

  test('does not write marker on failure', async () => {
    await setupState();
    const html = '<div>broken</div>';
    const filePath = join(tempDir, 'bad.html');
    writeFileSync(filePath, html, 'utf-8');

    await handleVerify([filePath]);
    expect(existsSync(getVerifyMarkerPath())).toBe(false);
  });

  test('returns error when no file path provided', async () => {
    await setupState();
    const result = await handleVerify([]);
    expect(result.ok).toBe(false);
  });

  test('fails when inline onclick handlers are present', async () => {
    await setupState();
    const renderResult = await handleRender(['scene', '--style', 'station', '--raw']);
    let html = (renderResult.data as string)
      .replace(
        '<p><!-- Narrative content rendered by the GM --></p>',
        '<p class="narrative">A long narrative paragraph that establishes the scene properly.</p>',
      );
    // Inject an inline onclick — the exact anti-pattern
    html = injectSceneActions(
      html,
      '<button onclick="sendPrompt(\'Do thing\')">Do thing</button>'
      + '<button class="action-card" data-prompt="Other thing"><strong class="btn-title">Other</strong></button>'
      + '<button class="action-card" data-prompt="Another thing"><strong class="btn-title">Another</strong></button>',
    );
    const filePath = join(tempDir, 'onclick.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('onclick'))).toBe(true);
  });

  test('fails when inline onclick handlers use single-quoted attributes', async () => {
    await setupState();
    const renderResult = await handleRender(['scene', '--style', 'station', '--raw']);
    let html = (renderResult.data as string)
      .replace(
        '<p><!-- Narrative content rendered by the GM --></p>',
        '<p class="narrative">A long narrative paragraph that establishes the scene properly.</p>',
      );
    html = injectSceneActions(
      html,
      "<button onclick='sendPrompt(\"Do thing\")'>Do thing</button>"
      + '<button class="action-card" data-prompt="Other thing" title="Other thing"><strong class="btn-title">Other</strong></button>'
      + '<button class="action-card" data-prompt="Another thing" title="Another thing"><strong class="btn-title">Another</strong></button>',
    );
    const filePath = join(tempDir, 'onclick-single-quoted.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('onclick'))).toBe(true);
  });

  test('fails when data-prompt button has no copyable fallback', async () => {
    await setupState();
    const html = '<style>' + 'x'.repeat(10000) + '</style>'
      + '<div id="scene-meta" data-meta="{}"></div>'
      + '<div id="panel-overlay"></div>'
      + '<ta-footer></ta-footer>'
      + '<div class="status-bar"><span class="hp-display">HP 10/10</span></div>'
      + '<div id="narrative"><p class="narrative">The bridge hums with tension and the air smells of recycled nothing.</p></div>'
      + '<button class="action-card" data-prompt="Do the thing"><strong class="btn-title">Do thing</strong></button>'
      + '<button class="action-card" data-prompt="Other thing"><strong class="btn-title">Other</strong></button>';
    const filePath = join(tempDir, 'no-fallback.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('fallback') || f.includes('title'))).toBe(true);
  });

  test('fails when only some data-prompt buttons have title fallbacks', async () => {
    await setupState();
    const renderResult = await handleRender(['scene', '--style', 'station', '--raw']);
    let html = (renderResult.data as string)
      .replace(
        '<p><!-- Narrative content rendered by the GM --></p>',
        '<p class="narrative">The bridge hums with tension and the air smells of recycled nothing.</p>',
      );
    html = injectSceneActions(
      html,
      '<button class="action-card" data-prompt="Do the thing" title="Do the thing"><strong class="btn-title">Do thing</strong></button>'
      + '<button class="action-card" data-prompt="Other thing"><strong class="btn-title">Other</strong></button>',
    );
    const filePath = join(tempDir, 'partial-fallback.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('fallback') || f.includes('title'))).toBe(true);
  });

  test('passes when action cards use single-quoted prompt and title attributes', async () => {
    await setupState();
    const renderResult = await handleRender(['scene', '--style', 'station', '--raw']);
    let html = (renderResult.data as string)
      .replace(
        '<p><!-- Narrative content rendered by the GM --></p>',
        '<p class="narrative">The bridge hums with the sound of recycled air and quiet tension.</p>'
        + '<p class="narrative">Something moves beyond the viewport, dark against the deeper dark.</p>',
      );
    html = injectSceneActions(
      html,
      "<button class='action-card' data-prompt='Examine the sonar.' title='Examine the sonar.'><strong class='btn-title'>Examine sonar</strong></button>"
      + "<button class='action-card' data-prompt='Speak to the captain.' title='Speak to the captain.'><strong class='btn-title'>Speak to captain</strong></button>",
    );
    const filePath = join(tempDir, 'single-quoted-prompts.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(result.ok).toBe(true);
    expect(failures).not.toContainEqual(expect.stringContaining('fallback'));
    expect(failures).not.toContainEqual(expect.stringContaining('minimum is'));
  });

  test('fails when visual style is not set in state', async () => {
    await handleState(['reset']);
    await handleState(['set', 'scene', '1']);
    // Do NOT set visualStyle
    const html = '<style>' + 'x'.repeat(10000) + '</style>'
      + '<div id="scene-meta" data-meta="{}"></div>'
      + '<div id="panel-overlay"></div>'
      + '<ta-footer></ta-footer>'
      + '<div id="narrative"><p class="narrative">A sufficiently long narrative paragraph for the check.</p></div>'
      + '<button class="action-card" data-prompt="Act 1"><strong class="btn-title">Act</strong></button>'
      + '<button class="action-card" data-prompt="Act 2"><strong class="btn-title">Act 2</strong></button>';
    const filePath = join(tempDir, 'no-style.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('visualStyle'))).toBe(true);
  });

  test('fails when hand-coded canvas dice detected', async () => {
    await setupState();
    const html = '<style>' + 'x'.repeat(10000) + '</style>'
      + '<div id="scene-meta" data-meta="{}"></div>'
      + '<div id="panel-overlay"></div>'
      + '<ta-footer></ta-footer>'
      + '<div class="status-bar"><span class="hp-display">HP 10/10</span></div>'
      + '<div id="narrative"><p class="narrative">The guard swings and you need to dodge urgently now.</p></div>'
      + '<canvas id="dice-canvas" width="200" height="200"></canvas>'
      + '<button class="action-card" data-prompt="Dodge"><strong class="btn-title">Dodge</strong></button>'
      + '<button class="action-card" data-prompt="Block"><strong class="btn-title">Block</strong></button>';
    const filePath = join(tempDir, 'hand-dice.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('dice') || f.includes('canvas'))).toBe(true);
  });

  test('increments _turnCount on successful verify', async () => {
    await setupState();
    const renderResult = await handleRender(['scene', '--style', 'station', '--raw']);
    let html = (renderResult.data as string)
      .replace(
        '<p><!-- Narrative content rendered by the GM --></p>',
        '<p class="narrative">The bridge hums with tension and the sound of something distant.</p><p class="narrative">Lights flicker overhead.</p>',
      );
    html = injectSceneActions(
      html,
      '<button class="action-card" data-prompt="Investigate." title="Investigate the source of the noise."><strong class="btn-title">Investigate</strong></button>'
      + '<button class="action-card" data-prompt="Retreat." title="Retreat to safer cover."><strong class="btn-title">Retreat</strong></button>',
    );
    const filePath = join(tempDir, 'turncount.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    expect(result.ok).toBe(true);
    expect((result.data as Record<string, unknown>).verified).toBe(true);

    const state = await loadState();
    expect(state._turnCount).toBe(1);
  });

  test('fails when atmosphere module is active but atmo-strip is missing', async () => {
    await handleState(['reset']);
    await handleState(['set', 'scene', '1']);
    await handleState(['set', 'currentRoom', 'bridge']);
    await handleState(['set', 'visualStyle', 'station']);
    await handleState(['set', 'modulesActive', JSON.stringify([
      'gm-checklist', 'prose-craft', 'core-systems', 'atmosphere',
    ])]);
    const html = '<style>' + 'x'.repeat(10000) + '</style>'
      + '<div id="scene-meta" data-meta="{}"></div>'
      + '<div id="panel-overlay"></div>'
      + '<ta-footer></ta-footer>'
      + '<div id="narrative"><p class="narrative">The air recyclers drone in the corridor ahead of you.</p></div>'
      + '<button class="action-card" data-prompt="Advance" title="Advance down the corridor"><strong class="btn-title">Advance</strong></button>'
      + '<button class="action-card" data-prompt="Listen" title="Listen carefully"><strong class="btn-title">Listen</strong></button>';
    const filePath = join(tempDir, 'no-atmo.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('atmosphere'))).toBe(true);
  });

  test('fails when lore-codex module is active but codex panel button is missing', async () => {
    await handleState(['reset']);
    await handleState(['set', 'scene', '1']);
    await handleState(['set', 'currentRoom', 'bridge']);
    await handleState(['set', 'visualStyle', 'station']);
    await handleState(['set', 'modulesActive', JSON.stringify([
      'gm-checklist', 'prose-craft', 'core-systems', 'lore-codex',
    ])]);
    const html = '<style>' + 'x'.repeat(10000) + '</style>'
      + '<div id="scene-meta" data-meta="{}"></div>'
      + '<div id="panel-overlay"></div>'
      + '<ta-footer></ta-footer>'
      + '<div id="narrative"><p class="narrative">Ancient glyphs cover the walls of the abandoned station module.</p></div>'
      + '<button class="action-card" data-prompt="Examine glyphs" title="Examine the ancient glyphs"><strong class="btn-title">Examine</strong></button>'
      + '<button class="action-card" data-prompt="Move on" title="Continue through the corridor"><strong class="btn-title">Move on</strong></button>';
    const filePath = join(tempDir, 'no-codex.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('codex'))).toBe(true);
  });

  test('fails when save button is missing from an otherwise valid footer', async () => {
    await setupState();
    let html = await renderComposedScene();
    html = html.replace(/<ta-footer[^>]*>/, '');
    const filePath = join(tempDir, 'missing-save.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('<ta-footer>'))).toBe(true);
  });

  test('fails when export button is missing while adventure-exporting is active', async () => {
    await setupState();
    await handleState(['set', 'modulesActive', JSON.stringify([
      'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
      'character-creation', 'save-codex', 'adventure-exporting',
    ])]);
    let html = await renderComposedScene();
    html = html.replace(/data-has-export="true"/, '');
    const filePath = join(tempDir, 'missing-export.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('Export action'))).toBe(true);
  });

  test('fails when an inactive module footer button is present', async () => {
    await setupState();
    let html = await renderComposedScene();
    html = html.replace(
      'data-modules="gm-checklist prose-craft core-systems die-rolls character-creation save-codex"',
      'data-modules="gm-checklist prose-craft core-systems die-rolls character-creation save-codex ship-systems"',
    );
    const filePath = join(tempDir, 'unexpected-footer-button.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(
      failures.some(f => (f.includes('Unexpected footer') || f.includes('Footer module contract mismatch')) && f.includes('ship')),
    ).toBe(true);
  });

  test('fails when action cards use editorial guidance labels', async () => {
    await setupState();
    let html = await renderComposedScene();
    html = html
      .replace('Examine sonar', 'Safe option')
      .replace('Speak to captain', 'Risky approach');
    const filePath = join(tempDir, 'editorial-labels.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('editorial guidance labels'))).toBe(true);
  });

  test('fails when atmosphere module is active but fewer than three atmo pills are present', async () => {
    await setupState();
    await handleState(['set', 'modulesActive', JSON.stringify([
      'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
      'character-creation', 'save-codex', 'atmosphere',
    ])]);
    let html = await renderComposedScene();
    html = html.replace(
      /<div class="atmo-strip">[\s\S]*?<\/div>/,
      '<div class="atmo-strip"><span class="atmo-pill">Cold light from the viewport</span></div>',
    );
    const filePath = join(tempDir, 'too-few-atmo-pills.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('sensory pill'))).toBe(true);
  });

  test('fails when panel close button is missing', async () => {
    await setupState();
    let html = await renderComposedScene();
    html = html.replace(/<button class="panel-close-btn" id="panel-close-btn" aria-label="Close panel">Close<\/button>/, '');
    const filePath = join(tempDir, 'missing-panel-close.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('panel-close-btn'))).toBe(true);
  });

  test('fails when panel title is not focusable', async () => {
    await setupState();
    let html = await renderComposedScene();
    html = html.replace('id="panel-title-text" tabindex="-1"', 'id="panel-title-text"');
    const filePath = join(tempDir, 'panel-title-no-tabindex.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('tabindex="-1"'))).toBe(true);
  });
});

// ── signMarker / readSignedMarker ────────────────────────────────────

describe('signMarker / readSignedMarker', () => {
  test('valid round-trip: signMarker then readSignedMarker returns the scene number', () => {
    const marker = signMarker(5);
    const markerPath = join(tempDir, 'roundtrip-marker');
    writeFileSync(markerPath, marker, 'utf-8');
    expect(readSignedMarker(markerPath)).toBe(5);
  });

  test('plain "1" (no colons) returns -1', () => {
    const markerPath = join(tempDir, 'plain-marker');
    writeFileSync(markerPath, '1', 'utf-8');
    expect(readSignedMarker(markerPath)).toBe(-1);
  });

  test('"1:2" (only 2 parts) returns -1', () => {
    const markerPath = join(tempDir, 'short-marker');
    writeFileSync(markerPath, '1:2', 'utf-8');
    expect(readSignedMarker(markerPath)).toBe(-1);
  });

  test('tampered hash returns -1', () => {
    const marker = signMarker(7);
    // Replace the hash portion with a bogus value
    const parts = marker.split(':');
    parts[parts.length - 1] = 'deadbeef';
    const tampered = parts.join(':');
    const markerPath = join(tempDir, 'tampered-marker');
    writeFileSync(markerPath, tampered, 'utf-8');
    expect(readSignedMarker(markerPath)).toBe(-1);
  });

  test('NaN scene number returns -1', () => {
    const markerPath = join(tempDir, 'nan-marker');
    writeFileSync(markerPath, 'abc:1234567890:somehash', 'utf-8');
    expect(readSignedMarker(markerPath)).toBe(-1);
  });

  test('non-existent file returns -1', () => {
    expect(readSignedMarker(join(tempDir, 'does-not-exist'))).toBe(-1);
  });
});

// ── resolveStateDir realpathSync fallback (line 53) ──────────────────

describe('verify resolveStateDir fallback', () => {
  test('getVerifyMarkerPath works when TAG_STATE_DIR does not yet exist on disk', () => {
    const nonExistentDir = join(tempDir, 'not-yet-created');
    const original = process.env.TAG_STATE_DIR;
    process.env.TAG_STATE_DIR = nonExistentDir;
    try {
      const markerPath = getVerifyMarkerPath();
      // Falls back to resolve() — should still produce a valid path string
      expect(markerPath).toContain('not-yet-created');
      expect(markerPath).toContain('.last-verify');
    } finally {
      if (original !== undefined) process.env.TAG_STATE_DIR = original;
      else delete process.env.TAG_STATE_DIR;
    }
  });
});

// ── audio button check (line 82-83) ─────────────────────────────────

describe('verify audio module check', () => {
  test('fails when audio module is active but audio-btn is missing', async () => {
    await handleState(['reset']);
    await handleState(['set', 'scene', '1']);
    await handleState(['set', 'currentRoom', 'bridge']);
    await handleState(['set', 'visualStyle', 'station']);
    await handleState(['set', 'modulesActive', JSON.stringify([
      'gm-checklist', 'prose-craft', 'core-systems', 'audio',
    ])]);
    const html = '<style>' + 'x'.repeat(10000) + '</style>'
      + '<div id="scene-meta" data-meta="{}"></div>'
      + '<div id="panel-overlay"></div>'
      + '<ta-footer data-has-audio="false"></ta-footer>'
      + '<div id="narrative"><p class="narrative">The hum of distant generators reverberates through the corridor walls.</p></div>'
      + '<button class="action-card" data-prompt="Listen" title="Listen to the source"><strong class="btn-title">Listen</strong></button>'
      + '<button class="action-card" data-prompt="Move on" title="Continue past"><strong class="btn-title">Move on</strong></button>';
    const filePath = join(tempDir, 'no-audio.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('audio') && f.includes('data-has-audio'))).toBe(true);
  });
});

// ── resolveSafeReadPath null / read-error branches (lines 210-220) ──

describe('verify file path validation', () => {
  test('rejects bare filename with no safe prefix or html extension', async () => {
    await setupState();
    // A bare name with no path prefix (/, ./, ../, ~/) and no .html/.htm extension
    // triggers resolveSafeReadPath returning null → "Invalid file path"
    const result = await handleVerify(['scene.txt']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('Invalid file path');
  });

  test('returns read error for non-existent HTML file', async () => {
    await setupState();
    const result = await handleVerify([join(tempDir, 'definitely-not-here.html')]);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('Failed to read file');
  });

  test('fails when Tier 1 modules are missing from modulesActive', async () => {
    await setupState();
    // Remove prose-craft and die-rolls from Tier 1
    await handleState(['set', 'modulesActive', JSON.stringify([
      'gm-checklist', 'core-systems', 'character-creation', 'save-codex',
    ])]);

    // Write a valid HTML file
    const renderResult = await handleRender(['scene', '--style', 'station', '--raw']);
    let html = (renderResult.data as string)
      .replace(
        '<p><!-- Narrative content rendered by the GM --></p>',
        '<p class="narrative">The bridge hums with tension.</p><p class="narrative">Something moves in the dark.</p>',
      );
    const htmlPath = join(tempDir, 'tier1-test.html');
    writeFileSync(htmlPath, html, 'utf-8');

    const result = await handleVerify([htmlPath]);
    expect(result.ok).toBe(true);
    const data = result.data as { verified: boolean; failures: string[] };
    expect(data.verified).toBe(false);
    expect(data.failures.some(f => f.includes('Tier 1') && f.includes('prose-craft'))).toBe(true);
    expect(data.failures.some(f => f.includes('Tier 1') && f.includes('die-rolls'))).toBe(true);
  });

  test('passes when all Tier 1 modules are present', async () => {
    await setupState();
    // setupState includes all 6 Tier 1 modules

    const renderResult = await handleRender(['scene', '--style', 'station', '--raw']);
    let html = (renderResult.data as string)
      .replace(
        '<p><!-- Narrative content rendered by the GM --></p>',
        '<p class="narrative">The bridge hums with tension.</p><p class="narrative">Something moves in the dark.</p>',
      );
    const htmlPath = join(tempDir, 'tier1-pass.html');
    writeFileSync(htmlPath, html, 'utf-8');

    const result = await handleVerify([htmlPath]);
    expect(result.ok).toBe(true);
    const data = result.data as { verified: boolean; failures: string[] };
    // Should not have any Tier 1 failures
    expect(data.failures.filter(f => f.includes('Tier 1')).length).toBe(0);
  });

  test('flags invalid CSS variable prefixes (--color-* instead of --sta-*)', async () => {
    await setupState();
    const renderResult = await handleRender(['scene', '--style', 'station', '--raw']);
    // Inject narrative + add an explicitly invalid CSS variable usage to the scene HTML.
    let html = (renderResult.data as string)
      .replace(
        '<p><!-- Narrative content rendered by the GM --></p>',
        '<p class="narrative">The bridge hums with tension.</p><p class="narrative">Something moves.</p>',
      )
      .replace('</ta-scene>', '<div style="color:var(--color-text-primary)">Injected invalid var</div></ta-scene>');
    const htmlPath = join(tempDir, 'bad-vars.html');
    writeFileSync(htmlPath, html, 'utf-8');

    const result = await handleVerify([htmlPath]);
    expect(result.ok).toBe(true);
    const data = result.data as { verified: boolean; failures: string[] };
    expect(data.failures.some(f => f.includes('CSS variable') && f.includes('--color-text-primary'))).toBe(true);
  });

  test('passes when all CSS variables use valid prefixes', async () => {
    await setupState();
    const renderResult = await handleRender(['scene', '--style', 'station', '--raw']);
    let html = (renderResult.data as string)
      .replace(
        '<p><!-- Narrative content rendered by the GM --></p>',
        '<p class="narrative">The bridge hums with a low mechanical tension while static crackles through the comms and every crew member watches the sensor wall.</p>'
        + '<p class="narrative">Something deliberate shifts beyond the viewport, slow enough to study you back before it disappears into the dark.</p>',
      );
    const htmlPath = join(tempDir, 'good-vars.html');
    writeFileSync(htmlPath, html, 'utf-8');

    const result = await handleVerify([htmlPath]);
    expect(result.ok).toBe(true);
    const data = result.data as { verified: boolean; failures: string[] };
    expect(data.failures.filter(f => f.includes('CSS variable')).length).toBe(0);
  });
});

describe('sync marker invalidation after verify', () => {
  test('successful scene verify deletes the sync marker', async () => {
    await setupState();
    const { getSyncMarkerPath } = await import('../lib/state-store');
    const syncMarkerPath = getSyncMarkerPath();
    const needsVerifyPath = join(tempDir, '.needs-verify');

    // Sync marker exists before verify (written in beforeEach)
    expect(existsSync(syncMarkerPath)).toBe(true);

    const renderResult = await handleRender(['scene', '--style', 'station', '--raw']);
    expect(existsSync(needsVerifyPath)).toBe(true);
    let html = (renderResult.data as string)
      .replace(
        '<p><!-- Narrative content rendered by the GM --></p>',
        '<p class="narrative">The bridge hums with a low mechanical tension while static crackles through the comms and every crew member watches the sensor wall.</p>'
        + '<p class="narrative">Something deliberate shifts beyond the viewport, slow enough to study you back before it disappears into the dark.</p>',
      );
    html = injectSceneActions(
      html,
      '<button class="action-card" data-prompt="Check sonar." title="Check sonar."><strong class="btn-title">Check sonar</strong></button>'
      + '<button class="action-card" data-prompt="Speak to Fen." title="Speak to Fen."><strong class="btn-title">Speak to Fen</strong></button>',
    );
    const htmlPath = join(tempDir, 'sync-gate.html');
    writeFileSync(htmlPath, html, 'utf-8');

    const result = await handleVerify([htmlPath]);
    expect(result.ok).toBe(true);
    expect((result.data as { verified: boolean }).verified).toBe(true);

    // Sync marker must be gone — forces sync --apply before next render
    expect(existsSync(syncMarkerPath)).toBe(false);
    expect(existsSync(needsVerifyPath)).toBe(false);
  });

  test('failed scene verify does NOT delete the sync marker', async () => {
    await setupState();
    const { getSyncMarkerPath } = await import('../lib/state-store');
    const syncMarkerPath = getSyncMarkerPath();

    // Write an HTML file that will fail verify (no narrative, no CSS)
    const htmlPath = join(tempDir, 'bad-scene.html');
    writeFileSync(htmlPath, '<div>empty</div>', 'utf-8');

    const result = await handleVerify([htmlPath]);
    expect(result.ok).toBe(true);
    expect((result.data as { verified: boolean }).verified).toBe(false);

    // Sync marker should still exist — no invalidation on failure
    expect(existsSync(syncMarkerPath)).toBe(true);
  });
});

describe('scene verification edge cases', () => {
  test('passes for multi-phase scenes when every phase narrative is composed', async () => {
    await setupState();
    const renderResult = await handleRender(['scene', '--style', 'station', '--raw', '--data', '{"phases":2}']);
    expect(renderResult.ok).toBe(true);
    let html = (renderResult.data as string)
      .replace(
        '<!-- [NARRATIVE: Phase 1] -->',
        '<p class="narrative">The bridge lights dim and the whole deck seems to hold its breath as the signal pulses again beyond the glass.</p>',
      )
      .replace(
        '<!-- [NARRATIVE: Phase 2] -->',
        '<p class="narrative">Fen leans over the console, voice low and urgent, while the sensor ghosts resolve into something far too deliberate to be debris.</p>',
      );
    html = injectSceneActions(
      html,
      '<button class="action-card" data-prompt="Cross-check the signal." title="Cross-check the signal."><strong class="btn-title">Cross-check</strong></button>'
      + '<button class="action-card" data-prompt="Question Fen about the drift pattern." title="Question Fen about the drift pattern."><strong class="btn-title">Question Fen</strong></button>',
    );
    const filePath = join(tempDir, 'scene-phases.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    expect(result.ok).toBe(true);
    const data = result.data as { verified: boolean; failures: string[] };
    expect(data.verified).toBe(true);
    expect(data.failures).toEqual([]);
  });

  test('does not count hidden levelup overlay prompts toward the visible action minimum', async () => {
    await setupState();
    await handleState(['set', '_levelupPending', 'true']);

    const renderResult = await handleRender(['scene', '--style', 'station', '--raw']);
    expect(renderResult.ok).toBe(true);
    let html = (renderResult.data as string).replace(
      '<p><!-- Narrative content rendered by the GM --></p>',
      '<p class="narrative">The bridge shivers with a rising engine whine as the crew waits for your call.</p><p class="narrative">Every eye in the room is on the sensor bloom edging toward the hull.</p>',
    );
    html = injectSceneActions(
      html,
      '<button class="action-card" data-prompt="Stabilise the sensor mast." title="Stabilise the sensor mast."><strong class="btn-title">Stabilise sensor mast</strong></button>',
    );
    const filePath = join(tempDir, 'scene-hidden-levelup.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    expect(result.ok).toBe(true);
    const failures = (result.data as { failures: string[] }).failures;
    expect(failures.some(f => f.includes('minimum is 2'))).toBe(true);
  });
});

describe('tag verify prose', () => {
  test('returns ok:true for prose subcommand', async () => {
    const html = '<div id="narrative">The door opens. Light floods in.</div>';
    const filePath = join(tempDir, 'prose-test.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify(['prose', filePath]);
    expect(result.ok).toBe(true);
    expect(result.command).toBe('verify prose');
  });

  test('reports prose failures without structural gates', async () => {
    const html = '<div id="narrative">She felt afraid. She was scared. She heard a noise.</div>';
    const filePath = join(tempDir, 'prose-fail.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify(['prose', filePath]);
    expect(result.ok).toBe(true);
    const data = result.data as { failures: string[]; warnings: string[] };
    expect(data.failures.some(f => f.includes('filter-words') || f.includes('telling-not-showing'))).toBe(true);
  });

  test('does not check structural elements (no CDN script failure)', async () => {
    const html = '<div id="narrative">She felt afraid.</div>';
    const filePath = join(tempDir, 'prose-no-cdn.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify(['prose', filePath]);
    expect(result.ok).toBe(true);
    const data = result.data as { failures: string[] };
    expect(data.failures.some(f => f.includes('tag-scene.js') || f.includes('hand-coded'))).toBe(false);
  });

  test('returns error when no file path provided', async () => {
    const result = await handleVerify(['prose']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('file path');
  });

  test('returns clean result for clean prose', async () => {
    const html = '<div id="narrative">The bulkhead groans. Rust flakes drift down. A single light flickers.</div>';
    const filePath = join(tempDir, 'prose-clean.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify(['prose', filePath]);
    expect(result.ok).toBe(true);
    const data = result.data as { failures: string[] };
    expect(data.failures.length).toBe(0);
  });
});
