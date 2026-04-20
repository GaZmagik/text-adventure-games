import type { GmState } from '../../types';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

/**
 * Renders the lore codex widget.
 * 
 * @param {GmState | null} state - Current game state.
 * @param {string} styleName - Visual style.
 * @param {Record<string, unknown>} [_options] - Unused.
 * @returns {string} - The HTML wrapped in a <ta-codex> custom element.
 * 
 * @remarks
 * Displays a searchable archive of lore entries, NPC profiles, 
 * and world history discovered by the player.
 */
export function renderCodex(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  const entries = state?.codexMutations ?? [];

  return emitStandaloneCustomElement({
    tag: 'ta-codex',
    styleName,
    attrs: { 'data-entries': JSON.stringify(entries) },
  });
}
