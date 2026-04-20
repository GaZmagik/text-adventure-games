// Scenario selection — accepts --data JSON with scenario list.
// Emits a <ta-scenario-select> custom element with serialised data.
// The component self-renders cards, hero, control deck, and event wiring.

import type { GmState } from '../../types';
import { emitCustomElement } from '../../lib/html';
import { emitRootCustomElement } from '../lib/shadow-wrapper';

// ── Data types ─────────────────────────────────────────────────────

type Scenario = {
  id?: string;
  title: string;
  description?: string;
  hook?: string;           // Alias for description
  preamble?: string;       // Alias for description (prototype convention)
  genre?: string[];
  genres?: string[];       // Alias for genre
  tags?: string[];         // Alias for genres
  difficulty?: string;
  players?: string;
  featured?: boolean;
  accent?: string;         // Hex colour e.g. '#78e4ff'
  svgLogo?: string;        // Raw <svg>...</svg> markup
  modules?: string;
  coverFront?: string;     // CDN URL for front cover image
  coverBack?: string;      // CDN URL for back cover image
};

// ── Main export ────────────────────────────────────────────────────

export function renderScenarioSelect(_state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  const raw = (options?.data ?? {}) as Record<string, unknown>;
  const scenarios: Scenario[] = Array.isArray(raw.scenarios)
    ? (raw.scenarios as unknown[]).filter(
        (s): s is Scenario => typeof s === 'object' && s !== null && typeof (s as Record<string, unknown>).title === 'string',
      )
    : [];

  const cssUrls = [styleName, 'common-widget', 'pregame-design'].filter(Boolean);

  return emitRootCustomElement({
    tag: 'ta-scenario-select',
    attrs: {
      'data-scenarios': JSON.stringify(scenarios),
      'data-style': styleName,
    },
    cssUrls,
    jsUrls: ['ta-components'],
  });
}
