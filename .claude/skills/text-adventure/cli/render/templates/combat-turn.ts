// Combat outcome display — reads _lastComputation for attack roll, damage,
// hit/miss result, NPC HP change. Parameterised for combatant count via options.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';

export function renderCombatTurn(state: GmState | null, _styleName: string, _options?: Record<string, unknown>): string {
  const combatData = {
    computation: state?._lastComputation,
    char: state?.character ? {
      name: state.character.name,
      hp: state.character.hp,
      maxHp: state.character.maxHp,
    } : null,
    roster: state?.rosterMutations ?? [],
  };

  return `<ta-combat-turn data-combat="${esc(JSON.stringify(combatData))}"></ta-combat-turn>`;
}