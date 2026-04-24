// Faction board renderer masks unrevealed factions while preserving inspect affordances.
import type { CodexMutation, GmState } from '../../types';
import { esc } from '../../lib/html';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

function codexEntry(state: GmState | null, id: string): CodexMutation | undefined {
  return state?.codexMutations?.find(entry => entry.id === id);
}

function isVisible(entry: CodexMutation | undefined): boolean {
  if (!entry) return false;
  return entry.state === 'partial' || entry.state === 'discovered' || entry.state === 'redacted';
}

function factionLabel(state: GmState | null, id: string, name: string): string {
  const entry = codexEntry(state, `faction_${id}`);
  if (entry?.state === 'redacted') return 'Redacted faction';
  if (entry && isVisible(entry)) return entry.title ?? name;
  return 'Unknown faction';
}

function standingLabel(value: number): string {
  if (value <= -50) return 'hostile';
  if (value < -15) return 'tense';
  if (value <= 15) return 'neutral';
  if (value < 50) return 'friendly';
  return 'allied';
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

function buildFactionFallback(board: { factions: Array<{ label: string }> }): string {
  return `<div class="widget-faction-board"><div class="widget-title">Faction Board</div><p>${esc(board.factions.length)} factions tracked</p></div>`;
}

export function renderFactionBoard(state: GmState | null, styleName: string): string {
  const zones = state?.mapState?.zones ?? [];
  const factions = (state?.worldData?.factions.factions ?? []).map(faction => {
    const standing = Number(state?.factions?.[faction.id] ?? faction.disposition ?? 0);
    const visible = isVisible(codexEntry(state, `faction_${faction.id}`));
    const territoryIds = zones.filter(zone => zone.faction === faction.id).map(zone => zone.id);
    return {
      id: faction.id,
      label: factionLabel(state, faction.id, faction.name),
      visible,
      standing,
      standingLabel: standingLabel(standing),
      ideology: visible ? faction.ideology : '',
      territory: territoryIds.map(
        id => state?.worldData?.rooms?.[id]?.name ?? zones.find(zone => zone.id === id)?.name ?? id,
      ),
      territoryCount: territoryIds.length || faction.territory.length,
      inspectPrompt: `Inspect faction ${faction.id} with tag faction inspect ${faction.id}.`,
    };
  });
  const factionIds = (state?.worldData?.factions.factions ?? []).map(faction => faction.id);
  const relations = Object.entries(state?.worldData?.factions.relations ?? {}).map(([pair, status]) => {
    const [a = '', b = ''] = splitRelationPair(pair, factionIds);
    const fa = state?.worldData?.factions.factions.find(faction => faction.id === a);
    const fb = state?.worldData?.factions.factions.find(faction => faction.id === b);
    return {
      pair,
      status,
      a,
      b,
      aLabel: fa ? factionLabel(state, fa.id, fa.name) : a,
      bLabel: fb ? factionLabel(state, fb.id, fb.name) : b,
    };
  });
  const board = { factions, relations };

  return emitStandaloneCustomElement({
    tag: 'ta-faction-board',
    styleName,
    html: buildFactionFallback(board),
    attrs: { 'data-factions': JSON.stringify(board) },
  });
}
