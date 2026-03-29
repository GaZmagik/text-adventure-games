import { readSignedMarker, getNeedsVerifyPath } from './verify';
import { existsSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import type { CommandResult, GmState, PendingRoll, StatName } from '../types';
import { ok, fail, styleNotSet } from '../lib/errors';
import { tryLoadState, saveState, getSyncMarkerPath } from '../lib/state-store';
import { STAT_NAMES } from '../lib/constants';
import { parseArgs } from '../lib/args';
import { containsForbiddenKeys } from '../lib/security';
import {
  PRE_CONFIG_WIDGETS,
  PRE_GAME_WIDGETS,
  buildFeatureChecklist,
  buildModulesRequired,
} from '../metadata';

// ── Phase 11: Widget structural skeleton helpers ────────────────────

/** Maximum character count for a widget — Claude.ai iframe budget. */
const WIDGET_BUDGET_CHARS = 128 * 1024;

/** Scene widgets that get a skeleton — data-driven widgets do not. */
const SCENE_WIDGET = 'scene';

/** Build the list of DOM elements that MUST be present in the rendered output. */
export function buildRequiredElements(widgetType: string, state: GmState | null, moduleSet?: Set<string>): string[] {
  const modules = moduleSet ?? new Set(state?.modulesActive ?? []);
  const elements: string[] = [];

  // Always required
  elements.push("<div class='footer-row'> with buttons per modulesActive");

  if (widgetType === SCENE_WIDGET) {
    elements.push("<div id='scene-meta' data-meta='...'> hidden JSON");
    elements.push("<div class='action-cards'> with 3-4 player choices");
  }

  if (modules.has('atmosphere')) {
    elements.push("<div class='scene-atmosphere'> with 3-5 sensory pills");
  }

  if (modules.has('audio')) {
    elements.push("<button class='scene-audio-toggle'> play/stop in footer");
  }

  return elements;
}

/** Build a semantic HTML skeleton for scene renders with placeholder markers. */
export function buildSkeleton(widgetType: string, state: GmState | null, moduleSet?: Set<string>): string | null {
  if (widgetType !== SCENE_WIDGET) return null;

  const modules = moduleSet ?? new Set(state?.modulesActive ?? []);
  const hasAtmosphere = modules.has('atmosphere');
  const hasAudio = modules.has('audio');

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
import { renderArcComplete } from '../render/templates/arc-complete';
import { loadNames } from '../data/names';

// ── Widget registry ──────────────────────────────────────────────────

type TemplateFn = (state: GmState | null, styleName: string, options?: Record<string, unknown>) => string;

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
  'arc-complete': renderArcComplete,
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

  // Sync gate — in-game widgets require sync to have been run for the current scene (signed marker)
  if (!isPreGame && state) {
    const lastSyncScene = readSignedMarker(getSyncMarkerPath());
    if (lastSyncScene < state.scene) {
      return fail(
        `State sync required before rendering scene ${state.scene}. Last sync: ${lastSyncScene < 0 ? 'never' : `scene ${lastSyncScene}`}.`,
        'Run `tag state sync --apply` before rendering.',
        'render',
      );
    }
  }

  // Per-widget verify gate — blocks rendering scene N+1 if scene N was not verified.
  // Re-rendering the SAME scene (for composition) is always allowed.
  if (!isPreGame && widgetType === 'scene') {
    const needsVerify = getNeedsVerifyPath();
    if (existsSync(needsVerify)) {
      try {
        const pendingScene = Number(readFileSync(needsVerify, 'utf-8').trim());
        const currentScene = state?.scene ?? 0;
        if (pendingScene !== currentScene) {
          return fail(
            `Scene ${pendingScene} was not verified. Run \`tag verify /tmp/scene.html\` before rendering scene ${currentScene}.`,
            'Every scene widget must be verified before the next scene render. Re-rendering the same scene for composition is allowed.',
            'render',
          );
        }
        // Same scene — allow re-render for composition purposes
      } catch {
        // Malformed flag — clear it and allow render
        try { unlinkSync(needsVerify); } catch { /* ignore */ }
      }
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

  // CSS is now delivered via CDN (Shadow DOM + GitHub Pages).
  // Templates receive the style name and use wrapInShadowDom() to generate
  // the Shadow DOM bootstrap with a <link> to the CDN CSS file.
  // See: cli/render/lib/shadow-wrapper.ts, assets/css/, assets/cdn-manifest.ts

  // Build options object
  const options: Record<string, unknown> = {};
  if (data) {
    options.data = data;
    for (const [key, value] of Object.entries(data)) {
      if (!(key in options)) options[key] = value;
    }
  }

  // Inject name pool for character-creation widget
  if (widgetType === 'character-creation') {
    const names = loadNames();
    const theme = state?.theme ?? resolvedStyle ?? 'fantasy';
    const SCI_FI_THEMES = new Set(['sci-fi', 'space', 'cyberpunk', 'post-apocalyptic', 'station', 'terminal', 'neon', 'holographic', 'blueprint']);
    const useSciFi = SCI_FI_THEMES.has(theme.toLowerCase());
    options.namePool = {
      given: useSciFi ? names.sciFiGiven : names.realWorldGiven,
      surname: useSciFi ? names.sciFiSurname : names.realWorldSurname,
    };
  }

  // Validate actions array shape when present
  if (data?.actions !== undefined && !Array.isArray(data.actions)) {
    return fail(
      '--data "actions" must be an array.',
      'Provide actions as a JSON array: --data \'{"actions":[...]}\'',
      'render',
    );
  }

  // Render the template
  const html = templateFn(state, resolvedStyle, options);

  // Persist pending rolls from scene action cards
  if (widgetType === 'scene' && data?.actions && Array.isArray(data.actions) && state) {
    const pendingRolls: PendingRoll[] = [];
    for (let i = 0; i < data.actions.length; i++) {
      const action = data.actions[i] as Record<string, unknown> | undefined;
      if (action?.roll && typeof action.roll === 'object') {
        const roll = action.roll as Record<string, unknown>;
        const rollType = roll.type;
        const rollStat = roll.stat;
        if (typeof rollType !== 'string' || (rollType !== 'contest' && rollType !== 'hazard')) continue;
        if (typeof rollStat !== 'string' || !STAT_NAMES.includes(rollStat as StatName)) continue;
        pendingRolls.push({
          action: i + 1,
          type: rollType,
          stat: rollStat as StatName,
          ...(roll.npc ? { npc: String(roll.npc) } : {}),
          ...(roll.dc ? { dc: Number(roll.dc) } : {}),
          ...(roll.skill ? { skill: String(roll.skill) } : {}),
        });
      }
    }
    if (pendingRolls.length > 0) {
      state._pendingRolls = pendingRolls;
      await saveState(state);
    }
  }

  // Write needs-verify flag for scene widgets — next render blocks until verified
  if (widgetType === 'scene' && !isPreGame) {
    writeFileSync(getNeedsVerifyPath(), String(state?.scene ?? 0), 'utf-8');
  }

  // Return raw HTML early — skip checklist/skeleton computation
  if (raw) {
    if (html.length > WIDGET_BUDGET_CHARS) {
      console.error(`WARNING: render output is ${html.length} chars — exceeds 128K widget budget.`);
    }
    return ok(html, 'render');
  }

  // Phase 5: module checklist
  const modulesRequired = buildModulesRequired(state);
  const featureChecklist = buildFeatureChecklist(state);

  // Phase 11: required elements and skeleton
  const activeModuleSet = new Set(state?.modulesActive ?? []);
  const requiredElements = buildRequiredElements(widgetType, state, activeModuleSet);
  const skeleton = buildSkeleton(widgetType, state, activeModuleSet);

  const sizeCheck = {
    chars: html.length,
    budgetChars: WIDGET_BUDGET_CHARS,
    withinBudget: html.length <= WIDGET_BUDGET_CHARS,
    percentUsed: Math.round((html.length / WIDGET_BUDGET_CHARS) * 100),
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
      '11. Scene density matches context — act opener 6-10¶ (short story), standard 2-4¶',
    ],
    densityGuidance: isActOpener
      ? 'ACT OPENER (6-10¶, SHORT STORY DENSITY): Write this like the opening chapter of a novel. '
        + 'World-building paragraph (the place has history — architecture, scars, atmosphere). '
        + 'Sensory grounding paragraph (at least 3 senses, anchored in specific physical detail). '
        + 'Character establishment paragraph (the protagonist through action and environment, not summary). '
        + 'NPC/interactable introduction (who is here, what are they doing — observed, not announced). '
        + 'Tension paragraph (the thing that is wrong, the pressure, the question hanging in the air). '
        + 'Hook paragraph (the event that forces a choice). '
        + 'You have 65K+ chars of budget headroom — USE IT. A thin act opener is a critical failure. '
        + 'This scene sets the entire tone. Write it like it matters.'
      : `Standard scene ${sceneNum} (2-4¶): one sensory beat, one plot beat, one choice.`,
    contextVerification: {
      instruction: 'BEFORE composing narrative: if you cannot recall reading prose-craft.md and the modules below in THIS conversation, re-read them now. Context compaction may have removed them.',
      requiredFiles: modulesRequired,
      ...(isActOpener ? { criticalReminder: 'ACT OPENER — 6-10 paragraphs, short story density. World-building, character, senses, tension, hook. You have the budget. A brief scene here is a critical failure.' } : {}),
    },
  };

  // SVG guidance — when budget headroom exceeds 50%, suggest inline SVG diagrams
  function buildSvgGuidance(size: typeof sizeCheck, modules: Set<string>) {
    const remaining = size.budgetChars - size.chars;
    const remainingK = Math.round(remaining / 1024);
    const suggestions: string[] = [];

    if (modules.has('ship-systems')) {
      suggestions.push('Ship cross-section SVG: show hull systems, damage indicators, power routing using --sta-color-danger/success/warning');
    }
    if (modules.has('star-chart')) {
      suggestions.push('Star chart / navigation SVG: show current position, jump routes, and nearby systems using --sta-color-location and --sta-color-accent');
    }
    if (modules.has('geo-map')) {
      suggestions.push('Floor plan / zone layout SVG: show rooms, doors, and player position using --sta-bg-tertiary and --sta-border-primary');
    }
    if (modules.has('crew-manifest')) {
      suggestions.push('Crew status diagram SVG: show morale/stress bars per crew member using --sta-color-success/warning/danger');
    }
    suggestions.push('Location atmosphere SVG: architectural detail, environmental hazard visualisation, or equipment schematic using --sta-* theme variables');

    return {
      budgetRemaining: `${remainingK}K chars available for inline SVG`,
      suggestions,
      cssVariables: 'Use --sta-* CSS variables for colours: --sta-color-accent (#4ECDC4), --sta-color-danger (#E84855), --sta-color-success (#2BA882), --sta-color-warning (#F0A500), --sta-text-primary (#EEF0FF), --sta-bg-primary (#1A1D2E)',
      tokenEfficiency: 'SVG tokenises at ~3 chars/token vs ~4 chars/token for prose — maximum visual payoff per token spent',
    };
  }

  const svgGuidance = sizeCheck.percentUsed < 50 ? buildSvgGuidance(sizeCheck, activeModuleSet) : undefined;

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
      ...(svgGuidance !== undefined ? { svgGuidance } : {}),
      cdnStyle: resolvedStyle,
      verifyRequired: {
        instruction: 'MANDATORY: After composing narrative into this HTML, save to a file and run `tag verify /tmp/scene.html` BEFORE passing to show_widget.',
        consequence: 'tag state sync --apply will REFUSE to advance to the next scene if verify has not been run. The verify marker is cryptographically signed — writing the marker file manually will not work.',
        command: 'tag verify /tmp/scene_final.html',
      },
    },
    'render',
  );
}
