// Geo-map panel — renders a lightweight zone schematic plus textual state.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

const MAP_CSS = `.widget-map { font-family: var(--ta-font-body); padding: 16px; display: grid; gap: 16px; }
.map-title { font-family: var(--ta-font-heading); font-size: 18px; font-weight: 700; color: var(--sta-text-primary, #EEF0FF); margin-bottom: 4px; }
.map-current { font-size: 13px; color: var(--ta-color-accent); margin-bottom: 12px; }
.map-summary { font-size: 11px; color: var(--sta-text-tertiary, #545880); margin-bottom: 12px; }
.map-viewport { border: 1px solid var(--sta-border-tertiary, rgba(84,88,128,0.35)); border-radius: 14px; background:
  radial-gradient(circle at top, rgba(70,110,160,0.16), transparent 52%),
  linear-gradient(180deg, rgba(6,10,18,0.92), rgba(12,19,30,0.98)); padding: 12px; }
.map-schematic { width: 100%; height: auto; display: block; }
.map-link { stroke: rgba(120, 179, 255, 0.28); stroke-width: 2; }
.map-node { stroke-width: 2; }
.map-node-current { fill: rgba(84, 182, 255, 0.25); stroke: var(--ta-color-accent); }
.map-node-visited { fill: rgba(157, 255, 198, 0.16); stroke: rgba(157, 255, 198, 0.7); }
.map-node-fog { fill: rgba(147, 155, 180, 0.1); stroke: rgba(147, 155, 180, 0.45); stroke-dasharray: 4 3; }
.map-node-label { font-size: 10px; fill: var(--sta-text-primary, #EEF0FF); text-anchor: middle; }
.map-legend { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.legend-chip { padding: 4px 8px; border-radius: 999px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; border: 1px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); color: var(--sta-text-secondary, #9AA0C0); }
.map-section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--sta-text-tertiary, #545880); margin: 12px 0 6px; }
.zone-list { list-style: none; padding: 0; margin: 0; }
.zone-item { padding: 4px 0; border-bottom: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); font-size: 12px; color: var(--sta-text-secondary, #9AA0C0); }
.zone-current { color: var(--ta-color-accent); font-weight: 600; }
.zone-visited { color: var(--sta-text-primary, #EEF0FF); }
.zone-fog { color: var(--sta-text-tertiary, #545880); font-style: italic; }
.door-item { padding: 2px 0; font-size: 11px; color: var(--sta-text-secondary, #9AA0C0); }
.door-name { font-weight: 600; }
.door-state { color: var(--sta-text-tertiary, #545880); text-transform: capitalize; }
.supplies-row { font-size: 12px; color: var(--sta-text-secondary, #9AA0C0); margin: 2px 0; }
.supplies-label { color: var(--sta-text-tertiary, #545880); text-transform: uppercase; font-size: 10px; }`;

function buildZoneLayout(zones: string[], currentZone: string): Array<{ zone: string; x: number; y: number }> {
  if (zones.length === 0) return [];

  const ordered = [currentZone, ...zones.filter(zone => zone !== currentZone)];
  return ordered.map((zone, index) => {
    if (index === 0) return { zone, x: 140, y: 92 };
    const angle = ((index - 1) / Math.max(ordered.length - 1, 1)) * Math.PI * 2 - Math.PI / 2;
    return {
      zone,
      x: Math.round(140 + Math.cos(angle) * 88),
      y: Math.round(92 + Math.sin(angle) * 58),
    };
  });
}

export function renderMap(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  const mapState = state?.mapState;

  if (!mapState) {
    const html = `<div class="widget-map">
  <p class="empty-state">No map data available.</p>
</div>`;
    if (!styleName) return html;
    return wrapInShadowDom({ styleName, html });
  }

  const visited = mapState.visitedZones;
  const visitedSet = new Set(visited);
  const revealed = mapState.revealedZones;
  const fogCount = revealed.filter(z => !visitedSet.has(z)).length;
  const zoneLayout = buildZoneLayout(revealed, mapState.currentZone);
  const zoneConnections = zoneLayout.slice(1).map((node) =>
    `<line class="map-link" x1="140" y1="92" x2="${node.x}" y2="${node.y}" />`,
  ).join('\n      ');
  const zoneNodes = zoneLayout.map(({ zone, x, y }) => {
    const isVisited = visitedSet.has(zone);
    const isCurrent = zone === mapState.currentZone;
    const nodeClass = isCurrent ? 'map-node-current' : isVisited ? 'map-node-visited' : 'map-node-fog';
    const radius = isCurrent ? 20 : 16;
    return `<g>
      <circle class="map-node ${nodeClass}" cx="${x}" cy="${y}" r="${radius}" />
      <text class="map-node-label" x="${x}" y="${y + radius + 14}">${esc(zone)}</text>
    </g>`;
  }).join('\n      ');

  const zoneList = revealed.map(zone => {
    const isVisited = visitedSet.has(zone);
    const isCurrent = zone === mapState.currentZone;
    const cls = isCurrent ? 'zone-current' : isVisited ? 'zone-visited' : 'zone-fog';
    const label = isCurrent ? ' (current)' : isVisited ? '' : ' (unexplored)';
    return `<li class="zone-item ${cls}">${esc(zone)}${label}</li>`;
  }).join('\n      ');

  const doors = Object.entries(mapState.doorStates);
  const doorRows = doors.length > 0
    ? doors.map(([door, doorState]) =>
        `<li class="door-item"><span class="door-name">${esc(door)}</span> <span class="door-state">${esc(doorState)}</span></li>`,
      ).join('\n      ')
    : '';

  const supplies = mapState.supplies;

  const html = `<div class="widget-map">
  <div>
    <div class="map-title">Map</div>
    <div class="map-current">${esc(mapState.currentZone)}</div>
    <div class="map-summary">${visited.length} visited · ${fogCount} unexplored · ${revealed.length} revealed</div>
  </div>

  <div class="map-viewport">
    <svg class="map-schematic" viewBox="0 0 280 190" role="img" aria-label="Zone map for ${esc(mapState.currentZone)}">
      <defs>
        <radialGradient id="map-core" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stop-color="rgba(84, 182, 255, 0.25)" />
          <stop offset="100%" stop-color="rgba(84, 182, 255, 0)" />
        </radialGradient>
      </defs>
      <ellipse cx="140" cy="92" rx="108" ry="72" fill="url(#map-core)" />
      ${zoneConnections}
      ${zoneNodes}
    </svg>
    <div class="map-legend">
      <span class="legend-chip">Current Zone</span>
      <span class="legend-chip">Visited Route</span>
      <span class="legend-chip">Fogged Route</span>
    </div>
  </div>

  <div class="map-section-label">Zones</div>
  <ul class="zone-list">
    ${zoneList}
  </ul>

  ${doors.length > 0 ? `
  <div class="map-section-label">Doors</div>
  <ul class="zone-list">
    ${doorRows}
  </ul>` : ''}

  ${supplies ? `
  <div class="map-section-label">Supplies</div>
  <div class="supplies-row"><span class="supplies-label">Rations: </span>${Number(supplies.rations) || 0}</div>
  <div class="supplies-row"><span class="supplies-label">Water: </span>${Number(supplies.water) || 0}</div>` : ''}
</div>`;

  if (!styleName) return html;
  return wrapInShadowDom({ styleName, inlineCss: MAP_CSS, html });
}
