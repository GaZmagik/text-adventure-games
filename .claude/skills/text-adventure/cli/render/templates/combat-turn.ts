// Combat outcome display — reads _lastComputation for attack roll, damage,
// hit/miss result, NPC HP change. Parameterised for combatant count via options.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { outcomeBadgeStyle } from '../lib/outcome-badge';

export function renderCombatTurn(state: GmState | null, css: string, options?: Record<string, unknown>): string {
  const comp = state?._lastComputation;
  const char = state?.character;

  // Narrow computation type for safe field access
  const compHasStatFields = comp && (comp.type === 'contested_roll' || comp.type === 'hazard_save');

  // Computation fields — with discriminated union narrowing and numeric coercion
  const stat = (compHasStatFields ? comp.stat : comp?.stat) ?? 'STR';
  const roll = Number(comp?.roll) || 0;
  const modifier = Number(comp?.modifier) || 0;
  const total = Number(comp?.total) || 0;
  const rawDc = compHasStatFields ? comp.dc : undefined;
  const dc = rawDc !== undefined ? (Number.isFinite(Number(rawDc)) ? Number(rawDc) : undefined) : undefined;
  const outcome = comp?.outcome ?? 'unknown';
  const npcId = comp?.npcId;
  const context = comp?.context as Record<string, unknown> | undefined;

  // Try to find NPC from roster
  const npc = npcId
    ? state?.rosterMutations.find(n => n.id === npcId)
    : null;

  // Damage info from context (if available) — coerce to safe numeric
  const rawDamage = context?.damage;
  const damage = rawDamage !== undefined && Number.isFinite(Number(rawDamage)) ? Number(rawDamage) : undefined;
  const damageType = context?.damageType as string | undefined;

  const isHit = outcome === 'success' || outcome === 'critical_success';
  const isCrit = outcome === 'critical_success' || outcome === 'critical_failure';

  const badge = outcomeBadgeStyle(outcome);
  const badgeBg = badge.bg;
  const badgeText = badge.text;
  const badgeBorder = badge.border;

  const outcomeLabel = isHit ? (isCrit ? 'Critical Hit!' : 'Hit') : (isCrit ? 'Critical Miss' : 'Miss');
  const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;

  // Combatant count for multi-target display — coerce to safe numeric
  const combatantCount = Number.isFinite(Number(options?.combatantCount)) ? Number(options?.combatantCount) : 1;

  return `
<style>${css}
.widget-combat { font-family: var(--ta-font-body); padding: 16px; }
.combat-title { font-family: var(--ta-font-heading); font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 12px; text-align: center; }
.combat-participants { display: flex; justify-content: space-around; align-items: center; margin-bottom: 16px; }
.combatant { text-align: center; }
.combatant-name { font-size: 13px; font-weight: 700; color: var(--color-text-primary); }
.combatant-hp { font-size: 11px; color: var(--color-text-tertiary); margin-top: 2px; }
.vs-divider { font-size: 18px; font-weight: 700; color: var(--color-text-tertiary); }
.combat-roll { text-align: center; margin: 12px 0; }
.roll-breakdown { font-size: 20px; font-weight: 700; color: var(--color-text-primary); }
.roll-val { color: var(--ta-color-accent); }
.roll-mod { font-size: 14px; color: var(--color-text-secondary); }
.roll-total { font-size: 24px; }
.combat-dc { font-size: 11px; color: var(--color-text-tertiary); margin-top: 4px; }
.combat-outcome {
  display: inline-block; padding: 6px 18px; border-radius: 12px;
  font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
  margin: 8px 0;
}
.combat-damage { text-align: center; margin-top: 12px; padding: 10px; border: 0.5px solid var(--color-border-tertiary); border-radius: 6px; }
.damage-value { font-size: 22px; font-weight: 700; color: var(--ta-color-danger); }
.damage-type { font-size: 11px; color: var(--color-text-tertiary); text-transform: capitalize; }
.npc-hp-change { font-size: 12px; color: var(--color-text-secondary); margin-top: 6px; }
.combat-bar-container { width: 100%; height: 8px; background: var(--color-border-tertiary); border-radius: 4px; overflow: hidden; margin-top: 4px; }
.hp-bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
.hp-bar-npc { background: var(--ta-color-danger); }
</style>
<div class="widget-combat">
  <div class="combat-title">Combat${combatantCount > 1 ? ` (${combatantCount} combatants)` : ''}</div>

  <div class="combat-participants">
    <div class="combatant">
      <div class="combatant-name">${char ? esc(char.name) : 'Player'}</div>
      ${char ? `<div class="combatant-hp">HP ${Number(char.hp) || 0}/${Number(char.maxHp) || 0}</div>` : ''}
    </div>
    <div class="vs-divider">vs</div>
    <div class="combatant">
      <div class="combatant-name">${npc ? esc(npc.name) : 'Enemy'}</div>
      ${npc ? `<div class="combatant-hp">HP ${Number(npc.hp) || 0}/${Number(npc.maxHp) || 0}</div>` : ''}
    </div>
  </div>

  <!-- Attack roll -->
  <div class="combat-roll">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-tertiary);margin-bottom:4px">${esc(stat)} Attack</div>
    <div class="roll-breakdown">
      <span class="roll-val">${roll}</span>
      <span class="roll-mod">${modStr}</span>
      <span style="color:var(--color-text-tertiary)">=</span>
      <span class="roll-total">${total}</span>
    </div>
    ${dc !== undefined ? `<div class="combat-dc">vs AC ${dc}</div>` : ''}
  </div>

  <!-- Outcome badge -->
  <div style="text-align:center">
    <div class="combat-outcome" style="background:${badgeBg};color:${badgeText};border:1.5px solid ${badgeBorder}">
      ${esc(outcomeLabel)}
    </div>
  </div>

  <!-- Damage (if hit) -->
  ${isHit && damage !== undefined ? `
  <div class="combat-damage">
    <div class="damage-value">${isCrit ? damage * 2 : damage} damage${isCrit ? ' (critical)' : ''}</div>
    ${damageType ? `<div class="damage-type">${esc(damageType)}</div>` : ''}
    ${npc ? `
    <div class="npc-hp-change">${esc(npc.name)}: ${Number(npc.hp) || 0}/${Number(npc.maxHp) || 0} HP</div>
    <div class="combat-bar-container">
      <div class="hp-bar-fill hp-bar-npc" style="width:${Number(npc.maxHp) > 0 ? Math.max(0, Math.round((Number(npc.hp) / Number(npc.maxHp)) * 100)) : 0}%"></div>
    </div>` : ''}
  </div>` : ''}

  ${!isHit ? `
  <div style="text-align:center;font-size:12px;color:var(--color-text-tertiary);margin-top:8px;font-style:italic">
    The attack goes wide.
  </div>` : ''}
</div>`;
}