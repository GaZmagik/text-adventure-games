// Save div — hidden #save-data div containing pre-computed save payload.
// Read from state or accept data via options.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

export function renderSaveDiv(state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  // Accept explicit data or serialise state
  const payload = options?.data
    ? JSON.stringify(options.data)
    : state
      ? JSON.stringify(state)
      : '{}';

  return wrapInShadowDom({
    styleName,
    html: `<div id="save-data" style="display:none" data-payload="${esc(payload)}">
  <!-- Pre-computed save payload for consumption by the save command -->
</div>`,
  });
}