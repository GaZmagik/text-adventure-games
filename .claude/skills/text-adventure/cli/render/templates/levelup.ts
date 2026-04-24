// Level-up notification — congratulations banner, new HP,
// new proficiency bonus if applicable, ability options.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { proficiencyBonus } from '../../lib/modifier';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

/**
 * Builds the plain HTML fallback for the level-up notification.
 */
function buildLevelupFallback(
  charName: string,
  level: number,
  hp: number | string,
  maxHp: number | string,
  profBonus: number,
  profChangedFrom: number | null,
  abilities: string[],
): string {
  let html = `<div class="widget-levelup"><div class="levelup-banner">Level Up!</div><div class="levelup-subtitle">${esc(charName)} has reached level ${esc(level)}</div>`;

  html += '<div class="levelup-stats">';
  html += `<div class="levelup-stat"><span class="levelup-stat-label">Level</span><span class="levelup-stat-value">${esc(level)}</span></div>`;
  html += `<div class="levelup-stat"><span class="levelup-stat-label">HP</span><span class="levelup-stat-value">${esc(hp)} / ${esc(maxHp)}</span></div>`;
  html += `<div class="levelup-stat"><span class="levelup-stat-label">Prof. Bonus</span><span class="levelup-stat-value">+${esc(profBonus)}</span></div>`;
  html += '</div>';

  if (profChangedFrom !== null) {
    html += `<div class="levelup-prof-change">Proficiency bonus increased: +${esc(profChangedFrom)} &rarr; +${esc(profBonus)}</div>`;
  }

  if (abilities.length > 0) {
    html +=
      '<div class="ability-options"><div style="font-size:11px;opacity:0.6;text-transform:uppercase;margin-bottom:8px">Choose an ability</div>';
    abilities.forEach(a => {
      const prompt = `I choose the ${a} ability`;
      html += `<button class="ability-card" data-prompt="${esc(a)}" title="${esc(prompt)}">${esc(a)}</button>`;
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
}

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
  const charName = char?.name || 'Adventurer';
  const hp = char?.hp || '?';
  const maxHp = char?.maxHp || '?';

  return emitStandaloneCustomElement({
    tag: 'ta-levelup',
    styleName,
    html: buildLevelupFallback(charName, newLevel, hp, maxHp, newProf, profChanged ? oldProf : null, abilityOptions),
    attrs: {
      'data-char-name': charName,
      'data-level': newLevel,
      'data-hp': hp,
      'data-max-hp': maxHp,
      'data-prof-bonus': newProf,
      'data-prof-changed-from': profChanged ? oldProf : null,
      'data-abilities': abilityOptions.join(','),
    },
  });
}
