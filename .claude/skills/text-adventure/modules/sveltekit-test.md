---
name: SvelteKit Test
description: Experimental pre-compiled SvelteKit die roll widget. Tests whether compiled Svelte components work inside visualize:show_widget iframes. This module does NOT replace the existing die roll system — it is a parallel test.
---

## Purpose

This module provides a pre-compiled Svelte component as raw HTML. A Svelte component compiled for the browser produces zero-dependency vanilla HTML + scoped CSS + efficient vanilla JS — exactly what `visualize:show_widget` needs. This widget demonstrates that pattern in full.

**When to use:** Only when the player explicitly asks to test the SvelteKit die roll approach. Do NOT use in normal gameplay — the standard die roll system (die-rolls.md) remains the production path.

**How to deploy:** Paste the HTML block verbatim into `visualize:show_widget`. Adjust only the `data-*` attributes on the root `<div id="svelte-die-roll">` element to match the current check's parameters.

---

## The Compiled Widget

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Die Roll</title>
<style>
  /* ── Reset ─────────────────────────────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Station colour palette (dark mode default, light override below) */
  :root {
    --s-dr-bg-primary:      #1A1D2E;
    --s-dr-bg-secondary:    #22263A;
    --s-dr-bg-tertiary:     #2A2F47;
    --s-dr-text-primary:    #EEF0FF;
    --s-dr-text-secondary:  #9AA0C0;
    --s-dr-text-tertiary:   #545880;
    --s-dr-text-label:      #6E7298;
    --s-dr-accent:          #4ECDC4;
    --s-dr-accent-bg:       rgba(78, 205, 196, 0.10);
    --s-dr-accent-bg-hover: rgba(78, 205, 196, 0.20);
    --s-dr-border-primary:  rgba(78, 205, 196, 0.6);
    --s-dr-border-secondary:rgba(154, 160, 192, 0.35);
    --s-dr-border-tertiary: rgba(84, 88, 128, 0.4);
    --s-dr-success:         #2BA882;
    --s-dr-success-bg:      rgba(43, 168, 130, 0.10);
    --s-dr-success-text:    #7DDFC3;
    --s-dr-success-border:  #1F8A6A;
    --s-dr-warning:         #F0A500;
    --s-dr-warning-bg:      rgba(240, 165, 0, 0.10);
    --s-dr-warning-text:    #E8C060;
    --s-dr-danger:          #E84855;
    --s-dr-danger-bg:       rgba(232, 72, 85, 0.10);
    --s-dr-danger-text:     #F08090;
    --s-dr-danger-border:   #B33040;
    --s-dr-crit-s-bg:       rgba(43, 168, 130, 0.15);
    --s-dr-crit-f-bg:       rgba(232, 72, 85, 0.15);
    --s-dr-radius-sm:       4px;
    --s-dr-radius-md:       6px;
    --s-dr-radius-pill:     999px;
    --s-dr-font-mono:       'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', 'Courier New', monospace;
    --s-dr-font-display:    'Syne', 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
    --s-dr-spin-dur:        0.6s;
  }

  @media (prefers-color-scheme: light) {
    :root {
      --s-dr-bg-primary:      #F8F9FC;
      --s-dr-bg-secondary:    #EDEEF5;
      --s-dr-bg-tertiary:     #E0E2EF;
      --s-dr-text-primary:    #181B2E;
      --s-dr-text-secondary:  #3A4060;
      --s-dr-text-tertiary:   #7880A8;
      --s-dr-text-label:      #5A5E80;
      --s-dr-accent:          #1A8F87;
      --s-dr-accent-bg:       rgba(26, 143, 135, 0.10);
      --s-dr-accent-bg-hover: rgba(26, 143, 135, 0.20);
      --s-dr-border-primary:  rgba(26, 143, 135, 0.55);
      --s-dr-border-secondary:rgba(58, 64, 96, 0.3);
      --s-dr-border-tertiary: rgba(84, 88, 128, 0.3);
      --s-dr-success:         #1B7A5C;
      --s-dr-success-bg:      rgba(27, 122, 92, 0.08);
      --s-dr-success-text:    #1B7A5C;
      --s-dr-success-border:  #14604A;
      --s-dr-warning:         #9A6200;
      --s-dr-warning-bg:      rgba(154, 98, 0, 0.08);
      --s-dr-warning-text:    #9A6200;
      --s-dr-danger:          #C42030;
      --s-dr-danger-bg:       rgba(196, 32, 48, 0.08);
      --s-dr-danger-text:     #C42030;
      --s-dr-danger-border:   #9A1825;
      --s-dr-crit-s-bg:       rgba(27, 122, 92, 0.12);
      --s-dr-crit-f-bg:       rgba(196, 32, 48, 0.12);
    }
  }

  /* ── Root component ─────────────────────────────────────────────────── */
  .s-dr-root {
    font-family: var(--s-dr-font-mono);
    background: var(--s-dr-bg-primary);
    color: var(--s-dr-text-primary);
    padding: 1.25rem 1rem 1.5rem;
    min-height: 100vh;
  }

  /* ── Narrative block ─────────────────────────────────────────────────── */
  .s-dr-narrative {
    font-size: 13px;
    line-height: 1.7;
    color: var(--s-dr-text-secondary);
    margin-bottom: 1.25rem;
    padding: 12px 14px;
    background: var(--s-dr-bg-secondary);
    border-left: 3px solid var(--s-dr-accent);
    border-radius: 0 var(--s-dr-radius-md) var(--s-dr-radius-md) 0;
    /* Svelte transition:fade compiled output — initial opacity 0, transitions in */
    opacity: 0;
    transition: opacity 0.3s ease-out;
  }
  .s-dr-narrative.s-dr-visible {
    opacity: 1;
  }

  /* ── Check panel ─────────────────────────────────────────────────────── */
  .s-dr-panel {
    background: var(--s-dr-bg-secondary);
    border: 0.5px solid var(--s-dr-border-secondary);
    border-radius: var(--s-dr-radius-md);
    padding: 1.25rem;
    margin-bottom: 14px;
  }

  .s-dr-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .s-dr-check-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--s-dr-accent);
    display: flex;
    align-items: center;
    gap: 8px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  /* Accent bar — compiled from Svelte ::before pseudo-element directive */
  .s-dr-check-title::before {
    content: '';
    width: 3px;
    height: 14px;
    background: var(--s-dr-accent);
    border-radius: 2px;
    flex-shrink: 0;
  }

  .s-dr-check-badge {
    font-size: 11px;
    color: var(--s-dr-text-tertiary);
    background: var(--s-dr-bg-primary);
    padding: 3px 10px;
    border-radius: var(--s-dr-radius-pill);
    border: 0.5px solid var(--s-dr-border-tertiary);
    letter-spacing: 0.05em;
  }

  /* ── Check breakdown row ─────────────────────────────────────────────── */
  .s-dr-breakdown {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
  }

  .s-dr-cb-cell {
    text-align: center;
    padding: 8px 10px;
    background: var(--s-dr-bg-primary);
    border: 0.5px solid var(--s-dr-border-tertiary);
    border-radius: var(--s-dr-radius-md);
    min-width: 72px;
  }

  .s-dr-cb-cell.s-dr-cb-total {
    border-color: var(--s-dr-border-primary);
  }

  .s-dr-cb-label {
    font-size: 9px;
    color: var(--s-dr-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .s-dr-cb-val {
    font-size: 18px;
    font-weight: 500;
    color: var(--s-dr-text-primary);
    margin-top: 3px;
    /* Surgical DOM update target — Svelte marks these elements for reactive updates */
    transition: color 0.2s ease;
  }

  .s-dr-cb-val.s-dr-total-val {
    color: var(--s-dr-accent);
  }

  .s-dr-cb-op {
    font-size: 18px;
    color: var(--s-dr-text-tertiary);
    display: flex;
    align-items: center;
    line-height: 1;
  }

  .s-dr-cb-op.s-dr-eq {
    color: var(--s-dr-accent);
  }

  /* ── Die button ──────────────────────────────────────────────────────── */
  .s-dr-dice-zone {
    text-align: center;
    margin-bottom: 10px;
  }

  /*
   * Svelte-compiled die button.
   * The [class^="die-"] selector from the shared base is replicated here
   * with scoped s-dr- prefix — zero global pollution.
   */
  .s-dr-die-btn {
    --s-dr-die-size: 100px;
    width:  var(--s-dr-die-size);
    height: var(--s-dr-die-size);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 2px;
    cursor: pointer;
    background: transparent;
    border: 1.5px solid var(--s-dr-border-secondary);
    border-radius: 50%;
    color: var(--s-dr-text-secondary);
    position: relative;
    user-select: none;
    transition: background 0.2s, border-color 0.2s, transform 0.2s;
    min-height: 44px;
    min-width: 44px;
  }

  .s-dr-die-btn:hover {
    background: var(--s-dr-bg-tertiary);
    border-color: var(--s-dr-border-primary);
    color: var(--s-dr-text-primary);
    transform: scale(1.05);
  }

  .s-dr-die-btn:active {
    transform: scale(0.95);
  }

  .s-dr-die-btn:focus-visible {
    outline: 2px solid var(--s-dr-accent);
    outline-offset: 3px;
  }

  /* Rolled / locked state */
  .s-dr-die-btn.s-dr-rolled {
    background: var(--s-dr-bg-secondary);
    border-color: var(--s-dr-border-tertiary);
    cursor: default;
    pointer-events: none;
    opacity: 0.55;
    transform: none;
  }

  /* Rolling animation — compiled from Svelte's use:transition directive */
  @keyframes s-dr-d20-roll {
    0%   { transform: rotate(0deg)   scale(1);    }
    20%  { transform: rotate(72deg)  scale(1.15); }
    40%  { transform: rotate(180deg) scale(1.05); }
    60%  { transform: rotate(270deg) scale(1.12); }
    80%  { transform: rotate(340deg) scale(1.02); }
    100% { transform: rotate(360deg) scale(1);    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .s-dr-die-btn.s-dr-rolling {
      animation: s-dr-d20-roll var(--s-dr-spin-dur) ease-in-out;
      pointer-events: none;
    }
  }

  .s-dr-die-label {
    font-family: var(--s-dr-font-mono);
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: inherit;
  }

  .s-dr-die-face {
    font-family: var(--s-dr-font-mono);
    font-size: 26px;
    font-weight: 500;
    color: inherit;
    line-height: 1;
  }

  .s-dr-die-hint {
    font-size: 11px;
    color: var(--s-dr-text-tertiary);
    margin-top: 8px;
    letter-spacing: 0.04em;
    /* Reactive text target — updated surgically by JS state machine */
    transition: color 0.2s ease;
  }

  /* ── Result area ─────────────────────────────────────────────────────── */
  /*
   * Svelte transition:fade + transition:scale compiled output.
   * Hidden via opacity + pointer-events (not display:none) so the
   * transition can animate smoothly — matching Svelte's compiled behaviour.
   */
  .s-dr-result {
    text-align: center;
    margin: 14px 0 10px;
    opacity: 0;
    transform: scale(0.85);
    pointer-events: none;
    transition: opacity 0.35s ease-out, transform 0.35s ease-out;
  }

  .s-dr-result.s-dr-visible {
    opacity: 1;
    transform: scale(1);
    pointer-events: auto;
  }

  .s-dr-result-num {
    font-size: 42px;
    font-weight: 500;
    line-height: 1;
    margin-bottom: 4px;
    /* colour is set surgically by JS state machine based on outcome */
    transition: color 0.2s ease;
  }

  .s-dr-result-dc {
    font-size: 11px;
    color: var(--s-dr-text-tertiary);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  /* ── Outcome badge ────────────────────────────────────────────────────── */
  .s-dr-badge-wrap {
    text-align: center;
    margin-bottom: 14px;
    opacity: 0;
    transition: opacity 0.25s ease-out;
  }

  .s-dr-badge-wrap.s-dr-visible {
    opacity: 1;
  }

  .s-dr-badge {
    display: inline-block;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 5px 16px;
    border-radius: var(--s-dr-radius-md);
    border: 1px solid transparent;
  }

  .s-dr-badge.s-dr-crit-success {
    background: var(--s-dr-crit-s-bg);
    color: var(--s-dr-success-text);
    border-color: var(--s-dr-success-border);
  }
  .s-dr-badge.s-dr-success {
    background: var(--s-dr-success-bg);
    color: var(--s-dr-success-text);
  }
  .s-dr-badge.s-dr-partial {
    background: var(--s-dr-warning-bg);
    color: var(--s-dr-warning-text);
  }
  .s-dr-badge.s-dr-failure {
    background: var(--s-dr-danger-bg);
    color: var(--s-dr-danger-text);
  }
  .s-dr-badge.s-dr-crit-failure {
    background: var(--s-dr-crit-f-bg);
    color: var(--s-dr-danger-text);
    border-color: var(--s-dr-danger-border);
  }

  /* ── Proceed button ──────────────────────────────────────────────────── */
  /*
   * Svelte transition:fly compiled output — slides up from below.
   * Uses opacity + translateY rather than display:none so the
   * entrance animation fires correctly.
   */
  .s-dr-proceed-btn {
    display: block;
    width: 100%;
    margin-top: 8px;
    padding: 12px;
    background: var(--s-dr-accent-bg);
    border: 0.5px solid var(--s-dr-accent);
    border-radius: var(--s-dr-radius-md);
    color: var(--s-dr-text-primary);
    font-family: var(--s-dr-font-mono);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    min-height: 44px;
    opacity: 0;
    transform: translateY(8px);
    pointer-events: none;
    transition: opacity 0.3s ease-out, transform 0.3s ease-out,
                background 0.15s, border-color 0.15s;
  }

  .s-dr-proceed-btn.s-dr-visible {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .s-dr-proceed-btn:hover {
    background: var(--s-dr-accent-bg-hover);
  }

  .s-dr-proceed-btn:focus-visible {
    outline: 2px solid var(--s-dr-accent);
    outline-offset: 2px;
  }

  /* ── Fallback block ──────────────────────────────────────────────────── */
  .s-dr-fallback {
    font-size: 11px;
    color: var(--s-dr-text-tertiary);
    margin-top: 10px;
    padding: 10px 12px;
    background: var(--s-dr-bg-secondary);
    border: 0.5px solid var(--s-dr-border-tertiary);
    border-radius: var(--s-dr-radius-md);
    line-height: 1.6;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease-out;
  }

  .s-dr-fallback.s-dr-visible {
    opacity: 1;
    pointer-events: auto;
  }

  .s-dr-fallback code {
    display: block;
    margin: 6px 0 8px;
    color: var(--s-dr-text-secondary);
    font-family: var(--s-dr-font-mono);
    font-size: 11px;
    word-break: break-word;
  }

  .s-dr-copy-btn {
    font-family: var(--s-dr-font-mono);
    font-size: 10px;
    letter-spacing: 0.06em;
    padding: 4px 10px;
    min-height: 44px;
    min-width: 44px;
    background: transparent;
    border: 0.5px solid var(--s-dr-border-tertiary);
    border-radius: var(--s-dr-radius-md);
    color: var(--s-dr-text-tertiary);
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }

  .s-dr-copy-btn:hover {
    border-color: var(--s-dr-border-secondary);
    color: var(--s-dr-text-secondary);
  }

  .s-dr-copy-btn:focus-visible {
    outline: 2px solid var(--s-dr-accent);
    outline-offset: 2px;
  }

  /* ── Reduced motion ──────────────────────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .s-dr-die-btn.s-dr-rolling {
      animation: none;
    }
    * {
      transition-duration: 0.01ms !important;
    }
  }

  /* ── Screen-reader only utility ──────────────────────────────────────── */
  .s-dr-sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    white-space: nowrap;
    border: 0;
  }
</style>

<!--
  Root element — GM adjusts only these data attributes per check.
  All props flow from here; the compiled component reads them on mount.
-->
<div id="svelte-die-roll"
  data-check-name="Wisdom check — Perception"
  data-attribute="WIS"
  data-modifier="2"
  data-proficiency="2"
  data-proficient="true"
  data-dc="14"
  data-narrative="You let your gaze drift naturally — the way a bored bartender's would — across the amber-lit interior of The Oxidiser.">
</div>

<!-- Live region for screen-reader announcements -->
<div id="s-dr-live" aria-live="polite" aria-atomic="true" class="s-dr-sr-only"></div>

<script>
(function SvelteDieRoll() {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────
  // Mirrors Svelte's reactive $state declarations.
  // 'declare' | 'rolling' | 'resolved' | 'continue'
  let state    = 'declare';
  let rawRoll  = 0;
  let total    = 0;
  let outcome  = '';   // 'crit-success'|'success'|'partial'|'failure'|'crit-failure'

  // ── Props ─────────────────────────────────────────────────────────────
  // Read from data attributes — equivalent to Svelte's export let props.
  const root = document.getElementById('svelte-die-roll');

  const props = {
    checkName:  root.dataset.checkName  || 'Ability Check',
    attribute:  root.dataset.attribute  || 'STR',
    modifier:   parseInt(root.dataset.modifier   || '0', 10),
    proficiency:parseInt(root.dataset.proficiency|| '0', 10),
    proficient: root.dataset.proficient === 'true',
    dc:         parseInt(root.dataset.dc         || '10', 10),
    narrative:  root.dataset.narrative  || '',
  };

  // Effective modifier: attribute mod + proficiency bonus (if proficient)
  const effectiveMod = props.modifier + (props.proficient ? props.proficiency : 0);

  // ── DOM references ────────────────────────────────────────────────────
  // Stored after mount() builds the DOM — equivalent to Svelte's bind:this.
  let elNarrative, elCheckTitle, elCheckBadge,
      elCbRoll, elCbMod, elCbProf, elCbTotal,
      elDieBtn, elDieFace, elDieHint,
      elResultNum, elResultDc, elResult,
      elBadge, elBadgeWrap,
      elProceedBtn, elFallback, elFallbackCode, elCopyBtn,
      elLive;

  // Bound event handler references — stored so destroy() can remove them.
  let _onDieClick, _onProceedClick, _onCopyClick;

  // ── Mount ─────────────────────────────────────────────────────────────
  // Builds the DOM programmatically — replicating Svelte's compiled
  // create_fragment() function. Every element is created, attributed, and
  // appended; no innerHTML is used (XSS-safe, matches Svelte's output).
  function mount() {
    const app = document.createElement('div');
    app.className = 's-dr-root';

    // -- Narrative --
    elNarrative = document.createElement('p');
    elNarrative.className = 's-dr-narrative';
    elNarrative.textContent = props.narrative;
    app.appendChild(elNarrative);

    // -- Check panel --
    const panel = document.createElement('div');
    panel.className = 's-dr-panel';

    // Panel header
    const header = document.createElement('div');
    header.className = 's-dr-panel-header';

    elCheckTitle = document.createElement('div');
    elCheckTitle.className = 's-dr-check-title';
    elCheckTitle.textContent = props.checkName;

    elCheckBadge = document.createElement('div');
    elCheckBadge.className = 's-dr-check-badge';
    elCheckBadge.textContent = props.proficient ? 'Proficient' : 'Not Proficient';

    header.appendChild(elCheckTitle);
    header.appendChild(elCheckBadge);
    panel.appendChild(header);

    // Breakdown row
    const breakdown = document.createElement('div');
    breakdown.className = 's-dr-breakdown';
    breakdown.setAttribute('role', 'group');
    breakdown.setAttribute('aria-label', 'Roll breakdown');

    // Helper: create a cell
    function makeCell(labelText, valueText, extraClass) {
      const cell = document.createElement('div');
      cell.className = 's-dr-cb-cell' + (extraClass ? ' ' + extraClass : '');
      const lbl = document.createElement('div');
      lbl.className = 's-dr-cb-label';
      lbl.textContent = labelText;
      const val = document.createElement('div');
      val.className = 's-dr-cb-val' + (extraClass && extraClass.includes('total') ? ' s-dr-total-val' : '');
      val.textContent = valueText;
      cell.appendChild(lbl);
      cell.appendChild(val);
      return { cell, val };
    }

    // Helper: create an operator glyph
    function makeOp(glyph, isEq) {
      const op = document.createElement('div');
      op.className = 's-dr-cb-op' + (isEq ? ' s-dr-eq' : '');
      op.setAttribute('aria-hidden', 'true');
      op.textContent = glyph;
      return op;
    }

    const rollCell  = makeCell('d20 roll',   '?');
    const modCell   = makeCell(props.attribute + ' mod', formatMod(props.modifier));
    const profCell  = makeCell('Proficiency', props.proficient ? formatMod(props.proficiency) : '—');
    const totalCell = makeCell('Total',       '?', 's-dr-cb-total');

    // Store reactive targets
    elCbRoll  = rollCell.val;
    elCbMod   = modCell.val;
    elCbProf  = profCell.val;
    elCbTotal = totalCell.val;

    breakdown.appendChild(rollCell.cell);
    breakdown.appendChild(makeOp('+'));
    breakdown.appendChild(modCell.cell);
    breakdown.appendChild(makeOp('+'));
    breakdown.appendChild(profCell.cell);
    breakdown.appendChild(makeOp('=', true));
    breakdown.appendChild(totalCell.cell);
    panel.appendChild(breakdown);

    // Die zone
    const diceZone = document.createElement('div');
    diceZone.className = 's-dr-dice-zone';

    elDieBtn = document.createElement('button');
    elDieBtn.className = 's-dr-die-btn';
    elDieBtn.setAttribute('type', 'button');
    elDieBtn.setAttribute('aria-label', 'Roll the d20 for ' + props.checkName);

    const dieLabel = document.createElement('span');
    dieLabel.className = 's-dr-die-label';
    dieLabel.setAttribute('aria-hidden', 'true');
    dieLabel.textContent = 'd20';

    elDieFace = document.createElement('span');
    elDieFace.className = 's-dr-die-face';
    elDieFace.setAttribute('aria-hidden', 'true');
    elDieFace.textContent = '?';

    elDieBtn.appendChild(dieLabel);
    elDieBtn.appendChild(elDieFace);

    elDieHint = document.createElement('div');
    elDieHint.className = 's-dr-die-hint';
    elDieHint.textContent = 'Click to roll';

    diceZone.appendChild(elDieBtn);
    diceZone.appendChild(elDieHint);
    panel.appendChild(diceZone);

    // Result area
    elResult = document.createElement('div');
    elResult.className = 's-dr-result';
    elResult.setAttribute('aria-live', 'polite');

    elResultNum = document.createElement('div');
    elResultNum.className = 's-dr-result-num';

    elResultDc = document.createElement('div');
    elResultDc.className = 's-dr-result-dc';
    elResultDc.textContent = 'DC ' + props.dc;

    elResult.appendChild(elResultNum);
    elResult.appendChild(elResultDc);
    panel.appendChild(elResult);

    app.appendChild(panel);

    // Outcome badge (outside panel — full-width reveal feels better)
    elBadgeWrap = document.createElement('div');
    elBadgeWrap.className = 's-dr-badge-wrap';

    elBadge = document.createElement('span');
    elBadge.className = 's-dr-badge';

    elBadgeWrap.appendChild(elBadge);
    app.appendChild(elBadgeWrap);

    // Proceed button
    elProceedBtn = document.createElement('button');
    elProceedBtn.className = 's-dr-proceed-btn';
    elProceedBtn.setAttribute('type', 'button');
    elProceedBtn.textContent = 'Continue ↗';
    app.appendChild(elProceedBtn);

    // Fallback block
    elFallback = document.createElement('div');
    elFallback.className = 's-dr-fallback';
    elFallback.setAttribute('role', 'status');

    const fallbackLabel = document.createElement('span');
    fallbackLabel.textContent = 'If the button above did not work, copy this prompt and paste it into the chat:';

    elFallbackCode = document.createElement('code');

    elCopyBtn = document.createElement('button');
    elCopyBtn.className = 's-dr-copy-btn';
    elCopyBtn.setAttribute('type', 'button');
    elCopyBtn.textContent = 'Copy';

    elFallback.appendChild(fallbackLabel);
    elFallback.appendChild(elFallbackCode);
    elFallback.appendChild(elCopyBtn);
    app.appendChild(elFallback);

    // Live region reference
    elLive = document.getElementById('s-dr-live');

    // Mount into root element
    root.appendChild(app);

    // Wire event listeners — stored for cleanup
    _onDieClick    = onDieClick;
    _onProceedClick = onProceedClick;
    _onCopyClick   = onCopyClick;

    elDieBtn.addEventListener('click',    _onDieClick);
    elProceedBtn.addEventListener('click', _onProceedClick);
    elCopyBtn.addEventListener('click',   _onCopyClick);

    // Kick off initial state
    transition('declare');
  }

  // ── State machine ─────────────────────────────────────────────────────
  // Mirrors Svelte's reactive $derived and $effect blocks.
  // Each transition makes surgical DOM updates — never innerHTML replacement.
  function transition(newState) {
    state = newState;

    if (state === 'declare') {
      // Animate narrative in (Svelte transition:fade)
      requestAnimationFrame(function() {
        elNarrative.classList.add('s-dr-visible');
      });
    }

    if (state === 'rolling') {
      elDieBtn.classList.add('s-dr-rolling');
      elDieHint.textContent = 'Rolling…';
    }

    if (state === 'resolved') {
      elDieBtn.classList.remove('s-dr-rolling');
      elDieBtn.classList.add('s-dr-rolled');
      elDieFace.textContent = String(rawRoll);
      elDieHint.textContent = 'Roll locked in';

      // Populate breakdown cells — surgical textContent updates
      elCbRoll.textContent  = String(rawRoll);
      elCbMod.textContent   = formatMod(props.modifier);
      elCbProf.textContent  = props.proficient ? formatMod(props.proficiency) : '—';
      elCbTotal.textContent = String(total);

      // Result number with colour coding
      elResultNum.textContent  = String(total);
      elResultNum.style.color  = outcomeColour(outcome);
      elResult.classList.add('s-dr-visible');

      // Outcome badge
      elBadge.className   = 's-dr-badge ' + badgeClass(outcome);
      elBadge.textContent = outcomeLabel(outcome);
      elBadgeWrap.classList.add('s-dr-visible');

      // Announce to screen readers
      if (elLive) {
        elLive.textContent = 'Rolled ' + rawRoll + ', total ' + total
          + ' against DC ' + props.dc + '. ' + outcomeLabel(outcome) + '.';
      }
    }

    if (state === 'continue') {
      // Build sendPrompt text
      const promptText = buildPrompt();
      elFallbackCode.textContent = promptText;
      elProceedBtn.dataset.prompt = promptText;

      // Reveal proceed button (Svelte transition:fly compiled)
      const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350;
      setTimeout(function() {
        elProceedBtn.classList.add('s-dr-visible');
      }, delay);
    }
  }

  // ── Roll logic ────────────────────────────────────────────────────────
  function onDieClick() {
    if (state !== 'declare') return;
    transition('rolling');

    let flicks = 0;
    const maxFlicks = 14;
    const flickInterval = setInterval(function() {
      elDieFace.textContent = String(Math.floor(Math.random() * 20) + 1);
      flicks++;

      if (flicks >= maxFlicks) {
        clearInterval(flickInterval);

        // Land on final value
        rawRoll = Math.floor(Math.random() * 20) + 1;
        total   = rawRoll + effectiveMod;
        outcome = calcOutcome(rawRoll, total, props.dc);

        transition('resolved');

        // Proceed CTA appears after result has settled
        setTimeout(function() {
          transition('continue');
        }, 600);
      }
    }, 50);
  }

  // ── Continue ──────────────────────────────────────────────────────────
  function onProceedClick() {
    const prompt = elProceedBtn.dataset.prompt || buildPrompt();
    if (typeof sendPrompt === 'function') {
      sendPrompt(prompt);
    } else {
      // sendPrompt unavailable — reveal manual fallback
      elFallback.classList.add('s-dr-visible');
    }
  }

  // ── Copy fallback ─────────────────────────────────────────────────────
  function onCopyClick() {
    const text = elFallbackCode.textContent;
    if (navigator.clipboard && text) {
      navigator.clipboard.writeText(text).then(function() {
        elCopyBtn.textContent = 'Copied!';
        setTimeout(function() { elCopyBtn.textContent = 'Copy'; }, 2000);
      });
    }
  }

  // ── Outcome calculation ───────────────────────────────────────────────
  function calcOutcome(raw, tot, dc) {
    if (raw === 20)          return 'crit-success';
    if (raw === 1)           return 'crit-failure';
    if (tot >= dc + 5)       return 'success';
    if (tot >= dc)           return (tot - dc <= 1) ? 'partial' : 'success';
    if (dc - tot <= 3)       return 'partial';
    return 'failure';
  }

  function outcomeLabel(o) {
    return {
      'crit-success': 'Critical Success',
      'success':      'Success',
      'partial':      'Partial Success',
      'failure':      'Failure',
      'crit-failure': 'Critical Failure',
    }[o] || 'Unknown';
  }

  function outcomeColour(o) {
    const map = {
      'crit-success': 'var(--s-dr-success)',
      'success':      'var(--s-dr-success)',
      'partial':      'var(--s-dr-warning)',
      'failure':      'var(--s-dr-danger)',
      'crit-failure': 'var(--s-dr-danger)',
    };
    return map[o] || 'var(--s-dr-text-primary)';
  }

  function badgeClass(o) {
    return {
      'crit-success': 's-dr-crit-success',
      'success':      's-dr-success',
      'partial':      's-dr-partial',
      'failure':      's-dr-failure',
      'crit-failure': 's-dr-crit-failure',
    }[o] || '';
  }

  // ── Prompt builder ────────────────────────────────────────────────────
  function buildPrompt() {
    const profPart = props.proficient
      ? ', proficiency bonus +' + props.proficiency
      : '';
    return 'I rolled a natural ' + rawRoll + ' on the d20'
      + ', plus ' + props.attribute + ' modifier ' + formatMod(props.modifier)
      + profPart
      + ', for a total of ' + total
      + ' against DC ' + props.dc
      + '. ' + outcomeLabel(outcome) + '. Continue.';
  }

  // ── Utilities ─────────────────────────────────────────────────────────
  function formatMod(n) {
    return (n >= 0 ? '+' : '') + n;
  }

  // ── Cleanup ───────────────────────────────────────────────────────────
  // Mirrors Svelte's onDestroy lifecycle hook — removes all event listeners
  // to prevent memory leaks in long-lived iframe contexts.
  function destroy() {
    if (elDieBtn     && _onDieClick)    elDieBtn.removeEventListener('click',    _onDieClick);
    if (elProceedBtn && _onProceedClick) elProceedBtn.removeEventListener('click', _onProceedClick);
    if (elCopyBtn    && _onCopyClick)   elCopyBtn.removeEventListener('click',   _onCopyClick);
  }

  // ── Auto-mount ────────────────────────────────────────────────────────
  // Equivalent to Svelte's new Component({ target }) call.
  // Expose destroy on root for external teardown if needed.
  mount();
  root._svelteDestroy = destroy;

})();
</script>
</html>
```

---

## Usage

When the player asks to test the SvelteKit die roll, render the HTML block above verbatim inside `visualize:show_widget`. The only changes needed are the `data-*` attributes on the root element:

| Attribute | Type | Description |
|---|---|---|
| `data-check-name` | string | Display name, e.g. `"Strength check — Athletics"` |
| `data-attribute` | string | Stat abbreviation, e.g. `"STR"`, `"DEX"`, `"WIS"` |
| `data-modifier` | integer | Attribute modifier, e.g. `"2"` or `"-1"` |
| `data-proficiency` | integer | Proficiency bonus, e.g. `"2"` |
| `data-proficient` | boolean string | `"true"` or `"false"` |
| `data-dc` | integer | Difficulty class, e.g. `"14"` |
| `data-narrative` | string | Flavour text for the check context |

The widget is fully self-contained — it reads its own props, manages its own state machine, and handles `sendPrompt` with a manual copy-paste fallback.

---

## Comparison with the Current Die Roll System

| | Current system | This SvelteKit test |
|---|---|---|
| **How it works** | GM generates the full HTML widget from scratch each time, following patterns in style-reference.md | GM pastes this pre-compiled widget and adjusts only the `data-*` attributes |
| **CSS** | Generated inline per widget; small variations are possible | Fixed scoped styles with `s-dr-` prefix; zero generation errors |
| **JS** | Written fresh per widget by the GM; logic may drift | Single compiled IIFE; deterministic behaviour across every check |
| **Prompt footprint** | High — full HTML + CSS + JS in every roll prompt | Low — one-liner data attribute changes only |
| **Flexibility** | Fully customisable per widget | Fixed structure; layout cannot be changed without editing this module |
| **Svelte patterns demonstrated** | n/a | Scoped CSS, surgical DOM updates, component mount/destroy, transition directives |

The current system remains the production path. This module exists solely to validate whether pre-compiled Svelte output is viable as a drop-in widget strategy before committing to a full SvelteKit build pipeline.
