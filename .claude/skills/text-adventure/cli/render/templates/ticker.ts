// Ticker widget — time/date display bar.
// Shows current period and date from game state.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

/**
 * Builds the plain HTML fallback for the ticker.
 */
function buildTickerFallback(period: string, date: string, hour: number | null, deadline: { label: string; remainingScenes: number } | null): string {
  let timeStr = period;
  if (hour) timeStr += ` (${String(hour).padStart(2, '0')}:00)`;
  
  let html = `<div class="widget-ticker"><span class="ticker-period">${esc(timeStr)}</span> <span class="ticker-date">${esc(date)}</span>`;
  
  if (deadline) {
    const label = deadline.remainingScenes === 1 ? 'scene' : 'scenes';
    html += ` <span class="ticker-deadline">${esc(deadline.label)} — ${esc(deadline.remainingScenes)} ${label} remaining</span>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Renders the time/date ticker widget.
 * 
 * @param {GmState | null} state - Current game state.
 * @param {string} styleName - Visual style.
 * @param {Record<string, unknown>} [_options] - Unused.
 * @returns {string} - The HTML wrapped in a <ta-ticker> custom element.
 * 
 * @remarks
 * Displays the current in-game time, period (Morning/Evening/etc.), 
 * and date. It respects the `playerKnowsTime` and `playerKnowsDate` 
 * visibility flags from the game state.
 */
export function renderTicker(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  const time = state?.time;
  const period = time?.period ?? 'unknown';
  const date = time?.date ?? 'Date unknown';
  const hour = Number(time?.hour) || 0;
  const deadline = time?.deadline ? {
    label: time.deadline.label,
    remainingScenes: Number(time.deadline.remainingScenes) || 0
  } : null;

  // Determine if the player knows the time/date
  const showTime = time?.playerKnowsTime !== false;
  const showDate = time?.playerKnowsDate !== false;

  const finalPeriod = showTime ? period : 'unknown';
  const finalDate = showDate ? date : 'Date unknown';
  const finalHour = showTime && hour ? hour : null;

  return emitStandaloneCustomElement({
    tag: 'ta-ticker',
    styleName,
    html: buildTickerFallback(finalPeriod, finalDate, finalHour, deadline),
    attrs: {
      'data-period': finalPeriod,
      'data-date': finalDate,
      'data-hour': finalHour ? String(finalHour).padStart(2, '0') : null,
      'data-deadline-label': deadline ? deadline.label : null,
      'data-deadline-remaining': deadline ? String(deadline.remainingScenes) : null,
    },
  });
}
