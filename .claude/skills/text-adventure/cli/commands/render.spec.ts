import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleRender } from './render';
import { saveState, createDefaultState } from '../lib/state-store';
import { WIDGET_CSS_SCOPES } from '../metadata';
import {
  MAX_DICE_POOL_CANVAS_HEIGHT,
  MAX_DICE_POOL_TOTAL,
} from '../render/templates/dice-pool';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-render-test-'));
  process.env.TAG_STATE_DIR = tempDir;
  // Sync gate: write a properly signed marker so render doesn't block
  // State doesn't exist yet at beforeEach time, so we sign with empty JSON
  // and the render gate will pass because scene 999 >= any test scene
  const { signMarker } = require('./verify');
  writeFileSync(join(tempDir, '.last-sync'), signMarker(999, '{}'), 'utf-8');
  writeFileSync(join(tempDir, '.verified-scenario'), signMarker(0), 'utf-8');
  writeFileSync(join(tempDir, '.verified-rules'), signMarker(0), 'utf-8');
  writeFileSync(join(tempDir, '.verified-character'), signMarker(0), 'utf-8');
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) {
    process.env.TAG_STATE_DIR = originalEnv;
  } else {
    delete process.env.TAG_STATE_DIR;
  }
});

// ── Argument validation ──────────────────────────────────────────────

describe('render argument validation', () => {
  test('returns error when no widget type specified', async () => {
    const result = await handleRender([]);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('No widget type');
  });

  test('returns error for unknown widget type', async () => {
    const result = await handleRender(['nonexistent']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('Unknown widget type');
  });
});

// ── State requirement ────────────────────────────────────────────────

describe('render state requirement', () => {
  test('returns error when no state exists for in-game widget', async () => {
    const result = await handleRender(['ticker']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('No game state');
  });

  test('data-driven dice-pool widget renders without state', async () => {
    const result = await handleRender([
      'dice-pool',
      '--raw',
      '--data',
      '{"label":"Volley","pool":[{"dieType":"d6","count":2},{"dieType":"d8","count":1}],"modifier":2}',
    ]);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect(html).toContain('Volley');
    expect(html).toContain('2d6 + 1d8');
    expect(html).toContain('id="dice-pool-canvas"');
  });

  test('dice-pool safely serialises hostile inline-script payloads', async () => {
    const result = await handleRender([
      'dice-pool',
      '--raw',
      '--data',
      '{"label":"</script><script>alert(1)</script>","pool":[{"dieType":"d6","count":2}],"modifier":0}',
    ]);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect((html.match(/<script>/g) ?? [])).toHaveLength(1);
    expect(html).not.toContain('</script><script>alert(1)</script>');
    expect(html).toContain('\\u003c/script\\u003e\\u003cscript\\u003ealert(1)\\u003c/script\\u003e');
  });

  test('rejects dice widget --data missing required dieType', async () => {
    const result = await handleRender([
      'dice',
      '--raw',
      '--data',
      '{"stat":"STR","modifier":2}',
    ]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('missing required key "dieType"');
  });

  test('rejects dice widget --data with wrong dieType type', async () => {
    const result = await handleRender([
      'dice',
      '--raw',
      '--data',
      '{"dieType":42}',
    ]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('"dieType" must be string');
  });

  test('rejects render data with forbidden keys', async () => {
    const result = await handleRender([
      'settings',
      '--raw',
      '--style',
      'terminal',
      '--data',
      '{"__proto__":{"polluted":true}}',
    ]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('forbidden keys');
  });

  test('rejects non-object --data payloads', async () => {
    const result = await handleRender([
      'settings',
      '--raw',
      '--style',
      'terminal',
      '--data',
      '["not","an","object"]',
    ]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('--data must be a JSON object');
  });

  test('rejects scenario-select data with malformed scenario entries', async () => {
    const result = await handleRender([
      'scenario-select',
      '--raw',
      '--style',
      'terminal',
      '--data',
      '{"scenarios":[{"hook":"Missing title"}]}',
    ]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('scenarios[0].title');
  });

  test('rejects dialogue choices without label/prompt strings', async () => {
    const result = await handleRender([
      'dialogue',
      '--raw',
      '--style',
      'terminal',
      '--data',
      '{"choices":[{"label":"Ask","prompt":42}]}',
    ]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('choices[0].prompt');
  });

  test('rejects character-creation archetypes without names', async () => {
    const result = await handleRender([
      'character-creation',
      '--raw',
      '--style',
      'terminal',
      '--data',
      '{"archetypes":[{"description":"No name"}]}',
    ]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('archetypes[0].name');
  });

  test('settings safely serialises hostile defaults inside inline scripts', async () => {
    const hostileDefaults = JSON.stringify({
      defaults: {
        rulebook: '</script><script>alert(1)</script>',
      },
    });
    const result = await handleRender(['settings', '--raw', '--style', 'terminal', '--data', hostileDefaults]);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    expect((html.match(/<script>/g) ?? [])).toHaveLength(1);
    expect(html).toContain('\\u003c/script\\u003e\\u003cscript\\u003ealert(1)\\u003c/script\\u003e');
  });

  test('dice-pool caps total logical dice and canvas size deterministically', async () => {
    const result = await handleRender([
      'dice-pool',
      '--raw',
      '--data',
      '{"label":"Crowd Control","pool":[{"dieType":"d6","count":24},{"dieType":"d8","count":24}],"modifier":1}',
    ]);
    expect(result.ok).toBe(true);
    const html = result.data as string;
    const canvasHeight = Number(html.match(/height="(\d+)"/)?.[1] ?? '0');
    expect(html).toContain(`Displaying ${MAX_DICE_POOL_TOTAL} of 48 dice`);
    expect(canvasHeight).toBeLessThanOrEqual(MAX_DICE_POOL_CANVAS_HEIGHT);
    expect(html).toContain(`var POOL_MAX_DICE=${MAX_DICE_POOL_TOTAL}`);
  });

  test('returns style error when state has no visualStyle', async () => {
    const state = createDefaultState();
    await saveState(state);
    const result = await handleRender(['ticker']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('No visual style');
  });

  test('requires state sync before rendering in-game widgets', async () => {
    const state = createDefaultState();
    state.visualStyle = 'terminal';
    state.scene = 4;
    await saveState(state);
    writeFileSync(join(tempDir, '.last-sync'), '2', 'utf-8');

    const result = await handleRender(['ticker']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('State sync required');
  });
});

// ── Style resolution ─────────────────────────────────────────────────

describe('render style resolution', () => {
  test('--style flag overrides state visualStyle', async () => {
    const state = createDefaultState();
    state.visualStyle = 'parchment';
    await saveState(state);

    // terminal style exists in the styles/ directory
    const result = await handleRender(['ticker', '--style', 'terminal']);
    expect(result.ok).toBe(true);
    const data = result.data as { style: string };
    expect(data.style).toBe('terminal');
  });

  test('falls back to state visualStyle when no --style flag', async () => {
    const state = createDefaultState();
    state.visualStyle = 'terminal';
    await saveState(state);

    const result = await handleRender(['ticker']);
    expect(result.ok).toBe(true);
    const data = result.data as { style: string };
    expect(data.style).toBe('terminal');
  });

  test('unknown style name produces output with warning comment', async () => {
    const state = createDefaultState();
    state.visualStyle = 'does-not-exist-xyz';
    await saveState(state);

    const result = await handleRender(['ticker', '--raw']);
    // Shadow DOM renders with a warning comment when style is not in CDN manifest
    expect(result.ok).toBe(true);
    expect(result.data as string).toContain('WARNING');
  });

  test('rejects style names with invalid characters', async () => {
    const result = await handleRender(['settings', '--style', '../bad-style']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('invalid characters');
  });

  test('CSS scope mapping removal does not affect Shadow DOM rendering', async () => {
    const original = WIDGET_CSS_SCOPES.settings!;
    delete (WIDGET_CSS_SCOPES as Record<string, readonly string[]>).settings;
    try {
      // Shadow DOM bypasses CSS scope mapping — templates receive styleName directly
      const result = await handleRender(['settings', '--style', 'terminal', '--raw']);
      expect(result.ok).toBe(true);
      expect(result.data as string).toContain('attachShadow');
    } finally {
      (WIDGET_CSS_SCOPES as Record<string, readonly string[]>).settings = original;
    }
  });
});

// ── Output modes ─────────────────────────────────────────────────────

describe('render output modes', () => {
  test('returns JSON-wrapped output by default', async () => {
    const state = createDefaultState();
    state.visualStyle = 'terminal';
    await saveState(state);

    const result = await handleRender(['ticker']);
    expect(result.ok).toBe(true);
    const data = result.data as { widget: string; style: string; html: string };
    expect(data.widget).toBe('ticker');
    expect(data.style).toBe('terminal');
    expect(typeof data.html).toBe('string');
    expect(data.html).toContain('attachShadow');
  });

  test('non-raw response includes sizeCheck with budget info', async () => {
    const state = createDefaultState();
    state.visualStyle = 'terminal';
    await saveState(state);

    const result = await handleRender(['ticker']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const sc = data.sizeCheck as { chars: number; budgetChars: number; withinBudget: boolean; percentUsed: number };
    expect(sc).toBeDefined();
    expect(sc.chars).toBe((data.html as string).length);
    expect(sc.budgetChars).toBe(128 * 1024);
    expect(sc.withinBudget).toBe(true);
    expect(sc.percentUsed).toBeGreaterThan(0);
    expect(sc.percentUsed).toBeLessThanOrEqual(100);
    expect(data.budgetNote as string).toContain(sc.chars.toLocaleString());
  });

  test('--raw flag returns HTML string directly', async () => {
    const state = createDefaultState();
    state.visualStyle = 'terminal';
    await saveState(state);

    const result = await handleRender(['ticker', '--raw']);
    expect(result.ok).toBe(true);
    expect(typeof result.data).toBe('string');
    expect(result.data as string).toContain('attachShadow');
  });

  test('non-scene widgets carry an exact render-origin marker', async () => {
    const state = createDefaultState();
    state.visualStyle = 'terminal';
    await saveState(state);

    const result = await handleRender(['ticker', '--raw']);
    expect(result.ok).toBe(true);
    expect(result.data as string).toMatch(/^<!-- TAG-RENDER:ticker:[0-9a-f]{8} -->\n/);
  });
});

// ── Freshness gates ─────────────────────────────────────────────────

describe('render freshness gates', () => {
  function sceneReadyState() {
    const state = createDefaultState();
    state.visualStyle = 'station';
    state.scene = 1;
    state.currentRoom = 'bridge';
    state.character = {
      name: 'Test', class: 'Scout', hp: 10, maxHp: 10, ac: 12,
      level: 1, xp: 0, currency: 0, currencyName: 'credits',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2, proficiencies: [], abilities: [],
      inventory: [], conditions: [],
      equipment: { weapon: 'None', armour: 'None' },
    };
    state._modulesRead = [
      'gm-checklist', 'prose-craft', 'core-systems',
      'die-rolls', 'character-creation', 'save-codex',
    ];
    state._proseCraftEpoch = 0;
    state._styleReadEpoch = 0;
    state._compactionCount = 0;
    return state;
  }

  test('scene render fails when prose-craft epoch is stale after compaction', async () => {
    const state = sceneReadyState();
    state._compactionCount = 3;
    state._proseCraftEpoch = 1; // stale — behind compaction count
    await saveState(state);

    const result = await handleRender(['scene']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/prose.craft/i);
    expect(result.error!.corrective).toMatch(/tag module activate prose-craft/);
  });

  test('scene render fails when prose-craft epoch is undefined', async () => {
    const state = sceneReadyState();
    delete (state as any)._proseCraftEpoch;
    await saveState(state);

    const result = await handleRender(['scene']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/prose.craft/i);
  });

  test('scene render fails when style read epoch is stale after compaction', async () => {
    const state = sceneReadyState();
    state._compactionCount = 2;
    state._proseCraftEpoch = 2; // fresh — so prose-craft gate passes
    state._styleReadEpoch = 0; // stale
    await saveState(state);

    const result = await handleRender(['scene']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/style/i);
    expect(result.error!.corrective).toMatch(/tag style activate/);
  });

  test('scene render fails when style read epoch is undefined', async () => {
    const state = sceneReadyState();
    state._proseCraftEpoch = 0; // fresh
    delete (state as any)._styleReadEpoch;
    await saveState(state);

    const result = await handleRender(['scene']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/style/i);
  });

  test('scene render succeeds when both epochs match compaction count', async () => {
    const state = sceneReadyState();
    state._compactionCount = 5;
    state._proseCraftEpoch = 5;
    state._styleReadEpoch = 5;
    await saveState(state);

    const result = await handleRender(['scene']);
    // May still fail for other reasons (no HTML composition) but NOT for freshness
    if (!result.ok) {
      expect(result.error!.message).not.toMatch(/prose.craft/i);
      expect(result.error!.message).not.toMatch(/style.*stale/i);
    }
  });

  test('pre-game widgets are not affected by freshness gates', async () => {
    const state = createDefaultState();
    state.visualStyle = 'station';
    delete (state as any)._proseCraftEpoch;
    delete (state as any)._styleReadEpoch;
    await saveState(state);

    const result = await handleRender(['settings']);
    // settings is pre-game — should not fail for freshness reasons
    expect(result.ok).toBe(true);
  });

  test('non-scene in-game widgets are not affected by freshness gates', async () => {
    const state = createDefaultState();
    state.visualStyle = 'station';
    delete (state as any)._proseCraftEpoch;
    delete (state as any)._styleReadEpoch;
    await saveState(state);

    const result = await handleRender(['ticker']);
    expect(result.ok).toBe(true);
  });
});
