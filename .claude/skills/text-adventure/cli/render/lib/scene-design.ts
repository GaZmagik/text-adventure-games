// Scene Design System — shared structural helpers for in-game scene widgets.
// All output is theme-agnostic; visual treatment comes from --ta-* / --sta-* variables.

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
.action-card .btn-title,
ta-action-card .btn-title {
  display: block;
  font-weight: 700;
  font-size: 1em;
  margin-bottom: 2px;
}

/* ── Atmo-FX Primitives ────────────────────────────── */
:host([data-vfx*="glitch"]) { animation: vfx-glitch-anim 0.3s infinite; }
@keyframes vfx-glitch-anim {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 1px); }
  40% { transform: translate(-2px, -1px); }
  60% { transform: translate(2px, 1px); }
  80% { transform: translate(2px, -1px); }
  100% { transform: translate(0); }
}

:host([data-vfx*="low-light"]) { filter: brightness(0.6) contrast(1.2) sepia(0.2) hue-rotate(180deg); }

:host([data-vfx*="static"])::after {
  content: ""; position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;
  background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyBAMAAADsEZWCAAAAGFBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAN89vVAAAACHRSTlMA7v7+/v7+/rVvT0EAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAwSURBVDjLY2AYBaNgFIyCUUAGAQMDYwAByEAZBAwMjEEEYAMDAzGACMAGBgYGYgAAX9IBAnvS+DIAAAAASUVORK5CYII=");
  opacity: 0.05; z-index: 1000;
}

:host([data-vfx*="radiation"]) { animation: vfx-pulse-warning 2s infinite; }
@keyframes vfx-pulse-warning {
  0%, 100% { background-color: transparent; }
  50% { background-color: rgba(144, 238, 144, 0.05); }
}

.tracked-quest-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 4px 9px;
  border: 0.5px solid var(--ta-color-accent, #4ECDC4);
  border-radius: 999px;
  color: var(--sta-text-primary, #EEF0FF);
  background: var(--ta-color-accent-bg, rgba(78,205,196,0.10));
  font-size: 11px;
}
.tracked-quest-badge span {
  color: var(--ta-color-accent, #4ECDC4);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 9px;
}

/* ── Reduced Motion ──────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .sc-chapter-header, .sc-meta-strip, .sc-choice-stage, .sc-roll-result { transition: none; }
  :host([data-vfx*="glitch"]),
  :host([data-vfx*="radiation"]) { animation: none; }
}
`;
