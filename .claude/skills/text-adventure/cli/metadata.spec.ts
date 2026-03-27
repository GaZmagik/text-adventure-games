import { describe, test, expect } from 'bun:test';
import { createDefaultState } from './lib/state-store';
import { buildFeatureChecklist, buildModulesRequired } from './metadata';

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

    expect(buildModulesRequired(state)).toEqual([
      'modules/prose-craft.md',
      'modules/audio.md',
    ]);
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
