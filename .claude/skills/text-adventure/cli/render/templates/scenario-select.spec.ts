import { describe, test, expect } from 'bun:test';
import { renderScenarioSelect } from './scenario-select';
import { createDefaultState } from '../../lib/state-store';

describe('renderScenarioSelect', () => {
  test('renders with null state and empty CSS', () => {
    const html = renderScenarioSelect(null, '');
    expect(html).toContain('Choose Your Scenario');
    expect(html).toContain('widget-scenario-select');
  });

  test('renders with default state and no options', () => {
    const state = createDefaultState();
    const html = renderScenarioSelect(state, '');
    expect(html).toContain('Choose Your Scenario');
  });

  test('renders empty-state message when no scenarios provided', () => {
    const html = renderScenarioSelect(null, '', { data: {} });
    expect(html).toContain('empty-scenarios');
    expect(html).toContain('No scenarios provided');
    expect(html).toContain('--data');
  });

  test('renders scenario cards when provided', () => {
    const html = renderScenarioSelect(null, '', {
      data: {
        scenarios: [
          { title: 'Cold Freight', description: 'A chilling mystery', genre: ['survival', 'mystery'], difficulty: 'normal' },
          { title: 'The Grit Anvil', hook: 'Something is not rock', genres: ['horror'], players: '1-3' },
        ],
      },
    });
    expect(html).toContain('Cold Freight');
    expect(html).toContain('The Grit Anvil');
    expect(html).toContain('scenario-card');
    expect(html).toContain('genre-pill');
    expect(html).toContain('survival');
    expect(html).toContain('horror');
  });

  test('uses hook as fallback for description', () => {
    const html = renderScenarioSelect(null, '', {
      data: {
        scenarios: [{ title: 'Test', hook: 'Hook text here' }],
      },
    });
    expect(html).toContain('Hook text here');
  });

  test('renders select buttons with sendPrompt data', () => {
    const html = renderScenarioSelect(null, '', {
      data: {
        scenarios: [{ title: 'Quest Alpha' }],
      },
    });
    expect(html).toContain('scenario-select-btn');
    expect(html).toContain('I choose scenario: Quest Alpha');
  });

  test('injects CSS into style block', () => {
    const html = renderScenarioSelect(null, '.custom { color: blue; }');
    expect(html).toContain('.custom { color: blue; }');
  });
});
