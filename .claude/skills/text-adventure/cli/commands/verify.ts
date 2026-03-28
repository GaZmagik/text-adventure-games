// tag CLI — Verify Command
// Validates composed scene HTML against current game state before show_widget.
// Writes a .last-verify marker on success; tag state sync requires this marker.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CommandResult, GmState } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState } from '../lib/state-store';
/** Module-to-panel mapping — must stay in sync with scene.ts and footer.ts. */
const MODULE_PANEL_MAP: Record<string, string> = {
  'lore-codex': 'codex',
  'ship-systems': 'ship',
  'crew-manifest': 'crew',
  'star-chart': 'nav',
  'geo-map': 'map',
  'core-systems': 'quests',
};

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

  const passed = failures.length === 0;

  // Write marker on success
  if (passed) {
    writeFileSync(getVerifyMarkerPath(), String(state.scene), 'utf-8');
  }

  return ok({
    verified: passed,
    scene: state.scene,
    failures,
    checks: 8,
    htmlChars: html.length,
    ...(passed
      ? { message: `Scene ${state.scene} verified. All ${8} checks passed. Ready for show_widget.` }
      : { message: `Scene ${state.scene} failed verification: ${failures.length} issue(s). Fix and re-verify before show_widget.` }),
  }, 'verify');
}
