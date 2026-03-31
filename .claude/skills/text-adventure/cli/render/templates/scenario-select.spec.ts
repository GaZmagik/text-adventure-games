import { describe, test, expect } from 'bun:test';
import { renderScenarioSelect } from './scenario-select';

describe('renderScenarioSelect', () => {
  test('renders scenario cards from data', () => {
    const html = renderScenarioSelect(null, '', {
      data: {
        scenarios: [
          { title: 'Cold Freight', hook: 'Your deck has gone quiet.', genres: ['mystery'], difficulty: 'normal' },
        ],
      },
    });
    expect(html).toContain('Cold Freight');
    expect(html).toContain('data-prompt="I choose scenario: Cold Freight"');
  });

  test('selection script copies prompts when sendPrompt is unavailable', () => {
    const html = renderScenarioSelect(null, '', {
      data: {
        scenarios: [
          { title: 'Cold Freight', hook: 'Your deck has gone quiet.' },
        ],
      },
    });
    expect(html).toContain("document.execCommand('copy')");
    expect(html).toContain("btn.textContent = 'Copied! Paste as your reply.'");
  });
});
