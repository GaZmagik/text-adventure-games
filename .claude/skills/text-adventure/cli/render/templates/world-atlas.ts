// World atlas renderer reveals known locations while hiding unrevealed room details.
import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

function knownZoneIds(state: GmState | null): Set<string> {
  return new Set(
    [
      state?.mapState?.currentZone ?? '',
      ...(state?.mapState?.visitedZones ?? []),
      ...(state?.mapState?.revealedZones ?? []),
    ].filter(Boolean),
  );
}

function buildAtlasFallback(atlas: { rooms: unknown[] }): string {
  return `<div class="widget-world-atlas"><div class="widget-title">World Atlas</div><p>${esc(atlas.rooms.length)} locations indexed</p></div>`;
}

export function renderWorldAtlas(state: GmState | null, styleName: string): string {
  const known = knownZoneIds(state);
  const mapZones = state?.mapState?.zones ?? [];
  const rooms = Object.values(state?.worldData?.rooms ?? {}).map(room => {
    const zone = mapZones.find(item => item.id === room.id);
    const visible = known.has(room.id) || zone?.status === 'current' || zone?.status === 'visited';
    return {
      id: room.id,
      label: visible ? room.name : 'Unknown location',
      visible,
      current: state?.mapState?.currentZone === room.id,
      visited: state?.mapState?.visitedZones?.includes(room.id) ?? false,
      type: visible ? room.type : '',
      terrain: visible ? (room.terrain ?? '') : '',
      faction: visible ? (room.controllingFaction ?? '') : '',
      description: visible ? room.description : '',
      loot: visible ? room.loot : [],
      encounters: visible ? room.encounters : [],
      exits: visible ? room.exits : [],
    };
  });
  const atlas = {
    mapName: state?.worldData?.mapName ?? state?.mapState?.mapName ?? 'World Atlas',
    rooms,
    currentRoom: state?.currentRoom ?? '',
  };

  return emitStandaloneCustomElement({
    tag: 'ta-world-atlas',
    styleName,
    html: buildAtlasFallback(atlas),
    attrs: { 'data-atlas': JSON.stringify(atlas) },
  });
}
