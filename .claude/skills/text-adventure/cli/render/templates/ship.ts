import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

export function renderShip(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  const ship = state?.shipState;

  if (!ship) {
    const html = `<div class="widget-ship"><p class="empty-state">No ship data available.</p></div>`;
    if (!styleName) return html;
    return wrapInShadowDom({ styleName, html });
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

  const html = `<ta-ship data-ship="${esc(JSON.stringify(config))}"></ta-ship>`;

  if (!styleName) return html;
  return wrapInShadowDom({ styleName, html });
}
