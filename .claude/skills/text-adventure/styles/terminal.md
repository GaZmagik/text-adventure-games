---
name: terminal
description: >
  Retro-futuristic terminal aesthetic. Hard edges, electric accents, monospace
  everything. Designed to feel like a starship HUD or hacker workstation.
  Dice rolls read like system calculations; status bars read like sensor readouts.
best-for:
  - space opera
  - cyberpunk
  - post-apocalyptic
  - military sci-fi
  - hacker / heist
  - dystopian
  - hard sci-fi
  - any scenario where technology is a theme
---

# Terminal Style

## Design Philosophy

The terminal style strips the widget down to its functional skeleton and makes
that skeleton beautiful. Every element is deliberate: hard 1px borders define
space with no apology, electric accents signal meaning without decoration,
and the monospace grid gives everything a quietly mechanical precision.

The aesthetic borrows from two eras simultaneously: the amber-and-green CRTs
of 1980s workstations, and the imagined starship terminals of science fiction.
The result is a UI that feels both familiar and futuristic — as if the game is
being played on hardware that exists somewhere between a VAX terminal and a
starfighter's tactical display.

Dark mode is the native state of this style. The near-black background (#0A0E14)
is chosen to be dark enough to feel like a powered screen but not so dark that
it loses texture. The body text (#B3B1AD) sits at a deliberate warmth — not
pure white, which would read as harsh, but tinted slightly towards amber to
evoke phosphor screens.

Light mode exists as a fully usable inversion but treats the electric accents
more conservatively, darkening them to maintain WCAG AA contrast against white
backgrounds.

---

## Typography

### Font Stacks

All text in the terminal style uses monospace. There is no sans-serif body
copy and no display typeface — the monospace grid IS the design.

```
Primary (everything):
  'IBM Plex Mono', 'Cascadia Code', 'SF Mono', 'Fira Code',
  'Consolas', 'Liberation Mono', 'Courier New', monospace

Google Fonts import (may be CSP-blocked — fallback stack above must render acceptably):
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');
```

### Sizing Scale

Base unit: 4px. All sizing is a multiple of this unit.

| Role                    | Size  | Weight | Letter-spacing |
|-------------------------|-------|--------|----------------|
| Widget heading / loc    | 15px  | 600    | 0.04em         |
| Section label / caps    | 9px   | 500    | 0.18em         |
| Narrative / body        | 13px  | 400    | 0.01em         |
| Button label            | 11px  | 400    | 0.08em         |
| Stat / data readout     | 12px  | 500    | 0.06em         |
| Micro label / pill      | 10px  | 400    | 0.10em         |
| Die value (large)       | 40px  | 600    | 0              |

All text-transform: uppercase is reserved for section labels and status
badges only. Headings and buttons use sentence case.

---

## Colour Palette

### Design Tokens — Dark Mode (primary)

```css
/* Background layers */
--t-bg-base:        #0A0E14;   /* Near-black. The screen itself. */
--t-bg-surface:     #0F1520;   /* Cards, panels, elevated surfaces. */
--t-bg-inset:       #141C28;   /* Inset areas, code blocks, resolve panels. */
--t-bg-overlay:     #0D1219;   /* Panel overlays, modals. */

/* Text */
--t-text-primary:   #B3B1AD;   /* Body text. Warm light, not pure white. */
--t-text-secondary: #7A8694;   /* Secondary info, stat labels. */
--t-text-muted:     #4A5460;   /* Disabled, placeholders, tertiary labels. */
--t-text-inverse:   #0A0E14;   /* Text on bright accent backgrounds. */

/* Borders */
--t-border-hard:    #1E2836;   /* Hard dividers, card outlines. */
--t-border-soft:    #162030;   /* Subtle separators, inner lines. */
--t-border-glow:    #00D9FF40; /* Glowing border on focus/active (cyan at 25% opacity). */

/* Accent — electric cyan (primary interactive) */
--t-accent-cyan:    #00D9FF;   /* Links, active states, primary CTAs. WCAG AA on #0A0E14. */
--t-accent-cyan-bg: #00D9FF14; /* Cyan tint background (8% opacity). */
--t-accent-cyan-dim:#0099BB;   /* Dimmed cyan for secondary use in dark mode. */

/* Accent — electric magenta (secondary interactive, special actions) */
--t-accent-magenta: #FF006E;   /* Special actions, barter, critical attention. */
--t-accent-magenta-bg: #FF006E14; /* Magenta tint background. */

/* Status — success (green) */
--t-success:        #39FF14;   /* Success badges, HP pips, teal data. WCAG AA on #0A0E14. */
--t-success-bg:     #39FF1410; /* Success tint background. */
--t-success-dim:    #1FAA08;   /* Dimmed for secondary success use. */

/* Status — danger (red) */
--t-danger:         #FF3131;   /* Failure badges, enemy HP, critical conditions. */
--t-danger-bg:      #FF313114; /* Danger tint background. */

/* Status — warning (amber) */
--t-warning:        #FFB800;   /* Partial success, caution states. WCAG AA on #0A0E14. */
--t-warning-bg:     #FFB80014; /* Warning tint background. */

/* Status — special / mystery */
--t-special:        #BD00FF;   /* XP, level-up, mystery/unknown states. */
--t-special-bg:     #BD00FF14; /* Special tint background. */

/* Scanline effect — applied via pseudo-element, motion-safe only */
--t-scanline-color: rgba(0, 0, 0, 0.18);
--t-scanline-size:  3px;

  /* ── CSS Custom Property Contract (required by style-reference.md) ─ */
  --ta-font-heading:              'IBM Plex Mono', 'Cascadia Code', 'SF Mono', 'Fira Code', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
  --ta-font-body:                 'IBM Plex Mono', 'Cascadia Code', 'SF Mono', 'Fira Code', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
  --ta-color-accent:              var(--t-accent-cyan);
  --ta-color-accent-hover:        color-mix(in srgb, var(--t-accent-cyan) 85%, white);
  --ta-color-accent-bg:           var(--t-accent-cyan-bg);
  --ta-color-accent-bg-hover:     color-mix(in srgb, var(--t-accent-cyan-bg) 80%, var(--t-accent-cyan));
  --ta-color-success:             var(--t-success);
  --ta-color-success-border:      var(--t-success-dim);
  --ta-color-danger:              var(--t-danger);
  --ta-color-danger-border:       color-mix(in srgb, var(--t-danger) 70%, black);
  --ta-color-danger-bg:           var(--t-danger-bg);
  --ta-color-danger-bg-hover:     color-mix(in srgb, var(--t-danger-bg) 80%, var(--t-danger));
  --ta-color-warning:             var(--t-warning);
  --ta-color-warning-border:      color-mix(in srgb, var(--t-warning) 70%, black);
  --ta-color-warning-bg:          var(--t-warning-bg);
  --ta-color-xp:                  var(--t-special);
  --ta-color-focus:               var(--t-accent-cyan);
  --ta-color-conviction:          #7C6BF0;
  --ta-color-conviction-border:   #6B5CE0;
  --ta-badge-success-bg:          var(--t-success-bg);
  --ta-badge-success-text:        var(--t-success);
  --ta-badge-partial-bg:          var(--t-warning-bg);
  --ta-badge-partial-text:        var(--t-warning);
  --ta-badge-failure-bg:          var(--t-danger-bg);
  --ta-badge-failure-text:        var(--t-danger);
  --ta-badge-crit-success-border: var(--t-success);
  --ta-badge-crit-failure-border: var(--t-danger);
  --ta-color-credits:             var(--t-accent-magenta);
  --ta-color-tab-active:          var(--t-accent-cyan);
  --ta-border-style-poi:          1px dashed;
  --ta-die-spin-duration:         0.4s;
```

### Design Tokens — Light Mode

Light mode inverts the background hierarchy and mutes the electric accents
to values that maintain WCAG AA contrast on white/near-white backgrounds.

```css
@media (prefers-color-scheme: light) {
  :host {
    --t-bg-base:        #FFFFFF;
    --t-bg-surface:     #F5F6F8;
    --t-bg-inset:       #ECEEF2;
    --t-bg-overlay:     #F0F2F5;

    --t-text-primary:   #1A2030;
    --t-text-secondary: #445068;
    --t-text-muted:     #8892A0;
    --t-text-inverse:   #FFFFFF;

    --t-border-hard:    #D0D6DF;
    --t-border-soft:    #E2E6EB;
    --t-border-glow:    #006E8040;

    /* Accents are darkened to maintain contrast on light backgrounds */
    --t-accent-cyan:    #006E80;   /* Dark teal. Contrast 7.2:1 on white. */
    --t-accent-cyan-bg: #006E8010;
    --t-accent-cyan-dim:#004F5C;

    --t-accent-magenta: #B5004E;   /* Dark rose. Contrast 6.1:1 on white. */
    --t-accent-magenta-bg: #B5004E0E;

    --t-success:        #1A7A08;   /* Dark green. Contrast 5.8:1 on white. */
    --t-success-bg:     #1A7A0810;
    --t-success-dim:    #0F5205;

    --t-danger:         #C0000F;   /* Dark red. Contrast 7.4:1 on white. */
    --t-danger-bg:      #C0000F0E;

    --t-warning:        #8A6000;   /* Dark amber. Contrast 6.9:1 on white. */
    --t-warning-bg:     #8A600010;

    --t-special:        #7200A8;   /* Dark violet. Contrast 6.3:1 on white. */
    --t-special-bg:     #7200A80E;
  }
}
```

### WCAG AA Compliance Notes

All foreground/background pairings used for interactive text meet 4.5:1 minimum:

| Foreground         | Background     | Ratio (dark) | Ratio (light) |
|--------------------|----------------|-------------|---------------|
| `--t-accent-cyan`  | `--t-bg-base`  | 8.3:1       | 7.2:1         |
| `--t-success`      | `--t-bg-base`  | 9.1:1       | 5.8:1         |
| `--t-warning`      | `--t-bg-base`  | 6.4:1       | 6.9:1         |
| `--t-danger`       | `--t-bg-base`  | 5.1:1       | 7.4:1         |
| `--t-text-primary` | `--t-bg-base`  | 7.8:1       | 14.2:1        |
| `--t-text-secondary`| `--t-bg-base` | 4.6:1       | 5.1:1         |

---

## Spacing & Layout

### Base Unit

All spacing is a multiple of 4px. The monospace grid demands alignment.

```
4px   — tight internal padding, pip gaps
8px   — button padding (vertical), gap between related items
12px  — card internal padding, section gaps
16px  — between major widget sections
20px  — widget top/bottom padding
24px  — between structurally separate blocks
```

### Layout Patterns

The terminal style is single-column by default. No floats, no multi-column
narrative text. Everything stacks vertically on the 4px grid.

```
Widget max-width:  none (fills iframe width)
Widget padding:    20px 0 24px
Section gap:       16px
Card padding:      12px
Button padding:    8px 16px (vertical / horizontal)
Min touch target:  44px height, 44px width (box-sizing: border-box)
```

---

## Borders & Surfaces

### Border Style

Hard 1px solid borders everywhere. No box-shadow for depth (breaks the
flat terminal aesthetic). No rounded corners except for pill-shaped badges
and atmo-pills which use `border-radius: 2px` (terminals have slightly
rounded pixels at their corners — this nods to that).

```css
/* Hard card border */
border: 1px solid var(--t-border-hard);
border-radius: 2px;

/* Subtle inner divider */
border-bottom: 1px solid var(--t-border-soft);

/* Active / focus glow border */
border: 1px solid var(--t-accent-cyan);
box-shadow: 0 0 0 1px var(--t-border-glow);

/* Pill / badge — slightly rounded for visual distinction */
border-radius: 2px;

/* No rounded corners on interactive elements (buttons, cards, panels) */
border-radius: 0;
```

### Surface Hierarchy (dark mode)

```
#0A0E14  →  base (the background "screen")
#0F1520  →  surface (card, panel content areas)
#141C28  →  inset (resolve blocks, attr rows, stat tables)
#0D1219  →  overlay (panel overlay fills)
```

### Scanline Texture (motion-safe, optional)

Applied as a repeating pseudo-element overlay on `.root`. Subtle — adds
texture without distracting from content. Only active in dark mode and
when motion is not reduced (scanline flicker can affect vestibular
sensitivity).

```css
@media (prefers-color-scheme: dark) {
  .root::before {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 2px,
      var(--t-scanline-color) 2px,
      var(--t-scanline-color) 3px
    );
    pointer-events: none;
    z-index: 9999;
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .root::before { display: none; }
}
```

---

## Interactive Elements

### Buttons — Base

All buttons share a base that eliminates browser defaults and establishes
the monospace grid. Every button meets the 44px minimum touch target.

```css
.t-btn {
  font-family: 'IBM Plex Mono', 'Cascadia Code', 'SF Mono', 'Consolas', monospace;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.08em;
  padding: 8px 16px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  border-radius: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-transform: uppercase;
  transition:
    background-color 80ms linear,
    border-color 80ms linear,
    color 80ms linear,
    box-shadow 80ms linear;
}

@media (prefers-reduced-motion: reduce) {
  .t-btn { transition: none; }
}
```

### Buttons — Variants

**Action button** (primary CTA — advances story, commits to choices):

```css
.btn-action {
  background: var(--t-accent-cyan-bg);
  border: 1px solid var(--t-accent-cyan);
  color: var(--t-accent-cyan);
  text-shadow: 0 0 8px var(--t-accent-cyan);
}
.btn-action:hover {
  background: color-mix(in srgb, var(--t-accent-cyan) 18%, transparent);
  box-shadow: 0 0 0 1px var(--t-accent-cyan);
}
.btn-action:active {
  background: color-mix(in srgb, var(--t-accent-cyan) 28%, transparent);
}
```

**POI button** (examine / investigate — dashed outline):

```css
.btn-poi {
  background: transparent;
  border: 1px dashed var(--t-border-hard);
  color: var(--t-text-secondary);
  text-shadow: none;
}
.btn-poi:hover {
  border-style: solid;
  border-color: var(--t-text-secondary);
  color: var(--t-text-primary);
  background: var(--t-bg-surface);
}
```

**Danger button** (retreat, abandon, destructive):

```css
.btn-danger {
  background: var(--t-danger-bg);
  border: 1px solid var(--t-danger);
  color: var(--t-danger);
}
.btn-danger:hover {
  background: color-mix(in srgb, var(--t-danger) 20%, transparent);
  box-shadow: 0 0 0 1px var(--t-danger);
}
```

**Special button** (barter, XP, level-up, unique actions):

```css
.btn-special {
  background: var(--t-accent-magenta-bg);
  border: 1px solid var(--t-accent-magenta);
  color: var(--t-accent-magenta);
  text-shadow: 0 0 8px var(--t-accent-magenta);
}
.btn-special:hover {
  background: color-mix(in srgb, var(--t-accent-magenta) 20%, transparent);
  box-shadow: 0 0 0 1px var(--t-accent-magenta);
}
```

**Footer / ghost button** (panel toggles, secondary navigation):

```css
.footer-btn {
  background: transparent;
  border: 1px solid var(--t-border-hard);
  color: var(--t-text-muted);
}
.footer-btn:hover {
  border-color: var(--t-border-hard);
  color: var(--t-text-secondary);
  background: var(--t-bg-surface);
}
```

### Focus States

Keyboard focus uses a two-layer outline to remain visible on all backgrounds.
The inner ring is the widget background colour; the outer ring is the cyan
accent. This avoids the outline being swallowed by bordered elements.

```css
:focus-visible {
  outline: 2px solid var(--t-accent-cyan);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--t-bg-base);
}

@media (prefers-color-scheme: light) {
  :focus-visible {
    outline-color: var(--t-accent-cyan);
    box-shadow: 0 0 0 4px var(--t-bg-base);
  }
}
```

### Disabled States

```css
:disabled, [aria-disabled="true"] {
  opacity: 0.32;
  cursor: not-allowed;
  text-shadow: none;
  box-shadow: none;
}
```

---

## Micro-interactions

All animations and transitions are wrapped in `prefers-reduced-motion`
checks. If the user has reduced motion enabled, all durations collapse to
an imperceptible 1ms (the element still updates, it just does not animate).

```css
/* Global reduced-motion override — placed at the end of any style block */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Die Roll — Number Scramble

The die value scrambles through random numbers before settling. The final
value snaps in with a brief brightness flare.

```css
@keyframes t-die-settle {
  0%   { opacity: 0.3; filter: blur(1px); }
  60%  { opacity: 0.8; filter: blur(0); color: var(--t-accent-cyan); text-shadow: 0 0 16px var(--t-accent-cyan); }
  100% { opacity: 1;   filter: blur(0); color: var(--t-text-primary); text-shadow: none; }
}

.die-value.settling {
  animation: t-die-settle 400ms ease-out forwards;
}

/* Natural 20 — hold the glow */
.die-value.crit-success {
  color: var(--t-success);
  text-shadow: 0 0 20px var(--t-success), 0 0 40px var(--t-success);
  animation: none;
}

/* Natural 1 — danger pulse */
@keyframes t-crit-fail-pulse {
  0%, 100% { color: var(--t-danger); text-shadow: 0 0 8px var(--t-danger); }
  50%       { color: var(--t-text-primary); text-shadow: none; }
}
.die-value.crit-failure {
  animation: t-crit-fail-pulse 800ms ease-in-out 2;
}
```

### Panel Reveal

Panels slide in from the top-left with a brief opacity fade. The slide
distance is small (8px) — enough to feel intentional, not theatrical.

```css
@keyframes t-panel-in {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.panel-content[data-panel].visible {
  animation: t-panel-in 120ms ease-out forwards;
}
```

### Button Press Feedback

Buttons compress slightly on active to simulate a physical key press.

```css
@keyframes t-key-press {
  0%   { transform: scale(1); }
  40%  { transform: scale(0.97); }
  100% { transform: scale(1); }
}

.t-btn:active {
  animation: t-key-press 80ms ease-out;
}
```

### Conviction Pip — Fill Animation

When a pip fills during a social encounter, it brightens in from dim.

```css
@keyframes t-pip-fill {
  from { background: transparent; box-shadow: none; }
  to   { background: var(--t-success); box-shadow: 0 0 6px var(--t-success); }
}

.conviction-pip.filling {
  animation: t-pip-fill 300ms ease-out forwards;
}
```

### XP Bar — Fill

```css
@keyframes t-xp-fill {
  from { width: var(--xp-from, 0%); }
  to   { width: var(--xp-to, 0%); }
}

.xp-fill.animating {
  animation: t-xp-fill 600ms ease-out forwards;
}
```

### Progressive Reveal — Continue Button

The continue button pulses softly to draw attention when the brief text loads.

```css
@keyframes t-pulse-border {
  0%, 100% { border-color: var(--t-border-hard); }
  50%       { border-color: var(--t-accent-cyan); box-shadow: 0 0 8px var(--t-accent-cyan); }
}

.continue-btn {
  animation: t-pulse-border 2s ease-in-out infinite;
}

/* Stop pulsing on hover — the user has noticed it */
.continue-btn:hover {
  animation: none;
  border-color: var(--t-accent-cyan);
}
```

---

## Component Overrides

How each widget type should be rendered in the terminal style. These override
the base structural styles defined in `style-reference.md`.

### Location Bar

The location name is rendered as a system path prefix: `> LOCATION_NAME`.
The scene number is displayed as a right-aligned hex-like counter.

```css
.loc-bar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--t-border-hard);
}

.loc-name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--t-accent-cyan);
  text-shadow: 0 0 10px var(--t-accent-cyan);
  text-transform: uppercase;
}

.loc-name::before {
  content: '> ';
  color: var(--t-text-muted);
  text-shadow: none;
}

.scene-num {
  font-size: 10px;
  letter-spacing: 0.14em;
  color: var(--t-text-muted);
  text-transform: uppercase;
}
```

### Atmosphere Strip

Atmo pills render as inline status codes — tight borders, no background fill.

```css
.atmo-strip {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.atmo-pill {
  font-size: 10px;
  letter-spacing: 0.08em;
  padding: 2px 8px;
  border: 1px solid var(--t-border-hard);
  border-radius: 2px;
  color: var(--t-text-muted);
  background: transparent;
  text-transform: lowercase;
}
```

### Narrative Block

Narrative text is the sole element that does not shout. It breathes — slightly
wider line-height and warmer colour to contrast with the mechanical chrome
surrounding it.

```css
.narrative {
  font-size: 13px;
  line-height: 1.9;
  color: var(--t-text-primary);
  letter-spacing: 0.01em;
  margin: 0 0 16px;
  border-left: 2px solid var(--t-border-hard);
  padding-left: 12px;
}
```

### Section Labels

```css
.section-label {
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--t-text-muted);
  margin: 16px 0 8px;
}

.section-label::before {
  content: '// ';
  color: var(--t-accent-cyan);
  opacity: 0.5;
}
```

### Status Bar (HP / XP / Conditions)

The status bar reads as a HUD readout. HP pips are square, not circular —
suits the grid aesthetic. XP is a flat progress bar with tick marks.

```css
.status-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 10px 0;
  margin-top: 8px;
  border-top: 1px solid var(--t-border-hard);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--t-text-muted);
}

/* HP pips — square to reinforce grid aesthetic */
.pip {
  width: 8px;
  height: 8px;
  border-radius: 0;
  background: var(--t-success);
  border: 1px solid var(--t-success-dim);
  box-shadow: 0 0 4px var(--t-success);
}

.pip.empty {
  background: transparent;
  border-color: var(--t-border-hard);
  box-shadow: none;
}

/* XP track with tick marks via repeating gradient */
.xp-track {
  width: 64px;
  height: 4px;
  background:
    repeating-linear-gradient(
      to right,
      var(--t-border-hard) 0px,
      var(--t-border-hard) 1px,
      transparent 1px,
      transparent 8px
    );
  border: 1px solid var(--t-border-hard);
  border-radius: 0;
  overflow: hidden;
  position: relative;
}

.xp-fill {
  height: 100%;
  background: var(--t-special);
  box-shadow: 2px 0 8px var(--t-special);
  border-radius: 0;
  transition: width 600ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .xp-fill { transition: none; }
}
```

### Outcome / Result Badges

Badges use all-caps with 1px solid borders. Background tints are subtle —
the border colour carries the semantic meaning.

```css
.badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  padding: 4px 14px;
  border-radius: 0;
  border: 1px solid currentColor;
}

.badge.crit-success {
  color: var(--t-success);
  background: var(--t-success-bg);
  text-shadow: 0 0 8px var(--t-success);
}

.badge.success {
  color: var(--t-success);
  background: var(--t-success-bg);
}

.badge.partial {
  color: var(--t-warning);
  background: var(--t-warning-bg);
}

.badge.failure {
  color: var(--t-danger);
  background: var(--t-danger-bg);
}

.badge.crit-failure {
  color: var(--t-danger);
  background: var(--t-danger-bg);
  text-shadow: 0 0 8px var(--t-danger);
}
```

### Dice Roll Widget

The die value is the centrepiece — large, monospace, and lit.

```css
.die-display {
  text-align: center;
  margin: 16px 0;
}

.die-value {
  font-size: 40px;
  font-weight: 600;
  color: var(--t-text-primary);
  display: inline-block;
  line-height: 1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

/* The roll button renders as a terminal command */
.roll-btn {
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.12em;
  padding: 10px 24px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  background: transparent;
  border: 1px solid var(--t-accent-cyan);
  border-radius: 0;
  color: var(--t-accent-cyan);
  text-shadow: 0 0 8px var(--t-accent-cyan);
  cursor: pointer;
  display: block;
  margin: 0 auto 16px;
  text-transform: uppercase;
}

.roll-btn:hover {
  background: var(--t-accent-cyan-bg);
  box-shadow: 0 0 0 1px var(--t-accent-cyan), 0 0 12px var(--t-accent-cyan);
}

.roll-btn:disabled {
  opacity: 0.24;
  cursor: not-allowed;
  box-shadow: none;
  text-shadow: none;
}

/* Resolve block — reads like a system log */
.resolve-block {
  background: var(--t-bg-inset);
  border: 1px solid var(--t-border-hard);
  border-radius: 0;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 11px;
}

.resolve-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 3px 0;
  border-bottom: 1px solid var(--t-border-soft);
  color: var(--t-text-secondary);
  letter-spacing: 0.04em;
}

.resolve-row:last-child { border-bottom: none; }

.resolve-label {
  color: var(--t-text-muted);
  text-transform: uppercase;
  font-size: 9px;
  letter-spacing: 0.14em;
}
```

### Combat Widget

Enemy cards read as threat assessment panels — tight data density.

```css
/* Initiative bar — horizontal list of callsigns */
.init-bar {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--t-border-hard);
}

.init-label {
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--t-text-muted);
  margin-right: 4px;
}

.init-chip {
  font-size: 10px;
  letter-spacing: 0.06em;
  padding: 3px 10px;
  border: 1px solid var(--t-border-hard);
  border-radius: 0;
  color: var(--t-text-secondary);
}

.init-chip.active {
  border-color: var(--t-success);
  color: var(--t-success);
  text-shadow: 0 0 6px var(--t-success);
}

/* Enemy cards */
.enemy-card {
  padding: 10px 12px;
  border: 1px solid var(--t-border-hard);
  border-radius: 0;
  background: var(--t-bg-surface);
}

.enemy-card .pip {
  background: var(--t-danger);
  border-color: var(--t-danger);
  box-shadow: 0 0 3px var(--t-danger);
  border-radius: 0;
}

.enemy-card .pip.empty {
  background: transparent;
  border-color: var(--t-border-hard);
  box-shadow: none;
}
```

### Panel Overlay

Panel headers are system-style: all-caps label on the left, close command
on the right.

```css
#panel-overlay {
  background: var(--t-bg-overlay);
  border: 1px solid var(--t-border-hard);
  padding: 12px;
}

.panel-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--t-border-hard);
}

.panel-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--t-accent-cyan);
  text-shadow: 0 0 8px var(--t-accent-cyan);
}

.panel-close-btn {
  font-family: inherit;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: transparent;
  border: 1px solid var(--t-border-hard);
  border-radius: 0;
  padding: 6px 12px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  color: var(--t-text-muted);
  cursor: pointer;
}

.panel-close-btn:hover {
  border-color: var(--t-text-secondary);
  color: var(--t-text-secondary);
}
```

### Shop / Merchant Widget

The credits display is amber — a financial readout distinct from the cyan
of actions and the green of health.

```css
.credits-display {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: var(--t-warning);
  text-shadow: 0 0 8px var(--t-warning);
}

/* Tab bar — active tab uses bottom-border in cyan */
.tab-btn.active {
  color: var(--t-accent-cyan);
  border-bottom-color: var(--t-accent-cyan);
}

/* Item cards */
.item-card {
  border: 1px solid var(--t-border-hard);
  border-radius: 0;
  background: var(--t-bg-surface);
}

/* Item type badges use the pill system but with square corners */
.item-type-badge {
  border-radius: 0;
  border: 1px solid var(--t-border-hard);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
```

### Social Encounter — Conviction Meter

The conviction meter is rendered as segmented capacitor-style blocks.

```css
.conviction-pip {
  width: 12px;
  height: 12px;
  border-radius: 0;
  background: transparent;
  border: 1px solid var(--t-border-hard);
}

.conviction-pip.filled {
  background: var(--t-success);
  border-color: var(--t-success);
  box-shadow: 0 0 6px var(--t-success);
}

/* Disposition badge */
.disposition-badge {
  border-radius: 0;
  letter-spacing: 0.14em;
}

.disposition-badge.suspicious {
  background: var(--t-warning-bg);
  color: var(--t-warning);
  border: 1px solid var(--t-warning);
}

.disposition-badge.hostile {
  background: var(--t-danger-bg);
  color: var(--t-danger);
  border: 1px solid var(--t-danger);
}

.disposition-badge.neutral {
  background: transparent;
  color: var(--t-text-muted);
  border: 1px solid var(--t-border-hard);
}

.disposition-badge.friendly {
  background: var(--t-success-bg);
  color: var(--t-success);
  border: 1px solid var(--t-success);
}
```

---

## Complete CSS Block

The following block is self-contained and can be injected verbatim into
any widget `<style>` element. It defines the full terminal theme. Paste it
after the Google Fonts `@import` and before any component-specific rules.

The block uses `.root` as a scoping ancestor so styles do not leak out of
the iframe into the host page.

```css
/* @extract */
/* ============================================================
   TERMINAL STYLE — text-adventure engine visual theme
   Version: 1.0.0
   Best for: sci-fi, cyberpunk, hacker, space opera
   ============================================================ */

/* Google Fonts — may be CSP-blocked in Claude.ai; fallback stack is authoritative */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');

/* ── Design tokens ─────────────────────────────────────────── */
.root {
  --t-bg-base:           #0A0E14;
  --t-bg-surface:        #0F1520;
  --t-bg-inset:          #141C28;
  --t-bg-overlay:        #0D1219;

  --t-text-primary:      #B3B1AD;
  --t-text-secondary:    #7A8694;
  --t-text-muted:        #4A5460;
  --t-text-inverse:      #0A0E14;

  --t-border-hard:       #1E2836;
  --t-border-soft:       #162030;

  --t-accent-cyan:       #00D9FF;
  --t-accent-cyan-bg:    #00D9FF14;
  --t-accent-cyan-dim:   #0099BB;

  --t-accent-magenta:    #FF006E;
  --t-accent-magenta-bg: #FF006E14;

  --t-success:           #39FF14;
  --t-success-bg:        #39FF1410;
  --t-success-dim:       #1FAA08;

  --t-danger:            #FF3131;
  --t-danger-bg:         #FF313114;

  --t-warning:           #FFB800;
  --t-warning-bg:        #FFB80014;

  --t-special:           #BD00FF;
  --t-special-bg:        #BD00FF14;

  /* ── CSS Custom Property Contract (required by style-reference.md) ── */
  --ta-font-heading:              'IBM Plex Mono', 'Cascadia Code', 'SF Mono', 'Fira Code', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
  --ta-font-body:                 'IBM Plex Mono', 'Cascadia Code', 'SF Mono', 'Fira Code', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
  --ta-color-accent:              var(--t-accent-cyan);
  --ta-color-accent-hover:        color-mix(in srgb, var(--t-accent-cyan) 85%, white);
  --ta-color-accent-bg:           var(--t-accent-cyan-bg);
  --ta-color-accent-bg-hover:     color-mix(in srgb, var(--t-accent-cyan-bg) 80%, var(--t-accent-cyan));
  --ta-color-success:             var(--t-success);
  --ta-color-success-border:      var(--t-success-dim);
  --ta-color-danger:              var(--t-danger);
  --ta-color-danger-border:       color-mix(in srgb, var(--t-danger) 70%, black);
  --ta-color-danger-bg:           var(--t-danger-bg);
  --ta-color-danger-bg-hover:     color-mix(in srgb, var(--t-danger-bg) 80%, var(--t-danger));
  --ta-color-warning:             var(--t-warning);
  --ta-color-warning-border:      color-mix(in srgb, var(--t-warning) 70%, black);
  --ta-color-warning-bg:          var(--t-warning-bg);
  --ta-color-xp:                  var(--t-special);
  --ta-color-focus:               var(--t-accent-cyan);
  --ta-color-conviction:          #7C6BF0;
  --ta-color-conviction-border:   #6B5CE0;
  --ta-badge-success-bg:          var(--t-success-bg);
  --ta-badge-success-text:        var(--t-success);
  --ta-badge-partial-bg:          var(--t-warning-bg);
  --ta-badge-partial-text:        var(--t-warning);
  --ta-badge-failure-bg:          var(--t-danger-bg);
  --ta-badge-failure-text:        var(--t-danger);
  --ta-badge-crit-success-border: var(--t-success);
  --ta-badge-crit-failure-border: var(--t-danger);
  --ta-color-credits:             var(--t-accent-magenta);
  --ta-color-tab-active:          var(--t-accent-cyan);
  --ta-border-style-poi:          1px dashed;
  --ta-die-spin-duration:         0.4s;

  /* --- Speaker colours (multi-dialogue) --- */
  --speaker-color-0: #33ff33;
  --speaker-color-1: #ffb000;
  --speaker-color-2: #00ffff;
  --speaker-color-3: #ffffff;
  --speaker-color-4: #99ff99;
  --speaker-color-5: #ff6600;
}

/* ── Light mode token overrides ────────────────────────────── */
@media (prefers-color-scheme: light) {
  .root {
    --t-bg-base:           #FFFFFF;
    --t-bg-surface:        #F5F6F8;
    --t-bg-inset:          #ECEEF2;
    --t-bg-overlay:        #F0F2F5;
    --t-text-primary:      #1A2030;
    --t-text-secondary:    #445068;
    --t-text-muted:        #8892A0;
    --t-text-inverse:      #FFFFFF;
    --t-border-hard:       #D0D6DF;
    --t-border-soft:       #E2E6EB;
    --t-accent-cyan:       #006E80;
    --t-accent-cyan-bg:    #006E8010;
    --t-accent-cyan-dim:   #004F5C;
    --t-accent-magenta:    #B5004E;
    --t-accent-magenta-bg: #B5004E0E;
    --t-success:           #1A7A08;
    --t-success-bg:        #1A7A0810;
    --t-success-dim:       #0F5205;
    --t-danger:            #C0000F;
    --t-danger-bg:         #C0000F0E;
    --t-warning:           #8A6000;
    --t-warning-bg:        #8A600010;
    --t-special:           #7200A8;
    --t-special-bg:        #7200A80E;
  }
}

/* ── Root / global ─────────────────────────────────────────── */
.root {
  font-family: 'IBM Plex Mono', 'Cascadia Code', 'SF Mono', 'Fira Code',
               'Consolas', 'Liberation Mono', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--t-text-primary);
  background: var(--t-bg-base);
  padding: 20px 0 24px;
}

/* Scanline overlay — dark mode only, motion-safe */
@media (prefers-color-scheme: dark) {
  .root { position: relative; }
  .root::after {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 2px,
      rgba(0,0,0,0.18) 2px,
      rgba(0,0,0,0.18) 3px
    );
    pointer-events: none;
    z-index: 9999;
    opacity: 0.35;
  }
}
@media (prefers-reduced-motion: reduce) {
  .root::after { display: none; }
}

/* ── Focus ──────────────────────────────────────────────────── */
.root :focus-visible {
  outline: 2px solid var(--t-accent-cyan);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--t-bg-base);
}

/* ── Location bar ───────────────────────────────────────────── */
.loc-bar {
  display: flex; justify-content: space-between; align-items: baseline;
  padding-bottom: 8px; margin-bottom: 12px;
  border-bottom: 1px solid var(--t-border-hard);
}
.loc-name {
  font-size: 15px; font-weight: 600; letter-spacing: 0.04em;
  color: var(--t-accent-cyan); text-shadow: 0 0 10px var(--t-accent-cyan);
  text-transform: uppercase; margin: 0;
}
.loc-name::before { content: '> '; color: var(--t-text-muted); text-shadow: none; }
.scene-num { font-size: 10px; letter-spacing: 0.14em; color: var(--t-text-muted); text-transform: uppercase; }

/* ── Atmosphere strip ───────────────────────────────────────── */
.atmo-strip { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
.atmo-pill {
  font-size: 10px; letter-spacing: 0.08em; padding: 2px 8px;
  border: 1px solid var(--t-border-hard); border-radius: 2px;
  color: var(--t-text-muted); background: transparent;
}

/* ── Narrative ──────────────────────────────────────────────── */
.narrative {
  font-size: 13px; line-height: 1.9; color: var(--t-text-primary);
  letter-spacing: 0.01em; margin: 0 0 16px;
  border-left: 2px solid var(--t-border-hard); padding-left: 12px;
}

/* ── Section labels ─────────────────────────────────────────── */
.section-label {
  font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--t-text-muted); margin: 16px 0 8px;
}
.section-label::before { content: '// '; color: var(--t-accent-cyan); opacity: 0.5; }

/* ── Button row ─────────────────────────────────────────────── */
.btn-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }

/* Shared button base */
.root button {
  font-family: 'IBM Plex Mono', 'Cascadia Code', 'SF Mono', 'Consolas', monospace;
  font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
  padding: 8px 16px; min-height: 44px; min-width: 44px; box-sizing: border-box;
  border-radius: 0; cursor: pointer;
  transition: background-color 80ms linear, border-color 80ms linear,
              color 80ms linear, box-shadow 80ms linear;
}
.root button:disabled { opacity: 0.32; cursor: not-allowed; text-shadow: none; box-shadow: none; }

/* Action button — primary CTA */
.btn-action, .action-btn, .continue-btn, .roll-btn {
  background: var(--t-accent-cyan-bg);
  border: 1px solid var(--t-accent-cyan);
  color: var(--t-accent-cyan);
  text-shadow: 0 0 8px var(--t-accent-cyan);
}
.btn-action:hover, .action-btn:hover, .continue-btn:hover, .roll-btn:hover {
  background: color-mix(in srgb, var(--t-accent-cyan) 18%, transparent);
  box-shadow: 0 0 0 1px var(--t-accent-cyan);
}

/* POI / explore button — dashed outline */
.btn-poi, .poi-btn {
  background: transparent;
  border: 1px dashed var(--t-border-hard);
  color: var(--t-text-secondary);
  text-shadow: none;
}
.btn-poi:hover, .poi-btn:hover {
  border-style: solid; border-color: var(--t-text-secondary);
  color: var(--t-text-primary); background: var(--t-bg-surface);
}

/* Footer / ghost button */
.footer-btn, .panel-close-btn {
  background: transparent;
  border: 1px solid var(--t-border-hard);
  color: var(--t-text-muted);
  text-shadow: none;
}
.footer-btn:hover, .panel-close-btn:hover {
  border-color: var(--t-text-secondary); color: var(--t-text-secondary);
  background: var(--t-bg-surface);
}

/* Danger / retreat button */
.action-btn.retreat {
  background: var(--t-danger-bg);
  border-color: var(--t-danger);
  color: var(--t-danger);
  text-shadow: none;
}
.action-btn.retreat:hover {
  background: color-mix(in srgb, var(--t-danger) 20%, transparent);
  box-shadow: 0 0 0 1px var(--t-danger);
}

/* Attack button */
.action-btn.attack {
  background: var(--t-danger-bg);
  border-color: var(--t-danger);
  color: var(--t-danger);
  text-shadow: 0 0 6px var(--t-danger);
}
.action-btn.attack:hover {
  background: color-mix(in srgb, var(--t-danger) 22%, transparent);
  box-shadow: 0 0 0 1px var(--t-danger);
}

/* ── Status bar ─────────────────────────────────────────────── */
.status-bar {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  padding: 10px 0; margin-top: 8px;
  border-top: 1px solid var(--t-border-hard);
  font-size: 10px; letter-spacing: 0.08em; color: var(--t-text-muted);
}
.pip {
  width: 8px; height: 8px; border-radius: 0;
  background: var(--t-success); border: 1px solid var(--t-success-dim);
  box-shadow: 0 0 4px var(--t-success);
}
.pip.empty { background: transparent; border-color: var(--t-border-hard); box-shadow: none; }
.hp-pips { display: flex; gap: 4px; align-items: center; }
.xp-track {
  width: 64px; height: 4px; border-radius: 0; overflow: hidden;
  background: repeating-linear-gradient(
    to right,
    var(--t-border-hard) 0px, var(--t-border-hard) 1px,
    transparent 1px, transparent 8px
  );
  border: 1px solid var(--t-border-hard); position: relative;
}
.xp-fill {
  height: 100%; background: var(--t-special);
  box-shadow: 2px 0 8px var(--t-special); border-radius: 0;
  transition: width 600ms ease-out;
}

/* ── Footer row ─────────────────────────────────────────────── */
.footer-row {
  display: flex; justify-content: flex-start; gap: 8px; flex-wrap: wrap;
  margin-top: 14px; padding-top: 10px;
  border-top: 1px solid var(--t-border-hard);
}

/* ── Panel overlay ──────────────────────────────────────────── */
#panel-overlay {
  background: var(--t-bg-overlay);
  border: 1px solid var(--t-border-hard);
  padding: 12px;
}
.panel-header {
  display: flex; align-items: baseline; justify-content: space-between;
  padding-bottom: 10px; margin-bottom: 12px;
  border-bottom: 1px solid var(--t-border-hard);
}
.panel-title {
  font-size: 11px; font-weight: 600; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--t-accent-cyan);
  text-shadow: 0 0 8px var(--t-accent-cyan);
}
.panel-content {
  display: none; font-size: 12px; line-height: 1.7; color: var(--t-text-secondary);
}

/* ── Outcome badges ─────────────────────────────────────────── */
.badge {
  display: inline-block; font-size: 10px; font-weight: 500;
  letter-spacing: 0.18em; text-transform: uppercase;
  padding: 4px 14px; border-radius: 0; border: 1px solid currentColor;
}
.badge.crit-success { color: var(--t-success); background: var(--t-success-bg); text-shadow: 0 0 8px var(--t-success); }
.badge.success      { color: var(--t-success); background: var(--t-success-bg); }
.badge.partial      { color: var(--t-warning); background: var(--t-warning-bg); }
.badge.failure      { color: var(--t-danger);  background: var(--t-danger-bg);  }
.badge.crit-failure { color: var(--t-danger);  background: var(--t-danger-bg);  text-shadow: 0 0 8px var(--t-danger); }

/* ── Dice roll ──────────────────────────────────────────────── */
.die-display { text-align: center; margin: 16px 0; }
.die-value {
  font-size: 40px; font-weight: 600; letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums; display: inline-block; line-height: 1;
}
.resolve-block {
  background: var(--t-bg-inset); border: 1px solid var(--t-border-hard);
  border-radius: 0; padding: 12px; margin-bottom: 16px;
}
.resolve-row {
  display: flex; justify-content: space-between; align-items: baseline;
  font-size: 11px; color: var(--t-text-secondary);
  padding: 3px 0; border-bottom: 1px solid var(--t-border-soft);
  letter-spacing: 0.04em;
}
.resolve-row:last-child { border-bottom: none; }
.resolve-label {
  color: var(--t-text-muted); text-transform: uppercase;
  font-size: 9px; letter-spacing: 0.14em;
}

/* ── Combat ─────────────────────────────────────────────────── */
.init-bar {
  display: flex; gap: 6px; align-items: center; flex-wrap: wrap;
  margin-bottom: 12px; padding-bottom: 10px;
  border-bottom: 1px solid var(--t-border-hard);
}
.init-label { font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--t-text-muted); margin-right: 4px; }
.init-chip  { font-size: 10px; letter-spacing: 0.06em; padding: 3px 10px; border: 1px solid var(--t-border-hard); color: var(--t-text-secondary); }
.init-chip.active { border-color: var(--t-success); color: var(--t-success); text-shadow: 0 0 6px var(--t-success); }
.enemy-card { padding: 10px 12px; border: 1px solid var(--t-border-hard); background: var(--t-bg-surface); }
.enemy-card .pip { background: var(--t-danger); border-color: var(--t-danger); box-shadow: 0 0 3px var(--t-danger); }
.enemy-card .pip.empty { background: transparent; border-color: var(--t-border-hard); box-shadow: none; }

/* ── Social encounter ───────────────────────────────────────── */
.conviction-pip {
  width: 12px; height: 12px; border-radius: 0;
  background: transparent; border: 1px solid var(--t-border-hard);
}
.conviction-pip.filled {
  background: var(--t-success); border-color: var(--t-success);
  box-shadow: 0 0 6px var(--t-success);
}
.disposition-badge { border-radius: 0; letter-spacing: 0.14em; padding: 3px 10px; border: 1px solid currentColor; }
.disposition-badge.suspicious { background: var(--t-warning-bg); color: var(--t-warning); }
.disposition-badge.hostile    { background: var(--t-danger-bg);  color: var(--t-danger);  }
.disposition-badge.neutral    { background: transparent;         color: var(--t-text-muted); border-color: var(--t-border-hard); }
.disposition-badge.friendly   { background: var(--t-success-bg); color: var(--t-success); }

/* ── Merchant / shop ────────────────────────────────────────── */
.credits-display {
  font-size: 12px; font-weight: 500; letter-spacing: 0.08em;
  color: var(--t-warning); text-shadow: 0 0 8px var(--t-warning);
}
.tab-btn.active { color: var(--t-accent-cyan); border-bottom-color: var(--t-accent-cyan); }
.item-card { border: 1px solid var(--t-border-hard); border-radius: 0; background: var(--t-bg-surface); }
.item-type-badge { border-radius: 0; border: 1px solid var(--t-border-hard); letter-spacing: 0.12em; text-transform: uppercase; }

/* ── Fallback prompt ────────────────────────────────────────── */
.fallback-text { font-size: 11px; color: var(--t-text-muted); margin-top: 8px; display: none; }
.fallback-text code {
  display: block; margin-top: 4px; padding: 8px;
  background: var(--t-bg-inset); border: 1px solid var(--t-border-hard);
  color: var(--t-text-secondary); word-break: break-all;
}

/* ── Animations ─────────────────────────────────────────────── */
@keyframes t-die-settle {
  0%   { opacity: 0.3; filter: blur(1px); }
  60%  { opacity: 0.8; color: var(--t-accent-cyan); text-shadow: 0 0 16px var(--t-accent-cyan); }
  100% { opacity: 1;   color: var(--t-text-primary); text-shadow: none; }
}
@keyframes t-crit-fail-pulse {
  0%, 100% { color: var(--t-danger); text-shadow: 0 0 8px var(--t-danger); }
  50%       { color: var(--t-text-primary); text-shadow: none; }
}
@keyframes t-pulse-border {
  0%, 100% { border-color: var(--t-border-hard); box-shadow: none; }
  50%       { border-color: var(--t-accent-cyan); box-shadow: 0 0 8px var(--t-accent-cyan); }
}
@keyframes t-xp-fill {
  from { width: var(--xp-from, 0%); }
  to   { width: var(--xp-to, 0%); }
}

.die-value.settling      { animation: t-die-settle 400ms ease-out forwards; }
.die-value.crit-success  { color: var(--t-success); text-shadow: 0 0 20px var(--t-success), 0 0 40px var(--t-success); animation: none; }
.die-value.crit-failure  { animation: t-crit-fail-pulse 800ms ease-in-out 2; }
.continue-btn            { animation: t-pulse-border 2s ease-in-out infinite; }
.continue-btn:hover      { animation: none; border-color: var(--t-accent-cyan); }
.xp-fill.animating       { animation: t-xp-fill 600ms ease-out forwards; }

/* ── Reduced motion — all animations and transitions disabled ── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
