import { describe, expect, it } from 'bun:test';
import { COMMON_WIDGET_CSS } from './common-css';

describe('COMMON_WIDGET_CSS', () => {
  it('is a non-empty string', () => {
    expect(typeof COMMON_WIDGET_CSS).toBe('string');
    expect(COMMON_WIDGET_CSS.length).toBeGreaterThan(0);
  });

  it('contains .widget-title rule', () => {
    expect(COMMON_WIDGET_CSS).toContain('.widget-title');
    expect(COMMON_WIDGET_CSS).toContain('font-size: 22px');
    expect(COMMON_WIDGET_CSS).toContain('font-weight: 700');
    expect(COMMON_WIDGET_CSS).toContain('var(--ta-font-heading)');
  });

  it('contains .widget-subtitle rule', () => {
    expect(COMMON_WIDGET_CSS).toContain('.widget-subtitle');
    expect(COMMON_WIDGET_CSS).toContain('font-size: 12px');
    expect(COMMON_WIDGET_CSS).toContain('margin-bottom: 20px');
  });

  it('contains .widget-section rule', () => {
    expect(COMMON_WIDGET_CSS).toContain('.widget-section');
    expect(COMMON_WIDGET_CSS).toContain('margin-bottom: 16px');
  });

  it('contains .widget-label rule', () => {
    expect(COMMON_WIDGET_CSS).toContain('.widget-label');
    expect(COMMON_WIDGET_CSS).toContain('text-transform: uppercase');
    expect(COMMON_WIDGET_CSS).toContain('letter-spacing: 0.1em');
  });

  it('contains .confirm-btn rule with full styling', () => {
    expect(COMMON_WIDGET_CSS).toContain('.confirm-btn');
    expect(COMMON_WIDGET_CSS).toContain('var(--ta-color-accent)');
    expect(COMMON_WIDGET_CSS).toContain('border-radius: 8px');
    expect(COMMON_WIDGET_CSS).toContain('text-transform: uppercase');
  });

  it('contains .confirm-btn:hover rule', () => {
    expect(COMMON_WIDGET_CSS).toContain('.confirm-btn:hover');
    expect(COMMON_WIDGET_CSS).toContain('var(--ta-color-accent-hover)');
  });

  it('contains .confirm-btn:focus-visible rule', () => {
    expect(COMMON_WIDGET_CSS).toContain('.confirm-btn:focus-visible');
    expect(COMMON_WIDGET_CSS).toContain('var(--ta-color-focus');
  });

  // ── Inline narrative classes ────────────────────────────────────────

  it('contains .nar-item rule using accent colour', () => {
    expect(COMMON_WIDGET_CSS).toContain('.nar-item');
    expect(COMMON_WIDGET_CSS).toContain('var(--ta-color-accent');
  });

  it('contains .nar-npc rule using success colour', () => {
    expect(COMMON_WIDGET_CSS).toContain('.nar-npc');
    expect(COMMON_WIDGET_CSS).toContain('var(--ta-color-success');
  });

  it('contains .nar-dlg rule with italic style', () => {
    expect(COMMON_WIDGET_CSS).toContain('.nar-dlg');
    expect(COMMON_WIDGET_CSS).toMatch(/\.nar-dlg[^}]*font-style:\s*italic/);
  });

  it('contains .nar-sfx rule with uppercase transform', () => {
    expect(COMMON_WIDGET_CSS).toContain('.nar-sfx');
    expect(COMMON_WIDGET_CSS).toContain('var(--ta-color-warning');
    expect(COMMON_WIDGET_CSS).toMatch(/\.nar-sfx[^}]*text-transform:\s*uppercase/);
  });

  it('contains .nar-danger rule using danger colour', () => {
    expect(COMMON_WIDGET_CSS).toContain('.nar-danger');
    expect(COMMON_WIDGET_CSS).toContain('var(--ta-color-danger');
  });

  it('contains .nar-lore rule using conviction colour', () => {
    expect(COMMON_WIDGET_CSS).toContain('.nar-lore');
    expect(COMMON_WIDGET_CSS).toContain('var(--ta-color-conviction');
  });

  // ── Action card sub-elements ────────────────────────────────────────

  it('contains .act-desc rule with muted colour', () => {
    expect(COMMON_WIDGET_CSS).toContain('.act-desc');
    expect(COMMON_WIDGET_CSS).toMatch(/\.act-desc[^}]*font-size:\s*11px/);
  });

  it('contains .act-check rule using warning colour', () => {
    expect(COMMON_WIDGET_CSS).toContain('.act-check');
    expect(COMMON_WIDGET_CSS).toContain('var(--ta-color-warning');
    expect(COMMON_WIDGET_CSS).toMatch(/\.act-check[^}]*text-transform:\s*uppercase/);
  });

  // ── Discovery banners and evidence cards ────────────────────────────

  it('contains .discovery-banner base rule with uppercase text', () => {
    expect(COMMON_WIDGET_CSS).toContain('.discovery-banner');
    expect(COMMON_WIDGET_CSS).toMatch(/\.discovery-banner[^}]*text-transform:\s*uppercase/);
    expect(COMMON_WIDGET_CSS).toMatch(/\.discovery-banner[^}]*text-align:\s*center/);
  });

  it('contains .discovery-quest variant using accent colour', () => {
    expect(COMMON_WIDGET_CSS).toContain('.discovery-quest');
    expect(COMMON_WIDGET_CSS).toMatch(/\.discovery-quest[^}]*var\(--ta-color-accent/);
  });

  it('contains .discovery-codex variant using conviction colour', () => {
    expect(COMMON_WIDGET_CSS).toContain('.discovery-codex');
    expect(COMMON_WIDGET_CSS).toMatch(/\.discovery-codex[^}]*var\(--ta-color-conviction/);
  });

  it('contains .evidence-card with left border', () => {
    expect(COMMON_WIDGET_CSS).toContain('.evidence-card');
    expect(COMMON_WIDGET_CSS).toMatch(/\.evidence-card[^}]*border-left/);
  });

  // ── XP toast ────────────────────────────────────────────────────────

  it('contains .xp-toast rule using xp colour', () => {
    expect(COMMON_WIDGET_CSS).toContain('.xp-toast');
    expect(COMMON_WIDGET_CSS).toMatch(/\.xp-toast[^}]*var\(--ta-color-xp/);
    expect(COMMON_WIDGET_CSS).toMatch(/\.xp-toast[^}]*font-weight:\s*700/);
  });

  it('contains xp-pop keyframe animation', () => {
    expect(COMMON_WIDGET_CSS).toContain('@keyframes xp-pop');
  });
});
