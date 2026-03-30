import { describe, test, expect } from 'bun:test';
import { renderHpPips, renderXpTrack } from './svg-pips';

// ── HP Pips ────────────────────────────────────────────────────────

describe('renderHpPips', () => {
  test('returns an SVG element with hp-pips class', () => {
    const result = renderHpPips(5, 10);
    expect(result).toContain('<svg');
    expect(result).toContain('</svg>');
    expect(result).toContain('hp-pips');
  });

  test('renders individual pip circles when maxHp <= 20', () => {
    const result = renderHpPips(3, 5);
    const filled = (result.match(/pip-filled/g) || []).length;
    const empty = (result.match(/pip-empty/g) || []).length;
    expect(filled).toBe(3);
    expect(empty).toBe(2);
  });

  test('renders bar mode when maxHp > 20', () => {
    const result = renderHpPips(30, 50);
    expect(result).toContain('hp-pips');
    expect(result).not.toContain('pip-filled');
    expect(result).toContain('hp-bar-fill');
  });

  test('handles zero HP with all empty pips', () => {
    const result = renderHpPips(0, 10);
    const filled = (result.match(/pip-filled/g) || []).length;
    expect(filled).toBe(0);
    const empty = (result.match(/pip-empty/g) || []).length;
    expect(empty).toBe(10);
  });

  test('handles full HP with all filled pips', () => {
    const result = renderHpPips(10, 10);
    const empty = (result.match(/pip-empty/g) || []).length;
    expect(empty).toBe(0);
    const filled = (result.match(/pip-filled/g) || []).length;
    expect(filled).toBe(10);
  });

  test('uses danger colour when HP <= 25%', () => {
    const result = renderHpPips(2, 10);
    expect(result).toContain('--sta-color-danger');
  });

  test('uses warning colour when HP <= 50%', () => {
    const result = renderHpPips(4, 10);
    expect(result).toContain('--sta-color-warning');
  });

  test('uses success colour when HP > 50%', () => {
    const result = renderHpPips(8, 10);
    expect(result).toContain('--sta-color-success');
  });

  test('includes accessible aria-label', () => {
    const result = renderHpPips(7, 10);
    expect(result).toContain('aria-label');
    expect(result).toContain('7');
    expect(result).toContain('10');
  });

  test('clamps HP to non-negative', () => {
    const result = renderHpPips(-3, 10);
    const filled = (result.match(/pip-filled/g) || []).length;
    expect(filled).toBe(0);
  });

  test('clamps HP to maxHp', () => {
    const result = renderHpPips(15, 10);
    const filled = (result.match(/pip-filled/g) || []).length;
    expect(filled).toBe(10);
  });

  test('handles maxHp of zero gracefully', () => {
    const result = renderHpPips(0, 0);
    expect(result).toContain('<svg');
    expect(result).toContain('</svg>');
  });

  test('bar mode fill width reflects HP percentage', () => {
    const result = renderHpPips(25, 50);
    expect(result).toContain('50%');
  });

  test('includes numeric label in output', () => {
    const result = renderHpPips(7, 12);
    expect(result).toContain('7');
    expect(result).toContain('12');
  });
});

// ── XP Track ───────────────────────────────────────────────────────

describe('renderXpTrack', () => {
  test('returns an SVG element with xp-track class', () => {
    const result = renderXpTrack(50, 100);
    expect(result).toContain('<svg');
    expect(result).toContain('</svg>');
    expect(result).toContain('xp-track');
  });

  test('calculates fill width as percentage', () => {
    const result = renderXpTrack(50, 100);
    expect(result).toContain('50%');
  });

  test('handles zero XP', () => {
    const result = renderXpTrack(0, 100);
    expect(result).toContain('0%');
  });

  test('caps fill at 100%', () => {
    const result = renderXpTrack(150, 100);
    expect(result).toContain('100%');
  });

  test('uses accent colour for XP fill', () => {
    const result = renderXpTrack(50, 100);
    expect(result).toContain('--sta-color-accent');
  });

  test('includes accessible aria-label', () => {
    const result = renderXpTrack(75, 300);
    expect(result).toContain('aria-label');
    expect(result).toContain('75');
    expect(result).toContain('300');
  });

  test('handles xpForLevel of zero gracefully', () => {
    const result = renderXpTrack(0, 0);
    expect(result).toContain('<svg');
    expect(result).toContain('</svg>');
  });

  test('includes numeric label in output', () => {
    const result = renderXpTrack(42, 100);
    expect(result).toContain('42');
    expect(result).toContain('100');
  });

  test('includes xp-fill class on fill element', () => {
    const result = renderXpTrack(50, 100);
    expect(result).toContain('xp-fill');
  });
});
