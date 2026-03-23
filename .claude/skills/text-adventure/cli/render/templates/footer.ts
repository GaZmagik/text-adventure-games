// Footer button row — module-aware footer with panel toggles and sendPrompt wiring.
// Reads state.modulesActive to determine which buttons to render.
// Uses data-panel + addEventListener pattern (never onclick).

import type { GmState } from '../../types';

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

  // Right-side action buttons
  const rightButtons: string[] = [
    `<button class="footer-btn" id="save-btn" data-prompt="${escapeAttr(SAVE_PROMPT)}">Save ↗</button>`,
  ];

  if (hasExport) {
    rightButtons.push(
      `<button class="footer-btn" id="export-btn" data-prompt="${escapeAttr(EXPORT_PROMPT)}">Export ↗</button>`,
    );
  }

  return `
<style>${css}</style>
<div class="footer-row">
  <div class="footer-left">
    ${leftButtons.join('\n    ')}
  </div>
  <div class="footer-right">
    ${rightButtons.join('\n    ')}
  </div>
</div>
<script>
document.querySelectorAll('.footer-btn[data-panel]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var panel = this.getAttribute('data-panel');
    if (typeof togglePanel === 'function') togglePanel(panel);
  });
});
document.querySelectorAll('.footer-btn[data-prompt]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var prompt = this.getAttribute('data-prompt');
    if (typeof sendPrompt === 'function') sendPrompt(prompt);
  });
});
</script>`;
}

/** Escape a string for safe use inside an HTML attribute */
function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
