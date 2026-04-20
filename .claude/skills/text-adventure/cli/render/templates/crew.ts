import type { GmState } from '../../types';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

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
    attrs: { 'data-crew': JSON.stringify(crew) },
  });
}
