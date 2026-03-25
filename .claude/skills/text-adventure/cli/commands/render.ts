import { join } from 'node:path';
import type { CommandResult, GmState } from '../types';
import { ok, fail, styleNotSet } from '../lib/errors';
import { tryLoadState } from '../lib/state-store';
import { extractAllCss } from '../render/css-extractor';
import { parseArgs } from '../lib/args';
import { MODULE_DIGESTS } from '../data/module-digests';
import { FORBIDDEN_KEYS } from '../lib/constants';

// ── Security helpers ─────────────────────────────────────────────────

/** Recursively check for forbidden keys (__proto__, constructor, prototype) in parsed JSON. */
function containsForbiddenKeys(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key)) return true;
    if (containsForbiddenKeys((obj as Record<string, unknown>)[key])) return true;
  }
  return false;
}

// ── Phase 5: Module checklist helpers ───────────────────────────────

const PROSE_CRAFT_PATH = 'modules/prose-craft.md';

/** Map active module names to their file paths, always including prose-craft. */
export function buildModulesRequired(state: GmState | null): string[] {
  const active = state?.modulesActive ?? [];
  const hasProseCraft = active.includes('prose-craft');
  return hasProseCraft
    ? active.map(m => `modules/${m}.md`)
    : [PROSE_CRAFT_PATH, ...active.map(m => `modules/${m}.md`)];
}

/** Feature checklist items that the GM must honour per active module. */
export function buildFeatureChecklist(state: GmState | null): string[] {
  const active = state?.modulesActive ?? [];
  const items: string[] = [];

  // prose-craft is always checked, even if not in modulesActive
  items.push('prose-craft ON \u2192 re-read modules/prose-craft.md this turn');

  for (const mod of active) {
    if (mod === 'prose-craft') continue; // already added above
    const digest = MODULE_DIGESTS[mod];
    if (mod === 'audio') {
      items.push('audio ON \u2192 scene must include Web Audio soundscape with play/stop button');
    } else if (mod === 'atmosphere') {
      items.push('atmosphere ON \u2192 scene must include .atmosphere-strip div with 3-5 sensory pills');
    } else if (digest) {
      items.push(`${mod} ON \u2192 ${digest}`);
    } else {
      items.push(`${mod} ON \u2192 re-read modules/${mod}.md this turn`);
    }
  }

  return items;
}

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

export const WIDGET_TYPE_NAMES = Object.keys(TEMPLATES);

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
    if (data && containsForbiddenKeys(data)) {
      return fail('Data contains forbidden keys (__proto__, constructor, prototype).', 'Remove prohibited keys from --data JSON.', 'render');
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

  // Resolve style name: --style flag > state.visualStyle > default for pre-config widgets > error
  const PRE_CONFIG_WIDGETS = new Set(['settings', 'scenario-select']);
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

  // Return raw HTML early — skip checklist/skeleton computation
  if (raw) {
    return ok(html, 'render');
  }

  // Phase 5: module checklist
  const modulesRequired = buildModulesRequired(state);
  const featureChecklist = buildFeatureChecklist(state);

  // Phase 11: required elements and skeleton
  const requiredElements = buildRequiredElements(widgetType, state);
  const skeleton = buildSkeleton(widgetType, state);

  return ok(
    {
      widget: widgetType,
      style: resolvedStyle,
      html,
      modulesRequired,
      featureChecklist,
      requiredElements,
      ...(skeleton !== null ? { skeleton } : {}),
    },
    'render',
  );
}
