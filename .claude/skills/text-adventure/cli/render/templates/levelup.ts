// Level-up notification — congratulations banner, new HP,
// new proficiency bonus if applicable, ability options.

import type { GmState } from '../../types';

export function renderLevelup(state: GmState | null, css: string, options?: Record<string, unknown>): string {
  const char = state?.character;
  const newLevel = char?.level ?? 1;
  const prevLevel = newLevel - 1;

  // Proficiency bonus thresholds (d20 system)
  const profBonusForLevel = (lvl: number): number => Math.ceil(lvl / 4) + 1;
  const oldProf = profBonusForLevel(prevLevel);
  const newProf = profBonusForLevel(newLevel);
  const profChanged = newProf > oldProf;

  // Optional ability options passed via options.data
  const abilityOptions = (options?.data as { abilities?: string[] })?.abilities ?? [];

  return `
<style>${css}
.widget-levelup { font-family: var(--ta-font-body); padding: 24px; text-align: center; }
.levelup-banner {
  font-family: var(--ta-font-heading); font-size: 24px; font-weight: 700;
  color: var(--ta-color-accent); margin-bottom: 8px;
}
.levelup-subtitle { font-size: 14px; color: var(--color-text-secondary); margin-bottom: 16px; }
.levelup-stats { display: flex; justify-content: center; gap: 24px; margin: 16px 0; }
.levelup-stat { text-align: center; }
.levelup-stat-label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-text-tertiary); }
.levelup-stat-value { display: block; font-size: 22px; font-weight: 700; color: var(--color-text-primary); }
.levelup-prof-change {
  display: inline-block; padding: 6px 14px; margin: 8px 0;
  background: var(--ta-color-accent-bg); color: var(--ta-color-accent);
  border-radius: 8px; font-size: 12px; font-weight: 600;
}
.ability-options { margin-top: 16px; }
.ability-card {
  display: inline-block; padding: 8px 16px; margin: 4px;
  border: 0.5px solid var(--color-border-tertiary); border-radius: 6px;
  font-size: 12px; color: var(--color-text-primary); cursor: pointer;
  background: transparent; transition: border-color 0.2s;
}
.ability-card:hover { border-color: var(--ta-color-accent); }
</style>
<div class="widget-levelup">
  <div class="levelup-banner">Level Up!</div>
  <div class="levelup-subtitle">${char ? esc(char.name) : 'Adventurer'} has reached level ${newLevel}</div>

  <div class="levelup-stats">
    <div class="levelup-stat">
      <span class="levelup-stat-label">Level</span>
      <span class="levelup-stat-value">${newLevel}</span>
    </div>
    <div class="levelup-stat">
      <span class="levelup-stat-label">HP</span>
      <span class="levelup-stat-value">${char?.hp ?? '?'} / ${char?.maxHp ?? '?'}</span>
    </div>
    <div class="levelup-stat">
      <span class="levelup-stat-label">Prof. Bonus</span>
      <span class="levelup-stat-value">+${newProf}</span>
    </div>
  </div>

  ${profChanged ? `<div class="levelup-prof-change">Proficiency bonus increased: +${oldProf} → +${newProf}</div>` : ''}

  ${abilityOptions.length > 0 ? `
  <div class="ability-options">
    <div style="font-size:11px;color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Choose an ability</div>
    ${abilityOptions.map(a => `<button class="ability-card" data-prompt="I choose the ${escapeAttr(a)} ability">${esc(a)}</button>`).join('\n    ')}
  </div>
  <script>
  document.querySelectorAll('.ability-card[data-prompt]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var prompt = this.getAttribute('data-prompt');
      if (typeof sendPrompt === 'function') sendPrompt(prompt);
    });
  });
  <\/script>` : ''}
</div>`;
}

function esc(s: string | undefined | null): string {
  if (!s) return "";
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
