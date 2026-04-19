// Pre-game settings panel — renders cards for rulebook, difficulty, pacing,
// visual style, modules. Accepts --data JSON with available options.
// Confirm button fires sendPrompt.

import type { GmState } from '../../types';
import { esc, serialiseInlineScriptData } from '../../lib/html';
import { COMMON_WIDGET_CSS } from '../lib/common-css';
import { PREGAME_DESIGN_CSS, renderHero, renderControlDeck, renderSubpanel, renderSummaryRow } from '../lib/pregame-design';
import { wrapInShadowDom } from '../lib/shadow-wrapper';
import { SEND_OR_COPY_PROMPT_JS } from '../lib/send-prompt';

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

  const toStringArray = (v: unknown): string[] | undefined => {
    if (!Array.isArray(v)) return undefined;
    return v.map((el: unknown) => {
      if (typeof el === 'string') return el;
      if (el && typeof el === 'object' && 'id' in el && typeof (el as Record<string, unknown>).id === 'string') return (el as Record<string, unknown>).id as string;
      if (el && typeof el === 'object' && 'label' in el && typeof (el as Record<string, unknown>).label === 'string') return (el as Record<string, unknown>).label as string;
      if (el && typeof el === 'object' && 'name' in el && typeof (el as Record<string, unknown>).name === 'string') return (el as Record<string, unknown>).name as string;
      return String(el);
    });
  };

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

  const DEFAULT_RULEBOOKS = ['d20_system', 'dnd_5e', 'gurps_lite', 'pf2e_lite', 'shadowrun_lite', 'narrative_engine', 'custom'];
  const DEFAULT_DIFFICULTIES = ['easy', 'normal', 'hard', 'brutal'];
  const DEFAULT_PACING = ['fast', 'normal', 'slow'];
  const DEFAULT_STYLES = ['station', 'terminal', 'parchment', 'neon', 'brutalist', 'art-deco', 'ink-wash', 'blueprint', 'stained-glass', 'sveltekit', 'weathered', 'holographic'];
  const TIER1_MODULES = ['gm-checklist', 'prose-craft', 'core-systems', 'die-rolls', 'character-creation', 'save-codex', 'arc-patterns'];
  const DEFAULT_MODULES = [...TIER1_MODULES, 'bestiary', 'story-architect', 'ship-systems', 'crew-manifest', 'star-chart', 'geo-map', 'procedural-world-gen', 'world-history', 'lore-codex', 'rpg-systems', 'ai-npc', 'atmosphere', 'audio', 'adventure-exporting', 'pre-generated-characters', 'genre-mechanics', 'scenarios', 'adventure-authoring'];

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

  // ── Hero ───────────────────────────────────────────────────────
  const heroHtml = renderHero({
    heading: 'Game Settings',
    copy: 'Configure your adventure before beginning. Choose a rulebook, difficulty, pacing, visual style, and optional modules.',
  });

  // ── Control deck summary ───────────────────────────────────────
  const summaryTitle = defaults.rulebook
    ? defaults.rulebook.replace(/_/g, ' ')
    : 'Unconfigured';

  const summaryRows = [
    renderSummaryRow('Rulebook', defaults.rulebook?.replace(/_/g, ' ')),
    renderSummaryRow('Difficulty', defaults.difficulty),
    renderSummaryRow('Pacing', defaults.pacing),
    renderSummaryRow('Style', defaults.visualStyle),
  ].join('\n');

  const deckHtml = renderControlDeck({
    kicker: 'Active profile',
    heading: 'Configuration',
    selectedTitle: summaryTitle,
    statusId: 'pd-sel-status',
    actionHtml: `<div class="pd-summary-list">${summaryRows}</div>`,
  });

  // ── Option group helper ────────────────────────────────────────
  const optionGrid = (group: string, items: string[]) =>
    items.map(v =>
      `<button class="option-card${defaults[group] === v ? ' selected' : ''}" data-group="${esc(group)}" data-value="${esc(v)}" aria-pressed="${defaults[group] === v ? 'true' : 'false'}">${esc(v.replace(/_/g, ' '))}</button>`,
    ).join('\n      ');

  const moduleGrid = modules.map(m => {
    const isTier1 = TIER1_MODULES.includes(m);
    return isTier1
      ? `<button class="option-card module-card selected" data-group="modules" data-value="${esc(m)}" aria-pressed="true" disabled style="opacity:0.7;cursor:default;"><span class="module-check checked"></span>${esc(m)} (required)</button>`
      : `<button class="option-card module-card" data-group="modules" data-value="${esc(m)}" aria-pressed="false"><span class="module-check"></span>${esc(m)}</button>`;
  }).join('\n      ');

  // ── Subpanels ──────────────────────────────────────────────────
  const rulebookPanel = renderSubpanel({
    kicker: 'Core system',
    title: 'Rulebook',
    copy: 'Choose the resolution system for your adventure.',
    contentHtml: `<div class="option-grid" data-group="rulebook">${optionGrid('rulebook', rulebooks)}</div>`,
  });

  const difficultyPanel = renderSubpanel({
    kicker: 'Challenge',
    title: 'Difficulty',
    contentHtml: `<div class="option-grid" data-group="difficulty">${optionGrid('difficulty', difficulties)}</div>`,
  });

  const pacingPanel = renderSubpanel({
    kicker: 'Tempo',
    title: 'Pacing',
    contentHtml: `<div class="option-grid" data-group="pacing">${optionGrid('pacing', pacingOptions)}</div>`,
  });

  const stylePanel = renderSubpanel({
    kicker: 'Presentation',
    title: 'Visual Style',
    contentHtml: `<div class="option-grid" data-group="visualStyle">${optionGrid('visualStyle', visualStyles)}</div>`,
  });

  const modulesPanel = renderSubpanel({
    kicker: 'Extensions',
    title: 'Optional Modules',
    copy: 'Tier 1 modules are always active. Toggle additional modules below.',
    contentHtml: `<div class="option-grid" data-group="modules">${moduleGrid}</div>`,
  });

  return wrapInShadowDom({
    styleName,
    inlineCss: `${COMMON_WIDGET_CSS}\n${PREGAME_DESIGN_CSS}\n${SETTINGS_CSS}`,
    html: `<div class="widget-settings">
  ${heroHtml}
  ${deckHtml}

  ${rulebookPanel}
  ${difficultyPanel}
  ${pacingPanel}
  ${stylePanel}
  ${modulesPanel}

  <button class="confirm-btn" id="settings-confirm" title="Begin adventure with the selected settings">Begin Adventure</button>
</div>`,
    script: `var selections = ${serialiseInlineScriptData(defaults)};
var selectedModules = [];

${SEND_OR_COPY_SCRIPT}

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

    var selTitle = shadow.getElementById('pd-sel-title');
    if (selTitle) {
      var parts = [];
      if (selections.rulebook) parts.push(selections.rulebook.replace(/_/g, ' '));
      if (selections.difficulty) parts.push(selections.difficulty);
      selTitle.textContent = parts.length > 0 ? parts.join(' / ') : 'Unconfigured';
    }
    var selStatus = shadow.getElementById('pd-sel-status');
    if (selStatus) selStatus.textContent = group.replace(/([A-Z])/g, ' $1').trim() + ' set to ' + value.replace(/_/g, ' ');
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
  var tier1 = ['gm-checklist','prose-craft','core-systems','die-rolls','character-creation','save-codex'];
  var allModules = tier1.slice();
  selectedModules.forEach(function(m) { if (allModules.indexOf(m) < 0) allModules.push(m); });
  selections.modules = allModules;
  var cmds = ['state set visualStyle ' + (selections.visualStyle || 'station')];
  if (selections.rulebook) cmds.push('state set worldFlags.rulebook ' + selections.rulebook);
  cmds.push('state set modulesActive ' + JSON.stringify(allModules));
  var prompt = 'Begin adventure with settings: ' + JSON.stringify(selections)
    + '\\nRequired: tag batch --commands "' + cmds.join('; ') + '"';
  sendOrCopyPrompt(this, prompt);
});`,
  });
}

// ── Constants ──────────────────────────────────────────────────────

const SETTINGS_CSS = `
.widget-settings { font-family: var(--ta-font-body); padding: 16px; }
.pd-summary-list { display: grid; gap: 2px; min-width: 160px; }
.module-card { display: flex; align-items: center; gap: 8px; }
.module-check { width: 16px; height: 16px; border: 1.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 10px; color: transparent; }
.module-check.checked { background: var(--ta-color-accent, #4ECDC4); border-color: var(--ta-color-accent, #4ECDC4); color: #fff; }
.module-check.checked::after { content: '\\2713'; }`;

const SEND_OR_COPY_SCRIPT = SEND_OR_COPY_PROMPT_JS;
