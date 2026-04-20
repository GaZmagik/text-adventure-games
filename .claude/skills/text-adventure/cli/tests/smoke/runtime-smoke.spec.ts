import { describe, expect, test } from 'bun:test';
import { renderDice } from '../../render/templates/dice';
import { renderDicePool } from '../../render/templates/dice-pool';
import { SCENE_SCRIPT_CODE } from '../../render/lib/scene-script';
import {
  append,
  createRenderRuntime,
  FakeElement,
  makeElement,
} from '../support/runtime-harness';
import { extractJsonTagAttr } from '../support/rendered-widget';

function createSmokeRuntime(options: { reducedMotion?: boolean } = {}) {
  const env = createRenderRuntime(options);
  const prompts: string[] = [];

  env.window.tag = {
    sendOrCopyPrompt: (_btn: unknown, prompt: string) => {
      if (prompt) prompts.push(prompt);
    },
  };

  return {
    ...env,
    sendPrompt: (prompt?: string | null) => {
      prompts.push(prompt ?? '');
    },
    prompts,
  };
}

function compileSceneRuntime(env: ReturnType<typeof createSmokeRuntime>): (shadow: FakeElement) => void {
  const runner = new Function(
    'window',
    'document',
    'getComputedStyle',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'sendPrompt',
    `${SCENE_SCRIPT_CODE}; return initTagScene;`,
  );
  return runner(
    env.window,
    env.document,
    env.getComputedStyle,
    env.requestAnimationFrame,
    env.cancelAnimationFrame,
    env.sendPrompt,
  ) as (shadow: FakeElement) => void;
}

describe('widget runtime smoke', () => {
  test('dice widget emits a d20 payload with check metadata', () => {
    const html = renderDice(null, '', {
      data: { dieType: 'd20', stat: 'WIS', modifier: 3, dc: 14 },
    });
    const config = extractJsonTagAttr<{ dieType: string; stat: string; modifier: number; dc: number; faceCount: number }>(
      html,
      'ta-dice',
      'data-config',
    );
    expect(html).toContain('<ta-dice');
    expect(config.dieType).toBe('d20');
    expect(config.stat).toBe('WIS');
    expect(config.modifier).toBe(3);
    expect(config.dc).toBe(14);
    expect(config.faceCount).toBe(20);
  });

  test('d100 widget emits the d100 geometry payload', () => {
    const html = renderDice(null, '', {
      data: { dieType: 'd100' },
    });
    const config = extractJsonTagAttr<{ dieType: string; faceCount: number; numberRange: [number, number] }>(
      html,
      'ta-dice',
      'data-config',
    );
    expect(config.dieType).toBe('d100');
    expect(config.faceCount).toBe(10);
    expect(config.numberRange).toEqual([0, 9]);
  });

  test('d12 widget uses the specialised geometry payload', () => {
    const html = renderDice(null, '', {
      data: { dieType: 'd12', stat: 'INT', modifier: 1, dc: 10 },
    });
    const config = extractJsonTagAttr<{ dieType: string; faceCount: number; dc: number; modifier: number }>(
      html,
      'ta-dice',
      'data-config',
    );
    expect(config.dieType).toBe('d12');
    expect(config.faceCount).toBe(12);
    expect(config.modifier).toBe(1);
    expect(config.dc).toBe(10);
  });

  test('dice-pool widget emits grouped pool config', () => {
    const html = renderDicePool(null, '', {
      data: {
        label: 'Volley',
        pool: [{ dieType: 'd6', count: 2 }, { dieType: 'd8', count: 1 }],
        modifier: 2,
      },
    });
    const config = extractJsonTagAttr<{
      label: string;
      expression: string;
      modifier: number;
      pool: Array<{ dieType: string; count: number }>;
    }>(html, 'ta-dice-pool', 'data-config');
    expect(html).toContain('<ta-dice-pool');
    expect(config.label).toBe('Volley');
    expect(config.expression).toBe('2d6 + 1d8');
    expect(config.modifier).toBe(2);
    expect(config.pool).toEqual([
      { dieType: 'd6', count: 2 },
      { dieType: 'd8', count: 1 },
    ]);
  });

  test('scene runtime wires reveal, panel toggle, and save prompt actions', () => {
    const env = createSmokeRuntime();
    const shadow = append(env.document.body, makeElement(env.document, 'div'), env.document);
    const root = append(shadow, makeElement(env.document, 'div', { classes: ['root'] }), env.document);
    const revealBrief = append(root, makeElement(env.document, 'div', { id: 'reveal-brief' }), env.document);
    const revealFull = append(root, makeElement(env.document, 'div', { id: 'reveal-full' }), env.document);
    const continueBtn = append(revealBrief, makeElement(env.document, 'button', { id: 'continue-reveal-btn' }), env.document);
    const sceneContent = append(revealFull, makeElement(env.document, 'div', { id: 'scene-content' }), env.document);
    const overlay = append(revealFull, makeElement(env.document, 'div', { id: 'panel-overlay' }), env.document);
    const title = append(overlay, makeElement(env.document, 'div', { id: 'panel-title-text' }), env.document);
    const closeBtn = append(overlay, makeElement(env.document, 'button', { id: 'panel-close-btn' }), env.document);
    append(overlay, makeElement(env.document, 'div', {
      classes: ['panel-content'],
      attrs: { 'data-panel': 'character' },
    }), env.document);
    const footerCharacter = append(root, makeElement(env.document, 'button', {
      classes: ['footer-btn'],
      attrs: { 'data-panel': 'character', 'aria-expanded': 'false' },
    }), env.document);
    const footerSave = append(root, makeElement(env.document, 'button', {
      classes: ['footer-btn'],
      attrs: { 'data-prompt': 'save-now', title: 'save-now' },
    }), env.document);

    revealFull.style.display = 'none';
    overlay.style.display = 'none';

    compileSceneRuntime(env)(shadow);

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

  test('scene runtime sends only the enriched level-up prompt once', () => {
    const env = createSmokeRuntime();
    const shadow = append(env.document.body, makeElement(env.document, 'div'), env.document);
    const root = append(shadow, makeElement(env.document, 'div', { classes: ['root'] }), env.document);
    const statChoice = append(root, makeElement(env.document, 'button', {
      classes: ['levelup-choice'],
      attrs: { 'data-levelup-stat': 'STR' },
    }), env.document);
    const confirm = append(root, makeElement(env.document, 'button', {
      id: 'levelup-confirm',
      attrs: { 'data-prompt': 'Confirm level up.' },
    }), env.document);

    compileSceneRuntime(env)(shadow);

    statChoice.dispatch('click');
    confirm.dispatch('click');

    expect(env.prompts).toEqual(['Confirm level up. Attribute: STR +1.']);
  });

  test('scene runtime blocks spent POI buttons after the budget is exhausted', () => {
    const env = createSmokeRuntime();
    const shadow = append(env.document.body, makeElement(env.document, 'div'), env.document);
    const root = append(shadow, makeElement(env.document, 'div', {
      classes: ['root'],
      attrs: { 'data-poi-budget': '1' },
    }), env.document);
    const poi = append(root, makeElement(env.document, 'button', {
      attrs: {
        'data-poi': 'true',
        'data-prompt': 'Inspect the conduit',
        title: 'Inspect the conduit',
      },
    }), env.document);

    compileSceneRuntime(env)(shadow);

    poi.dispatch('click');
    poi.dispatch('click');

    expect(env.prompts).toEqual(['Inspect the conduit']);
    expect(poi.getAttribute('aria-disabled')).toBe('true');
  });
});
