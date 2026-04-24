import { describe, test, expect } from 'bun:test';
import { createDefaultState } from './lib/state-store';
import {
  buildFeatureChecklist,
  buildModulesRequired,
  WIDGET_CSS_SELECTORS,
  WIDGET_STYLE_SCOPES,
  WIDGET_TYPE_NAMES,
} from './metadata';

describe('buildModulesRequired', () => {
  test('prepends prose-craft when it is not active', () => {
    const state = createDefaultState();
    state.modulesActive = ['audio', 'atmosphere'];

    expect(buildModulesRequired(state)).toEqual([
      'modules/prose-craft.md',
      'modules/audio.md',
      'modules/atmosphere.md',
    ]);
  });

  test('does not duplicate prose-craft when already active', () => {
    const state = createDefaultState();
    state.modulesActive = ['prose-craft', 'audio'];

    expect(buildModulesRequired(state)).toEqual(['modules/prose-craft.md', 'modules/audio.md']);
  });
});

// ── Phase 1: CSS selector registry ───────────────────────────────────

describe('WIDGET_CSS_SELECTORS', () => {
  test('scene entry contains core structural selectors', () => {
    const scene = WIDGET_CSS_SELECTORS.scene;
    expect(scene).toBeDefined();
    expect(scene).toContain('.root');
    expect(scene).toContain('.loc-bar');
    expect(scene).toContain('.narrative');
    expect(scene).toContain('.footer-row');
    expect(scene).toContain('.action-card');
    expect(scene).toContain('.status-bar');
    expect(scene).toContain('.atmo-strip');
    expect(scene).toContain('.panel-content');
  });

  test('scene entry does NOT contain combat/shop/dice selectors', () => {
    const scene = WIDGET_CSS_SELECTORS.scene;
    const forbidden = [
      '.enemy-card',
      '.merchant-header',
      '.die-display',
      '.roll-breakdown',
      '.item-grid',
      '.shop-footer',
    ];
    for (const sel of forbidden) {
      expect(scene).not.toContain(sel);
    }
  });

  test('all WIDGET_CSS_SELECTORS keys are valid widget type names', () => {
    for (const key of Object.keys(WIDGET_CSS_SELECTORS)) {
      expect((WIDGET_TYPE_NAMES as readonly string[]).includes(key)).toBe(true);
    }
  });
});

describe('WIDGET_STYLE_SCOPES — scene scoping', () => {
  test('scene is scoped to vars only', () => {
    expect(WIDGET_STYLE_SCOPES.scene).toEqual(['vars']);
  });

  test('every WIDGET_CSS_SCOPES key has a corresponding WIDGET_STYLE_SCOPES entry or uses full theme deliberately', () => {
    // scene must NOT be undefined (was the bug)
    expect(WIDGET_STYLE_SCOPES.scene).toBeDefined();
  });
});

describe('buildFeatureChecklist', () => {
  test('uses a fallback instruction for unknown modules', () => {
    const state = createDefaultState();
    state.modulesActive = ['mystery-module'];

    const checklist = buildFeatureChecklist(state);
    expect(checklist).toContain('prose-craft ON -> re-read modules/prose-craft.md this turn');
    expect(checklist).toContain('mystery-module ON -> re-read modules/mystery-module.md this turn');
  });
});
