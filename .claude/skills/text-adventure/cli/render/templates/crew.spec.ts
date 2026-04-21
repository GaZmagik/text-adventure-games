import { describe, test, expect } from 'bun:test';
import { renderCrew } from './crew';
import { createDefaultState } from '../../lib/state-store';

describe('renderCrew', () => {
  test('renders crew data attribute', () => {
    const state = createDefaultState();
    state.crewMutations = [
      { id: 'c1', name: 'Commander Riker', role: 'XO', morale: 100, stress: 0, loyalty: 100, status: 'active', pronouns: 'he/him' }
    ];
    const html = renderCrew(state, '');
    expect(html).toContain('data-crew=');
    expect(html).toContain('Commander Riker');
  });

  test('includes fallback HTML content', () => {
    const state = createDefaultState();
    state.crewMutations = [{ id: 'c1', name: 'Riker', role: 'XO', morale: 80, stress: 10, loyalty: 90, status: 'active', pronouns: 'he/him' }];
    const html = renderCrew(state, '');
    expect(html).toContain('widget-crew');
    expect(html).toContain('Riker');
    expect(html).toContain('XO');
  });

  test('escapes fallback crew text', () => {
    const state = createDefaultState();
    state.crewMutations = [{
      id: 'c1',
      name: '<img src=x onerror=alert("x")> "quote" &',
      role: 'XO & <img src=x onerror=alert(1)>',
      morale: 80,
      stress: 10,
      loyalty: 90,
      status: 'active',
      pronouns: 'he/him',
    }];
    const html = renderCrew(state, '');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(&quot;x&quot;)&gt;');
    expect(html).toContain('XO &amp;');
  });
});
