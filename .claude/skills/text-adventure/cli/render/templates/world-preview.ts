// World preview renderer exposes deterministic generation output before applying it to state.
import type { GmState, WorldTheme } from '../../types';
import { esc } from '../../lib/html';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';
import { buildWorldSeedPayload } from '../../lib/map-adapter';
import { generateWorld, isWorldTheme } from '../../lib/worldgen';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function themeValue(value: unknown): WorldTheme | undefined {
  const raw = str(value);
  return raw && isWorldTheme(raw) ? raw : undefined;
}

function buildWorldPreviewFallback(preview: Record<string, unknown>): string {
  return `<div class="widget-world-preview"><div class="widget-title">World Preview</div><p>${esc(preview.seed)} / ${esc(preview.theme)}</p></div>`;
}

export function renderWorldPreview(
  state: GmState | null,
  styleName: string,
  options?: Record<string, unknown>,
): string {
  const data = isRecord(options?.data) ? options.data : {};
  const seed = str(data.seed, state?.worldData?.seed ?? state?.seed ?? 'preview-seed');
  const theme = themeValue(data.theme) ?? themeValue(state?.worldData?.theme);
  const worldData =
    state?.worldData && str(data.seed) === '' && str(data.theme) === '' ? state.worldData : generateWorld(seed, theme);
  const payload = buildWorldSeedPayload(worldData);
  const preview = {
    seed: worldData.seed,
    theme: worldData.theme,
    mapName: worldData.mapName,
    roomCount: worldData.meta.roomCount,
    npcCount: worldData.meta.npcCount,
    factionCount: worldData.factions.factions.length,
    startRoom: worldData.rooms[worldData.startRoom]?.name ?? worldData.startRoom,
    bossRoom: worldData.rooms[worldData.bossRoom]?.name ?? worldData.bossRoom,
    hooks: worldData.hooks,
    zones:
      payload.mapState.zones?.map(zone => ({
        id: zone.id,
        label: zone.name ?? zone.id,
        type: zone.type ?? '',
        terrain: zone.terrain ?? '',
        status: zone.status ?? '',
        x: zone.x,
        y: zone.y,
      })) ?? [],
    connections: payload.mapState.connections ?? [],
    applyPrompt: `Run \`tag world generate --seed ${worldData.seed} --theme ${worldData.theme} --apply\`, then render the opening map.`,
  };

  return emitStandaloneCustomElement({
    tag: 'ta-world-preview',
    styleName,
    html: buildWorldPreviewFallback(preview),
    attrs: { 'data-preview': JSON.stringify(preview) },
  });
}
