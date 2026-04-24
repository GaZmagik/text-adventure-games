import { describe, expect, test } from 'bun:test';
import { SCENE_DESIGN_CSS } from './scene-design';

describe('SCENE_DESIGN_CSS', () => {
  test('scopes VFX selectors to the ta-scene shadow host', () => {
    expect(SCENE_DESIGN_CSS).toContain(':host([data-vfx*="glitch"])');
    expect(SCENE_DESIGN_CSS).toContain(':host([data-vfx*="low-light"])');
    expect(SCENE_DESIGN_CSS).toContain(':host([data-vfx*="static"])::after');
    expect(SCENE_DESIGN_CSS).toContain(':host([data-vfx*="radiation"])');
    expect(SCENE_DESIGN_CSS).not.toContain('ta-scene[data-vfx');
  });

  test('keeps animated VFX covered by reduced-motion rules', () => {
    const reducedMotion = SCENE_DESIGN_CSS.match(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}/)?.[0] ?? '';

    expect(reducedMotion).toContain(':host([data-vfx*="glitch"])');
    expect(reducedMotion).toContain(':host([data-vfx*="radiation"])');
    expect(reducedMotion).toContain('animation: none');
  });
});
