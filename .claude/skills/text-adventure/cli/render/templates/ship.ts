// Ship status panel — ship name, 7 system cards with integrity bars
// and status badges (operational/degraded/critical/offline).

import type { GmState } from '../../types';
import { esc } from '../../lib/html';

const STATUS_COLOURS: Record<string, { bg: string; text: string }> = {
  operational: { bg: 'var(--ta-color-success)', text: 'var(--ta-badge-success-text)' },
  degraded:    { bg: 'var(--ta-color-warning)', text: 'var(--ta-badge-partial-text)' },
  critical:    { bg: 'var(--ta-color-danger)', text: 'var(--ta-badge-failure-text)' },
  offline:     { bg: 'var(--color-border-tertiary)', text: 'var(--color-text-tertiary)' },
};

export function renderShip(state: GmState | null, css: string, _options?: Record<string, unknown>): string {
  const ship = state?.shipState;

  if (!ship) {
    return `
${css ? '<style>' + css + '</style>' : ''}
<div class="widget-ship">
  <p class="empty-state">No ship data available.</p>
</div>`;
  }

  const systemCards = Object.entries(ship.systems).map(([name, sys]) => {
    const pct = Math.max(0, Math.min(100, sys.integrity));
    const colours = STATUS_COLOURS[sys.status] ?? STATUS_COLOURS['operational']!;
    const conditions = sys.conditions.length > 0
      ? sys.conditions.map(c => `<span class="ship-condition">${esc(c)}</span>`).join(' ')
      : '';

    return `
      <div class="system-card">
        <div class="system-header">
          <span class="system-name">${esc(name)}</span>
          <span class="system-badge" style="background:${colours.bg};color:${colours.text}">${esc(sys.status)}</span>
        </div>
        <div class="ship-bar-container"><div class="bar-fill" style="width:${pct}%;background:${colours.bg}"></div></div>
        <div class="system-pct">${pct}%</div>
        ${conditions ? `<div class="system-conditions">${conditions}</div>` : ''}
      </div>`;
  }).join('\n');

  return `
<style>${css}
.widget-ship { font-family: var(--ta-font-body); padding: 16px; }
.ship-title { font-family: var(--ta-font-heading); font-size: 18px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px; }
.ship-meta { font-size: 11px; color: var(--color-text-tertiary); margin-bottom: 12px; }
.system-card { padding: 10px; margin-bottom: 8px; border: 0.5px solid var(--color-border-tertiary); border-radius: 6px; }
.system-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.system-name { font-size: 13px; font-weight: 600; color: var(--color-text-primary); text-transform: capitalize; }
.system-badge { display: inline-block; padding: 2px 8px; font-size: 10px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
.ship-bar-container { width: 100%; height: 6px; background: var(--color-border-tertiary); border-radius: 3px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
.system-pct { font-size: 10px; color: var(--color-text-tertiary); margin-top: 2px; text-align: right; }
.system-conditions { margin-top: 4px; }
.ship-condition { display: inline-block; padding: 1px 6px; font-size: 9px; border-radius: 6px; background: var(--ta-color-danger-bg); color: var(--ta-color-danger); margin-right: 4px; }
</style>
<div class="widget-ship">
  <div class="ship-title">${esc(ship.name)}</div>
  <div class="ship-meta">Repair parts: ${ship.repairParts} · Scenes since repair: ${ship.scenesSinceRepair}</div>
  ${systemCards}
</div>`;
}