// Scenario selection cards — accepts --data JSON with scenario list.
// Each card has title, description, genre pills. Select button fires sendPrompt.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { COMMON_WIDGET_CSS } from '../lib/common-css';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

type Scenario = {
  title: string;
  description?: string;
  hook?: string;           // Alias for description (scenarios module uses 'hook')
  genre?: string[];
  genres?: string[];       // Alias for genre (common variant)
  difficulty?: string;
  players?: string;
  tags?: string[];
  modules?: string;
};

export function renderScenarioSelect(_state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  const raw = (options?.data ?? {}) as Record<string, unknown>;
  const scenarios: Scenario[] = Array.isArray(raw.scenarios) ? raw.scenarios as Scenario[] : [];

  const cards = scenarios.map((scenario) => {
    const desc = scenario.description ?? scenario.hook ?? '';
    const rawGenres = scenario.genres ?? scenario.genre ?? [];
    const genres = Array.isArray(rawGenres) ? rawGenres : [rawGenres];
    const genrePills = genres.map(g =>
      `<span class="genre-pill">${esc(g)}</span>`,
    ).join(' ');

    return `
      <div class="scenario-card">
        <div class="scenario-title">${esc(scenario.title)}</div>
        <div class="scenario-desc">${esc(desc)}</div>
        ${genrePills ? `<div class="scenario-genres">${genrePills}</div>` : ''}
        <div class="scenario-meta">
          ${scenario.difficulty ? `<span class="scenario-diff">Difficulty: ${esc(scenario.difficulty)}</span>` : ''}
          ${scenario.players ? `<span class="scenario-players">${esc(scenario.players)} players</span>` : ''}
        </div>
        <button class="scenario-select-btn" data-prompt="I choose scenario: ${esc(scenario.title)}" title="I choose scenario: ${esc(scenario.title)}">Select</button>
      </div>`;
  }).join('\n');

  return wrapInShadowDom({
    styleName,
    inlineCss: `${COMMON_WIDGET_CSS}
.widget-scenario-select { font-family: var(--ta-font-body); padding: 16px; }
.scenario-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.scenario-card {
  padding: 16px; border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4));
  border-radius: 8px; transition: border-color 0.2s;
}
.scenario-card:hover { border-color: var(--ta-color-accent); }
.scenario-title { font-family: var(--ta-font-heading); font-size: 16px; font-weight: 700; color: var(--sta-text-primary, #EEF0FF); margin-bottom: 6px; }
.scenario-desc { font-size: 12px; line-height: 1.5; color: var(--sta-text-secondary, #9AA0C0); margin-bottom: 10px; }
.scenario-genres { margin-bottom: 8px; }
.genre-pill {
  display: inline-block; padding: 2px 8px; font-size: 10px;
  border-radius: 10px; background: var(--ta-color-accent-bg);
  color: var(--ta-color-accent); margin-right: 4px; text-transform: capitalize;
}
.scenario-meta { font-size: 10px; color: var(--sta-text-tertiary, #545880); margin-bottom: 10px; }
.scenario-meta span { margin-right: 12px; }
.scenario-diff { text-transform: capitalize; }
.scenario-select-btn {
  display: block; width: 100%; padding: 8px;
  font-family: var(--ta-font-body); font-size: 12px; font-weight: 600;
  background: transparent; border: 0.5px solid var(--ta-color-accent);
  border-radius: 6px; color: var(--ta-color-accent); cursor: pointer;
  text-transform: uppercase; letter-spacing: 0.08em; transition: all 0.2s;
  min-height: 44px; box-sizing: border-box;
}
.scenario-select-btn:hover { background: var(--ta-color-accent); color: var(--ta-btn-primary-text, #fff); }
.scenario-select-btn:focus-visible { outline: 2px solid var(--ta-color-focus); outline-offset: 2px; }
.empty-scenarios { font-size: 13px; color: var(--sta-text-tertiary, #545880); text-align: center; padding: 40px; }
@media (prefers-reduced-motion: reduce) {
  .scenario-card, .scenario-select-btn { transition: none; }
}`,
    html: `<div class="widget-scenario-select">
  <div class="widget-title">Choose Your Scenario</div>
  <div class="widget-subtitle">Select an adventure to begin</div>

  ${scenarios.length > 0 ? `
  <div class="scenario-grid">
    ${cards}
  </div>` : `<div class="empty-scenarios">
  <p>No scenarios provided. Use the --data flag:</p>
  <pre style="text-align:left;font-size:11px;color:var(--sta-text-secondary, #9AA0C0);margin-top:12px;white-space:pre-wrap;word-break:break-word;">tag render scenario-select --style station --data '${esc(JSON.stringify({scenarios:[{title:"Cold Freight",hook:"Your section of the generation ship has been sealed off.",genres:["survival","mystery"],difficulty:"normal"},{title:"The Grit Anvil",hook:"The drill hit something that is not rock.",genres:["horror","blue-collar"],difficulty:"normal"}]}, null, 2))}'</pre>
  <p style="margin-top:8px;font-size:11px;">Fields: title (required), hook or description, genres or genre, difficulty, tags, modules</p>
</div>`}
</div>`,
    script: `function sendOrCopyPrompt(btn, prompt) {
  btn.setAttribute('title', prompt);
  if (typeof sendPrompt === 'function') {
    sendPrompt(prompt);
  } else {
    var ta = document.createElement('textarea');
    var copied = false;
    ta.value = prompt;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try {
      copied = !!document.execCommand('copy');
    } catch (_err) {
      copied = false;
    }
    document.body.removeChild(ta);
    var orig = btn.textContent;
    btn.textContent = copied ? 'Copied! Paste as your reply.' : 'Copy the prompt from the tooltip.';
    setTimeout(function() { btn.textContent = orig; }, 3000);
  }
}

shadow.querySelectorAll('.scenario-select-btn[data-prompt]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var prompt = this.getAttribute('data-prompt');
    sendOrCopyPrompt(this, prompt);
  });
});`,
  });
}
