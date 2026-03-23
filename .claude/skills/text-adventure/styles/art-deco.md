---
name: Art Deco
description: >
  A 1920s luxury aesthetic drawn from Gatsby invitations, speakeasy menus, and grand hotel
  lobbies. Geometric elegance, gold accents, deep navy grounds, and centred uppercase
  headings with generous letter-spacing. Evokes opulence, intrigue, and restrained excess.
best-for:
  - output-styles: [narrative, literary, pulp]
  - genres: [noir, mystery, historical, 1920s, jazz-age, horror-gothic, heist, spy-thriller]
  - avoid: [sci-fi, cyberpunk, post-apocalyptic, whimsical-fantasy]
---

## Design Philosophy

Art Deco is geometry made glamorous. Every element submits to symmetry, strong vertical
rhythm, and the interplay of deep shadow against warm gold. The aesthetic borrows from the
machine age without losing its human warmth — precise, but never cold.

Key principles driving every CSS decision:

- **Symmetry first.** Headings are always centred. Decorative elements mirror each other.
- **Gold as punctuation.** Gold (#C9A84C) appears on borders, dividers, button edges, and
  focus rings — never as a fill behind text, which would destroy contrast.
- **Two-line borders.** Important containers use a double-border effect (outer 1px + inner
  inset 1px) suggesting a picture frame or hotel menu card.
- **Generous negative space.** Deco design breathes. Padding is more generous than a
  utility-first approach would suggest; cramped layouts destroy the illusion.
- **No rounded corners on primary surfaces.** Hard right angles on panels and cards.
  Subtle radius (2px) only on interactive inline elements.
- **Uppercase + letter-spacing for headings only.** Body text is mixed case for readability.

---

## Typography

### Font Stacks

Google Fonts may be CSP-blocked inside Claude.ai widget iframes. Both stacks below
produce an acceptable Art Deco character when the web fonts cannot load.

```
/* Heading stack — serif, high contrast, classical */
'Playfair Display', 'Cormorant Garamond', 'Cormorant', Georgia, 'Times New Roman', serif

/* Body stack — clean geometric sans */
'Raleway', 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', system-ui, sans-serif

/* Monospace (die roll results, stat values) */
'IBM Plex Mono', 'Courier New', Courier, monospace
```

### Sizing Scale

| Role                  | Size  | Weight | Transform  | Letter-spacing |
|-----------------------|-------|--------|------------|----------------|
| Widget title (h1)     | 22px  | 700    | uppercase  | 0.25em         |
| Section heading (h2)  | 16px  | 600    | uppercase  | 0.2em          |
| Sub-heading (h3)      | 14px  | 600    | uppercase  | 0.15em         |
| Body / narrative      | 15px  | 400    | none       | 0.02em         |
| Caption / label       | 11px  | 400    | uppercase  | 0.12em         |
| Stat value            | 18px  | 700    | none       | 0              |
| Button label          | 11px  | 600    | uppercase  | 0.12em         |

---

## Colour Palette

### Light Mode (default)

| Token                        | Hex       | Role                                     |
|------------------------------|-----------|------------------------------------------|
| `--ad-bg-primary`            | `#F2E9D8` | Cream — main widget background           |
| `--ad-bg-secondary`          | `#E8DCCA` | Slightly darker cream — card surfaces    |
| `--ad-bg-panel`              | `#EDE3D1` | Overlay / panel background               |
| `--ad-bg-input`              | `#FAF5EC` | Input and select fields                  |
| `--ad-text-primary`          | `#1B2838` | Deep navy — all primary body text        |
| `--ad-text-secondary`        | `#3A4A5C` | Mid navy — secondary labels              |
| `--ad-text-muted`            | `#6B7A8D` | Slate — captions, disabled states        |
| `--ad-text-on-gold`          | `#1B1008` | Near-black — text placed on gold fills   |
| `--ad-gold`                  | `#C9A84C` | Primary accent — borders, dividers, icons|
| `--ad-gold-light`            | `#E0C97A` | Highlight gold — hover states            |
| `--ad-gold-dark`             | `#9E7A28` | Shadow gold — pressed / active states    |
| `--ad-jade`                  | `#2A7F62` | Success, positive outcomes, health high  |
| `--ad-copper`                | `#B87333` | Warning, moderate danger, health mid     |
| `--ad-crimson`               | `#8B2635` | Danger, failure, health low              |
| `--ad-navy`                  | `#1B2838` | Structural navy — same as text-primary   |
| `--ad-border-primary`        | `#C9A84C` | Gold border — featured containers        |
| `--ad-border-secondary`      | `#B8A87A` | Warm tan — standard borders              |
| `--ad-border-muted`          | `#CFC5AE` | Subtle border — dividers, input edges    |
| `--ad-shadow`                | `rgba(27,40,56,0.15)` | Box shadow tint             |

### Dark Mode

| Token                        | Hex       | Role                                     |
|------------------------------|-----------|------------------------------------------|
| `--ad-bg-primary`            | `#0D1520` | Midnight blue — main background          |
| `--ad-bg-secondary`          | `#152030` | Slightly lighter — card surfaces         |
| `--ad-bg-panel`              | `#111C2A` | Overlay / panel background               |
| `--ad-bg-input`              | `#0A1018` | Input fields                             |
| `--ad-text-primary`          | `#F2E9D8` | Cream — primary body text                |
| `--ad-text-secondary`        | `#C8BAA4` | Warm grey — secondary labels             |
| `--ad-text-muted`            | `#7A8A9A` | Slate — captions, disabled states        |
| `--ad-text-on-gold`          | `#0D0A04` | Near-black — text on gold fills          |
| `--ad-gold`                  | `#D4AF55` | Gold accent — slightly brighter for dark |
| `--ad-gold-light`            | `#EDD080` | Highlight gold                           |
| `--ad-gold-dark`             | `#A07C25` | Shadow gold                              |
| `--ad-jade`                  | `#3AA882` | Success — brighter on dark bg            |
| `--ad-copper`                | `#D4894A` | Warning — warmer on dark bg              |
| `--ad-crimson`               | `#C0384A` | Danger — more saturated on dark bg       |
| `--ad-border-primary`        | `#D4AF55` | Gold border                              |
| `--ad-border-secondary`      | `#4A5A6A` | Mid-slate border                         |
| `--ad-border-muted`          | `#2A3A4A` | Subtle border                            |
| `--ad-shadow`                | `rgba(0,0,0,0.4)` | Deeper shadow on dark bg          |

### WCAG AA Compliance Notes

- `--ad-text-primary` on `--ad-bg-primary`: 9.8:1 (light) / 11.2:1 (dark) — AAA
- `--ad-gold` on `--ad-bg-primary` (light): 3.1:1 — decorative only, not used for body text
- `--ad-text-on-gold` on `--ad-gold`: 8.4:1 — AA large + AA normal
- `--ad-text-primary` on `--ad-bg-secondary`: 9.2:1 — AAA
- `--ad-jade` on `--ad-bg-primary` (light): 4.6:1 — AA (used for labels, not small text)
- `--ad-crimson` on `--ad-bg-primary` (light): 4.8:1 — AA
- **Gold must never be used as text colour on cream backgrounds** — 3.1:1 fails AA for body text.
  Gold is structural (borders, decorative lines) only. Text always uses navy or cream.

---

## Spacing & Layout

```
--ad-space-xs:   4px    /* tight internal padding, icon gaps */
--ad-space-sm:   8px    /* compact element spacing */
--ad-space-md:  16px    /* standard component padding */
--ad-space-lg:  24px    /* section separation */
--ad-space-xl:  40px    /* major section breaks */
--ad-space-xxl: 64px    /* hero / header vertical space */

--ad-radius-sm:   2px   /* buttons, tags — almost square */
--ad-radius-md:   0px   /* panels, cards — strict right angles */

--ad-max-width: 680px   /* narrative column max — readability */
--ad-panel-width: 360px /* side panel / overlay max */
```

The widget root uses `padding: var(--ad-space-md) 0 var(--ad-space-lg)`. Section headings
carry `margin-top: var(--ad-space-lg)` to enforce breathing room between widget regions.

---

## Borders & Surfaces

### Double-Border Containers

The signature Art Deco container uses an outer border and an inner inset shadow to simulate
a second frame — like a luxury hotel menu card or a framed print.

```css
.ad-card {
  border: 1px solid var(--ad-border-primary);
  box-shadow:
    inset 0 0 0 3px var(--ad-bg-primary),
    inset 0 0 0 4px var(--ad-border-primary),
    0 4px 16px var(--ad-shadow);
  padding: var(--ad-space-lg);
  background: var(--ad-bg-secondary);
}
```

### Gold Dividers

Used between sections, after headings, and as decorative separators:

```css
.ad-divider {
  border: none;
  border-top: 1px solid var(--ad-border-primary);
  margin: var(--ad-space-md) auto;
  width: 60%;   /* centred — symmetry principle */
}

/* Heading underline variant */
.ad-heading-rule {
  display: block;
  width: 48px;
  height: 1px;
  background: var(--ad-gold);
  margin: var(--ad-space-sm) auto 0;
}
```

### Corner Bracket Decoration (CSS-only)

Applied to featured panels via pseudo-elements — no extra HTML required:

```css
.ad-bracketed {
  position: relative;
}
.ad-bracketed::before,
.ad-bracketed::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: var(--ad-gold);
  border-style: solid;
}
.ad-bracketed::before {
  top: 6px; left: 6px;
  border-width: 1px 0 0 1px;
}
.ad-bracketed::after {
  bottom: 6px; right: 6px;
  border-width: 0 1px 1px 0;
}
```

---

## Interactive Elements

### Buttons

Three button variants covering all widget use-cases.

**Primary (action / sendPrompt):** Engraved gold border, cream fill on hover.
```css
.ad-btn-primary {
  font-family: 'Raleway', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ad-text-primary);
  background: transparent;
  border: 1px solid var(--ad-gold);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 2px var(--ad-shadow);
  padding: 10px 24px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  cursor: pointer;
  border-radius: var(--ad-radius-sm);
  transition: background 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
}
.ad-btn-primary:hover {
  background: var(--ad-gold);
  color: var(--ad-text-on-gold);
  box-shadow: inset 0 1px 0 var(--ad-gold-light), 0 2px 8px var(--ad-shadow);
}
.ad-btn-primary:active {
  background: var(--ad-gold-dark);
  color: var(--ad-text-on-gold);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
}
```

**Secondary (panel toggles, continue):** Muted border, subtle hover.
```css
.ad-btn-secondary {
  font-family: 'Raleway', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ad-text-secondary);
  background: transparent;
  border: 1px solid var(--ad-border-secondary);
  padding: 8px 18px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  cursor: pointer;
  border-radius: var(--ad-radius-sm);
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}
.ad-btn-secondary:hover {
  border-color: var(--ad-gold);
  color: var(--ad-text-primary);
}
```

**Ghost / close:** Borderless, text only, minimal footprint.
```css
.ad-btn-ghost {
  font-family: 'Raleway', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ad-text-muted);
  background: transparent;
  border: none;
  padding: 8px 12px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  cursor: pointer;
  transition: color 0.2s ease;
}
.ad-btn-ghost:hover { color: var(--ad-text-primary); }
```

### Focus States

All interactive elements use a gold outline — consistent with the palette and clearly
visible on both cream and midnight surfaces.

```css
button:focus-visible,
[data-prompt]:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid var(--ad-gold);
  outline-offset: 3px;
}
```

---

## Micro-interactions

All animations and transitions are wrapped in `prefers-reduced-motion` checks. When
reduced motion is preferred, transitions drop to instant or near-instant (0.01s) so
state changes are still communicated without motion.

```css
/* Base transition durations — referenced by components */
:root {
  --ad-dur-fast:   0.15s;
  --ad-dur-normal: 0.25s;
  --ad-dur-slow:   0.45s;
  --ad-ease:       cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --ad-dur-fast:   0.01s;
    --ad-dur-normal: 0.01s;
    --ad-dur-slow:   0.01s;
  }
}

/* Panel overlay — slides up from below */
#panel-overlay {
  transform: translateY(12px);
  opacity: 0;
  transition:
    transform var(--ad-dur-normal) var(--ad-ease),
    opacity   var(--ad-dur-normal) var(--ad-ease);
}
#panel-overlay.visible {
  transform: translateY(0);
  opacity: 1;
}

/* Progressive reveal — cross-fade between brief and full */
#reveal-brief {
  transition: opacity var(--ad-dur-slow) var(--ad-ease);
}
#reveal-full {
  opacity: 0;
  transition: opacity var(--ad-dur-slow) var(--ad-ease);
}
#reveal-full.shown {
  opacity: 1;
}

/* Gold shimmer on section headings — on hover only, respects motion preference */
.ad-section-heading {
  transition: letter-spacing var(--ad-dur-normal) var(--ad-ease);
}
.ad-section-heading:hover {
  letter-spacing: 0.26em; /* subtle expansion — Deco refinement */
}

/* Stat value pulse — used when a stat changes value */
@keyframes ad-stat-pulse {
  0%   { color: var(--ad-gold); }
  100% { color: var(--ad-text-primary); }
}
.ad-stat-updated {
  animation: ad-stat-pulse 1.2s var(--ad-ease) forwards;
}
@media (prefers-reduced-motion: reduce) {
  .ad-stat-updated { animation: none; }
}

/* Button press ripple-substitute — border flash */
@keyframes ad-btn-flash {
  0%   { box-shadow: 0 0 0 0 var(--ad-gold); }
  60%  { box-shadow: 0 0 0 6px rgba(201,168,76,0); }
  100% { box-shadow: 0 0 0 0 rgba(201,168,76,0); }
}
.ad-btn-primary:active {
  animation: ad-btn-flash 0.4s ease-out;
}
@media (prefers-reduced-motion: reduce) {
  .ad-btn-primary:active { animation: none; }
}
```

---

## Component Overrides

How each standard widget component maps to Art Deco visual treatment.

### Location Bar (`.loc-bar`)

Centred, uppercase, gold bottom border. No left-alignment — symmetry principle.

```
background:    transparent
border-bottom: 1px solid var(--ad-border-primary)
text-align:    center
font-family:   heading stack
font-size:     11px, uppercase, letter-spacing 0.2em
color:         var(--ad-text-secondary)
padding:       var(--ad-space-sm) 0
```

### Atmosphere Strip (`.atmo-strip`)

Italic, centred, muted — a stage direction, not a headline.

```
font-family:   body stack
font-style:    italic
font-size:     13px
color:         var(--ad-text-muted)
text-align:    center
border:        none
padding:       var(--ad-space-sm) var(--ad-space-md)
```

### Narrative Text (`#narrative`, `.narrative`)

The centrepiece. Comfortable reading width, generous line-height.

```
font-family:    body stack
font-size:      15px
line-height:    1.85
color:          var(--ad-text-primary)
letter-spacing: 0.02em
max-width:      var(--ad-max-width)
margin:         0 auto var(--ad-space-lg)
```

### POI Buttons (`.poi-btn`)

Treated as secondary buttons with a left gold accent bar instead of full border.

```
border:        none
border-left:   3px solid var(--ad-gold)
border-radius: 0
background:    var(--ad-bg-secondary)
padding:       var(--ad-space-sm) var(--ad-space-md)
font-size:     12px, uppercase, letter-spacing 0.1em
color:         var(--ad-text-secondary)
min-height:    44px
```

### Action Buttons (`.action-btn`)

Primary button treatment — these are the player's main decision points.
Full gold border, hover fills with gold.

Apply `.ad-btn-primary` styles directly.

### Status Bar (`.status-bar`)

Slim gold-bordered band. Stat labels in caption style, values in mono.

```
border-top:     1px solid var(--ad-border-primary)
border-bottom:  1px solid var(--ad-border-primary)
padding:        var(--ad-space-sm) var(--ad-space-md)
background:     var(--ad-bg-secondary)
display:        flex, gap var(--ad-space-md), flex-wrap wrap
font-size:      11px
```

Stat labels: `color: var(--ad-text-muted)`, uppercase, letter-spacing 0.1em.
Stat values: `font-family: monospace stack`, `color: var(--ad-text-primary)`, font-weight 700.

### Footer Row (`.footer-row`)

Space-between flex row. Panel buttons use secondary treatment; Save button uses primary.
Gold top border as a deliberate visual full-stop beneath the scene.

```
border-top:  1px solid var(--ad-border-primary)
padding:     var(--ad-space-sm) 0 0
display:     flex
gap:         var(--ad-space-sm)
flex-wrap:   wrap
align-items: center
```

### Panel Overlay (`#panel-overlay`)

Double-border card with corner brackets. Panel title centred and uppercase.

```
background:    var(--ad-bg-panel)
border:        1px solid var(--ad-border-primary)
box-shadow:
  inset 0 0 0 3px var(--ad-bg-panel),
  inset 0 0 0 4px var(--ad-border-primary),
  0 8px 32px var(--ad-shadow)
padding:       var(--ad-space-lg)
```

Panel title: heading stack, 16px, uppercase, letter-spacing 0.2em, centred.
Panel close button: `.ad-btn-ghost` treatment.

### Die Roll Widget

The roll result number is the focal point — large, centred, monospace.

```
Roll result:  font-size 48px, font-weight 700, mono stack, color var(--ad-gold)
              (gold here is decorative, not body text — contrast requirement met by size)
Roll label:   11px, uppercase, letter-spacing 0.15em, color var(--ad-text-muted)
Total line:   18px, font-weight 600, color var(--ad-text-primary)
Container:    .ad-card treatment with double-border, centred text
```

### Character Sheet Panel

Stat grid: 2-column on mobile, 3-column on wider panels.
Each stat cell: `background var(--ad-bg-secondary)`, `border 1px solid var(--ad-border-muted)`,
no border-radius. Stat name in caption style, value in large mono.

### Outcome / Result Widget

Success: left accent bar `3px solid var(--ad-jade)`.
Failure: left accent bar `3px solid var(--ad-crimson)`.
Partial: left accent bar `3px solid var(--ad-copper)`.

The accent bar replaces the double-border on outcome cards to immediately signal result valence.

---

## Complete CSS Block

Inject this entire block into any widget to apply the Art Deco theme. It imports
Google Fonts with graceful fallback, declares all custom properties, and overrides
every standard component class used by the text adventure engine.

```css
/* @extract */
/* ============================================================
   ART DECO THEME — Text Adventure Visual Style
   Inject into widget <style> block.
   Google Fonts import will silently fail in CSP-restricted iframes;
   fallback stacks (Georgia, system-ui) remain fully usable.
   ============================================================ */

@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Raleway:wght@400;500;600&family=IBM+Plex+Mono:wght@400;700&display=swap');

/* ── Custom Properties ───────────────────────────────────── */

:root {
  /* Colour — light mode */
  --ad-bg-primary:       #F2E9D8;
  --ad-bg-secondary:     #E8DCCA;
  --ad-bg-panel:         #EDE3D1;
  --ad-bg-input:         #FAF5EC;
  --ad-text-primary:     #1B2838;
  --ad-text-secondary:   #3A4A5C;
  --ad-text-muted:       #6B7A8D;
  --ad-text-on-gold:     #1B1008;
  --ad-gold:             #C9A84C;
  --ad-gold-light:       #E0C97A;
  --ad-gold-dark:        #9E7A28;
  --ad-jade:             #2A7F62;
  --ad-copper:           #B87333;
  --ad-crimson:          #8B2635;
  --ad-border-primary:   #C9A84C;
  --ad-border-secondary: #B8A87A;
  --ad-border-muted:     #CFC5AE;
  --ad-shadow:           rgba(27,40,56,0.15);

  /* Typography */
  --ad-font-heading: 'Playfair Display', 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  --ad-font-body:    'Raleway', 'Gill Sans', 'Gill Sans MT', Calibri, system-ui, sans-serif;
  --ad-font-mono:    'IBM Plex Mono', 'Courier New', Courier, monospace;

  /* Spacing */
  --ad-space-xs:  4px;
  --ad-space-sm:  8px;
  --ad-space-md:  16px;
  --ad-space-lg:  24px;
  --ad-space-xl:  40px;

  /* Radii */
  --ad-radius-sm: 2px;
  --ad-radius-md: 0px;

  /* Motion */
  --ad-dur-fast:   0.15s;
  --ad-dur-normal: 0.25s;
  --ad-dur-slow:   0.45s;
  --ad-ease:       cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dark mode token overrides */
@media (prefers-color-scheme: dark) {
  :root {
    --ad-bg-primary:       #0D1520;
    --ad-bg-secondary:     #152030;
    --ad-bg-panel:         #111C2A;
    --ad-bg-input:         #0A1018;
    --ad-text-primary:     #F2E9D8;
    --ad-text-secondary:   #C8BAA4;
    --ad-text-muted:       #7A8A9A;
    --ad-text-on-gold:     #0D0A04;
    --ad-gold:             #D4AF55;
    --ad-gold-light:       #EDD080;
    --ad-gold-dark:        #A07C25;
    --ad-jade:             #3AA882;
    --ad-copper:           #D4894A;
    --ad-crimson:          #C0384A;
    --ad-border-primary:   #D4AF55;
    --ad-border-secondary: #4A5A6A;
    --ad-border-muted:     #2A3A4A;
    --ad-shadow:           rgba(0,0,0,0.4);

    /* ── CSS Custom Property Contract (required by style-reference.md) ─ */
    --ta-font-heading:              var(--ad-font-heading);
    --ta-font-body:                 var(--ad-font-mono);
    --ta-color-accent:              var(--ad-gold);
    --ta-color-accent-hover:        var(--ad-gold-light);
    --ta-color-accent-bg:           rgba(196, 164, 80, 0.12);
    --ta-color-accent-bg-hover:     rgba(196, 164, 80, 0.20);
    --ta-color-success:             var(--ad-jade);
    --ta-color-success-border:      color-mix(in srgb, var(--ad-jade) 70%, black);
    --ta-color-danger:              var(--ad-crimson);
    --ta-color-danger-border:       color-mix(in srgb, var(--ad-crimson) 70%, black);
    --ta-color-danger-bg:           rgba(180, 40, 50, 0.12);
    --ta-color-danger-bg-hover:     rgba(180, 40, 50, 0.20);
    --ta-color-warning:             var(--ad-copper);
    --ta-color-warning-border:      color-mix(in srgb, var(--ad-copper) 70%, black);
    --ta-color-warning-bg:          rgba(180, 120, 60, 0.12);
    --ta-color-xp:                  var(--ad-gold);
    --ta-color-focus:               var(--ad-gold);
    --ta-color-conviction:          #7C6BF0;
    --ta-color-conviction-border:   #6B5CE0;
    --ta-badge-success-bg:          rgba(80, 160, 100, 0.15);
    --ta-badge-success-text:        var(--ad-jade);
    --ta-badge-partial-bg:          rgba(180, 120, 60, 0.15);
    --ta-badge-partial-text:        var(--ad-copper);
    --ta-badge-failure-bg:          rgba(180, 40, 50, 0.15);
    --ta-badge-failure-text:        var(--ad-crimson);
    --ta-badge-crit-success-border: var(--ad-jade);
    --ta-badge-crit-failure-border: var(--ad-crimson);
    --ta-color-credits:             var(--ad-gold);
    --ta-color-tab-active:          var(--ad-gold);
    --ta-border-style-poi:          1px dashed;
    --ta-die-spin-duration:         0.5s;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  :root {
    --ad-dur-fast:   0.01s;
    --ad-dur-normal: 0.01s;
    --ad-dur-slow:   0.01s;
  }
}

/* ── Root Widget ─────────────────────────────────────────── */

.root {
  font-family: var(--ad-font-body);
  font-size: 15px;
  color: var(--ad-text-primary);
  background: var(--ad-bg-primary);
  padding: var(--ad-space-md) 0 var(--ad-space-lg);
  min-height: 100%;
}

/* ── Headings ────────────────────────────────────────────── */

h1, h2, h3,
.ad-title,
.panel-title {
  font-family: var(--ad-font-heading);
  text-align: center;
  text-transform: uppercase;
  color: var(--ad-text-primary);
}

h1, .ad-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.25em;
  margin: 0 0 var(--ad-space-sm);
}

h2 {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.2em;
  margin: var(--ad-space-lg) 0 var(--ad-space-sm);
}

h3 {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.15em;
  margin: var(--ad-space-md) 0 var(--ad-space-sm);
}

/* Gold rule beneath headings */
h1::after, h2::after {
  content: '';
  display: block;
  width: 48px;
  height: 1px;
  background: var(--ad-gold);
  margin: var(--ad-space-sm) auto 0;
}

/* ── Focus States ────────────────────────────────────────── */

button:focus-visible,
[data-prompt]:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid var(--ad-gold);
  outline-offset: 3px;
}

/* ── Progressive Reveal ──────────────────────────────────── */

.brief-text {
  font-family: var(--ad-font-body);
  font-size: 15px;
  line-height: 1.8;
  color: var(--ad-text-primary);
  text-align: center;
  max-width: 560px;
  margin: 0 auto var(--ad-space-md);
}

.continue-btn {
  display: block;
  margin: 0 auto;
  font-family: var(--ad-font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ad-text-primary);
  background: transparent;
  border: 1px solid var(--ad-gold);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 3px var(--ad-shadow);
  padding: 10px 28px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  cursor: pointer;
  border-radius: var(--ad-radius-sm);
  transition:
    background  var(--ad-dur-normal) var(--ad-ease),
    color       var(--ad-dur-normal) var(--ad-ease),
    box-shadow  var(--ad-dur-normal) var(--ad-ease);
}

.continue-btn:hover {
  background: var(--ad-gold);
  color: var(--ad-text-on-gold);
  box-shadow: inset 0 1px 0 var(--ad-gold-light), 0 2px 8px var(--ad-shadow);
}

/* ── Location Bar ────────────────────────────────────────── */

.loc-bar {
  font-family: var(--ad-font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ad-text-secondary);
  text-align: center;
  border-bottom: 1px solid var(--ad-border-primary);
  padding: var(--ad-space-sm) var(--ad-space-md);
  margin-bottom: var(--ad-space-md);
}

/* ── Atmosphere Strip ────────────────────────────────────── */

.atmo-strip {
  font-family: var(--ad-font-body);
  font-size: 13px;
  font-style: italic;
  color: var(--ad-text-muted);
  text-align: center;
  border: none;
  background: transparent;
  padding: var(--ad-space-xs) var(--ad-space-md) var(--ad-space-md);
  margin-bottom: var(--ad-space-sm);
}

/* ── Narrative Text ──────────────────────────────────────── */

#narrative,
.narrative {
  font-family: var(--ad-font-body);
  font-size: 15px;
  line-height: 1.85;
  color: var(--ad-text-primary);
  letter-spacing: 0.02em;
  max-width: 640px;
  margin: 0 auto var(--ad-space-lg);
}

#narrative p,
.narrative p {
  margin: 0 0 var(--ad-space-md);
}

/* ── POI Buttons ─────────────────────────────────────────── */

.poi-btn {
  display: block;
  width: 100%;
  font-family: var(--ad-font-body);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ad-text-secondary);
  background: var(--ad-bg-secondary);
  border: none;
  border-left: 3px solid var(--ad-gold);
  border-radius: 0;
  padding: var(--ad-space-sm) var(--ad-space-md);
  min-height: 44px;
  box-sizing: border-box;
  text-align: left;
  cursor: pointer;
  margin-bottom: 2px;
  transition:
    background var(--ad-dur-fast) var(--ad-ease),
    color      var(--ad-dur-fast) var(--ad-ease),
    border-left-color var(--ad-dur-fast) var(--ad-ease);
}

.poi-btn:hover {
  background: var(--ad-bg-panel);
  color: var(--ad-text-primary);
  border-left-color: var(--ad-gold-light);
}

/* ── Action Buttons ──────────────────────────────────────── */

.action-btn,
[data-prompt] {
  font-family: var(--ad-font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ad-text-primary);
  background: transparent;
  border: 1px solid var(--ad-gold);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 2px var(--ad-shadow);
  padding: 10px 20px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  cursor: pointer;
  border-radius: var(--ad-radius-sm);
  transition:
    background var(--ad-dur-normal) var(--ad-ease),
    color      var(--ad-dur-normal) var(--ad-ease),
    box-shadow var(--ad-dur-normal) var(--ad-ease);
}

.action-btn:hover,
[data-prompt]:hover {
  background: var(--ad-gold);
  color: var(--ad-text-on-gold);
  box-shadow: inset 0 1px 0 var(--ad-gold-light), 0 2px 8px var(--ad-shadow);
}

.action-btn:active,
[data-prompt]:active {
  background: var(--ad-gold-dark);
  color: var(--ad-text-on-gold);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.25);
}

/* ── Status Bar ──────────────────────────────────────────── */

.status-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ad-space-md);
  align-items: center;
  border-top: 1px solid var(--ad-border-primary);
  border-bottom: 1px solid var(--ad-border-primary);
  padding: var(--ad-space-sm) var(--ad-space-md);
  background: var(--ad-bg-secondary);
  margin: var(--ad-space-md) 0;
}

.status-bar .stat-label {
  font-family: var(--ad-font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ad-text-muted);
}

.status-bar .stat-value {
  font-family: var(--ad-font-mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--ad-text-primary);
}

/* ── Footer Row ──────────────────────────────────────────── */

.footer-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ad-space-sm);
  align-items: center;
  border-top: 1px solid var(--ad-border-primary);
  padding: var(--ad-space-sm) 0 0;
  margin-top: var(--ad-space-md);
}

.footer-btn {
  font-family: var(--ad-font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ad-text-secondary);
  background: transparent;
  border: 1px solid var(--ad-border-secondary);
  padding: 8px 14px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  cursor: pointer;
  border-radius: var(--ad-radius-sm);
  transition:
    border-color var(--ad-dur-fast) var(--ad-ease),
    color        var(--ad-dur-fast) var(--ad-ease);
}

.footer-btn:hover {
  border-color: var(--ad-gold);
  color: var(--ad-text-primary);
}

/* Save button (last in footer) gets primary treatment */
.footer-btn[data-prompt] {
  margin-left: auto;
  border-color: var(--ad-gold);
}

/* ── Panel Overlay ───────────────────────────────────────── */

#panel-overlay {
  display: none;
  background: var(--ad-bg-panel);
  border: 1px solid var(--ad-border-primary);
  box-shadow:
    inset 0 0 0 3px var(--ad-bg-panel),
    inset 0 0 0 4px var(--ad-border-primary),
    0 8px 32px var(--ad-shadow);
  padding: var(--ad-space-lg);
  position: relative;
  /* Corner bracket decoration */
}

#panel-overlay::before,
#panel-overlay::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  border-color: var(--ad-gold);
  border-style: solid;
  pointer-events: none;
}

#panel-overlay::before {
  top: 8px; left: 8px;
  border-width: 1px 0 0 1px;
}

#panel-overlay::after {
  bottom: 8px; right: 8px;
  border-width: 0 1px 1px 0;
}

.panel-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: var(--ad-space-md);
  margin-bottom: var(--ad-space-md);
  border-bottom: 1px solid var(--ad-border-primary);
}

.panel-title {
  font-family: var(--ad-font-heading);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ad-text-primary);
  text-align: center;
  flex: 1;
}

.panel-close-btn {
  font-family: var(--ad-font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ad-text-muted);
  background: transparent;
  border: 1px solid var(--ad-border-secondary);
  padding: 8px 14px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  cursor: pointer;
  border-radius: var(--ad-radius-sm);
  transition:
    border-color var(--ad-dur-fast) var(--ad-ease),
    color        var(--ad-dur-fast) var(--ad-ease);
}

.panel-close-btn:hover {
  border-color: var(--ad-gold);
  color: var(--ad-text-primary);
}

.panel-content { display: none; }

/* ── Die Roll Widget ─────────────────────────────────────── */

.roll-display {
  text-align: center;
  padding: var(--ad-space-lg);
  border: 1px solid var(--ad-border-primary);
  box-shadow:
    inset 0 0 0 3px var(--ad-bg-primary),
    inset 0 0 0 4px var(--ad-border-primary),
    0 4px 16px var(--ad-shadow);
  background: var(--ad-bg-secondary);
  margin: var(--ad-space-md) 0;
}

.roll-result {
  font-family: var(--ad-font-mono);
  font-size: 48px;
  font-weight: 700;
  color: var(--ad-gold);
  line-height: 1;
  display: block;
}

.roll-label {
  font-family: var(--ad-font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ad-text-muted);
  display: block;
  margin-top: var(--ad-space-xs);
}

.roll-total {
  font-family: var(--ad-font-body);
  font-size: 18px;
  font-weight: 600;
  color: var(--ad-text-primary);
  margin-top: var(--ad-space-sm);
}

/* ── Outcome Cards ───────────────────────────────────────── */

.outcome-success,
.outcome-failure,
.outcome-partial {
  border: 1px solid var(--ad-border-muted);
  background: var(--ad-bg-secondary);
  padding: var(--ad-space-md) var(--ad-space-md) var(--ad-space-md) var(--ad-space-lg);
  margin: var(--ad-space-md) 0;
  position: relative;
}

.outcome-success::before,
.outcome-failure::before,
.outcome-partial::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
}

.outcome-success::before  { background: var(--ad-jade); }
.outcome-failure::before  { background: var(--ad-crimson); }
.outcome-partial::before  { background: var(--ad-copper); }

/* ── Gold Divider ────────────────────────────────────────── */

.ad-divider,
hr {
  border: none;
  border-top: 1px solid var(--ad-border-primary);
  margin: var(--ad-space-md) auto;
  width: 60%;
}
```
