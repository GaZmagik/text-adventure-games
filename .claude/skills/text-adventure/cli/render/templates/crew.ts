import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

/**
 * Builds the plain HTML fallback for the crew roster.
 */
function buildCrewFallback(crew: any[]): string {
  let html = '<div class="widget-crew"><div class="widget-title">Crew Roster</div>';
  if (crew.length === 0) {
    html += '<p class="empty-state">No crew members assigned.</p>';
  } else {
    html += '<ul class="crew-list">';
    crew.forEach(c => {
      html += `<li class="crew-row"><strong>${esc(c.name)}</strong> (${esc(c.role || 'Crew')}) — Morale: ${esc(c.morale || 'Stable')}</li>`;
    });
    html += '</ul>';
  }
  html += '</div>';
  return html;
}

/**
 * Renders the crew roster widget.
 * 
 * @param {GmState | null} state - Current game state.
 * @param {string} styleName - Visual style.
 * @param {Record<string, unknown>} [_options] - Unused.
 * @returns {string} - The HTML wrapped in a <ta-crew> custom element.
 * 
 * @remarks
 * Displays a list of crew members with their current status, 
 * morale, and stress levels. Used primarily in ship-based modules.
 */
export function renderCrew(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  const crew = state?.crewMutations || [];

  return emitStandaloneCustomElement({
    tag: 'ta-crew',
    styleName,
    html: buildCrewFallback(crew),
    attrs: { 'data-crew': JSON.stringify(crew) },
  });
}
