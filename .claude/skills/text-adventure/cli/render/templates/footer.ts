// Footer button row — module-aware footer with panel toggles and sendPrompt wiring.
// Reads state.modulesActive to determine which buttons to render.
// Uses data-panel + addEventListener pattern (never onclick).

import type { GmState } from '../../types';
import { esc } from '../../lib/html';

/** Module-to-button mapping, mirroring § Module Footer Button Table in style-reference.md */
const MODULE_BUTTONS: { module: string; panel: string; label: string }[] = [
  { module: 'lore-codex', panel: 'codex', label: 'Codex' },
  { module: 'ship-systems', panel: 'ship', label: 'Ship' },
  { module: 'crew-manifest', panel: 'crew', label: 'Crew' },
  { module: 'star-chart', panel: 'nav', label: 'Nav chart' },
  { module: 'geo-map', panel: 'map', label: 'Map' },
  { module: 'core-systems', panel: 'quests', label: 'Quests' },
];

const SAVE_PROMPT = 'Run `tag save generate` via the Bash tool to produce my save payload. The CLI generates the checksummed SF2 string — never hand-code save encoding, checksums, or base64. Present the result as a downloadable .save.md file with YAML frontmatter.';
const EXPORT_PROMPT = 'Export my world as a downloadable .lore.md file following the exact format in modules/adventure-exporting.md. Use YAML frontmatter plus structured world data sections. Never invent a custom format.';

export function renderFooter(state: GmState | null, css: string, _options?: Record<string, unknown>): string {
  const moduleSet = new Set(state?.modulesActive ?? []);
  const hasExport = moduleSet.has('adventure-exporting');
  const hasAudio = moduleSet.has('audio');

  // Character button is always present
  const leftButtons: string[] = [
    '<button class="footer-btn" data-panel="character" aria-expanded="false">Character</button>',
  ];

  // Add module-specific buttons
  for (const mapping of MODULE_BUTTONS) {
    if (moduleSet.has(mapping.module)) {
      leftButtons.push(
        `<button class="footer-btn" data-panel="${mapping.panel}" aria-expanded="false">${mapping.label}</button>`,
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

  return `
${css ? '<style>' + css + '</style>' : ''}
<div class="footer-row">
  <div class="footer-left">
    ${leftButtons.join('\n    ')}
  </div>
  <div class="footer-right">
    ${rightButtons.join('\n    ')}
  </div>
</div>`;
}