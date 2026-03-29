// Star chart data panel — shows current system, known systems list,
// plotted course if any.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

const STARCHART_CSS = `.widget-starchart { font-family: var(--ta-font-body); padding: 16px; }
.starchart-title { font-family: var(--ta-font-heading); font-size: 18px; font-weight: 700; color: var(--sta-text-primary, #EEF0FF); margin-bottom: 4px; }
.starchart-current { font-size: 13px; color: var(--ta-color-accent); margin-bottom: 12px; }
.starchart-summary { font-size: 11px; color: var(--sta-text-tertiary, #545880); margin-bottom: 12px; }
.chart-section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--sta-text-tertiary, #545880); margin: 12px 0 6px; }
.system-list { list-style: none; padding: 0; margin: 0; }
.system-item { padding: 4px 0; border-bottom: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); font-size: 12px; color: var(--sta-text-secondary, #9AA0C0); }
.system-current { color: var(--ta-color-accent); font-weight: 600; }
.course-list { list-style: none; padding: 0; margin: 0; }
.course-step { padding: 3px 0; font-size: 12px; color: var(--sta-text-secondary, #9AA0C0); }
.step-current { color: var(--ta-color-accent); font-weight: 600; }
.no-course { font-size: 11px; color: var(--sta-text-tertiary, #545880); font-style: italic; }`;

export function renderStarchart(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  if (!state?.visitedRooms?.length) {
    const html = `<div class="empty-state"><p>No star systems charted yet.</p></div>`;
    if (!styleName) return html;
    return wrapInShadowDom({ styleName, html });
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

  const html = `<div class="widget-starchart">
  <div class="starchart-title">Star Chart</div>
  <div class="starchart-current">${esc(currentRoom)}</div>
  <div class="starchart-summary">${visitedRooms.length} system${visitedRooms.length !== 1 ? 's' : ''} charted</div>

  <div class="chart-section-label">Known Systems</div>
  <ul class="system-list">
    ${systemList || '<li class="system-item" style="font-style:italic;color:var(--sta-text-tertiary, #545880)">No systems charted</li>'}
  </ul>

  <div class="chart-section-label">Plotted Course</div>
  ${courseSteps
    ? `<ol class="course-list">${courseSteps}</ol>`
    : '<p class="no-course">No course plotted</p>'}
</div>`;

  if (!styleName) return html;
  return wrapInShadowDom({ styleName, inlineCss: STARCHART_CSS, html });
}