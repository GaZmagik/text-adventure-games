// Scenario selection — accepts --data JSON with scenario list.
// Renders hero, control deck (selected scenario), and card grid.
// Each card has per-card select button that fires sendPrompt (verify-safe).

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { COMMON_WIDGET_CSS } from '../lib/common-css';
import { PREGAME_DESIGN_CSS, renderHero, renderControlDeck } from '../lib/pregame-design';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

// ── Data types ─────────────────────────────────────────────────────

type Scenario = {
  id?: string;
  title: string;
  description?: string;
  hook?: string;           // Alias for description
  preamble?: string;       // Alias for description (prototype convention)
  genre?: string[];
  genres?: string[];       // Alias for genre
  tags?: string[];         // Alias for genres
  difficulty?: string;
  players?: string;
  featured?: boolean;
  accent?: string;         // Hex colour e.g. '#78e4ff'
  modules?: string;
  coverFront?: string;     // CDN URL for front cover image
  coverBack?: string;      // CDN URL for back cover image
};

// ── Helpers ────────────────────────────────────────────────────────

function descOf(s: Scenario): string {
  return s.description ?? s.hook ?? s.preamble ?? '';
}

function genresOf(s: Scenario): string[] {
  const raw = s.genres ?? s.genre ?? s.tags ?? [];
  return Array.isArray(raw) ? raw : [raw];
}

function hexToRgb(hex: string): string | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return `${r}, ${g}, ${b}`;
}

function defaultSelectedIdx(scenarios: Scenario[]): number {
  const featIdx = scenarios.findIndex(s => s.featured);
  return featIdx >= 0 ? featIdx : 0;
}

// ── Card renderer ──────────────────────────────────────────────────

function renderCard(scenario: Scenario, idx: number, isSelected: boolean): string {
  const desc = descOf(scenario);
  const genres = genresOf(scenario);
  const genrePills = genres.map(g =>
    `<span class="genre-pill">${esc(g)}</span>`,
  ).join(' ');

  const idAttr = scenario.id ? ` data-scenario-id="${esc(scenario.id)}"` : '';
  const featAttr = scenario.featured ? ' data-featured="true"' : '';
  const accentRgb = scenario.accent ? hexToRgb(scenario.accent) : null;
  const hasBothCovers = !!(scenario.coverFront && scenario.coverBack);
  const coverAttr = scenario.coverFront ? ' data-has-cover="true"' : '';
  const prompt = `I choose scenario: ${scenario.title}`;

  // Featured card with both covers: full book-spread layout
  if (hasBothCovers) {
    const accentStyle = accentRgb ? ` style="--card-accent-rgb: ${accentRgb}"` : '';
    return `
      <div class="scenario-card"${idAttr}${featAttr}${coverAttr}${accentStyle} aria-pressed="${isSelected}" data-desc="${esc(desc)}" data-idx="${idx}">
        <div class="cover-spread">
          <img class="cover-front" src="${esc(scenario.coverFront!)}" alt="${esc(scenario.title)} — front cover" loading="lazy">
          <img class="cover-back" src="${esc(scenario.coverBack!)}" alt="${esc(scenario.title)} — back cover" loading="lazy">
        </div>
        <div class="scenario-card-content">
          <div class="scenario-title">${esc(scenario.title)}</div>
          ${genrePills ? `<div class="scenario-genres">${genrePills}</div>` : ''}
          <div class="scenario-meta">
            ${scenario.difficulty ? `<span class="scenario-diff">Difficulty: ${esc(scenario.difficulty)}</span>` : ''}
            ${scenario.players ? `<span class="scenario-players">${esc(scenario.players)} players</span>` : ''}
          </div>
          <button class="scenario-select-btn" data-prompt="${esc(prompt)}" title="${esc(prompt)}">Select</button>
        </div>
      </div>`;
  }

  // Standard card (optional front-cover-only background)
  const coverStyle = scenario.coverFront
    ? `background-image: linear-gradient(to top, rgba(10,10,18,0.95) 35%, rgba(10,10,18,0.4) 70%, transparent 100%), url(${esc(scenario.coverFront)});`
    : '';
  const cardStyle = [
    accentRgb ? `--card-accent-rgb: ${accentRgb}` : '',
    coverStyle ? coverStyle + ' background-size: cover; background-position: center top' : '',
  ].filter(Boolean).join('; ');
  const styleAttr = cardStyle ? ` style="${cardStyle}"` : '';

  return `
      <div class="scenario-card"${idAttr}${featAttr}${coverAttr}${styleAttr} aria-pressed="${isSelected}" data-desc="${esc(desc)}" data-idx="${idx}">
        <div class="scenario-card-content">
          <div class="scenario-title">${esc(scenario.title)}</div>
          <div class="scenario-desc">${esc(desc)}</div>
          ${genrePills ? `<div class="scenario-genres">${genrePills}</div>` : ''}
          <div class="scenario-meta">
            ${scenario.difficulty ? `<span class="scenario-diff">Difficulty: ${esc(scenario.difficulty)}</span>` : ''}
            ${scenario.players ? `<span class="scenario-players">${esc(scenario.players)} players</span>` : ''}
          </div>
          <button class="scenario-select-btn" data-prompt="${esc(prompt)}" title="${esc(prompt)}">Select</button>
        </div>
      </div>`;
}

// ── Main export ────────────────────────────────────────────────────

export function renderScenarioSelect(_state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  const raw = (options?.data ?? {}) as Record<string, unknown>;
  const scenarios: Scenario[] = Array.isArray(raw.scenarios) ? raw.scenarios as Scenario[] : [];

  // Empty state — no hero or control deck
  if (scenarios.length === 0) {
    return wrapInShadowDom({
      styleName,
      inlineCss: `${COMMON_WIDGET_CSS}\n${SCENARIO_CSS}`,
      html: `<div class="widget-scenario-select">
  <div class="widget-title">Choose Your Scenario</div>
  <div class="widget-subtitle">Select an adventure to begin</div>
  <div class="empty-scenarios">
  <p>No scenarios provided. Use the --data flag:</p>
  <pre style="text-align:left;font-size:11px;color:var(--sta-text-secondary, #9AA0C0);margin-top:12px;white-space:pre-wrap;word-break:break-word;">tag render scenario-select --style station --data '${esc(JSON.stringify({scenarios:[{title:"Cold Freight",hook:"Your section of the generation ship has been sealed off.",genres:["survival","mystery"],difficulty:"normal"},{title:"The Grit Anvil",hook:"The drill hit something that is not rock.",genres:["horror","blue-collar"],difficulty:"normal"}]}, null, 2))}'</pre>
  <p style="margin-top:8px;font-size:11px;">Fields: title (required), hook or description, genres or genre, difficulty, tags, modules</p>
</div>
</div>`,
      script: '',
    });
  }

  const selIdx = defaultSelectedIdx(scenarios);
  const selScenario = scenarios[selIdx]!;

  const heroHtml = renderHero({
    heading: 'Choose Your Scenario',
    copy: 'Select an adventure to begin. Each scenario offers a different tone, premise, and set of branching choices.',
  });

  const deckHtml = renderControlDeck({
    kicker: 'Current selection',
    heading: 'Scenario',
    selectedTitle: selScenario.title,
    selectedPreamble: descOf(selScenario) || undefined,
    statusId: 'pd-sel-status',
    actionHtml: '',
  });

  const cards = scenarios.map((s, i) => renderCard(s, i, i === selIdx)).join('\n');

  return wrapInShadowDom({
    styleName,
    inlineCss: `${COMMON_WIDGET_CSS}\n${PREGAME_DESIGN_CSS}\n${SCENARIO_CSS}`,
    html: `<div class="widget-scenario-select">
  ${heroHtml}
  ${deckHtml}

  <div class="scenario-grid">
    ${cards}
  </div>
</div>`,
    script: SCENARIO_SCRIPT,
  });
}

// ── CSS ────────────────────────────────────────────────────────────

const SCENARIO_CSS = `
.widget-scenario-select { font-family: var(--ta-font-body); padding: 16px; }
.scenario-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.scenario-card {
  padding: 16px; border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4));
  border-radius: 8px; transition: border-color 0.2s, box-shadow 0.2s;
  cursor: pointer; position: relative;
}
.scenario-card:hover { border-color: var(--ta-color-accent); }
.scenario-card[data-featured="true"] {
  grid-column: span 2;
  border-color: var(--ta-color-accent, #4ECDC4);
}
.cover-spread {
  display: flex; gap: 12px; justify-content: center; padding: 12px 12px 0;
}
.cover-spread img {
  width: 50%; max-height: 380px; object-fit: contain; border-radius: 6px;
}
.scenario-card[data-has-cover="true"] {
  border-radius: 12px; overflow: hidden;
  border-color: rgba(84,88,128,0.2);
}
.scenario-card[data-has-cover="true"] .scenario-card-content {
  width: 100%;
}
.scenario-card[data-has-cover="true"] .scenario-title {
  font-size: 22px;
}
.scenario-card[data-has-cover="true"] .genre-pill {
  background: rgba(255,255,255,0.08);
  border: 0.5px solid rgba(255,255,255,0.15);
  color: var(--sta-text-secondary, #9AA0C0);
}
.scenario-card[aria-pressed="true"] {
  border-color: var(--ta-color-accent, #4ECDC4);
  box-shadow: 0 0 0 1px var(--ta-color-accent, #4ECDC4) inset;
}
.scenario-title { font-family: var(--ta-font-heading); font-size: 16px; font-weight: 700; color: var(--sta-text-primary, #EEF0FF); margin-bottom: 6px; }
.scenario-desc { font-size: 12px; line-height: 1.5; color: var(--sta-text-secondary, #9AA0C0); margin-bottom: 10px; }
.scenario-genres { margin-bottom: 8px; }
.genre-pill {
  display: inline-block; padding: 2px 8px; font-size: 10px;
  border-radius: 10px; background: var(--ta-color-accent-bg);
  color: var(--ta-color-accent); margin-right: 4px; text-transform: capitalize;
}
.scenario-meta { font-size: 10px; color: var(--sta-text-tertiary, #545880); margin-bottom: 10px; }
.scenario-meta span { margin-right: 12px; }
.scenario-diff { text-transform: capitalize; }
.scenario-select-btn {
  display: block; width: 100%; padding: 8px;
  font-family: var(--ta-font-body); font-size: 12px; font-weight: 600;
  background: transparent; border: 0.5px solid var(--ta-color-accent);
  border-radius: 6px; color: var(--ta-color-accent); cursor: pointer;
  text-transform: uppercase; letter-spacing: 0.08em; transition: all 0.2s;
  min-height: 44px; box-sizing: border-box;
}
.scenario-select-btn:hover { background: var(--ta-color-accent); color: var(--ta-btn-primary-text, #fff); }
.scenario-select-btn:focus-visible { outline: 2px solid var(--ta-color-focus); outline-offset: 2px; }
.empty-scenarios { font-size: 13px; color: var(--sta-text-tertiary, #545880); text-align: center; padding: 40px; }
@media (prefers-reduced-motion: reduce) {
  .scenario-card, .scenario-select-btn { transition: none; }
}`;

// ── Script ─────────────────────────────────────────────────────────

const SCENARIO_SCRIPT = `function sendOrCopyPrompt(btn, prompt) {
  btn.setAttribute('title', prompt);
  if (typeof sendPrompt === 'function') {
    sendPrompt(prompt);
  } else {
    var ta = document.createElement('textarea');
    var copied = false;
    ta.value = prompt;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try {
      copied = !!document.execCommand('copy');
    } catch (_err) {
      copied = false;
    }
    document.body.removeChild(ta);
    var orig = btn.textContent;
    btn.textContent = copied ? 'Copied! Paste as your reply.' : 'Copy the prompt from the tooltip.';
    setTimeout(function() { btn.textContent = orig; }, 3000);
  }
}

shadow.querySelectorAll('.scenario-select-btn[data-prompt]').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    var prompt = this.getAttribute('data-prompt');
    sendOrCopyPrompt(this, prompt);
  });
});

shadow.querySelectorAll('.scenario-card').forEach(function(card) {
  card.addEventListener('click', function() {
    shadow.querySelectorAll('.scenario-card').forEach(function(c) {
      c.setAttribute('aria-pressed', 'false');
    });
    this.setAttribute('aria-pressed', 'true');

    var title = this.querySelector('.scenario-title');
    var desc = this.getAttribute('data-desc') || '';
    var selTitle = shadow.getElementById('pd-sel-title');
    var selPreamble = shadow.getElementById('pd-sel-preamble');
    var selStatus = shadow.getElementById('pd-sel-status');

    if (selTitle && title) selTitle.textContent = title.textContent;
    if (selPreamble) selPreamble.textContent = desc;
    if (selStatus) selStatus.textContent = 'Scenario selected: ' + (title ? title.textContent : '');
  });
});`;
