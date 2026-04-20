// Pregame Design System — shared structural helpers for pre-game widgets.
// Hero, control deck, stage header, status chips, and badges.
// All output is theme-agnostic; visual treatment comes from --ta-* / --sta-* variables.

import { esc } from '../../lib/html';

// ── Types ──────────────────────────────────────────────────────────

/** Options for rendering a large Hero section (e.g., Scenario Intro). */
export type HeroOpts = {
  /** Optional kicker text. */
  kicker?: string;
  /** Main heading. */
  heading: string;
  /** Primary description. */
  copy?: string;
  /** Optional status labels to display as chips. */
  badges?: string[];
};

/** Options for rendering the primary interaction deck. */
export type ControlDeckOpts = {
  /** Optional kicker text. */
  kicker?: string;
  /** Optional section heading. */
  heading?: string;
  /** The name of the currently selected item. */
  selectedTitle: string;
  /** Narrative description of the selected item. */
  selectedPreamble?: string | undefined;
  /** Unique ID for the status message area. */
  statusId?: string;
  /** Raw HTML content containing action buttons. */
  actionHtml: string;
};

/** Options for rendering a sub-stage heading within a pre-game widget. */
export type StageHeaderOpts = {
  /** Optional kicker text. */
  kicker?: string;
  /** Primary heading. */
  heading: string;
  /** Optional secondary description. */
  copy?: string;
};

// ── Helpers ────────────────────────────────────────────────────────

/** Renders a standard pre-game kicker. */
function kickerEl(text: string): string {
  return `<p class="pd-kicker">${esc(text)}</p>`;
}

// ── Builders ───────────────────────────────────────────────────────

/**
 * Renders a high-fidelity Hero header for pre-game dashboards.
 * @remarks Uses `.pd-hero` vocabulary.
 */
export function renderHero(opts: HeroOpts): string {
  const parts: string[] = [];
  if (opts.kicker) parts.push(kickerEl(opts.kicker));
  parts.push(`<h1 class="pd-hero-heading">${esc(opts.heading)}</h1>`);
  if (opts.copy) parts.push(`<p class="pd-hero-copy">${esc(opts.copy)}</p>`);
  if (opts.badges && opts.badges.length > 0) {
    const chips = opts.badges.map(b => renderStatusChip(b)).join('');
    parts.push(`<div class="pd-hero-badges">${chips}</div>`);
  }
  return `<header class="pd-hero">${parts.join('\n')}</header>`;
}

/**
 * Renders a 'Control Deck' — the primary interaction area for selection widgets.
 * @remarks Uses `.pd-control-deck` vocabulary.
 */
export function renderControlDeck(opts: ControlDeckOpts): string {
  const copyParts: string[] = [];
  if (opts.kicker) copyParts.push(kickerEl(opts.kicker));
  if (opts.heading) copyParts.push(`<h2 class="pd-deck-heading">${esc(opts.heading)}</h2>`);
  copyParts.push(`<p class="pd-selection-title" id="pd-sel-title">${esc(opts.selectedTitle)}</p>`);
  if (opts.selectedPreamble) {
    copyParts.push(`<p class="pd-selection-preamble" id="pd-sel-preamble">${esc(opts.selectedPreamble)}</p>`);
  }
  const statusId = opts.statusId ?? 'pd-sel-status';
  copyParts.push(`<p class="pd-selection-status" id="${esc(statusId)}" aria-live="polite"></p>`);

  return `<section class="pd-control-deck">
  <div class="pd-selection-copy">${copyParts.join('\n')}</div>
  <div class="pd-selection-actions">${opts.actionHtml}</div>
</section>`;
}

/**
 * Renders a structured header for a secondary stage or wizard step.
 */
export function renderStageHeader(opts: StageHeaderOpts): string {
  const parts: string[] = [];
  if (opts.kicker) parts.push(kickerEl(opts.kicker));
  parts.push(`<h2 class="pd-stage-heading">${esc(opts.heading)}</h2>`);
  if (opts.copy) parts.push(`<p class="pd-stage-copy">${esc(opts.copy)}</p>`);
  return `<div class="pd-stage-header">${parts.join('\n')}</div>`;
}

/** Renders a standard status chip. */
export function renderStatusChip(text: string): string {
  return `<span class="pd-status-chip">${esc(text)}</span>`;
}

/** Renders a pill-style badge with optional visual variants. */
export function renderBadge(text: string, variant?: 'default' | 'featured' | 'accent'): string {
  const modifier = variant && variant !== 'default' ? ` pd-badge--${variant}` : '';
  return `<span class="pd-badge${modifier}">${esc(text)}</span>`;
}

// ── Subpanel ───────────────────────────────────────────────────────

/** Options for a sub-panel card. */
export type SubpanelOpts = {
  kicker?: string;
  title: string;
  copy?: string;
  contentHtml: string;
};

/**
 * Renders a sub-panel card, typically used in grids (e.g., character selection).
 * @remarks Uses `.pd-subpanel` vocabulary.
 */
export function renderSubpanel(opts: SubpanelOpts): string {
  const headerParts: string[] = [];
  if (opts.kicker) headerParts.push(kickerEl(opts.kicker));
  headerParts.push(`<h3 class="pd-subpanel-title">${esc(opts.title)}</h3>`);
  if (opts.copy) headerParts.push(`<p class="pd-subpanel-copy">${esc(opts.copy)}</p>`);
  return `<article class="pd-subpanel">
  <div class="pd-subpanel-header">${headerParts.join('\n')}</div>
  <div class="pd-subpanel-content">${opts.contentHtml}</div>
</article>`;
}

// ── Summary Row ────────────────────────────────────────────────────

/** Renders a clean key-value summary row. */
export function renderSummaryRow(label: string, value?: string): string {
  return `<div class="pd-summary-row"><span class="pd-summary-label">${esc(label)}</span><strong class="pd-summary-value">${value ? esc(value) : ''}</strong></div>`;
}

// ── CSS ────────────────────────────────────────────────────────────

/**
 * Base structural CSS for the Pregame Design System.
 * 
 * @remarks
 * This CSS provides the layout, padding, and grid structures for the 
 * pre-game dashboards. It relies on CSS variables for theme-specific 
 * skinning.
 */
export const PREGAME_DESIGN_CSS = `
/* ── Hero ─────────────────────────────────────────────── */
.pd-hero {
  padding: clamp(20px, 4vw, 40px);
  border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4));
  border-radius: 16px;
  margin-bottom: 16px;
}
.pd-kicker {
  margin: 0 0 4px;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ta-color-accent, #4ECDC4);
}
.pd-hero-heading {
  margin: 0;
  font-family: var(--ta-font-heading);
  font-size: clamp(22px, 5vw, 36px);
  font-weight: 700;
  line-height: 1.05;
  color: var(--sta-text-primary, #EEF0FF);
}
.pd-hero-copy {
  margin: 10px 0 0;
  max-width: 44rem;
  font-size: 13px;
  line-height: 1.6;
  color: var(--sta-text-secondary, #9AA0C0);
}
.pd-hero-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

/* ── Control Deck ─────────────────────────────────────── */
.pd-control-deck {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: end;
  padding: 16px;
  border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4));
  border-radius: 14px;
  margin-bottom: 16px;
}
.pd-selection-copy { min-width: 0; }
.pd-deck-heading {
  margin: 0;
  font-size: 11px;
  font-family: var(--ta-font-heading);
  color: var(--sta-text-tertiary, #545880);
  text-transform: uppercase;
  letter-spacing: 0.14em;
}
.pd-selection-title {
  margin: 4px 0 0;
  font-family: var(--ta-font-heading);
  font-size: clamp(18px, 3vw, 26px);
  font-weight: 700;
  line-height: 1.1;
  color: var(--sta-text-primary, #EEF0FF);
}
.pd-selection-preamble {
  margin: 6px 0 0;
  max-width: 42rem;
  font-size: 12px;
  line-height: 1.6;
  color: var(--sta-text-secondary, #9AA0C0);
}
.pd-selection-status {
  margin: 8px 0 0;
  min-height: 1.2em;
  font-size: 12px;
  color: var(--ta-color-accent, #4ECDC4);
}
.pd-selection-actions {
  display: grid;
  gap: 8px;
  justify-items: end;
}

/* ── Stage Header ─────────────────────────────────────── */
.pd-stage-header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: end;
  margin-bottom: 16px;
}
.pd-stage-heading {
  margin: 2px 0 0;
  font-family: var(--ta-font-heading);
  font-size: clamp(16px, 2vw, 22px);
  font-weight: 700;
  color: var(--sta-text-primary, #EEF0FF);
}
.pd-stage-copy {
  margin: 0;
  max-width: 28rem;
  font-size: 12px;
  line-height: 1.6;
  color: var(--sta-text-secondary, #9AA0C0);
}

/* ── Status Chip ──────────────────────────────────────── */
.pd-status-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4));
  background: rgba(84,88,128,0.06);
  color: var(--sta-text-secondary, #9AA0C0);
  font-size: 11px;
}

/* ── Badge ────────────────────────────────────────────── */
.pd-badge {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 999px;
  border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4));
  background: rgba(84,88,128,0.06);
  color: var(--sta-text-secondary, #9AA0C0);
  font-size: 11px;
  text-transform: capitalize;
}
.pd-badge--featured {
  border-color: var(--ta-color-accent, #4ECDC4);
  background: var(--ta-color-accent-bg, rgba(78,205,196,0.08));
  color: var(--ta-color-accent, #4ECDC4);
}
.pd-badge--accent {
  border-color: var(--ta-color-accent, #4ECDC4);
  color: var(--ta-color-accent, #4ECDC4);
}

/* ── Subpanel ─────────────────────────────────────────── */
.pd-subpanel {
  padding: 14px;
  border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4));
  border-radius: 12px;
  margin-bottom: 12px;
}
.pd-subpanel-header { margin-bottom: 10px; }
.pd-subpanel-title {
  margin: 2px 0 0;
  font-family: var(--ta-font-heading);
  font-size: 14px;
  font-weight: 700;
  color: var(--sta-text-primary, #EEF0FF);
}
.pd-subpanel-copy {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--sta-text-secondary, #9AA0C0);
}

/* ── Summary Row ──────────────────────────────────────── */
.pd-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 4px 0;
  font-size: 12px;
  border-bottom: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.2));
}
.pd-summary-label { color: var(--sta-text-secondary, #9AA0C0); }
.pd-summary-value { color: var(--sta-text-primary, #EEF0FF); font-weight: 600; }

/* ── Reduced Motion ───────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .pd-hero, .pd-control-deck, .pd-subpanel, .pd-status-chip, .pd-badge { transition: none; }
}
`;
