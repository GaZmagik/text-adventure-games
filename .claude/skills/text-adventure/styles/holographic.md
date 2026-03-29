---
name: holographic
description: >
  Translucent iridescent sci-fi HUD aesthetic — floating glass panels in deep space.
  Shifting cyan-teal-lavender-pink palette, glassmorphism surfaces, geometric sans-serif
  typography, and subtle shimmer animations. Primary dark mode; full light mode support.
best-for:
  - space opera
  - sci-fi RPG
  - cyberpunk
  - space station / ship scenarios
  - tactical overlay aesthetic
  - any scenario where a "holographic display" framing enhances immersion
---

## Design Philosophy

The holographic style renders every widget as a panel in a floating tactical display —
the kind of translucent readout you might see projected above a starship console or
embedded in an augmented-reality visor. Surfaces are semi-transparent, light bleeds
through from behind, and colour does not fill space so much as outline it.

The palette shifts iridescently between cyan, teal, lavender, and pale pink. These
colours are never applied as flat fills; they live in borders, glows, text accents,
and gradient overlays. The underlying background — deep space or pale void — always
shows through. This creates a sense of depth: panels feel like they are floating a few
centimetres in front of the scene, not pasted on top of it.

Typography follows the same logic. Headings use a geometric, slightly futuristic
sans-serif (Exo 2 or Orbitron with system-ui fallbacks). Body text is light weight
(300–400) and slightly transparent, creating the impression that text is being
projected rather than printed. Monospaced fonts handle all numerical and mechanical
data, as though the system is displaying live sensor readings.

The overall reference points: the minority report gesture UI, LCARS-adjacent overlays,
holographic mission briefings, and the aesthetic shorthand of "advanced civilisation
has a very clean interface that shows you exactly what you need and nothing more."

---

## Typography

### Font Stacks

```
Headings (h1–h3, .loc-bar, .panel-title, .widget-title):
  'Exo 2', 'Orbitron', 'Rajdhani', ui-sans-serif, system-ui, -apple-system, sans-serif

Subheadings (h4–h6, labels, badges, atmo pills):
  'Exo 2', ui-sans-serif, system-ui, -apple-system, sans-serif

Body / narrative prose:
  ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif

Monospace (stats, dice values, XP counters, code):
  'Share Tech Mono', 'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', monospace
```

### Sizing Scale

```
--holo-text-xs:   10px   /* badges, labels, tertiary info */
--holo-text-sm:   12px   /* secondary body, atmo pills */
--holo-text-base: 14px   /* primary body, narrative */
--holo-text-md:   16px   /* subheadings, panel titles */
--holo-text-lg:   20px   /* section headings, loc bar */
--holo-text-xl:   26px   /* hero headings */
```

### Weight Usage

```
300 — body prose (light, projected feel)
400 — UI labels, button text, secondary info
500 — subheadings, panel titles
600 — headings (h1–h3), location bar
700 — reserved for critical alerts and roll results only
```

---

## Colour Palette

All values are defined as CSS custom properties on `:host` and overridden per
colour scheme. Properties prefixed `--holo-` are theme-specific. Properties
named `--color-*` shadow the Claude.ai host variables, providing holographic
overrides for the base engine's structural selectors.

### Iridescent Accent Colours (scheme-independent)

These are the "holographic light" colours — used for borders, glows, and text
accents regardless of light/dark mode:

```css
--holo-cyan:          #00E5FF   /* primary accent — most borders, active states */
--holo-teal:          #00BFA5   /* secondary accent — success, progress, pips */
--holo-lavender:      #B388FF   /* tertiary accent — mystery, special, roll crits */
--holo-pink:          #FF80AB   /* quaternary accent — danger, critical failure */
--holo-cyan-dim:      rgba(0, 229, 255, 0.35)
--holo-teal-dim:      rgba(0, 191, 165, 0.35)
--holo-lavender-dim:  rgba(179, 136, 255, 0.30)
--holo-pink-dim:      rgba(255, 128, 171, 0.35)
```

### Dark Mode (Primary — Deep Space)

```css
/* Backgrounds */
--holo-bg-base:        #050510          /* page / widget root */
--holo-bg-panel:       rgba(255, 255, 255, 0.05)   /* panel surface */
--holo-bg-panel-hover: rgba(255, 255, 255, 0.08)
--holo-bg-inset:       rgba(0, 0, 0, 0.30)         /* inset wells, code blocks */
--holo-bg-btn:         rgba(0, 229, 255, 0.08)
--holo-bg-btn-hover:   rgba(0, 229, 255, 0.18)
--holo-bg-btn-active:  rgba(0, 229, 255, 0.28)

/* Text */
--holo-text-primary:   rgba(220, 240, 255, 0.92)   /* main body */
--holo-text-secondary: rgba(180, 210, 240, 0.70)   /* secondary info */
--holo-text-tertiary:  rgba(140, 180, 220, 0.50)   /* labels, placeholders */
--holo-text-accent:    #00E5FF                      /* highlighted / active */
--holo-text-success:   #00BFA5
--holo-text-danger:    #FF80AB
--holo-text-crit:      #B388FF

/* Borders */
--holo-border-primary:   rgba(0, 229, 255, 0.55)   /* main panel borders */
--holo-border-secondary: rgba(0, 229, 255, 0.25)   /* inner dividers */
--holo-border-tertiary:  rgba(255, 255, 255, 0.10) /* subtle separators */
--holo-border-glow:      rgba(0, 229, 255, 0.80)   /* focus / active glow */

/* Shadows / glows */
--holo-shadow-panel: 0 0 24px rgba(0, 229, 255, 0.10),
                     0 8px 32px rgba(0, 0, 0, 0.60),
                     inset 0 1px 0 rgba(255, 255, 255, 0.06);
--holo-shadow-btn:   0 0 12px rgba(0, 229, 255, 0.20),
                     0 2px 8px rgba(0, 0, 0, 0.40);
--holo-shadow-glow:  0 0 20px rgba(0, 229, 255, 0.50),
                     0 0 40px rgba(0, 229, 255, 0.20);

/* Semantic overrides (shadow the Claude.ai host variables) */
--color-text-primary:        var(--holo-text-primary);
--color-text-secondary:      var(--holo-text-secondary);
--color-text-tertiary:       var(--holo-text-tertiary);
--color-background:          var(--holo-bg-base);
--color-background-secondary: var(--holo-bg-panel);
--color-border-primary:      var(--holo-border-primary);
--color-border-secondary:    var(--holo-border-secondary);
--color-border-tertiary:     var(--holo-border-tertiary);
```

### Light Mode (Secondary — Pale Void)

```css
/* Backgrounds */
--holo-bg-base:        #F0F0F5
--holo-bg-panel:       rgba(0, 0, 0, 0.03)
--holo-bg-panel-hover: rgba(0, 0, 0, 0.06)
--holo-bg-inset:       rgba(0, 0, 0, 0.06)
--holo-bg-btn:         rgba(0, 163, 184, 0.08)
--holo-bg-btn-hover:   rgba(0, 163, 184, 0.16)
--holo-bg-btn-active:  rgba(0, 163, 184, 0.26)

/* Text (must meet WCAG AA 4.5:1 against #F0F0F5) */
--holo-text-primary:   rgba(10, 20, 40, 0.90)     /* #121E36 effective — 9.2:1 */
--holo-text-secondary: rgba(10, 30, 60, 0.68)     /* ~5.2:1 */
--holo-text-tertiary:  rgba(10, 30, 60, 0.48)     /* 3.8:1 — use for decoration only */
--holo-text-accent:    #007A8C                     /* teal darkened for light bg — 5.1:1 */
--holo-text-success:   #007A6A                     /* 5.4:1 */
--holo-text-danger:    #C0004A                     /* 5.6:1 */
--holo-text-crit:      #6200C8                     /* 6.1:1 */

/* Borders */
--holo-border-primary:   rgba(0, 163, 184, 0.50)
--holo-border-secondary: rgba(0, 163, 184, 0.25)
--holo-border-tertiary:  rgba(0, 0, 0, 0.10)
--holo-border-glow:      rgba(0, 163, 184, 0.80)

/* Shadows / glows */
--holo-shadow-panel: 0 0 20px rgba(0, 163, 184, 0.08),
                     0 4px 20px rgba(0, 0, 0, 0.10),
                     inset 0 1px 0 rgba(255, 255, 255, 0.80);
--holo-shadow-btn:   0 0 8px rgba(0, 163, 184, 0.15),
                     0 2px 6px rgba(0, 0, 0, 0.10);
--holo-shadow-glow:  0 0 16px rgba(0, 163, 184, 0.40),
                     0 0 32px rgba(0, 163, 184, 0.15);
```

---

## Spacing & Layout

```css
--holo-space-xs:  4px
--holo-space-sm:  8px
--holo-space-md:  14px
--holo-space-lg:  20px
--holo-space-xl:  32px
--holo-space-2xl: 48px

/* Widget root padding — enough breathing room so panels feel floating */
--holo-widget-padding: 20px 20px 24px;

/* Panel content padding */
--holo-panel-padding: var(--holo-space-lg);

/* Touch target floor — all interactive elements must meet this */
--holo-touch-target: 44px;

/* Max content width within a widget */
--holo-content-max-width: 680px;
```

Panels use `display: flex; flex-direction: column; gap: var(--holo-space-md)` as
their primary layout. Row elements (atmo pills, badge rows, stat grids) use
`display: flex; flex-wrap: wrap; gap: var(--holo-space-sm)`.

The widget root (`.root`) uses `max-width: var(--holo-content-max-width); margin: 0 auto`
to keep content centred in wide iframe contexts.

---

## Borders & Surfaces

### Panel Surfaces

All panels — scene content, overlays, info cards — use glassmorphism:

```css
background: var(--holo-bg-panel);
border: 1px solid var(--holo-border-primary);
border-radius: 8px;
box-shadow: var(--holo-shadow-panel);
backdrop-filter: blur(12px) saturate(160%);

/* Solid-colour fallback for contexts where backdrop-filter is unsupported */
/* (iframe sandboxing, some Chromium contexts without GPU compositing) */
@supports not (backdrop-filter: blur(1px)) {
  background: #0a0a20;   /* dark mode solid fallback */
}
@media (prefers-color-scheme: light) {
  @supports not (backdrop-filter: blur(1px)) {
    background: #eaeaf2;  /* light mode solid fallback */
  }
}
```

### Iridescent Gradient Borders

For premium elements (location bar, outcome badge, crit roll display), use a
gradient border via `border-image`. Note: `border-image` cannot combine with
`border-radius` — use the pseudo-element technique instead:

```css
/* Technique: inset box-shadow produces a coloured inner border */
.holo-border-iridescent {
  box-shadow: inset 0 0 0 1px transparent,
              var(--holo-shadow-panel);
  background-clip: padding-box;
  /* Gradient border via outline trick — gradient applied to ::before */
  position: relative;
}
.holo-border-iridescent::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    135deg,
    var(--holo-cyan)    0%,
    var(--holo-teal)    33%,
    var(--holo-lavender) 66%,
    var(--holo-pink)    100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box,
                linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

### Dividers

```css
border-bottom: 1px solid var(--holo-border-secondary);

/* Gradient divider (more prominent sections) */
background: linear-gradient(
  90deg,
  transparent 0%,
  var(--holo-cyan-dim) 20%,
  var(--holo-teal-dim) 50%,
  var(--holo-lavender-dim) 80%,
  transparent 100%
);
height: 1px;
border: none;
```

---

## Interactive Elements

### Buttons (General)

All buttons use the glassmorphism pattern. Base state:

```css
.holo-btn {
  font-family: 'Exo 2', ui-sans-serif, system-ui, sans-serif;
  font-size: var(--holo-text-sm);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--holo-text-accent);
  background: var(--holo-bg-btn);
  border: 1px solid var(--holo-border-secondary);
  border-radius: 6px;
  padding: 10px 18px;
  min-height: var(--holo-touch-target);
  min-width: var(--holo-touch-target);
  box-sizing: border-box;
  cursor: pointer;
  transition: background 150ms ease,
              border-color 150ms ease,
              box-shadow 150ms ease,
              color 150ms ease;
  backdrop-filter: blur(6px);
  box-shadow: var(--holo-shadow-btn);
}
```

Hover:
```css
.holo-btn:hover {
  background: var(--holo-bg-btn-hover);
  border-color: var(--holo-border-primary);
  color: var(--holo-cyan);
  box-shadow: var(--holo-shadow-glow);
}
```

Active / pressed:
```css
.holo-btn:active {
  background: var(--holo-bg-btn-active);
  border-color: var(--holo-border-glow);
  transform: translateY(1px);
}
```

Focus (keyboard navigation — never suppress outline):
```css
.holo-btn:focus-visible {
  outline: 2px solid var(--holo-border-glow);
  outline-offset: 3px;
  box-shadow: var(--holo-shadow-glow);
}
```

### Action Buttons (Scene choices, POI buttons)

Same as `.holo-btn` but full-width in their container, left-aligned text:

```css
.action-btn, .poi-btn {
  width: 100%;
  text-align: left;
  padding-left: var(--holo-space-md);
}
.action-btn::before, .poi-btn::before {
  content: '▶';
  margin-right: var(--holo-space-sm);
  opacity: 0.50;
  font-size: 8px;
  vertical-align: middle;
}
.action-btn:hover::before, .poi-btn:hover::before {
  opacity: 1.0;
}
```

### Continue Button

Distinct from action buttons — centred, wider, slightly larger:

```css
.continue-btn {
  font-family: 'Exo 2', ui-sans-serif, system-ui, sans-serif;
  font-size: var(--holo-text-sm);
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--holo-text-primary);
  background: var(--holo-bg-btn);
  border: 1px solid var(--holo-border-primary);
  border-radius: 6px;
  padding: 12px 32px;
  min-height: var(--holo-touch-target);
  min-width: 160px;
  box-sizing: border-box;
  cursor: pointer;
  display: block;
  margin: var(--holo-space-lg) auto 0;
  box-shadow: var(--holo-shadow-btn);
  transition: background 150ms ease, box-shadow 150ms ease;
}
.continue-btn:hover {
  background: var(--holo-bg-btn-hover);
  box-shadow: var(--holo-shadow-glow);
}
.continue-btn:focus-visible {
  outline: 2px solid var(--holo-border-glow);
  outline-offset: 3px;
}
```

### Footer Buttons

Smaller, secondary treatment — the panel toggles:

```css
.footer-btn {
  font-family: 'Exo 2', ui-sans-serif, system-ui, sans-serif;
  font-size: var(--holo-text-xs);
  font-weight: 500;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: var(--holo-text-secondary);
  background: transparent;
  border: 1px solid var(--holo-border-tertiary);
  border-radius: 4px;
  padding: 8px 14px;
  min-height: var(--holo-touch-target);
  min-width: var(--holo-touch-target);
  box-sizing: border-box;
  cursor: pointer;
  transition: border-color 120ms ease, color 120ms ease;
}
.footer-btn:hover {
  border-color: var(--holo-border-secondary);
  color: var(--holo-text-accent);
}
.footer-btn:focus-visible {
  outline: 2px solid var(--holo-border-glow);
  outline-offset: 2px;
}
```

---

## Micro-interactions

All animations are wrapped in `prefers-reduced-motion` guards. The entire animation
system is opt-in — users who prefer reduced motion get the same layout and content
with instant state changes.

```css
/* Shimmer sweep — used on the location bar and crit roll results */
@keyframes holo-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}

/* Pulse glow — used on active HP pips and live status indicators */
@keyframes holo-pulse {
  0%, 100% { opacity: 0.80; box-shadow: 0 0 4px var(--holo-cyan-dim); }
  50%       { opacity: 1.00; box-shadow: 0 0 12px var(--holo-cyan); }
}

/* Flicker on (panel reveal) — mimics a holographic panel powering up */
@keyframes holo-flicker-in {
  0%   { opacity: 0.0; transform: scaleY(0.96); }
  20%  { opacity: 0.6; transform: scaleY(1.00); }
  30%  { opacity: 0.3; }
  50%  { opacity: 0.9; }
  70%  { opacity: 0.7; }
  100% { opacity: 1.0; transform: scaleY(1.00); }
}

/* Iridescent colour-shift for gradient text and borders */
@keyframes holo-iridescent {
  0%   { filter: hue-rotate(0deg); }
  50%  { filter: hue-rotate(40deg); }
  100% { filter: hue-rotate(0deg); }
}

/* Scan line sweep — decorative overlay on the root panel */
@keyframes holo-scan {
  0%   { background-position: 0 -100vh; }
  100% { background-position: 0  100vh; }
}

/* Motion-safe application */
@media (prefers-reduced-motion: no-preference) {

  /* Location bar text shimmer */
  .loc-bar .loc-name {
    background: linear-gradient(
      90deg,
      var(--holo-text-accent) 0%,
      var(--holo-lavender)    40%,
      var(--holo-cyan)        60%,
      var(--holo-text-accent) 100%
    );
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: holo-shimmer 4s linear infinite;
  }

  /* Panel reveal animation */
  #reveal-full,
  .panel-overlay.visible {
    animation: holo-flicker-in 0.35s ease-out forwards;
  }

  /* Active HP pips pulse */
  .hp-pip.active {
    animation: holo-pulse 2.4s ease-in-out infinite;
  }

  /* Crit success border iridescence */
  .outcome-badge.crit-success::before,
  .roll-result.critical::before {
    animation: holo-iridescent 3s ease-in-out infinite;
  }

  /* Panel enter transition */
  .panel-overlay {
    transition: opacity 180ms ease;
  }

  /* Button transitions — already declared in Interactive Elements */
}

/* Reduced motion: instant transitions, no animation */
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

How each widget type from the base engine should look under the holographic theme.

### Location Bar (`.loc-bar`)

```css
.loc-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--holo-space-md) var(--holo-space-lg);
  background: var(--holo-bg-inset);
  border: 1px solid var(--holo-border-secondary);
  border-radius: 6px 6px 0 0;
  font-family: 'Exo 2', ui-sans-serif, system-ui, sans-serif;
  margin-bottom: 0;
}
.loc-bar .loc-name {
  font-size: var(--holo-text-lg);
  font-weight: 600;
  color: var(--holo-text-accent);
  letter-spacing: 0.04em;
}
.loc-bar .scene-num {
  font-family: 'Share Tech Mono', 'IBM Plex Mono', monospace;
  font-size: var(--holo-text-xs);
  color: var(--holo-text-tertiary);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
```

### Atmosphere Strip (`.atmo-strip`, `.atmo-pill`)

```css
.atmo-strip {
  display: flex;
  flex-wrap: wrap;
  gap: var(--holo-space-sm);
  padding: var(--holo-space-sm) var(--holo-space-md);
  background: var(--holo-bg-inset);
  border-left: 1px solid var(--holo-border-secondary);
  border-right: 1px solid var(--holo-border-secondary);
  border-bottom: 1px solid var(--holo-border-secondary);
  margin-bottom: var(--holo-space-md);
  border-radius: 0 0 4px 4px;
}
.atmo-pill {
  font-family: 'Exo 2', ui-sans-serif, system-ui, sans-serif;
  font-size: var(--holo-text-xs);
  font-weight: 400;
  letter-spacing: 0.06em;
  color: var(--holo-text-secondary);
  background: var(--holo-bg-panel);
  border: 1px solid var(--holo-border-tertiary);
  border-radius: 20px;
  padding: 4px 10px;
}
```

### Narrative Block (`.narrative`, `#narrative`)

```css
#narrative, .narrative {
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  font-size: var(--holo-text-base);
  font-weight: 300;
  line-height: 1.75;
  color: var(--holo-text-primary);
  opacity: 0.90;
  padding: var(--holo-space-md) 0;
  border-top: 1px solid var(--holo-border-tertiary);
  border-bottom: 1px solid var(--holo-border-tertiary);
  margin: var(--holo-space-md) 0;
}
```

### Status Bar (HP pips, XP bar, conditions)

```css
.status-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--holo-space-md);
  padding: var(--holo-space-sm) 0;
  border-top: 1px solid var(--holo-border-tertiary);
  margin-top: var(--holo-space-md);
}
.hp-pips {
  display: flex;
  gap: 4px;
  align-items: center;
}
.hp-pip {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid var(--holo-border-primary);
  background: transparent;
}
.hp-pip.active {
  background: var(--holo-teal);
  border-color: var(--holo-teal);
  box-shadow: 0 0 6px var(--holo-teal-dim);
}
.hp-pip.danger {
  background: var(--holo-pink);
  border-color: var(--holo-pink);
  box-shadow: 0 0 6px var(--holo-pink-dim);
}
.xp-bar-track {
  height: 4px;
  background: var(--holo-bg-inset);
  border-radius: 2px;
  overflow: hidden;
  flex: 1;
  min-width: 60px;
}
.xp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--holo-teal), var(--holo-lavender));
  border-radius: 2px;
  transition: width 400ms ease;
}
.condition-tag {
  font-family: 'Share Tech Mono', 'IBM Plex Mono', monospace;
  font-size: var(--holo-text-xs);
  color: var(--holo-text-secondary);
  background: var(--holo-bg-inset);
  border: 1px solid var(--holo-border-tertiary);
  border-radius: 3px;
  padding: 2px 8px;
}
```

### Outcome Badge (`.outcome-badge`)

```css
.outcome-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--holo-space-sm);
  font-family: 'Exo 2', ui-sans-serif, system-ui, sans-serif;
  font-size: var(--holo-text-sm);
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 8px 18px;
  border-radius: 4px;
  border: 1px solid;
}
.outcome-badge.crit-success  { color: var(--holo-lavender); border-color: var(--holo-lavender-dim); background: rgba(179,136,255,0.10); }
.outcome-badge.success       { color: var(--holo-teal);     border-color: var(--holo-teal-dim);     background: rgba(0,191,165,0.10);  }
.outcome-badge.partial       { color: var(--holo-cyan);     border-color: var(--holo-cyan-dim);     background: rgba(0,229,255,0.08);  }
.outcome-badge.failure       { color: var(--holo-pink);     border-color: var(--holo-pink-dim);     background: rgba(255,128,171,0.10); }
.outcome-badge.crit-failure  { color: #FF4080;              border-color: rgba(255,64,128,0.50);    background: rgba(255,64,128,0.15); }
```

### Die Roll Display

```css
.die-face {
  font-family: 'Share Tech Mono', 'IBM Plex Mono', monospace;
  font-size: 48px;
  font-weight: 400;
  color: var(--holo-text-accent);
  text-align: center;
  line-height: 1;
  padding: var(--holo-space-lg);
  background: var(--holo-bg-inset);
  border: 1px solid var(--holo-border-primary);
  border-radius: 8px;
  box-shadow: var(--holo-shadow-glow);
  min-width: 80px;
  display: inline-block;
}
.roll-formula {
  font-family: 'Share Tech Mono', 'IBM Plex Mono', monospace;
  font-size: var(--holo-text-sm);
  color: var(--holo-text-secondary);
  letter-spacing: 0.08em;
  text-align: center;
  margin-top: var(--holo-space-sm);
}
```

### Panel Overlay (`.panel-overlay`, `.panel-header`, `.panel-title`)

```css
#panel-overlay {
  background: var(--holo-bg-panel);
  border: 1px solid var(--holo-border-primary);
  border-radius: 8px;
  padding: var(--holo-space-lg);
  box-shadow: var(--holo-shadow-panel);
  backdrop-filter: blur(16px) saturate(160%);
}
.panel-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: var(--holo-space-md);
  margin-bottom: var(--holo-space-md);
  border-bottom: 1px solid var(--holo-border-secondary);
}
.panel-title {
  font-family: 'Exo 2', ui-sans-serif, system-ui, sans-serif;
  font-size: var(--holo-text-md);
  font-weight: 600;
  color: var(--holo-text-accent);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.panel-close-btn {
  font-family: 'Share Tech Mono', 'IBM Plex Mono', monospace;
  font-size: var(--holo-text-xs);
  letter-spacing: 0.10em;
  color: var(--holo-text-tertiary);
  background: transparent;
  border: 1px solid var(--holo-border-tertiary);
  border-radius: 4px;
  padding: 8px 14px;
  min-height: var(--holo-touch-target);
  min-width: var(--holo-touch-target);
  box-sizing: border-box;
  cursor: pointer;
  text-transform: uppercase;
  transition: border-color 120ms ease, color 120ms ease;
}
.panel-close-btn:hover {
  border-color: var(--holo-border-secondary);
  color: var(--holo-text-accent);
}
.panel-close-btn:focus-visible {
  outline: 2px solid var(--holo-border-glow);
  outline-offset: 2px;
}
```

### Stat Rows (Character Panel)

```css
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: var(--holo-space-sm);
}
.stat-cell {
  background: var(--holo-bg-inset);
  border: 1px solid var(--holo-border-tertiary);
  border-radius: 4px;
  padding: var(--holo-space-sm);
  text-align: center;
}
.stat-label {
  font-family: 'Exo 2', ui-sans-serif, system-ui, sans-serif;
  font-size: var(--holo-text-xs);
  font-weight: 500;
  letter-spacing: 0.10em;
  color: var(--holo-text-tertiary);
  text-transform: uppercase;
  display: block;
  margin-bottom: 2px;
}
.stat-value {
  font-family: 'Share Tech Mono', 'IBM Plex Mono', monospace;
  font-size: var(--holo-text-md);
  font-weight: 400;
  color: var(--holo-text-accent);
}
.stat-mod {
  font-family: 'Share Tech Mono', 'IBM Plex Mono', monospace;
  font-size: var(--holo-text-xs);
  color: var(--holo-text-secondary);
}
```

---

## Complete CSS Block

Copy this entire `<style>` block into any widget to apply the holographic theme.
The Google Fonts `@import` is attempted first; the fallback stacks produce an
acceptable result if CSP blocks the request.

```css
/* @extract */
/* ============================================================
   HOLOGRAPHIC THEME — Text Adventure Game Engine
   Visual Style: Translucent iridescent sci-fi HUD
   ============================================================ */

@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600&family=Share+Tech+Mono&display=swap');

/* ── Custom Properties ─────────────────────────────────────── */

:host {
  /* Iridescent accents (scheme-independent) */
  --holo-cyan:         #00E5FF;
  --holo-teal:         #00BFA5;
  --holo-lavender:     #B388FF;
  --holo-pink:         #FF80AB;
  --holo-cyan-dim:     rgba(0, 229, 255, 0.35);
  --holo-teal-dim:     rgba(0, 191, 165, 0.35);
  --holo-lavender-dim: rgba(179, 136, 255, 0.30);
  --holo-pink-dim:     rgba(255, 128, 171, 0.35);

  /* Spacing */
  --holo-space-xs:  4px;
  --holo-space-sm:  8px;
  --holo-space-md:  14px;
  --holo-space-lg:  20px;
  --holo-space-xl:  32px;
  --holo-touch-target: 44px;

  /* Typography */
  --holo-text-xs:   10px;
  --holo-text-sm:   12px;
  --holo-text-base: 14px;
  --holo-text-md:   16px;
  --holo-text-lg:   20px;
  --holo-text-xl:   26px;

  /* Dark mode (default) */
  --holo-bg-base:         #050510;
  --holo-bg-panel:        rgba(255, 255, 255, 0.05);
  --holo-bg-panel-hover:  rgba(255, 255, 255, 0.08);
  --holo-bg-inset:        rgba(0, 0, 0, 0.30);
  --holo-bg-btn:          rgba(0, 229, 255, 0.08);
  --holo-bg-btn-hover:    rgba(0, 229, 255, 0.18);
  --holo-bg-btn-active:   rgba(0, 229, 255, 0.28);
  --holo-text-primary:    rgba(220, 240, 255, 0.92);
  --holo-text-secondary:  rgba(180, 210, 240, 0.70);
  --holo-text-tertiary:   rgba(140, 180, 220, 0.50);
  --holo-text-accent:     #00E5FF;
  --holo-text-success:    #00BFA5;
  --holo-text-danger:     #FF80AB;
  --holo-text-crit:       #B388FF;
  --holo-border-primary:  rgba(0, 229, 255, 0.55);
  --holo-border-secondary:rgba(0, 229, 255, 0.25);
  --holo-border-tertiary: rgba(255, 255, 255, 0.10);
  --holo-border-glow:     rgba(0, 229, 255, 0.80);
  --holo-shadow-panel:
    0 0 24px rgba(0, 229, 255, 0.10),
    0 8px 32px rgba(0, 0, 0, 0.60),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  --holo-shadow-btn:
    0 0 12px rgba(0, 229, 255, 0.20),
    0 2px 8px rgba(0, 0, 0, 0.40);
  --holo-shadow-glow:
    0 0 20px rgba(0, 229, 255, 0.50),
    0 0 40px rgba(0, 229, 255, 0.20);

  /* Shadow Claude.ai host variables */
  --color-text-primary:         var(--holo-text-primary);
  --color-text-secondary:       var(--holo-text-secondary);
  --color-text-tertiary:        var(--holo-text-tertiary);
  --color-background:           var(--holo-bg-base);
  --color-background-secondary: var(--holo-bg-panel);
  --color-border-primary:       var(--holo-border-primary);
  --color-border-secondary:     var(--holo-border-secondary);
  --color-border-tertiary:      var(--holo-border-tertiary);
  --border-radius-md:           6px;
  --font-sans: 'Exo 2', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: 'Share Tech Mono', 'IBM Plex Mono', 'SF Mono', monospace;

  /* ── CSS Custom Property Contract (required by style-reference.md) ─ */
  --ta-font-heading:              'Exo 2', 'Orbitron', 'Rajdhani', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --ta-font-body:                 'Share Tech Mono', 'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  --ta-color-accent:              var(--holo-cyan);
  --ta-color-accent-hover:        color-mix(in srgb, var(--holo-cyan) 85%, white);
  --ta-color-accent-bg:           var(--holo-cyan-dim);
  --ta-color-accent-bg-hover:     rgba(0, 229, 255, 0.25);
  --ta-color-success:             var(--holo-teal);
  --ta-color-success-border:      var(--holo-teal-dim);
  --ta-color-danger:              var(--holo-pink);
  --ta-color-danger-border:       var(--holo-pink-dim);
  --ta-color-danger-bg:           rgba(255, 128, 171, 0.10);
  --ta-color-danger-bg-hover:     rgba(255, 128, 171, 0.20);
  --ta-color-warning:             var(--holo-lavender);
  --ta-color-warning-border:      var(--holo-lavender-dim);
  --ta-color-warning-bg:          rgba(179, 136, 255, 0.10);
  --ta-color-xp:                  var(--holo-lavender);
  --ta-color-focus:               var(--holo-cyan);
  --ta-color-conviction:          var(--holo-lavender);
  --ta-color-conviction-border:   var(--holo-lavender-dim);
  --ta-badge-success-bg:          rgba(0, 191, 165, 0.10);
  --ta-badge-success-text:        var(--holo-teal);
  --ta-badge-partial-bg:          rgba(0, 229, 255, 0.08);
  --ta-badge-partial-text:        var(--holo-cyan);
  --ta-badge-failure-bg:          rgba(255, 128, 171, 0.10);
  --ta-badge-failure-text:        var(--holo-pink);
  --ta-badge-crit-success-border: var(--holo-lavender);
  --ta-badge-crit-failure-border: var(--holo-pink);
  --ta-color-credits:             var(--holo-cyan);
  --ta-color-tab-active:          var(--holo-cyan);
  --ta-border-style-poi:          1px dashed;
  --ta-die-spin-duration:         0.6s;
}

@media (prefers-color-scheme: light) {
  :host {
    --holo-bg-base:         #F0F0F5;
    --holo-bg-panel:        rgba(0, 0, 0, 0.03);
    --holo-bg-panel-hover:  rgba(0, 0, 0, 0.06);
    --holo-bg-inset:        rgba(0, 0, 0, 0.06);
    --holo-bg-btn:          rgba(0, 163, 184, 0.08);
    --holo-bg-btn-hover:    rgba(0, 163, 184, 0.16);
    --holo-bg-btn-active:   rgba(0, 163, 184, 0.26);
    --holo-text-primary:    rgba(10, 20, 40, 0.90);
    --holo-text-secondary:  rgba(10, 30, 60, 0.68);
    --holo-text-tertiary:   rgba(10, 30, 60, 0.48);
    --holo-text-accent:     #007A8C;
    --holo-text-success:    #007A6A;
    --holo-text-danger:     #C0004A;
    --holo-text-crit:       #6200C8;
    --holo-border-primary:  rgba(0, 163, 184, 0.50);
    --holo-border-secondary:rgba(0, 163, 184, 0.25);
    --holo-border-tertiary: rgba(0, 0, 0, 0.10);
    --holo-border-glow:     rgba(0, 163, 184, 0.80);
    --holo-shadow-panel:
      0 0 20px rgba(0, 163, 184, 0.08),
      0 4px 20px rgba(0, 0, 0, 0.10),
      inset 0 1px 0 rgba(255, 255, 255, 0.80);
    --holo-shadow-btn:
      0 0 8px rgba(0, 163, 184, 0.15),
      0 2px 6px rgba(0, 0, 0, 0.10);
    --holo-shadow-glow:
      0 0 16px rgba(0, 163, 184, 0.40),
      0 0 32px rgba(0, 163, 184, 0.15);
  }
}

/* ── Reset & Root ───────────────────────────────────────────── */

*, *::before, *::after { box-sizing: border-box; }

.root {
  font-family: var(--font-sans);
  font-size: var(--holo-text-base);
  font-weight: 300;
  color: var(--holo-text-primary);
  background: var(--holo-bg-base);
  padding: 20px 20px 24px;
  max-width: 680px;
  margin: 0 auto;
  line-height: 1.6;
}

/* ── Backdrop filter with solid fallback ────────────────────── */

.holo-surface {
  background: var(--holo-bg-panel);
  border: 1px solid var(--holo-border-primary);
  border-radius: 8px;
  box-shadow: var(--holo-shadow-panel);
  backdrop-filter: blur(12px) saturate(160%);
}
@supports not (backdrop-filter: blur(1px)) {
  .holo-surface { background: #0a0a20; }
}
@media (prefers-color-scheme: light) {
  @supports not (backdrop-filter: blur(1px)) {
    .holo-surface { background: #eaeaf2; }
  }
}

/* ── Location Bar ───────────────────────────────────────────── */

.loc-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--holo-space-md) var(--holo-space-lg);
  background: var(--holo-bg-inset);
  border: 1px solid var(--holo-border-secondary);
  border-radius: 6px 6px 0 0;
  font-family: var(--font-sans);
}
.loc-name {
  font-size: var(--holo-text-lg);
  font-weight: 600;
  color: var(--holo-text-accent);
  letter-spacing: 0.04em;
}
.scene-num {
  font-family: var(--font-mono);
  font-size: var(--holo-text-xs);
  color: var(--holo-text-tertiary);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

/* ── Atmosphere Strip ───────────────────────────────────────── */

.atmo-strip {
  display: flex;
  flex-wrap: wrap;
  gap: var(--holo-space-sm);
  padding: var(--holo-space-sm) var(--holo-space-md);
  background: var(--holo-bg-inset);
  border: 1px solid var(--holo-border-secondary);
  border-top: none;
  border-radius: 0 0 4px 4px;
  margin-bottom: var(--holo-space-md);
}
.atmo-pill {
  font-family: var(--font-sans);
  font-size: var(--holo-text-xs);
  font-weight: 400;
  letter-spacing: 0.06em;
  color: var(--holo-text-secondary);
  background: var(--holo-bg-panel);
  border: 1px solid var(--holo-border-tertiary);
  border-radius: 20px;
  padding: 4px 10px;
}

/* ── Narrative Block ────────────────────────────────────────── */

#narrative, .narrative {
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  font-size: var(--holo-text-base);
  font-weight: 300;
  line-height: 1.75;
  color: var(--holo-text-primary);
  opacity: 0.90;
  padding: var(--holo-space-md) 0;
  border-top: 1px solid var(--holo-border-tertiary);
  border-bottom: 1px solid var(--holo-border-tertiary);
  margin: var(--holo-space-md) 0;
}

/* ── Brief Text (Progressive Reveal) ───────────────────────── */

.brief-text {
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  font-size: var(--holo-text-base);
  font-weight: 300;
  line-height: 1.70;
  color: var(--holo-text-secondary);
  margin: 0 0 var(--holo-space-lg);
  font-style: italic;
}

/* ── Buttons ────────────────────────────────────────────────── */

.continue-btn,
.action-btn,
.poi-btn,
.footer-btn,
.holo-btn,
button[data-prompt] {
  cursor: pointer;
  box-sizing: border-box;
  border-radius: 6px;
  font-family: var(--font-sans);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: background 150ms ease,
              border-color 150ms ease,
              box-shadow 150ms ease,
              color 150ms ease;
}
button:focus-visible,
[data-prompt]:focus-visible {
  outline: 2px solid var(--holo-border-glow);
  outline-offset: 3px;
}

.continue-btn {
  font-size: var(--holo-text-sm);
  font-weight: 500;
  letter-spacing: 0.12em;
  color: var(--holo-text-primary);
  background: var(--holo-bg-btn);
  border: 1px solid var(--holo-border-primary);
  padding: 12px 32px;
  min-height: var(--holo-touch-target);
  min-width: 160px;
  display: block;
  margin: var(--holo-space-lg) auto 0;
  box-shadow: var(--holo-shadow-btn);
}
.continue-btn:hover {
  background: var(--holo-bg-btn-hover);
  box-shadow: var(--holo-shadow-glow);
}

.action-btn, .poi-btn {
  font-size: var(--holo-text-sm);
  font-weight: 500;
  color: var(--holo-text-accent);
  background: var(--holo-bg-btn);
  border: 1px solid var(--holo-border-secondary);
  padding: 10px var(--holo-space-md);
  min-height: var(--holo-touch-target);
  width: 100%;
  text-align: left;
  box-shadow: var(--holo-shadow-btn);
  display: block;
  margin-bottom: var(--holo-space-sm);
}
.action-btn:hover, .poi-btn:hover {
  background: var(--holo-bg-btn-hover);
  border-color: var(--holo-border-primary);
  box-shadow: var(--holo-shadow-glow);
}
.action-btn:active, .poi-btn:active {
  background: var(--holo-bg-btn-active);
  transform: translateY(1px);
}

.footer-btn {
  font-size: var(--holo-text-xs);
  font-weight: 500;
  color: var(--holo-text-secondary);
  background: transparent;
  border: 1px solid var(--holo-border-tertiary);
  border-radius: 4px;
  padding: 8px 14px;
  min-height: var(--holo-touch-target);
  min-width: var(--holo-touch-target);
}
.footer-btn:hover {
  border-color: var(--holo-border-secondary);
  color: var(--holo-text-accent);
}

/* ── Footer Row ─────────────────────────────────────────────── */

.footer-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--holo-space-sm);
  align-items: center;
  padding-top: var(--holo-space-md);
  margin-top: var(--holo-space-md);
  border-top: 1px solid var(--holo-border-tertiary);
}

/* ── Status Bar ─────────────────────────────────────────────── */

.status-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--holo-space-md);
  padding: var(--holo-space-sm) 0;
  border-top: 1px solid var(--holo-border-tertiary);
  margin-top: var(--holo-space-md);
}
.hp-pips { display: flex; gap: 4px; align-items: center; }
.hp-pip {
  width: 10px; height: 10px;
  border-radius: 50%;
  border: 1px solid var(--holo-border-primary);
  background: transparent;
}
.hp-pip.active {
  background: var(--holo-teal);
  border-color: var(--holo-teal);
  box-shadow: 0 0 6px var(--holo-teal-dim);
}
.hp-pip.danger {
  background: var(--holo-pink);
  border-color: var(--holo-pink);
  box-shadow: 0 0 6px var(--holo-pink-dim);
}
.xp-bar-track {
  height: 4px; background: var(--holo-bg-inset);
  border-radius: 2px; overflow: hidden; flex: 1; min-width: 60px;
}
.xp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--holo-teal), var(--holo-lavender));
  border-radius: 2px;
  transition: width 400ms ease;
}
.condition-tag {
  font-family: var(--font-mono);
  font-size: var(--holo-text-xs);
  color: var(--holo-text-secondary);
  background: var(--holo-bg-inset);
  border: 1px solid var(--holo-border-tertiary);
  border-radius: 3px;
  padding: 2px 8px;
}

/* ── Panel Overlay ──────────────────────────────────────────── */

#panel-overlay {
  background: var(--holo-bg-panel);
  border: 1px solid var(--holo-border-primary);
  border-radius: 8px;
  padding: var(--holo-space-lg);
  box-shadow: var(--holo-shadow-panel);
  backdrop-filter: blur(16px) saturate(160%);
}
.panel-overlay { opacity: 0; transition: opacity 150ms ease; pointer-events: none; }
.panel-overlay.visible { opacity: 1; pointer-events: auto; }
.panel-header {
  display: flex; align-items: baseline; justify-content: space-between;
  padding-bottom: var(--holo-space-md);
  margin-bottom: var(--holo-space-md);
  border-bottom: 1px solid var(--holo-border-secondary);
}
.panel-title {
  font-family: var(--font-sans);
  font-size: var(--holo-text-md);
  font-weight: 600;
  color: var(--holo-text-accent);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.panel-close-btn {
  font-family: var(--font-mono);
  font-size: var(--holo-text-xs);
  letter-spacing: 0.10em;
  color: var(--holo-text-tertiary);
  background: transparent;
  border: 1px solid var(--holo-border-tertiary);
  border-radius: 4px;
  padding: 8px 14px;
  min-height: var(--holo-touch-target);
  min-width: var(--holo-touch-target);
  box-sizing: border-box;
  cursor: pointer;
  text-transform: uppercase;
  transition: border-color 120ms ease, color 120ms ease;
}
.panel-close-btn:hover { border-color: var(--holo-border-secondary); color: var(--holo-text-accent); }
.panel-close-btn:focus-visible { outline: 2px solid var(--holo-border-glow); outline-offset: 2px; }
.panel-content { display: none; }

/* ── Stat Grid ──────────────────────────────────────────────── */

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: var(--holo-space-sm);
}
.stat-cell {
  background: var(--holo-bg-inset);
  border: 1px solid var(--holo-border-tertiary);
  border-radius: 4px;
  padding: var(--holo-space-sm);
  text-align: center;
}
.stat-label {
  font-family: var(--font-sans);
  font-size: var(--holo-text-xs);
  font-weight: 500;
  letter-spacing: 0.10em;
  color: var(--holo-text-tertiary);
  text-transform: uppercase;
  display: block;
  margin-bottom: 2px;
}
.stat-value {
  font-family: var(--font-mono);
  font-size: var(--holo-text-md);
  font-weight: 400;
  color: var(--holo-text-accent);
}
.stat-mod {
  font-family: var(--font-mono);
  font-size: var(--holo-text-xs);
  color: var(--holo-text-secondary);
}

/* ── Outcome Badge ──────────────────────────────────────────── */

.outcome-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--holo-space-sm);
  font-family: var(--font-sans);
  font-size: var(--holo-text-sm);
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 8px 18px;
  border-radius: 4px;
  border: 1px solid;
}
.outcome-badge.crit-success  { color: var(--holo-lavender); border-color: var(--holo-lavender-dim); background: rgba(179,136,255,0.10); }
.outcome-badge.success       { color: var(--holo-teal);     border-color: var(--holo-teal-dim);     background: rgba(0,191,165,0.10);   }
.outcome-badge.partial       { color: var(--holo-cyan);     border-color: var(--holo-cyan-dim);     background: rgba(0,229,255,0.08);   }
.outcome-badge.failure       { color: var(--holo-pink);     border-color: var(--holo-pink-dim);     background: rgba(255,128,171,0.10); }
.outcome-badge.crit-failure  { color: #FF4080;              border-color: rgba(255,64,128,0.50);    background: rgba(255,64,128,0.15);  }

/* ── Die Roll Display ───────────────────────────────────────── */

.die-face {
  font-family: var(--font-mono);
  font-size: 48px;
  font-weight: 400;
  color: var(--holo-text-accent);
  text-align: center;
  line-height: 1;
  padding: var(--holo-space-lg);
  background: var(--holo-bg-inset);
  border: 1px solid var(--holo-border-primary);
  border-radius: 8px;
  box-shadow: var(--holo-shadow-glow);
  min-width: 80px;
  display: inline-block;
}
.roll-formula {
  font-family: var(--font-mono);
  font-size: var(--holo-text-sm);
  color: var(--holo-text-secondary);
  letter-spacing: 0.08em;
  text-align: center;
  margin-top: var(--holo-space-sm);
}

/* ── Animations (prefers-reduced-motion guarded) ────────────── */

@keyframes holo-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
@keyframes holo-pulse {
  0%, 100% { opacity: 0.80; box-shadow: 0 0 4px var(--holo-cyan-dim); }
  50%       { opacity: 1.00; box-shadow: 0 0 12px var(--holo-cyan); }
}
@keyframes holo-flicker-in {
  0%   { opacity: 0.0; transform: scaleY(0.96); }
  20%  { opacity: 0.6; transform: scaleY(1.00); }
  30%  { opacity: 0.3; }
  50%  { opacity: 0.9; }
  70%  { opacity: 0.7; }
  100% { opacity: 1.0; }
}
@keyframes holo-iridescent {
  0%   { filter: hue-rotate(0deg); }
  50%  { filter: hue-rotate(40deg); }
  100% { filter: hue-rotate(0deg); }
}

@media (prefers-reduced-motion: no-preference) {
  .loc-name {
    background: linear-gradient(
      90deg,
      var(--holo-text-accent) 0%,
      var(--holo-lavender)    40%,
      var(--holo-cyan)        60%,
      var(--holo-text-accent) 100%
    );
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: holo-shimmer 4s linear infinite;
  }
  #reveal-full { animation: holo-flicker-in 0.35s ease-out forwards; }
  .panel-overlay { transition: opacity 180ms ease; }
  .hp-pip.active { animation: holo-pulse 2.4s ease-in-out infinite; }
  .outcome-badge.crit-success { animation: holo-iridescent 3s ease-in-out infinite; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
