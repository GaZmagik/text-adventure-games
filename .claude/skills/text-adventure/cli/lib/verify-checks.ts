// tag CLI — Verify Check Functions
// Shared verification helpers and widget-specific check functions.
// Extracted from verify.ts to keep the command handler under the line limit.

import { hasValidRenderOrigin } from './render-origin';
import type { GmState } from '../types';

// ── Types ────────────────���───────────────────────────────────────────

export type PromptElement = {
  markup: string;
  prompt: string;
  id: string | null;
  title: string | null;
  classes: string[];
};

export type ButtonElement = {
  markup: string;
  text: string;
  prompt: string | null;
  dataPanel: string | null;
  id: string | null;
  title: string | null;
  classes: string[];
};

// ── Utility helpers ──────────────────────────────────────────────────

/** Cache for single-match (i flag) attribute regexes used by extractAttr. */
const _attrRegexCache = new Map<string, RegExp>();
function getAttrRegex(name: string): RegExp {
  let re = _attrRegexCache.get(name);
  if (!re) {
    re = new RegExp(`\\b${name}\\s*=\\s*(['"])(.*?)\\1`, 'i');
    _attrRegexCache.set(name, re);
  }
  return re;
}

export function extractAttr(markup: string, name: string): string | null {
  const match = getAttrRegex(name).exec(markup);
  return match?.[2] ?? null;
}

function unesc(s: string | null): string {
  if (s == null) return '';
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** True when a value looks like a JS concatenation artifact, e.g. `' + group + '` from querySelector strings. */
function isJsArtifact(value: string): boolean {
  return /['"+]/.test(value);
}

export function extractAttributeValues(html: string, name: string): string[] {
  const values: string[] = [];
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(['"])(.*?)\\1`, 'gi');
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    values.push(match[2]!);
  }
  return values;
}

export function extractDivBlockById(html: string, id: string): string | null {
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

export function extractDivBlockByClass(html: string, className: string): string | null {
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

export function extractPanelContent(html: string, panelName: string): string | null {
  const escaped = panelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const opener = new RegExp(`<div\\b[^>]*\\bdata-panel\\s*=\\s*(['"])${escaped}\\1[^>]*>`, 'i').exec(html);
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

export function stripHtml(raw: string): string {
  return raw
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function countClassOccurrences(html: string, className: string): number {
  const pattern = new RegExp(`class\\s*=\\s*(['"])[^'"]*\\b${className}\\b(?!-)[^'"]*\\1`, 'gi');
  return [...html.matchAll(pattern)].length;
}

export function extractButtonElements(html: string): ButtonElement[] {
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

export function extractPromptElements(html: string): PromptElement[] {
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

export function extractActionButtons(html: string): ButtonElement[] {
  return extractButtonElements(html).filter(button => button.classes.includes('action-card'));
}

// ── Shared check functions ─────────────��─────────────────────────────

export function checkBrokenSerialisation(html: string, failures: string[]): void {
  const count = (html.match(/\[object Object\]/g) ?? []).length;
  if (count > 0) {
    failures.push(
      `Found ${count} occurrence(s) of "[object Object]" in HTML — data was not serialised correctly. `
      + 'This typically means --data passed objects where strings were expected. '
      + 'Check that arrays contain plain strings, not nested objects.',
    );
  }
}

const VALID_VAR_PREFIXES = ['--sta-', '--ta-'];

export function checkCssVariables(html: string, failures: string[]): void {
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

export function checkInlineOnclick(html: string, failures: string[]): void {
  const onclickCount = (html.match(/\bonclick\s*=\s*['"]/gi) ?? []).length;
  if (onclickCount > 0) {
    failures.push(
      `Found ${onclickCount} inline onclick handler(s). Use data-prompt + addEventListener instead. `
      + 'Inline onclick handlers break silently on apostrophes and special characters in prompt strings.',
    );
  }
}

export function checkSendPromptFallback(html: string, failures: string[]): void {
  const promptButtons = extractPromptElements(html);
  const missingFallback = promptButtons.filter(btn => (btn.title?.length ?? 0) < 10);
  if (missingFallback.length > 0) {
    failures.push(
      `Found ${missingFallback.length} data-prompt button(s) without adequate title fallback text. `
      + 'Every data-prompt button needs a title attribute containing the prompt text so the player can copy it if sendPrompt is unavailable.',
    );
  }
}

// ── Shadow DOM render origin ─────────────────────────────────────────

const VERIFY_RENDER_TYPE_MAP: Record<string, string> = {
  scenario: 'scenario-select',
  rules: 'settings',
  character: 'character-creation',
};

// Widget types that are emitted as self-bootstrapping custom elements (<ta-*>).
// These widgets don't contain an explicit shadow-host + attachShadow script;
// the ta-components.js runtime handles Shadow DOM construction internally.
const CUSTOM_ELEMENT_WIDGETS = new Set([
  'dialogue', 'levelup', 'ticker', 'footer',
  'scenario-select', 'settings', 'character-creation',
  'recap', 'arc-complete', 'combat-turn', 'dice',
  'character', 'crew', 'codex', 'ship', 'map', 'starchart',
  'dice-pool', 'scene',
]);

export function checkShadowRenderOrigin(widgetType: string, html: string, failures: string[]): void {
  const renderWidgetType = VERIFY_RENDER_TYPE_MAP[widgetType] ?? widgetType;
  if (!hasValidRenderOrigin(renderWidgetType, html)) {
    failures.push(
      `${widgetType} widget is missing a valid exact render-origin marker from tag render. `
      + 'Standalone widgets must use the unmodified html returned by tag render, not a hand-coded or edited copy.',
    );
  }
  // Custom elements self-bootstrap — no shadow-host / attachShadow expected
  if (CUSTOM_ELEMENT_WIDGETS.has(renderWidgetType)) return;
  const hasShadowHost = html.includes('id="shadow-host"') || html.includes("id='shadow-host'");
  const hasAttachShadow = /attachShadow\(\{\s*mode\s*:\s*['"]open['"]\s*\}\)/.test(html);
  if (!hasShadowHost || !hasAttachShadow) {
    failures.push(
      `${widgetType} widget is missing the Shadow DOM bootstrap from tag render. `
      + 'Standalone widgets must use the unmodified html returned by tag render, not a hand-coded shell.',
    );
  }
}

// ── Pre-game widget checks ──────────────────────────────────────────

export function checkPreGameWidget(html: string, failures: string[]): void {
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

export function checkScenarioWidget(html: string, failures: string[]): void {
  checkShadowRenderOrigin('scenario', html, failures);
  checkBrokenSerialisation(html, failures);
  checkCssVariables(html, failures);
  checkInlineOnclick(html, failures);

  // Custom element awareness
  const tagMatch = /<ta-scenario-select\b([^>]*)>/i.exec(html);
  if (tagMatch) {
    const attrStr = tagMatch[1]!;
    const scenariosAttr = extractAttr(attrStr, 'data-scenarios');
    if (!scenariosAttr) {
      failures.push('Scenario-select widget missing data-scenarios attribute.');
      return;
    }
    let scenarios: any[] = [];
    try {
      scenarios = JSON.parse(unesc(scenariosAttr));
    } catch {
      failures.push('Scenario-select widget contains invalid JSON in data-scenarios attribute.');
      return;
    }

    if (!Array.isArray(scenarios) || scenarios.length !== 5) {
      failures.push(`Found ${scenarios.length} scenario card(s) in data-scenarios — expected exactly 5 (1 featured + 4 standard).`);
    }

    const featuredCount = scenarios.filter(s => s.featured).length;
    if (featuredCount !== 1) {
      failures.push(`Found ${featuredCount} featured scenario(s) — expected exactly 1 featured scenario.`);
    }

    const missingTitle = scenarios.filter(s => !s.title || s.title.trim().length === 0);
    if (missingTitle.length > 0) {
      failures.push(`Found ${missingTitle.length} scenario(s) with missing or empty titles.`);
    }
    return;
  }

  // Legacy fallback (should not be reached by current engine output)
  const cards = countClassOccurrences(html, 'scenario-card');
  if (cards !== 5) failures.push(`Found ${cards} scenario card(s) — expected exactly 5 (1 featured + 4 standard).`);

  const featuredCount = (html.match(/\sdata-featured="true"/g) ?? []).length;
  if (featuredCount !== 1) {
    failures.push(`Found ${featuredCount} featured card(s) — expected exactly 1 featured scenario.`);
  }

  const buttons = extractPromptElements(html).filter(el => el.classes.includes('scenario-select-btn'));
  if (buttons.length !== 5) {
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

// ── Settings group / value constants ────────────────────────────────

const VALID_SETTINGS_GROUPS = new Set(['rulebook', 'difficulty', 'pacing', 'visualStyle', 'modules']);

const VALID_SETTINGS_VALUES: Record<string, Set<string>> = {
  rulebook: new Set(['d20_system', 'dnd_5e', 'gurps_lite', 'pf2e_lite', 'shadowrun_lite', 'narrative_engine', 'custom']),
  difficulty: new Set(['easy', 'normal', 'hard', 'brutal']),
  pacing: new Set(['fast', 'normal', 'slow']),
  visualStyle: new Set(['station', 'terminal', 'parchment', 'neon', 'brutalist', 'art-deco', 'ink-wash', 'blueprint', 'stained-glass', 'sveltekit', 'weathered', 'holographic']),
  // modules: intentionally omitted — values are extensible
};

/** Flags any data-group values that are not in the known set of valid settings groups. */
export function checkSettingsGroups(html: string, failures: string[]): void {
  for (const group of extractAttributeValues(html, 'data-group')) {
    if (isJsArtifact(group)) continue;
    if (!VALID_SETTINGS_GROUPS.has(group)) {
      failures.push(
        `Settings contains unknown option group "${group}". Valid groups: rulebook, difficulty, pacing, visualStyle, modules.`,
      );
    }
  }
}

/** Flags data-value attributes whose values are not in the known set for their group. */
export function checkSettingsValues(html: string, failures: string[]): void {
  const invalidsByGroup = new Map<string, string[]>();

  // Pattern 1: both attributes on the same element (tag render output)
  const forward = [...html.matchAll(/data-group="([^"]*)"[^>]*data-value="([^"]*)"/g)];
  const reverse = [...html.matchAll(/data-value="([^"]*)"[^>]*data-group="([^"]*)"/g)]
    .map(m => [m[0], m[2], m[1]] as const);

  const pairs: [group: string, value: string][] = [
    ...forward.map(m => [m[1], m[2]] as [string, string]),
    ...reverse.map(([, group, value]) => [group, value] as [string, string]),
  ];

  // Pattern 2: data-group on container, data-value on children (hand-coded HTML)
  // Match containers with data-group and extract data-value from their inner HTML
  for (const m of html.matchAll(/data-group="([^"]*)"[^>]*>([\s\S]*?)(?=data-group="|$)/g)) {
    const group = m[1]!;
    const inner = m[2]!;
    for (const v of inner.matchAll(/data-value="([^"]*)"/g)) {
      pairs.push([group, v[1]!]);
    }
  }

  // Deduplicate pairs (pattern 1 and 2 may overlap)
  const seen = new Set<string>();
  for (const [group, value] of pairs) {
    if (isJsArtifact(group) || isJsArtifact(value)) continue;
    const key = `${group}::${value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const validSet = VALID_SETTINGS_VALUES[group];
    if (validSet && !validSet.has(value)) {
      if (!invalidsByGroup.has(group)) invalidsByGroup.set(group, []);
      invalidsByGroup.get(group)!.push(value);
    }
  }

  for (const [group, values] of invalidsByGroup) {
    failures.push(
      `Settings group "${group}" contains ${values.length} unrecognised value(s): ${values.join(', ')}. Check valid options in the settings template.`,
    );
  }
}

export function checkRulesWidget(html: string, failures: string[]): void {
  checkShadowRenderOrigin('rules', html, failures);
  checkBrokenSerialisation(html, failures);
  checkCssVariables(html, failures);
  checkInlineOnclick(html, failures);

  // Custom element awareness
  const tagMatch = /<ta-settings\b([^>]*)>/i.exec(html);
  if (tagMatch) {
    const attrStr = tagMatch[1]!;
    const configAttr = extractAttr(attrStr, 'data-config');
    if (!configAttr) {
      failures.push('Settings widget missing data-config attribute.');
      return;
    }
    let config: any = {};
    try {
      config = JSON.parse(unesc(configAttr));
    } catch {
      failures.push('Settings widget contains invalid JSON in data-config attribute.');
      return;
    }

    const required = ['rulebooks', 'visualStyles', 'modules'];
    for (const key of required) {
      if (!config[key] || !Array.isArray(config[key]) || config[key].length === 0) {
        failures.push(`Settings config missing required option group: "${key}".`);
      }
    }
    return;
  }

  // Legacy fallback
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

  checkSettingsGroups(html, failures);
  checkSettingsValues(html, failures);
}

export function checkCharacterWidget(html: string, failures: string[], state?: { modulesActive?: string[]; _loreSource?: string; _lorePregen?: unknown[] } | null): void {
  checkShadowRenderOrigin('character', html, failures);
  checkBrokenSerialisation(html, failures);
  checkCssVariables(html, failures);
  checkInlineOnclick(html, failures);

  // Custom element awareness
  const tagMatch = /<ta-character-creation\b([^>]*)>/i.exec(html);
  if (tagMatch) {
    const attrStr = tagMatch[1]!;
    const configAttr = extractAttr(attrStr, 'data-config');
    
    if (!configAttr) {
      failures.push('Character creation widget missing data-config attribute.');
      return;
    }
    
    let config: any = {};
    try {
      config = JSON.parse(unesc(configAttr));
    } catch {
      failures.push('Character creation widget contains invalid JSON in data-config attribute.');
      return;
    }

    const archetypes = Array.isArray(config.archetypes) ? config.archetypes : [];
    const pregens = Array.isArray(config.preGeneratedCharacters) ? config.preGeneratedCharacters : [];

    const totalCharCards = archetypes.length + pregens.length;
    if (totalCharCards < 2) failures.push(`Found ${totalCharCards} character card(s) (archetype + preset) — expected at least 2.`);

    if (state?.modulesActive?.includes('pre-generated-characters')) {
      if (pregens.length === 0) {
        failures.push('pre-generated-characters module is active but no preset-card elements found (pre-generated-characters in config is empty).');
      }
    }

    if (Array.isArray(state?._lorePregen) && state!._lorePregen.length > 0
        && !state?.modulesActive?.includes('pre-generated-characters')) {
      failures.push(
        `State contains ${state!._lorePregen.length} pre-generated character(s) from _lorePregen but the pre-generated-characters module is not active. `
        + 'Run `tag module activate pre-generated-characters` before rendering the character-creation widget.',
      );
    }
    return;
  }

  // Legacy fallback
  if (extractPromptElements(html).length === 0 && !html.includes('sendPrompt')) {
    failures.push('Character creation widget missing confirm mechanism (data-prompt or sendPrompt handler).');
  }
  if (!/\btype\s*=\s*(['"])text\1/i.test(html) && !/\bcontenteditable(?:\s*=\s*(['"])true\1)?/i.test(html)) {
    failures.push('Character creation widget missing name input field.');
  }

  const archetypeCards = countClassOccurrences(html, 'archetype-card');
  const presetCardsEarly = countClassOccurrences(html, 'preset-card');
  const totalCharCards = archetypeCards + presetCardsEarly;
  if (totalCharCards < 2) failures.push(`Found ${totalCharCards} character card(s) (archetype + preset) — expected at least 2.`);

  const emptyNames = [...html.matchAll(/class\s*=\s*(['"])[^'"]*\barch-name\b[^'"]*\1>\s*<\/div>/gi)].length;
  if (emptyNames > 0) {
    failures.push(`Found ${emptyNames} archetype card(s) with empty names — archetype labels must be visible.`);
  }

  if (!/\bdata-pronouns\s*=/i.test(html)) failures.push('Character creation missing pronoun selector (data-pronouns buttons).');
  if (!/\bdata-prof\s*=/i.test(html)) failures.push('Character creation missing proficiency selector (data-prof buttons).');

  if (state?.modulesActive?.includes('pre-generated-characters')) {
    const presetCards = countClassOccurrences(html, 'preset-card');
    if (presetCards === 0) {
      failures.push('pre-generated-characters module is active but no preset-card elements found — pre-gen characters were not injected.');
    }
  }

  // Lore pipeline check: _lorePregen exists but module not activated
  if (Array.isArray(state?._lorePregen) && state!._lorePregen.length > 0
      && !state?.modulesActive?.includes('pre-generated-characters')) {
    failures.push(
      `State contains ${state!._lorePregen.length} pre-generated character(s) from _lorePregen but the pre-generated-characters module is not active. `
      + 'Run `tag module activate pre-generated-characters` before rendering the character-creation widget.',
    );
  }
}

// ��─ In-game (non-scene) widget checks ────────────────────────────────

export const IN_GAME_WIDGET_MARKERS: Record<string, string[]> = {
  dice: ['ta-dice'],
  'dice-pool': ['ta-dice-pool'],
  dialogue: ['ta-dialogue'],
  levelup: ['ta-levelup'],
  recap: ['ta-recap'],
  'arc-complete': ['ta-arc-complete'],
  'combat-turn': ['ta-combat-turn'],
  ticker: ['ta-ticker'],
  character: ['ta-character'],
  ship: ['ta-ship'],
  crew: ['ta-crew'],
  codex: ['ta-codex'],
  map: ['ta-map'],
  starchart: ['ta-starchart'],
  footer: ['ta-footer'],
  'save-div': ['id="save-data"', 'data-payload='],
};

export function checkInGameWidget(widgetType: string, html: string, failures: string[]): void {
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

  if (widgetType === 'dice' && !html.includes('<ta-dice')) {
    failures.push('Dice widget missing <ta-dice> custom element.');
  }

  if (widgetType === 'arc-complete' && !html.includes('<ta-arc-complete')) {
    failures.push('Arc-complete widget missing <ta-arc-complete> custom element.');
  }
}

// ── Scene-level structural checks ────────────────────────────────────

export function checkSvgViewBox(html: string, failures: string[]): void {
  const svgTags = [...html.matchAll(/<svg\b([^>]*)>/gi)];
  const missing = svgTags.filter(m => {
    const attrs = m[1]!;
    // role="meter" SVGs are fixed-size data indicators (HP pips, XP bars) — viewBox not required
    if (/\brole\s*=\s*(['"])meter\1/i.test(attrs)) return false;
    return !/\bviewBox\s*=/i.test(attrs);
  });
  if (missing.length > 0) {
    failures.push(
      `Verify: [svg-viewbox] ${missing.length} <svg> element${missing.length === 1 ? '' : 's'} missing viewBox attribute. `
      + 'Add viewBox to all SVG elements for correct scaling across display sizes.',
    );
  }
}

export function checkPendingLevelUp(html: string, failures: string[], state: GmState): void {
  if (!state._levelupPending) return;
  const hasLevelUpChoice =
    /\bdata-levelup-stat\s*=/i.test(html) ||
    /\bdata-levelup-skill\s*=/i.test(html);
  if (!hasLevelUpChoice) {
    failures.push(
      'Verify: [pending-level-up] A level-up is pending (_levelupPending is true) but the scene contains no '
      + 'data-levelup-stat or data-levelup-skill choices. Include stat upgrade choices so the player can select their reward.',
    );
  }
}

export function checkScenarioCardMeta(html: string, failures: string[]): void {
  const cardCount = countClassOccurrences(html, 'scenario-card');
  if (cardCount === 0) return;

  const accentCount = (html.match(/--ta-card-accent:/g) ?? []).length;
  const logoCount = (html.match(/class="scenario-logo"/g) ?? []).length;

  if (accentCount < cardCount) {
    const missing = cardCount - accentCount;
    failures.push(
      `Verify: [scenario-missing-accent] ${missing} scenario card${missing === 1 ? '' : 's'} missing --ta-card-accent colour. `
      + "Set accent: '#hexvalue' on each scenario in your --data to give each world a distinct colour identity.",
    );
  }

  if (logoCount < cardCount) {
    const missing = cardCount - logoCount;
    failures.push(
      `Verify: [scenario-missing-logo] ${missing} scenario card${missing === 1 ? '' : 's'} missing an SVG logo. `
      + "Set svgLogo: '<svg>...</svg>' on each scenario in your --data to give each world a distinctive icon.",
    );
  }
}

export function checkTtsComponent(html: string, failures: string[], state: GmState): void {
  if (!state.modulesActive?.includes('audio')) return;
  if (!/<ta-tts\b/i.test(html)) {
    failures.push(
      'Verify: [missing-ta-tts] The audio module is active but the scene contains no <ta-tts> element. '
      + 'Add <ta-tts> to the scene widget to enable text-to-speech narration.',
    );
  }
}
