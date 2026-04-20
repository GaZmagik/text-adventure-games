// Level-up notification — congratulations banner, new HP,
// new proficiency bonus if applicable, ability options.

import type { GmState } from '../../types';
import { emitCustomElement } from '../../lib/html';
import { proficiencyBonus } from '../../lib/modifier';

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

  return emitCustomElement('ta-levelup', {
    'data-char-name': char?.name || 'Adventurer',
    'data-level': newLevel,
    'data-hp': char?.hp || '?',
    'data-max-hp': char?.maxHp || '?',
    'data-prof-bonus': newProf,
    'data-prof-changed-from': profChanged ? oldProf : null,
    'data-abilities': abilityOptions.join(','),
  });
}
