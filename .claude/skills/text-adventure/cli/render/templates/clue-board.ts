// Clue board renderer turns quest clues into graph-ready custom-element payloads.
import type { GmState, QuestClue } from '../../types';
import { esc } from '../../lib/html';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

function clueText(
  raw: string | QuestClue,
  index: number,
): { id: string; text: string; source: string; important: boolean } {
  if (typeof raw === 'string') return { id: `clue-${index + 1}`, text: raw, source: '', important: false };
  return {
    id: raw.id || `clue-${index + 1}`,
    text: raw.text,
    source: raw.source ?? '',
    important: raw.important === true,
  };
}

function buildClueFallback(board: { clues: unknown[] }): string {
  return `<div class="widget-clue-board"><div class="widget-title">Clue Board</div><p>${esc(board.clues.length)} clues discovered</p></div>`;
}

export function renderClueBoard(state: GmState | null, styleName: string): string {
  const quests = state?.quests ?? [];
  const clues: Array<{
    id: string;
    text: string;
    source: string;
    important: boolean;
    questId: string;
    questTitle: string;
  }> = [];
  const edges: Array<{ from: string; to: string; label: string }> = [];
  const questNodes = quests.map(quest => ({ id: `quest:${quest.id}`, label: quest.title, status: quest.status }));

  for (const quest of quests) {
    (quest.clues ?? []).forEach((raw, index) => {
      const clue = clueText(raw, index);
      const clueId = `clue:${quest.id}:${clue.id}`;
      clues.push({ ...clue, id: clueId, questId: quest.id, questTitle: quest.title });
      edges.push({ from: clueId, to: `quest:${quest.id}`, label: 'supports' });
    });
    for (const locationId of quest.relatedLocationIds ?? []) {
      edges.push({ from: `quest:${quest.id}`, to: `location:${locationId}`, label: 'points to' });
    }
  }

  const locations = [...new Set(quests.flatMap(quest => quest.relatedLocationIds ?? []))].map(id => ({
    id: `location:${id}`,
    label: state?.worldData?.rooms?.[id]?.name ?? id,
  }));
  const board = { quests: questNodes, clues, locations, edges };

  return emitStandaloneCustomElement({
    tag: 'ta-clue-board',
    styleName,
    html: buildClueFallback(board),
    attrs: { 'data-clues': JSON.stringify(board) },
  });
}
