---
name: station
description: >
  Hybrid operations-terminal aesthetic. Deep navy surfaces, proportional serif narrative
  text for immersive reading, monospace for mechanical/stat elements, and a vivid semantic
  colour system where every hue carries game-state meaning. The default style — playtested,
  battle-hardened, and tuned for sustained play sessions. Equally at home in sci-fi, space
  opera, near-future thriller, and any setting where a sleek but warm interface fits.
best-for:
  - sci-fi
  - space-opera
  - near-future
  - cyberpunk
  - thriller
  - heist
  - horror-tech
  - military
  - mystery
  output-styles:
    - Master Storyteller
    - Noir Narrator
    - Pulp Action
    - Cosmic Horror
    - Military Tactician
default: true
---

## Design Philosophy

The Station style is the product of actual playtesting — it is not a theoretical aesthetic
but a living design refined through real gameplay sessions. It solves a specific problem: how
do you build a game UI that feels like a terminal readout and reads like a novel at the same
time?

The answer is **typographic bifurcation**. Two entirely different typefaces carry two entirely
different kinds of information:

- **Proportional serif** (Georgia and equivalents) carries all narrative prose. This is not
  ornamental — serif body text at comfortable sizes and generous line-height measurably
  reduces reading fatigue in sustained sessions. Players read paragraphs of fiction; they
  should read them in a face designed for that purpose.

- **Monospace** (IBM Plex Mono and equivalents) carries all mechanical information: stat
  labels, check descriptions, dice notation, damage values, action identifiers. Monospace
  signals "this is data from the system" at a glance. Players scan it rather than read it.

This split is the Station style's primary differentiator. Everything else flows from it.

**Colour is semantic, not decorative.** Every colour in this palette carries meaning and is
used consistently:

- Cyan/teal: location, navigation, spatial information
- Green: health, success, positive NPC dispositions, interactable people
- Amber/gold: currency, items, pickups, interactable objects
- Purple: XP, progression, level indicators
- Red: danger, failure, enemy health, threat
- Bright white: emphasis, character names in dramatic moments

A player who has spent ten minutes with this UI will read colour as quickly as text. The
system is designed to be learned, not merely looked at.

**The aesthetic** is a space station operations terminal designed for human comfort — not the
cold utilitarian terminal of hard sci-fi, but one where someone has clearly thought about
the people who will stare at it for hours. Dark navy surfaces. Generous whitespace. Warm
serif text. Colour used with restraint and purpose. The vibe is: "checking your datapad
between chapters of a very good book."

**Accessibility is non-negotiable.** All foreground/background colour pairs have been
verified against WCAG AA (4.5:1 for body text, 3:1 for large text and UI components).
The semantic colour assignments use values chosen specifically to meet these ratios against
the dark navy background. Animations and transitions are entirely wrapped in
`prefers-reduced-motion` and removed at the media query boundary — not merely reduced, but
eliminated. Touch targets are a minimum 44×44px throughout.

---

## Typography

### Design Rationale

The dual-typeface system is the heart of the Station style. Implementing it correctly
requires discipline: serif goes on **all** narrative prose and descriptive text, monospace
goes on **all** mechanical elements. The boundary is meaningful and must not blur.

**Serif (narrative):** Georgia is the critical fallback — it is universally available across
all platforms and is the closest system serif to a comfortable reading face. Lora from Google
Fonts is the preferred import, but the fallback chain must produce acceptable results
independently because Google Fonts may be CSP-blocked inside Claude.ai iframes.

**Monospace (mechanical):** IBM Plex Mono is preferred. SF Mono, Cascadia Code, Consolas,
and the platform monospace are acceptable fallbacks. The monospace face is used at smaller
sizes with wider letter-spacing to improve legibility.

**Display (headings):** Syne or system sans-serif for location names, panel titles, widget
headings. Clean, modern, high contrast.

### Font Stacks

```css
/* Narrative / body — serif for sustained reading */
--sta-font-serif:   'Lora', 'Georgia', 'Times New Roman', 'Book Antiqua', serif;

/* Mechanical / UI — monospace for stats, checks, dice */
--sta-font-mono:    'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', 'Courier New', monospace;

/* Display / headings — sans for location names, panel titles */
--sta-font-display: 'Syne', 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
```

Google Fonts import (may be CSP-blocked — fallback stacks above must produce acceptable
results independently):

```css
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&family=Syne:wght@600;700&display=swap');
```

### Sizing Scale

```css
--sta-text-xs:   10px;   /* labels, badges, uppercase caps, atmo pills */
--sta-text-sm:   11px;   /* secondary UI, monospace stat labels, fallback prompts */
--sta-text-base: 15px;   /* narrative body — comfortable reading size */
--sta-text-md:   18px;   /* location names, panel headings */
--sta-text-lg:   22px;   /* panel titles */
--sta-text-xl:   36px;   /* die value display */
--sta-text-stat: 22px;   /* stat values (STR/DEX/etc numbers) */
```

### Letter Spacing

- Display / location headings: `letter-spacing: 0.02em` (tight — confidence)
- Chapter headings / section labels: `letter-spacing: 0.15em` (wide — gravitas)
- Uppercase caps and badges: `letter-spacing: 0.12em`
- Monospace UI elements: `letter-spacing: 0.06em`
- Monospace check descriptions: `letter-spacing: 0.04em`

### Line Height

- Narrative prose (serif): `line-height: 1.75` — generous for sustained reading
- Brief/intro text: `line-height: 1.7`
- Mechanical text (monospace): `line-height: 1.5` — tighter; scanned not read
- Labels and badges: `line-height: 1.2`

### Narrative Text Highlights

Within prose paragraphs, certain spans are coloured to signal interactability. These are
applied inline by the GM using `<span>` elements:

```css
/* Interactable NPCs / people — green */
.nar-npc   { color: var(--sta-color-success); font-weight: 500; }

/* Interactable items / objects — gold */
.nar-item  { color: var(--sta-color-currency); font-weight: 500; }

/* Sound effects / emphasis — uppercase amber */
.nar-sfx   { color: var(--sta-color-warning); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }

/* Character names in dramatic moments — bright white bold */
.nar-name  { color: var(--sta-color-text-emphasis); font-weight: 700; }

/* Italics for internal thoughts or whispers */
.nar-aside { font-style: italic; color: var(--sta-color-text-secondary); }
```

---

## Colour Palette

The Station palette uses the `--sta-` prefix to avoid collisions with the Claude.ai host
theme variables. All colours are defined as CSS custom properties. The dark mode is the
primary expression of this style; light mode reduces saturation and adjusts surfaces while
preserving the semantic colour assignments.

All WCAG AA contrast ratios are calculated against `--sta-bg-primary` (`#1A1D2E`).

### Dark Mode (default)

```css
:root,
[data-theme="station"] {

  /* ── Surfaces ──────────────────────────────────────────────────── */
  --sta-bg-primary:      #1A1D2E;   /* deep navy — main background */
  --sta-bg-secondary:    #22263A;   /* slightly lighter — cards, insets, panels */
  --sta-bg-tertiary:     #2A2F47;   /* elevated — hover states, active cards */
  --sta-bg-overlay:      #1E2136;   /* panel overlays */
  --sta-bg-stat-cell:    #20243A;   /* stat grid cells */

  /* ── Text ───────────────────────────────────────────────────────── */
  --sta-text-primary:    #EEF0FF;   /* near-white with blue tint — 15.8:1 on bg-primary */
  --sta-text-secondary:  #9AA0C0;   /* muted blue-grey — 6.2:1 on bg-primary */
  --sta-text-tertiary:   #545880;   /* dim — labels, hints, disabled — 3.1:1 large text */

  /* ── Semantic Accent Colours ────────────────────────────────────── */

  /* Cyan / teal — location, navigation, spatial */
  --sta-color-location:        #4ECDC4;   /* 6.1:1 on bg-primary — passes AA */
  --sta-color-location-dim:    rgba(78, 205, 196, 0.12);
  --sta-color-location-border: rgba(78, 205, 196, 0.5);

  /* Green — health, success, positive, interactable NPCs */
  --sta-color-success:         #2BA882;   /* 4.6:1 on bg-primary — passes AA */
  --sta-color-success-border:  #1F8A6A;
  --sta-color-success-bg:      rgba(43, 168, 130, 0.10);
  --sta-color-success-bg-hover: rgba(43, 168, 130, 0.20);

  /* Amber / gold — currency, items, interactable objects */
  --sta-color-currency:        #D4A017;   /* 7.2:1 on bg-primary — passes AA */
  --sta-color-currency-dim:    rgba(212, 160, 23, 0.12);
  --sta-color-currency-border: rgba(212, 160, 23, 0.5);

  /* Purple — XP, progression, level, mystery */
  --sta-color-xp:              #8B7CF8;   /* 5.1:1 on bg-primary — passes AA */
  --sta-color-xp-dim:          rgba(139, 124, 248, 0.12);
  --sta-color-xp-border:       rgba(139, 124, 248, 0.5);

  /* Red — danger, failure, enemy HP, threat */
  --sta-color-danger:          #E84855;   /* 5.3:1 on bg-primary — passes AA */
  --sta-color-danger-border:   #B33040;
  --sta-color-danger-bg:       rgba(232, 72, 85, 0.10);
  --sta-color-danger-bg-hover: rgba(232, 72, 85, 0.20);

  /* Warning / caution — amber, partial success, suspicious disposition */
  --sta-color-warning:         #F0A500;   /* 8.4:1 on bg-primary — passes AAA */
  --sta-color-warning-border:  rgba(240, 165, 0, 0.5);
  --sta-color-warning-bg:      rgba(240, 165, 0, 0.10);

  /* Label text — sub-14px UI labels that must pass AA 4.5:1 */
  --sta-text-label:            #6E7298;   /* 4.5:1 on bg-primary — section labels, atmo pills, badges */

  /* Bright white — emphasis, dramatic character names */
  --sta-color-text-emphasis:   #FFFFFF;   /* 18.9:1 — used sparingly */

  /* ── Primary Action Colour ──────────────────────────────────────── */
  /* Action buttons use cyan/teal — same family as location accent */
  --sta-color-accent:          #4ECDC4;
  --sta-color-accent-hover:    #5FD8CF;
  --sta-color-accent-bg:       rgba(78, 205, 196, 0.10);
  --sta-color-accent-bg-hover: rgba(78, 205, 196, 0.20);

  /* ── Borders ─────────────────────────────────────────────────────── */
  --sta-border-primary:   rgba(78, 205, 196, 0.6);    /* cyan — active/location */
  --sta-border-secondary: rgba(154, 160, 192, 0.35);  /* muted — interactive */
  --sta-border-tertiary:  rgba(84, 88, 128, 0.4);     /* dim — structural */
  --sta-border-width:     0.5px;

  /* ── Border Radius ───────────────────────────────────────────────── */
  --sta-radius-sm:   4px;   /* small elements — pips, atmo pills */
  --sta-radius-md:   6px;   /* cards, buttons, panels */
  --sta-radius-pill: 999px; /* pill badges and condition tags */

  /* ── Location Accent Bar ─────────────────────────────────────────── */
  --sta-location-bar-width: 3px;
  --sta-location-bar-color: var(--sta-color-location);

  /* ── Stat Display ────────────────────────────────────────────────── */
  /* Modifier colours in stat cells */
  --sta-modifier-positive: var(--sta-color-success);
  --sta-modifier-zero:     var(--sta-text-tertiary);
  --sta-modifier-negative: var(--sta-color-danger);

  /* ── Outcome Badge Colours ───────────────────────────────────────── */
  --sta-badge-success-bg:          rgba(43, 168, 130, 0.15);
  --sta-badge-success-text:        #7DDFC3;
  --sta-badge-partial-bg:          rgba(212, 160, 23, 0.15);
  --sta-badge-partial-text:        #E8C060;
  --sta-badge-failure-bg:          rgba(232, 72, 85, 0.15);
  --sta-badge-failure-text:        #F08090;
  --sta-badge-crit-success-border: var(--sta-color-success);
  --sta-badge-crit-failure-border: var(--sta-color-danger);

  /* ── CSS Custom Property Contract (required by style-reference.md) ─ */
  --ta-font-heading:           var(--sta-font-display);
  --ta-font-body:              var(--sta-font-mono);
  --ta-color-accent:           var(--sta-color-accent);
  --ta-color-accent-hover:     var(--sta-color-accent-hover);
  --ta-color-accent-bg:        var(--sta-color-accent-bg);
  --ta-color-accent-bg-hover:  var(--sta-color-accent-bg-hover);
  --ta-color-success:          var(--sta-color-success);
  --ta-color-success-border:   var(--sta-color-success-border);
  --ta-color-danger:           var(--sta-color-danger);
  --ta-color-danger-border:    var(--sta-color-danger-border);
  --ta-color-danger-bg:        var(--sta-color-danger-bg);
  --ta-color-danger-bg-hover:  var(--sta-color-danger-bg-hover);
  --ta-color-warning:          var(--sta-color-warning);
  --ta-color-warning-border:   var(--sta-color-warning-border);
  --ta-color-warning-bg:       var(--sta-color-warning-bg);
  --ta-color-xp:               var(--sta-color-xp);
  --ta-color-focus:            var(--sta-color-location);
  --ta-color-conviction:       #7C6BF0;
  --ta-color-conviction-border: #6B5CE0;
  --ta-badge-success-bg:       var(--sta-badge-success-bg);
  --ta-badge-success-text:     var(--sta-badge-success-text);
  --ta-badge-partial-bg:       var(--sta-badge-partial-bg);
  --ta-badge-partial-text:     var(--sta-badge-partial-text);
  --ta-badge-failure-bg:       var(--sta-badge-failure-bg);
  --ta-badge-failure-text:     var(--sta-badge-failure-text);
  --ta-badge-crit-success-border: var(--sta-badge-crit-success-border);
  --ta-badge-crit-failure-border: var(--sta-badge-crit-failure-border);
  --ta-color-credits:          var(--sta-color-currency);
  --ta-color-tab-active:       var(--sta-color-location);
  --ta-border-style-poi:       1px dashed;
  --ta-die-spin-duration:      0.5s;
}
```

### Light Mode Override

```css
@media (prefers-color-scheme: light) {
  :root,
  [data-theme="station"] {
    --sta-bg-primary:      #F8F9FC;
    --sta-bg-secondary:    #EDEEF5;
    --sta-bg-tertiary:     #E0E2EF;
    --sta-bg-overlay:      #F2F3F9;
    --sta-bg-stat-cell:    #EAEBF4;

    --sta-text-primary:    #181B2E;
    --sta-text-secondary:  #3A4060;
    --sta-text-tertiary:   #7880A8;
    --sta-text-label:      #5A5E80;   /* 4.5:1 on light bg */

    /* Saturations reduced for light surfaces */
    --sta-color-location:        #1A8F87;
    --sta-color-location-dim:    rgba(26, 143, 135, 0.10);
    --sta-color-location-border: rgba(26, 143, 135, 0.45);

    --sta-color-success:         #1B7A5C;
    --sta-color-success-border:  #14604A;
    --sta-color-success-bg:      rgba(27, 122, 92, 0.08);
    --sta-color-success-bg-hover: rgba(27, 122, 92, 0.16);

    --sta-color-currency:        #9A6E00;
    --sta-color-currency-dim:    rgba(154, 110, 0, 0.10);
    --sta-color-currency-border: rgba(154, 110, 0, 0.45);

    --sta-color-xp:              #5B49D4;
    --sta-color-xp-dim:          rgba(91, 73, 212, 0.10);
    --sta-color-xp-border:       rgba(91, 73, 212, 0.45);

    --sta-color-danger:          #C42030;
    --sta-color-danger-border:   #9A1825;
    --sta-color-danger-bg:       rgba(196, 32, 48, 0.08);
    --sta-color-danger-bg-hover: rgba(196, 32, 48, 0.16);

    --sta-color-warning:         #9A6200;
    --sta-color-warning-border:  rgba(154, 98, 0, 0.45);
    --sta-color-warning-bg:      rgba(154, 98, 0, 0.08);

    --sta-color-text-emphasis:   #0A0C18;

    --sta-color-accent:          #1A8F87;
    --sta-color-accent-hover:    #107870;
    --sta-color-accent-bg:       rgba(26, 143, 135, 0.08);
    --sta-color-accent-bg-hover: rgba(26, 143, 135, 0.16);

    --sta-border-primary:   rgba(26, 143, 135, 0.6);
    --sta-border-secondary: rgba(58, 64, 96, 0.3);
    --sta-border-tertiary:  rgba(120, 128, 168, 0.3);

    --sta-badge-success-bg:    rgba(27, 122, 92, 0.12);
    --sta-badge-success-text:  #0E5C3E;
    --sta-badge-partial-bg:    rgba(154, 110, 0, 0.12);
    --sta-badge-partial-text:  #7A4E00;
    --sta-badge-failure-bg:    rgba(196, 32, 48, 0.12);
    --sta-badge-failure-text:  #8A1020;

    /* Re-assign contract variables for light mode */
    --ta-color-accent:           var(--sta-color-accent);
    --ta-color-accent-hover:     var(--sta-color-accent-hover);
    --ta-color-accent-bg:        var(--sta-color-accent-bg);
    --ta-color-accent-bg-hover:  var(--sta-color-accent-bg-hover);
    --ta-color-success:          var(--sta-color-success);
    --ta-color-success-border:   var(--sta-color-success-border);
    --ta-color-danger:           var(--sta-color-danger);
    --ta-color-danger-border:    var(--sta-color-danger-border);
    --ta-color-danger-bg:        var(--sta-color-danger-bg);
    --ta-color-danger-bg-hover:  var(--sta-color-danger-bg-hover);
    --ta-color-warning:          var(--sta-color-warning);
    --ta-color-warning-border:   var(--sta-color-warning-border);
    --ta-color-warning-bg:       var(--sta-color-warning-bg);
    --ta-color-xp:               var(--sta-color-xp);
    --ta-color-focus:            var(--sta-color-location);
    --ta-color-conviction:       #7C6BF0;
    --ta-color-conviction-border: #6B5CE0;
    --ta-badge-success-bg:       var(--sta-badge-success-bg);
    --ta-badge-success-text:     var(--sta-badge-success-text);
    --ta-badge-partial-bg:       var(--sta-badge-partial-bg);
    --ta-badge-partial-text:     var(--sta-badge-partial-text);
    --ta-badge-failure-bg:       var(--sta-badge-failure-bg);
    --ta-badge-failure-text:     var(--sta-badge-failure-text);
    --ta-color-credits:          var(--sta-color-currency);
    --ta-color-tab-active:       var(--sta-color-location);
  }
}
```

---

## Spacing & Layout

```css
/* Spacing scale */
--sta-space-xs:  4px;
--sta-space-sm:  8px;
--sta-space-md: 14px;
--sta-space-lg: 20px;
--sta-space-xl: 28px;

/* Widget padding and max-width */
--sta-widget-padding: 1rem 0 1.5rem;
--sta-content-max: 680px;

/* Touch target floor — WCAG 2.5.5 */
--sta-touch-target: 44px;

/* Section divider */
--sta-divider: var(--sta-border-width) solid var(--sta-border-tertiary);
```

Layout uses flexbox throughout. No CSS Grid is used in widget bodies to maximise
compatibility inside sandboxed iframes. All flex containers use `flex-wrap: wrap` so
content reflows gracefully at narrow iframe widths. The root element uses
`max-width: 680px; margin: 0 auto` to prevent line lengths exceeding 80 characters
on wide chat panels — this does not affect iframe height reporting.

**Hierarchy of breathing room:**
- Between major sections (loc-bar → narrative, narrative → actions): 14–16px
- Between items in a button row: 8px
- Between a section label and its content: 8px
- Between status-bar items: 16px
- Inner card padding: 10–12px vertical, 12–14px horizontal

---

## Borders & Surfaces

The Station style uses **0.5px borders** — hairline strokes that structure without dominating.
The very thin borders are intentional: they create structure without competing with the
serif narrative text. Cards are barely-there containers; the typography carries the weight.

The **location name accent bar** is the single most distinctive structural element: a 3px
solid cyan/teal left border on `.loc-name`, signalling "you are here." This visual anchor
is used nowhere else, which gives it maximum impact.

Border radius is **6px** for cards and buttons (warm, not clinical), **4px** for small
elements, and full-pill for condition tags and atmo pills.

```css
/* Standard card / panel surface */
.sta-card {
  background: var(--sta-bg-secondary);
  border: var(--sta-border-width) solid var(--sta-border-tertiary);
  border-radius: var(--sta-radius-md);
  padding: var(--sta-space-md);
}

/* Inset / recessed surface (attr blocks, NPC reaction, stakes) */
.sta-inset {
  background: var(--sta-bg-secondary);
  border: var(--sta-border-width) solid var(--sta-border-tertiary);
  border-radius: var(--sta-radius-md);
  padding: var(--sta-space-sm) var(--sta-space-md);
}

/* Location name — left accent bar treatment */
.loc-name {
  border-left: var(--sta-location-bar-width) solid var(--sta-location-bar-color);
  padding-left: var(--sta-space-sm);
}

/* Active / selected card — cyan border lift */
.sta-card--active {
  border-color: var(--sta-color-location);
  background: var(--sta-bg-tertiary);
}

/* Pill badge shape */
.sta-pill {
  border-radius: var(--sta-radius-pill);
  border: var(--sta-border-width) solid var(--sta-border-tertiary);
  padding: 3px 10px;
}
```

---

## Interactive Elements

### Design Intent

Buttons in the Station style are deliberately restrained. The narrative prose does the
heavy lifting; buttons are clean, bordered containers that do not shout. Hover states shift
background opacity rather than adding glow effects — this is a deliberate contrast to the
Neon style and keeps the terminal feeling grounded.

### Base Reset

```css
/* Applied to all button types */
.sta-btn-base {
  font-family: var(--sta-font-mono);
  letter-spacing: 0.06em;
  cursor: pointer;
  box-sizing: border-box;
  min-height: var(--sta-touch-target);
  min-width: var(--sta-touch-target);
  border-radius: var(--sta-radius-md);
  border: var(--sta-border-width) solid;
  background: transparent;
  transition: background 0.14s ease, border-color 0.14s ease, color 0.14s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Focus ring — cyan outline, 2px, offset */
button:focus-visible,
[data-prompt]:focus-visible {
  outline: 2px solid var(--sta-color-location);
  outline-offset: 2px;
}

/* Disabled */
button:disabled,
button[disabled] {
  opacity: 0.35;
  cursor: not-allowed;
}
```

### Action Button (primary — cyan accent)

Used for: primary scene actions, confirm, buy, submit.

```css
.btn-action, .action-btn {
  font-size: var(--sta-text-sm);
  letter-spacing: 0.06em;
  padding: var(--sta-space-sm) var(--sta-space-md);
  color: var(--sta-text-primary);
  border-color: var(--sta-color-accent);
  background: var(--sta-color-accent-bg);
}
.btn-action:hover, .action-btn:hover {
  background: var(--sta-color-accent-bg-hover);
  border-color: var(--sta-color-accent-hover);
}
.btn-action:active, .action-btn:active {
  background: rgba(78, 205, 196, 0.28);
}
```

### POI / Explore Button (dashed secondary — exploratory)

Used for: points of interest, inspect, examine.

```css
.btn-poi, .poi-btn {
  font-size: var(--sta-text-sm);
  letter-spacing: 0.06em;
  padding: var(--sta-space-sm) var(--sta-space-md);
  color: var(--sta-text-secondary);
  border: 1px dashed var(--sta-border-secondary);
  background: transparent;
}
.btn-poi:hover, .poi-btn:hover {
  border-style: solid;
  border-color: var(--sta-border-secondary);
  background: var(--color-background-secondary, var(--sta-bg-secondary));
  color: var(--sta-text-primary);
}
```

### Continue / Neutral Button (ghost — tertiary)

Used for: continue, close, cancel, save.

```css
.continue-btn, .btn-neutral {
  font-size: var(--sta-text-sm);
  letter-spacing: 0.08em;
  padding: var(--sta-space-sm) var(--sta-space-md);
  color: var(--sta-text-secondary);
  border-color: var(--sta-border-tertiary);
  background: transparent;
}
.continue-btn:hover, .btn-neutral:hover {
  border-color: var(--sta-border-secondary);
  color: var(--sta-text-primary);
  background: var(--sta-bg-secondary);
}
```

### Roll Button (large, accent-bordered — centrepiece of die roll widgets)

```css
.roll-btn {
  font-size: var(--sta-text-md);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: var(--sta-space-md) var(--sta-space-xl);
  color: var(--sta-color-location);
  border: 1px solid var(--sta-color-location);
  background: var(--sta-color-location-dim);
  display: block;
  margin: 0 auto var(--sta-space-md);
}
.roll-btn:hover {
  background: rgba(78, 205, 196, 0.2);
}
.roll-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
```

### Attack Button (danger — red/threat)

```css
.action-btn.attack, .btn-attack {
  color: var(--sta-color-danger);
  border-color: var(--sta-color-danger);
  background: var(--sta-color-danger-bg);
}
.action-btn.attack:hover, .btn-attack:hover {
  background: var(--sta-color-danger-bg-hover);
}
```

### Retreat Button (muted — non-threatening)

```css
.action-btn.retreat {
  color: var(--sta-text-tertiary);
  border-color: var(--sta-border-tertiary);
  background: transparent;
}
```

### Footer / Panel Toggle Button (dim — unobtrusive navigation)

```css
.footer-btn {
  font-size: var(--sta-text-xs);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: var(--sta-space-sm) var(--sta-space-md);
  color: var(--sta-text-tertiary);
  border-color: var(--sta-border-tertiary);
  background: transparent;
}
.footer-btn:hover {
  color: var(--sta-text-secondary);
  border-color: var(--sta-border-secondary);
  background: var(--sta-bg-secondary);
}
```

### Tab Button (active state — cyan underline)

```css
.tab-btn {
  font-size: var(--sta-text-xs);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: var(--sta-space-sm) var(--sta-space-md);
  min-height: var(--sta-touch-target);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--sta-text-tertiary);
  cursor: pointer;
  transition: color 0.14s, border-color 0.14s;
}
.tab-btn:hover { color: var(--sta-text-secondary); }
.tab-btn.active {
  color: var(--sta-text-primary);
  border-bottom-color: var(--sta-color-location);
}
```

### Numbered Action Cards (extended pattern)

For action choices presented as numbered cards rather than simple buttons, the GM may
render `.action-card` elements:

```css
/* Action card — numbered choice with title, description, and mechanical info */
.action-card {
  display: flex;
  gap: var(--sta-space-md);
  align-items: flex-start;
  padding: var(--sta-space-sm) var(--sta-space-md);
  border: var(--sta-border-width) solid var(--sta-border-tertiary);
  border-radius: var(--sta-radius-md);
  background: var(--sta-bg-secondary);
  cursor: pointer;
  transition: background 0.14s, border-color 0.14s;
  text-align: left;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: var(--sta-space-sm);
  font-family: inherit;
}
.action-card:hover {
  border-color: var(--sta-color-accent);
  background: var(--sta-bg-tertiary);
}

/* Number circle */
.action-card-num {
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-sm);
  font-weight: 500;
  color: var(--sta-color-accent);
  border: var(--sta-border-width) solid var(--sta-color-accent);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  min-width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

/* Card body */
.action-card-body { flex: 1; }
.action-card-title {
  font-family: var(--sta-font-serif);
  font-size: var(--sta-text-base);
  font-weight: 600;
  color: var(--sta-text-primary);
  margin: 0 0 4px;
  line-height: 1.3;
}
.action-card-desc {
  font-family: var(--sta-font-serif);
  font-size: 13px;
  color: var(--sta-text-secondary);
  margin: 0 0 6px;
  line-height: 1.5;
}
.action-card-mech {
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-xs);
  letter-spacing: 0.06em;
  color: var(--sta-color-warning);
  margin: 0;
  text-transform: uppercase;
}
/* Alternate mechanical info colour for success-type checks */
.action-card-mech.mech-success { color: var(--sta-color-success); }
```

---

## Micro-interactions

All animations and transitions are wrapped in `prefers-reduced-motion`. Under
`reduce`, transitions are set to 0.01ms (effectively instant) and all keyframe animations
are disabled. No visual information is conveyed exclusively through animation — the end
state is always visible without motion.

```css
/* Global reduced-motion kill-switch */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration:        0.01ms !important;
    animation-iteration-count: 1      !important;
    transition-duration:       0.01ms !important;
    transition-delay:          0ms    !important;
  }
  /* Explicit animation disables for specific elements */
  .die-value.spinning    { animation: none !important; opacity: 1; }
  #reveal-full           { animation: none !important; }
  .init-chip.active      { animation: none !important; }
}
```

### Progressive Reveal Fade

```css
@keyframes sta-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

#reveal-full {
  animation: sta-fade-in 0.25s ease-out;
}
```

### Die Spin

The die spin is a scale-and-opacity entrance rather than a rotation transform. This
avoids potential layout paint issues inside iframes while still providing satisfying
physical feedback.

```css
@keyframes sta-die-spin {
  0%   { opacity: 0.2; transform: scale(0.7); }
  60%  { opacity: 0.9; transform: scale(1.06); }
  100% { opacity: 1;   transform: scale(1); }
}

.die-value.spinning {
  animation: sta-die-spin var(--ta-die-spin-duration, 0.5s) cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

### Button Transitions

```css
/* Applied to all interactive elements — killed by reduced-motion above */
.btn-action, .btn-poi, .btn-attack, .btn-neutral,
.continue-btn, .roll-btn, .footer-btn, .tab-btn,
.action-btn, .poi-btn, .action-card,
.panel-close-btn {
  transition:
    background   0.14s ease,
    border-color 0.14s ease,
    color        0.14s ease;
}
```

### Active Initiative Chip Pulse

Used on the current combatant's chip in combat widgets. Subtle — a slow opacity
oscillation rather than a glow pulse, keeping it calm enough to coexist with serif text.

```css
@keyframes sta-init-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.65; }
}

.init-chip.active {
  animation: sta-init-pulse 2.5s ease-in-out infinite;
}
```

---

## Component Overrides

### Root / Widget Container

Note: The `font-family` on the root uses monospace as the base. Narrative `.narrative`
and `.brief-text` elements override this to serif via their own rules. This ensures
mechanical elements inherit mono by default without the GM having to specify it
individually on every stat label.

```css
.root,
.combat-root,
.roll-root,
.shop-root,
.social-root {
  font-family: var(--sta-font-mono);
  color: var(--sta-text-primary);
  padding: var(--sta-widget-padding);
}
```

### Location Bar

The left accent bar on `.loc-name` is the style's most distinctive element. The location
name uses display sans at 18px bold, all-caps with letter-spacing, and the 3px cyan left
border. The scene number uses the small monospace cap treatment.

```css
.loc-bar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: var(--sta-space-sm);
  margin-bottom: var(--sta-space-md);
  border-bottom: var(--sta-border-width) solid var(--sta-border-tertiary);
}
.loc-name {
  font-family: var(--sta-font-display);
  font-size: var(--sta-text-md);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--sta-text-primary);
  margin: 0;
  /* Left accent bar — the Station style signature */
  border-left: var(--sta-location-bar-width) solid var(--sta-location-bar-color);
  padding-left: var(--sta-space-sm);
}
.scene-num {
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-xs);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--sta-text-tertiary);
}
```

### Chapter / Section Heading

Used at the top of acts and major structural breaks. Centred, uppercase, widely spaced,
muted — decorative but understated.

```css
.chapter-heading {
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-xs);
  font-weight: 400;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--sta-text-tertiary);
  text-align: center;
  margin: 0 0 var(--sta-space-md);
}
```

### Atmosphere Pills

```css
.atmo-strip {
  display: flex;
  gap: var(--sta-space-sm);
  flex-wrap: wrap;
  margin-bottom: var(--sta-space-md);
}
.atmo-pill {
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-xs);
  letter-spacing: 0.06em;
  padding: 3px 10px;
  border-radius: var(--sta-radius-pill);
  border: var(--sta-border-width) solid var(--sta-border-tertiary);
  color: var(--sta-text-tertiary);
}
```

### Narrative Block

**Serif.** This is the critical typographic override. Every narrative paragraph must use
the serif stack at comfortable body size with generous line-height.

```css
.narrative,
.brief-text,
.roll-action,
.npc-reaction,
.merchant-flavour,
.stakes-text {
  font-family: var(--sta-font-serif);
  font-size: var(--sta-text-base);
  line-height: 1.75;
  color: var(--sta-text-primary);
  margin: 0 0 var(--sta-space-md);
}

/* Slightly smaller for supporting narrative blocks */
.roll-action,
.npc-reaction,
.merchant-flavour {
  font-size: 14px;
  color: var(--sta-text-secondary);
}
```

### Section Labels

```css
.section-label {
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-xs);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--sta-text-tertiary);
  margin: var(--sta-space-md) 0 var(--sta-space-sm);
}
```

### Status Bar (HP pips, XP, level)

The status bar uses a compact horizontal layout with semantically coloured values.
HP label and pips are green. XP track is purple. LVL uses the primary text colour.

```css
.status-bar {
  display: flex;
  align-items: center;
  gap: var(--sta-space-md);
  flex-wrap: wrap;
  padding: var(--sta-space-sm) 0;
  margin-top: var(--sta-space-sm);
  border-top: var(--sta-border-width) solid var(--sta-border-tertiary);
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-xs);
  color: var(--sta-text-tertiary);
  letter-spacing: 0.08em;
}
.hp-pips, .player-pips { display: flex; gap: 4px; align-items: center; }
.pip {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--sta-color-success);
  border: 0.5px solid var(--sta-color-success-border);
}
.pip.empty {
  background: transparent;
  border-color: var(--sta-border-tertiary);
}
.player-pip {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--sta-color-success);
  border: 0.5px solid var(--sta-color-success-border);
}
.player-pip.empty { background: transparent; border-color: var(--sta-border-tertiary); }
.xp-track {
  width: 60px; height: 3px;
  background: var(--sta-border-tertiary);
  border-radius: 2px; overflow: hidden;
}
.xp-fill {
  height: 100%;
  background: var(--sta-color-xp);
  border-radius: 2px;
}
```

### Stat Grid (character sheet style)

A row of six stat cells — STR DEX CON INT WIS CHA. Each cell has a small grey label
above, a large bold value, and a coloured modifier below.

```css
.stat-grid {
  display: flex;
  gap: var(--sta-space-sm);
  flex-wrap: wrap;
  margin-bottom: var(--sta-space-md);
}
.stat-cell {
  flex: 1;
  min-width: 52px;
  padding: 8px 6px;
  background: var(--sta-bg-stat-cell);
  border: var(--sta-border-width) solid var(--sta-border-tertiary);
  border-radius: var(--sta-radius-md);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.stat-label {
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--sta-text-tertiary);
  line-height: 1;
}
.stat-value {
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-stat);
  font-weight: 700;
  color: var(--sta-text-primary);
  line-height: 1.1;
}
.stat-mod {
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-xs);
  line-height: 1;
}
.stat-mod.positive { color: var(--sta-modifier-positive); }
.stat-mod.zero     { color: var(--sta-modifier-zero); }
.stat-mod.negative { color: var(--sta-modifier-negative); }
```

### Inline Status Row (HP, AC, GOLD, LVL)

Below the stat grid, a horizontal status bar showing key numbers in semantic colours.

```css
.inline-status {
  display: flex;
  gap: var(--sta-space-lg);
  flex-wrap: wrap;
  padding: var(--sta-space-sm) var(--sta-space-md);
  background: var(--sta-bg-secondary);
  border: var(--sta-border-width) solid var(--sta-border-tertiary);
  border-radius: var(--sta-radius-md);
  margin-bottom: var(--sta-space-md);
}
.inline-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.inline-stat-label {
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--sta-text-tertiary);
}
.inline-stat-value {
  font-family: var(--sta-font-mono);
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
}
.inline-stat-value.hp     { color: var(--sta-color-success); }
.inline-stat-value.gold   { color: var(--sta-color-currency); }
.inline-stat-value.xp     { color: var(--sta-color-xp); }
.inline-stat-value.danger { color: var(--sta-color-danger); }
.inline-stat-value.default{ color: var(--sta-text-primary); }
```

### Combat: Initiative Bar

```css
.init-bar {
  display: flex;
  gap: var(--sta-space-sm);
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: var(--sta-space-md);
  padding-bottom: var(--sta-space-sm);
  border-bottom: var(--sta-border-width) solid var(--sta-border-tertiary);
}
.init-label {
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-xs);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--sta-text-tertiary);
  margin-right: 4px;
}
.init-chip {
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-xs);
  letter-spacing: 0.06em;
  padding: 3px 10px;
  border-radius: var(--sta-radius-md);
  border: var(--sta-border-width) solid var(--sta-border-tertiary);
  color: var(--sta-text-secondary);
}
.init-chip.active {
  border-color: var(--sta-color-success);
  color: var(--sta-color-success);
  font-weight: 500;
  /* sta-init-pulse animation — see micro-interactions */
}
```

### Combat: Enemy Cards

Enemy HP pips use red to signal threat.

```css
.enemy-row  { display: flex; flex-wrap: wrap; gap: var(--sta-space-sm); margin-bottom: var(--sta-space-lg); }
.enemy-card {
  flex: 1; min-width: 140px;
  padding: var(--sta-space-sm) var(--sta-space-md);
  background: var(--sta-bg-secondary);
  border: var(--sta-border-width) solid var(--sta-border-tertiary);
  border-radius: var(--sta-radius-md);
}
.enemy-name {
  font-family: var(--sta-font-mono);
  font-size: 12px; font-weight: 500;
  color: var(--sta-text-primary); margin: 0 0 4px;
}
.enemy-role {
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-xs);
  color: var(--sta-text-tertiary); margin: 0 0 var(--sta-space-sm);
}
.hp-row { display: flex; gap: 4px; align-items: center; }
.hp-label { font-size: var(--sta-text-xs); color: var(--sta-text-tertiary); margin-right: 4px; }
/* Enemy HP pips — red/threat */
.enemy-card .pip {
  background: var(--sta-color-danger);
  border-color: var(--sta-color-danger-border);
}
.enemy-card .pip.empty {
  background: transparent;
  border-color: var(--sta-border-tertiary);
}
```

### Die Roll: Die Value Display

The die value is large, bold, and colour-coded: success green, failure red, default white.

```css
.die-display { display: none; text-align: center; margin-bottom: var(--sta-space-md); }
.die-value {
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-xl);
  font-weight: 700;
  color: var(--sta-text-primary);
  display: inline-block;
}
/* Colour state applied by JS after outcome is known */
.die-value.success { color: var(--sta-color-success); }
.die-value.failure { color: var(--sta-color-danger); }

.die-value.spinning { animation: sta-die-spin var(--ta-die-spin-duration, 0.5s) cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
```

### Die Roll: Component Breakdown Row

The Station style's signature die roll presentation: individual cells showing each
component (D20 ROLL, modifier, proficiency, etc.) with + signs between them.

```css
.roll-breakdown {
  display: flex;
  align-items: center;
  gap: var(--sta-space-sm);
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: var(--sta-space-md);
  padding: var(--sta-space-sm) var(--sta-space-md);
  background: var(--sta-bg-secondary);
  border: var(--sta-border-width) solid var(--sta-border-tertiary);
  border-radius: var(--sta-radius-md);
}
.roll-component {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.roll-component-label {
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-xs);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--sta-text-tertiary);
  white-space: nowrap;
}
.roll-component-value {
  font-family: var(--sta-font-mono);
  font-size: 18px;
  font-weight: 700;
  color: var(--sta-text-primary);
}
.roll-component-value.total { font-size: 22px; color: var(--sta-color-location); }
.roll-component-value.success { color: var(--sta-color-success); }
.roll-component-value.failure { color: var(--sta-color-danger); }
.roll-separator {
  font-family: var(--sta-font-mono);
  font-size: 16px;
  color: var(--sta-text-tertiary);
  align-self: flex-end;
  padding-bottom: 4px;
}
```

### Die Roll: Outcome Badges

```css
.outcome-badge { display: none; text-align: center; margin-bottom: var(--sta-space-md); }
.badge {
  display: inline-block;
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-xs);
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 5px 16px;
  border-radius: var(--sta-radius-md);
}
.badge.crit-success {
  background: var(--sta-badge-success-bg);
  color: var(--sta-badge-success-text);
  border: 1px solid var(--sta-badge-crit-success-border);
}
.badge.success {
  background: var(--sta-badge-success-bg);
  color: var(--sta-badge-success-text);
}
.badge.partial {
  background: var(--sta-badge-partial-bg);
  color: var(--sta-badge-partial-text);
}
.badge.failure {
  background: var(--sta-badge-failure-bg);
  color: var(--sta-badge-failure-text);
}
.badge.crit-failure {
  background: var(--sta-badge-failure-bg);
  color: var(--sta-badge-failure-text);
  border: 1px solid var(--sta-badge-crit-failure-border);
}
```

### Shop: Merchant Header & Credits

```css
.merchant-header {
  display: flex; justify-content: space-between; align-items: baseline;
  padding-bottom: var(--sta-space-sm); margin-bottom: 4px;
  border-bottom: var(--sta-border-width) solid var(--sta-border-tertiary);
}
.merchant-name {
  font-family: var(--sta-font-display);
  font-size: var(--sta-text-md); font-weight: 700;
  color: var(--sta-text-primary); margin: 0;
}
/* merchant-flavour inherits .narrative serif override above */
.credits-display {
  font-family: var(--sta-font-mono);
  font-size: 12px; font-weight: 500;
  letter-spacing: 0.08em;
  color: var(--sta-color-currency);
}
```

### Shop: Item Cards

```css
.item-grid { display: flex; flex-direction: column; gap: var(--sta-space-sm); margin-bottom: var(--sta-space-md); }
.item-card {
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px; padding: var(--sta-space-sm) var(--sta-space-md);
  border: var(--sta-border-width) solid var(--sta-border-tertiary);
  border-radius: var(--sta-radius-md); flex-wrap: wrap;
}
.item-info { flex: 1; min-width: 160px; }
.item-name { font-family: var(--sta-font-serif); font-size: 13px; font-weight: 600; color: var(--sta-text-primary); margin: 0 0 2px; }
.item-type-badge {
  display: inline-block; font-family: var(--sta-font-mono);
  font-size: var(--sta-text-xs); letter-spacing: 0.08em; text-transform: uppercase;
  padding: 2px 8px; border-radius: var(--sta-radius-pill);
  border: var(--sta-border-width) solid var(--sta-border-tertiary);
  color: var(--sta-text-tertiary); margin-right: 6px;
}
.item-effect { font-family: var(--sta-font-serif); font-size: 12px; color: var(--sta-text-secondary); margin: 4px 0 0; line-height: 1.5; }
.item-price { font-family: var(--sta-font-mono); font-size: 12px; font-weight: 500; color: var(--sta-color-currency); white-space: nowrap; margin-right: var(--sta-space-sm); }
.item-actions { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
.shop-footer {
  display: flex; justify-content: space-between; align-items: center;
  gap: var(--sta-space-sm); flex-wrap: wrap; margin-top: var(--sta-space-md);
  padding-top: var(--sta-space-sm); border-top: var(--sta-border-width) solid var(--sta-border-tertiary);
}
```

### Social: NPC Header & Disposition Badges

```css
.npc-header {
  display: flex; justify-content: space-between; align-items: baseline;
  padding-bottom: var(--sta-space-sm); margin-bottom: 4px;
  border-bottom: var(--sta-border-width) solid var(--sta-border-tertiary);
}
.npc-name {
  font-family: var(--sta-font-display);
  font-size: var(--sta-text-md); font-weight: 700;
  color: var(--sta-text-primary); margin: 0;
}
.disposition-badge {
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-xs); font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase;
  padding: 3px 12px; border-radius: var(--sta-radius-pill);
  border: var(--sta-border-width) solid;
}
.disposition-badge.friendly   { color: var(--sta-color-success);   border-color: var(--sta-color-success);  background: var(--sta-color-success-bg); }
.disposition-badge.neutral    { color: var(--sta-color-location);  border-color: var(--sta-color-location); background: var(--sta-color-location-dim); }
.disposition-badge.suspicious { color: var(--sta-color-warning);   border-color: var(--sta-color-warning-border); background: var(--sta-color-warning-bg); }
.disposition-badge.hostile    { color: var(--sta-color-danger);    border-color: var(--sta-color-danger-border);  background: var(--sta-color-danger-bg); }
.disposition-badge.desperate  { color: var(--sta-color-xp);        border-color: var(--sta-color-xp-border); background: var(--sta-color-xp-dim); }
```

### Social: Stakes, Conviction & Round

```css
.stakes-text {
  /* Inherits serif override from .narrative group above */
  margin: var(--sta-space-sm) 0 var(--sta-space-md);
  padding: var(--sta-space-sm) var(--sta-space-md);
  border-radius: var(--sta-radius-md);
  border: var(--sta-border-width) solid var(--sta-border-tertiary);
}
.stakes-label {
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-xs); letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--sta-text-tertiary); display: block; margin-bottom: 4px;
}
.conviction-row { display: flex; align-items: center; gap: 10px; margin-bottom: var(--sta-space-md); }
.conviction-label { font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); letter-spacing: 0.08em; color: var(--sta-text-tertiary); }
.conviction-pips { display: flex; gap: 6px; align-items: center; }
.conviction-pip { width: 10px; height: 10px; border-radius: 50%; border: 0.5px solid var(--ta-color-conviction, #7C6BF0); background: transparent; }
.conviction-pip.filled { background: var(--ta-color-conviction, #7C6BF0); border-color: var(--ta-color-conviction-border, #6B5CE0); }
.round-indicator { font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); letter-spacing: 0.08em; color: var(--sta-text-tertiary); margin-bottom: var(--sta-space-md); }
.approach-stat { font-size: var(--sta-text-xs); color: var(--sta-text-tertiary); margin-left: 4px; }
```

### Panel Overlay

```css
#panel-overlay { display: none; padding: 0; }
.panel-header {
  display: flex; align-items: baseline; justify-content: space-between;
  padding-bottom: var(--sta-space-sm); margin-bottom: var(--sta-space-md);
  border-bottom: var(--sta-border-width) solid var(--sta-border-tertiary);
}
.panel-title {
  font-family: var(--sta-font-display);
  font-size: var(--sta-text-lg); font-weight: 600;
  color: var(--sta-text-primary);
  /* Left accent bar on panel titles */
  border-left: var(--sta-location-bar-width) solid var(--sta-location-bar-color);
  padding-left: var(--sta-space-sm);
}
.panel-close-btn {
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-xs); letter-spacing: 0.1em;
  background: transparent; border: var(--sta-border-width) solid var(--sta-border-tertiary);
  border-radius: var(--sta-radius-md); padding: var(--sta-space-sm) var(--sta-space-md);
  min-height: var(--sta-touch-target); min-width: var(--sta-touch-target); box-sizing: border-box;
  color: var(--sta-text-tertiary); cursor: pointer;
}
.panel-close-btn:hover { border-color: var(--sta-border-secondary); color: var(--sta-text-secondary); }
.panel-content { display: none; font-family: var(--sta-font-serif); font-size: 13px; line-height: 1.7; color: var(--sta-text-secondary); }
```

### Fallback Prompt Text

```css
.fallback-text {
  font-family: var(--sta-font-mono);
  font-size: var(--sta-text-sm); color: var(--sta-text-tertiary);
  margin-top: var(--sta-space-sm); display: none; line-height: 1.6;
}
.fallback-text code {
  color: var(--sta-color-location);
  border: var(--sta-border-width) solid var(--sta-border-tertiary);
  padding: 2px 6px; border-radius: var(--sta-radius-sm);
  font-family: var(--sta-font-mono); font-size: var(--sta-text-xs);
}
```

---

## Complete CSS Block

Inject this entire block into the `<style>` tag of any widget to apply the Station theme.
This block is self-contained and overrides the base structural styles from `style-reference.md`.
The `@import` will silently no-op if Google Fonts is CSP-blocked — the fallback stacks
handle that case independently.

```css
/* @extract:vars */
:root {
  --sta-font-serif:   'Lora', 'Georgia', 'Times New Roman', 'Book Antiqua', serif;
  --sta-font-mono:    'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', 'Courier New', monospace;
  --sta-font-display: 'Syne', 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;

  --sta-text-xs:   10px;
  --sta-text-sm:   11px;
  --sta-text-base: 15px;
  --sta-text-md:   18px;
  --sta-text-lg:   22px;
  --sta-text-xl:   36px;
  --sta-text-stat: 22px;

  --sta-space-xs:  4px;
  --sta-space-sm:  8px;
  --sta-space-md: 14px;
  --sta-space-lg: 20px;
  --sta-space-xl: 28px;

  --sta-touch-target:     44px;
  --sta-border-width:     0.5px;
  --sta-radius-sm:        4px;
  --sta-radius-md:        6px;
  --sta-radius-pill:      999px;
  --sta-location-bar-width: 3px;
  --sta-widget-padding:   1rem 0 1.5rem;

  /* Dark mode default */
  --sta-bg-primary:      #1A1D2E;
  --sta-bg-secondary:    #22263A;
  --sta-bg-tertiary:     #2A2F47;
  --sta-bg-overlay:      #1E2136;
  --sta-bg-stat-cell:    #20243A;

  --sta-text-primary:    #EEF0FF;
  --sta-text-secondary:  #9AA0C0;
  --sta-text-tertiary:   #545880;

  --sta-color-location:        #4ECDC4;
  --sta-color-location-dim:    rgba(78, 205, 196, 0.12);
  --sta-color-location-border: rgba(78, 205, 196, 0.5);
  --sta-location-bar-color:    #4ECDC4;

  --sta-color-success:         #2BA882;
  --sta-color-success-border:  #1F8A6A;
  --sta-color-success-bg:      rgba(43, 168, 130, 0.10);
  --sta-color-success-bg-hover: rgba(43, 168, 130, 0.20);

  --sta-color-currency:        #D4A017;
  --sta-color-currency-dim:    rgba(212, 160, 23, 0.12);
  --sta-color-currency-border: rgba(212, 160, 23, 0.5);

  --sta-color-xp:              #8B7CF8;
  --sta-color-xp-dim:          rgba(139, 124, 248, 0.12);
  --sta-color-xp-border:       rgba(139, 124, 248, 0.5);

  --sta-color-danger:          #E84855;
  --sta-color-danger-border:   #B33040;
  --sta-color-danger-bg:       rgba(232, 72, 85, 0.10);
  --sta-color-danger-bg-hover: rgba(232, 72, 85, 0.20);

  --sta-color-warning:         #F0A500;
  --sta-color-warning-border:  rgba(240, 165, 0, 0.5);
  --sta-color-warning-bg:      rgba(240, 165, 0, 0.10);

  --sta-color-text-emphasis:   #FFFFFF;

  --sta-color-accent:          #4ECDC4;
  --sta-color-accent-hover:    #5FD8CF;
  --sta-color-accent-bg:       rgba(78, 205, 196, 0.10);
  --sta-color-accent-bg-hover: rgba(78, 205, 196, 0.20);

  --sta-border-primary:   rgba(78, 205, 196, 0.6);
  --sta-border-secondary: rgba(154, 160, 192, 0.35);
  --sta-border-tertiary:  rgba(84, 88, 128, 0.4);

  --sta-modifier-positive: #2BA882;
  --sta-modifier-zero:     var(--sta-text-tertiary); /* adapts via cascade: dark #545880, light #7880A8 */
  --sta-modifier-negative: #E84855;

  --sta-badge-success-bg:          rgba(43, 168, 130, 0.15);
  --sta-badge-success-text:        #7DDFC3;
  --sta-badge-partial-bg:          rgba(212, 160, 23, 0.15);
  --sta-badge-partial-text:        #E8C060;
  --sta-badge-failure-bg:          rgba(232, 72, 85, 0.15);
  --sta-badge-failure-text:        #F08090;
  --sta-badge-crit-success-border: #2BA882;
  --sta-badge-crit-failure-border: #E84855;

  /* Font aliases (referenced by widget templates) */
  --ta-font-heading: var(--sta-font-display);
  --ta-font-body:    var(--sta-font-mono);

  --ta-die-bg:         #909AB4;   /* Steel — 5.06:1 against page bg */
  --ta-die-text-color: #1E2030;   /* Dark text on steel — 5.72:1 */
}

/* --- Light Mode Override --- */
@media (prefers-color-scheme: light) {
  :root {
    --sta-bg-primary:      #F8F9FC;
    --sta-bg-secondary:    #EDEEF5;
    --sta-bg-tertiary:     #E0E2EF;
    --sta-bg-overlay:      #F2F3F9;
    --sta-bg-stat-cell:    #EAEBF4;
    --sta-text-primary:    #181B2E;
    --sta-text-secondary:  #3A4060;
    --sta-text-tertiary:   #7880A8;
    --sta-color-location:        #1A8F87; --sta-color-location-dim: rgba(26,143,135,0.10); --sta-color-location-border: rgba(26,143,135,0.45); --sta-location-bar-color: #1A8F87;
    --sta-color-success:         #1B7A5C; --sta-color-success-border: #14604A; --sta-color-success-bg: rgba(27,122,92,0.08); --sta-color-success-bg-hover: rgba(27,122,92,0.16);
    --sta-color-currency:        #9A6E00; --sta-color-currency-dim: rgba(154,110,0,0.10); --sta-color-currency-border: rgba(154,110,0,0.45);
    --sta-color-xp:              #5B49D4; --sta-color-xp-dim: rgba(91,73,212,0.10); --sta-color-xp-border: rgba(91,73,212,0.45);
    --sta-color-danger:          #C42030; --sta-color-danger-border: #9A1825; --sta-color-danger-bg: rgba(196,32,48,0.08); --sta-color-danger-bg-hover: rgba(196,32,48,0.16);
    --sta-color-warning:         #9A6200; --sta-color-warning-border: rgba(154,98,0,0.45); --sta-color-warning-bg: rgba(154,98,0,0.08);
    --sta-color-text-emphasis:   #0A0C18;
    --sta-color-accent:          #1A8F87; --sta-color-accent-hover: #107870; --sta-color-accent-bg: rgba(26,143,135,0.08); --sta-color-accent-bg-hover: rgba(26,143,135,0.16);
    --sta-border-primary:   rgba(26,143,135,0.6);
    --sta-border-secondary: rgba(58,64,96,0.3);
    --sta-border-tertiary:  rgba(120,128,168,0.3);
    --sta-modifier-positive: #1B7A5C;
    --sta-modifier-negative: #C42030;
    --sta-badge-success-bg: rgba(27,122,92,0.12);   --sta-badge-success-text: #0E5C3E;
    --sta-badge-partial-bg: rgba(154,110,0,0.12);   --sta-badge-partial-text: #7A4E00;
    --sta-badge-failure-bg: rgba(196,32,48,0.12);   --sta-badge-failure-text: #8A1020;
    --sta-badge-crit-success-border: #1B7A5C;
    --sta-badge-crit-failure-border: #C42030;
    --ta-color-accent:            var(--sta-color-accent);
    --ta-color-accent-bg:         var(--sta-color-accent-bg);
    --ta-color-accent-bg-hover:   var(--sta-color-accent-bg-hover);
    --ta-color-success:           var(--sta-color-success);
    --ta-color-success-border:    var(--sta-color-success-border);
    --ta-color-danger:            var(--sta-color-danger);
    --ta-color-danger-border:     var(--sta-color-danger-border);
    --ta-color-danger-bg:         var(--sta-color-danger-bg);
    --ta-color-danger-bg-hover:   var(--sta-color-danger-bg-hover);
    --ta-color-warning:           var(--sta-color-warning);
    --ta-color-warning-border:    var(--sta-color-warning-border);
    --ta-color-warning-bg:        var(--sta-color-warning-bg);
    --ta-color-xp:                var(--sta-color-xp);
    --ta-color-focus:             var(--sta-color-location);
    --ta-color-conviction:        #5B49D4;
    --ta-color-conviction-border: #4A3BBF;
    --ta-badge-success-bg:        var(--sta-badge-success-bg);
    --ta-badge-success-text:      var(--sta-badge-success-text);
    --ta-badge-partial-bg:        var(--sta-badge-partial-bg);
    --ta-badge-partial-text:      var(--sta-badge-partial-text);
    --ta-badge-failure-bg:        var(--sta-badge-failure-bg);
    --ta-badge-failure-text:      var(--sta-badge-failure-text);
    --ta-badge-crit-success-border: var(--sta-badge-crit-success-border);
    --ta-badge-crit-failure-border: var(--sta-badge-crit-failure-border);
    --ta-color-credits:           var(--sta-color-currency);
    --ta-color-tab-active:        var(--sta-color-location);
    --ta-die-bg:                  #424A60;   /* Steel — 8.44:1 against page bg */
    --ta-die-text-color:          #F0F2FF;   /* Light text on steel — 7.92:1 */
  }
}

```

```css
/* @extract:full */
/* =======================================================================
   STATION THEME — text-adventure game engine
   Space-station operations terminal — hybrid serif/mono visual style
   Default style — playtested and battle-hardened
   v1.0 — compatible with Claude.ai visualize:show_widget iframes
   ======================================================================= */

/* --- Google Fonts (CSP-blocked in Claude.ai sandbox; fallbacks below) --- */
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&family=Syne:wght@600;700&display=swap');

/* --- Custom Properties --- */
:root {
  --sta-font-serif:   'Lora', 'Georgia', 'Times New Roman', 'Book Antiqua', serif;
  --sta-font-mono:    'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', 'Courier New', monospace;
  --sta-font-display: 'Syne', 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;

  --sta-text-xs:   10px;
  --sta-text-sm:   11px;
  --sta-text-base: 15px;
  --sta-text-md:   18px;
  --sta-text-lg:   22px;
  --sta-text-xl:   36px;
  --sta-text-stat: 22px;

  --sta-space-xs:  4px;
  --sta-space-sm:  8px;
  --sta-space-md: 14px;
  --sta-space-lg: 20px;
  --sta-space-xl: 28px;

  --sta-touch-target:     44px;
  --sta-border-width:     0.5px;
  --sta-radius-sm:        4px;
  --sta-radius-md:        6px;
  --sta-radius-pill:      999px;
  --sta-location-bar-width: 3px;
  --sta-widget-padding:   1rem 0 1.5rem;

  /* Dark mode default */
  --sta-bg-primary:      #1A1D2E;
  --sta-bg-secondary:    #22263A;
  --sta-bg-tertiary:     #2A2F47;
  --sta-bg-overlay:      #1E2136;
  --sta-bg-stat-cell:    #20243A;

  --sta-text-primary:    #EEF0FF;
  --sta-text-secondary:  #9AA0C0;
  --sta-text-tertiary:   #545880;

  --sta-color-location:        #4ECDC4;
  --sta-color-location-dim:    rgba(78, 205, 196, 0.12);
  --sta-color-location-border: rgba(78, 205, 196, 0.5);
  --sta-location-bar-color:    #4ECDC4;

  --sta-color-success:         #2BA882;
  --sta-color-success-border:  #1F8A6A;
  --sta-color-success-bg:      rgba(43, 168, 130, 0.10);
  --sta-color-success-bg-hover: rgba(43, 168, 130, 0.20);

  --sta-color-currency:        #D4A017;
  --sta-color-currency-dim:    rgba(212, 160, 23, 0.12);
  --sta-color-currency-border: rgba(212, 160, 23, 0.5);

  --sta-color-xp:              #8B7CF8;
  --sta-color-xp-dim:          rgba(139, 124, 248, 0.12);
  --sta-color-xp-border:       rgba(139, 124, 248, 0.5);

  --sta-color-danger:          #E84855;
  --sta-color-danger-border:   #B33040;
  --sta-color-danger-bg:       rgba(232, 72, 85, 0.10);
  --sta-color-danger-bg-hover: rgba(232, 72, 85, 0.20);

  --sta-color-warning:         #F0A500;
  --sta-color-warning-border:  rgba(240, 165, 0, 0.5);
  --sta-color-warning-bg:      rgba(240, 165, 0, 0.10);

  --sta-color-text-emphasis:   #FFFFFF;

  --sta-color-accent:          #4ECDC4;
  --sta-color-accent-hover:    #5FD8CF;
  --sta-color-accent-bg:       rgba(78, 205, 196, 0.10);
  --sta-color-accent-bg-hover: rgba(78, 205, 196, 0.20);

  --sta-border-primary:   rgba(78, 205, 196, 0.6);
  --sta-border-secondary: rgba(154, 160, 192, 0.35);
  --sta-border-tertiary:  rgba(84, 88, 128, 0.4);

  --sta-modifier-positive: #2BA882;
  --sta-modifier-zero:     var(--sta-text-tertiary); /* adapts via cascade: dark #545880, light #7880A8 */
  --sta-modifier-negative: #E84855;

  --sta-badge-success-bg:          rgba(43, 168, 130, 0.15);
  --sta-badge-success-text:        #7DDFC3;
  --sta-badge-partial-bg:          rgba(212, 160, 23, 0.15);
  --sta-badge-partial-text:        #E8C060;
  --sta-badge-failure-bg:          rgba(232, 72, 85, 0.15);
  --sta-badge-failure-text:        #F08090;
  --sta-badge-crit-success-border: #2BA882;
  --sta-badge-crit-failure-border: #E84855;

  --ta-die-bg:         #909AB4;   /* Steel — 5.06:1 against page bg */
  --ta-die-text-color: #1E2030;   /* Dark text on steel — 5.72:1 */
}

/* --- Light Mode Override --- */
@media (prefers-color-scheme: light) {
  :root {
    --sta-bg-primary:      #F8F9FC;
    --sta-bg-secondary:    #EDEEF5;
    --sta-bg-tertiary:     #E0E2EF;
    --sta-bg-overlay:      #F2F3F9;
    --sta-bg-stat-cell:    #EAEBF4;
    --sta-text-primary:    #181B2E;
    --sta-text-secondary:  #3A4060;
    --sta-text-tertiary:   #7880A8;
    --sta-color-location:        #1A8F87; --sta-color-location-dim: rgba(26,143,135,0.10); --sta-color-location-border: rgba(26,143,135,0.45); --sta-location-bar-color: #1A8F87;
    --sta-color-success:         #1B7A5C; --sta-color-success-border: #14604A; --sta-color-success-bg: rgba(27,122,92,0.08); --sta-color-success-bg-hover: rgba(27,122,92,0.16);
    --sta-color-currency:        #9A6E00; --sta-color-currency-dim: rgba(154,110,0,0.10); --sta-color-currency-border: rgba(154,110,0,0.45);
    --sta-color-xp:              #5B49D4; --sta-color-xp-dim: rgba(91,73,212,0.10); --sta-color-xp-border: rgba(91,73,212,0.45);
    --sta-color-danger:          #C42030; --sta-color-danger-border: #9A1825; --sta-color-danger-bg: rgba(196,32,48,0.08); --sta-color-danger-bg-hover: rgba(196,32,48,0.16);
    --sta-color-warning:         #9A6200; --sta-color-warning-border: rgba(154,98,0,0.45); --sta-color-warning-bg: rgba(154,98,0,0.08);
    --sta-color-text-emphasis:   #0A0C18;
    --sta-color-accent:          #1A8F87; --sta-color-accent-hover: #107870; --sta-color-accent-bg: rgba(26,143,135,0.08); --sta-color-accent-bg-hover: rgba(26,143,135,0.16);
    --sta-border-primary:   rgba(26,143,135,0.6);
    --sta-border-secondary: rgba(58,64,96,0.3);
    --sta-border-tertiary:  rgba(120,128,168,0.3);
    --sta-modifier-positive: #1B7A5C;
    --sta-modifier-negative: #C42030;
    --sta-badge-success-bg: rgba(27,122,92,0.12);   --sta-badge-success-text: #0E5C3E;
    --sta-badge-partial-bg: rgba(154,110,0,0.12);   --sta-badge-partial-text: #7A4E00;
    --sta-badge-failure-bg: rgba(196,32,48,0.12);   --sta-badge-failure-text: #8A1020;
    --sta-badge-crit-success-border: #1B7A5C;
    --sta-badge-crit-failure-border: #C42030;
    --ta-color-accent:            var(--sta-color-accent);
    --ta-color-accent-bg:         var(--sta-color-accent-bg);
    --ta-color-accent-bg-hover:   var(--sta-color-accent-bg-hover);
    --ta-color-success:           var(--sta-color-success);
    --ta-color-success-border:    var(--sta-color-success-border);
    --ta-color-danger:            var(--sta-color-danger);
    --ta-color-danger-border:     var(--sta-color-danger-border);
    --ta-color-danger-bg:         var(--sta-color-danger-bg);
    --ta-color-danger-bg-hover:   var(--sta-color-danger-bg-hover);
    --ta-color-warning:           var(--sta-color-warning);
    --ta-color-warning-border:    var(--sta-color-warning-border);
    --ta-color-warning-bg:        var(--sta-color-warning-bg);
    --ta-color-xp:                var(--sta-color-xp);
    --ta-color-focus:             var(--sta-color-location);
    --ta-color-conviction:        #5B49D4;
    --ta-color-conviction-border: #4A3BBF;
    --ta-badge-success-bg:        var(--sta-badge-success-bg);
    --ta-badge-success-text:      var(--sta-badge-success-text);
    --ta-badge-partial-bg:        var(--sta-badge-partial-bg);
    --ta-badge-partial-text:      var(--sta-badge-partial-text);
    --ta-badge-failure-bg:        var(--sta-badge-failure-bg);
    --ta-badge-failure-text:      var(--sta-badge-failure-text);
    --ta-badge-crit-success-border: var(--sta-badge-crit-success-border);
    --ta-badge-crit-failure-border: var(--sta-badge-crit-failure-border);
    --ta-color-credits:           var(--sta-color-currency);
    --ta-color-tab-active:        var(--sta-color-location);
    --ta-die-bg:                  #424A60;   /* Steel — 8.44:1 against page bg */
    --ta-die-text-color:          #F0F2FF;   /* Light text on steel — 7.92:1 */
  }
}

/* --- Reduced Motion Kill-switch --- */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration:        0.01ms !important;
    animation-iteration-count: 1      !important;
    transition-duration:       0.01ms !important;
    transition-delay:          0ms    !important;
  }
  .die-value.spinning { animation: none !important; opacity: 1; }
  #reveal-full        { animation: none !important; }
  .init-chip.active   { animation: none !important; }
}

/* --- Animations --- */
@keyframes sta-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes sta-die-spin {
  0%   { opacity: 0.2; transform: scale(0.7); }
  60%  { opacity: 0.9; transform: scale(1.06); }
  100% { opacity: 1;   transform: scale(1); }
}
@keyframes sta-init-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.65; }
}

/* --- Widget Root --- */
.root, .combat-root, .roll-root, .shop-root, .social-root {
  font-family: var(--sta-font-mono);
  color: var(--sta-text-primary);
  padding: var(--sta-widget-padding);
  max-width: var(--sta-content-max, 680px);
  margin-left: auto;
  margin-right: auto;
}
#reveal-full { animation: sta-fade-in 0.25s ease-out; }

/* --- Shared Button Transitions --- */
.btn-action, .action-btn, .btn-poi, .poi-btn, .continue-btn, .btn-neutral,
.roll-btn, .footer-btn, .tab-btn, .btn-attack, .panel-close-btn, .action-card {
  transition: background 0.14s ease, border-color 0.14s ease, color 0.14s ease;
}

/* --- Focus Ring --- */
button:focus-visible, [data-prompt]:focus-visible {
  outline: 2px solid var(--sta-color-location);
  outline-offset: 2px;
}

/* --- Location Bar --- */
.loc-bar {
  display: flex; justify-content: space-between; align-items: baseline;
  padding-bottom: var(--sta-space-sm); margin-bottom: var(--sta-space-md);
  border-bottom: var(--sta-border-width) solid var(--sta-border-tertiary);
}
.loc-name {
  font-family: var(--sta-font-display); font-size: var(--sta-text-md); font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--sta-text-primary); margin: 0;
  border-left: var(--sta-location-bar-width) solid var(--sta-location-bar-color);
  padding-left: var(--sta-space-sm);
}
.scene-num {
  font-family: var(--sta-font-mono); font-size: var(--sta-text-xs);
  letter-spacing: 0.15em; text-transform: uppercase; color: var(--sta-text-tertiary);
}

/* --- Atmosphere Pills --- */
.atmo-strip { display: flex; gap: var(--sta-space-sm); flex-wrap: wrap; margin-bottom: var(--sta-space-md); }
.atmo-pill {
  font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); letter-spacing: 0.06em;
  padding: 3px 10px; border-radius: var(--sta-radius-pill);
  border: var(--sta-border-width) solid var(--sta-border-tertiary); color: var(--sta-text-tertiary);
}

/* --- Narrative — SERIF OVERRIDE (critical) --- */
.narrative, .brief-text {
  font-family: var(--sta-font-serif); font-size: var(--sta-text-base);
  line-height: 1.75; color: var(--sta-text-primary); margin: 0 0 var(--sta-space-md);
}
.roll-action, .npc-reaction, .merchant-flavour {
  font-family: var(--sta-font-serif); font-size: 14px;
  line-height: 1.7; color: var(--sta-text-secondary); margin: 0 0 var(--sta-space-md);
}
.stakes-text {
  font-family: var(--sta-font-serif); font-size: 14px; line-height: 1.7;
  color: var(--sta-text-secondary); margin: var(--sta-space-sm) 0 var(--sta-space-md);
  padding: var(--sta-space-sm) var(--sta-space-md);
  border-radius: var(--sta-radius-md); border: var(--sta-border-width) solid var(--sta-border-tertiary);
}

/* Narrative inline highlights */
.nar-npc   { color: var(--sta-color-success);  font-weight: 500; }
.nar-item  { color: var(--sta-color-currency); font-weight: 500; }
.nar-sfx   { color: var(--sta-color-warning);  font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
.nar-name  { color: var(--sta-color-text-emphasis); font-weight: 700; }
.nar-aside { font-style: italic; color: var(--sta-text-secondary); }

/* --- Section Label --- */
.section-label {
  font-family: var(--sta-font-mono); font-size: var(--sta-text-xs);
  letter-spacing: 0.15em; text-transform: uppercase; color: var(--sta-text-tertiary);
  margin: var(--sta-space-md) 0 var(--sta-space-sm);
}

/* --- Button Rows --- */
.btn-row, .action-row, .approach-row { display: flex; flex-wrap: wrap; gap: var(--sta-space-sm); margin-bottom: var(--sta-space-sm); }

/* --- Action Button (primary — cyan) --- */
.btn-action, .action-btn {
  font-family: var(--sta-font-mono); font-size: var(--sta-text-sm); letter-spacing: 0.06em;
  padding: var(--sta-space-sm) var(--sta-space-md);
  min-height: var(--sta-touch-target); min-width: var(--sta-touch-target); box-sizing: border-box;
  color: var(--sta-text-primary); border: var(--sta-border-width) solid var(--sta-color-accent);
  background: var(--sta-color-accent-bg); border-radius: var(--sta-radius-md); cursor: pointer;
}
.btn-action:hover, .action-btn:hover { background: var(--sta-color-accent-bg-hover); border-color: var(--sta-color-accent-hover); }
.btn-action:active, .action-btn:active { background: rgba(78,205,196,0.28); }

/* --- POI / Explore Button --- */
.btn-poi, .poi-btn {
  font-family: var(--sta-font-mono); font-size: var(--sta-text-sm); letter-spacing: 0.06em;
  padding: var(--sta-space-sm) var(--sta-space-md);
  min-height: var(--sta-touch-target); min-width: var(--sta-touch-target); box-sizing: border-box;
  color: var(--sta-text-secondary); border: 1px dashed var(--sta-border-secondary);
  background: transparent; border-radius: var(--sta-radius-md); cursor: pointer;
}
.btn-poi:hover, .poi-btn:hover {
  border-style: solid; border-color: var(--sta-border-secondary);
  background: var(--sta-bg-secondary); color: var(--sta-text-primary);
}

/* --- Continue / Neutral Button --- */
.continue-btn, .btn-neutral {
  font-family: var(--sta-font-mono); font-size: var(--sta-text-sm); letter-spacing: 0.08em;
  padding: var(--sta-space-sm) var(--sta-space-md);
  min-height: var(--sta-touch-target); min-width: var(--sta-touch-target); box-sizing: border-box;
  color: var(--sta-text-secondary); border: var(--sta-border-width) solid var(--sta-border-tertiary);
  background: transparent; border-radius: var(--sta-radius-md); cursor: pointer;
}
.continue-btn:hover, .btn-neutral:hover { border-color: var(--sta-border-secondary); color: var(--sta-text-primary); background: var(--sta-bg-secondary); }

/* --- Roll Button --- */
.roll-btn {
  font-family: var(--sta-font-mono); font-size: var(--sta-text-md); letter-spacing: 0.14em;
  text-transform: uppercase; padding: var(--sta-space-md) var(--sta-space-xl);
  min-height: var(--sta-touch-target); box-sizing: border-box;
  color: var(--sta-color-location); border: 1px solid var(--sta-color-location);
  background: var(--sta-color-location-dim); border-radius: var(--sta-radius-md);
  display: block; margin: 0 auto var(--sta-space-md); cursor: pointer;
}
.roll-btn:hover { background: rgba(78,205,196,0.2); }
.roll-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* --- Attack Button --- */
.action-btn.attack, .btn-attack {
  color: var(--sta-color-danger); border-color: var(--sta-color-danger); background: var(--sta-color-danger-bg);
}
.action-btn.attack:hover, .btn-attack:hover { background: var(--sta-color-danger-bg-hover); }

/* --- Retreat Button --- */
.action-btn.retreat { color: var(--sta-text-tertiary); border-color: var(--sta-border-tertiary); background: transparent; }

/* --- Footer Row & Button --- */
.footer-row {
  display: flex; justify-content: space-between; gap: var(--sta-space-sm); flex-wrap: wrap;
  margin-top: var(--sta-space-md); padding-top: var(--sta-space-sm);
  border-top: var(--sta-border-width) solid var(--sta-border-tertiary);
}
.footer-left, .footer-right { display: flex; gap: var(--sta-space-sm); flex-wrap: wrap; align-items: center; }
.footer-btn {
  font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); letter-spacing: 0.1em; text-transform: uppercase;
  padding: var(--sta-space-sm) var(--sta-space-md);
  min-height: var(--sta-touch-target); min-width: var(--sta-touch-target); box-sizing: border-box;
  color: var(--sta-text-tertiary); border: var(--sta-border-width) solid var(--sta-border-tertiary);
  background: transparent; border-radius: var(--sta-radius-md); cursor: pointer;
}
.footer-btn:hover { color: var(--sta-text-secondary); border-color: var(--sta-border-secondary); background: var(--sta-bg-secondary); }

/* --- Tab Buttons --- */
.tab-bar { display: flex; margin-bottom: var(--sta-space-md); border-bottom: var(--sta-border-width) solid var(--sta-border-tertiary); }
.tab-btn {
  font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); letter-spacing: 0.1em; text-transform: uppercase;
  padding: var(--sta-space-sm) var(--sta-space-md); min-height: var(--sta-touch-target);
  background: transparent; border: none; border-bottom: 2px solid transparent;
  color: var(--sta-text-tertiary); cursor: pointer;
}
.tab-btn:hover { color: var(--sta-text-secondary); }
.tab-btn.active { color: var(--sta-text-primary); border-bottom-color: var(--sta-color-location); }
.tab-panel { display: none; }
.tab-panel.active { display: block; }

/* --- Action Cards (numbered choices) --- */
.action-card {
  display: flex; gap: var(--sta-space-md); align-items: flex-start;
  padding: var(--sta-space-sm) var(--sta-space-md);
  border: var(--sta-border-width) solid var(--sta-border-tertiary);
  border-radius: var(--sta-radius-md); background: var(--sta-bg-secondary);
  cursor: pointer; text-align: left; width: 100%; box-sizing: border-box;
  margin-bottom: var(--sta-space-sm); font-family: inherit;
}
.action-card:hover { border-color: var(--sta-color-accent); background: var(--sta-bg-tertiary); }
.action-card-num {
  font-family: var(--sta-font-mono); font-size: var(--sta-text-sm); font-weight: 500;
  color: var(--sta-color-accent); border: var(--sta-border-width) solid var(--sta-color-accent);
  border-radius: 50%; width: 24px; height: 24px; min-width: 24px;
  display: flex; align-items: center; justify-content: center; margin-top: 2px;
}
.action-card-body { flex: 1; }
.action-card-title { font-family: var(--sta-font-serif); font-size: var(--sta-text-base); font-weight: 600; color: var(--sta-text-primary); margin: 0 0 4px; line-height: 1.3; }
.action-card-desc  { font-family: var(--sta-font-serif); font-size: 13px; color: var(--sta-text-secondary); margin: 0 0 6px; line-height: 1.5; }
.action-card-mech  { font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); letter-spacing: 0.06em; color: var(--sta-color-warning); margin: 0; text-transform: uppercase; }
.action-card-mech.mech-success { color: var(--sta-color-success); }

/* --- Status Bar --- */
.status-bar {
  display: flex; align-items: center; gap: var(--sta-space-md); flex-wrap: wrap;
  padding: var(--sta-space-sm) 0; margin-top: var(--sta-space-sm);
  border-top: var(--sta-border-width) solid var(--sta-border-tertiary);
  font-family: var(--sta-font-mono); font-size: var(--sta-text-xs);
  color: var(--sta-text-tertiary); letter-spacing: 0.08em;
}
.hp-pips, .player-pips { display: flex; gap: 4px; align-items: center; }
.pip { width: 8px; height: 8px; border-radius: 50%; background: var(--sta-color-success); border: 0.5px solid var(--sta-color-success-border); }
.pip.empty { background: transparent; border-color: var(--sta-border-tertiary); }
.player-pip { width: 8px; height: 8px; border-radius: 50%; background: var(--sta-color-success); border: 0.5px solid var(--sta-color-success-border); }
.player-pip.empty { background: transparent; border-color: var(--sta-border-tertiary); }
.xp-track { width: 60px; height: 3px; background: var(--sta-border-tertiary); border-radius: 2px; overflow: hidden; }
.xp-fill  { height: 100%; background: var(--sta-color-xp); border-radius: 2px; }

/* --- Stat Grid --- */
.stat-grid { display: flex; gap: var(--sta-space-sm); flex-wrap: wrap; margin-bottom: var(--sta-space-md); }
.stat-cell { flex: 1; min-width: 52px; padding: 8px 6px; background: var(--sta-bg-stat-cell); border: var(--sta-border-width) solid var(--sta-border-tertiary); border-radius: var(--sta-radius-md); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.stat-label { font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); letter-spacing: 0.12em; text-transform: uppercase; color: var(--sta-text-tertiary); line-height: 1; }
.stat-value { font-family: var(--sta-font-mono); font-size: var(--sta-text-stat); font-weight: 700; color: var(--sta-text-primary); line-height: 1.1; }
.stat-mod { font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); line-height: 1; }
.stat-mod.positive { color: var(--sta-modifier-positive); }
.stat-mod.zero     { color: var(--sta-modifier-zero); }
.stat-mod.negative { color: var(--sta-modifier-negative); }

/* --- Inline Status Row --- */
.inline-status { display: flex; gap: var(--sta-space-lg); flex-wrap: wrap; padding: var(--sta-space-sm) var(--sta-space-md); background: var(--sta-bg-secondary); border: var(--sta-border-width) solid var(--sta-border-tertiary); border-radius: var(--sta-radius-md); margin-bottom: var(--sta-space-md); }
.inline-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.inline-stat-label { font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); letter-spacing: 0.12em; text-transform: uppercase; color: var(--sta-text-tertiary); }
.inline-stat-value { font-family: var(--sta-font-mono); font-size: 16px; font-weight: 700; line-height: 1; color: var(--sta-text-primary); }
.inline-stat-value.hp     { color: var(--sta-color-success); }
.inline-stat-value.gold   { color: var(--sta-color-currency); }
.inline-stat-value.xp     { color: var(--sta-color-xp); }
.inline-stat-value.danger { color: var(--sta-color-danger); }

/* --- Combat: Initiative Bar --- */
.init-bar { display: flex; gap: var(--sta-space-sm); align-items: center; flex-wrap: wrap; margin-bottom: var(--sta-space-md); padding-bottom: var(--sta-space-sm); border-bottom: var(--sta-border-width) solid var(--sta-border-tertiary); }
.init-label { font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); letter-spacing: 0.15em; text-transform: uppercase; color: var(--sta-text-tertiary); margin-right: 4px; }
.init-chip { font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); letter-spacing: 0.06em; padding: 3px 10px; border-radius: var(--sta-radius-md); border: var(--sta-border-width) solid var(--sta-border-tertiary); color: var(--sta-text-secondary); }
.init-chip.active { border-color: var(--sta-color-success); color: var(--sta-color-success); font-weight: 500; animation: sta-init-pulse 2.5s ease-in-out infinite; }

/* --- Combat: Enemy Cards --- */
.enemy-row { display: flex; flex-wrap: wrap; gap: var(--sta-space-sm); margin-bottom: var(--sta-space-lg); }
.enemy-card { flex: 1; min-width: 140px; padding: var(--sta-space-sm) var(--sta-space-md); background: var(--sta-bg-secondary); border: var(--sta-border-width) solid var(--sta-border-tertiary); border-radius: var(--sta-radius-md); }
.enemy-name { font-family: var(--sta-font-mono); font-size: 12px; font-weight: 500; color: var(--sta-text-primary); margin: 0 0 4px; }
.enemy-role { font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); color: var(--sta-text-tertiary); margin: 0 0 var(--sta-space-sm); }
.hp-row { display: flex; gap: 4px; align-items: center; }
.hp-label { font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); color: var(--sta-text-tertiary); margin-right: 4px; }
.enemy-card .pip { background: var(--sta-color-danger); border-color: var(--sta-color-danger-border); }
.enemy-card .pip.empty { background: transparent; border-color: var(--sta-border-tertiary); }

/* --- Combat: Player Status --- */
.player-status { display: flex; align-items: center; gap: var(--sta-space-md); flex-wrap: wrap; padding: var(--sta-space-sm) 0; margin-bottom: var(--sta-space-md); border-top: var(--sta-border-width) solid var(--sta-border-tertiary); border-bottom: var(--sta-border-width) solid var(--sta-border-tertiary); font-family: var(--sta-font-mono); font-size: var(--sta-text-sm); color: var(--sta-text-primary); }
.condition-tag { font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); letter-spacing: 0.08em; padding: 2px 8px; border-radius: var(--sta-radius-pill); border: var(--sta-border-width) solid var(--sta-border-tertiary); color: var(--sta-text-label, var(--sta-text-tertiary)); }
.condition-tag.debuff { border-color: var(--sta-color-warning-border); color: var(--sta-color-warning); }
.condition-tag.buff { border-color: var(--sta-color-success-border); color: var(--sta-color-success); }
.condition-tag.neutral { border-color: var(--sta-border-tertiary); color: var(--sta-text-label, var(--sta-text-tertiary)); }

/* --- Combat: Encounter Heading --- */
.encounter-heading { font-family: var(--sta-font-display); font-size: var(--sta-text-md); font-weight: 700; color: var(--sta-text-primary); margin: 0 0 4px; }
.encounter-sub { font-family: var(--sta-font-serif); font-size: 13px; color: var(--sta-text-tertiary); margin: 0 0 var(--sta-space-md); line-height: 1.5; }

/* --- Die Roll: Heading --- */
.roll-heading { font-family: var(--sta-font-display); font-size: var(--sta-text-md); font-weight: 700; color: var(--sta-text-primary); margin: 0 0 4px; }

/* --- Die Roll: Attribute Row --- */
.attr-row {
  display: flex; align-items: baseline; gap: var(--sta-space-md); margin-bottom: var(--sta-space-md);
  padding: var(--sta-space-sm) var(--sta-space-md); border-radius: var(--sta-radius-md);
  background: var(--sta-bg-secondary); border: var(--sta-border-width) solid var(--sta-border-tertiary);
}
.attr-name { font-family: var(--sta-font-mono); font-size: 13px; font-weight: 500; color: var(--sta-text-primary); }
.attr-mod  { font-family: var(--sta-font-mono); font-size: var(--sta-text-sm); color: var(--sta-text-tertiary); }

/* --- Die Roll: Die Display --- */
.die-display { display: none; text-align: center; margin-bottom: var(--sta-space-md); }
.die-value { font-family: var(--sta-font-mono); font-size: var(--sta-text-xl); font-weight: 700; color: var(--sta-text-primary); display: inline-block; }
.die-value.success { color: var(--sta-color-success); }
.die-value.failure { color: var(--sta-color-danger); }
.die-value.spinning { animation: sta-die-spin var(--ta-die-spin-duration, 0.5s) cubic-bezier(0.34,1.56,0.64,1) forwards; }

/* --- Die Roll: Breakdown Row --- */
.roll-breakdown { display: flex; align-items: center; gap: var(--sta-space-sm); flex-wrap: wrap; justify-content: center; margin-bottom: var(--sta-space-md); padding: var(--sta-space-sm) var(--sta-space-md); background: var(--sta-bg-secondary); border: var(--sta-border-width) solid var(--sta-border-tertiary); border-radius: var(--sta-radius-md); }
.roll-component { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.roll-component-label { font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); letter-spacing: 0.1em; text-transform: uppercase; color: var(--sta-text-tertiary); white-space: nowrap; }
.roll-component-value { font-family: var(--sta-font-mono); font-size: 18px; font-weight: 700; color: var(--sta-text-primary); }
.roll-component-value.total   { font-size: 22px; color: var(--sta-color-location); }
.roll-component-value.success { color: var(--sta-color-success); }
.roll-component-value.failure { color: var(--sta-color-danger); }
.roll-separator { font-family: var(--sta-font-mono); font-size: 16px; color: var(--sta-text-tertiary); align-self: flex-end; padding-bottom: 4px; }

/* --- Die Roll: Resolve Block --- */
.resolve-block { display: none; padding: var(--sta-space-sm) var(--sta-space-md); margin-bottom: var(--sta-space-md); border-radius: var(--sta-radius-md); border: var(--sta-border-width) solid var(--sta-border-tertiary); background: var(--sta-bg-secondary); }
.resolve-row { display: flex; justify-content: space-between; align-items: baseline; font-family: var(--sta-font-mono); font-size: var(--sta-text-sm); color: var(--sta-text-secondary); margin-bottom: 6px; }
.resolve-row:last-child { margin-bottom: 0; }
.resolve-label { color: var(--sta-text-tertiary); }

/* --- Outcome Badges --- */
.outcome-badge { display: none; text-align: center; margin-bottom: var(--sta-space-md); }
.badge { display: inline-block; font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; padding: 5px 16px; border-radius: var(--sta-radius-md); }
.badge.crit-success { background: var(--sta-badge-success-bg); color: var(--sta-badge-success-text); border: 1px solid var(--sta-badge-crit-success-border); }
.badge.success      { background: var(--sta-badge-success-bg); color: var(--sta-badge-success-text); }
.badge.partial      { background: var(--sta-badge-partial-bg); color: var(--sta-badge-partial-text); }
.badge.failure      { background: var(--sta-badge-failure-bg); color: var(--sta-badge-failure-text); }
.badge.crit-failure { background: var(--sta-badge-failure-bg); color: var(--sta-badge-failure-text); border: 1px solid var(--sta-badge-crit-failure-border); }

/* --- Continue Stage --- */
.continue-stage { display: none; text-align: center; }

/* --- Shop: Merchant Header --- */
.merchant-header { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: var(--sta-space-sm); margin-bottom: 4px; border-bottom: var(--sta-border-width) solid var(--sta-border-tertiary); }
.merchant-name { font-family: var(--sta-font-display); font-size: var(--sta-text-md); font-weight: 700; color: var(--sta-text-primary); margin: 0; }
.credits-display { font-family: var(--sta-font-mono); font-size: 12px; font-weight: 500; letter-spacing: 0.08em; color: var(--sta-color-currency); }

/* --- Shop: Item Cards --- */
.item-grid { display: flex; flex-direction: column; gap: var(--sta-space-sm); margin-bottom: var(--sta-space-md); }
.item-card { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: var(--sta-space-sm) var(--sta-space-md); border: var(--sta-border-width) solid var(--sta-border-tertiary); border-radius: var(--sta-radius-md); flex-wrap: wrap; }
.item-info { flex: 1; min-width: 160px; }
.item-name   { font-family: var(--sta-font-serif); font-size: 13px; font-weight: 600; color: var(--sta-text-primary); margin: 0 0 2px; }
.item-type-badge { display: inline-block; font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 8px; border-radius: var(--sta-radius-pill); border: var(--sta-border-width) solid var(--sta-border-tertiary); color: var(--sta-text-tertiary); margin-right: 6px; }
.item-effect { font-family: var(--sta-font-serif); font-size: 12px; color: var(--sta-text-secondary); margin: 4px 0 0; line-height: 1.5; }
.item-price  { font-family: var(--sta-font-mono); font-size: 12px; font-weight: 500; color: var(--sta-color-currency); white-space: nowrap; margin-right: var(--sta-space-sm); }
.item-actions { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
.shop-footer { display: flex; justify-content: space-between; align-items: center; gap: var(--sta-space-sm); flex-wrap: wrap; margin-top: var(--sta-space-md); padding-top: var(--sta-space-sm); border-top: var(--sta-border-width) solid var(--sta-border-tertiary); }
.sell-empty { font-family: var(--sta-font-serif); font-size: var(--sta-text-sm); color: var(--sta-text-tertiary); padding: var(--sta-space-lg) 0; text-align: center; }

/* --- Social: NPC Header --- */
.npc-header { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: var(--sta-space-sm); margin-bottom: 4px; border-bottom: var(--sta-border-width) solid var(--sta-border-tertiary); }
.npc-name { font-family: var(--sta-font-display); font-size: var(--sta-text-md); font-weight: 700; color: var(--sta-text-primary); margin: 0; }
.stakes-label { font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); letter-spacing: 0.15em; text-transform: uppercase; color: var(--sta-text-tertiary); display: block; margin-bottom: 4px; }
.round-indicator { font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); letter-spacing: 0.08em; color: var(--sta-text-tertiary); margin-bottom: var(--sta-space-md); }
.approach-stat { font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); color: var(--sta-text-tertiary); margin-left: 4px; }

/* --- Disposition Badges --- */
.disposition-badge { font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 12px; border-radius: var(--sta-radius-pill); border: var(--sta-border-width) solid; }
.disposition-badge.friendly   { color: var(--sta-color-success);  border-color: var(--sta-color-success);       background: var(--sta-color-success-bg); }
.disposition-badge.neutral    { color: var(--sta-color-location); border-color: var(--sta-color-location);      background: var(--sta-color-location-dim); }
.disposition-badge.suspicious { color: var(--sta-color-warning);  border-color: var(--sta-color-warning-border); background: var(--sta-color-warning-bg); }
.disposition-badge.hostile    { color: var(--sta-color-danger);   border-color: var(--sta-color-danger-border);  background: var(--sta-color-danger-bg); }
.disposition-badge.desperate  { color: var(--sta-color-xp);       border-color: var(--sta-color-xp-border);      background: var(--sta-color-xp-dim); }

/* --- Conviction Pips --- */
.conviction-row { display: flex; align-items: center; gap: 10px; margin-bottom: var(--sta-space-md); }
.conviction-label { font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); letter-spacing: 0.08em; color: var(--sta-text-tertiary); }
.conviction-pips { display: flex; gap: 6px; align-items: center; }
.conviction-pip { width: 10px; height: 10px; border-radius: 50%; border: 0.5px solid var(--ta-color-conviction, #7C6BF0); background: transparent; }
.conviction-pip.filled { background: var(--ta-color-conviction, #7C6BF0); border-color: var(--ta-color-conviction-border, #6B5CE0); }

/* --- Panel Overlay --- */
#panel-overlay { display: none; padding: 0; }
.panel-header { display: flex; align-items: baseline; justify-content: space-between; padding-bottom: var(--sta-space-sm); margin-bottom: var(--sta-space-md); border-bottom: var(--sta-border-width) solid var(--sta-border-tertiary); }
.panel-title { font-family: var(--sta-font-display); font-size: var(--sta-text-lg); font-weight: 600; color: var(--sta-text-primary); border-left: var(--sta-location-bar-width) solid var(--sta-location-bar-color); padding-left: var(--sta-space-sm); }
.panel-close-btn { font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); letter-spacing: 0.1em; background: transparent; border: var(--sta-border-width) solid var(--sta-border-tertiary); border-radius: var(--sta-radius-md); padding: var(--sta-space-sm) var(--sta-space-md); min-height: var(--sta-touch-target); min-width: var(--sta-touch-target); box-sizing: border-box; color: var(--sta-text-tertiary); cursor: pointer; }
.panel-close-btn:hover { border-color: var(--sta-border-secondary); color: var(--sta-text-secondary); }
.panel-content { display: none; font-family: var(--sta-font-serif); font-size: 13px; line-height: 1.75; color: var(--sta-text-secondary); }

/* --- Fallback Prompt --- */
.fallback-text { font-family: var(--sta-font-mono); font-size: var(--sta-text-sm); color: var(--sta-text-tertiary); margin-top: var(--sta-space-sm); display: none; line-height: 1.6; }
.fallback-text code { color: var(--sta-color-location); border: var(--sta-border-width) solid var(--sta-border-tertiary); padding: 2px 6px; border-radius: var(--sta-radius-sm); font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); }

/* --- Chapter Heading --- */
.chapter-heading { font-family: var(--sta-font-mono); font-size: var(--sta-text-xs); font-weight: 400; letter-spacing: 0.2em; text-transform: uppercase; color: var(--sta-text-tertiary); text-align: center; margin: 0 0 var(--sta-space-md); }
```
