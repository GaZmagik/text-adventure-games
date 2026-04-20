// Scene Design System — shared structural helpers for in-game scene widgets.
// Chapter headers, meta strips, dividers, quotes, choice stages, roll metrics.
// All output is theme-agnostic; visual treatment comes from --ta-* / --sta-* variables.

import { esc } from '../../lib/html';

// ── Types ──────────────────────────────────────────────────────────

/** Options for rendering a chapter-style header. */
export type SceneChapterOpts = {
  /** Optional small text above the title (e.g., 'Chapter 1'). */
  kicker?: string;
  /** Primary heading text. */
  title: string;
  /** Optional italicised descriptive text below the title. */
  dek?: string;
};

/** Data for a single metadata card in a strip. */
export type SceneMetaCard = {
  /** Small uppercase label (e.g., 'Location'). */
  label: string;
  /** Bold primary value (e.g., 'Hyperion Station'). */
  value: string;
};

/** Options for rendering a choice or interaction stage. */
export type ChoiceStageOpts = {
  /** Optional kicker text. */
  kicker?: string;
  /** Primary stage heading (e.g., 'What do you do?'). */
  heading: string;
  /** Optional lead-in copy. */
  copy?: string;
  /** Raw HTML content containing buttons or interaction elements. */
  contentHtml: string;
  /** Unique ID for the status message area (default: 'sc-choice-status'). */
  statusId?: string;
};

// ── Helpers ────────────────────────────────────────────────────────

/** Renders a standard kicker paragraph. */
function kickerEl(text: string): string {
  return `<p class="sc-kicker">${esc(text)}</p>`;
}

// ── Builders ───────────────────────────────────────────────────────

/**
 * Renders a high-fidelity chapter header.
 * @remarks Uses `.sc-chapter-header` vocabulary.
 */
export function renderSceneChapterHeader(opts: SceneChapterOpts): string {
  const parts: string[] = [];
  if (opts.kicker) parts.push(kickerEl(opts.kicker));
  parts.push(`<h2 class="sc-chapter-title">${esc(opts.title)}</h2>`);
  if (opts.dek) parts.push(`<p class="sc-dek">${esc(opts.dek)}</p>`);
  return `<div class="sc-chapter-header">${parts.join('\n')}</div>`;
}

/**
 * Renders a horizontal strip of metadata cards.
 * @remarks Uses `.sc-meta-strip` vocabulary.
 */
export function renderSceneMetaStrip(cards: SceneMetaCard[]): string {
  const cardHtml = cards.map(c =>
    `<div class="sc-meta-card"><span class="sc-meta-label">${esc(c.label)}</span><strong class="sc-meta-value">${esc(c.value)}</strong></div>`,
  ).join('\n');
  return `<div class="sc-meta-strip">${cardHtml}</div>`;
}

/**
 * Renders a decorative SVG divider with central node.
 * @remarks Uses `.sc-divider` vocabulary.
 */
export function renderSceneDivider(): string {
  return `<div class="sc-divider" aria-hidden="true">
  <svg class="sc-divider-mark" viewBox="0 0 520 48" focusable="false">
    <path d="M16 24H182"></path>
    <path d="M338 24H504"></path>
    <path d="M202 24C210 11 220 11 228 24C236 37 246 37 254 24"></path>
    <path d="M266 24C274 11 284 11 292 24C300 37 310 37 318 24"></path>
    <circle cx="260" cy="24" r="6"></circle>
  </svg>
</div>`;
}

/**
 * Renders a thematic blockquote.
 * @remarks Uses `.sc-quote` vocabulary.
 */
export function renderSceneQuote(text: string): string {
  return `<blockquote class="sc-quote">${esc(text)}</blockquote>`;
}

/**
 * Renders a self-contained section for player choices or dice rolls.
 * @remarks Uses `.sc-choice-stage` vocabulary.
 */
export function renderChoiceStage(opts: ChoiceStageOpts): string {
  const headerParts: string[] = [];
  if (opts.kicker) headerParts.push(kickerEl(opts.kicker));
  headerParts.push(`<h2 class="sc-choice-heading">${esc(opts.heading)}</h2>`);
  if (opts.copy) headerParts.push(`<p class="sc-choice-copy">${esc(opts.copy)}</p>`);
  const statusId = opts.statusId ?? 'sc-choice-status';
  return `<section class="sc-choice-stage">
  <div class="sc-choice-header">${headerParts.join('\n')}</div>
  <div class="sc-choice-content">${opts.contentHtml}</div>
  <p class="sc-choice-status" id="${esc(statusId)}" aria-live="polite"></p>
</section>`;
}

/**
 * Renders a key-value metric line, typically for dice roll breakdowns.
 */
export function renderRollMetric(label: string, value: string): string {
  return `<div class="sc-roll-metric"><span class="sc-roll-metric-label">${esc(label)}</span><strong class="sc-roll-metric-value">${esc(value)}</strong></div>`;
}

/**
 * Renders a full-width banner announcing a roll result.
 * @param {string} state - The outcome state ('success', 'failure', 'critical').
 * @param {string} text - The display message.
 */
export function renderRollResultBanner(state: string, text: string): string {
  return `<div class="sc-roll-result" data-state="${esc(state)}" aria-live="polite">${esc(text)}</div>`;
}

// ── CSS ────────────────────────────────────────────────────────────

/**
 * Base structural CSS for the Scene Design System.
 * 
 * @remarks
 * This CSS provides the layout, padding, and positioning for all `sc-*` elements.
 * It is theme-agnostic and relies on CSS variables (e.g., `--ta-color-accent`, 
 * `--sta-text-primary`) for colors and typography.
 */
export const SCENE_DESIGN_CSS = `
/* ── Scene Chapter Header ────────────────────────────── */
.sc-chapter-header {
  margin-bottom: 16px;
}
.sc-kicker {
  margin: 0 0 4px;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ta-color-accent, #4ECDC4);
}
.sc-chapter-title {
  margin: 0;
  font-family: var(--ta-font-heading);
  font-size: clamp(18px, 3vw, 28px);
  font-weight: 700;
  line-height: 1.1;
  color: var(--sta-text-primary, #EEF0FF);
}
.sc-dek {
  margin: 8px 0 0;
  max-width: 44rem;
  font-size: 13px;
  line-height: 1.6;
  color: var(--sta-text-secondary, #9AA0C0);
  font-style: italic;
}

/* ── Scene Meta Strip ────────────────────────────────── */
.sc-meta-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.sc-meta-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 14px;
  border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4));
  border-radius: 8px;
  min-width: 100px;
}
.sc-meta-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--sta-text-tertiary, #545880);
}
.sc-meta-value {
  font-family: var(--ta-font-heading);
  font-size: 13px;
  font-weight: 600;
  color: var(--sta-text-primary, #EEF0FF);
}

/* ── Scene Divider ───────────────────────────────────── */
.sc-divider {
  display: flex;
  justify-content: center;
  margin: 20px 0;
  opacity: 0.4;
}
.sc-divider-mark {
  width: min(100%, 520px);
  height: auto;
}
.sc-divider-mark path,
.sc-divider-mark circle {
  fill: none;
  stroke: var(--sta-border-tertiary, rgba(84,88,128,0.4));
  stroke-width: 1;
}
.sc-divider-mark circle {
  fill: var(--sta-border-tertiary, rgba(84,88,128,0.4));
}

/* ── Scene Quote ─────────────────────────────────────── */
.sc-quote {
  margin: 16px 0;
  padding: 12px 20px;
  border-left: 2px solid var(--ta-color-accent, #4ECDC4);
  font-family: var(--sta-font-serif, Georgia, serif);
  font-size: 14px;
  font-style: italic;
  line-height: 1.6;
  color: var(--sta-text-secondary, #9AA0C0);
}

/* ── Choice Stage ────────────────────────────────────── */
.sc-choice-stage {
  padding: 14px;
  border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4));
  border-radius: 12px;
  margin-top: 16px;
}
.sc-choice-header {
  margin-bottom: 12px;
}
.sc-choice-heading {
  margin: 2px 0 0;
  font-family: var(--ta-font-heading);
  font-size: clamp(16px, 2vw, 22px);
  font-weight: 700;
  color: var(--sta-text-primary, #EEF0FF);
}
.sc-choice-copy {
  margin: 4px 0 0;
  max-width: 36rem;
  font-size: 12px;
  line-height: 1.5;
  color: var(--sta-text-secondary, #9AA0C0);
}
.sc-choice-content {
  margin-bottom: 10px;
}
.sc-choice-status {
  margin: 8px 0 0;
  min-height: 1.2em;
  font-size: 12px;
  color: var(--ta-color-accent, #4ECDC4);
}

/* ── Roll Metric ─────────────────────────────────────── */
.sc-roll-metric {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 6px 0;
  font-size: 12px;
  border-bottom: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.2));
}
.sc-roll-metric-label {
  color: var(--sta-text-secondary, #9AA0C0);
}
.sc-roll-metric-value {
  color: var(--sta-text-primary, #EEF0FF);
  font-weight: 600;
}

/* ── Roll Result Banner ──────────────────────────────── */
.sc-roll-result {
  margin: 12px 0;
  padding: 12px 16px;
  border-radius: 8px;
  font-family: var(--ta-font-heading);
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4));
  color: var(--sta-text-secondary, #9AA0C0);
}
.sc-roll-result[data-state="success"] {
  color: var(--ta-color-success, #5BBA6F);
  border-color: var(--ta-color-success, #5BBA6F);
  background: rgba(91,186,111,0.06);
}
.sc-roll-result[data-state="failure"] {
  color: var(--ta-color-danger, #E05252);
  border-color: var(--ta-color-danger, #E05252);
  background: rgba(224,82,82,0.06);
}
.sc-roll-result[data-state="critical"] {
  color: var(--ta-color-xp, #FFD700);
  border-color: var(--ta-color-xp, #FFD700);
  background: rgba(255,215,0,0.06);
}

/* ── Button Title Structure ──────────────────────────── */
.poi-btn .btn-title,
.action-btn .btn-title,
.action-card .btn-title {
  display: block;
  font-weight: 700;
  font-size: 1em;
  margin-bottom: 2px;
}

/* ── Reduced Motion ──────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .sc-chapter-header, .sc-meta-strip, .sc-choice-stage, .sc-roll-result { transition: none; }
}
`;
