import type { CodexMutation, GmState } from '../../types';
import { esc } from '../../lib/html';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

type CodexFallbackEntry = CodexMutation & {
  snippet?: string;
};

/**
 * Builds the plain HTML fallback for the codex.
 */
function buildCodexFallback(entries: CodexFallbackEntry[]): string {
  let html = '<div class="widget-codex"><div class="widget-title">Lore Codex</div>';
  if (entries.length === 0) {
    html += '<p class="empty-state">No entries discovered yet.</p>';
  } else {
    html += '<ul class="codex-list">';
    entries.forEach(e => {
      html += `<li><strong>${esc(e.title || e.id)}</strong>: ${esc(e.snippet || '...')}</li>`;
    });
    html += '</ul>';
  }
  html += '</div>';
  return html;
}

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
    html: buildCodexFallback(entries),
    attrs: { 'data-entries': JSON.stringify(entries) },
  });
}
