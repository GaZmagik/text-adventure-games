---
name: sveltekit
description: >
  Modern web-framework aesthetic inspired by svelte.dev and kit.svelte.dev. Light-mode
  primary with Svelte orange as the primary accent — warm, energetic, and component-driven.
  Every element feels like a well-crafted design-system component. Clean system fonts,
  8px card radius, and a polished dark mode that treats darkness as a feature rather than
  an afterthought. Zero external font dependencies.
best-for:
  - contemporary
  - urban
  - heist
  - thriller
  - mystery
  - comedy
  - slice-of-life
  - corporate-espionage
  - near-future
  output-styles:
    - Casual Narrator
    - Witty Raconteur
    - Pulp Action
    - Sharp Dialogue
    - Documentary Style
---

## Design Philosophy

The SvelteKit style is the antithesis of the dark terminal aesthetic. Where other styles
embrace the comfort of darkness and the safety of a monospace shell, this style steps into
the light — literally. White backgrounds, clean system fonts, and Svelte's signature orange
create an interface that feels like a beautiful web application rather than a game UI.

This is intentional. Not every story takes place in a space station or a dungeon. Some
happen in offices, coffee shops, city streets, and boardrooms. The SvelteKit style is the
right choice for those stories — the ones where the player's mental model should feel like
reality with a UI overlay, not a terminal readout.

**The core tension this style resolves** is legibility versus atmosphere. Most game UIs
sacrifice one for the other — either clean-but-cold or atmospheric-but-strained. The
SvelteKit approach solves this with generous white space, a system font stack chosen for
maximum native rendering quality, and an accent colour (Svelte orange, `#FF3E00`) that is
warm and human rather than clinical or sci-fi.

**Component-driven layout** is the other defining principle. Every discrete piece of
information — a stat block, an action choice, an NPC's reaction — lives inside a clearly
bounded card with consistent padding and radius. The player's eye never has to hunt. Cards
cluster into grids; grids stack into widgets; widgets tell a story. The overall aesthetic
is: browsing svelte.dev's interactive playground, but instead of component previews,
you're playing a game.

**Colour is semantic but warmer.** The Station style uses cool cyan and purple; this style
uses the Svelte ecosystem's own palette. Orange for primary actions and emphasis. Teal
(`#40B3A2`) for success and health. Red (`#D4463B`) for danger. Amber (`#E8A84C`) for
caution. Indigo (`#677DC0`) for XP and progression. These are friendlier, more saturated
values that read clearly on white backgrounds.

**Accessibility is held to the same standard as all other styles.** All foreground/background
pairs meet WCAG AA (4.5:1 for body text, 3:1 for large text and UI). Light mode contrast
is calculated against `#FFFFFF`; dark mode against `#1A1B26`. Touch targets are 44×44px
throughout. Animations are entirely eliminated under `prefers-reduced-motion` — not merely
slowed, but removed.

---

## Typography

### Design Rationale

The SvelteKit style uses the system font stack — the same stack svelte.dev itself uses.
This is a deliberate feature, not a compromise. System fonts:

- Render instantly — no flash of unstyled text, no layout shift, no CSP exposure
- Match the user's native OS rendering (subpixel antialiasing, hinting, weight calibration)
- Feel native and trustworthy — the same font the user reads their emails in

Unlike the Station style's typographic bifurcation (serif narrative / mono mechanical),
the SvelteKit style uses a **single-stack approach with weight differentiation**. The
system sans-serif carries everything; mechanical elements are distinguished by weight,
size, letter-spacing, and monospace overrides rather than a wholesale face change.
Monospace is reserved strictly for code-like elements — dice notation, stat values,
roll breakdowns — where the fixed-width alignment adds genuine semantic value.

### Font Stacks

```css
/* Primary — system sans-serif (the svelte.dev stack) */
--svk-font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                    Oxygen, Ubuntu, Cantarell, sans-serif;

/* Monospace — for mechanical/code elements only */
--svk-font-mono:    'Fira Code', 'JetBrains Mono', 'Cascadia Code',
                    'SF Mono', 'Consolas', 'Courier New', monospace;
```

No external font imports. Zero loading risk. Zero CSP concerns.

### Sizing Scale

```css
--svk-text-xs:    10px;   /* badge labels, pill text, atmo pills */
--svk-text-sm:    12px;   /* secondary UI, monospace stat labels */
--svk-text-base:  15px;   /* narrative body — comfortable reading */
--svk-text-md:    17px;   /* section headings, panel titles */
--svk-text-lg:    20px;   /* widget headings, location names */
--svk-text-xl:    38px;   /* die value display */
--svk-text-stat:  20px;   /* stat values (STR/DEX/etc) */
```

### Letter Spacing

- Location name / display headings: `letter-spacing: 0.01em` (tight — confident)
- Section labels, uppercase caps: `letter-spacing: 0.08em`
- Badge and pill text: `letter-spacing: 0.06em`
- Monospace stat labels: `letter-spacing: 0.04em`
- Footer / tab buttons: `letter-spacing: 0.05em`

### Line Height

- Narrative prose: `line-height: 1.65` — comfortable for sustained reading
- Brief / intro text: `line-height: 1.6`
- Mechanical text (mono): `line-height: 1.45`
- Labels and badges: `line-height: 1.2`
- Card titles: `line-height: 1.3`

### Narrative Text Highlights

Within prose paragraphs, inline spans signal interactability:

```css
/* Interactable NPCs — teal (success colour family) */
.nar-npc   { color: var(--svk-color-success); font-weight: 600; }

/* Interactable items — amber/gold */
.nar-item  { color: var(--svk-color-currency); font-weight: 600; }

/* Sound effects / emphasis — orange uppercase */
.nar-sfx   { color: var(--svk-color-accent); font-weight: 700;
             text-transform: uppercase; letter-spacing: 0.05em; }

/* Character names — bold primary text */
.nar-name  { color: var(--svk-text-primary); font-weight: 700; }

/* Asides / whispers — muted italic */
.nar-aside { font-style: italic; color: var(--svk-text-secondary); }
```

---

## Colour Palette

The SvelteKit palette uses the `--svk-` prefix to avoid collisions with Claude.ai host
theme variables. Light mode is the primary expression; dark mode is a full, considered
retheme — not a simple inversion.

Light mode contrast ratios are calculated against `#FFFFFF`.
Dark mode contrast ratios are calculated against `#1A1B26`.

### Light Mode (primary)

```css
:host {

  /* ── Surfaces ──────────────────────────────────────────────────────── */
  --svk-bg-primary:      #FFFFFF;   /* pure white — main background */
  --svk-bg-secondary:    #F6F6F6;   /* light grey — cards, insets */
  --svk-bg-tertiary:     #EFEFEF;   /* slightly deeper — hover states */
  --svk-bg-overlay:      #F9F9F9;   /* panel overlays */
  --svk-bg-stat-cell:    #F2F2F2;   /* stat grid cells */

  /* ── Text ──────────────────────────────────────────────────────────── */
  --svk-text-primary:    #1A1A1A;   /* near-black — 19.5:1 on white */
  --svk-text-secondary:  #4A4A4A;   /* dark grey — 9.7:1 on white */
  --svk-text-tertiary:   #767676;   /* mid grey — 4.6:1 on white — AA */
  --svk-text-label:      #767676;   /* same — used for small labels */

  /* ── Primary Accent — Svelte Orange ───────────────────────────────── */
  /* #FF3E00 is 3.1:1 on white — use only for large text (18px+) or UI components.
     For body-size text on white, darken to #CC3200 (4.6:1). */
  --svk-color-accent:          #CC3200;   /* darkened for body AA — 4.6:1 on white */
  --svk-color-accent-display:  #FF3E00;   /* full Svelte orange for large/UI elements */
  --svk-color-accent-hover:    #B02A00;   /* deeper hover */
  --svk-color-accent-bg:       rgba(255, 62, 0, 0.07);
  --svk-color-accent-bg-hover: rgba(255, 62, 0, 0.13);

  /* ── Success / Health — Svelte Teal ───────────────────────────────── */
  --svk-color-success:         #1E8C7E;   /* 4.6:1 on white — AA */
  --svk-color-success-border:  #177068;
  --svk-color-success-bg:      rgba(64, 179, 162, 0.10);
  --svk-color-success-bg-hover: rgba(64, 179, 162, 0.18);

  /* ── Danger / Threat — Svelte Red ─────────────────────────────────── */
  --svk-color-danger:          #B83530;   /* 5.1:1 on white — AA */
  --svk-color-danger-border:   #962B27;
  --svk-color-danger-bg:       rgba(212, 70, 59, 0.09);
  --svk-color-danger-bg-hover: rgba(212, 70, 59, 0.16);

  /* ── Warning / Caution — Amber ────────────────────────────────────── */
  --svk-color-warning:         #9A6800;   /* 6.3:1 on white — AA */
  --svk-color-warning-border:  rgba(154, 104, 0, 0.50);
  --svk-color-warning-bg:      rgba(232, 168, 76, 0.10);

  /* ── XP / Progression — Info Blue-Indigo ──────────────────────────── */
  --svk-color-xp:              #4A5FA8;   /* 5.8:1 on white — AA */
  --svk-color-xp-dim:          rgba(103, 125, 192, 0.12);
  --svk-color-xp-border:       rgba(103, 125, 192, 0.45);

  /* ── Currency / Gold ──────────────────────────────────────────────── */
  --svk-color-currency:        #8A6200;   /* 6.8:1 on white — AA */
  --svk-color-currency-dim:    rgba(138, 98, 0, 0.10);
  --svk-color-currency-border: rgba(138, 98, 0, 0.40);

  /* ── Emphasis ─────────────────────────────────────────────────────── */
  --svk-color-text-emphasis:   #000000;   /* pure black for dramatic names */

  /* ── Borders ──────────────────────────────────────────────────────── */
  --svk-border-primary:   #E2E2E2;         /* standard card border — 1px solid */
  --svk-border-secondary: #D0D0D0;         /* interactive hover border */
  --svk-border-tertiary:  #EBEBEB;         /* dim structural border */
  --svk-border-accent:    rgba(255, 62, 0, 0.40);  /* orange-tinted border */
  --svk-border-width:     1px;

  /* ── Border Radius ────────────────────────────────────────────────── */
  --svk-radius-sm:   4px;    /* small elements — pips, badges, pills */
  --svk-radius-md:   6px;    /* buttons */
  --svk-radius-lg:   8px;    /* cards, panels — the SvelteKit signature */
  --svk-radius-pill: 999px;  /* pill badges, condition tags */

  /* ── Shadows ──────────────────────────────────────────────────────── */
  --svk-shadow-card:   0 1px 3px rgba(0, 0, 0, 0.07), 0 1px 2px rgba(0, 0, 0, 0.04);
  --svk-shadow-raised: 0 4px 6px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04);
  --svk-shadow-focus:  0 0 0 3px rgba(255, 62, 0, 0.25);

  /* ── Outcome Badge Colours ────────────────────────────────────────── */
  --svk-badge-success-bg:          rgba(30, 140, 126, 0.12);
  --svk-badge-success-text:        #145E55;
  --svk-badge-partial-bg:          rgba(154, 104, 0, 0.12);
  --svk-badge-partial-text:        #7A5000;
  --svk-badge-failure-bg:          rgba(184, 53, 48, 0.12);
  --svk-badge-failure-text:        #8A2020;
  --svk-badge-crit-success-border: #1E8C7E;
  --svk-badge-crit-failure-border: #B83530;

  /* ── Stat Modifier Colours ────────────────────────────────────────── */
  --svk-modifier-positive: var(--svk-color-success);
  --svk-modifier-zero:     var(--svk-text-tertiary);
  --svk-modifier-negative: var(--svk-color-danger);

  /* ── Die Colours ──────────────────────────────────────────────────── */
  --die-border-color:       #D0D0D0;
  --die-bg:                 #F6F6F6;
  --die-text-color:         #1A1A1A;
  --die-hover-bg:           rgba(255, 62, 0, 0.08);
  --die-hover-border:       rgba(255, 62, 0, 0.50);
  --die-rolled-bg:          #EFEFEF;
  --die-rolled-border:      #E2E2E2;
  --die-animation-duration: 0.55s;

  /* ── CSS Custom Property Contract (required by style-reference.md) ── */
  --ta-font-heading:              var(--svk-font-primary);
  --ta-font-body:                 var(--svk-font-mono);
  --ta-color-accent:              var(--svk-color-accent-display);
  --ta-color-accent-hover:        var(--svk-color-accent-hover);
  --ta-color-accent-bg:           var(--svk-color-accent-bg);
  --ta-color-accent-bg-hover:     var(--svk-color-accent-bg-hover);
  --ta-color-success:             var(--svk-color-success);
  --ta-color-success-border:      var(--svk-color-success-border);
  --ta-color-danger:              var(--svk-color-danger);
  --ta-color-danger-border:       var(--svk-color-danger-border);
  --ta-color-danger-bg:           var(--svk-color-danger-bg);
  --ta-color-danger-bg-hover:     var(--svk-color-danger-bg-hover);
  --ta-color-warning:             var(--svk-color-warning);
  --ta-color-warning-border:      var(--svk-color-warning-border);
  --ta-color-warning-bg:          var(--svk-color-warning-bg);
  --ta-color-xp:                  var(--svk-color-xp);
  --ta-color-focus:               var(--svk-color-accent-display);
  --ta-color-conviction:          #5B49D4;
  --ta-color-conviction-border:   #4A39C0;
  --ta-badge-success-bg:          var(--svk-badge-success-bg);
  --ta-badge-success-text:        var(--svk-badge-success-text);
  --ta-badge-partial-bg:          var(--svk-badge-partial-bg);
  --ta-badge-partial-text:        var(--svk-badge-partial-text);
  --ta-badge-failure-bg:          var(--svk-badge-failure-bg);
  --ta-badge-failure-text:        var(--svk-badge-failure-text);
  --ta-badge-crit-success-border: var(--svk-badge-crit-success-border);
  --ta-badge-crit-failure-border: var(--svk-badge-crit-failure-border);
  --ta-color-credits:             var(--svk-color-currency);
  --ta-color-tab-active:          var(--svk-color-accent-display);
  --ta-color-info:                #3B82F6;
  --ta-btn-primary-text:          #ffffff;
  --ta-border-style-poi:          1px dashed;
  --ta-die-spin-duration:         0.55s;

  /* --- Speaker colours (multi-dialogue) --- */
  --speaker-color-0: #ff3e00;
  --speaker-color-1: #40b3ff;
  --speaker-color-2: #ff6d3a;
  --speaker-color-3: #676778;
  --speaker-color-4: #ffffff;
  --speaker-color-5: #1c1c1c;
}
```

### Dark Mode Override

Dark mode uses deep charcoal surfaces with warm grey cards — not the cold navy of Station
but something earthier and more grounded. Svelte orange remains the accent but is tuned to
be slightly brighter for legibility on dark surfaces.

```css
@media (prefers-color-scheme: dark) {
  :host {

    /* ── Surfaces ────────────────────────────────────────────────────── */
    --svk-bg-primary:      #1A1B26;   /* deep charcoal — main background */
    --svk-bg-secondary:    #24253A;   /* warm grey — cards, insets */
    --svk-bg-tertiary:     #2E2F47;   /* elevated — hover states */
    --svk-bg-overlay:      #20213A;   /* panel overlays */
    --svk-bg-stat-cell:    #22243C;   /* stat grid cells */

    /* ── Text ────────────────────────────────────────────────────────── */
    --svk-text-primary:    #F0F0F0;   /* warm near-white — 16.7:1 on bg */
    --svk-text-secondary:  #A8A8B8;   /* muted — 7.1:1 on bg */
    --svk-text-tertiary:   #60607A;   /* dim — 3.1:1 — large text only */
    --svk-text-label:      #70708A;   /* 4.5:1 on bg — label minimum */

    /* ── Primary Accent — Svelte Orange (brightened for dark) ────────── */
    --svk-color-accent:          #FF5E20;   /* boosted orange — 5.2:1 on bg */
    --svk-color-accent-display:  #FF5E20;
    --svk-color-accent-hover:    #FF7040;
    --svk-color-accent-bg:       rgba(255, 62, 0, 0.12);
    --svk-color-accent-bg-hover: rgba(255, 62, 0, 0.20);

    /* ── Success / Health ────────────────────────────────────────────── */
    --svk-color-success:         #3DC4B0;   /* bright teal — 5.8:1 on bg */
    --svk-color-success-border:  #2FA090;
    --svk-color-success-bg:      rgba(61, 196, 176, 0.10);
    --svk-color-success-bg-hover: rgba(61, 196, 176, 0.18);

    /* ── Danger / Threat ─────────────────────────────────────────────── */
    --svk-color-danger:          #E05550;   /* warm red — 5.4:1 on bg */
    --svk-color-danger-border:   #BC3E3A;
    --svk-color-danger-bg:       rgba(224, 85, 80, 0.10);
    --svk-color-danger-bg-hover: rgba(224, 85, 80, 0.18);

    /* ── Warning / Caution ───────────────────────────────────────────── */
    --svk-color-warning:         #E8A84C;   /* amber — 7.0:1 on bg */
    --svk-color-warning-border:  rgba(232, 168, 76, 0.50);
    --svk-color-warning-bg:      rgba(232, 168, 76, 0.10);

    /* ── XP / Progression ────────────────────────────────────────────── */
    --svk-color-xp:              #8090D8;   /* lavender-blue — 5.3:1 on bg */
    --svk-color-xp-dim:          rgba(128, 144, 216, 0.12);
    --svk-color-xp-border:       rgba(128, 144, 216, 0.45);

    /* ── Currency ────────────────────────────────────────────────────── */
    --svk-color-currency:        #D4A840;   /* warm gold — 7.8:1 on bg */
    --svk-color-currency-dim:    rgba(212, 168, 64, 0.12);
    --svk-color-currency-border: rgba(212, 168, 64, 0.45);

    /* ── Emphasis ────────────────────────────────────────────────────── */
    --svk-color-text-emphasis:   #FFFFFF;

    /* ── Borders ─────────────────────────────────────────────────────── */
    --svk-border-primary:   #2E2F42;
    --svk-border-secondary: #3A3B58;
    --svk-border-tertiary:  #272840;
    --svk-border-accent:    rgba(255, 94, 32, 0.40);

    /* ── Shadows ─────────────────────────────────────────────────────── */
    --svk-shadow-card:   0 1px 3px rgba(0, 0, 0, 0.30), 0 1px 2px rgba(0, 0, 0, 0.20);
    --svk-shadow-raised: 0 4px 8px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.20);
    --svk-shadow-focus:  0 0 0 3px rgba(255, 94, 32, 0.30);

    /* ── Outcome Badges ──────────────────────────────────────────────── */
    --svk-badge-success-bg:          rgba(61, 196, 176, 0.14);
    --svk-badge-success-text:        #7ADDD0;
    --svk-badge-partial-bg:          rgba(232, 168, 76, 0.14);
    --svk-badge-partial-text:        #E8C070;
    --svk-badge-failure-bg:          rgba(224, 85, 80, 0.14);
    --svk-badge-failure-text:        #F09090;
    --svk-badge-crit-success-border: #3DC4B0;
    --svk-badge-crit-failure-border: #E05550;

    /* ── Die Colours ─────────────────────────────────────────────────── */
    --die-border-color:       #3A3B58;
    --die-bg:                 #24253A;
    --die-text-color:         #F0F0F0;
    --die-hover-bg:           rgba(255, 94, 32, 0.12);
    --die-hover-border:       rgba(255, 94, 32, 0.55);
    --die-rolled-bg:          #1E1F30;
    --die-rolled-border:      #2E2F42;

    /* ── Re-assign contract variables for dark mode ───────────────────── */
    --ta-color-accent:              var(--svk-color-accent);
    --ta-color-accent-hover:        var(--svk-color-accent-hover);
    --ta-color-accent-bg:           var(--svk-color-accent-bg);
    --ta-color-accent-bg-hover:     var(--svk-color-accent-bg-hover);
    --ta-color-success:             var(--svk-color-success);
    --ta-color-success-border:      var(--svk-color-success-border);
    --ta-color-danger:              var(--svk-color-danger);
    --ta-color-danger-border:       var(--svk-color-danger-border);
    --ta-color-danger-bg:           var(--svk-color-danger-bg);
    --ta-color-danger-bg-hover:     var(--svk-color-danger-bg-hover);
    --ta-color-warning:             var(--svk-color-warning);
    --ta-color-warning-border:      var(--svk-color-warning-border);
    --ta-color-warning-bg:          var(--svk-color-warning-bg);
    --ta-color-xp:                  var(--svk-color-xp);
    --ta-color-focus:               var(--svk-color-accent);
    --ta-color-conviction:          #8878F8;
    --ta-color-conviction-border:   #7060E8;
    --ta-badge-success-bg:          var(--svk-badge-success-bg);
    --ta-badge-success-text:        var(--svk-badge-success-text);
    --ta-badge-partial-bg:          var(--svk-badge-partial-bg);
    --ta-badge-partial-text:        var(--svk-badge-partial-text);
    --ta-badge-failure-bg:          var(--svk-badge-failure-bg);
    --ta-badge-failure-text:        var(--svk-badge-failure-text);
    --ta-badge-crit-success-border: var(--svk-badge-crit-success-border);
    --ta-badge-crit-failure-border: var(--svk-badge-crit-failure-border);
    --ta-color-credits:             var(--svk-color-currency);
    --ta-color-tab-active:          var(--svk-color-accent);
  }
}
```

---

## Spacing & Layout

```css
/* Spacing scale */
--svk-space-xs:  4px;
--svk-space-sm:  8px;
--svk-space-md: 14px;
--svk-space-lg: 20px;
--svk-space-xl: 28px;

/* Widget padding and max-width */
--svk-widget-padding: 1rem 0 1.5rem;
--svk-content-max: 680px;

/* Touch target floor — WCAG 2.5.5 */
--svk-touch-target: 44px;

/* Section divider */
--svk-divider: 1px solid var(--svk-border-primary);
```

Layout uses flexbox throughout with `flex-wrap: wrap` on all flex containers. No CSS Grid
in widget bodies — maximises compatibility inside sandboxed iframes. Root uses
`max-width: 680px; margin: 0 auto` to cap line length on wide panels.

**Spacing hierarchy:**
- Between major widget sections: 16px
- Between items in a button row: 8px
- Between a section label and its content: 8px
- Between status-bar items: 16px
- Inner card padding: 12px vertical, 14px horizontal
- Card-to-card gap: 8px

The additional 2px on card padding (vs Station's 10–12px) reflects the lighter surface —
white backgrounds need slightly more interior breathing room to feel structured rather than
cramped.

---

## Borders & Surfaces

The SvelteKit style uses **1px solid borders** — the web-component standard. Heavier than
Station's 0.5px hairline, but not heavy-handed. The additional weight is appropriate for
light backgrounds: hairlines disappear on white; 1px reads as intentional structure.

**Card elevation is achieved through two mechanisms:**
1. A subtle box-shadow (`var(--svk-shadow-card)`) — gives cards a natural lift off the page
2. A slightly off-white card background (`#F6F6F6` on `#FFFFFF`) — the separation is gentle
   but present

The combination means cards feel real without looking like a corporate SharePoint dashboard.

**Border radius is 8px for cards** — rounder than Station's 6px, echoing the kit.svelte.dev
component library. Buttons use 6px; small elements (pips, badges) use 4px. Pill badges are
full 999px.

```css
/* Standard card surface */
.svk-card {
  background: var(--svk-bg-secondary);
  border: var(--svk-border-width) solid var(--svk-border-primary);
  border-radius: var(--svk-radius-lg);
  box-shadow: var(--svk-shadow-card);
  padding: var(--svk-space-md) var(--svk-space-lg);
}

/* Inset / recessed surface (attr blocks, NPC reaction, stakes) */
.svk-inset {
  background: var(--svk-bg-tertiary);
  border: var(--svk-border-width) solid var(--svk-border-tertiary);
  border-radius: var(--svk-radius-md);
  padding: var(--svk-space-sm) var(--svk-space-md);
}

/* Location name — left orange accent bar treatment */
.loc-name {
  border-left: 3px solid var(--svk-color-accent-display);
  padding-left: var(--svk-space-sm);
}

/* Active / selected card — orange border lift */
.svk-card--active {
  border-color: var(--svk-color-accent-display);
  box-shadow: var(--svk-shadow-raised);
}

/* Pill badge shape */
.svk-pill {
  border-radius: var(--svk-radius-pill);
  border: var(--svk-border-width) solid var(--svk-border-primary);
  padding: 3px 10px;
}

/* Orange tinted pill — important status */
.svk-pill--accent {
  background: var(--svk-color-accent-bg);
  border-color: var(--svk-border-accent);
  color: var(--svk-color-accent);
}

/* Muted grey pill — informational */
.svk-pill--muted {
  background: var(--svk-bg-secondary);
  color: var(--svk-text-tertiary);
}
```

---

## Interactive Elements

### Design Intent

Buttons in the SvelteKit style are confident and tactile. The primary action button has a
solid Svelte orange fill — no transparency, no ambiguity. This is the strongest primary CTA
of any style in this collection. It signals "press me" in the same way the svelte.dev
"Start building" button does.

Secondary and ghost buttons are restrained — transparent fills with clear borders — so that
the primary action always reads as the most important thing on screen.

The 0.98 scale-down on `:active` is the SvelteKit style's tactile signature: a tiny
physical press that makes digital buttons feel grounded.

### Base Reset

```css
button,
[data-prompt] {
  font-family: var(--svk-font-primary);
  cursor: pointer;
  box-sizing: border-box;
  min-height: var(--svk-touch-target);
  min-width: var(--svk-touch-target);
  border-radius: var(--svk-radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition:
    background     0.15s ease,
    border-color   0.15s ease,
    color          0.15s ease,
    box-shadow     0.15s ease,
    transform      0.10s ease;
}

/* Focus ring — orange outline + shadow combination */
button:focus-visible,
[data-prompt]:focus-visible {
  outline: 2px solid var(--svk-color-accent-display);
  outline-offset: 2px;
  box-shadow: var(--svk-shadow-focus);
}

/* Disabled */
button:disabled,
button[disabled] {
  opacity: 0.40;
  cursor: not-allowed;
  transform: none !important;
}
```

### Primary Action Button (solid orange fill)

Used for: primary scene actions, confirm, buy, submit. The most visually prominent button.

```css
.btn-action, .action-btn {
  font-size: var(--svk-text-sm);
  font-weight: 600;
  letter-spacing: 0.03em;
  padding: var(--svk-space-sm) var(--svk-space-lg);
  color: #FFFFFF;
  background: var(--svk-color-accent-display);
  border: none;
  border-radius: var(--svk-radius-md);
  box-shadow: 0 1px 2px rgba(255, 62, 0, 0.30);
}
.btn-action:hover, .action-btn:hover {
  background: var(--svk-color-accent-hover);
  box-shadow: 0 2px 6px rgba(255, 62, 0, 0.35);
}
.btn-action:active, .action-btn:active {
  transform: scale(0.98);
  box-shadow: none;
}
```

### Secondary Action Button (orange outline)

Used for: secondary actions, alternatives, non-destructive choices.

```css
.btn-secondary {
  font-size: var(--svk-text-sm);
  font-weight: 500;
  letter-spacing: 0.03em;
  padding: var(--svk-space-sm) var(--svk-space-lg);
  color: var(--svk-color-accent);
  background: transparent;
  border: 1px solid var(--svk-border-accent);
}
.btn-secondary:hover {
  background: var(--svk-color-accent-bg);
  border-color: var(--svk-color-accent);
}
.btn-secondary:active { transform: scale(0.98); }
```

### POI / Explore Button (dashed secondary — exploratory)

Used for: points of interest, inspect, examine.

```css
.btn-poi, .poi-btn {
  font-size: var(--svk-text-sm);
  font-weight: 400;
  letter-spacing: 0.03em;
  padding: var(--svk-space-sm) var(--svk-space-md);
  color: var(--svk-text-secondary);
  border: 1px dashed var(--svk-border-secondary);
  background: transparent;
}
.btn-poi:hover, .poi-btn:hover {
  border-style: solid;
  border-color: var(--svk-border-secondary);
  background: var(--svk-bg-secondary);
  color: var(--svk-text-primary);
}
.btn-poi:active, .poi-btn:active { transform: scale(0.98); }
```

### Continue / Ghost Button (neutral — tertiary)

Used for: continue, close, cancel, save.

```css
.continue-btn, .btn-neutral {
  font-size: var(--svk-text-sm);
  font-weight: 400;
  letter-spacing: 0.03em;
  padding: var(--svk-space-sm) var(--svk-space-md);
  color: var(--svk-text-secondary);
  border: 1px solid var(--svk-border-primary);
  background: transparent;
}
.continue-btn:hover, .btn-neutral:hover {
  border-color: var(--svk-border-secondary);
  color: var(--svk-text-primary);
  background: var(--svk-bg-secondary);
}
.continue-btn:active, .btn-neutral:active { transform: scale(0.98); }
```

### Roll Button (large, orange-accented — centrepiece of die roll widgets)

```css
.roll-btn {
  font-size: var(--svk-text-md);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: var(--svk-space-md) var(--svk-space-xl);
  color: #FFFFFF;
  background: var(--svk-color-accent-display);
  border: none;
  border-radius: var(--svk-radius-md);
  box-shadow: 0 2px 8px rgba(255, 62, 0, 0.35);
  display: block;
  margin: 0 auto var(--svk-space-md);
}
.roll-btn:hover {
  background: var(--svk-color-accent-hover);
  box-shadow: 0 4px 12px rgba(255, 62, 0, 0.40);
}
.roll-btn:active {
  transform: scale(0.97);
  box-shadow: 0 1px 3px rgba(255, 62, 0, 0.25);
}
.roll-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

### Attack Button (danger — red/threat)

```css
.action-btn.attack, .btn-attack {
  color: #FFFFFF;
  background: var(--svk-color-danger);
  border: none;
  box-shadow: 0 1px 2px rgba(184, 53, 48, 0.30);
}
.action-btn.attack:hover, .btn-attack:hover {
  background: var(--svk-color-danger-border);
  box-shadow: 0 2px 6px rgba(184, 53, 48, 0.35);
}
.action-btn.attack:active, .btn-attack:active { transform: scale(0.98); }
```

### Retreat Button (ghost — non-threatening)

```css
.action-btn.retreat {
  color: var(--svk-text-tertiary);
  border: 1px solid var(--svk-border-tertiary);
  background: transparent;
}
.action-btn.retreat:hover {
  color: var(--svk-text-secondary);
  border-color: var(--svk-border-secondary);
  background: var(--svk-bg-secondary);
}
```

### Footer / Panel Toggle Button (clean, understated navigation)

```css
.footer-btn {
  font-size: var(--svk-text-xs);
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: var(--svk-space-sm) var(--svk-space-md);
  color: var(--svk-text-tertiary);
  border: 1px solid var(--svk-border-primary);
  background: transparent;
}
.footer-btn:hover {
  color: var(--svk-text-secondary);
  border-color: var(--svk-border-secondary);
  background: var(--svk-bg-secondary);
}
.footer-btn[aria-expanded="true"] {
  color: var(--svk-color-accent);
  border-color: var(--svk-border-accent);
  background: var(--svk-color-accent-bg);
}
```

### Tab Button (active state — orange underline)

```css
.tab-btn {
  font-size: var(--svk-text-xs);
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: var(--svk-space-sm) var(--svk-space-md);
  min-height: var(--svk-touch-target);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--svk-text-tertiary);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  border-radius: 0;
}
.tab-btn:hover { color: var(--svk-text-secondary); }
.tab-btn.active {
  color: var(--svk-color-accent);
  border-bottom-color: var(--svk-color-accent-display);
}
```

### Numbered Action Cards

```css
.action-card {
  display: flex;
  gap: var(--svk-space-md);
  align-items: flex-start;
  padding: var(--svk-space-md) var(--svk-space-lg);
  border: var(--svk-border-width) solid var(--svk-border-primary);
  border-radius: var(--svk-radius-lg);
  background: var(--svk-bg-secondary);
  box-shadow: var(--svk-shadow-card);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s, transform 0.10s;
  text-align: left;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: var(--svk-space-sm);
  font-family: inherit;
}
.action-card:hover {
  border-color: var(--svk-border-accent);
  background: var(--svk-bg-primary);
  box-shadow: var(--svk-shadow-raised);
  transform: translateY(-1px);
}
.action-card:active {
  transform: scale(0.99) translateY(0);
  box-shadow: var(--svk-shadow-card);
}

/* Number badge — orange filled circle */
.action-card-num {
  font-family: var(--svk-font-mono);
  font-size: 11px;
  font-weight: 700;
  color: #FFFFFF;
  background: var(--svk-color-accent-display);
  border-radius: 50%;
  width: 22px;
  height: 22px;
  min-width: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  flex-shrink: 0;
}

.action-card-body { flex: 1; }
.action-card-title {
  font-family: var(--svk-font-primary);
  font-size: var(--svk-text-base);
  font-weight: 600;
  color: var(--svk-text-primary);
  margin: 0 0 4px;
  line-height: 1.3;
}
.action-card-desc {
  font-family: var(--svk-font-primary);
  font-size: 13px;
  color: var(--svk-text-secondary);
  margin: 0 0 6px;
  line-height: 1.5;
}
.action-card-mech {
  font-family: var(--svk-font-mono);
  font-size: var(--svk-text-xs);
  letter-spacing: 0.04em;
  color: var(--svk-color-warning);
  margin: 0;
  text-transform: uppercase;
}
.action-card-mech.mech-success { color: var(--svk-color-success); }
```

---

## Micro-interactions

All animations and transitions are wrapped in `prefers-reduced-motion`. Under `reduce`,
all durations collapse to 0.01ms and keyframe animations are disabled entirely. No
information is conveyed exclusively through animation — the end state is always the same.

The SvelteKit style's animations are lighter than Station's: shorter durations, subtler
easing, no glow pulses. The style is daylight — it should feel quick and responsive, not
atmospheric and dramatic.

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
  .die-value.spinning    { animation: none !important; opacity: 1; }
  #reveal-full           { animation: none !important; }
  .init-chip.active      { animation: none !important; }
  .action-card:hover     { transform: none !important; }
}
```

### Progressive Reveal Fade

Clean upward fade — faster than Station's to match the lighter, snappier feel.

```css
@keyframes svk-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

#reveal-full {
  animation: svk-fade-in 0.20s ease-out;
}
```

### Die Entrance Animation

```css
@keyframes svk-die-pop {
  0%   { opacity: 0; transform: scale(0.65); }
  65%  { opacity: 1; transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
}

.die-value.spinning {
  animation: svk-die-pop var(--ta-die-spin-duration, 0.55s)
             cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

### Button Transitions

```css
.btn-action, .btn-secondary, .btn-poi, .btn-attack, .btn-neutral,
.continue-btn, .roll-btn, .footer-btn, .tab-btn,
.action-btn, .poi-btn, .action-card,
.panel-close-btn {
  transition:
    background   0.15s ease,
    border-color 0.15s ease,
    color        0.15s ease,
    box-shadow   0.15s ease,
    transform    0.10s ease;
}
```

### Active Initiative Chip Pulse

Gentle opacity wave — calm enough for the lighter, more open aesthetic.

```css
@keyframes svk-init-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.60; }
}

.init-chip.active {
  animation: svk-init-pulse 2.0s ease-in-out infinite;
}
```

### XP Bar Fill Transition

```css
.xp-fill {
  transition: width 0.40s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## Component Overrides

### Root / Widget Container

The root uses the primary system sans-serif throughout. Mechanical elements override to
monospace individually. This is the inverse of Station's approach — sans-serif is the base
because it suits the lighter, more open aesthetic for body content.

```css
.root,
.combat-root,
.roll-root,
.shop-root,
.social-root {
  font-family: var(--svk-font-primary);
  color: var(--svk-text-primary);
  background: var(--svk-bg-primary);
  padding: var(--svk-widget-padding);
  max-width: var(--svk-content-max);
  margin: 0 auto;
}
```

### Location Bar

The left orange accent bar is the SvelteKit style's structural signature — in the same
position as Station's cyan bar but warmer and more energetic. The location name uses the
primary sans-serif at 17px semibold, standard case (no all-caps — this style is friendlier).

```css
.loc-bar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: var(--svk-space-sm);
  margin-bottom: var(--svk-space-md);
  border-bottom: var(--svk-border-width) solid var(--svk-border-primary);
}
.loc-name {
  font-family: var(--svk-font-primary);
  font-size: var(--svk-text-lg);
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--svk-text-primary);
  margin: 0;
  /* Left accent bar — orange, the SvelteKit signature */
  border-left: 3px solid var(--svk-color-accent-display);
  padding-left: var(--svk-space-sm);
}
.scene-num {
  font-family: var(--svk-font-mono);
  font-size: var(--svk-text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--svk-text-tertiary);
}
```

### Chapter / Section Heading

```css
.chapter-heading {
  font-family: var(--svk-font-primary);
  font-size: var(--svk-text-xs);
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--svk-text-tertiary);
  text-align: center;
  margin: 0 0 var(--svk-space-md);
}
```

### Atmosphere Pills

Rounder and slightly more padded than Station's — reflecting the 8px card radius aesthetic.
Orange-tinted pills for active atmosphere; muted grey for ambient.

```css
.atmo-strip {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: var(--svk-space-md);
}
.atmo-pill {
  font-family: var(--svk-font-primary);
  font-size: var(--svk-text-xs);
  font-weight: 500;
  letter-spacing: 0.04em;
  padding: 3px 10px;
  border-radius: var(--svk-radius-pill);
  border: var(--svk-border-width) solid var(--svk-border-primary);
  color: var(--svk-text-tertiary);
  background: var(--svk-bg-secondary);
}
```

### Narrative Block

The narrative uses the system sans-serif — readable and native-feeling. It is not serif;
this style does not bifurcate typefaces. The font does the work through generous line-height
and comfortable size.

```css
.narrative,
.brief-text,
.roll-action,
.npc-reaction,
.merchant-flavour,
.stakes-text {
  font-family: var(--svk-font-primary);
  font-size: var(--svk-text-base);
  line-height: 1.65;
  color: var(--svk-text-primary);
  margin: 0 0 var(--svk-space-md);
}

/* Supporting narrative blocks — slightly smaller, muted */
.roll-action,
.npc-reaction,
.merchant-flavour {
  font-size: 14px;
  color: var(--svk-text-secondary);
  line-height: 1.6;
}
```

### Section Labels

```css
.section-label {
  font-family: var(--svk-font-primary);
  font-size: var(--svk-text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--svk-text-tertiary);
  margin: var(--svk-space-md) 0 var(--svk-space-sm);
}
```

### Status Bar (HP pips, XP bar, level)

The status bar in SvelteKit style feels like a progress dashboard — clean, horizontal,
well-spaced. HP pips are teal circles; XP is a rounded progress bar with the blue-indigo
fill; LVL uses the standard text colour.

```css
.status-bar {
  display: flex;
  align-items: center;
  gap: var(--svk-space-md);
  flex-wrap: wrap;
  padding: var(--svk-space-sm) 0;
  margin-top: var(--svk-space-sm);
  border-top: var(--svk-border-width) solid var(--svk-border-primary);
  font-family: var(--svk-font-primary);
  font-size: var(--svk-text-xs);
  font-weight: 500;
  color: var(--svk-text-tertiary);
  letter-spacing: 0.04em;
}
.hp-pips, .player-pips { display: flex; gap: 4px; align-items: center; }
.pip {
  width: 9px; height: 9px; border-radius: 50%;
  background: var(--svk-color-success);
  border: 1px solid var(--svk-color-success-border);
}
.pip.empty {
  background: transparent;
  border-color: var(--svk-border-primary);
}
.player-pip {
  width: 9px; height: 9px; border-radius: 50%;
  background: var(--svk-color-success);
  border: 1px solid var(--svk-color-success-border);
}
.player-pip.empty { background: transparent; border-color: var(--svk-border-primary); }
.xp-track {
  width: 64px; height: 4px;
  background: var(--svk-border-primary);
  border-radius: var(--svk-radius-pill);
  overflow: hidden;
}
.xp-fill {
  height: 100%;
  background: var(--svk-color-xp);
  border-radius: var(--svk-radius-pill);
  transition: width 0.40s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Stat Grid (character sheet)

Stat cells are cards within cards — each one a self-contained component with its own
border and shadow, consistent with the component-driven layout philosophy.

```css
.stat-grid {
  display: flex;
  gap: var(--svk-space-sm);
  flex-wrap: wrap;
  margin-bottom: var(--svk-space-md);
}
.stat-cell {
  flex: 1;
  min-width: 52px;
  padding: 10px 6px;
  background: var(--svk-bg-secondary);
  border: var(--svk-border-width) solid var(--svk-border-primary);
  border-radius: var(--svk-radius-lg);
  box-shadow: var(--svk-shadow-card);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.stat-label {
  font-family: var(--svk-font-primary);
  font-size: var(--svk-text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--svk-text-tertiary);
  line-height: 1;
}
.stat-value {
  font-family: var(--svk-font-mono);
  font-size: var(--svk-text-stat);
  font-weight: 700;
  color: var(--svk-text-primary);
  line-height: 1.1;
}
.stat-mod {
  font-family: var(--svk-font-mono);
  font-size: var(--svk-text-xs);
  font-weight: 500;
  line-height: 1;
}
.stat-mod.positive { color: var(--svk-modifier-positive); }
.stat-mod.zero     { color: var(--svk-modifier-zero); }
.stat-mod.negative { color: var(--svk-modifier-negative); }
```

### Inline Status Row (HP, AC, GOLD, LVL)

A horizontal card bar below the stat grid — clean, well-spaced, semantically coloured.

```css
.inline-status {
  display: flex;
  gap: var(--svk-space-lg);
  flex-wrap: wrap;
  padding: var(--svk-space-sm) var(--svk-space-md);
  background: var(--svk-bg-secondary);
  border: var(--svk-border-width) solid var(--svk-border-primary);
  border-radius: var(--svk-radius-lg);
  box-shadow: var(--svk-shadow-card);
  margin-bottom: var(--svk-space-md);
}
.inline-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.inline-stat-label {
  font-family: var(--svk-font-primary);
  font-size: var(--svk-text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--svk-text-tertiary);
}
.inline-stat-value {
  font-family: var(--svk-font-mono);
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
}
.inline-stat-value.hp     { color: var(--svk-color-success); }
.inline-stat-value.gold   { color: var(--svk-color-currency); }
.inline-stat-value.xp     { color: var(--svk-color-xp); }
.inline-stat-value.danger { color: var(--svk-color-danger); }
.inline-stat-value.default{ color: var(--svk-text-primary); }
```

### Combat: Initiative Bar

```css
.init-bar {
  display: flex;
  gap: var(--svk-space-sm);
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: var(--svk-space-md);
  padding-bottom: var(--svk-space-sm);
  border-bottom: var(--svk-border-width) solid var(--svk-border-primary);
}
.init-label {
  font-family: var(--svk-font-primary);
  font-size: var(--svk-text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--svk-text-tertiary);
  margin-right: 4px;
}
.init-chip {
  font-family: var(--svk-font-primary);
  font-size: var(--svk-text-xs);
  font-weight: 500;
  padding: 4px 10px;
  border-radius: var(--svk-radius-pill);
  border: var(--svk-border-width) solid var(--svk-border-primary);
  background: var(--svk-bg-secondary);
  color: var(--svk-text-secondary);
}
.init-chip.active {
  border-color: var(--svk-color-success-border);
  background: var(--svk-color-success-bg);
  color: var(--svk-color-success);
  font-weight: 600;
  /* svk-init-pulse animation — see micro-interactions */
}
```

### Combat: Enemy Cards

```css
.enemy-row  { display: flex; flex-wrap: wrap; gap: var(--svk-space-sm); margin-bottom: var(--svk-space-lg); }
.enemy-card {
  flex: 1; min-width: 140px;
  padding: var(--svk-space-sm) var(--svk-space-md);
  background: var(--svk-bg-secondary);
  border: var(--svk-border-width) solid var(--svk-border-primary);
  border-radius: var(--svk-radius-lg);
  box-shadow: var(--svk-shadow-card);
}
.enemy-name {
  font-family: var(--svk-font-primary);
  font-size: 13px; font-weight: 600;
  color: var(--svk-text-primary); margin: 0 0 4px;
}
.enemy-role {
  font-family: var(--svk-font-primary);
  font-size: var(--svk-text-xs);
  color: var(--svk-text-tertiary); margin: 0 0 var(--svk-space-sm);
}
.hp-row { display: flex; gap: 4px; align-items: center; }
.hp-label { font-size: var(--svk-text-xs); color: var(--svk-text-tertiary); margin-right: 4px; }
/* Enemy HP pips — danger red */
.enemy-card .pip {
  background: var(--svk-color-danger);
  border-color: var(--svk-color-danger-border);
}
.enemy-card .pip.empty {
  background: transparent;
  border-color: var(--svk-border-primary);
}
```

### Die Roll: Value Display

Large, bold, monospace — the number is the hero. Colour-coded by outcome.

```css
.die-display { display: none; text-align: center; margin-bottom: var(--svk-space-md); }
.die-value {
  font-family: var(--svk-font-mono);
  font-size: var(--svk-text-xl);
  font-weight: 700;
  color: var(--svk-text-primary);
  display: inline-block;
  line-height: 1;
}
.die-value.success { color: var(--svk-color-success); }
.die-value.failure { color: var(--svk-color-danger); }
.die-value.spinning {
  animation: svk-die-pop var(--ta-die-spin-duration, 0.55s)
             cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

### Die Roll: Component Breakdown Row

A card-style breakdown row — consistent with the component-driven layout. Each component
cell is clearly bordered and padded.

```css
.roll-breakdown {
  display: flex;
  align-items: center;
  gap: var(--svk-space-sm);
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: var(--svk-space-md);
  padding: var(--svk-space-sm) var(--svk-space-md);
  background: var(--svk-bg-secondary);
  border: var(--svk-border-width) solid var(--svk-border-primary);
  border-radius: var(--svk-radius-lg);
  box-shadow: var(--svk-shadow-card);
}
.roll-component {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.roll-component-label {
  font-family: var(--svk-font-primary);
  font-size: var(--svk-text-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--svk-text-tertiary);
  white-space: nowrap;
}
.roll-component-value {
  font-family: var(--svk-font-mono);
  font-size: 17px;
  font-weight: 700;
  color: var(--svk-text-primary);
  line-height: 1;
}
.roll-separator {
  font-family: var(--svk-font-mono);
  font-size: 16px;
  color: var(--svk-text-tertiary);
  align-self: center;
  padding-top: 10px;
}
```

---

## Complete CSS Block

The following block can be injected verbatim into any widget. It combines all of the above
into a single deployable stylesheet. The `--svk-font-primary` and `--svk-font-mono` custom
properties are defined inline alongside all other tokens; no external resources are needed.

```css
/* @extract */
/* ─────────────────────────────────────────────────────────────────────────
   SVELTEKIT VISUAL STYLE — text-adventure engine
   Light-mode primary. Svelte orange accent. Zero external dependencies.
   ───────────────────────────────────────────────────────────────────────── */

/* ── Font stacks ──────────────────────────────────────────────────────── */
:host {
  --svk-font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                      Oxygen, Ubuntu, Cantarell, sans-serif;
  --svk-font-mono:    'Fira Code', 'JetBrains Mono', 'Cascadia Code',
                      'SF Mono', 'Consolas', 'Courier New', monospace;

  /* ── Sizing ─────────────────────────────────────────────────────────── */
  --svk-text-xs:    10px;
  --svk-text-sm:    12px;
  --svk-text-base:  15px;
  --svk-text-md:    17px;
  --svk-text-lg:    20px;
  --svk-text-xl:    38px;
  --svk-text-stat:  20px;

  /* ── Spacing ─────────────────────────────────────────────────────────── */
  --svk-space-xs:  4px;
  --svk-space-sm:  8px;
  --svk-space-md: 14px;
  --svk-space-lg: 20px;
  --svk-space-xl: 28px;
  --svk-widget-padding: 1rem 0 1.5rem;
  --svk-content-max: 680px;
  --svk-touch-target: 44px;
  --svk-divider: 1px solid var(--svk-border-primary);

  /* ── Radius ──────────────────────────────────────────────────────────── */
  --svk-radius-sm:   4px;
  --svk-radius-md:   6px;
  --svk-radius-lg:   8px;
  --svk-radius-pill: 999px;

  /* ── Light Mode Surfaces ─────────────────────────────────────────────── */
  --svk-bg-primary:      #FFFFFF;
  --svk-bg-secondary:    #F6F6F6;
  --svk-bg-tertiary:     #EFEFEF;
  --svk-bg-overlay:      #F9F9F9;
  --svk-bg-stat-cell:    #F2F2F2;

  /* ── Light Mode Text ─────────────────────────────────────────────────── */
  --svk-text-primary:    #1A1A1A;
  --svk-text-secondary:  #4A4A4A;
  --svk-text-tertiary:   #767676;
  --svk-text-label:      #767676;
  --svk-color-text-emphasis: #000000;

  /* ── Accent — Svelte Orange ──────────────────────────────────────────── */
  --svk-color-accent:          #CC3200;
  --svk-color-accent-display:  #FF3E00;
  --svk-color-accent-hover:    #B02A00;
  --svk-color-accent-bg:       rgba(255, 62, 0, 0.07);
  --svk-color-accent-bg-hover: rgba(255, 62, 0, 0.13);

  /* ── Semantic Colours ────────────────────────────────────────────────── */
  --svk-color-success:          #1E8C7E;
  --svk-color-success-border:   #177068;
  --svk-color-success-bg:       rgba(64, 179, 162, 0.10);
  --svk-color-success-bg-hover: rgba(64, 179, 162, 0.18);
  --svk-color-danger:           #B83530;
  --svk-color-danger-border:    #962B27;
  --svk-color-danger-bg:        rgba(212, 70, 59, 0.09);
  --svk-color-danger-bg-hover:  rgba(212, 70, 59, 0.16);
  --svk-color-warning:          #9A6800;
  --svk-color-warning-border:   rgba(154, 104, 0, 0.50);
  --svk-color-warning-bg:       rgba(232, 168, 76, 0.10);
  --svk-color-xp:               #4A5FA8;
  --svk-color-xp-dim:           rgba(103, 125, 192, 0.12);
  --svk-color-xp-border:        rgba(103, 125, 192, 0.45);
  --svk-color-currency:         #8A6200;
  --svk-color-currency-dim:     rgba(138, 98, 0, 0.10);
  --svk-color-currency-border:  rgba(138, 98, 0, 0.40);

  /* ── Stat Modifiers ──────────────────────────────────────────────────── */
  --svk-modifier-positive: var(--svk-color-success);
  --svk-modifier-zero:     var(--svk-text-tertiary);
  --svk-modifier-negative: var(--svk-color-danger);

  /* ── Borders ─────────────────────────────────────────────────────────── */
  --svk-border-primary:   #E2E2E2;
  --svk-border-secondary: #D0D0D0;
  --svk-border-tertiary:  #EBEBEB;
  --svk-border-accent:    rgba(255, 62, 0, 0.40);
  --svk-border-width:     1px;

  /* ── Shadows ─────────────────────────────────────────────────────────── */
  --svk-shadow-card:   0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04);
  --svk-shadow-raised: 0 4px 6px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04);
  --svk-shadow-focus:  0 0 0 3px rgba(255,62,0,0.25);

  /* ── Outcome Badges ──────────────────────────────────────────────────── */
  --svk-badge-success-bg:          rgba(30, 140, 126, 0.12);
  --svk-badge-success-text:        #145E55;
  --svk-badge-partial-bg:          rgba(154, 104, 0, 0.12);
  --svk-badge-partial-text:        #7A5000;
  --svk-badge-failure-bg:          rgba(184, 53, 48, 0.12);
  --svk-badge-failure-text:        #8A2020;
  --svk-badge-crit-success-border: #1E8C7E;
  --svk-badge-crit-failure-border: #B83530;

  /* ── Die Colours ─────────────────────────────────────────────────────── */
  --die-border-color:       #D0D0D0;
  --die-bg:                 #F6F6F6;
  --die-text-color:         #1A1A1A;
  --die-hover-bg:           rgba(255, 62, 0, 0.08);
  --die-hover-border:       rgba(255, 62, 0, 0.50);
  --die-rolled-bg:          #EFEFEF;
  --die-rolled-border:      #E2E2E2;
  --die-animation-duration: 0.55s;
}

/* ── Dark Mode ─────────────────────────────────────────────────────────── */
@media (prefers-color-scheme: dark) {
  :host {
    --svk-bg-primary:      #1A1B26;
    --svk-bg-secondary:    #24253A;
    --svk-bg-tertiary:     #2E2F47;
    --svk-bg-overlay:      #20213A;
    --svk-bg-stat-cell:    #22243C;
    --svk-text-primary:    #F0F0F0;
    --svk-text-secondary:  #A8A8B8;
    --svk-text-tertiary:   #60607A;
    --svk-text-label:      #70708A;
    --svk-color-text-emphasis: #FFFFFF;
    --svk-color-accent:          #FF5E20;
    --svk-color-accent-display:  #FF5E20;
    --svk-color-accent-hover:    #FF7040;
    --svk-color-accent-bg:       rgba(255, 62, 0, 0.12);
    --svk-color-accent-bg-hover: rgba(255, 62, 0, 0.20);
    --svk-color-success:          #3DC4B0;
    --svk-color-success-border:   #2FA090;
    --svk-color-success-bg:       rgba(61, 196, 176, 0.10);
    --svk-color-success-bg-hover: rgba(61, 196, 176, 0.18);
    --svk-color-danger:           #E05550;
    --svk-color-danger-border:    #BC3E3A;
    --svk-color-danger-bg:        rgba(224, 85, 80, 0.10);
    --svk-color-danger-bg-hover:  rgba(224, 85, 80, 0.18);
    --svk-color-warning:          #E8A84C;
    --svk-color-warning-border:   rgba(232, 168, 76, 0.50);
    --svk-color-warning-bg:       rgba(232, 168, 76, 0.10);
    --svk-color-xp:               #8090D8;
    --svk-color-xp-dim:           rgba(128, 144, 216, 0.12);
    --svk-color-xp-border:        rgba(128, 144, 216, 0.45);
    --svk-color-currency:         #D4A840;
    --svk-color-currency-dim:     rgba(212, 168, 64, 0.12);
    --svk-color-currency-border:  rgba(212, 168, 64, 0.45);
    --svk-border-primary:   #2E2F42;
    --svk-border-secondary: #3A3B58;
    --svk-border-tertiary:  #272840;
    --svk-border-accent:    rgba(255, 94, 32, 0.40);
    --svk-shadow-card:   0 1px 3px rgba(0,0,0,0.30), 0 1px 2px rgba(0,0,0,0.20);
    --svk-shadow-raised: 0 4px 8px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.20);
    --svk-shadow-focus:  0 0 0 3px rgba(255,94,32,0.30);
    --svk-badge-success-bg:          rgba(61, 196, 176, 0.14);
    --svk-badge-success-text:        #7ADDD0;
    --svk-badge-partial-bg:          rgba(232, 168, 76, 0.14);
    --svk-badge-partial-text:        #E8C070;
    --svk-badge-failure-bg:          rgba(224, 85, 80, 0.14);
    --svk-badge-failure-text:        #F09090;
    --svk-badge-crit-success-border: #3DC4B0;
    --svk-badge-crit-failure-border: #E05550;
    --die-border-color:       #3A3B58;
    --die-bg:                 #24253A;
    --die-text-color:         #F0F0F0;
    --die-hover-bg:           rgba(255, 94, 32, 0.12);
    --die-hover-border:       rgba(255, 94, 32, 0.55);
    --die-rolled-bg:          #1E1F30;
    --die-rolled-border:      #2E2F42;
    --ta-color-accent:              var(--svk-color-accent);
    --ta-color-accent-hover:        var(--svk-color-accent-hover);
    --ta-color-accent-bg:           var(--svk-color-accent-bg);
    --ta-color-accent-bg-hover:     var(--svk-color-accent-bg-hover);
    --ta-color-success:             var(--svk-color-success);
    --ta-color-success-border:      var(--svk-color-success-border);
    --ta-color-danger:              var(--svk-color-danger);
    --ta-color-danger-border:       var(--svk-color-danger-border);
    --ta-color-danger-bg:           var(--svk-color-danger-bg);
    --ta-color-danger-bg-hover:     var(--svk-color-danger-bg-hover);
    --ta-color-warning:             var(--svk-color-warning);
    --ta-color-warning-border:      var(--svk-color-warning-border);
    --ta-color-warning-bg:          var(--svk-color-warning-bg);
    --ta-color-xp:                  var(--svk-color-xp);
    --ta-color-focus:               var(--svk-color-accent);
    --ta-color-conviction:          #8878F8;
    --ta-color-conviction-border:   #7060E8;
    --ta-badge-success-bg:          var(--svk-badge-success-bg);
    --ta-badge-success-text:        var(--svk-badge-success-text);
    --ta-badge-partial-bg:          var(--svk-badge-partial-bg);
    --ta-badge-partial-text:        var(--svk-badge-partial-text);
    --ta-badge-failure-bg:          var(--svk-badge-failure-bg);
    --ta-badge-failure-text:        var(--svk-badge-failure-text);
    --ta-badge-crit-success-border: var(--svk-badge-crit-success-border);
    --ta-badge-crit-failure-border: var(--svk-badge-crit-failure-border);
    --ta-color-credits:             var(--svk-color-currency);
    --ta-color-tab-active:          var(--svk-color-accent);
  }
}

/* ── Reduced Motion ────────────────────────────────────────────────────── */
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
  .action-card:hover  { transform: none !important; }
  .xp-fill            { transition: none !important; }
}

/* ── Keyframes ─────────────────────────────────────────────────────────── */
@keyframes svk-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes svk-die-pop {
  0%   { opacity: 0; transform: scale(0.65); }
  65%  { opacity: 1; transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes svk-init-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.60; }
}

/* ── Widget Roots ──────────────────────────────────────────────────────── */
.root, .combat-root, .roll-root, .shop-root, .social-root {
  font-family: var(--svk-font-primary);
  color: var(--svk-text-primary);
  background: var(--svk-bg-primary);
  padding: var(--svk-widget-padding);
  max-width: var(--svk-content-max);
  margin: 0 auto;
}

/* ── Progressive Reveal ────────────────────────────────────────────────── */
#reveal-full { animation: svk-fade-in 0.20s ease-out; }

/* ── Transitions ───────────────────────────────────────────────────────── */
.btn-action, .btn-secondary, .btn-poi, .btn-attack, .btn-neutral,
.continue-btn, .roll-btn, .footer-btn, .tab-btn,
.action-btn, .poi-btn, .action-card, .panel-close-btn {
  transition:
    background   0.15s ease,
    border-color 0.15s ease,
    color        0.15s ease,
    box-shadow   0.15s ease,
    transform    0.10s ease;
}

/* ── Focus ─────────────────────────────────────────────────────────────── */
button:focus-visible, [data-prompt]:focus-visible {
  outline: 2px solid var(--svk-color-accent-display);
  outline-offset: 2px;
  box-shadow: var(--svk-shadow-focus);
}
button:disabled, button[disabled] {
  opacity: 0.40; cursor: not-allowed; transform: none !important;
}

/* ── Location Bar ──────────────────────────────────────────────────────── */
.loc-bar {
  display: flex; justify-content: space-between; align-items: baseline;
  padding-bottom: var(--svk-space-sm); margin-bottom: var(--svk-space-md);
  border-bottom: var(--svk-border-width) solid var(--svk-border-primary);
}
.loc-name {
  font-family: var(--svk-font-primary); font-size: var(--svk-text-lg);
  font-weight: 600; letter-spacing: 0.01em; color: var(--svk-text-primary); margin: 0;
  border-left: 3px solid var(--svk-color-accent-display);
  padding-left: var(--svk-space-sm);
}
.scene-num {
  font-family: var(--svk-font-mono); font-size: var(--svk-text-xs);
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--svk-text-tertiary);
}

/* ── Chapter Heading ───────────────────────────────────────────────────── */
.chapter-heading {
  font-family: var(--svk-font-primary); font-size: var(--svk-text-xs);
  font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--svk-text-tertiary); text-align: center; margin: 0 0 var(--svk-space-md);
}

/* ── Atmosphere Pills ──────────────────────────────────────────────────── */
.atmo-strip { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: var(--svk-space-md); }
.atmo-pill {
  font-family: var(--svk-font-primary); font-size: var(--svk-text-xs); font-weight: 500;
  letter-spacing: 0.04em; padding: 3px 10px;
  border-radius: var(--svk-radius-pill);
  border: var(--svk-border-width) solid var(--svk-border-primary);
  color: var(--svk-text-tertiary); background: var(--svk-bg-secondary);
}

/* ── Narrative ─────────────────────────────────────────────────────────── */
.narrative, .brief-text, .roll-action, .npc-reaction,
.merchant-flavour, .stakes-text {
  font-family: var(--svk-font-primary); font-size: var(--svk-text-base);
  line-height: 1.65; color: var(--svk-text-primary); margin: 0 0 var(--svk-space-md);
}
.roll-action, .npc-reaction, .merchant-flavour {
  font-size: 14px; color: var(--svk-text-secondary); line-height: 1.6;
}
.nar-npc   { color: var(--svk-color-success); font-weight: 600; }
.nar-item  { color: var(--svk-color-currency); font-weight: 600; }
.nar-sfx   { color: var(--svk-color-accent); font-weight: 700;
             text-transform: uppercase; letter-spacing: 0.05em; }
.nar-name  { color: var(--svk-text-primary); font-weight: 700; }
.nar-aside { font-style: italic; color: var(--svk-text-secondary); }

/* ── Section Labels ────────────────────────────────────────────────────── */
.section-label {
  font-family: var(--svk-font-primary); font-size: var(--svk-text-xs); font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--svk-text-tertiary);
  margin: var(--svk-space-md) 0 var(--svk-space-sm);
}

/* ── Buttons ───────────────────────────────────────────────────────────── */
.btn-action, .action-btn {
  font-size: var(--svk-text-sm); font-weight: 600; letter-spacing: 0.03em;
  padding: var(--svk-space-sm) var(--svk-space-lg); color: #FFFFFF;
  background: var(--svk-color-accent-display); border: none;
  border-radius: var(--svk-radius-md);
  box-shadow: 0 1px 2px rgba(255,62,0,0.30);
}
.btn-action:hover, .action-btn:hover {
  background: var(--svk-color-accent-hover);
  box-shadow: 0 2px 6px rgba(255,62,0,0.35);
}
.btn-action:active, .action-btn:active { transform: scale(0.98); box-shadow: none; }

.btn-poi, .poi-btn {
  font-size: var(--svk-text-sm); font-weight: 400; letter-spacing: 0.03em;
  padding: var(--svk-space-sm) var(--svk-space-md); color: var(--svk-text-secondary);
  border: 1px dashed var(--svk-border-secondary); background: transparent;
  border-radius: var(--svk-radius-md);
}
.btn-poi:hover, .poi-btn:hover {
  border-style: solid; border-color: var(--svk-border-secondary);
  background: var(--svk-bg-secondary); color: var(--svk-text-primary);
}
.btn-poi:active, .poi-btn:active { transform: scale(0.98); }

.continue-btn, .btn-neutral {
  font-size: var(--svk-text-sm); font-weight: 400; letter-spacing: 0.03em;
  padding: var(--svk-space-sm) var(--svk-space-md); color: var(--svk-text-secondary);
  border: 1px solid var(--svk-border-primary); background: transparent;
  border-radius: var(--svk-radius-md);
}
.continue-btn:hover, .btn-neutral:hover {
  border-color: var(--svk-border-secondary); color: var(--svk-text-primary);
  background: var(--svk-bg-secondary);
}
.continue-btn:active, .btn-neutral:active { transform: scale(0.98); }

.roll-btn {
  font-size: var(--svk-text-md); font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase; padding: var(--svk-space-md) var(--svk-space-xl);
  color: #FFFFFF; background: var(--svk-color-accent-display); border: none;
  border-radius: var(--svk-radius-md); box-shadow: 0 2px 8px rgba(255,62,0,0.35);
  display: block; margin: 0 auto var(--svk-space-md);
}
.roll-btn:hover { background: var(--svk-color-accent-hover); box-shadow: 0 4px 12px rgba(255,62,0,0.40); }
.roll-btn:active { transform: scale(0.97); box-shadow: 0 1px 3px rgba(255,62,0,0.25); }
.roll-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }

.action-btn.attack, .btn-attack {
  color: #FFFFFF; background: var(--svk-color-danger); border: none;
  box-shadow: 0 1px 2px rgba(184,53,48,0.30);
}
.action-btn.attack:hover, .btn-attack:hover {
  background: var(--svk-color-danger-border); box-shadow: 0 2px 6px rgba(184,53,48,0.35);
}
.action-btn.attack:active, .btn-attack:active { transform: scale(0.98); }

.action-btn.retreat {
  color: var(--svk-text-tertiary); border: 1px solid var(--svk-border-tertiary); background: transparent;
}
.action-btn.retreat:hover {
  color: var(--svk-text-secondary); border-color: var(--svk-border-secondary); background: var(--svk-bg-secondary);
}

.footer-btn {
  font-size: var(--svk-text-xs); font-weight: 500; letter-spacing: 0.05em;
  text-transform: uppercase; padding: var(--svk-space-sm) var(--svk-space-md);
  color: var(--svk-text-tertiary); border: 1px solid var(--svk-border-primary); background: transparent;
  border-radius: var(--svk-radius-md);
}
.footer-btn:hover { color: var(--svk-text-secondary); border-color: var(--svk-border-secondary); background: var(--svk-bg-secondary); }
.footer-btn[aria-expanded="true"] {
  color: var(--svk-color-accent); border-color: var(--svk-border-accent); background: var(--svk-color-accent-bg);
}

.tab-btn {
  font-size: var(--svk-text-xs); font-weight: 500; letter-spacing: 0.05em;
  text-transform: uppercase; padding: var(--svk-space-sm) var(--svk-space-md);
  min-height: var(--svk-touch-target); background: transparent; border: none;
  border-bottom: 2px solid transparent; color: var(--svk-text-tertiary);
  cursor: pointer; border-radius: 0;
}
.tab-btn:hover { color: var(--svk-text-secondary); }
.tab-btn.active { color: var(--svk-color-accent); border-bottom-color: var(--svk-color-accent-display); }

/* ── Action Cards ──────────────────────────────────────────────────────── */
.action-card {
  display: flex; gap: var(--svk-space-md); align-items: flex-start;
  padding: var(--svk-space-md) var(--svk-space-lg);
  border: var(--svk-border-width) solid var(--svk-border-primary);
  border-radius: var(--svk-radius-lg); background: var(--svk-bg-secondary);
  box-shadow: var(--svk-shadow-card); cursor: pointer; text-align: left;
  width: 100%; box-sizing: border-box; margin-bottom: var(--svk-space-sm); font-family: inherit;
}
.action-card:hover {
  border-color: var(--svk-border-accent); background: var(--svk-bg-primary);
  box-shadow: var(--svk-shadow-raised); transform: translateY(-1px);
}
.action-card:active { transform: scale(0.99) translateY(0); box-shadow: var(--svk-shadow-card); }
.action-card-num {
  font-family: var(--svk-font-mono); font-size: 11px; font-weight: 700; color: #FFFFFF;
  background: var(--svk-color-accent-display); border-radius: 50%;
  width: 22px; height: 22px; min-width: 22px;
  display: flex; align-items: center; justify-content: center; margin-top: 2px; flex-shrink: 0;
}
.action-card-body { flex: 1; }
.action-card-title {
  font-family: var(--svk-font-primary); font-size: var(--svk-text-base);
  font-weight: 600; color: var(--svk-text-primary); margin: 0 0 4px; line-height: 1.3;
}
.action-card-desc {
  font-family: var(--svk-font-primary); font-size: 13px; color: var(--svk-text-secondary);
  margin: 0 0 6px; line-height: 1.5;
}
.action-card-mech {
  font-family: var(--svk-font-mono); font-size: var(--svk-text-xs); letter-spacing: 0.04em;
  color: var(--svk-color-warning); margin: 0; text-transform: uppercase;
}
.action-card-mech.mech-success { color: var(--svk-color-success); }

/* ── Status Bar ────────────────────────────────────────────────────────── */
.status-bar {
  display: flex; align-items: center; gap: var(--svk-space-md); flex-wrap: wrap;
  padding: var(--svk-space-sm) 0; margin-top: var(--svk-space-sm);
  border-top: var(--svk-border-width) solid var(--svk-border-primary);
  font-family: var(--svk-font-primary); font-size: var(--svk-text-xs);
  font-weight: 500; color: var(--svk-text-tertiary); letter-spacing: 0.04em;
}
.hp-pips, .player-pips { display: flex; gap: 4px; align-items: center; }
.pip { width: 9px; height: 9px; border-radius: 50%; background: var(--svk-color-success); border: 1px solid var(--svk-color-success-border); }
.pip.empty { background: transparent; border-color: var(--svk-border-primary); }
.player-pip { width: 9px; height: 9px; border-radius: 50%; background: var(--svk-color-success); border: 1px solid var(--svk-color-success-border); }
.player-pip.empty { background: transparent; border-color: var(--svk-border-primary); }
.xp-track { width: 64px; height: 4px; background: var(--svk-border-primary); border-radius: var(--svk-radius-pill); overflow: hidden; }
.xp-fill { height: 100%; background: var(--svk-color-xp); border-radius: var(--svk-radius-pill); transition: width 0.40s cubic-bezier(0.4,0,0.2,1); }

/* ── Stat Grid ─────────────────────────────────────────────────────────── */
.stat-grid { display: flex; gap: var(--svk-space-sm); flex-wrap: wrap; margin-bottom: var(--svk-space-md); }
.stat-cell {
  flex: 1; min-width: 52px; padding: 10px 6px;
  background: var(--svk-bg-secondary); border: var(--svk-border-width) solid var(--svk-border-primary);
  border-radius: var(--svk-radius-lg); box-shadow: var(--svk-shadow-card);
  text-align: center; display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.stat-label { font-family: var(--svk-font-primary); font-size: var(--svk-text-xs); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--svk-text-tertiary); line-height: 1; }
.stat-value { font-family: var(--svk-font-mono); font-size: var(--svk-text-stat); font-weight: 700; color: var(--svk-text-primary); line-height: 1.1; }
.stat-mod { font-family: var(--svk-font-mono); font-size: var(--svk-text-xs); font-weight: 500; line-height: 1; }
.stat-mod.positive { color: var(--svk-modifier-positive); }
.stat-mod.zero     { color: var(--svk-modifier-zero); }
.stat-mod.negative { color: var(--svk-modifier-negative); }

/* ── Inline Status ─────────────────────────────────────────────────────── */
.inline-status {
  display: flex; gap: var(--svk-space-lg); flex-wrap: wrap;
  padding: var(--svk-space-sm) var(--svk-space-md);
  background: var(--svk-bg-secondary); border: var(--svk-border-width) solid var(--svk-border-primary);
  border-radius: var(--svk-radius-lg); box-shadow: var(--svk-shadow-card);
  margin-bottom: var(--svk-space-md);
}
.inline-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.inline-stat-label { font-family: var(--svk-font-primary); font-size: var(--svk-text-xs); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--svk-text-tertiary); }
.inline-stat-value { font-family: var(--svk-font-mono); font-size: 16px; font-weight: 700; line-height: 1; }
.inline-stat-value.hp     { color: var(--svk-color-success); }
.inline-stat-value.gold   { color: var(--svk-color-currency); }
.inline-stat-value.xp     { color: var(--svk-color-xp); }
.inline-stat-value.danger { color: var(--svk-color-danger); }
.inline-stat-value.default{ color: var(--svk-text-primary); }

/* ── Initiative Bar ────────────────────────────────────────────────────── */
.init-bar { display: flex; gap: var(--svk-space-sm); align-items: center; flex-wrap: wrap; margin-bottom: var(--svk-space-md); padding-bottom: var(--svk-space-sm); border-bottom: var(--svk-border-width) solid var(--svk-border-primary); }
.init-label { font-family: var(--svk-font-primary); font-size: var(--svk-text-xs); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--svk-text-tertiary); margin-right: 4px; }
.init-chip { font-family: var(--svk-font-primary); font-size: var(--svk-text-xs); font-weight: 500; padding: 4px 10px; border-radius: var(--svk-radius-pill); border: var(--svk-border-width) solid var(--svk-border-primary); background: var(--svk-bg-secondary); color: var(--svk-text-secondary); }
.init-chip.active { border-color: var(--svk-color-success-border); background: var(--svk-color-success-bg); color: var(--svk-color-success); font-weight: 600; animation: svk-init-pulse 2.0s ease-in-out infinite; }

/* ── Enemy Cards ───────────────────────────────────────────────────────── */
.enemy-row { display: flex; flex-wrap: wrap; gap: var(--svk-space-sm); margin-bottom: var(--svk-space-lg); }
.enemy-card { flex: 1; min-width: 140px; padding: var(--svk-space-sm) var(--svk-space-md); background: var(--svk-bg-secondary); border: var(--svk-border-width) solid var(--svk-border-primary); border-radius: var(--svk-radius-lg); box-shadow: var(--svk-shadow-card); }
.enemy-name { font-family: var(--svk-font-primary); font-size: 13px; font-weight: 600; color: var(--svk-text-primary); margin: 0 0 4px; }
.enemy-role { font-family: var(--svk-font-primary); font-size: var(--svk-text-xs); color: var(--svk-text-tertiary); margin: 0 0 var(--svk-space-sm); }
.hp-row { display: flex; gap: 4px; align-items: center; }
.hp-label { font-size: var(--svk-text-xs); color: var(--svk-text-tertiary); margin-right: 4px; }
.enemy-card .pip { background: var(--svk-color-danger); border-color: var(--svk-color-danger-border); }
.enemy-card .pip.empty { background: transparent; border-color: var(--svk-border-primary); }

/* ── Die Roll ──────────────────────────────────────────────────────────── */
.die-display { display: none; text-align: center; margin-bottom: var(--svk-space-md); }
.die-value { font-family: var(--svk-font-mono); font-size: var(--svk-text-xl); font-weight: 700; color: var(--svk-text-primary); display: inline-block; line-height: 1; }
.die-value.success { color: var(--svk-color-success); }
.die-value.failure { color: var(--svk-color-danger); }
.die-value.spinning { animation: svk-die-pop var(--ta-die-spin-duration, 0.55s) cubic-bezier(0.34,1.56,0.64,1) forwards; }

.roll-breakdown { display: flex; align-items: center; gap: var(--svk-space-sm); flex-wrap: wrap; justify-content: center; margin-bottom: var(--svk-space-md); padding: var(--svk-space-sm) var(--svk-space-md); background: var(--svk-bg-secondary); border: var(--svk-border-width) solid var(--svk-border-primary); border-radius: var(--svk-radius-lg); box-shadow: var(--svk-shadow-card); }
.roll-component { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.roll-component-label { font-family: var(--svk-font-primary); font-size: var(--svk-text-xs); font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--svk-text-tertiary); white-space: nowrap; }
.roll-component-value { font-family: var(--svk-font-mono); font-size: 17px; font-weight: 700; color: var(--svk-text-primary); line-height: 1; }
.roll-separator { font-family: var(--svk-font-mono); font-size: 16px; color: var(--svk-text-tertiary); align-self: center; padding-top: 10px; }
```
