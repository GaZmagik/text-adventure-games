import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleVerify, getVerifyMarkerPath, signMarker, readSignedMarker } from './verify';
import { handleState } from './state';
import { handleRender } from './render';
import { loadState } from '../lib/state-store';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-verify-test-'));
  process.env.TAG_STATE_DIR = tempDir;
  const { signMarker } = require('./verify');
  writeFileSync(join(tempDir, '.last-sync'), signMarker(999), 'utf-8');
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
  await handleState(['set', 'worldFlags.rulebook', 'narrative_engine']);
  await handleState(['set', 'modulesActive', JSON.stringify([
    'gm-checklist', 'prose-craft', 'core-systems',
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
    html = html.replace(
      '</div>\n  <!-- Scene metadata',
      '<button class="action-card" data-prompt="Examine the sonar."><div class="action-card-title">Examine sonar</div></button>'
      + '<button class="action-card" data-prompt="Speak to the captain."><div class="action-card-title">Speak to captain</div></button>'
      + '</div>\n  <!-- Scene metadata',
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
    expect(failures.some(f => f.includes('footer'))).toBe(true);
  });

  test('fails when scene-meta is missing', async () => {
    await setupState();
    const html = '<div class="root"><div class="footer-row"><button class="footer-btn" data-panel="character">Char</button></div></div>';
    const filePath = join(tempDir, 'nometa.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    expect(result.ok).toBe(true);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('scene-meta'))).toBe(true);
  });

  test('fails when narrative is empty', async () => {
    await setupState();
    const html = '<style>' + 'x'.repeat(10000) + '</style><div id="scene-meta" data-meta="{}"></div><div class="footer-row"><button class="footer-btn" data-panel="character">Char</button></div><div id="narrative"><!-- empty --></div>';
    const filePath = join(tempDir, 'empty-narrative.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    expect(result.ok).toBe(true);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('narrative'))).toBe(true);
  });

  test('fails when CSS is below minimum threshold', async () => {
    await setupState();
    const html = '<style>.tiny{}</style><div id="scene-meta" data-meta="{}"></div><div class="footer-row"><button class="footer-btn" data-panel="character">Char</button></div><div id="narrative"><p>Story</p></div>';
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
    html = html.replace(
      '</div>\n  <!-- Scene metadata',
      '<button class="action-card" data-prompt="Go left."><div class="action-card-title">Go left</div></button>'
      + '<button class="action-card" data-prompt="Go right."><div class="action-card-title">Go right</div></button>'
      + '</div>\n  <!-- Scene metadata',
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
    html = html.replace(
      '</div>\n  <!-- Scene metadata',
      '<button onclick="sendPrompt(\'Do thing\')">Do thing</button>'
      + '<button class="action-card" data-prompt="Other thing"><div class="action-card-title">Other</div></button>'
      + '<button class="action-card" data-prompt="Another thing"><div class="action-card-title">Another</div></button>'
      + '</div>\n  <!-- Scene metadata',
    );
    const filePath = join(tempDir, 'onclick.html');
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
      + '<div class="footer-row"><button class="footer-btn" data-panel="character">Char</button></div>'
      + '<div class="status-bar"><span class="hp-display">HP 10/10</span></div>'
      + '<div id="narrative"><p class="narrative">The bridge hums with tension and the air smells of recycled nothing.</p></div>'
      + '<button class="action-card" data-prompt="Do the thing"><div class="action-card-title">Do thing</div></button>'
      + '<button class="action-card" data-prompt="Other thing"><div class="action-card-title">Other</div></button>';
    const filePath = join(tempDir, 'no-fallback.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('fallback') || f.includes('title'))).toBe(true);
  });

  test('fails when visual style is not set in state', async () => {
    await handleState(['reset']);
    await handleState(['set', 'scene', '1']);
    // Do NOT set visualStyle
    const html = '<style>' + 'x'.repeat(10000) + '</style>'
      + '<div id="scene-meta" data-meta="{}"></div>'
      + '<div id="panel-overlay"></div>'
      + '<div class="footer-row"><button class="footer-btn" data-panel="character">Char</button></div>'
      + '<div id="narrative"><p class="narrative">A sufficiently long narrative paragraph for the check.</p></div>'
      + '<button class="action-card" data-prompt="Act 1"><div class="action-card-title">Act</div></button>'
      + '<button class="action-card" data-prompt="Act 2"><div class="action-card-title">Act 2</div></button>';
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
      + '<div class="footer-row"><button class="footer-btn" data-panel="character">Char</button></div>'
      + '<div class="status-bar"><span class="hp-display">HP 10/10</span></div>'
      + '<div id="narrative"><p class="narrative">The guard swings and you need to dodge urgently now.</p></div>'
      + '<canvas id="dice-canvas" width="200" height="200"></canvas>'
      + '<button class="action-card" data-prompt="Dodge"><div class="action-card-title">Dodge</div></button>'
      + '<button class="action-card" data-prompt="Block"><div class="action-card-title">Block</div></button>';
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
    html = html.replace(
      '</div>\n  <!-- Scene metadata',
      '<button class="action-card" data-prompt="Investigate."><div class="action-card-title">Investigate</div></button>'
      + '<button class="action-card" data-prompt="Retreat."><div class="action-card-title">Retreat</div></button>'
      + '</div>\n  <!-- Scene metadata',
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
      + '<div class="footer-row"><button class="footer-btn" data-panel="character">Char</button></div>'
      + '<div id="narrative"><p class="narrative">The air recyclers drone in the corridor ahead of you.</p></div>'
      + '<button class="action-card" data-prompt="Advance" title="Advance down the corridor"><div class="action-card-title">Advance</div></button>'
      + '<button class="action-card" data-prompt="Listen" title="Listen carefully"><div class="action-card-title">Listen</div></button>';
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
      + '<div class="footer-row"><button class="footer-btn" data-panel="character">Char</button></div>'
      + '<div id="narrative"><p class="narrative">Ancient glyphs cover the walls of the abandoned station module.</p></div>'
      + '<button class="action-card" data-prompt="Examine glyphs" title="Examine the ancient glyphs"><div class="action-card-title">Examine</div></button>'
      + '<button class="action-card" data-prompt="Move on" title="Continue through the corridor"><div class="action-card-title">Move on</div></button>';
    const filePath = join(tempDir, 'no-codex.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('codex'))).toBe(true);
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
      + '<div class="footer-row"><button class="footer-btn" data-panel="character">Char</button></div>'
      + '<div id="narrative"><p class="narrative">The hum of distant generators reverberates through the corridor walls.</p></div>'
      + '<button class="action-card" data-prompt="Listen" title="Listen to the source"><div class="action-card-title">Listen</div></button>'
      + '<button class="action-card" data-prompt="Move on" title="Continue past"><div class="action-card-title">Move on</div></button>';
    const filePath = join(tempDir, 'no-audio.html');
    writeFileSync(filePath, html, 'utf-8');

    const result = await handleVerify([filePath]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('audio') && f.includes('audio-btn'))).toBe(true);
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
});
