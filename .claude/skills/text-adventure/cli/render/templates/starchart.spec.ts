import { describe, test, expect } from 'bun:test';
import { renderStarchart } from './starchart';
import { createDefaultState } from '../../lib/state-store';

describe('renderStarchart', () => {
  test('renders chart data attribute', () => {
    const state = createDefaultState();
    state.currentRoom = 'Sol';
    state.visitedRooms = ['Sol', 'Alpha Centauri'];
    const html = renderStarchart(state, '');
    expect(html).toContain('data-chart=');
    expect(html).toContain('Sol');
    expect(html).toContain('Alpha Centauri');
  });

  test('includes fallback HTML content', () => {
    const state = createDefaultState();
    state.currentRoom = 'Terra';
    state.visitedRooms = ['Terra', 'Mars'];
    const html = renderStarchart(state, '');
    expect(html).toContain('widget-starchart');
    expect(html).toContain('Current: Terra');
    expect(html).toContain('Mars');
  });

  test('renders empty state when no systems charted', () => {
    const state = createDefaultState();
    state.visitedRooms = [];
    const html = renderStarchart(state, '');
    expect(html).toContain('No star systems charted yet');
  });

  test('escapes fallback chart system text', () => {
    const state = createDefaultState();
    state.currentRoom = '<img src=x onerror=alert("x")> "quote" &';
    state.visitedRooms = [state.currentRoom, 'Mars & <img src=x onerror=alert(1)>'];
    const html = renderStarchart(state, '');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(&quot;x&quot;)&gt;');
    expect(html).toContain('Mars &amp;');
  });
});
