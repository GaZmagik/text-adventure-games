import { describe, expect, test } from 'bun:test';
import { createDefaultState } from '../../lib/state-store';
import { applyWorldSeedPayload, buildWorldSeedPayload } from '../../lib/map-adapter';
import { generateWorld } from '../../lib/worldgen';
import { extractJsonTagAttr } from '../../tests/support/rendered-widget';
import { renderFactionBoard } from './faction-board';

type FactionBoardPayload = {
  factions: Array<{
    id: string;
    label: string;
    visible: boolean;
    ideology: string;
    territoryCount: number;
    inspectPrompt: string;
  }>;
  relations: Array<{ pair: string; a: string; b: string; status: string }>;
};

function generatedState() {
  const state = createDefaultState();
  applyWorldSeedPayload(state, buildWorldSeedPayload(generateWorld('panel-seed', 'space')));
  return state;
}

function readBoard(html: string): FactionBoardPayload {
  return extractJsonTagAttr<FactionBoardPayload>(html, 'ta-faction-board', 'data-factions');
}

describe('renderFactionBoard', () => {
  test('masks locked factions while preserving inspect prompts', () => {
    const state = generatedState();
    const firstFaction = state.worldData!.factions.factions[0]!;
    const board = readBoard(renderFactionBoard(state, ''));
    const faction = board.factions.find(item => item.id === firstFaction.id)!;

    expect(faction.visible).toBe(false);
    expect(faction.label).toBe('Unknown faction');
    expect(faction.ideology).toBe('');
    expect(faction.inspectPrompt).toContain(`tag faction inspect ${firstFaction.id}`);
  });

  test('reveals partial codex entries with ideology and territory counts', () => {
    const state = generatedState();
    const firstFaction = state.worldData!.factions.factions[0]!;
    state.codexMutations.find(entry => entry.id === `faction_${firstFaction.id}`)!.state = 'partial';

    const board = readBoard(renderFactionBoard(state, ''));
    const faction = board.factions.find(item => item.id === firstFaction.id)!;

    expect(faction.visible).toBe(true);
    expect(faction.label).toBe(firstFaction.name);
    expect(faction.ideology).toBe(firstFaction.ideology);
    expect(faction.territoryCount).toBeGreaterThan(0);
  });

  test('serialises generated faction relations for graphing', () => {
    const state = generatedState();
    const board = readBoard(renderFactionBoard(state, ''));

    expect(board.relations.length).toBeGreaterThan(0);
    expect(board.relations[0]!.pair).toContain('_');
    expect(board.relations[0]!.a).not.toBe('');
    expect(board.relations[0]!.b).not.toBe('');
  });
});
