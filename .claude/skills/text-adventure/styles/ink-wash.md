---
name: ink-wash
description: >
  East Asian brush-painting inspired theme for the text adventure engine. Near-monochrome
  ink palette with a single vermillion accent. Meditative whitespace, minimal borders, and
  serif typography evoke calligraphy on rice paper. Overrides all base structural styles
  when injected into a widget's <style> block.
best-for:
  - historical-fiction
  - mythology
  - samurai
  - wuxia
  - feudal-japan
  - ancient-china
  - zen
  - contemplative-horror
  - literary-fiction
  - mystery
---

## Design Philosophy

Ink wash painting (*sumi-e*) values emptiness as much as mark. A brushstroke gains meaning
from the silence around it. This theme applies that principle to interface design: whitespace
is not wasted space but the ground on which content rests. Every element earns its place.

The palette is near-monochrome because ink is near-monochrome. Gradations of grey — from
deep charcoal through warm mid-tones to the near-white of rice paper — carry the full
visual weight of the interface. The single vermillion accent (`#D03A2D`) appears like a
seal stamp: rare, deliberate, and therefore powerful. Overuse would destroy the effect.

Borders are dissolved wherever possible. Spatial relationships are communicated through
margin and padding rather than rules and boxes. Where a boundary is truly needed, it is
drawn with the thinnest possible stroke — 0.5px, never 1px — and in a muted tone.

Typography leans on Noto Serif for its exceptional Latin and CJK glyph coverage and its
calligraphic warmth at reading sizes. UI chrome (labels, tags, buttons) uses a clean
system sans to provide contrast with the body text, distinguishing mechanical information
from narrative.

---

## Typography

### Font Stacks

```
Body / narrative:
  'Noto Serif', Georgia, 'Times New Roman', serif

UI / labels / buttons:
  system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif

Monospace (stats, roll values):
  'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', monospace
```

Google Fonts (`Noto Serif`) may be CSP-blocked in Claude.ai widget iframes. The fallback
stack (`Georgia, 'Times New Roman', serif`) is acceptable — both have calligraphic warmth.
Do not use `@import` as the only font-loading mechanism; always write out the full fallback.

### Type Scale

| Role              | Size   | Weight | Line Height | Letter Spacing |
|-------------------|--------|--------|-------------|----------------|
| Location heading  | 17px   | 600    | 1.3         | 0              |
| Scene heading     | 15px   | 600    | 1.3         | 0              |
| Narrative body    | 14px   | 400    | 1.9         | 0.01em         |
| NPC dialogue      | 14px   | 400    | 1.85        | 0.01em         |
| Section label     | 9px    | 500    | 1.4         | 0.18em         |
| Atmo pill / tag   | 10px   | 400    | 1.4         | 0.06em         |
| Button text       | 12px   | 400    | 1           | 0.04em         |
| Footer button     | 10px   | 400    | 1           | 0.08em         |
| Stat / mono value | 11px   | 400    | 1.5         | 0.06em         |

Section labels are always `text-transform: uppercase`. Everything else is sentence case.

---

## Colour Palette

All colours are defined as CSS custom properties on `:host` and overridden for dark mode
via `@media (prefers-color-scheme: dark)`. Widget HTML must never hard-code hex values in
attributes — use the custom properties only.

### Light Mode (Rice Paper)

```css
:host {
  /* --- Backgrounds --- */
  --iw-bg-primary:      #F5F2EB;   /* rice paper — widget root */
  --iw-bg-secondary:    #EDE9E0;   /* slightly deeper paper — inset surfaces */
  --iw-bg-tertiary:     #E4DFD4;   /* recessed well, selected state */
  --iw-bg-wash:         #F9F7F2;   /* near-white — hover lift */

  /* --- Ink tones (text) --- */
  --iw-ink-primary:     #1A1A1A;   /* full ink — headings, primary text */
  --iw-ink-secondary:   #4A4A4A;   /* diluted ink — body narrative */
  --iw-ink-tertiary:    #8A8A8A;   /* pale wash — labels, metadata */
  --iw-ink-ghost:       #B0AA9E;   /* near-invisible — placeholder, disabled */

  /* --- Borders --- */
  --iw-border-strong:   #C5C0B6;   /* visible rule — section divider */
  --iw-border-subtle:   #D9D4C8;   /* gentle boundary — card edge */
  --iw-border-ghost:    #E4DFD4;   /* barely-there — inset well edge */

  /* --- Accent: vermillion (use sparingly) --- */
  --iw-accent:          #D03A2D;   /* vermillion seal — primary CTA, critical badge */
  --iw-accent-muted:    rgba(208, 58, 45, 0.10);  /* wash tint — CTA background */
  --iw-accent-border:   rgba(208, 58, 45, 0.40);  /* border tint — CTA outline */

  /* --- Semantic colours (desaturated to preserve monochrome feel) --- */
  --iw-success:         #3D7A5E;   /* muted jade — success states */
  --iw-success-bg:      rgba(61, 122, 94, 0.08);
  --iw-warning:         #8A6B2A;   /* aged gold — warning states */
  --iw-warning-bg:      rgba(138, 107, 42, 0.08);
  --iw-danger:          #8A2A2A;   /* dried blood — danger / critical failure */
  --iw-danger-bg:       rgba(138, 42, 42, 0.08);
  --iw-info:            #2A4A6A;   /* storm blue — informational */
  --iw-info-bg:         rgba(42, 74, 106, 0.08);

  /* --- Ink wash gradient (edge bleed effect on containers) --- */
  --iw-edge-wash: radial-gradient(
    ellipse at 50% 100%,
    rgba(26, 26, 26, 0.04) 0%,
    transparent 70%
  );

  /* --- Spacing scale (generous — 50-100% larger than base) --- */
  --iw-space-xs:  6px;
  --iw-space-sm:  12px;
  --iw-space-md:  20px;
  --iw-space-lg:  32px;
  --iw-space-xl:  52px;

  /* --- Border radii (very slight — near-square, not pill) --- */
  --iw-radius-sm: 2px;
  --iw-radius-md: 3px;
  --iw-radius-lg: 4px;

  /* ── CSS Custom Property Contract (required by style-reference.md) ─ */
  --ta-font-heading:              'Noto Serif', Georgia, 'Times New Roman', serif;
  --ta-font-body:                 system-ui, -apple-system, sans-serif;
  --ta-font-serif:                'Noto Serif', Georgia, 'Times New Roman', serif;
  --ta-color-accent:              var(--iw-accent);
  --ta-color-accent-hover:        color-mix(in srgb, var(--iw-accent) 80%, black);
  --ta-color-accent-bg:           var(--iw-accent-muted);
  --ta-color-accent-bg-hover:     rgba(208, 58, 45, 0.18);
  --ta-color-success:             var(--iw-success);
  --ta-color-success-border:      color-mix(in srgb, var(--iw-success) 70%, black);
  --ta-color-danger:              var(--iw-danger);
  --ta-color-danger-border:       color-mix(in srgb, var(--iw-danger) 70%, black);
  --ta-color-danger-bg:           var(--iw-danger-bg);
  --ta-color-danger-bg-hover:     rgba(138, 42, 42, 0.16);
  --ta-color-warning:             var(--iw-warning);
  --ta-color-warning-border:      color-mix(in srgb, var(--iw-warning) 70%, black);
  --ta-color-warning-bg:          var(--iw-warning-bg);
  --ta-color-xp:                  var(--iw-warning);
  --ta-color-focus:               var(--iw-accent);
  --ta-color-conviction:          #6B5C8A;
  --ta-color-conviction-border:   #5A4B78;
  --ta-color-bg-secondary:        var(--iw-bg-secondary);
  --ta-color-credits:             var(--iw-warning);
  --ta-color-tab-active:          var(--iw-accent);
  --ta-color-info:                var(--iw-info);
  --ta-color-xp-border:           color-mix(in srgb, var(--iw-warning) 50%, transparent);
  --ta-badge-success-bg:          var(--iw-success-bg);
  --ta-badge-success-text:        var(--iw-success);
  --ta-badge-partial-bg:          var(--iw-warning-bg);
  --ta-badge-partial-text:        var(--iw-warning);
  --ta-badge-failure-bg:          var(--iw-danger-bg);
  --ta-badge-failure-text:        var(--iw-danger);
  --ta-badge-crit-success-border: var(--iw-success);
  --ta-badge-crit-failure-border: var(--iw-danger);
  --ta-border-style-poi:          1px dashed;
  --ta-die-spin-duration:         0.5s;

  /* --- Speaker colours (multi-dialogue) --- */
  --speaker-color-0: #c8853a;
  --speaker-color-1: #5b7fa6;
  --speaker-color-2: #7a9e7e;
  --speaker-color-3: #c47c82;
  --speaker-color-4: #b5714d;
  --speaker-color-5: #6b6b6b;
}
```

### Dark Mode (Charcoal Night)

```css
@media (prefers-color-scheme: dark) {
  :host {
    /* --- Backgrounds --- */
    --iw-bg-primary:      #1A1816;   /* deep charcoal — widget root */
    --iw-bg-secondary:    #232120;   /* raised surface */
    --iw-bg-tertiary:     #2C2A28;   /* inset well, selected state */
    --iw-bg-wash:         #201E1C;   /* hover lift */

    /* --- Ink tones (text) --- */
    --iw-ink-primary:     #C5C0B6;   /* warm grey — headings, primary text */
    --iw-ink-secondary:   #9A9590;   /* mid grey — body narrative */
    --iw-ink-tertiary:    #6A6560;   /* dark grey — labels, metadata */
    --iw-ink-ghost:       #4A4642;   /* near-invisible — placeholder, disabled */

    /* --- Borders --- */
    --iw-border-strong:   #4A4542;   /* visible rule */
    --iw-border-subtle:   #3A3835;   /* gentle boundary */
    --iw-border-ghost:    #2C2A28;   /* barely-there */

    /* --- Accent: muted vermillion --- */
    --iw-accent:          #C04030;   /* slightly dampened for dark bg */
    --iw-accent-muted:    rgba(192, 64, 48, 0.14);
    --iw-accent-border:   rgba(192, 64, 48, 0.45);

    /* --- Semantic colours --- */
    --iw-success:         #4A9E74;
    --iw-success-bg:      rgba(74, 158, 116, 0.10);
    --iw-warning:         #A8883A;
    --iw-warning-bg:      rgba(168, 136, 58, 0.10);
    --iw-danger:          #A84040;
    --iw-danger-bg:       rgba(168, 64, 64, 0.10);
    --iw-info:            #4A6E9A;
    --iw-info-bg:         rgba(74, 110, 154, 0.10);

    /* --- Ink wash gradient (lighter on dark) --- */
    --iw-edge-wash: radial-gradient(
      ellipse at 50% 100%,
      rgba(197, 192, 182, 0.04) 0%,
      transparent 70%
    );

  }
}
```

### WCAG AA Contrast Notes

All primary text / background pairings meet WCAG AA (4.5:1 minimum):

| Pair                                    | Approx. ratio | Pass |
|-----------------------------------------|---------------|------|
| `--iw-ink-primary` on `--iw-bg-primary` (light) | 16.5:1   | AA   |
| `--iw-ink-secondary` on `--iw-bg-primary` (light) | 7.2:1  | AA   |
| `--iw-ink-tertiary` on `--iw-bg-primary` (light)  | 3.8:1  | AA (large text / UI only) |
| `--iw-ink-primary` on `--iw-bg-primary` (dark)    | 9.1:1  | AA   |
| `--iw-ink-secondary` on `--iw-bg-primary` (dark)  | 4.7:1  | AA   |
| `--iw-accent` on `--iw-bg-primary` (light)        | 5.2:1  | AA   |
| `--iw-accent` on `--iw-bg-primary` (dark)         | 4.6:1  | AA   |

`--iw-ink-tertiary` in light mode only meets AA for text ≥18px or bold ≥14px. Use it
only for labels, tags, and footer text — never for body narrative.

---

## Spacing & Layout

The defining characteristic of this style is air. Padding is 50–100% larger than the
engine's default base styles. Sections breathe. The eye rests between elements.

```css
/* Widget root — generous outer padding */
.iw-root {
  background: var(--iw-bg-primary);
  background-image: var(--iw-edge-wash);
  padding: var(--iw-space-lg) var(--iw-space-md) var(--iw-space-xl);
  font-family: 'Noto Serif', Georgia, 'Times New Roman', serif;
  color: var(--iw-ink-secondary);
}

/* Section spacing — large gaps between logical blocks */
.iw-section + .iw-section {
  margin-top: var(--iw-space-lg);
}

/* Narrative text — the heart of the layout, given the most room */
.iw-narrative {
  margin-block: var(--iw-space-md) var(--iw-space-lg);
}

/* Button rows — slightly more compact than surrounding prose */
.iw-btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--iw-space-sm);
  margin-block: var(--iw-space-sm) var(--iw-space-md);
}

/* Status bar / footer — smaller gap to ground the widget */
.iw-footer {
  margin-top: var(--iw-space-lg);
  padding-top: var(--iw-space-sm);
}
```

---

## Borders & Surfaces

Borders are a last resort. The preferred separator is whitespace. When a rule is
absolutely necessary — for instance, to separate the header from body, or the footer
from content — use a 0.5px line in `--iw-border-subtle`. Never use shadows, never use
1px borders, and never use background fills on containers unless the content is an
inset well (e.g., a status card or NPC dialogue block).

```css
/* Thin horizontal rule — the only acceptable divider */
.iw-rule {
  border: none;
  border-top: 0.5px solid var(--iw-border-subtle);
  margin-block: var(--iw-space-md);
}

/* Inset well — for status blocks, NPC reactions, codex entries */
.iw-well {
  background: var(--iw-bg-secondary);
  background-image: var(--iw-edge-wash);
  border: 0.5px solid var(--iw-border-ghost);
  border-radius: var(--iw-radius-md);
  padding: var(--iw-space-md);
}

/* Card edge — for item cards, enemy cards, etc. */
.iw-card {
  border: 0.5px solid var(--iw-border-subtle);
  border-radius: var(--iw-radius-md);
  padding: var(--iw-space-sm) var(--iw-space-md);
  background: transparent;
}

/* Ink-bleed edge effect — applies at bottom of tall containers */
.iw-card::after,
.iw-well::after {
  content: '';
  display: block;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    var(--iw-border-ghost) 20%,
    var(--iw-border-subtle) 50%,
    var(--iw-border-ghost) 80%,
    transparent
  );
  margin-top: var(--iw-space-sm);
  opacity: 0.5;
}

/* Atmosphere pills — borderless tags, very light */
.iw-pill {
  display: inline-block;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--iw-ink-tertiary);
  padding: 3px 10px;
  border-radius: 999px;
  border: 0.5px solid var(--iw-border-subtle);
  background: transparent;
}
```

---

## Interactive Elements

### Buttons

Buttons in this style are anti-buttons. They do not look like buttons from a CRUD
application. They look like text with intent — understated, typographically grounded,
with generous touch targets achieved through padding rather than visual mass.

There are three button types:

**Primary action** — carries `data-prompt`, advances the story. Rendered as plain text
with a very faint vermillion bottom border that thickens on hover. No background fill
on rest state.

**Secondary / POI** — exploratory action. Plain text with a subtle ink-tone underline.
Hover adds a light wash background.

**UI / Footer** — panel toggles, close buttons. Sans-serif, smaller, uppercase label
style with a ghost border.

```css
/* ----- Primary action button (advances story) ----- */
.iw-btn-action {
  font-family: 'Noto Serif', Georgia, serif;
  font-size: 13px;
  letter-spacing: 0.02em;
  color: var(--iw-ink-primary);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--iw-accent-border);
  border-radius: 0;
  padding: 6px 2px;
  padding-bottom: 5px;
  /* Min touch target: achieved via min-height + min-width */
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  text-align: left;
  transition: border-color 200ms ease, color 200ms ease;
  box-sizing: border-box;
}

.iw-btn-action:hover {
  color: var(--iw-accent);
  border-bottom-color: var(--iw-accent);
}

.iw-btn-action:active {
  color: var(--iw-accent);
  opacity: 0.75;
}

/* ----- Secondary / POI button (explore, examine) ----- */
.iw-btn-poi {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--iw-ink-tertiary);
  background: transparent;
  border: 0.5px solid var(--iw-border-subtle);
  border-radius: var(--iw-radius-sm);
  padding: 8px 14px;
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  transition: background 200ms ease, color 150ms ease, border-color 150ms ease;
  box-sizing: border-box;
}

.iw-btn-poi:hover {
  background: var(--iw-bg-secondary);
  color: var(--iw-ink-secondary);
  border-color: var(--iw-border-strong);
}

/* ----- Continue / neutral button ----- */
.iw-btn-continue {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 11px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: var(--iw-ink-tertiary);
  background: transparent;
  border: 0.5px solid var(--iw-border-subtle);
  border-radius: var(--iw-radius-sm);
  padding: 10px 24px;
  min-height: 44px;
  min-width: 44px;
  cursor: pointer;
  transition: border-color 150ms ease, color 150ms ease;
  box-sizing: border-box;
}

.iw-btn-continue:hover {
  border-color: var(--iw-border-strong);
  color: var(--iw-ink-secondary);
}

/* ----- Footer / UI button (panel toggles) ----- */
.iw-btn-footer {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 10px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: var(--iw-ink-ghost);
  background: transparent;
  border: 0.5px solid var(--iw-border-ghost);
  border-radius: var(--iw-radius-sm);
  padding: 8px 14px;
  min-height: 44px;
  min-width: 44px;
  cursor: pointer;
  transition: border-color 150ms ease, color 150ms ease;
  box-sizing: border-box;
}

.iw-btn-footer:hover {
  border-color: var(--iw-border-subtle);
  color: var(--iw-ink-tertiary);
}
```

### Hover States

No background colour changes on primary action buttons. The hover state is communicated
only through colour shift (text becomes vermillion) and the thickening of the underline.
This keeps the effect subtle and calligraphic.

### Focus States

Focus rings use the vermillion accent at reduced opacity so they remain distinctive
without being visually harsh. Offset is 2px to avoid clipping within card boundaries.

```css
/* Applied globally within the widget */
button:focus-visible,
[data-prompt]:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid rgba(208, 58, 45, 0.55);
  outline-offset: 2px;
}

@media (prefers-color-scheme: dark) {
  button:focus-visible,
  [data-prompt]:focus-visible,
  [tabindex]:focus-visible {
    outline-color: rgba(192, 64, 48, 0.70);
  }
}
```

---

## Micro-interactions

All animations are wrapped in a `prefers-reduced-motion` guard. When motion is reduced,
elements appear immediately without transitions or keyframe animations. The `0.01ms`
technique ensures transitions are effectively disabled without removing the property
entirely (which can cause issues with JS-driven class toggling).

```css
/* ----- Fade-in: narrative text and panels appearing ----- */
@keyframes iw-ink-appear {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Applied to narrative blocks, panels, and outcome badges on mount */
.iw-appear {
  animation: iw-ink-appear 320ms ease-out both;
}

/* Stagger for button rows — each button reveals with a slight delay */
.iw-btn-row .iw-btn-action:nth-child(1) { animation-delay: 0ms; }
.iw-btn-row .iw-btn-action:nth-child(2) { animation-delay: 60ms; }
.iw-btn-row .iw-btn-action:nth-child(3) { animation-delay: 120ms; }
.iw-btn-row .iw-btn-action:nth-child(4) { animation-delay: 180ms; }
.iw-btn-row .iw-btn-action:nth-child(5) { animation-delay: 240ms; }

/* ----- Ink-bleed: die result appearing ----- */
@keyframes iw-ink-bleed {
  0%   { opacity: 0; transform: scale(0.88); filter: blur(2px); }
  60%  { opacity: 1; transform: scale(1.03); filter: blur(0); }
  100% { opacity: 1; transform: scale(1); filter: blur(0); }
}

.iw-die-reveal {
  animation: iw-ink-bleed 450ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
}

/* ----- Brush stroke: horizontal rule drawing in ----- */
@keyframes iw-brush-draw {
  from { transform: scaleX(0); transform-origin: left center; opacity: 0.6; }
  to   { transform: scaleX(1); transform-origin: left center; opacity: 1; }
}

.iw-rule-animated {
  animation: iw-brush-draw 600ms ease-out both;
}

/* ----- Panel slide: overlay panel entering ----- */
@keyframes iw-panel-in {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
}

.iw-panel-in {
  animation: iw-panel-in 250ms ease-out both;
}

/* ----- Seal stamp: accent badge appearing (outcome, verdict) ----- */
@keyframes iw-stamp {
  0%   { opacity: 0; transform: scale(1.25) rotate(-3deg); }
  55%  { opacity: 1; transform: scale(0.96) rotate(0.5deg); }
  80%  { transform: scale(1.02) rotate(0deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}

.iw-stamp-in {
  animation: iw-stamp 380ms cubic-bezier(0.18, 0.89, 0.32, 1.28) both;
}

/* ----- Reduced motion: disable everything above ----- */
@media (prefers-reduced-motion: reduce) {
  .iw-appear,
  .iw-die-reveal,
  .iw-rule-animated,
  .iw-panel-in,
  .iw-stamp-in,
  .iw-btn-row .iw-btn-action {
    animation: none !important;
  }

  /* Also collapse all CSS transitions */
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

---

## Component Overrides

How each engine widget type should render in the ink-wash style.

### Progressive Reveal (Brief + Continue)

The brief text is larger than in the default style — a single centred sentence, given
room to breathe. The continue button sits below with generous whitespace.

```css
.iw-brief-text {
  font-family: 'Noto Serif', Georgia, serif;
  font-size: 15px;
  line-height: 1.8;
  color: var(--iw-ink-secondary);
  text-align: center;
  margin: var(--iw-space-xl) auto var(--iw-space-lg);
  max-width: 480px;
}

.iw-brief-continue {
  display: block;
  margin: 0 auto;
  width: fit-content;
}
/* Uses .iw-btn-continue styles (see above) */
```

### Location Bar

No background. Title in full ink. Scene number in ghost ink, right-aligned, uppercase.
A 0.5px brush-rule separates it from the body below.

```css
.iw-loc-bar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: var(--iw-space-sm);
  margin-bottom: var(--iw-space-md);
  border-bottom: 0.5px solid var(--iw-border-subtle);
}

.iw-loc-name {
  font-family: 'Noto Serif', Georgia, serif;
  font-size: 17px;
  font-weight: 600;
  color: var(--iw-ink-primary);
  margin: 0;
  letter-spacing: 0;
}

.iw-scene-num {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--iw-ink-ghost);
}
```

### Atmosphere Strip

Pills are sparse — no fill, barely-there border. Displayed as a relaxed row with
extra gap so they never feel crowded.

```css
.iw-atmo-strip {
  display: flex;
  flex-wrap: wrap;
  gap: var(--iw-space-sm);
  margin-bottom: var(--iw-space-md);
}
/* Each pill uses .iw-pill (see Borders & Surfaces) */
```

### Narrative Block

The most important element. Given a serif font, generous line height, and substantial
vertical breathing room. No box, no border, no background — just ink on paper.

```css
.iw-narrative {
  font-family: 'Noto Serif', Georgia, serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.9;
  letter-spacing: 0.01em;
  color: var(--iw-ink-secondary);
  margin-block: var(--iw-space-md) var(--iw-space-lg);
  max-width: 640px;
}

.iw-narrative p + p {
  margin-top: var(--iw-space-sm);
}
```

### Section Label

All-caps, ghost-ink, generous tracking. Acts as a sparse wayfinding glyph rather
than a header.

```css
.iw-section-label {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--iw-ink-ghost);
  margin-block: var(--iw-space-md) var(--iw-space-xs);
  display: block;
}
```

### Outcome Badge

The outcome badge is the one place where the vermillion accent appears as a filled
element — a seal stamp confirming the result. All other badges use `--iw-success`,
`--iw-warning`, `--iw-danger` with their `--iw-*-bg` fills.

```css
.iw-badge {
  display: inline-block;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 5px 18px;
  border-radius: var(--iw-radius-sm);
  border: 0.5px solid transparent;
}

.iw-badge--success      { background: var(--iw-success-bg);  color: var(--iw-success);  border-color: var(--iw-success); }
.iw-badge--partial      { background: var(--iw-warning-bg);  color: var(--iw-warning);  border-color: var(--iw-warning); }
.iw-badge--failure      { background: var(--iw-danger-bg);   color: var(--iw-danger);   border-color: var(--iw-danger); }
.iw-badge--crit-success { background: var(--iw-success-bg);  color: var(--iw-success);  border-color: var(--iw-success); font-weight: 600; }
.iw-badge--crit-failure { background: var(--iw-accent-muted); color: var(--iw-accent);  border-color: var(--iw-accent-border); font-weight: 600; }

/* The seal stamp — used for crit success and story-significant outcomes */
.iw-badge--seal {
  background: var(--iw-accent);
  color: var(--iw-bg-primary);
  border-color: transparent;
  letter-spacing: 0.16em;
}
```

### Status Bar (HP / XP)

The status bar is whisper-thin. HP pips are small ink circles. XP is a horizontal
brush stroke that fills left-to-right.

```css
.iw-status-bar {
  display: flex;
  align-items: center;
  gap: var(--iw-space-md);
  flex-wrap: wrap;
  padding-block: var(--iw-space-sm);
  border-top: 0.5px solid var(--iw-border-ghost);
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--iw-ink-ghost);
  margin-top: var(--iw-space-md);
}

.iw-hp-pips { display: flex; gap: 5px; align-items: center; }

.iw-pip {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--iw-ink-primary);
  border: 0.5px solid var(--iw-ink-secondary);
  flex-shrink: 0;
}

.iw-pip--empty {
  background: transparent;
  border-color: var(--iw-border-subtle);
}

.iw-xp-track {
  width: 56px;
  height: 2px;
  background: var(--iw-border-ghost);
  border-radius: 1px;
  overflow: hidden;
}

.iw-xp-fill {
  height: 100%;
  background: var(--iw-ink-tertiary);
  border-radius: 1px;
  transition: width 600ms ease-out;
}
```

### NPC Dialogue Block

Displayed as a blockquote with a left ink-rule instead of a box border. The speaker
name is set in small-caps above. Tone badge is a ghost pill beside the name.

```css
.iw-dialogue {
  border-left: 1.5px solid var(--iw-border-strong);
  padding-left: var(--iw-space-md);
  margin-block: var(--iw-space-md);
}

.iw-dialogue-speaker {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 10px;
  font-variant: small-caps;
  letter-spacing: 0.12em;
  color: var(--iw-ink-tertiary);
  margin-bottom: var(--iw-space-xs);
  display: flex;
  align-items: center;
  gap: var(--iw-space-xs);
}

.iw-dialogue-text {
  font-family: 'Noto Serif', Georgia, serif;
  font-size: 14px;
  font-style: italic;
  line-height: 1.85;
  color: var(--iw-ink-secondary);
  margin: 0;
}
```

### Panel Overlay

Panels slide in from the left edge. A thin vertical rule on the right marks the
panel boundary without boxing it. The close button is a ghost `iw-btn-footer`.

```css
.iw-panel-overlay {
  background: var(--iw-bg-primary);
  background-image: var(--iw-edge-wash);
  border-right: 0.5px solid var(--iw-border-subtle);
  padding: var(--iw-space-md);
}

.iw-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: var(--iw-space-sm);
  margin-bottom: var(--iw-space-md);
  border-bottom: 0.5px solid var(--iw-border-subtle);
}

.iw-panel-title {
  font-family: 'Noto Serif', Georgia, serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--iw-ink-primary);
}
/* Panel close button uses .iw-btn-footer */
```

### Footer Row

The footer is separated from content by negative space alone (or the thinnest ghost
rule if a visual anchor is needed). Buttons are spaced evenly with flex gap.

```css
.iw-footer-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--iw-space-xs);
  justify-content: flex-start;
  align-items: center;
  margin-top: var(--iw-space-lg);
  padding-top: var(--iw-space-sm);
  border-top: 0.5px solid var(--iw-border-ghost);
}
/* Buttons use .iw-btn-footer */
```

### Conviction Meter (Social Encounters)

Conviction pips are larger ink circles, resting on a ghost baseline.

```css
.iw-conviction-pips { display: flex; gap: 7px; align-items: center; }

.iw-conviction-pip {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: transparent;
  border: 0.5px solid var(--iw-border-strong);
  flex-shrink: 0;
  transition: background 300ms ease, border-color 200ms ease;
}

.iw-conviction-pip--filled {
  background: var(--iw-ink-primary);
  border-color: var(--iw-ink-primary);
}
```

### Die Roll Widget

The die value appears large in a centred block. The spin animation uses `iw-ink-bleed`.
The resolve table is a minimal two-column arrangement without table borders.

```css
.iw-die-display {
  text-align: center;
  margin-block: var(--iw-space-lg);
}

.iw-die-value {
  font-family: 'Noto Serif', Georgia, serif;
  font-size: 48px;
  font-weight: 600;
  color: var(--iw-ink-primary);
  line-height: 1;
  display: inline-block;
}

.iw-resolve-table {
  width: 100%;
  border-collapse: collapse;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 11px;
  color: var(--iw-ink-secondary);
  margin-block: var(--iw-space-sm);
}

.iw-resolve-table td {
  padding: 5px 0;
  border: none;
  border-top: 0.5px solid var(--iw-border-ghost);
}

.iw-resolve-table td:first-child {
  color: var(--iw-ink-ghost);
  width: 50%;
}

.iw-resolve-table td:last-child {
  text-align: right;
  font-weight: 500;
  color: var(--iw-ink-primary);
}
```

---

## Complete CSS Block

The following block can be injected into any widget's `<style>` element as a single,
self-contained override. It defines all custom properties and all component classes.
Replace the engine's default base classes with the `iw-*` prefixed equivalents.

The `@import` for Noto Serif is included as a best-effort attempt; the fallback stack
handles the case where it is CSP-blocked.

```css
/* @extract */
/* ==========================================================================
   INK WASH — text adventure visual theme
   East Asian sumi-e inspired. Near-monochrome. Vermillion seal accent.
   Inject into any widget <style> block.
   ========================================================================== */

@import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,600;1,400&display=swap');

/* --------------------------------------------------------------------------
   1. Custom Properties — Light Mode
   -------------------------------------------------------------------------- */
:host {
  --iw-bg-primary:      #F5F2EB;
  --iw-bg-secondary:    #EDE9E0;
  --iw-bg-tertiary:     #E4DFD4;
  --iw-bg-wash:         #F9F7F2;

  --iw-ink-primary:     #1A1A1A;
  --iw-ink-secondary:   #4A4A4A;
  --iw-ink-tertiary:    #8A8A8A;
  --iw-ink-ghost:       #B0AA9E;

  --iw-border-strong:   #C5C0B6;
  --iw-border-subtle:   #D9D4C8;
  --iw-border-ghost:    #E4DFD4;

  --iw-accent:          #D03A2D;
  --iw-accent-muted:    rgba(208, 58, 45, 0.10);
  --iw-accent-border:   rgba(208, 58, 45, 0.40);

  --iw-success:         #3D7A5E;
  --iw-success-bg:      rgba(61, 122, 94, 0.08);
  --iw-warning:         #8A6B2A;
  --iw-warning-bg:      rgba(138, 107, 42, 0.08);
  --iw-danger:          #8A2A2A;
  --iw-danger-bg:       rgba(138, 42, 42, 0.08);
  --iw-info:            #2A4A6A;
  --iw-info-bg:         rgba(42, 74, 106, 0.08);

  --iw-edge-wash: radial-gradient(ellipse at 50% 100%, rgba(26,26,26,0.04) 0%, transparent 70%);

  --iw-space-xs:  6px;
  --iw-space-sm:  12px;
  --iw-space-md:  20px;
  --iw-space-lg:  32px;
  --iw-space-xl:  52px;

  --iw-radius-sm: 2px;
  --iw-radius-md: 3px;
  --iw-radius-lg: 4px;
}

/* --------------------------------------------------------------------------
   2. Custom Properties — Dark Mode
   -------------------------------------------------------------------------- */
@media (prefers-color-scheme: dark) {
  :host {
    --iw-bg-primary:      #1A1816;
    --iw-bg-secondary:    #232120;
    --iw-bg-tertiary:     #2C2A28;
    --iw-bg-wash:         #201E1C;

    --iw-ink-primary:     #C5C0B6;
    --iw-ink-secondary:   #9A9590;
    --iw-ink-tertiary:    #6A6560;
    --iw-ink-ghost:       #4A4642;

    --iw-border-strong:   #4A4542;
    --iw-border-subtle:   #3A3835;
    --iw-border-ghost:    #2C2A28;

    --iw-accent:          #C04030;
    --iw-accent-muted:    rgba(192, 64, 48, 0.14);
    --iw-accent-border:   rgba(192, 64, 48, 0.45);

    --iw-success:         #4A9E74;
    --iw-success-bg:      rgba(74, 158, 116, 0.10);
    --iw-warning:         #A8883A;
    --iw-warning-bg:      rgba(168, 136, 58, 0.10);
    --iw-danger:          #A84040;
    --iw-danger-bg:       rgba(168, 64, 64, 0.10);
    --iw-info:            #4A6E9A;
    --iw-info-bg:         rgba(74, 110, 154, 0.10);

    --iw-edge-wash: radial-gradient(ellipse at 50% 100%, rgba(197,192,182,0.04) 0%, transparent 70%);
  }
}

/* --------------------------------------------------------------------------
   3. Root & Base
   -------------------------------------------------------------------------- */
.iw-root {
  background: var(--iw-bg-primary);
  background-image: var(--iw-edge-wash);
  padding: var(--iw-space-lg) var(--iw-space-md) var(--iw-space-xl);
  font-family: 'Noto Serif', Georgia, 'Times New Roman', serif;
  color: var(--iw-ink-secondary);
  min-height: 100%;
  box-sizing: border-box;
}

/* --------------------------------------------------------------------------
   4. Typography
   -------------------------------------------------------------------------- */
.iw-heading {
  font-family: 'Noto Serif', Georgia, serif;
  font-size: 17px;
  font-weight: 600;
  color: var(--iw-ink-primary);
  margin: 0;
  line-height: 1.3;
}

.iw-subheading {
  font-family: 'Noto Serif', Georgia, serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--iw-ink-primary);
  margin: 0;
  line-height: 1.3;
}

.iw-narrative {
  font-family: 'Noto Serif', Georgia, serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.9;
  letter-spacing: 0.01em;
  color: var(--iw-ink-secondary);
  margin-block: var(--iw-space-md) var(--iw-space-lg);
  max-width: 640px;
}

.iw-narrative p + p { margin-top: var(--iw-space-sm); }

.iw-section-label {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--iw-ink-ghost);
  margin-block: var(--iw-space-md) var(--iw-space-xs);
  display: block;
}

.iw-meta {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--iw-ink-ghost);
}

/* --------------------------------------------------------------------------
   5. Layout & Spacing
   -------------------------------------------------------------------------- */
.iw-rule {
  border: none;
  border-top: 0.5px solid var(--iw-border-subtle);
  margin-block: var(--iw-space-md);
}

.iw-section + .iw-section { margin-top: var(--iw-space-lg); }

.iw-btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--iw-space-sm);
  margin-block: var(--iw-space-sm) var(--iw-space-md);
}

/* --------------------------------------------------------------------------
   6. Surfaces
   -------------------------------------------------------------------------- */
.iw-well {
  background: var(--iw-bg-secondary);
  background-image: var(--iw-edge-wash);
  border: 0.5px solid var(--iw-border-ghost);
  border-radius: var(--iw-radius-md);
  padding: var(--iw-space-md);
}

.iw-card {
  border: 0.5px solid var(--iw-border-subtle);
  border-radius: var(--iw-radius-md);
  padding: var(--iw-space-sm) var(--iw-space-md);
  background: transparent;
}

.iw-pill {
  display: inline-block;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--iw-ink-tertiary);
  padding: 3px 10px;
  border-radius: 999px;
  border: 0.5px solid var(--iw-border-subtle);
  background: transparent;
}

/* --------------------------------------------------------------------------
   7. Buttons
   -------------------------------------------------------------------------- */
.iw-btn-action {
  font-family: 'Noto Serif', Georgia, serif;
  font-size: 13px;
  letter-spacing: 0.02em;
  color: var(--iw-ink-primary);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--iw-accent-border);
  border-radius: 0;
  padding: 6px 2px;
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  text-align: left;
  transition: border-color 200ms ease, color 200ms ease;
  box-sizing: border-box;
}

.iw-btn-action:hover { color: var(--iw-accent); border-bottom-color: var(--iw-accent); }
.iw-btn-action:active { opacity: 0.75; }

.iw-btn-poi {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--iw-ink-tertiary);
  background: transparent;
  border: 0.5px solid var(--iw-border-subtle);
  border-radius: var(--iw-radius-sm);
  padding: 8px 14px;
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  transition: background 200ms ease, color 150ms ease, border-color 150ms ease;
  box-sizing: border-box;
}

.iw-btn-poi:hover {
  background: var(--iw-bg-secondary);
  color: var(--iw-ink-secondary);
  border-color: var(--iw-border-strong);
}

.iw-btn-continue {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 11px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: var(--iw-ink-tertiary);
  background: transparent;
  border: 0.5px solid var(--iw-border-subtle);
  border-radius: var(--iw-radius-sm);
  padding: 10px 24px;
  min-height: 44px;
  min-width: 44px;
  cursor: pointer;
  transition: border-color 150ms ease, color 150ms ease;
  box-sizing: border-box;
}

.iw-btn-continue:hover { border-color: var(--iw-border-strong); color: var(--iw-ink-secondary); }

.iw-btn-footer {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 10px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: var(--iw-ink-ghost);
  background: transparent;
  border: 0.5px solid var(--iw-border-ghost);
  border-radius: var(--iw-radius-sm);
  padding: 8px 14px;
  min-height: 44px;
  min-width: 44px;
  cursor: pointer;
  transition: border-color 150ms ease, color 150ms ease;
  box-sizing: border-box;
}

.iw-btn-footer:hover { border-color: var(--iw-border-subtle); color: var(--iw-ink-tertiary); }

/* --------------------------------------------------------------------------
   8. Focus
   -------------------------------------------------------------------------- */
button:focus-visible,
[data-prompt]:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid rgba(208, 58, 45, 0.55);
  outline-offset: 2px;
}

@media (prefers-color-scheme: dark) {
  button:focus-visible,
  [data-prompt]:focus-visible,
  [tabindex]:focus-visible {
    outline-color: rgba(192, 64, 48, 0.70);
  }
}

/* --------------------------------------------------------------------------
   9. Location bar, atmosphere, status, panels, dialogue
   -------------------------------------------------------------------------- */
.iw-loc-bar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: var(--iw-space-sm);
  margin-bottom: var(--iw-space-md);
  border-bottom: 0.5px solid var(--iw-border-subtle);
}

.iw-loc-name {
  font-family: 'Noto Serif', Georgia, serif;
  font-size: 17px;
  font-weight: 600;
  color: var(--iw-ink-primary);
  margin: 0;
}

.iw-scene-num {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--iw-ink-ghost);
}

.iw-atmo-strip { display: flex; flex-wrap: wrap; gap: var(--iw-space-sm); margin-bottom: var(--iw-space-md); }

.iw-status-bar {
  display: flex;
  align-items: center;
  gap: var(--iw-space-md);
  flex-wrap: wrap;
  padding-block: var(--iw-space-sm);
  border-top: 0.5px solid var(--iw-border-ghost);
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--iw-ink-ghost);
  margin-top: var(--iw-space-md);
}

.iw-hp-pips { display: flex; gap: 5px; align-items: center; }

.iw-pip {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--iw-ink-primary);
  border: 0.5px solid var(--iw-ink-secondary);
  flex-shrink: 0;
}

.iw-pip--empty { background: transparent; border-color: var(--iw-border-subtle); }

.iw-xp-track {
  width: 56px; height: 2px;
  background: var(--iw-border-ghost);
  border-radius: 1px; overflow: hidden;
}

.iw-xp-fill {
  height: 100%;
  background: var(--iw-ink-tertiary);
  border-radius: 1px;
  transition: width 600ms ease-out;
}

.iw-dialogue {
  border-left: 1.5px solid var(--iw-border-strong);
  padding-left: var(--iw-space-md);
  margin-block: var(--iw-space-md);
}

.iw-dialogue-speaker {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 10px;
  font-variant: small-caps;
  letter-spacing: 0.12em;
  color: var(--iw-ink-tertiary);
  margin-bottom: var(--iw-space-xs);
  display: flex;
  align-items: center;
  gap: var(--iw-space-xs);
}

.iw-dialogue-text {
  font-family: 'Noto Serif', Georgia, serif;
  font-size: 14px;
  font-style: italic;
  line-height: 1.85;
  color: var(--iw-ink-secondary);
  margin: 0;
}

.iw-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: var(--iw-space-sm);
  margin-bottom: var(--iw-space-md);
  border-bottom: 0.5px solid var(--iw-border-subtle);
}

.iw-panel-title {
  font-family: 'Noto Serif', Georgia, serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--iw-ink-primary);
}

.iw-footer-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--iw-space-xs);
  justify-content: flex-start;
  align-items: center;
  margin-top: var(--iw-space-lg);
  padding-top: var(--iw-space-sm);
  border-top: 0.5px solid var(--iw-border-ghost);
}

/* --------------------------------------------------------------------------
   10. Badges
   -------------------------------------------------------------------------- */
.iw-badge {
  display: inline-block;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 5px 18px;
  border-radius: var(--iw-radius-sm);
  border: 0.5px solid transparent;
}

.iw-badge--success      { background: var(--iw-success-bg); color: var(--iw-success); border-color: var(--iw-success); }
.iw-badge--partial      { background: var(--iw-warning-bg); color: var(--iw-warning); border-color: var(--iw-warning); }
.iw-badge--failure      { background: var(--iw-danger-bg);  color: var(--iw-danger);  border-color: var(--iw-danger); }
.iw-badge--crit-success { background: var(--iw-success-bg); color: var(--iw-success); border-color: var(--iw-success); font-weight: 600; }
.iw-badge--crit-failure { background: var(--iw-accent-muted); color: var(--iw-accent); border-color: var(--iw-accent-border); font-weight: 600; }
.iw-badge--seal         { background: var(--iw-accent); color: var(--iw-bg-primary); border-color: transparent; letter-spacing: 0.16em; }

/* --------------------------------------------------------------------------
   11. Die roll
   -------------------------------------------------------------------------- */
.iw-die-display { text-align: center; margin-block: var(--iw-space-lg); }

.iw-die-value {
  font-family: 'Noto Serif', Georgia, serif;
  font-size: 48px;
  font-weight: 600;
  color: var(--iw-ink-primary);
  line-height: 1;
  display: inline-block;
}

.iw-resolve-table {
  width: 100%;
  border-collapse: collapse;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 11px;
  color: var(--iw-ink-secondary);
  margin-block: var(--iw-space-sm);
}

.iw-resolve-table td {
  padding: 5px 0;
  border: none;
  border-top: 0.5px solid var(--iw-border-ghost);
}

.iw-resolve-table td:first-child { color: var(--iw-ink-ghost); width: 50%; }
.iw-resolve-table td:last-child  { text-align: right; font-weight: 500; color: var(--iw-ink-primary); }

/* --------------------------------------------------------------------------
   12. Conviction pips
   -------------------------------------------------------------------------- */
.iw-conviction-pips { display: flex; gap: 7px; align-items: center; }

.iw-conviction-pip {
  width: 10px; height: 10px; border-radius: 50%;
  background: transparent;
  border: 0.5px solid var(--iw-border-strong);
  flex-shrink: 0;
  transition: background 300ms ease, border-color 200ms ease;
}

.iw-conviction-pip--filled { background: var(--iw-ink-primary); border-color: var(--iw-ink-primary); }

/* --------------------------------------------------------------------------
   13. Animations
   -------------------------------------------------------------------------- */
@keyframes iw-ink-appear {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes iw-ink-bleed {
  0%   { opacity: 0; transform: scale(0.88); filter: blur(2px); }
  60%  { opacity: 1; transform: scale(1.03); filter: blur(0); }
  100% { opacity: 1; transform: scale(1); filter: blur(0); }
}

@keyframes iw-brush-draw {
  from { transform: scaleX(0); transform-origin: left center; opacity: 0.6; }
  to   { transform: scaleX(1); transform-origin: left center; opacity: 1; }
}

@keyframes iw-panel-in {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes iw-stamp {
  0%   { opacity: 0; transform: scale(1.25) rotate(-3deg); }
  55%  { opacity: 1; transform: scale(0.96) rotate(0.5deg); }
  80%  { transform: scale(1.02) rotate(0deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}

.iw-appear      { animation: iw-ink-appear  320ms ease-out both; }
.iw-die-reveal  { animation: iw-ink-bleed   450ms cubic-bezier(0.22, 0.61, 0.36, 1) both; }
.iw-rule-draw   { animation: iw-brush-draw  600ms ease-out both; }
.iw-panel-in    { animation: iw-panel-in    250ms ease-out both; }
.iw-stamp-in    { animation: iw-stamp       380ms cubic-bezier(0.18, 0.89, 0.32, 1.28) both; }

.iw-btn-row .iw-btn-action:nth-child(1) { animation: iw-ink-appear 320ms ease-out 0ms   both; }
.iw-btn-row .iw-btn-action:nth-child(2) { animation: iw-ink-appear 320ms ease-out 60ms  both; }
.iw-btn-row .iw-btn-action:nth-child(3) { animation: iw-ink-appear 320ms ease-out 120ms both; }
.iw-btn-row .iw-btn-action:nth-child(4) { animation: iw-ink-appear 320ms ease-out 180ms both; }
.iw-btn-row .iw-btn-action:nth-child(5) { animation: iw-ink-appear 320ms ease-out 240ms both; }

/* --------------------------------------------------------------------------
   14. Reduced motion — must come last
   -------------------------------------------------------------------------- */
@media (prefers-reduced-motion: reduce) {
  .iw-appear,
  .iw-die-reveal,
  .iw-rule-draw,
  .iw-panel-in,
  .iw-stamp-in,
  .iw-btn-row .iw-btn-action {
    animation: none !important;
  }

  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```
