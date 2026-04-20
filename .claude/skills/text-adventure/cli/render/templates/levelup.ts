// Level-up notification — congratulations banner, new HP,
// new proficiency bonus if applicable, ability options.

import type { GmState } from '../../types';
import { proficiencyBonus } from '../../lib/modifier';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

/**
 * Renders the level-up notification widget.
 * 
 * @param {GmState | null} state - Current game state.
 * @param {string} styleName - Visual style.
 * @param {Record<string, unknown>} [options] - Optional data containing new ability choices.
 * @returns {string} - The HTML wrapped in a <ta-levelup> custom element.
 * 
 * @remarks
 * Triggered when a character gains enough XP to reach a new level.
 * Displays the increased HP and proficiency bonus, and handles 
 * the selection of new abilities if provided.
 */
export function renderLevelup(state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  const char = state?.character;
  const newLevel = Number(char?.level) || 1;
  const prevLevel = newLevel - 1;

  // Proficiency bonus thresholds (d20 system)
  const oldProf = proficiencyBonus(prevLevel);
  const newProf = proficiencyBonus(newLevel);
  const profChanged = newProf > oldProf;

  // Optional ability options passed via options.data
  const abilityOptions = (options?.data as { abilities?: string[] })?.abilities ?? [];

  return emitStandaloneCustomElement({
    tag: 'ta-levelup',
    styleName,
    attrs: {
      'data-char-name': char?.name || 'Adventurer',
      'data-level': newLevel,
      'data-hp': char?.hp || '?',
      'data-max-hp': char?.maxHp || '?',
      'data-prof-bonus': newProf,
      'data-prof-changed-from': profChanged ? oldProf : null,
      'data-abilities': abilityOptions.join(','),
    },
  });
}
