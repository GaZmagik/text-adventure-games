// Footer button row — module-aware footer with panel toggles and sendPrompt wiring.
// Reads state.modulesActive to determine which buttons to render.
// Uses data-panel + addEventListener pattern (never onclick).
//
// Dual-mode: when called with empty styleName (from scene.ts), returns raw HTML
// for embedding in the scene's shadow DOM. When called standalone, wraps itself.

import type { GmState } from '../../types';
import { emitCustomElement } from '../../lib/html';

/** Module-to-button mapping, mirroring § Module Footer Button Table in style-reference.md */
const MODULE_BUTTONS: { module: string; panel: string; label: string }[] = [
  { module: 'lore-codex', panel: 'codex', label: 'Codex' },
  { module: 'ship-systems', panel: 'ship', label: 'Ship' },
  { module: 'crew-manifest', panel: 'crew', label: 'Crew' },
  { module: 'star-chart', panel: 'nav', label: 'Nav chart' },
  { module: 'geo-map', panel: 'map', label: 'Map' },
  { module: 'core-systems', panel: 'quests', label: 'Quests' },
];

/** Check whether a panel has meaningful data to display. */
function panelHasData(panel: string, state: GmState | null): boolean {
  if (!state) return false;
  switch (panel) {
    case 'codex': return (state.codexMutations?.length ?? 0) > 0;
    case 'ship': return state.shipState != null;
    case 'crew': return (state.crewMutations?.length ?? 0) > 0;
    case 'nav': return (state.visitedRooms?.length ?? 0) > 1 || state.navPlottedCourse != null;
    case 'map': return state.mapState != null;
    case 'quests': return (state.quests?.length ?? 0) > 0;
    default: return true;
  }
}

export function renderFooter(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  const moduleSet = new Set(state?.modulesActive ?? []);
  const hasExport = moduleSet.has('adventure-exporting');
  const hasAudio = moduleSet.has('audio');
  
  const dimPanels: string[] = [];
  for (const mapping of MODULE_BUTTONS) {
    if (moduleSet.has(mapping.module) && !panelHasData(mapping.panel, state)) {
      dimPanels.push(mapping.panel);
    }
  }

  return emitCustomElement('ta-footer', {
    'data-modules': state?.modulesActive?.join(' ') || '',
    'data-dim-panels': dimPanels.join(' '),
    'data-has-export': hasExport ? 'true' : null,
    'data-has-audio': hasAudio ? 'true' : null,
    'data-levelup-pending': state?._levelupPending ? 'true' : null,
  });
}