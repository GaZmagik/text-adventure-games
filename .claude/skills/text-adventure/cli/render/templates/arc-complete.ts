// Arc-complete widget — end-of-act boundary with summary, stats, and
// save/export/continue action buttons.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';

export function renderArcComplete(state: GmState | null, _styleName: string, options?: Record<string, unknown>): string {
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

  return `<ta-arc-complete data-arc="${esc(JSON.stringify(arcData))}"></ta-arc-complete>`;
}
