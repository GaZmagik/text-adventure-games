// Pre-game settings panel — renders cards for rulebook, difficulty, pacing,
// visual style, modules. Accepts --data JSON with available options.
// Confirm button fires sendPrompt.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { COMMON_WIDGET_CSS } from '../lib/common-css';

type SettingsData = {
  rulebooks?: string[] | undefined;
  difficulties?: string[] | undefined;
  pacingOptions?: string[] | undefined;
  visualStyles?: string[] | undefined;
  modules?: string[] | undefined;
  defaults?: Record<string, string> | undefined;
};

export function renderSettings(state: GmState | null, css: string, options?: Record<string, unknown>): string {
  const raw = (options?.data ?? {}) as Record<string, unknown>;

  // Safely extract string[] fields — guard against non-array values from untrusted JSON
  const toStringArray = (v: unknown): string[] | undefined =>
    Array.isArray(v) ? v as string[] : undefined;

  // Accept common field name aliases the GM might naturally use
  const data: SettingsData = {
    rulebooks: toStringArray(raw.rulebooks ?? raw.rules),
    difficulties: toStringArray(raw.difficulties ?? raw.difficulty),
    pacingOptions: toStringArray(raw.pacingOptions ?? raw.pacing),
    visualStyles: toStringArray(raw.visualStyles ?? raw.styles),
    modules: toStringArray(raw.modules ?? raw.activeModules),
    defaults: (raw.defaults !== null && typeof raw.defaults === 'object' && !Array.isArray(raw.defaults))
      ? raw.defaults as Record<string, string>
      : {},
  };

  const rulebooks = data.rulebooks ?? ['d20_system', 'gurps_lite', 'pf2e_lite', 'shadowrun_lite', 'narrative_engine', 'custom'];
  const difficulties = data.difficulties ?? ['easy', 'normal', 'hard', 'brutal'];
  const pacingOptions = data.pacingOptions ?? ['fast', 'normal', 'slow'];
  const visualStyles = data.visualStyles ?? ['station', 'terminal', 'parchment', 'neon', 'brutalist', 'art-deco', 'ink-wash', 'blueprint', 'stained-glass', 'sveltekit', 'weathered', 'holographic'];
  const modules = data.modules ?? ['save-codex', 'bestiary', 'story-architect', 'ship-systems', 'crew-manifest', 'star-chart', 'geo-map', 'procedural-world-gen', 'world-history', 'lore-codex', 'rpg-systems', 'ai-npc', 'atmosphere', 'audio', 'adventure-exporting'];
  const defaults = data.defaults ?? {};

  return `
<style>${css}
${COMMON_WIDGET_CSS}
.widget-settings { font-family: var(--ta-font-body); padding: 16px; }
.option-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.option-card {
  padding: 8px 14px; border: 0.5px solid var(--color-border-tertiary);
  border-radius: 6px; font-size: 12px; color: var(--color-text-primary);
  cursor: pointer; background: transparent; transition: all 0.2s;
  text-transform: capitalize;
  min-height: 44px; box-sizing: border-box;
}
.option-card:hover { border-color: var(--ta-color-accent); background: var(--ta-color-accent-bg); }
.option-card:focus-visible { outline: 2px solid var(--ta-color-focus, #4ECDC4); outline-offset: 2px; }
.option-card.selected { border-color: var(--ta-color-accent); background: var(--ta-color-accent-bg); color: var(--ta-color-accent); font-weight: 600; }
.module-card { display: flex; align-items: center; gap: 8px; }
.module-check { width: 14px; height: 14px; border: 1px solid var(--color-border-tertiary); border-radius: 3px; display: inline-block; }
.module-check.checked { background: var(--ta-color-accent); border-color: var(--ta-color-accent); }
</style>
<div class="widget-settings">
  <div class="widget-title">Game Settings</div>
  <div class="widget-subtitle">Configure your adventure before beginning</div>

  <div class="widget-section">
    <div class="widget-label">Rulebook</div>
    <div class="option-grid" data-group="rulebook" role="radiogroup">
      ${rulebooks.map(r => `<button class="option-card${defaults.rulebook === r ? ' selected' : ''}" data-group="rulebook" data-value="${esc(r)}" role="radio" aria-checked="${defaults.rulebook === r ? 'true' : 'false'}">${esc(r.replace(/_/g, ' '))}</button>`).join('\n      ')}
    </div>
  </div>

  <div class="widget-section">
    <div class="widget-label">Difficulty</div>
    <div class="option-grid" data-group="difficulty" role="radiogroup">
      ${difficulties.map(d => `<button class="option-card${defaults.difficulty === d ? ' selected' : ''}" data-group="difficulty" data-value="${esc(d)}" role="radio" aria-checked="${defaults.difficulty === d ? 'true' : 'false'}">${esc(d)}</button>`).join('\n      ')}
    </div>
  </div>

  <div class="widget-section">
    <div class="widget-label">Pacing</div>
    <div class="option-grid" data-group="pacing" role="radiogroup">
      ${pacingOptions.map(p => `<button class="option-card${defaults.pacing === p ? ' selected' : ''}" data-group="pacing" data-value="${esc(p)}" role="radio" aria-checked="${defaults.pacing === p ? 'true' : 'false'}">${esc(p)}</button>`).join('\n      ')}
    </div>
  </div>

  <div class="widget-section">
    <div class="widget-label">Visual Style</div>
    <div class="option-grid" data-group="visualStyle" role="radiogroup">
      ${visualStyles.map(v => `<button class="option-card${defaults.visualStyle === v ? ' selected' : ''}" data-group="visualStyle" data-value="${esc(v)}" role="radio" aria-checked="${defaults.visualStyle === v ? 'true' : 'false'}">${esc(v)}</button>`).join('\n      ')}
    </div>
  </div>

  <div class="widget-section">
    <div class="widget-label">Optional Modules</div>
    <div class="option-grid" data-group="modules">
      ${modules.map(m => `<button class="option-card module-card" data-group="modules" data-value="${esc(m)}" aria-pressed="false"><span class="module-check"></span>${esc(m)}</button>`).join('\n      ')}
    </div>
  </div>

  <button class="confirm-btn" id="settings-confirm" title="Begin adventure with the selected settings">Begin Adventure</button>
</div>
<script>
(function() {
  var selections = ${JSON.stringify(defaults).replace(/[<>&'\u2028\u2029]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))};
  var selectedModules = [];

  // Single-select groups
  document.querySelectorAll('.option-card:not(.module-card)').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var group = this.getAttribute('data-group');
      var value = this.getAttribute('data-value');
      selections[group] = value;
      // Update UI — re-query bounded card set (max ~12 nodes) — standard radio-card deselection pattern
      document.querySelectorAll('.option-card[data-group="' + group + '"]').forEach(function(b) {
        b.classList.remove('selected');
        b.setAttribute('aria-checked', 'false');
      });
      this.classList.add('selected');
      this.setAttribute('aria-checked', 'true');
    });
  });

  // Multi-select modules
  document.querySelectorAll('.module-card').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var value = this.getAttribute('data-value');
      var check = this.querySelector('.module-check');
      var idx = selectedModules.indexOf(value);
      if (idx >= 0) {
        selectedModules.splice(idx, 1);
        check.classList.remove('checked');
        this.classList.remove('selected');
      } else {
        selectedModules.push(value);
        check.classList.add('checked');
        this.classList.add('selected');
      }
      this.setAttribute('aria-pressed', this.classList.contains('selected') ? 'true' : 'false');
    });
  });

  document.getElementById('settings-confirm').addEventListener('click', function() {
    selections.modules = selectedModules;
    var prompt = 'Begin adventure with settings: ' + JSON.stringify(selections);
    if (typeof sendPrompt === 'function') sendPrompt(prompt);
  });
})();
<\/script>`;
}
