import type { Character, GmState, StatBlock, StatName } from '../../types';
import { XP_THRESHOLDS } from '../../data/xp-tables';
import { esc } from '../../lib/html';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

const STAT_ORDER: StatName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

type CharacterFallbackConfig = {
  name: string;
  class: string;
  level: number;
  hp: number;
  maxHp: number;
  ac: number;
  xp: number;
  xpNext: number;
  proficiencyBonus: number;
  currency: number;
  currencyName: string;
  stats: StatBlock;
  modifiers: StatBlock;
  proficiencies: string[];
  inventory: Character['inventory'];
  conditions: string[];
  equipment: Character['equipment'];
  abilities: string[];
};

/**
 * Builds the plain HTML fallback for the character sheet.
 */
function buildCharacterFallback(config: CharacterFallbackConfig): string {
  let html = `<div class="widget-character"><div class="widget-title">${esc(config.name)} (${esc(config.class)} Lv ${esc(config.level)})</div>`;
  html += `<p>HP: ${esc(config.hp)} / ${esc(config.maxHp)} | AC: ${esc(config.ac)}</p>`;
  html += '<div class="stats-grid">';
  STAT_ORDER.forEach(s => {
    html += `<span>${s}: ${esc(config.stats[s])} (${config.modifiers[s] >= 0 ? '+' : ''}${esc(config.modifiers[s])})</span> `;
  });
  html += '</div></div>';
  return html;
}

/**
 * Renders the player character sheet widget.
 *
 * @param {GmState | null} state - Current game state.
 * @param {string} styleName - Visual style.
 * @param {Record<string, unknown>} [_options] - Unused.
 * @returns {string} - The HTML wrapped in a <ta-character> custom element.
 *
 * @remarks
 * Displays the full character sheet, including stats, HP, XP,
 * inventory, and abilities. It automatically calculates the next
 * level XP threshold from the `xp-tables` data.
 */
export function renderCharacter(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  const char = state?.character;

  if (!char) {
    const html = `<div class="widget-character"><p class="empty-state">No character data available.</p></div>`;
    return emitStandaloneCustomElement({ tag: 'ta-character', styleName, html });
  }

  // Coerce numeric state values to safe defaults
  const hp = Number(char.hp) || 0;
  const maxHp = Number(char.maxHp) || 0;
  const ac = Number(char.ac) || 0;
  const level = Number(char.level) || 0;
  const xp = Number(char.xp) || 0;
  const profBonus = Number(char.proficiencyBonus) || 0;
  const currency = Number(char.currency) || 0;

  const nextThreshold = XP_THRESHOLDS.find(t => t.level === level + 1);
  const xpForLevel = nextThreshold?.xp ?? XP_THRESHOLDS[XP_THRESHOLDS.length - 1]!.xp;

  const config = {
    name: char.name,
    class: char.class,
    level: level,
    hp: hp,
    maxHp: maxHp,
    ac: ac,
    xp: xp,
    xpNext: xpForLevel,
    proficiencyBonus: profBonus,
    currency: currency,
    currencyName: char.currencyName,
    stats: char.stats,
    modifiers: char.modifiers,
    proficiencies: char.proficiencies,
    inventory: char.inventory,
    conditions: char.conditions,
    equipment: char.equipment,
    abilities: char.abilities,
  };

  return emitStandaloneCustomElement({
    tag: 'ta-character',
    styleName,
    html: buildCharacterFallback(config),
    attrs: { 'data-config': JSON.stringify(config) },
  });
}
