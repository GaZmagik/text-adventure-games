// Footer button row — module-aware footer with panel toggles and sendPrompt wiring.
// Reads state.modulesActive to determine which buttons to render.
// Uses data-panel + addEventListener pattern (never onclick).
//
// Dual-mode: when called with empty styleName (from scene.ts), returns raw HTML
// for embedding in the scene's shadow DOM. When called standalone, wraps itself.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

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

const SAVE_PROMPT ='Run `tag save generate` via the Bash tool to produce my save payload. The CLI generates the checksummed SF2 string — never hand-code save encoding, checksums, or base64. Present the result as a downloadable .save.md file with YAML frontmatter.';
const EXPORT_PROMPT = 'Export my world as a downloadable .lore.md file following the exact format in modules/adventure-exporting.md. Use YAML frontmatter plus structured world data sections. Never invent a custom format.';

export function renderFooter(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  const moduleSet = new Set(state?.modulesActive ?? []);
  const hasExport = moduleSet.has('adventure-exporting');
  const hasAudio = moduleSet.has('audio');

  // Character button is always present
  const leftButtons: string[] = [
    '<button class="footer-btn" data-panel="character" aria-expanded="false">Character</button>',
  ];

  // Add module-specific buttons — dimmed when panel has no data yet
  for (const mapping of MODULE_BUTTONS) {
    if (moduleSet.has(mapping.module)) {
      const dim = !panelHasData(mapping.panel, state);
      leftButtons.push(
        `<button class="footer-btn${dim ? ' footer-btn-dim' : ''}" data-panel="${mapping.panel}" aria-expanded="false">${mapping.label}</button>`,
      );
    }
  }

  // Audio button — stopped state, player must click to play
  if (hasAudio) {
    leftButtons.push(
      '<button class="footer-btn" id="audio-btn" data-sound="ship-engine" data-duration="25">\u266b Play</button>',
    );
  }

  // Right-side action buttons
  const rightButtons: string[] = [
    `<button class="footer-btn" id="save-btn" data-prompt="${esc(SAVE_PROMPT)}" title="${esc(SAVE_PROMPT)}">Save \u2197</button>`,
  ];

  if (hasExport) {
    rightButtons.push(
      `<button class="footer-btn" id="export-btn" data-prompt="${esc(EXPORT_PROMPT)}" title="${esc(EXPORT_PROMPT)}">Export \u2197</button>`,
    );
  }

  const html = `<div class="footer-row">
  <div class="footer-left">
    ${leftButtons.join('\n    ')}
  </div>
  <div class="footer-right">
    ${rightButtons.join('\n    ')}
  </div>
</div>`;

  // When called from scene.ts with empty styleName, return raw HTML (no shadow wrapper)
  if (!styleName) return html;
  return wrapInShadowDom({ styleName, html });
}