// tag CLI — Verify Command
// Validates composed scene HTML against current game state before show_widget.
// Writes a .last-verify marker on success; tag state sync requires this marker.

import { readFileSync, realpathSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import type { CommandResult, GmState } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState, saveState, getSyncMarkerPath } from '../lib/state-store';
import { fnv32 } from '../lib/fnv32';
import { resolveSafeReadPath } from '../lib/path-security';
import { MODULE_PANEL_MAP } from '../lib/module-panel-map';
import { TIER1_MODULES } from '../lib/constants';

/** Compute a signed marker that's impractical to forge via echo.
 *  Format: scene:timestamp:fnv32('tag-cli-gate:' + scene + ':' + timestamp)
 *  Plain `echo "1"` fails validation (wrong format). Forging requires knowing the
 *  salt string and computing fnv32 with the exact timestamp — more effort than
 *  just running the command. */
export function signMarker(scene: number, _stateJSON?: string): string {
  const ts = Date.now();
  return `${scene}:${ts}:${fnv32('tag-cli-gate:' + scene + ':' + ts)}`;
}

/** Validate a signed marker. Returns the scene number or -1 if invalid/forged.
 *  Checks: 3-part format, valid scene, valid timestamp, hash matches. */
export function readSignedMarker(markerPath: string, _stateJSON?: string): number {
  try {
    const raw = readFileSync(markerPath, 'utf-8').trim();
    const parts = raw.split(':');
    if (parts.length < 3) return -1; // Plain "1" or "999" rejected
    const scene = Number(parts[0]);
    const ts = parts[1]!;
    const hash = parts.slice(2).join(':');
    if (Number.isNaN(scene) || !ts || !hash) return -1;
    const expected = fnv32('tag-cli-gate:' + scene + ':' + ts);
    return hash === expected ? scene : -1;
  } catch {
    return -1;
  }
}

/** Minimum CSS character count — a full tag render scene produces ~40K+ of CSS. */
const MIN_CSS_CHARS = 5000;

/** Minimum action-card / data-prompt count for interactive scenes. */
const MIN_ACTION_PROMPTS = 2;

function resolveStateDir(): string {
  const raw = process.env.TAG_STATE_DIR || join(homedir(), '.tag');
  try {
    const resolved = realpathSync(resolve(raw));
    const home = homedir();
    const tmp = '/tmp';
    if (!resolved.startsWith(home) && !resolved.startsWith(tmp)) {
      throw new Error(`State directory ${resolved} is outside allowed prefixes (${home}, ${tmp}).`);
    }
    return resolved;
  } catch (err) {
    const fallback = resolve(raw);
    const home = homedir();
    const tmp = '/tmp';
    if (!fallback.startsWith(home) && !fallback.startsWith(tmp)) {
      throw new Error(`State directory ${fallback} is outside allowed prefixes (${home}, ${tmp}).`);
    }
    return fallback;
  }
}

export function getVerifyMarkerPath(): string {
  return join(resolveStateDir(), '.last-verify');
}

export function getNeedsVerifyPath(): string {
  return join(resolveStateDir(), '.needs-verify');
}

function checkFooter(html: string, state: GmState, failures: string[]): void {
  // Character button is always required
  if (!html.includes('data-panel="character"')) {
    failures.push('Missing footer button: Character panel (data-panel="character") — always required.');
  }

  // Module-specific panel buttons
  for (const mod of state.modulesActive) {
    const panel = MODULE_PANEL_MAP[mod];
    if (panel && !html.includes(`data-panel="${panel}"`)) {
      failures.push(`Missing footer button: ${panel} panel (data-panel="${panel}") — required by active module "${mod}".`);
    }
  }

  // Audio button if audio module active
  if (state.modulesActive.includes('audio') && !html.includes('audio-btn')) {
    failures.push('Missing audio button (id="audio-btn") — required by active audio module.');
  }
}

function checkSceneMeta(html: string, failures: string[]): void {
  if (!html.includes('id="scene-meta"') && !html.includes("id='scene-meta'")) {
    failures.push('Missing scene-meta div (id="scene-meta") — required for machine-readable scene state.');
  }
}

function checkNarrative(html: string, failures: string[]): void {
  const narrativeMatch = html.match(/id="narrative"[^>]*>([\s\S]*?)(?=<\/div>\s*<div class="status|<div class="section-label|$)/);
  if (!narrativeMatch) {
    failures.push('Missing narrative div (id="narrative") — scene has no narrative container.');
    return;
  }
  const content = narrativeMatch[1]!.replace(/<!--.*?-->/g, '').trim();
  if (!content || content.length < 50) {
    failures.push('Narrative div is empty or too short — compose narrative prose before verifying. The GM must inject story content into the #narrative div.');
  }
}

function checkCss(html: string, failures: string[]): void {
  // Shadow DOM: CSS is loaded via CDN <link> and inline widgetStyle.textContent
  // rather than literal <style> tags. Detect Shadow DOM and count inline CSS.
  if (html.includes('attachShadow')) {
    // Count inline CSS from widgetStyle.textContent=`...` patterns
    const inlineCssMatches = html.match(/widgetStyle\.textContent=`[^`]*`/g) ?? [];
    let totalCss = 0;
    for (const match of inlineCssMatches) totalCss += match.length;
    // CDN link counts as substantial CSS (loaded externally)
    if (html.includes('.css?v=')) totalCss += MIN_CSS_CHARS;
    if (totalCss < MIN_CSS_CHARS) {
      failures.push(
        `Shadow DOM CSS is ${totalCss.toLocaleString()} chars — below ${MIN_CSS_CHARS.toLocaleString()} minimum. `
        + 'The full tag render scene output includes CDN CSS + inline widget CSS.',
      );
    }
    return;
  }
  // Legacy: check <style> blocks
  const styleBlocks = html.match(/<style[^>]*>([\s\S]*?)<\/style>/g) ?? [];
  let totalCss = 0;
  for (const block of styleBlocks) {
    totalCss += block.length;
  }
  if (totalCss < MIN_CSS_CHARS) {
    failures.push(
      `CSS is ${totalCss.toLocaleString()} chars — below ${MIN_CSS_CHARS.toLocaleString()} minimum. `
      + 'The full tag render scene output includes ~40K+ of CSS. If CSS is this small, the widget was hand-written instead of composed from the render output.',
    );
  }
}

function checkAtmosphere(html: string, state: GmState, failures: string[]): void {
  if (state.modulesActive.includes('atmosphere')) {
    if (!html.includes('atmo-pill') && !html.includes('atmo-strip')) {
      failures.push('Missing atmosphere strip — required by active atmosphere module. Include .atmo-pill spans in the .atmo-strip div.');
    }
  }
}

function checkActionCards(html: string, failures: string[]): void {
  // Count data-prompt elements OUTSIDE the footer (exclude Save/Export buttons)
  // Footer buttons are inside .footer-row or have id="save-btn"/"export-btn"
  const allPrompts = html.match(/data-prompt="/g) ?? [];
  const footerPrompts = (html.match(/id="save-btn"[^>]*data-prompt|id="export-btn"[^>]*data-prompt|data-prompt[^>]*id="save-btn"|data-prompt[^>]*id="export-btn"/g) ?? []).length;
  const contentPrompts = allPrompts.length - footerPrompts;

  if (contentPrompts < MIN_ACTION_PROMPTS) {
    failures.push(
      `Found ${contentPrompts} interactive element(s) with data-prompt outside footer — minimum is ${MIN_ACTION_PROMPTS}. `
      + 'Every scene needs at least 2 action cards or POI buttons so the player has choices. '
      + 'Save/Export footer buttons do not count.',
    );
  }
}

function checkPanelOverlay(html: string, failures: string[]): void {
  if (!html.includes('panel-overlay') && !html.includes('id="panel-overlay"')) {
    failures.push('Missing panel overlay (id="panel-overlay") — required for Character/Codex/Ship/Crew/Map panel system.');
  }
}

function checkInlineOnclick(html: string, failures: string[]): void {
  const onclickCount = (html.match(/onclick="/gi) ?? []).length;
  if (onclickCount > 0) {
    failures.push(
      `Found ${onclickCount} inline onclick handler(s). Use data-prompt + addEventListener instead. `
      + 'Inline onclick handlers break silently on apostrophes and special characters in prompt strings.',
    );
  }
}

function checkSendPromptFallback(html: string, failures: string[]): void {
  const promptButtons = html.match(/data-prompt="[^"]+"/g) ?? [];
  const hasTitleAttr = html.match(/title="[^"]{10,}"/g) ?? [];
  if (promptButtons.length > 0 && hasTitleAttr.length === 0) {
    failures.push(
      `Found ${promptButtons.length} data-prompt button(s) but no title attributes with fallback text. `
      + 'Every data-prompt button needs a title attribute containing the prompt text so the player can copy it if sendPrompt is unavailable.',
    );
  }
}

function checkVisualStyle(state: GmState, failures: string[]): void {
  if (!state.visualStyle) {
    failures.push(
      'visualStyle is not set in game state. Run `tag state set visualStyle <name>` before rendering. '
      + 'Without a visual style, widgets use incorrect colour palettes and may render invisible text in dark mode.',
    );
  }
}

function checkHandCodedDice(html: string, failures: string[]): void {
  const canvasPattern = /<canvas[^>]*id="[^"]*dice[^"]*"/i;
  const rawGlPattern = /getContext\s*\(\s*['"]webgl/i;
  const geometryPattern = /BufferGeometry|BoxGeometry|IcosahedronGeometry/;
  if (canvasPattern.test(html) || rawGlPattern.test(html) || geometryPattern.test(html)) {
    failures.push(
      'Detected hand-coded dice canvas or WebGL geometry. Use `tag render dice` or `tag render dice-pool` instead. '
      + 'Hand-coded dice omit the WebGL renderer, quaternion animation, numbered face textures, click-to-roll mechanics, and deterministic seeding.',
    );
  }
}

function checkBrokenSerialisation(html: string, failures: string[]): void {
  const count = (html.match(/\[object Object\]/g) ?? []).length;
  if (count > 0) {
    failures.push(
      `Found ${count} occurrence(s) of "[object Object]" in HTML — data was not serialised correctly. `
      + 'This typically means --data passed objects where strings were expected. '
      + 'Check that arrays contain plain strings, not nested objects.',
    );
  }
}

function checkPreGameWidget(html: string, failures: string[]): void {
  const isSettings = html.includes('widget-settings') || html.includes('settings-confirm');
  const isScenario = html.includes('scenario-card') || html.includes('scenario-select');
  const isCharCreate = html.includes('character-creation') || html.includes('archetype');

  if (isSettings) {
    if (!html.includes('settings-confirm') && !html.includes('confirm-btn')) {
      failures.push('Settings widget missing confirm button (id="settings-confirm" or class="confirm-btn").');
    }
    const groups = html.match(/data-group="([^"]+)"/g) ?? [];
    const uniqueGroups = new Set(groups.map(g => g.replace(/data-group="|"/g, '')));
    if (uniqueGroups.size < 2) {
      failures.push(`Settings widget has ${uniqueGroups.size} option group(s) — expected at least 2 (rulebook, difficulty, etc.).`);
    }
  }

  if (isScenario) {
    const cards = (html.match(/data-prompt="/g) ?? []).length;
    if (cards < 2) {
      failures.push(`Scenario select has ${cards} selectable option(s) — expected at least 2 scenario cards.`);
    }
  }

  if (isCharCreate) {
    if (!html.includes('data-prompt') && !html.includes('sendPrompt')) {
      failures.push('Character creation widget missing confirm mechanism (data-prompt or sendPrompt handler).');
    }
  }
}

function checkTier1Modules(state: GmState, failures: string[]): void {
  const active = new Set(state.modulesActive ?? []);
  const missing = TIER1_MODULES.filter(m => !active.has(m));
  if (missing.length > 0) {
    failures.push(
      `Missing Tier 1 modules in modulesActive: ${missing.join(', ')}. `
      + 'These must be active before rendering any widget. '
      + 'Run `tag state set modulesActive \'["gm-checklist","prose-craft","core-systems","die-rolls","character-creation","save-codex"]\'`.',
    );
  }
}

/** Valid CSS variable prefixes. Anything else (--color-*, --border-*, --font-*) is a bug. */
const VALID_VAR_PREFIXES = ['--sta-', '--ta-'];

function checkCssVariables(html: string, failures: string[]): void {
  const hits = html.matchAll(/var\(\s*(--[a-zA-Z][\w-]*)/g);
  const invalid = new Set<string>();
  for (const m of hits) {
    const varName = m[1]!;
    if (!VALID_VAR_PREFIXES.some(prefix => varName.startsWith(prefix))) {
      invalid.add(varName);
    }
  }
  if (invalid.size > 0) {
    const sorted = [...invalid].sort();
    failures.push(
      `Found ${sorted.length} CSS variable(s) with invalid prefix: ${sorted.join(', ')}. `
      + 'All CSS variables must use --sta-* (station theme) or --ta-* (mapped alias) prefix. '
      + 'Unprefixed variables like --color-* or --border-* are not defined and will resolve to nothing.',
    );
  }
}

function checkTagRenderOrigin(html: string, failures: string[]): void {
  if (!html.includes('id="reveal-brief"') || !html.includes('id="reveal-full"')) {
    failures.push(
      'Missing progressive reveal structure (#reveal-brief / #reveal-full). '
      + 'This widget was NOT produced by tag render scene. Hand-coded widgets are forbidden — '
      + 'use the html field from tag render scene output as the base, then compose narrative into it.',
    );
  }
  if (!html.includes('tag-scene.js')) {
    failures.push(
      'Missing CDN script reference (tag-scene.js). '
      + 'This widget was hand-coded instead of using tag render scene output. '
      + 'Hand-coded JS lacks panel wiring, sendPrompt fallback, POI budget, and audio support.',
    );
  }
}

function checkPanelNesting(html: string, failures: string[]): void {
  const sceneContentPos = html.indexOf('id="scene-content"');
  const panelOverlayPos = html.indexOf('id="panel-overlay"');
  if (sceneContentPos >= 0 && panelOverlayPos >= 0) {
    // Find closing </div> for scene-content — panel-overlay should be AFTER it
    // In correct structure: scene-content closes, THEN panel-overlay opens at same depth
    // In broken structure: panel-overlay is inside scene-content
    const betweenContent = html.substring(sceneContentPos, panelOverlayPos);
    const openDivs = (betweenContent.match(/<div[\s>]/g) || []).length;
    const closeDivs = (betweenContent.match(/<\/div>/g) || []).length;
    if (openDivs > closeDivs) {
      failures.push(
        'Panel overlay (#panel-overlay) is nested inside #scene-content. '
        + 'When scene-content is hidden to show a panel, the overlay hides too — '
        + 'breaking all panel buttons. Use tag render scene output which places the '
        + 'overlay as a sibling of scene-content.',
      );
    }
  }
}

function checkStatusBar(html: string, state: GmState, failures: string[]): void {
  if (state.character) {
    if (!html.includes('hp-pips') && !html.includes('status-bar')) {
      failures.push('Missing status bar with HP/AC/Level — required when character exists in state.');
    }
  }
}

/** Extract data-prompt attribute values from action cards (not footer buttons). */
function extractActionPrompts(html: string): string[] {
  const prompts: string[] = [];
  const pattern = /class="action-card"[^>]*data-prompt="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) prompts.push(match[1]!);
  // Also catch data-prompt before class
  const alt = /data-prompt="([^"]*)"[^>]*class="action-card"/g;
  while ((match = alt.exec(html)) !== null) prompts.push(match[1]!);
  return prompts;
}

/** Golden Rule 4: action cards must not reveal which stat a check tests. */
function checkActionCardStatNames(html: string, failures: string[]): void {
  const prompts = extractActionPrompts(html);
  if (prompts.length === 0) return;
  const statPattern = /\b(STR|DEX|CON|INT|WIS|CHA)\b/;
  const found: string[] = [];
  for (const prompt of prompts) {
    const m = statPattern.exec(prompt);
    if (m) found.push(`"${prompt}" reveals stat name ${m[1]}`);
  }
  if (found.length > 0) {
    failures.push(
      `Action card(s) reveal stat name(s) — Golden Rule 4 violation. `
      + `Options must describe actions, not stats. ${found.join('; ')}.`,
    );
  }
}

/** Golden Rule 3: action cards must not reveal DC values before the roll. */
function checkActionCardDcValues(html: string, state: GmState, failures: string[]): void {
  if (!state.modulesActive.includes('die-rolls')) return;
  const prompts = extractActionPrompts(html);
  if (prompts.length === 0) return;
  const dcPattern = /\bDC\s*\d+/i;
  const found: string[] = [];
  for (const prompt of prompts) {
    const m = dcPattern.exec(prompt);
    if (m) found.push(`"${prompt}" reveals difficulty class ${m[0]}`);
  }
  if (found.length > 0) {
    failures.push(
      `Action card(s) reveal difficulty class (DC) values — Golden Rule 3 violation. `
      + `DC is hidden until after the player commits to an action. ${found.join('; ')}.`,
    );
  }
}

const PRE_GAME_WIDGET_TYPES = new Set(['scenario', 'rules', 'character']);

/** In-game widget types that are NOT scenes — they come unmodified from tag render
 *  and only need lightweight verification (broken serialisation). */
const IN_GAME_WIDGET_TYPES = new Set([
  'dice', 'dice-pool', 'dialogue', 'levelup', 'recap',
  'combat-turn', 'arc-complete', 'ticker', 'ship', 'crew',
  'codex', 'map', 'starchart', 'footer', 'save-div',
]);

/** Check if a pre-game widget type has a valid verify marker. */
export function hasPreGameVerifyMarker(widgetType: string): boolean {
  const markerPath = join(resolveStateDir(), `.verified-${widgetType}`);
  return readSignedMarker(markerPath) >= 0;
}

/** Pre-game verify chain: which widget type must be verified before rendering each widget. */
export const PRE_GAME_GATE: Record<string, string> = {
  settings: 'scenario',
  'character-creation': 'rules',
  scene: 'character',
};

function readHtmlFile(filePath: string): string | CommandResult {
  try {
    const safePath = resolveSafeReadPath(filePath, { kind: 'Verify', extensions: ['.html', '.htm'] });
    if (!safePath) {
      return fail(`Invalid file path: ${filePath}`, 'Path must start with /, ./, ../, or ~/ and end with .html or .htm.', 'verify');
    }
    return readFileSync(safePath, 'utf-8');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return fail(`Failed to read file: ${msg}`, 'Check the file path exists and is readable.', 'verify');
  }
}

export async function handleVerify(args: string[]): Promise<CommandResult> {
  const first = args[0];
  if (!first) {
    return fail(
      'No arguments provided.',
      'Usage: tag verify /tmp/scene.html OR tag verify <type> /tmp/widget.html (types: scenario, rules, character, dice, dialogue, levelup, combat-turn, arc-complete, etc.)',
      'verify',
    );
  }

  // Detect widget type from first argument
  const isPreGame = PRE_GAME_WIDGET_TYPES.has(first);
  const isInGameNonScene = IN_GAME_WIDGET_TYPES.has(first);
  const hasTypeHint = isPreGame || isInGameNonScene;
  const widgetType = hasTypeHint ? first : 'scene';
  const filePath = hasTypeHint ? args[1] : first;

  if (!filePath) {
    return fail(
      `No file path provided for ${widgetType} verification.`,
      `Usage: tag verify ${widgetType} /tmp/${widgetType}.html`,
      'verify',
    );
  }

  const state = await tryLoadState();
  if (!state) return noState();

  const htmlOrError = readHtmlFile(filePath);
  if (typeof htmlOrError !== 'string') return htmlOrError;
  const html = htmlOrError;

  let failures: string[];
  let checks: Array<() => void>;

  if (widgetType === 'scenario') {
    failures = [];
    checks = [
      () => checkBrokenSerialisation(html, failures),
      () => checkCssVariables(html, failures),
      () => {
        const cards = (html.match(/scenario-card/g) ?? []).length;
        if (cards < 2) failures.push(`Found ${cards} scenario card(s) — expected at least 2.`);
      },
      () => {
        const btns = (html.match(/scenario-select-btn/g) ?? []).length;
        if (btns < 2) failures.push(`Found ${btns} select button(s) — each scenario card needs a select button with data-prompt.`);
      },
      () => {
        if (!html.includes('title=')) failures.push('Scenario buttons missing title fallback — player cannot copy prompt if sendPrompt unavailable.');
      },
    ];
  } else if (widgetType === 'rules') {
    failures = [];
    checks = [
      () => checkBrokenSerialisation(html, failures),
      () => checkCssVariables(html, failures),
      () => {
        if (!html.includes('settings-confirm') && !html.includes('confirm-btn')) {
          failures.push('Settings widget missing confirm button (id="settings-confirm" or class="confirm-btn").');
        }
      },
      () => {
        const groups = html.match(/data-group="([^"]+)"/g) ?? [];
        const unique = new Set(groups.map(g => g.replace(/data-group="|"/g, '')));
        if (unique.size < 2) failures.push(`Found ${unique.size} option group(s) — settings needs at least 2 (e.g. rulebook, difficulty).`);
        const required = ['rulebook', 'visualStyle'];
        for (const r of required) {
          if (!unique.has(r)) failures.push(`Settings missing required option group: "${r}".`);
        }
      },
      () => {
        const objectValues = (html.match(/data-value="\[object Object\]"/g) ?? []).length;
        if (objectValues > 0) failures.push(`Found ${objectValues} option(s) with data-value="[object Object]" — arrays must contain strings, not objects.`);
      },
      () => {
        if (!html.includes('data-group="modules"')) failures.push('Settings missing module selection group (data-group="modules") — player cannot choose active modules.');
      },
    ];
  } else if (widgetType === 'character') {
    failures = [];
    checks = [
      () => checkBrokenSerialisation(html, failures),
      () => checkCssVariables(html, failures),
      () => {
        if (!html.includes('data-prompt') && !html.includes('sendPrompt')) {
          failures.push('Character creation widget missing confirm mechanism (data-prompt or sendPrompt handler).');
        }
      },
      () => {
        const hasNameInput = html.includes('type="text"') || html.includes('contenteditable');
        if (!hasNameInput) failures.push('Character creation widget missing name input field.');
      },
      () => {
        const archetypeCards = (html.match(/archetype-card/g) ?? []).length;
        if (archetypeCards < 2) failures.push(`Found ${archetypeCards} archetype card(s) — expected at least 2.`);
      },
      () => {
        // Check archetype cards have visible names — empty .arch-name divs are a known bug
        const emptyNames = (html.match(/class="arch-name"><\/div>/g) ?? []).length;
        if (emptyNames > 0) failures.push(`Found ${emptyNames} archetype card(s) with empty names — archetype labels must be visible.`);
      },
      () => {
        if (!html.includes('data-pronouns')) failures.push('Character creation missing pronoun selector (data-pronouns buttons).');
      },
      () => {
        if (!html.includes('data-prof')) failures.push('Character creation missing proficiency selector (data-prof buttons).');
      },
    ];
  } else if (isInGameNonScene) {
    // Lightweight checks for non-scene in-game widgets (dice, dialogue, levelup, etc.)
    // These come unmodified from tag render — only check for broken serialisation.
    failures = [];
    checks = [
      () => checkBrokenSerialisation(html, failures),
    ];
  } else {
    // Default: scene checks
    failures = [];
    checks = [
      () => checkFooter(html, state, failures),
      () => checkSceneMeta(html, failures),
      () => checkNarrative(html, failures),
      () => checkCss(html, failures),
      () => checkAtmosphere(html, state, failures),
      () => checkActionCards(html, failures),
      () => checkPanelOverlay(html, failures),
      () => checkStatusBar(html, state, failures),
      () => checkInlineOnclick(html, failures),
      () => checkSendPromptFallback(html, failures),
      () => checkVisualStyle(state, failures),
      () => checkHandCodedDice(html, failures),
      () => checkTier1Modules(state, failures),
      () => checkCssVariables(html, failures),
      () => checkBrokenSerialisation(html, failures),
      () => checkPreGameWidget(html, failures),
      () => checkTagRenderOrigin(html, failures),
      () => checkPanelNesting(html, failures),
      () => checkActionCardStatNames(html, failures),
      () => checkActionCardDcValues(html, state, failures),
    ];
  }

  for (const check of checks) check();
  const TOTAL_CHECKS = checks.length;
  const passed = failures.length === 0;

  // On success: write signed marker for the widget type
  if (passed) {
    if (widgetType === 'scene') {
      writeFileSync(getVerifyMarkerPath(), signMarker(state.scene), 'utf-8');
      state._turnCount = (state._turnCount ?? 0) + 1;
      await saveState(state);
      try { unlinkSync(getNeedsVerifyPath()); } catch { /* already cleared */ }
      try { unlinkSync(getSyncMarkerPath()); } catch { /* already cleared */ }
    } else if (isPreGame) {
      // Pre-game widgets: write a type-specific marker so render can gate on it
      const markerPath = join(resolveStateDir(), `.verified-${widgetType}`);
      writeFileSync(markerPath, signMarker(0), 'utf-8');
    }
    // In-game non-scene widgets: no marker needed — they come unmodified from tag render
  }

  return ok({
    verified: passed,
    widgetType,
    scene: state.scene,
    failures,
    checks: TOTAL_CHECKS,
    htmlChars: html.length,
    ...(passed
      ? { message: `${widgetType} widget verified. All ${TOTAL_CHECKS} checks passed. Pass to show_widget NOW. Do NOT modify the HTML. Do NOT embed save data, export data, or base64 strings — the Save and Export footer buttons handle this when the player clicks them.` }
      : { message: `${widgetType} widget failed verification: ${failures.length} issue(s). Fix and re-verify before show_widget.` }),
  }, 'verify');
}
