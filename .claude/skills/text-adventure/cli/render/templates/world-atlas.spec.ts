import { describe, expect, test } from 'bun:test';
import { createDefaultState } from '../../lib/state-store';
import { applyWorldSeedPayload, buildWorldSeedPayload } from '../../lib/map-adapter';
import { generateWorld } from '../../lib/worldgen';
import { extractJsonTagAttr } from '../../tests/support/rendered-widget';
import { renderWorldAtlas } from './world-atlas';

type WorldAtlasPayload = {
  mapName: string;
  currentRoom: string;
  rooms: Array<{
    id: string;
    label: string;
    visible: boolean;
    current: boolean;
    description: string;
    loot: unknown[];
  }>;
};

function generatedState() {
  const state = createDefaultState();
  applyWorldSeedPayload(state, buildWorldSeedPayload(generateWorld('panel-seed', 'space')));
  return state;
}

function readAtlas(html: string): WorldAtlasPayload {
  return extractJsonTagAttr<WorldAtlasPayload>(html, 'ta-world-atlas', 'data-atlas');
}

describe('renderWorldAtlas', () => {
  test('shows current and known rooms with their details', () => {
    const state = generatedState();
    const atlas = readAtlas(renderWorldAtlas(state, ''));
    const current = atlas.rooms.find(room => room.id === state.currentRoom)!;

    expect(atlas.mapName).toBe(state.worldData!.mapName);
    expect(atlas.currentRoom).toBe(state.currentRoom);
    expect(current.visible).toBe(true);
    expect(current.current).toBe(true);
    expect(current.description).not.toBe('');
  });

  test('hides unrevealed room details', () => {
    const state = generatedState();
    const atlas = readAtlas(renderWorldAtlas(state, ''));
    const hidden = atlas.rooms.find(room => !room.visible)!;

    expect(hidden.label).toBe('Unknown location');
    expect(hidden.description).toBe('');
    expect(hidden.loot).toEqual([]);
  });
});
