import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import type { CommandResult, GmState } from '../types';
import { ok, fail, styleNotSet } from '../lib/errors';
import { tryLoadState, getSyncMarkerPath } from '../lib/state-store';
import { extractAllCss } from '../render/css-extractor';
import { parseArgs } from '../lib/args';
import { containsForbiddenKeys } from '../lib/security';
import {
  PRE_CONFIG_WIDGETS,
  PRE_GAME_WIDGETS,
  WIDGET_CSS_SCOPES,
  WIDGET_STYLE_SCOPES,
  buildFeatureChecklist,
  buildModulesRequired,
} from '../metadata';

// ── Phase 11: Widget structural skeleton helpers ────────────────────

/** Scene widgets that get a skeleton — data-driven widgets do not. */
const SCENE_WIDGET = 'scene';

/** Build the list of DOM elements that MUST be present in the rendered output. */
export function buildRequiredElements(widgetType: string, state: GmState | null): string[] {
  const moduleSet = new Set(state?.modulesActive ?? []);
  const elements: string[] = [];

  // Always required
  elements.push("<div class='footer-row'> with buttons per modulesActive");

  if (widgetType === SCENE_WIDGET) {
    elements.push("<div id='scene-meta' data-meta='...'> hidden JSON");
    elements.push("<div class='action-cards'> with 3-4 player choices");
  }

  if (moduleSet.has('atmosphere')) {
    elements.push("<div class='scene-atmosphere'> with 3-5 sensory pills");
  }

  if (moduleSet.has('audio')) {
    elements.push("<button class='scene-audio-toggle'> play/stop in footer");
  }

  return elements;
}

/** Build a semantic HTML skeleton for scene renders with placeholder markers. */
export function buildSkeleton(widgetType: string, state: GmState | null): string | null {
  if (widgetType !== SCENE_WIDGET) return null;

  const moduleSet = new Set(state?.modulesActive ?? []);
  const hasAtmosphere = moduleSet.has('atmosphere');
  const hasAudio = moduleSet.has('audio');

  const parts: string[] = [];
  parts.push('<div class="scene-container">');

  // Atmosphere strip (conditional)
  if (hasAtmosphere) {
    parts.push('  <div class="scene-atmosphere">');
    parts.push('    <!-- [ATMOSPHERE: 3-5 sensory pills for sight, sound, smell, touch, taste] -->');
    parts.push('  </div>');
  }

  // Main narrative
  parts.push('  <div class="scene-narrative">');
  parts.push('    <!-- [NARRATIVE: scene prose with progressive reveal] -->');
  parts.push('  </div>');

  // Action cards
  parts.push('  <div class="scene-actions">');
  parts.push('    <div class="action-cards">');
  parts.push('      <!-- [ACTIONS: 3-4 player choice cards] -->');
  parts.push('    </div>');
  parts.push('  </div>');

  // Scene meta
  parts.push('  <div id="scene-meta" data-meta="..." style="display:none">');
  parts.push('    <!-- [META: hidden JSON state] -->');
  parts.push('  </div>');

  // Footer
  parts.push('  <div class="scene-footer">');
  parts.push('    <div class="footer-row">');
  parts.push('      <!-- [FOOTER: module-aware buttons] -->');

  if (hasAudio) {
    parts.push('      <button class="scene-audio-toggle">');
    parts.push('        <!-- [AUDIO: play/stop toggle] -->');
    parts.push('      </button>');
  }

  parts.push('    </div>');
  parts.push('  </div>');

  parts.push('</div>');

  return parts.join('\n');
}

// Template imports
import { renderScene } from '../render/templates/scene';
import { renderTicker } from '../render/templates/ticker';
import { renderCharacter } from '../render/templates/character';
import { renderDice } from '../render/templates/dice';
import { renderDicePool } from '../render/templates/dice-pool';
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
  'dice-pool': renderDicePool,
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

/** Template registry keys — exported for parity testing in constants.spec.ts */
export const TEMPLATE_KEYS: readonly string[] = Object.keys(TEMPLATES);

// ── Data shape validation ─────────────────────────────────────────────

type DataFieldSpec = { key: string; type: 'string' | 'array' | 'number' | 'object' };

const WIDGET_DATA_REQUIRED: Record<string, DataFieldSpec[]> = {
  dice: [{ key: 'dieType', type: 'string' }],
};

function validateDataShape(
  widgetType: string,
  data: Record<string, unknown>,
): string | null {
  const required = WIDGET_DATA_REQUIRED[widgetType];
  if (!required) return null;
  for (const { key, type } of required) {
    const val = data[key];
    if (val === undefined) {
      return `--data missing required key "${key}" for ${widgetType} widget.`;
    }
    const actual = Array.isArray(val) ? 'array' : typeof val;
    if (actual !== type) {
      return `--data key "${key}" must be ${type}, got ${actual}.`;
    }
  }
  return null;
}

// ── Main handler ─────────────────────────────────────────────────────

export async function handleRender(args: string[]): Promise<CommandResult> {
  const parsed = parseArgs(args, ['raw']);
  const widgetType = parsed.positional[0] || '';
  const styleName = parsed.flags.style || null;
  const raw = parsed.booleans.has('raw');
  let data: Record<string, unknown> | null = null;
  if (parsed.flags.data) {
    try { data = JSON.parse(parsed.flags.data); } catch {
      return fail('Invalid JSON in --data flag.', 'Provide valid JSON: --data \'{"key":"value"}\'', 'render');
    }
    if (data && containsForbiddenKeys(data)) {
      return fail('Data contains forbidden keys (__proto__, constructor, prototype).', 'Remove prohibited keys from --data JSON.', 'render');
    }
  }

  // Validate --data shape against widget requirements
  if (data) {
    const shapeError = validateDataShape(widgetType, data);
    if (shapeError) {
      return fail(shapeError, 'Check the --data JSON matches the expected shape for this widget type.', 'render');
    }
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

  // Sync gate — in-game widgets require sync to have been run for the current scene
  if (!isPreGame && state) {
    let lastSyncScene = -1;
    try { const raw = Number(readFileSync(getSyncMarkerPath(), 'utf-8').trim()); lastSyncScene = Number.isNaN(raw) ? -1 : raw; } catch { /* no marker */ }
    if (lastSyncScene < state.scene) {
      return fail(
        `State sync required before rendering scene ${state.scene}. Last sync: ${lastSyncScene < 0 ? 'never' : `scene ${lastSyncScene}`}.`,
        'Run `tag state sync` (or `tag state sync --apply`) before rendering.',
        'render',
      );
    }
  }

  // Resolve style name: --style flag > state.visualStyle > default for pre-config widgets > error
  const resolvedStyle = styleName ?? state?.visualStyle
    ?? (PRE_CONFIG_WIDGETS.has(widgetType) ? 'station' : null);

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
  const scopes = WIDGET_CSS_SCOPES[widgetType];
  if (!scopes) {
    return fail(
      `Widget type "${widgetType}" has no CSS scope mapping in WIDGET_CSS_SCOPES.`,
      'Add a WIDGET_CSS_SCOPES entry for this widget type before rendering.',
      'render',
    );
  }
  const styleScopes = WIDGET_STYLE_SCOPES[widgetType]; // undefined = full theme
  const [styleCss, refCss] = await Promise.all([
    extractAllCss(styleFilePath, styleScopes),  // visual style: scoped or full
    extractAllCss(styleRefPath, scopes),        // style-reference: scoped
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
    for (const [key, value] of Object.entries(data)) {
      if (!(key in options)) options[key] = value;
    }
  }

  // Render the template
  const html = templateFn(state, css, options);

  // Return raw HTML early — skip checklist/skeleton computation
  if (raw) {
    if (html.length > 128 * 1024) {
      console.error(`WARNING: render output is ${html.length} chars — exceeds 128K widget budget.`);
    }
    return ok(html, 'render');
  }

  // Phase 5: module checklist
  const modulesRequired = buildModulesRequired(state);
  const featureChecklist = buildFeatureChecklist(state);

  // Phase 11: required elements and skeleton
  const requiredElements = buildRequiredElements(widgetType, state);
  const skeleton = buildSkeleton(widgetType, state);

  const sizeCheck = {
    chars: html.length,
    budgetChars: 128 * 1024,
    withinBudget: html.length <= 128 * 1024,
    percentUsed: Math.round((html.length / (128 * 1024)) * 100),
  };
  const budgetNote = sizeCheck.withinBudget
    ? `Output is ${sizeCheck.chars.toLocaleString()} chars (${sizeCheck.percentUsed}% of 128K budget). Pass directly to show_widget as-is.`
    : `WARNING: Output is ${sizeCheck.chars.toLocaleString()} chars — EXCEEDS 128K budget by ${(sizeCheck.chars - sizeCheck.budgetChars).toLocaleString()} chars. Reduce content.`;

  // Craft guidance — embedded so the GM cannot miss it even after compaction
  const sceneNum = state?.scene ?? 1;
  const isActOpener = sceneNum <= 1;
  const craftGuidance = {
    proseChecklist: [
      '1. Zero meta-commentary — prose never references itself',
      '2. Zero emotion labels — show through physical manifestation',
      '3. Zero filter words — no noticed/felt/realised/seemed/heard',
      '4. Zero began-to/started-to/managed-to constructions',
      '5. At least one non-visual sense (sound, smell, temperature, texture)',
      '6. Sentence length varies — no 3 consecutive similar-length sentences',
      '7. Strong verbs — no adverb+weak-verb where one strong verb serves',
      '8. Dialogue: each NPC voice distinct from every other',
      '9. No cliché clusters — max one per scene, only if subverted',
      '10. No summarising tic — final sentence advances, does not recap',
      '11. Scene density matches context — act opener 4-6¶, standard 2-4¶',
    ],
    densityGuidance: isActOpener
      ? 'ACT OPENER (4-6¶): grounding paragraph (senses), atmospheric paragraph (mood), orientation paragraph (NPCs/interactables), hook paragraph (mystery/threat). Do NOT rush to the first choice.'
      : `Standard scene ${sceneNum} (2-4¶): one sensory beat, one plot beat, one choice.`,
    contextVerification: {
      instruction: 'BEFORE composing narrative: if you cannot recall reading prose-craft.md and the modules below in THIS conversation, re-read them now. Context compaction may have removed them.',
      requiredFiles: modulesRequired,
      ...(isActOpener ? { criticalReminder: 'ACT OPENER — 4-6 paragraphs with full sensory grounding. A brief scene here is a critical failure.' } : {}),
    },
  };

  return ok(
    {
      widget: widgetType,
      style: resolvedStyle,
      html,
      budgetNote,
      sizeCheck,
      craftGuidance,
      modulesRequired,
      featureChecklist,
      requiredElements,
      ...(skeleton !== null ? { skeleton } : {}),
    },
    'render',
  );
}
