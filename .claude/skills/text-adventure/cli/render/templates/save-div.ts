// Save div — hidden #save-data div containing pre-computed save payload.
// Read from state or accept data via options.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';

export function renderSaveDiv(state: GmState | null, css: string, options?: Record<string, unknown>): string {
  // Accept explicit data or serialise state
  const payload = options?.data
    ? JSON.stringify(options.data)
    : state
      ? JSON.stringify(state)
      : '{}';

  return `
${css ? '<style>' + css + '</style>' : ''}
<div id="save-data" style="display:none" data-payload='${esc(payload)}'>
  <!-- Pre-computed save payload for consumption by the save command -->
</div>`;
}