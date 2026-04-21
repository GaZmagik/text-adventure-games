import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

/**
 * Builds the plain HTML fallback for the starchart.
 */
function buildStarchartFallback(config: any): string {
  let html = '<div class="widget-starchart"><div class="widget-title">Star Chart</div>';
  html += `<p class="chart-location">Current: ${esc(config.current)}</p>`;
  html += '<ul class="chart-systems">';
  config.systems.forEach((s: any) => {
    const isCurrent = s.name === config.current ? ' (Current)' : '';
    html += `<li>${esc(s.name)}${isCurrent}</li>`;
  });
  html += '</ul></div>';
  return html;
}

/**
 * Renders the navigational star chart widget.
 * 
 * @param {GmState | null} state - Current game state.
 * @param {string} styleName - Visual style.
 * @param {Record<string, unknown>} [_options] - Unused.
 * @returns {string} - The HTML wrapped in a <ta-starchart> custom element.
 * 
 * @remarks
 * This widget provides a procedural map of visited and plotted systems.
 * It calculates a deterministic grid layout based on system names to 
 * ensure the map remains consistent between renders.
 */
export function renderStarchart(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  if (!state?.visitedRooms?.length) {
    const html = `<div class="empty-state"><p>No star systems charted yet.</p></div>`;
    return emitStandaloneCustomElement({ tag: 'ta-starchart', styleName, html });
  }

  const currentRoom = state?.currentRoom ?? 'Unknown System';
  const visitedRooms = state?.visitedRooms ?? [];
  const plottedCourse = state?.navPlottedCourse ?? null;
  const chartedSystems = Array.from(new Set([...visitedRooms, ...(plottedCourse ?? [])]));

  // Pre-calculate layout for the component
  const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(chartedSystems.length))));
  const xStep = cols > 1 ? 200 / (cols - 1) : 0;
  const yStep = Math.ceil(chartedSystems.length / cols) > 1 ? 120 / (Math.ceil(chartedSystems.length / cols) - 1) : 0;

  const systems = chartedSystems.map((name, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const seed = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return {
      name,
      x: Math.round(40 + (col * xStep) + (seed % 18 - 9)),
      y: Math.round(36 + (row * yStep) + (seed % 12 - 6))
    };
  });

  const config = {
    current: currentRoom,
    systems: systems,
    plottedCourse: plottedCourse
  };

  return emitStandaloneCustomElement({
    tag: 'ta-starchart',
    styleName,
    html: buildStarchartFallback(config),
    attrs: { 'data-chart': JSON.stringify(config) },
  });
}
