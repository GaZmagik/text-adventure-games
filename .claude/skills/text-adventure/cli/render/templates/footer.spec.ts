import { describe, test, expect } from 'bun:test';
import { renderFooter } from './footer';
import { createDefaultState } from '../../lib/state-store';
import type { GmState } from '../../types';

function makeState(overrides: Partial<GmState> = {}): GmState {
  const state = createDefaultState();
  state.modulesActive = [
    'gm-checklist', 'prose-craft', 'core-systems', 'die-rolls',
    'character-creation', 'save-codex',
    'lore-codex', 'ship-systems', 'crew-manifest', 'star-chart', 'geo-map',
  ];
  return { ...state, ...overrides } as GmState;
}

// ── Button dimming when panel data is empty ────────────────────────

describe('footer button dimming', () => {
  test('codex button is dimmed when codexMutations is empty', () => {
    const state = makeState({ codexMutations: [] });
    const html = renderFooter(state, '');
    expect(html).toContain('data-panel="codex"');
    expect(html).toMatch(/footer-btn-dim[^>]*data-panel="codex"/);
  });

  test('codex button is not dimmed when codexMutations has entries', () => {
    const state = makeState({
      codexMutations: [{ id: 'loc1', state: 'discovered' }],
    } as Partial<GmState>);
    const html = renderFooter(state, '');
    expect(html).toContain('data-panel="codex"');
    expect(html).not.toMatch(/footer-btn-dim[^>]*data-panel="codex"/);
  });

  test('ship button is dimmed when shipState is null', () => {
    const state = makeState({ shipState: undefined });
    const html = renderFooter(state, '');
    expect(html).toContain('data-panel="ship"');
    expect(html).toMatch(/footer-btn-dim[^>]*data-panel="ship"/);
  });

  test('ship button is not dimmed when shipState exists', () => {
    const state = makeState({
      shipState: { name: 'Erebus', systems: {}, powerAllocations: {}, repairParts: 5, scenesSinceRepair: 0 },
    });
    const html = renderFooter(state, '');
    expect(html).toContain('data-panel="ship"');
    expect(html).not.toMatch(/footer-btn-dim[^>]*data-panel="ship"/);
  });

  test('crew button is dimmed when crewMutations is empty', () => {
    const state = makeState({ crewMutations: [] });
    const html = renderFooter(state, '');
    expect(html).toContain('data-panel="crew"');
    expect(html).toMatch(/footer-btn-dim[^>]*data-panel="crew"/);
  });

  test('map button is dimmed when mapState is null', () => {
    const state = makeState({ mapState: undefined });
    const html = renderFooter(state, '');
    expect(html).toContain('data-panel="map"');
    expect(html).toMatch(/footer-btn-dim[^>]*data-panel="map"/);
  });

  test('quests button is dimmed when quests is empty', () => {
    const state = makeState({ quests: [] });
    const html = renderFooter(state, '');
    expect(html).toContain('data-panel="quests"');
    expect(html).toMatch(/footer-btn-dim[^>]*data-panel="quests"/);
  });

  test('nav button is dimmed when no navigation data', () => {
    const state = makeState({ visitedRooms: [], navPlottedCourse: undefined });
    const html = renderFooter(state, '');
    expect(html).toContain('data-panel="nav"');
    expect(html).toMatch(/footer-btn-dim[^>]*data-panel="nav"/);
  });

  test('character button is never dimmed', () => {
    const state = makeState({ character: null });
    const html = renderFooter(state, '');
    expect(html).toContain('data-panel="character"');
    expect(html).not.toMatch(/footer-btn-dim[^>]*data-panel="character"/);
  });
});
