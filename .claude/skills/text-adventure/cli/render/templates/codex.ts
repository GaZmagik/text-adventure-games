// Lore codex panel — list of codex entries with state badges
// (locked/partial/discovered/redacted), discovery stamps.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

const STATE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  locked:     { bg: 'var(--color-border-tertiary)', text: 'var(--color-text-tertiary)', label: 'Locked' },
  partial:    { bg: 'var(--ta-badge-partial-bg)', text: 'var(--ta-badge-partial-text)', label: 'Partial' },
  discovered: { bg: 'var(--ta-badge-success-bg)', text: 'var(--ta-badge-success-text)', label: 'Discovered' },
  redacted:   { bg: 'var(--ta-badge-failure-bg)', text: 'var(--ta-badge-failure-text)', label: 'Redacted' },
};

const CODEX_CSS = `.widget-codex { font-family: var(--ta-font-body); padding: 16px; }
.codex-title { font-family: var(--ta-font-heading); font-size: 18px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px; }
.codex-summary { font-size: 11px; color: var(--color-text-tertiary); margin-bottom: 12px; }
.codex-entry { padding: 10px; margin-bottom: 8px; border: 0.5px solid var(--color-border-tertiary); border-radius: 6px; }
.codex-header { display: flex; justify-content: space-between; align-items: center; }
.codex-id { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
.codex-badge { display: inline-block; padding: 2px 8px; font-size: 10px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
.codex-meta { font-size: 10px; color: var(--color-text-tertiary); margin-top: 4px; }
.codex-secrets { margin-top: 6px; }
.codex-secret { display: inline-block; padding: 2px 6px; font-size: 10px; border-radius: 4px; background: var(--ta-color-accent-bg); color: var(--ta-color-accent); margin-right: 4px; margin-bottom: 2px; }`;

export function renderCodex(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  const entries = state?.codexMutations ?? [];

  if (entries.length === 0) {
    const html = `<div class="widget-codex">
  <p class="empty-state">No codex entries recorded.</p>
</div>`;
    if (!styleName) return html;
    return wrapInShadowDom({ styleName, html });
  }

  let discoveredCount = 0;
  const rows = entries.map(entry => {
    if (entry.state === 'discovered') discoveredCount++;
    const style = STATE_STYLES[entry.state] ?? STATE_STYLES['locked']!;
    const discoveredAt = entry.discoveredAt !== undefined ? `Scene ${Number(entry.discoveredAt) || 0}` : '';
    const via = entry.via ? esc(entry.via) : '';
    const secrets = entry.secrets && entry.secrets.length > 0
      ? `<div class="codex-secrets">${entry.secrets.map(s => `<span class="codex-secret">${esc(s)}</span>`).join(' ')}</div>`
      : '';

    return `
      <div class="codex-entry">
        <div class="codex-header">
          <span class="codex-id">${esc(entry.id)}</span>
          <span class="codex-badge" style="background:${style.bg};color:${style.text}">${style.label}</span>
        </div>
        ${discoveredAt || via ? `<div class="codex-meta">${discoveredAt}${via ? ` · via ${via}` : ''}</div>` : ''}
        ${secrets}
      </div>`;
  }).join('\n');

  const html = `<div class="widget-codex">
  <div class="codex-title">Lore Codex</div>
  <div class="codex-summary">${discoveredCount} of ${entries.length} entries discovered</div>
  ${rows}
</div>`;

  if (!styleName) return html;
  return wrapInShadowDom({ styleName, inlineCss: CODEX_CSS, html });
}