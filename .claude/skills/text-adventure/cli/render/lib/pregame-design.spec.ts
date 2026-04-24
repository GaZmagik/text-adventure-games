import { describe, expect, test } from 'bun:test';
import { PREGAME_DESIGN_CSS } from './pregame-design';

describe('PREGAME_DESIGN_CSS', () => {
  test('contains structural classes used by pre-game custom elements', () => {
    expect(PREGAME_DESIGN_CSS).toContain('.pd-hero');
    expect(PREGAME_DESIGN_CSS).toContain('.pd-control-deck');
    expect(PREGAME_DESIGN_CSS).toContain('.pd-stage-header');
  });

  test('uses theme variables instead of hard-coding a standalone skin', () => {
    expect(PREGAME_DESIGN_CSS).toContain('var(--sta-text-primary');
    expect(PREGAME_DESIGN_CSS).toContain('var(--ta-color-accent');
    expect(PREGAME_DESIGN_CSS).not.toContain(':root');
  });
});
