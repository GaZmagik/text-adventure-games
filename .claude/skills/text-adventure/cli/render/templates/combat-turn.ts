// Combat outcome display — reads _lastComputation for attack roll, damage,
// hit/miss result, NPC HP change. Parameterised for combatant count via options.

import type { GmState } from '../../types';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

/**
 * Renders the combat turn outcome widget.
 * 
 * @param {GmState | null} state - Current game state.
 * @param {string} styleName - Visual style.
 * @param {Record<string, unknown>} [_options] - Unused.
 * @returns {string} - The HTML wrapped in a <ta-combat-turn> custom element.
 * 
 * @remarks
 * Displays the results of an attack or damage roll, including 
 * hit/miss status and the resulting HP changes for the participants.
 */
export function renderCombatTurn(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  const combatData = {
    computation: state?._lastComputation,
    char: state?.character ? {
      name: state.character.name,
      hp: state.character.hp,
      maxHp: state.character.maxHp,
    } : null,
    roster: state?.rosterMutations ?? [],
  };

  return emitStandaloneCustomElement({
    tag: 'ta-combat-turn',
    styleName,
    attrs: { 'data-combat': JSON.stringify(combatData) },
  });
}
