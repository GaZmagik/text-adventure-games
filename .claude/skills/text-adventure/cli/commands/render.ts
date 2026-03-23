import { join } from 'path';
import type { CommandResult, GmState } from '../types';
import { ok, fail, styleNotSet } from '../lib/errors';
import { loadState, stateExists } from '../lib/state-store';
import { extractAllCss } from '../render/css-extractor';

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

// ── Argument parsing ─────────────────────────────────────────────────

interface RenderArgs {
  widgetType: string;
  styleName: string | null;
  raw: boolean;
  data: Record<string, unknown> | null;
}

function parseRenderArgs(args: string[]): RenderArgs {
  const result: RenderArgs = {
    widgetType: '',
    styleName: null,
    raw: false,
    data: null,
  };

  let i = 0;

  // First positional arg is the widget type
  if (i < args.length && !args[i].startsWith('--')) {
    result.widgetType = args[i];
    i++;
  }

  // Parse flags
  while (i < args.length) {
    const arg = args[i];

    if (arg === '--style' && i + 1 < args.length) {
      result.styleName = args[i + 1];
      i += 2;
    } else if (arg === '--raw') {
      result.raw = true;
      i++;
    } else if (arg === '--data' && i + 1 < args.length) {
      try {
        result.data = JSON.parse(args[i + 1]);
      } catch {
        result.data = null;
      }
      i += 2;
    } else {
      i++;
    }
  }

  return result;
}

// ── Main handler ─────────────────────────────────────────────────────

export async function handleRender(args: string[]): Promise<CommandResult> {
  const parsed = parseRenderArgs(args);

  // Validate widget type
  if (!parsed.widgetType) {
    return fail(
      'No widget type specified.',
      `tag render <${Object.keys(TEMPLATES).join('|')}>`,
      'render',
    );
  }

  const templateFn = TEMPLATES[parsed.widgetType];
  if (!templateFn) {
    return fail(
      `Unknown widget type: "${parsed.widgetType}".`,
      `Valid types: ${Object.keys(TEMPLATES).join(', ')}`,
      'render',
    );
  }

  // Determine whether we need state or --data
  const isPreGame = PRE_GAME_WIDGETS.has(parsed.widgetType);
  let state: GmState | null = null;

  if (isPreGame) {
    // Pre-game widgets use --data, but always try to load state for visualStyle fallback
    if (await stateExists()) {
      state = await loadState();
    }
  } else {
    // Game widgets require state
    if (!(await stateExists())) {
      return fail(
        'No game state found. In-game widgets require an active state.',
        'tag state reset',
        'render',
      );
    }
    state = await loadState();
  }

  // Resolve style name: --style flag > state.visualStyle > error
  const styleName = parsed.styleName
    ?? state?.visualStyle
    ?? null;

  if (!styleName) {
    return styleNotSet();
  }

  if (styleName && !/^[a-zA-Z0-9_-]+$/.test(styleName)) {
    return fail('Style name contains invalid characters.', 'Use alphanumeric, hyphens, and underscores only.', 'render');
  }

  // Extract CSS from the style file + style-reference.md (structural patterns, atmosphere CSS)
  const styleFilePath = join(import.meta.dir, '../../styles/', styleName + '.md');
  const styleRefPath = join(import.meta.dir, '../../styles/style-reference.md');
  const [styleCss, refCss] = await Promise.all([
    extractAllCss(styleFilePath),
    extractAllCss(styleRefPath),
  ]);
  if (!styleCss) {
    return fail(
      `Style file not found or contains no CSS: "${styleName}".`,
      `Check styles/${styleName}.md exists and contains css code blocks.`,
      'render',
    );
  }

  const css = [refCss, styleCss].filter(Boolean).join('\n\n');

  // Build options object
  const options: Record<string, unknown> = {};
  if (parsed.data) {
    options.data = parsed.data;
  }

  // Render the template
  const html = templateFn(state, css, options);

  // Return raw HTML or JSON-wrapped
  if (parsed.raw) {
    return ok(html, 'render');
  }

  return ok(
    {
      widget: parsed.widgetType,
      style: styleName,
      html,
    },
    'render',
  );
}
