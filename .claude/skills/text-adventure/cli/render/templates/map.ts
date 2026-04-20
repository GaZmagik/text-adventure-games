import type { GmState } from '../../types';
import { wrapInShadowDom, emitStandaloneCustomElement } from '../lib/shadow-wrapper';

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

  return emitStandaloneCustomElement({
    tag: 'ta-map',
    styleName,
    attrs: { 'data-map': JSON.stringify(config) },
  });
}
