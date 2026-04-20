import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

export function renderCrew(state: GmState | null, styleName: string, _options?: Record<string, unknown>): string {
  const crew = state?.crewMutations || [];

  const html = `<ta-crew data-crew="${esc(JSON.stringify(crew))}"></ta-crew>`;

  if (!styleName) return html;
  return wrapInShadowDom({ styleName, html });
}