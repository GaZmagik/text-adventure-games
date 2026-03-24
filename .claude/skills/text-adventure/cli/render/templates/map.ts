// Geo-map data panel — shows current zone, visited zones list, fog of war status.
// Full SVG map generation is complex; this provides the data panel.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';

export function renderMap(state: GmState | null, css: string, _options?: Record<string, unknown>): string {
  const mapState = state?.mapState;

  if (!mapState) {
    return `
${css ? '<style>' + css + '</style>' : ''}
<div class="widget-map">
  <p class="empty-state">No map data available.</p>
</div>`;
  }

  const visited = mapState.visitedZones;
  const visitedSet = new Set(visited);
  const revealed = mapState.revealedZones;
  const fogCount = revealed.filter(z => !visitedSet.has(z)).length;

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

  return `
<style>${css}
.widget-map { font-family: var(--ta-font-body); padding: 16px; }
.map-title { font-family: var(--ta-font-heading); font-size: 18px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px; }
.map-current { font-size: 13px; color: var(--ta-color-accent); margin-bottom: 12px; }
.map-summary { font-size: 11px; color: var(--color-text-tertiary); margin-bottom: 12px; }
.map-section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-text-tertiary); margin: 12px 0 6px; }
.zone-list { list-style: none; padding: 0; margin: 0; }
.zone-item { padding: 4px 0; border-bottom: 0.5px solid var(--color-border-tertiary); font-size: 12px; color: var(--color-text-secondary); }
.zone-current { color: var(--ta-color-accent); font-weight: 600; }
.zone-visited { color: var(--color-text-primary); }
.zone-fog { color: var(--color-text-tertiary); font-style: italic; }
.door-item { padding: 2px 0; font-size: 11px; color: var(--color-text-secondary); }
.door-name { font-weight: 600; }
.door-state { color: var(--color-text-tertiary); text-transform: capitalize; }
.supplies-row { font-size: 12px; color: var(--color-text-secondary); margin: 2px 0; }
.supplies-label { color: var(--color-text-tertiary); text-transform: uppercase; font-size: 10px; }
</style>
<div class="widget-map">
  <div class="map-title">Map</div>
  <div class="map-current">${esc(mapState.currentZone)}</div>
  <div class="map-summary">${visited.length} visited · ${fogCount} unexplored · ${revealed.length} revealed</div>

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
}