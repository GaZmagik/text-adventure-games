import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

export function renderMap(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  const mapState = state?.mapState;

  if (!mapState) {
    const html = `<div class="widget-map"><p class="empty-state">No map data available.</p></div>`;
    if (!styleName) return html;
    return wrapInShadowDom({ styleName, html });
  }

  // Pre-calculate nodes for the component (simple circle positions)
  const revealed = mapState.revealedZones || [];
  const currentZone = mapState.currentZone || '';
  const nodes = revealed.map((zone, i) => {
    if (zone === currentZone) return { id: zone, x: 140, y: 92 };
    const angle = (i / Math.max(revealed.length, 1)) * Math.PI * 2;
    return {
      id: zone,
      x: Math.round(140 + Math.cos(angle) * 80),
      y: Math.round(92 + Math.sin(angle) * 60)
    };
  });

  const config = {
    current: currentZone,
    nodes: nodes,
    visited: mapState.visitedZones,
    doorStates: mapState.doorStates,
    supplies: mapState.supplies
  };

  const html = `<ta-map data-map="${esc(JSON.stringify(config))}"></ta-map>`;

  if (!styleName) return html;
  return wrapInShadowDom({ styleName, html });
}
