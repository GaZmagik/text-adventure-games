import { describe, expect, spyOn, test } from 'bun:test';
import { createDefaultState } from '../../lib/state-store';
import { renderDice } from '../../render/templates/dice';
import { renderDicePool } from '../../render/templates/dice-pool';
import { renderScene } from '../../render/templates/scene';
import {
  append,
  createRenderRuntime,
  executeGeneratedCode,
  FakeElement,
  makeElement,
} from '../support/runtime-harness';

function extractInlineScript(html: string): string {
  const normalised = html.replace(/<\\\/script>/g, '</script>');
  const match = normalised.match(/<script>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('Expected an inline script block.');
  return match[1]!;
}

function createSmokeRuntime(options: { reducedMotion?: boolean } = {}) {
  const env = createRenderRuntime(options);
  const prompts: string[] = [];

  // Register shadow-host element — Shadow DOM IIFE calls document.getElementById('shadow-host')
  const shadowHost = makeElement(env.document, 'div', { id: 'shadow-host' });
  append(env.document.body, shadowHost, env.document);

  return {
    ...env,
    sendPrompt: (prompt?: string | null) => {
      prompts.push(prompt ?? '');
    },
    prompts,
  };
}

/** Stub initTagScene — builds with a bound env reference for correct window/sendPrompt wiring. */
function createInitTagScene(env: ReturnType<typeof createSmokeRuntime>) {
  type TagApi = {
    togglePanel: (panelName: unknown, btn?: FakeElement | null) => void;
    closePanel: () => void;
  };

  return function initTagScene(shadow: FakeElement): void {
    const doc = shadow;
    const tag: Partial<TagApi> = {};
    env.window.tag = tag;

    tag.togglePanel = function(panelName: unknown, btn?: FakeElement | null) {
      const overlay = doc.getElementById('panel-overlay');
      const sceneContent = doc.getElementById('scene-content');
      const title = doc.getElementById('panel-title-text');
      if (overlay) overlay.style.display = 'block';
      if (sceneContent) sceneContent.style.display = 'none';
      if (title) title.textContent = String(panelName).charAt(0).toUpperCase() + String(panelName).slice(1);
      if (btn) btn.setAttribute('aria-expanded', 'true');
    };

    tag.closePanel = function() {
      const overlay = doc.getElementById('panel-overlay');
      const sceneContent = doc.getElementById('scene-content');
      if (overlay) overlay.style.display = 'none';
      if (sceneContent) sceneContent.style.display = 'block';
      doc.querySelectorAll('.footer-btn[aria-expanded]').forEach(function(b) {
        b.setAttribute('aria-expanded', 'false');
      });
    };

    const continueBtn = doc.getElementById('continue-reveal-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', function() {
        const brief = doc.getElementById('reveal-brief');
        const full = doc.getElementById('reveal-full');
        if (brief) brief.style.display = 'none';
        if (full) full.style.display = 'block';
      });
    }
    const panelCloseBtn = doc.getElementById('panel-close-btn');
    if (panelCloseBtn) {
      panelCloseBtn.addEventListener('click', function() {
        tag.closePanel?.();
      });
    }
    doc.querySelectorAll('.footer-btn[data-panel]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        tag.togglePanel?.(btn.getAttribute('data-panel'), btn);
      });
    });
    doc.querySelectorAll('.footer-btn[data-prompt]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const prompt = btn.getAttribute('data-prompt');
        env.sendPrompt(prompt);
      });
    });
  };
}

function executeInlineScript(script: string, env: ReturnType<typeof createSmokeRuntime>): void {
  executeGeneratedCode(script, env, { sendPrompt: env.sendPrompt, initTagScene: createInitTagScene(env) });
}

function mountStandardDice(env: ReturnType<typeof createSmokeRuntime>) {
  const root = append(
    env.document.body,
    makeElement(env.document, 'div', { classes: ['widget-dice'] }),
    env.document,
  );
  const clickZone = append(root, makeElement(env.document, 'div', { id: 'cz' }), env.document);
  append(clickZone, makeElement(env.document, 'canvas', { id: 'cv' }), env.document);
  const hint = append(root, makeElement(env.document, 'div', { id: 'hi' }), env.document);
  const result = append(root, makeElement(env.document, 'div', { id: 'ra' }), env.document);
  append(result, makeElement(env.document, 'div', { id: 'xv' }), env.document);
  append(result, makeElement(env.document, 'div', { id: 'xm' }), env.document);
  const total = append(result, makeElement(env.document, 'div', { id: 'xt' }), env.document);
  const dc = append(result, makeElement(env.document, 'div', { id: 'xd' }), env.document);
  const outcome = append(result, makeElement(env.document, 'div', { id: 'xo' }), env.document);
  const margin = append(result, makeElement(env.document, 'div', { id: 'xg' }), env.document);

  return { clickZone, hint, result, total, dc, outcome, margin };
}

function mountD100Dice(env: ReturnType<typeof createSmokeRuntime>) {
  const root = append(
    env.document.body,
    makeElement(env.document, 'div', { classes: ['widget-dice', 'widget-dice-d100'] }),
    env.document,
  );
  const rollArea = append(root, makeElement(env.document, 'div', { id: 'rollArea' }), env.document);
  const dw1 = append(rollArea, makeElement(env.document, 'div', { classes: ['dw'] }), env.document);
  const cz1 = append(dw1, makeElement(env.document, 'div', { classes: ['cz'] }), env.document);
  append(cz1, makeElement(env.document, 'canvas', { id: 'cvT' }), env.document);
  const dw2 = append(rollArea, makeElement(env.document, 'div', { classes: ['dw'] }), env.document);
  const cz2 = append(dw2, makeElement(env.document, 'div', { classes: ['cz'] }), env.document);
  append(cz2, makeElement(env.document, 'canvas', { id: 'cvU' }), env.document);
  const hint = append(root, makeElement(env.document, 'div', { id: 'hi' }), env.document);
  const result = append(root, makeElement(env.document, 'div', { id: 'ra' }), env.document);
  const tens = append(result, makeElement(env.document, 'div', { id: 'xvT' }), env.document);
  const units = append(result, makeElement(env.document, 'div', { id: 'xvU' }), env.document);
  const total = append(result, makeElement(env.document, 'div', { id: 'xt' }), env.document);

  return { rollArea, hint, result, tens, units, total };
}

function mountDicePool(env: ReturnType<typeof createSmokeRuntime>) {
  const root = append(env.document.body, makeElement(env.document, 'div', { id: 'dice-pool-target' }), env.document);
  const canvas = append(root, makeElement(env.document, 'canvas', { id: 'dice-pool-canvas' }), env.document);
  const hint = append(env.document.body, makeElement(env.document, 'div', { id: 'dice-pool-hint' }), env.document);
  const result = append(env.document.body, makeElement(env.document, 'div', { id: 'dice-pool-result' }), env.document);
  const total = append(result, makeElement(env.document, 'div', { id: 'dice-pool-total' }), env.document);
  const modifier = append(result, makeElement(env.document, 'div', { id: 'dice-pool-modifier' }), env.document);
  const groups = append(result, makeElement(env.document, 'div', { id: 'dice-pool-groups' }), env.document);

  return { root, canvas, hint, result, total, modifier, groups };
}

describe('widget runtime smoke', () => {
  test('dice widget mounts and resolves a click without throwing', () => {
    const html = renderDice(null, '', {
      data: { dieType: 'd20', stat: 'WIS', modifier: 3, dc: 14 },
    });
    expect(html).toContain('id="cv"');

    const env = createSmokeRuntime();
    const { clickZone, hint, result, total } = mountStandardDice(env);

    executeInlineScript(extractInlineScript(html), env);
    clickZone.dispatch('click');

    expect(hint.classList.contains('hd')).toBe(true);
    expect(result.classList.contains('v')).toBe(true);
    expect(total.textContent).not.toBe('');
  });

  test('d100 widget resolves 00 + 0 to 100 in reduced-motion mode', () => {
    const html = renderDice(null, '', {
      data: { dieType: 'd100' },
    });
    expect(html).toContain('id="xvT"');

    const env = createSmokeRuntime();
    const { rollArea, hint, result, tens, units, total } = mountD100Dice(env);

    executeInlineScript(extractInlineScript(html), env);

    const randomSpy = spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0);
    try {
      rollArea.dispatch('click');
    } finally {
      randomSpy.mockRestore();
    }

    expect(hint.classList.contains('hd')).toBe(true);
    expect(result.classList.contains('v')).toBe(true);
    expect(tens.textContent).toBe('00');
    expect(units.textContent).toBe('0');
    expect(total.textContent).toBe('100');
  });

  test('d12 widget uses the specialised outcome ladder in reduced-motion mode', () => {
    const html = renderDice(null, '', {
      data: { dieType: 'd12', stat: 'INT', modifier: 1, dc: 10 },
    });
    expect(html).toContain('id="xo"');

    const env = createSmokeRuntime();
    const { clickZone, result, total, dc, outcome, margin } = mountStandardDice(env);

    executeInlineScript(extractInlineScript(html), env);

    const randomSpy = spyOn(Math, 'random').mockReturnValue(0);
    try {
      clickZone.dispatch('click');
    } finally {
      randomSpy.mockRestore();
    }

    expect(result.classList.contains('v')).toBe(true);
    expect(total.textContent).toBe('2');
    expect(dc.textContent).toBe('DC 10');
    expect(outcome.textContent).toBe('CRIT FAILURE');
    expect(margin.textContent).toBe('Failed by 8');
    expect(margin.style.display).toBe('block');
  });

  test('dice widget settles through the animated path when reduced motion is off', () => {
    const html = renderDice(null, '', {
      data: { dieType: 'd20', stat: 'WIS', modifier: 3, dc: 14 },
    });

    const env = createSmokeRuntime({ reducedMotion: false });
    const { clickZone, result, total, outcome, margin } = mountStandardDice(env);

    const randomSpy = spyOn(Math, 'random').mockReturnValue(0);
    try {
      executeInlineScript(extractInlineScript(html), env);
      clickZone.dispatch('click');
      expect(result.classList.contains('v')).toBe(false);
      env.flushAnimationFrames();
    } finally {
      randomSpy.mockRestore();
    }

    expect(result.classList.contains('v')).toBe(true);
    expect(total.textContent).toBe('4');
    expect(outcome.textContent).toBe('CRITICAL FAILURE');
    expect(margin.textContent).toBe('Failed by 10');
  });

  test('dice-pool widget mounts and renders results on click', () => {
    const html = renderDicePool(null, '', {
      data: {
        label: 'Volley',
        pool: [{ dieType: 'd6', count: 2 }, { dieType: 'd8', count: 1 }],
        modifier: 2,
      },
    });
    expect(html).toContain('id="dice-pool-canvas"');

    const env = createSmokeRuntime();
    const { root, canvas, hint, result, total, modifier, groups } = mountDicePool(env);

    executeInlineScript(extractInlineScript(html), env);
    root.dispatch('click');

    expect(hint.classList.contains('is-hidden')).toBe(true);
    expect(result.classList.contains('is-visible')).toBe(true);
    expect(total.textContent).not.toBe('');
    expect(modifier.textContent).toContain('Subtotal');
    expect(groups.children.length).toBeGreaterThan(0);
    expect(canvas.getAttribute('aria-label')).toContain('total');
  });

  test('dice-pool widget settles through the animated path when reduced motion is off', () => {
    const html = renderDicePool(null, '', {
      data: {
        label: 'Volley',
        pool: [{ dieType: 'd6', count: 2 }, { dieType: 'd8', count: 1 }],
        modifier: 2,
      },
    });

    const env = createSmokeRuntime({ reducedMotion: false });
    const { root, result, total, modifier, groups } = mountDicePool(env);

    const randomSpy = spyOn(Math, 'random').mockReturnValue(0);
    try {
      executeInlineScript(extractInlineScript(html), env);
      root.dispatch('click');
      expect(result.classList.contains('is-visible')).toBe(false);
      env.flushAnimationFrames();
    } finally {
      randomSpy.mockRestore();
    }

    expect(result.classList.contains('is-visible')).toBe(true);
    expect(total.textContent).toBe('5');
    expect(modifier.textContent).toBe('Subtotal 3 + 2 = 5');
    expect(groups.children.length).toBe(2);
    expect(groups.children[0]!.children[1]!.textContent).toBe('1, 1 = 2');
  });

  test('scene/footer script wires reveal, panel toggle, and save prompt actions', () => {
    const state = createDefaultState();
    state.scene = 2;
    state.currentRoom = 'Bridge';
    state.visualStyle = 'terminal';

    const html = renderScene(state, '', {});
    expect(html).toContain('continue-reveal-btn');
    expect(html).toContain('data-panel="character"');

    const env = createSmokeRuntime();
    const revealBrief = append(env.document.body, makeElement(env.document, 'div', { id: 'reveal-brief' }), env.document);
    const revealFull = append(env.document.body, makeElement(env.document, 'div', { id: 'reveal-full' }), env.document);
    const continueBtn = append(revealBrief, makeElement(env.document, 'button', { id: 'continue-reveal-btn' }), env.document);
    const sceneContent = append(revealFull, makeElement(env.document, 'div', { id: 'scene-content' }), env.document);
    const overlay = append(revealFull, makeElement(env.document, 'div', { id: 'panel-overlay' }), env.document);
    const title = append(overlay, makeElement(env.document, 'div', { id: 'panel-title-text' }), env.document);
    const closeBtn = append(overlay, makeElement(env.document, 'button', { id: 'panel-close-btn' }), env.document);
    append(overlay, makeElement(env.document, 'div', {
      classes: ['panel-content'],
      attrs: { 'data-panel': 'character' },
    }), env.document);
    const footerCharacter = append(env.document.body, makeElement(env.document, 'button', {
      classes: ['footer-btn'],
      attrs: { 'data-panel': 'character', 'aria-expanded': 'false' },
    }), env.document);
    const footerSave = append(env.document.body, makeElement(env.document, 'button', {
      classes: ['footer-btn'],
      attrs: { 'data-prompt': 'save-now' },
    }), env.document);

    revealFull.style.display = 'none';
    overlay.style.display = 'none';

    executeInlineScript(extractInlineScript(html), env);

    continueBtn.dispatch('click');
    expect(revealBrief.style.display).toBe('none');
    expect(revealFull.style.display).toBe('block');

    footerCharacter.dispatch('click');
    expect(overlay.style.display).toBe('block');
    expect(sceneContent.style.display).toBe('none');
    expect(title.textContent).toBe('Character');
    expect(footerCharacter.getAttribute('aria-expanded')).toBe('true');

    footerSave.dispatch('click');
    expect(env.prompts).toEqual(['save-now']);

    closeBtn.dispatch('click');
    expect(overlay.style.display).toBe('none');
    expect(sceneContent.style.display).toBe('block');
    expect(footerCharacter.getAttribute('aria-expanded')).toBe('false');
  });
});
