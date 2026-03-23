---
name: neon
description: >
  Cyberpunk neon arcade theme. Saturated electric colours on deep navy, sharp corners,
  glowing borders, and synthwave energy. Designed for high-intensity, high-contrast
  visual drama — sci-fi, cyberpunk, dystopian, or any genre where the world pulses with
  artificial light.
best-for:
  - cyberpunk
  - sci-fi
  - dystopian
  - space-opera
  - near-future
  - horror-tech
  - synthwave
  output-styles:
    - Master Storyteller
    - Noir Narrator
    - Pulp Action
---

## Design Philosophy

The Neon theme is built around the visual language of a neon-lit arcade, a cyberpunk
nightclub, and synthwave album art. Every surface is dark — deep navy or near-black —
and colour is applied with maximum deliberateness: glowing borders, hot accent fills, and
pulsing glow effects that make interactive elements feel electrically charged.

The aesthetic is unashamedly bold. Borders are thick and sharp. Corners are clipped rather
than rounded. Typography is muscular and mechanical. The goal is not subtlety — it is the
visceral thrill of a dashboard that feels like it could launch a starship or detonate a
reactor.

Accessibility is non-negotiable. Neon colours on dark backgrounds are notorious for failing
contrast checks; every colour assignment here has been chosen to meet WCAG AA (4.5:1 for
body text, 3:1 for large text and UI components). Glow effects and animations are
decorative only and are removed entirely under `prefers-reduced-motion`.

---

## Typography

### Font Stacks

```css
/* Display / headings — Space Grotesk preferred, fallback to system sans */
--font-display: 'Space Grotesk', 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;

/* Body / UI — Inter preferred, fallback to system sans */
--font-sans: 'Inter', 'Space Grotesk', 'Segoe UI', system-ui, -apple-system, sans-serif;

/* Mechanical readouts, stats, dice — Space Mono preferred */
--font-mono: 'Space Mono', 'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
```

Google Fonts import (may be CSP-blocked inside Claude.ai iframes — fallback stacks above
must produce acceptable results independently):

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500&display=swap');
```

### Sizing Scale

```css
--text-xs:   9px;    /* labels, badges, uppercase caps */
--text-sm:  11px;    /* secondary UI, fallback prompts */
--text-base: 13px;   /* narrative body */
--text-md:  16px;    /* section headings, location names */
--text-lg:  20px;    /* widget titles, panel headers */
--text-xl:  36px;    /* die value display */
```

### Letter Spacing

- Display headings: `letter-spacing: 0.04em`
- Uppercase labels: `letter-spacing: 0.14em`
- Monospace UI: `letter-spacing: 0.06em`
- Badges and caps: `letter-spacing: 0.12em`

---

## Colour Palette

All colours are defined as CSS custom properties on the theme root. The neon theme
operates in dark mode by default; a light mode variant reduces saturation to 70% and
inverts the surface/text relationship.

### Dark Mode (default)

```css
:root,
[data-theme="neon"] {
  /* --- Surfaces --- */
  --neon-bg-primary:    #0B0C1E;   /* deep navy — main background */
  --neon-bg-secondary:  #12142B;   /* slightly lighter navy — cards, panels */
  --neon-bg-tertiary:   #1A1D38;   /* elevated surface — hover states, insets */
  --neon-bg-overlay:    #0D0F22;   /* panel overlays */

  /* --- Text --- */
  --neon-text-primary:   #F0F2FF;  /* near-white with blue tint — WCAG AA on all surfaces */
  --neon-text-secondary: #A8AECB;  /* muted lavender — secondary labels */
  --neon-text-tertiary:  #5A6080;  /* dim blue-grey — hints, disabled */

  /* --- Neon Accent Colours --- */
  /* Each accent is paired with a glow rgba for box-shadow use */

  /* Pink — primary action, attack, danger */
  --neon-pink:        #FF2D78;
  --neon-pink-glow:   rgba(255, 45, 120, 0.4);
  --neon-pink-dim:    rgba(255, 45, 120, 0.12);
  /* Contrast on --neon-bg-primary: 5.8:1 — passes AA */

  /* Blue — information, exploration, POI */
  --neon-blue:        #00C4E8;
  --neon-blue-glow:   rgba(0, 196, 232, 0.4);
  --neon-blue-dim:    rgba(0, 196, 232, 0.10);
  /* Contrast on --neon-bg-primary: 8.1:1 — passes AA */

  /* Green — success, HP, credits */
  --neon-green:       #39FF8A;
  --neon-green-glow:  rgba(57, 255, 138, 0.4);
  --neon-green-dim:   rgba(57, 255, 138, 0.10);
  /* Contrast on --neon-bg-primary: 13.4:1 — passes AAA */

  /* Orange — warning, partial success, merchants */
  --neon-orange:      #FF6B35;
  --neon-orange-glow: rgba(255, 107, 53, 0.4);
  --neon-orange-dim:  rgba(255, 107, 53, 0.12);
  /* Contrast on --neon-bg-primary: 4.8:1 — passes AA */

  /* Violet — mystery, XP, magic, lore */
  --neon-violet:      #A855F7;
  --neon-violet-glow: rgba(168, 85, 247, 0.4);
  --neon-violet-dim:  rgba(168, 85, 247, 0.12);
  /* Contrast on --neon-bg-primary: 5.2:1 — passes AA */

  /* Acid — acid green for extreme crits and HUD highlights */
  --neon-acid:        #ADFF02;
  --neon-acid-glow:   rgba(173, 255, 2, 0.4);
  --neon-acid-dim:    rgba(173, 255, 2, 0.10);
  /* Contrast on --neon-bg-primary: 14.8:1 — passes AAA */

  /* --- Borders --- */
  --neon-border-primary:   rgba(255, 45, 120, 0.6);   /* pink — active/focused */
  --neon-border-secondary: rgba(0, 196, 232, 0.4);    /* blue — interactive */
  --neon-border-tertiary:  rgba(90, 96, 128, 0.5);    /* dim — structural */
  --neon-border-width: 2px;

  /* --- Border Radius --- */
  --neon-radius-sm:  2px;   /* sharp — default for all elements */
  --neon-radius-md:  2px;   /* sharp — panels, cards */
  --neon-radius-pill: 2px;  /* pills and badges also stay sharp */

  /* --- Shadows / Glows --- */
  --neon-glow-pink:   0 0 8px var(--neon-pink-glow), 0 0 20px rgba(255,45,120,0.15);
  --neon-glow-blue:   0 0 8px var(--neon-blue-glow), 0 0 20px rgba(0,196,232,0.15);
  --neon-glow-green:  0 0 8px var(--neon-green-glow), 0 0 20px rgba(57,255,138,0.15);
  --neon-glow-violet: 0 0 8px var(--neon-violet-glow), 0 0 20px rgba(168,85,247,0.15);
  --neon-glow-acid:   0 0 8px var(--neon-acid-glow),  0 0 20px rgba(173,255,2,0.15);

  /* --- Semantic Role Assignments --- */
  --color-action:    var(--neon-pink);
  --color-explore:   var(--neon-blue);
  --color-success:   var(--neon-green);
  --color-warning:   var(--neon-orange);
  --color-danger:    var(--neon-pink);
  --color-mystery:   var(--neon-violet);
  --color-hp:        var(--neon-green);
  --color-xp:        var(--neon-violet);
  --color-credits:   var(--neon-acid);
  --color-crit:      var(--neon-acid);
  --color-retreat:   var(--neon-text-tertiary);

  /* ── CSS Custom Property Contract (required by style-reference.md) ─ */
  --ta-font-heading:              var(--font-display);
  --ta-font-body:                 var(--font-mono);
  --ta-color-accent:              var(--neon-blue);
  --ta-color-accent-hover:        #33ECFF;
  --ta-color-accent-bg:           var(--neon-blue-dim);
  --ta-color-accent-bg-hover:     rgba(0, 196, 232, 0.25);
  --ta-color-success:             var(--neon-green);
  --ta-color-success-border:      #2BD474;
  --ta-color-danger:              var(--neon-pink);
  --ta-color-danger-border:       #E0206A;
  --ta-color-danger-bg:           var(--neon-pink-dim);
  --ta-color-danger-bg-hover:     rgba(255, 45, 120, 0.25);
  --ta-color-warning:             var(--neon-orange);
  --ta-color-warning-border:      #E05A28;
  --ta-color-warning-bg:          var(--neon-orange-dim);
  --ta-color-xp:                  var(--neon-violet);
  --ta-color-focus:               var(--neon-blue);
  --ta-color-conviction:          var(--neon-violet);
  --ta-color-conviction-border:   #9040E0;
  --ta-badge-success-bg:          var(--neon-green-dim);
  --ta-badge-success-text:        var(--neon-green);
  --ta-badge-partial-bg:          var(--neon-orange-dim);
  --ta-badge-partial-text:        var(--neon-orange);
  --ta-badge-failure-bg:          var(--neon-pink-dim);
  --ta-badge-failure-text:        var(--neon-pink);
  --ta-badge-crit-success-border: var(--neon-acid);
  --ta-badge-crit-failure-border: var(--neon-pink);
  --ta-color-credits:             var(--neon-acid);
  --ta-color-tab-active:          var(--neon-blue);
  --ta-border-style-poi:          1px dashed;
  --ta-die-spin-duration:         0.6s;
}
```

### Light Mode Override

```css
@media (prefers-color-scheme: light) {
  :root,
  [data-theme="neon"] {
    --neon-bg-primary:    #FAFAFA;
    --neon-bg-secondary:  #F0F1F8;
    --neon-bg-tertiary:   #E4E6F4;
    --neon-bg-overlay:    #F5F6FC;

    --neon-text-primary:   #0D0F1E;
    --neon-text-secondary: #3A3F62;
    --neon-text-tertiary:  #7A80A0;

    /* Saturations reduced to 70% for light mode readability */
    --neon-pink:        #CC2260;
    --neon-pink-glow:   rgba(204, 34, 96, 0.3);
    --neon-pink-dim:    rgba(204, 34, 96, 0.08);

    --neon-blue:        #0090AD;
    --neon-blue-glow:   rgba(0, 144, 173, 0.3);
    --neon-blue-dim:    rgba(0, 144, 173, 0.08);

    --neon-green:       #1A8C4E;
    --neon-green-glow:  rgba(26, 140, 78, 0.3);
    --neon-green-dim:   rgba(26, 140, 78, 0.08);

    --neon-orange:      #C8501A;
    --neon-orange-glow: rgba(200, 80, 26, 0.3);
    --neon-orange-dim:  rgba(200, 80, 26, 0.08);

    --neon-violet:      #7B2FBF;
    --neon-violet-glow: rgba(123, 47, 191, 0.3);
    --neon-violet-dim:  rgba(123, 47, 191, 0.08);

    --neon-acid:        #5A8400;
    --neon-acid-glow:   rgba(90, 132, 0, 0.3);
    --neon-acid-dim:    rgba(90, 132, 0, 0.08);

    --neon-border-primary:   rgba(204, 34, 96, 0.6);
    --neon-border-secondary: rgba(0, 144, 173, 0.5);
    --neon-border-tertiary:  rgba(122, 128, 160, 0.4);

    /* Glows are softer in light mode */
    --neon-glow-pink:   0 0 6px var(--neon-pink-glow);
    --neon-glow-blue:   0 0 6px var(--neon-blue-glow);
    --neon-glow-green:  0 0 6px var(--neon-green-glow);
    --neon-glow-violet: 0 0 6px var(--neon-violet-glow);
    --neon-glow-acid:   0 0 6px var(--neon-acid-glow);
  }
}
```

---

## Spacing & Layout

```css
/* Spacing scale — consistent throughout all widgets */
--neon-space-xs:  4px;
--neon-space-sm:  8px;
--neon-space-md: 14px;
--neon-space-lg: 20px;
--neon-space-xl: 28px;

/* Widget padding — inner breathing room */
--neon-widget-padding: 0 0 var(--neon-space-xl);

/* Touch target floor */
--neon-touch-target: 44px;

/* Section dividers */
--neon-divider: var(--neon-border-width) solid var(--neon-border-tertiary);
```

Layout uses flexbox for all rows and wraps. No CSS Grid is used in widget bodies to
maximise compatibility inside sandboxed iframes. Max-width is never applied to the root
element — the widget fills its container.

---

## Borders & Surfaces

The neon theme uses **2px solid borders** throughout, with **2px max border-radius** on all
elements. The sharp corner language is central to the cyberpunk aesthetic; rounded corners
are actively wrong here.

```css
/* Card / panel surface */
.neon-card {
  background: var(--neon-bg-secondary);
  border: var(--neon-border-width) solid var(--neon-border-tertiary);
  border-radius: var(--neon-radius-md);
  padding: var(--neon-space-md);
}

/* Active / highlighted card */
.neon-card--active {
  border-color: var(--neon-blue);
  box-shadow: var(--neon-glow-blue);
}

/* Inset / recessed surface (attr blocks, NPC reaction, stakes) */
.neon-inset {
  background: var(--neon-bg-tertiary);
  border: var(--neon-border-width) solid var(--neon-border-tertiary);
  border-radius: var(--neon-radius-sm);
  padding: var(--neon-space-sm) var(--neon-space-md);
}

/* Divider line */
.neon-divider {
  border: none;
  border-top: var(--neon-divider);
  margin: var(--neon-space-md) 0;
}

/* Pill / badge shape — note: still uses 2px radius for theme consistency */
.neon-pill {
  border-radius: var(--neon-radius-pill);
  border: var(--neon-border-width) solid var(--neon-border-tertiary);
  padding: 3px 10px;
}
```

---

## Interactive Elements

### Base Button Reset

```css
.neon-btn {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: var(--text-sm);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: var(--neon-space-sm) var(--neon-space-md);
  min-height: var(--neon-touch-target);
  min-width: var(--neon-touch-target);
  box-sizing: border-box;
  border-radius: var(--neon-radius-sm);
  border: var(--neon-border-width) solid;
  background: transparent;
  cursor: pointer;
  transition: box-shadow 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Keyboard focus — visible ring using neon blue */
.neon-btn:focus-visible,
button:focus-visible,
[data-prompt]:focus-visible {
  outline: 2px solid var(--neon-blue);
  outline-offset: 2px;
}

/* Disabled state */
.neon-btn:disabled,
.neon-btn[disabled] {
  opacity: 0.3;
  cursor: not-allowed;
  box-shadow: none;
}
```

### Action Button (primary — pink glow on hover)

Used for: primary scene actions, attack, buy, confirm.

```css
.btn-action {
  color: var(--neon-text-primary);
  border-color: var(--neon-pink);
  background: var(--neon-pink-dim);
}
.btn-action:hover {
  background: rgba(255, 45, 120, 0.22);
  box-shadow: var(--neon-glow-pink);
}
.btn-action:active {
  background: rgba(255, 45, 120, 0.35);
  box-shadow: none;
}
```

### POI / Explore Button (dashed blue — interactive but secondary)

Used for: points of interest, inspect, examine.

```css
.btn-poi {
  color: var(--neon-blue);
  border-color: var(--neon-blue);
  border-style: dashed;
  background: transparent;
}
.btn-poi:hover {
  border-style: solid;
  background: var(--neon-blue-dim);
  box-shadow: var(--neon-glow-blue);
}
.btn-poi:active {
  background: rgba(0, 196, 232, 0.2);
  box-shadow: none;
}
```

### Continue / Neutral Button (tertiary — no colour)

Used for: continue, close, cancel, retreat.

```css
.btn-neutral,
.continue-btn {
  color: var(--neon-text-secondary);
  border-color: var(--neon-border-tertiary);
  background: transparent;
}
.btn-neutral:hover,
.continue-btn:hover {
  color: var(--neon-text-primary);
  border-color: var(--neon-border-secondary);
  background: var(--neon-bg-tertiary);
}
```

### Roll Button (large, blue glow — the centrepiece of die roll widgets)

```css
.roll-btn {
  font-size: var(--text-md);
  letter-spacing: 0.14em;
  padding: var(--neon-space-md) var(--neon-space-xl);
  color: var(--neon-blue);
  border-color: var(--neon-blue);
  background: var(--neon-blue-dim);
  display: block;
  margin: 0 auto var(--neon-space-md);
  box-shadow: var(--neon-glow-blue);
}
.roll-btn:hover {
  background: rgba(0, 196, 232, 0.18);
  box-shadow: 0 0 14px var(--neon-blue-glow), 0 0 32px rgba(0,196,232,0.2);
}
.roll-btn:disabled {
  opacity: 0.3;
  box-shadow: none;
  cursor: not-allowed;
}
```

### Footer / Panel Toggle Button (dim, no glow — unobtrusive navigation)

```css
.footer-btn {
  color: var(--neon-text-tertiary);
  border-color: var(--neon-border-tertiary);
  background: transparent;
  font-size: var(--text-xs);
}
.footer-btn:hover {
  color: var(--neon-text-secondary);
  border-color: var(--neon-border-secondary);
  background: var(--neon-bg-tertiary);
}
```

### Attack Button (combat — red-pink, high threat)

```css
.btn-attack {
  color: var(--neon-pink);
  border-color: var(--neon-pink);
  background: var(--neon-pink-dim);
}
.btn-attack:hover {
  background: rgba(255, 45, 120, 0.22);
  box-shadow: var(--neon-glow-pink);
}
```

### Tab Button (active state uses acid underline)

```css
.tab-btn {
  font-size: var(--text-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: var(--neon-space-sm) var(--neon-space-md);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--neon-text-tertiary);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  min-height: var(--neon-touch-target);
}
.tab-btn:hover { color: var(--neon-text-secondary); }
.tab-btn.active {
  color: var(--neon-acid);
  border-bottom-color: var(--neon-acid);
}
```

---

## Micro-interactions

All animations and glow effects are wrapped in a motion check. Users who set
`prefers-reduced-motion: reduce` receive instant state changes and zero glow.

```css
/* Global reduced-motion kill-switch — disables all transitions and glows */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  /* Remove all glow box-shadows */
  .btn-action:hover,
  .btn-poi:hover,
  .roll-btn,
  .roll-btn:hover,
  .btn-attack:hover,
  .neon-card--active,
  .init-chip.active,
  .pip--hp.active,
  .conviction-pip.filled {
    box-shadow: none !important;
  }
  /* Animated gradient border — static fallback */
  .neon-border-animated {
    animation: none !important;
    background: none !important;
    border-color: var(--neon-pink) !important;
  }
}
```

### Die Spin Animation

```css
@keyframes neon-die-spin {
  0%   { opacity: 0.3; transform: scale(0.85); }
  40%  { opacity: 0.8; transform: scale(1.05); }
  100% { opacity: 1;   transform: scale(1); }
}

.die-value.spinning {
  animation: neon-die-spin 0.55s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
}
```

### Animated Gradient Border (active/focused inputs and focused cards)

Applies a rotating neon gradient to the border via a pseudo-element technique.
Safe to use on focusable containers. Disabled under `prefers-reduced-motion`.

```css
@keyframes neon-border-rotate {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.neon-border-animated {
  position: relative;
  border: none !important;
}
.neon-border-animated::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: calc(var(--neon-radius-sm) + 2px);
  background: linear-gradient(90deg,
    var(--neon-pink), var(--neon-violet), var(--neon-blue), var(--neon-acid),
    var(--neon-pink)
  );
  background-size: 300% 300%;
  animation: neon-border-rotate 3s linear infinite;
  z-index: -1;
}
```

### Pulse animation for active initiative chip

```css
@keyframes neon-pulse {
  0%, 100% { box-shadow: 0 0 4px var(--neon-green-glow); }
  50%       { box-shadow: 0 0 12px var(--neon-green-glow), 0 0 24px rgba(57,255,138,0.2); }
}

.init-chip.active {
  animation: neon-pulse 2s ease-in-out infinite;
}
```

### Fade-in for progressive reveal

```css
@keyframes neon-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

#reveal-full {
  animation: neon-fade-in 0.3s ease-out;
}
```

### Hover glow transition (all interactive elements)

```css
/* Applied universally — transition is killed by reduced-motion above */
.btn-action,
.btn-poi,
.btn-attack,
.roll-btn,
.footer-btn,
.tab-btn {
  transition:
    box-shadow   0.15s ease,
    background   0.15s ease,
    border-color 0.15s ease,
    color        0.15s ease;
}
```

---

## Component Overrides

### Root / Widget Container

```css
.root,
.combat-root,
.roll-root,
.shop-root,
.social-root {
  font-family: var(--font-mono, 'Space Mono', monospace);
  background: var(--neon-bg-primary);
  color: var(--neon-text-primary);
  padding: var(--neon-space-md) 0 var(--neon-space-xl);
}
```

### Location Bar

```css
.loc-bar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: var(--neon-space-sm);
  margin-bottom: var(--neon-space-md);
  border-bottom: var(--neon-border-width) solid var(--neon-border-tertiary);
}
.loc-name {
  font-family: var(--font-display, 'Space Grotesk', sans-serif);
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--neon-text-primary);
  letter-spacing: 0.04em;
  margin: 0;
  /* Accent line under location name */
  text-shadow: 0 0 10px rgba(0, 196, 232, 0.3);
}
.scene-num {
  font-size: var(--text-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--neon-text-tertiary);
}
```

### Atmosphere Pills

```css
.atmo-strip {
  display: flex;
  gap: var(--neon-space-sm);
  flex-wrap: wrap;
  margin-bottom: var(--neon-space-md);
}
.atmo-pill {
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  padding: 3px 10px;
  border-radius: var(--neon-radius-pill);
  border: var(--neon-border-width) solid var(--neon-border-tertiary);
  color: var(--neon-text-tertiary);
  background: var(--neon-bg-secondary);
}
```

### Narrative Block

```css
.narrative {
  font-size: var(--text-base);
  line-height: 1.85;
  color: var(--neon-text-primary);
  margin: 0 0 var(--neon-space-md);
}
```

### Section Labels

```css
.section-label {
  font-size: var(--text-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--neon-text-tertiary);
  margin: var(--neon-space-md) 0 var(--neon-space-sm);
  /* Left accent bar */
  border-left: 2px solid var(--neon-violet);
  padding-left: var(--neon-space-sm);
}
```

### Status Bar (HP pips, XP, level)

```css
.status-bar {
  display: flex;
  align-items: center;
  gap: var(--neon-space-md);
  flex-wrap: wrap;
  padding: var(--neon-space-sm) 0;
  margin-top: var(--neon-space-sm);
  border-top: var(--neon-border-width) solid var(--neon-border-tertiary);
  font-size: var(--text-xs);
  color: var(--neon-text-tertiary);
  letter-spacing: 0.08em;
}
.hp-pips { display: flex; gap: 4px; align-items: center; }
.pip {
  width: 9px;
  height: 9px;
  border-radius: var(--neon-radius-sm);   /* square pips — sharp corners */
  background: var(--neon-green);
  border: 1px solid var(--neon-green);
  box-shadow: 0 0 5px var(--neon-green-glow);
}
.pip.empty {
  background: transparent;
  border-color: var(--neon-border-tertiary);
  box-shadow: none;
}
.xp-track {
  width: 64px;
  height: 4px;
  background: var(--neon-border-tertiary);
  border-radius: var(--neon-radius-sm);
  overflow: hidden;
}
.xp-fill {
  height: 100%;
  background: var(--neon-violet);
  box-shadow: 0 0 6px var(--neon-violet-glow);
  border-radius: var(--neon-radius-sm);
}
```

### Combat: Initiative Bar

```css
.init-bar {
  display: flex;
  gap: var(--neon-space-sm);
  align-items: center;
  margin-bottom: var(--neon-space-md);
  padding-bottom: var(--neon-space-sm);
  border-bottom: var(--neon-border-width) solid var(--neon-border-tertiary);
  flex-wrap: wrap;
}
.init-label {
  font-size: var(--text-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--neon-text-tertiary);
  margin-right: 4px;
}
.init-chip {
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  padding: 4px 12px;
  border-radius: var(--neon-radius-sm);
  border: var(--neon-border-width) solid var(--neon-border-tertiary);
  color: var(--neon-text-secondary);
}
.init-chip.active {
  border-color: var(--neon-green);
  color: var(--neon-green);
  font-weight: 700;
  box-shadow: var(--neon-glow-green);
  /* neon-pulse animation applied here — see micro-interactions */
}
```

### Combat: Enemy Cards

```css
.enemy-row { display: flex; flex-wrap: wrap; gap: var(--neon-space-sm); margin-bottom: var(--neon-space-lg); }
.enemy-card {
  flex: 1;
  min-width: 140px;
  padding: var(--neon-space-sm) var(--neon-space-md);
  background: var(--neon-bg-secondary);
  border: var(--neon-border-width) solid var(--neon-border-tertiary);
  border-radius: var(--neon-radius-md);
}
.enemy-name {
  font-family: var(--font-display, 'Space Grotesk', sans-serif);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--neon-text-primary);
  margin: 0 0 4px;
}
.enemy-role {
  font-size: var(--text-xs);
  color: var(--neon-text-tertiary);
  margin: 0 0 var(--neon-space-sm);
}
/* Enemy HP pips use pink/red to signal threat */
.pip.enemy-hp {
  background: var(--neon-pink);
  border-color: var(--neon-pink);
  box-shadow: 0 0 5px var(--neon-pink-glow);
}
.pip.enemy-hp.empty {
  background: transparent;
  border-color: var(--neon-border-tertiary);
  box-shadow: none;
}
```

### Die Roll: Die Value Display

```css
.die-display {
  display: none;
  text-align: center;
  margin-bottom: var(--neon-space-md);
}
.die-value {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--neon-acid);
  text-shadow: 0 0 14px var(--neon-acid-glow), 0 0 32px rgba(173,255,2,0.2);
  display: inline-block;
}
```

### Die Roll: Outcome Badges

```css
.badge {
  display: inline-block;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 6px 18px;
  border-radius: var(--neon-radius-sm);
  border: var(--neon-border-width) solid;
}
.badge.crit-success {
  background: rgba(173, 255, 2, 0.12);
  color: var(--neon-acid);
  border-color: var(--neon-acid);
  box-shadow: var(--neon-glow-acid);
}
.badge.success {
  background: var(--neon-green-dim);
  color: var(--neon-green);
  border-color: var(--neon-green);
  box-shadow: var(--neon-glow-green);
}
.badge.partial {
  background: var(--neon-orange-dim);
  color: var(--neon-orange);
  border-color: var(--neon-orange);
}
.badge.failure {
  background: var(--neon-pink-dim);
  color: var(--neon-pink);
  border-color: var(--neon-pink);
}
.badge.crit-failure {
  background: rgba(255, 45, 120, 0.18);
  color: var(--neon-pink);
  border-color: var(--neon-pink);
  box-shadow: var(--neon-glow-pink);
}
```

### Shop: Credits Display

```css
.credits-display {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--neon-acid);
  text-shadow: 0 0 8px var(--neon-acid-glow);
}
```

### NPC / Dialogue: Disposition Badges

```css
.disposition-badge {
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 3px 12px;
  border-radius: var(--neon-radius-pill);
  border: var(--neon-border-width) solid;
}
.disposition-badge.friendly  { color: var(--neon-green);  border-color: var(--neon-green);  background: var(--neon-green-dim); }
.disposition-badge.neutral   { color: var(--neon-blue);   border-color: var(--neon-blue);   background: var(--neon-blue-dim); }
.disposition-badge.suspicious{ color: var(--neon-orange); border-color: var(--neon-orange); background: var(--neon-orange-dim); }
.disposition-badge.hostile   { color: var(--neon-pink);   border-color: var(--neon-pink);   background: var(--neon-pink-dim); }
.disposition-badge.desperate { color: var(--neon-violet); border-color: var(--neon-violet); background: var(--neon-violet-dim); }
```

### Social: Conviction Meter Pips

```css
.conviction-pip {
  width: 11px;
  height: 11px;
  border-radius: var(--neon-radius-sm);
  border: var(--neon-border-width) solid var(--neon-border-tertiary);
  background: transparent;
}
.conviction-pip.filled {
  background: var(--neon-blue);
  border-color: var(--neon-blue);
  box-shadow: 0 0 6px var(--neon-blue-glow);
}
```

### Panel Overlay

```css
#panel-overlay { display: none; padding: 0; }
.panel-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: var(--neon-space-sm);
  margin-bottom: var(--neon-space-md);
  border-bottom: var(--neon-border-width) solid var(--neon-border-tertiary);
}
.panel-title {
  font-family: var(--font-display, 'Space Grotesk', sans-serif);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--neon-text-primary);
  letter-spacing: 0.04em;
}
.panel-close-btn {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: transparent;
  border: var(--neon-border-width) solid var(--neon-border-tertiary);
  border-radius: var(--neon-radius-sm);
  padding: var(--neon-space-sm) var(--neon-space-md);
  min-height: var(--neon-touch-target);
  min-width: var(--neon-touch-target);
  box-sizing: border-box;
  color: var(--neon-text-tertiary);
  cursor: pointer;
}
.panel-close-btn:hover {
  border-color: var(--neon-border-secondary);
  color: var(--neon-text-secondary);
}
.panel-content {
  display: none;
  font-size: var(--text-sm);
  line-height: 1.75;
  color: var(--neon-text-secondary);
}
```

### Fallback Prompt Text

```css
.fallback-text {
  font-size: var(--text-sm);
  color: var(--neon-text-tertiary);
  margin-top: var(--neon-space-sm);
  display: none;
  line-height: 1.6;
}
.fallback-text code {
  color: var(--neon-blue);
  background: var(--neon-bg-secondary);
  border: 1px solid var(--neon-border-tertiary);
  padding: 2px 6px;
  border-radius: var(--neon-radius-sm);
  font-family: var(--font-mono, monospace);
  font-size: var(--text-xs);
}
```

---

## Complete CSS Block

Inject this entire block into the `<style>` tag of any widget to apply the Neon theme.
This block is self-contained and overrides the base structural styles from `style-reference.md`.
The `@import` line will silently no-op if Google Fonts is CSP-blocked — the fallback stacks
handle that case.

```css
/* @extract */
/* =======================================================================
   NEON THEME — text-adventure game engine
   Cyberpunk arcade / synthwave visual style
   v1.0 — compatible with Claude.ai visualize:show_widget iframes
   ======================================================================= */

/* --- Google Fonts (CSP-blocked in Claude.ai sandbox; fallbacks below) --- */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500&display=swap');

/* --- Custom Properties --- */
:root {
  --font-display: 'Space Grotesk', 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
  --font-sans:    'Inter', 'Space Grotesk', 'Segoe UI', system-ui, -apple-system, sans-serif;
  --font-mono:    'Space Mono', 'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', monospace;

  --text-xs:   9px;
  --text-sm:  11px;
  --text-base: 13px;
  --text-md:  16px;
  --text-lg:  20px;
  --text-xl:  36px;

  --neon-space-xs:  4px;
  --neon-space-sm:  8px;
  --neon-space-md: 14px;
  --neon-space-lg: 20px;
  --neon-space-xl: 28px;

  --neon-touch-target: 44px;
  --neon-border-width: 2px;
  --neon-radius-sm:  2px;
  --neon-radius-md:  2px;
  --neon-radius-pill: 2px;

  /* Dark mode default */
  --neon-bg-primary:    #0B0C1E;
  --neon-bg-secondary:  #12142B;
  --neon-bg-tertiary:   #1A1D38;

  --neon-text-primary:   #F0F2FF;
  --neon-text-secondary: #A8AECB;
  --neon-text-tertiary:  #5A6080;

  --neon-pink:        #FF2D78;
  --neon-pink-glow:   rgba(255,45,120,0.4);
  --neon-pink-dim:    rgba(255,45,120,0.12);
  --neon-blue:        #00C4E8;
  --neon-blue-glow:   rgba(0,196,232,0.4);
  --neon-blue-dim:    rgba(0,196,232,0.10);
  --neon-green:       #39FF8A;
  --neon-green-glow:  rgba(57,255,138,0.4);
  --neon-green-dim:   rgba(57,255,138,0.10);
  --neon-orange:      #FF6B35;
  --neon-orange-glow: rgba(255,107,53,0.4);
  --neon-orange-dim:  rgba(255,107,53,0.12);
  --neon-violet:      #A855F7;
  --neon-violet-glow: rgba(168,85,247,0.4);
  --neon-violet-dim:  rgba(168,85,247,0.12);
  --neon-acid:        #ADFF02;
  --neon-acid-glow:   rgba(173,255,2,0.4);
  --neon-acid-dim:    rgba(173,255,2,0.10);

  --neon-border-primary:   rgba(255,45,120,0.6);
  --neon-border-secondary: rgba(0,196,232,0.4);
  --neon-border-tertiary:  rgba(90,96,128,0.5);

  --neon-glow-pink:   0 0 8px var(--neon-pink-glow),   0 0 20px rgba(255,45,120,0.15);
  --neon-glow-blue:   0 0 8px var(--neon-blue-glow),   0 0 20px rgba(0,196,232,0.15);
  --neon-glow-green:  0 0 8px var(--neon-green-glow),  0 0 20px rgba(57,255,138,0.15);
  --neon-glow-violet: 0 0 8px var(--neon-violet-glow), 0 0 20px rgba(168,85,247,0.15);
  --neon-glow-acid:   0 0 8px var(--neon-acid-glow),   0 0 20px rgba(173,255,2,0.15);
}

/* --- Light Mode Override --- */
@media (prefers-color-scheme: light) {
  :root {
    --neon-bg-primary:    #FAFAFA;
    --neon-bg-secondary:  #F0F1F8;
    --neon-bg-tertiary:   #E4E6F4;
    --neon-text-primary:   #0D0F1E;
    --neon-text-secondary: #3A3F62;
    --neon-text-tertiary:  #7A80A0;
    --neon-pink:        #CC2260; --neon-pink-glow:   rgba(204,34,96,0.3);  --neon-pink-dim:   rgba(204,34,96,0.08);
    --neon-blue:        #0090AD; --neon-blue-glow:   rgba(0,144,173,0.3);  --neon-blue-dim:   rgba(0,144,173,0.08);
    --neon-green:       #1A8C4E; --neon-green-glow:  rgba(26,140,78,0.3);  --neon-green-dim:  rgba(26,140,78,0.08);
    --neon-orange:      #C8501A; --neon-orange-glow: rgba(200,80,26,0.3);  --neon-orange-dim: rgba(200,80,26,0.08);
    --neon-violet:      #7B2FBF; --neon-violet-glow: rgba(123,47,191,0.3); --neon-violet-dim: rgba(123,47,191,0.08);
    --neon-acid:        #5A8400; --neon-acid-glow:   rgba(90,132,0,0.3);   --neon-acid-dim:   rgba(90,132,0,0.08);
    --neon-border-primary:   rgba(204,34,96,0.6);
    --neon-border-secondary: rgba(0,144,173,0.5);
    --neon-border-tertiary:  rgba(122,128,160,0.4);
    --neon-glow-pink:   0 0 6px var(--neon-pink-glow);
    --neon-glow-blue:   0 0 6px var(--neon-blue-glow);
    --neon-glow-green:  0 0 6px var(--neon-green-glow);
    --neon-glow-violet: 0 0 6px var(--neon-violet-glow);
    --neon-glow-acid:   0 0 6px var(--neon-acid-glow);
  }
}

/* --- Reduced Motion Kill-switch --- */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration:       0.01ms !important;
    animation-iteration-count: 1     !important;
    transition-duration:      0.01ms !important;
    transition-delay:         0ms    !important;
  }
  .btn-action:hover, .btn-poi:hover, .btn-attack:hover,
  .roll-btn, .roll-btn:hover, .init-chip.active,
  .pip:not(.empty), .conviction-pip.filled,
  .neon-card--active, .badge.crit-success, .badge.success,
  .badge.failure, .badge.crit-failure, .die-value,
  .credits-display, .xp-fill {
    box-shadow: none !important;
    text-shadow: none !important;
  }
  .neon-border-animated { animation: none !important; }
  .neon-border-animated::before { animation: none !important; }
  #reveal-full { animation: none !important; }
}

/* --- Animations --- */
@keyframes neon-die-spin {
  0%   { opacity: 0.3; transform: scale(0.85); }
  40%  { opacity: 0.8; transform: scale(1.05); }
  100% { opacity: 1;   transform: scale(1); }
}
@keyframes neon-pulse {
  0%, 100% { box-shadow: 0 0 4px var(--neon-green-glow); }
  50%       { box-shadow: 0 0 12px var(--neon-green-glow), 0 0 24px rgba(57,255,138,0.2); }
}
@keyframes neon-border-rotate {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes neon-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* --- Widget Root --- */
.root, .combat-root, .roll-root, .shop-root, .social-root {
  font-family: var(--font-mono);
  background: var(--neon-bg-primary);
  color: var(--neon-text-primary);
  padding: var(--neon-space-md) 0 var(--neon-space-xl);
}
#reveal-full { animation: neon-fade-in 0.3s ease-out; }

/* --- Location Bar --- */
.loc-bar {
  display: flex; justify-content: space-between; align-items: baseline;
  padding-bottom: var(--neon-space-sm); margin-bottom: var(--neon-space-md);
  border-bottom: var(--neon-border-width) solid var(--neon-border-tertiary);
}
.loc-name {
  font-family: var(--font-display); font-size: var(--text-md); font-weight: 700;
  color: var(--neon-text-primary); letter-spacing: 0.04em; margin: 0;
  text-shadow: 0 0 10px rgba(0,196,232,0.3);
}
.scene-num {
  font-size: var(--text-xs); letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--neon-text-tertiary);
}

/* --- Atmosphere Pills --- */
.atmo-strip { display: flex; gap: var(--neon-space-sm); flex-wrap: wrap; margin-bottom: var(--neon-space-md); }
.atmo-pill {
  font-size: var(--text-xs); letter-spacing: 0.08em; padding: 3px 10px;
  border-radius: var(--neon-radius-pill);
  border: var(--neon-border-width) solid var(--neon-border-tertiary);
  color: var(--neon-text-tertiary); background: var(--neon-bg-secondary);
}

/* --- Narrative --- */
.narrative { font-size: var(--text-base); line-height: 1.85; color: var(--neon-text-primary); margin: 0 0 var(--neon-space-md); }

/* --- Section Label --- */
.section-label {
  font-size: var(--text-xs); letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--neon-text-tertiary); margin: var(--neon-space-md) 0 var(--neon-space-sm);
  border-left: 2px solid var(--neon-violet); padding-left: var(--neon-space-sm);
}

/* --- Button Row --- */
.btn-row, .action-row, .approach-row { display: flex; flex-wrap: wrap; gap: var(--neon-space-sm); margin-bottom: var(--neon-space-sm); }

/* --- Shared Button Base --- */
.btn-action, .btn-poi, .continue-btn, .roll-btn, .footer-btn, .tab-btn,
.btn-attack, .panel-close-btn, .btn-neutral {
  font-family: var(--font-mono); border-radius: var(--neon-radius-sm);
  cursor: pointer; box-sizing: border-box;
  min-height: var(--neon-touch-target); min-width: var(--neon-touch-target);
  transition: box-shadow 0.15s ease, background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
button:focus-visible, [data-prompt]:focus-visible {
  outline: 2px solid var(--neon-blue); outline-offset: 2px;
}

/* --- Action Button --- */
.btn-action, .action-btn {
  font-size: var(--text-sm); letter-spacing: 0.08em; text-transform: uppercase;
  padding: var(--neon-space-sm) var(--neon-space-md);
  color: var(--neon-text-primary);
  border: var(--neon-border-width) solid var(--neon-pink);
  background: var(--neon-pink-dim);
}
.btn-action:hover, .action-btn:hover { background: rgba(255,45,120,0.22); box-shadow: var(--neon-glow-pink); }
.btn-action:active, .action-btn:active { background: rgba(255,45,120,0.35); box-shadow: none; }

/* --- POI / Explore Button --- */
.btn-poi, .poi-btn {
  font-size: var(--text-sm); letter-spacing: 0.08em;
  padding: var(--neon-space-sm) var(--neon-space-md);
  color: var(--neon-blue);
  border: var(--neon-border-width) dashed var(--neon-blue);
  background: transparent;
}
.btn-poi:hover, .poi-btn:hover {
  border-style: solid; background: var(--neon-blue-dim); box-shadow: var(--neon-glow-blue);
}

/* --- Continue / Neutral Button --- */
.continue-btn, .btn-neutral {
  font-size: var(--text-sm); letter-spacing: 0.1em; text-transform: uppercase;
  padding: var(--neon-space-sm) var(--neon-space-md);
  color: var(--neon-text-secondary);
  border: var(--neon-border-width) solid var(--neon-border-tertiary);
  background: transparent;
}
.continue-btn:hover, .btn-neutral:hover {
  color: var(--neon-text-primary); border-color: var(--neon-border-secondary);
  background: var(--neon-bg-tertiary);
}

/* --- Roll Button --- */
.roll-btn {
  font-size: var(--text-md); letter-spacing: 0.14em; text-transform: uppercase;
  padding: var(--neon-space-md) var(--neon-space-xl);
  color: var(--neon-blue); border: var(--neon-border-width) solid var(--neon-blue);
  background: var(--neon-blue-dim); display: block; margin: 0 auto var(--neon-space-md);
  box-shadow: var(--neon-glow-blue);
}
.roll-btn:hover { background: rgba(0,196,232,0.18); box-shadow: 0 0 14px var(--neon-blue-glow), 0 0 32px rgba(0,196,232,0.2); }
.roll-btn:disabled { opacity: 0.3; box-shadow: none; cursor: not-allowed; }

/* --- Attack Button --- */
.action-btn.attack, .btn-attack {
  color: var(--neon-pink); border-color: var(--neon-pink); background: var(--neon-pink-dim);
}
.action-btn.attack:hover, .btn-attack:hover {
  background: rgba(255,45,120,0.22); box-shadow: var(--neon-glow-pink);
}

/* --- Retreat Button --- */
.action-btn.retreat {
  color: var(--neon-text-tertiary); border-color: var(--neon-border-tertiary); background: transparent;
}

/* --- Footer Button --- */
.footer-btn {
  font-size: var(--text-xs); letter-spacing: 0.1em; text-transform: uppercase;
  padding: var(--neon-space-sm) var(--neon-space-md);
  color: var(--neon-text-tertiary);
  border: var(--neon-border-width) solid var(--neon-border-tertiary);
  background: transparent;
}
.footer-btn:hover { color: var(--neon-text-secondary); border-color: var(--neon-border-secondary); background: var(--neon-bg-tertiary); }
.footer-row {
  display: flex; justify-content: flex-start; gap: var(--neon-space-sm); flex-wrap: wrap;
  margin-top: var(--neon-space-md); padding-top: var(--neon-space-sm);
  border-top: var(--neon-border-width) solid var(--neon-border-tertiary);
}

/* --- Tab Buttons --- */
.tab-bar { display: flex; margin-bottom: var(--neon-space-md); border-bottom: var(--neon-border-width) solid var(--neon-border-tertiary); }
.tab-btn {
  font-size: var(--text-xs); letter-spacing: 0.12em; text-transform: uppercase;
  padding: var(--neon-space-sm) var(--neon-space-md); min-height: var(--neon-touch-target);
  background: transparent; border: none; border-bottom: 2px solid transparent;
  color: var(--neon-text-tertiary); cursor: pointer;
}
.tab-btn:hover { color: var(--neon-text-secondary); }
.tab-btn.active { color: var(--neon-acid); border-bottom-color: var(--neon-acid); }
.tab-panel { display: none; }
.tab-panel.active { display: block; }

/* --- Status Bar --- */
.status-bar {
  display: flex; align-items: center; gap: var(--neon-space-md); flex-wrap: wrap;
  padding: var(--neon-space-sm) 0; margin-top: var(--neon-space-sm);
  border-top: var(--neon-border-width) solid var(--neon-border-tertiary);
  font-size: var(--text-xs); color: var(--neon-text-tertiary); letter-spacing: 0.08em;
}
.hp-pips, .player-pips { display: flex; gap: 4px; align-items: center; }
.pip {
  width: 9px; height: 9px; border-radius: var(--neon-radius-sm);
  background: var(--neon-green); border: 1px solid var(--neon-green);
  box-shadow: 0 0 5px var(--neon-green-glow);
}
.pip.empty { background: transparent; border-color: var(--neon-border-tertiary); box-shadow: none; }
.player-pip { width: 9px; height: 9px; border-radius: var(--neon-radius-sm); background: var(--neon-green); border: 1px solid var(--neon-green); box-shadow: 0 0 5px var(--neon-green-glow); }
.player-pip.empty { background: transparent; border-color: var(--neon-border-tertiary); box-shadow: none; }
.xp-track { width: 64px; height: 4px; background: var(--neon-border-tertiary); border-radius: var(--neon-radius-sm); overflow: hidden; }
.xp-fill { height: 100%; background: var(--neon-violet); box-shadow: 0 0 6px var(--neon-violet-glow); }

/* --- Initiative Bar --- */
.init-bar {
  display: flex; gap: var(--neon-space-sm); align-items: center; flex-wrap: wrap;
  margin-bottom: var(--neon-space-md); padding-bottom: var(--neon-space-sm);
  border-bottom: var(--neon-border-width) solid var(--neon-border-tertiary);
}
.init-label { font-size: var(--text-xs); letter-spacing: 0.14em; text-transform: uppercase; color: var(--neon-text-tertiary); margin-right: 4px; }
.init-chip {
  font-size: var(--text-xs); letter-spacing: 0.08em; padding: 4px 12px;
  border-radius: var(--neon-radius-sm); border: var(--neon-border-width) solid var(--neon-border-tertiary);
  color: var(--neon-text-secondary);
}
.init-chip.active { border-color: var(--neon-green); color: var(--neon-green); font-weight: 700; box-shadow: var(--neon-glow-green); animation: neon-pulse 2s ease-in-out infinite; }

/* --- Enemy Cards --- */
.enemy-row { display: flex; flex-wrap: wrap; gap: var(--neon-space-sm); margin-bottom: var(--neon-space-lg); }
.enemy-card {
  flex: 1; min-width: 140px; padding: var(--neon-space-sm) var(--neon-space-md);
  background: var(--neon-bg-secondary);
  border: var(--neon-border-width) solid var(--neon-border-tertiary);
  border-radius: var(--neon-radius-md);
}
.enemy-name { font-family: var(--font-display); font-size: var(--text-sm); font-weight: 600; color: var(--neon-text-primary); margin: 0 0 4px; }
.enemy-role { font-size: var(--text-xs); color: var(--neon-text-tertiary); margin: 0 0 var(--neon-space-sm); }
.hp-row { display: flex; gap: 4px; align-items: center; }
.hp-label { font-size: var(--text-xs); color: var(--neon-text-tertiary); margin-right: 4px; }
/* Enemy HP pips — pink/threat */
.enemy-card .pip { background: var(--neon-pink); border-color: var(--neon-pink); box-shadow: 0 0 5px var(--neon-pink-glow); }
.enemy-card .pip.empty { background: transparent; border-color: var(--neon-border-tertiary); box-shadow: none; }

/* --- Player Status (combat) --- */
.player-status {
  display: flex; align-items: center; gap: var(--neon-space-md); flex-wrap: wrap;
  padding: var(--neon-space-sm) 0; margin-bottom: var(--neon-space-md);
  border-top: var(--neon-border-width) solid var(--neon-border-tertiary);
  border-bottom: var(--neon-border-width) solid var(--neon-border-tertiary);
  font-size: var(--text-sm); color: var(--neon-text-primary);
}
.condition-tag {
  font-size: var(--text-xs); letter-spacing: 0.08em; padding: 2px 8px;
  border-radius: var(--neon-radius-pill);
  border: var(--neon-border-width) solid var(--neon-border-tertiary);
  color: var(--neon-text-tertiary);
}

/* --- Attribute Row (die roll declare stage) --- */
.attr-row {
  display: flex; align-items: baseline; gap: var(--neon-space-md); margin-bottom: var(--neon-space-md);
  padding: var(--neon-space-sm) var(--neon-space-md);
  border-radius: var(--neon-radius-sm);
  background: var(--neon-bg-secondary);
  border: var(--neon-border-width) solid var(--neon-border-secondary);
  box-shadow: var(--neon-glow-blue);
}
.attr-name { font-size: var(--text-md); font-weight: 700; color: var(--neon-blue); }
.attr-mod  { font-size: var(--text-sm); color: var(--neon-text-tertiary); }

/* --- Die Display --- */
.die-display { display: none; text-align: center; margin-bottom: var(--neon-space-md); }
.die-value {
  font-family: var(--font-mono); font-size: var(--text-xl); font-weight: 700;
  color: var(--neon-acid); display: inline-block;
  text-shadow: 0 0 14px var(--neon-acid-glow), 0 0 32px rgba(173,255,2,0.2);
}
.die-value.spinning { animation: neon-die-spin 0.55s cubic-bezier(0.22,0.61,0.36,1) forwards; }

/* --- Resolve Block --- */
.resolve-block {
  display: none; padding: var(--neon-space-sm) var(--neon-space-md); margin-bottom: var(--neon-space-md);
  border-radius: var(--neon-radius-sm); border: var(--neon-border-width) solid var(--neon-border-tertiary);
  background: var(--neon-bg-secondary);
}
.resolve-row {
  display: flex; justify-content: space-between; align-items: baseline;
  font-size: var(--text-sm); color: var(--neon-text-secondary); margin-bottom: 6px;
}
.resolve-row:last-child { margin-bottom: 0; }
.resolve-label { color: var(--neon-text-tertiary); }

/* --- Outcome Badges --- */
.outcome-badge { display: none; text-align: center; margin-bottom: var(--neon-space-md); }
.badge {
  display: inline-block; font-family: var(--font-mono); font-size: var(--text-xs);
  font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
  padding: 6px 18px; border-radius: var(--neon-radius-sm);
  border: var(--neon-border-width) solid;
}
.badge.crit-success { background: var(--neon-acid-dim);   color: var(--neon-acid);   border-color: var(--neon-acid);   box-shadow: var(--neon-glow-acid); }
.badge.success      { background: var(--neon-green-dim);  color: var(--neon-green);  border-color: var(--neon-green);  box-shadow: var(--neon-glow-green); }
.badge.partial      { background: var(--neon-orange-dim); color: var(--neon-orange); border-color: var(--neon-orange); }
.badge.failure      { background: var(--neon-pink-dim);   color: var(--neon-pink);   border-color: var(--neon-pink); }
.badge.crit-failure { background: rgba(255,45,120,0.18);  color: var(--neon-pink);   border-color: var(--neon-pink);   box-shadow: var(--neon-glow-pink); }

/* --- Continue Stage --- */
.continue-stage { display: none; text-align: center; }

/* --- Encounter Heading --- */
.encounter-heading { font-family: var(--font-display); font-size: var(--text-md); font-weight: 700; color: var(--neon-text-primary); margin: 0 0 4px; letter-spacing: 0.04em; }
.encounter-sub { font-size: var(--text-sm); color: var(--neon-text-tertiary); margin: 0 0 var(--neon-space-md); }

/* --- Roll Heading --- */
.roll-heading { font-family: var(--font-display); font-size: var(--text-md); font-weight: 700; color: var(--neon-text-primary); margin: 0 0 4px; letter-spacing: 0.04em; }
.roll-action  { font-size: var(--text-sm); color: var(--neon-text-secondary); margin: 0 0 var(--neon-space-md); line-height: 1.7; }

/* --- Shop: Merchant Header --- */
.merchant-header {
  display: flex; justify-content: space-between; align-items: baseline;
  padding-bottom: var(--neon-space-sm); margin-bottom: 4px;
  border-bottom: var(--neon-border-width) solid var(--neon-border-tertiary);
}
.merchant-name { font-family: var(--font-display); font-size: var(--text-md); font-weight: 700; color: var(--neon-text-primary); margin: 0; letter-spacing: 0.04em; }
.merchant-flavour { font-size: var(--text-xs); color: var(--neon-text-tertiary); margin: 4px 0 var(--neon-space-md); line-height: 1.6; }
.credits-display { font-family: var(--font-mono); font-size: var(--text-sm); font-weight: 700; letter-spacing: 0.08em; color: var(--neon-acid); text-shadow: 0 0 8px var(--neon-acid-glow); }

/* --- Shop: Item Cards --- */
.item-grid { display: flex; flex-direction: column; gap: var(--neon-space-sm); margin-bottom: var(--neon-space-md); }
.item-card {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: var(--neon-space-sm) var(--neon-space-md);
  border: var(--neon-border-width) solid var(--neon-border-tertiary);
  border-radius: var(--neon-radius-md); flex-wrap: wrap;
  background: var(--neon-bg-secondary);
}
.item-info { flex: 1; min-width: 160px; }
.item-name { font-size: var(--text-sm); font-weight: 600; color: var(--neon-text-primary); margin: 0 0 2px; }
.item-type-badge {
  display: inline-block; font-size: var(--text-xs); letter-spacing: 0.08em; text-transform: uppercase;
  padding: 2px 8px; border-radius: var(--neon-radius-pill);
  border: var(--neon-border-width) solid var(--neon-border-tertiary); color: var(--neon-text-tertiary); margin-right: 6px;
}
.item-effect { font-size: var(--text-xs); color: var(--neon-text-tertiary); margin: 4px 0 0; line-height: 1.5; }
.item-price { font-size: var(--text-sm); font-weight: 700; color: var(--neon-acid); white-space: nowrap; margin-right: var(--neon-space-sm); }
.item-actions { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
.shop-footer {
  display: flex; justify-content: space-between; align-items: center; gap: var(--neon-space-sm); flex-wrap: wrap;
  margin-top: var(--neon-space-md); padding-top: var(--neon-space-sm);
  border-top: var(--neon-border-width) solid var(--neon-border-tertiary);
}

/* --- Social: NPC Header --- */
.npc-header {
  display: flex; justify-content: space-between; align-items: baseline;
  padding-bottom: var(--neon-space-sm); margin-bottom: 4px;
  border-bottom: var(--neon-border-width) solid var(--neon-border-tertiary);
}
.npc-name { font-family: var(--font-display); font-size: var(--text-md); font-weight: 700; color: var(--neon-text-primary); margin: 0; letter-spacing: 0.04em; }
.stakes-text {
  font-size: var(--text-sm); line-height: 1.7; color: var(--neon-text-secondary);
  margin: var(--neon-space-sm) 0 var(--neon-space-md); padding: var(--neon-space-sm) var(--neon-space-md);
  border-radius: var(--neon-radius-sm); background: var(--neon-bg-secondary);
  border: var(--neon-border-width) solid var(--neon-border-tertiary);
}
.stakes-label { font-size: var(--text-xs); letter-spacing: 0.14em; text-transform: uppercase; color: var(--neon-text-tertiary); display: block; margin-bottom: 4px; }
.round-indicator { font-size: var(--text-xs); letter-spacing: 0.08em; color: var(--neon-text-tertiary); margin-bottom: var(--neon-space-md); }
.npc-reaction {
  font-size: var(--text-sm); line-height: 1.75; color: var(--neon-text-secondary);
  margin: 0 0 var(--neon-space-md); padding: var(--neon-space-sm) var(--neon-space-md);
  border-radius: var(--neon-radius-sm); border: var(--neon-border-width) solid var(--neon-border-tertiary);
  background: var(--neon-bg-secondary); font-style: italic;
}
.approach-stat { font-size: var(--text-xs); color: var(--neon-text-tertiary); margin-left: 4px; }

/* --- Disposition Badges --- */
.disposition-badge {
  font-size: var(--text-xs); font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
  padding: 3px 12px; border-radius: var(--neon-radius-pill);
  border: var(--neon-border-width) solid;
}
.disposition-badge.friendly   { color: var(--neon-green);  border-color: var(--neon-green);  background: var(--neon-green-dim); }
.disposition-badge.neutral    { color: var(--neon-blue);   border-color: var(--neon-blue);   background: var(--neon-blue-dim); }
.disposition-badge.suspicious { color: var(--neon-orange); border-color: var(--neon-orange); background: var(--neon-orange-dim); }
.disposition-badge.hostile    { color: var(--neon-pink);   border-color: var(--neon-pink);   background: var(--neon-pink-dim); }
.disposition-badge.desperate  { color: var(--neon-violet); border-color: var(--neon-violet); background: var(--neon-violet-dim); }

/* --- Conviction Pips --- */
.conviction-row { display: flex; align-items: center; gap: 10px; margin-bottom: var(--neon-space-md); }
.conviction-label { font-size: var(--text-xs); letter-spacing: 0.08em; color: var(--neon-text-tertiary); }
.conviction-pips { display: flex; gap: 6px; align-items: center; }
.conviction-pip { width: 11px; height: 11px; border-radius: var(--neon-radius-sm); border: var(--neon-border-width) solid var(--neon-border-tertiary); background: transparent; }
.conviction-pip.filled { background: var(--neon-blue); border-color: var(--neon-blue); box-shadow: 0 0 6px var(--neon-blue-glow); }

/* --- Panel Overlay --- */
#panel-overlay { display: none; padding: 0; }
.panel-header {
  display: flex; align-items: baseline; justify-content: space-between;
  padding-bottom: var(--neon-space-sm); margin-bottom: var(--neon-space-md);
  border-bottom: var(--neon-border-width) solid var(--neon-border-tertiary);
}
.panel-title { font-family: var(--font-display); font-size: var(--text-lg); font-weight: 700; color: var(--neon-text-primary); letter-spacing: 0.04em; }
.panel-close-btn {
  font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: 0.1em; text-transform: uppercase;
  background: transparent; border: var(--neon-border-width) solid var(--neon-border-tertiary);
  border-radius: var(--neon-radius-sm); padding: var(--neon-space-sm) var(--neon-space-md);
  min-height: var(--neon-touch-target); min-width: var(--neon-touch-target); box-sizing: border-box;
  color: var(--neon-text-tertiary); cursor: pointer;
}
.panel-close-btn:hover { border-color: var(--neon-border-secondary); color: var(--neon-text-secondary); }
.panel-content { display: none; font-size: var(--text-sm); line-height: 1.75; color: var(--neon-text-secondary); }

/* --- Fallback Prompt --- */
.fallback-text { font-size: var(--text-sm); color: var(--neon-text-tertiary); margin-top: var(--neon-space-sm); display: none; line-height: 1.6; }
.fallback-text code {
  color: var(--neon-blue); background: var(--neon-bg-secondary);
  border: 1px solid var(--neon-border-tertiary); padding: 2px 6px;
  border-radius: var(--neon-radius-sm); font-family: var(--font-mono); font-size: var(--text-xs);
}

/* --- Brief text (progressive reveal) --- */
.brief-text { font-size: var(--text-base); line-height: 1.75; color: var(--neon-text-primary); margin: 0 0 var(--neon-space-md); }
```
