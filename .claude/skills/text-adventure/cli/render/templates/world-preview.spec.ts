import { describe, expect, test } from 'bun:test';
import { createDefaultState } from '../../lib/state-store';
import { applyWorldSeedPayload, buildWorldSeedPayload } from '../../lib/map-adapter';
import { generateWorld } from '../../lib/worldgen';
import { extractJsonTagAttr } from '../../tests/support/rendered-widget';
import { renderWorldPreview } from './world-preview';

type WorldPreviewPayload = {
  seed: string;
  theme: string;
  mapName: string;
  roomCount: number;
  zones: Array<{ id: string; label: string }>;
  connections: unknown[];
  applyPrompt: string;
};

function generatedState() {
  const state = createDefaultState();
  applyWorldSeedPayload(state, buildWorldSeedPayload(generateWorld('panel-seed', 'space')));
  return state;
}

function readPreview(html: string): WorldPreviewPayload {
  return extractJsonTagAttr<WorldPreviewPayload>(html, 'ta-world-preview', 'data-preview');
}

describe('renderWorldPreview', () => {
  test('emits a standalone world preview custom element with CDN assets', () => {
    const html = renderWorldPreview(null, 'station', { data: { seed: 'preview-seed', theme: 'dungeon' } });

    expect(html).toContain('<ta-world-preview');
    expect(html).toContain('ta-components.js');
    expect(html).toContain('station.css');
  });

  test('generates preview data from explicit seed and theme options', () => {
    const preview = readPreview(renderWorldPreview(null, '', { data: { seed: 'preview-seed', theme: 'dungeon' } }));

    expect(preview.seed).toBe('preview-seed');
    expect(preview.theme).toBe('dungeon');
    expect(preview.roomCount).toBeGreaterThan(0);
    expect(preview.zones.length).toBeGreaterThan(0);
    expect(preview.connections.length).toBeGreaterThan(0);
    expect(preview.applyPrompt).toContain('tag world generate --seed preview-seed --theme dungeon --apply');
  });

  test('reuses applied world data when no override seed or theme is provided', () => {
    const state = generatedState();
    const preview = readPreview(renderWorldPreview(state, ''));

    expect(preview.seed).toBe(state.worldData!.seed);
    expect(preview.theme).toBe(state.worldData!.theme);
    expect(preview.mapName).toBe(state.worldData!.mapName);
  });
});
