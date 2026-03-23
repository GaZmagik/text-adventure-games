// Pre-game settings panel — renders cards for rulebook, difficulty, pacing,
// visual style, modules. Accepts --data JSON with available options.
// Confirm button fires sendPrompt.

import type { GmState } from '../../types';

interface SettingsData {
  rulebooks?: string[];
  difficulties?: string[];
  pacingOptions?: string[];
  visualStyles?: string[];
  modules?: string[];
  defaults?: Record<string, string>;
}

export function renderSettings(state: GmState | null, css: string, options?: Record<string, unknown>): string {
  const raw = (options?.data ?? {}) as Record<string, unknown>;
  // Accept common field name aliases the GM might naturally use
  const data: SettingsData = {
    rulebooks: (raw.rulebooks ?? raw.rules) as string[] | undefined,
    difficulties: (raw.difficulties ?? raw.difficulty) as string[] | undefined,
    pacingOptions: (raw.pacingOptions ?? raw.pacing) as string[] | undefined,
    visualStyles: (raw.visualStyles ?? raw.styles) as string[] | undefined,
    modules: (raw.modules ?? raw.activeModules) as string[] | undefined,
    defaults: (raw.defaults ?? {}) as Record<string, string>,
  };

  const rulebooks = data.rulebooks ?? ['d20_system', 'gurps_lite', 'pf2e_lite', 'shadowrun_lite', 'narrative_engine', 'custom'];
  const difficulties = data.difficulties ?? ['easy', 'normal', 'hard', 'brutal'];
  const pacingOptions = data.pacingOptions ?? ['fast', 'normal', 'slow'];
  const visualStyles = data.visualStyles ?? ['station', 'terminal', 'parchment', 'neon', 'brutalist', 'art-deco', 'ink-wash', 'blueprint', 'stained-glass', 'sveltekit', 'weathered', 'holographic'];
  const modules = data.modules ?? ['save-codex', 'bestiary', 'story-architect', 'ship-systems', 'crew-manifest', 'star-chart', 'geo-map', 'procedural-world-gen', 'world-history', 'lore-codex', 'rpg-systems', 'ai-npc', 'atmosphere', 'audio', 'adventure-exporting'];
  const defaults = data.defaults ?? {};

  return `
<style>${css}
.widget-settings { font-family: var(--ta-font-body); padding: 16px; }
.settings-title { font-family: var(--ta-font-heading); font-size: 22px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px; }
.settings-subtitle { font-size: 12px; color: var(--color-text-tertiary); margin-bottom: 20px; }
.settings-section { margin-bottom: 16px; }
.settings-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-text-tertiary); margin-bottom: 8px; }
.option-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.option-card {
  padding: 8px 14px; border: 0.5px solid var(--color-border-tertiary);
  border-radius: 6px; font-size: 12px; color: var(--color-text-primary);
  cursor: pointer; background: transparent; transition: all 0.2s;
  text-transform: capitalize;
}
.option-card:hover { border-color: var(--ta-color-accent); background: var(--ta-color-accent-bg); }
.option-card.selected { border-color: var(--ta-color-accent); background: var(--ta-color-accent-bg); color: var(--ta-color-accent); font-weight: 600; }
.module-card { display: flex; align-items: center; gap: 8px; }
.module-check { width: 14px; height: 14px; border: 1px solid var(--color-border-tertiary); border-radius: 3px; display: inline-block; }
.module-check.checked { background: var(--ta-color-accent); border-color: var(--ta-color-accent); }
.confirm-btn {
  display: block; width: 100%; margin-top: 20px; padding: 12px;
  font-family: var(--ta-font-heading); font-size: 14px; font-weight: 700;
  background: var(--ta-color-accent); color: #fff; border: none;
  border-radius: 8px; cursor: pointer; text-transform: uppercase;
  letter-spacing: 0.08em; transition: background 0.2s;
}
.confirm-btn:hover { background: var(--ta-color-accent-hover); }
</style>
<div class="widget-settings">
  <div class="settings-title">Game Settings</div>
  <div class="settings-subtitle">Configure your adventure before beginning</div>

  <div class="settings-section">
    <div class="settings-label">Rulebook</div>
    <div class="option-grid" data-group="rulebook">
      ${rulebooks.map(r => `<button class="option-card${defaults.rulebook === r ? ' selected' : ''}" data-group="rulebook" data-value="${escAttr(r)}">${esc(r.replace(/_/g, ' '))}</button>`).join('\n      ')}
    </div>
  </div>

  <div class="settings-section">
    <div class="settings-label">Difficulty</div>
    <div class="option-grid" data-group="difficulty">
      ${difficulties.map(d => `<button class="option-card${defaults.difficulty === d ? ' selected' : ''}" data-group="difficulty" data-value="${escAttr(d)}">${esc(d)}</button>`).join('\n      ')}
    </div>
  </div>

  <div class="settings-section">
    <div class="settings-label">Pacing</div>
    <div class="option-grid" data-group="pacing">
      ${pacingOptions.map(p => `<button class="option-card${defaults.pacing === p ? ' selected' : ''}" data-group="pacing" data-value="${escAttr(p)}">${esc(p)}</button>`).join('\n      ')}
    </div>
  </div>

  <div class="settings-section">
    <div class="settings-label">Visual Style</div>
    <div class="option-grid" data-group="visualStyle">
      ${visualStyles.map(v => `<button class="option-card${defaults.visualStyle === v ? ' selected' : ''}" data-group="visualStyle" data-value="${escAttr(v)}">${esc(v)}</button>`).join('\n      ')}
    </div>
  </div>

  <div class="settings-section">
    <div class="settings-label">Optional Modules</div>
    <div class="option-grid" data-group="modules">
      ${modules.map(m => `<button class="option-card module-card" data-group="modules" data-value="${escAttr(m)}"><span class="module-check"></span>${esc(m)}</button>`).join('\n      ')}
    </div>
  </div>

  <button class="confirm-btn" id="settings-confirm">Begin Adventure</button>
</div>
<script>
(function() {
  var selections = ${JSON.stringify(defaults)};
  var selectedModules = [];

  // Single-select groups
  document.querySelectorAll('.option-card:not(.module-card)').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var group = this.getAttribute('data-group');
      var value = this.getAttribute('data-value');
      selections[group] = value;
      // Update UI
      document.querySelectorAll('[data-group="' + group + '"]').forEach(function(b) {
        b.classList.remove('selected');
      });
      this.classList.add('selected');
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
      } else {
        selectedModules.push(value);
        check.classList.add('checked');
      }
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

function esc(s: string | undefined | null): string {
  if (!s) return "";
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escAttr(s: string | undefined | null): string {
  if (!s) return "";
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
