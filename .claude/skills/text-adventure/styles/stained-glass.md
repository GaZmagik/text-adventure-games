---
name: stained-glass
description: >
  Rich jewel-tone theme evoking cathedral windows and medieval manuscripts.
  Deep ruby, sapphire, emerald, amber and amethyst panes separated by dark
  leaded borders, with luminous radial gradients simulating light through glass.
best-for:
  - fantasy
  - dark-fantasy
  - gothic-horror
  - historical
  - medieval
  - dungeon-crawl
  - mystery
---

# Stained Glass — Visual Style

## Design Philosophy

The stained glass aesthetic draws from two converging sources: the cathedral
windows of gothic Europe and the illuminated manuscripts of monastic scriptoria.
Every panel is a "pane" of coloured glass — bounded by dark leaded lines, lit
from within by a subtle radial luminance, and set against either warm parchment
(light mode) or near-black void (dark mode).

The leaded-glass effect is achieved through borders rather than box-shadows.
Each surface uses a 2px solid dark border to simulate the lead came between
panes. Gradients within panels run lighter at the centre and darker at the
edges, mimicking the uneven thickness of hand-blown glass. Jewel tones are
used at near-full saturation — especially in dark mode, where the colours
appear to glow against the void, as if a candle burns on the other side.

Typography reinforces the medieval register: small-caps headings with wide
letter-spacing echo the titling of illuminated pages; a classical serif body
font references manuscript text. The overall mood is a vault of gemstones, a
cathedral at dusk, a scholar's lamp burning over vellum.

---

## Typography

### Font Stacks

```
Headings:   'Cinzel', 'EB Garamond', 'Palatino Linotype', 'Palatino',
             'Book Antiqua', Georgia, 'Times New Roman', serif
Body:       'EB Garamond', 'Palatino Linotype', 'Palatino',
             'Book Antiqua', Georgia, serif
Mono/Stats: 'Courier New', 'Courier', 'Lucida Console', monospace
```

> Google Fonts (Cinzel, EB Garamond) may be blocked by CSP inside Claude.ai
> iframes. The fallback stacks are designed to degrade gracefully through
> system-installed fonts — Palatino or Georgia will maintain the serif
> character even without the preferred faces.

### Sizing Scale

| Role              | Size       | Weight | Transform             |
|-------------------|------------|--------|-----------------------|
| Page title (h1)   | 2rem       | 700    | uppercase, tracking 0.12em |
| Section head (h2) | 1.4rem     | 600    | small-caps, tracking 0.08em |
| Widget head (h3)  | 1.1rem     | 600    | small-caps, tracking 0.06em |
| Body text         | 1rem       | 400    | none                  |
| Caption / label   | 0.8rem     | 400    | uppercase, tracking 0.1em  |
| Stat / mono       | 0.85rem    | 400    | none                  |

---

## Colour Palette

All colours are defined as CSS custom properties on `:host` and overridden
for dark mode via `@media (prefers-color-scheme: dark)`. A `[data-theme]`
attribute override is also provided for runtime switching.

### Light Mode (warm parchment ground, 80% saturation jewel tones)

```css
:host {
  /* Ground colours */
  --sg-bg-page:          #FFF8F0;   /* warm cream parchment */
  --sg-bg-panel:         #FDF3E7;   /* slightly darker parchment for panels */
  --sg-bg-inset:         #F5EAD8;   /* inset / recessed surfaces */
  --sg-bg-overlay:       rgba(15, 10, 5, 0.55); /* modal/overlay scrim */

  /* Lead came (borders) */
  --sg-lead:             #1A1A1A;   /* near-black border — the lead lines */
  --sg-lead-subtle:      #3D3020;   /* secondary border — aged lead */

  /* Text */
  --sg-text-primary:     #1C1208;   /* near-black ink on parchment */
  --sg-text-secondary:   #4A3828;   /* mid-tone brown */
  --sg-text-muted:       #7A6550;   /* faded inscription */
  --sg-text-on-jewel:    #FFF8F0;   /* text placed directly on jewel fills */

  /* Jewel tones — light mode at ~80% saturation */
  --sg-ruby:             #A8324A;   /* deep red — action / danger */
  --sg-sapphire:         #2660A4;   /* rich blue — information / nav */
  --sg-emerald:          #1E7D46;   /* forest green — success / nature */
  --sg-amber:            #C4920A;   /* golden amber — warning / treasure */
  --sg-amethyst:         #7B3F9A;   /* violet — mystery / magic */

  /* Jewel tints — for panel backgrounds (very desaturated) */
  --sg-ruby-tint:        #FBF0F2;
  --sg-sapphire-tint:    #EFF4FB;
  --sg-emerald-tint:     #EEF7F2;
  --sg-amber-tint:       #FBF6E8;
  --sg-amethyst-tint:    #F5EFF9;

  /* Jewel glow — for hover states (slightly lighter, full sat) */
  --sg-ruby-glow:        #C23A56;
  --sg-sapphire-glow:    #2E73C0;
  --sg-emerald-glow:     #238F50;
  --sg-amber-glow:       #D9A412;
  --sg-amethyst-glow:    #8E4CAF;

  /* Luminance gradient — panel inner glow (light at centre, dark at rim) */
  --sg-pane-gradient:    radial-gradient(ellipse at 50% 38%,
                           rgba(255,248,240,0.45) 0%,
                           rgba(255,248,240,0) 70%);

  /* Structural */
  --sg-border:           2px solid var(--sg-lead);
  --sg-border-subtle:    1px solid var(--sg-lead-subtle);
  --sg-radius:           2px;       /* nearly square — glass doesn't curve */
  --sg-radius-btn:       2px;

  /* ── CSS Custom Property Contract (required by style-reference.md) ─ */
  --ta-font-heading:              'Cinzel', 'EB Garamond', 'Palatino Linotype', 'Palatino', 'Book Antiqua', Georgia, 'Times New Roman', serif;
  --ta-font-body:                 'EB Garamond', 'Palatino Linotype', 'Palatino', 'Book Antiqua', Georgia, serif;
  --ta-color-accent:              var(--sg-sapphire);
  --ta-color-accent-hover:        var(--sg-sapphire-glow);
  --ta-color-accent-bg:           var(--sg-sapphire-tint);
  --ta-color-accent-bg-hover:     color-mix(in srgb, var(--sg-sapphire-tint) 70%, var(--sg-sapphire));
  --ta-color-success:             var(--sg-emerald);
  --ta-color-success-border:      color-mix(in srgb, var(--sg-emerald) 70%, black);
  --ta-color-danger:              var(--sg-ruby);
  --ta-color-danger-border:       color-mix(in srgb, var(--sg-ruby) 70%, black);
  --ta-color-danger-bg:           var(--sg-ruby-tint);
  --ta-color-danger-bg-hover:     color-mix(in srgb, var(--sg-ruby-tint) 70%, var(--sg-ruby));
  --ta-color-warning:             var(--sg-amber);
  --ta-color-warning-border:      color-mix(in srgb, var(--sg-amber) 70%, black);
  --ta-color-warning-bg:          var(--sg-amber-tint);
  --ta-color-xp:                  var(--sg-amethyst);
  --ta-color-focus:               var(--sg-sapphire);
  --ta-color-conviction:          var(--sg-amethyst);
  --ta-color-conviction-border:   color-mix(in srgb, var(--sg-amethyst) 70%, black);
  --ta-badge-success-bg:          var(--sg-emerald-tint);
  --ta-badge-success-text:        var(--sg-emerald);
  --ta-badge-partial-bg:          var(--sg-amber-tint);
  --ta-badge-partial-text:        var(--sg-amber);
  --ta-badge-failure-bg:          var(--sg-ruby-tint);
  --ta-badge-failure-text:        var(--sg-ruby);
  --ta-badge-crit-success-border: var(--sg-emerald);
  --ta-badge-crit-failure-border: var(--sg-ruby);
  --ta-color-credits:             var(--sg-amber);
  --ta-color-tab-active:          var(--sg-sapphire);
  --ta-border-style-poi:          2px dashed;
  --ta-die-spin-duration:         0.6s;
}
```

### Dark Mode (near-black void, full saturation jewel tones)

```css
@media (prefers-color-scheme: dark) {
  :host {
    /* Ground colours */
    --sg-bg-page:          #0F0F0F;
    --sg-bg-panel:         #181210;
    --sg-bg-inset:         #0A0806;
    --sg-bg-overlay:       rgba(0, 0, 0, 0.75);

    /* Lead came */
    --sg-lead:             #0A0806;
    --sg-lead-subtle:      #2A2018;

    /* Text */
    --sg-text-primary:     #F0E8DC;
    --sg-text-secondary:   #C8B89A;
    --sg-text-muted:       #8A7A66;
    --sg-text-on-jewel:    #0F0F0F;

    /* Jewel tones — dark mode at full saturation, luminous */
    --sg-ruby:             #9B1B30;
    --sg-sapphire:         #1B4F72;
    --sg-emerald:          #196F3D;
    --sg-amber:            #D4A017;
    --sg-amethyst:         #6C3483;

    /* Jewel tints — panel backgrounds (dark, faintly tinted) */
    --sg-ruby-tint:        #1A0C0F;
    --sg-sapphire-tint:    #0C1420;
    --sg-emerald-tint:     #0C1A12;
    --sg-amber-tint:       #1A1508;
    --sg-amethyst-tint:    #150C1C;

    /* Jewel glow — hover (brighter, the "light shining through" effect) */
    --sg-ruby-glow:        #C4203B;
    --sg-sapphire-glow:    #2060A0;
    --sg-emerald-glow:     #1E8A4A;
    --sg-amber-glow:       #F0B820;
    --sg-amethyst-glow:    #8040A8;

    /* Luminance gradient — subtler glow against dark ground */
    --sg-pane-gradient:    radial-gradient(ellipse at 50% 38%,
                             rgba(255,248,220,0.08) 0%,
                             rgba(255,248,220,0) 65%);
  }
}

/* Runtime override — matches prefers-color-scheme: dark values */
[data-theme="dark"] {
  --sg-bg-page:          #0F0F0F;
  --sg-bg-panel:         #181210;
  --sg-bg-inset:         #0A0806;
  --sg-bg-overlay:       rgba(0, 0, 0, 0.75);
  --sg-lead:             #0A0806;
  --sg-lead-subtle:      #2A2018;
  --sg-text-primary:     #F0E8DC;
  --sg-text-secondary:   #C8B89A;
  --sg-text-muted:       #8A7A66;
  --sg-text-on-jewel:    #0F0F0F;
  --sg-ruby:             #9B1B30;
  --sg-sapphire:         #1B4F72;
  --sg-emerald:          #196F3D;
  --sg-amber:            #D4A017;
  --sg-amethyst:         #6C3483;
  --sg-ruby-tint:        #1A0C0F;
  --sg-sapphire-tint:    #0C1420;
  --sg-emerald-tint:     #0C1A12;
  --sg-amber-tint:       #1A1508;
  --sg-amethyst-tint:    #150C1C;
  --sg-ruby-glow:        #C4203B;
  --sg-sapphire-glow:    #2060A0;
  --sg-emerald-glow:     #1E8A4A;
  --sg-amber-glow:       #F0B820;
  --sg-amethyst-glow:    #8040A8;
  --sg-pane-gradient:    radial-gradient(ellipse at 50% 38%,
                           rgba(255,248,220,0.08) 0%,
                           rgba(255,248,220,0) 65%);
}
```

### WCAG Contrast Notes

All body-text pairings have been selected to meet WCAG AA (4.5:1 minimum):

| Foreground           | Background        | Approx. ratio | AA pass |
|----------------------|-------------------|---------------|---------|
| `--sg-text-primary`  | `--sg-bg-page` LM | ~14:1         | Yes     |
| `--sg-text-primary`  | `--sg-bg-page` DM | ~12:1         | Yes     |
| `--sg-text-on-jewel` | `--sg-ruby` LM    | ~5.2:1        | Yes     |
| `--sg-text-on-jewel` | `--sg-sapphire` LM| ~5.8:1        | Yes     |
| `--sg-text-on-jewel` | `--sg-emerald` LM | ~5.4:1        | Yes     |
| `--sg-text-on-jewel` | `--sg-amber` LM   | ~4.6:1        | Yes (marginal) |
| `--sg-text-on-jewel` | `--sg-amethyst` LM| ~5.1:1        | Yes     |

> Amber is the most constrained. Do not use small-text (below 18px / 14px bold)
> in amber-filled contexts without verifying contrast at the specific size.

---

## Spacing and Layout

```css
:host {
  /* Spacing scale */
  --sg-space-xs:   4px;
  --sg-space-sm:   8px;
  --sg-space-md:   16px;
  --sg-space-lg:   24px;
  --sg-space-xl:   40px;
  --sg-space-2xl:  64px;

  /* Panel padding — generous, like illuminated margins */
  --sg-panel-pad:  var(--sg-space-lg);

  /* Max content width — prevents runaway line lengths */
  --sg-content-max: 720px;

  /* Grid gap for pane layouts */
  --sg-gap:        var(--sg-space-sm);
}
```

Layout conventions:
- All panels use `box-sizing: border-box` throughout
- Panel/card grids use `display: grid; gap: var(--sg-gap)` — the gap is the
  leaded line between panes
- No `position: fixed` anywhere — Claude.ai iframes do not clip fixed elements
  correctly and they break viewport height
- Prefer `display: grid; place-items: center` over absolute centering

---

## Borders and Surfaces

The leaded-glass effect is the defining visual motif of this theme.

### The Pane Pattern

Every card, panel, or surface is a "pane" — bounded by dark borders, filled
with a faint jewel tint, and lit from within by a radial gradient:

```css
.sg-pane {
  background-color: var(--sg-bg-panel);
  background-image: var(--sg-pane-gradient);
  border: var(--sg-border);
  border-radius: var(--sg-radius);
  padding: var(--sg-panel-pad);
  position: relative;
}
```

### Tinted Panes

Each widget type carries a colour identity via a tinted pane variant. The
tint is a very desaturated whisper of the jewel — enough to imply association
without compromising body-text contrast:

```css
.sg-pane--ruby      { background-color: var(--sg-ruby-tint); }
.sg-pane--sapphire  { background-color: var(--sg-sapphire-tint); }
.sg-pane--emerald   { background-color: var(--sg-emerald-tint); }
.sg-pane--amber     { background-color: var(--sg-amber-tint); }
.sg-pane--amethyst  { background-color: var(--sg-amethyst-tint); }
```

### Dividers

Internal dividers within a pane simulate subsidiary lead lines:

```css
.sg-divider {
  border: none;
  border-top: var(--sg-border-subtle);
  margin: var(--sg-space-md) 0;
}
```

### Elevation

No box-shadows in the traditional sense. Depth is conveyed by border weight
and colour contrast between adjacent panes, not by drop shadows. Where a
"raised" appearance is needed (e.g., a modal), use a thicker border and the
overlay scrim behind the element:

```css
.sg-raised {
  border: 3px solid var(--sg-lead);
}
```

---

## Interactive Elements

### Buttons

Three button variants, each with a jewel-tone fill that brightens on hover
(the "light shining through glass" effect):

```css
/* Base button — applies to all variants */
.sg-btn {
  font-family: 'Cinzel', 'EB Garamond', Georgia, serif;
  font-size: 0.85rem;
  font-variant: small-caps;
  letter-spacing: 0.08em;
  font-weight: 600;
  text-transform: lowercase; /* small-caps handles visual capitalisation */

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sg-space-xs);

  min-height: 44px;
  min-width: 44px;
  padding: var(--sg-space-sm) var(--sg-space-md);
  box-sizing: border-box;

  border: var(--sg-border);
  border-radius: var(--sg-radius-btn);
  cursor: pointer;

  transition: background-color 180ms ease, border-color 180ms ease,
              color 180ms ease;
}

/* Primary — sapphire (information, navigation) */
.sg-btn--primary {
  background-color: var(--sg-sapphire);
  color: var(--sg-text-on-jewel);
  border-color: var(--sg-lead);
}
.sg-btn--primary:hover,
.sg-btn--primary:focus-visible {
  background-color: var(--sg-sapphire-glow);
  border-color: var(--sg-sapphire-glow);
}

/* Action — ruby (danger, decisive action) */
.sg-btn--action {
  background-color: var(--sg-ruby);
  color: var(--sg-text-on-jewel);
  border-color: var(--sg-lead);
}
.sg-btn--action:hover,
.sg-btn--action:focus-visible {
  background-color: var(--sg-ruby-glow);
  border-color: var(--sg-ruby-glow);
}

/* Success — emerald (confirm, proceed, safe) */
.sg-btn--success {
  background-color: var(--sg-emerald);
  color: var(--sg-text-on-jewel);
  border-color: var(--sg-lead);
}
.sg-btn--success:hover,
.sg-btn--success:focus-visible {
  background-color: var(--sg-emerald-glow);
  border-color: var(--sg-emerald-glow);
}

/* Magic / mystery — amethyst */
.sg-btn--magic {
  background-color: var(--sg-amethyst);
  color: var(--sg-text-on-jewel);
  border-color: var(--sg-lead);
}
.sg-btn--magic:hover,
.sg-btn--magic:focus-visible {
  background-color: var(--sg-amethyst-glow);
  border-color: var(--sg-amethyst-glow);
}

/* Ghost — transparent with lead border (secondary actions) */
.sg-btn--ghost {
  background-color: transparent;
  color: var(--sg-text-secondary);
  border-color: var(--sg-lead-subtle);
}
.sg-btn--ghost:hover,
.sg-btn--ghost:focus-visible {
  background-color: var(--sg-bg-inset);
  color: var(--sg-text-primary);
  border-color: var(--sg-lead);
}

/* Disabled state — all variants */
.sg-btn:disabled,
.sg-btn[aria-disabled="true"] {
  opacity: 0.38;
  cursor: not-allowed;
  pointer-events: none;
}
```

### Focus States

Visible focus rings use the amber jewel tone as an accent, providing high
contrast against both parchment and dark backgrounds:

```css
.sg-btn:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--sg-amber);
  outline-offset: 3px;
}
```

### Action Choice Pills

Scene action buttons are rendered as a horizontal (wrapping) list of pills —
each is a small pane with a jewel tint hover, distinct from the primary CTA
buttons:

```css
.sg-action-pill {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: var(--sg-space-xs) var(--sg-space-md);
  background-color: var(--sg-bg-inset);
  background-image: var(--sg-pane-gradient);
  border: var(--sg-border-subtle);
  border-radius: var(--sg-radius);
  font-family: 'EB Garamond', Georgia, serif;
  font-size: 0.95rem;
  color: var(--sg-text-secondary);
  cursor: pointer;
  transition: background-color 180ms ease, border-color 180ms ease,
              color 180ms ease;
}
.sg-action-pill:hover,
.sg-action-pill:focus-visible {
  background-color: var(--sg-sapphire-tint);
  border-color: var(--sg-sapphire);
  color: var(--sg-text-primary);
}
```

---

## Micro-interactions

All transitions and animations are gated behind `prefers-reduced-motion`.
The motion-safe block defines the full animation; the reduced-motion block
either removes transitions entirely or reduces them to an instant toggle.

```css
/* ── Motion-safe animations ─────────────────────────────────────────── */

@media (prefers-reduced-motion: no-preference) {

  /* Panel reveal — slide up from below, fade in */
  @keyframes sg-panel-enter {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Pane shimmer — one-time glow sweep on initial render */
  @keyframes sg-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  /* Outcome badge pulse — brief scale on critical results */
  @keyframes sg-pulse {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.06); }
    100% { transform: scale(1); }
  }

  /* Dice roll spin */
  @keyframes sg-dice-spin {
    0%   { transform: rotate(0deg) scale(1.0); }
    50%  { transform: rotate(180deg) scale(1.1); }
    100% { transform: rotate(360deg) scale(1.0); }
  }

  /* Panel overlay transition */
  .sg-panel-overlay {
    transition: opacity 200ms ease, transform 200ms ease;
  }
  .sg-panel-overlay.sg-panel-overlay--entering {
    animation: sg-panel-enter 220ms ease forwards;
  }

  /* Button transitions (already defined in .sg-btn above) */

  /* Outcome badge on crit */
  .sg-outcome-badge--crit {
    animation: sg-pulse 400ms ease 1;
  }

  /* Die face during roll */
  .sg-die--rolling {
    animation: sg-dice-spin 600ms ease-in-out 1;
  }

  /* HP pip lost — brief flash to ruby */
  @keyframes sg-hp-lost {
    0%   { background-color: var(--sg-ruby); }
    100% { background-color: var(--sg-bg-inset); }
  }
  .sg-hp-pip--lost {
    animation: sg-hp-lost 400ms ease forwards;
  }

}

/* ── Reduced-motion fallbacks ────────────────────────────────────────── */

@media (prefers-reduced-motion: reduce) {

  /* Remove all transitions and animations */
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Panel overlays toggle instantly */
  .sg-panel-overlay {
    transition: none;
  }

}
```

---

## Component Overrides

These rules describe how each named widget type maps to the stained-glass
visual language.

### Scene Widget

The scene widget is the primary "window" — a large sapphire-tinted pane with
a prominent leaded header. The location bar reads as an illuminated chapter
title. Atmosphere pills are small amber panes.

```css
/* Scene root */
.scene-root {
  background-color: var(--sg-bg-page);
  font-family: 'EB Garamond', Georgia, serif;
  color: var(--sg-text-primary);
  padding: var(--sg-space-md);
  max-width: var(--sg-content-max);
  margin: 0 auto;
}

/* Location bar */
.loc-bar {
  font-family: 'Cinzel', Georgia, serif;
  font-variant: small-caps;
  font-size: 1.1rem;
  letter-spacing: 0.1em;
  color: var(--sg-text-secondary);
  border-bottom: var(--sg-border);
  padding-bottom: var(--sg-space-sm);
  margin-bottom: var(--sg-space-md);
}

/* Atmosphere pills */
.atmo-pill {
  display: inline-block;
  padding: 3px var(--sg-space-sm);
  background-color: var(--sg-amber-tint);
  border: 1px solid var(--sg-amber);
  border-radius: var(--sg-radius);
  font-size: 0.78rem;
  font-variant: small-caps;
  letter-spacing: 0.07em;
  color: var(--sg-text-secondary);
  margin-right: var(--sg-space-xs);
}

/* Narrative block */
.narrative {
  font-size: 1.05rem;
  line-height: 1.75;
  color: var(--sg-text-primary);
  margin: var(--sg-space-md) 0;
}

/* Points of interest */
.poi-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sg-space-sm);
  margin: var(--sg-space-md) 0;
}
```

### Status Bar

HP pips use ruby; XP bar uses emerald. The bar itself is a leaded track.

```css
.status-bar {
  display: flex;
  align-items: center;
  gap: var(--sg-space-md);
  padding: var(--sg-space-sm) 0;
  border-top: var(--sg-border-subtle);
  margin-top: var(--sg-space-md);
}

.hp-pips {
  display: flex;
  gap: 4px;
}
.hp-pip {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--sg-ruby);
  border: 1px solid var(--sg-lead);
}
.hp-pip--empty {
  background-color: var(--sg-bg-inset);
}

.xp-bar-track {
  flex: 1;
  height: 6px;
  background-color: var(--sg-bg-inset);
  border: 1px solid var(--sg-lead-subtle);
  border-radius: 1px;
  overflow: hidden;
}
.xp-bar-fill {
  height: 100%;
  background-color: var(--sg-emerald);
  border-radius: 1px;
}
```

### Die Roll Widget

The die face is a ruby-bordered square. The result badge changes colour by
outcome tier (crit success = emerald, success = sapphire, partial = amber,
failure = ruby, crit failure = amethyst). The DC reveal is amber-tinted.

```css
.die-face {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  font-family: 'Cinzel', Georgia, serif;
  font-size: 2rem;
  font-weight: 700;
  color: var(--sg-text-primary);
  background-color: var(--sg-bg-panel);
  background-image: var(--sg-pane-gradient);
  border: var(--sg-border);
  border-radius: var(--sg-radius);
  margin: 0 auto;
}

.outcome-badge {
  display: inline-block;
  padding: var(--sg-space-xs) var(--sg-space-md);
  font-variant: small-caps;
  font-family: 'Cinzel', Georgia, serif;
  letter-spacing: 0.1em;
  border: var(--sg-border);
  border-radius: var(--sg-radius);
}
.outcome-badge--crit-success { background-color: var(--sg-emerald); color: var(--sg-text-on-jewel); }
.outcome-badge--success      { background-color: var(--sg-sapphire); color: var(--sg-text-on-jewel); }
.outcome-badge--partial      { background-color: var(--sg-amber);    color: var(--sg-text-on-jewel); }
.outcome-badge--failure      { background-color: var(--sg-ruby);     color: var(--sg-text-on-jewel); }
.outcome-badge--crit-failure { background-color: var(--sg-amethyst); color: var(--sg-text-on-jewel); }
```

### Panel Overlay

The panel overlay is a dark leaded pane that slides over the scene. The close
button is a ghost button aligned to the panel header.

```css
.panel-overlay-sg {
  background-color: var(--sg-bg-panel);
  background-image: var(--sg-pane-gradient);
  border: var(--sg-border);
  border-radius: var(--sg-radius);
  padding: var(--sg-panel-pad);
}

.panel-header-sg {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  border-bottom: var(--sg-border);
  padding-bottom: var(--sg-space-sm);
  margin-bottom: var(--sg-space-md);
}

.panel-title-sg {
  font-family: 'Cinzel', Georgia, serif;
  font-variant: small-caps;
  font-size: 1.2rem;
  letter-spacing: 0.1em;
  color: var(--sg-text-primary);
}
```

### Dialogue / NPC Widget

The NPC speech bubble is an emerald-tinted pane. The portrait border is 3px
ruby. Tone badges follow the jewel assignments: Friendly = emerald,
Hostile = ruby, Guarded = amber, Neutral = sapphire, Desperate = amethyst.

```css
.npc-portrait-border {
  border: 3px solid var(--sg-ruby);
  border-radius: var(--sg-radius);
}

.npc-dialogue-bubble {
  background-color: var(--sg-emerald-tint);
  background-image: var(--sg-pane-gradient);
  border: var(--sg-border);
  border-radius: var(--sg-radius);
  padding: var(--sg-space-md);
  font-family: 'EB Garamond', Georgia, serif;
  font-style: italic;
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--sg-text-primary);
}

.tone-badge { border: var(--sg-border); font-variant: small-caps; letter-spacing: 0.07em; padding: 2px var(--sg-space-sm); border-radius: var(--sg-radius); }
.tone-badge--friendly  { background-color: var(--sg-emerald);   color: var(--sg-text-on-jewel); }
.tone-badge--hostile   { background-color: var(--sg-ruby);      color: var(--sg-text-on-jewel); }
.tone-badge--guarded   { background-color: var(--sg-amber);     color: var(--sg-text-on-jewel); }
.tone-badge--neutral   { background-color: var(--sg-sapphire);  color: var(--sg-text-on-jewel); }
.tone-badge--desperate { background-color: var(--sg-amethyst);  color: var(--sg-text-on-jewel); }
```

### Combat Widget

The initiative bar is a row of sapphire-bordered panes. The enemy HP track
uses ruby. The battlefield SVG background uses `--sg-bg-inset` as fill and
`--sg-lead` as stroke.

```css
.initiative-bar {
  display: flex;
  gap: var(--sg-space-xs);
  border-bottom: var(--sg-border);
  padding-bottom: var(--sg-space-sm);
  margin-bottom: var(--sg-space-md);
}
.initiative-token {
  padding: var(--sg-space-xs) var(--sg-space-sm);
  font-variant: small-caps;
  font-size: 0.8rem;
  border: 1px solid var(--sg-sapphire);
  background-color: var(--sg-sapphire-tint);
  border-radius: var(--sg-radius);
}
.initiative-token--active {
  background-color: var(--sg-sapphire);
  color: var(--sg-text-on-jewel);
  border-color: var(--sg-lead);
}

.enemy-hp-bar-track {
  height: 8px;
  background-color: var(--sg-bg-inset);
  border: 1px solid var(--sg-lead-subtle);
  border-radius: 1px;
}
.enemy-hp-bar-fill {
  height: 100%;
  background-color: var(--sg-ruby);
  border-radius: 1px;
}
```

### Codex / Lore Entry

Codex entries are amethyst-tinted panes. Discovery stamps are small amber
badges. Locked entries are desaturated with a reduced-opacity treatment.

```css
.codex-entry {
  background-color: var(--sg-amethyst-tint);
  background-image: var(--sg-pane-gradient);
  border: var(--sg-border);
  border-radius: var(--sg-radius);
  padding: var(--sg-space-md);
}
.codex-entry--locked {
  opacity: 0.45;
  filter: grayscale(0.6);
}
.discovery-stamp {
  font-size: 0.75rem;
  font-variant: small-caps;
  letter-spacing: 0.07em;
  background-color: var(--sg-amber);
  color: var(--sg-text-on-jewel);
  border: 1px solid var(--sg-lead);
  border-radius: var(--sg-radius);
  padding: 1px var(--sg-space-xs);
}
```

### Scene Footer

The footer is a leaded bar at the bottom of the scene. Panel toggle buttons
are ghost buttons; the Save button is a sapphire primary button.

```css
.scene-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--sg-space-sm);
  border-top: var(--sg-border);
  padding-top: var(--sg-space-sm);
  margin-top: var(--sg-space-md);
}
.scene-footer-left  { display: flex; gap: var(--sg-space-xs); flex-wrap: wrap; }
.scene-footer-right { display: flex; gap: var(--sg-space-xs); }
```

---

## Complete CSS Block

This block is self-contained and can be injected directly into any widget's
`<style>` element. It imports (or falls back from) Google Fonts, declares all
custom properties, and defines all utility classes. No external dependencies
beyond the font stack fallbacks are required.

```css
/* @extract */
/* ═══════════════════════════════════════════════════════════════════════
   STAINED GLASS — Text Adventure Visual Theme
   Inject into any widget <style> block.
   ═══════════════════════════════════════════════════════════════════════ */

/* Google Fonts — may be CSP-blocked; fallback stacks handle that case */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap');

/* ── Custom properties — light mode ─────────────────────────────────── */
:host {
  --sg-bg-page:          #FFF8F0;
  --sg-bg-panel:         #FDF3E7;
  --sg-bg-inset:         #F5EAD8;
  --sg-bg-overlay:       rgba(15, 10, 5, 0.55);
  --sg-lead:             #1A1A1A;
  --sg-lead-subtle:      #3D3020;
  --sg-text-primary:     #1C1208;
  --sg-text-secondary:   #4A3828;
  --sg-text-muted:       #7A6550;
  --sg-text-on-jewel:    #FFF8F0;
  --sg-ruby:             #A8324A;
  --sg-sapphire:         #2660A4;
  --sg-emerald:          #1E7D46;
  --sg-amber:            #C4920A;
  --sg-amethyst:         #7B3F9A;
  --sg-ruby-tint:        #FBF0F2;
  --sg-sapphire-tint:    #EFF4FB;
  --sg-emerald-tint:     #EEF7F2;
  --sg-amber-tint:       #FBF6E8;
  --sg-amethyst-tint:    #F5EFF9;
  --sg-ruby-glow:        #C23A56;
  --sg-sapphire-glow:    #2E73C0;
  --sg-emerald-glow:     #238F50;
  --sg-amber-glow:       #D9A412;
  --sg-amethyst-glow:    #8E4CAF;
  --sg-pane-gradient:    radial-gradient(ellipse at 50% 38%, rgba(255,248,240,0.45) 0%, rgba(255,248,240,0) 70%);
  --sg-border:           2px solid #1A1A1A;
  --sg-border-subtle:    1px solid #3D3020;
  --sg-radius:           2px;
  --sg-radius-btn:       2px;
  --sg-space-xs:         4px;
  --sg-space-sm:         8px;
  --sg-space-md:         16px;
  --sg-space-lg:         24px;
  --sg-space-xl:         40px;
  --sg-panel-pad:        24px;
  --sg-content-max:      720px;
  --sg-gap:              8px;
}

/* ── Custom properties — dark mode ──────────────────────────────────── */
@media (prefers-color-scheme: dark) {
  :host {
    --sg-bg-page:          #0F0F0F;
    --sg-bg-panel:         #181210;
    --sg-bg-inset:         #0A0806;
    --sg-bg-overlay:       rgba(0, 0, 0, 0.75);
    --sg-lead:             #0A0806;
    --sg-lead-subtle:      #2A2018;
    --sg-text-primary:     #F0E8DC;
    --sg-text-secondary:   #C8B89A;
    --sg-text-muted:       #8A7A66;
    --sg-text-on-jewel:    #0F0F0F;
    --sg-ruby:             #9B1B30;
    --sg-sapphire:         #1B4F72;
    --sg-emerald:          #196F3D;
    --sg-amber:            #D4A017;
    --sg-amethyst:         #6C3483;
    --sg-ruby-tint:        #1A0C0F;
    --sg-sapphire-tint:    #0C1420;
    --sg-emerald-tint:     #0C1A12;
    --sg-amber-tint:       #1A1508;
    --sg-amethyst-tint:    #150C1C;
    --sg-ruby-glow:        #C4203B;
    --sg-sapphire-glow:    #2060A0;
    --sg-emerald-glow:     #1E8A4A;
    --sg-amber-glow:       #F0B820;
    --sg-amethyst-glow:    #8040A8;
    --sg-pane-gradient:    radial-gradient(ellipse at 50% 38%, rgba(255,248,220,0.08) 0%, rgba(255,248,220,0) 65%);
    --sg-border:           2px solid #0A0806;
    --sg-border-subtle:    1px solid #2A2018;
  }
}

[data-theme="dark"] {
  --sg-bg-page: #0F0F0F; --sg-bg-panel: #181210; --sg-bg-inset: #0A0806;
  --sg-lead: #0A0806; --sg-lead-subtle: #2A2018;
  --sg-text-primary: #F0E8DC; --sg-text-secondary: #C8B89A; --sg-text-muted: #8A7A66;
  --sg-text-on-jewel: #0F0F0F;
  --sg-ruby: #9B1B30; --sg-sapphire: #1B4F72; --sg-emerald: #196F3D;
  --sg-amber: #D4A017; --sg-amethyst: #6C3483;
  --sg-ruby-tint: #1A0C0F; --sg-sapphire-tint: #0C1420; --sg-emerald-tint: #0C1A12;
  --sg-amber-tint: #1A1508; --sg-amethyst-tint: #150C1C;
  --sg-ruby-glow: #C4203B; --sg-sapphire-glow: #2060A0; --sg-emerald-glow: #1E8A4A;
  --sg-amber-glow: #F0B820; --sg-amethyst-glow: #8040A8;
  --sg-pane-gradient: radial-gradient(ellipse at 50% 38%, rgba(255,248,220,0.08) 0%, rgba(255,248,220,0) 65%);
  --sg-border: 2px solid #0A0806; --sg-border-subtle: 1px solid #2A2018;
}

/* ── Reset and base ──────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }

body, .sg-root {
  background-color: var(--sg-bg-page);
  color: var(--sg-text-primary);
  font-family: 'EB Garamond', 'Palatino Linotype', 'Palatino', 'Book Antiqua', Georgia, serif;
  font-size: 1rem;
  line-height: 1.7;
  margin: 0;
  padding: var(--sg-space-md);
}

/* ── Typography ─────────────────────────────────────────────────────── */
h1, h2, h3, h4 {
  font-family: 'Cinzel', 'EB Garamond', 'Palatino Linotype', Georgia, serif;
  color: var(--sg-text-primary);
  line-height: 1.25;
}
h1 {
  font-size: 2rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.12em;
}
h2 {
  font-size: 1.4rem; font-weight: 600;
  font-variant: small-caps; letter-spacing: 0.08em;
}
h3 {
  font-size: 1.1rem; font-weight: 600;
  font-variant: small-caps; letter-spacing: 0.06em;
}
.sg-label {
  font-size: 0.8rem; font-weight: 400;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--sg-text-muted);
}
code, .sg-mono {
  font-family: 'Courier New', Courier, 'Lucida Console', monospace;
  font-size: 0.85rem;
}

/* ── Pane (core surface) ─────────────────────────────────────────────── */
.sg-pane {
  background-color: var(--sg-bg-panel);
  background-image: var(--sg-pane-gradient);
  border: var(--sg-border);
  border-radius: var(--sg-radius);
  padding: var(--sg-panel-pad);
}
.sg-pane--ruby      { background-color: var(--sg-ruby-tint); }
.sg-pane--sapphire  { background-color: var(--sg-sapphire-tint); }
.sg-pane--emerald   { background-color: var(--sg-emerald-tint); }
.sg-pane--amber     { background-color: var(--sg-amber-tint); }
.sg-pane--amethyst  { background-color: var(--sg-amethyst-tint); }
.sg-pane--inset     { background-color: var(--sg-bg-inset); padding: var(--sg-space-md); }
.sg-raised          { border-width: 3px; }
.sg-divider         { border: none; border-top: var(--sg-border-subtle); margin: var(--sg-space-md) 0; }

/* ── Buttons ─────────────────────────────────────────────────────────── */
.sg-btn {
  font-family: 'Cinzel', 'EB Garamond', Georgia, serif;
  font-size: 0.85rem; font-variant: small-caps;
  letter-spacing: 0.08em; font-weight: 600;
  display: inline-flex; align-items: center; justify-content: center;
  gap: var(--sg-space-xs);
  min-height: 44px; min-width: 44px;
  padding: var(--sg-space-sm) var(--sg-space-md);
  border: var(--sg-border); border-radius: var(--sg-radius-btn);
  cursor: pointer;
  transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease;
  text-decoration: none;
}
.sg-btn--primary   { background-color: var(--sg-sapphire);  color: var(--sg-text-on-jewel); }
.sg-btn--action    { background-color: var(--sg-ruby);      color: var(--sg-text-on-jewel); }
.sg-btn--success   { background-color: var(--sg-emerald);   color: var(--sg-text-on-jewel); }
.sg-btn--magic     { background-color: var(--sg-amethyst);  color: var(--sg-text-on-jewel); }
.sg-btn--ghost     { background-color: transparent; color: var(--sg-text-secondary); border-color: var(--sg-lead-subtle); }
.sg-btn--primary:hover, .sg-btn--primary:focus-visible   { background-color: var(--sg-sapphire-glow); border-color: var(--sg-sapphire-glow); }
.sg-btn--action:hover,  .sg-btn--action:focus-visible    { background-color: var(--sg-ruby-glow);     border-color: var(--sg-ruby-glow); }
.sg-btn--success:hover, .sg-btn--success:focus-visible   { background-color: var(--sg-emerald-glow);  border-color: var(--sg-emerald-glow); }
.sg-btn--magic:hover,   .sg-btn--magic:focus-visible     { background-color: var(--sg-amethyst-glow); border-color: var(--sg-amethyst-glow); }
.sg-btn--ghost:hover,   .sg-btn--ghost:focus-visible     { background-color: var(--sg-bg-inset); color: var(--sg-text-primary); border-color: var(--sg-lead); }
.sg-btn:disabled, .sg-btn[aria-disabled="true"]          { opacity: 0.38; cursor: not-allowed; pointer-events: none; }

/* ── Focus ───────────────────────────────────────────────────────────── */
.sg-btn:focus-visible,
input:focus-visible, select:focus-visible, textarea:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--sg-amber);
  outline-offset: 3px;
}

/* ── Action pills ────────────────────────────────────────────────────── */
.sg-action-pill {
  display: inline-flex; align-items: center;
  min-height: 44px; padding: var(--sg-space-xs) var(--sg-space-md);
  background-color: var(--sg-bg-inset); background-image: var(--sg-pane-gradient);
  border: var(--sg-border-subtle); border-radius: var(--sg-radius);
  font-family: 'EB Garamond', Georgia, serif; font-size: 0.95rem;
  color: var(--sg-text-secondary); cursor: pointer;
  transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease;
  text-decoration: none;
}
.sg-action-pill:hover, .sg-action-pill:focus-visible {
  background-color: var(--sg-sapphire-tint);
  border-color: var(--sg-sapphire); color: var(--sg-text-primary);
}

/* ── Badges ──────────────────────────────────────────────────────────── */
.sg-badge {
  display: inline-block; padding: 2px var(--sg-space-sm);
  font-variant: small-caps; font-family: 'Cinzel', Georgia, serif;
  letter-spacing: 0.08em; font-size: 0.78rem;
  border: var(--sg-border); border-radius: var(--sg-radius);
}
.sg-badge--ruby      { background-color: var(--sg-ruby);      color: var(--sg-text-on-jewel); }
.sg-badge--sapphire  { background-color: var(--sg-sapphire);  color: var(--sg-text-on-jewel); }
.sg-badge--emerald   { background-color: var(--sg-emerald);   color: var(--sg-text-on-jewel); }
.sg-badge--amber     { background-color: var(--sg-amber);     color: var(--sg-text-on-jewel); }
.sg-badge--amethyst  { background-color: var(--sg-amethyst);  color: var(--sg-text-on-jewel); }

/* ── Tone badges ─────────────────────────────────────────────────────── */
.tone-badge { border: var(--sg-border); font-variant: small-caps; letter-spacing: 0.07em; padding: 2px var(--sg-space-sm); border-radius: var(--sg-radius); font-size: 0.78rem; }
.tone-badge--friendly  { background-color: var(--sg-emerald);  color: var(--sg-text-on-jewel); }
.tone-badge--hostile   { background-color: var(--sg-ruby);     color: var(--sg-text-on-jewel); }
.tone-badge--guarded   { background-color: var(--sg-amber);    color: var(--sg-text-on-jewel); }
.tone-badge--neutral   { background-color: var(--sg-sapphire); color: var(--sg-text-on-jewel); }
.tone-badge--desperate { background-color: var(--sg-amethyst); color: var(--sg-text-on-jewel); }

/* ── Outcome badges ──────────────────────────────────────────────────── */
.outcome-badge { display: inline-block; padding: var(--sg-space-xs) var(--sg-space-md); font-variant: small-caps; font-family: 'Cinzel', Georgia, serif; letter-spacing: 0.1em; border: var(--sg-border); border-radius: var(--sg-radius); }
.outcome-badge--crit-success { background-color: var(--sg-emerald);  color: var(--sg-text-on-jewel); }
.outcome-badge--success      { background-color: var(--sg-sapphire); color: var(--sg-text-on-jewel); }
.outcome-badge--partial      { background-color: var(--sg-amber);    color: var(--sg-text-on-jewel); }
.outcome-badge--failure      { background-color: var(--sg-ruby);     color: var(--sg-text-on-jewel); }
.outcome-badge--crit-failure { background-color: var(--sg-amethyst); color: var(--sg-text-on-jewel); }

/* ── HP pips and XP bar ──────────────────────────────────────────────── */
.hp-pips      { display: flex; gap: 4px; align-items: center; }
.hp-pip       { width: 12px; height: 12px; border-radius: 50%; background-color: var(--sg-ruby); border: 1px solid var(--sg-lead); }
.hp-pip--empty { background-color: var(--sg-bg-inset); }
.xp-bar-track  { flex: 1; height: 6px; background-color: var(--sg-bg-inset); border: 1px solid var(--sg-lead-subtle); border-radius: 1px; overflow: hidden; }
.xp-bar-fill   { height: 100%; background-color: var(--sg-emerald); border-radius: 1px; }

/* ── Die face ────────────────────────────────────────────────────────── */
.die-face {
  width: 72px; height: 72px; display: grid; place-items: center;
  font-family: 'Cinzel', Georgia, serif; font-size: 2rem; font-weight: 700;
  color: var(--sg-text-primary);
  background-color: var(--sg-bg-panel); background-image: var(--sg-pane-gradient);
  border: var(--sg-border); border-radius: var(--sg-radius); margin: 0 auto;
}

/* ── Location bar ────────────────────────────────────────────────────── */
.loc-bar {
  font-family: 'Cinzel', Georgia, serif; font-variant: small-caps;
  font-size: 1.1rem; letter-spacing: 0.1em; color: var(--sg-text-secondary);
  border-bottom: var(--sg-border); padding-bottom: var(--sg-space-sm);
  margin-bottom: var(--sg-space-md);
}

/* ── Atmosphere pills ────────────────────────────────────────────────── */
.atmo-strip { display: flex; flex-wrap: wrap; gap: var(--sg-space-xs); margin-bottom: var(--sg-space-md); }
.atmo-pill {
  display: inline-block; padding: 3px var(--sg-space-sm);
  background-color: var(--sg-amber-tint); border: 1px solid var(--sg-amber);
  border-radius: var(--sg-radius); font-size: 0.78rem; font-variant: small-caps;
  letter-spacing: 0.07em; color: var(--sg-text-secondary);
}

/* ── Narrative ───────────────────────────────────────────────────────── */
.narrative { font-size: 1.05rem; line-height: 1.75; color: var(--sg-text-primary); margin: var(--sg-space-md) 0; }
.narrative p + p { margin-top: var(--sg-space-sm); }

/* ── Status bar ──────────────────────────────────────────────────────── */
.status-bar {
  display: flex; align-items: center; gap: var(--sg-space-md);
  padding: var(--sg-space-sm) 0; border-top: var(--sg-border-subtle);
  margin-top: var(--sg-space-md); flex-wrap: wrap;
}

/* ── Scene footer ────────────────────────────────────────────────────── */
.scene-footer {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: var(--sg-space-sm);
  border-top: var(--sg-border); padding-top: var(--sg-space-sm);
  margin-top: var(--sg-space-md);
}
.scene-footer-left  { display: flex; gap: var(--sg-space-xs); flex-wrap: wrap; }
.scene-footer-right { display: flex; gap: var(--sg-space-xs); }

/* ── Panel overlay ───────────────────────────────────────────────────── */
.panel-overlay { opacity: 0; pointer-events: none; }
.panel-overlay.visible { opacity: 1; pointer-events: auto; }
.panel-header {
  display: flex; align-items: baseline; justify-content: space-between;
  border-bottom: var(--sg-border); padding-bottom: var(--sg-space-sm);
  margin-bottom: var(--sg-space-md);
}
.panel-title {
  font-family: 'Cinzel', Georgia, serif; font-variant: small-caps;
  font-size: 1.2rem; letter-spacing: 0.1em; color: var(--sg-text-primary);
}
.panel-content { display: none; }

/* ── Inventory tag ───────────────────────────────────────────────────── */
.inv-tag {
  display: inline-block; padding: 2px var(--sg-space-xs);
  font-size: 0.75rem; font-variant: small-caps; letter-spacing: 0.05em;
  background-color: var(--sg-bg-inset); border: var(--sg-border-subtle);
  border-radius: var(--sg-radius); color: var(--sg-text-muted);
}

/* ── Screen-reader only ──────────────────────────────────────────────── */
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0;
  margin: -1px; overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}

/* ── Animations (motion-safe) ────────────────────────────────────────── */
@media (prefers-reduced-motion: no-preference) {
  @keyframes sg-panel-enter {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes sg-pulse {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.06); }
    100% { transform: scale(1); }
  }
  @keyframes sg-dice-spin {
    0%   { transform: rotate(0deg)   scale(1.0); }
    50%  { transform: rotate(180deg) scale(1.1); }
    100% { transform: rotate(360deg) scale(1.0); }
  }
  @keyframes sg-hp-lost {
    0%   { background-color: var(--sg-ruby); }
    100% { background-color: var(--sg-bg-inset); }
  }
  .panel-overlay          { transition: opacity 200ms ease; }
  .panel-overlay.entering { animation: sg-panel-enter 220ms ease forwards; }
  .sg-btn                 { transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease; }
  .sg-action-pill         { transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease; }
  .outcome-badge--crit-success,
  .outcome-badge--crit-failure { animation: sg-pulse 400ms ease 1; }
  .die-face--rolling       { animation: sg-dice-spin 600ms ease-in-out 1; }
  .hp-pip--lost            { animation: sg-hp-lost 400ms ease forwards; }
}

/* ── Animations (reduced motion) ─────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .panel-overlay { transition: none; }
}
```
