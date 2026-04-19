import { describe, expect, it } from 'bun:test';
import { outcomeBadgeStyle } from './outcome-badge';

describe('outcomeBadgeStyle', () => {
  it('returns success styling for success outcomes', () => {
    for (const outcome of ['success', 'narrow_success'] as const) {
      const badge = outcomeBadgeStyle(outcome);
      expect(badge.bg).toBe('var(--ta-badge-success-bg)');
      expect(badge.text).toBe('var(--ta-badge-success-text)');
      expect(badge.border).toBe('transparent');
    }
  });

  it('returns critical success styling with border', () => {
    for (const outcome of ['critical_success', 'decisive_success'] as const) {
      const badge = outcomeBadgeStyle(outcome);
      expect(badge.bg).toBe('var(--ta-badge-success-bg)');
      expect(badge.text).toBe('var(--ta-badge-success-text)');
      expect(badge.border).toBe('var(--ta-badge-crit-success-border)');
    }
  });

  it('returns failure styling for failure outcomes', () => {
    for (const outcome of ['failure', 'narrow_failure'] as const) {
      const badge = outcomeBadgeStyle(outcome);
      expect(badge.bg).toBe('var(--ta-badge-failure-bg)');
      expect(badge.text).toBe('var(--ta-badge-failure-text)');
      expect(badge.border).toBe('transparent');
    }
  });

  it('returns critical failure styling with border', () => {
    for (const outcome of ['critical_failure', 'decisive_failure'] as const) {
      const badge = outcomeBadgeStyle(outcome);
      expect(badge.bg).toBe('var(--ta-badge-failure-bg)');
      expect(badge.text).toBe('var(--ta-badge-failure-text)');
      expect(badge.border).toBe('var(--ta-badge-crit-failure-border)');
    }
  });

  it('returns success styling for partial_success', () => {
    const badge = outcomeBadgeStyle('partial_success');
    expect(badge.bg).toBe('var(--ta-badge-success-bg)');
    expect(badge.text).toBe('var(--ta-badge-success-text)');
    expect(badge.border).toBe('transparent');
  });

  it('returns partial/default styling for unknown outcomes', () => {
    const badge = outcomeBadgeStyle('unknown');
    expect(badge.bg).toBe('var(--ta-badge-partial-bg)');
    expect(badge.text).toBe('var(--ta-badge-partial-text)');
    expect(badge.border).toBe('transparent');
  });

  it('returns dedicated styling for quiet, alert, and hostile encounter outcomes', () => {
    expect(outcomeBadgeStyle('quiet')).toEqual({
      bg: 'var(--ta-badge-neutral-bg, #2a3a5c)',
      text: 'var(--ta-badge-neutral-text, #a0c4ff)',
      border: 'transparent',
    });
    expect(outcomeBadgeStyle('alert')).toEqual({
      bg: 'var(--ta-badge-warning-bg, #5c4a2a)',
      text: 'var(--ta-badge-warning-text, #ffc080)',
      border: 'transparent',
    });
    expect(outcomeBadgeStyle('hostile')).toEqual({
      bg: 'var(--ta-badge-danger-bg, #5c2a3a)',
      text: 'var(--ta-badge-danger-text, #ffa0c0)',
      border: 'transparent',
    });
  });
});
