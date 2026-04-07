import { describe, test, expect } from 'bun:test';
import { checkSvgViewBox, checkPendingLevelUp } from './verify-checks';
import type { GmState } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────

function makeState(levelupPending?: boolean): GmState {
  return { _levelupPending: levelupPending } as unknown as GmState;
}

// ── checkSvgViewBox ──────────────────────────────────────────────────

describe('checkSvgViewBox', () => {
  test('passes when no svg elements present', () => {
    const failures: string[] = [];
    checkSvgViewBox('<div>no svg here</div>', failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when svg has viewBox attribute', () => {
    const failures: string[] = [];
    checkSvgViewBox('<svg viewBox="0 0 100 100"><circle r="10"/></svg>', failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when SVG tag is uppercase with VIEWBOX (case-insensitive)', () => {
    const failures: string[] = [];
    checkSvgViewBox('<SVG VIEWBOX="0 0 200 200"></SVG>', failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when viewBox has empty string value', () => {
    const failures: string[] = [];
    checkSvgViewBox('<svg viewBox=""><circle/></svg>', failures);
    expect(failures).toHaveLength(0);
  });

  test('fails when svg is missing viewBox', () => {
    const failures: string[] = [];
    checkSvgViewBox('<svg width="100" height="100"><circle r="10"/></svg>', failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('[svg-viewbox]');
    expect(failures[0]).toContain('1 <svg> element');
  });

  test('counts multiple svgs missing viewBox', () => {
    const failures: string[] = [];
    const html = '<svg><circle/></svg><svg><rect/></svg><svg viewBox="0 0 10 10"></svg>';
    checkSvgViewBox(html, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('2 <svg> elements');
  });

  test('reports singular count correctly for one missing svg', () => {
    const failures: string[] = [];
    checkSvgViewBox('<svg><circle/></svg>', failures);
    expect(failures[0]).toContain('1 <svg> element missing');
    expect(failures[0]).not.toMatch(/\d+ <svg> elements missing/);
  });

  test('passes when all svgs have viewBox', () => {
    const failures: string[] = [];
    const html = '<svg viewBox="0 0 100 100"></svg><svg viewBox="0 0 200 200"></svg>';
    checkSvgViewBox(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when svg has role="meter" (data indicator — viewBox not required)', () => {
    const failures: string[] = [];
    checkSvgViewBox('<svg class="hp-pips" role="meter" width="80" height="10"></svg>', failures);
    expect(failures).toHaveLength(0);
  });

  test('fails when non-meter svg is missing viewBox even alongside meter svgs', () => {
    const failures: string[] = [];
    const html = '<svg role="meter" width="40" height="10"></svg><svg class="scene-art"><circle/></svg>';
    checkSvgViewBox(html, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('1 <svg> element');
  });
});

// ── checkPendingLevelUp ──────────────────────────────────────────────

describe('checkPendingLevelUp', () => {
  test('passes when _levelupPending is absent', () => {
    const failures: string[] = [];
    checkPendingLevelUp('<div>no choices</div>', failures, makeState(undefined));
    expect(failures).toHaveLength(0);
  });

  test('passes when _levelupPending is false', () => {
    const failures: string[] = [];
    checkPendingLevelUp('<div>no choices</div>', failures, makeState(false));
    expect(failures).toHaveLength(0);
  });

  test('passes when _levelupPending true and data-levelup-stat present', () => {
    const failures: string[] = [];
    const html = '<button class="levelup-choice" data-levelup-stat="STR">+1 Strength</button>';
    checkPendingLevelUp(html, failures, makeState(true));
    expect(failures).toHaveLength(0);
  });

  test('passes when _levelupPending true and data-levelup-skill present', () => {
    const failures: string[] = [];
    const html = '<button class="levelup-choice" data-levelup-skill="Stealth">Stealth</button>';
    checkPendingLevelUp(html, failures, makeState(true));
    expect(failures).toHaveLength(0);
  });

  test('fails when _levelupPending true and no level-up choices in html', () => {
    const failures: string[] = [];
    checkPendingLevelUp('<div>some scene content</div>', failures, makeState(true));
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('[pending-level-up]');
    expect(failures[0]).toContain('_levelupPending');
  });

  test('fails when _levelupPending true and html has unrelated data- attributes', () => {
    const failures: string[] = [];
    const html = '<div data-prompt="Go somewhere" data-panel="character"></div>';
    checkPendingLevelUp(html, failures, makeState(true));
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('[pending-level-up]');
  });
});
