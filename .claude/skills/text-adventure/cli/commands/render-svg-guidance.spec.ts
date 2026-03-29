import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleRender } from './render';
import { saveState, createDefaultState } from '../lib/state-store';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-svg-test-'));
  process.env.TAG_STATE_DIR = tempDir;
  const { signMarker } = require('./verify');
  writeFileSync(join(tempDir, '.last-sync'), signMarker(999, '{}'), 'utf-8');
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) process.env.TAG_STATE_DIR = originalEnv;
  else delete process.env.TAG_STATE_DIR;
});

async function setupState(modules: string[] = []): Promise<void> {
  const state = createDefaultState();
  state.scene = 1;
  state.currentRoom = 'bridge';
  state.visualStyle = 'station';
  state.modulesActive = [
    'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
    'character-creation', 'save-codex', ...modules,
  ];
  state.character = {
    name: 'Test', class: 'Scout', hp: 10, maxHp: 10, ac: 12,
    level: 1, xp: 0, currency: 0, currencyName: 'credits',
    stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
    proficiencyBonus: 2, proficiencies: [], abilities: [],
    inventory: [], conditions: [],
    equipment: { weapon: 'Knife', armour: 'Vest' },
  };
  await saveState(state);
}

describe('svgGuidance in scene render', () => {
  test('includes svgGuidance when budget headroom exceeds 50%', async () => {
    await setupState();
    const result = await handleRender(['scene', '--style', 'station']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const size = data.sizeCheck as { percentUsed: number };
    expect(size.percentUsed).toBeLessThan(50);
    expect(data.svgGuidance).toBeDefined();
  });

  test('svgGuidance includes budgetRemaining', async () => {
    await setupState();
    const result = await handleRender(['scene', '--style', 'station']);
    const data = result.data as Record<string, unknown>;
    const svg = data.svgGuidance as Record<string, unknown>;
    expect(typeof svg.budgetRemaining).toBe('string');
    expect((svg.budgetRemaining as string).includes('K')).toBe(true);
  });

  test('svgGuidance includes suggestions array', async () => {
    await setupState();
    const result = await handleRender(['scene', '--style', 'station']);
    const data = result.data as Record<string, unknown>;
    const svg = data.svgGuidance as Record<string, unknown>;
    expect(Array.isArray(svg.suggestions)).toBe(true);
    expect((svg.suggestions as string[]).length).toBeGreaterThanOrEqual(1);
  });

  test('suggests ship schematic when ship-systems active', async () => {
    await setupState(['ship-systems']);
    const result = await handleRender(['scene', '--style', 'station']);
    const data = result.data as Record<string, unknown>;
    const svg = data.svgGuidance as Record<string, unknown>;
    const suggestions = svg.suggestions as string[];
    expect(suggestions.some(s => s.toLowerCase().includes('ship'))).toBe(true);
  });

  test('suggests star chart when star-chart active', async () => {
    await setupState(['star-chart']);
    const result = await handleRender(['scene', '--style', 'station']);
    const data = result.data as Record<string, unknown>;
    const svg = data.svgGuidance as Record<string, unknown>;
    const suggestions = svg.suggestions as string[];
    expect(suggestions.some(s => s.toLowerCase().includes('star') || s.toLowerCase().includes('navigation'))).toBe(true);
  });

  test('suggests floor plan when geo-map active', async () => {
    await setupState(['geo-map']);
    const result = await handleRender(['scene', '--style', 'station']);
    const data = result.data as Record<string, unknown>;
    const svg = data.svgGuidance as Record<string, unknown>;
    const suggestions = svg.suggestions as string[];
    expect(suggestions.some(s => s.toLowerCase().includes('map') || s.toLowerCase().includes('floor') || s.toLowerCase().includes('layout'))).toBe(true);
  });

  test('includes cssVariables hint with --sta- prefix', async () => {
    await setupState();
    const result = await handleRender(['scene', '--style', 'station']);
    const data = result.data as Record<string, unknown>;
    const svg = data.svgGuidance as Record<string, unknown>;
    expect(typeof svg.cssVariables).toBe('string');
    expect((svg.cssVariables as string).includes('--sta-')).toBe(true);
  });
});
