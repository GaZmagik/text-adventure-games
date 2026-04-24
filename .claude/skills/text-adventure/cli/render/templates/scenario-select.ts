// Scenario selection — accepts --data JSON with scenario list.
// Emits a <ta-scenario-select> custom element with serialised data.
// The component self-renders cards, hero, control deck, and event wiring.

import type { GmState } from '../../types';
import { emitRootCustomElement } from '../lib/shadow-wrapper';

// ── Data types ─────────────────────────────────────────────────────

/**
 * Represents a game scenario/adventure module.
 */
type Scenario = {
  /** Internal ID for the scenario. */
  id?: string;
  /** The primary display title. */
  title: string;
  /** Narrative summary of the scenario. */
  description?: string;
  /** Alias for description (common in GM prompts). */
  hook?: string;
  /** Alias for description (legacy prototype convention). */
  preamble?: string;
  /** Primary genre (e.g., 'Cyberpunk', 'Space Opera'). */
  genre?: string[];
  /** Alias for genre (pluralised). */
  genres?: string[];
  /** Alias for genres. */
  tags?: string[];
  /** Qualitative difficulty (e.g., 'Standard', 'Brutal'). */
  difficulty?: string;
  /** Player count or type (e.g., '1-4 Players'). */
  players?: string;
  /** If true, the scenario is highlighted as the primary 'Hero' option. */
  featured?: boolean;
  /** Hex colour code for themed UI elements (e.g., '#78e4ff'). */
  accent?: string;
  /** Raw <svg> markup for the scenario icon. */
  svgLogo?: string;
  /** Space-separated list of required engine modules. */
  modules?: string;
  /** CDN URL for front cover art. */
  coverFront?: string;
  /** CDN URL for back cover art. */
  coverBack?: string;
};

// ── Main export ────────────────────────────────────────────────────

/**
 * Renders the scenario selection dashboard.
 *
 * @param {GmState | null} _state - Current game state (null at pre-game).
 * @param {string} styleName - Visual style.
 * @param {Record<string, unknown>} [options] - Configuration data.
 * @returns {string} - The HTML wrapped in a <ta-scenario-select> custom element.
 *
 * @remarks
 * This widget implements a high-fidelity 'Storefront' UI for selecting
 * the next adventure. It supports featured scenarios with distinct
 * accent colours and logos, and provides a 'Hero' section for the primary choice.
 */
export function renderScenarioSelect(
  _state: GmState | null,
  styleName: string,
  options?: Record<string, unknown>,
): string {
  const raw = (options?.data ?? {}) as Record<string, unknown>;
  const scenarios: Scenario[] = Array.isArray(raw.scenarios)
    ? (raw.scenarios as unknown[]).filter(
        (s): s is Scenario =>
          typeof s === 'object' && s !== null && typeof (s as Record<string, unknown>).title === 'string',
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
