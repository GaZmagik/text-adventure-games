---
name: Parchment
description: >
  Warm serif typography and aged-paper textures evoking illuminated manuscripts,
  scholar's tomes, and candlelit studies. Soft parchment backgrounds, ink-dark text,
  burgundy and gold accents, and depth through shadow rather than hard borders.
best-for:
  - fantasy
  - historical
  - gothic
  - mystery
  - dark-fantasy
  - horror (muted variant)
  - any genre where tactile warmth suits the fiction
---

```json tag-contract
{
  "id": "parchment",
  "kind": "style",
  "version": "1.4.0",
  "summary": "Warm manuscript style with aged-paper surfaces, serif typography, burgundy and gold accents, and shadow-based depth.",
  "mustRead": [
    "Pair with styles/style-reference.md for structural contracts.",
    "Use tactile paper, ink, wax, and leather cues without obscuring body text readability."
  ],
  "render": [
    "Depth should come from soft page shadows rather than hard technical borders.",
    "Best for fantasy, historical, gothic, mystery, and dark-fantasy scenarios."
  ]
}
```

## Design Philosophy

Parchment renders the game as a living document — the kind a monastic scribe might produce
or a wizard might carry under their cloak. Every surface suggests material: paper grain in
the backgrounds, ink soaking into fibres in the text, wax and leather in the buttons.

Depth is created through shadow, not line. Hard borders are replaced by box-shadows that
suggest a page lifting slightly off a desk, or a panel pressed into old binding-board.
Decorative dividers use double-rule and wavy CSS borders in lieu of imagery, keeping the
theme lightweight and CSP-safe.

Typography is the primary carrier of the aesthetic. Lora (or Merriweather as fallback, then
Georgia) is a bracketed serif with calligraphic italics — it reads warmly at body sizes and
dramatically at heading sizes. Monospace is reserved strictly for mechanical information
(dice notation, stat values, damage numbers) so the contrast between the narrative world
and the rules layer is immediately legible.

---

## Typography

### Font Stacks

```
/* Narrative / headings */
'Lora', 'Merriweather', Georgia, 'Times New Roman', serif

/* Mechanical / stats / dice */
'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', monospace
```

Google Fonts (`Lora`, `Merriweather`) may be blocked by iframe CSP — Georgia is an
excellent system fallback and requires no network request. The stack degrades gracefully:
Lora → Merriweather → Georgia → Times New Roman → any serif.

### Scale

| Role               | Size | Weight | Line Height  |
| ------------------ | ---- | ------ | ------------ |
| Scene title (h2)   | 22px | 700    | 1.2          |
| Panel heading (h3) | 16px | 600    | 1.3          |
| Section label      | 10px | 600    | 1.4 (caps)   |
| Body / narrative   | 15px | 400    | 1.85         |
| Caption / atmo     | 12px | 400    | 1.5 (italic) |
| Mechanical (mono)  | 11px | 500    | 1.4          |
| Footer / UI micro  | 10px | 400    | 1.4          |

Narrative body uses a generous 1.85 line-height — wider than UI default — to evoke the
airy layout of typeset books and give the eye room to breathe between long passages.

---

## Colour Palette

All values are defined as CSS custom properties. Both modes are declared below; the
`@media (prefers-color-scheme: dark)` block and `[data-theme="dark"]` attribute selector
both apply the dark set.

### Light Mode — "Candlelit Reading Room"

```
--pt-bg-page:          #F5F0E8   /* parchment — warm off-white */
--pt-bg-surface:       #EDE6D6   /* slightly deeper parchment for cards/panels */
--pt-bg-inset:         #E4DACA   /* recessed panels, code backgrounds */
--pt-bg-accent-wash:   #FAF6EE   /* very light wash for hover states */

--pt-text-primary:     #2C1810   /* dark sepia ink */
--pt-text-secondary:   #5C3D2E   /* mid-brown for captions, labels */
--pt-text-tertiary:    #8B6B55   /* muted brown for placeholder/disabled */
--pt-text-inverse:     #F5F0E8   /* light text on dark surfaces */

--pt-accent-burgundy:  #8B2252   /* primary accent — buttons, highlights */
--pt-accent-burgundy-dark: #6B1A3E  /* darker variant for hover */
--pt-accent-gold:      #C4963C   /* secondary accent — headings, dividers */
--pt-accent-gold-light:#DDB96A   /* lighter gold for backgrounds/washes */
--pt-accent-green:     #2D5016   /* success states, nature/growth */
--pt-accent-green-mid: #3D6B1F   /* hover variant for green */

--pt-border-soft:      rgba(44, 24, 16, 0.12)   /* barely-there structural lines */
--pt-border-medium:    rgba(44, 24, 16, 0.22)   /* panel outlines */
--pt-border-accent:    rgba(139, 34, 82, 0.35)  /* burgundy tint border */
--pt-border-gold:      rgba(196, 150, 60, 0.45) /* gold tint border */

--pt-shadow-page:      0 2px 12px rgba(44, 24, 16, 0.10)
--pt-shadow-surface:   0 1px 6px  rgba(44, 24, 16, 0.08)
--pt-shadow-inset:     inset 0 1px 4px rgba(44, 24, 16, 0.08)
--pt-shadow-lift:      0 4px 20px rgba(44, 24, 16, 0.16)
--pt-shadow-button:    0 2px 6px  rgba(44, 24, 16, 0.20), inset 0 1px 0 rgba(255,255,255,0.25)
--pt-shadow-button-press: 0 1px 2px rgba(44, 24, 16, 0.25), inset 0 1px 3px rgba(44,24,16,0.15)
```

### Dark Mode — "Aged Leather by Firelight"

```
--pt-bg-page:          #1C1410   /* aged leather — very dark warm brown */
--pt-bg-surface:       #261C16   /* slightly lifted surface */
--pt-bg-inset:         #150F0B   /* deeper recess for inset panels */
--pt-bg-accent-wash:   #2E221A   /* warm hover wash */

--pt-text-primary:     #E8DCC8   /* cream — aged paper colour for text */
--pt-text-secondary:   #C4A882   /* warm mid-tone for labels */
--pt-text-tertiary:    #8B7355   /* muted for disabled/placeholder */
--pt-text-inverse:     #1C1410   /* dark text on light surfaces */

--pt-accent-burgundy:  #C4527A   /* lightened for readability on dark bg */
--pt-accent-burgundy-dark: #A83860
--pt-accent-gold:      #D4A84C   /* slightly warmer gold on dark */
--pt-accent-gold-light:#E8C47A
--pt-accent-green:     #5A8C2A   /* brightened for dark mode legibility */
--pt-accent-green-mid: #6BA030

--pt-border-soft:      rgba(232, 220, 200, 0.08)
--pt-border-medium:    rgba(232, 220, 200, 0.15)
--pt-border-accent:    rgba(196, 82, 122, 0.30)
--pt-border-gold:      rgba(212, 168, 76, 0.35)

--pt-shadow-page:      0 2px 16px rgba(0, 0, 0, 0.40)
--pt-shadow-surface:   0 1px 8px  rgba(0, 0, 0, 0.30)
--pt-shadow-inset:     inset 0 1px 6px rgba(0, 0, 0, 0.35)
--pt-shadow-lift:      0 6px 24px rgba(0, 0, 0, 0.50)
--pt-shadow-button:    0 2px 8px  rgba(0, 0, 0, 0.40), inset 0 1px 0 rgba(255,255,255,0.08)
--pt-shadow-button-press: 0 1px 2px rgba(0, 0, 0, 0.50), inset 0 2px 4px rgba(0,0,0,0.30)
```

### Contrast Compliance Notes (WCAG AA)

All text/background pairings meet a minimum 4.5:1 contrast ratio:

| Text token            | On background          | Approx ratio |
| --------------------- | ---------------------- | ------------ |
| `--pt-text-primary`   | `--pt-bg-page` (light) | ~12:1        |
| `--pt-text-secondary` | `--pt-bg-page` (light) | ~5.5:1       |
| `--pt-text-inverse`   | `--pt-accent-burgundy` | ~7:1         |
| `--pt-text-primary`   | `--pt-bg-page` (dark)  | ~11:1        |
| `--pt-text-secondary` | `--pt-bg-page` (dark)  | ~5:1         |

`--pt-text-tertiary` meets 4.5:1 against page background in both modes. It must not be
used for meaningful body text — only decorative labels and disabled states.

---

## Spacing & Layout

```
--pt-radius-sm:    4px
--pt-radius-md:    8px    /* default — panels, inputs, chips */
--pt-radius-lg:    12px   /* cards, modals */
--pt-radius-xl:    16px   /* large floating surfaces */
--pt-radius-pill:  999px  /* badges, tags */

--pt-space-xs:   4px
--pt-space-sm:   8px
--pt-space-md:   16px
--pt-space-lg:   24px
--pt-space-xl:   36px
--pt-space-2xl:  52px

--pt-content-max: 680px   /* narrative column — narrower than typical UI */
```

The narrow `--pt-content-max` mirrors the column width of a printed page and keeps long
narrative passages comfortable to read. Mechanical panels (stat blocks, dice results) may
use full widget width.

---

## Borders & Surfaces

Borders are used sparingly. The primary depth tool is `box-shadow`. Where a border line is
required (e.g. section dividers), it uses `--pt-border-soft` at 1px, or a richer
decorative treatment described below.

### Paper-grain background texture

CSS radial gradients layered to simulate fibrous paper:

```css
background-image:
  radial-gradient(ellipse at 20% 30%, rgba(196, 150, 60, 0.04) 0%, transparent 60%),
  radial-gradient(ellipse at 80% 70%, rgba(139, 34, 82, 0.03) 0%, transparent 50%),
  radial-gradient(ellipse at 50% 50%, rgba(44, 24, 16, 0.02) 0%, transparent 80%);
```

Apply to `.root` or the page wrapper. These gradients are subtle and purpose-built to add
warmth rather than distraction.

### Decorative section dividers

Three CSS-only divider patterns. Insert as `<div class="pt-divider pt-divider--[type]">`.

- `pt-divider--rule`: double horizontal rule in gold, 1px outer / 0.5px inner, 4px gap
- `pt-divider--ornate`: single rule with a centred diamond glyph (`◆`) in gold
- `pt-divider--subtle`: single 0.5px rule in `--pt-border-soft`

### Inset / recessed panels

Apply `box-shadow: var(--pt-shadow-inset)` plus `background: var(--pt-bg-inset)` to
communicate that a surface is below the main plane — used for flavour text callouts,
die result history, and mechanical stat blocks.

---

## Interactive Elements

### Buttons — general principles

All buttons use `min-height: 44px; min-width: 44px` (WCAG 2.5.5 touch target).
`box-sizing: border-box` is required throughout.

#### Action buttons (`.action-btn`, `.btn-action`)

These replace the coral/coral-hover palette with burgundy on parchment:

```css
background: rgba(139, 34, 82, 0.1);
border: 1px solid var(--pt-border-accent);
color: var(--pt-text-primary);
box-shadow: var(--pt-shadow-button);
font-family: 'Lora', Georgia, serif;
font-size: 13px;
border-radius: var(--pt-radius-md);
```

Hover state simulates embossed leather depression:

```css
background: rgba(139, 34, 82, 0.2);
box-shadow: var(--pt-shadow-button-press);
transform: translateY(1px);
```

#### Continue / primary CTA (`.continue-btn`)

Solid burgundy with cream text and gold underline accent:

```css
background: var(--pt-accent-burgundy);
color: var(--pt-text-inverse);
border: none;
box-shadow: var(--pt-shadow-button);
font-family: 'Lora', Georgia, serif;
font-size: 13px;
font-weight: 600;
letter-spacing: 0.04em;
border-radius: var(--pt-radius-md);
```

#### Footer toggle buttons (`.footer-btn`)

Minimal, ink-toned — they should recede from the narrative:

```css
background: transparent;
border: 0.5px solid var(--pt-border-medium);
color: var(--pt-text-secondary);
font-family: 'IBM Plex Mono', monospace;
font-size: 10px;
letter-spacing: 0.08em;
border-radius: var(--pt-radius-sm);
```

### Focus states

All interactive elements must display a visible focus ring that meets WCAG 2.4.11
(focus appearance, AA):

```css
:focus-visible {
  outline: 2px solid var(--pt-accent-gold);
  outline-offset: 3px;
  border-radius: var(--pt-radius-sm);
}
```

Gold is used for focus (rather than burgundy) because it reads as a deliberate
illuminated highlight rather than a hover echo.

---

## Micro-interactions

All transitions and animations are wrapped in `prefers-reduced-motion` guards. The outer
block applies the full motion version; users who have requested reduced motion receive
instant state changes (no intermediate animation, no transform).

```css
/* === Motion-permitted transitions === */
@media (prefers-reduced-motion: no-preference) {
  /* Button press */
  .action-btn,
  .btn-action,
  .continue-btn,
  .footer-btn {
    transition:
      background 0.15s ease,
      box-shadow 0.15s ease,
      transform 0.1s ease,
      border-color 0.15s ease;
  }

  /* Panel slide-in from right edge */
  .panel {
    transition:
      transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.18s ease;
  }
  .panel[hidden] {
    transform: translateX(16px);
    opacity: 0;
  }
  .panel:not([hidden]) {
    transform: translateX(0);
    opacity: 1;
  }

  /* Narrative progressive reveal — fade up */
  .narrative {
    animation: pt-fade-up 0.35s ease both;
  }

  /* XP bar fill */
  .xp-fill {
    transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* Pip fill (HP dots) */
  .pip {
    transition:
      background 0.2s ease,
      border-color 0.2s ease;
  }

  /* Die roll result number count-up — handled by JS;
     the container uses a brief bounce on arrival */
  .die-result-value {
    animation: pt-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  @keyframes pt-fade-up {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pt-pop {
    from {
      transform: scale(0.85);
      opacity: 0.6;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
}

/* === Reduced-motion: instant state changes, no animation === */
@media (prefers-reduced-motion: reduce) {
  .action-btn,
  .btn-action,
  .continue-btn,
  .footer-btn,
  .panel,
  .xp-fill,
  .pip,
  .die-result-value {
    transition: none;
    animation: none;
  }
}
```

---

## Component Overrides

How each engine widget type should look in Parchment style.

### Scene widget (`.scene-widget`, `.root`)

- Background: `--pt-bg-page` with paper-grain gradient overlay
- No outer border; `box-shadow: var(--pt-shadow-page)` for lift
- Padding: `var(--pt-space-md)` sides, `var(--pt-space-lg)` top/bottom

### Location bar (`.loc-bar`)

- Separator: `border-bottom: 1px solid var(--pt-border-soft)`
- Title font: Lora 700 16px, `--pt-text-primary`
- Clock/time chip: monospace 10px, `--pt-text-tertiary`
- No background — transparent, reads as part of page header

### Atmosphere strip (`.atmo-strip`)

- Font: Lora italic 12px, `--pt-text-secondary`
- Letter-spacing: 0 (italic serifs need no extra tracking)
- Top border: `1px dotted var(--pt-border-soft)` (suggests marginalia)

### Narrative text (`.narrative`)

- Font: Lora 400 15px, line-height 1.85, `--pt-text-primary`
- `max-width: var(--pt-content-max)` — column constraint
- First paragraph `::first-letter` drop-cap: font-size 2.8em, float left, line-height 0.85,
  color `--pt-accent-gold`, margin-right 4px (illuminated initial letter effect)

### Section labels (`.section-label`)

- Font: Lora 600 10px, letter-spacing 0.14em, `--pt-text-tertiary`, text-transform uppercase
- Preceded by `pt-divider--subtle`

### Action buttons (`.action-btn`, `.btn-action`)

See Interactive Elements above. Remove the dashed-border default; replace with solid
`--pt-border-accent` at 1px. Font switches from monospace to Lora 13px.

### Danger action (`.danger-btn`)

Retain the red/coral intent but shift hue towards aged crimson:

```
background: rgba(180, 40, 40, 0.10);
border-color: rgba(180, 40, 40, 0.35);
```

Hover:

```
background: rgba(180, 40, 40, 0.22);
```

### Stat block / mechanical panel

- Background: `--pt-bg-inset`, `box-shadow: var(--pt-shadow-inset)`
- Border-radius: `var(--pt-radius-md)`
- All values in IBM Plex Mono
- Stat labels: Lora italic 11px, `--pt-text-secondary`

### HP pips (`.pip`)

- Filled: `background: var(--pt-accent-green)`, `border: 1px solid var(--pt-accent-green-mid)`
- Empty: `background: transparent`, `border: 1px solid var(--pt-border-medium)`
- Damaged (new class `.pip.damaged`): `background: rgba(180,40,40,0.25)`, `border-color: rgba(180,40,40,0.5)`

### XP bar (`.xp-fill`)

- Track: `background: var(--pt-bg-inset)`
- Fill: `background: linear-gradient(90deg, var(--pt-accent-gold), var(--pt-accent-burgundy))`

### Panel overlays (`.panel`)

- Background: `--pt-bg-surface`, `box-shadow: var(--pt-shadow-lift)`
- Border-radius: `var(--pt-radius-lg)` on visible corners
- Panel heading: Lora 700 16px, `--pt-text-primary`
- Top accent strip: `border-top: 2px solid var(--pt-accent-burgundy)` on open panels

### Panel close button (`.panel-close-btn`)

- Font: monospace 11px, `--pt-text-tertiary`
- Border: `0.5px solid var(--pt-border-medium)`, `border-radius: var(--pt-radius-sm)`
- Hover: `border-color: var(--pt-border-accent)`, `color: var(--pt-text-secondary)`

### Die roll widget

- Container: `--pt-bg-surface`, `border-radius: var(--pt-radius-xl)`, `box-shadow: var(--pt-shadow-lift)`
- Die face SVG: stroke `--pt-accent-gold`, fill `--pt-bg-inset`
- Result number: IBM Plex Mono, 36px, `--pt-text-primary`
- Outcome label (SUCCESS/FAILURE): Lora italic 13px, `--pt-text-secondary`
- DC threshold line: monospace 10px, `--pt-text-tertiary`

### Dialogue / NPC widget

- Speaker name: Lora 700 14px, `--pt-accent-burgundy` (light) / `--pt-accent-burgundy` (dark)
- Response text: Lora italic 14px, line-height 1.75, `--pt-text-primary`
- Response option buttons: standard action-btn treatment
- Disposition indicator pip: gold (friendly), green (allied), burgundy (hostile)

### Combat widget

- Initiative order: IBM Plex Mono 11px, `--pt-text-secondary`
- Active combatant row: `background: var(--pt-bg-accent-wash)`, left-border `3px solid var(--pt-accent-burgundy)`
- Damage values: IBM Plex Mono 13px bold, colour-coded via existing semantic colours
  mapped to parchment palette (crimson replaces coral)

### Map widget (`.map-widget`)

- SVG background fill: `var(--pt-bg-inset)` (aged map substrate)
- Explored zone fill: `rgba(196, 150, 60, 0.08)` (gold wash)
- Fog of war: `rgba(28, 20, 16, 0.55)` (dense shadow, slightly warm)
- Route lines: `stroke: var(--pt-accent-gold)`, `stroke-dasharray: 4 3`
- Zone labels: Lora italic 10px

### Lore codex panel

- Entry state colours — map existing state system to parchment:
  - Locked: `--pt-text-tertiary`, `--pt-bg-inset`
  - Partial: `--pt-text-secondary`, `--pt-bg-surface`
  - Discovered: `--pt-text-primary`, `--pt-bg-page`
  - Redacted: strikethrough, `--pt-text-tertiary`, `background: rgba(44,24,16,0.05)`
- Discovery stamp: Lora italic 11px, `--pt-accent-gold`
- Category badge: `border-radius: var(--pt-radius-pill)`, Lora 10px

### Save widget

- The save string display: IBM Plex Mono 11px, `--pt-bg-inset`, `--pt-shadow-inset`
- Copy button: continue-btn treatment in miniature

### Level up widget

- New ability callout: `border-left: 3px solid var(--pt-accent-gold)`, gold wash background
- Stat increase values: IBM Plex Mono, `--pt-accent-green` tint

---

## Complete CSS Block

The following block is the complete injectable stylesheet. Paste into any widget `<style>`
tag after the base engine styles. It uses the CSS cascade — only override what diverges.

```css
/* @extract */
/* ================================================================
   PARCHMENT THEME — text-adventure engine visual override
   Version 1.0 | Works inside visualize:show_widget iframes
   No external dependencies required (Google Fonts are optional;
   stack falls through to Georgia when CSP blocks them)
   ================================================================ */

@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap');

/* ── Custom Properties: Light (default) ─────────────────────────── */
:host {
  --pt-bg-page: #f5f0e8;
  --pt-bg-surface: #ede6d6;
  --pt-bg-inset: #e4daca;
  --pt-bg-accent-wash: #faf6ee;

  --pt-text-primary: #2c1810;
  --pt-text-secondary: #5c3d2e;
  --pt-text-tertiary: #8b6b55;
  --pt-text-inverse: #f5f0e8;

  --pt-accent-burgundy: #8b2252;
  --pt-accent-burgundy-dark: #6b1a3e;
  --pt-accent-gold: #c4963c;
  --pt-accent-gold-light: #ddb96a;
  --pt-accent-green: #2d5016;
  --pt-accent-green-mid: #3d6b1f;

  --pt-border-soft: rgba(44, 24, 16, 0.12);
  --pt-border-medium: rgba(44, 24, 16, 0.22);
  --pt-border-accent: rgba(139, 34, 82, 0.35);
  --pt-border-gold: rgba(196, 150, 60, 0.45);

  --pt-shadow-page: 0 2px 12px rgba(44, 24, 16, 0.1);
  --pt-shadow-surface: 0 1px 6px rgba(44, 24, 16, 0.08);
  --pt-shadow-inset: inset 0 1px 4px rgba(44, 24, 16, 0.08);
  --pt-shadow-lift: 0 4px 20px rgba(44, 24, 16, 0.16);
  --pt-shadow-button: 0 2px 6px rgba(44, 24, 16, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.25);
  --pt-shadow-button-press: 0 1px 2px rgba(44, 24, 16, 0.25), inset 0 1px 3px rgba(44, 24, 16, 0.15);

  --pt-space-xs: 4px;
  --pt-space-sm: 8px;
  --pt-space-md: 16px;
  --pt-space-lg: 24px;
  --pt-space-xl: 36px;
  --pt-space-2xl: 52px;

  --pt-radius-sm: 4px;
  --pt-radius-md: 8px;
  --pt-radius-lg: 12px;
  --pt-radius-xl: 16px;
  --pt-radius-pill: 999px;

  --pt-font-serif: 'Lora', 'Merriweather', Georgia, 'Times New Roman', serif;
  --pt-font-mono: 'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', monospace;

  --pt-content-max: 680px;

  /* ── CSS Custom Property Contract (required by style-reference.md) ─ */
  --ta-font-heading: var(--pt-font-serif);
  --ta-font-body: var(--pt-font-mono);
  --ta-color-accent: var(--pt-accent-burgundy);
  --ta-color-accent-hover: var(--pt-accent-burgundy-dark);
  --ta-color-accent-bg: rgba(139, 34, 82, 0.08);
  --ta-color-accent-bg-hover: rgba(139, 34, 82, 0.15);
  --ta-color-success: var(--pt-accent-green);
  --ta-color-success-border: var(--pt-accent-green-mid);
  --ta-color-danger: var(--pt-accent-burgundy);
  --ta-color-danger-border: var(--pt-accent-burgundy-dark);
  --ta-color-danger-bg: rgba(139, 34, 82, 0.08);
  --ta-color-danger-bg-hover: rgba(139, 34, 82, 0.15);
  --ta-color-warning: var(--pt-accent-gold);
  --ta-color-warning-border: color-mix(in srgb, var(--pt-accent-gold) 70%, black);
  --ta-color-warning-bg: rgba(196, 150, 60, 0.08);
  --ta-color-xp: var(--pt-accent-gold);
  --ta-color-focus: var(--pt-accent-burgundy);
  --ta-color-conviction: #7c6bf0;
  --ta-color-conviction-border: #6b5ce0;
  --ta-badge-success-bg: rgba(45, 80, 22, 0.1);
  --ta-badge-success-text: var(--pt-accent-green);
  --ta-badge-partial-bg: rgba(196, 150, 60, 0.1);
  --ta-badge-partial-text: var(--pt-accent-gold);
  --ta-badge-failure-bg: rgba(139, 34, 82, 0.1);
  --ta-badge-failure-text: var(--pt-accent-burgundy);
  --ta-badge-crit-success-border: var(--pt-accent-green-mid);
  --ta-badge-crit-failure-border: var(--pt-accent-burgundy);
  --ta-color-credits: var(--pt-accent-gold);
  --ta-color-tab-active: var(--pt-accent-burgundy);
  --ta-color-info: #2b5a8a;
  --ta-btn-primary-text: #1a1a1a;
  --ta-border-style-poi: 1px dashed;
  --ta-die-spin-duration: 0.5s;

  /* ── --sta-* aliases (consumed by common-css.ts shared widgets) ─── */
  --sta-text-primary: var(--pt-text-primary);
  --sta-text-secondary: var(--pt-text-secondary);
  --sta-text-tertiary: var(--pt-text-tertiary);
  --sta-border-tertiary: var(--pt-border-soft);
  --sta-color-text-emphasis: #1a1a1a;

  /* --- Speaker colours (multi-dialogue) --- */
  --speaker-color-0: #6b3a2a;
  --speaker-color-1: #2d5a27;
  --speaker-color-2: #7a1a1a;
  --speaker-color-3: #1a3a5c;
  --speaker-color-4: #8b4513;
  --speaker-color-5: #8b7a2a;
}

/* ── Custom Properties: Dark ─────────────────────────────────────── */
@media (prefers-color-scheme: dark) {
  :host {
    --pt-bg-page: #1c1410;
    --pt-bg-surface: #261c16;
    --pt-bg-inset: #150f0b;
    --pt-bg-accent-wash: #2e221a;

    --pt-text-primary: #e8dcc8;
    --pt-text-secondary: #c4a882;
    --pt-text-tertiary: #8b7355;
    --pt-text-inverse: #1c1410;

    --pt-accent-burgundy: #c4527a;
    --pt-accent-burgundy-dark: #a83860;
    --pt-accent-gold: #d4a84c;
    --pt-accent-gold-light: #e8c47a;
    --pt-accent-green: #5a8c2a;
    --pt-accent-green-mid: #6ba030;

    --pt-border-soft: rgba(232, 220, 200, 0.08);
    --pt-border-medium: rgba(232, 220, 200, 0.15);
    --pt-border-accent: rgba(196, 82, 122, 0.3);
    --pt-border-gold: rgba(212, 168, 76, 0.35);

    --pt-shadow-page: 0 2px 16px rgba(0, 0, 0, 0.4);
    --pt-shadow-surface: 0 1px 8px rgba(0, 0, 0, 0.3);
    --pt-shadow-inset: inset 0 1px 6px rgba(0, 0, 0, 0.35);
    --pt-shadow-lift: 0 6px 24px rgba(0, 0, 0, 0.5);
    --pt-shadow-button: 0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    --pt-shadow-button-press: 0 1px 2px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(0, 0, 0, 0.3);

    /* ── CSS Custom Property Contract (required by style-reference.md) ─ */
    --ta-font-heading: var(--pt-font-serif);
    --ta-font-body: var(--pt-font-mono);
    --ta-color-accent: var(--pt-accent-burgundy);
    --ta-color-accent-hover: var(--pt-accent-burgundy-dark);
    --ta-color-accent-bg: rgba(139, 34, 82, 0.08);
    --ta-color-accent-bg-hover: rgba(139, 34, 82, 0.15);
    --ta-color-success: var(--pt-accent-green);
    --ta-color-success-border: var(--pt-accent-green-mid);
    --ta-color-danger: var(--pt-accent-burgundy);
    --ta-color-danger-border: var(--pt-accent-burgundy-dark);
    --ta-color-danger-bg: rgba(139, 34, 82, 0.08);
    --ta-color-danger-bg-hover: rgba(139, 34, 82, 0.15);
    --ta-color-warning: var(--pt-accent-gold);
    --ta-color-warning-border: color-mix(in srgb, var(--pt-accent-gold) 70%, black);
    --ta-color-warning-bg: rgba(196, 150, 60, 0.08);
    --ta-color-xp: var(--pt-accent-gold);
    --ta-color-focus: var(--pt-accent-burgundy);
    --ta-color-conviction: #7c6bf0;
    --ta-color-conviction-border: #6b5ce0;
    --ta-badge-success-bg: rgba(45, 80, 22, 0.1);
    --ta-badge-success-text: var(--pt-accent-green);
    --ta-badge-partial-bg: rgba(196, 150, 60, 0.1);
    --ta-badge-partial-text: var(--pt-accent-gold);
    --ta-badge-failure-bg: rgba(139, 34, 82, 0.1);
    --ta-badge-failure-text: var(--pt-accent-burgundy);
    --ta-badge-crit-success-border: var(--pt-accent-green-mid);
    --ta-badge-crit-failure-border: var(--pt-accent-burgundy);
    --ta-color-credits: var(--pt-accent-gold);
    --ta-color-tab-active: var(--pt-accent-burgundy);
    --ta-color-info: #2b5a8a;
    --ta-btn-primary-text: #1a1a1a;
    --ta-border-style-poi: 1px dashed;
    --ta-die-spin-duration: 0.5s;
  }
}

[data-theme='dark'] {
  --pt-bg-page: #1c1410;
  --pt-bg-surface: #261c16;
  --pt-bg-inset: #150f0b;
  --pt-bg-accent-wash: #2e221a;
  --pt-text-primary: #e8dcc8;
  --pt-text-secondary: #c4a882;
  --pt-text-tertiary: #8b7355;
  --pt-text-inverse: #1c1410;
  --pt-accent-burgundy: #c4527a;
  --pt-accent-burgundy-dark: #a83860;
  --pt-accent-gold: #d4a84c;
  --pt-accent-gold-light: #e8c47a;
  --pt-accent-green: #5a8c2a;
  --pt-accent-green-mid: #6ba030;
  --pt-border-soft: rgba(232, 220, 200, 0.08);
  --pt-border-medium: rgba(232, 220, 200, 0.15);
  --pt-border-accent: rgba(196, 82, 122, 0.3);
  --pt-border-gold: rgba(212, 168, 76, 0.35);
  --pt-shadow-page: 0 2px 16px rgba(0, 0, 0, 0.4);
  --pt-shadow-surface: 0 1px 8px rgba(0, 0, 0, 0.3);
  --pt-shadow-inset: inset 0 1px 6px rgba(0, 0, 0, 0.35);
  --pt-shadow-lift: 0 6px 24px rgba(0, 0, 0, 0.5);
  --pt-shadow-button: 0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  --pt-shadow-button-press: 0 1px 2px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* ── Page & Root ─────────────────────────────────────────────────── */
.root,
body {
  background-color: var(--pt-bg-page);
  background-image:
    radial-gradient(ellipse at 20% 30%, rgba(196, 150, 60, 0.04) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 70%, rgba(139, 34, 82, 0.03) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(44, 24, 16, 0.02) 0%, transparent 80%);
  color: var(--pt-text-primary);
  font-family: var(--pt-font-serif);
}

/* ── Typography ──────────────────────────────────────────────────── */
h1,
h2,
h3,
h4 {
  font-family: var(--pt-font-serif);
  color: var(--pt-text-primary);
  font-weight: 700;
}

/* Override engine's Syne heading font */
.scene-title,
.panel-heading,
[class*='heading'] {
  font-family: var(--pt-font-serif) !important;
}

/* ── Narrative ───────────────────────────────────────────────────── */
.narrative {
  font-family: var(--pt-font-serif);
  font-size: 15px;
  line-height: 1.85;
  color: var(--pt-text-primary);
  max-width: var(--pt-content-max);
}

.narrative p:first-of-type::first-letter {
  font-size: 2.8em;
  line-height: 0.85;
  float: left;
  margin-right: 4px;
  color: var(--pt-accent-gold);
  font-weight: 700;
}

/* ── Location Bar ────────────────────────────────────────────────── */
.loc-bar {
  border-bottom: 1px solid var(--pt-border-soft);
  background: transparent;
}

.loc-bar .scene-title,
.loc-bar h2 {
  font-family: var(--pt-font-serif);
  font-size: 16px;
  font-weight: 700;
  color: var(--pt-text-primary);
}

/* ── Atmosphere strip ────────────────────────────────────────────── */
.atmo-strip {
  font-family: var(--pt-font-serif);
  font-style: italic;
  font-size: 12px;
  color: var(--pt-text-secondary);
  border-top: 1px dotted var(--pt-border-soft);
  letter-spacing: 0;
}

/* ── Section labels ──────────────────────────────────────────────── */
.section-label,
[class*='label--section'] {
  font-family: var(--pt-font-serif);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--pt-text-tertiary);
}

/* ── Decorative dividers ─────────────────────────────────────────── */
.pt-divider {
  width: 100%;
  margin: var(--pt-space-md) 0;
  border: none;
}

.pt-divider--rule {
  height: 6px;
  border-top: 1px solid var(--pt-accent-gold);
  border-bottom: 0.5px solid var(--pt-border-gold);
}

.pt-divider--ornate {
  display: flex;
  align-items: center;
  gap: var(--pt-space-sm);
  color: var(--pt-accent-gold);
  font-size: 10px;
}
.pt-divider--ornate::before,
.pt-divider--ornate::after {
  content: '';
  flex: 1;
  height: 0.5px;
  background: var(--pt-border-gold);
}
.pt-divider--ornate::before {
  content: '';
}
.pt-divider--ornate[data-glyph]::after {
  content: attr(data-glyph);
  flex: none;
}

.pt-divider--subtle {
  border-top: 0.5px solid var(--pt-border-soft);
}

/* ── Buttons — action ────────────────────────────────────────────── */
.action-btn,
.btn-action {
  font-family: var(--pt-font-serif);
  font-size: 13px;
  font-weight: 400;
  background: rgba(139, 34, 82, 0.08);
  border: 1px solid var(--pt-border-accent) !important;
  border-style: solid !important;
  color: var(--pt-text-primary);
  box-shadow: var(--pt-shadow-button);
  border-radius: var(--pt-radius-md);
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  cursor: pointer;
}

.action-btn:hover,
.btn-action:hover {
  background: rgba(139, 34, 82, 0.18);
  box-shadow: var(--pt-shadow-button-press);
  transform: translateY(1px);
  border-color: var(--pt-border-accent) !important;
}

/* ── Buttons — continue / primary ────────────────────────────────── */
.continue-btn {
  font-family: var(--pt-font-serif);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  background: var(--pt-accent-burgundy);
  color: var(--pt-text-inverse);
  border: none;
  box-shadow: var(--pt-shadow-button);
  border-radius: var(--pt-radius-md);
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
}

.continue-btn:hover {
  background: var(--pt-accent-burgundy-dark);
  box-shadow: var(--pt-shadow-button-press);
  transform: translateY(1px);
}

/* Dark mode action button adjustment */
@media (prefers-color-scheme: dark) {
  .action-btn,
  .btn-action {
    background: rgba(196, 82, 122, 0.1);
    border-color: var(--pt-border-accent) !important;
  }

  .action-btn:hover,
  .btn-action:hover {
    background: rgba(196, 82, 122, 0.22);
  }
}

/* ── Buttons — danger ────────────────────────────────────────────── */
.danger-btn {
  background: rgba(180, 40, 40, 0.1);
  border-color: rgba(180, 40, 40, 0.35) !important;
  font-family: var(--pt-font-serif);
}

.danger-btn:hover {
  background: rgba(180, 40, 40, 0.22);
}

/* ── Buttons — footer ────────────────────────────────────────────── */
.footer-btn {
  font-family: var(--pt-font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  background: transparent;
  border: 0.5px solid var(--pt-border-medium);
  color: var(--pt-text-secondary);
  border-radius: var(--pt-radius-sm);
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
}

.footer-btn:hover {
  border-color: var(--pt-border-accent);
  color: var(--pt-text-primary);
}

/* ── Focus states ────────────────────────────────────────────────── */
button:focus-visible,
[data-prompt]:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--pt-accent-gold) !important;
  outline-offset: 3px;
  border-radius: var(--pt-radius-sm);
}

/* ── Panels ──────────────────────────────────────────────────────── */
.panel {
  background: var(--pt-bg-surface);
  box-shadow: var(--pt-shadow-lift);
  border-radius: var(--pt-radius-lg);
  border-top: 2px solid var(--pt-accent-burgundy);
}

.panel-heading {
  font-family: var(--pt-font-serif);
  font-size: 16px;
  font-weight: 700;
  color: var(--pt-text-primary);
  border-bottom: 1px solid var(--pt-border-soft);
}

.panel-close-btn {
  font-family: var(--pt-font-mono);
  font-size: 11px;
  background: transparent;
  border: 0.5px solid var(--pt-border-medium);
  border-radius: var(--pt-radius-sm);
  color: var(--pt-text-tertiary);
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
}

.panel-close-btn:hover {
  border-color: var(--pt-border-accent);
  color: var(--pt-text-secondary);
}

/* ── Stat blocks & mechanical panels ─────────────────────────────── */
.stat-block,
.stats-panel,
.mech-panel {
  background: var(--pt-bg-inset);
  box-shadow: var(--pt-shadow-inset);
  border-radius: var(--pt-radius-md);
  font-family: var(--pt-font-mono);
}

/* Stat labels use italic serif */
.stat-label {
  font-family: var(--pt-font-serif);
  font-style: italic;
  font-size: 11px;
  color: var(--pt-text-secondary);
}

/* Stat values stay monospace */
.stat-value {
  font-family: var(--pt-font-mono);
  color: var(--pt-text-primary);
}

/* ── HP pips ─────────────────────────────────────────────────────── */
.pip {
  background: var(--pt-accent-green);
  border: 1px solid var(--pt-accent-green-mid);
}

.pip.empty {
  background: transparent;
  border-color: var(--pt-border-medium);
}

.pip.damaged {
  background: rgba(180, 40, 40, 0.25);
  border-color: rgba(180, 40, 40, 0.5);
}

/* ── XP bar ──────────────────────────────────────────────────────── */
.xp-bar {
  background: var(--pt-bg-inset);
  box-shadow: var(--pt-shadow-inset);
}

.xp-fill {
  background: linear-gradient(90deg, var(--pt-accent-gold), var(--pt-accent-burgundy));
  border-radius: 2px;
}

/* ── Status bar / footer strip ───────────────────────────────────── */
.status-bar,
.footer-strip {
  border-top: 0.5px solid var(--pt-border-soft);
  background: transparent;
  font-size: 10px;
  color: var(--pt-text-tertiary);
}

/* ── Lore codex entry states ─────────────────────────────────────── */
.entry--locked {
  color: var(--pt-text-tertiary);
  background: var(--pt-bg-inset);
}

.entry--partial {
  color: var(--pt-text-secondary);
  background: var(--pt-bg-surface);
}

.entry--discovered {
  color: var(--pt-text-primary);
  background: var(--pt-bg-page);
}

.entry--redacted {
  text-decoration: line-through;
  color: var(--pt-text-tertiary);
  background: rgba(44, 24, 16, 0.05);
}

.discovery-stamp {
  font-family: var(--pt-font-serif);
  font-style: italic;
  font-size: 11px;
  color: var(--pt-accent-gold);
}

.category-badge {
  font-family: var(--pt-font-serif);
  font-size: 10px;
  border-radius: var(--pt-radius-pill);
  padding: 2px 8px;
  background: var(--pt-bg-inset);
  color: var(--pt-text-secondary);
  border: 0.5px solid var(--pt-border-medium);
}

/* ── Combat widget ───────────────────────────────────────────────── */
.initiative-order {
  font-family: var(--pt-font-mono);
  font-size: 11px;
  color: var(--pt-text-secondary);
}

.combatant-row--active {
  background: var(--pt-bg-accent-wash);
  border-left: 3px solid var(--pt-accent-burgundy);
}

/* ── Map widget SVG ──────────────────────────────────────────────── */
.map-widget {
  background: var(--pt-bg-inset);
}

.map-zone--explored {
  fill: rgba(196, 150, 60, 0.08);
}

.map-zone--fog {
  fill: rgba(28, 20, 16, 0.55);
}

.map-route {
  stroke: var(--pt-accent-gold);
  stroke-dasharray: 4 3;
}

.map-label {
  font-family: var(--pt-font-serif);
  font-style: italic;
  font-size: 10px;
}

/* ── Die roll widget ─────────────────────────────────────────────── */
.die-result-value {
  font-family: var(--pt-font-mono);
  font-size: 36px;
  font-weight: 500;
  color: var(--pt-text-primary);
}

.die-outcome-label {
  font-family: var(--pt-font-serif);
  font-style: italic;
  font-size: 13px;
  color: var(--pt-text-secondary);
}

/* ── Level up — ability callout ──────────────────────────────────── */
.ability-callout,
.level-up-new {
  border-left: 3px solid var(--pt-accent-gold);
  background: rgba(196, 150, 60, 0.06);
  border-radius: 0 var(--pt-radius-md) var(--pt-radius-md) 0;
}

.stat-increase {
  font-family: var(--pt-font-mono);
  color: var(--pt-accent-green);
}

/* ── Micro-interactions ──────────────────────────────────────────── */
@media (prefers-reduced-motion: no-preference) {
  .action-btn,
  .btn-action,
  .continue-btn,
  .footer-btn,
  .panel-close-btn,
  .danger-btn {
    transition:
      background 0.15s ease,
      box-shadow 0.15s ease,
      transform 0.1s ease,
      border-color 0.15s ease;
  }

  .panel {
    transition:
      transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.18s ease;
  }

  .panel[hidden] {
    transform: translateX(16px);
    opacity: 0;
  }

  .panel:not([hidden]) {
    transform: translateX(0);
    opacity: 1;
  }

  .narrative {
    animation: pt-fade-up 0.35s ease both;
  }

  .xp-fill {
    transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .pip {
    transition:
      background 0.2s ease,
      border-color 0.2s ease;
  }

  .die-result-value {
    animation: pt-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  @keyframes pt-fade-up {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pt-pop {
    from {
      transform: scale(0.85);
      opacity: 0.6;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .action-btn,
  .btn-action,
  .continue-btn,
  .footer-btn,
  .panel-close-btn,
  .danger-btn,
  .panel,
  .xp-fill,
  .pip,
  .die-result-value {
    transition: none;
    animation: none;
  }
}

/* ── Screen-reader-only utility ──────────────────────────────────── */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
/* ================================================================
   END PARCHMENT THEME
   ================================================================ */
```
