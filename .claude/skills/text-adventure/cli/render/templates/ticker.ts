// Ticker widget — time/date display bar.
// Shows current period and date from game state.

import type { GmState } from '../../types';
import { emitCustomElement } from '../../lib/html';

export function renderTicker(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  const time = state?.time;
  const period = time?.period ?? 'unknown';
  const date = time?.date ?? 'Day ?';
  const hour = Number(time?.hour) || 0;
  const deadline = time?.deadline;

  // Determine if the player knows the time/date
  const showTime = time?.playerKnowsTime !== false;
  const showDate = time?.playerKnowsDate !== false;

  return emitCustomElement('ta-ticker', {
    'data-period': showTime ? period : 'unknown',
    'data-date': showDate ? date : 'Date unknown',
    'data-hour': showTime && hour ? String(hour).padStart(2, '0') : null,
    'data-deadline-label': deadline ? deadline.label : null,
    'data-deadline-remaining': deadline ? String(Number(deadline.remainingScenes) || 0) : null,
  });
}