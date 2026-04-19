// Star chart panel — renders a lightweight route map plus chart tables.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

const STARCHART_CSS = `.widget-starchart { font-family: var(--ta-font-body); padding: 16px; display: grid; gap: 16px; }
.starchart-title { font-family: var(--ta-font-heading); font-size: 18px; font-weight: 700; color: var(--sta-text-primary, #EEF0FF); margin-bottom: 4px; }
.starchart-current { font-size: 13px; color: var(--ta-color-accent); margin-bottom: 12px; }
.starchart-summary { font-size: 11px; color: var(--sta-text-tertiary, #545880); margin-bottom: 12px; }
.starchart-viewport { border: 1px solid var(--sta-border-tertiary, rgba(84,88,128,0.35)); border-radius: 14px; background:
  radial-gradient(circle at 50% 25%, rgba(98, 175, 255, 0.18), transparent 40%),
  linear-gradient(180deg, rgba(4, 8, 16, 0.96), rgba(10, 16, 26, 0.98)); padding: 12px; }
.starchart-canvas { width: 100%; height: auto; display: block; }
.star-node { stroke-width: 2; }
.star-node-current { fill: rgba(84, 182, 255, 0.35); stroke: var(--ta-color-accent); }
.star-node-visited { fill: rgba(255, 214, 122, 0.18); stroke: rgba(255, 214, 122, 0.75); }
.star-node-course { fill: rgba(147, 155, 180, 0.1); stroke: rgba(147, 155, 180, 0.5); stroke-dasharray: 4 3; }
.star-link { stroke: rgba(84, 182, 255, 0.24); stroke-width: 1.5; }
.course-path { fill: none; stroke: rgba(122, 239, 255, 0.75); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.star-label { font-size: 10px; fill: var(--sta-text-primary, #EEF0FF); text-anchor: middle; }
.chart-section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--sta-text-tertiary, #545880); margin: 12px 0 6px; }
.system-list { list-style: none; padding: 0; margin: 0; }
.system-item { padding: 4px 0; border-bottom: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); font-size: 12px; color: var(--sta-text-secondary, #9AA0C0); }
.system-current { color: var(--ta-color-accent); font-weight: 600; }
.course-list { list-style: none; padding: 0; margin: 0; }
.course-step { padding: 3px 0; font-size: 12px; color: var(--sta-text-secondary, #9AA0C0); }
.step-current { color: var(--ta-color-accent); font-weight: 600; }
.no-course { font-size: 11px; color: var(--sta-text-tertiary, #545880); font-style: italic; }`;

function buildSystemLayout(systems: string[]): Map<string, { x: number; y: number }> {
  const layout = new Map<string, { x: number; y: number }>();
  if (systems.length === 0) return layout;

  const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(systems.length))));
  const rows = Math.ceil(systems.length / cols);
  const xStep = cols > 1 ? 200 / (cols - 1) : 0;
  const yStep = rows > 1 ? 120 / (rows - 1) : 0;

  for (let index = 0; index < systems.length; index++) {
    const system = systems[index]!;
    const col = index % cols;
    const row = Math.floor(index / cols);
    const seed = [...system].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const xJitter = (seed % 18) - 9;
    const yJitter = (seed % 12) - 6;
    layout.set(system, {
      x: Math.round(40 + (col * xStep) + xJitter),
      y: Math.round(36 + (row * yStep) + yJitter),
    });
  }

  return layout;
}

export function renderStarchart(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  if (!state?.visitedRooms?.length) {
    const html = `<div class="empty-state"><p>No star systems charted yet.</p></div>`;
    if (!styleName) return html;
    return wrapInShadowDom({ styleName, html });
  }

  const currentRoom = state?.currentRoom ?? 'Unknown System';
  const visitedRooms = state?.visitedRooms ?? [];
  const plottedCourse = state?.navPlottedCourse ?? null;
  const chartedSystems = Array.from(new Set([...(visitedRooms ?? []), ...(plottedCourse ?? [])]));
  const systemLayout = buildSystemLayout(chartedSystems);
  const visitedSet = new Set(visitedRooms);
  const chartLines = chartedSystems.slice(1).map((system, index) => {
    const from = systemLayout.get(chartedSystems[index]!)!;
    const to = systemLayout.get(system)!;
    return `<line class="star-link" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" />`;
  }).join('\n      ');
  const coursePath = plottedCourse && plottedCourse.length > 1
    ? plottedCourse
      .map((step) => systemLayout.get(step))
      .filter((point): point is { x: number; y: number } => Boolean(point))
      .map(point => `${point.x},${point.y}`)
      .join(' ')
    : '';
  const systemNodes = chartedSystems.map((system) => {
    const point = systemLayout.get(system)!;
    const isCurrent = system === currentRoom;
    const isVisited = visitedSet.has(system);
    const nodeClass = isCurrent ? 'star-node-current' : isVisited ? 'star-node-visited' : 'star-node-course';
    const radius = isCurrent ? 10 : isVisited ? 8 : 6;
    return `<g>
      <circle class="star-node ${nodeClass}" cx="${point.x}" cy="${point.y}" r="${radius}" />
      <text class="star-label" x="${point.x}" y="${point.y + 20}">${esc(system)}</text>
    </g>`;
  }).join('\n      ');

  const systemList = visitedRooms.map(sys => {
    const isCurrent = sys === currentRoom;
    return `<li class="system-item${isCurrent ? ' system-current' : ''}">${esc(sys)}${isCurrent ? ' (current)' : ''}</li>`;
  }).join('\n      ');

  const courseSteps = plottedCourse && plottedCourse.length > 0
    ? plottedCourse.map((step, i) => {
        const isCurrent = step === currentRoom;
        return `<li class="course-step${isCurrent ? ' step-current' : ''}">${i + 1}. ${esc(step)}</li>`;
      }).join('\n        ')
    : '';

  const html = `<div class="widget-starchart">
  <div>
    <div class="starchart-title">Star Chart</div>
    <div class="starchart-current">${esc(currentRoom)}</div>
    <div class="starchart-summary">${visitedRooms.length} system${visitedRooms.length !== 1 ? 's' : ''} charted</div>
  </div>

  <div class="starchart-viewport">
    <svg class="starchart-canvas" viewBox="0 0 280 180" role="img" aria-label="Star chart for ${esc(currentRoom)}">
      <circle cx="28" cy="26" r="1.4" fill="rgba(255,255,255,0.7)" />
      <circle cx="86" cy="18" r="1.1" fill="rgba(255,255,255,0.55)" />
      <circle cx="226" cy="34" r="1.2" fill="rgba(255,255,255,0.65)" />
      <circle cx="250" cy="142" r="1.1" fill="rgba(255,255,255,0.5)" />
      <circle cx="42" cy="146" r="1.3" fill="rgba(255,255,255,0.48)" />
      ${chartLines}
      ${coursePath ? `<polyline class="course-path" points="${coursePath}" />` : ''}
      ${systemNodes}
    </svg>
  </div>

  <div class="chart-section-label">Known Systems</div>
  <ul class="system-list">
    ${systemList || '<li class="system-item" style="font-style:italic;color:var(--sta-text-tertiary, #545880)">No systems charted</li>'}
  </ul>

  <div class="chart-section-label">Plotted Course</div>
  ${courseSteps
    ? `<ol class="course-list">${courseSteps}</ol>`
    : '<p class="no-course">No course plotted</p>'}
</div>`;

  if (!styleName) return html;
  return wrapInShadowDom({ styleName, inlineCss: STARCHART_CSS, html });
}
