import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';
import { planMapRoute } from '../../lib/map-routing';

type MapFallbackNode = {
  id: string;
  label?: string;
};

type MapFallbackZone = {
  id: string;
  label: string;
  name?: string;
};

type MapFallbackConfig = {
  name: string;
  current: string;
  zones: MapFallbackZone[];
  nodes: MapFallbackNode[];
  visited?: string[];
};

/**
 * Builds the plain HTML fallback for the map.
 */
function buildMapFallback(config: MapFallbackConfig): string {
  let html = `<div class="widget-map"><div class="widget-title">${esc(config.name || 'Navigation Map')}</div>`;
  html += `<p class="map-location map-current">Current: ${esc(config.current)}</p>`;
  const zoneCount = Array.isArray(config.zones) && config.zones.length > 0 ? config.zones.length : config.nodes.length;
  html += `<p class="map-summary">${esc(config.visited?.length ?? 0)} visited / ${esc(zoneCount)} revealed</p>`;
  html += '<ul class="map-zones">';
  const visible =
    Array.isArray(config.zones) && config.zones.length > 0
      ? config.zones.map(z => ({ id: z.id, label: z.label || z.name || z.id }))
      : config.nodes;
  visible.forEach(n => {
    const isCurrent = n.id === config.current ? ' (Current)' : '';
    html += `<li>${esc(n.label || n.id)}${isCurrent}</li>`;
  });
  html += '</ul></div>';
  return html;
}

function normalizeRichZones(mapState: NonNullable<GmState['mapState']>) {
  const zones = Array.isArray(mapState.zones) ? mapState.zones : [];
  if (!zones.length) return [];

  const visited = new Set(mapState.visitedZones || []);
  const revealed = new Set(mapState.revealedZones || []);
  const current = mapState.currentZone || '';
  const hasRevealList = revealed.size > 0 || visited.size > 0 || current.length > 0;

  return zones
    .filter(zone => {
      const status = zone.status || '';
      if (status === 'unexplored') return false;
      if (!hasRevealList) return true;
      return (
        zone.id === current ||
        visited.has(zone.id) ||
        revealed.has(zone.id) ||
        status === 'current' ||
        status === 'visited' ||
        status === 'safe' ||
        status === 'danger' ||
        status === 'locked'
      );
    })
    .map(zone => {
      const status =
        zone.id === current
          ? 'current'
          : zone.status || (visited.has(zone.id) ? 'visited' : revealed.has(zone.id) ? 'revealed' : 'revealed');
      return {
        id: zone.id,
        label: zone.name || zone.id,
        type: zone.type || '',
        terrain: zone.terrain || '',
        x: zone.x,
        y: zone.y,
        width: zone.width,
        height: zone.height,
        status,
        faction: zone.faction || '',
        threat: zone.threat || '',
        description: zone.description || '',
        encounters: zone.encounters || [],
        loot: zone.loot || [],
        icon: zone.icon || '',
        connections: zone.connections || [],
      };
    });
}

function normalizeRichConnections(mapState: NonNullable<GmState['mapState']>, visibleZoneIds: Set<string>) {
  const rawConnections = Array.isArray(mapState.connections) ? mapState.connections : [];
  const doorStates = mapState.doorStates || {};

  return rawConnections
    .filter(connection => connection.discovered !== false)
    .filter(connection => visibleZoneIds.has(connection.from) && visibleZoneIds.has(connection.to))
    .map(connection => {
      const keyA = `${connection.from}:${connection.to}`;
      const keyB = `${connection.to}:${connection.from}`;
      const state =
        connection.status || doorStates[keyA] || doorStates[keyB] || (connection.locked ? 'locked' : 'open');
      return {
        id: connection.id || `${connection.from}-${connection.to}`,
        from: connection.from,
        to: connection.to,
        type: connection.type || 'path',
        status: state,
        locked: connection.locked || state === 'locked',
        travelTime: connection.travelTime || '',
        bidirectional: connection.bidirectional !== false,
      };
    });
}

/**
 * Renders the exploration map widget.
 *
 * @param {GmState | null} state - Current game state.
 * @param {string} styleName - Visual style.
 * @param {Record<string, unknown>} [_options] - Unused.
 * @returns {string} - The HTML wrapped in a <ta-map> custom element.
 *
 * @remarks
 * Displays the revealed zones, the player's current location,
 * and door states (locked/open). It uses a simple orbital layout
 * for nodes when pre-calculating positions.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function zoneLabel(state: GmState | null, zoneId: string): string {
  return (
    state?.mapState?.zones?.find(zone => zone.id === zoneId)?.name ?? state?.worldData?.rooms?.[zoneId]?.name ?? zoneId
  );
}

export function renderMap(state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  const mapState = state?.mapState;

  if (!mapState) {
    const html = `<div class="widget-map"><p class="empty-state">No map data available.</p></div>`;
    return emitStandaloneCustomElement({ tag: 'ta-map', styleName, html });
  }

  const zones = normalizeRichZones(mapState);
  const zoneIds = new Set(zones.map(zone => zone.id));
  const connections = normalizeRichConnections(mapState, zoneIds);
  const data = isRecord(options?.data) ? options.data : {};
  const routeInput = isRecord(data.route) ? data.route : null;
  const routeFrom = routeInput ? str(routeInput.from, mapState.currentZone) : '';
  const routeTo = routeInput ? str(routeInput.to) : '';
  const route =
    routeInput && routeFrom && routeTo
      ? {
          ...planMapRoute(mapState, routeFrom, routeTo),
          fromLabel: zoneLabel(state, routeFrom),
          toLabel: zoneLabel(state, routeTo),
          pathLabels: planMapRoute(mapState, routeFrom, routeTo).path.map(id => zoneLabel(state, id)),
        }
      : null;

  // Pre-calculate legacy nodes for the component (simple circle positions)
  const revealed = mapState.revealedZones || [];
  const currentZone = mapState.currentZone || '';
  const nodes = revealed.map((zone, i) => {
    if (zone === currentZone) return { id: zone, x: 140, y: 92 };
    const angle = (i / Math.max(revealed.length, 1)) * Math.PI * 2;
    return {
      id: zone,
      x: Math.round(140 + Math.cos(angle) * 80),
      y: Math.round(92 + Math.sin(angle) * 60),
    };
  });

  const config = {
    type: mapState.activeMapType || 'settlement',
    id: mapState.mapId || '',
    name: mapState.mapName || 'Navigation Map',
    current: currentZone,
    zones,
    connections,
    nodes: nodes,
    visited: mapState.visitedZones,
    revealed: mapState.revealedZones,
    doorStates: mapState.doorStates,
    supplies: mapState.supplies,
    route,
  };

  return emitStandaloneCustomElement({
    tag: 'ta-map',
    styleName,
    html: buildMapFallback(config),
    attrs: { 'data-map': JSON.stringify(config) },
  });
}
