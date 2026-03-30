// Scene widget — full scene skeleton with progressive reveal, panel overlay,
// scene-meta hidden div, and composed footer. This is the main game widget.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { VERSION } from '../../lib/version';
import { renderFooter } from './footer';
import { renderCharacter } from './character';
import { renderCodex } from './codex';
import { renderShip } from './ship';
import { renderCrew } from './crew';
import { renderStarchart } from './starchart';
import { renderMap } from './map';
import { MODULE_PANEL_MAP } from '../../lib/module-panel-map';
import { wrapInShadowDom } from '../lib/shadow-wrapper';
import { CDN_BASE } from '../../../assets/cdn-manifest.ts';
import { renderHpPips } from '../lib/svg-pips';
import { LEVEL_REWARDS } from '../../data/xp-tables';
import { proficiencyBonus } from '../../lib/modifier';

export function renderScene(state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  const char = state?.character;
  const room = state?.currentRoom ?? 'Unknown Location';
  const scene = Number(state?.scene) || 0;
  const time = state?.time;
  const modules = state?.modulesActive ?? [];

  // Build scene-meta JSON
  const sceneMeta = JSON.stringify({
    skill_version: VERSION,
    arc: state?.arc ?? 1,
    theme: state?.theme ?? 'fantasy',
    mode: 'procedural',
    scene,
    type: 'exploration',
    location: room,
    time: time ? {
      period: time.period,
      date: time.date,
      elapsed: time.elapsed,
      hour: time.hour,
    } : null,
    modules_active: modules,
    npcs_present: [],
    threads_advanced: [],
    pending_rolls: [],
  });

  // Build panel-content divs for active modules — pre-populated from state
  const panelDivs = buildPanelDivs(modules, state);

  // Compose the footer (without its own <style> — we include CSS once at the top)
  const footerHtml = renderFooter(state, '', options);

  return wrapInShadowDom({
    styleName,
    inlineCss: `#panel-overlay { display: none; padding: 0; }
.panel-header {
  display: flex; align-items: baseline; justify-content: space-between;
  padding-bottom: 10px; margin-bottom: 12px;
  border-bottom: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4));
}
.panel-title {
  font-family: var(--sta-font-display, system-ui, sans-serif);
  font-size: 18px; font-weight: 600; color: var(--sta-text-primary, #EEF0FF);
}
.panel-close-btn {
  font-family: var(--sta-font-mono, monospace);
  font-size: 11px; letter-spacing: 0.08em;
  background: transparent; border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4));
  border-radius: var(--sta-radius-md, 6px); padding: 8px 14px;
  min-height: 44px; min-width: 44px; box-sizing: border-box;
  color: var(--sta-text-tertiary, #545880); cursor: pointer;
}
.panel-close-btn:hover { border-color: var(--sta-border-secondary, rgba(154,160,192,0.35)); color: var(--sta-text-secondary, #9AA0C0); }
.panel-content { display: none; }
.narrative, .brief-text { font-family: var(--sta-font-serif, Georgia, serif); font-size: var(--sta-text-base, 15px); line-height: 1.7; }
.atmo-strip { display: flex; gap: var(--sta-space-sm, 8px); flex-wrap: wrap; margin-bottom: var(--sta-space-md, 14px); }
.atmo-pill { font-family: var(--sta-font-mono, monospace); font-size: var(--sta-text-xs, 10px); letter-spacing: 0.06em; padding: 3px 10px; border-radius: var(--sta-radius-pill, 999px); border: var(--sta-border-width, 0.5px) solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); color: var(--sta-text-tertiary, #545880); }`,
    html: `<div class="root" data-poi-budget="${char?.poiMax ?? 2}">
  <!-- Progressive reveal -->
  <div id="reveal-brief">
    <p class="brief-text"><!-- [BRIEF: Replace with 1-2 atmospheric sentences that hook the player before they click Continue] --></p>
    <button class="continue-btn" id="continue-reveal-btn">Continue</button>
  </div>
  <div id="reveal-full" style="display:none">
    <div id="scene-content">
      <div class="loc-bar">
        <span class="loc-name">${esc(room)}</span>
        ${time ? `<span class="loc-time">${esc(time.period)} — ${esc(time.date)}</span>` : ''}
      </div>
      <div class="atmo-strip">
        <span class="atmo-pill">The scene unfolds before you...</span>
      </div>
      <div id="narrative" class="narrative">
        <p><!-- Narrative content rendered by the GM --></p>
      </div>
      <!-- [ACTIONS: Insert POI buttons (data-poi, dashed border) and action cards (solid border) here] -->
      <div class="status-bar">
        ${char ? `${renderHpPips(Number(char.hp) || 0, Number(char.maxHp) || 0)}
        <span class="ac-display">AC ${Number(char.ac) || 0}</span>
        <span class="level-display">Lv ${Number(char.level) || 0}</span>` : ''}
      </div>
    </div>
    <div id="panel-overlay" role="dialog" aria-modal="true" aria-labelledby="panel-title-text" style="display:none">
      <div class="panel-header">
        <h2 class="panel-title" id="panel-title-text" tabindex="-1"></h2>
        <button class="panel-close-btn" id="panel-close-btn" aria-label="Close panel">Close</button>
      </div>
      <div class="panel-content" data-panel="character">${renderCharacter(state, '')}</div>
      ${state?._levelupPending ? `<div class="panel-content" data-panel="levelup">${buildLevelupPanel(state)}</div>` : ''}
      ${panelDivs}
    </div>
  </div>
  <!-- Scene metadata (hidden, machine-readable) -->
  <div id="scene-meta" style="display:none" data-meta="${esc(sceneMeta)}"></div>
  <!-- Footer -->
  ${footerHtml}
</div>`,
    scriptSrc: [
      CDN_BASE + '/js/tag-soundscape.js',
      CDN_BASE + '/js/tag-scene.js',
    ],
    script: 'initTagScene(shadow);',
  });
}

/** Panel renderer registry — maps panel name to template function. */
type PanelRenderer = (state: GmState | null, css: string) => string;
const PANEL_RENDERERS: Record<string, PanelRenderer> = {
  codex: renderCodex,
  ship: renderShip,
  crew: renderCrew,
  nav: renderStarchart,
  map: renderMap,
};

/** Build panel-content divs for active modules — pre-populated from state. */
function buildPanelDivs(modules: string[], state: GmState | null): string {
  return modules
    .filter(m => m in MODULE_PANEL_MAP)
    .map(m => {
      const panel = MODULE_PANEL_MAP[m]!;
      const renderer = PANEL_RENDERERS[panel];
      if (renderer) {
        return `<div class="panel-content" data-panel="${panel}">${renderer(state, '')}</div>`;
      }
      if (panel === 'quests') {
        return `<div class="panel-content" data-panel="quests">${renderQuestsPanel(state)}</div>`;
      }
      return `<div class="panel-content" data-panel="${panel}"></div>`;
    })
    .join('\n      ');
}

/** Inline quests panel — no standalone template exists for this panel type. */
function renderQuestsPanel(state: GmState | null): string {
  const quests = state?.quests ?? [];
  if (quests.length === 0) {
    return '<div class="panel-quests"><p class="empty-state">No active quests.</p></div>';
  }
  const rows = quests.map(q => {
    let done = 0;
    for (const o of q.objectives) if (o.completed) done++;
    const total = q.objectives.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const objectives = q.objectives.map(o =>
      `<li style="font-size:11px;color:var(--sta-text-secondary, #9AA0C0);padding:2px 0">`
      + `${o.completed ? '✓' : '○'} ${esc(o.description)}</li>`,
    ).join('');
    return `<div style="padding:10px;margin-bottom:8px;border:0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4));border-radius:6px">`
      + `<div style="display:flex;justify-content:space-between;align-items:center">`
      + `<span style="font-size:13px;font-weight:600;color:var(--sta-text-primary, #EEF0FF)">${esc(q.title)}</span>`
      + `<span style="font-size:10px;color:var(--sta-text-tertiary, #545880)">${pct}%</span></div>`
      + `<ul style="list-style:none;padding:0;margin:4px 0 0">${objectives}</ul></div>`;
  }).join('');
  return `<div class="panel-quests" style="font-family:var(--ta-font-body);padding:16px">`
    + `<div style="font-family:var(--ta-font-heading);font-size:18px;font-weight:700;color:var(--sta-text-primary, #EEF0FF);margin-bottom:12px">Quests</div>`
    + rows + '</div>';
}

/** Build level-up panel content for the panel overlay. */
function buildLevelupPanel(state: GmState | null): string {
  const char = state?.character;
  if (!char) return '<div class="empty-state">No character data.</div>';

  const currentLevel = Number(char.level) || 1;
  const newLevel = currentLevel + 1;
  const reward = LEVEL_REWARDS[newLevel];
  if (!reward) return '<div class="empty-state">Maximum level reached.</div>';

  const oldProf = proficiencyBonus(currentLevel);
  const newProf = proficiencyBonus(newLevel);
  const profChanged = newProf > oldProf;
  const improvement = reward.improvement;

  const hasAbilityChoice = improvement.includes('new ability');
  const hasStatChoice = improvement.includes('+1 attribute');
  const hasProfChoice = improvement.includes('New proficiency');

  const statOptions = hasStatChoice
    ? ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(s =>
      `<button class="ability-card levelup-choice" data-levelup-stat="${s}" aria-pressed="false">${s} (${Number(char.stats[s as keyof typeof char.stats]) || 0} → ${(Number(char.stats[s as keyof typeof char.stats]) || 0) + 1})</button>`).join('\n      ')
    : '';

  return `<div style="font-family:var(--ta-font-body);padding:16px;text-align:center">
  <div style="font-family:var(--ta-font-heading);font-size:22px;font-weight:700;color:var(--ta-color-accent,#4ECDC4);margin-bottom:6px">Level Up!</div>
  <div style="font-size:13px;color:var(--sta-text-secondary,#9AA0C0);margin-bottom:14px">${esc(char.name)} → Level ${newLevel}</div>
  <div style="display:flex;justify-content:center;gap:20px;margin:12px 0">
    <div style="text-align:center"><span style="display:block;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:var(--sta-text-tertiary,#545880)">HP Gain</span><span style="font-size:20px;font-weight:700;color:var(--sta-text-primary,#EEF0FF)">+${reward.hpGain}</span></div>
    <div style="text-align:center"><span style="display:block;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:var(--sta-text-tertiary,#545880)">Prof.</span><span style="font-size:20px;font-weight:700;color:var(--sta-text-primary,#EEF0FF)">+${newProf}</span></div>
  </div>
  ${profChanged ? `<div style="display:inline-block;padding:5px 12px;margin:6px 0;background:var(--ta-color-accent-bg);color:var(--ta-color-accent);border-radius:8px;font-size:11px;font-weight:600">Proficiency bonus: +${oldProf} → +${newProf}</div>` : ''}
  <div style="font-size:11px;color:var(--sta-text-tertiary,#545880);margin:10px 0 6px;text-transform:uppercase;letter-spacing:0.08em">Reward: ${esc(improvement)}</div>
  ${hasStatChoice ? `<div style="margin:8px 0"><div style="font-size:10px;color:var(--sta-text-tertiary,#545880);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px">Choose attribute to increase</div><div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px">${statOptions}</div></div>` : ''}
  ${hasAbilityChoice ? `<div style="margin:8px 0;font-size:11px;color:var(--sta-text-secondary,#9AA0C0)">The GM will offer ability choices after you confirm.</div>` : ''}
  ${hasProfChoice ? `<div style="margin:8px 0;font-size:11px;color:var(--sta-text-secondary,#9AA0C0)">The GM will offer a new proficiency after you confirm.</div>` : ''}
  <button class="confirm-btn" id="levelup-confirm" style="margin-top:14px" data-prompt="Confirm level up to ${newLevel}. HP +${reward.hpGain}.${profChanged ? ` Prof bonus +${oldProf} → +${newProf}.` : ''}" title="Confirm level up">Confirm Level Up</button>
</div>`;
}
