import { describe, test, expect } from 'bun:test';
import { renderShip } from './ship';
import { createDefaultState } from '../../lib/state-store';

describe('renderShip', () => {
  test('renders ship data attribute', () => {
    const state = createDefaultState();
    state.shipState = {
      name: 'Enterprise',
      systems: { 'Engines': { integrity: 100, status: 'nominal', conditions: [] } },
      powerAllocations: {},
      repairParts: 5,
      scenesSinceRepair: 0
    };
    const html = renderShip(state, '');
    expect(html).toContain('data-ship=');
    expect(html).toContain('Enterprise');
  });

  test('includes fallback HTML content', () => {
    const state = createDefaultState();
    state.shipState = {
      name: 'Voyager',
      systems: { 'Shields': { integrity: 80, status: 'damaged', conditions: [] } },
      powerAllocations: {},
      repairParts: 2,
      scenesSinceRepair: 5
    };
    const html = renderShip(state, '');
    expect(html).toContain('widget-ship');
    expect(html).toContain('Voyager');
    expect(html).toContain('Shields');
  });

  test('renders empty state when no ship data available', () => {
    const state = createDefaultState();
    state.shipState = null as any;
    const html = renderShip(state, '');
    expect(html).toContain('No ship data available');
  });

  test('escapes fallback ship and system text', () => {
    const state = createDefaultState();
    state.shipState = {
      name: '<img src=x onerror=alert("x")> "quote" &',
      systems: { 'Drive & <img src=x onerror=alert(1)>': { integrity: 80, status: 'damaged & unsafe', conditions: [] } },
      powerAllocations: {},
      repairParts: 2,
      scenesSinceRepair: 5,
    };
    const html = renderShip(state, '');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(&quot;x&quot;)&gt;');
    expect(html).toContain('damaged &amp; unsafe');
  });
});
