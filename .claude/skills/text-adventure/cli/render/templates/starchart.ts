import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

export function renderStarchart(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  if (!state?.visitedRooms?.length) {
    const html = `<div class="empty-state"><p>No star systems charted yet.</p></div>`;
    if (!styleName) return html;
    return wrapInShadowDom({ styleName, html });
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

  const html = `<ta-starchart data-chart="${esc(JSON.stringify(config))}"></ta-starchart>`;

  if (!styleName) return html;
  return wrapInShadowDom({ styleName, html });
}
