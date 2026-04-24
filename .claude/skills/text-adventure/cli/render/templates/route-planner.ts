// Route planner renderer packages reachable map paths and route prompts for the web component.
import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';
import { planMapRoute } from '../../lib/map-routing';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function zoneLabel(state: GmState | null, zoneId: string): string {
  const zone = state?.mapState?.zones?.find(item => item.id === zoneId);
  return zone?.name ?? state?.worldData?.rooms?.[zoneId]?.name ?? zoneId;
}

function buildRouteFallback(route: Record<string, unknown>): string {
  return `<div class="widget-route-planner"><div class="widget-title">Route Planner</div><p>${esc(route.fromLabel)} to ${esc(route.toLabel)}</p></div>`;
}

export function renderRoutePlanner(
  state: GmState | null,
  styleName: string,
  options?: Record<string, unknown>,
): string {
  const data = isRecord(options?.data) ? options.data : {};
  const mapState = state?.mapState;
  const current = mapState?.currentZone ?? '';
  const visible = mapState?.revealedZones ?? [];
  const fallbackTarget = visible.find(zone => zone !== current) ?? current;
  const from = str(data.from, current);
  const to = str(data.to, fallbackTarget);
  const plan =
    mapState && from && to
      ? planMapRoute(mapState, from, to)
      : {
          from,
          to,
          reachable: false,
          path: [],
          blockers: ['No map data'],
          steps: 0,
          travelTime: 'unreachable',
          supplyCost: { rations: 0, water: 0 },
        };
  const zones = (mapState?.zones ?? [])
    .filter(
      zone =>
        (mapState?.revealedZones ?? []).includes(zone.id) || zone.status === 'current' || zone.status === 'visited',
    )
    .map(zone => ({ id: zone.id, label: zoneLabel(state, zone.id), status: zone.status ?? '', type: zone.type ?? '' }));
  const route = {
    ...plan,
    fromLabel: zoneLabel(state, from),
    toLabel: zoneLabel(state, to),
    pathLabels: plan.path.map(zone => zoneLabel(state, zone)),
    zones,
    prompt: plan.reachable
      ? `Travel from ${zoneLabel(state, from)} to ${zoneLabel(state, to)} via ${plan.path.map(zone => zoneLabel(state, zone)).join(' -> ')}.`
      : `Find or unlock a route from ${zoneLabel(state, from)} to ${zoneLabel(state, to)}.`,
  };

  return emitStandaloneCustomElement({
    tag: 'ta-route-planner',
    styleName,
    html: buildRouteFallback(route),
    attrs: { 'data-route': JSON.stringify(route) },
  });
}
