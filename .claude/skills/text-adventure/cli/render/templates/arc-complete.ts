// Arc-complete widget — end-of-act boundary with summary, stats, and
// save/export/continue action buttons.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { wrapInShadowDom } from '../lib/shadow-wrapper';
import { SEND_OR_COPY_PROMPT_JS } from '../lib/send-prompt';

export function renderArcComplete(state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  const arc = state?.arc ?? 1;
  const char = state?.character;
  const quests = state?.quests ?? [];
  const completedQuests = quests.filter(q => q.status === 'completed').length;
  const totalQuests = quests.length;
  const rollCount = state?.rollHistory?.length ?? 0;
  const scene = state?.scene ?? 0;

  const rawData = options?.data;
  const dataSummary = (rawData !== null && typeof rawData === 'object' && !Array.isArray(rawData))
    ? (rawData as Record<string, unknown>).summary
    : undefined;
  const summaryText = typeof dataSummary === 'string' ? dataSummary : '';

  return wrapInShadowDom({
    styleName,
    inlineCss: `.widget-arc-complete { font-family: var(--ta-font-body); padding: 24px; text-align: center; }
.arc-heading { font-family: var(--ta-font-heading); font-size: 24px; font-weight: 700; color: var(--sta-text-primary, #EEF0FF); margin-bottom: 8px; }
.arc-subtitle { font-size: 13px; color: var(--sta-text-tertiary, #545880); margin-bottom: 20px; }
.arc-summary { font-family: var(--sta-font-serif, Georgia, serif); font-size: 14px; color: var(--sta-text-secondary, #9AA0C0); line-height: 1.6; margin-bottom: 24px; font-style: italic; max-width: 480px; margin-left: auto; margin-right: auto; }
.arc-stats { display: flex; justify-content: center; gap: 24px; margin-bottom: 28px; flex-wrap: wrap; }
.arc-stat-card { padding: 12px 16px; border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); border-radius: 8px; min-width: 80px; }
.arc-stat-value { font-size: 22px; font-weight: 700; color: var(--ta-color-accent); display: block; }
.arc-stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--sta-text-tertiary, #545880); }
.arc-actions { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
.arc-action-btn {
  padding: 12px 24px; font-size: 13px; font-weight: 600;
  border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); border-radius: 8px;
  background: transparent; color: var(--sta-text-primary, #EEF0FF);
  cursor: pointer; transition: all 0.2s; min-height: 44px;
}
.arc-action-btn:hover { border-color: var(--ta-color-accent); background: var(--ta-color-accent-bg); }
.arc-action-btn:focus-visible { outline: 2px solid var(--ta-color-focus); outline-offset: 2px; }
.arc-action-primary { border-color: var(--ta-color-accent); color: var(--ta-color-accent); }
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0s !important; animation-duration: 0s !important; }
}`,
    html: `<div class="widget-arc-complete">
  <div class="arc-heading">Act ${arc} Complete</div>
  <div class="arc-subtitle">${char ? `${esc(char.name)} · Level ${Number(char.level) || 1} ${esc(char.class)}` : `${scene} scenes`}</div>
  ${summaryText ? `<div class="arc-summary">${esc(summaryText)}</div>` : ''}
  <div class="arc-stats">
    <div class="arc-stat-card"><span class="arc-stat-value">${scene}</span><span class="arc-stat-label">Scenes</span></div>
    <div class="arc-stat-card"><span class="arc-stat-value">${completedQuests}/${totalQuests}</span><span class="arc-stat-label">Quests</span></div>
    <div class="arc-stat-card"><span class="arc-stat-value">${rollCount}</span><span class="arc-stat-label">Rolls</span></div>
    ${char ? `<div class="arc-stat-card"><span class="arc-stat-value">Lv ${Number(char.level) || 1}</span><span class="arc-stat-label">Level</span></div>` : ''}
  </div>
  <div class="arc-actions">
    <button class="arc-action-btn" data-prompt="Generate my save file as a downloadable .save.md file following the exact format in modules/save-codex.md." title="Generate my save file as a downloadable .save.md file following the exact format in modules/save-codex.md.">Save Game</button>
    <button class="arc-action-btn" data-prompt="Generate a .lore.md world export using tag export generate. Include all NPCs, factions, quests, and world state." title="Generate a .lore.md world export using tag export generate. Include all NPCs, factions, quests, and world state.">Export World</button>
    <button class="arc-action-btn arc-action-primary" data-prompt="Begin Act ${esc(String(arc + 1))}. Carry forward character progression, faction standings, and world consequences. Run tag state set arc ${esc(String(arc + 1))} then render the next act opener." title="Begin Act ${esc(String(arc + 1))}. Carry forward character progression, faction standings, and world consequences.">Continue to Act ${esc(String(arc + 1))}</button>
  </div>
</div>`,
    script: `${SEND_OR_COPY_PROMPT_JS}

shadow.querySelectorAll('.arc-action-btn[data-prompt]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var prompt = this.getAttribute('data-prompt');
    sendOrCopyPrompt(this, prompt);
  });
});`,
  });
}
