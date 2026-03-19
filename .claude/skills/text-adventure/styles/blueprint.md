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
--font-size-xs:    0.625rem   /* 10px — annotation labels, measurement units */
--font-size-sm:    0.75rem    /* 12px — secondary labels, metadata */
--font-size-base:  0.875rem   /* 14px — body text, narrative */
--font-size-md:    1rem       /* 16px — stat values, roll results */
--font-size-lg:    1.125rem   /* 18px — section headers */
--font-size-xl:    1.375rem   /* 22px — widget title / scene heading */
--font-size-2xl:   1.75rem    /* 28px — die face numeral */

--line-height-tight:  1.3
--line-height-base:   1.6
--line-height-loose:  1.9     /* narrative paragraphs — readable at small size */

--letter-spacing-label:  0.12em   /* uppercase annotation labels */
--letter-spacing-tight:  0.02em   /* body text */
--letter-spacing-wide:   0.2em    /* section divider text */
```

---

## Colour Palette

### Dark Mode (default — cyanotype blueprint)

```
--color-bg-primary:        #1B3A5C   /* deep blueprint blue — main background */
--color-bg-secondary:      #152E4A   /* darker blue — recessed panels, overlays */
--color-bg-tertiary:       #0F2235   /* darkest — inset wells, code blocks */
--color-bg-elevated:       #1F4268   /* slightly lighter — hover surfaces */

--color-text-primary:      #E8F0FE   /* near-white blue — primary text */
--color-text-secondary:    #8BB8E8   /* medium blue — secondary labels */
--color-text-tertiary:     #5A8ABF   /* dimmed blue — placeholder, muted info */
--color-text-inverse:      #1B3A5C   /* for text on light callout buttons */

--color-line-primary:      #8BB8E8   /* main grid lines, primary borders */
--color-line-secondary:    #3D6B9A   /* secondary grid lines, dashed separators */
--color-line-accent:       #E8F0FE   /* bright white-blue — emphasis lines */

--color-accent-info:       #5BA4E8   /* information / neutral status */
--color-accent-success:    #4EC9A8   /* teal — success, operational */
--color-accent-warning:    #E8B84B   /* amber — warning, degraded */
--color-accent-danger:     #E86060   /* coral-red — danger, critical */
--color-accent-mystery:    #9B7FE8   /* purple — unknown, encrypted */

--color-roll-critical:     #FFD700   /* gold — nat 20, critical success */
--color-roll-failure:      #E86060   /* red — nat 1, critical failure */

--color-focus-ring:        #8BB8E8   /* keyboard focus outline */
--color-selection-bg:      rgba(139, 184, 232, 0.25)
```

### Light Mode (drafting paper)

Activated via `@media (prefers-color-scheme: light)` and `[data-theme="light"]`.

```
--color-bg-primary:        #FAFCFF   /* near-white — drafting paper */
--color-bg-secondary:      #F0F5FF   /* light blue-white — panel backgrounds */
--color-bg-tertiary:       #E4EDFA   /* pale blue — inset wells */
--color-bg-elevated:       #FFFFFF   /* pure white — hover surfaces */

--color-text-primary:      #1B3A5C   /* dark blueprint blue — primary text */
--color-text-secondary:    #2D5F8A   /* mid blue — secondary labels */
--color-text-tertiary:     #5A8ABF   /* light blue — placeholder, muted */
--color-text-inverse:      #E8F0FE   /* for text on dark callout buttons */

--color-line-primary:      #2D5F8A   /* main grid lines */
--color-line-secondary:    #8BB8E8   /* secondary grid, dashed separators */
--color-line-accent:       #1B3A5C   /* dark blue emphasis lines */

--color-accent-info:       #1A6BBF   /* deeper blue for readability on white */
--color-accent-success:    #1A8F72   /* darker teal */
--color-accent-warning:    #BF7C00   /* darker amber */
--color-accent-danger:     #BF2424   /* darker red */
--color-accent-mystery:    #6344BF   /* darker purple */

--color-roll-critical:     #9B7000   /* dark gold on white */
--color-roll-failure:      #BF2424

--color-focus-ring:        #1B3A5C
--color-selection-bg:      rgba(27, 58, 92, 0.12)
```

### Grid Overlay Colours

The graph paper effect uses semi-transparent lines over the background:

```
/* Dark mode grid */
--color-grid-major:  rgba(139, 184, 232, 0.12)   /* major grid — every 40px */
--color-grid-minor:  rgba(139, 184, 232, 0.05)   /* minor grid — every 8px */

/* Light mode grid */
--color-grid-major:  rgba(27, 58, 92, 0.10)
--color-grid-minor:  rgba(27, 58, 92, 0.04)
```

---

## Spacing & Layout

```
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px
--space-16:  64px

--widget-max-width:    680px
--widget-padding:      var(--space-6)
--section-gap:         var(--space-8)
--component-gap:       var(--space-4)
--label-gap:           var(--space-2)

/* Grid overlay dimensions */
--grid-minor-size:     8px
--grid-major-size:     40px
```

Layout is single-column within widgets. No floats. Flexbox for rows, grid for stat blocks.
All content aligns to the 8px minor grid.

---

## Borders & Surfaces

Blueprint uses a strict two-weight border system. No shadows — elevation is communicated
through border weight and background tone only.

```
--border-width-primary:    1px
--border-width-secondary:  1px    /* same weight, different colour */
--border-style-primary:    solid
--border-style-secondary:  dashed

--border-radius-none:      0
--border-radius-sm:        2px    /* callout buttons only */
--border-radius-md:        2px    /* panel close button */

/* Convenience shorthands */
--border-primary:     1px solid var(--color-line-primary)
--border-secondary:   1px dashed var(--color-line-secondary)
--border-accent:      1px solid var(--color-line-accent)
```

### Surface Rules

- Main widget container: `--border-primary` on all four sides
- Panel overlays: `--border-primary` top only (inset from widget)
- Section dividers: `--border-secondary` bottom
- Inset wells (stat blocks, code displays): `--border-secondary` all sides,
  `--color-bg-tertiary` background
- No `box-shadow` anywhere — not a blueprint aesthetic

### Annotation Leader Lines

Annotation labels sit 8px to the right of a 16px horizontal CSS border line:

```css
.annotation-label::before {
  content: '';
  display: inline-block;
  width: 16px;
  height: 0;
  border-top: 1px solid var(--color-line-secondary);
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
Font:              var(--font-mono), var(--font-size-sm)
Letter-spacing:    var(--letter-spacing-label)
Text-transform:    uppercase
```

**Primary button** — filled with accent blue, dark text:

```
Background:  var(--color-line-primary)
Color:       var(--color-text-inverse)
Border:      1px solid var(--color-line-primary)
Padding:     10px 18px
```

**Secondary button** (most buttons) — transparent with border:

```
Background:  transparent
Color:       var(--color-text-secondary)
Border:      var(--border-primary)
Padding:     10px 18px
```

**Footer / panel toggle button** — same as secondary, condensed:

```
Background:  transparent
Color:       var(--color-text-tertiary)
Border:      var(--border-secondary)
Padding:     8px 14px
Font-size:   var(--font-size-xs)
```

**Danger button** — for destructive or high-stakes actions:

```
Background:  transparent
Color:       var(--color-accent-danger)
Border:      1px solid var(--color-accent-danger)
```

### Hover States

Hover transitions are fast and precise — 80ms ease-out. No colour changes,
only border brightness and background tone shift.

```
Secondary hover:
  Border-color:  var(--color-line-accent)
  Color:         var(--color-text-primary)
  Background:    var(--color-bg-elevated)

Footer hover:
  Border-color:  var(--color-line-primary)
  Color:         var(--color-text-secondary)
```

### Focus States

Keyboard focus uses a 2px outline offset by 2px — clearly visible, no rounded corners.

```css
:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
  border-radius: 0;
}
```

### Action Options (choice buttons)

Action choice rows use a left-border annotation style rather than full buttons:

```
Display:      block
Border-left:  3px solid var(--color-line-secondary)
Padding:      8px 12px
Background:   transparent
Color:        var(--color-text-secondary)
Cursor:       pointer
```

Hover:
```
Border-left-color:  var(--color-line-primary)
Color:              var(--color-text-primary)
Background:         var(--color-bg-elevated)
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
  border-color: var(--color-line-accent);
  background: var(--color-bg-tertiary);
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
  0%   { color: var(--color-line-accent); }
  100% { color: var(--color-text-primary); }
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
  Font-size:      var(--font-size-xs)
  Letter-spacing: var(--letter-spacing-label)
  Text-transform: uppercase
  Color:          var(--color-text-tertiary)
  Border-bottom:  var(--border-secondary)
  Padding:        var(--space-2) 0
  Display:        flex
  Gap:            var(--space-4)

  Before pseudo (cross-hair left):
    Content: '+'
    Color: var(--color-line-secondary)
    Margin-right: var(--space-2)

.atmo-strip (atmospheric condition banner):
  Font-size:      var(--font-size-xs)
  Letter-spacing: var(--letter-spacing-label)
  Color:          var(--color-text-tertiary)
  Border:         var(--border-secondary)
  Padding:        var(--space-1) var(--space-3)
  Text-transform: uppercase
  Background:     var(--color-bg-tertiary)

.narrative:
  Font-size:   var(--font-size-base)
  Line-height: var(--line-height-loose)
  Color:       var(--color-text-primary)
  Border-left: 3px solid var(--color-line-secondary)
  Padding:     var(--space-3) var(--space-4)
  Background:  var(--color-bg-secondary)
```

### Die Roll Widget

Die rolls must read as engineering calculations — input values, process, output with
units. The die face is a square with corner tick marks.

```
.die-widget:
  Border:     var(--border-primary)
  Background: var(--color-bg-secondary)
  Padding:    var(--space-6)
  Font-family: var(--font-mono)

.die-face:
  Width:        80px
  Height:       80px
  Border:       var(--border-accent)
  Border-radius: 0            /* no rounding — it's a technical readout */
  Font-size:    var(--font-size-2xl)
  Color:        var(--color-text-primary)
  Display:      grid
  Place-items:  center
  Position:     relative

  Corner tick marks via ::before / ::after + box-shadow:
    Content: ''
    Position: absolute
    Top: -4px; Left: -4px
    Width: 8px; Height: 8px
    Border-top: 2px solid var(--color-line-accent)
    Border-left: 2px solid var(--color-line-accent)

.die-label:
  Font-size:      var(--font-size-xs)
  Letter-spacing: var(--letter-spacing-label)
  Text-transform: uppercase
  Color:          var(--color-text-tertiary)

.die-modifier-row:
  Display:        flex
  Gap:            var(--space-4)
  Font-size:      var(--font-size-sm)
  Color:          var(--color-text-secondary)
  Border-top:     var(--border-secondary)
  Padding-top:    var(--space-3)
  Margin-top:     var(--space-3)

.die-result-total:
  Font-size:  var(--font-size-xl)
  Color:      var(--color-text-primary)

  Critical success (nat 20 or equivalent):
    Color:    var(--color-roll-critical)
    After content: ' [CRIT]'

  Critical failure:
    Color:    var(--color-roll-failure)
    After content: ' [FAIL]'
```

### Combat Widget

Initiative order reads as a sortable technical table. HP tracks are segmented bars,
not gradients.

```
.combat-header:
  Font-size:      var(--font-size-xs)
  Letter-spacing: var(--letter-spacing-label)
  Text-transform: uppercase
  Color:          var(--color-text-tertiary)
  Border-bottom:  var(--border-primary)
  Padding-bottom: var(--space-2)

.combatant-row:
  Display:     grid
  Grid-template-columns: 2fr 1fr 1fr 1fr
  Gap:         var(--space-3)
  Padding:     var(--space-2) 0
  Border-bottom: var(--border-secondary)
  Font-size:   var(--font-size-sm)
  Align-items: center

  Active turn:
    Background: var(--color-bg-elevated)
    Border-left: 3px solid var(--color-line-accent)
    Padding-left: var(--space-3)

.hp-track:
  Display: flex
  Gap: 2px

.hp-pip:
  Width:  8px
  Height: 8px
  Border: 1px solid var(--color-line-secondary)
  Background: transparent

  Filled:
    Background: var(--color-accent-success)
    Border-color: var(--color-accent-success)

  Damaged:
    Background: var(--color-accent-warning)
    Border-color: var(--color-accent-warning)

  Critical:
    Background: var(--color-accent-danger)
    Border-color: var(--color-accent-danger)
```

### Dialogue Widget

NPC speech is a transmission block — annotated with speaker ID, disposition readout,
and a horizontal rule separating incoming from response options.

```
.dialogue-header:
  Font-size:      var(--font-size-xs)
  Letter-spacing: var(--letter-spacing-label)
  Text-transform: uppercase
  Color:          var(--color-text-tertiary)
  Margin-bottom:  var(--space-3)

  NPC name:
    Color: var(--color-text-secondary)
    Font-size: var(--font-size-sm)

.dialogue-speech:
  Border-left:   3px solid var(--color-line-primary)
  Padding:       var(--space-3) var(--space-4)
  Background:    var(--color-bg-secondary)
  Font-size:     var(--font-size-base)
  Line-height:   var(--line-height-loose)
  Color:         var(--color-text-primary)
  Margin-bottom: var(--space-4)

.disposition-bar:
  Font-size:  var(--font-size-xs)
  Color:      var(--color-text-tertiary)
  Display:    flex
  Gap:        var(--space-2)
  Align-items: center
  Margin-bottom: var(--space-4)

  Readout strip (visual track):
    Height:     2px
    Background: var(--color-line-secondary)
    Flex:       1

    Fill portion:
      Height:  100%
      Background: var(--color-accent-info)
      Transition: width 0.3s ease-out
```

### Character Creation / Settings Widget

Forms read as data-entry panels on a console. Labels are annotation callouts; inputs
are measurement fields.

```
.form-field:
  Display:        grid
  Grid-template-columns: 140px 1fr
  Gap:            var(--space-4)
  Align-items:    start
  Padding:        var(--space-3) 0
  Border-bottom:  var(--border-secondary)

.form-label:
  Font-size:      var(--font-size-xs)
  Letter-spacing: var(--letter-spacing-label)
  Text-transform: uppercase
  Color:          var(--color-text-tertiary)
  Padding-top:    2px

  Annotation leader:
    Before pseudo: 8px horizontal line in --color-line-secondary

input, select:
  Background:  var(--color-bg-tertiary)
  Border:      var(--border-primary)
  Border-radius: 0
  Color:       var(--color-text-primary)
  Font-family: var(--font-mono)
  Font-size:   var(--font-size-sm)
  Padding:     var(--space-2) var(--space-3)
  Min-height:  44px
  Width:       100%
  Box-sizing:  border-box

  Focus:
    Outline: 2px solid var(--color-focus-ring)
    Outline-offset: 2px
```

### Map Widget (SVG)

Map overlays use blueprint line weights. Room labels are uppercase monospaced.
Unexplored areas are `--color-bg-tertiary` fill; explored use `--color-bg-secondary`.

```
SVG stroke-width: 1px (rooms), 0.5px (corridors)
SVG stroke: var(--color-line-primary) on dark, var(--color-line-primary) on light
SVG fill: var(--color-bg-secondary) for rooms
Room label text: font-family monospace, font-size 9px, letter-spacing 0.1em, uppercase
Grid overlay: visible behind map at 8px minor / 40px major
```

### Status Bar (HP, XP, resources)

```
.status-bar:
  Display:      flex
  Gap:          var(--space-6)
  Padding:      var(--space-3) 0
  Border-top:   var(--border-secondary)
  Font-size:    var(--font-size-xs)

.status-item:
  Display:    flex
  Gap:        var(--space-2)
  Align-items: baseline

.status-label:
  Letter-spacing: var(--letter-spacing-label)
  Text-transform: uppercase
  Color:          var(--color-text-tertiary)

.status-value:
  Color:     var(--color-text-primary)
  Font-size: var(--font-size-sm)

.status-unit:
  Color:     var(--color-text-tertiary)
  Font-size: var(--font-size-xs)
```

### Panel Overlay

```
#panel-overlay:
  Background:    var(--color-bg-secondary)
  Border-top:    var(--border-primary)
  Padding:       var(--space-6)

.panel-title:
  Font-family:    var(--font-mono)
  Font-size:      var(--font-size-lg)
  Letter-spacing: var(--letter-spacing-label)
  Text-transform: uppercase
  Color:          var(--color-text-primary)

.panel-close-btn:
  Font-family:    var(--font-mono)
  Font-size:      var(--font-size-xs)
  Letter-spacing: var(--letter-spacing-label)
  Text-transform: uppercase
  Border:         var(--border-primary)
  Border-radius:  2px
  Background:     transparent
  Color:          var(--color-text-tertiary)
  Min-height:     44px
  Padding:        8px 16px
```

---

## Complete CSS Block

Inject this block into any widget. It defines all variables for both colour schemes,
the grid overlay, and component resets. Individual component styles follow the variable
definitions and can be applied selectively.

```css
/* ============================================================
   BLUEPRINT VISUAL STYLE
   Text Adventure Game Engine — Visual Theme Override
   ============================================================ */

/* --- Font Import Attempt (may be CSP-blocked in iframes) --- */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');

/* --- CSS Custom Properties: Dark Mode (default) ------------ */
:root {
  /* Typography */
  --font-mono: 'IBM Plex Mono', 'Cascadia Code', 'SF Mono', 'Consolas', 'Courier New', monospace;
  --font-sans: var(--font-mono); /* Blueprint uses mono throughout */

  --font-size-xs:   0.625rem;
  --font-size-sm:   0.75rem;
  --font-size-base: 0.875rem;
  --font-size-md:   1rem;
  --font-size-lg:   1.125rem;
  --font-size-xl:   1.375rem;
  --font-size-2xl:  1.75rem;

  --line-height-tight: 1.3;
  --line-height-base:  1.6;
  --line-height-loose: 1.9;

  --letter-spacing-label: 0.12em;
  --letter-spacing-tight: 0.02em;
  --letter-spacing-wide:  0.2em;

  /* Spacing */
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

  /* Borders */
  --border-radius-none: 0;
  --border-radius-sm:   2px;
  --border-radius-md:   2px;

  /* Grid overlay */
  --grid-minor-size: 8px;
  --grid-major-size: 40px;

  /* Dark mode colours */
  --color-bg-primary:        #1B3A5C;
  --color-bg-secondary:      #152E4A;
  --color-bg-tertiary:       #0F2235;
  --color-bg-elevated:       #1F4268;

  --color-text-primary:      #E8F0FE;
  --color-text-secondary:    #8BB8E8;
  --color-text-tertiary:     #5A8ABF;
  --color-text-inverse:      #1B3A5C;

  --color-line-primary:      #8BB8E8;
  --color-line-secondary:    #3D6B9A;
  --color-line-accent:       #E8F0FE;

  --color-accent-info:       #5BA4E8;
  --color-accent-success:    #4EC9A8;
  --color-accent-warning:    #E8B84B;
  --color-accent-danger:     #E86060;
  --color-accent-mystery:    #9B7FE8;

  --color-roll-critical:     #FFD700;
  --color-roll-failure:      #E86060;

  --color-focus-ring:        #8BB8E8;
  --color-selection-bg:      rgba(139, 184, 232, 0.25);

  --color-grid-major:        rgba(139, 184, 232, 0.12);
  --color-grid-minor:        rgba(139, 184, 232, 0.05);

  /* Convenience border shorthands */
  --border-primary:   1px solid var(--color-line-primary);
  --border-secondary: 1px dashed var(--color-line-secondary);
  --border-accent:    1px solid var(--color-line-accent);

  /* Legacy aliases for engine compatibility */
  --color-border-tertiary:   var(--color-line-secondary);
  --color-border-secondary:  var(--color-line-primary);
}

/* --- CSS Custom Properties: Light Mode --------------------- */
@media (prefers-color-scheme: light) {
  :root {
    --color-bg-primary:        #FAFCFF;
    --color-bg-secondary:      #F0F5FF;
    --color-bg-tertiary:       #E4EDFA;
    --color-bg-elevated:       #FFFFFF;

    --color-text-primary:      #1B3A5C;
    --color-text-secondary:    #2D5F8A;
    --color-text-tertiary:     #5A8ABF;
    --color-text-inverse:      #E8F0FE;

    --color-line-primary:      #2D5F8A;
    --color-line-secondary:    #8BB8E8;
    --color-line-accent:       #1B3A5C;

    --color-accent-info:       #1A6BBF;
    --color-accent-success:    #1A8F72;
    --color-accent-warning:    #BF7C00;
    --color-accent-danger:     #BF2424;
    --color-accent-mystery:    #6344BF;

    --color-roll-critical:     #9B7000;
    --color-roll-failure:      #BF2424;

    --color-focus-ring:        #1B3A5C;
    --color-selection-bg:      rgba(27, 58, 92, 0.12);

    --color-grid-major:        rgba(27, 58, 92, 0.10);
    --color-grid-minor:        rgba(27, 58, 92, 0.04);

    --border-primary:   1px solid var(--color-line-primary);
    --border-secondary: 1px dashed var(--color-line-secondary);
    --border-accent:    1px solid var(--color-line-accent);

    --color-border-tertiary:   var(--color-line-secondary);
    --color-border-secondary:  var(--color-line-primary);
  }
}

/* Data attribute override for explicit theme switching */
[data-theme="light"] {
  --color-bg-primary:        #FAFCFF;
  --color-bg-secondary:      #F0F5FF;
  --color-bg-tertiary:       #E4EDFA;
  --color-bg-elevated:       #FFFFFF;
  --color-text-primary:      #1B3A5C;
  --color-text-secondary:    #2D5F8A;
  --color-text-tertiary:     #5A8ABF;
  --color-text-inverse:      #E8F0FE;
  --color-line-primary:      #2D5F8A;
  --color-line-secondary:    #8BB8E8;
  --color-line-accent:       #1B3A5C;
  --color-accent-info:       #1A6BBF;
  --color-accent-success:    #1A8F72;
  --color-accent-warning:    #BF7C00;
  --color-accent-danger:     #BF2424;
  --color-accent-mystery:    #6344BF;
  --color-grid-major:        rgba(27, 58, 92, 0.10);
  --color-grid-minor:        rgba(27, 58, 92, 0.04);
  --color-focus-ring:        #1B3A5C;
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
  background: var(--color-selection-bg);
  color: var(--color-text-primary);
}

/* --- Root Widget Container --------------------------------- */
.root {
  font-family:      var(--font-mono);
  font-size:        var(--font-size-base);
  line-height:      var(--line-height-base);
  letter-spacing:   var(--letter-spacing-tight);
  color:            var(--color-text-primary);
  background-color: var(--color-bg-primary);
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent calc(var(--grid-minor-size) - 1px),
      var(--color-grid-minor) calc(var(--grid-minor-size) - 1px),
      var(--color-grid-minor) var(--grid-minor-size)
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent calc(var(--grid-minor-size) - 1px),
      var(--color-grid-minor) calc(var(--grid-minor-size) - 1px),
      var(--color-grid-minor) var(--grid-minor-size)
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent calc(var(--grid-major-size) - 1px),
      var(--color-grid-major) calc(var(--grid-major-size) - 1px),
      var(--color-grid-major) var(--grid-major-size)
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent calc(var(--grid-major-size) - 1px),
      var(--color-grid-major) calc(var(--grid-major-size) - 1px),
      var(--color-grid-major) var(--grid-major-size)
    );
  border:           var(--border-primary);
  padding:          var(--space-6);
  max-width:        680px;
  margin:           0 auto;
  position:         relative;
  overflow:         hidden;
}

/* --- Typography -------------------------------------------- */
h1, h2, h3, h4, h5, h6 {
  font-family:    var(--font-mono);
  font-weight:    600;
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
  color:          var(--color-text-primary);
  line-height:    var(--line-height-tight);
  margin-bottom:  var(--space-3);
}

h1 { font-size: var(--font-size-xl); }
h2 { font-size: var(--font-size-lg); }
h3 { font-size: var(--font-size-md); }

p {
  font-size:     var(--font-size-base);
  line-height:   var(--line-height-loose);
  color:         var(--color-text-primary);
  margin-bottom: var(--space-4);
}

/* --- Annotation Labels ------------------------------------- */
.label,
.stat-label,
.form-label,
.panel-section-label {
  font-size:      var(--font-size-xs);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
  color:          var(--color-text-tertiary);
  display:        flex;
  align-items:    center;
  gap:            var(--space-2);
}

.label::before {
  content:     '';
  display:     inline-block;
  width:       16px;
  height:      0;
  border-top:  1px solid var(--color-line-secondary);
  flex-shrink: 0;
}

/* --- Buttons ----------------------------------------------- */
button {
  font-family:    var(--font-mono);
  font-size:      var(--font-size-sm);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
  cursor:         pointer;
  border-radius:  var(--border-radius-sm);
  min-height:     44px;
  min-width:      44px;
  padding:        10px 18px;
  transition:     border-color 0.08s ease-out, color 0.08s ease-out, background 0.08s ease-out;
  box-sizing:     border-box;
}

button:active {
  border-color: var(--color-line-accent) !important;
  background:   var(--color-bg-tertiary) !important;
  transition:   all 0.04s ease-out;
}

.btn-primary {
  background:   var(--color-line-primary);
  color:        var(--color-text-inverse);
  border:       1px solid var(--color-line-primary);
}

.btn-primary:hover {
  background:   var(--color-line-accent);
  border-color: var(--color-line-accent);
}

.btn-secondary,
.action-btn,
.continue-btn {
  background:  transparent;
  color:       var(--color-text-secondary);
  border:      var(--border-primary);
}

.btn-secondary:hover,
.action-btn:hover,
.continue-btn:hover {
  border-color: var(--color-line-accent);
  color:        var(--color-text-primary);
  background:   var(--color-bg-elevated);
}

.btn-danger {
  background:  transparent;
  color:       var(--color-accent-danger);
  border:      1px solid var(--color-accent-danger);
}

.btn-danger:hover {
  background: rgba(232, 96, 96, 0.1);
}

.footer-btn {
  background:     transparent;
  color:          var(--color-text-tertiary);
  border:         var(--border-secondary);
  font-size:      var(--font-size-xs);
  padding:        8px 14px;
  min-height:     44px;
  border-radius:  var(--border-radius-sm);
}

.footer-btn:hover {
  border-color: var(--color-line-primary);
  color:        var(--color-text-secondary);
}

/* --- Focus States ------------------------------------------ */
:focus-visible {
  outline:        2px solid var(--color-focus-ring);
  outline-offset: 2px;
  border-radius:  0;
}

/* --- Action Choice List ------------------------------------ */
.actions-list {
  display:        flex;
  flex-direction: column;
  gap:            var(--space-1);
  margin:         var(--space-4) 0;
}

.action-option {
  display:        block;
  border:         none;
  border-left:    3px solid var(--color-line-secondary);
  padding:        var(--space-2) var(--space-3);
  background:     transparent;
  color:          var(--color-text-secondary);
  font-family:    var(--font-mono);
  font-size:      var(--font-size-sm);
  letter-spacing: var(--letter-spacing-tight);
  text-transform: none;
  text-align:     left;
  cursor:         pointer;
  min-height:     44px;
  width:          100%;
  transition:     border-color 0.08s ease-out, color 0.08s ease-out, background 0.08s ease-out;
}

.action-option:hover {
  border-left-color: var(--color-line-primary);
  color:             var(--color-text-primary);
  background:        var(--color-bg-elevated);
}

/* --- Narrative Block --------------------------------------- */
.narrative {
  border-left:   3px solid var(--color-line-secondary);
  padding:       var(--space-3) var(--space-4);
  background:    var(--color-bg-secondary);
  font-size:     var(--font-size-base);
  line-height:   var(--line-height-loose);
  color:         var(--color-text-primary);
  margin-bottom: var(--space-4);
}

/* --- Location Bar ------------------------------------------ */
.loc-bar {
  display:        flex;
  align-items:    center;
  gap:            var(--space-4);
  font-size:      var(--font-size-xs);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
  color:          var(--color-text-tertiary);
  border-bottom:  var(--border-secondary);
  padding-bottom: var(--space-2);
  margin-bottom:  var(--space-4);
}

.loc-bar::before {
  content: '+';
  color:   var(--color-line-secondary);
  flex-shrink: 0;
}

/* --- Atmosphere Strip ------------------------------------- */
.atmo-strip {
  font-size:      var(--font-size-xs);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
  color:          var(--color-text-tertiary);
  border:         var(--border-secondary);
  padding:        var(--space-1) var(--space-3);
  background:     var(--color-bg-tertiary);
  margin-bottom:  var(--space-4);
  display:        inline-block;
}

/* --- Status Bar ------------------------------------------- */
.status-bar {
  display:      flex;
  gap:          var(--space-6);
  padding:      var(--space-3) 0;
  border-top:   var(--border-secondary);
  margin-top:   var(--space-4);
  flex-wrap:    wrap;
}

.status-item {
  display:     flex;
  gap:         var(--space-2);
  align-items: baseline;
}

.stat-label {
  font-size:      var(--font-size-xs);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
  color:          var(--color-text-tertiary);
}

.stat-value,
.status-value {
  font-size:  var(--font-size-sm);
  color:      var(--color-text-primary);
  font-weight: 500;
}

.status-unit {
  font-size: var(--font-size-xs);
  color:     var(--color-text-tertiary);
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
  border: 1px solid var(--color-line-secondary);
  background: transparent;
}

.hp-pip.filled     { background: var(--color-accent-success); border-color: var(--color-accent-success); }
.hp-pip.damaged    { background: var(--color-accent-warning); border-color: var(--color-accent-warning); }
.hp-pip.critical   { background: var(--color-accent-danger);  border-color: var(--color-accent-danger);  }

/* --- Die Roll Widget --------------------------------------- */
.die-widget {
  border:     var(--border-primary);
  background: var(--color-bg-secondary);
  padding:    var(--space-6);
  font-family: var(--font-mono);
}

.die-face {
  position:    relative;
  width:       80px;
  height:      80px;
  border:      var(--border-accent);
  border-radius: 0;
  font-size:   var(--font-size-2xl);
  font-weight: 600;
  color:       var(--color-text-primary);
  display:     grid;
  place-items: center;
  margin:      var(--space-4) auto;
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
  border-top:   2px solid var(--color-line-accent);
  border-left:  2px solid var(--color-line-accent);
}

.die-face::after {
  bottom:        -4px;
  right:         -4px;
  border-bottom: 2px solid var(--color-line-accent);
  border-right:  2px solid var(--color-line-accent);
}

.die-label {
  font-size:      var(--font-size-xs);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
  color:          var(--color-text-tertiary);
  text-align:     center;
}

.die-modifier-row {
  display:        flex;
  gap:            var(--space-4);
  font-size:      var(--font-size-sm);
  color:          var(--color-text-secondary);
  border-top:     var(--border-secondary);
  padding-top:    var(--space-3);
  margin-top:     var(--space-3);
}

.die-result-total {
  font-size:  var(--font-size-xl);
  font-weight: 600;
  color:       var(--color-text-primary);
  text-align:  center;
  padding:     var(--space-3) 0;
}

.die-result-total.critical { color: var(--color-roll-critical); }
.die-result-total.failure  { color: var(--color-roll-failure);  }

/* --- Panel Overlay ---------------------------------------- */
#panel-overlay {
  display:    none;
  padding:    0;
  background: var(--color-bg-secondary);
  border-top: var(--border-primary);
}

.panel-header {
  display:         flex;
  align-items:     baseline;
  justify-content: space-between;
  padding:         var(--space-4) var(--space-6) var(--space-3);
  border-bottom:   var(--border-secondary);
  margin-bottom:   var(--space-4);
}

.panel-title {
  font-family:    var(--font-mono);
  font-size:      var(--font-size-lg);
  font-weight:    600;
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
  color:          var(--color-text-primary);
}

.panel-close-btn {
  font-family:    var(--font-mono);
  font-size:      var(--font-size-xs);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
  background:     transparent;
  border:         var(--border-primary);
  border-radius:  var(--border-radius-md);
  padding:        8px 16px;
  min-height:     44px;
  min-width:      44px;
  color:          var(--color-text-tertiary);
  cursor:         pointer;
  transition:     border-color 0.08s ease-out, color 0.08s ease-out;
}

.panel-close-btn:hover {
  border-color: var(--color-line-primary);
  color:        var(--color-text-secondary);
}

.panel-content {
  display: none;
  padding: 0 var(--space-6) var(--space-6);
}

/* --- Footer Row ------------------------------------------- */
.footer-row {
  display:      flex;
  flex-wrap:    wrap;
  gap:          var(--space-2);
  padding-top:  var(--space-4);
  border-top:   var(--border-secondary);
  margin-top:   var(--space-4);
  align-items:  center;
}

.footer-row .save-btn {
  margin-left: auto;
}

/* --- Inset Wells (stat blocks, code) ---------------------- */
.inset-well,
.stat-block,
.readout {
  background:    var(--color-bg-tertiary);
  border:        var(--border-secondary);
  padding:       var(--space-3) var(--space-4);
  font-size:     var(--font-size-sm);
  font-family:   var(--font-mono);
  color:         var(--color-text-secondary);
  margin-bottom: var(--space-3);
}

/* --- Section Divider --------------------------------------- */
.section-divider {
  border:        none;
  border-bottom: var(--border-secondary);
  margin:        var(--space-6) 0;
  position:      relative;
}

.section-divider-label {
  position:       absolute;
  top:            -8px;
  left:           var(--space-4);
  background:     var(--color-bg-primary);
  padding:        0 var(--space-2);
  font-size:      var(--font-size-xs);
  letter-spacing: var(--letter-spacing-wide);
  text-transform: uppercase;
  color:          var(--color-text-tertiary);
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
  0%   { color: var(--color-line-accent);   }
  100% { color: var(--color-text-primary);  }
}

#reveal-full                    { animation: blueprint-scan       0.4s ease-out forwards; }
.die-result                     { animation: blueprint-counter    0.15s ease-out; }
.stat-value.updated             { animation: blueprint-readout-flash 0.6s ease-out forwards; }

/* Tabindex-0 panel visibility — applied by togglePanel() JS */
#panel-overlay.panel-visible    { animation: blueprint-panel-in  0.2s ease-out forwards; }
```
