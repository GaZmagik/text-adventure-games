// Character stat panel — name, class, level, HP bar, stats with modifiers,
// inventory list, conditions, XP bar.

import type { GmState, StatName } from '../../types';
import { esc } from '../../lib/html';
import { XP_THRESHOLDS } from '../../data/xp-tables';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

const STAT_ORDER: StatName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

const CHARACTER_CSS = `.widget-character { font-family: var(--ta-font-body); padding: 16px; }
.char-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 12px; }
.char-name { font-family: var(--ta-font-heading); font-size: 20px; font-weight: 700; color: var(--sta-text-primary, #EEF0FF); }
.char-class { font-size: 12px; color: var(--sta-text-tertiary, #545880); text-transform: uppercase; letter-spacing: 0.08em; }
.char-bar-container { width: 100%; height: 10px; background: var(--sta-border-tertiary, rgba(84,88,128,0.4)); border-radius: 5px; overflow: hidden; margin: 4px 0; }
.bar-fill-hp { height: 100%; background: var(--ta-color-success); border-radius: 5px; transition: width 0.3s; }
.bar-fill-xp { height: 100%; background: var(--ta-color-xp); border-radius: 5px; transition: width 0.3s; }
.bar-label { font-size: 11px; color: var(--sta-text-tertiary, #545880); display: flex; justify-content: space-between; }
.stat-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin: 12px 0; text-align: center; }
.stat-cell { padding: 8px 4px; border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); border-radius: 6px; }
.stat-cell.proficient { border-color: var(--ta-color-accent); }
.stat-label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--sta-text-tertiary, #545880); }
.stat-value { display: block; font-size: 18px; font-weight: 700; color: var(--sta-text-primary, #EEF0FF); }
.stat-mod { display: block; font-size: 11px; color: var(--ta-color-accent); }
.section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--sta-text-tertiary, #545880); margin: 14px 0 6px; }
.inv-list { list-style: none; padding: 0; margin: 0; }
.inv-item { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); font-size: 12px; }
.inv-name { color: var(--sta-text-primary, #EEF0FF); }
.inv-type { color: var(--sta-text-tertiary, #545880); font-size: 10px; text-transform: uppercase; }
.inv-slots { color: var(--sta-text-tertiary, #545880); font-size: 10px; }
.condition-badge { display: inline-block; padding: 2px 8px; font-size: 10px; border-radius: 10px; background: var(--ta-color-warning-bg); color: var(--ta-color-warning); margin-right: 4px; }
.no-conditions { font-size: 11px; color: var(--sta-text-tertiary, #545880); }
.equipment-row { font-size: 12px; color: var(--sta-text-secondary, #9AA0C0); margin: 2px 0; }
.equipment-label { color: var(--sta-text-tertiary, #545880); text-transform: uppercase; font-size: 10px; letter-spacing: 0.06em; }
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0s !important; animation-duration: 0s !important; }
}`;

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

  const hpPercent = maxHp > 0 ? Math.round((hp / maxHp) * 100) : 0;
  const nextThreshold = XP_THRESHOLDS.find(t => t.level === level + 1);
  const xpForLevel = nextThreshold?.xp ?? XP_THRESHOLDS[XP_THRESHOLDS.length - 1]!.xp;
  const xpPercent = xpForLevel > 0 ? Math.min(100, Math.round((xp / xpForLevel) * 100)) : 0;

  const profSet = new Set(char.proficiencies);
  const statRows = STAT_ORDER.map(s => {
    const mod = Number(char.modifiers[s]) || 0;
    const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
    const isProficient = profSet.has(s);
    return `<div class="stat-cell${isProficient ? ' proficient' : ''}">
        <span class="stat-label">${s}</span>
        <span class="stat-value">${Number(char.stats[s]) || 0}</span>
        <span class="stat-mod">${modStr}</span>
      </div>`;
  }).join('\n      ');

  const inventoryRows = char.inventory.map(item =>
    `<li class="inv-item"><span class="inv-name">${esc(item.name)}</span> <span class="inv-type">${esc(item.type)}</span> <span class="inv-slots">${Number(item.slots) || 0} slot${Number(item.slots) !== 1 ? 's' : ''}</span></li>`,
  ).join('\n        ');

  const conditionBadges = char.conditions.length > 0
    ? char.conditions.map(c => `<span class="condition-badge">${esc(c)}</span>`).join(' ')
    : '<span class="no-conditions">None</span>';

  const html = `<div class="widget-character">
  <div class="char-header">
    <span class="char-name">${esc(char.name)}</span>
    <span class="char-class">${esc(char.class)} · Lv ${level}</span>
  </div>

  <!-- HP bar -->
  <div class="bar-label"><span>HP</span><span>${hp} / ${maxHp}</span></div>
  <div class="char-bar-container" role="meter" aria-valuenow="${hpPercent}" aria-valuemin="0" aria-valuemax="100" aria-label="HP: ${hp} of ${maxHp}" aria-valuetext="${hp} of ${maxHp} HP"><div class="bar-fill-hp" style="width:${hpPercent}%"></div></div>

  <!-- AC & Proficiency -->
  <div class="bar-label" style="margin-top:8px">
    <span>AC ${ac}</span>
    <span>Prof. +${profBonus}</span>
    <span>${esc(char.currencyName)} ${currency}</span>
  </div>

  <!-- Stats -->
  <div class="stat-grid">
    ${statRows}
  </div>

  <!-- Equipment -->
  <div class="section-title">Equipment</div>
  <div class="equipment-row"><span class="equipment-label">Weapon: </span>${esc(char.equipment.weapon)}</div>
  <div class="equipment-row"><span class="equipment-label">Armour: </span>${esc(char.equipment.armour)}</div>

  <!-- Inventory -->
  <div class="section-title">Inventory (${char.inventory.length} item${char.inventory.length !== 1 ? 's' : ''})</div>
  <ul class="inv-list">
    ${inventoryRows || '<li class="inv-item"><span class="no-conditions">Empty</span></li>'}
  </ul>

  <!-- Conditions -->
  <div class="section-title">Conditions</div>
  <div>${conditionBadges}</div>

  <!-- XP bar -->
  <div class="bar-label" style="margin-top:12px"><span>XP</span><span>${xp} / ${xpForLevel}</span></div>
  <div class="char-bar-container" role="meter" aria-valuenow="${xpPercent}" aria-valuemin="0" aria-valuemax="100" aria-label="XP: ${xp} of ${xpForLevel}" aria-valuetext="${xp} of ${xpForLevel} XP"><div class="bar-fill-xp" style="width:${xpPercent}%"></div></div>

  <!-- Proficiencies -->
  <div class="section-title">Proficiencies</div>
  <div style="font-size:11px;color:var(--sta-text-secondary, #9AA0C0)">${char.proficiencies.length > 0 ? char.proficiencies.map(p => esc(p)).join(', ') : 'None'}</div>

  <!-- Abilities -->
  <div class="section-title">Abilities</div>
  <div style="font-size:11px;color:var(--sta-text-secondary, #9AA0C0)">${char.abilities.length > 0 ? char.abilities.map(a => esc(a)).join(', ') : 'None'}</div>
</div>`;

  // When called from scene.ts panel with empty styleName, return raw HTML
  if (!styleName) return html;
  return wrapInShadowDom({ styleName, inlineCss: CHARACTER_CSS, html });
}