import { join } from 'node:path';
import type { CommandResult, GmState } from '../types';
import { ok, fail, styleNotSet } from '../lib/errors';
import { tryLoadState } from '../lib/state-store';
import { extractAllCss } from '../render/css-extractor';
import { parseArgs } from '../lib/args';

// Template imports
import { renderScene } from '../render/templates/scene';
import { renderTicker } from '../render/templates/ticker';
import { renderCharacter } from '../render/templates/character';
import { renderDice } from '../render/templates/dice';
import { renderShip } from '../render/templates/ship';
import { renderCrew } from '../render/templates/crew';
import { renderCodex } from '../render/templates/codex';
import { renderMap } from '../render/templates/map';
import { renderStarchart } from '../render/templates/starchart';
import { renderFooter } from '../render/templates/footer';
import { renderSaveDiv } from '../render/templates/save-div';
import { renderLevelup } from '../render/templates/levelup';
import { renderRecap } from '../render/templates/recap';
import { renderCombatTurn } from '../render/templates/combat-turn';
import { renderDialogue } from '../render/templates/dialogue';
import { renderSettings } from '../render/templates/settings';
import { renderScenarioSelect } from '../render/templates/scenario-select';
import { renderCharacterCreation } from '../render/templates/character-creation';

// ── Widget registry ──────────────────────────────────────────────────

type TemplateFn = (state: GmState | null, css: string, options?: Record<string, unknown>) => string;

const TEMPLATES: Record<string, TemplateFn> = {
  scene: renderScene,
  ticker: renderTicker,
  character: renderCharacter,
  dice: renderDice,
  ship: renderShip,
  crew: renderCrew,
  codex: renderCodex,
  map: renderMap,
  starchart: renderStarchart,
  footer: renderFooter,
  'save-div': renderSaveDiv,
  levelup: renderLevelup,
  recap: renderRecap,
  'combat-turn': renderCombatTurn,
  dialogue: renderDialogue,
  settings: renderSettings,
  'scenario-select': renderScenarioSelect,
  'character-creation': renderCharacterCreation,
};

/** Pre-game widgets that accept --data instead of reading state */
const PRE_GAME_WIDGETS = new Set(['settings', 'scenario-select', 'character-creation']);

// ── Main handler ─────────────────────────────────────────────────────

export async function handleRender(args: string[]): Promise<CommandResult> {
  const parsed = parseArgs(args, ['raw']);
  const widgetType = parsed.positional[0] || '';
  const styleName = parsed.flags.style || null;
  const raw = parsed.booleans.has('raw');
  let data: Record<string, unknown> | null = null;
  if (parsed.flags.data) {
    try { data = JSON.parse(parsed.flags.data); } catch { data = null; }
  }

  // Validate widget type
  if (!widgetType) {
    return fail(
      'No widget type specified.',
      `tag render <${Object.keys(TEMPLATES).join('|')}>`,
      'render',
    );
  }

  const templateFn = TEMPLATES[widgetType];
  if (!templateFn) {
    return fail(
      `Unknown widget type: "${widgetType}".`,
      `Valid types: ${Object.keys(TEMPLATES).join(', ')}`,
      'render',
    );
  }

  // Pre-game widgets work without state; in-game widgets require it
  const isPreGame = PRE_GAME_WIDGETS.has(widgetType);
  const state = await tryLoadState();
  if (!isPreGame && !state) {
    return fail(
      'No game state found. In-game widgets require an active state.',
      'tag state reset',
      'render',
    );
  }

  // Resolve style name: --style flag > state.visualStyle > error
  const resolvedStyle = styleName ?? state?.visualStyle ?? null;

  if (!resolvedStyle) {
    return styleNotSet();
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(resolvedStyle)) {
    return fail('Style name contains invalid characters.', 'Use alphanumeric, hyphens, and underscores only.', 'render');
  }

  // Extract CSS from the style file + style-reference.md
  // import.meta.dir is a Bun-only API — this CLI requires Bun runtime
  const styleFilePath = join(import.meta.dir, '../../styles/', resolvedStyle + '.md');
  const styleRefPath = join(import.meta.dir, '../../styles/style-reference.md');
  const [styleCss, refCss] = await Promise.all([
    extractAllCss(styleFilePath),
    extractAllCss(styleRefPath),
  ]);
  if (!styleCss) {
    return fail(
      `Style file not found or contains no CSS: "${resolvedStyle}".`,
      `Check styles/${resolvedStyle}.md exists and contains css code blocks.`,
      'render',
    );
  }

  const css = [refCss, styleCss].filter(Boolean).join('\n\n');

  // Build options object
  const options: Record<string, unknown> = {};
  if (data) {
    options.data = data;
  }

  // Render the template
  const html = templateFn(state, css, options);

  // Return raw HTML or JSON-wrapped
  if (raw) {
    return ok(html, 'render');
  }

  return ok(
    {
      widget: widgetType,
      style: resolvedStyle,
      html,
    },
    'render',
  );
}
