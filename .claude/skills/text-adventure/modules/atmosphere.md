# Atmosphere — Visual Immersion Engine
> Module for text-adventure orchestrator. Optional — selected at game start in Settings widget.

Adds dynamic visual effects to scene widgets: environmental particles, screen shake,
colour flash, cinematic letterboxing, dynamic lighting, UI degradation, day/night
cycle, contextual status bar, toast notifications, handwritten notes, and redacted text.

All effects are CSS-only with minimal inline JS helpers (provided by `scene.ts`).
No external dependencies. Effects adapt to the active visual style's CSS custom properties.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: all visual style
files, core-systems (time system), story-architect (tension tracking).

---

## § CLI Commands for This Module

| Action | Command | Tool |
|--------|---------|------|
| Render scene with atmosphere | `tag render scene --style <style>` | Run via Bash tool |

Atmosphere effects (particles, screen shake, colour flash, letterbox, dynamic lighting,
UI degradation, day/night cycle, toast notifications, handwritten notes, redacted text)
are applied automatically by `tag render scene` based on scene context. The CSS lives in
`styles/style-reference.md` § Atmosphere Effects CSS and is extracted by the CLI at render time.
The JS helper functions (`window.tag.triggerShake`, `window.tag.triggerFlash`, `window.tag.showToast`, redaction wiring) are
built into `scene.ts` and included automatically in every scene widget.

---

## CRITICAL — Atmosphere Rules

1. **Effects enhance, never obstruct.** Particles, lighting, and transitions must not
   block text, buttons, or interactive elements.
2. **Respect `prefers-reduced-motion`.** All animations are disabled when the user
   has reduced motion enabled. The CSS uses `@media (prefers-reduced-motion: reduce)`.
3. **Effects are ephemeral.** Nothing from this module is saved or persisted. Effects
   are regenerated fresh each widget render based on scene context.
4. **Theme-aware.** All colours and intensities derive from the active style's
   `--ta-` contract variables. Never hardcode colours.

---

## Environmental Particles

CSS-only particle systems using `@keyframes` and pseudo-elements. Each scene can
activate one particle type based on the environment. When `tag render scene` runs,
it applies the appropriate particle class to the root widget element automatically.

### Particle Types

| Type | CSS Class | Trigger Context |
|------|-----------|-----------------|
| Dust motes | `.atmo-dust` | Indoor, abandoned, ancient locations |
| Rain | `.atmo-rain` | Exterior during storm, wet environments |
| Snow | `.atmo-snow` | Cold, mountain, arctic locations |
| Sparks | `.atmo-sparks` | Damaged systems, fire, electrical hazards |
| Smoke | `.atmo-smoke` | Fire, exhaust, fog environments |
| Stars | `.atmo-stars` | Space exterior, observation deck |
| Embers | `.atmo-embers` | Campfire, forge, volcanic areas |

When the scene context includes fire or electrical damage, `tag render scene` applies the
`.atmo-sparks` particle effect automatically. When the location is an outdoor storm,
`.atmo-rain` is applied. The GM selects the appropriate particle based on location and
conditions. Only one particle type per scene — never stack multiple.

---

## Screen Shake

CSS transform animation triggered on damage, explosions, or impact events.
The scene widget applies `.atmo-shake` to the root element automatically when the
scene context includes damage or impact. The class is removed after the 0.4s animation
completes via the `window.tag.triggerShake()` helper built into `scene.ts`.

---

## Colour Flash

Brief full-widget colour overlay for significant events. The scene widget injects a
`.atmo-flash` div automatically via the `window.tag.triggerFlash()` helper in `scene.ts`.

| Event | Flash Colour | Duration |
|-------|-------------|----------|
| Critical hit (player) | `--ta-color-success` at 20% opacity | 0.3s |
| Critical hit (enemy) | `--ta-color-danger` at 25% opacity | 0.3s |
| Level up | `--ta-color-xp` at 15% opacity | 0.5s |
| Lore discovery | `--ta-color-conviction` at 15% opacity | 0.4s |
| Damage taken | `--ta-color-danger` at 30% opacity | 0.2s |

---

## Cinematic Letterboxing

Black bars slide in from top and bottom during climactic scenes, creating a widescreen
cinematic feel. The scene widget applies `.atmo-letterbox.active` to the root element
automatically when story-architect tension reaches level 8+. The bars slide out
automatically when tension drops below the threshold and `.active` is removed.

---

## Dynamic Lighting

CSS filter and gradient shifts based on scene atmosphere. The scene widget applies
the appropriate `.atmo-light-*` class to the root element automatically based on
the narrative tone.

| Atmosphere | Lighting Class | Visual Effect |
|-----------|---------------|---------------|
| Safe / warm | `.atmo-light-safe` | Brightened, saturated, warm amber overlay |
| Tense / suspicious | `.atmo-light-tense` | Dimmed, desaturated, cool blue overlay |
| Danger / combat | `.atmo-light-danger` | Dimmed, high-saturation, red overlay |
| Horror / dread | `.atmo-light-horror` | Dark, desaturated, deep purple overlay |
| Discovery / awe | `.atmo-light-awe` | Bright, saturated, gold overlay |
| Neutral | None | No filter or overlay applied |

Only one `.atmo-light-*` class at a time — replace, never stack.

---

## UI Degradation

The widget interface itself reflects narrative stakes. As tension rises or the
environment deteriorates, `tag render scene` applies the appropriate degradation
class automatically.

### Degradation Levels

| Level | Trigger | CSS Class | Visual Effect |
|-------|---------|-----------|---------------|
| 0 — Clean | Default state | None | Standard theme styling |
| 1 — Stressed | Tension 5–6, minor damage | `.atmo-degrade-1` | Subtle desaturation, dashed borders |
| 2 — Damaged | Tension 7–8, significant damage | `.atmo-degrade-2` | Flicker animation, further desaturation |
| 3 — Critical | Tension 9–10, near death, horror climax | `.atmo-degrade-3` | Glitch animation, heavy desaturation, hue shifts |

Apply only one degradation level at a time. Replace the class as tension escalates —
never stack `.atmo-degrade-1` and `.atmo-degrade-2` simultaneously.

---

## Day/Night Cycle

The widget's ambient lighting shifts based on the in-game time period (from
core-systems time tracker). The scene widget applies the appropriate `.atmo-time-*`
class automatically when core-systems reports a time period change.

| Time Period | Class | Visual Effect |
|-------------|-------|---------------|
| Dawn | `.atmo-time-dawn` | Warm peach wash at 5% |
| Morning | `.atmo-time-morning` | Bright, neutral (no overlay) |
| Afternoon | `.atmo-time-afternoon` | Warm golden at 3% |
| Evening | `.atmo-time-evening` | Amber/orange at 8% |
| Night | `.atmo-time-night` | Deep blue wash at 12% |
| Midnight | `.atmo-time-midnight` | Near-black overlay at 15%, dimmed brightness |

Only one time class at a time. Valid period names: `dawn`, `morning`, `afternoon`,
`evening`, `night`, `midnight`.

Time classes use `::before` pseudo-elements, while lighting classes use `::after` —
they do not conflict and can coexist on the same root element.

---

## Contextual Status Bar

The scene widget's status bar (HP, location, time) shifts border colour based on
the current danger level. The scene widget applies the appropriate `.atmo-status-*`
class automatically.

| Danger Level | Class | Border Colour |
|-------------|-------|---------------|
| Safe | `.atmo-status-safe` | `--ta-color-success` at 30% opacity |
| Caution | `.atmo-status-caution` | `--ta-color-warning` at 40% opacity |
| Danger | `.atmo-status-danger` | `--ta-color-danger` at 50% opacity |
| Critical | `.atmo-status-critical` | `--ta-color-danger` pulsing animation |

---

## Toast Notifications

Brief slide-in messages for passive events that don't warrant a full scene widget
update. Appear at the top of the widget, auto-dismiss after 3 seconds. The scene
widget provides the `window.tag.showToast()` helper function (built into `scene.ts`) which
handles element creation, animation, and cleanup automatically.

Examples: "Your reputation with the Dock Workers has improved.",
"Codex updated: Meridian Shipping.", "Ship time: 14:00 — shift change."

---

## Handwritten Notes

For in-world documents — letters, journal entries, intercepted notes — the scene
widget supports a `.atmo-handwritten` class that applies a handwriting-style font
(Caveat from Google Fonts CDN — the only permitted external dependency). The GM
wraps in-world document text in a `<div class="atmo-handwritten">` block.

The `@import` for the font is included in the CSS automatically by the CLI when
the handwritten note class is present.

---

## Redacted Text

For classified documents, corrupted data, or information the player hasn't yet
uncovered. The scene widget supports `.atmo-redacted` (permanent black bars) and
`.atmo-redacted.revealable` (click-to-reveal). The click handler that adds `.revealed`
and removes `.revealable` is wired up automatically by `scene.ts` on every render.

The GM uses `.atmo-redacted` for information the player cannot access and
`.atmo-redacted.revealable` for information that can be uncovered through
interaction.

---

## GM Integration

The GM determines which atmosphere effects to apply based on:

1. **Scene location** → particle type (rain for exterior, dust for abandoned interior)
2. **Story-architect tension** → degradation level, letterboxing (8+ triggers letterboxing)
3. **Core-systems time** → day/night cycle class
4. **Combat/danger state** → status bar colour, screen shake on damage
5. **Narrative tone** → dynamic lighting filter

All effects are applied as CSS classes on the root widget element by `tag render scene`.
The GM communicates the desired atmosphere via scene context data, and the CLI handles
class application automatically.

### Stacking Rules

| Category | Rule |
|----------|------|
| Particles | One type only — `.atmo-dust`, `.atmo-rain`, etc. |
| Degradation | One level only — `.atmo-degrade-1`, `.atmo-degrade-2`, or `.atmo-degrade-3` |
| Lighting | One tone only — `.atmo-light-safe`, `.atmo-light-tense`, etc. |
| Time | One period only — `.atmo-time-dawn`, `.atmo-time-night`, etc. |
| Status | One level only — `.atmo-status-safe`, `.atmo-status-danger`, etc. |
| Letterbox | Add `.active` to show bars; remove to hide |
| Toast / Flash / Shake | Injected and removed dynamically via JS helpers in `scene.ts` |

Particles, time, degradation, lighting, and status classes may all be present
simultaneously on the root element — they operate on different CSS properties and
do not conflict.
