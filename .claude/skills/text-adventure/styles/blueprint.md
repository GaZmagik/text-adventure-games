---
name: Blueprint
description: >
  Technical drawing aesthetic inspired by architectural blueprints, engineering schematics,
  and mission control readouts. Precision grid lines, annotation marks, and monospaced
  typography throughout. Every element reads like a measured, deliberate technical document.
best-for:
  - output_styles: [technical, sci-fi, space, military, horror, thriller]
  - genres: [hard sci-fi, space opera, submarine, spy, post-apocalyptic, mech]
  - moods: [tense, clinical, procedural, analytical]
  - pairs_with: [ship-systems, star-chart, geo-map]
---

## Design Philosophy

Blueprint is a precision aesthetic. Nothing is decorative for its own sake — every visual
element exists because a draughtsman put it there for a reason. Text is monospaced because
measurements must align. Borders are 1px solid because 2px would be imprecise. The grid is
visible because it is the working surface itself.

The two modes tell the same story differently:

- **Dark mode** (`#1B3A5C` background): a cyanotype print under examination, lines glowing
  in the dark. The canonical blueprint experience — submarine control room, NASA mission
  control, a satellite schematic pinned to a lightbox.

- **Light mode** (`#FAFCFF` background): the same drawing on drafting paper, blue ink on
  white. An architect's table at noon, the graph paper showing through beneath the inked
  construction lines.

Both modes share a strict grid overlay via repeating CSS gradients. Every component is
rectangular. No border-radius on containers — only on interactive callout buttons where a
2px radius signals "press here". Dashed lines separate secondary information from primary.
Annotation labels sit beside their targets with a short leader line rendered in CSS.

The overall effect: a document produced by someone who works in millimetres.

---

## Typography

### Font Stacks

Blueprint earns its monospace-throughout rule. Every element uses the same stack because
a technical drawing does not mix typefaces.

```
Primary (all text):
  'IBM Plex Mono', 'Cascadia Code', 'SF Mono', 'Consolas', 'Courier New', monospace

Fallback for headings (if IBM Plex Mono unavailable at heading sizes):
  'Courier New', monospace
```

Google Fonts (`IBM Plex Mono`) may be CSP-blocked inside Claude.ai iframes. The stack
degrades gracefully: Cascadia Code (Windows Dev builds) → SF Mono (macOS) → Consolas
(Windows) → Courier New (universal).

### Scale

```
--bp-font-size-xs:    0.625rem   /* 10px — annotation labels, measurement units */
--bp-font-size-sm:    0.75rem    /* 12px — secondary labels, metadata */
--bp-font-size-base:  0.875rem   /* 14px — body text, narrative */
--bp-font-size-md:    1rem       /* 16px — stat values, roll results */
--bp-font-size-lg:    1.125rem   /* 18px — section headers */
--bp-font-size-xl:    1.375rem   /* 22px — widget title / scene heading */
--bp-font-size-2xl:   1.75rem    /* 28px — die face numeral */

--bp-line-height-tight:  1.3
--bp-line-height-base:   1.6
--bp-line-height-loose:  1.9     /* narrative paragraphs — readable at small size */

--bp-letter-spacing-label:  0.12em   /* uppercase annotation labels */
--bp-letter-spacing-tight:  0.02em   /* body text */
--bp-letter-spacing-wide:   0.2em    /* section divider text */
```

---

## Colour Palette

### Dark Mode (default — cyanotype blueprint)

```
--bp-color-bg-primary:        #1B3A5C   /* deep blueprint blue — main background */
--bp-color-bg-secondary:      #152E4A   /* darker blue — recessed panels, overlays */
--bp-color-bg-tertiary:       #0F2235   /* darkest — inset wells, code blocks */
--bp-color-bg-elevated:       #1F4268   /* slightly lighter — hover surfaces */

--bp-color-text-primary:      #E8F0FE   /* near-white blue — primary text */
--bp-color-text-secondary:    #8BB8E8   /* medium blue — secondary labels */
--bp-color-text-tertiary:     #5A8ABF   /* dimmed blue — placeholder, muted info */
--bp-color-text-inverse:      #1B3A5C   /* for text on light callout buttons */

--bp-color-line-primary:      #8BB8E8   /* main grid lines, primary borders */
--bp-color-line-secondary:    #3D6B9A   /* secondary grid lines, dashed separators */
--bp-color-line-accent:       #E8F0FE   /* bright white-blue — emphasis lines */

--bp-color-accent-info:       #5BA4E8   /* information / neutral status */
--bp-color-accent-success:    #4EC9A8   /* teal — success, operational */
--bp-color-accent-warning:    #E8B84B   /* amber — warning, degraded */
--bp-color-accent-danger:     #E86060   /* coral-red — danger, critical */
--bp-color-accent-mystery:    #9B7FE8   /* purple — unknown, encrypted */

--bp-color-roll-critical:     #FFD700   /* gold — nat 20, critical success */
--bp-color-roll-failure:      #E86060   /* red — nat 1, critical failure */

--bp-color-focus-ring:        #8BB8E8   /* keyboard focus outline */
--bp-color-selection-bg:      rgba(139, 184, 232, 0.25)
```

### Light Mode (drafting paper)

Activated via `@media (prefers-color-scheme: light)` and `[data-theme="light"]`.

```
--bp-color-bg-primary:        #FAFCFF   /* near-white — drafting paper */
--bp-color-bg-secondary:      #F0F5FF   /* light blue-white — panel backgrounds */
--bp-color-bg-tertiary:       #E4EDFA   /* pale blue — inset wells */
--bp-color-bg-elevated:       #FFFFFF   /* pure white — hover surfaces */

--bp-color-text-primary:      #1B3A5C   /* dark blueprint blue — primary text */
--bp-color-text-secondary:    #2D5F8A   /* mid blue — secondary labels */
--bp-color-text-tertiary:     #5A8ABF   /* light blue — placeholder, muted */
--bp-color-text-inverse:      #E8F0FE   /* for text on dark callout buttons */

--bp-color-line-primary:      #2D5F8A   /* main grid lines */
--bp-color-line-secondary:    #8BB8E8   /* secondary grid, dashed separators */
--bp-color-line-accent:       #1B3A5C   /* dark blue emphasis lines */

--bp-color-accent-info:       #1A6BBF   /* deeper blue for readability on white */
--bp-color-accent-success:    #1A8F72   /* darker teal */
--bp-color-accent-warning:    #BF7C00   /* darker amber */
--bp-color-accent-danger:     #BF2424   /* darker red */
--bp-color-accent-mystery:    #6344BF   /* darker purple */

--bp-color-roll-critical:     #9B7000   /* dark gold on white */
--bp-color-roll-failure:      #BF2424

--bp-color-focus-ring:        #1B3A5C
--bp-color-selection-bg:      rgba(27, 58, 92, 0.12)
```

### Grid Overlay Colours

The graph paper effect uses semi-transparent lines over the background:

```
/* Dark mode grid */
--bp-color-grid-major:  rgba(139, 184, 232, 0.12)   /* major grid — every 40px */
--bp-color-grid-minor:  rgba(139, 184, 232, 0.05)   /* minor grid — every 8px */

/* Light mode grid */
--bp-color-grid-major:  rgba(27, 58, 92, 0.10)
--bp-color-grid-minor:  rgba(27, 58, 92, 0.04)
```

---

## Spacing & Layout

```
--bp-space-1:   4px
--bp-space-2:   8px
--bp-space-3:   12px
--bp-space-4:   16px
--bp-space-5:   20px
--bp-space-6:   24px
--bp-space-8:   32px
--bp-space-10:  40px
--bp-space-12:  48px
--bp-space-16:  64px

--widget-max-width:    680px
--widget-padding:      var(--bp-space-6)
--section-gap:         var(--bp-space-8)
--component-gap:       var(--bp-space-4)
--label-gap:           var(--bp-space-2)

/* Grid overlay dimensions */
--bp-grid-minor-size:     8px
--bp-grid-major-size:     40px
```

Layout is single-column within widgets. No floats. Flexbox for rows, grid for stat blocks.
All content aligns to the 8px minor grid.

---

## Borders & Surfaces

Blueprint uses a strict two-weight border system. No shadows — elevation is communicated
through border weight and background tone only.

```
--bp-border-width-primary:    1px
--bp-border-width-secondary:  1px    /* same weight, different colour */
--bp-border-style-primary:    solid
--bp-border-style-secondary:  dashed

--bp-border-radius-none:      0
--bp-border-radius-sm:        2px    /* callout buttons only */
--bp-border-radius-md:        2px    /* panel close button */

/* Convenience shorthands */
--bp-border-primary:     1px solid var(--bp-color-line-primary)
--bp-border-secondary:   1px dashed var(--bp-color-line-secondary)
--bp-border-accent:      1px solid var(--bp-color-line-accent)
```

### Surface Rules

- Main widget container: `--bp-border-primary` on all four sides
- Panel overlays: `--bp-border-primary` top only (inset from widget)
- Section dividers: `--bp-border-secondary` bottom
- Inset wells (stat blocks, code displays): `--bp-border-secondary` all sides,
  `--bp-color-bg-tertiary` background
- No `box-shadow` anywhere — not a blueprint aesthetic

### Annotation Leader Lines

Annotation labels sit 8px to the right of a 16px horizontal CSS border line:

```css
.annotation-label::before {
  content: '';
  display: inline-block;
  width: 16px;
  height: 0;
  border-top: 1px solid var(--bp-color-line-secondary);
  vertical-align: middle;
  margin-right: 6px;
}
```

---

## Interactive Elements

### Buttons

All buttons are rectangular (`border-radius: 2px`), monospaced, uppercase labels with
tracked letter-spacing. They read as schematic callouts — labelled boxes pointing at
the thing they control.

```
Min touch target:  44px height, 44px width
Font:              var(--bp-font-mono), var(--bp-font-size-sm)
Letter-spacing:    var(--bp-letter-spacing-label)
Text-transform:    uppercase
```

**Primary button** — filled with accent blue, dark text:

```
Background:  var(--bp-color-line-primary)
Color:       var(--bp-color-text-inverse)
Border:      1px solid var(--bp-color-line-primary)
Padding:     10px 18px
```

**Secondary button** (most buttons) — transparent with border:

```
Background:  transparent
Color:       var(--bp-color-text-secondary)
Border:      var(--bp-border-primary)
Padding:     10px 18px
```

**Footer / panel toggle button** — same as secondary, condensed:

```
Background:  transparent
Color:       var(--bp-color-text-tertiary)
Border:      var(--bp-border-secondary)
Padding:     8px 14px
Font-size:   var(--bp-font-size-xs)
```

**Danger button** — for destructive or high-stakes actions:

```
Background:  transparent
Color:       var(--bp-color-accent-danger)
Border:      1px solid var(--bp-color-accent-danger)
```

### Hover States

Hover transitions are fast and precise — 80ms ease-out. No colour changes,
only border brightness and background tone shift.

```
Secondary hover:
  Border-color:  var(--bp-color-line-accent)
  Color:         var(--bp-color-text-primary)
  Background:    var(--bp-color-bg-elevated)

Footer hover:
  Border-color:  var(--bp-color-line-primary)
  Color:         var(--bp-color-text-secondary)
```

### Focus States

Keyboard focus uses a 2px outline offset by 2px — clearly visible, no rounded corners.

```css
:focus-visible {
  outline: 2px solid var(--bp-color-focus-ring);
  outline-offset: 2px;
  border-radius: 0;
}
```

### Action Options (choice buttons)

Action choice rows use a left-border annotation style rather than full buttons:

```
Display:      block
Border-left:  3px solid var(--bp-color-line-secondary)
Padding:      8px 12px
Background:   transparent
Color:        var(--bp-color-text-secondary)
Cursor:       pointer
```

Hover:
```
Border-left-color:  var(--bp-color-line-primary)
Color:              var(--bp-color-text-primary)
Background:         var(--bp-color-bg-elevated)
```

---

## Micro-interactions

All animations are gated behind `prefers-reduced-motion`. At reduced motion, transitions
are instant (`duration: 0`) and keyframe animations are replaced with immediate state changes.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Progressive Reveal

The brief-to-full transition uses a scan-line effect — content fades in top-to-bottom
like data loading onto a screen.

```css
@keyframes blueprint-scan {
  from {
    opacity: 0;
    clip-path: inset(0 0 100% 0);
  }
  to {
    opacity: 1;
    clip-path: inset(0 0 0% 0);
  }
}

#reveal-full {
  animation: blueprint-scan 0.4s ease-out forwards;
}
```

### Die Roll Animation

Die faces use a fast flicker — numbers cycling through values like a counter display
before locking on the result.

```css
@keyframes blueprint-counter {
  0%   { opacity: 0.3; transform: translateY(-2px); }
  50%  { opacity: 1;   transform: translateY(0); }
  100% { opacity: 1;   transform: translateY(0); }
}

.die-result {
  animation: blueprint-counter 0.15s ease-out;
}
```

### Button Press

No ripple — a precision instrument does not ripple. Instead: a 40ms inset border shift.

```css
button:active {
  transform: none;
  border-color: var(--bp-color-line-accent);
  background: var(--bp-color-bg-tertiary);
  transition: all 0.04s ease-out;
}
```

### Panel Slide

Panels slide in from the top using transform, not display toggling.

```css
@keyframes blueprint-panel-in {
  from { transform: translateY(-8px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

#panel-overlay[style*="display: block"],
#panel-overlay:not([style*="display: none"]) {
  animation: blueprint-panel-in 0.2s ease-out forwards;
}
```

### Status Bar Updates

When HP or system values change, the value flashes once.

```css
@keyframes blueprint-readout-flash {
  0%   { color: var(--bp-color-line-accent); }
  100% { color: var(--bp-color-text-primary); }
}

.stat-value.updated {
  animation: blueprint-readout-flash 0.6s ease-out forwards;
}
```

---

## Component Overrides

### Scene Widget

The scene container sits on the grid background. The location bar is a full-width
measurement strip with cross-hair markers at each end.

```
.loc-bar:
  Font-size:      var(--bp-font-size-xs)
  Letter-spacing: var(--bp-letter-spacing-label)
  Text-transform: uppercase
  Color:          var(--bp-color-text-tertiary)
  Border-bottom:  var(--bp-border-secondary)
  Padding:        var(--bp-space-2) 0
  Display:        flex
  Gap:            var(--bp-space-4)

  Before pseudo (cross-hair left):
    Content: '+'
    Color: var(--bp-color-line-secondary)
    Margin-right: var(--bp-space-2)

.atmo-strip (atmospheric condition banner):
  Font-size:      var(--bp-font-size-xs)
  Letter-spacing: var(--bp-letter-spacing-label)
  Color:          var(--bp-color-text-tertiary)
  Border:         var(--bp-border-secondary)
  Padding:        var(--bp-space-1) var(--bp-space-3)
  Text-transform: uppercase
  Background:     var(--bp-color-bg-tertiary)

.narrative:
  Font-size:   var(--bp-font-size-base)
  Line-height: var(--bp-line-height-loose)
  Color:       var(--bp-color-text-primary)
  Border-left: 3px solid var(--bp-color-line-secondary)
  Padding:     var(--bp-space-3) var(--bp-space-4)
  Background:  var(--bp-color-bg-secondary)
```

### Die Roll Widget

Die rolls must read as engineering calculations — input values, process, output with
units. The die face is a square with corner tick marks.

```
.die-widget:
  Border:     var(--bp-border-primary)
  Background: var(--bp-color-bg-secondary)
  Padding:    var(--bp-space-6)
  Font-family: var(--bp-font-mono)

.die-face:
  Width:        80px
  Height:       80px
  Border:       var(--bp-border-accent)
  Border-radius: 0            /* no rounding — it's a technical readout */
  Font-size:    var(--bp-font-size-2xl)
  Color:        var(--bp-color-text-primary)
  Display:      grid
  Place-items:  center
  Position:     relative

  Corner tick marks via ::before / ::after + box-shadow:
    Content: ''
    Position: absolute
    Top: -4px; Left: -4px
    Width: 8px; Height: 8px
    Border-top: 2px solid var(--bp-color-line-accent)
    Border-left: 2px solid var(--bp-color-line-accent)

.die-label:
  Font-size:      var(--bp-font-size-xs)
  Letter-spacing: var(--bp-letter-spacing-label)
  Text-transform: uppercase
  Color:          var(--bp-color-text-tertiary)

.die-modifier-row:
  Display:        flex
  Gap:            var(--bp-space-4)
  Font-size:      var(--bp-font-size-sm)
  Color:          var(--bp-color-text-secondary)
  Border-top:     var(--bp-border-secondary)
  Padding-top:    var(--bp-space-3)
  Margin-top:     var(--bp-space-3)

.die-result-total:
  Font-size:  var(--bp-font-size-xl)
  Color:      var(--bp-color-text-primary)

  Critical success (nat 20 or equivalent):
    Color:    var(--bp-color-roll-critical)
    After content: ' [CRIT]'

  Critical failure:
    Color:    var(--bp-color-roll-failure)
    After content: ' [FAIL]'
```

### Combat Widget

Initiative order reads as a sortable technical table. HP tracks are segmented bars,
not gradients.

```
.combat-header:
  Font-size:      var(--bp-font-size-xs)
  Letter-spacing: var(--bp-letter-spacing-label)
  Text-transform: uppercase
  Color:          var(--bp-color-text-tertiary)
  Border-bottom:  var(--bp-border-primary)
  Padding-bottom: var(--bp-space-2)

.combatant-row:
  Display:     grid
  Grid-template-columns: 2fr 1fr 1fr 1fr
  Gap:         var(--bp-space-3)
  Padding:     var(--bp-space-2) 0
  Border-bottom: var(--bp-border-secondary)
  Font-size:   var(--bp-font-size-sm)
  Align-items: center

  Active turn:
    Background: var(--bp-color-bg-elevated)
    Border-left: 3px solid var(--bp-color-line-accent)
    Padding-left: var(--bp-space-3)

.hp-track:
  Display: flex
  Gap: 2px

.hp-pip:
  Width:  8px
  Height: 8px
  Border: 1px solid var(--bp-color-line-secondary)
  Background: transparent

  Filled:
    Background: var(--bp-color-accent-success)
    Border-color: var(--bp-color-accent-success)

  Damaged:
    Background: var(--bp-color-accent-warning)
    Border-color: var(--bp-color-accent-warning)

  Critical:
    Background: var(--bp-color-accent-danger)
    Border-color: var(--bp-color-accent-danger)
```

### Dialogue Widget

NPC speech is a transmission block — annotated with speaker ID, disposition readout,
and a horizontal rule separating incoming from response options.

```
.dialogue-header:
  Font-size:      var(--bp-font-size-xs)
  Letter-spacing: var(--bp-letter-spacing-label)
  Text-transform: uppercase
  Color:          var(--bp-color-text-tertiary)
  Margin-bottom:  var(--bp-space-3)

  NPC name:
    Color: var(--bp-color-text-secondary)
    Font-size: var(--bp-font-size-sm)

.dialogue-speech:
  Border-left:   3px solid var(--bp-color-line-primary)
  Padding:       var(--bp-space-3) var(--bp-space-4)
  Background:    var(--bp-color-bg-secondary)
  Font-size:     var(--bp-font-size-base)
  Line-height:   var(--bp-line-height-loose)
  Color:         var(--bp-color-text-primary)
  Margin-bottom: var(--bp-space-4)

.disposition-bar:
  Font-size:  var(--bp-font-size-xs)
  Color:      var(--bp-color-text-tertiary)
  Display:    flex
  Gap:        var(--bp-space-2)
  Align-items: center
  Margin-bottom: var(--bp-space-4)

  Readout strip (visual track):
    Height:     2px
    Background: var(--bp-color-line-secondary)
    Flex:       1

    Fill portion:
      Height:  100%
      Background: var(--bp-color-accent-info)
      Transition: width 0.3s ease-out
```

### Character Creation / Settings Widget

Forms read as data-entry panels on a console. Labels are annotation callouts; inputs
are measurement fields.

```
.form-field:
  Display:        grid
  Grid-template-columns: 140px 1fr
  Gap:            var(--bp-space-4)
  Align-items:    start
  Padding:        var(--bp-space-3) 0
  Border-bottom:  var(--bp-border-secondary)

.form-label:
  Font-size:      var(--bp-font-size-xs)
  Letter-spacing: var(--bp-letter-spacing-label)
  Text-transform: uppercase
  Color:          var(--bp-color-text-tertiary)
  Padding-top:    2px

  Annotation leader:
    Before pseudo: 8px horizontal line in --bp-color-line-secondary

input, select:
  Background:  var(--bp-color-bg-tertiary)
  Border:      var(--bp-border-primary)
  Border-radius: 0
  Color:       var(--bp-color-text-primary)
  Font-family: var(--bp-font-mono)
  Font-size:   var(--bp-font-size-sm)
  Padding:     var(--bp-space-2) var(--bp-space-3)
  Min-height:  44px
  Width:       100%
  Box-sizing:  border-box

  Focus:
    Outline: 2px solid var(--bp-color-focus-ring)
    Outline-offset: 2px
```

### Map Widget (SVG)

Map overlays use blueprint line weights. Room labels are uppercase monospaced.
Unexplored areas are `--bp-color-bg-tertiary` fill; explored use `--bp-color-bg-secondary`.

```
SVG stroke-width: 1px (rooms), 0.5px (corridors)
SVG stroke: var(--bp-color-line-primary) on dark, var(--bp-color-line-primary) on light
SVG fill: var(--bp-color-bg-secondary) for rooms
Room label text: font-family monospace, font-size 9px, letter-spacing 0.1em, uppercase
Grid overlay: visible behind map at 8px minor / 40px major
```

### Status Bar (HP, XP, resources)

```
.status-bar:
  Display:      flex
  Gap:          var(--bp-space-6)
  Padding:      var(--bp-space-3) 0
  Border-top:   var(--bp-border-secondary)
  Font-size:    var(--bp-font-size-xs)

.status-item:
  Display:    flex
  Gap:        var(--bp-space-2)
  Align-items: baseline

.status-label:
  Letter-spacing: var(--bp-letter-spacing-label)
  Text-transform: uppercase
  Color:          var(--bp-color-text-tertiary)

.status-value:
  Color:     var(--bp-color-text-primary)
  Font-size: var(--bp-font-size-sm)

.status-unit:
  Color:     var(--bp-color-text-tertiary)
  Font-size: var(--bp-font-size-xs)
```

### Panel Overlay

```
#panel-overlay:
  Background:    var(--bp-color-bg-secondary)
  Border-top:    var(--bp-border-primary)
  Padding:       var(--bp-space-6)

.panel-title:
  Font-family:    var(--bp-font-mono)
  Font-size:      var(--bp-font-size-lg)
  Letter-spacing: var(--bp-letter-spacing-label)
  Text-transform: uppercase
  Color:          var(--bp-color-text-primary)

.panel-close-btn:
  Font-family:    var(--bp-font-mono)
  Font-size:      var(--bp-font-size-xs)
  Letter-spacing: var(--bp-letter-spacing-label)
  Text-transform: uppercase
  Border:         var(--bp-border-primary)
  Border-radius:  2px
  Background:     transparent
  Color:          var(--bp-color-text-tertiary)
  Min-height:     44px
  Padding:        8px 16px
```

---

## Complete CSS Block

Inject this block into any widget. It defines all variables for both colour schemes,
the grid overlay, and component resets. Individual component styles follow the variable
definitions and can be applied selectively.

```css
/* @extract */
/* ============================================================
   BLUEPRINT VISUAL STYLE
   Text Adventure Game Engine — Visual Theme Override
   ============================================================ */

/* --- Font Import Attempt (may be CSP-blocked in iframes) --- */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');

/* --- CSS Custom Properties: Dark Mode (default) ------------ */
:host {
  /* Typography */
  --bp-font-mono: 'IBM Plex Mono', 'Cascadia Code', 'SF Mono', 'Consolas', 'Courier New', monospace;
  --bp-font-sans: var(--bp-font-mono); /* Blueprint uses mono throughout */

  --bp-font-size-xs:   0.625rem;
  --bp-font-size-sm:   0.75rem;
  --bp-font-size-base: 0.875rem;
  --bp-font-size-md:   1rem;
  --bp-font-size-lg:   1.125rem;
  --bp-font-size-xl:   1.375rem;
  --bp-font-size-2xl:  1.75rem;

  --bp-line-height-tight: 1.3;
  --bp-line-height-base:  1.6;
  --bp-line-height-loose: 1.9;

  --bp-letter-spacing-label: 0.12em;
  --bp-letter-spacing-tight: 0.02em;
  --bp-letter-spacing-wide:  0.2em;

  /* Spacing */
  --bp-space-1:  4px;
  --bp-space-2:  8px;
  --bp-space-3:  12px;
  --bp-space-4:  16px;
  --bp-space-5:  20px;
  --bp-space-6:  24px;
  --bp-space-8:  32px;
  --bp-space-10: 40px;
  --bp-space-12: 48px;
  --bp-space-16: 64px;

  /* Borders */
  --bp-border-radius-none: 0;
  --bp-border-radius-sm:   2px;
  --bp-border-radius-md:   2px;

  /* Grid overlay */
  --bp-grid-minor-size: 8px;
  --bp-grid-major-size: 40px;

  /* Dark mode colours */
  --bp-color-bg-primary:        #1B3A5C;
  --bp-color-bg-secondary:      #152E4A;
  --bp-color-bg-tertiary:       #0F2235;
  --bp-color-bg-elevated:       #1F4268;

  --bp-color-text-primary:      #E8F0FE;
  --bp-color-text-secondary:    #8BB8E8;
  --bp-color-text-tertiary:     #5A8ABF;
  --bp-color-text-inverse:      #1B3A5C;

  --bp-color-line-primary:      #8BB8E8;
  --bp-color-line-secondary:    #3D6B9A;
  --bp-color-line-accent:       #E8F0FE;

  --bp-color-accent-info:       #5BA4E8;
  --bp-color-accent-success:    #4EC9A8;
  --bp-color-accent-warning:    #E8B84B;
  --bp-color-accent-danger:     #E86060;
  --bp-color-accent-mystery:    #9B7FE8;

  --bp-color-roll-critical:     #FFD700;
  --bp-color-roll-failure:      #E86060;

  --bp-color-focus-ring:        #8BB8E8;
  --bp-color-selection-bg:      rgba(139, 184, 232, 0.25);

  --bp-color-grid-major:        rgba(139, 184, 232, 0.12);
  --bp-color-grid-minor:        rgba(139, 184, 232, 0.05);

  /* Convenience border shorthands */
  --bp-border-primary:   1px solid var(--bp-color-line-primary);
  --bp-border-secondary: 1px dashed var(--bp-color-line-secondary);
  --bp-border-accent:    1px solid var(--bp-color-line-accent);

  /* Legacy aliases for engine compatibility */
  --bp-color-border-tertiary:   var(--bp-color-line-secondary);
  --bp-color-border-secondary:  var(--bp-color-line-primary);

  /* ── CSS Custom Property Contract (required by style-reference.md) ─ */
  --ta-font-heading:              var(--bp-font-sans);
  --ta-font-body:                 var(--bp-font-mono);
  --ta-color-accent:              var(--bp-color-accent-info);
  --ta-color-accent-hover:        color-mix(in srgb, var(--bp-color-accent-info) 85%, white);
  --ta-color-accent-bg:           var(--bp-color-bg-elevated);
  --ta-color-accent-bg-hover:     color-mix(in srgb, var(--bp-color-bg-elevated) 70%, var(--bp-color-accent-info));
  --ta-color-success:             var(--bp-color-accent-success);
  --ta-color-success-border:      color-mix(in srgb, var(--bp-color-accent-success) 70%, black);
  --ta-color-danger:              var(--bp-color-accent-danger);
  --ta-color-danger-border:       color-mix(in srgb, var(--bp-color-accent-danger) 70%, black);
  --ta-color-danger-bg:           rgba(200, 60, 60, 0.12);
  --ta-color-danger-bg-hover:     rgba(200, 60, 60, 0.20);
  --ta-color-warning:             var(--bp-color-accent-warning);
  --ta-color-warning-border:      color-mix(in srgb, var(--bp-color-accent-warning) 70%, black);
  --ta-color-warning-bg:          rgba(200, 160, 40, 0.12);
  --ta-color-xp:                  var(--bp-color-accent-mystery);
  --ta-color-focus:               var(--bp-color-focus-ring);
  --ta-color-conviction:          var(--bp-color-accent-mystery);
  --ta-color-conviction-border:   color-mix(in srgb, var(--bp-color-accent-mystery) 70%, black);
  --ta-badge-success-bg:          rgba(60, 160, 100, 0.12);
  --ta-badge-success-text:        var(--bp-color-accent-success);
  --ta-badge-partial-bg:          rgba(200, 160, 40, 0.12);
  --ta-badge-partial-text:        var(--bp-color-accent-warning);
  --ta-badge-failure-bg:          rgba(200, 60, 60, 0.12);
  --ta-badge-failure-text:        var(--bp-color-accent-danger);
  --ta-badge-crit-success-border: var(--bp-color-accent-success);
  --ta-badge-crit-failure-border: var(--bp-color-accent-danger);
  --ta-color-credits:             var(--bp-color-accent-info);
  --ta-color-tab-active:          var(--bp-color-line-accent);
  --ta-border-style-poi:          1px dashed;
  --ta-die-spin-duration:         0.5s;

  /* --- Speaker colours (multi-dialogue) --- */
  --speaker-color-0: #ffffff;
  --speaker-color-1: #a8d8ea;
  --speaker-color-2: #b0c4de;
  --speaker-color-3: #7ec8e3;
  --speaker-color-4: #dce9f5;
  --speaker-color-5: #4a90d9;
}

/* --- CSS Custom Properties: Light Mode --------------------- */
@media (prefers-color-scheme: light) {
  :host {
    --bp-color-bg-primary:        #FAFCFF;
    --bp-color-bg-secondary:      #F0F5FF;
    --bp-color-bg-tertiary:       #E4EDFA;
    --bp-color-bg-elevated:       #FFFFFF;

    --bp-color-text-primary:      #1B3A5C;
    --bp-color-text-secondary:    #2D5F8A;
    --bp-color-text-tertiary:     #5A8ABF;
    --bp-color-text-inverse:      #E8F0FE;

    --bp-color-line-primary:      #2D5F8A;
    --bp-color-line-secondary:    #8BB8E8;
    --bp-color-line-accent:       #1B3A5C;

    --bp-color-accent-info:       #1A6BBF;
    --bp-color-accent-success:    #1A8F72;
    --bp-color-accent-warning:    #BF7C00;
    --bp-color-accent-danger:     #BF2424;
    --bp-color-accent-mystery:    #6344BF;

    --bp-color-roll-critical:     #9B7000;
    --bp-color-roll-failure:      #BF2424;

    --bp-color-focus-ring:        #1B3A5C;
    --bp-color-selection-bg:      rgba(27, 58, 92, 0.12);

    --bp-color-grid-major:        rgba(27, 58, 92, 0.10);
    --bp-color-grid-minor:        rgba(27, 58, 92, 0.04);

    --bp-border-primary:   1px solid var(--bp-color-line-primary);
    --bp-border-secondary: 1px dashed var(--bp-color-line-secondary);
    --bp-border-accent:    1px solid var(--bp-color-line-accent);

    --bp-color-border-tertiary:   var(--bp-color-line-secondary);
    --bp-color-border-secondary:  var(--bp-color-line-primary);
  }
}

/* Data attribute override for explicit theme switching */
[data-theme="light"] {
  --bp-color-bg-primary:        #FAFCFF;
  --bp-color-bg-secondary:      #F0F5FF;
  --bp-color-bg-tertiary:       #E4EDFA;
  --bp-color-bg-elevated:       #FFFFFF;
  --bp-color-text-primary:      #1B3A5C;
  --bp-color-text-secondary:    #2D5F8A;
  --bp-color-text-tertiary:     #5A8ABF;
  --bp-color-text-inverse:      #E8F0FE;
  --bp-color-line-primary:      #2D5F8A;
  --bp-color-line-secondary:    #8BB8E8;
  --bp-color-line-accent:       #1B3A5C;
  --bp-color-accent-info:       #1A6BBF;
  --bp-color-accent-success:    #1A8F72;
  --bp-color-accent-warning:    #BF7C00;
  --bp-color-accent-danger:     #BF2424;
  --bp-color-accent-mystery:    #6344BF;
  --bp-color-grid-major:        rgba(27, 58, 92, 0.10);
  --bp-color-grid-minor:        rgba(27, 58, 92, 0.04);
  --bp-color-focus-ring:        #1B3A5C;
}

/* --- Reduced Motion ---------------------------------------- */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration:        0.01ms !important;
    animation-iteration-count: 1      !important;
    transition-duration:       0.01ms !important;
    scroll-behavior:           auto   !important;
  }
}

/* --- Base Reset -------------------------------------------- */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

::selection {
  background: var(--bp-color-selection-bg);
  color: var(--bp-color-text-primary);
}

/* --- Root Widget Container --------------------------------- */
.root {
  font-family:      var(--bp-font-mono);
  font-size:        var(--bp-font-size-base);
  line-height:      var(--bp-line-height-base);
  letter-spacing:   var(--bp-letter-spacing-tight);
  color:            var(--bp-color-text-primary);
  background-color: var(--bp-color-bg-primary);
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent calc(var(--bp-grid-minor-size) - 1px),
      var(--bp-color-grid-minor) calc(var(--bp-grid-minor-size) - 1px),
      var(--bp-color-grid-minor) var(--bp-grid-minor-size)
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent calc(var(--bp-grid-minor-size) - 1px),
      var(--bp-color-grid-minor) calc(var(--bp-grid-minor-size) - 1px),
      var(--bp-color-grid-minor) var(--bp-grid-minor-size)
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent calc(var(--bp-grid-major-size) - 1px),
      var(--bp-color-grid-major) calc(var(--bp-grid-major-size) - 1px),
      var(--bp-color-grid-major) var(--bp-grid-major-size)
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent calc(var(--bp-grid-major-size) - 1px),
      var(--bp-color-grid-major) calc(var(--bp-grid-major-size) - 1px),
      var(--bp-color-grid-major) var(--bp-grid-major-size)
    );
  border:           var(--bp-border-primary);
  padding:          var(--bp-space-6);
  max-width:        680px;
  margin:           0 auto;
  position:         relative;
  overflow:         hidden;
}

/* --- Typography -------------------------------------------- */
h1, h2, h3, h4, h5, h6 {
  font-family:    var(--bp-font-mono);
  font-weight:    600;
  letter-spacing: var(--bp-letter-spacing-label);
  text-transform: uppercase;
  color:          var(--bp-color-text-primary);
  line-height:    var(--bp-line-height-tight);
  margin-bottom:  var(--bp-space-3);
}

h1 { font-size: var(--bp-font-size-xl); }
h2 { font-size: var(--bp-font-size-lg); }
h3 { font-size: var(--bp-font-size-md); }

p {
  font-size:     var(--bp-font-size-base);
  line-height:   var(--bp-line-height-loose);
  color:         var(--bp-color-text-primary);
  margin-bottom: var(--bp-space-4);
}

/* --- Annotation Labels ------------------------------------- */
.label,
.stat-label,
.form-label,
.panel-section-label {
  font-size:      var(--bp-font-size-xs);
  letter-spacing: var(--bp-letter-spacing-label);
  text-transform: uppercase;
  color:          var(--bp-color-text-tertiary);
  display:        flex;
  align-items:    center;
  gap:            var(--bp-space-2);
}

.label::before {
  content:     '';
  display:     inline-block;
  width:       16px;
  height:      0;
  border-top:  1px solid var(--bp-color-line-secondary);
  flex-shrink: 0;
}

/* --- Buttons ----------------------------------------------- */
button {
  font-family:    var(--bp-font-mono);
  font-size:      var(--bp-font-size-sm);
  letter-spacing: var(--bp-letter-spacing-label);
  text-transform: uppercase;
  cursor:         pointer;
  border-radius:  var(--bp-border-radius-sm);
  min-height:     44px;
  min-width:      44px;
  padding:        10px 18px;
  transition:     border-color 0.08s ease-out, color 0.08s ease-out, background 0.08s ease-out;
  box-sizing:     border-box;
}

button:active {
  border-color: var(--bp-color-line-accent) !important;
  background:   var(--bp-color-bg-tertiary) !important;
  transition:   all 0.04s ease-out;
}

.btn-primary {
  background:   var(--bp-color-line-primary);
  color:        var(--bp-color-text-inverse);
  border:       1px solid var(--bp-color-line-primary);
}

.btn-primary:hover {
  background:   var(--bp-color-line-accent);
  border-color: var(--bp-color-line-accent);
}

.btn-secondary,
.action-btn,
.continue-btn {
  background:  transparent;
  color:       var(--bp-color-text-secondary);
  border:      var(--bp-border-primary);
}

.btn-secondary:hover,
.action-btn:hover,
.continue-btn:hover {
  border-color: var(--bp-color-line-accent);
  color:        var(--bp-color-text-primary);
  background:   var(--bp-color-bg-elevated);
}

.btn-danger {
  background:  transparent;
  color:       var(--bp-color-accent-danger);
  border:      1px solid var(--bp-color-accent-danger);
}

.btn-danger:hover {
  background: rgba(232, 96, 96, 0.1);
}

.footer-btn {
  background:     transparent;
  color:          var(--bp-color-text-tertiary);
  border:         var(--bp-border-secondary);
  font-size:      var(--bp-font-size-xs);
  padding:        8px 14px;
  min-height:     44px;
  border-radius:  var(--bp-border-radius-sm);
}

.footer-btn:hover {
  border-color: var(--bp-color-line-primary);
  color:        var(--bp-color-text-secondary);
}

/* --- Focus States ------------------------------------------ */
:focus-visible {
  outline:        2px solid var(--bp-color-focus-ring);
  outline-offset: 2px;
  border-radius:  0;
}

/* --- Action Choice List ------------------------------------ */
.actions-list {
  display:        flex;
  flex-direction: column;
  gap:            var(--bp-space-1);
  margin:         var(--bp-space-4) 0;
}

.action-option {
  display:        block;
  border:         none;
  border-left:    3px solid var(--bp-color-line-secondary);
  padding:        var(--bp-space-2) var(--bp-space-3);
  background:     transparent;
  color:          var(--bp-color-text-secondary);
  font-family:    var(--bp-font-mono);
  font-size:      var(--bp-font-size-sm);
  letter-spacing: var(--bp-letter-spacing-tight);
  text-transform: none;
  text-align:     left;
  cursor:         pointer;
  min-height:     44px;
  width:          100%;
  transition:     border-color 0.08s ease-out, color 0.08s ease-out, background 0.08s ease-out;
}

.action-option:hover {
  border-left-color: var(--bp-color-line-primary);
  color:             var(--bp-color-text-primary);
  background:        var(--bp-color-bg-elevated);
}

/* --- Narrative Block --------------------------------------- */
.narrative {
  border-left:   3px solid var(--bp-color-line-secondary);
  padding:       var(--bp-space-3) var(--bp-space-4);
  background:    var(--bp-color-bg-secondary);
  font-size:     var(--bp-font-size-base);
  line-height:   var(--bp-line-height-loose);
  color:         var(--bp-color-text-primary);
  margin-bottom: var(--bp-space-4);
}

/* --- Location Bar ------------------------------------------ */
.loc-bar {
  display:        flex;
  align-items:    center;
  gap:            var(--bp-space-4);
  font-size:      var(--bp-font-size-xs);
  letter-spacing: var(--bp-letter-spacing-label);
  text-transform: uppercase;
  color:          var(--bp-color-text-tertiary);
  border-bottom:  var(--bp-border-secondary);
  padding-bottom: var(--bp-space-2);
  margin-bottom:  var(--bp-space-4);
}

.loc-bar::before {
  content: '+';
  color:   var(--bp-color-line-secondary);
  flex-shrink: 0;
}

/* --- Atmosphere Strip ------------------------------------- */
.atmo-strip {
  font-size:      var(--bp-font-size-xs);
  letter-spacing: var(--bp-letter-spacing-label);
  text-transform: uppercase;
  color:          var(--bp-color-text-tertiary);
  border:         var(--bp-border-secondary);
  padding:        var(--bp-space-1) var(--bp-space-3);
  background:     var(--bp-color-bg-tertiary);
  margin-bottom:  var(--bp-space-4);
  display:        inline-block;
}

/* --- Status Bar ------------------------------------------- */
.status-bar {
  display:      flex;
  gap:          var(--bp-space-6);
  padding:      var(--bp-space-3) 0;
  border-top:   var(--bp-border-secondary);
  margin-top:   var(--bp-space-4);
  flex-wrap:    wrap;
}

.status-item {
  display:     flex;
  gap:         var(--bp-space-2);
  align-items: baseline;
}

.stat-label {
  font-size:      var(--bp-font-size-xs);
  letter-spacing: var(--bp-letter-spacing-label);
  text-transform: uppercase;
  color:          var(--bp-color-text-tertiary);
}

.stat-value,
.status-value {
  font-size:  var(--bp-font-size-sm);
  color:      var(--bp-color-text-primary);
  font-weight: 500;
}

.status-unit {
  font-size: var(--bp-font-size-xs);
  color:     var(--bp-color-text-tertiary);
}

/* --- HP Pip Track ----------------------------------------- */
.hp-track {
  display: flex;
  gap:     2px;
  align-items: center;
}

.hp-pip {
  width:  8px;
  height: 8px;
  border: 1px solid var(--bp-color-line-secondary);
  background: transparent;
}

.hp-pip.filled     { background: var(--bp-color-accent-success); border-color: var(--bp-color-accent-success); }
.hp-pip.damaged    { background: var(--bp-color-accent-warning); border-color: var(--bp-color-accent-warning); }
.hp-pip.critical   { background: var(--bp-color-accent-danger);  border-color: var(--bp-color-accent-danger);  }

/* --- Die Roll Widget --------------------------------------- */
.die-widget {
  border:     var(--bp-border-primary);
  background: var(--bp-color-bg-secondary);
  padding:    var(--bp-space-6);
  font-family: var(--bp-font-mono);
}

.die-face {
  position:    relative;
  width:       80px;
  height:      80px;
  border:      var(--bp-border-accent);
  border-radius: 0;
  font-size:   var(--bp-font-size-2xl);
  font-weight: 600;
  color:       var(--bp-color-text-primary);
  display:     grid;
  place-items: center;
  margin:      var(--bp-space-4) auto;
}

/* Corner tick marks */
.die-face::before,
.die-face::after {
  content:  '';
  position: absolute;
  width:    8px;
  height:   8px;
}

.die-face::before {
  top:          -4px;
  left:         -4px;
  border-top:   2px solid var(--bp-color-line-accent);
  border-left:  2px solid var(--bp-color-line-accent);
}

.die-face::after {
  bottom:        -4px;
  right:         -4px;
  border-bottom: 2px solid var(--bp-color-line-accent);
  border-right:  2px solid var(--bp-color-line-accent);
}

.die-label {
  font-size:      var(--bp-font-size-xs);
  letter-spacing: var(--bp-letter-spacing-label);
  text-transform: uppercase;
  color:          var(--bp-color-text-tertiary);
  text-align:     center;
}

.die-modifier-row {
  display:        flex;
  gap:            var(--bp-space-4);
  font-size:      var(--bp-font-size-sm);
  color:          var(--bp-color-text-secondary);
  border-top:     var(--bp-border-secondary);
  padding-top:    var(--bp-space-3);
  margin-top:     var(--bp-space-3);
}

.die-result-total {
  font-size:  var(--bp-font-size-xl);
  font-weight: 600;
  color:       var(--bp-color-text-primary);
  text-align:  center;
  padding:     var(--bp-space-3) 0;
}

.die-result-total.critical { color: var(--bp-color-roll-critical); }
.die-result-total.failure  { color: var(--bp-color-roll-failure);  }

/* --- Panel Overlay ---------------------------------------- */
#panel-overlay {
  display:    none;
  padding:    0;
  background: var(--bp-color-bg-secondary);
  border-top: var(--bp-border-primary);
}

.panel-header {
  display:         flex;
  align-items:     baseline;
  justify-content: space-between;
  padding:         var(--bp-space-4) var(--bp-space-6) var(--bp-space-3);
  border-bottom:   var(--bp-border-secondary);
  margin-bottom:   var(--bp-space-4);
}

.panel-title {
  font-family:    var(--bp-font-mono);
  font-size:      var(--bp-font-size-lg);
  font-weight:    600;
  letter-spacing: var(--bp-letter-spacing-label);
  text-transform: uppercase;
  color:          var(--bp-color-text-primary);
}

.panel-close-btn {
  font-family:    var(--bp-font-mono);
  font-size:      var(--bp-font-size-xs);
  letter-spacing: var(--bp-letter-spacing-label);
  text-transform: uppercase;
  background:     transparent;
  border:         var(--bp-border-primary);
  border-radius:  var(--bp-border-radius-md);
  padding:        8px 16px;
  min-height:     44px;
  min-width:      44px;
  color:          var(--bp-color-text-tertiary);
  cursor:         pointer;
  transition:     border-color 0.08s ease-out, color 0.08s ease-out;
}

.panel-close-btn:hover {
  border-color: var(--bp-color-line-primary);
  color:        var(--bp-color-text-secondary);
}

.panel-content {
  display: none;
  padding: 0 var(--bp-space-6) var(--bp-space-6);
}

/* --- Footer Row ------------------------------------------- */
.footer-row {
  display:      flex;
  flex-wrap:    wrap;
  gap:          var(--bp-space-2);
  padding-top:  var(--bp-space-4);
  border-top:   var(--bp-border-secondary);
  margin-top:   var(--bp-space-4);
  align-items:  center;
}

.footer-row .save-btn {
  margin-left: auto;
}

/* --- Inset Wells (stat blocks, code) ---------------------- */
.inset-well,
.stat-block,
.readout {
  background:    var(--bp-color-bg-tertiary);
  border:        var(--bp-border-secondary);
  padding:       var(--bp-space-3) var(--bp-space-4);
  font-size:     var(--bp-font-size-sm);
  font-family:   var(--bp-font-mono);
  color:         var(--bp-color-text-secondary);
  margin-bottom: var(--bp-space-3);
}

/* --- Section Divider --------------------------------------- */
.section-divider {
  border:        none;
  border-bottom: var(--bp-border-secondary);
  margin:        var(--bp-space-6) 0;
  position:      relative;
}

.section-divider-label {
  position:       absolute;
  top:            -8px;
  left:           var(--bp-space-4);
  background:     var(--bp-color-bg-primary);
  padding:        0 var(--bp-space-2);
  font-size:      var(--bp-font-size-xs);
  letter-spacing: var(--bp-letter-spacing-wide);
  text-transform: uppercase;
  color:          var(--bp-color-text-tertiary);
}

/* --- Animations ------------------------------------------- */
@keyframes blueprint-scan {
  from { opacity: 0; clip-path: inset(0 0 100% 0); }
  to   { opacity: 1; clip-path: inset(0 0 0% 0);   }
}

@keyframes blueprint-counter {
  0%   { opacity: 0.3; transform: translateY(-2px); }
  50%  { opacity: 1;   transform: translateY(0);    }
  100% { opacity: 1;   transform: translateY(0);    }
}

@keyframes blueprint-panel-in {
  from { transform: translateY(-8px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

@keyframes blueprint-readout-flash {
  0%   { color: var(--bp-color-line-accent);   }
  100% { color: var(--bp-color-text-primary);  }
}

#reveal-full                    { animation: blueprint-scan       0.4s ease-out forwards; }
.die-result                     { animation: blueprint-counter    0.15s ease-out; }
.stat-value.updated             { animation: blueprint-readout-flash 0.6s ease-out forwards; }

/* Tabindex-0 panel visibility — applied by togglePanel() JS */
#panel-overlay.panel-visible    { animation: blueprint-panel-in  0.2s ease-out forwards; }
```
