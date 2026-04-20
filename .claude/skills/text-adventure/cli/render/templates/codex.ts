import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

export function renderCodex(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  const entries = state?.codexMutations ?? [];

  const html = `<ta-codex data-entries="${esc(JSON.stringify(entries))}"></ta-codex>`;

  if (!styleName) return html;
  return wrapInShadowDom({ styleName, html });
}