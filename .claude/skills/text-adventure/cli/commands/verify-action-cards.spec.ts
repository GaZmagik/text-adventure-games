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
  tempDir = mkdtempSync(join(tmpdir(), 'tag-verify-ac-'));
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

/** Render a valid scene and inject custom action cards. */
async function buildSceneHtml(actionCards: string): Promise<string> {
  const renderResult = await handleRender(['scene', '--style', 'station', '--raw']);
  expect(renderResult.ok).toBe(true);
  let html = (renderResult.data as string)
    .replace(
      '<p><!-- Narrative content rendered by the GM --></p>',
      '<p class="narrative">The corridor stretches ahead, dimly lit by emergency strips.</p>'
      + '<p class="narrative">A faint vibration pulses through the deck plates beneath your boots.</p>',
    );
  html = html.replace(
    '</div>\n  <!-- Scene metadata',
    actionCards + '</div>\n  <!-- Scene metadata',
  );
  return html;
}

// ── Stat name detection in action cards ──────────────────────────────

describe('verify: stat names in action cards', () => {
  test('fails when data-prompt contains a stat name', async () => {
    await setupState();
    const html = await buildSceneHtml(
      '<button class="action-card" data-prompt="Roll STR to force the door." title="Roll STR to force the door.">Force the door</button>'
      + '<button class="action-card" data-prompt="Sneak past quietly." title="Sneak past quietly.">Sneak past</button>',
    );
    const path = join(tempDir, 'scene.html');
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify([path]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('stat name') || f.includes('STR'))).toBe(true);
  });

  test('fails when data-prompt contains CHA', async () => {
    await setupState();
    const html = await buildSceneHtml(
      '<button class="action-card" data-prompt="Use CHA to charm the guard." title="Use CHA to charm the guard.">Charm the guard</button>'
      + '<button class="action-card" data-prompt="Walk away." title="Walk away.">Walk away</button>',
    );
    const path = join(tempDir, 'scene.html');
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify([path]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('CHA'))).toBe(true);
  });

  test('passes when action cards contain no stat names', async () => {
    await setupState();
    const html = await buildSceneHtml(
      '<button class="action-card" data-prompt="Examine the sonar." title="Examine the sonar.">Examine sonar</button>'
      + '<button class="action-card" data-prompt="Speak to the captain." title="Speak to the captain.">Speak to captain</button>',
    );
    const path = join(tempDir, 'scene.html');
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify([path]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.filter(f => f.includes('stat name')).length).toBe(0);
  });

  test('does not false-positive on words containing stat abbreviations', async () => {
    await setupState();
    const html = await buildSceneHtml(
      '<button class="action-card" data-prompt="Destroy the construct." title="Destroy the construct.">Destroy construct</button>'
      + '<button class="action-card" data-prompt="Conduct an investigation." title="Conduct an investigation.">Investigate</button>',
    );
    const path = join(tempDir, 'scene.html');
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify([path]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.filter(f => f.includes('stat name')).length).toBe(0);
  });

  test('stat names in character panel do not trigger the check', async () => {
    await setupState();
    // Character panel legitimately contains STR, DEX, etc. — only action cards should be checked
    const html = await buildSceneHtml(
      '<button class="action-card" data-prompt="Search the room." title="Search the room.">Search</button>'
      + '<button class="action-card" data-prompt="Leave quietly." title="Leave quietly.">Leave</button>',
    );
    const path = join(tempDir, 'scene.html');
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify([path]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    // The full HTML contains STR/DEX/etc in the character panel — should not trigger
    expect(failures.filter(f => f.includes('stat name')).length).toBe(0);
  });
});

// ── DC value detection in action cards ──────────────────────────────

describe('verify: DC values in action cards', () => {
  test('fails when data-prompt contains DC followed by number', async () => {
    await setupState();
    const html = await buildSceneHtml(
      '<button class="action-card" data-prompt="Attempt the DC 15 lock." title="Attempt the DC 15 lock.">Pick the lock</button>'
      + '<button class="action-card" data-prompt="Walk away." title="Walk away.">Walk away</button>',
    );
    const path = join(tempDir, 'scene.html');
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify([path]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.some(f => f.includes('DC') && f.includes('difficulty'))).toBe(true);
  });

  test('passes when no DC values in action cards', async () => {
    await setupState();
    const html = await buildSceneHtml(
      '<button class="action-card" data-prompt="Try to pick the lock." title="Try to pick the lock.">Pick lock</button>'
      + '<button class="action-card" data-prompt="Look for another way in." title="Look for another way in.">Find another way</button>',
    );
    const path = join(tempDir, 'scene.html');
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify([path]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.filter(f => f.includes('DC') && f.includes('difficulty')).length).toBe(0);
  });

  test('does not false-positive on DC as name or abbreviation', async () => {
    await setupState();
    const html = await buildSceneHtml(
      '<button class="action-card" data-prompt="Talk to DC Monroe." title="Talk to DC Monroe.">Talk to Monroe</button>'
      + '<button class="action-card" data-prompt="Head to the ADC." title="Head to the ADC.">Go to ADC</button>',
    );
    const path = join(tempDir, 'scene.html');
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify([path]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    expect(failures.filter(f => f.includes('difficulty')).length).toBe(0);
  });

  test('skips DC check when die-rolls module is not active', async () => {
    await setupState();
    // Remove die-rolls from active modules
    await handleState(['set', 'modulesActive', JSON.stringify([
      'gm-checklist', 'prose-craft', 'core-systems',
      'character-creation', 'save-codex',
    ])]);
    const html = await buildSceneHtml(
      '<button class="action-card" data-prompt="Attempt the DC 15 lock." title="Attempt the DC 15 lock.">Pick lock</button>'
      + '<button class="action-card" data-prompt="Walk away." title="Walk away.">Walk away</button>',
    );
    const path = join(tempDir, 'scene.html');
    writeFileSync(path, html, 'utf-8');
    const result = await handleVerify([path]);
    const failures = (result.data as Record<string, unknown>).failures as string[];
    // DC check should not fire when die-rolls is not active
    expect(failures.filter(f => f.includes('difficulty')).length).toBe(0);
  });
});
