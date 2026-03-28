import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleVerify, getVerifyMarkerPath } from './verify';
import { handleState } from './state';
import { handleRender } from './render';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-verify-test-'));
  process.env.TAG_STATE_DIR = tempDir;
  writeFileSync(join(tempDir, '.last-sync'), '999', 'utf-8');
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
    expect(readFileSync(markerPath, 'utf-8').trim()).toBe('1');
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
});
