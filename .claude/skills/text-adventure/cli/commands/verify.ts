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
import { hasValidRenderOrigin } from '../lib/render-origin';

/** Compute a signed workflow marker.
 *  Format: scene:timestamp:fnv32('tag-cli-gate:' + scene + ':' + timestamp)
 *  This is a workflow gate, not a hard security boundary. */
export function signMarker(scene: number, _stateJSON?: string): string {
  const ts = Date.now();
  return `${scene}:${ts}:${fnv32('tag-cli-gate:' + scene + ':' + ts)}`;
}

/** Validate a signed workflow marker. Returns the scene number or -1 if invalid.
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

const PANEL_MODULE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(MODULE_PANEL_MAP).map(([module, panel]) => [panel, module]),
) as Record<string, string>;

const VERIFY_RENDER_TYPE_MAP: Record<string, string> = {
  scenario: 'scenario-select',
  rules: 'settings',
  character: 'character-creation',
};

let _stateDirCache: string | undefined;
function resolveStateDir(): string {
  if (_stateDirCache !== undefined) return _stateDirCache;
  const raw = process.env.TAG_STATE_DIR || join(homedir(), '.tag');
  try {
    const resolved = realpathSync(resolve(raw));
    const home = homedir();
    const tmp = '/tmp';
    if (!resolved.startsWith(home) && !resolved.startsWith(tmp)) {
      throw new Error(`State directory ${resolved} is outside allowed prefixes (${home}, ${tmp}).`);
    }
    _stateDirCache = resolved;
    return resolved;
  } catch (err) {
    const fallback = resolve(raw);
    const home = homedir();
    const tmp = '/tmp';
    if (!fallback.startsWith(home) && !fallback.startsWith(tmp)) {
      throw new Error(`State directory ${fallback} is outside allowed prefixes (${home}, ${tmp}).`);
    }
    _stateDirCache = fallback;
    return fallback;
  }
}
export function clearStateDirCache(): void { _stateDirCache = undefined; }

const _reCache = new Map<string, RegExp>();
function getCachedRe(pattern: string, flags: string): RegExp {
  const key = `${pattern}:${flags}`;
  let re = _reCache.get(key);
  if (!re) { re = new RegExp(pattern, flags); _reCache.set(key, re); }
  return re;
}

export function getVerifyMarkerPath(): string {
  return join(resolveStateDir(), '.last-verify');
}

export function getNeedsVerifyPath(): string {
  return join(resolveStateDir(), '.needs-verify');
}

function checkFooter(html: string, state: GmState, failures: string[]): void {
  const footer = extractDivBlockByClass(html, 'footer-row');
  if (!footer) {
    failures.push('Missing footer row (.footer-row) — required for panel, save, and export controls.');
    return;
  }

  const footerButtons = extractButtonElements(footer);
  const panelButtons = footerButtons.filter(button => button.dataPanel !== null);
  const actualPanels = new Set(panelButtons.map(button => button.dataPanel!));
  const allowedPanels = new Set<string>(['character']);

  for (const mod of state.modulesActive) {
    const panel = MODULE_PANEL_MAP[mod];
    if (panel) allowedPanels.add(panel);
  }
  if (state._levelupPending) allowedPanels.add('levelup');

  if (!actualPanels.has('character')) {
    failures.push('Missing footer button: Character panel (data-panel="character") — always required.');
  }

  for (const panel of allowedPanels) {
    if (panel === 'character' || actualPanels.has(panel)) continue;
    const mod = PANEL_MODULE_MAP[panel];
    if (mod) {
      failures.push(`Missing footer button: ${panel} panel (data-panel="${panel}") — required by active module "${mod}".`);
    } else {
      failures.push(`Missing footer button: ${panel} panel (data-panel="${panel}") — required by the active scene state.`);
    }
  }

  for (const panel of actualPanels) {
    if (allowedPanels.has(panel)) continue;
    const mod = PANEL_MODULE_MAP[panel];
    failures.push(
      mod
        ? `Unexpected footer button: ${panel} panel (data-panel="${panel}") — module "${mod}" is not active.`
        : `Unexpected footer button: ${panel} panel (data-panel="${panel}") — this panel is not allowed in the current scene.`,
    );
  }

  const footerIds = new Set(footerButtons.map(button => button.id).filter((id): id is string => id !== null));
  if (!footerIds.has('save-btn')) {
    failures.push('Missing footer button: Save action (id="save-btn") — scene footer must always include Save ↗.');
  }

  if (state.modulesActive.includes('adventure-exporting')) {
    if (!footerIds.has('export-btn')) {
      failures.push('Missing footer button: Export action (id="export-btn") — required by active module "adventure-exporting".');
    }
  } else if (footerIds.has('export-btn')) {
    failures.push('Unexpected footer button: Export action (id="export-btn") — module "adventure-exporting" is not active.');
  }

  if (state.modulesActive.includes('audio')) {
    if (!footerIds.has('audio-btn')) {
      failures.push('Missing audio button (id="audio-btn") — required by active audio module.');
    }
  } else if (footerIds.has('audio-btn')) {
    failures.push('Unexpected audio button (id="audio-btn") — audio module is not active.');
  }

  const missingAriaExpanded = panelButtons.filter(button => !/\baria-expanded\s*=\s*(['"])(true|false)\1/i.test(button.markup));
  if (missingAriaExpanded.length > 0) {
    failures.push('Footer panel buttons must declare aria-expanded="true|false" so overlay state changes are announced accessibly.');
  }
}

function checkSceneMeta(html: string, failures: string[]): void {
  if (!html.includes('id="scene-meta"') && !html.includes("id='scene-meta'")) {
    failures.push('Missing scene-meta div (id="scene-meta") — required for machine-readable scene state.');
  }
}

function checkNarrative(html: string, failures: string[]): void {
  const blocks: string[] = [];
  const pattern = /<div\b[^>]*(?:id\s*=\s*(['"])narrative\1|class\s*=\s*(['"])[^'"]*\bnarrative\b[^'"]*\2)[^>]*>([\s\S]*?)<\/div>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    blocks.push(match[3]!);
  }

  if (blocks.length === 0) {
    failures.push('Missing narrative container — scene needs #narrative or .scene-phase .narrative before it can be verified.');
    return;
  }

  const tooShort = blocks.filter(block => stripHtml(block).length < 50);
  if (tooShort.length > 0) {
    failures.push(
      `Found ${tooShort.length} narrative block(s) that are empty or too short. `
      + 'Compose real prose into #narrative or every .scene-phase .narrative block before verifying.',
    );
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
      return;
    }

    const pillCount = countClassOccurrences(html, 'atmo-pill');
    if (pillCount < 3) {
      failures.push(`Atmosphere strip has ${pillCount} sensory pill(s) — minimum is 3 when the atmosphere module is active.`);
    }
  }
}

type PromptElement = {
  markup: string;
  prompt: string;
  id: string | null;
  title: string | null;
  classes: string[];
};

type ButtonElement = {
  markup: string;
  text: string;
  prompt: string | null;
  dataPanel: string | null;
  id: string | null;
  title: string | null;
  classes: string[];
};

function extractAttr(markup: string, name: string): string | null {
  const match = new RegExp(`\\b${name}\\s*=\\s*(['"])(.*?)\\1`, 'i').exec(markup);
  return match?.[2] ?? null;
}

function extractAttributeValues(html: string, name: string): string[] {
  const values: string[] = [];
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(['"])(.*?)\\1`, 'gi');
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    values.push(match[2]!);
  }
  return values;
}

function extractDivBlockById(html: string, id: string): string | null {
  const opener = new RegExp(`<div\\b[^>]*\\bid\\s*=\\s*(['"])${id}\\1[^>]*>`, 'i').exec(html);
  if (!opener || opener.index === undefined) return null;

  const tagPattern = /<\/?div\b[^>]*>/gi;
  tagPattern.lastIndex = opener.index + opener[0].length;
  let depth = 1;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(html)) !== null) {
    if (match[0].startsWith('</')) depth--;
    else depth++;
    if (depth === 0) return html.slice(opener.index, tagPattern.lastIndex);
  }

  return null;
}

function extractDivBlockByClass(html: string, className: string): string | null {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const opener = new RegExp(`<div\\b[^>]*\\bclass\\s*=\\s*(['"])[^'"]*\\b${escaped}\\b[^'"]*\\1[^>]*>`, 'i').exec(html);
  if (!opener || opener.index === undefined) return null;

  const tagPattern = /<\/?div\b[^>]*>/gi;
  tagPattern.lastIndex = opener.index + opener[0].length;
  let depth = 1;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(html)) !== null) {
    if (match[0].startsWith('</')) depth--;
    else depth++;
    if (depth === 0) return html.slice(opener.index, tagPattern.lastIndex);
  }

  return null;
}

function stripHtml(raw: string): string {
  return raw
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countClassOccurrences(html: string, className: string): number {
  const pattern = new RegExp(`class\\s*=\\s*(['"])[^'"]*\\b${className}\\b[^'"]*\\1`, 'gi');
  return [...html.matchAll(pattern)].length;
}

function extractButtonElements(html: string): ButtonElement[] {
  const buttons: ButtonElement[] = [];
  const pattern = /<button\b[^>]*>[\s\S]*?<\/button>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const markup = match[0];
    const classAttr = extractAttr(markup, 'class');
    buttons.push({
      markup,
      text: stripHtml(markup),
      prompt: extractAttr(markup, 'data-prompt'),
      dataPanel: extractAttr(markup, 'data-panel'),
      id: extractAttr(markup, 'id'),
      title: extractAttr(markup, 'title'),
      classes: classAttr ? classAttr.split(/\s+/).filter(Boolean) : [],
    });
  }
  return buttons;
}

function extractPromptElements(html: string): PromptElement[] {
  const promptElements: PromptElement[] = [];
  const pattern = /<[a-zA-Z][\w:-]*\b[^>]*\bdata-prompt\s*=\s*(['"])(.*?)\1[^>]*>/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const markup = match[0];
    const classAttr = extractAttr(markup, 'class');
    promptElements.push({
      markup,
      prompt: match[2]!,
      id: extractAttr(markup, 'id'),
      title: extractAttr(markup, 'title'),
      classes: classAttr ? classAttr.split(/\s+/).filter(Boolean) : [],
    });
  }
  return promptElements;
}

function extractActionButtons(html: string): ButtonElement[] {
  return extractButtonElements(html).filter(button => button.classes.includes('action-card'));
}

function checkActionCards(html: string, failures: string[]): void {
  const sceneContent = extractDivBlockById(html, 'scene-content') ?? html;
  const contentPrompts = extractPromptElements(sceneContent)
    .filter(el => el.id !== 'save-btn' && el.id !== 'export-btn')
    .filter(el => !el.classes.includes('footer-btn'))
    .length;

  if (contentPrompts < MIN_ACTION_PROMPTS) {
    failures.push(
      `Found ${contentPrompts} interactive element(s) with data-prompt inside #scene-content — minimum is ${MIN_ACTION_PROMPTS}. `
      + 'Every scene needs at least 2 visible action cards or POI buttons so the player has choices. '
      + 'Footer buttons and hidden panel controls do not count.',
    );
  }
}

function checkPanelOverlay(html: string, failures: string[]): void {
  if (!html.includes('panel-overlay') && !html.includes('id="panel-overlay"')) {
    failures.push('Missing panel overlay (id="panel-overlay") — required for Character/Codex/Ship/Crew/Map panel system.');
    return;
  }

  if (!html.includes('id="panel-close-btn"') && !html.includes("id='panel-close-btn'")) {
    failures.push('Missing panel close button (id="panel-close-btn") — overlay panels must be dismissible.');
  }

  const titleTag = /<[^>]+\bid\s*=\s*(['"])panel-title-text\1[^>]*>/i.exec(html)?.[0] ?? null;
  if (!titleTag) {
    failures.push('Missing panel title element (id="panel-title-text") — overlay panels need a focus target and accessible name.');
  } else if (!/\btabindex\s*=\s*(['"])-1\1/i.test(titleTag)) {
    failures.push('Panel title (id="panel-title-text") must include tabindex="-1" so focus can move to the overlay heading.');
  }

  const overlayTag = /<div\b[^>]*\bid\s*=\s*(['"])panel-overlay\1[^>]*>/i.exec(html)?.[0] ?? null;
  if (overlayTag && !/\baria-labelledby\s*=\s*(['"])panel-title-text\1/i.test(overlayTag)) {
    failures.push('Panel overlay must reference panel-title-text via aria-labelledby for accessible dialog labelling.');
  }
}

function checkShadowRenderOrigin(widgetType: string, html: string, failures: string[]): void {
  const renderWidgetType = VERIFY_RENDER_TYPE_MAP[widgetType] ?? widgetType;
  if (!hasValidRenderOrigin(renderWidgetType, html)) {
    failures.push(
      `${widgetType} widget is missing a valid exact render-origin marker from tag render. `
      + 'Standalone widgets must use the unmodified html returned by tag render, not a hand-coded or edited copy.',
    );
  }
  const hasShadowHost = html.includes('id="shadow-host"') || html.includes("id='shadow-host'");
  const hasAttachShadow = /attachShadow\(\{\s*mode\s*:\s*['"]open['"]\s*\}\)/.test(html);
  if (!hasShadowHost || !hasAttachShadow) {
    failures.push(
      `${widgetType} widget is missing the Shadow DOM bootstrap from tag render. `
      + 'Standalone widgets must use the unmodified html returned by tag render, not a hand-coded shell.',
    );
  }
}

function checkInlineOnclick(html: string, failures: string[]): void {
  const onclickCount = (html.match(/\bonclick\s*=\s*['"]/gi) ?? []).length;
  if (onclickCount > 0) {
    failures.push(
      `Found ${onclickCount} inline onclick handler(s). Use data-prompt + addEventListener instead. `
      + 'Inline onclick handlers break silently on apostrophes and special characters in prompt strings.',
    );
  }
}

function checkSendPromptFallback(html: string, failures: string[]): void {
  const promptButtons = extractPromptElements(html);
  const missingFallback = promptButtons.filter(btn => (btn.title?.length ?? 0) < 10);
  if (missingFallback.length > 0) {
    failures.push(
      `Found ${missingFallback.length} data-prompt button(s) without adequate title fallback text. `
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

function checkScenarioWidget(html: string, failures: string[]): void {
  checkShadowRenderOrigin('scenario', html, failures);
  checkBrokenSerialisation(html, failures);
  checkCssVariables(html, failures);
  checkInlineOnclick(html, failures);

  const cards = countClassOccurrences(html, 'scenario-card');
  if (cards < 2) failures.push(`Found ${cards} scenario card(s) — expected at least 2.`);

  const buttons = extractPromptElements(html).filter(el => el.classes.includes('scenario-select-btn'));
  if (buttons.length < 2) {
    failures.push(`Found ${buttons.length} select button(s) — each scenario card needs a select button with data-prompt.`);
  }

  const missingFallback = buttons.filter(btn => (btn.title?.trim().length ?? 0) < 10);
  if (missingFallback.length > 0) {
    failures.push(
      `Found ${missingFallback.length} scenario button(s) without adequate title fallback text. `
      + 'Every scenario-select button needs a copyable title attribute.',
    );
  }
}

function checkRulesWidget(html: string, failures: string[]): void {
  checkShadowRenderOrigin('rules', html, failures);
  checkBrokenSerialisation(html, failures);
  checkCssVariables(html, failures);
  checkInlineOnclick(html, failures);

  if (!html.includes('settings-confirm') && !html.includes('confirm-btn')) {
    failures.push('Settings widget missing confirm button (id="settings-confirm" or class="confirm-btn").');
  }

  const uniqueGroups = new Set(extractAttributeValues(html, 'data-group'));
  if (uniqueGroups.size < 2) failures.push(`Found ${uniqueGroups.size} option group(s) — settings needs at least 2 (e.g. rulebook, difficulty).`);

  const required = ['rulebook', 'visualStyle'];
  for (const group of required) {
    if (!uniqueGroups.has(group)) failures.push(`Settings missing required option group: "${group}".`);
  }
  if (!uniqueGroups.has('modules')) {
    failures.push('Settings missing module selection group (data-group="modules") — player cannot choose active modules.');
  }

  const objectValues = extractAttributeValues(html, 'data-value').filter(value => value === '[object Object]').length;
  if (objectValues > 0) {
    failures.push(`Found ${objectValues} option(s) with data-value="[object Object]" — arrays must contain strings, not objects.`);
  }
}

function checkCharacterWidget(html: string, failures: string[]): void {
  checkShadowRenderOrigin('character', html, failures);
  checkBrokenSerialisation(html, failures);
  checkCssVariables(html, failures);
  checkInlineOnclick(html, failures);

  if (extractPromptElements(html).length === 0 && !html.includes('sendPrompt')) {
    failures.push('Character creation widget missing confirm mechanism (data-prompt or sendPrompt handler).');
  }
  if (!/\btype\s*=\s*(['"])text\1/i.test(html) && !/\bcontenteditable(?:\s*=\s*(['"])true\1)?/i.test(html)) {
    failures.push('Character creation widget missing name input field.');
  }

  const archetypeCards = countClassOccurrences(html, 'archetype-card');
  if (archetypeCards < 2) failures.push(`Found ${archetypeCards} archetype card(s) — expected at least 2.`);

  const emptyNames = [...html.matchAll(/class\s*=\s*(['"])[^'"]*\barch-name\b[^'"]*\1>\s*<\/div>/gi)].length;
  if (emptyNames > 0) {
    failures.push(`Found ${emptyNames} archetype card(s) with empty names — archetype labels must be visible.`);
  }

  if (!/\bdata-pronouns\s*=/i.test(html)) failures.push('Character creation missing pronoun selector (data-pronouns buttons).');
  if (!/\bdata-prof\s*=/i.test(html)) failures.push('Character creation missing proficiency selector (data-prof buttons).');
}

const IN_GAME_WIDGET_MARKERS: Record<string, string[]> = {
  dice: ['widget-dice', 'id="ra"'],
  'dice-pool': ['widget-dice-pool', 'id="dice-pool-canvas"', 'id="dice-pool-result"'],
  dialogue: ['widget-dialogue', 'dialogue-area'],
  levelup: ['widget-levelup', 'levelup-banner'],
  recap: ['widget-recap', 'recap-title'],
  'arc-complete': ['widget-arc-complete', 'arc-actions'],
  'combat-turn': ['widget-combat', 'combat-roll'],
  ticker: ['widget-ticker'],
  ship: ['widget-ship'],
  crew: ['widget-crew'],
  codex: ['widget-codex'],
  map: ['widget-map'],
  starchart: ['widget-starchart'],
  footer: ['footer-row'],
  'save-div': ['id="save-data"', 'data-payload='],
};

function checkInGameWidget(widgetType: string, html: string, failures: string[]): void {
  checkShadowRenderOrigin(widgetType, html, failures);
  checkBrokenSerialisation(html, failures);
  checkCssVariables(html, failures);
  checkInlineOnclick(html, failures);

  if (extractPromptElements(html).length > 0) {
    checkSendPromptFallback(html, failures);
  }

  const markers = IN_GAME_WIDGET_MARKERS[widgetType] ?? [];
  for (const marker of markers) {
    if (!html.includes(marker)) {
      failures.push(`Missing ${widgetType} structure marker "${marker}" — widget output looks incomplete or hand-modified.`);
    }
  }

  if (widgetType === 'dice' && !html.includes('id="cv"') && !html.includes('id="rollArea"')) {
    failures.push('Dice widget missing roll surface (#cv or #rollArea) — widget cannot be interacted with.');
  }

  if (widgetType === 'arc-complete') {
    const actionButtons = extractPromptElements(html).filter(el => el.classes.includes('arc-action-btn')).length;
    if (actionButtons < 3) {
      failures.push(`Arc-complete widget has ${actionButtons} action button(s) — expected Save, Export, and Continue.`);
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
  const locallyDefined = new Set(
    [...html.matchAll(/(--[a-zA-Z][\w-]*)\s*:/g)].map(match => match[1]!),
  );
  const invalid = new Set<string>();
  for (const m of hits) {
    const varName = m[1]!;
    if (!VALID_VAR_PREFIXES.some(prefix => varName.startsWith(prefix)) && !locallyDefined.has(varName)) {
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
  return extractPromptElements(html)
    .filter(el => el.classes.includes('action-card'))
    .map(el => el.prompt);
}

function checkActionCardEditorialLabels(html: string, failures: string[]): void {
  const sceneContent = extractDivBlockById(html, 'scene-content') ?? html;
  const buttons = extractActionButtons(sceneContent);
  if (buttons.length === 0) return;

  const labelPattern = /^(safe|risky|recommended)\b/i;
  const phrasePattern = /\b(safe|risky|recommended)\s+(option|choice|route|path|approach|plan)\b/i;
  const found: string[] = [];

  for (const button of buttons) {
    const text = button.text.trim();
    if (labelPattern.test(text) || phrasePattern.test(text)) {
      found.push(`"${text}"`);
    }
  }

  if (found.length > 0) {
    failures.push(
      `Action card(s) include editorial guidance labels — player choices must remain neutral. `
      + `Choices must not be framed as safe, risky, or recommended. ${found.join('; ')}.`,
    );
  }
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

/** Check that POI and action buttons use internal title structure (<strong>)
 *  rather than flat concatenated text. Flat text produces unreadable labels
 *  when styles apply text-transform: uppercase. */
function checkButtonTitleStructure(html: string, failures: string[]): void {
  const buttons = extractButtonElements(html).filter(
    btn => btn.classes.includes('poi-btn')
      || btn.classes.includes('action-btn')
      || btn.classes.includes('action-card'),
  );
  if (buttons.length === 0) return;

  const flat = buttons.filter(btn => !/<strong\b/i.test(btn.markup));
  if (flat.length > 0) {
    failures.push(
      `Found ${flat.length} POI/action button(s) without internal title structure. `
      + 'Use <strong class="btn-title">Title</strong> followed by description text inside each .poi-btn, .action-btn, and .action-card. '
      + 'Flat text concatenates title and description with no visual separation.',
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
    checks = [() => checkScenarioWidget(html, failures)];
  } else if (widgetType === 'rules') {
    failures = [];
    checks = [() => checkRulesWidget(html, failures)];
  } else if (widgetType === 'character') {
    failures = [];
    checks = [() => checkCharacterWidget(html, failures)];
  } else if (isInGameNonScene) {
    failures = [];
    checks = [() => checkInGameWidget(widgetType, html, failures)];
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
      () => checkTagRenderOrigin(html, failures),
      () => checkPanelNesting(html, failures),
      () => checkActionCardEditorialLabels(html, failures),
      () => checkActionCardStatNames(html, failures),
      () => checkActionCardDcValues(html, state, failures),
      () => checkButtonTitleStructure(html, failures),
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
      : { message: `BLOCKED — ${widgetType} widget failed ${failures.length} of ${TOTAL_CHECKS} checks. DO NOT pass this HTML to show_widget. Fix every issue listed above, then re-run \`tag verify\`. The player must never see an unverified widget.` }),
  }, 'verify');
}
