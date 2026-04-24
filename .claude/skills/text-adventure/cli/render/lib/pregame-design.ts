// Pregame Design System — shared structural helpers for pre-game widgets.
// All output is theme-agnostic; visual treatment comes from --ta-* / --sta-* variables.

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
  .pd-hero, .pd-control-deck, .pd-subpanel, .pd-status-chip, .pd-badge, .scenario-card { transition: none; }
}

/* ── Scenario Grid ─────────────────────────────────────── */
.scenario-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

/* ── Scenario Card ─────────────────────────────────────── */
.scenario-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: var(--sta-bg-secondary, rgba(84,88,128,0.06));
  border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4));
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  min-height: 180px;
}
.scenario-card:hover {
  border-color: var(--ta-color-accent, #4ECDC4);
  background: var(--ta-color-accent-bg, rgba(78,205,196,0.08));
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}
.scenario-card[aria-pressed="true"] {
  border-color: var(--ta-color-accent, #4ECDC4);
  background: var(--ta-color-accent-bg, rgba(78,205,196,0.12));
  box-shadow: inset 0 0 0 1px var(--ta-color-accent, #4ECDC4);
}

.scenario-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--ta-card-accent, var(--ta-color-accent, #4ECDC4));
  opacity: 0.6;
}

.scenario-card-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.scenario-title {
  font-family: var(--ta-font-heading);
  font-size: 18px;
  font-weight: 700;
  color: var(--sta-text-primary, #EEF0FF);
  margin-bottom: 8px;
}

.scenario-desc {
  font-size: 13px;
  line-height: 1.5;
  color: var(--sta-text-secondary, #9AA0C0);
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.scenario-genres {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}
.genre-pill {
  padding: 2px 8px;
  background: rgba(84,88,128,0.15);
  border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.2));
  border-radius: 4px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--sta-text-secondary, #9AA0C0);
}

.scenario-meta {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--sta-text-tertiary, #545880);
}

.scenario-select-btn {
  margin-top: 12px;
  padding: 8px;
  background: transparent;
  border: 1px solid var(--sta-border-tertiary, rgba(84,88,128,0.4));
  border-radius: 6px;
  color: var(--sta-text-secondary, #9AA0C0);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.scenario-card:hover .scenario-select-btn {
  border-color: var(--ta-color-accent, #4ECDC4);
  color: var(--ta-color-accent, #4ECDC4);
}
.scenario-card[aria-pressed="true"] .scenario-select-btn {
  background: var(--ta-color-accent, #4ECDC4);
  color: #fff;
  border-color: var(--ta-color-accent, #4ECDC4);
}
`;
