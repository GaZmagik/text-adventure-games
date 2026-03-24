// Character stat panel — name, class, level, HP bar, stats with modifiers,
// inventory list, conditions, XP bar.

import type { GmState, StatName } from '../../types';
import { esc } from '../../lib/html';
import { XP_THRESHOLDS } from '../../data/xp-tables';

const STAT_ORDER: StatName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export function renderCharacter(state: GmState | null, css: string, _options?: Record<string, unknown>): string {
  const char = state?.character;

  if (!char) {
    return `
${css ? '<style>' + css + '</style>' : ''}
<div class="widget-character">
  <p class="empty-state">No character data available.</p>
</div>`;
  }

  const hpPercent = char.maxHp > 0 ? Math.round((char.hp / char.maxHp) * 100) : 0;
  const nextThreshold = XP_THRESHOLDS.find(t => t.level === char.level + 1);
  const xpForLevel = nextThreshold?.xp ?? XP_THRESHOLDS[XP_THRESHOLDS.length - 1].xp;
  const xpPercent = xpForLevel > 0 ? Math.min(100, Math.round((char.xp / xpForLevel) * 100)) : 0;

  const statRows = STAT_ORDER.map(s => {
    const mod = char.modifiers[s];
    const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
    const isProficient = char.proficiencies.includes(s);
    return `<div class="stat-cell${isProficient ? ' proficient' : ''}">
        <span class="stat-label">${s}</span>
        <span class="stat-value">${char.stats[s]}</span>
        <span class="stat-mod">${modStr}</span>
      </div>`;
  }).join('\n      ');

  const inventoryRows = char.inventory.map(item =>
    `<li class="inv-item"><span class="inv-name">${esc(item.name)}</span> <span class="inv-type">${esc(item.type)}</span> <span class="inv-slots">${item.slots} slot${item.slots !== 1 ? 's' : ''}</span></li>`,
  ).join('\n        ');

  const conditionBadges = char.conditions.length > 0
    ? char.conditions.map(c => `<span class="condition-badge">${esc(c)}</span>`).join(' ')
    : '<span class="no-conditions">None</span>';

  return `
<style>${css}
.widget-character { font-family: var(--ta-font-body); padding: 16px; }
.char-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 12px; }
.char-name { font-family: var(--ta-font-heading); font-size: 20px; font-weight: 700; color: var(--color-text-primary); }
.char-class { font-size: 12px; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.08em; }
.bar-container { width: 100%; height: 10px; background: var(--color-border-tertiary); border-radius: 5px; overflow: hidden; margin: 4px 0; }
.bar-fill-hp { height: 100%; background: var(--ta-color-success); border-radius: 5px; transition: width 0.3s; }
.bar-fill-xp { height: 100%; background: var(--ta-color-xp); border-radius: 5px; transition: width 0.3s; }
.bar-label { font-size: 11px; color: var(--color-text-tertiary); display: flex; justify-content: space-between; }
.stat-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin: 12px 0; text-align: center; }
.stat-cell { padding: 8px 4px; border: 0.5px solid var(--color-border-tertiary); border-radius: 6px; }
.stat-cell.proficient { border-color: var(--ta-color-accent); }
.stat-label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-text-tertiary); }
.stat-value { display: block; font-size: 18px; font-weight: 700; color: var(--color-text-primary); }
.stat-mod { display: block; font-size: 11px; color: var(--ta-color-accent); }
.section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-text-tertiary); margin: 14px 0 6px; }
.inv-list { list-style: none; padding: 0; margin: 0; }
.inv-item { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 0.5px solid var(--color-border-tertiary); font-size: 12px; }
.inv-name { color: var(--color-text-primary); }
.inv-type { color: var(--color-text-tertiary); font-size: 10px; text-transform: uppercase; }
.inv-slots { color: var(--color-text-tertiary); font-size: 10px; }
.condition-badge { display: inline-block; padding: 2px 8px; font-size: 10px; border-radius: 10px; background: var(--ta-color-warning-bg); color: var(--ta-color-warning); margin-right: 4px; }
.no-conditions { font-size: 11px; color: var(--color-text-tertiary); }
.equipment-row { font-size: 12px; color: var(--color-text-secondary); margin: 2px 0; }
.equipment-label { color: var(--color-text-tertiary); text-transform: uppercase; font-size: 10px; letter-spacing: 0.06em; }
</style>
<div class="widget-character">
  <div class="char-header">
    <span class="char-name">${esc(char.name)}</span>
    <span class="char-class">${esc(char.class)} · Lv ${char.level}</span>
  </div>

  <!-- HP bar -->
  <div class="bar-label"><span>HP</span><span>${char.hp} / ${char.maxHp}</span></div>
  <div class="bar-container" role="meter" aria-valuenow="${hpPercent}" aria-valuemin="0" aria-valuemax="100" aria-label="HP: ${char.hp} of ${char.maxHp}"><div class="bar-fill-hp" style="width:${hpPercent}%"></div></div>

  <!-- AC & Proficiency -->
  <div class="bar-label" style="margin-top:8px">
    <span>AC ${char.ac}</span>
    <span>Prof. +${char.proficiencyBonus}</span>
    <span>${esc(char.currencyName)} ${char.currency}</span>
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
  <div class="bar-label" style="margin-top:12px"><span>XP</span><span>${char.xp} / ${xpForLevel}</span></div>
  <div class="bar-container" role="meter" aria-valuenow="${xpPercent}" aria-valuemin="0" aria-valuemax="100" aria-label="XP: ${char.xp} of ${xpForLevel}"><div class="bar-fill-xp" style="width:${xpPercent}%"></div></div>

  <!-- Proficiencies -->
  <div class="section-title">Proficiencies</div>
  <div style="font-size:11px;color:var(--color-text-secondary)">${char.proficiencies.length > 0 ? char.proficiencies.map(p => esc(p)).join(', ') : 'None'}</div>

  <!-- Abilities -->
  <div class="section-title">Abilities</div>
  <div style="font-size:11px;color:var(--color-text-secondary)">${char.abilities.length > 0 ? char.abilities.map(a => esc(a)).join(', ') : 'None'}</div>
</div>`;
}