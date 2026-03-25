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
});
