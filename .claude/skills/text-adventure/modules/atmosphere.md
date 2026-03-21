# Atmosphere — Visual Immersion Engine
> Module for text-adventure orchestrator. Optional — selected at game start in Settings widget.

Adds dynamic visual effects to scene widgets: environmental particles, screen shake,
colour flash, cinematic letterboxing, dynamic lighting, UI degradation, day/night
cycle, contextual status bar, toast notifications, handwritten notes, and redacted text.

All effects are CSS-only or inline JS. No external dependencies. Effects adapt to the
active visual style's CSS custom properties.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: all visual style
files, core-systems (time system), story-architect (tension tracking).

---

## CRITICAL — Atmosphere Rules

1. **Effects enhance, never obstruct.** Particles, lighting, and transitions must not
   block text, buttons, or interactive elements.
2. **Respect `prefers-reduced-motion`.** All animations must be disabled when the user
   has reduced motion enabled. Use `@media (prefers-reduced-motion: reduce)` to disable.
3. **Effects are ephemeral.** Nothing from this module is saved or persisted. Effects
   are regenerated fresh each widget render based on scene context.
4. **Theme-aware.** All colours and intensities derive from the active style's
   `--ta-` contract variables. Never hardcode colours.

---

## Environmental Particles

CSS-only particle systems using `@keyframes` and pseudo-elements. Each scene can
activate one particle type based on the environment.

### Particle Types

| Type | CSS Class | Context |
|------|-----------|---------|
| Dust motes | `.atmo-dust` | Indoor, abandoned, ancient |
| Rain | `.atmo-rain` | Exterior, storm, wet |
| Snow | `.atmo-snow` | Cold, mountain, arctic |
| Sparks | `.atmo-sparks` | Damaged systems, fire, electrical |
| Smoke | `.atmo-smoke` | Fire, exhaust, fog |
| Stars | `.atmo-stars` | Space exterior, observation deck |
| Embers | `.atmo-embers` | Campfire, forge, volcanic |

### Implementation Pattern

```css
.atmo-dust {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.atmo-dust::before,
.atmo-dust::after {
  content: '';
  position: absolute;
  width: 100%; height: 100%;
  background-image:
    radial-gradient(1px 1px at 20% 30%, var(--ta-color-accent, rgba(255,255,255,0.3)) 0%, transparent 100%),
    radial-gradient(1px 1px at 60% 70%, var(--ta-color-accent, rgba(255,255,255,0.2)) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 40% 50%, var(--ta-color-accent, rgba(255,255,255,0.25)) 0%, transparent 100%);
  animation: atmo-drift 20s linear infinite;
}
.atmo-dust::after { animation-delay: -10s; opacity: 0.5; }

@keyframes atmo-drift {
  0% { transform: translateY(0) translateX(0); }
  100% { transform: translateY(-30px) translateX(15px); }
}

@media (prefers-reduced-motion: reduce) {
  .atmo-dust::before, .atmo-dust::after { animation: none; }
}
```

```css
.atmo-rain {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.atmo-rain::before,
.atmo-rain::after {
  content: '';
  position: absolute;
  width: 100%; height: 100%;
  background-image:
    linear-gradient(175deg, var(--ta-color-accent, rgba(180,200,255,0.15)) 0%, transparent 40%),
    repeating-linear-gradient(175deg,
      transparent 0px, transparent 3px,
      var(--ta-color-accent, rgba(180,200,255,0.08)) 3px, var(--ta-color-accent, rgba(180,200,255,0.08)) 4px);
  animation: atmo-rain-fall 0.6s linear infinite;
}
.atmo-rain::after { animation-delay: -0.3s; opacity: 0.6; }

@keyframes atmo-rain-fall {
  0% { transform: translateY(-10px); }
  100% { transform: translateY(10px); }
}

@media (prefers-reduced-motion: reduce) {
  .atmo-rain::before, .atmo-rain::after { animation: none; }
}
```

```css
.atmo-snow {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.atmo-snow::before,
.atmo-snow::after {
  content: '';
  position: absolute;
  width: 100%; height: 100%;
  background-image:
    radial-gradient(2px 2px at 10% 20%, var(--ta-color-accent, rgba(255,255,255,0.6)) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 50% 80%, var(--ta-color-accent, rgba(255,255,255,0.4)) 0%, transparent 100%),
    radial-gradient(2px 2px at 75% 40%, var(--ta-color-accent, rgba(255,255,255,0.5)) 0%, transparent 100%),
    radial-gradient(1px 1px at 30% 60%, var(--ta-color-accent, rgba(255,255,255,0.3)) 0%, transparent 100%);
  animation: atmo-snow-fall 8s linear infinite;
}
.atmo-snow::after { animation-delay: -4s; opacity: 0.7; }

@keyframes atmo-snow-fall {
  0% { transform: translateY(-20px) translateX(0); }
  100% { transform: translateY(20px) translateX(8px); }
}

@media (prefers-reduced-motion: reduce) {
  .atmo-snow::before, .atmo-snow::after { animation: none; }
}
```

```css
.atmo-sparks {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.atmo-sparks::before,
.atmo-sparks::after {
  content: '';
  position: absolute;
  width: 100%; height: 100%;
  background-image:
    radial-gradient(1px 1px at 25% 80%, var(--ta-color-warning, rgba(255,200,50,0.8)) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 60% 75%, var(--ta-color-warning, rgba(255,180,30,0.6)) 0%, transparent 100%),
    radial-gradient(1px 1px at 80% 85%, var(--ta-color-warning, rgba(255,220,80,0.7)) 0%, transparent 100%);
  animation: atmo-spark-rise 1.2s ease-out infinite;
}
.atmo-sparks::after { animation-delay: -0.6s; opacity: 0.8; }

@keyframes atmo-spark-rise {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-40px) scale(0.5); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .atmo-sparks::before, .atmo-sparks::after { animation: none; }
}
```

```css
.atmo-smoke {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.atmo-smoke::before,
.atmo-smoke::after {
  content: '';
  position: absolute;
  width: 100%; height: 100%;
  background-image:
    radial-gradient(40px 30px at 30% 90%, var(--ta-color-bg-secondary, rgba(120,120,120,0.12)) 0%, transparent 100%),
    radial-gradient(50px 40px at 70% 85%, var(--ta-color-bg-secondary, rgba(100,100,100,0.10)) 0%, transparent 100%);
  animation: atmo-smoke-rise 6s ease-out infinite;
}
.atmo-smoke::after { animation-delay: -3s; opacity: 0.7; }

@keyframes atmo-smoke-rise {
  0% { transform: translateY(0) scaleX(1); opacity: 0.8; }
  100% { transform: translateY(-60px) scaleX(1.3); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .atmo-smoke::before, .atmo-smoke::after { animation: none; }
}
```

```css
.atmo-stars {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.atmo-stars::before,
.atmo-stars::after {
  content: '';
  position: absolute;
  width: 100%; height: 100%;
  background-image:
    radial-gradient(1px 1px at 15% 25%, var(--ta-color-accent, rgba(255,255,255,0.9)) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 55% 15%, var(--ta-color-accent, rgba(255,255,255,0.7)) 0%, transparent 100%),
    radial-gradient(1px 1px at 85% 35%, var(--ta-color-accent, rgba(255,255,255,0.8)) 0%, transparent 100%),
    radial-gradient(2px 2px at 35% 70%, var(--ta-color-accent, rgba(255,255,255,0.6)) 0%, transparent 100%),
    radial-gradient(1px 1px at 70% 60%, var(--ta-color-accent, rgba(255,255,255,0.75)) 0%, transparent 100%);
  animation: atmo-star-twinkle 4s ease-in-out infinite alternate;
}
.atmo-stars::after { animation-delay: -2s; opacity: 0.6; }

@keyframes atmo-star-twinkle {
  0% { opacity: 0.6; }
  100% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .atmo-stars::before, .atmo-stars::after { animation: none; opacity: 0.8; }
}
```

```css
.atmo-embers {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.atmo-embers::before,
.atmo-embers::after {
  content: '';
  position: absolute;
  width: 100%; height: 100%;
  background-image:
    radial-gradient(2px 2px at 20% 85%, var(--ta-color-danger, rgba(255,100,30,0.8)) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 55% 80%, var(--ta-color-warning, rgba(255,140,20,0.7)) 0%, transparent 100%),
    radial-gradient(2px 2px at 80% 88%, var(--ta-color-danger, rgba(255,80,20,0.6)) 0%, transparent 100%);
  animation: atmo-ember-rise 3s ease-out infinite;
}
.atmo-embers::after { animation-delay: -1.5s; opacity: 0.8; }

@keyframes atmo-ember-rise {
  0% { transform: translateY(0) translateX(0); opacity: 1; }
  60% { opacity: 0.8; }
  100% { transform: translateY(-50px) translateX(12px); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .atmo-embers::before, .atmo-embers::after { animation: none; }
}
```

The GM selects the appropriate particle class based on the scene's location and
conditions. Only one particle type per scene — never stack multiple.

---

## Screen Shake

CSS transform animation triggered on damage, explosions, or impact events.

```css
@keyframes atmo-shake {
  0%, 100% { transform: translate(0); }
  10% { transform: translate(-4px, 2px); }
  20% { transform: translate(3px, -3px); }
  30% { transform: translate(-2px, 4px); }
  40% { transform: translate(4px, -1px); }
  50% { transform: translate(-3px, 3px); }
  60% { transform: translate(2px, -4px); }
  70% { transform: translate(-4px, 1px); }
  80% { transform: translate(3px, 2px); }
  90% { transform: translate(-1px, -3px); }
}

.atmo-shake {
  animation: atmo-shake 0.4s ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  .atmo-shake { animation: none; }
}
```

Apply `.atmo-shake` to the root widget element on damage or impact. Remove the class
after the animation completes (0.4s).

```js
function triggerShake(rootEl) {
  rootEl.classList.add('atmo-shake');
  rootEl.addEventListener('animationend', () => {
    rootEl.classList.remove('atmo-shake');
  }, { once: true });
}
```

---

## Colour Flash

Brief full-widget colour overlay for significant events.

| Event | Flash Colour | Duration |
|-------|-------------|----------|
| Critical hit (player) | `var(--ta-color-success)` at 20% opacity | 0.3s |
| Critical hit (enemy) | `var(--ta-color-danger)` at 25% opacity | 0.3s |
| Level up | `var(--ta-color-xp)` at 15% opacity | 0.5s |
| Lore discovery | `var(--ta-color-conviction)` at 15% opacity | 0.4s |
| Damage taken | `var(--ta-color-danger)` at 30% opacity | 0.2s |

```css
.atmo-flash {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  z-index: 10;
  opacity: 0;
  animation: atmo-flash-in 0.3s ease-out forwards;
}
@keyframes atmo-flash-in {
  0% { opacity: 0.3; }
  100% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .atmo-flash { animation: none; opacity: 0; }
}
```

Inject a `.atmo-flash` div into the root widget with an inline `background` set to the
appropriate colour variable. Remove it once the animation ends:

```js
function triggerFlash(rootEl, cssColorVar, durationMs = 300) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const flash = document.createElement('div');
  flash.className = 'atmo-flash';
  flash.style.background = `var(${cssColorVar})`;
  flash.style.animationDuration = `${durationMs}ms`;
  rootEl.appendChild(flash);
  flash.addEventListener('animationend', () => flash.remove(), { once: true });
}
```

---

## Cinematic Letterboxing

Black bars slide in from top and bottom during climactic scenes, creating a widescreen
cinematic feel. Triggered by story-architect tension level 8+.

```css
.atmo-letterbox::before,
.atmo-letterbox::after {
  content: '';
  position: fixed;
  left: 0; right: 0;
  height: 0;
  background: #000;
  z-index: 20;
  transition: height 0.8s ease-in-out;
}
.atmo-letterbox::before { top: 0; }
.atmo-letterbox::after { bottom: 0; }
.atmo-letterbox.active::before,
.atmo-letterbox.active::after {
  height: 40px;
}

@media (prefers-reduced-motion: reduce) {
  .atmo-letterbox::before,
  .atmo-letterbox::after { transition: none; }
}
```

Toggle letterboxing by adding/removing `.active` from the root widget element when
tension crosses the threshold. The bars slide out automatically when `.active` is removed.

---

## Dynamic Lighting

CSS filter and gradient shifts based on scene atmosphere. Applied to the root widget.

| Atmosphere | CSS Filter | Gradient Overlay |
|-----------|-----------|-----------------|
| Safe / warm | `brightness(1.05) saturate(1.1)` | Warm amber radial at 5% opacity |
| Tense / suspicious | `brightness(0.95) saturate(0.9)` | Cool blue radial at 8% opacity |
| Danger / combat | `brightness(0.9) saturate(1.2) contrast(1.05)` | Red-tinted radial at 10% opacity |
| Horror / dread | `brightness(0.8) saturate(0.6) contrast(1.1)` | Deep purple radial at 12% opacity |
| Discovery / awe | `brightness(1.1) saturate(1.15)` | Gold radial at 8% opacity |
| Neutral | None | None |

```css
.atmo-light-safe    { filter: brightness(1.05) saturate(1.1); }
.atmo-light-tense   { filter: brightness(0.95) saturate(0.9); }
.atmo-light-danger  { filter: brightness(0.9) saturate(1.2) contrast(1.05); }
.atmo-light-horror  { filter: brightness(0.8) saturate(0.6) contrast(1.1); }
.atmo-light-awe     { filter: brightness(1.1) saturate(1.15); }

/* Gradient overlays via a sibling ::after on the root */
.atmo-light-safe::after {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(ellipse at 50% 100%, var(--ta-color-warning, rgba(255,180,80,0.05)) 0%, transparent 70%);
  pointer-events: none;
  z-index: 1;
}
.atmo-light-tense::after {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(ellipse at 50% 0%, var(--ta-color-info, rgba(80,120,200,0.08)) 0%, transparent 70%);
  pointer-events: none;
  z-index: 1;
}
.atmo-light-danger::after {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(ellipse at 50% 50%, var(--ta-color-danger, rgba(200,40,40,0.10)) 0%, transparent 70%);
  pointer-events: none;
  z-index: 1;
}
.atmo-light-horror::after {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(ellipse at 50% 50%, var(--ta-color-conviction, rgba(80,0,120,0.12)) 0%, transparent 70%);
  pointer-events: none;
  z-index: 1;
}
.atmo-light-awe::after {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(ellipse at 50% 30%, var(--ta-color-xp, rgba(200,160,30,0.08)) 0%, transparent 70%);
  pointer-events: none;
  z-index: 1;
}
```

The GM sets the atmosphere based on the scene's narrative tone. Only one
`.atmo-light-*` class at a time — replace, never stack.

---

## UI Degradation

The widget interface itself reflects narrative stakes. As tension rises or the
environment deteriorates, the UI shows visual wear.

### Degradation Levels

| Level | Trigger | Visual Effect |
|-------|---------|---------------|
| 0 — Clean | Default state | Standard theme styling |
| 1 — Stressed | Tension 5–6, minor damage | Subtle border roughening, slight colour desaturation |
| 2 — Damaged | Tension 7–8, significant damage | Border flicker (CSS animation), text shadow noise, colour shift toward danger palette |
| 3 — Critical | Tension 9–10, near death, horror climax | Heavy border distortion, background static noise, font weight shifts, intermittent "glitch" frames |

```css
.atmo-degrade-1 {
  filter: saturate(0.9);
}
.atmo-degrade-1 .panel-border {
  border-style: dashed;
}

.atmo-degrade-2 {
  filter: saturate(0.75) brightness(0.95);
  animation: atmo-flicker 3s infinite;
}
@keyframes atmo-flicker {
  0%, 95%, 100% { opacity: 1; }
  96% { opacity: 0.92; }
  97% { opacity: 0.98; }
}

.atmo-degrade-3 {
  filter: saturate(0.5) brightness(0.85) contrast(1.15);
  animation: atmo-glitch 2s infinite;
}
@keyframes atmo-glitch {
  0%, 90%, 100% { transform: translate(0); filter: saturate(0.5) brightness(0.85); }
  91% { transform: translate(-2px, 1px); filter: saturate(0.3) brightness(0.7) hue-rotate(10deg); }
  93% { transform: translate(1px, -1px); filter: saturate(0.5) brightness(0.85); }
  95% { transform: translate(-1px, 0); filter: saturate(0.4) brightness(0.75) hue-rotate(-5deg); }
}

@media (prefers-reduced-motion: reduce) {
  .atmo-degrade-2, .atmo-degrade-3 { animation: none; }
}
```

Apply only one degradation level at a time. Replace the class as tension escalates —
never stack `.atmo-degrade-1` and `.atmo-degrade-2` simultaneously.

---

## Day/Night Cycle

The widget's ambient lighting shifts based on the in-game time period (from
core-systems time tracker).

| Time Period | Background Modifier | Text Modifier |
|-------------|-------------------|---------------|
| Dawn | Warm peach wash at 5% | Slightly warm text tint |
| Morning | Bright, neutral | Standard |
| Afternoon | Warm golden at 3% | Standard |
| Evening | Amber/orange at 8% | Slightly warm |
| Night | Deep blue wash at 12% | Cooler, slightly dimmed |
| Midnight | Near-black overlay at 15% | Dimmed, high contrast |

```css
/* Time classes use ::before, lighting classes use ::after — no conflict */
.atmo-time-dawn::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(180deg, rgba(255,180,140,0.05) 0%, transparent 60%);
  pointer-events: none; z-index: 1;
}
.atmo-time-morning { /* No overlay — baseline bright state */ }
.atmo-time-afternoon::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(180deg, rgba(255,200,80,0.03) 0%, transparent 50%);
  pointer-events: none; z-index: 1;
}
.atmo-time-evening::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(180deg, rgba(200,120,30,0.08) 0%, transparent 70%);
  pointer-events: none; z-index: 1;
}
.atmo-time-night::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(180deg, rgba(20,40,100,0.12) 0%, transparent 80%);
  pointer-events: none; z-index: 1;
}
.atmo-time-midnight {
  filter: brightness(0.92);
}
.atmo-time-midnight::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,10,0.15);
  pointer-events: none; z-index: 1;
}
```

Applied via a `.atmo-time-{period}` class on the root widget. Only one time class
at a time. The GM updates this class when core-systems reports a time period change.

Valid period names: `dawn`, `morning`, `afternoon`, `evening`, `night`, `midnight`.

---

## Contextual Status Bar

The scene widget's status bar (HP, location, time) shifts border colour based on
the current danger level.

| Danger Level | Border Colour | Source |
|-------------|--------------|--------|
| Safe | `var(--ta-color-success)` at 30% opacity | No active threats |
| Caution | `var(--ta-color-warning)` at 40% opacity | Suspicious NPC, environmental hazard |
| Danger | `var(--ta-color-danger)` at 50% opacity | Active combat, immediate threat |
| Critical | `var(--ta-color-danger)` pulsing | HP below 25%, overwhelmed |

```css
.atmo-status-safe    .status-bar { border-color: color-mix(in srgb, var(--ta-color-success) 30%, transparent); }
.atmo-status-caution .status-bar { border-color: color-mix(in srgb, var(--ta-color-warning) 40%, transparent); }
.atmo-status-danger  .status-bar { border-color: color-mix(in srgb, var(--ta-color-danger)  50%, transparent); }
.atmo-status-critical .status-bar {
  border-color: var(--ta-color-danger);
  animation: atmo-status-pulse 1.2s ease-in-out infinite;
}
@keyframes atmo-status-pulse {
  0%, 100% { border-color: var(--ta-color-danger); }
  50% { border-color: color-mix(in srgb, var(--ta-color-danger) 40%, transparent); }
}

@media (prefers-reduced-motion: reduce) {
  .atmo-status-critical .status-bar { animation: none; }
}
```

Apply one `.atmo-status-*` class to the root widget element. Replace as the
danger state changes.

---

## Toast Notifications

Brief slide-in messages for passive events that don't warrant a full scene widget
update. Appear at the top of the widget, auto-dismiss after 3 seconds.

```css
.atmo-toast {
  position: absolute;
  top: -40px; left: 50%;
  transform: translateX(-50%);
  padding: 6px 16px;
  font-family: var(--ta-font-body);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ta-color-accent);
  border: 0.5px solid var(--ta-color-accent-bg);
  border-radius: 4px;
  background: var(--ta-color-accent-bg);
  opacity: 0;
  transition: top 0.3s ease-out, opacity 0.3s;
  z-index: 15;
  pointer-events: none;
  white-space: nowrap;
  max-width: 80%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.atmo-toast.visible {
  top: 8px;
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .atmo-toast { transition: none; }
  .atmo-toast.visible { top: 8px; opacity: 1; }
}
```

```js
function showToast(rootEl, message, durationMs = 3000) {
  const toast = document.createElement('div');
  toast.className = 'atmo-toast';
  toast.textContent = message;
  rootEl.appendChild(toast);
  // Force reflow before adding .visible so the transition fires
  toast.getBoundingClientRect();
  toast.classList.add('visible');
  setTimeout(() => {
    toast.classList.remove('visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, durationMs);
}
```

Examples: "Your reputation with the Dock Workers has improved.",
"Codex updated: Meridian Shipping.", "Ship time: 14:00 — shift change."

---

## Handwritten Notes

For in-world documents — letters, journal entries, intercepted notes — use a
handwriting-style font loaded from Google Fonts CDN.

```css
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&display=swap');

.atmo-handwritten {
  font-family: 'Caveat', cursive;
  font-size: 18px;
  line-height: 1.6;
  color: var(--ta-color-accent);
  transform: rotate(-0.5deg);
  padding: 16px 20px;
  border-left: 2px solid var(--ta-color-accent-bg);
  background: var(--ta-color-accent-bg);
  border-radius: 2px;
}
```

The `@import` must appear at the top of the widget's `<style>` block, before all other
rules. The GM wraps in-world document text in a `<div class="atmo-handwritten">` block.
The font loads from CDN — the only permitted external dependency in this module.

---

## Redacted Text

For classified documents, corrupted data, or information the player hasn't yet
uncovered. Black bars over text with optional hover-to-reveal.

```css
.atmo-redacted {
  background: currentColor;
  color: transparent;
  padding: 0 4px;
  border-radius: 2px;
  cursor: default;
  transition: background 0.3s, color 0.3s;
  user-select: none;
}
.atmo-redacted.revealable {
  cursor: pointer;
}
.atmo-redacted.revealable:hover {
  background: var(--ta-color-danger-bg);
  color: var(--ta-color-danger);
}
.atmo-redacted.revealed {
  background: var(--ta-color-danger-bg);
  color: var(--ta-color-danger);
}

@media (prefers-reduced-motion: reduce) {
  .atmo-redacted { transition: none; }
}
```

```js
// Wire up revealable redactions — call once per widget render
document.querySelectorAll('.atmo-redacted.revealable').forEach(el => {
  el.addEventListener('click', () => {
    el.classList.add('revealed');
    el.classList.remove('revealable');
  }, { once: true });
});
```

The GM uses `.atmo-redacted` for information the player cannot access and
`.atmo-redacted.revealable` for information that can be uncovered through
interaction. Once clicked, `.revealed` is added and the hover behaviour is removed.

---

## GM Integration

The GM determines which atmosphere effects to apply based on:

1. **Scene location** → particle type (rain for exterior, dust for abandoned interior)
2. **Story-architect tension** → degradation level, letterboxing (8+ triggers letterboxing)
3. **Core-systems time** → day/night cycle class
4. **Combat/danger state** → status bar colour, screen shake on damage
5. **Narrative tone** → dynamic lighting filter

Apply effects as CSS classes on the root widget element:

```html
<div class="root atmo-dust atmo-time-night atmo-degrade-1 atmo-status-danger atmo-light-danger atmo-letterbox">
  <!-- scene content -->
</div>
```

### Stacking Rules

| Category | Rule |
|----------|------|
| Particles | One type only — `.atmo-dust`, `.atmo-rain`, etc. |
| Degradation | One level only — `.atmo-degrade-1`, `.atmo-degrade-2`, or `.atmo-degrade-3` |
| Lighting | One tone only — `.atmo-light-safe`, `.atmo-light-tense`, etc. |
| Time | One period only — `.atmo-time-dawn`, `.atmo-time-night`, etc. |
| Status | One level only — `.atmo-status-safe`, `.atmo-status-danger`, etc. |
| Letterbox | Add `.active` to show bars; remove to hide |
| Toast / Flash / Shake | Injected and removed dynamically — never left on the element |

Particles, time, degradation, lighting, and status classes may all be present
simultaneously on the root element — they operate on different CSS properties and
do not conflict.
