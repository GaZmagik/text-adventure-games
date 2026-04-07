import { describe, test, expect } from 'bun:test';
import {
  checkSvgViewBox,
  checkPendingLevelUp,
  checkTtsComponent,
  checkScenarioCardMeta,
  checkBrokenSerialisation,
  checkCssVariables,
  checkInlineOnclick,
  checkSendPromptFallback,
  checkSettingsGroups,
  checkSettingsValues,
} from './verify-checks';
import type { GmState } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────

function makeState(levelupPending?: boolean): GmState {
  return { _levelupPending: levelupPending } as unknown as GmState;
}

// ── checkSvgViewBox ──────────────────────────────────────────────────

describe('checkSvgViewBox', () => {
  test('passes when no svg elements present', () => {
    const failures: string[] = [];
    checkSvgViewBox('<div>no svg here</div>', failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when svg has viewBox attribute', () => {
    const failures: string[] = [];
    checkSvgViewBox('<svg viewBox="0 0 100 100"><circle r="10"/></svg>', failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when SVG tag is uppercase with VIEWBOX (case-insensitive)', () => {
    const failures: string[] = [];
    checkSvgViewBox('<SVG VIEWBOX="0 0 200 200"></SVG>', failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when viewBox has empty string value', () => {
    const failures: string[] = [];
    checkSvgViewBox('<svg viewBox=""><circle/></svg>', failures);
    expect(failures).toHaveLength(0);
  });

  test('fails when svg is missing viewBox', () => {
    const failures: string[] = [];
    checkSvgViewBox('<svg width="100" height="100"><circle r="10"/></svg>', failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('[svg-viewbox]');
    expect(failures[0]).toContain('1 <svg> element');
  });

  test('counts multiple svgs missing viewBox', () => {
    const failures: string[] = [];
    const html = '<svg><circle/></svg><svg><rect/></svg><svg viewBox="0 0 10 10"></svg>';
    checkSvgViewBox(html, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('2 <svg> elements');
  });

  test('reports singular count correctly for one missing svg', () => {
    const failures: string[] = [];
    checkSvgViewBox('<svg><circle/></svg>', failures);
    expect(failures[0]).toContain('1 <svg> element missing');
    expect(failures[0]).not.toMatch(/\d+ <svg> elements missing/);
  });

  test('passes when all svgs have viewBox', () => {
    const failures: string[] = [];
    const html = '<svg viewBox="0 0 100 100"></svg><svg viewBox="0 0 200 200"></svg>';
    checkSvgViewBox(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when svg has role="meter" (data indicator — viewBox not required)', () => {
    const failures: string[] = [];
    checkSvgViewBox('<svg class="hp-pips" role="meter" width="80" height="10"></svg>', failures);
    expect(failures).toHaveLength(0);
  });

  test('fails when non-meter svg is missing viewBox even alongside meter svgs', () => {
    const failures: string[] = [];
    const html = '<svg role="meter" width="40" height="10"></svg><svg class="scene-art"><circle/></svg>';
    checkSvgViewBox(html, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('1 <svg> element');
  });
});

// ── checkPendingLevelUp ──────────────────────────────────────────────

describe('checkPendingLevelUp', () => {
  test('passes when _levelupPending is absent', () => {
    const failures: string[] = [];
    checkPendingLevelUp('<div>no choices</div>', failures, makeState(undefined));
    expect(failures).toHaveLength(0);
  });

  test('passes when _levelupPending is false', () => {
    const failures: string[] = [];
    checkPendingLevelUp('<div>no choices</div>', failures, makeState(false));
    expect(failures).toHaveLength(0);
  });

  test('passes when _levelupPending true and data-levelup-stat present', () => {
    const failures: string[] = [];
    const html = '<button class="levelup-choice" data-levelup-stat="STR">+1 Strength</button>';
    checkPendingLevelUp(html, failures, makeState(true));
    expect(failures).toHaveLength(0);
  });

  test('passes when _levelupPending true and data-levelup-skill present', () => {
    const failures: string[] = [];
    const html = '<button class="levelup-choice" data-levelup-skill="Stealth">Stealth</button>';
    checkPendingLevelUp(html, failures, makeState(true));
    expect(failures).toHaveLength(0);
  });

  test('fails when _levelupPending true and no level-up choices in html', () => {
    const failures: string[] = [];
    checkPendingLevelUp('<div>some scene content</div>', failures, makeState(true));
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('[pending-level-up]');
    expect(failures[0]).toContain('_levelupPending');
  });

  test('fails when _levelupPending true and html has unrelated data- attributes', () => {
    const failures: string[] = [];
    const html = '<div data-prompt="Go somewhere" data-panel="character"></div>';
    checkPendingLevelUp(html, failures, makeState(true));
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('[pending-level-up]');
  });
});

// ── checkTtsComponent ────────────────────────────────────────────────

function makeModuleState(modules: string[]): GmState {
  return { modulesActive: modules } as unknown as GmState;
}

describe('checkTtsComponent', () => {
  test('passes when audio module not active', () => {
    const failures: string[] = [];
    checkTtsComponent('<div>no ta-tts here</div>', failures, makeModuleState(['core-systems']));
    expect(failures).toHaveLength(0);
  });

  test('passes when audio active and ta-tts present', () => {
    const failures: string[] = [];
    checkTtsComponent('<ta-tts></ta-tts>', failures, makeModuleState(['audio']));
    expect(failures).toHaveLength(0);
  });

  test('warns when audio active and ta-tts absent', () => {
    const failures: string[] = [];
    checkTtsComponent('<div>scene content without tts</div>', failures, makeModuleState(['audio']));
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('[missing-ta-tts]');
  });

  test('passes when modulesActive is empty', () => {
    const failures: string[] = [];
    checkTtsComponent('<div>scene</div>', failures, makeModuleState([]));
    expect(failures).toHaveLength(0);
  });
});

// ── checkScenarioCardMeta ────────────────────────────────────────────

describe('checkScenarioCardMeta', () => {
  const card = (accent: string, logo: string) =>
    `<div class="scenario-card"${accent}>${logo}</div>`;
  const withAccent = ' style="--ta-card-accent: #ff0000"';
  const withLogo = '<div class="scenario-logo"><svg viewBox="0 0 10 10"></svg></div>';

  test('passes when no scenario cards present', () => {
    const failures: string[] = [];
    checkScenarioCardMeta('<div>no cards here</div>', failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when all cards have accent and logo', () => {
    const failures: string[] = [];
    checkScenarioCardMeta(card(withAccent, withLogo) + card(withAccent, withLogo), failures);
    expect(failures).toHaveLength(0);
  });

  test('fails with [scenario-missing-accent] when a card lacks --ta-card-accent', () => {
    const failures: string[] = [];
    checkScenarioCardMeta(card(withAccent, withLogo) + card('', withLogo), failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('[scenario-missing-accent]');
  });

  test('fails with [scenario-missing-logo] when a card lacks .scenario-logo', () => {
    const failures: string[] = [];
    checkScenarioCardMeta(card(withAccent, withLogo) + card(withAccent, ''), failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('[scenario-missing-logo]');
  });

  test('emits both failures when cards lack both accent and logo', () => {
    const failures: string[] = [];
    checkScenarioCardMeta(card('', ''), failures);
    expect(failures).toHaveLength(2);
  });

  test('reports plural count in failure message', () => {
    const failures: string[] = [];
    checkScenarioCardMeta(card('', '') + card('', ''), failures);
    expect(failures[0]).toContain('2 scenario cards');
  });

  test('reports singular count for one missing card', () => {
    const failures: string[] = [];
    checkScenarioCardMeta(card(withAccent, withLogo) + card('', withLogo), failures);
    expect(failures[0]).toContain('1 scenario card');
    expect(failures[0]).not.toMatch(/\d+ scenario cards/);
  });
});

// ── checkBrokenSerialisation ─────────────────────────────────────────

describe('checkBrokenSerialisation', () => {
  test('passes when no [object Object] present', () => {
    const failures: string[] = [];
    checkBrokenSerialisation('<div class="scene">Hello world</div>', failures);
    expect(failures).toHaveLength(0);
  });

  test('fails when [object Object] appears in HTML', () => {
    const failures: string[] = [];
    checkBrokenSerialisation('<div data-value="[object Object]">bad</div>', failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('[object Object]');
  });

  test('counts multiple occurrences in the failure message', () => {
    const failures: string[] = [];
    checkBrokenSerialisation('[object Object] and [object Object]', failures);
    expect(failures[0]).toContain('2 occurrence');
  });
});

// ── checkCssVariables ────────────────────────────────────────────────

describe('checkCssVariables', () => {
  test('passes when only valid --sta-* prefixed variables are used', () => {
    const failures: string[] = [];
    checkCssVariables('<div style="color: var(--sta-color-primary)"></div>', failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when only valid --ta-* prefixed variables are used', () => {
    const failures: string[] = [];
    checkCssVariables('<div style="background: var(--ta-bg)"></div>', failures);
    expect(failures).toHaveLength(0);
  });

  test('fails when an invalid prefix is used', () => {
    const failures: string[] = [];
    checkCssVariables('<div style="color: var(--color-foo)"></div>', failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('--color-foo');
  });

  test('passes when variable is defined locally in the same HTML', () => {
    const failures: string[] = [];
    const html = '<style>:root { --color-foo: red; }</style><div style="color: var(--color-foo)"></div>';
    checkCssVariables(html, failures);
    expect(failures).toHaveLength(0);
  });
});

// ── checkInlineOnclick ───────────────────────────────────────────────

describe('checkInlineOnclick', () => {
  test('passes when no onclick attributes are present', () => {
    const failures: string[] = [];
    checkInlineOnclick('<button data-prompt="Go north">Go north</button>', failures);
    expect(failures).toHaveLength(0);
  });

  test('fails when an inline onclick handler is present', () => {
    const failures: string[] = [];
    checkInlineOnclick('<button onclick="doSomething()">Click me</button>', failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('onclick');
  });

  test('counts multiple onclick handlers in the failure message', () => {
    const failures: string[] = [];
    checkInlineOnclick('<button onclick="a()"></button><button onclick="b()"></button>', failures);
    expect(failures[0]).toContain('2 inline onclick');
  });
});

// ── checkSendPromptFallback ──────────────────────────────────────────

describe('checkSendPromptFallback', () => {
  test('passes when data-prompt button has an adequate title', () => {
    const failures: string[] = [];
    checkSendPromptFallback(
      '<button data-prompt="Go north through the gate" title="Go north through the gate">Go north</button>',
      failures,
    );
    expect(failures).toHaveLength(0);
  });

  test('fails when data-prompt button has a title shorter than 10 characters', () => {
    const failures: string[] = [];
    checkSendPromptFallback(
      '<button data-prompt="Go north" title="Go">Go north</button>',
      failures,
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('title fallback');
  });

  test('fails when data-prompt button has no title attribute', () => {
    const failures: string[] = [];
    checkSendPromptFallback(
      '<button data-prompt="Go north">Go north</button>',
      failures,
    );
    expect(failures).toHaveLength(1);
  });

  test('passes when no data-prompt buttons are present', () => {
    const failures: string[] = [];
    checkSendPromptFallback('<div>no interactive elements</div>', failures);
    expect(failures).toHaveLength(0);
  });
});

// ── checkSettingsGroups ──────────────────────────────────────────────

describe('checkSettingsGroups', () => {
  test('passes when all groups are valid', () => {
    const failures: string[] = [];
    checkSettingsGroups(
      '<div data-group="rulebook"></div>'
      + '<div data-group="difficulty"></div>'
      + '<div data-group="pacing"></div>'
      + '<div data-group="visualStyle"></div>'
      + '<div data-group="modules"></div>',
      failures,
    );
    expect(failures).toHaveLength(0);
  });

  test('fails when an unknown group is present', () => {
    const failures: string[] = [];
    checkSettingsGroups('<div data-group="tone"></div>', failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('"tone"');
    expect(failures[0]).toContain('unknown option group');
  });

  test('reports all unknown groups when multiple are present', () => {
    const failures: string[] = [];
    checkSettingsGroups(
      '<div data-group="tone"></div><div data-group="mood"></div>',
      failures,
    );
    expect(failures).toHaveLength(2);
    expect(failures.some(f => f.includes('"tone"'))).toBe(true);
    expect(failures.some(f => f.includes('"mood"'))).toBe(true);
  });

  test('passes with empty html (no groups to validate)', () => {
    const failures: string[] = [];
    checkSettingsGroups('<div>no groups here</div>', failures);
    expect(failures).toHaveLength(0);
  });
});

// ── checkSettingsValues ──────────────────────────────────────────────

describe('checkSettingsValues', () => {
  test('passes when all values are valid for their groups', () => {
    const failures: string[] = [];
    checkSettingsValues(
      '<div data-group="rulebook" data-value="dnd_5e"></div>'
      + '<div data-group="difficulty" data-value="hard"></div>'
      + '<div data-group="pacing" data-value="fast"></div>'
      + '<div data-group="visualStyle" data-value="terminal"></div>',
      failures,
    );
    expect(failures).toHaveLength(0);
  });

  test('fails for an invalid rulebook value', () => {
    const failures: string[] = [];
    checkSettingsValues('<div data-group="rulebook" data-value="pbta"></div>', failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('"rulebook"');
    expect(failures[0]).toContain('pbta');
  });

  test('fails for an invalid difficulty value', () => {
    const failures: string[] = [];
    checkSettingsValues('<div data-group="difficulty" data-value="impossible"></div>', failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('"difficulty"');
    expect(failures[0]).toContain('impossible');
  });

  test('fails for an invalid visualStyle value', () => {
    const failures: string[] = [];
    checkSettingsValues('<div data-group="visualStyle" data-value="comic-book"></div>', failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('"visualStyle"');
    expect(failures[0]).toContain('comic-book');
  });

  test('does not validate module values (extensible)', () => {
    const failures: string[] = [];
    checkSettingsValues(
      '<div data-group="modules" data-value="my-custom-module"></div>',
      failures,
    );
    expect(failures).toHaveLength(0);
  });

  test('reports only invalid values when mixed with valid ones', () => {
    const failures: string[] = [];
    checkSettingsValues(
      '<div data-group="rulebook" data-value="dnd_5e"></div>'
      + '<div data-group="rulebook" data-value="pbta"></div>'
      + '<div data-group="difficulty" data-value="normal"></div>',
      failures,
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('"rulebook"');
    expect(failures[0]).toContain('pbta');
    expect(failures[0]).not.toContain('dnd_5e');
  });

  test('handles attributes in reverse order (data-value before data-group)', () => {
    const failures: string[] = [];
    checkSettingsValues('<div data-value="pbta" data-group="rulebook"></div>', failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('"rulebook"');
    expect(failures[0]).toContain('pbta');
  });

  test('detects invalid values when data-group is on container and data-value on children', () => {
    const failures: string[] = [];
    checkSettingsValues(
      '<fieldset data-group="rulebook"><button data-value="d20_system">D20</button>'
      + '<button data-value="pbta">PbtA</button><button data-value="fate">Fate</button></fieldset>'
      + '<fieldset data-group="difficulty"><button data-value="easy">Easy</button></fieldset>',
      failures,
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('"rulebook"');
    expect(failures[0]).toContain('pbta');
    expect(failures[0]).toContain('fate');
  });

  test('passes with empty html', () => {
    const failures: string[] = [];
    checkSettingsValues('<div>no settings here</div>', failures);
    expect(failures).toHaveLength(0);
  });
});
