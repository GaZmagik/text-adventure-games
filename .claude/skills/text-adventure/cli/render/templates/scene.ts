// Scene widget — full scene skeleton with progressive reveal, panel overlay,
// scene-meta hidden div, and composed footer. This is the main game widget.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { VERSION } from '../../lib/version';
import { renderFooter } from './footer';
import { renderCharacter } from './character';
import { renderCodex } from './codex';
import { renderShip } from './ship';
import { renderCrew } from './crew';
import { renderStarchart } from './starchart';
import { renderMap } from './map';
import { MODULE_PANEL_MAP } from '../../lib/module-panel-map';
import { wrapInShadowDom } from '../lib/shadow-wrapper';
import { CDN_BASE } from '../../../assets/cdn-manifest.ts';

export function renderScene(state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  const char = state?.character;
  const room = state?.currentRoom ?? 'Unknown Location';
  const scene = Number(state?.scene) || 0;
  const time = state?.time;
  const modules = state?.modulesActive ?? [];

  // Build scene-meta JSON
  const sceneMeta = JSON.stringify({
    skill_version: VERSION,
    arc: state?.arc ?? 1,
    theme: state?.theme ?? 'fantasy',
    mode: 'procedural',
    scene,
    type: 'exploration',
    location: room,
    time: time ? {
      period: time.period,
      date: time.date,
      elapsed: time.elapsed,
      hour: time.hour,
    } : null,
    modules_active: modules,
    npcs_present: [],
    threads_advanced: [],
    pending_rolls: [],
  });

  // Build panel-content divs for active modules — pre-populated from state
  const panelDivs = buildPanelDivs(modules, state);

  // Compose the footer (without its own <style> — we include CSS once at the top)
  const footerHtml = renderFooter(state, '', options);

  return wrapInShadowDom({
    styleName,
    inlineCss: `#panel-overlay { display: none; padding: 0; }
.panel-header {
  display: flex; align-items: baseline; justify-content: space-between;
  padding-bottom: 10px; margin-bottom: 12px;
  border-bottom: 0.5px solid var(--color-border-tertiary);
}
.panel-title {
  font-family: var(--ta-font-heading);
  font-size: 18px; font-weight: 600; color: var(--color-text-primary);
}
.panel-close-btn {
  font-family: var(--ta-font-body);
  font-size: 11px; letter-spacing: 0.08em;
  background: transparent; border: 0.5px solid var(--color-border-tertiary);
  border-radius: var(--border-radius-md); padding: 8px 14px;
  min-height: 44px; min-width: 44px; box-sizing: border-box;
  color: var(--color-text-tertiary); cursor: pointer;
}
.panel-close-btn:hover { border-color: var(--color-border-secondary); color: var(--color-text-secondary); }
.panel-content { display: none; }`,
    html: `<div class="root">
  <!-- Progressive reveal -->
  <div id="reveal-brief">
    <p class="brief-text">Scene ${scene}: You find yourself in ${esc(room)}.</p>
    <button class="continue-btn" id="continue-reveal-btn">Continue</button>
  </div>
  <div id="reveal-full" style="display:none">
    <div id="scene-content">
      <div class="loc-bar">
        <span class="loc-name">${esc(room)}</span>
        ${time ? `<span class="loc-time">${esc(time.period)} — ${esc(time.date)}</span>` : ''}
      </div>
      <div class="atmo-strip">
        <span class="atmo-visual">The scene unfolds before you...</span>
      </div>
      <div id="narrative">
        <p><!-- Narrative content rendered by the GM --></p>
      </div>
      <div class="status-bar">
        ${char ? `<span class="hp-display">HP ${Number(char.hp) || 0}/${Number(char.maxHp) || 0}</span>
        <span class="ac-display">AC ${Number(char.ac) || 0}</span>
        <span class="level-display">Lv ${Number(char.level) || 0}</span>` : ''}
      </div>
    </div>
    <div id="panel-overlay" role="dialog" aria-modal="true" aria-labelledby="panel-title-text" style="display:none">
      <div class="panel-header">
        <h2 class="panel-title" id="panel-title-text" tabindex="-1"></h2>
        <button class="panel-close-btn" id="panel-close-btn" aria-label="Close panel">Close</button>
      </div>
      <div class="panel-content" data-panel="character">${renderCharacter(state, '')}</div>
      ${panelDivs}
    </div>
  </div>
  <!-- Scene metadata (hidden, machine-readable) -->
  <div id="scene-meta" style="display:none" data-meta="${esc(sceneMeta)}"></div>
  <!-- Footer -->
  ${footerHtml}
</div>`,
    scriptSrc: [
      CDN_BASE + '/js/tag-soundscape.js',
      CDN_BASE + '/js/tag-scene.js',
    ],
    script: 'initTagScene(shadow);',
  });
}

/** Panel renderer registry — maps panel name to template function. */
type PanelRenderer = (state: GmState | null, css: string) => string;
const PANEL_RENDERERS: Record<string, PanelRenderer> = {
  codex: renderCodex,
  ship: renderShip,
  crew: renderCrew,
  nav: renderStarchart,
  map: renderMap,
};

/** Build panel-content divs for active modules — pre-populated from state. */
function buildPanelDivs(modules: string[], state: GmState | null): string {
  return modules
    .filter(m => m in MODULE_PANEL_MAP)
    .map(m => {
      const panel = MODULE_PANEL_MAP[m]!;
      const renderer = PANEL_RENDERERS[panel];
      if (renderer) {
        return `<div class="panel-content" data-panel="${panel}">${renderer(state, '')}</div>`;
      }
      if (panel === 'quests') {
        return `<div class="panel-content" data-panel="quests">${renderQuestsPanel(state)}</div>`;
      }
      return `<div class="panel-content" data-panel="${panel}"></div>`;
    })
    .join('\n      ');
}

/** Inline quests panel — no standalone template exists for this panel type. */
function renderQuestsPanel(state: GmState | null): string {
  const quests = state?.quests ?? [];
  if (quests.length === 0) {
    return '<div class="panel-quests"><p class="empty-state">No active quests.</p></div>';
  }
  const rows = quests.map(q => {
    let done = 0;
    for (const o of q.objectives) if (o.completed) done++;
    const total = q.objectives.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const objectives = q.objectives.map(o =>
      `<li style="font-size:11px;color:var(--color-text-secondary);padding:2px 0">`
      + `${o.completed ? '✓' : '○'} ${esc(o.description)}</li>`,
    ).join('');
    return `<div style="padding:10px;margin-bottom:8px;border:0.5px solid var(--color-border-tertiary);border-radius:6px">`
      + `<div style="display:flex;justify-content:space-between;align-items:center">`
      + `<span style="font-size:13px;font-weight:600;color:var(--color-text-primary)">${esc(q.title)}</span>`
      + `<span style="font-size:10px;color:var(--color-text-tertiary)">${pct}%</span></div>`
      + `<ul style="list-style:none;padding:0;margin:4px 0 0">${objectives}</ul></div>`;
  }).join('');
  return `<div class="panel-quests" style="font-family:var(--ta-font-body);padding:16px">`
    + `<div style="font-family:var(--ta-font-heading);font-size:18px;font-weight:700;color:var(--color-text-primary);margin-bottom:12px">Quests</div>`
    + rows + '</div>';
}
