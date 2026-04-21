import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { MODULE_PANEL_MAP } from '../../lib/module-panel-map';
import { emitRootCustomElement, emitStandaloneCustomElement } from '../lib/shadow-wrapper';
import { renderCharacter } from './character';
import { renderCodex } from './codex';
import { renderCrew } from './crew';
import { renderShip } from './ship';
import { renderMap } from './map';
import { renderStarchart } from './starchart';
import { renderLevelup } from './levelup';
import { renderFooter } from './footer';
import { renderHpPips } from '../lib/svg-pips';

const ACTION_PLACEHOLDER = `<!-- [ACTIONS: Insert POI buttons and action cards here.
           Each button MUST use <strong class="btn-title"> for the title:

           POI:    <button class="poi-btn" data-poi="id" data-prompt="..." title="..."><strong class="btn-title">Title</strong>Description text.</button>
           Action: <button class="action-btn" data-prompt="..." title="..."><strong class="btn-title">Title</strong>Description text.</button>

           tag verify will reject buttons without <strong> title structure.] -->`;

/**
 * Renders the primary in-game scene widget.
 * 
 * @param {GmState | null} state - Current game state.
 * @param {string} styleName - Visual style.
 * @param {Record<string, unknown>} [options] - Optional data (e.g., actions, phases).
 * @returns {string} - The HTML wrapped in a <ta-scene> custom element.
 */
export function renderScene(state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  if (!state) {
    const html = `<div class="widget-scene"><p class="empty-state">No active scene.</p></div>`;
    return emitStandaloneCustomElement({ tag: 'ta-scene', styleName, html });
  }

  const { scene, character: char } = state;
  const location = state.currentRoom || 'Unknown Sector';
  const timeLabel = state.time ? `${state.time.period} | ${state.time.date}` : '';

  const data = (options?.data ?? {}) as Record<string, unknown>;
  const narrative = typeof data.text === 'string' ? data.text : '';
  const actions = Array.isArray(data.actions) ? data.actions : [];
  const atmosphere = Array.isArray(data.atmosphere)
    ? data.atmosphere.map(value => String(value)).filter(Boolean)
    : [];
  const brief = typeof data.brief === 'string' ? data.brief : '';

  const phases = Number(options?.phases) || 1;
  const narrativeHtml = buildNarrativeHtml(narrative, phases);

  const sceneMeta = JSON.stringify({
    scene,
    location,
    modules_active: state.modulesActive ?? [],
    turn: state._turnCount ?? 0,
    timestamp: new Date().toISOString(),
  });

  const jsUrls = ['ta-components', 'tag-scene'];
  if (state.modulesActive?.includes('audio')) {
    jsUrls.push('tag-soundscape');
  }

  const cssUrls = [styleName, 'common-widget', 'scene-design'];
  const panels = ['character'];
  if (state._levelupPending) panels.push('levelup');
  for (const moduleId of state.modulesActive ?? []) {
    const panel = MODULE_PANEL_MAP[moduleId];
    if (panel && !panels.includes(panel)) panels.push(panel);
  }

  return emitRootCustomElement({
    tag: 'ta-scene',
    html: `
      <div class="root widget-scene" data-poi-budget="${esc(char?.poiMax ?? 2)}">
        <div id="reveal-brief">
          <p class="brief-text">${brief ? esc(brief) : '<!-- [BRIEF: 1-2 atmospheric sentences before Continue] -->'}</p>
          <button class="continue-btn" id="continue-reveal-btn">Continue</button>
        </div>

        <div id="reveal-full" style="display:none">
          <div id="scene-content">
            <header class="loc-bar">
              <div class="loc-name">${esc(location)}</div>
              <div class="loc-time">${esc(timeLabel)}</div>
            </header>

            ${buildAtmosphereStrip(atmosphere, state.modulesActive ?? [])}

            <ta-tts></ta-tts>

            <div class="narrative-container">
              ${narrativeHtml}
            </div>

            <div class="scene-actions">
              ${ACTION_PLACEHOLDER}
            </div>

            <section class="status-bar">
              <div class="hp-pips">
                ${char ? renderHpPips(Number(char.hp) || 0, Number(char.maxHp) || 0) : ''}
              </div>
              <div class="ac-badge">AC ${esc(char?.ac ?? 10)}</div>
              <div class="level-badge">Level ${esc(char?.level ?? 1)}</div>
            </section>
          </div>

          <div id="panel-overlay" role="dialog" aria-modal="true" aria-labelledby="panel-title-text" style="display:none">
            <div class="panel-header">
              <h2 id="panel-title-text" tabindex="-1" class="panel-title">Panel</h2>
              <button class="panel-close-btn" id="panel-close-btn" aria-label="Close panel">Close</button>
            </div>
            ${buildPanelDivs(state.modulesActive || [], state)}
          </div>
        </div>

        <div id="scene-meta" data-meta="${esc(sceneMeta)}" style="display:none"></div>
        ${renderFooter(state, '', options)}
      </div>
    `,
    attrs: {
      'data-style': styleName,
      'data-room': location,
      'data-time': timeLabel,
      'data-atmosphere': JSON.stringify(atmosphere),
      'data-narrative': narrative,
      'data-actions': JSON.stringify(actions),
      'data-panels': panels.join(','),
      'data-scene': String(scene),
      'data-scene-meta': sceneMeta,
      'data-poi-budget': String(char?.poiMax ?? 2),
    },
    cssUrls,
    jsUrls,
  });
}

function buildNarrativeHtml(narrative: string, phases: number): string {
  if (phases > 1) {
    const blocks: string[] = [];
    for (let i = 1; i <= phases; i++) {
      const hidden = i > 1 ? ' style="display:none"' : '';
      const content = narrative
        ? `<p>${esc(narrative)}</p>`
        : `<!-- [NARRATIVE: Phase ${i}] -->`;
      blocks.push(`<div class="scene-phase narrative" data-phase="${i}"${hidden}>${content}</div>`);
      if (i < phases) {
        blocks.push(`<button class="phase-continue" data-reveal-phase="${i + 1}">Continue</button>`);
      }
    }
    return blocks.join('\n              ');
  }

  const content = narrative
    ? `<p>${esc(narrative)}</p>`
    : '<p><!-- Narrative content rendered by the GM --></p>';
  return `<div id="narrative" class="narrative">${content}</div>`;
}

function buildAtmosphereStrip(atmosphere: string[], modulesActive: string[]): string {
  const hasAtmosphereModule = modulesActive.includes('atmosphere');
  const fallback = hasAtmosphereModule
    ? ['The scene unfolds before you...', 'Low ambient sound presses close.', 'Cool air moves across exposed skin.']
    : ['The scene unfolds before you...'];
  const pills = (atmosphere.length > 0 ? atmosphere : fallback)
    .map(item => `<span class="atmo-pill">${esc(item)}</span>`)
    .join('\n              ');
  return `<div class="atmo-strip">
              ${pills}
            </div>`;
}

/** Panel renderer registry — maps panel name to template function. */
type PanelRenderer = (state: GmState | null, css: string) => string;
const PANEL_RENDERERS: Record<string, PanelRenderer> = {
  character: renderCharacter,
  codex: renderCodex,
  ship: renderShip,
  crew: renderCrew,
  nav: renderStarchart,
  map: renderMap,
  quests: (state) => renderQuestsPanel(state),
  levelup: (state) => renderLevelup(state, ''),
};

/** Build panel-content divs for active modules — pre-populated from state. */
function buildPanelDivs(modules: string[], state: GmState | null): string {
  const panels = ['character'];
  if (state?._levelupPending) panels.push('levelup');
  
  modules.forEach(m => {
    const p = MODULE_PANEL_MAP[m];
    if (p && !panels.includes(p)) panels.push(p);
  });

  return panels
    .map(panel => {
      const renderer = PANEL_RENDERERS[panel]!;
      return `<div class="panel-content" data-panel="${panel}">${renderer(state, '')}</div>`;
    })
    .join('\n      ');
}

/** 
 * Inline quests panel — no standalone template exists for this panel type. 
 */
function renderQuestsPanel(state: GmState | null): string {
  if (!state?.quests || state.quests.length === 0) {
    return '<p class="empty-state">No active quests.</p>';
  }

  const items = state.quests.map(q => {
    const objectives = (q.objectives || []).map(obj =>
      `<li class="quest-obj ${obj.completed ? 'obj-done' : ''}">${esc(obj.description)}</li>`
    ).join('');
    const total = q.objectives?.length ?? 0;
    const completed = q.objectives?.filter(obj => obj.completed).length ?? 0;
    
    return `<div class="quest-card ${q.status === 'completed' ? 'quest-done' : ''}">
      <div class="quest-title">${esc(q.title)}</div>
      <div class="quest-progress">${completed}/${total}</div>
      <ul class="quest-objectives">${objectives}</ul>
    </div>`;
  }).join('');

  return `<div class="quests-list">${items}</div>`;
}
