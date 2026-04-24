// Render-origin markers bind generated widget HTML to its widget type for verification.
import { fnv32 } from './fnv32';

const RENDER_ORIGIN_PREFIX = '<!-- TAG-RENDER:';

function buildRenderOriginHash(widgetType: string, html: string): string {
  return fnv32(`tag-render:${widgetType}:${html}`);
}

export function stampRenderOrigin(widgetType: string, html: string): string {
  const hash = buildRenderOriginHash(widgetType, html);
  return `${RENDER_ORIGIN_PREFIX}${widgetType}:${hash} -->\n${html}`;
}

export function hasValidRenderOrigin(widgetType: string, html: string): boolean {
  const match = /^<!--\s*TAG-RENDER:([a-z0-9-]+):([0-9a-f]{8})\s*-->\n?/i.exec(html);
  if (!match) return false;

  const markerWidgetType = match[1]!;
  const markerHash = match[2]!.toLowerCase();
  const payload = html.slice(match[0].length);

  return markerWidgetType === widgetType && markerHash === buildRenderOriginHash(widgetType, payload);
}
