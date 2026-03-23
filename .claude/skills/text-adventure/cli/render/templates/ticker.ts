// Ticker widget — time/date display bar.
// Shows current period and date from game state.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';

export function renderTicker(state: GmState | null, css: string, _options?: Record<string, unknown>): string {
  const time = state?.time;
  const period = time?.period ?? 'unknown';
  const date = time?.date ?? 'Day ?';
  const hour = time?.hour ?? 0;
  const deadline = time?.deadline;

  // Determine if the player knows the time/date
  const showTime = time?.playerKnowsTime !== false;
  const showDate = time?.playerKnowsDate !== false;

  return `
<style>${css}
.widget-ticker {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px;
  font-family: var(--ta-font-body);
  font-size: 12px; letter-spacing: 0.06em;
  border-bottom: 0.5px solid var(--color-border-tertiary);
  color: var(--color-text-secondary);
}
.ticker-period {
  text-transform: uppercase; font-weight: 600;
  color: var(--ta-color-accent);
}
.ticker-date { color: var(--color-text-tertiary); }
.ticker-deadline {
  color: var(--ta-color-warning);
  font-weight: 600;
}
</style>
<div class="widget-ticker">
  ${showTime ? `<span class="ticker-period">${esc(period)}${hour ? ` (${String(hour).padStart(2, '0')}:00)` : ''}</span>` : '<span class="ticker-period">???</span>'}
  ${showDate ? `<span class="ticker-date">${esc(date)}</span>` : '<span class="ticker-date">Date unknown</span>'}
  ${deadline ? `<span class="ticker-deadline">${esc(deadline.label)} — ${deadline.remainingScenes} scene${deadline.remainingScenes !== 1 ? 's' : ''} remaining</span>` : ''}
</div>`;
}