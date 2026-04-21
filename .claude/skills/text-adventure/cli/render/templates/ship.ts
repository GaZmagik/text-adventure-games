import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

/**
 * Builds the plain HTML fallback for the ship status.
 */
function buildShipFallback(config: any): string {
  let html = `<div class="widget-ship"><div class="widget-title">${esc(config.name)}</div>`;
  html += '<ul class="ship-systems">';
  config.systems.forEach((sys: any) => {
    html += `<li class="system-card"><strong>${esc(sys.name)}</strong>: ${esc(sys.status)} (${esc(sys.integrity)}%)</li>`;
  });
  html += '</ul></div>';
  return html;
}

/**
 * Renders the ship systems widget.
 * 
 * @param {GmState | null} state - Current game state.
 * @param {string} styleName - Visual style.
 * @param {Record<string, unknown>} [_options] - Unused.
 * @returns {string} - The HTML wrapped in a <ta-ship> custom element.
 * 
 * @remarks
 * Displays the status of ship systems, including integrity, 
 * power allocations, and available repair parts.
 */
export function renderShip(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  const ship = state?.shipState;

  if (!ship) {
    const html = `<div class="widget-ship"><p class="empty-state">No ship data available.</p></div>`;
    return emitStandaloneCustomElement({ tag: 'ta-ship', styleName, html });
  }

  // Map system objects to a flatter array for the component
  const systems = Object.entries(ship.systems).map(([name, sys]) => ({
    name,
    status: sys.status,
    integrity: sys.integrity,
    conditions: sys.conditions
  }));

  const config = {
    name: ship.name,
    repairParts: ship.repairParts,
    scenesSinceRepair: ship.scenesSinceRepair,
    systems: systems,
    powerAllocations: ship.powerAllocations
  };

  return emitStandaloneCustomElement({
    tag: 'ta-ship',
    styleName,
    html: buildShipFallback(config),
    attrs: { 'data-ship': JSON.stringify(config) },
  });
}
