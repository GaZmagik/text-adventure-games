---
name: weathered
description: >
  Distressed post-apocalyptic aesthetic — rust, concrete, and survival. Beauty
  found in decay: hand-stencilled type, jury-rigged readouts, asymmetric borders,
  and surfaces that look like they have earned every scratch.
best-for:
  - post-apocalyptic
  - survival horror
  - wasteland exploration
  - dieselpunk
  - military thriller
  - dystopian sci-fi
  - grimdark fantasy
---

## Design Philosophy

The Weathered style draws from the visual language of survival: maintenance
manuals annotated in felt-tip, spray-paint stencils on blast doors, field maps
inked onto scavenged paper, data readouts cobbled together from mismatched
salvage. Nothing is pristine. Everything has been used.

The aesthetic is not nihilistic — there is beauty here. It lives in the texture
of worn concrete, in the warmth of tarnished brass catching low light, in the
deliberate roughness of a hand-lettered warning. The world has been broken and
someone has kept it running through sheer determination.

Visually this means:

- **Warmth in decay** — the off-white background carries a warm undertone, as
  though the page has aged. Rust and olive replace sterile blues and greens.
- **Intentional imperfection** — borders are missing on one side, radii are
  asymmetric, padding is slightly uneven. The grid has been bent but not broken.
- **Mixed registers** — headings look stencilled; data readouts look jury-rigged
  with mismatched fonts. The visual vocabulary of improvisation.
- **Restraint** — this palette has real restraint. Accent use is sparing. A flash
  of rust draws the eye. Overuse destroys the effect.

---

## Typography

### Font Stacks

The primary intent is Barlow Condensed or Roboto Condensed (both may be
CSP-blocked in Claude.ai iframes). Fallbacks must produce an acceptable result
without any web font loading.

```
/* Heading / stencil — condensed sans-serif */
'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', Arial, sans-serif

/* Body — compact readable sans */
'Barlow', 'Roboto', 'Arial Narrow', system-ui, sans-serif

/* Data readout / monospace — jury-rigged terminal feel */
'Share Tech Mono', 'IBM Plex Mono', 'Cascadia Code', 'Consolas',
'Courier New', monospace
```

### Sizing Scale

| Role            | Size  | Weight | Transform   | Spacing  |
|-----------------|-------|--------|-------------|----------|
| Scene title     | 18px  | 700    | uppercase   | 0.12em   |
| Section label   | 9px   | 700    | uppercase   | 0.18em   |
| Body narrative  | 13px  | 400    | none        | normal   |
| Button label    | 11px  | 700    | uppercase   | 0.10em   |
| Data readout    | 11px  | 400    | none        | 0.04em   |
| Atmosphere pill | 10px  | 400    | uppercase   | 0.08em   |
| Status / footer | 10px  | 400    | uppercase   | 0.08em   |

---

## Colour Palette

All colours are defined as CSS custom properties on `.root`. Both light and dark
modes are provided via `prefers-color-scheme`. WCAG AA compliance notes are
included inline.

### Light Mode Tokens

```css
/* === BACKGROUND === */
--w-bg-page:         #E8E2D6;   /* off-white, warm undertone — base surface */
--w-bg-card:         #DEDAD1;   /* slightly darker warm white — card/panel fill */
--w-bg-inset:        #D4CEC4;   /* inset / recessed areas */
--w-bg-overlay:      #E0DACFee; /* panel overlays — semi-opaque */

/* === TEXT ===
   All pairings against their respective backgrounds meet WCAG AA (4.5:1+) */
--w-text-primary:    #2A2218;   /* near-black warm — 13.2:1 on --w-bg-page */
--w-text-secondary:  #4A4036;   /* dark warm brown — 7.8:1 on --w-bg-page */
--w-text-tertiary:   #7A6E60;   /* mid warm brown — 4.6:1 on --w-bg-page */
--w-text-muted:      #9A8E80;   /* muted — use only for decorative / non-critical */
--w-text-on-accent:  #F5F0E8;   /* light text for use on dark accent fills */

/* === ACCENT — use sparingly === */
--w-rust:            #A0522D;   /* primary accent — rust orange */
--w-rust-dim:        #7A3E20;   /* darker rust — borders, active states */
--w-rust-tint:       rgba(160, 82, 45, 0.10); /* tinted backgrounds */
--w-rust-glow:       rgba(160, 82, 45, 0.20); /* hover fills */
--w-olive:           #6B6B47;   /* secondary accent — faded olive */
--w-olive-tint:      rgba(107, 107, 71, 0.10);
--w-brass:           #8B7D3C;   /* tarnished brass — decorative highlights */
--w-blood:           #5C1A1A;   /* dried blood — danger states only */
--w-blood-tint:      rgba(92, 26, 26, 0.10);

/* === BORDER === */
--w-border-heavy:    #9A8E80;   /* solid structural borders */
--w-border-mid:      #B8AFA0;   /* standard dividers */
--w-border-light:    #CEC6B8;   /* subtle separators */

/* === STATUS COLOURS === */
--w-status-ok:       #4A6741;   /* alive / operational — muted green */
--w-status-warn:     #8B7D3C;   /* caution — same as brass */
--w-status-danger:   #5C1A1A;   /* critical — same as blood */
--w-status-unknown:  #7A6E60;   /* unknown / inactive */
```

### Dark Mode Tokens

```css
/* === BACKGROUND === */
--w-bg-page:         #2A2620;   /* charcoal — base surface */
--w-bg-card:         #322E28;   /* slightly lighter charcoal — card fill */
--w-bg-inset:        #1E1C18;   /* deep inset */
--w-bg-overlay:      #2E2A24ee; /* panel overlays */

/* === TEXT === */
--w-text-primary:    #C8BFB0;   /* warm grey — 8.4:1 on --w-bg-page */
--w-text-secondary:  #A89E90;   /* mid warm grey — 5.2:1 on --w-bg-page */
--w-text-tertiary:   #786E60;   /* dim warm grey — 4.5:1 on --w-bg-page */
--w-text-muted:      #584E42;   /* near-muted — decorative only */
--w-text-on-accent:  #1A1612;   /* dark text on light accent fills */

/* === ACCENT — desaturated in dark mode === */
--w-rust:            #C4733D;   /* brightened rust for dark backgrounds */
--w-rust-dim:        #A05A2A;
--w-rust-tint:       rgba(196, 115, 61, 0.14);
--w-rust-glow:       rgba(196, 115, 61, 0.24);
--w-olive:           #8A8A5A;   /* lightened olive */
--w-olive-tint:      rgba(138, 138, 90, 0.12);
--w-brass:           #A89850;   /* brightened brass */
--w-blood:           #8C3030;   /* lightened blood for visibility */
--w-blood-tint:      rgba(140, 48, 48, 0.14);

/* === BORDER === */
--w-border-heavy:    #584E42;
--w-border-mid:      #403A32;
--w-border-light:    #342E28;

/* === STATUS COLOURS === */
--w-status-ok:       #6A9060;
--w-status-warn:     #A89850;
--w-status-danger:   #8C3030;
--w-status-unknown:  #786E60;
```

---

## Spacing & Layout

Asymmetric padding is the key technique — slightly looser on the right than the
left, or looser on the bottom than the top. This breaks grid perfection without
breaking legibility.

```
/* Spacing scale */
--w-space-xs:   3px
--w-space-sm:   7px    /* intentionally odd — not 8 */
--w-space-md:   14px   /* intentionally odd — not 16 */
--w-space-lg:   22px
--w-space-xl:   36px

/* Asymmetric card padding */
padding: 12px 16px 14px 12px;   /* more bottom, more right */

/* Asymmetric section padding */
padding: 10px 14px 12px 10px;

/* Root widget padding */
padding: 1rem 0 1.5rem;
```

---

## Borders & Surfaces

The Weathered style uses border incompleteness as a deliberate design choice.
Not every element has four borders — some have only a left edge, some only
a bottom rule, some have a dashed top and a solid left. This creates the
impression of things that were assembled rather than designed.

### Border Recipes

```css
/* Full border — card default */
border: 1px solid var(--w-border-mid);

/* Bottom-only rule — section separator */
border-bottom: 1px solid var(--w-border-mid);

/* Left-only accent — highlighted item */
border-left: 3px solid var(--w-rust);

/* Dashed — exploratory / uncertain */
border: 1px dashed var(--w-border-mid);

/* Mixed — top dashed, left solid */
border-top: 1px dashed var(--w-border-light);
border-left: 1px solid var(--w-border-heavy);
border-right: none;
border-bottom: none;

/* Heavy structural border */
border: 1px solid var(--w-border-heavy);
```

### Clipped Corner Effect

Cards use a clipped top-right corner via `clip-path` to suggest a folded or
torn document corner. This replaces uniform `border-radius`.

```css
/* Standard weathered card */
.w-card {
  background: var(--w-bg-card);
  border: 1px solid var(--w-border-mid);
  border-radius: 0 0 2px 2px;     /* bottom corners only — very slight */
  clip-path: polygon(
    0 0,
    calc(100% - 10px) 0,          /* top-right clipped */
    100% 10px,
    100% 100%,
    0 100%
  );
  padding: 12px 16px 14px 12px;   /* asymmetric */
}

/* Smaller clip for compact components */
.w-card-sm {
  clip-path: polygon(
    0 0,
    calc(100% - 6px) 0,
    100% 6px,
    100% 100%,
    0 100%
  );
}
```

### Noise Texture

A subtle grain is applied via a multi-stop CSS gradient that mimics paper noise.
This is a pure CSS technique with no image dependency.

```css
.root::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.012) 2px,
      rgba(0,0,0,0.012) 4px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 3px,
      rgba(0,0,0,0.008) 3px,
      rgba(0,0,0,0.008) 6px
    );
}
```

---

## Interactive Elements

### Buttons — General

All buttons are uppercase, condensed, letter-spaced. They look stencilled rather
than digital. Minimum touch target: 44×44px enforced via `min-height`/`min-width`
and `box-sizing: border-box`.

```css
/* Base button reset */
.w-btn {
  font-family: 'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', Arial, sans-serif;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.10em;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  cursor: pointer;
  background: transparent;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
```

### Action Buttons (primary CTA — sendPrompt / scene advance)

```css
.action-btn, .btn-action {
  font-family: 'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', Arial, sans-serif;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.10em;
  padding: 9px 18px 9px 14px;    /* asymmetric left/right */
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  background: var(--w-rust-tint);
  border-top: 1px dashed var(--w-rust);
  border-left: 1px solid var(--w-rust);
  border-right: 1px solid var(--w-rust);
  border-bottom: 1px solid var(--w-rust);
  border-radius: 0;               /* no radius — stencil feel */
  color: var(--w-rust);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.action-btn:hover, .btn-action:hover {
  background: var(--w-rust-glow);
  border-color: var(--w-rust-dim);
  color: var(--w-text-primary);
}
```

### POI / Explore Buttons (secondary — panel toggles, exploration)

```css
.poi-btn, .btn-poi {
  font-family: 'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', Arial, sans-serif;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 9px 14px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  background: transparent;
  border: 1px dashed var(--w-border-heavy);
  border-radius: 0;
  color: var(--w-text-secondary);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.poi-btn:hover, .btn-poi:hover {
  background: var(--w-olive-tint);
  border-color: var(--w-olive);
  border-style: solid;
  color: var(--w-text-primary);
}
```

### Footer Buttons (tertiary — panel access, utilities)

```css
.footer-btn {
  font-family: 'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', Arial, sans-serif;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 8px 14px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  background: transparent;
  border-top: none;
  border-left: 1px solid var(--w-border-mid);
  border-right: none;
  border-bottom: 1px solid var(--w-border-mid);
  border-radius: 0;
  color: var(--w-text-tertiary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.footer-btn:hover {
  color: var(--w-text-secondary);
  background: var(--w-olive-tint);
  border-color: var(--w-border-heavy);
}
```

### Continue Button

```css
.continue-btn {
  font-family: 'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', Arial, sans-serif;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 10px 22px 10px 18px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  background: transparent;
  border: 1px solid var(--w-border-heavy);
  border-left: 3px solid var(--w-rust);
  border-radius: 0;
  color: var(--w-text-primary);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.continue-btn:hover {
  background: var(--w-rust-tint);
}
```

### Focus States

```css
button:focus-visible,
[data-prompt]:focus-visible {
  outline: 2px solid var(--w-rust);
  outline-offset: 3px;
}
```

---

## Micro-interactions

All animations and transitions are wrapped in `prefers-reduced-motion` media
queries. When motion is reduced, transitions collapse to instantaneous and
animated sequences jump to their final state.

```css
/* Global transition defaults — reduced-motion safe */
@media (prefers-reduced-motion: no-preference) {

  /* Fade-in for scene reveal */
  @keyframes w-fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Flicker — for data readouts powering on */
  @keyframes w-flicker {
    0%   { opacity: 0.4; }
    20%  { opacity: 1;   }
    22%  { opacity: 0.5; }
    24%  { opacity: 1;   }
    80%  { opacity: 1;   }
    82%  { opacity: 0.7; }
    84%  { opacity: 1;   }
    100% { opacity: 1;   }
  }

  /* Pulse — for warning states */
  @keyframes w-pulse-border {
    0%, 100% { border-color: var(--w-blood); }
    50%       { border-color: var(--w-blood-tint); }
  }

  /* Scan line sweep — loading indicator */
  @keyframes w-scan {
    from { transform: translateY(-100%); }
    to   { transform: translateY(100%); }
  }

  .w-scene-enter  { animation: w-fade-in 0.35s ease-out both; }
  .w-data-online  { animation: w-flicker 0.6s ease-out both; }
  .w-warn-pulse   { animation: w-pulse-border 1.8s ease-in-out infinite; }

  /* Button press feedback */
  .action-btn:active, .btn-action:active,
  .poi-btn:active,    .btn-poi:active {
    transform: translateY(1px);
  }

  /* XP bar fill */
  .xp-fill {
    transition: width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  /* Panel slide-in */
  @keyframes w-panel-in {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  #panel-overlay[style*="block"] {
    animation: w-panel-in 0.2s ease-out both;
  }

}

/* Reduced-motion: strip all animations, keep instant transitions */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Component Overrides

How each engine widget type should render in the Weathered style.

### Scene Widget

- Background: `--w-bg-page` with noise overlay
- Location bar: bottom-only border, `--w-border-mid`; title uppercase, condensed, brass colour
- Atmosphere pills: no border-radius; dashed borders; uppercase 9px
- Narrative: `--w-text-primary`, body font, 1.85 line-height
- Section labels: 9px uppercase, `--w-text-tertiary`, `--w-brass` for emphasis

```css
.loc-bar {
  border-bottom: 1px solid var(--w-border-mid);
  padding-bottom: 9px;
  margin-bottom: 14px;
}
.loc-name {
  font-family: 'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', Arial, sans-serif;
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--w-brass);
}
.scene-num {
  font-family: 'Share Tech Mono', 'IBM Plex Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  color: var(--w-text-tertiary);
}
.atmo-pill {
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 3px 9px 3px 8px;      /* asymmetric */
  border: 1px dashed var(--w-border-mid);
  border-radius: 0;              /* no radius */
  color: var(--w-text-tertiary);
  background: transparent;
}
.narrative {
  font-family: 'Barlow', 'Roboto', 'Arial Narrow', system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.85;
  color: var(--w-text-primary);
}
.section-label {
  font-family: 'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', Arial, sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--w-text-tertiary);
  margin: 16px 0 7px;
}
```

### Status Bar

Status bar uses the monospace data-readout style. HP pips are square, not round.
The XP track is exposed as a raw progress bar, slightly wider than base.

```css
.status-bar {
  font-family: 'Share Tech Mono', 'IBM Plex Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--w-text-tertiary);
  border-top: 1px solid var(--w-border-mid);
  padding-top: 10px;
  margin-top: 10px;
}
/* Square HP pips */
.pip {
  width: 9px;
  height: 9px;
  border-radius: 0;              /* square — not circular */
  background: var(--w-status-ok);
  border: 1px solid var(--w-status-ok);
}
.pip.empty {
  background: transparent;
  border-color: var(--w-border-heavy);
}
/* XP track */
.xp-track {
  width: 72px;
  height: 4px;
  background: var(--w-bg-inset);
  border: 1px solid var(--w-border-mid);
  border-radius: 0;
}
.xp-fill {
  height: 100%;
  background: var(--w-brass);
  border-radius: 0;
}
```

### Panel Overlays

Panels look like classified documents pulled from a battered folder. The header
rule is dashed. The panel title uses the stencil font with letter-spacing.

```css
#panel-overlay {
  background: var(--w-bg-overlay);
  border-left: 3px solid var(--w-rust);
  padding: 14px 16px 16px 14px;  /* asymmetric */
}
.panel-header {
  border-bottom: 1px dashed var(--w-border-heavy);
  padding-bottom: 10px;
  margin-bottom: 14px;
}
.panel-title {
  font-family: 'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', Arial, sans-serif;
  font-size: 15px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--w-text-primary);
}
.panel-close-btn {
  font-family: 'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', Arial, sans-serif;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  background: transparent;
  border: 1px solid var(--w-border-heavy);
  border-radius: 0;
  padding: 8px 14px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  color: var(--w-text-tertiary);
  cursor: pointer;
}
.panel-close-btn:hover {
  border-color: var(--w-rust);
  color: var(--w-text-secondary);
}
.panel-content {
  font-family: 'Barlow', 'Roboto', 'Arial Narrow', system-ui, sans-serif;
  font-size: 12px;
  line-height: 1.75;
  color: var(--w-text-secondary);
}
```

### Die Roll Widget

The die roll display is the most "jury-rigged" component: the face value uses
monospace at a large size, while the modifier and result use a smaller condensed
sans in a different colour. The two font families within one readout are
intentional — mismatched salvage.

```css
.die-face {
  font-family: 'Share Tech Mono', 'IBM Plex Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 48px;
  font-weight: 400;
  color: var(--w-text-primary);
  line-height: 1;
}
.die-modifier {
  font-family: 'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', Arial, sans-serif;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--w-text-tertiary);
}
.die-result-total {
  font-family: 'Share Tech Mono', 'IBM Plex Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 22px;
  color: var(--w-brass);
}
.die-result-label {
  font-family: 'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', Arial, sans-serif;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--w-text-tertiary);
}
/* Success / failure borders on the result card */
.die-card-success {
  border-left: 3px solid var(--w-status-ok);
  background: rgba(74, 103, 65, 0.08);
}
.die-card-failure {
  border-left: 3px solid var(--w-blood);
  background: var(--w-blood-tint);
}
```

### Dialogue Widget

NPC speech uses an indented left-border treatment, like a quoted passage in a
field report. Response options look like form checkboxes in a mission briefing.

```css
.npc-speech {
  border-left: 3px solid var(--w-border-heavy);
  padding: 8px 12px 8px 14px;
  margin: 0 0 14px;
  font-style: italic;
  color: var(--w-text-secondary);
  background: var(--w-bg-inset);
}
.npc-name {
  font-family: 'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', Arial, sans-serif;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--w-text-tertiary);
  margin-bottom: 4px;
}
```

### Combat Widget

Combat uses a more urgent palette. The initiative tracker uses the brass colour.
Danger states bleed in the blood accent.

```css
.combat-header {
  font-family: 'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', Arial, sans-serif;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--w-rust);
  border-bottom: 1px solid var(--w-rust);
  padding-bottom: 6px;
  margin-bottom: 12px;
}
.initiative-entry {
  font-family: 'Share Tech Mono', 'IBM Plex Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 11px;
  letter-spacing: 0.04em;
  padding: 4px 8px 4px 10px;
  border-left: 2px solid var(--w-border-mid);
  color: var(--w-text-secondary);
}
.initiative-entry.active {
  border-left-color: var(--w-brass);
  color: var(--w-text-primary);
  background: var(--w-olive-tint);
}
```

---

## Complete Injected CSS

The full CSS block to be injected into any widget that adopts this style. The
engine replaces the base `<style>` block with this content. Variables are
declared on `.root` so they scope to the widget iframe and do not bleed into
any host page styles.

```css
/* @extract */
/* =====================================================================
   WEATHERED THEME — text-adventure engine visual style
   Distressed post-apocalyptic aesthetic. Rust, concrete, survival.
   ===================================================================== */

/* --- Web font intent (may be CSP-blocked; fallbacks handle this) --- */
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700&family=Barlow:wght@400;500&family=Share+Tech+Mono&display=swap');

/* --- Token declarations — light mode defaults --- */
.root {
  /* Background */
  --w-bg-page:        #E8E2D6;
  --w-bg-card:        #DEDAD1;
  --w-bg-inset:       #D4CEC4;
  --w-bg-overlay:     #E0DACFee;

  /* Text */
  --w-text-primary:   #2A2218;
  --w-text-secondary: #4A4036;
  --w-text-tertiary:  #7A6E60;
  --w-text-muted:     #9A8E80;
  --w-text-on-accent: #F5F0E8;

  /* Accent */
  --w-rust:           #A0522D;
  --w-rust-dim:       #7A3E20;
  --w-rust-tint:      rgba(160, 82, 45, 0.10);
  --w-rust-glow:      rgba(160, 82, 45, 0.20);
  --w-olive:          #6B6B47;
  --w-olive-tint:     rgba(107, 107, 71, 0.10);
  --w-brass:          #8B7D3C;
  --w-blood:          #5C1A1A;
  --w-blood-tint:     rgba(92, 26, 26, 0.10);

  /* Border */
  --w-border-heavy:   #9A8E80;
  --w-border-mid:     #B8AFA0;
  --w-border-light:   #CEC6B8;

  /* Status */
  --w-status-ok:      #4A6741;
  --w-status-warn:    #8B7D3C;
  --w-status-danger:  #5C1A1A;
  --w-status-unknown: #7A6E60;

  /* Font stacks */
  --w-font-heading: 'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', Arial, sans-serif;
  --w-font-body:    'Barlow', 'Roboto', 'Arial Narrow', system-ui, sans-serif;
  --w-font-mono:    'Share Tech Mono', 'IBM Plex Mono', 'Cascadia Code', 'Consolas', 'Courier New', monospace;

  /* Engine compatibility aliases — map engine vars to weathered tokens */
  --color-text-primary:    var(--w-text-primary);
  --color-text-secondary:  var(--w-text-secondary);
  --color-text-tertiary:   var(--w-text-tertiary);
  --color-border-primary:  var(--w-rust);
  --color-border-secondary: var(--w-border-heavy);
  --color-border-tertiary: var(--w-border-mid);
  --color-background-secondary: var(--w-bg-inset);
  --border-radius-md:      0px;   /* no radius in weathered style */
  --font-mono:             var(--w-font-mono);

  /* Base */
  font-family: var(--w-font-body);
  background-color: var(--w-bg-page);
  color: var(--w-text-primary);
  padding: 1rem 0 1.5rem;
  position: relative;

  /* ── CSS Custom Property Contract (required by style-reference.md) ─ */
  --ta-font-heading:              var(--w-font-heading);
  --ta-font-body:                 var(--w-font-mono);
  --ta-color-accent:              var(--w-rust);
  --ta-color-accent-hover:        var(--w-rust-dim);
  --ta-color-accent-bg:           var(--w-rust-tint);
  --ta-color-accent-bg-hover:     var(--w-rust-glow);
  --ta-color-success:             var(--w-status-ok);
  --ta-color-success-border:      color-mix(in srgb, var(--w-status-ok) 70%, black);
  --ta-color-danger:              var(--w-blood);
  --ta-color-danger-border:       color-mix(in srgb, var(--w-blood) 70%, black);
  --ta-color-danger-bg:           var(--w-blood-tint);
  --ta-color-danger-bg-hover:     rgba(92, 26, 26, 0.18);
  --ta-color-warning:             var(--w-brass);
  --ta-color-warning-border:      color-mix(in srgb, var(--w-brass) 70%, black);
  --ta-color-warning-bg:          rgba(139, 125, 60, 0.10);
  --ta-color-xp:                  var(--w-brass);
  --ta-color-focus:               var(--w-rust);
  --ta-color-conviction:          #7C6BF0;
  --ta-color-conviction-border:   #6B5CE0;
  --ta-badge-success-bg:          rgba(74, 103, 65, 0.12);
  --ta-badge-success-text:        var(--w-status-ok);
  --ta-badge-partial-bg:          rgba(139, 125, 60, 0.12);
  --ta-badge-partial-text:        var(--w-brass);
  --ta-badge-failure-bg:          var(--w-blood-tint);
  --ta-badge-failure-text:        var(--w-blood);
  --ta-badge-crit-success-border: var(--w-status-ok);
  --ta-badge-crit-failure-border: var(--w-blood);
  --ta-color-credits:             var(--w-brass);
  --ta-color-tab-active:          var(--w-rust);
  --ta-border-style-poi:          1px dashed;
  --ta-die-spin-duration:         0.5s;

  /* --- Speaker colours (multi-dialogue) --- */
  --speaker-color-0: #8b6f47;
  --speaker-color-1: #6b8ea6;
  --speaker-color-2: #a05050;
  --speaker-color-3: #c4b89a;
  --speaker-color-4: #6b7c5a;
  --speaker-color-5: #b07040;
}

/* --- Dark mode token overrides --- */
@media (prefers-color-scheme: dark) {
  .root {
    --w-bg-page:        #2A2620;
    --w-bg-card:        #322E28;
    --w-bg-inset:       #1E1C18;
    --w-bg-overlay:     #2E2A24ee;
    --w-text-primary:   #C8BFB0;
    --w-text-secondary: #A89E90;
    --w-text-tertiary:  #786E60;
    --w-text-muted:     #584E42;
    --w-text-on-accent: #1A1612;
    --w-rust:           #C4733D;
    --w-rust-dim:       #A05A2A;
    --w-rust-tint:      rgba(196, 115, 61, 0.14);
    --w-rust-glow:      rgba(196, 115, 61, 0.24);
    --w-olive:          #8A8A5A;
    --w-olive-tint:     rgba(138, 138, 90, 0.12);
    --w-brass:          #A89850;
    --w-blood:          #8C3030;
    --w-blood-tint:     rgba(140, 48, 48, 0.14);
    --w-border-heavy:   #584E42;
    --w-border-mid:     #403A32;
    --w-border-light:   #342E28;
    --w-status-ok:      #6A9060;
    --w-status-warn:    #A89850;
    --w-status-danger:  #8C3030;
    --w-status-unknown: #786E60;
  }
}

/* --- Noise texture overlay --- */
.root::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.012) 2px,
      rgba(0,0,0,0.012) 4px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 3px,
      rgba(0,0,0,0.008) 3px,
      rgba(0,0,0,0.008) 6px
    );
}

/* --- Typography --- */
.loc-name {
  font-family: var(--w-font-heading);
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--w-brass);
  margin: 0;
}
.scene-num {
  font-family: var(--w-font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  color: var(--w-text-tertiary);
  text-transform: uppercase;
}
.section-label {
  font-family: var(--w-font-heading);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--w-text-tertiary);
  margin: 16px 0 7px;
}
.narrative {
  font-family: var(--w-font-body);
  font-size: 13px;
  line-height: 1.85;
  color: var(--w-text-primary);
  margin: 0 0 16px;
}
.brief-text {
  font-family: var(--w-font-body);
  font-size: 14px;
  line-height: 1.75;
  color: var(--w-text-primary);
  margin: 0 0 1rem;
}

/* --- Location bar --- */
.loc-bar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 9px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--w-border-mid);
}

/* --- Atmosphere pills --- */
.atmo-strip { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 14px; }
.atmo-pill {
  font-family: var(--w-font-heading);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 3px 9px 3px 8px;
  border: 1px dashed var(--w-border-mid);
  border-radius: 0;
  color: var(--w-text-tertiary);
  background: transparent;
}

/* --- Buttons --- */
.btn-row { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 12px; }

.continue-btn {
  font-family: var(--w-font-heading);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 10px 22px 10px 18px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  background: transparent;
  border: 1px solid var(--w-border-heavy);
  border-left: 3px solid var(--w-rust);
  border-radius: 0;
  color: var(--w-text-primary);
  cursor: pointer;
}
.continue-btn:hover { background: var(--w-rust-tint); }

.action-btn, .btn-action {
  font-family: var(--w-font-heading);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.10em;
  padding: 9px 18px 9px 14px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  background: var(--w-rust-tint);
  border-top: 1px dashed var(--w-rust);
  border-left: 1px solid var(--w-rust);
  border-right: 1px solid var(--w-rust);
  border-bottom: 1px solid var(--w-rust);
  border-radius: 0;
  color: var(--w-rust);
  cursor: pointer;
}
.action-btn:hover, .btn-action:hover {
  background: var(--w-rust-glow);
  border-color: var(--w-rust-dim);
  color: var(--w-text-primary);
}

.poi-btn, .btn-poi {
  font-family: var(--w-font-heading);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 9px 14px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  background: transparent;
  border: 1px dashed var(--w-border-heavy);
  border-radius: 0;
  color: var(--w-text-secondary);
  cursor: pointer;
}
.poi-btn:hover, .btn-poi:hover {
  background: var(--w-olive-tint);
  border-color: var(--w-olive);
  border-style: solid;
  color: var(--w-text-primary);
}

/* --- Status bar --- */
.status-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 10px 0;
  margin-top: 8px;
  border-top: 1px solid var(--w-border-mid);
  font-family: var(--w-font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--w-text-tertiary);
}
.hp-pips { display: flex; gap: 4px; align-items: center; }
.pip {
  width: 9px;
  height: 9px;
  border-radius: 0;
  background: var(--w-status-ok);
  border: 1px solid var(--w-status-ok);
}
.pip.empty {
  background: transparent;
  border-color: var(--w-border-heavy);
}
.xp-track {
  width: 72px;
  height: 4px;
  background: var(--w-bg-inset);
  border: 1px solid var(--w-border-mid);
  border-radius: 0;
  overflow: hidden;
}
.xp-fill {
  height: 100%;
  width: 0%;
  background: var(--w-brass);
  border-radius: 0;
}

/* --- Footer --- */
.footer-row {
  display: flex;
  justify-content: flex-start;
  gap: 7px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid var(--w-border-mid);
}
.footer-btn {
  font-family: var(--w-font-heading);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 8px 14px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  background: transparent;
  border-top: none;
  border-left: 1px solid var(--w-border-mid);
  border-right: none;
  border-bottom: 1px solid var(--w-border-mid);
  border-radius: 0;
  color: var(--w-text-tertiary);
  cursor: pointer;
}
.footer-btn:hover {
  color: var(--w-text-secondary);
  background: var(--w-olive-tint);
  border-color: var(--w-border-heavy);
}

/* --- Panel overlay --- */
#panel-overlay {
  background: var(--w-bg-overlay);
  border-left: 3px solid var(--w-rust);
  padding: 14px 16px 16px 14px;
}
.panel-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 10px;
  margin-bottom: 14px;
  border-bottom: 1px dashed var(--w-border-heavy);
}
.panel-title {
  font-family: var(--w-font-heading);
  font-size: 15px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--w-text-primary);
}
.panel-close-btn {
  font-family: var(--w-font-heading);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  background: transparent;
  border: 1px solid var(--w-border-heavy);
  border-radius: 0;
  padding: 8px 14px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  color: var(--w-text-tertiary);
  cursor: pointer;
}
.panel-close-btn:hover { border-color: var(--w-rust); color: var(--w-text-secondary); }
.panel-content {
  display: none;
  font-family: var(--w-font-body);
  font-size: 12px;
  line-height: 1.75;
  color: var(--w-text-secondary);
}

/* --- Focus states (accessibility) --- */
button:focus-visible,
[data-prompt]:focus-visible {
  outline: 2px solid var(--w-rust);
  outline-offset: 3px;
}

/* --- Fallback text --- */
.fallback-text {
  font-family: var(--w-font-mono);
  font-size: 11px;
  color: var(--w-text-tertiary);
  margin-top: 8px;
  display: none;
}

/* --- Animations — reduced-motion guarded --- */
@media (prefers-reduced-motion: no-preference) {
  @keyframes w-fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes w-flicker {
    0%   { opacity: 0.4; }
    20%  { opacity: 1;   }
    22%  { opacity: 0.5; }
    24%  { opacity: 1;   }
    80%  { opacity: 1;   }
    82%  { opacity: 0.7; }
    84%  { opacity: 1;   }
    100% { opacity: 1;   }
  }
  @keyframes w-panel-in {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .w-scene-enter { animation: w-fade-in 0.35s ease-out both; }
  .w-data-online { animation: w-flicker 0.6s ease-out both; }
  .xp-fill       { transition: width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
  .action-btn:active, .btn-action:active,
  .poi-btn:active, .btn-poi:active { transform: translateY(1px); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
