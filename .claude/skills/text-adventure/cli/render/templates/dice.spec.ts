import { describe, test, expect } from 'bun:test';
import { renderDice } from './dice';
import { createDefaultState } from '../../lib/state-store';

describe('renderDice', () => {
  test('renders standard die with canvas and result area', () => {
    const state = createDefaultState();
    state._lastComputation = {
      type: 'hazard_save',
      stat: 'CON',
      roll: 15,
      modifier: 2,
      total: 17,
      dc: 14,
      outcome: 'success',
      margin: 3,
    };
    const html = renderDice(state, '');
    expect(html).toContain('widget-dice');
    expect(html).toContain('id="cv"');
    expect(html).toContain('id="ra"');
  });

  test('includes continue button with data-prompt inside result area', () => {
    const state = createDefaultState();
    state._lastComputation = {
      type: 'hazard_save',
      stat: 'CON',
      roll: 15,
      modifier: 2,
      total: 17,
      dc: 14,
      outcome: 'success',
      margin: 3,
    };
    const html = renderDice(state, '');
    expect(html).toContain('data-prompt');
    expect(html).toContain('dice-continue');
  });

  test('continue prompt encodes authoritative server-side result', () => {
    const state = createDefaultState();
    state._lastComputation = {
      type: 'hazard_save',
      stat: 'CON',
      roll: 15,
      modifier: 2,
      total: 17,
      dc: 14,
      outcome: 'success',
      margin: 3,
    };
    const html = renderDice(state, '');
    const match = html.match(/data-prompt="([^"]*)"/);
    expect(match).not.toBeNull();
    const prompt = match![1];
    expect(prompt).toContain('CON');
    expect(prompt).toContain('15');
    expect(prompt).toContain('17');
    expect(prompt).toContain('DC 14');
    expect(prompt).toMatch(/success/i);
  });

  test('sendPrompt script includes clipboard fallback', () => {
    const state = createDefaultState();
    state._lastComputation = {
      type: 'hazard_save',
      stat: 'CON',
      roll: 15,
      modifier: 2,
      total: 17,
      dc: 14,
      outcome: 'success',
    };
    const html = renderDice(state, '');
    expect(html).toContain('sendPrompt');
    expect(html).toContain("document.execCommand('copy')");
  });

  test('d2 coin flip includes continue button with outcome', () => {
    const state = createDefaultState();
    state._lastComputation = {
      type: 'encounter_roll',
      roll: 1,
      dieType: 'd2',
    };
    const html = renderDice(state, '', { data: { dieType: 'd2' } });
    expect(html).toContain('data-prompt');
    expect(html).toContain('dice-continue');
  });

  test('renders continue button with fallback prompt when no _lastComputation', () => {
    const state = createDefaultState();
    const html = renderDice(state, '');
    expect(html).toContain('data-prompt');
    expect(html).toContain('dice-continue');
  });

  test('continue prompt includes margin when present', () => {
    const state = createDefaultState();
    state._lastComputation = {
      type: 'hazard_save',
      stat: 'DEX',
      roll: 8,
      modifier: 3,
      total: 11,
      dc: 14,
      outcome: 'failure',
      margin: -3,
    };
    const html = renderDice(state, '');
    const match = html.match(/data-prompt="([^"]*)"/);
    expect(match).not.toBeNull();
    const prompt = match![1];
    expect(prompt).toContain('DEX');
    expect(prompt).toMatch(/failure/i);
    expect(prompt).toContain('margin');
  });

  test('contested roll prompt includes npc context', () => {
    const state = createDefaultState();
    state._lastComputation = {
      type: 'contested_roll',
      stat: 'CHA',
      roll: 14,
      modifier: 1,
      total: 15,
      margin: 2,
      outcome: 'success',
      npcId: 'sael_vane',
      npcModifier: 3,
      dc: 13,
    };
    const html = renderDice(state, '');
    const match = html.match(/data-prompt="([^"]*)"/);
    expect(match).not.toBeNull();
    const prompt = match![1];
    expect(prompt).toContain('CHA');
    expect(prompt).toContain('contested');
  });
});
