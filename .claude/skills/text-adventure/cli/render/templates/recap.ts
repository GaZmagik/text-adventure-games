// Session recap ("Previously on...") — character summary, location,
// recent quest status, last few rolls.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

const SUCCESS_OUTCOMES = new Set(['success', 'narrow_success', 'critical_success', 'decisive_success']);

export function renderRecap(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  const char = state?.character;
  const room = state?.currentRoom ?? 'Unknown';
  const scene = Number(state?.scene) || 0;
  const time = state?.time;
  const quests = state?.quests ?? [];
  const rolls = state?.rollHistory ?? [];

  // Last 5 rolls
  const recentRolls = rolls.slice(-5).reverse();

  // Active quests
  const activeQuests: typeof quests = [];
  const completedQuests: typeof quests = [];
  for (const q of quests) {
    if (q.status === 'active') activeQuests.push(q);
    else if (q.status === 'completed') completedQuests.push(q);
  }

  return wrapInShadowDom({
    styleName,
    inlineCss: `.widget-recap { font-family: var(--ta-font-body); padding: 16px; }
.recap-title { font-family: var(--ta-font-heading); font-size: 20px; font-weight: 700; color: var(--sta-text-primary, #EEF0FF); margin-bottom: 4px; }
.recap-subtitle { font-size: 12px; color: var(--sta-text-tertiary, #545880); font-style: italic; margin-bottom: 16px; }
.recap-section { margin-bottom: 14px; }
.recap-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--sta-text-tertiary, #545880); margin-bottom: 6px; }
.recap-char { display: flex; align-items: baseline; gap: 12px; font-size: 13px; color: var(--sta-text-primary, #EEF0FF); }
.recap-char-name { font-weight: 700; }
.recap-char-meta { font-size: 11px; color: var(--sta-text-tertiary, #545880); }
.recap-location { font-size: 13px; color: var(--ta-color-accent); }
.quest-item { padding: 4px 0; border-bottom: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); font-size: 12px; }
.quest-title { color: var(--sta-text-primary, #EEF0FF); font-weight: 600; }
.quest-status { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; margin-left: 8px; }
.quest-active { color: var(--ta-color-accent); }
.quest-completed { color: var(--ta-color-success); }
.roll-item { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; color: var(--sta-text-secondary, #9AA0C0); border-bottom: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); }
.roll-stat { font-weight: 600; color: var(--sta-text-primary, #EEF0FF); }
.roll-outcome-success { color: var(--ta-color-success); }
.roll-outcome-failure { color: var(--ta-color-danger); }`,
    html: `<div class="widget-recap">
  <div class="recap-title">Previously on...</div>
  <div class="recap-subtitle">Session recap — Scene ${scene}</div>

  <div class="recap-section">
    <div class="recap-label">Character</div>
    ${char
      ? `<div class="recap-char">
          <span class="recap-char-name">${esc(char.name)}</span>
          <span class="recap-char-meta">${esc(char.class)} · Lv ${Number(char.level) || 0} · HP ${Number(char.hp) || 0}/${Number(char.maxHp) || 0}</span>
        </div>`
      : '<div class="recap-char"><span class="recap-char-meta">No character data</span></div>'}
  </div>

  <div class="recap-section">
    <div class="recap-label">Location</div>
    <div class="recap-location">${esc(room)}</div>
    ${time ? `<div style="font-size:11px;color:var(--sta-text-tertiary, #545880)">${esc(time.period)} — ${esc(time.date)}</div>` : ''}
  </div>

  ${activeQuests.length > 0 ? `
  <div class="recap-section">
    <div class="recap-label">Active Quests (${activeQuests.length})</div>
    ${activeQuests.map(q => `
      <div class="quest-item">
        <span class="quest-title">${esc(q.title)}</span>
        <span class="quest-status quest-active">${q.objectives.reduce((n, o) => n + (o.completed ? 1 : 0), 0)}/${q.objectives.length} objectives</span>
      </div>`).join('\n')}
  </div>` : ''}

  ${completedQuests.length > 0 ? `
  <div class="recap-section">
    <div class="recap-label">Completed Quests (${completedQuests.length})</div>
    ${completedQuests.map(q => `
      <div class="quest-item">
        <span class="quest-title">${esc(q.title)}</span>
        <span class="quest-status quest-completed">Complete</span>
      </div>`).join('\n')}
  </div>` : ''}

  ${recentRolls.length > 0 ? `
  <div class="recap-section">
    <div class="recap-label">Recent Rolls</div>
    ${recentRolls.map(r => {
      const outcomeClass = SUCCESS_OUTCOMES.has(r.outcome) ? 'roll-outcome-success' : 'roll-outcome-failure';
      const isEncounter = r.type === 'encounter_roll';
      const label = isEncounter
        ? `<span class="roll-stat">Encounter</span>`
        : `<span class="roll-stat">${esc(r.stat ?? '')}</span> ${esc(r.type)}`;
      const breakdown = isEncounter
        ? `Roll: ${Number(r.roll) || 0} \u2192 <span class="${outcomeClass}">${esc(r.outcome)}</span>`
        : `${Number(r.roll) || 0}+${Number(r.modifier) || 0}=${Number(r.total) || 0} vs DC ${Number(r.dc) || 0} <span class="${outcomeClass}">${esc(r.outcome)}</span>`;
      return `<div class="roll-item">
        <span>${label}</span>
        <span>${breakdown}</span>
      </div>`;
    }).join('\n')}
  </div>` : ''}
</div>`,
  });
}