// Session recap ("Previously on...") — character summary, location,
// recent quest status, last few rolls.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';

export function renderRecap(state: GmState | null, _styleName: string, _options?: Record<string, unknown>): string {
  const recapData = {
    scene: Number(state?.scene) || 0,
    char: state?.character ? {
      name: state.character.name,
      class: state.character.class,
      level: state.character.level,
      hp: state.character.hp,
      maxHp: state.character.maxHp,
    } : null,
    room: state?.currentRoom ?? 'Unknown',
    time: state?.time,
    quests: state?.quests ?? [],
    rolls: state?.rollHistory ?? [],
  };

  return `<ta-recap data-recap="${esc(JSON.stringify(recapData))}"></ta-recap>`;
}
