import { describe, test, expect } from 'bun:test';
import { renderTicker } from './ticker';
import { createDefaultState } from '../../lib/state-store';

describe('renderTicker', () => {
  test('renders time and date data attributes', () => {
    const state = createDefaultState();
    state.time = { 
      period: 'Morning', 
      date: 'Day 12', 
      elapsed: 11, 
      hour: 8,
      playerKnowsTime: true,
      playerKnowsDate: true,
      calendarSystem: 'standard',
      deadline: null
    };
    const html = renderTicker(state, '');
    expect(html).toContain('data-period="Morning"');
    expect(html).toContain('data-date="Day 12"');
    expect(html).toContain('data-hour="08"');
  });

  test('respects visibility flags', () => {
    const state = createDefaultState();
    state.time = { 
      period: 'Morning', 
      date: 'Day 12', 
      elapsed: 11, 
      hour: 8,
      playerKnowsTime: false,
      playerKnowsDate: false,
      calendarSystem: 'standard',
      deadline: null
    };
    const html = renderTicker(state, '');
    expect(html).toContain('data-period="unknown"');
    expect(html).toContain('data-date="Date unknown"');
  });

  test('includes fallback HTML content', () => {
    const state = createDefaultState();
    state.time = { 
      period: 'Evening', 
      date: 'Day 1', 
      elapsed: 0, 
      hour: 20,
      playerKnowsTime: true,
      playerKnowsDate: true,
      calendarSystem: 'standard',
      deadline: null
    };
    const html = renderTicker(state, '');
    expect(html).toContain('widget-ticker');
    expect(html).toContain('Evening (20:00)');
    expect(html).toContain('Day 1');
  });

  test('renders deadline information when present', () => {
    const state = createDefaultState();
    state.time = {
      period: 'Afternoon',
      date: 'Day 5',
      elapsed: 5,
      hour: 14,
      playerKnowsTime: true,
      playerKnowsDate: true,
      calendarSystem: 'standard',
      deadline: { label: 'Oxygen', remainingScenes: 3 }
    };
    const html = renderTicker(state, '');
    expect(html).toContain('data-deadline-label="Oxygen"');
    expect(html).toContain('data-deadline-remaining="3"');
    expect(html).toContain('Oxygen — 3 scenes remaining');
  });

  test('uses singular "scene" for deadline with 1 scene remaining', () => {
    const state = createDefaultState();
    state.time = {
      period: 'Night',
      date: 'Day 5',
      elapsed: 6,
      hour: 22,
      playerKnowsTime: true,
      playerKnowsDate: true,
      calendarSystem: 'standard',
      deadline: { label: 'Self-Destruct', remainingScenes: 1 }
    };
    const html = renderTicker(state, '');
    expect(html).toContain('Self-Destruct — 1 scene remaining');
  });

  test('escapes fallback ticker and deadline text', () => {
    const state = createDefaultState();
    state.time = {
      period: '<img src=x onerror=alert("x")> "quote" &',
      date: 'Day & <img src=x onerror=alert(1)>',
      elapsed: 0,
      hour: 20,
      playerKnowsTime: true,
      playerKnowsDate: true,
      calendarSystem: 'standard',
      deadline: { label: 'Oxygen & <img src=x onerror=alert(2)>', remainingScenes: 2 },
    };
    const html = renderTicker(state, '');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(&quot;x&quot;)&gt;');
    expect(html).toContain('Oxygen &amp;');
  });
});
