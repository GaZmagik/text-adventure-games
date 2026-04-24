// Footer button row — module-aware footer with panel toggles and sendPrompt wiring.
// Reads state.modulesActive to determine which buttons to render.
// Uses data-panel + addEventListener pattern (never onclick).
//
// Dual-mode: standalone renders include the custom-element runtime; scene composition
// uses the same element bare so ta-scene can upgrade it inside its own shadow root.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

/**
 * Module-to-button mapping.
 * Defines which UI panels are enabled by specific engine modules.
 * Mirrors § Module Footer Button Table in style-reference.md.
 */
const MODULE_BUTTONS: { module: string; panel: string; label: string }[] = [
  { module: 'lore-codex', panel: 'codex', label: 'Codex' },
  { module: 'ship-systems', panel: 'ship', label: 'Ship' },
  { module: 'crew-manifest', panel: 'crew', label: 'Crew' },
  { module: 'star-chart', panel: 'nav', label: 'Nav chart' },
  { module: 'geo-map', panel: 'map', label: 'Map' },
  { module: 'core-systems', panel: 'quests', label: 'Quests' },
];

/**
 * Check whether a panel has meaningful data to display.
 * Empty panels are rendered with a 'dim' visual state to manage player expectations.
 */
function panelHasData(panel: string, state: GmState | null): boolean {
  if (!state) return false;
  switch (panel) {
    case 'codex':
      return (state.codexMutations?.length ?? 0) > 0;
    case 'ship':
      return state.shipState != null;
    case 'crew':
      return (state.crewMutations?.length ?? 0) > 0;
    case 'nav':
      return (state.visitedRooms?.length ?? 0) > 1 || state.navPlottedCourse != null;
    case 'map':
      return state.mapState != null;
    case 'quests':
      return (state.quests?.length ?? 0) > 0;
    default:
      return true;
  }
}

/**
 * Prompt strings for Save/Export buttons.
 * These are injected into the HTML so the player can copy them if automated messaging fails.
 */
const SAVE_PROMPT =
  'Run `tag save generate` via the Bash tool to produce my save payload. The CLI generates the checksummed SF2 string — never hand-code save encoding, checksums, or base64. Present the result as a downloadable .save.md file with YAML frontmatter.';
const EXPORT_PROMPT =
  'Export my world as a downloadable .lore.md file following the exact format in modules/adventure-exporting.md. Use YAML frontmatter plus structured world data sections. Never invent a custom format.';

/**
 * Builds the plain HTML fallback for the footer.
 * This is used for server-side composition and non-JS fallback display.
 */
function buildFooterFallback(
  state: GmState | null,
  dimPanels: string[],
  hasExport: boolean,
  hasAudio: boolean,
): string {
  const moduleSet = new Set(state?.modulesActive ?? []);
  const leftButtons = ['<button class="footer-btn" data-panel="character" aria-expanded="false">Character</button>'];

  for (const mapping of MODULE_BUTTONS) {
    if (!moduleSet.has(mapping.module)) continue;
    const dimClass = dimPanels.includes(mapping.panel) ? ' footer-btn-dim' : '';
    leftButtons.push(
      `<button class="footer-btn${dimClass}" data-panel="${mapping.panel}" aria-expanded="false">${mapping.label}</button>`,
    );
  }

  if (state?._levelupPending) {
    leftButtons.push(
      '<button class="footer-btn footer-btn-levelup" data-panel="levelup" aria-expanded="false">✦ Level Up</button>',
    );
  }

  if (hasAudio) {
    leftButtons.push(
      '<button class="footer-btn" id="audio-btn" data-sound="ship-engine" data-duration="25">♫ Play</button>',
    );
  }

  const rightButtons = [
    `<button class="footer-btn" id="save-btn" data-prompt="${esc(SAVE_PROMPT)}" title="${esc(SAVE_PROMPT)}">Save ↗</button>`,
  ];
  if (hasExport) {
    rightButtons.push(
      `<button class="footer-btn" id="export-btn" data-prompt="${esc(EXPORT_PROMPT)}" title="${esc(EXPORT_PROMPT)}">Export ↗</button>`,
    );
  }

  return `<div class="footer-row"><div class="footer-left">${leftButtons.join('')}</div><div class="footer-right">${rightButtons.join('')}</div></div>`;
}

/**
 * Renders the module-aware footer widget.
 *
 * @param {GmState | null} state - Current game state.
 * @param {string} styleName - Visual style.
 * @param {Record<string, unknown>} [_options] - Unused.
 * @returns {string} - The footer HTML wrapped in a <ta-footer> custom element.
 *
 * @remarks
 * The footer is the primary navigation hub for the player's dashboard.
 * It uses a `data-panel` routing system to open overlays in the parent scene.
 */
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

  return emitStandaloneCustomElement({
    tag: 'ta-footer',
    styleName,
    html: buildFooterFallback(state, dimPanels, hasExport, hasAudio),
    attrs: {
      'data-modules': state?.modulesActive?.join(' ') || '',
      'data-dim-panels': dimPanels.join(' '),
      'data-has-export': hasExport ? 'true' : null,
      'data-has-audio': hasAudio ? 'true' : null,
      'data-levelup-pending': state?._levelupPending ? 'true' : null,
      'data-save-prompt': SAVE_PROMPT,
      'data-export-prompt': hasExport ? EXPORT_PROMPT : null,
    },
  });
}
