// Star chart data panel — shows current system, known systems list,
// plotted course if any.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';

export function renderStarchart(state: GmState | null, css: string, _options?: Record<string, unknown>): string {
  if (!state?.visitedRooms?.length) {
    return `
${css ? '<style>' + css + '</style>' : ''}
<div class="empty-state"><p>No star systems charted yet.</p></div>`;
  }

  const currentRoom = state?.currentRoom ?? 'Unknown System';
  const visitedRooms = state?.visitedRooms ?? [];
  const plottedCourse = state?.navPlottedCourse ?? null;

  const systemList = visitedRooms.map(sys => {
    const isCurrent = sys === currentRoom;
    return `<li class="system-item${isCurrent ? ' system-current' : ''}">${esc(sys)}${isCurrent ? ' (current)' : ''}</li>`;
  }).join('\n      ');

  const courseSteps = plottedCourse && plottedCourse.length > 0
    ? plottedCourse.map((step, i) => {
        const isCurrent = step === currentRoom;
        return `<li class="course-step${isCurrent ? ' step-current' : ''}">${i + 1}. ${esc(step)}</li>`;
      }).join('\n        ')
    : '';

  return `
<style>${css}
.widget-starchart { font-family: var(--ta-font-body); padding: 16px; }
.starchart-title { font-family: var(--ta-font-heading); font-size: 18px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px; }
.starchart-current { font-size: 13px; color: var(--ta-color-accent); margin-bottom: 12px; }
.starchart-summary { font-size: 11px; color: var(--color-text-tertiary); margin-bottom: 12px; }
.chart-section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-text-tertiary); margin: 12px 0 6px; }
.system-list { list-style: none; padding: 0; margin: 0; }
.system-item { padding: 4px 0; border-bottom: 0.5px solid var(--color-border-tertiary); font-size: 12px; color: var(--color-text-secondary); }
.system-current { color: var(--ta-color-accent); font-weight: 600; }
.course-list { list-style: none; padding: 0; margin: 0; }
.course-step { padding: 3px 0; font-size: 12px; color: var(--color-text-secondary); }
.step-current { color: var(--ta-color-accent); font-weight: 600; }
.no-course { font-size: 11px; color: var(--color-text-tertiary); font-style: italic; }
</style>
<div class="widget-starchart">
  <div class="starchart-title">Star Chart</div>
  <div class="starchart-current">${esc(currentRoom)}</div>
  <div class="starchart-summary">${visitedRooms.length} system${visitedRooms.length !== 1 ? 's' : ''} charted</div>

  <div class="chart-section-label">Known Systems</div>
  <ul class="system-list">
    ${systemList || '<li class="system-item" style="font-style:italic;color:var(--color-text-tertiary)">No systems charted</li>'}
  </ul>

  <div class="chart-section-label">Plotted Course</div>
  ${courseSteps
    ? `<ol class="course-list">${courseSteps}</ol>`
    : '<p class="no-course">No course plotted</p>'}
</div>`;
}