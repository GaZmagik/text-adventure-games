// Save div — hidden #save-data div containing pre-computed save payload.
// Read from state or accept data via options.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

/**
 * Renders a hidden div containing the serialised game state.
 *
 * @param {GmState | null} state - Current game state.
 * @param {string} styleName - Visual style.
 * @param {Record<string, unknown>} [options] - Optional override data.
 * @returns {string} - The HTML wrapped in a Shadow DOM.
 *
 * @remarks
 * This is a utility widget used to embed the raw state into the rendered
 * HTML, allowing the `tag save` command to extract the context from the
 * file itself.
 */
export function renderSaveDiv(state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  // Accept explicit data or serialise state
  const payload = options?.data ? JSON.stringify(options.data) : state ? JSON.stringify(state) : '{}';

  return wrapInShadowDom({
    styleName,
    html: `<div id="save-data" style="display:none" data-payload="${esc(payload)}">
  <!-- Pre-computed save payload for consumption by the save command -->
</div>`,
  });
}
