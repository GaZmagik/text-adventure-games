// Footer button row — module-aware footer with panel toggles and sendPrompt wiring.
// Reads state.modulesActive to determine which buttons to render.
// Uses data-panel + addEventListener pattern (never onclick).

import type { GmState } from '../../types';
import { escapeAttr } from '../../lib/html';

/** Module-to-button mapping, mirroring § Module Footer Button Table in style-reference.md */
const MODULE_BUTTONS: { module: string; panel: string; label: string }[] = [
  { module: 'lore-codex', panel: 'codex', label: 'Codex' },
  { module: 'ship-systems', panel: 'ship', label: 'Ship' },
  { module: 'crew-manifest', panel: 'crew', label: 'Crew' },
  { module: 'star-chart', panel: 'nav', label: 'Nav chart' },
  { module: 'geo-map', panel: 'map', label: 'Map' },
  { module: 'core-systems', panel: 'quests', label: 'Quests' },
];

const SAVE_PROMPT = 'Generate my save file as a downloadable .save.md file following the exact format in modules/save-codex.md. Use YAML frontmatter plus an encoded SC1: or SF1: payload string. Never write game state as human-readable markdown.';
const EXPORT_PROMPT = 'Export my world as a downloadable .lore.md file following the exact format in modules/adventure-exporting.md. Use YAML frontmatter plus structured world data sections. Never invent a custom format.';

export function renderFooter(state: GmState | null, css: string, _options?: Record<string, unknown>): string {
  const modules = state?.modulesActive ?? [];
  const hasExport = modules.includes('adventure-exporting');
  const hasAudio = modules.includes('audio');

  // Character button is always present
  const leftButtons: string[] = [
    '<button class="footer-btn" data-panel="character" aria-expanded="false">Character</button>',
  ];

  // Add module-specific buttons
  for (const mapping of MODULE_BUTTONS) {
    if (modules.includes(mapping.module)) {
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
    `<button class="footer-btn" id="save-btn" data-prompt="${escapeAttr(SAVE_PROMPT)}">Save \u2197</button>`,
  ];

  if (hasExport) {
    rightButtons.push(
      `<button class="footer-btn" id="export-btn" data-prompt="${escapeAttr(EXPORT_PROMPT)}">Export \u2197</button>`,
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