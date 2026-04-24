import { describe, expect, test } from 'bun:test';
import { createDefaultState } from '../../lib/state-store';
import { applyWorldSeedPayload, buildWorldSeedPayload } from '../../lib/map-adapter';
import { generateWorld } from '../../lib/worldgen';
import { extractJsonTagAttr } from '../../tests/support/rendered-widget';
import { renderRelationshipWeb } from './relationship-web';

type RelationshipGraphPayload = {
  nodes: Array<{ id: string; label: string; type: string; visible: boolean; prompt?: string }>;
  edges: Array<{ from: string; to: string; label: string }>;
};

function generatedState() {
  const state = createDefaultState();
  applyWorldSeedPayload(state, buildWorldSeedPayload(generateWorld('panel-seed', 'space')));
  return state;
}

function readGraph(html: string): RelationshipGraphPayload {
  return extractJsonTagAttr<RelationshipGraphPayload>(html, 'ta-relationship-web', 'data-graph');
}

describe('renderRelationshipWeb', () => {
  test('includes masked factions, quests, and location links', () => {
    const state = generatedState();
    const graph = readGraph(renderRelationshipWeb(state, ''));

    expect(graph.nodes.some(node => node.type === 'faction' && node.label === 'Unknown faction')).toBe(true);
    expect(graph.nodes.some(node => node.type === 'quest')).toBe(true);
    expect(graph.edges.some(edge => edge.label === 'involves')).toBe(true);
    expect(graph.edges.some(edge => edge.label === 'location')).toBe(true);
  });

  test('builds command prompts from typed graph nodes', () => {
    const state = generatedState();
    const graph = readGraph(renderRelationshipWeb(state, ''));
    const factionNode = graph.nodes.find(node => node.type === 'faction')!;
    const questNode = graph.nodes.find(node => node.type === 'quest')!;

    expect(factionNode.prompt).toContain('tag faction inspect');
    expect(questNode.prompt).toContain('tag quest inspect');
  });

  test('caps graph size for client-side rendering stability', () => {
    const state = generatedState();
    state.quests = Array.from({ length: 80 }, (_, index) => ({
      id: `quest_${index}`,
      title: `Quest ${index}`,
      status: 'active',
      objectives: [],
      clues: [],
    }));

    const graph = readGraph(renderRelationshipWeb(state, ''));

    expect(graph.nodes.length).toBeLessThanOrEqual(48);
    expect(graph.edges.length).toBeLessThanOrEqual(72);
  });
});
