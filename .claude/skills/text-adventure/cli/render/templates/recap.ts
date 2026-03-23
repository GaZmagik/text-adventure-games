// Session recap ("Previously on...") — character summary, location,
// recent quest status, last few rolls.

import type { GmState } from '../../types';

export function renderRecap(state: GmState | null, css: string, _options?: Record<string, unknown>): string {
  const char = state?.character;
  const room = state?.currentRoom ?? 'Unknown';
  const scene = state?.scene ?? 0;
  const time = state?.time;
  const quests = state?.quests ?? [];
  const rolls = state?.rollHistory ?? [];

  // Last 5 rolls
  const recentRolls = rolls.slice(-5).reverse();

  // Active quests
  const activeQuests = quests.filter(q => q.status === 'active');
  const completedQuests = quests.filter(q => q.status === 'completed');

  return `
<style>${css}
.widget-recap { font-family: var(--ta-font-body); padding: 16px; }
.recap-title { font-family: var(--ta-font-heading); font-size: 20px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px; }
.recap-subtitle { font-size: 12px; color: var(--color-text-tertiary); font-style: italic; margin-bottom: 16px; }
.recap-section { margin-bottom: 14px; }
.recap-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-text-tertiary); margin-bottom: 6px; }
.recap-char { display: flex; align-items: baseline; gap: 12px; font-size: 13px; color: var(--color-text-primary); }
.recap-char-name { font-weight: 700; }
.recap-char-meta { font-size: 11px; color: var(--color-text-tertiary); }
.recap-location { font-size: 13px; color: var(--ta-color-accent); }
.quest-item { padding: 4px 0; border-bottom: 0.5px solid var(--color-border-tertiary); font-size: 12px; }
.quest-title { color: var(--color-text-primary); font-weight: 600; }
.quest-status { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; margin-left: 8px; }
.quest-active { color: var(--ta-color-accent); }
.quest-completed { color: var(--ta-color-success); }
.roll-item { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; color: var(--color-text-secondary); border-bottom: 0.5px solid var(--color-border-tertiary); }
.roll-stat { font-weight: 600; color: var(--color-text-primary); }
.roll-outcome-success { color: var(--ta-color-success); }
.roll-outcome-failure { color: var(--ta-color-danger); }
</style>
<div class="widget-recap">
  <div class="recap-title">Previously on...</div>
  <div class="recap-subtitle">Session recap — Scene ${scene}</div>

  <div class="recap-section">
    <div class="recap-label">Character</div>
    ${char
      ? `<div class="recap-char">
          <span class="recap-char-name">${esc(char.name)}</span>
          <span class="recap-char-meta">${esc(char.class)} · Lv ${char.level} · HP ${char.hp}/${char.maxHp}</span>
        </div>`
      : '<div class="recap-char"><span class="recap-char-meta">No character data</span></div>'}
  </div>

  <div class="recap-section">
    <div class="recap-label">Location</div>
    <div class="recap-location">${esc(room)}</div>
    ${time ? `<div style="font-size:11px;color:var(--color-text-tertiary)">${esc(time.period)} — ${esc(time.date)}</div>` : ''}
  </div>

  ${activeQuests.length > 0 ? `
  <div class="recap-section">
    <div class="recap-label">Active Quests (${activeQuests.length})</div>
    ${activeQuests.map(q => `
      <div class="quest-item">
        <span class="quest-title">${esc(q.title)}</span>
        <span class="quest-status quest-active">${q.objectives.filter(o => o.completed).length}/${q.objectives.length} objectives</span>
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
      const outcomeClass = r.outcome.includes('success') ? 'roll-outcome-success' : 'roll-outcome-failure';
      return `<div class="roll-item">
        <span><span class="roll-stat">${esc(r.stat)}</span> ${r.type}</span>
        <span>${r.roll}+${r.modifier}=${r.total} vs DC ${r.dc} <span class="${outcomeClass}">${esc(r.outcome)}</span></span>
      </div>`;
    }).join('\n')}
  </div>` : ''}
</div>`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
