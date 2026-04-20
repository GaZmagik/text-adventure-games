// Scene widget — emits a <ta-scene> custom element with inner HTML content.
// The component wraps the narrative, panels, and footer in a Shadow DOM
// with CDN-hosted CSS and scripts.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { VERSION } from '../../lib/version';
import { renderFooter } from './footer';
import { renderLevelup } from './levelup';
import { renderCharacter } from './character';
import { renderCodex } from './codex';
import { renderShip } from './ship';
import { renderCrew } from './crew';
import { renderStarchart } from './starchart';
import { renderMap } from './map';
import { MODULE_PANEL_MAP } from '../../lib/module-panel-map';
import { emitRootCustomElement } from '../lib/shadow-wrapper';
import { CDN_BASE } from '../../../assets/cdn-manifest.ts';
import { renderHpPips } from '../lib/svg-pips';
import { LEVEL_REWARDS } from '../../data/xp-tables';
import { proficiencyBonus } from '../../lib/modifier';

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

  // Compose the footer
  const footerHtml = renderFooter(state, '', options);

  // Build inner HTML content — this will be lifted into the Shadow DOM by TaScene
  const innerHtml = `<div class="root" data-poi-budget="${char?.poiMax ?? 2}">
  <!-- Progressive reveal -->
  <div id="reveal-brief">
    <p class="brief-text"><!-- [BRIEF: Replace with 1-2 atmospheric sentences that hook the player before they click Continue] --></p>
    <button class="continue-btn" id="continue-reveal-btn">Continue</button>
  </div>
  <div id="reveal-full" style="display:none">
    <div id="scene-content">
      <div class="loc-bar">
        <span class="loc-name">${esc(room)}</span>
        ${time ? `<span class="loc-time">${esc(time.period)} — ${esc(time.date)}</span>` : ''}
      </div>
      <div class="atmo-strip">
        <span class="atmo-pill">The scene unfolds before you...</span>
      </div>
      <ta-tts></ta-tts>
      ${buildNarrativePhases(options)}
      <!-- [ACTIONS: Insert POI buttons and action cards here.
           Each button MUST use <strong class="btn-title"> for the title:

           POI:    <button class="poi-btn" data-poi="id" data-prompt="..." title="..."><strong class="btn-title">Title</strong>Description text.</button>
           Action: <button class="action-btn" data-prompt="..." title="..."><strong class="btn-title">Title</strong>Description text.</button>

           tag verify will reject buttons without <strong> title structure.] -->
      <div class="status-bar">
        ${char ? `${renderHpPips(Number(char.hp) || 0, Number(char.maxHp) || 0)}
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
      ${state?._levelupPending ? `<div class="panel-content" data-panel="levelup">${renderLevelup(state, '')}</div>` : ''}
      ${panelDivs}
    </div>
  </div>
  <!-- Scene metadata (hidden, machine-readable) -->
  <div id="scene-meta" style="display:none" data-meta="${esc(sceneMeta)}"></div>
  <!-- Footer -->
  ${footerHtml}
</div>`;

  const cssUrls = [styleName, 'scene-design'].filter(Boolean);
  const jsUrls = ['ta-components', 'tag-scene'];
  if (modules.includes('audio')) {
    jsUrls.unshift('tag-soundscape');
  }

  return emitRootCustomElement({
    tag: 'ta-scene',
    html: innerHtml,
    attrs: {
      'data-room': room,
      'data-scene': String(scene),
      'data-scene-meta': sceneMeta,
    },
    cssUrls,
    jsUrls,
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
      `<li class="quest-objective">`
      + `${o.completed ? '✓' : '○'} ${esc(o.description)}</li>`,
    ).join('');
    return `<div class="quest-card">`
      + `<div class="quest-card-header">`
      + `<span class="quest-title">${esc(q.title)}</span>`
      + `<span class="quest-progress">${pct}%</span></div>`
      + `<ul class="quest-objectives">${objectives}</ul></div>`;
  }).join('');
  return `<div class="panel-quests">`
    + `<div class="quests-title">Quests</div>`
    + rows + '</div>';
}



/** Build narrative section — single div for phases≤1, wrapped phase divs for multi-phase. */
function buildNarrativePhases(options?: Record<string, unknown>): string {
  const phases = Number(options?.phases) || 1;
  if (phases <= 1) {
    return `<div id="narrative" class="narrative">
        <p><!-- Narrative content rendered by the GM --></p>
      </div>`;
  }
  const parts: string[] = [];
  for (let i = 1; i <= phases; i++) {
    const hidden = i > 1 ? ' style="display:none"' : '';
    const continueBtn = i < phases
      ? `\n        <button class="continue-btn phase-continue" data-reveal-phase="${i + 1}">Continue</button>`
      : '';
    parts.push(`<div class="scene-phase" data-phase="${i}"${hidden}>
        <div class="narrative">
          <!-- [NARRATIVE: Phase ${i}] -->
        </div>${continueBtn}
      </div>`);
  }
  return parts.join('\n      ');
}
