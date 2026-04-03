// Ship status panel — schematic overview plus system cards.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

const STATUS_COLOURS: Record<string, { bg: string; text: string }> = {
  operational: { bg: 'var(--ta-color-success)', text: 'var(--ta-badge-success-text)' },
  degraded:    { bg: 'var(--ta-color-warning)', text: 'var(--ta-badge-partial-text)' },
  critical:    { bg: 'var(--ta-color-danger)', text: 'var(--ta-badge-failure-text)' },
  offline:     { bg: 'var(--sta-border-tertiary, rgba(84,88,128,0.6))', text: 'var(--sta-text-primary, #EEF0FF)' },
};

const SHIP_CSS = `.widget-ship { font-family: var(--ta-font-body); padding: 16px; display: grid; gap: 16px; }
.ship-title { font-family: var(--ta-font-heading); font-size: 18px; font-weight: 700; color: var(--sta-text-primary, #EEF0FF); margin-bottom: 4px; }
.ship-meta { font-size: 11px; color: var(--sta-text-tertiary, #545880); margin-bottom: 12px; }
.ship-layout { border: 1px solid var(--sta-border-tertiary, rgba(84,88,128,0.35)); border-radius: 16px; background:
  radial-gradient(circle at 50% 18%, rgba(84, 182, 255, 0.16), transparent 36%),
  linear-gradient(180deg, rgba(7, 12, 20, 0.96), rgba(13, 20, 30, 0.99)); padding: 12px; }
.ship-schematic { width: 100%; height: auto; display: block; }
.ship-hull { fill: rgba(22, 31, 43, 0.92); stroke: rgba(120, 160, 210, 0.34); stroke-width: 2; }
.ship-gridline { stroke: rgba(120, 160, 210, 0.12); stroke-width: 1; }
.ship-compartment { stroke-width: 1.5; }
.ship-compartment-label { font-size: 9px; fill: var(--sta-text-primary, #EEF0FF); text-anchor: middle; }
.ship-compartment-metric { font-size: 8px; fill: var(--sta-text-secondary, #9AA0C0); text-anchor: middle; }
.ship-summary { display: flex; flex-wrap: wrap; gap: 8px; }
.ship-chip { padding: 4px 8px; border-radius: 999px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; border: 1px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); color: var(--sta-text-secondary, #9AA0C0); }
.ship-section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--sta-text-tertiary, #545880); margin-bottom: 6px; }
.power-grid { display: grid; gap: 6px; }
.power-row { display: grid; grid-template-columns: 88px 1fr 32px; gap: 8px; align-items: center; font-size: 11px; color: var(--sta-text-secondary, #9AA0C0); }
.power-bar { height: 6px; border-radius: 999px; background: var(--sta-border-tertiary, rgba(84,88,128,0.35)); overflow: hidden; }
.power-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, rgba(84,182,255,0.4), rgba(84,182,255,0.92)); }
.system-card { padding: 10px; margin-bottom: 8px; border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); border-radius: 6px; }
.system-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.system-name { font-size: 13px; font-weight: 600; color: var(--sta-text-primary, #EEF0FF); text-transform: capitalize; }
.system-badge { display: inline-block; padding: 2px 8px; font-size: 10px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
.ship-bar-container { width: 100%; height: 6px; background: var(--sta-border-tertiary, rgba(84,88,128,0.4)); border-radius: 3px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
.system-pct { font-size: 10px; color: var(--sta-text-tertiary, #545880); margin-top: 2px; text-align: right; }
.system-conditions { margin-top: 4px; }
.ship-condition { display: inline-block; padding: 1px 6px; font-size: 9px; border-radius: 6px; background: var(--ta-color-danger-bg); color: var(--ta-color-danger); margin-right: 4px; }
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0s !important; animation-duration: 0s !important; }
}`;

const SCHEMATIC_SLOTS = [
  { x: 132, y: 22, w: 56, h: 30 },
  { x: 64, y: 64, w: 72, h: 32 },
  { x: 144, y: 64, w: 72, h: 32 },
  { x: 224, y: 64, w: 40, h: 32 },
  { x: 64, y: 108, w: 72, h: 32 },
  { x: 144, y: 108, w: 72, h: 32 },
  { x: 224, y: 108, w: 40, h: 32 },
];

export function renderShip(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  const ship = state?.shipState;

  if (!ship) {
    const html = `<div class="widget-ship">
  <p class="empty-state">No ship data available.</p>
</div>`;
    if (!styleName) return html;
    return wrapInShadowDom({ styleName, html });
  }

  const systems = Object.entries(ship.systems);
  const operationalCount = systems.filter(([, sys]) => sys.status === 'operational').length;
  const criticalCount = systems.filter(([, sys]) => sys.status === 'critical' || sys.status === 'offline').length;
  const totalPower = Object.values(ship.powerAllocations).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const schematicSystems = systems.map(([name, sys], index) => {
    const slot = SCHEMATIC_SLOTS[index] ?? {
      x: 64 + ((index % 3) * 80),
      y: 152 + (Math.floor(index / 3) * 34),
      w: 72,
      h: 28,
    };
    const colours = STATUS_COLOURS[sys.status] ?? STATUS_COLOURS['operational']!;
    const pct = Math.max(0, Math.min(100, Number(sys.integrity) || 0));
    return `<g>
      <rect class="ship-compartment" x="${slot.x}" y="${slot.y}" width="${slot.w}" height="${slot.h}" rx="8" ry="8" fill="${colours.bg}" fill-opacity="0.18" stroke="${colours.bg}" />
      <text class="ship-compartment-label" x="${slot.x + (slot.w / 2)}" y="${slot.y + 13}">${esc(name)}</text>
      <text class="ship-compartment-metric" x="${slot.x + (slot.w / 2)}" y="${slot.y + 24}">${pct}%</text>
    </g>`;
  }).join('\n      ');
  const powerRows = Object.entries(ship.powerAllocations).map(([system, amount]) => {
    const value = Math.max(0, Number(amount) || 0);
    const width = totalPower > 0 ? Math.max(8, Math.round((value / totalPower) * 100)) : 0;
    return `<div class="power-row">
      <span>${esc(system)}</span>
      <div class="power-bar"><div class="power-fill" style="width:${width}%"></div></div>
      <span>${value}</span>
    </div>`;
  }).join('\n    ');
  const systemCards = systems.map(([name, sys]) => {
    const pct = Math.max(0, Math.min(100, Number(sys.integrity) || 0));
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

  const html = `<div class="widget-ship">
  <div>
    <div class="ship-title">${esc(ship.name)}</div>
    <div class="ship-meta">Repair parts: ${Number(ship.repairParts) || 0} · Scenes since repair: ${Number(ship.scenesSinceRepair) || 0}</div>
  </div>

  <div class="ship-layout">
    <svg class="ship-schematic" viewBox="0 0 320 190" role="img" aria-label="Ship schematic for ${esc(ship.name)}">
      <path class="ship-hull" d="M160 10 L226 34 L286 92 L226 154 L160 178 L94 154 L34 92 L94 34 Z" />
      <line class="ship-gridline" x1="160" y1="18" x2="160" y2="170" />
      <line class="ship-gridline" x1="54" y1="92" x2="266" y2="92" />
      ${schematicSystems}
    </svg>
    <div class="ship-summary">
      <span class="ship-chip">${operationalCount} operational</span>
      <span class="ship-chip">${criticalCount} critical/offline</span>
      <span class="ship-chip">${systems.length} tracked systems</span>
    </div>
  </div>

  ${powerRows ? `<div>
    <div class="ship-section-label">Power Allocation</div>
    <div class="power-grid">
      ${powerRows}
    </div>
  </div>` : ''}

  ${systemCards}
</div>`;

  if (!styleName) return html;
  return wrapInShadowDom({ styleName, inlineCss: SHIP_CSS, html });
}
