import type { GmState, StatName } from '../../types';
import { esc } from '../../lib/html';
import { XP_THRESHOLDS } from '../../data/xp-tables';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

const STAT_ORDER: StatName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export function renderCharacter(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  const char = state?.character;

  if (!char) {
    const html = `<div class="widget-character">
  <p class="empty-state">No character data available.</p>
</div>`;
    // When called from scene.ts panel with empty styleName, return raw HTML
    if (!styleName) return html;
    return wrapInShadowDom({ styleName, html });
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

  const html = `<ta-character data-config="${esc(JSON.stringify(config))}"></ta-character>`;

  // When called from scene.ts panel with empty styleName, return raw HTML
  if (!styleName) return html;
  return wrapInShadowDom({ styleName, html });
}