---
name: Brutalist
description: >
  Raw, stark, high-contrast aesthetic drawn from brutalist architecture, punk zines,
  and protest posters. Zero decoration, maximum impact. System fonts only, pure
  black-and-white palette with a single red accent.
best-for:
  - output_styles: [noir, horror, post-apocalyptic, cyberpunk, dystopian, thriller]
  - genres: [dark fantasy, grimdark, survival, military, heist, political]
  - tones: [grim, urgent, dangerous, oppressive, revolutionary]
  - avoid_for: [whimsy, high-fantasy, cosy, romance]
---

## Design Philosophy

Brutalist design borrows from raw concrete architecture and the DIY urgency of punk
print culture. Every element earns its place or gets removed. There is no decoration
for its own sake — borders are thick because borders communicate structure, not because
they look pretty. Headings are large because hierarchy matters, not for aesthetics.

The visual grammar is deliberately confrontational: uppercase labels demand attention,
oversized type creates hierarchy through weight rather than ornament, and the
absence of softening effects (shadows, gradients, rounded corners) forces the content
itself to carry all the meaning.

In practice this means:

- **Zero rounding.** Every corner is a hard right angle. `border-radius: 0` everywhere.
- **Flat surfaces only.** No `box-shadow`, no `drop-shadow`, no gradients. Depth
  is implied by thick borders alone.
- **Inversion as interaction.** Hover and active states flip black/white. No colour
  trickery — pure reversal communicates state without ambiguity.
- **One accent, used sparingly.** Red (`#FF0000`) is reserved for danger, critical
  actions, failure states, and HP loss. If it is red, it matters.
- **Typography does the heavy lifting.** Size, weight, and letter-spacing create
  visual hierarchy. No decorative fonts, no icon fonts, no external dependencies.

---

## Typography

### Font Stack

System fonts only. No external font loading, no flash of unstyled text, no
network dependency. This is a feature: the game renders instantly on any device.

```
--font-sans:  system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
--font-mono:  ui-monospace, "Cascadia Code", "SF Mono", "Consolas", "Liberation Mono", monospace
```

The sans stack covers: macOS/iOS (SF Pro), Windows (Segoe UI), Linux (system-ui),
and Android (Roboto). The mono stack covers: macOS/iOS (SF Mono), Windows (Cascadia
Code / Consolas), and Linux (Liberation Mono).

### Scale and Weights

| Role              | Size    | Weight | Transform   | Letter-spacing |
|-------------------|---------|--------|-------------|----------------|
| Scene heading     | 28–32px | 900    | uppercase   | 0.05em         |
| Section label     | 11px    | 700    | uppercase   | 0.12em         |
| Body text         | 16px    | 400    | none        | 0              |
| Stat value        | 22px    | 700    | none        | -0.02em        |
| Mono / dice       | 15px    | 600    | none        | 0.04em         |
| Button label      | 13px    | 700    | uppercase   | 0.08em         |
| Caption / flavour | 13px    | 400    | none        | 0              |

**Rule:** Never use `font-weight` below 400 in this theme. Thin type looks weak
against raw black borders. Headings must be 700 or heavier — 900 preferred.

---

## Colour Palette

Two modes: light (default) and dark. Both use the same token names so the rest of
the engine's CSS requires no modification.

### Light Mode (default)

Pure white surfaces, pure black text and borders, red for critical/danger.

| Token                          | Hex       | Role                                          |
|--------------------------------|-----------|-----------------------------------------------|
| `--bru-bg`                   | `#FFFFFF` | Page / widget background                      |
| `--bru-surface`              | `#FFFFFF` | Card, panel, inset surface background         |
| `--bru-surface-raised`       | `#F5F5F5` | Slightly elevated surface (status bar, pills) |
| `--bru-text-primary`         | `#000000` | Primary body and heading text                 |
| `--bru-text-secondary`       | `#333333` | Secondary labels, descriptions                |
| `--bru-text-tertiary`        | `#555555` | Captions, timestamps, meta text               |
| `--bru-text-inverse`         | `#FFFFFF` | Text on filled/inverted backgrounds           |
| `--bru-border-primary`       | `#000000` | Primary borders (2–3px)                       |
| `--bru-border-secondary`     | `#333333` | Secondary borders (1–2px)                     |
| `--bru-border-tertiary`      | `#888888` | Tertiary / subtle borders                     |
| `--bru-accent`               | `#FF0000` | Red accent — danger, crits, HP loss, warnings |
| `--bru-accent-muted`         | `#CC0000` | Darker red for hover/active on red elements   |
| `--bru-success`              | `#000000` | Success state — no colour, just bold text     |
| `--bru-warning`              | `#000000` | Warning state — uppercase label suffices      |
| `--bru-danger`               | `#FF0000` | Danger state — red                            |
| `--bru-info`                 | `#000000` | Info state — black                            |
| `--bru-interactive-bg`       | `#FFFFFF` | Button / interactive default background       |
| `--bru-interactive-bg-hover` | `#000000` | Button background on hover (inversion)        |
| `--bru-interactive-text`     | `#000000` | Button / interactive default text             |
| `--bru-interactive-text-hover`| `#FFFFFF`| Button text on hover (inversion)              |
| `--bru-pip-full`             | `#000000` | Filled HP/XP pip                              |
| `--bru-pip-empty`            | `#CCCCCC` | Empty HP/XP pip                               |
| `--bru-pip-danger`           | `#FF0000` | HP pip when at critical threshold             |
| `--bru-overlay-bg`           | `#FFFFFF` | Panel overlay background                      |
| `--bru-selection-bg`         | `#000000` | Text selection background                     |
| `--bru-selection-text`       | `#FFFFFF` | Text selection foreground                     |

### Dark Mode

Invert everything. White borders on black, red stays red (it always stands out).

```css
@media (prefers-color-scheme: dark) {
  :host {
    --bru-bg:                    #000000;
    --bru-surface:               #000000;
    --bru-surface-raised:        #111111;
    --bru-text-primary:          #FFFFFF;
    --bru-text-secondary:        #CCCCCC;
    --bru-text-tertiary:         #999999;
    --bru-text-inverse:          #000000;
    --bru-border-primary:        #FFFFFF;
    --bru-border-secondary:      #CCCCCC;
    --bru-border-tertiary:       #777777;
    --bru-accent:                #FF0000;
    --bru-accent-muted:          #CC0000;
    --bru-interactive-bg:        #000000;
    --bru-interactive-bg-hover:  #FFFFFF;
    --bru-interactive-text:      #FFFFFF;
    --bru-interactive-text-hover:#000000;
    --bru-pip-full:              #FFFFFF;
    --bru-pip-empty:             #333333;
    --bru-pip-danger:            #FF0000;
    --bru-overlay-bg:            #000000;
    --bru-selection-bg:          #FFFFFF;
    --bru-selection-text:        #000000;

    /* ── CSS Custom Property Contract (required by style-reference.md) ─ */
    --ta-font-heading:              var(--font-sans);
    --ta-font-body:                 var(--font-mono);
    --ta-color-accent:              var(--bru-accent);
    --ta-color-accent-hover:        var(--bru-accent-muted);
    --ta-color-accent-bg:           var(--bru-interactive-bg);
    --ta-color-accent-bg-hover:     var(--bru-interactive-bg-hover);
    --ta-color-success:             var(--bru-success);
    --ta-color-success-border:      color-mix(in srgb, var(--bru-success) 70%, black);
    --ta-color-danger:              var(--bru-danger);
    --ta-color-danger-border:       color-mix(in srgb, var(--bru-danger) 70%, black);
    --ta-color-danger-bg:           rgba(255, 0, 0, 0.08);
    --ta-color-danger-bg-hover:     rgba(255, 0, 0, 0.15);
    --ta-color-warning:             var(--bru-warning);
    --ta-color-warning-border:      color-mix(in srgb, var(--bru-warning) 70%, black);
    --ta-color-warning-bg:          rgba(255, 200, 0, 0.08);
    --ta-color-xp:                  var(--bru-info);
    --ta-color-focus:               var(--bru-accent);
    --ta-color-conviction:          var(--bru-accent);
    --ta-color-conviction-border:   var(--bru-accent-muted);
    --ta-badge-success-bg:          rgba(0, 128, 0, 0.10);
    --ta-badge-success-text:        var(--bru-success);
    --ta-badge-partial-bg:          rgba(255, 200, 0, 0.10);
    --ta-badge-partial-text:        var(--bru-warning);
    --ta-badge-failure-bg:          rgba(255, 0, 0, 0.10);
    --ta-badge-failure-text:        var(--bru-danger);
    --ta-badge-crit-success-border: var(--bru-success);
    --ta-badge-crit-failure-border: var(--bru-danger);
    --ta-color-credits:             var(--bru-warning);
    --ta-color-tab-active:          var(--bru-accent);
    --ta-border-style-poi:          2px dashed;
    --ta-die-spin-duration:         0.3s;
  }

  /* --- Speaker colours (multi-dialogue) --- */
  --speaker-color-0: #ffffff;
  --speaker-color-1: #cc0000;
  --speaker-color-2: #ffdd00;
  --speaker-color-3: #333333;
  --speaker-color-4: #888888;
  --speaker-color-5: #000000;
}
```

### Contrast compliance

All primary text/background combinations pass WCAG AA (4.5:1) at minimum — most
pass AAA (7:1). Pure black on pure white is 21:1. Red `#FF0000` on white is 3.99:1
(passes AA large text only) — for this reason, red is **never used as the primary
text colour for body copy**, only for borders, icons, pip fills, and short labels
where large-text rules apply.

---

## Spacing & Layout

No magic numbers. All spacing derives from a base-8 scale.

```css
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

**Layout rules for brutalist theme:**

- Generous outer padding: `--space-6` (24px) on the widget root.
- Section gaps: `--space-8` (32px) between major sections.
- Internal component padding: `--space-4` (16px).
- Grid gaps: `--space-4` (16px) for tight grids, `--space-6` (24px) for card grids.
- Maximum content width: `720px` — raw concrete is imposing, not sprawling.
- No centred hero layouts — left-align everything. Justified margins are for
  decorative design; brutalism left-aligns and lets the content define the edge.

---

## Borders & Surfaces

**The single most important rule of this theme:** borders replace all other depth cues.

```css
--border-radius:     0px   /* Everywhere. No exceptions. */
--border-radius-sm:  0px
--border-radius-md:  0px
--border-radius-lg:  0px
--border-radius-full:0px   /* Overrides pill shapes — pips use CSS shapes instead */

--border-width-heavy: 3px  /* Widget containers, primary panels, action buttons */
--border-width-medium:2px  /* Secondary borders, section dividers, form inputs    */
--border-width-light: 1px  /* Tertiary details, inner separators                  */
```

**Surface rules:**

- No `box-shadow` anywhere. Not even `0 1px 2px`. Flat is not a limitation here —
  it is the identity.
- No `background-image` gradients. `background: var(--bru-surface)` only.
- Section separators use `border-top: var(--border-width-medium) solid var(--bru-border-primary)`.
- Inset content (status bars, codex entries) uses `background: var(--bru-surface-raised)`.
- The widget root itself gets the heaviest border: `3px solid var(--bru-border-primary)`.

---

## Interactive Elements

### Buttons

Stark rectangles with heavy borders. Hover inverts background and text colour. No
animation beyond immediate colour swap (or a fast 80ms transition for users who
have not requested reduced motion).

```css
/* Primary action button */
.btn, button, [role="button"] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;   /* WCAG 2.5.5 touch target */
  min-width: 44px;
  padding: 10px 20px;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bru-interactive-text);
  background: var(--bru-interactive-bg);
  border: var(--border-width-heavy) solid var(--bru-border-primary);
  border-radius: 0;
  cursor: pointer;
  box-sizing: border-box;
  text-decoration: none;
  transition: background 80ms linear, color 80ms linear;
}

.btn:hover, button:hover, [role="button"]:hover {
  background: var(--bru-interactive-bg-hover);
  color: var(--bru-interactive-text-hover);
  outline: none;
}

.btn:active, button:active {
  /* Slight scale on press — perceptible but not decorative */
  transform: scale(0.98);
}

/* Danger / critical action button */
.btn-danger, button.danger {
  border-color: var(--bru-accent);
  color: var(--bru-accent);
}

.btn-danger:hover, button.danger:hover {
  background: var(--bru-accent);
  color: var(--bru-text-inverse);
}

/* Ghost / secondary button */
.btn-ghost {
  border-color: var(--bru-border-tertiary);
  color: var(--bru-text-secondary);
}

.btn-ghost:hover {
  border-color: var(--bru-border-primary);
  background: var(--bru-interactive-bg-hover);
  color: var(--bru-interactive-text-hover);
}
```

### Focus States

Thick, visible, never hidden. Accessibility is non-negotiable; the brutalist
aesthetic makes excellent focus rings natural rather than intrusive.

```css
:focus-visible {
  outline: 3px solid var(--bru-border-primary);
  outline-offset: 2px;
  /* No border-radius on outline either */
}

/* Remove default focus ring only when :focus-visible is used */
:focus:not(:focus-visible) {
  outline: none;
}
```

### Text Selection

```css
::selection {
  background: var(--bru-selection-bg);
  color: var(--bru-selection-text);
}
```

### Form Inputs

```css
input, select, textarea {
  font-family: var(--font-sans);
  font-size: 16px;
  font-weight: 400;
  color: var(--bru-text-primary);
  background: var(--bru-surface);
  border: var(--border-width-medium) solid var(--bru-border-primary);
  border-radius: 0;
  padding: 10px 12px;
  min-height: 44px;
  box-sizing: border-box;
  width: 100%;
  appearance: none;
}

input:focus, select:focus, textarea:focus {
  outline: 3px solid var(--bru-border-primary);
  outline-offset: 0;
}
```

---

## Micro-interactions

All animations are wrapped in a `prefers-reduced-motion: no-preference` media query.
Users who have requested reduced motion get instant state changes — no transitions,
no animations, no movement. The theme remains fully usable and visually complete
without any motion.

```css
/* Only apply transitions if the user has NOT requested reduced motion */
@media (prefers-reduced-motion: no-preference) {

  /* Button colour swap — fast enough to feel instant, slow enough to be legible */
  .btn, button, [role="button"] {
    transition: background 80ms linear, color 80ms linear, border-color 80ms linear;
  }

  /* Panel overlay fade */
  .panel-overlay {
    transition: opacity 120ms linear;
  }

  /* HP pip flash on damage — red flash draws the eye immediately */
  .pip.damaged {
    animation: pip-flash 400ms steps(1, end) 2;
  }

  @keyframes pip-flash {
    0%   { background: var(--bru-pip-danger); }
    50%  { background: var(--bru-pip-empty);  }
    100% { background: var(--bru-pip-danger); }
  }

  /* Dice roll — rapid flicker of numbers before settle */
  .dice-rolling {
    animation: dice-flicker 600ms steps(1, end);
  }

  @keyframes dice-flicker {
    0%   { opacity: 1; }
    10%  { opacity: 0; }
    20%  { opacity: 1; }
    30%  { opacity: 0; }
    40%  { opacity: 1; }
    50%  { opacity: 0; }
    60%  { opacity: 1; }
    70%  { opacity: 0; }
    80%  { opacity: 1; }
    90%  { opacity: 0; }
    100% { opacity: 1; }
  }

  /* Outcome badge entrance — slam down, no bounce */
  .outcome-badge {
    animation: badge-slam 150ms cubic-bezier(0.25, 0, 0.5, 1);
  }

  @keyframes badge-slam {
    from { transform: translateY(-8px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  /* Section reveal — content appears line by line on first load */
  .reveal-full {
    animation: content-appear 200ms linear;
  }

  @keyframes content-appear {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

}

/* When reduced motion IS requested: ensure no accidental inherited transitions */
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

How each game engine widget type looks in the brutalist theme.

### Scene Widget

- Outer container: `3px solid black`, zero border-radius, `24px` padding.
- Location bar: `UPPERCASE`, `font-weight: 900`, `font-size: 28px`, flush left.
  No badge or pill — the text alone is the location name.
- Scene number: `font-size: 11px`, `font-weight: 700`, uppercase, `letter-spacing: 0.12em`,
  placed to the right on the same baseline as the location name. Monospace font.
- Atmosphere strip: three pills rendered as rectangular `2px bordered` tags, not rounded.
  Each tag is `padding: 4px 10px`, uppercase, `font-size: 11px`.
- Narrative block: `font-size: 16px`, `line-height: 1.7`, no indentation.
  Hard paragraph breaks (`margin-bottom: 16px`).
- Section dividers: `border-top: 2px solid var(--bru-border-primary)`, full width,
  with `12px` margin above and below.
- Status bar: all-caps labels, monospace values, rendered as a horizontal flex row
  separated by `2px solid` dividers.

### Die Roll Widget

- Dice face: large monospace number, `font-size: 48px`, `font-weight: 900`, centred
  in a `3px bordered` square. No rounded dice shape — squares only.
- Roll result number: `font-size: 64px`, `font-weight: 900`, black, left-aligned.
- DC reveal: monospace, uppercase label `DC` followed by the number in the same
  large weight. Presented as a bordered inline block below the roll number.
- Outcome labels: `CRITICAL SUCCESS`, `SUCCESS`, `PARTIAL`, `FAILURE`, `CRITICAL FAILURE`
  in uppercase, `font-weight: 900`, `font-size: 22px`. Colour: black for success/partial,
  red (`var(--bru-accent)`) for failure and critical failure.

### HP / XP Pips

- HP pips: `12px × 12px` squares (`border-radius: 0`), `2px solid border`.
  Filled = `background: var(--bru-pip-full)`.
  Empty = `background: transparent`, `border-color: var(--bru-border-tertiary)`.
  Critical (≤25% HP) = `background: var(--bru-pip-danger)`.
- XP bar: a rectangular progress bar with `3px solid` outer border, `0` border-radius.
  Inner fill is a solid black (or white in dark mode) rectangle. No gradient.
  Label above: `XP 340 / 500`, uppercase, monospace.

### Inventory / Status Tags

- Item tags: rectangular, `2px solid var(--bru-border-secondary)`, `padding: 3px 8px`,
  `font-size: 12px`, `font-weight: 700`, uppercase. No rounded corners, no colour fills.
- Condition badges (Poisoned, Inspired, etc.): same pattern. Dangerous conditions
  get `border-color: var(--bru-accent)` and `color: var(--bru-accent)`.
- Equipped items: rendered in a monospace font with a `[EQUIPPED]` label prefix.

### Combat Widget

- Initiative bar: horizontal flex row, each combatant in a `2px bordered` rectangle.
  Active combatant: inverted (black bg, white text). Dead: `opacity: 0.4`.
- Enemy HP: same pip system as player HP. Boss pips are larger (`16px × 16px`).
- Battlefield schematic (SVG): stroke colours use `currentColor` so they inherit
  the theme's text colour. No fills except for entity markers (solid squares).
- Action buttons: full-width on mobile, grid of 2 on desktop. Use the standard
  button inversion pattern.

### Dialogue Widget

- NPC portrait: SVG only, `48px × 48px`, sharp edges — SVG `rx="0"` on any rects.
- Dialogue bubble: heavy left border `4px solid var(--bru-border-primary)`, no
  speech-bubble tail, no `border-radius`. `padding-left: 16px`.
- Tone badge: rectangular, uppercase, `11px`, `2px solid`. Hostile tone gets
  `border-color: var(--bru-accent)`.
- Response buttons: full-width, uppercase, left-aligned text within the button.

### Panel Overlays

- Overlay background: `var(--bru-overlay-bg)` — opaque, not translucent.
  Brutalism does not do frosted glass.
- Panel header: `3px solid` bottom border separating header from content.
  Title in `font-weight: 900`, uppercase.
- Close button: matches ghost button style. Label: `[CLOSE]` in monospace uppercase.
- Stat rows: label in `font-size: 11px` uppercase, value in `font-size: 18px`
  `font-weight: 700`, separated by a `1px` bottom border on each row.

### Outcome Widget

- Badge: full-width rectangular block, black background, white text for
  success variants. Red background (`var(--bru-accent)`) for failure variants.
  `font-size: 20px`, `font-weight: 900`, uppercase, centred. `padding: 16px`.
- Consequence text: `font-size: 16px`, left-aligned, generous line-height (`1.8`).
- Mechanical effects: rendered in monospace, prefixed with `+` or `−`, one per line.
  Negative effects (HP loss, item lost) in red.

### Shop / Merchant Widget

- Item rows: bordered table rows with `2px solid` bottom separators. No alternating
  row colours — contrast comes from borders alone.
- Price column: monospace, right-aligned, `font-weight: 700`.
- BUY / SELL buttons: compact (not full-width), uppercase, `2px bordered`.
- Tab switcher (Buy / Sell): two large rectangular buttons. Active tab: inverted.
  Inactive: ghost style with `border-bottom: 3px solid var(--bru-border-primary)`.

---

## Complete CSS Block

This block is the full injectable CSS. Include it inside a `<style>` tag at the top
of any widget to apply the brutalist theme. All custom properties are defined on
`:host` so they cascade to every descendant.

```css
/* @extract */
/* ============================================================
   BRUTALIST THEME — Text Adventure Engine
   Raw, stark, zero decoration. System fonts. Black + white + red.
   ============================================================ */

:host {
  /* --- Colour tokens: light mode --- */
  --bru-bg:                     #FFFFFF;
  --bru-surface:                #FFFFFF;
  --bru-surface-raised:         #F5F5F5;
  --bru-text-primary:           #000000;
  --bru-text-secondary:         #333333;
  --bru-text-tertiary:          #555555;
  --bru-text-inverse:           #FFFFFF;
  --bru-border-primary:         #000000;
  --bru-border-secondary:       #333333;
  --bru-border-tertiary:        #888888;
  --bru-accent:                 #FF0000;
  --bru-accent-muted:           #CC0000;
  --bru-success:                #000000;
  --bru-warning:                #000000;
  --bru-danger:                 #FF0000;
  --bru-info:                   #000000;
  --bru-interactive-bg:         #FFFFFF;
  --bru-interactive-bg-hover:   #000000;
  --bru-interactive-text:       #000000;
  --bru-interactive-text-hover: #FFFFFF;
  --bru-pip-full:               #000000;
  --bru-pip-empty:              #CCCCCC;
  --bru-pip-danger:             #FF0000;
  --bru-overlay-bg:             #FFFFFF;
  --bru-selection-bg:           #000000;
  --bru-selection-text:         #FFFFFF;

  /* --- Border radii: zero everywhere --- */
  --border-radius:      0px;
  --border-radius-sm:   0px;
  --border-radius-md:   0px;
  --border-radius-lg:   0px;
  --border-radius-full: 0px;

  /* --- Border widths --- */
  --border-width-heavy:  3px;
  --border-width-medium: 2px;
  --border-width-light:  1px;

  /* --- Spacing scale (base-8) --- */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* --- Typography --- */
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, "Cascadia Code", "SF Mono", "Consolas", "Liberation Mono", monospace;
  --font-size-base: 16px;
  --line-height-base: 1.6;
}

/* --- Dark mode token overrides --- */
@media (prefers-color-scheme: dark) {
  :host {
    --bru-bg:                     #000000;
    --bru-surface:                #000000;
    --bru-surface-raised:         #111111;
    --bru-text-primary:           #FFFFFF;
    --bru-text-secondary:         #CCCCCC;
    --bru-text-tertiary:          #999999;
    --bru-text-inverse:           #000000;
    --bru-border-primary:         #FFFFFF;
    --bru-border-secondary:       #CCCCCC;
    --bru-border-tertiary:        #777777;
    --bru-accent:                 #FF0000;
    --bru-accent-muted:           #CC0000;
    --bru-interactive-bg:         #000000;
    --bru-interactive-bg-hover:   #FFFFFF;
    --bru-interactive-text:       #FFFFFF;
    --bru-interactive-text-hover: #000000;
    --bru-pip-full:               #FFFFFF;
    --bru-pip-empty:              #333333;
    --bru-pip-danger:             #FF0000;
    --bru-overlay-bg:             #000000;
    --bru-selection-bg:           #FFFFFF;
    --bru-selection-text:         #000000;
  }
}

/* --- Base reset --- */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body, .root {
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  color: var(--bru-text-primary);
  background: var(--bru-bg);
}

::selection {
  background: var(--bru-selection-bg);
  color: var(--bru-selection-text);
}

/* --- Widget root container --- */
.root {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-6);
  border: var(--border-width-heavy) solid var(--bru-border-primary);
  border-radius: 0;
  background: var(--bru-bg);
}

/* --- Typography --- */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-sans);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--bru-text-primary);
}

h1 { font-size: 32px; margin-bottom: var(--space-4); }
h2 { font-size: 26px; margin-bottom: var(--space-3); }
h3 { font-size: 20px; margin-bottom: var(--space-3); }
h4 { font-size: 16px; margin-bottom: var(--space-2); }

p { margin-bottom: var(--space-4); line-height: 1.7; }

.label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--bru-text-tertiary);
}

.mono {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

/* --- Section dividers --- */
.section-divider, hr {
  border: none;
  border-top: var(--border-width-medium) solid var(--bru-border-primary);
  margin: var(--space-8) 0;
}

/* --- Buttons --- */
button, .btn, [role="button"] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  padding: 10px 20px;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bru-interactive-text);
  background: var(--bru-interactive-bg);
  border: var(--border-width-heavy) solid var(--bru-border-primary);
  border-radius: 0;
  cursor: pointer;
  text-decoration: none;
  appearance: none;
}

button:hover, .btn:hover, [role="button"]:hover {
  background: var(--bru-interactive-bg-hover);
  color: var(--bru-interactive-text-hover);
  border-color: var(--bru-border-primary);
}

button:active, .btn:active {
  transform: scale(0.98);
}

button:disabled, .btn:disabled, [disabled] {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-danger {
  border-color: var(--bru-accent);
  color: var(--bru-accent);
  background: var(--bru-interactive-bg);
}

.btn-danger:hover {
  background: var(--bru-accent);
  color: var(--bru-text-inverse);
  border-color: var(--bru-accent);
}

.btn-ghost {
  border-color: var(--bru-border-tertiary);
  color: var(--bru-text-secondary);
  border-width: var(--border-width-medium);
}

.btn-ghost:hover {
  border-color: var(--bru-border-primary);
  background: var(--bru-interactive-bg-hover);
  color: var(--bru-interactive-text-hover);
}

.btn-full { width: 100%; }

/* --- Focus states --- */
:focus-visible {
  outline: 3px solid var(--bru-border-primary);
  outline-offset: 2px;
}

:focus:not(:focus-visible) {
  outline: none;
}

/* --- Form inputs --- */
input, select, textarea {
  font-family: var(--font-sans);
  font-size: 16px;
  font-weight: 400;
  color: var(--bru-text-primary);
  background: var(--bru-surface);
  border: var(--border-width-medium) solid var(--bru-border-primary);
  border-radius: 0;
  padding: 10px 12px;
  min-height: 44px;
  width: 100%;
  appearance: none;
}

input:focus, select:focus, textarea:focus {
  outline: 3px solid var(--bru-border-primary);
  outline-offset: 0;
}

/* --- Location bar --- */
.loc-bar {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: var(--border-width-heavy) solid var(--bru-border-primary);
}

.loc-name {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 1;
}

.loc-scene {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--bru-text-tertiary);
  white-space: nowrap;
}

/* --- Atmosphere strip --- */
.atmo-strip {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.atmo-pill {
  display: inline-block;
  padding: 4px 10px;
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bru-text-secondary);
  background: var(--bru-surface-raised);
  border: var(--border-width-light) solid var(--bru-border-secondary);
  border-radius: 0;
}

/* --- Narrative block --- */
.narrative {
  font-size: 16px;
  line-height: 1.75;
  margin-bottom: var(--space-8);
  color: var(--bru-text-primary);
}

/* --- Action / POI buttons grid --- */
.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.action-grid button {
  width: 100%;
  text-align: left;
  justify-content: flex-start;
}

/* --- Status bar --- */
.status-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: center;
  padding: var(--space-3) var(--space-4);
  background: var(--bru-surface-raised);
  border: var(--border-width-medium) solid var(--bru-border-primary);
  border-top: none;
  font-family: var(--font-mono);
  font-size: 13px;
}

.status-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--bru-text-tertiary);
}

/* --- HP / XP pips --- */
.pips {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}

.pip {
  width: 12px;
  height: 12px;
  border: var(--border-width-light) solid var(--bru-border-secondary);
  border-radius: 0;
  background: transparent;
  flex-shrink: 0;
}

.pip.filled {
  background: var(--bru-pip-full);
  border-color: var(--bru-pip-full);
}

.pip.danger {
  background: var(--bru-pip-danger);
  border-color: var(--bru-pip-danger);
}

/* --- XP bar --- */
.xp-bar-outer {
  width: 100%;
  height: 12px;
  border: var(--border-width-medium) solid var(--bru-border-primary);
  border-radius: 0;
  background: var(--bru-surface);
  overflow: hidden;
}

.xp-bar-inner {
  height: 100%;
  background: var(--bru-pip-full);
  border-radius: 0;
  transition: none;
}

/* --- Inventory / condition tags --- */
.tag {
  display: inline-block;
  padding: 3px 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border: var(--border-width-medium) solid var(--bru-border-secondary);
  border-radius: 0;
  background: transparent;
  color: var(--bru-text-secondary);
}

.tag.danger {
  border-color: var(--bru-accent);
  color: var(--bru-accent);
}

.tag.equipped::before {
  content: "[EQ] ";
  font-family: var(--font-mono);
  opacity: 0.6;
}

/* --- Dice widget --- */
.dice-face {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border: var(--border-width-heavy) solid var(--bru-border-primary);
  border-radius: 0;
  font-family: var(--font-mono);
  font-size: 36px;
  font-weight: 900;
  color: var(--bru-text-primary);
  background: var(--bru-surface);
}

.roll-result {
  font-family: var(--font-mono);
  font-size: 64px;
  font-weight: 900;
  line-height: 1;
  color: var(--bru-text-primary);
}

.roll-dc {
  display: inline-block;
  padding: 4px 12px;
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: var(--border-width-medium) solid var(--bru-border-primary);
  border-radius: 0;
}

/* --- Outcome badge --- */
.outcome-badge {
  display: block;
  width: 100%;
  padding: var(--space-4) var(--space-6);
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: center;
  border-radius: 0;
  margin-bottom: var(--space-6);
}

.outcome-badge.success {
  background: var(--bru-text-primary);
  color: var(--bru-text-inverse);
  border: var(--border-width-heavy) solid var(--bru-border-primary);
}

.outcome-badge.partial {
  background: var(--bru-surface);
  color: var(--bru-text-primary);
  border: var(--border-width-heavy) solid var(--bru-border-primary);
}

.outcome-badge.failure {
  background: var(--bru-accent);
  color: var(--bru-text-inverse);
  border: var(--border-width-heavy) solid var(--bru-accent);
}

/* --- Panel overlay --- */
#panel-overlay {
  display: none;
  padding: 0;
  background: var(--bru-overlay-bg);
  border: var(--border-width-heavy) solid var(--bru-border-primary);
}

#panel-overlay.visible {
  display: block;
}

.panel-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: var(--space-4);
  margin-bottom: var(--space-4);
  border-bottom: var(--border-width-heavy) solid var(--bru-border-primary);
}

.panel-title {
  font-family: var(--font-sans);
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--bru-text-primary);
}

.panel-close-btn {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  background: transparent;
  border: var(--border-width-medium) solid var(--bru-border-tertiary);
  border-radius: 0;
  padding: 8px 14px;
  min-height: 44px;
  min-width: 44px;
  color: var(--bru-text-tertiary);
  cursor: pointer;
  text-transform: uppercase;
}

.panel-close-btn:hover {
  border-color: var(--bru-border-primary);
  color: var(--bru-interactive-text-hover);
  background: var(--bru-interactive-bg-hover);
}

/* --- Scene footer --- */
.scene-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding-top: var(--space-4);
  margin-top: var(--space-6);
  border-top: var(--border-width-medium) solid var(--bru-border-primary);
}

.footer-panels {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

/* Footer panel/save buttons use ghost style */
.scene-footer button {
  border-width: var(--border-width-medium);
  border-color: var(--bru-border-secondary);
  font-size: 12px;
  padding: 8px 14px;
  min-height: 44px;
}

.scene-footer button:hover {
  border-color: var(--bru-border-primary);
  background: var(--bru-interactive-bg-hover);
  color: var(--bru-interactive-text-hover);
}

/* --- Dialogue widget --- */
.dialogue-bubble {
  padding: var(--space-4);
  padding-left: var(--space-5);
  border-left: 4px solid var(--bru-border-primary);
  margin-bottom: var(--space-4);
  font-size: 16px;
  line-height: 1.7;
}

.dialogue-bubble blockquote {
  margin: 0;
  quotes: none;
}

.tone-badge {
  display: inline-block;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: var(--border-width-medium) solid var(--bru-border-secondary);
  border-radius: 0;
  margin-bottom: var(--space-3);
}

.tone-badge.hostile {
  border-color: var(--bru-accent);
  color: var(--bru-accent);
}

/* --- Combat initiative bar --- */
.initiative-bar {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-bottom: var(--space-4);
  padding: var(--space-3);
  border: var(--border-width-medium) solid var(--bru-border-primary);
  background: var(--bru-surface-raised);
}

.initiative-entry {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border: var(--border-width-light) solid var(--bru-border-secondary);
  background: transparent;
  color: var(--bru-text-secondary);
}

.initiative-entry.active {
  background: var(--bru-text-primary);
  color: var(--bru-text-inverse);
  border-color: var(--bru-text-primary);
}

.initiative-entry.dead {
  opacity: 0.35;
  text-decoration: line-through;
}

/* --- Brief / continue reveal --- */
.brief-text {
  font-size: 18px;
  font-weight: 400;
  line-height: 1.7;
  margin-bottom: var(--space-6);
  color: var(--bru-text-secondary);
}

.continue-btn {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  min-height: 44px;
  padding: 10px 24px;
}

/* --- Utility classes --- */
.text-danger { color: var(--bru-accent); }
.text-muted  { color: var(--bru-text-tertiary); }
.text-mono   { font-family: var(--font-mono); }
.text-upper  { text-transform: uppercase; }
.text-bold   { font-weight: 700; }
.text-heavy  { font-weight: 900; }
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}

/* --- Micro-interactions (motion-safe only) --- */
@media (prefers-reduced-motion: no-preference) {
  button, .btn, [role="button"] {
    transition: background 80ms linear, color 80ms linear, border-color 80ms linear;
  }

  .panel-overlay {
    transition: opacity 120ms linear;
  }

  .pip.damaged {
    animation: pip-flash 400ms steps(1, end) 2;
  }

  @keyframes pip-flash {
    0%   { background: var(--bru-pip-danger); }
    50%  { background: var(--bru-pip-empty);  }
    100% { background: var(--bru-pip-danger); }
  }

  .dice-rolling {
    animation: dice-flicker 600ms steps(1, end);
  }

  @keyframes dice-flicker {
    0%, 20%, 40%, 60%, 80%  { opacity: 1; }
    10%, 30%, 50%, 70%, 90% { opacity: 0; }
    100% { opacity: 1; }
  }

  .outcome-badge {
    animation: badge-slam 150ms cubic-bezier(0.25, 0, 0.5, 1);
  }

  @keyframes badge-slam {
    from { transform: translateY(-8px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* --- No position: fixed anywhere (iframe constraint) --- */
/* All overlays use display:block / display:none toggling */
/* Panel overlays are in-flow, not fixed-position layers  */
```
