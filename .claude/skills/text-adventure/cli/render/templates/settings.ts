// Pre-game settings panel — renders cards for rulebook, difficulty, pacing,
// visual style, modules. Accepts --data JSON with available options.
// Confirm button fires sendPrompt.

import type { GmState } from '../../types';
import { esc, serialiseInlineScriptData } from '../../lib/html';
import { COMMON_WIDGET_CSS } from '../lib/common-css';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

type SettingsData = {
  rulebooks?: string[] | undefined;
  difficulties?: string[] | undefined;
  pacingOptions?: string[] | undefined;
  visualStyles?: string[] | undefined;
  modules?: string[] | undefined;
  defaults?: Record<string, string> | undefined;
};

export function renderSettings(_state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  const raw = (options?.data ?? {}) as Record<string, unknown>;

  // Safely extract string[] fields — guard against non-array values from untrusted JSON.
  // If the GM passes objects like {id, label, desc}, extract the id or label as the string value.
  const toStringArray = (v: unknown): string[] | undefined => {
    if (!Array.isArray(v)) return undefined;
    return v.map((el: unknown) => {
      if (typeof el === 'string') return el;
      if (el && typeof el === 'object' && 'id' in el && typeof (el as Record<string, unknown>).id === 'string') return (el as Record<string, unknown>).id as string;
      if (el && typeof el === 'object' && 'label' in el && typeof (el as Record<string, unknown>).label === 'string') return (el as Record<string, unknown>).label as string;
      return String(el);
    });
  };

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

  // Full default option sets — GM-provided subsets are backfilled from these
  // so the player always sees the complete menu regardless of what the GM remembered
  const DEFAULT_RULEBOOKS = ['d20_system', 'dnd_5e', 'gurps_lite', 'pf2e_lite', 'shadowrun_lite', 'narrative_engine', 'custom'];
  const DEFAULT_DIFFICULTIES = ['easy', 'normal', 'hard', 'brutal'];
  const DEFAULT_PACING = ['fast', 'normal', 'slow'];
  const DEFAULT_STYLES = ['station', 'terminal', 'parchment', 'neon', 'brutalist', 'art-deco', 'ink-wash', 'blueprint', 'stained-glass', 'sveltekit', 'weathered', 'holographic'];
  const TIER1_MODULES = ['gm-checklist', 'prose-craft', 'core-systems', 'die-rolls', 'character-creation', 'save-codex'];
  const DEFAULT_MODULES = [...TIER1_MODULES, 'bestiary', 'story-architect', 'ship-systems', 'crew-manifest', 'star-chart', 'geo-map', 'procedural-world-gen', 'world-history', 'lore-codex', 'rpg-systems', 'ai-npc', 'atmosphere', 'audio', 'adventure-exporting'];

  /** Merge GM-provided options with defaults — GM's picks first, then any missing defaults appended. */
  const merge = (provided: string[] | undefined, defaults: string[]): string[] => {
    if (!provided) return defaults;
    const seen = new Set(provided);
    return [...provided, ...defaults.filter(d => !seen.has(d))];
  };

  const rulebooks = merge(data.rulebooks, DEFAULT_RULEBOOKS);
  const difficulties = merge(data.difficulties, DEFAULT_DIFFICULTIES);
  const pacingOptions = merge(data.pacingOptions, DEFAULT_PACING);
  const visualStyles = merge(data.visualStyles, DEFAULT_STYLES);
  const modules = merge(data.modules, DEFAULT_MODULES);
  const defaults = data.defaults ?? {};

  return wrapInShadowDom({
    styleName,
    inlineCss: `${COMMON_WIDGET_CSS}
.widget-settings { font-family: var(--ta-font-body); padding: 16px; }
.module-card { display: flex; align-items: center; gap: 8px; }
.module-check { width: 16px; height: 16px; border: 1.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 10px; color: transparent; }
.module-check.checked { background: var(--ta-color-accent, #4ECDC4); border-color: var(--ta-color-accent, #4ECDC4); color: #fff; }
.module-check.checked::after { content: '\u2713'; }`,
    html: `<div class="widget-settings">
  <div class="widget-title">Game Settings</div>
  <div class="widget-subtitle">Configure your adventure before beginning</div>

  <fieldset class="widget-section">
    <legend class="widget-label">Rulebook</legend>
    <div class="option-grid" data-group="rulebook">
      ${rulebooks.map(r => `<button class="option-card${defaults.rulebook === r ? ' selected' : ''}" data-group="rulebook" data-value="${esc(r)}" aria-pressed="${defaults.rulebook === r ? 'true' : 'false'}">${esc(r.replace(/_/g, ' '))}</button>`).join('\n      ')}
    </div>
  </fieldset>

  <fieldset class="widget-section">
    <legend class="widget-label">Difficulty</legend>
    <div class="option-grid" data-group="difficulty">
      ${difficulties.map(d => `<button class="option-card${defaults.difficulty === d ? ' selected' : ''}" data-group="difficulty" data-value="${esc(d)}" aria-pressed="${defaults.difficulty === d ? 'true' : 'false'}">${esc(d)}</button>`).join('\n      ')}
    </div>
  </fieldset>

  <fieldset class="widget-section">
    <legend class="widget-label">Pacing</legend>
    <div class="option-grid" data-group="pacing">
      ${pacingOptions.map(p => `<button class="option-card${defaults.pacing === p ? ' selected' : ''}" data-group="pacing" data-value="${esc(p)}" aria-pressed="${defaults.pacing === p ? 'true' : 'false'}">${esc(p)}</button>`).join('\n      ')}
    </div>
  </fieldset>

  <fieldset class="widget-section">
    <legend class="widget-label">Visual Style</legend>
    <div class="option-grid" data-group="visualStyle">
      ${visualStyles.map(v => `<button class="option-card${defaults.visualStyle === v ? ' selected' : ''}" data-group="visualStyle" data-value="${esc(v)}" aria-pressed="${defaults.visualStyle === v ? 'true' : 'false'}">${esc(v)}</button>`).join('\n      ')}
    </div>
  </fieldset>

  <fieldset class="widget-section">
    <legend class="widget-label">Optional Modules</legend>
    <div class="option-grid" data-group="modules">
      ${modules.map(m => {
        const isTier1 = TIER1_MODULES.includes(m);
        return isTier1
          ? `<button class="option-card module-card selected" data-group="modules" data-value="${esc(m)}" aria-pressed="true" disabled style="opacity:0.7;cursor:default;"><span class="module-check checked"></span>${esc(m)} (required)</button>`
          : `<button class="option-card module-card" data-group="modules" data-value="${esc(m)}" aria-pressed="false"><span class="module-check"></span>${esc(m)}</button>`;
      }).join('\n      ')}
    </div>
  </fieldset>

  <button class="confirm-btn" id="settings-confirm" title="Begin adventure with the selected settings">Begin Adventure</button>
</div>`,
    script: `var selections = ${serialiseInlineScriptData(defaults)};
var selectedModules = [];

if (Array.isArray(selections.modulesActive)) {
  selections.modulesActive.forEach(function(mod) {
    var btn = shadow.querySelector('.module-card[data-value="' + mod + '"]');
    if (btn) {
      selectedModules.push(mod);
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
      var check = btn.querySelector('.module-check');
      if (check) check.classList.add('checked');
    }
  });
}

shadow.querySelectorAll('.option-card:not(.module-card)').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var group = this.getAttribute('data-group');
    var value = this.getAttribute('data-value');
    selections[group] = value;
    shadow.querySelectorAll('.option-card[data-group="' + group + '"]').forEach(function(b) {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed', 'false');
    });
    this.classList.add('selected');
    this.setAttribute('aria-pressed', 'true');
  });
});

shadow.querySelectorAll('.module-card').forEach(function(btn) {
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

shadow.getElementById('settings-confirm').addEventListener('click', function() {
  // Always include Tier 1 modules regardless of player selection
  var tier1 = ['gm-checklist','prose-craft','core-systems','die-rolls','character-creation','save-codex'];
  var allModules = tier1.slice();
  selectedModules.forEach(function(m) { if (allModules.indexOf(m) < 0) allModules.push(m); });
  selections.modules = allModules;
  var cmds = ['state set visualStyle ' + (selections.visualStyle || 'station')];
  if (selections.rulebook) cmds.push('state set worldFlags.rulebook ' + selections.rulebook);
  cmds.push('state set modulesActive ' + JSON.stringify(allModules));
  var prompt = 'Begin adventure with settings: ' + JSON.stringify(selections)
    + '\\nRequired: tag batch --commands "' + cmds.join('; ') + '"';
  if (typeof sendPrompt === 'function') sendPrompt(prompt);
});`,
  });
}
