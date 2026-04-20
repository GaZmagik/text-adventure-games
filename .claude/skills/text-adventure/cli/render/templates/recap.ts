// Session recap ("Previously on...") — character summary, location,
// recent quest status, last few rolls.

import type { GmState } from '../../types';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

/**
 * Renders the session recap widget.
 * 
 * @param {GmState | null} state - Current game state.
 * @param {string} styleName - Visual style.
 * @param {Record<string, unknown>} [_options] - Unused.
 * @returns {string} - The HTML wrapped in a <ta-recap> custom element.
 * 
 * @remarks
 * Provides a "Previously on..." summary to orient the player at the 
 * start of a session. Includes character vitals, current location, 
 * time, and active quest status.
 */
export function renderRecap(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
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

  return emitStandaloneCustomElement({
    tag: 'ta-recap',
    styleName,
    attrs: { 'data-recap': JSON.stringify(recapData) },
  });
}
