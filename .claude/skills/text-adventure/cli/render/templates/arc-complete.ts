// Arc-complete widget — end-of-act boundary with summary, stats, and
// save/export/continue action buttons.

import type { GmState } from '../../types';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

/**
 * Renders the arc completion summary widget.
 * 
 * @param {GmState | null} state - Current game state.
 * @param {string} styleName - Visual style.
 * @param {Record<string, unknown>} [options] - Optional data containing the arc summary text.
 * @returns {string} - The HTML wrapped in a <ta-arc-complete> custom element.
 * 
 * @remarks
 * This widget is displayed at the end of a campaign arc (act). 
 * It provides a performance summary (quests completed, rolls made, 
 * level reached) and provides the 'Export Lore' and 'Continue' actions.
 */
export function renderArcComplete(state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  const quests = state?.quests ?? [];
  const rawData = options?.data;
  const dataSummary = (rawData !== null && typeof rawData === 'object' && !Array.isArray(rawData))
    ? (rawData as Record<string, unknown>).summary
    : undefined;

  const arcData = {
    arc: state?.arc ?? 1,
    charName: state?.character?.name ?? 'Adventurer',
    charLevel: state?.character?.level ?? 1,
    charClass: state?.character?.class ?? '',
    questsCompleted: quests.filter(q => q.status === 'completed').length,
    questsTotal: quests.length,
    rollCount: state?.rollHistory?.length ?? 0,
    sceneCount: state?.scene ?? 0,
    summary: typeof dataSummary === 'string' ? dataSummary : '',
  };

  return emitStandaloneCustomElement({
    tag: 'ta-arc-complete',
    styleName,
    attrs: { 'data-arc': JSON.stringify(arcData) },
  });
}
