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
import { renderQuestLog } from './quest-log';
import { renderFooter } from './footer';
import { renderHpPips } from '../lib/svg-pips';

const ACTION_PLACEHOLDER = `<!-- [ACTIONS: Insert POI buttons and action cards here.
           Each button MUST use <strong class="btn-title"> for the title:

           POI:    <button class="poi-btn" data-poi="id" data-prompt="..." title="..."><strong class="btn-title">Title</strong>Description text.</button>
           Action: <button class="action-btn" data-prompt="..." title="..."><strong class="btn-title">Title</strong>Description text.</button>

           Preferred semantic form:
                   <ta-action-card type="investigate" data-prompt="..." title="..."><strong class="btn-title">Title</strong><span class="action-desc">Description text.</span></ta-action-card>

           tag verify accepts both semantic components and legacy button structures, and rejects choices without <strong> title structure.] -->`;

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
  const atmosphere = Array.isArray(data.atmosphere) ? data.atmosphere.map(value => String(value)).filter(Boolean) : [];
  const brief = typeof data.brief === 'string' ? data.brief : '';
  const vfx = typeof data.vfx === 'string' ? data.vfx : '';
  const audioRecipe = typeof data.audioRecipe === 'string' ? data.audioRecipe : '';
  const panelMode = data.panelMode === 'full' ? 'full' : 'compact';

  const phases = Number(options?.phases) || 1;
  const narrativeHtml = buildNarrativeHtml(narrative, phases);
  const actionsHtml = buildSceneActions(data);
  const trackedQuest = buildTrackedQuestBadge(state);
  const questToast = buildQuestToast(state);

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
            <ta-loc-bar name="${esc(location)}" time="${esc(timeLabel)}"></ta-loc-bar>

            ${buildAtmosphereStrip(atmosphere, state.modulesActive ?? [])}

            <ta-tts></ta-tts>

            <div class="narrative-container">
              ${narrativeHtml}
            </div>

            <div class="scene-actions">
              ${actionsHtml || ACTION_PLACEHOLDER}
            </div>

            <section class="status-bar">
              <div class="hp-pips">
                ${char ? renderHpPips(Number(char.hp) || 0, Number(char.maxHp) || 0) : ''}
              </div>
              <div class="ac-badge">AC ${esc(char?.ac ?? 10)}</div>
              <div class="level-badge">Level ${esc(char?.level ?? 1)}</div>
              ${trackedQuest}
            </section>
            ${questToast}
          </div>

          <div id="panel-overlay" role="dialog" aria-modal="true" aria-labelledby="panel-title-text" style="display:none">
            <div class="panel-header">
              <h2 id="panel-title-text" tabindex="-1" class="panel-title">Panel</h2>
              <button class="panel-close-btn" id="panel-close-btn" aria-label="Close panel">Close</button>
            </div>
            ${buildPanelDivs(state.modulesActive || [], state, panelMode)}
          </div>
        </div>

        <div id="scene-meta" data-meta="${esc(sceneMeta)}" style="display:none"></div>
        ${renderFooter(state, '', options)}
      </div>
    `,
    attrs: {
      'data-vfx': vfx,
      'data-audio-recipe': audioRecipe || null,
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
      'data-panel-mode': panelMode,
    },
    cssUrls,
    jsUrls,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function safeToken(value: unknown, fallback = 'objective'): string {
  const raw = cleanString(value, fallback).toLowerCase();
  return /^[a-z0-9_-]+$/.test(raw) ? raw : fallback;
}

function buildRollAttrs(roll: unknown): string {
  if (!isRecord(roll)) return '';
  const attrs: string[] = [];
  const type = cleanString(roll.type);
  const stat = cleanString(roll.stat);
  if (type) attrs.push(`data-roll-type="${esc(type)}"`);
  if (stat) attrs.push(`data-roll-stat="${esc(stat)}"`);
  if (roll.dc !== undefined) attrs.push(`data-roll-dc="${esc(roll.dc)}"`);
  if (roll.npc !== undefined) attrs.push(`data-roll-npc="${esc(roll.npc)}"`);
  if (roll.skill !== undefined) attrs.push(`data-roll-skill="${esc(roll.skill)}"`);
  return attrs.length ? ` ${attrs.join(' ')}` : '';
}

function buildActionCard(raw: unknown, index: number): string {
  if (!isRecord(raw)) return '';
  const title = cleanString(raw.title, `Action ${index + 1}`);
  const description = cleanString(raw.description, cleanString(raw.text, 'Choose this approach.'));
  const prompt = cleanString(raw.prompt, `I choose: ${title}.`);
  const type = safeToken(raw.type, 'objective');
  const tone = safeToken(raw.tone, 'normal');
  return `<ta-action-card type="${esc(type)}" tone="${esc(tone)}" data-prompt="${esc(prompt)}" title="${esc(prompt)}"${buildRollAttrs(raw.roll)}>
                <ta-icon name="${esc(type)}" label="${esc(title)}"></ta-icon>
                <strong class="btn-title">${esc(title)}</strong>
                <span class="action-desc">${esc(description)}</span>
              </ta-action-card>`;
}

function buildPoiButton(raw: unknown, index: number): string {
  if (!isRecord(raw)) return '';
  const id = safeToken(raw.id, `poi-${index + 1}`);
  const title = cleanString(raw.title, cleanString(raw.label, `Point ${index + 1}`));
  const description = cleanString(raw.description, cleanString(raw.text, 'Inspect this point of interest.'));
  const prompt = cleanString(raw.prompt, `Inspect ${title}.`);
  return `<button class="poi-btn" data-poi="${esc(id)}" data-prompt="${esc(prompt)}" title="${esc(prompt)}">
                <strong class="btn-title">${esc(title)}</strong><span class="action-desc">${esc(description)}</span>
              </button>`;
}

function buildSceneActions(data: Record<string, unknown>): string {
  const pois = Array.isArray(data.pois) ? data.pois : [];
  const actions = Array.isArray(data.actions) ? data.actions : [];
  const html = [...pois.map(buildPoiButton), ...actions.map(buildActionCard)].filter(Boolean);
  return html.join('\n              ');
}

function trackedQuestId(state: GmState): string {
  const flags = state.worldFlags ?? {};
  const id = flags.trackedQuestId ?? flags.trackedQuest;
  return typeof id === 'string' ? id : '';
}

function buildTrackedQuestBadge(state: GmState): string {
  const id = trackedQuestId(state);
  if (!id) return '';
  const quest = state.quests.find(item => item.id === id);
  const label = quest?.title ?? id;
  return `<div class="tracked-quest-badge" data-tracked-quest="${esc(id)}"><span>Tracked</span> ${esc(label)}</div>`;
}

function buildQuestToast(state: GmState): string {
  const raw = state.worldFlags?.questToast ?? state.worldFlags?.lastQuestUpdate;
  if (typeof raw !== 'string' || raw.trim().length === 0) return '';
  return `<ta-quest-toast message="${esc(raw)}"></ta-quest-toast>`;
}

function buildNarrativeHtml(narrative: string, phases: number): string {
  if (phases > 1) {
    const blocks: string[] = [];
    for (let i = 1; i <= phases; i++) {
      const hidden = i > 1 ? ' style="display:none"' : '';
      const content = narrative ? `<p>${esc(narrative)}</p>` : `<!-- [NARRATIVE: Phase ${i}] -->`;
      blocks.push(`<div class="scene-phase narrative" data-phase="${i}"${hidden}>${content}</div>`);
      if (i < phases) {
        blocks.push(`<button class="phase-continue" data-reveal-phase="${i + 1}">Continue</button>`);
      }
    }
    return blocks.join('\n              ');
  }

  const content = narrative ? `<p>${esc(narrative)}</p>` : '<p><!-- Narrative content rendered by the GM --></p>';
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
  quests: state => renderQuestLog(state, ''),
  levelup: state => renderLevelup(state, ''),
};

/** Build panel-content divs for active modules — pre-populated from state. */
function buildPanelDivs(modules: string[], state: GmState | null, panelMode: 'compact' | 'full'): string {
  const panels = ['character'];
  if (state?._levelupPending) panels.push('levelup');

  modules.forEach(m => {
    const p = MODULE_PANEL_MAP[m];
    if (p && !panels.includes(p)) panels.push(p);
  });

  return panels
    .map(panel => {
      const renderer = PANEL_RENDERERS[panel]!;
      const html = panelMode === 'compact' ? renderCompactPanel(panel, state) : renderer(state, '');
      return `<div class="panel-content" data-panel="${panel}">${html}</div>`;
    })
    .join('\n      ');
}

function compactQuestData(state: GmState | null): string {
  const quests = (state?.quests ?? []).slice(0, 8).map(quest => ({
    id: quest.id,
    title: quest.title,
    status: quest.status,
    type: quest.type ?? 'side',
    priority: quest.priority ?? 'normal',
    currentObjectiveId:
      quest.currentObjectiveId ??
      quest.objectives.find(objective => !objective.completed)?.id ??
      quest.objectives[0]?.id ??
      '',
    objectives: quest.objectives.slice(0, 5).map(objective => ({
      id: objective.id,
      description: objective.description,
      completed: objective.completed,
      state: objective.state ?? (objective.completed ? 'completed' : 'active'),
    })),
  }));
  return esc(JSON.stringify(quests));
}

function renderCompactPanel(panel: string, state: GmState | null): string {
  if (!state) return '<p class="empty-state">No game state available.</p>';
  switch (panel) {
    case 'codex': {
      const entries = (state.codexMutations ?? []).filter(entry => entry.state !== 'locked');
      const shown = entries
        .slice(0, 5)
        .map(
          entry =>
            `<li class="codex-entry"><strong>${esc(entry.title ?? entry.id)}</strong><span>${esc(entry.state)}</span></li>`,
        )
        .join('');
      return `<div class="widget-codex compact-panel"><div class="widget-title">Lore Codex</div><p class="codex-summary">${esc(entries.length)} discovered entries</p><ul class="codex-list">${shown}</ul></div>`;
    }
    case 'ship': {
      const ship = state.shipState;
      if (!ship)
        return '<div class="widget-ship compact-panel"><p class="empty-state">Not currently aboard a ship.</p></div>';
      const systems = Object.entries(ship.systems)
        .slice(0, 5)
        .map(
          ([name, sys]) =>
            `<li class="system-card"><strong>${esc(name)}</strong>: ${esc(sys.status)} (${esc(sys.integrity)}%)</li>`,
        )
        .join('');
      return `<div class="widget-ship compact-panel"><div class="widget-title">${esc(ship.name)}</div><ul class="ship-systems">${systems}</ul></div>`;
    }
    case 'crew': {
      const crew = state.crewMutations ?? [];
      if (crew.length === 0)
        return '<div class="widget-crew compact-panel"><p class="empty-state">No crew recruited yet.</p></div>';
      const rows = crew
        .slice(0, 5)
        .map(member => `<li class="crew-row"><strong>${esc(member.name)}</strong> (${esc(member.role)})</li>`)
        .join('');
      return `<div class="widget-crew compact-panel"><div class="widget-title">Crew Roster</div><ul class="crew-list">${rows}</ul></div>`;
    }
    case 'map': {
      const map = state.mapState;
      if (!map) return '<div class="widget-map compact-panel"><p class="empty-state">No map data available.</p></div>';
      const zoneCount = map.zones?.length ?? map.revealedZones.length;
      return `<div class="widget-map compact-panel"><div class="widget-title">${esc(map.mapName ?? 'Navigation Map')}</div><p class="map-location map-current">Current: ${esc(map.currentZone)}</p><p class="map-summary">${esc(map.visitedZones.length)} visited / ${esc(zoneCount)} known</p></div>`;
    }
    case 'quests': {
      const quests = state.quests ?? [];
      return `<ta-quest-log data-quests="${compactQuestData(state)}" data-current-scene="${esc(state.scene)}" data-tracked-quest="${esc(trackedQuestId(state))}"><div class="widget-quest-log compact-panel"><div class="widget-title">Quest Log</div><p class="quest-summary">${esc(quests.filter(q => q.status === 'active').length)} active / ${esc(quests.length)} total</p></div></ta-quest-log>`;
    }
    case 'nav':
      return renderStarchart(state, '');
    default: {
      const renderer = PANEL_RENDERERS[panel];
      return renderer ? renderer(state, '') : '';
    }
  }
}
