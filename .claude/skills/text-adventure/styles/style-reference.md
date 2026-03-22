# Text Adventure — Style Reference

> **This file defines structural patterns only.** Visual styling — colours, fonts,
> decorative borders, shadows, and animations — is provided by visual-style files in
> this folder. Load one visual style per session. If no visual style is selected, the
> GM auto-selects one based on the output style or scenario theme.

> **This file is mandatory reading before rendering any widget.**
> The orchestrator (SKILL.md) defines rules and inlines the critical patterns (progressive
> reveal, panel toggle, PANEL_DATA). This file provides supplementary implementation code:
> panel CSS, scene skeleton, and loading messages.

---

## CSS Custom Property Contract

Every visual style file **must** define all of the following CSS custom properties inside
a `:root` block. Widgets reference these properties for all visual presentation. The
structural patterns in this file use only these variables — never hardcoded colour or
font values.

### Required Custom Properties

```css
:root {
  /* ── Typography ──────────────────────────────────────────────── */
  --ta-font-heading:        /* Heading / display font stack */;
  --ta-font-body:           /* Body / UI mono font stack */;

  /* ── Colour — Core palette ───────────────────────────────────── */
  --ta-color-accent:        /* Primary accent (action buttons, active states) */;
  --ta-color-accent-hover:  /* Accent hover / pressed state */;
  --ta-color-accent-bg:     /* Accent translucent background */;
  --ta-color-accent-bg-hover: /* Accent translucent background — hover */;

  /* ── Colour — Semantic ───────────────────────────────────────── */
  --ta-color-success:       /* Success / positive (HP pips, teal badges) */;
  --ta-color-success-border:/* Success border / darker tint */;
  --ta-color-danger:        /* Danger / negative (enemy HP, attack) */;
  --ta-color-danger-border: /* Danger border / darker tint */;
  --ta-color-danger-bg:     /* Danger translucent background */;
  --ta-color-danger-bg-hover:/* Danger translucent background — hover */;
  --ta-color-warning:       /* Warning / caution (amber badges, suspicious) */;
  --ta-color-warning-border:/* Warning border */;
  --ta-color-warning-bg:    /* Warning translucent background */;
  --ta-color-xp:            /* XP bar fill colour */;
  --ta-color-focus:         /* Focus-visible outline colour */;

  /* ── Colour — Conviction / social ────────────────────────────── */
  /* IMPORTANT: Must be purple/violet — distinct from --ta-color-accent (location cyan).
     Suggested values: fill #7C6BF0, border #6B5CE0 */
  --ta-color-conviction:        /* Conviction pip fill — use purple/violet, not cyan */;
  --ta-color-conviction-border: /* Conviction pip border — use purple/violet, not cyan */;

  /* ── Colour — Outcome badges ─────────────────────────────────── */
  --ta-badge-success-bg:    /* Success badge background */;
  --ta-badge-success-text:  /* Success badge text */;
  --ta-badge-partial-bg:    /* Partial success badge background */;
  --ta-badge-partial-text:  /* Partial success badge text */;
  --ta-badge-failure-bg:    /* Failure badge background */;
  --ta-badge-failure-text:  /* Failure badge text */;
  --ta-badge-crit-success-border: /* Critical success badge border */;
  --ta-badge-crit-failure-border: /* Critical failure badge border */;

  /* ── Colour — Credits / currency ─────────────────────────────── */
  --ta-color-credits:       /* Currency display colour */;

  /* ── Colour — Tab active indicator ───────────────────────────── */
  --ta-color-tab-active:    /* Active tab underline colour */;

  /* ── Decorative — borders & shapes ───────────────────────────── */
  --ta-border-style-poi:    /* POI button border style (e.g. "1px dashed") */;

  /* ── Animation — die roll ────────────────────────────────────── */
  --ta-die-spin-duration:   /* Die spin animation duration (e.g. "0.6s") */;
}
```

**Dark mode overrides:** Visual style files should provide `@media (prefers-color-scheme: dark)` overrides for any properties that need adjustment. The structural patterns do not contain dark-mode colour logic — that responsibility belongs entirely to the visual style.

**Host theme variables:** Widgets also use the Claude.ai host variables (`var(--color-text-primary)`, `var(--color-border-tertiary)`, etc.) for base text, borders, and backgrounds. These are provided by the host and need not be redefined by visual styles.

---

## Panel Styling — CSS

Use `#panel-overlay` (ID selector) to match the HTML element.

```css
#panel-overlay { display: none; padding: 0; }
.panel-header {
  display: flex; align-items: baseline; justify-content: space-between;
  padding-bottom: 10px; margin-bottom: 12px;
  border-bottom: 0.5px solid var(--color-border-tertiary);
}
.panel-title {
  font-family: var(--ta-font-heading);
  font-size: 18px; font-weight: 600; color: var(--color-text-primary);
}
.panel-close-btn {
  font-family: var(--ta-font-body);
  font-size: 11px; letter-spacing: 0.08em;
  background: transparent; border: 0.5px solid var(--color-border-tertiary);
  border-radius: var(--border-radius-md); padding: 8px 14px;
  min-height: 44px; min-width: 44px; box-sizing: border-box;
  color: var(--color-text-tertiary); cursor: pointer;
}
.panel-close-btn:hover { border-color: var(--color-border-secondary); color: var(--color-text-secondary); }
.panel-content { display: none; }
```

---

## Scene Widget — HTML Skeleton

This is a structural guide, not a rigid template. Claude generates the full markup
dynamically for each scene. The key requirements are:
- `id="panel-overlay"` and `id="scene-content"` for the panel toggle system.
- `id="reveal-brief"` and `id="reveal-full"` for progressive reveal.
- Panel toggle buttons use `data-panel` attributes + `addEventListener` — never inline `onclick` or `sendPrompt()`.
- The `↗` suffix on footer buttons indicates `sendPrompt()`. The Save button uses this suffix.

### Canonical Scene Footer

The scene footer is defined once here and must not be redefined in module files.
Every scene widget includes this footer outside the progressive reveal wrapper.

**Structure:**
- **Left side:** Panel toggle buttons — one per loaded module panel. Only render
  buttons for modules active in the current session. Use `data-panel` attributes + `addEventListener`.
- **Right side:** Save and Export buttons using `data-prompt` + `addEventListener` pattern.
  - `Save ↗` (`id="save-btn"`) — uses `sendPrompt()` to ask Claude to generate the `.save.md` file
    as a downloadable artifact; falls back to inline copyable text display if `sendPrompt()` is unavailable.
  - `Export ↗` (`id="export-btn"`) — uses `sendPrompt()` to ask Claude to generate a `.lore.md` file
    that shares the world for other players. Only rendered when adventure-exporting module is active.

### § Module Footer Button Table

When assembling the scene footer, iterate `modules_active` from `#scene-meta` and include
the button and panel-content div for every matching row. Character and Save are ALWAYS
included regardless of `modules_active`. Export is included only when `adventure-exporting`
appears in `modules_active`. **Do NOT guess or improvise — use this table.**

| `modules_active` value | Footer button HTML | Panel-content div |
|---|---|---|
| *(always)* | `<button class="footer-btn" data-panel="character" aria-expanded="false">Character</button>` | `<div class="panel-content" data-panel="character"></div>` |
| `lore-codex` | `<button class="footer-btn" data-panel="codex" aria-expanded="false">Codex</button>` | `<div class="panel-content" data-panel="codex"></div>` |
| `ship-systems` | `<button class="footer-btn" data-panel="ship" aria-expanded="false">Ship</button>` | `<div class="panel-content" data-panel="ship"></div>` |
| `crew-manifest` | `<button class="footer-btn" data-panel="crew" aria-expanded="false">Crew</button>` | `<div class="panel-content" data-panel="crew"></div>` |
| `star-chart` | `<button class="footer-btn" data-panel="nav" aria-expanded="false">Nav chart</button>` | `<div class="panel-content" data-panel="nav"></div>` |
| `geo-map` | `<button class="footer-btn" data-panel="map" aria-expanded="false">Map</button>` | `<div class="panel-content" data-panel="map"></div>` |
| `core-systems` | `<button class="footer-btn" data-panel="quests" aria-expanded="false">Quests</button>` | `<div class="panel-content" data-panel="quests"></div>` |
| *(always)* | `<button class="footer-btn" id="save-btn" data-prompt="Generate my save file as a downloadable .save.md file following the exact format in modules/save-codex.md. Use YAML frontmatter plus an encoded SC1: or SF1: payload string. Never write game state as human-readable markdown.">Save ↗</button>` | *(none)* |
| `adventure-exporting` | `<button class="footer-btn" id="export-btn" data-prompt="Export my world as a downloadable .lore.md file following the exact format in modules/adventure-exporting.md. Use YAML frontmatter plus structured world data sections. Never invent a custom format.">Export ↗</button>` | *(none)* |

**Algorithm (every scene widget):**
1. Start with Character button (always present).
2. Read `modules_active` from the current `#scene-meta`.
3. For each value in `modules_active`, if it appears in the table above, include both
   its footer button and its panel-content div.
4. Always append the Save button last on the right side.
5. If `adventure-exporting` is in `modules_active`, append the Export button after Save.
6. Do NOT include buttons for modules not in `modules_active`.

**Rule: Panel widgets are overlays, not standalone pages.** Crew manifest, ship
status, codex, and other panel widgets are overlays opened from footer buttons.
They have their own Close button that returns to the scene. They do **not** have
their own footer — the scene footer remains underneath. Module widget files
(ship-systems, crew-manifest, lore-codex, etc.) define the overlay content and
Close button only; the scene footer is not their responsibility.

```html
<div class="root">
  <!-- Progressive reveal wrapper -->
  <div id="reveal-brief">
    <p class="brief-text">Brief confirmation text</p>
    <button class="continue-btn" id="continue-reveal-btn">Continue</button>
  </div>
  <div id="reveal-full" style="display:none">
    <div id="scene-content">
      <!-- loc-bar, atmo-strip, narrative (id="narrative"), POIs, actions, status bar -->
    </div>
    <div id="panel-overlay" style="display:none">
      <div class="panel-header">
        <span class="panel-title"></span>
        <button class="panel-close-btn" id="panel-close-btn">Close</button>
      </div>
      <div class="panel-content" data-panel="character"></div>
      <div class="panel-content" data-panel="codex"></div>
      <div class="panel-content" data-panel="ship"></div>
      <div class="panel-content" data-panel="nav"></div>
    </div>
  </div>
  <!-- Scene metadata (hidden, machine-readable — consumed by Turn-Start Module Checklist) -->
  <div id="scene-meta" style="display:none" data-meta='{ SEE SCHEMA BELOW }'></div>
  <!-- Footer (always visible, outside reveal) -->
  <div class="footer-row">
    <!-- REQUIRED: Use the Module Footer Button Table above to build this row.
         For each value in modules_active, include the matching button from the table.
         Do NOT guess button labels or data-panel values — copy from the table. -->
    <button class="footer-btn" data-panel="character" aria-expanded="false">Character</button>
    <!-- Add one button per active module from the Module Footer Button Table -->
    <button class="footer-btn" id="save-btn" data-prompt="Generate my save file as a downloadable .save.md file following the exact format in modules/save-codex.md. Use YAML frontmatter plus an encoded SC1: or SF1: payload string. Never write game state as human-readable markdown.">Save ↗</button>
    <!-- Include Export ↗ only if adventure-exporting is in modules_active -->
  </div>
</div>

<script>
document.querySelectorAll('[data-panel]').forEach(btn => {
  btn.addEventListener('click', () => togglePanel(btn.dataset.panel));
});
document.getElementById('panel-close-btn').addEventListener('click', closePanel);
</script>
```

**Note:** Widget types not templated here (die roll, character creation, settings, scenario
select, map, combat, outcome, level-up, death/down) are generated dynamically by the GM
following the rules in SKILL.md. They do not need fixed templates — Claude builds them fresh
each time, following the structural and visual rules defined in the orchestrator.

---

## Scene Metadata (`#scene-meta`)

Every scene widget must include a hidden `#scene-meta` div containing JSON metadata about
the current scene. This div is invisible to the player but is consumed by the GM's
Turn-Start Module Checklist (see `modules/gm-checklist.md`) to determine which modules
are required for the next turn.

### Placement

The `#scene-meta` div sits between `#reveal-full` and the footer row (see scene skeleton
above). It is outside the reveal wrapper — it must be present and parseable immediately,
not gated behind the continue button.

### Schema

```json
{
  "skill_version": "1.2.4",
  "arc": 1,
  "theme": "historical",
  "mode": "procedural",
  "rulebook": "d20_system",
  "scene": 5,
  "type": "exploration",
  "location": "The Agora",
  "time": {
    "period": "midday",
    "date": "Day 3 of the Siege",
    "elapsed": 3,
    "hour": 12
  },
  "modules_active": [
    "prose-craft",
    "story-architect",
    "ai-npc",
    "core-systems"
  ],
  "npcs_present": ["Herald", "Magistrate Varro"],
  "threads_advanced": ["main-quest", "faction-tension"],
  "pending_rolls": [],
  "atmosphere": {
    "visual": "marble columns catching low sun",
    "auditory": "crowd murmur, sandals on stone",
    "other": "dry heat rising from the flagstones"
  },
  "next_scene_hints": {
    "likely_type": "social",
    "modules_needed": ["ai-npc", "prose-craft"],
    "anticipated_rolls": ["CHA", "WIS"]
  }
}
```

### Field Reference

**Session context (set at game start, rarely changes):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `skill_version` | string | yes | Current skill version — enables compatibility checks on resume |
| `arc` | integer | yes | Current campaign arc number (starts at 1) |
| `theme` | string | yes | Genre: `space`, `fantasy`, `horror`, `historical`, `post-apocalyptic` |
| `mode` | string | yes | World generation: `procedural`, `authored`, `hybrid` — determines if procedural-world-gen loads |
| `rulebook` | string | yes | Active rule system: `d20_system`, `gurps_lite`, `pf2e_lite`, `shadowrun_lite`, `narrative_engine` |

**Scene state (changes every turn):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scene` | integer | yes | Current scene number from gmState |
| `type` | string | yes | Scene category: `exploration`, `social`, `combat`, `discovery`, `quiet`, `transition` |
| `location` | string | yes | Current location name |
| `time` | object | yes | Current in-world time — `period`, `date`, `elapsed` (days), `hour` (0–23 internal). Only expose `date`/`hour` in player-facing UI if `playerKnowsDate`/`playerKnowsTime` is true in gmState. |
| `modules_active` | string[] | yes | All modules currently loaded — used by Turn-Start Module Checklist to verify continuity |
| `npcs_present` | string[] | yes | Named NPCs in the scene (empty array if none) |
| `threads_advanced` | string[] | yes | Story threads touched by this scene |
| `pending_rolls` | object[] | no | Unresolved rolls carried into next turn (rare) |
| `atmosphere` | object | yes | Two or three sensory properties used in this scene's prose |
| `next_scene_hints` | object | no | GM's anticipation of what the next turn will need — informs pre-loading |

### `next_scene_hints` Sub-Fields

| Field | Type | Description |
|-------|------|-------------|
| `likely_type` | string | Best guess at next scene type based on player options presented |
| `modules_needed` | string[] | Modules the GM anticipates needing — Turn-Start Checklist uses this to pre-load |
| `anticipated_rolls` | string[] | Attributes likely to be tested if the player takes the expected path |

**Rule:** `modules_active` must always include `prose-craft`. If it doesn't, the
Turn-Start Module Checklist will flag it as an error and force a reload.

### HTML Pattern

```html
<div id="scene-meta" style="display:none" data-meta='{
  "skill_version": "1.2.4",
  "arc": 1,
  "theme": "historical",
  "mode": "procedural",
  "rulebook": "d20_system",
  "scene": 5,
  "type": "exploration",
  "location": "The Agora",
  "time": { "period": "midday", "date": "Day 3 of the Siege", "elapsed": 3, "hour": 12 },
  "modules_active": ["prose-craft", "story-architect", "ai-npc", "core-systems"],
  "npcs_present": ["Herald"],
  "threads_advanced": ["main-quest"],
  "pending_rolls": [],
  "atmosphere": {
    "visual": "marble columns catching low sun",
    "auditory": "crowd murmur, sandals on stone",
    "other": "dry heat rising from the flagstones"
  },
  "next_scene_hints": {
    "likely_type": "social",
    "modules_needed": ["ai-npc", "prose-craft"],
    "anticipated_rolls": ["CHA"]
  }
}'></div>
```

**Escaping:** The JSON value sits inside a single-quoted HTML attribute (`data-meta='...'`).
Use double quotes for all JSON keys and string values. If any string value contains a
single quote (apostrophe), use `&#39;` or restructure the value to avoid it.

---

## Die Roll Guidance

### Die Roll Variety

Use all six attributes across the adventure — not just the player's primary stats. A high-DEX
character should still face INT checks (deciphering codes), WIS checks (reading people), CHA
checks (persuasion under pressure), and CON checks (enduring hardship). Design encounters that
specifically target the player's weaker stats to create genuine tension. A dump stat that never
gets tested is a missed opportunity for drama.

### DC Escalation

DCs must scale with the player's growing power. As the player gains levels, proficiencies, and
equipment bonuses, maintain tension by:
- Raising baseline DCs for recurring challenge types (Act 1: Moderate 12, Act 3: Hard 16).
- Introducing disadvantage conditions (fatigue, injury, time pressure, hostile environment).
- Designing checks where high rolls produce *complications* alongside success (you pick the
  lock, but the mechanism triggers an alarm).
- Never letting bonus stacking trivialise rolls — if modified totals routinely exceed 20,
  the difficulty curve is broken.

### sendPrompt Reliability

The `sendPrompt()` function in Claude.ai widget iframes is not always available due to timing
and sandboxing. For die roll widgets, always include a fallback:
- Display the roll result and a copyable prompt string (e.g., "I rolled 14 + 3 = 17. Continue.")
- Show a clear "Copy and paste this to continue" instruction alongside the sendPrompt button.
- Never rely solely on sendPrompt for progression — the player must always have a manual path.

---

## Loading Messages

Use these as placeholder text while widgets generate:

| Widget | Example messages |
|--------|-----------------|
| Scene | "Painting the shadows...", "Setting the stage...", "World is breathing..." |
| Roll | "Fate loading dice...", "Probability consulting gravity...", "The numbers decide..." |
| Map | "Charting the unknown...", "Surveying the dark...", "Corridors taking shape..." |
| Combat | "Enemies sizing you up...", "Initiative calculating...", "Tension escalating..." |
| Character | "Forging your identity...", "Stats crystallising...", "Sheet materialising..." |
| Outcome | "Consequences assembling...", "Reality settling...", "The world reacts..." |

---

## Die Shapes

Structural CSS-only die shapes for tabletop RPG dice. Visual styles skin these
with their own colours by overriding the custom properties below. All shapes use
a consistent box model so animations and states work identically across die types.

### Die Custom Properties

```css
/* These properties must be set by the visual style, or fall back to the host
   theme. Die shapes reference only these variables — never hardcoded colours. */
:root {
  --die-border-color:       /* Default die border */;
  --die-bg:                 /* Default die background */;
  --die-text-color:         /* Die label / face value colour */;
  --die-hover-bg:           /* Background on hover */;
  --die-hover-border:       /* Border colour on hover */;
  --die-rolled-bg:          /* Background after roll is locked */;
  --die-rolled-border:      /* Border colour after roll is locked */;
  --die-animation-duration: /* Spin/roll animation duration (e.g. "0.6s") */;
}
```

### Size Modifier Classes

```css
/* Applied alongside die shape classes: .die-d20.die--sm, .die-d20.die--lg */
.die--sm  { --die-size: 80px;  }
.die--md  { --die-size: 100px; } /* default */
.die--lg  { --die-size: 120px; }
```

### Shared Die Base

All die classes share this base. Shape classes override `clip-path`, `border-radius`,
and `transform` to create their specific form.

```css
[class^="die-"] {
  --die-size: 100px; /* overridden by .die--sm / .die--lg */
  width:  var(--die-size);
  height: var(--die-size);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
  background: var(--die-bg);
  border: 1.5px solid var(--die-border-color);
  color: var(--die-text-color);
  position: relative;
  user-select: none;
}

[class^="die-"]:hover {
  background: var(--die-hover-bg);
  border-color: var(--die-hover-border);
  transform: scale(1.05);
}

[class^="die-"]:active {
  transform: scale(0.95);
}

[class^="die-"]:focus-visible {
  outline: 2px solid var(--ta-color-focus);
  outline-offset: 3px;
}

/* Rolled / locked state — dimmed, non-interactive */
[class^="die-"].rolled {
  background: var(--die-rolled-bg);
  border-color: var(--die-rolled-border);
  cursor: default;
  pointer-events: none;
  opacity: 0.55;
  transform: none;
}

.die-label {
  font-family: var(--ta-font-body);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: inherit;
}

.die-face {
  font-family: var(--ta-font-body);
  font-size: 26px;
  font-weight: 500;
  color: inherit;
  line-height: 1;
}

```

---

### d4 — Triangle / Tetrahedron

```css
.die-d4 {
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  border-radius: 0;
  border: none; /* clip-path clips the border; use ::before pseudo-element instead */
  position: relative;
}

/* Simulated border: a slightly larger shape behind the die in the border colour */
.die-d4::before {
  content: '';
  position: absolute;
  inset: -2px;
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  background: var(--die-border-color);
  z-index: -1;
}

/* d4: wobble / tip animation — rolls on its point */
@keyframes die-d4-wobble {
  0%   { transform: rotate(0deg)   scale(1);    }
  15%  { transform: rotate(-18deg) scale(1.1);  }
  35%  { transform: rotate(14deg)  scale(1.08); }
  55%  { transform: rotate(-10deg) scale(1.05); }
  75%  { transform: rotate(6deg)   scale(1.02); }
  90%  { transform: rotate(-3deg)  scale(1.01); }
  100% { transform: rotate(0deg)   scale(1);    }
}

@media (prefers-reduced-motion: no-preference) {
  .die-d4.rolling {
    animation: die-d4-wobble var(--die-animation-duration, 0.7s) ease-in-out;
    pointer-events: none;
  }
}
```

---

### d6 — Square with Rounded Corners

```css
.die-d6 {
  border-radius: 12px; /* slightly rounded corners — standard cube face */
  clip-path: none;
  perspective: 300px;
  transform-style: preserve-3d;
}

/* d6: single-axis rotation — tumbles forward */
@keyframes die-d6-rotate {
  0%   { transform: rotateX(0deg)   scale(1);    }
  25%  { transform: rotateX(90deg)  scale(1.08); }
  50%  { transform: rotateX(180deg) scale(1.05); }
  75%  { transform: rotateX(270deg) scale(1.08); }
  100% { transform: rotateX(360deg) scale(1);    }
}

@media (prefers-reduced-motion: no-preference) {
  .die-d6.rolling {
    animation: die-d6-rotate var(--die-animation-duration, 0.6s) ease-in-out;
    pointer-events: none;
  }
}
```

---

### d8 — Diamond / Rhombus

```css
.die-d8 {
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  border-radius: 0;
  border: none; /* clip-path clips the border; use ::before pseudo-element instead */
  position: relative;
}

/* Simulated border: a slightly larger shape behind the die in the border colour */
.die-d8::before {
  content: '';
  position: absolute;
  inset: -2px;
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  background: var(--die-border-color);
  z-index: -1;
}

/* d8: diamond spin — rotates on its axis through all four points */
@keyframes die-d8-spin {
  0%   { transform: rotate(0deg)   scale(1);    }
  20%  { transform: rotate(90deg)  scale(1.12); }
  40%  { transform: rotate(180deg) scale(1.05); }
  60%  { transform: rotate(270deg) scale(1.1);  }
  80%  { transform: rotate(330deg) scale(1.02); }
  100% { transform: rotate(360deg) scale(1);    }
}

@media (prefers-reduced-motion: no-preference) {
  .die-d8.rolling {
    animation: die-d8-spin var(--die-animation-duration, 0.65s) ease-in-out;
    pointer-events: none;
  }
}
```

---

### d10 — Elongated Diamond / Kite

```css
.die-d10 {
  /* Taller than wide: 60% width at widest, point at top and bottom */
  clip-path: polygon(50% 0%, 95% 40%, 50% 100%, 5% 40%);
  border-radius: 0;
  border: none; /* clip-path clips the border; use ::before pseudo-element instead */
  position: relative;
}

/* Simulated border: a slightly larger shape behind the die in the border colour */
.die-d10::before {
  content: '';
  position: absolute;
  inset: -2px;
  clip-path: polygon(50% 0%, 95% 40%, 50% 100%, 5% 40%);
  background: var(--die-border-color);
  z-index: -1;
}

/* d10: flip animation — tumbles end-over-end on the Y axis */
@keyframes die-d10-flip {
  0%   { transform: perspective(300px) rotateY(0deg)   scale(1);    }
  30%  { transform: perspective(300px) rotateY(120deg) scale(1.1);  }
  60%  { transform: perspective(300px) rotateY(240deg) scale(1.05); }
  100% { transform: perspective(300px) rotateY(360deg) scale(1);    }
}

@media (prefers-reduced-motion: no-preference) {
  .die-d10.rolling {
    animation: die-d10-flip var(--die-animation-duration, 0.7s) ease-in-out;
    pointer-events: none;
  }
}
```

---

### d12 — Pentagon

```css
.die-d12 {
  /* Regular pentagon — point up */
  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
  border-radius: 0;
  border: none; /* clip-path clips the border; use ::before pseudo-element instead */
  position: relative;
}

/* Simulated border: a slightly larger shape behind the die in the border colour */
.die-d12::before {
  content: '';
  position: absolute;
  inset: -2px;
  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
  background: var(--die-border-color);
  z-index: -1;
}

/* d12: complex multi-axis rotation — the heaviest-feeling die */
@keyframes die-d12-tumble {
  0%   { transform: rotate(0deg)   rotateX(0deg)    scale(1);    }
  20%  { transform: rotate(72deg)  rotateX(60deg)   scale(1.15); }
  40%  { transform: rotate(144deg) rotateX(120deg)  scale(1.08); }
  60%  { transform: rotate(216deg) rotateX(180deg)  scale(1.12); }
  80%  { transform: rotate(288deg) rotateX(240deg)  scale(1.04); }
  100% { transform: rotate(360deg) rotateX(360deg)  scale(1);    }
}

@media (prefers-reduced-motion: no-preference) {
  .die-d12.rolling {
    animation: die-d12-tumble var(--die-animation-duration, 0.8s) ease-in-out;
    pointer-events: none;
  }
}
```

---

### d20 — Circle

The established pattern from the game (perception_check_scene.html). The circle
is the simplest and most recognisable form for the most iconic RPG die.

```css
.die-d20 {
  border-radius: 50%;
}

/* d20: rotate + scale — proven from perception_check_scene.html */
@keyframes die-d20-roll {
  0%   { transform: rotate(0deg)   scale(1);    }
  20%  { transform: rotate(72deg)  scale(1.15); }
  40%  { transform: rotate(180deg) scale(1.05); }
  60%  { transform: rotate(270deg) scale(1.12); }
  80%  { transform: rotate(340deg) scale(1.02); }
  100% { transform: rotate(360deg) scale(1);    }
}

@media (prefers-reduced-motion: no-preference) {
  .die-d20.rolling {
    animation: die-d20-roll var(--die-animation-duration, 0.6s) ease-in-out;
    pointer-events: none;
  }
}
```

---

### d100 — Double Circle (Percentile)

Two concentric circles suggest the tens and units dice of a percentile roll.
The outer ring is the structural element; the inner pip indicates the units die.

```css
.die-d100 {
  border-radius: 50%;
  position: relative;
}

/* Inner pip — represents the units die */
.die-d100::before {
  content: '';
  position: absolute;
  width: 35%;
  height: 35%;
  border-radius: 50%;
  border: 1.5px solid var(--die-border-color);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.5;
}

/* d100: two-stage roll — outer (tens) then inner (units) */
@keyframes die-d100-tens {
  0%   { transform: rotate(0deg)   scale(1);    }
  45%  { transform: rotate(180deg) scale(1.1);  }
  100% { transform: rotate(360deg) scale(1);    }
}

@keyframes die-d100-units {
  0%   { transform: translate(-50%, -50%) rotate(0deg);    }
  100% { transform: translate(-50%, -50%) rotate(-540deg); }
}

@media (prefers-reduced-motion: no-preference) {
  .die-d100.rolling {
    animation: die-d100-tens var(--die-animation-duration, 0.9s) ease-in-out;
    pointer-events: none;
  }

  .die-d100.rolling::before {
    animation: die-d100-units var(--die-animation-duration, 0.9s) ease-in-out;
  }
}
```

---

## Die Roll Widget Pattern

The complete, proven HTML structure for a die roll check widget. This pattern
is extracted from the game (perception_check_scene.html) and generalised for
any attribute check. It follows four sequential stages:

1. **Narrative context** — sets the scene for why the check matters
2. **Check panel** — shows the attribute, modifiers, and breakdown cells
3. **Die button** — clickable die that animates and locks on roll
4. **Result + Proceed** — outcome badge and full-width CTA to continue

### Check Breakdown Row

The `D20 ROLL | + | MOD | + | PROF | = | TOTAL` strip used inside the check panel.
These classes are taken directly from the proven pattern.

```css
/* Check panel container */
.check-panel {
  background: var(--color-background-secondary);
  border: 0.5px solid var(--die-border-color);
  border-radius: var(--border-radius-lg);
  padding: 1.25rem;
  margin-bottom: 14px;
}

.check-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.check-title {
  font-family: var(--ta-font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--die-text-color);
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.06em;
}

/* Accent bar before title */
.check-title::before {
  content: '';
  width: 3px;
  height: 14px;
  background: var(--die-text-color);
  border-radius: 2px;
  flex-shrink: 0;
}

.check-bonus {
  font-family: var(--ta-font-body);
  font-size: 12px;
  color: var(--color-text-tertiary);
  background: var(--color-background-secondary);
  padding: 3px 10px;
  border-radius: var(--border-radius-md);
  border: 0.5px solid var(--color-border-tertiary);
}

/* Breakdown row */
.check-breakdown {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.cb-item {
  text-align: center;
  padding: 8px 12px;
  background: var(--color-background-secondary);
  border: 0.5px solid var(--color-border-tertiary);
  border-radius: 6px;
  min-width: 80px;
}

.cb-item.cb-total {
  border-color: var(--die-border-color); /* highlighted total cell */
}

.cb-label {
  font-family: var(--ta-font-body);
  font-size: 10px;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.cb-val {
  font-family: var(--ta-font-body);
  font-size: 18px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-top: 2px;
}

.cb-val.cb-total-val {
  color: var(--die-text-color); /* accent colour for total */
}

/* Operator glyphs */
.cb-plus {
  font-family: var(--ta-font-body);
  font-size: 20px;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
}

.cb-eq {
  font-family: var(--ta-font-body);
  font-size: 20px;
  color: var(--die-text-color);
  display: flex;
  align-items: center;
}

/* Die zone */
.dice-zone {
  text-align: center;
  margin-bottom: 8px;
}

.die-hint {
  font-family: var(--ta-font-body);
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-top: 8px;
}

/* Result reveal area — hidden until roll completes */
.result-area {
  display: none;
}

.result-area.show {
  display: block;
  animation: die-result-reveal 0.5s ease-out;
}

@keyframes die-result-reveal {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1);    }
}

.result-total {
  text-align: center;
  margin: 12px 0;
}

.result-num {
  font-family: var(--ta-font-body);
  font-size: 42px;
  font-weight: 500;
  margin-bottom: 2px;
}

.result-tag {
  font-family: var(--ta-font-body);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

/* Proceed button — full-width CTA, hidden until result shows */
.proceed-btn {
  display: none;
  width: 100%;
  margin-top: 10px;
  background: var(--ta-color-accent-bg);
  border: 0.5px solid var(--ta-color-accent);
  color: var(--color-text-primary);
  font-family: var(--ta-font-body);
  font-size: 14px;
  font-weight: 500;
  padding: 12px;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
  letter-spacing: 0.06em;
}

.proceed-btn:hover {
  background: var(--ta-color-accent-bg-hover);
  transform: translateY(-1px);
}

.proceed-btn.show {
  display: block;
  animation: die-result-reveal 0.5s ease-out;
}

.proceed-btn:focus-visible {
  outline: 2px solid var(--ta-color-focus);
  outline-offset: 2px;
}
```

### Complete Die Roll Widget HTML

```html
<style>
  /* Die custom properties — set by visual style */
  :root {
    --die-border-color: var(--color-border-secondary);
    --die-bg:           transparent;
    --die-text-color:   var(--color-text-primary);
    --die-hover-bg:     var(--color-background-secondary);
    --die-hover-border: var(--color-border-primary);
    --die-rolled-bg:    var(--color-background-secondary);
    --die-rolled-border:var(--color-border-tertiary);
    --die-animation-duration: 0.6s;
  }

  /* ... paste die base + .die-d20 CSS here from above ... */
  /* ... paste check panel CSS here from above ... */
</style>

<div class="roll-root">
  <!-- Narrative context -->
  <h2 class="roll-heading">Perception Check</h2>
  <p class="roll-action">
    You scan the room, watching for anything out of place.
  </p>

  <!-- Check panel -->
  <div class="check-panel">
    <div class="check-header">
      <div class="check-title">Wisdom — Perception</div>
      <div class="check-bonus">Proficient</div>
    </div>

    <!-- Breakdown: D20 ROLL + WIS MOD + PROFICIENCY = TOTAL -->
    <div class="check-breakdown">
      <div class="cb-item">
        <div class="cb-label">d20 roll</div>
        <div class="cb-val" id="rawRoll">?</div>
      </div>
      <div class="cb-plus">+</div>
      <div class="cb-item">
        <div class="cb-label">WIS mod</div>
        <div class="cb-val">+2</div>
      </div>
      <div class="cb-plus">+</div>
      <div class="cb-item">
        <div class="cb-label">Proficiency</div>
        <div class="cb-val">+2</div>
      </div>
      <div class="cb-eq">=</div>
      <div class="cb-item cb-total">
        <div class="cb-label">Total</div>
        <div class="cb-val cb-total-val" id="totalRoll">?</div>
      </div>
    </div>

    <!-- Die button (d20 circle) -->
    <div class="dice-zone">
      <button class="die-d20" id="diceBtn">
        <div class="die-label">d20</div>
        <div class="die-face" id="diceFace">?</div>
      </button>
      <div class="die-hint" id="diceHint">Click the die to roll</div>
    </div>

    <!-- Result reveal -->
    <div class="result-area" id="resultArea">
      <div class="result-total">
        <div class="result-num" id="resultNum"></div>
        <div class="result-tag" id="resultTag"></div>
      </div>
    </div>

    <!-- Proceed CTA -->
    <button class="proceed-btn" id="proceedBtn">Continue</button>
  </div>
</div>

<script>
(function() {
  const MODIFIER   = 2;  /* attribute modifier */
  const PROFICIENCY = 2;  /* proficiency bonus — 0 if not proficient */
  const DC         = 14;  /* difficulty class */

  let rolled = false;
  let rawVal = 0;
  let finalTotal = 0;

  document.getElementById('diceBtn').addEventListener('click', function() {
    if (rolled) return;
    const btn  = this;
    const face = document.getElementById('diceFace');
    btn.classList.add('rolling');

    /* Flicker animation — show random numbers before landing */
    let flicks = 0;
    const maxFlicks = 12;
    const interval = setInterval(function() {
      face.textContent = Math.floor(Math.random() * 20) + 1;
      flicks++;
      if (flicks >= maxFlicks) {
        clearInterval(interval);
        rawVal     = Math.floor(Math.random() * 20) + 1;
        finalTotal = rawVal + MODIFIER + PROFICIENCY;
        face.textContent = rawVal;
        document.getElementById('rawRoll').textContent   = rawVal;
        document.getElementById('totalRoll').textContent = finalTotal;
        btn.classList.remove('rolling');
        btn.classList.add('rolled');
        rolled = true;

        /* Determine outcome */
        const resultNum = document.getElementById('resultNum');
        const resultTag = document.getElementById('resultTag');
        resultNum.textContent = finalTotal;

        if (rawVal === 20) {
          resultTag.textContent = 'Natural 20 — Critical Success';
        } else if (rawVal === 1) {
          resultTag.textContent = 'Natural 1 — Critical Failure';
        } else if (finalTotal >= DC + 5) {
          resultTag.textContent = 'Exceptional Success';
        } else if (finalTotal >= DC) {
          resultTag.textContent = 'Success';
        } else if (DC - finalTotal <= 3) {
          resultTag.textContent = 'Partial Success';
        } else {
          resultTag.textContent = 'Failure';
        }

        document.getElementById('resultArea').classList.add('show');
        document.getElementById('diceHint').textContent = 'Roll locked in';

        const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 400;
        setTimeout(function() {
          document.getElementById('proceedBtn').classList.add('show');
        }, delay);
      }
    }, 55);
  });

  document.getElementById('proceedBtn').addEventListener('click', function() {
    const prompt = 'I rolled a natural ' + rawVal + ' on the d20, plus modifier '
      + MODIFIER + ', plus proficiency ' + PROFICIENCY
      + ', for a total of ' + finalTotal + ' against DC ' + DC + '. Continue.';
    if (typeof sendPrompt === 'function') {
      sendPrompt(prompt);
    } else {
      /* Fallback: show copyable prompt */
      const hint = document.getElementById('diceHint');
      hint.textContent = prompt;
    }
  });
})();
</script>
```

---

## Observation Card Pattern

Used for sequential NPC / environmental observation reveals. Each card has a
coloured left accent bar, a header row with icon + name + role + status tag,
a description body, and an optional perception detail block. Cards animate in
with staggered delays for sequential reveal.

```css
/* Observation card — coloured left accent bar via ::before */
.obs-card {
  position: relative;
  padding: 12px 14px 12px 18px;
  border: 0.5px solid var(--color-border-tertiary);
  border-radius: var(--border-radius-md);
  background: var(--color-background-secondary);
  margin-bottom: 10px;
  animation: obs-card-in 0.4s ease-out both;
}

.obs-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: var(--border-radius-md) 0 0 var(--border-radius-md);
  background: var(--ta-color-accent); /* visual style overrides per card type */
}

/* Accent variants — visual styles provide the actual colour values */
.obs-card.obs-danger::before   { background: var(--ta-color-danger);  }
.obs-card.obs-warning::before  { background: var(--ta-color-warning); }
.obs-card.obs-success::before  { background: var(--ta-color-success); }
.obs-card.obs-neutral::before  { background: var(--color-border-secondary); }

/* Staggered reveal — apply nth-of-type delays or inline style="--obs-delay: Ns" */
.obs-card { animation-delay: var(--obs-delay, 0s); }

@keyframes obs-card-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0);   }
}

@media (prefers-reduced-motion: no-preference) {
  /* Animation already wrapped above — no extra work needed */
}

@media (prefers-reduced-motion: reduce) {
  .obs-card { animation: none; }
}

/* Card header: icon + name + role + status tag */
.obs-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.obs-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.obs-name {
  font-family: var(--ta-font-body);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.obs-role {
  font-family: var(--ta-font-body);
  font-size: 10px;
  color: var(--color-text-tertiary);
  letter-spacing: 0.06em;
}

.obs-status {
  font-family: var(--ta-font-body);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 999px;
  border: 0.5px solid var(--color-border-tertiary);
  color: var(--color-text-tertiary);
  margin-left: auto; /* push to right of header row */
}

.obs-status.danger  { border-color: var(--ta-color-danger-border);  color: var(--ta-color-danger);  background: var(--ta-color-danger-bg);  }
.obs-status.warning { border-color: var(--ta-color-warning-border); color: var(--ta-color-warning); background: var(--ta-color-warning-bg); }
.obs-status.success { border-color: var(--ta-color-success-border); color: var(--ta-color-success);                                         }

/* Card body */
.obs-body {
  font-family: var(--ta-font-serif, Georgia, 'Times New Roman', serif);
  font-size: 12px;
  line-height: 1.7;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

/* Perception detail block — e.g. "EYE" / high-roll bonus detail */
.obs-detail {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--border-radius-md);
  background: var(--ta-color-accent-bg);
  border: 0.5px solid var(--ta-color-accent);
  margin-top: 4px;
}

.obs-detail-icon {
  font-size: 13px;
  flex-shrink: 0;
  margin-top: 1px;
}

.obs-detail-text {
  font-family: var(--ta-font-serif, Georgia, 'Times New Roman', serif);
  font-size: 11px;
  line-height: 1.6;
  color: var(--color-text-secondary);
}
```

### Observation Card HTML Example

```html
<!-- Stagger delays applied via inline custom property -->
<div class="obs-card obs-warning" style="--obs-delay: 0s">
  <div class="obs-head">
    <span class="obs-icon" aria-hidden="true">&#x1F441;</span>
    <span class="obs-name">Tomas Vrek</span>
    <span class="obs-role">Regular — corner booth</span>
    <span class="obs-status warning">Nervous</span>
  </div>
  <p class="obs-body">
    He hasn't touched his drink in twenty minutes. His eyes track the door
    every few seconds — always the same interval, like clockwork.
  </p>
  <div class="obs-detail">
    <span class="obs-detail-icon" aria-hidden="true">&#x1F50E;</span>
    <span class="obs-detail-text">
      <strong>High roll detail:</strong> The rhythm is too regular. He's counting
      something — waiting for a signal, not a person.
    </span>
  </div>
</div>

<div class="obs-card obs-neutral" style="--obs-delay: 0.15s">
  <div class="obs-head">
    <span class="obs-icon" aria-hidden="true">&#x1F464;</span>
    <span class="obs-name">Couple — window seats</span>
    <span class="obs-role">Civilians</span>
    <span class="obs-status">Normal</span>
  </div>
  <p class="obs-body">
    Absorbed in their own conversation. Not relevant.
  </p>
</div>

<div class="obs-card obs-danger" style="--obs-delay: 0.3s">
  <div class="obs-head">
    <span class="obs-icon" aria-hidden="true">&#x26A0;</span>
    <span class="obs-name">Unknown — near service exit</span>
    <span class="obs-role">Position is wrong for a customer</span>
    <span class="obs-status danger">Threat</span>
  </div>
  <p class="obs-body">
    Standing, not sitting. Facing the room, not the bar. Jacket is too
    heavy for the station's climate.
  </p>
  <div class="obs-detail">
    <span class="obs-detail-icon" aria-hidden="true">&#x1F50E;</span>
    <span class="obs-detail-text">
      <strong>High roll detail:</strong> The bulge under the left arm is a
      shoulder holster, not a comm unit.
    </span>
  </div>
</div>
```

---

## Numbered Action Card Pattern

Full-width button cards presenting player choices with a number circle, title,
description, and optional mechanical check info. Used for scene action selection
where each option has distinct mechanical weight.

```css
/* Action card — full-width clickable button */
.action-card {
  display: block;
  width: 100%;
  text-align: left;
  padding: 14px 16px;
  background: transparent;
  border: 0.5px solid var(--color-border-tertiary);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  margin-bottom: 8px;
  font-family: var(--ta-font-body);
}

.action-card:hover {
  background: var(--ta-color-accent-bg);
  border-color: var(--ta-color-accent);
}

.action-card:focus-visible {
  outline: 2px solid var(--ta-color-focus);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .action-card { transition: none; }
}

/* Card inner layout */
.action-card-inner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

/* Number circle */
.action-card-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--ta-color-accent-bg);
  border: 1px solid var(--ta-color-accent);
  color: var(--ta-color-accent);
  font-family: var(--ta-font-body);
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

/* Text column */
.action-card-body {
  flex: 1;
}

.action-card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 3px;
}

.action-card-desc {
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

/* Mechanical check info — monospace, tertiary colour */
.action-card-mech {
  font-family: var(--ta-font-body);
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--color-text-tertiary);
  padding: 3px 8px;
  border-radius: var(--border-radius-md);
  border: 0.5px solid var(--color-border-tertiary);
  display: inline-block;
}
```

### Numbered Action Card HTML Example

```html
<p class="section-label">What do you do?</p>

<button class="action-card" data-prompt="I keep wiping the bar and say nothing. Passive observation.">
  <div class="action-card-inner">
    <div class="action-card-num">1</div>
    <div class="action-card-body">
      <div class="action-card-title">Stay quiet. Keep working.</div>
      <p class="action-card-desc">
        You say nothing. Thirty years behind this bar have taught you that
        silence is its own kind of answer — and its own kind of pressure.
      </p>
      <span class="action-card-mech">WIS check — DC 10 — Insight passive</span>
    </div>
  </div>
</button>

<button class="action-card" data-prompt="I slide the chip back across the bar toward him.">
  <div class="action-card-inner">
    <div class="action-card-num">2</div>
    <div class="action-card-body">
      <div class="action-card-title">Slide the chip back.</div>
      <p class="action-card-desc">
        You push the credit chip back across the bar without a word.
        The message is clear enough.
      </p>
      <span class="action-card-mech">CHA check — DC 12 — Persuasion or Intimidation</span>
    </div>
  </div>
</button>

<button class="action-card" data-prompt="I lean in and ask him quietly what he wants.">
  <div class="action-card-inner">
    <div class="action-card-num">3</div>
    <div class="action-card-body">
      <div class="action-card-title">Ask him directly.</div>
      <p class="action-card-desc">
        You lean across the bar, voice low enough that only he hears it.
        "What is it you actually want?"
      </p>
      <span class="action-card-mech">CHA check — DC 13 — Persuasion</span>
    </div>
  </div>
</button>
```

---

## Worked Examples

Five complete HTML widget examples demonstrating the core structural patterns. Each is
renderable as-is inside `visualize:show_widget`. CSS variables prefixed `--ta-` are
provided by the active visual style; variables without the prefix (e.g.
`var(--color-text-primary)`) reference the Claude.ai host theme.

**Note:** These examples use CSS custom properties for all visual presentation. The active
visual style file defines the values. See the CSS Custom Property Contract above.

---

### Example 1 — Opening Scene

A first-scene widget with progressive reveal, location bar, atmosphere strip,
three POI buttons, three action buttons, status bar, and panel footer.

```html
<style>
  .root { font-family: var(--ta-font-body); padding: 1rem 0 1.5rem; }

  /* Progressive reveal */
  .brief-text {
    font-size: 14px; line-height: 1.7; color: var(--color-text-primary);
    margin: 0 0 1rem;
  }
  .continue-btn {
    font-family: var(--ta-font-body); font-size: 11px;
    letter-spacing: 0.1em; padding: 8px 20px; min-height: 44px; min-width: 44px; box-sizing: border-box;
    background: transparent; border: 0.5px solid var(--color-border-secondary);
    border-radius: var(--border-radius-md); color: var(--color-text-primary);
    cursor: pointer;
  }
  .continue-btn:hover { background: var(--color-background-secondary); }
  button:focus-visible, [data-prompt]:focus-visible { outline: 2px solid var(--ta-color-focus); outline-offset: 2px; }

  /* Location bar */
  .loc-bar {
    display: flex; justify-content: space-between; align-items: baseline;
    padding-bottom: 8px; margin-bottom: 12px;
    border-bottom: 0.5px solid var(--color-border-tertiary);
  }
  .loc-name {
    font-family: var(--ta-font-heading); font-size: 16px; font-weight: 700;
    color: var(--color-text-primary); margin: 0;
  }
  .scene-num {
    font-size: 10px; letter-spacing: 0.12em; color: var(--color-text-tertiary);
    text-transform: uppercase;
  }

  /* Atmosphere strip */
  .atmo-strip { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
  .atmo-pill {
    font-size: 10px; letter-spacing: 0.08em; padding: 3px 10px;
    border-radius: 999px; border: 0.5px solid var(--color-border-tertiary);
    color: var(--color-text-tertiary);
  }

  /* Narrative */
  .narrative {
    font-size: 13px; line-height: 1.8; color: var(--color-text-primary);
    margin: 0 0 16px;
  }

  /* POI + action buttons */
  .section-label {
    font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--color-text-tertiary); margin: 16px 0 8px;
  }
  .btn-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }

  /* POI/explore buttons — outlined style, no fill */
  .poi-btn, .btn-poi {
    font-family: var(--ta-font-body); font-size: 11px;
    letter-spacing: 0.06em; padding: 7px 14px;
    background: transparent; border: var(--ta-border-style-poi) var(--color-border-secondary);
    border-radius: var(--border-radius-md); color: var(--color-text-secondary);
    cursor: pointer; transition: background 0.12s;
  }
  .poi-btn:hover, .btn-poi:hover {
    background: var(--color-background-secondary);
    border-style: solid;
  }

  /* Action/advance buttons — accent-coloured */
  .action-btn, .btn-action {
    font-family: var(--ta-font-body); font-size: 11px;
    letter-spacing: 0.06em; padding: 7px 14px;
    background: var(--ta-color-accent-bg); border: 0.5px solid var(--ta-color-accent);
    border-radius: var(--border-radius-md); color: var(--color-text-primary);
    cursor: pointer; transition: background 0.12s;
  }
  .action-btn:hover, .btn-action:hover { background: var(--ta-color-accent-bg-hover); }

  /* Status bar */
  .status-bar {
    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
    padding: 10px 0; margin-top: 8px;
    border-top: 0.5px solid var(--color-border-tertiary);
    font-size: 10px; color: var(--color-text-tertiary);
    letter-spacing: 0.06em;
  }
  .hp-pips { display: flex; gap: 4px; align-items: center; }
  .pip {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--ta-color-success); border: 0.5px solid var(--ta-color-success-border);
  }
  .pip.empty { background: transparent; border-color: var(--color-border-tertiary); }
  .sr-only {
    position: absolute; width: 1px; height: 1px;
    padding: 0; margin: -1px; overflow: hidden;
    clip: rect(0,0,0,0); white-space: nowrap; border: 0;
  }
  .xp-track {
    width: 60px; height: 3px; background: var(--color-border-tertiary);
    border-radius: 2px; overflow: hidden;
  }
  .xp-fill { height: 100%; width: 0%; background: var(--ta-color-xp); border-radius: 2px; }

  /* Footer */
  .footer-row {
    display: flex; justify-content: flex-start; gap: 8px; flex-wrap: wrap;
    margin-top: 14px; padding-top: 10px;
    border-top: 0.5px solid var(--color-border-tertiary);
  }
  .footer-btn {
    font-family: var(--ta-font-body); font-size: 10px;
    letter-spacing: 0.08em; padding: 8px 14px;
    min-height: 44px; min-width: 44px; box-sizing: border-box;
    background: transparent; border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-md); color: var(--color-text-tertiary);
    cursor: pointer;
  }
  .footer-btn:hover { border-color: var(--color-border-secondary); color: var(--color-text-secondary); }

  /* Panels */
  #panel-overlay { display: none; padding: 0; }
  .panel-header {
    display: flex; align-items: baseline; justify-content: space-between;
    padding-bottom: 10px; margin-bottom: 12px;
    border-bottom: 0.5px solid var(--color-border-tertiary);
  }
  .panel-title {
    font-family: var(--ta-font-heading); font-size: 18px; font-weight: 600;
    color: var(--color-text-primary);
  }
  .panel-close-btn {
    font-family: var(--ta-font-body); font-size: 10px;
    letter-spacing: 0.08em; background: transparent;
    border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-md); padding: 8px 14px;
    min-height: 44px; min-width: 44px; box-sizing: border-box;
    color: var(--color-text-tertiary); cursor: pointer;
  }
  .panel-close-btn:hover { border-color: var(--color-border-secondary); color: var(--color-text-secondary); }
  .panel-content { display: none; font-size: 12px; line-height: 1.7; color: var(--color-text-secondary); }

  .fallback-text { font-size: 11px; color: var(--color-text-tertiary); margin-top: 8px; display: none; }
  .copy-btn {
    font-family: var(--ta-font-body); font-size: 10px; letter-spacing: 0.06em;
    padding: 4px 10px; min-height: 44px; min-width: 44px; box-sizing: border-box;
    background: transparent; border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-md); color: var(--color-text-tertiary);
    cursor: pointer; margin-left: 8px; vertical-align: middle;
  }
  .copy-btn:hover { border-color: var(--color-border-secondary); color: var(--color-text-secondary); }

  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  #reveal-full.revealed { animation: fade-in 0.25s ease-out; }
  @media (prefers-reduced-motion: reduce) { #reveal-full.revealed { animation: none; } }
</style>

<div class="root">
  <!-- Progressive reveal — brief -->
  <div id="reveal-brief">
    <p class="brief-text">The airlock seals behind you with a slow, pressurised hiss. You are aboard the station.</p>
    <button class="continue-btn" id="continue-reveal-btn">Continue</button>
  </div>

  <!-- Progressive reveal — full scene -->
  <div id="reveal-full" style="display:none">
    <div id="scene-content">
      <!-- Location bar -->
      <div class="loc-bar">
        <h2 class="loc-name">Docking Ring — Bay 7</h2>
        <span class="scene-num">Scene 1</span>
      </div>

      <!-- Atmosphere strip -->
      <div class="atmo-strip">
        <span class="atmo-pill">Recycled air, faintly metallic</span>
        <span class="atmo-pill">Low hum of generators</span>
        <span class="atmo-pill">Cold strip-lighting overhead</span>
      </div>

      <!-- Narrative -->
      <p class="narrative">
        You step off the boarding ramp into a wide, grey corridor. The docking bay is quiet
        — too quiet for a station of this size. Cargo crates are stacked haphazardly along the
        far wall, several bearing shipping stamps you do not recognise. A console near the inner
        door blinks an amber warning cycle, and beyond it a corridor stretches deeper into the
        station. A figure in a patched flight jacket leans against the bulkhead, watching you
        with studied disinterest.
      </p>

      <!-- Points of interest — outlined (btn-poi) with search icon prefix -->
      <p class="section-label">Points of interest</p>
      <div class="btn-row">
        <button class="btn-poi" data-prompt="I examine the blinking console.">&#x1F50D; Investigate the console</button>
        <button class="btn-poi" data-prompt="I look down the corridor beyond the inner door.">&#x1F50D; Check the corridor</button>
        <button class="btn-poi" data-prompt="I approach the stranger in the flight jacket.">&#x1F50D; Talk to the stranger</button>
      </div>

      <!-- Actions — accent-coloured (btn-action) -->
      <p class="section-label">What do you do?</p>
      <div class="btn-row">
        <button class="btn-action" data-prompt="I head straight through the inner door into the station.">Push deeper into the station</button>
        <button class="btn-action" data-prompt="I search the cargo crates for useful supplies.">Search the cargo crates</button>
        <button class="btn-action" data-prompt="I wait here and observe the bay before moving on.">Wait and observe</button>
      </div>

      <!-- Fallback prompt -->
      <p class="fallback-text" id="fallback">
        If the buttons above do not work, copy one of these prompts and paste it into the chat:<br>
        <code id="fallback-prompt"></code><button class="copy-btn" id="fallback-copy-btn">Copy</button>
      </p>

      <!-- Status bar -->
      <div class="status-bar">
        <span>HP</span>
        <div class="hp-pips">
          <span class="pip"></span><span class="pip"></span><span class="pip"></span>
          <span class="pip"></span><span class="pip"></span><span class="pip"></span>
          <span class="sr-only">6 of 6 HP</span>
        </div>
        <span>XP</span>
        <div class="xp-track"><div class="xp-fill" style="width:0%"></div></div>
        <span>LVL 1</span>
      </div>
    </div>

    <!-- Panel overlay -->
    <div id="panel-overlay" style="display:none">
      <div class="panel-header">
        <span class="panel-title" id="panel-title-text" tabindex="-1"></span>
        <button class="panel-close-btn" id="panel-close-btn">Close</button>
      </div>
      <div class="panel-content" data-panel="character">
        <p><strong>Kael — Soldier</strong><br>Level 1 &middot; 0 / 100 XP</p>
        <p>STR 16 (+3) &middot; DEX 12 (+1) &middot; CON 14 (+2)<br>INT 10 (+0) &middot; WIS 8 (-1) &middot; CHA 11 (+0)</p>
        <p>Equipped: Pulse Rifle (+3 ranged) &middot; Flak Vest (AC 13)</p>
        <p>Inventory: Ration pack, med-stim x2, torch</p>
      </div>
      <div class="panel-content" data-panel="codex">
        <p><em>No lore entries discovered yet.</em></p>
      </div>
      <div class="panel-content" data-panel="ship">
        <p><strong>The Vagrant</strong> — Light Freighter<br>Hull: 10 / 10 &middot; Fuel: 8 / 10</p>
      </div>
      <div class="panel-content" data-panel="nav">
        <p>Current location: Kellos Station, outer ring<br>No destinations charted.</p>
      </div>
    </div>
  </div>

  <!-- Footer — always visible -->
  <div class="footer-row">
    <button class="footer-btn" data-panel="character" aria-expanded="false">Character</button>
    <button class="footer-btn" data-panel="codex" aria-expanded="false">Codex</button>
    <button class="footer-btn" data-panel="ship" aria-expanded="false">Ship</button>
    <button class="footer-btn" data-panel="nav" aria-expanded="false">Nav chart</button>
  </div>
</div>

<script>
/* Progressive reveal — continue button */
document.getElementById('continue-reveal-btn').addEventListener('click', function() {
  document.getElementById('reveal-brief').style.display = 'none';
  document.getElementById('reveal-full').style.display = 'block';
  document.getElementById('reveal-full').classList.add('revealed');
});

/* Panel toggle system */
let activePanel = null;
function togglePanel(panelId) {
  const overlay = document.getElementById('panel-overlay');
  const scene = document.getElementById('scene-content');
  const title = document.getElementById('panel-title-text');
  if (activePanel === panelId) {
    overlay.style.display = 'none'; scene.style.display = 'block';
    activePanel = null;
    document.querySelectorAll('[data-panel]').forEach(b => b.setAttribute('aria-expanded', 'false'));
    return;
  }
  overlay.style.display = 'block'; scene.style.display = 'none';
  activePanel = panelId;
  title.textContent = panelId.charAt(0).toUpperCase() + panelId.slice(1);
  document.querySelectorAll('.panel-content').forEach(p =>
    p.style.display = p.dataset.panel === panelId ? 'block' : 'none');
  document.querySelectorAll('[data-panel]').forEach(b =>
    b.setAttribute('aria-expanded', b.dataset.panel === panelId ? 'true' : 'false'));
  title.focus();
}
function closePanel() {
  document.getElementById('panel-overlay').style.display = 'none';
  document.getElementById('scene-content').style.display = 'block';
  activePanel = null;
  document.querySelectorAll('[data-panel]').forEach(b => b.setAttribute('aria-expanded', 'false'));
}

/* Panel toggle + close — event delegation via data-panel attributes */
document.querySelectorAll('[data-panel]').forEach(btn => {
  btn.addEventListener('click', () => togglePanel(btn.dataset.panel));
});
document.getElementById('panel-close-btn').addEventListener('click', closePanel);

/* sendPrompt with fallback — all data-prompt buttons */
document.querySelectorAll('[data-prompt]').forEach(btn => {
  btn.addEventListener('click', () => {
    const prompt = btn.dataset.prompt;
    if (typeof sendPrompt === 'function') {
      sendPrompt(prompt);
    } else {
      const fb = document.getElementById('fallback');
      const fp = document.getElementById('fallback-prompt');
      if (fb && fp) {
        fp.textContent = prompt;
        fb.style.display = 'block';
      }
    }
  });
});

/* Copy button — fallback prompt */
document.querySelectorAll('.copy-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    const code = this.previousElementSibling;
    if (code && navigator.clipboard) {
      navigator.clipboard.writeText(code.textContent).then(() => {
        this.textContent = 'Copied!';
        setTimeout(() => { this.textContent = 'Copy'; }, 2000);
      });
    }
  });
});
</script>
```

---

### Example 2 — Combat Encounter

A combat widget with initiative bar, enemy HP pips, player status, and an
action panel with four options. Uses `data-prompt` + `addEventListener`.

```html
<style>
  .combat-root { font-family: var(--ta-font-body); padding: 1rem 0 1.5rem; }

  /* Initiative bar */
  .init-bar {
    display: flex; gap: 6px; align-items: center; margin-bottom: 14px;
    padding-bottom: 10px; border-bottom: 0.5px solid var(--color-border-tertiary);
  }
  .init-label {
    font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--color-text-tertiary); margin-right: 4px;
  }
  .init-chip {
    font-size: 10px; letter-spacing: 0.06em; padding: 3px 10px;
    border-radius: var(--border-radius-md); border: 0.5px solid var(--color-border-tertiary);
    color: var(--color-text-secondary);
  }
  .init-chip.active {
    border-color: var(--ta-color-success); color: var(--ta-color-success); font-weight: 500;
  }

  /* Encounter heading */
  .encounter-heading {
    font-family: var(--ta-font-heading); font-size: 16px; font-weight: 700;
    color: var(--color-text-primary); margin: 0 0 4px;
  }
  .encounter-sub {
    font-size: 11px; color: var(--color-text-tertiary); margin: 0 0 16px;
  }

  /* Enemy cards */
  .enemy-row { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 18px; }
  .enemy-card {
    flex: 1; min-width: 140px; padding: 10px 12px;
    border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-md);
  }
  .enemy-name {
    font-size: 12px; font-weight: 500; color: var(--color-text-primary);
    margin: 0 0 6px;
  }
  .enemy-role {
    font-size: 10px; color: var(--color-text-tertiary); margin: 0 0 8px;
  }
  .hp-row { display: flex; gap: 4px; align-items: center; }
  .hp-label { font-size: 10px; color: var(--color-text-tertiary); margin-right: 4px; }
  .pip {
    width: 8px; height: 8px; border-radius: 50%;
    border: 0.5px solid var(--ta-color-danger-border); background: var(--ta-color-danger);
  }
  .pip.empty { background: transparent; border-color: var(--color-border-tertiary); }
  .sr-only {
    position: absolute; width: 1px; height: 1px;
    padding: 0; margin: -1px; overflow: hidden;
    clip: rect(0,0,0,0); white-space: nowrap; border: 0;
  }

  /* Player status */
  .player-status {
    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
    padding: 10px 0; margin-bottom: 14px;
    border-top: 0.5px solid var(--color-border-tertiary);
    border-bottom: 0.5px solid var(--color-border-tertiary);
    font-size: 11px; color: var(--color-text-primary);
  }
  .player-pip {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--ta-color-success); border: 0.5px solid var(--ta-color-success-border);
  }
  .player-pip.empty { background: transparent; border-color: var(--color-border-tertiary); }
  .player-pips { display: flex; gap: 4px; align-items: center; }
  .condition-tag {
    font-size: 10px; letter-spacing: 0.08em; padding: 2px 8px;
    border-radius: 999px; border: 0.5px solid var(--color-border-tertiary);
    color: var(--color-text-tertiary);
  }

  /* Action panel */
  .section-label {
    font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--color-text-tertiary); margin: 0 0 8px;
  }
  .action-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
  .action-btn {
    font-family: var(--ta-font-body); font-size: 11px;
    letter-spacing: 0.06em; padding: 8px 16px;
    background: transparent; border: 0.5px solid var(--color-border-secondary);
    border-radius: var(--border-radius-md); color: var(--color-text-primary);
    cursor: pointer; transition: background 0.12s;
  }
  .action-btn:hover { background: var(--color-background-secondary); }
  .action-btn.attack { border-color: var(--ta-color-danger); color: var(--ta-color-danger); }
  .action-btn.attack:hover { background: var(--ta-color-danger-bg); }
  .action-btn.retreat { border-color: var(--color-text-tertiary); color: var(--color-text-tertiary); }

  .fallback-text { font-size: 11px; color: var(--color-text-tertiary); margin-top: 8px; display: none; }
  .copy-btn {
    font-family: var(--ta-font-body); font-size: 10px; letter-spacing: 0.06em;
    padding: 4px 10px; min-height: 44px; min-width: 44px; box-sizing: border-box;
    background: transparent; border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-md); color: var(--color-text-tertiary);
    cursor: pointer; margin-left: 8px; vertical-align: middle;
  }
  .copy-btn:hover { border-color: var(--color-border-secondary); color: var(--color-text-secondary); }
</style>

<div class="combat-root">
  <!-- Initiative bar -->
  <div class="init-bar">
    <span class="init-label">Turn order</span>
    <span class="init-chip active">Kael (You)</span>
    <span class="init-chip">Pirate — Blade</span>
    <span class="init-chip">Pirate — Pistol</span>
    <span class="init-chip">Pirate — Heavy</span>
  </div>

  <!-- Encounter heading -->
  <h2 class="encounter-heading">Ambush in Cargo Hold C</h2>
  <p class="encounter-sub">Three figures emerge from behind the crates, weapons drawn.</p>

  <!-- Enemy cards -->
  <div class="enemy-row">
    <div class="enemy-card">
      <p class="enemy-name">Pirate — Blade</p>
      <p class="enemy-role">Melee &middot; DEF 11</p>
      <div class="hp-row">
        <span class="hp-label">HP</span>
        <span class="pip"></span><span class="pip"></span>
        <span class="pip"></span><span class="pip"></span>
        <span class="sr-only">4 of 4 HP</span>
      </div>
    </div>
    <div class="enemy-card">
      <p class="enemy-name">Pirate — Pistol</p>
      <p class="enemy-role">Ranged &middot; DEF 12</p>
      <div class="hp-row">
        <span class="hp-label">HP</span>
        <span class="pip"></span><span class="pip"></span>
        <span class="pip"></span><span class="pip"></span>
        <span class="sr-only">4 of 4 HP</span>
      </div>
    </div>
    <div class="enemy-card">
      <p class="enemy-name">Pirate — Heavy</p>
      <p class="enemy-role">Ranged &middot; DEF 13</p>
      <div class="hp-row">
        <span class="hp-label">HP</span>
        <span class="pip"></span><span class="pip"></span>
        <span class="pip"></span><span class="pip"></span>
        <span class="sr-only">4 of 4 HP</span>
      </div>
    </div>
  </div>

  <!-- Player status -->
  <div class="player-status">
    <span>Kael</span>
    <span>HP</span>
    <div class="player-pips">
      <span class="player-pip"></span><span class="player-pip"></span>
      <span class="player-pip"></span><span class="player-pip"></span>
      <span class="player-pip"></span><span class="player-pip"></span>
      <span class="sr-only">6 of 6 HP</span>
    </div>
    <span>6 / 6</span>
    <span class="condition-tag">No conditions</span>
  </div>

  <!-- Action panel -->
  <p class="section-label">Your turn — choose an action</p>
  <div class="action-row">
    <button class="action-btn attack" data-prompt="I attack the Pirate with the blade using my Pulse Rifle.">Attack</button>
    <button class="action-btn" data-prompt="I use a skill. Show me my available abilities.">Skill</button>
    <button class="action-btn" data-prompt="I use an item from my inventory.">Item</button>
    <button class="action-btn retreat" data-prompt="I attempt to retreat from the fight.">Retreat</button>
  </div>

  <!-- Fallback -->
  <p class="fallback-text" id="combat-fallback">
    If the buttons above do not work, copy one of these prompts and paste it into the chat:<br>
    <code id="combat-fallback-prompt"></code><button class="copy-btn" id="combat-copy-btn">Copy</button>
  </p>
</div>

<script>
document.querySelectorAll('[data-prompt]').forEach(btn => {
  btn.addEventListener('click', () => {
    const prompt = btn.dataset.prompt;
    if (typeof sendPrompt === 'function') {
      sendPrompt(prompt);
    } else {
      const fb = document.getElementById('combat-fallback');
      const fp = document.getElementById('combat-fallback-prompt');
      if (fb && fp) {
        fp.textContent = prompt;
        fb.style.display = 'block';
      }
    }
  });
});

/* Copy button — fallback prompt */
document.querySelectorAll('.copy-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    const code = this.previousElementSibling;
    if (code && navigator.clipboard) {
      navigator.clipboard.writeText(code.textContent).then(() => {
        this.textContent = 'Copied!';
        setTimeout(() => { this.textContent = 'Copy'; }, 2000);
      });
    }
  });
});
</script>
```

---

### Example 3 — Dice Roll Resolution (Four Stages)

A complete four-stage dice roll widget: Declare, Roll (animate), Resolve, and
Continue. Demonstrates a D&D 5e Stealth check (DEX, DC 14). Each stage is
revealed sequentially via button clicks — never combined or skipped.

```html
<style>
  .roll-root { font-family: var(--ta-font-body); padding: 1rem 0 1.5rem; }

  .roll-heading {
    font-family: var(--ta-font-heading); font-size: 16px; font-weight: 700;
    color: var(--color-text-primary); margin: 0 0 4px;
  }
  .roll-action {
    font-size: 12px; color: var(--color-text-secondary); margin: 0 0 16px;
    line-height: 1.6;
  }

  /* Attribute reveal */
  .attr-row {
    display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px;
    padding: 10px 14px; border-radius: var(--border-radius-md);
    background: var(--color-background-secondary);
    border: 0.5px solid var(--color-border-tertiary);
  }
  .attr-name {
    font-size: 13px; font-weight: 500; color: var(--color-text-primary);
  }
  .attr-mod {
    font-size: 11px; color: var(--color-text-tertiary);
  }

  /* Roll button */
  .roll-btn {
    font-family: var(--ta-font-body); font-size: 14px;
    font-weight: 500; letter-spacing: 0.12em; padding: 12px 32px;
    background: transparent; border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius-md); color: var(--color-text-primary);
    cursor: pointer; display: block; margin: 0 auto 16px;
    transition: background 0.12s;
  }
  .roll-btn:hover { background: var(--color-background-secondary); }
  .roll-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  /* Die display */
  .die-display {
    display: none; text-align: center; margin-bottom: 16px;
  }
  .die-value {
    font-size: 36px; font-weight: 700; color: var(--color-text-primary);
    display: inline-block;
  }
  @keyframes die-spin {
    0%   { transform: rotateX(0deg);   opacity: 0.4; }
    50%  { transform: rotateX(180deg); opacity: 0.7; }
    100% { transform: rotateX(360deg); opacity: 1;   }
  }
  .die-value.spinning { animation: die-spin var(--ta-die-spin-duration, 0.6s) ease-out; }

  /* Reduced motion — disable die animation and all transitions */
  @media (prefers-reduced-motion: reduce) {
    .die-value.spinning { animation: none; opacity: 1; }
    * { transition-duration: 0.01ms !important; }
  }

  /* Resolve block */
  .resolve-block {
    display: none; padding: 12px 14px; margin-bottom: 16px;
    border-radius: var(--border-radius-md);
    border: 0.5px solid var(--color-border-tertiary);
    background: var(--color-background-secondary);
  }
  .resolve-row {
    display: flex; justify-content: space-between; align-items: baseline;
    font-size: 12px; color: var(--color-text-secondary); margin-bottom: 6px;
  }
  .resolve-row:last-child { margin-bottom: 0; }
  .resolve-label { color: var(--color-text-tertiary); }

  /* Outcome badge */
  .outcome-badge {
    display: none; text-align: center; margin-bottom: 16px;
  }
  .badge {
    display: inline-block; font-size: 11px; font-weight: 500;
    letter-spacing: 0.14em; text-transform: uppercase;
    padding: 5px 16px; border-radius: var(--border-radius-md);
  }
  .badge.success      { background: var(--ta-badge-success-bg); color: var(--ta-badge-success-text); }
  .badge.partial      { background: var(--ta-badge-partial-bg); color: var(--ta-badge-partial-text); }
  .badge.failure      { background: var(--ta-badge-failure-bg); color: var(--ta-badge-failure-text); }
  .badge.crit-success { background: var(--ta-badge-success-bg); color: var(--ta-badge-success-text); border: 1px solid var(--ta-badge-crit-success-border); }
  .badge.crit-failure { background: var(--ta-badge-failure-bg); color: var(--ta-badge-failure-text); border: 1px solid var(--ta-badge-crit-failure-border); }

  /* Continue stage */
  .continue-stage { display: none; text-align: center; }
  .continue-btn {
    font-family: var(--ta-font-body); font-size: 11px;
    letter-spacing: 0.1em; padding: 8px 20px;
    min-height: 44px; min-width: 44px; box-sizing: border-box;
    background: transparent; border: 0.5px solid var(--color-border-secondary);
    border-radius: var(--border-radius-md); color: var(--color-text-primary);
    cursor: pointer;
  }
  .continue-btn:hover { background: var(--color-background-secondary); }
  .fallback-text {
    font-size: 11px; color: var(--color-text-tertiary); margin-top: 8px; display: none;
  }
  .copy-btn {
    font-family: var(--ta-font-body); font-size: 10px; letter-spacing: 0.06em;
    padding: 4px 10px; min-height: 44px; min-width: 44px; box-sizing: border-box;
    background: transparent; border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-md); color: var(--color-text-tertiary);
    cursor: pointer; margin-left: 8px; vertical-align: middle;
  }
  .copy-btn:hover { border-color: var(--color-border-secondary); color: var(--color-text-secondary); }
</style>

<div class="roll-root">
  <!-- Stage 1: Declare -->
  <h2 class="roll-heading">Stealth Check</h2>
  <p class="roll-action">
    You press yourself against the cold bulkhead and edge past the open doorway,
    willing your boots to stay silent on the grated flooring.
  </p>
  <div class="attr-row">
    <span class="attr-name">DEX</span>
    <span class="attr-mod">Modifier: +1</span>
  </div>
  <button class="roll-btn" id="roll-btn">[ ROLL 1d20 ]</button>

  <!-- Stage 2: Animate + display -->
  <div class="die-display" id="die-display">
    <span class="die-value" id="die-value"></span>
  </div>

  <!-- Stage 3: Resolve -->
  <div class="resolve-block" id="resolve-block">
    <div class="resolve-row">
      <span class="resolve-label">Raw roll</span>
      <span id="raw-roll"></span>
    </div>
    <div class="resolve-row">
      <span class="resolve-label">Modifier</span>
      <span>+1 (DEX)</span>
    </div>
    <div class="resolve-row">
      <span class="resolve-label">Total</span>
      <span id="total-roll" style="font-weight:500"></span>
    </div>
    <div class="resolve-row">
      <span class="resolve-label">DC</span>
      <span>14</span>
    </div>
  </div>
  <div class="outcome-badge" id="outcome-badge">
    <span class="badge" id="badge-text"></span>
  </div>

  <!-- Stage 4: Continue -->
  <div class="continue-stage" id="continue-stage">
    <button class="continue-btn" id="continue-btn" data-prompt="">Continue</button>
    <p class="fallback-text" id="roll-fallback">
      If the button above does not work, copy this prompt and paste it into the chat:<br>
      <code id="roll-fallback-prompt"></code><button class="copy-btn" id="roll-copy-btn">Copy</button>
    </p>
  </div>
</div>

<script>
(function() {
  const MODIFIER = 1;
  const DC = 14;
  let rolled = false;

  document.getElementById('roll-btn').addEventListener('click', function() {
    if (rolled) return;
    rolled = true;
    this.disabled = true;

    const raw = Math.floor(Math.random() * 20) + 1;
    const total = raw + MODIFIER;

    /* Stage 2: Animate */
    const dieDisplay = document.getElementById('die-display');
    const dieValue = document.getElementById('die-value');
    dieDisplay.style.display = 'block';

    /* Spin through random numbers for 0.6s */
    let spinCount = 0;
    const spinInterval = setInterval(() => {
      dieValue.textContent = Math.floor(Math.random() * 20) + 1;
      spinCount++;
      if (spinCount >= 12) {
        clearInterval(spinInterval);
        dieValue.textContent = raw;
        dieValue.classList.add('spinning');

        /* Stage 3: Resolve — after brief pause */
        setTimeout(() => {
          document.getElementById('raw-roll').textContent = raw;
          document.getElementById('total-roll').textContent = total;
          document.getElementById('resolve-block').style.display = 'block';

          /* Determine outcome */
          let badgeClass, badgeText;
          if (raw === 20) {
            badgeClass = 'crit-success'; badgeText = 'Critical Success';
          } else if (raw === 1) {
            badgeClass = 'crit-failure'; badgeText = 'Critical Failure';
          } else if (total >= DC) {
            if (total - DC <= 1) {
              badgeClass = 'partial'; badgeText = 'Partial Success';
            } else {
              badgeClass = 'success'; badgeText = 'Success';
            }
          } else if (DC - total <= 3) {
            badgeClass = 'partial'; badgeText = 'Partial Success';
          } else {
            badgeClass = 'failure'; badgeText = 'Failure';
          }

          const badgeEl = document.getElementById('badge-text');
          badgeEl.className = 'badge ' + badgeClass;
          badgeEl.textContent = badgeText;
          document.getElementById('outcome-badge').style.display = 'block';

          /* Stage 4: Continue */
          const promptText = 'I rolled ' + raw + ' plus ' + MODIFIER + ' equals ' + total + ' against DC ' + DC + '. ' + badgeText + '. Continue.';
          const continueBtn = document.getElementById('continue-btn');
          continueBtn.dataset.prompt = promptText;

          const fallbackPrompt = document.getElementById('roll-fallback-prompt');
          fallbackPrompt.textContent = promptText;

          const revealDelay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 400;
          setTimeout(function() {
            document.getElementById('continue-stage').style.display = 'block';
          }, revealDelay);
        }, 300);
      }
    }, 50);
  });

  /* Continue button — sendPrompt with fallback */
  document.getElementById('continue-btn').addEventListener('click', function() {
    const prompt = this.dataset.prompt;
    if (typeof sendPrompt === 'function') {
      sendPrompt(prompt);
    } else {
      document.getElementById('roll-fallback').style.display = 'block';
    }
  });

  /* Copy button — fallback prompt */
  document.querySelectorAll('.copy-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const code = this.previousElementSibling;
      if (code && navigator.clipboard) {
        navigator.clipboard.writeText(code.textContent).then(() => {
          this.textContent = 'Copied!';
          setTimeout(() => { this.textContent = 'Copy'; }, 2000);
        });
      }
    });
  });
})();
</script>
```

---

### Example 4 — Shop/Merchant Widget

A merchant widget with buy/sell tabs, item grid, barter option, and leave button.
Demonstrates the shop interaction pattern with credit display, item type badges,
and tab switching via pure JS (no `sendPrompt` for tab toggle). All purchase,
barter, and leave buttons use `data-prompt` + `addEventListener`.

```html
<style>
  .shop-root { font-family: var(--ta-font-body); padding: 1rem 0 1.5rem; }

  /* Merchant header */
  .merchant-header {
    display: flex; justify-content: space-between; align-items: baseline;
    padding-bottom: 8px; margin-bottom: 4px;
    border-bottom: 0.5px solid var(--color-border-tertiary);
  }
  .merchant-name {
    font-family: var(--ta-font-heading); font-size: 16px; font-weight: 700;
    color: var(--color-text-primary); margin: 0;
  }
  .credits-display {
    font-size: 12px; font-weight: 500; letter-spacing: 0.06em;
    color: var(--ta-color-credits);
  }
  .merchant-flavour {
    font-size: 11px; color: var(--color-text-tertiary); margin: 4px 0 14px;
    line-height: 1.6;
  }

  /* Tab bar */
  .tab-bar {
    display: flex; gap: 0; margin-bottom: 14px;
    border-bottom: 0.5px solid var(--color-border-tertiary);
  }
  .tab-btn {
    font-family: var(--ta-font-body);
    font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
    padding: 8px 16px; background: transparent; border: none;
    border-bottom: 2px solid transparent;
    color: var(--color-text-tertiary); cursor: pointer;
    transition: color 0.12s, border-color 0.12s;
  }
  .tab-btn:hover { color: var(--color-text-secondary); }
  .tab-btn.active {
    color: var(--color-text-primary);
    border-bottom-color: var(--ta-color-tab-active);
  }
  .tab-panel { display: none; }
  .tab-panel.active { display: block; }

  /* Item grid */
  .item-grid { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
  .item-card {
    display: flex; align-items: center; justify-content: space-between;
    gap: 10px; padding: 10px 12px;
    border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-md);
    flex-wrap: wrap;
  }
  .item-info { flex: 1; min-width: 160px; }
  .item-name {
    font-size: 12px; font-weight: 500; color: var(--color-text-primary);
    margin: 0 0 2px;
  }
  .item-type-badge {
    display: inline-block; font-size: 10px; letter-spacing: 0.08em;
    text-transform: uppercase; padding: 2px 8px;
    border-radius: 999px; border: 0.5px solid var(--color-border-tertiary);
    color: var(--color-text-tertiary); margin-right: 6px;
  }
  .item-effect {
    font-size: 10px; color: var(--color-text-tertiary); margin: 4px 0 0;
    line-height: 1.5;
  }
  .item-price {
    font-size: 12px; font-weight: 500; color: var(--color-text-primary);
    white-space: nowrap; margin-right: 8px;
  }
  .item-actions { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }

  /* Button styles — action (buy/barter) and poi (inspect) */
  .btn-action {
    font-family: var(--ta-font-body);
    font-size: 10px; letter-spacing: 0.06em; padding: 6px 12px;
    min-height: 44px; min-width: 44px; box-sizing: border-box;
    background: var(--ta-color-accent-bg); border: 0.5px solid var(--ta-color-accent);
    border-radius: var(--border-radius-md); color: var(--color-text-primary);
    cursor: pointer; transition: background 0.12s;
  }
  .btn-action:hover { background: var(--ta-color-accent-bg-hover); }
  .btn-poi {
    font-family: var(--ta-font-body);
    font-size: 10px; letter-spacing: 0.06em; padding: 6px 12px;
    min-height: 44px; min-width: 44px; box-sizing: border-box;
    background: transparent; border: var(--ta-border-style-poi) var(--color-border-secondary);
    border-radius: var(--border-radius-md); color: var(--color-text-secondary);
    cursor: pointer; transition: background 0.12s;
  }
  .btn-poi:hover { background: var(--color-background-secondary); border-style: solid; }

  /* Footer actions row */
  .shop-footer {
    display: flex; justify-content: space-between; align-items: center;
    gap: 8px; flex-wrap: wrap; margin-top: 14px; padding-top: 10px;
    border-top: 0.5px solid var(--color-border-tertiary);
  }

  /* Sell tab — empty state */
  .sell-empty {
    font-size: 11px; color: var(--color-text-tertiary); padding: 16px 0;
    text-align: center;
  }

  /* Focus-visible for keyboard navigation */
  button:focus-visible {
    outline: 2px solid var(--ta-color-focus); outline-offset: 2px;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    * { transition-duration: 0.01ms !important; }
  }

  .fallback-text { font-size: 11px; color: var(--color-text-tertiary); margin-top: 8px; display: none; }
  .copy-btn {
    font-family: var(--ta-font-body); font-size: 10px; letter-spacing: 0.06em;
    padding: 4px 10px; min-height: 44px; min-width: 44px; box-sizing: border-box;
    background: transparent; border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-md); color: var(--color-text-tertiary);
    cursor: pointer; margin-left: 8px; vertical-align: middle;
  }
  .copy-btn:hover { border-color: var(--color-border-secondary); color: var(--color-text-secondary); }
</style>

<div class="shop-root">
  <!-- Merchant header -->
  <div class="merchant-header">
    <h2 class="merchant-name">Vex's Salvage Emporium</h2>
    <span class="credits-display">Credits: 340</span>
  </div>
  <p class="merchant-flavour">A cluttered stall wedged between two cargo bays, reeking of solder and engine grease.</p>

  <!-- Tab bar -->
  <div class="tab-bar">
    <button class="tab-btn active" id="tab-buy-btn" data-tab="buy">Buy</button>
    <button class="tab-btn" id="tab-sell-btn" data-tab="sell">Sell</button>
  </div>

  <!-- Buy tab -->
  <div class="tab-panel active" id="tab-buy">
    <div class="item-grid">
      <!-- Stim Pack -->
      <div class="item-card">
        <div class="item-info">
          <p class="item-name">Stim Pack</p>
          <span class="item-type-badge">Consumable</span>
          <p class="item-effect">Restores 2d6 HP</p>
        </div>
        <span class="item-price">25 cr</span>
        <div class="item-actions">
          <button class="btn-poi" data-prompt="I ask Vex about the Stim Pack.">Inspect</button>
          <button class="btn-action" data-prompt="I buy the Stim Pack for 25 credits.">Buy</button>
        </div>
      </div>
      <!-- Reinforced Vest -->
      <div class="item-card">
        <div class="item-info">
          <p class="item-name">Reinforced Vest</p>
          <span class="item-type-badge">Armour</span>
          <p class="item-effect">+2 Soak, Heavy</p>
        </div>
        <span class="item-price">120 cr</span>
        <div class="item-actions">
          <button class="btn-poi" data-prompt="I ask Vex about the Reinforced Vest.">Inspect</button>
          <button class="btn-action" data-prompt="I buy the Reinforced Vest for 120 credits.">Buy</button>
        </div>
      </div>
      <!-- Signal Jammer -->
      <div class="item-card">
        <div class="item-info">
          <p class="item-name">Signal Jammer</p>
          <span class="item-type-badge">Gear</span>
          <p class="item-effect">+2 to Stealth checks near electronics</p>
        </div>
        <span class="item-price">80 cr</span>
        <div class="item-actions">
          <button class="btn-poi" data-prompt="I ask Vex about the Signal Jammer.">Inspect</button>
          <button class="btn-action" data-prompt="I buy the Signal Jammer for 80 credits.">Buy</button>
        </div>
      </div>
      <!-- Plasma Cutter -->
      <div class="item-card">
        <div class="item-info">
          <p class="item-name">Plasma Cutter</p>
          <span class="item-type-badge">Weapon</span>
          <p class="item-effect">2d8 damage, Pierce 1</p>
        </div>
        <span class="item-price">200 cr</span>
        <div class="item-actions">
          <button class="btn-poi" data-prompt="I ask Vex about the Plasma Cutter.">Inspect</button>
          <button class="btn-action" data-prompt="I buy the Plasma Cutter for 200 credits.">Buy</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Sell tab -->
  <div class="tab-panel" id="tab-sell">
    <p class="sell-empty">Your inventory items would appear here with sell prices and SELL buttons.</p>
  </div>

  <!-- Footer: Barter + Leave -->
  <div class="shop-footer">
    <button class="btn-action" data-prompt="I attempt to barter with Vex. Attempt CHA check to haggle.">Barter</button>
    <button class="btn-action" data-prompt="I leave the shop.">Leave</button>
  </div>

  <!-- Fallback -->
  <p class="fallback-text" id="shop-fallback">
    If the buttons above do not work, copy one of these prompts and paste it into the chat:<br>
    <code id="shop-fallback-prompt"></code><button class="copy-btn" id="shop-copy-btn">Copy</button>
  </p>
</div>

<script>
(function() {
  /* Tab switching — pure JS, no sendPrompt */
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tabId = this.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
      this.classList.add('active');
      var targetPanel = document.getElementById('tab-' + tabId);
      if (targetPanel) { targetPanel.classList.add('active'); }
    });
  });

  /* sendPrompt with fallback — showFallback helper */
  function showFallback(promptText) {
    var fb = document.getElementById('shop-fallback');
    var fp = document.getElementById('shop-fallback-prompt');
    if (fb && fp) {
      fp.textContent = promptText;
      fb.style.display = 'block';
    }
  }

  document.querySelectorAll('[data-prompt]').forEach(function(btn) {
    /* Skip tab buttons — they use data-tab, not data-prompt for action */
    if (btn.classList.contains('tab-btn')) { return; }
    btn.addEventListener('click', function() {
      var prompt = this.dataset.prompt;
      if (typeof sendPrompt === 'function') {
        sendPrompt(prompt);
      } else {
        showFallback(prompt);
      }
    });
  });

  /* Copy button — fallback prompt */
  document.querySelectorAll('.copy-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var code = this.previousElementSibling;
      if (code && navigator.clipboard) {
        navigator.clipboard.writeText(code.textContent).then(function() {
          btn.textContent = 'Copied!';
          setTimeout(function() { btn.textContent = 'Copy'; }, 2000);
        });
      }
    });
  });
})();
</script>
```

---

### Example 5 — Social Encounter Widget

A social encounter widget with NPC header, disposition badge, conviction meter,
approach buttons, round indicator, and NPC reaction area. Demonstrates the
structured negotiation pattern with multiple approach options tied to attributes.
All approach buttons use `data-prompt` + `addEventListener`.

```html
<style>
  .social-root { font-family: var(--ta-font-body); padding: 1rem 0 1.5rem; }

  /* NPC header */
  .npc-header {
    display: flex; justify-content: space-between; align-items: baseline;
    padding-bottom: 8px; margin-bottom: 4px;
    border-bottom: 0.5px solid var(--color-border-tertiary);
  }
  .npc-name {
    font-family: var(--ta-font-heading); font-size: 16px; font-weight: 700;
    color: var(--color-text-primary); margin: 0;
  }
  .disposition-badge {
    display: inline-block; font-size: 10px; font-weight: 500;
    letter-spacing: 0.1em; text-transform: uppercase;
    padding: 3px 12px; border-radius: 999px;
  }
  .disposition-badge.suspicious {
    background: var(--ta-color-warning-bg); color: var(--ta-color-warning);
    border: 0.5px solid var(--ta-color-warning-border);
  }

  /* Stakes text */
  .stakes-text {
    font-size: 12px; line-height: 1.7; color: var(--color-text-secondary);
    margin: 8px 0 16px; padding: 10px 14px;
    border-radius: var(--border-radius-md);
    background: var(--color-background-secondary);
    border: 0.5px solid var(--color-border-tertiary);
  }
  .stakes-label {
    font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--color-text-tertiary); display: block; margin-bottom: 4px;
  }

  /* Conviction meter */
  .conviction-row {
    display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
  }
  .conviction-label {
    font-size: 10px; letter-spacing: 0.08em; color: var(--color-text-tertiary);
  }
  .conviction-pips { display: flex; gap: 6px; align-items: center; }
  .conviction-pip {
    width: 10px; height: 10px; border-radius: 50%;
    border: 0.5px solid var(--ta-color-conviction-border);
    background: transparent;
  }
  .conviction-pip.filled {
    background: var(--ta-color-conviction); border-color: var(--ta-color-conviction-border);
  }

  /* Round indicator */
  .round-indicator {
    font-size: 10px; letter-spacing: 0.08em; color: var(--color-text-tertiary);
    margin-bottom: 16px;
  }

  /* Approach buttons */
  .section-label {
    font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--color-text-tertiary); margin: 0 0 8px;
  }
  .approach-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .btn-action {
    font-family: var(--ta-font-body);
    font-size: 11px; letter-spacing: 0.06em; padding: 8px 14px;
    background: var(--ta-color-accent-bg); border: 0.5px solid var(--ta-color-accent);
    border-radius: var(--border-radius-md); color: var(--color-text-primary);
    cursor: pointer; transition: background 0.12s;
  }
  .btn-action:hover { background: var(--ta-color-accent-bg-hover); }
  .approach-stat {
    font-size: 10px; color: var(--color-text-tertiary); margin-left: 4px;
  }

  /* NPC reaction area */
  .npc-reaction {
    font-size: 12px; line-height: 1.7; color: var(--color-text-secondary);
    margin: 0 0 16px; padding: 12px 14px;
    border-radius: var(--border-radius-md);
    border: 0.5px solid var(--color-border-tertiary);
    background: var(--color-background-secondary);
    font-style: italic;
  }

  /* Focus-visible for keyboard navigation */
  button:focus-visible {
    outline: 2px solid var(--ta-color-focus); outline-offset: 2px;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    * { transition-duration: 0.01ms !important; }
  }

  .fallback-text { font-size: 11px; color: var(--color-text-tertiary); margin-top: 8px; display: none; }
  .copy-btn {
    font-family: var(--ta-font-body); font-size: 10px; letter-spacing: 0.06em;
    padding: 4px 10px; min-height: 44px; min-width: 44px; box-sizing: border-box;
    background: transparent; border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-md); color: var(--color-text-tertiary);
    cursor: pointer; margin-left: 8px; vertical-align: middle;
  }
  .copy-btn:hover { border-color: var(--color-border-secondary); color: var(--color-text-secondary); }
</style>

<div class="social-root">
  <!-- NPC header -->
  <div class="npc-header">
    <h2 class="npc-name">Captain Voss</h2>
    <span class="disposition-badge suspicious">Suspicious</span>
  </div>

  <!-- Stakes -->
  <div class="stakes-text">
    <span class="stakes-label">Stakes</span>
    Convince Captain Voss to let you dock without inspection.
  </div>

  <!-- Conviction meter -->
  <div class="conviction-row">
    <span class="conviction-label">Conviction</span>
    <div class="conviction-pips">
      <span class="conviction-pip filled"></span>
      <span class="conviction-pip"></span>
      <span class="conviction-pip"></span>
      <span class="conviction-pip"></span>
    </div>
  </div>

  <!-- Round indicator -->
  <p class="round-indicator">Round 2 of 5</p>

  <!-- NPC reaction -->
  <p class="npc-reaction">
    Voss narrows her eyes, arms folded across a battered flight harness. "Everybody
    has a reason to skip inspection. Most of those reasons interest my security team
    a great deal." She tilts her head, waiting.
  </p>

  <!-- Approach buttons -->
  <p class="section-label">Choose your approach</p>
  <div class="approach-row">
    <button class="btn-action" data-prompt="I attempt Persuasion. I appeal to reason and explain why an inspection is unnecessary.">Persuasion <span class="approach-stat">(CHA)</span></button>
    <button class="btn-action" data-prompt="I attempt Deception. I fabricate a convincing cover story to avoid the inspection.">Deception <span class="approach-stat">(CHA)</span></button>
    <button class="btn-action" data-prompt="I attempt Intimidation. I make it clear that delaying us would be unwise.">Intimidation <span class="approach-stat">(STR)</span></button>
    <button class="btn-action" data-prompt="I attempt Insight. I read Captain Voss to find leverage or understand her true concern.">Insight <span class="approach-stat">(INT)</span></button>
    <button class="btn-action" data-prompt="I attempt Performance. I put on a show to distract and charm Captain Voss.">Performance <span class="approach-stat">(CHA)</span></button>
  </div>

  <!-- Fallback -->
  <p class="fallback-text" id="social-fallback">
    If the buttons above do not work, copy one of these prompts and paste it into the chat:<br>
    <code id="social-fallback-prompt"></code><button class="copy-btn" id="social-copy-btn">Copy</button>
  </p>
</div>

<script>
(function() {
  /* sendPrompt with fallback — showFallback helper */
  function showFallback(promptText) {
    var fb = document.getElementById('social-fallback');
    var fp = document.getElementById('social-fallback-prompt');
    if (fb && fp) {
      fp.textContent = promptText;
      fb.style.display = 'block';
    }
  }

  document.querySelectorAll('[data-prompt]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var prompt = this.dataset.prompt;
      if (typeof sendPrompt === 'function') {
        sendPrompt(prompt);
      } else {
        showFallback(prompt);
      }
    });
  });

  /* Copy button — fallback prompt */
  document.querySelectorAll('.copy-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var code = this.previousElementSibling;
      if (code && navigator.clipboard) {
        navigator.clipboard.writeText(code.textContent).then(function() {
          btn.textContent = 'Copied!';
          setTimeout(function() { btn.textContent = 'Copy'; }, 2000);
        });
      }
    });
  });
})();
</script>
```
