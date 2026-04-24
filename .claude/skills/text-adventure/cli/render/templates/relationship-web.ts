// Relationship web renderer links visible factions, NPCs, quests, and locations into a capped graph.
import type { CodexMutation, GmState } from '../../types';
import { esc } from '../../lib/html';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

type GraphNode = { id: string; label: string; type: string; visible: boolean; prompt?: string };
type GraphEdge = { from: string; to: string; label: string };

function codexEntry(state: GmState | null, id: string): CodexMutation | undefined {
  return state?.codexMutations?.find(entry => entry.id === id);
}

function isVisible(entry: CodexMutation | undefined): boolean {
  if (!entry) return false;
  return entry.state === 'partial' || entry.state === 'discovered' || entry.state === 'redacted';
}

function addNode(nodes: Map<string, GraphNode>, node: GraphNode): void {
  if (!nodes.has(node.id)) nodes.set(node.id, node);
}

function nodePrompt(type: string, id: string, label: string): string {
  const bareId = id.includes(':') ? id.split(':').slice(1).join(':') : id;
  if (type === 'faction') return `Inspect faction ${label}: tag faction inspect ${bareId}.`;
  if (type === 'quest') return `Inspect quest ${label}: tag quest inspect ${bareId}.`;
  if (type === 'npc') return `Ask about ${label}.`;
  if (type === 'location') return `Inspect location ${label}: tag map inspect ${bareId}.`;
  return `Inspect ${label}.`;
}

function splitRelationPair(pair: string, factionIds: string[]): [string, string] {
  for (const id of factionIds) {
    if (pair.startsWith(`${id}_`)) {
      const other = pair.slice(id.length + 1);
      if (factionIds.includes(other)) return [id, other];
    }
  }
  const [a = '', b = ''] = pair.split('_');
  return [a, b];
}

function buildRelationshipFallback(graph: { nodes: GraphNode[]; edges: GraphEdge[] }): string {
  return `<div class="widget-relationship-web"><div class="widget-title">Relationship Web</div><p>${esc(graph.nodes.length)} nodes / ${esc(graph.edges.length)} links</p></div>`;
}

export function renderRelationshipWeb(state: GmState | null, styleName: string): string {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  for (const faction of state?.worldData?.factions.factions ?? []) {
    const entry = codexEntry(state, `faction_${faction.id}`);
    const visible = isVisible(entry);
    const id = `faction:${faction.id}`;
    const label = visible ? (entry?.title ?? faction.name) : 'Unknown faction';
    addNode(nodes, {
      id,
      label,
      type: 'faction',
      visible,
      prompt: nodePrompt('faction', id, label),
    });
  }

  for (const npc of state?.worldData?.roster ?? []) {
    const entry = codexEntry(state, `character_${npc.id}`);
    const visible = isVisible(entry);
    const id = `npc:${npc.id}`;
    const label = visible ? (entry?.title ?? npc.name) : 'Unknown contact';
    addNode(nodes, {
      id,
      label,
      type: 'npc',
      visible,
      prompt: nodePrompt('npc', id, label),
    });
    edges.push({ from: `npc:${npc.id}`, to: `faction:${npc.faction}`, label: visible ? 'member' : 'unknown' });
  }

  for (const quest of state?.quests ?? []) {
    const id = `quest:${quest.id}`;
    addNode(nodes, {
      id,
      label: quest.title,
      type: 'quest',
      visible: true,
      prompt: nodePrompt('quest', id, quest.title),
    });
    for (const factionId of quest.relatedFactionIds ?? [])
      edges.push({ from: `quest:${quest.id}`, to: `faction:${factionId}`, label: 'involves' });
    for (const npcId of quest.relatedNpcIds ?? [])
      edges.push({ from: `quest:${quest.id}`, to: `npc:${npcId}`, label: 'involves' });
    for (const locationId of quest.relatedLocationIds ?? []) {
      const id = `location:${locationId}`;
      const label = state?.worldData?.rooms?.[locationId]?.name ?? locationId;
      addNode(nodes, { id, label, type: 'location', visible: true, prompt: nodePrompt('location', id, label) });
      edges.push({ from: `quest:${quest.id}`, to: `location:${locationId}`, label: 'location' });
    }
  }

  const factionIds = (state?.worldData?.factions.factions ?? []).map(faction => faction.id);
  for (const [pair, status] of Object.entries(state?.worldData?.factions.relations ?? {})) {
    const [a = '', b = ''] = splitRelationPair(pair, factionIds);
    edges.push({ from: `faction:${a}`, to: `faction:${b}`, label: String(status) });
  }

  const graph = { nodes: [...nodes.values()].slice(0, 48), edges: edges.slice(0, 72) };

  return emitStandaloneCustomElement({
    tag: 'ta-relationship-web',
    styleName,
    html: buildRelationshipFallback(graph),
    attrs: { 'data-graph': JSON.stringify(graph) },
  });
}
