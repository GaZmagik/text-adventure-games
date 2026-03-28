// tag CLI — Verify Command
// Validates composed scene HTML against current game state before show_widget.
// Writes a .last-verify marker on success; tag state sync requires this marker.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CommandResult, GmState } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState } from '../lib/state-store';
import { fnv32 } from '../lib/fnv32';
/** Module-to-panel mapping — must stay in sync with scene.ts and footer.ts. */
const MODULE_PANEL_MAP: Record<string, string> = {
  'lore-codex': 'codex',
  'ship-systems': 'ship',
  'crew-manifest': 'crew',
  'star-chart': 'nav',
  'geo-map': 'map',
  'core-systems': 'quests',
};

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

export function getVerifyMarkerPath(): string {
  const stateDir = process.env.TAG_STATE_DIR || join(process.env.HOME || '~', '.tag');
  return join(stateDir, '.last-verify');
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
  const promptCount = (html.match(/data-prompt="/g) ?? []).length;
  if (promptCount < MIN_ACTION_PROMPTS) {
    failures.push(
      `Found ${promptCount} interactive element(s) with data-prompt — minimum is ${MIN_ACTION_PROMPTS}. `
      + 'Every scene needs at least 2 action cards or POI buttons so the player has choices.',
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

function checkStatusBar(html: string, state: GmState, failures: string[]): void {
  if (state.character) {
    if (!html.includes('hp-display') && !html.includes('status-bar')) {
      failures.push('Missing status bar with HP/AC/Level — required when character exists in state.');
    }
  }
}

export async function handleVerify(args: string[]): Promise<CommandResult> {
  const filePath = args[0];
  if (!filePath) {
    return fail(
      'No file path provided.',
      'Usage: tag verify /tmp/scene_final.html — pass the path to your composed scene HTML.',
      'verify',
    );
  }

  const state = await tryLoadState();
  if (!state) return noState();

  // Read the HTML file
  let html: string;
  try {
    html = readFileSync(filePath, 'utf-8');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return fail(`Failed to read file: ${msg}`, 'Check the file path exists and is readable.', 'verify');
  }

  // Run all checks
  const failures: string[] = [];

  checkFooter(html, state, failures);
  checkSceneMeta(html, failures);
  checkNarrative(html, failures);
  checkCss(html, failures);
  checkAtmosphere(html, state, failures);
  checkActionCards(html, failures);
  checkPanelOverlay(html, failures);
  checkStatusBar(html, state, failures);
  checkInlineOnclick(html, failures);
  checkSendPromptFallback(html, failures);
  checkVisualStyle(state, failures);
  checkHandCodedDice(html, failures);

  const TOTAL_CHECKS = 12;
  const passed = failures.length === 0;

  // Write signed marker on success — hash includes timestamp to prevent forgery via echo
  if (passed) {
    writeFileSync(getVerifyMarkerPath(), signMarker(state.scene), 'utf-8');
  }

  return ok({
    verified: passed,
    scene: state.scene,
    failures,
    checks: TOTAL_CHECKS,
    htmlChars: html.length,
    ...(passed
      ? { message: `Scene ${state.scene} verified. All ${TOTAL_CHECKS} checks passed. Ready for show_widget.` }
      : { message: `Scene ${state.scene} failed verification: ${failures.length} issue(s). Fix and re-verify before show_widget.` }),
  }, 'verify');
}
