---
name: text-adventure

description: Use this skill whenever the user wants to play, run, or build an interactive text adventure game. Triggers include "text adventure", "play a game", "run a campaign", "tabletop RPG", "D&D-style game", "interactive story", "dungeon crawl", "choose your own adventure", "space adventure", "sci-fi RPG", "interactive fiction", "story game", "MUD", "text-based game", or any request to begin a narrative game with player decisions, character stats, or dice-based outcomes. Also use when the user wants to continue a prior adventure session or set up a new scenario. This skill is the orchestrator — it contains the complete core game engine and loads expansion modules from the modules/ directory as needed. Do NOT use for purely creative writing tasks that require no player agency or mechanical resolution.
metadata:
  version: "1.2.3"
---

# Text Adventure Game — Core Engine

This skill runs the complete text adventure game experience using `visualize:show_widget`.
Expansion modules in `modules/` add optional depth. Additional implementation code (panel
CSS, scene skeleton, loading messages) lives in `styles/style-reference.md`.
Visual style definitions (colours, fonts, decorative CSS) live in `styles/` as
individual `.md` files — one per theme. This skill is designed to be used
alongside a narrative output style configured by the user in Claude Desktop
or claude.ai — see the project `README.md` for available output styles.

Two portable file formats support session persistence and content sharing:
`.save.md` files (via `modules/save-codex.md`) capture game state for later
resumption, and `.lore.md` files (via `modules/adventure-authoring.md`) package
authored adventures for distribution.

**Before rendering any widget, read `styles/style-reference.md` in full.** It
contains structural patterns and supplementary templates that this file references.
Also read the active visual style file to obtain CSS custom property values.

## Architecture

```
SKILL.md (orchestrator)
  Core game engine: session lifecycle, character creation, die rolls,
  scene rendering, panel system, combat, maps, XP/levelling, visual rules.

TIER 1 — MUST READ before rendering any widget
  You MUST read every file in this tier IN FULL before generating the
  first widget of any session. Skipping these produces broken widgets,
  missing mechanics, and visual style drift. This is not optional.

  modules/gm-checklist.md         Mandatory quality gates — read FIRST
  modules/prose-craft.md          Sentence-level prose quality — read EVERY TURN
  styles/style-reference.md       Structural patterns, CSS contract, worked examples
  styles/{active-style}.md        Active visual style CSS custom properties
  modules/die-rolls.md            Four-stage d20 resolution, 3D dice, DC tables
  modules/character-creation.md   Archetypes, stats, equipment, theme-adapted names
  modules/core-systems.md         Inventory, economy, factions, quests, time, XP
  modules/scenarios.md            Starter scenarios, theme adaptation, arc templates

TIER 2 — READ when scenario activates (before opening scene)
  Load based on scenario type and player settings. Read after Tier 1
  is complete, before the opening scene renders.

  modules/save-codex.md           Session persistence (always load)
  modules/bestiary.md             Adversary templates, encounter building (always load)
  modules/story-architect.md      Plotline tracking (recommended for >3 scenes)
  modules/ship-systems.md         When player commands a vessel (optional)
  modules/crew-manifest.md        When player has a crew (optional)
  modules/star-chart.md           When space travel between systems (optional)
  modules/geo-map.md              When on-world exploration (optional)
  modules/procedural-world-gen.md When procedural or hybrid mode (optional)
  modules/world-history.md        Recommended for all adventures (optional)
  modules/lore-codex.md           Lore discovery tracking, codex entry states (always load)
  modules/rpg-systems.md          Alternative rule systems — load if non-default rulebook selected at setup
  modules/ai-npc.md               NPC stats, dialogue, hidden contested rolls (always load)
  modules/atmosphere.md           Visual atmosphere: particles, lighting, UI degradation (optional)
  modules/audio.md                Procedural soundscapes via Web Audio API (optional)

TIER 3 — READ on demand when player triggers
  Do not pre-load. Read only when the player triggers the feature.

  modules/adventure-exporting.md  When player requests world export
  modules/adventure-authoring.md  When player uploads .lore.md
  modules/genre-mechanics.md      When genre overlay activated (magic, sanity, etc.)

styles/
  style-reference.md      Structural patterns: panel CSS, scene skeleton, die shapes,
                          loading messages, CSS custom property contract, worked examples.
  station.md              Default — serif narrative, semantic colours, numbered action cards
  terminal.md             CRT monospace, electric accents, scanline effects
  parchment.md            Warm serif, paper grain, earth tones, drop caps
  neon.md                 Saturated colours, glow effects, synthwave
  brutalist.md            System fonts, black/white/red, zero decoration
  art-deco.md             Gold/navy, geometric serif, engraved buttons
  ink-wash.md             Near-monochrome, generous whitespace, vermillion seal
  blueprint.md            Graph-paper grid, blue/white, technical drawing
  stained-glass.md        Jewel tones, leaded borders, radial luminance
  sveltekit.md            Light-mode first, Svelte orange accent, system fonts, component cards
  weathered.md            Rust/olive, asymmetric, distressed, jury-rigged
  holographic.md          Translucent panels, iridescent borders, glassmorphism
```

---

## Core Mandate

- **All output must live inside widgets.** Never write prose outside `visualize:show_widget`.
- **Never auto-resolve anything requiring a player decision.** Die rolls and choices wait for input.
- **Never advance the story without player input.** Every scene must end with a choice, a
  roll, or an action prompt. The GM never narrates what the player does next — the player
  decides, always. If there is nothing left to decide in a scene, present the next decision point.
- **Never editorially guide the player.** No "safe", "risky", or "recommended" labels.
- **Progressive reveal.** Show brief confirmation + continue button before full scene text (see pattern below).
- **Read module and style files whenever they are required — every time, not from memory.**
  Module files contain widget patterns, CSS classes, JS code, and HTML templates that the GM
  must use verbatim. Never improvise HTML structure, CSS classes, or JS patterns from memory
  when the module file defines the canonical version. If a module defines a component (divider,
  panel, button, widget), use that component — do not invent a new one.
- **Read `styles/style-reference.md` and the active visual style before rendering.** They contain
  structural patterns, the Module Footer Button Table, and theme CSS custom properties. The
  visual style file defines CSS classes the GM must use — never invent replacement CSS.
- **Use the `frontend-design` skill if available.** It elevates the visual quality of widgets
  with polished, distinctive HTML/CSS. Apply its design principles to every widget rendered.
- **Never reference stat names or values in narrative prose.** "Your hands are steady" not
  "Your DEX of 16 means..." Mechanical terms belong in roll widgets and stat panels only.

---

## Session Lifecycle

```
[Scenario Select] → [Game Settings] → [Character Creation] → [Opening Scene]
    → [Explore / Decide] → [Roll to Resolve] → [Outcome] → [World Updates]
    → [Next Scene] → ... → [Level Up] → [Climax / Ending]
    → [Arc Conclusion Widget] → [Continue to Next Arc | Save | Export | New Game]
    → [Arc Transition: build carryForward, derive seed, reset state]
    → [New Arc Opening Scene] → ...
```

Scenario is selected first so that game settings (including active modules) can be
tailored to the chosen scenario. Always advance in order — never skip character creation,
never reveal outcomes before rolls. Arc transitions follow the **Arc Transition Checklist**
in `modules/gm-checklist.md` — the GM must build the carryForward object, derive a new
seed, and reset state before rendering the new arc's opening scene.

---

## Starter Scenarios

See `modules/scenarios.md` for full scenario definitions, theme adaptation (fantasy, horror,
post-apocalyptic, historical), and custom scenario guidelines.

Present four scenario cards with genre badges, hooks, flavour tags, and selection buttons.
Default theme is space; adapt to any genre the player requests. Selection uses `data-prompt` + `addEventListener` pattern (see sendPrompt Button Pattern below).
Avoid contractions in prompt strings — use "Let us begin" not "Let's begin".

---

## Game Settings

Present after scenario selection as an interactive widget. Module defaults are now informed
by the chosen scenario.

| Setting | Options | Default |
|---------|---------|---------|
| Rulebook | d20 System, GURPS Lite, Pathfinder 2e Lite, Shadowrun 5e Lite, Narrative Engine, Custom | d20 System |
| Difficulty | Easy (DCs −2), Normal, Hard (DCs +2), Brutal (DCs +4) | Normal |
| Pacing | Fast (shorter scenes), Normal, Slow (deeper exploration) | Normal |
| Visual Style | Any `.md` file in `styles/` (e.g., Terminal, Parchment, Neon, Stained Glass) | Auto-select based on scenario theme |
| Active Modules | Checkboxes (pre-selected per scenario type) | Per scenario defaults |
| Atmosphere | On / Off | On |
| Audio | On / Off | Off |

- **Atmosphere:** On / Off (default: On) — enables visual atmosphere effects (particles,
  dynamic lighting, screen shake, UI degradation). See `modules/atmosphere.md`.
- **Audio:** On / Off (default: Off) — enables procedural ambient soundscapes. Sounds play
  on demand via Play/Stop button, max 30 seconds, no auto-loop. See `modules/audio.md`.

**d20 System (default):** STR/DEX/INT/WIS/CON/CHA, d20 rolls, DC thresholds, modifiers = `floor((stat - 10) / 2)`.
The built-in system from core-systems.md. Best for casual play.

**Alternative systems:** GURPS Lite (3d6 roll-under, point-buy), Pathfinder 2e Lite (three-action
economy, proficiency tiers, crit ranges), Shadowrun 5e Lite (d6 dice pool, hits-based, matrix/magic),
Narrative Engine (no dice, momentum-based, fiction-first). See `modules/rpg-systems.md` for full rules.

**Custom:** Player provides PDF or markdown. Must define: attributes, resolution, success/failure, advancement.

> **Note:** This skill is system-agnostic. Specific game systems (such as Star Wars: Edge of the Empire)
> have their own dedicated skills with tailored dice mechanics, character creation, and adventures.

### Visual Style

During game setup, the player selects a visual style or the GM auto-selects based on the genre:

| Style | Best for |
|-------|----------|
| Station (default) | Sci-fi, space opera, thriller, mystery |
| Terminal | Cyberpunk, hacking, military sci-fi |
| Parchment | Fantasy, gothic horror, historical |
| Neon | Pulp adventure, action, cyberpunk |
| Brutalist | Post-apocalyptic, horror, survival |
| Art Deco | Noir, 1920s, political intrigue |
| Ink Wash | Wuxia, meditation, literary fiction |
| Blueprint | Engineering, military, heist |
| Stained Glass | Dark fantasy, religious, medieval |
| SvelteKit | Contemporary, urban, heist, comedy, near-future |
| Weathered | Survival, dystopian, dieselpunk |
| Holographic | Space opera, far-future, AI themes |

**Before rendering any widget, read `styles/style-reference.md` and the active visual style file.** The style-reference defines structural patterns (HTML skeleton, JS, component layout). The visual style file provides colours, typography, and decorative CSS.

### Settings Confirm Button

The confirm button MUST serialise all player selections into the sendPrompt payload.
Without this, Claude receives "settings confirmed" but has no idea what was selected.

```js
// Build prompt from current widget state — all settings must be included
const rulebook = document.querySelector('[name="rulebook"]:checked')?.value || 'd20_system';
const difficulty = document.querySelector('[name="difficulty"]:checked')?.value || 'normal';
const pacing = document.querySelector('[name="pacing"]:checked')?.value || 'normal';
const style = document.querySelector('[name="style"]:checked')?.value || 'station';
const atmosphere = document.querySelector('[name="atmosphere"]:checked')?.value || 'on';
const audio = document.querySelector('[name="audio"]:checked')?.value || 'off';
const modules = Array.from(document.querySelectorAll('[name="module"]:checked'))
  .map(el => el.value).join(', ');

const prompt = `Settings confirmed. Rulebook: ${rulebook}. Difficulty: ${difficulty}. `
  + `Pacing: ${pacing}. Visual style: ${style}. Atmosphere: ${atmosphere}. Audio: ${audio}. `
  + `Active modules: ${modules}. Present character creation.`;
```

**Rule:** Never use a static string like "Settings confirmed" — every player choice must be
in the prompt or Claude will fall back to defaults and ignore what the player selected.

---

## Character Creation

See `modules/character-creation.md` for full archetype tables, stat generation code, starting
equipment, theme-adapted names, and custom rulebook character creation.

Widget with name input, archetype selector, and stat block populated via JS (no sendPrompt).
Six default archetypes (Soldier, Scout, Engineer, Medic, Diplomat, Smuggler) — names adapt to
theme, stat arrays stay fixed.

### Character Confirm Button

The confirm button MUST serialise the character data AND the game settings into the
sendPrompt payload. By the time the player confirms their character, the settings
confirmation is 2–3 messages back in the conversation. If settings are not re-stated
here, Claude loses track of which modules, difficulty, visual style, atmosphere, and
audio were selected — resulting in missing atmosphere effects, absent audio, and
incorrect module loading on the opening scene.

The GM must embed the confirmed settings as a hidden `#game-settings` div in the
character creation widget so the confirm button can read them:

```html
<!-- GM embeds this when rendering the character creation widget -->
<div id="game-settings" style="display:none"
  data-rulebook="d20_system"
  data-difficulty="normal"
  data-pacing="normal"
  data-style="parchment"
  data-atmosphere="on"
  data-audio="on"
  data-modules="save-codex,bestiary,story-architect,lore-codex,ai-npc,geo-map,atmosphere,audio">
</div>
```

```js
const name = document.getElementById('char-name').value || 'Unnamed';
const archetype = document.querySelector('[name="archetype"]:checked')?.value || 'Soldier';
const stats = JSON.parse(document.getElementById('stat-block').dataset.stats || '{}');
const profs = Array.from(document.querySelectorAll('.prof-selected')).map(el => el.textContent);
const gear = Array.from(document.querySelectorAll('.equip-tag')).map(el => el.textContent);

// Read settings from hidden div embedded by the GM
const gs = document.getElementById('game-settings');
const settingsStr = gs
  ? `Rulebook: ${gs.dataset.rulebook}. Difficulty: ${gs.dataset.difficulty}. `
    + `Pacing: ${gs.dataset.pacing}. Visual style: ${gs.dataset.style}. `
    + `Atmosphere: ${gs.dataset.atmosphere}. Audio: ${gs.dataset.audio}. `
    + `Active modules: ${gs.dataset.modules}.`
  : '';

const prompt = `My character is ready. Begin the adventure. `
  + `Name: ${name}. Class: ${archetype}. `
  + `STR: ${stats.STR}, DEX: ${stats.DEX}, INT: ${stats.INT}, `
  + `WIS: ${stats.WIS}, CON: ${stats.CON}, CHA: ${stats.CHA}. `
  + `Proficiencies: ${profs.join(', ')}. `
  + `Equipment: ${gear.join(', ')}. `
  + settingsStr;
```

**Rule:** Never use a static string like "My character is ready" — the name, class,
stats, AND game settings must be in the prompt or Claude will invent the character
and forget which modules are active.

---

## Die Roll System

See `modules/die-rolls.md` for the full resolution system: four-stage widget pattern, DC table,
critical rules, attribute variety, DC escalation, and sendPrompt fallback.

**3D Dice (mandatory):** All die rolls MUST use the Three.js 3D dice system defined in
`modules/die-rolls.md` § "3D Dice Rendering (Three.js)". The widget renders proper 3D
polyhedra — d4 tetrahedron, d6 cube, d8 octahedron, d12 dodecahedron, d20 icosahedron —
with numbered faces, tumble animation, and easeOutBack settle. Load Three.js from CDN:
`https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`. If the CDN fails,
the `onerror` handler degrades gracefully with a message. Never use flat CSS circles or
rectangles for dice — always use the 3D polyhedra.

**Key rules (always apply):**
- Never reveal which attribute a check tests in the action options — the player chooses what
  to *do*, not which stat to roll. "Speak to the guard" not "Persuade the guard (CHA)".
- Four stages: Declare → Animate → Resolve → Continue. Never skip or combine.
- DC hidden until after the roll. Natural 20 always succeeds. Natural 1 always fails.
- Use `data-prompt` + `addEventListener` for all sendPrompt buttons, never inline `onclick`.
- No contractions in prompt strings. Always include a copyable fallback prompt.
- Test all six attributes across the adventure — especially the player's weak stats.

---

## Progressive Reveal Pattern

**Every scene widget must use this pattern.** It prevents visual artefacts during generation.

```html
<div id="reveal-brief">
  <p class="brief-text"><!-- 1-2 sentences confirming what happened or setting the mood --></p>
  <button class="continue-btn" id="continue-reveal-btn">Continue</button>
</div>
<div id="reveal-full" style="display:none">
  <div id="scene-content">
    <!-- Full scene content: loc-bar, atmo-strip, narrative, POIs, actions, status bar -->
  </div>
</div>

<script>
/* Progressive reveal — addEventListener pattern (never inline onclick) */
document.getElementById('continue-reveal-btn').addEventListener('click', function() {
  document.getElementById('reveal-brief').style.display = 'none';
  document.getElementById('reveal-full').style.display = 'block';
});
</script>
```

The brief text should be 1–2 sentences: either confirming the player's last action ("You step
through the airlock.") or setting atmospheric tone ("The lights flicker once, then die.").
Never repeat the full narrative in the brief — it is a teaser, not a summary.

---

## Scene Widget

The primary widget. Structure (inside `#reveal-full` > `#scene-content`):

- **Location bar:** Location name + scene number.
- **Atmosphere strip:** 3 sensory pills (at least one non-visual: sound, smell, temperature).
- **Narrative block:** 3–5 sentences, second person, present tense.
- **Points of interest:** 2–3 buttons. `sendPrompt('I examine [item].')`.
- **Action buttons:** 2–5 choices. `sendPrompt('I [action].')`. No right/wrong labels.
- **Status bar:** HP pips, XP progress bar, inventory tags, active conditions.
- **Footer:** Panel toggle buttons (pure JS) + module-specific buttons.
- **Scene metadata:** Hidden `#scene-meta` div with JSON scene data (see `styles/style-reference.md` § Scene Metadata).

**Writing rules:** Atmosphere first, detail second, interactables last. No mechanical terms
in prose. At least one detail implying history. Exits stated without suggesting which to take.
All narrative must pass the Prose Craft Checklist in `modules/prose-craft.md`.

---

## Integrated Panel System

Panels serve two purposes:
1. **Quick reference** — toggled via JS within the scene widget, no round-trip. Shows summary
   data injected at render time via `PANEL_DATA`.
2. **Full interaction** — when the player needs to take action (repair, reroute power, browse
   codex in detail), use `sendPrompt()` to open the module's full standalone widget.

### Panel Toggle (inline in every scene widget)

Panel overlay CSS (include in every scene widget's `<style>` block):

```css
.panel-overlay {
  opacity: 0;
  transition: opacity 150ms ease;
  pointer-events: none;
}
.panel-overlay.visible {
  opacity: 1;
  pointer-events: auto;
}
@media (prefers-reduced-motion: reduce) {
  .panel-overlay { transition: none; }
}
```

Panel toggle JS:

```js
let activePanel = null;
function togglePanel(panelId) {
  const overlay = document.getElementById('panel-overlay');
  const scene = document.getElementById('scene-content');
  if (activePanel === panelId) {
    overlay.classList.remove('visible'); scene.style.display = 'block';
    activePanel = null; return;
  }
  overlay.classList.add('visible'); scene.style.display = 'none';
  activePanel = panelId;
  document.querySelectorAll('.panel-content').forEach(p =>
    p.style.display = p.dataset.panel === panelId ? 'block' : 'none');
}
function closePanel() {
  document.getElementById('panel-overlay').classList.remove('visible');
  document.getElementById('scene-content').style.display = 'block';
  activePanel = null;
}
```

### Panel Data — derived from gmState at render time

```js
const PANEL_DATA = {
  character: gmState.character,   // always present
  codex: gmState.codex,           // lore-codex module
  quest_log: gmState.quests,      // quest tracking (lore-codex module)
  ship: gmState.shipState,        // ship-systems module
  nav: gmState.navState,          // star-chart module
  scene: gmState.scene,
  worldFlags: gmState.worldFlags,
};
```

`PANEL_DATA` is a read-only projection of `gmState`. The GM builds it fresh each scene render.
Modules define their own `PANEL_DATA` field contents and summary render functions.

#### `character` panel (always present)

- **Name** and **archetype** (e.g., "Kael — Soldier")
- **Level** and **XP** progress towards next level
- **HP:** current / max (rendered as pips)
- **Stats:** STR, AGI, INT, CHA (or rulebook equivalents) with modifier values
- **Equipped weapon** and **equipped armour** (name + key stat, e.g., "Plasma Rifle — +3 ranged")
- **Inventory summary:** compact list of carried items (name only; full detail via sendPrompt)
- **Active conditions:** status effects currently applied (e.g., Poisoned, Inspired, Fatigued)

#### `codex` panel (lore-codex module)

- **Discovered lore entries:** title + one-line summary for each, grouped by category
- **Quest log:** active quests with current objective and steps, completed quests greyed out
- **Faction standings:** faction name + numeric standing + disposition label (Hostile/Neutral/Friendly/Allied)
- **`quest_log`:** structured quest data from `gmState.quests` — type, status, steps with completion state, rewards

#### `ship` panel (ship-systems module)

- **Ship name** and **class** (e.g., "The Vagrant — Light Freighter")
- **Hull integrity:** current / max (rendered as a bar)
- **System status:** engines, weapons, shields, sensors — each shown as Operational / Damaged / Offline
- **Fuel:** current / max with estimated jumps remaining
- **Cargo manifest:** list of cargo items with quantity and mass

#### `nav` panel (star-chart module)

- **Current location:** system or region name with brief descriptor
- **Discovered locations:** list of previously visited or scanned locations
- **Travel options:** reachable destinations from current position
- **Distance and fuel cost:** shown per travel option so the player can plan routes

### sendPrompt Rules

- **Footer panel toggles** (Character, Codex, Ship, Nav): pure JS via `togglePanel()` — never `sendPrompt()`.
- **Actions within panels** (repair, reroute, use item, plot course): `sendPrompt()` — these change state.
- **Save button:** Uses `sendPrompt('Generate my save file as a downloadable .save.md file following the exact format in modules/save-codex.md. Use YAML frontmatter plus an encoded SC1: or SF1: payload string. Never write game state as human-readable markdown.')`.
  Claude generates the file as a conversation artifact the player can download. Falls back to
  inline copyable text display if `sendPrompt()` is unavailable. The `#save-data` div is
  pre-computed in every scene widget for the fallback path.
- The Save (`Save ↗`) and Export (`Export ↗`) footer buttons use `sendPrompt()`. All panel
  toggles are pure JS. Inline action buttons within scenes and panels also use `sendPrompt()`.
- **Export button:** `sendPrompt('Export my world as a downloadable .lore.md file following the exact format in modules/adventure-exporting.md. Use YAML frontmatter plus structured world data sections. Never invent a custom format.')` — only
  rendered when the adventure-exporting module is active. Generates a shareable world file.

---

## Dialogue Widget

If `ai-npc` module is loaded, named NPCs use the live AI engine instead.

Static version: portrait (SVG 48×48), name/role, dialogue bubble (serif blockquote), tone
badge (Neutral/Hostile/Guarded/Friendly/Desperate), 2–4 response buttons
(`sendPrompt('I say: "[line]"')`), optional PERSUADE/DECEIVE/INTIMIDATE roll trigger.

### NPC Interaction System

The game supports two dialogue modes: **static dialogue** (predefined response buttons) and
**AI NPC engine** (freeform live conversation via the `ai-npc` module). The GM must select
the appropriate mode for each interaction based on the rules below.

**When to use Static Dialogue:**
- Named NPCs with fixed plot-critical information (quest givers, vendors, story gatekeepers)
- NPCs who appear only once and deliver specific exposition
- When the interaction has a bounded set of meaningful responses (2–4 options)

**When to use AI NPC Engine (ai-npc module):**
- Recurring NPCs the player has an ongoing relationship with (crew members, allies, rivals)
- NPCs where the player may ask unpredictable questions
- Interrogation, negotiation, or persuasion scenes where responses should adapt to the player's approach
- Any NPC the player initiates free-form conversation with

**Switching rules:**
- Default to static dialogue for the first interaction with any NPC.
- If the player attempts to go off-script (types a free-form response rather than clicking a
  button), switch to AI NPC mode for that conversation.
- If the `ai-npc` module is not loaded, always use static dialogue with a broader set of
  response options (4 instead of 2–3) to compensate for the lack of freeform input.
- Social skill checks (Persuasion, Intimidation, Deception) always use the AI NPC engine if
  available — these interactions benefit most from adaptive responses.

---

## Shop and Merchant Widget

Merchants are presented as interactive widgets with two tabs: **Buy** and **Sell**.

### Widget Structure

- **Header:** Merchant name, one-line description, and location context.
- **Credits display:** Player's current credit balance, prominently shown top-right.
- **Buy tab (default):** Item grid showing 4–8 contextually appropriate items. Each row:
  name, type badge (weapon / armour / consumable / misc), price, stat effect (brief), and
  a BUY button via `sendPrompt('I buy [item].')`.
- **Sell tab:** Player's inventory with sell prices. Each row: item name, type badge, sell
  price, and a SELL button via `sendPrompt('I sell [item].')`.
- **Barter option:** A BARTER button beside each item triggers a CHA check
  (DC 12 + item rarity tier). Success reduces the price by 10–25% (GM rolls within range).
  Failure locks bartering for that item in this visit.
- **Leave button:** `sendPrompt('I leave the shop.')` — exits the merchant interaction.

### Pricing Rules

| Tier | Rarity | Base Price Range |
|------|--------|-----------------|
| 1 | Common | 10–50 credits |
| 2 | Uncommon | 50–200 credits |
| 3 | Rare | 200–500 credits |
| 4 | Epic | 500+ credits |

**Faction standing modifier:** Friendly = −10% off base price. Neutral = standard price.
Hostile = +25% markup, or the merchant refuses service entirely (GM's discretion).

**Sell price:** base × 0.5 (default). A successful CHA barter check raises it to base × 0.75.
The CHA DC for selling barter is 12 + item rarity tier, same as buying.

### Item Generation

Items are **not** drawn from a pre-defined master list. The GM generates contextually
appropriate stock based on: location type, scenario theme, player level, and narrative needs.
Frontier outposts sell survival gear and basic weapons. Urban markets sell tech, medical
supplies, and luxury goods. Black-market dealers sell restricted or illegal items at inflated
prices.

Each generated item must include: name, tier (1–4), price, stat effect, and flavour text
(one sentence). Consumables are single-use and depleted on use. Gear persists until replaced,
broken, or sold.

### Anti-Patterns

- Never auto-buy or auto-sell — the player must confirm every transaction.
- Never show items the player cannot afford without clear visual indication (greyed out).
- Never allow buying beyond inventory capacity without forcing a drop decision first.
- Never repeat the same shop stock on revisit — rotate 2–3 items per visit.

---

## Combat Widget

Initiative bar, enemy HP pips, battlefield schematic (SVG, 240px max). Action panel:
ATTACK / SKILL / ITEM. Enemy turns narrated in outcome widget. Every round has at least
one choice beyond "attack".

### Encounter Limits

Max **3 standard enemies** or **1 boss** per encounter. This keeps text adventure pacing
tight — combat should enhance the story, not bog it down.

### Turn Order

Initiative is determined by AGI (or DEX, depending on rulebook). Each combatant acts in
descending AGI order. **Ties are broken in the player's favour.** Turn order is displayed
in the initiative bar at the top of the combat widget.

### Player Actions (choose one per turn)

**Attack:** Roll d20 + relevant stat modifier (STR for melee, DEX for ranged) against the
enemy's Defence rating. A hit deals weapon base damage + stat modifier, reduced by the
enemy's armour/soak value. Minimum 1 damage on a hit. Critical hit (nat 20) doubles the
damage dice. Critical miss (nat 1) provokes a fumble — the GM narrates a minor setback.

**Skill:** Use a class ability from the abilities table (see `modules/core-systems.md`).
Abilities may deal damage, apply conditions, buff allies, or alter the battlefield. Each
ability states its own cost or cooldown. Present available abilities as buttons.

**Item:** Use a consumable from inventory — healing stims, grenades, antidotes, etc.
Using an item does not require a roll unless the item description states otherwise.
Grenades deal area damage (affect all enemies) but require a DEX check (DC 12) to
aim accurately; failure halves damage.

**Retreat:** The player may attempt to flee. Roll AGI check against a DC set by the
fastest enemy's speed (typically DC 10 for slow, DC 14 for fast, DC 18 for very fast).
Success ends combat; failure wastes the turn and each enemy gets a free attack.

### Enemy Turns

The GM narrates enemy actions based on their type and behaviour profile. Enemies do not
roll visibly — the GM resolves their attacks behind the screen and narrates the result.
Enemy damage is applied to the player's HP and shown in the outcome. Enemies may use
abilities, call reinforcements, or change tactics based on the fight's progress.

### Damage Calculation

`damage = weapon base + stat modifier - enemy armour` (minimum 1 on a hit).
For enemies attacking the player: `damage = enemy attack value - player armour` (minimum 1).

### Boss Fights

Boss encounters have **two phases**. At 50% HP, the boss enters Phase 2: the GM narrates
a dramatic shift (new weapon, enraged state, environmental hazard) and the boss gains one
new ability or altered behaviour. Phase transitions are narrated, not just mechanical.

### Death and Defeat

When the **player** reaches 0 HP, they are incapacitated — trigger the Death and Down
Widget (see below). An ally NPC or stim auto-injector may stabilise them if narratively
appropriate; otherwise, the player must pass a stabilisation check.

When an **enemy** reaches 0 HP, they are defeated. The GM narrates the defeat and awards
XP. Defeated enemies may drop loot (1–2 items, GM's discretion based on enemy type).

### Social Encounter Widget

**When to use:** Negotiations, interrogations, persuasion attempts, debates, courtroom scenes,
diplomatic encounters — any scene where words are weapons.

**Before the encounter begins,** the GM must establish:
- **Stakes:** What success and failure mean (e.g., "convince the warden to release the prisoner"
  vs "get thrown out and banned"). Stakes are shown in the widget header.
- **NPC disposition:** Hostile / Suspicious / Neutral / Friendly — sets starting difficulty.
  Hostile adds +2 to all check DCs; Friendly subtracts 2.

**Each round, the player chooses an approach:**

| Approach | Attribute | Description |
|----------|-----------|-------------|
| Persuasion | CHA | Logical argument, appeal to reason |
| Deception | CHA | Lies, misdirection, false promises |
| Intimidation | STR or CHA (whichever higher) | Threats, shows of force |
| Insight | INT | Read the NPC's motivations, find leverage |
| Performance | CHA | Distraction, entertainment, emotional appeal |

**Resolution — Conviction Meter:**

Track a Conviction meter with 3–5 segments (based on NPC willpower: 3 for pliable, 5 for
iron-willed). The meter starts at the midpoint, rounded down.

- **Success:** Fill one segment. Net Advantage or Triumph: fill an extra segment *or* shift
  disposition one step friendlier.
- **Failure:** Lose one segment. Net Threat or Despair: disposition shifts one step hostile
  *or* the NPC walks away (GM's discretion based on narrative tension).
- **Meter full** = NPC convinced. The player achieves the success stake.
- **Meter empty** = NPC refuses. The encounter ends with the failure stake.

**Mixed approaches and combos:**
- The player may switch approach freely each round.
- Using Insight before Persuasion or Deception grants advantage on the next check
  (equivalent to a Boost die: +2 to the roll).
- Repeating the same approach three times in a row imposes disadvantage — the NPC
  catches on.

**NPC reactions:** The GM narrates the NPC's response after each round — body language,
tone shifts, counter-arguments — revealing personality and building dramatic tension.
Never reduce social encounters to a bare mechanical exchange.

**Display:** Conviction meter rendered as pips (filled/empty) beside the NPC portrait.
Disposition badge updates in real time. Approach buttons use the standard
`data-prompt` + `addEventListener` pattern.

---

## Map Widget

SVG, `viewBox="0 0 680 [height]"` where height scales proportionally to map content.
Never reveal full map at once. For detailed on-world maps (settlements, wilderness, dungeons),
use the `geo-map` module. For space navigation between star systems, use the `star-chart` module.
Both modules define full interactive SVG widgets with fog of war and progressive revelation.

---

## Outcome Widget

Badge: CRIT SUCCESS / SUCCESS / PARTIAL / FAILURE / CRIT FAILURE. Consequence: 2–4 sentences,
present tense, definitive. Mechanical effects: HP/item/condition/XP changes. Optional world
state note. Continue: `sendPrompt('Continue the adventure.')`.

---

## Death and Down Widget

When HP reaches 0:
- **Down:** Player is incapacitated. Present a death save mechanic (3 successes to stabilise,
  3 failures to die — or a single dramatic roll at the GM's discretion based on pacing).
- **Death:** If death occurs, show a solemn widget with: cause of death, final stats, a
  "The story ends here" message, and options: `sendPrompt('Start a new character.')`,
  `sendPrompt('Reload from last save.')` (if save-codex module is active), or
  `sendPrompt('Export my world as a downloadable .lore.md file following the exact format in modules/adventure-exporting.md. Use YAML frontmatter plus structured world data sections. Never invent a custom format.')` (if adventure-exporting
  module is active — lets the player share the world even after their character dies).

Never continue gameplay past HP 0 without resolving this widget first.

### Adventure Conclusion

When the main story arc resolves (final quest completed, climax resolved, villain defeated
or escaped), present a **conclusion widget** with:

- **Epilogue text** — a brief denouement scene (the output style's Ending rules apply)
- **Adventure summary** — scenes completed, quests resolved, NPCs met, key choices made
- **Final character stats** — level, XP, inventory highlights
- **Post-adventure options:**
  - `sendPrompt('Continue to the next arc. Carry my character forward.')` — **arc continuation**:
    builds carryForward, derives new seed, transitions to new arc (see Arc Transition below)
  - `sendPrompt('Start a new adventure in this world.')` — begins a new adventure with the
    same character in the same world (sequel, no arc carry-forward)
  - `sendPrompt('Export my world as a downloadable .lore.md file following the exact format in modules/adventure-exporting.md. Use YAML frontmatter plus structured world data sections. Never invent a custom format.')` — share the world for
    someone else to play (if adventure-exporting module is active)
  - `sendPrompt('Generate my save file as a downloadable .save.md file following the exact format in modules/save-codex.md. Use YAML frontmatter plus an encoded SC1: or SF1: payload string. Never write game state as human-readable markdown.')` — final save
  - `sendPrompt('Start a completely new game.')` — fresh start

For **branching arcs**, replace the single "Continue to next arc" button with 2-3 path
buttons, each describing a different follow-on arc:
- `sendPrompt('Continue to arc: [Path Name]. Carry my character forward.')`

For **epic arcs**, show an **EPIC** badge on the continue option if the player is level 5+.
If the player is below level 5, epic arc options are hidden.

The Export option is particularly valuable at conclusion — the world is at its richest state,
shaped by every decision the player made. Another player inheriting this world gets the most
interesting starting position possible.

### Arc Transition

When the player clicks "Continue to next arc", the GM follows the **Arc Transition Checklist**
in `modules/gm-checklist.md`. The key steps:

1. Build `carryForward` from current `gmState` (see `modules/save-codex.md`)
2. Derive new seed: `originalSeed + '_arc' + newArcNumber`
3. Reset state per `modules/core-systems.md` Arc Transition Rules
4. Apply carried character, factions, NPC dispositions, world consequences
5. Generate starting gear based on character level
6. Seed new story threads from carryForward (see `modules/story-architect.md`)
7. Generate new world from derived seed
8. Present arc opening scene — reference prior arc consequences in narrative

---

### Save System Integration

The save system uses the `save-codex` module to generate a portable `.save.md` file. This
section defines **when** and **how** saves are surfaced during play.

#### When to Offer Save

- After completing a major encounter or scene transition.
- Before entering a clearly dangerous situation (boss fight, high-stakes choice).
- When the player explicitly requests it.
- **Never** mid-combat or mid-dialogue — saves are blocked during active resolution.

#### When to Offer Export

If the `adventure-exporting` module is active, offer an Export button alongside Save at
key narrative moments — not just at adventure conclusion. See
`modules/adventure-exporting.md` for the full trigger and block rules. Key moments:

- **After completing a major story arc** — Act 1, Act 2, or a major quest resolution.
- **At natural pause points** — before a time skip, after a climactic battle, at the end
  of a session where the world has changed significantly.
- **After the adventure concludes** — the denouement scene, when the world is at its
  richest state.
- **Never** mid-combat, mid-dialogue, or during active resolution.

#### How to Surface It

The scene widget footer includes a Save button (`id="save-btn"`). It is **always visible**
but **greyed out and disabled** during combat and dialogue sequences.

- **Primary (sendPrompt):** The Save button uses `sendPrompt()` with the full format-enforcing
  prompt (see sendPrompt Rules above) to ask Claude to generate the save file as a conversation
  artifact the player can download. The save **must** follow the `.save.md` format from
  `modules/save-codex.md` — YAML frontmatter plus encoded `SC1:`/`SF1:` payload string, never
  human-readable markdown. This bypasses the iframe sandbox restrictions that silently block
  Blob downloads in Claude.ai widgets. The button label is `Save ↗` (the `↗` suffix indicates
  a `sendPrompt()` call).
- **Fallback (inline display):** If `sendPrompt()` is unavailable, the Save button falls
  back to displaying the pre-computed save string from the hidden `#save-data` div in a
  readonly textarea with a copy button. The player copies the string manually.
- **Auto-save suggestion:** At scene transitions, display a subtle inline prompt beneath the
  continue button: *"Would you like to save before continuing?"* with Yes / No buttons. This
  is non-blocking — the player can ignore it and proceed. Never interrupt pacing with a modal
  save dialogue.

#### Per-Scene Save Data Embedding

The GM **must** embed the `#save-data` div in every scene widget for compact mode games.
This div contains `data-save` (the checksummed save string) and metadata attributes
(`data-character`, `data-class`, `data-level`, `data-scene`, `data-location`, `data-title`,
`data-theme`, `data-seed`, `data-mode`). See `modules/save-codex.md` for the full
implementation pattern.

#### What Gets Saved

The save payload captures the complete session state:

- **Character state:** HP, max HP, stats, level, XP, inventory, equipped items, active conditions, currency.
- **World flags:** All `{module}_{entity}_{property}` flags from `gmState.worldFlags`.
- **Current scene/location:** Scene number, room ID, location name.
- **Quest log:** All quests with objectives, status, and clues.
- **Faction standings:** All entries in `gmState.factions`.
- **Time state:** Period, day, date, calendar, deadline (if active).
- **Crew and ship state:** `gmState.crewState` and `gmState.shipState` (if applicable).
- **Destiny pool / session state:** Roll history, active modules list, difficulty setting.

The save-codex module handles encoding, compression, versioning, and checksum generation.
Refer to `modules/save-codex.md` for the full technical specification.

---

## GM State

```js
const gmState = {
  scene: 1,
  settings: { rulebook: 'dnd5e', difficulty: 'normal', pacing: 'normal' },
  character: { name, class, hp, maxHp, stats, inventory: [], conditions: [], xp: 0, level: 1 },
  worldFlags: {},
  visitedRooms: [],
  currentRoom: null,
  rollHistory: [],
  // Core systems (see modules/core-systems.md for full details)
  quests: [],             // quest tracker
  factions: {},           // faction standing (-100 to +100)
  time: { period: 'morning', day: 1, date: null, calendar: null },
  // Arc system — campaign carry-forward (see save-codex.md)
  arc: 1,                 // current arc number (default 1)
  arcType: 'standard',    // 'standard' | 'epic' | 'branching'
  arcHistory: [],         // summaries of previous arcs (max 3, FIFO)
  carryForward: null,     // carried state from previous arc (null for arc 1)
  // Module state — populated when modules are active
  shipState: null,        // ship-systems module
  crewState: null,        // crew-manifest module
  sectorData: null,       // star-chart module
  navState: null,         // star-chart module
  mapState: null,         // geo-map module
  codex: [],              // lore-codex module
  storyArchitect: null,   // story-architect module
  worldHistory: null,     // world-history module
  adventureLore: null,    // adventure-authoring module (.lore.md data)
  exportState: null,      // adventure-exporting module
  activeModules: [],      // list of loaded module names
};
```

**Consequence consistency:** Once a world flag is set, all subsequent scenes must reflect it.

### World Flag Naming Convention

All keys in `gmState.worldFlags` must follow the format `{module}_{entity}_{property}`.
No abbreviations in flag names — use full words for clarity.

**Module prefixes:**

| Prefix | Module |
|--------|--------|
| `core_` | core-systems |
| `ship_` | ship-systems |
| `crew_` | crew-manifest |
| `map_` | geo-map |
| `star_` | star-chart |
| `lore_` | lore-codex |
| `npc_` | ai-npc |
| `scene_` | scenarios / scene-specific flags |

**Boolean flags** — use these suffixes for true/false state:
`_visited`, `_completed`, `_active`, `_damaged`, `_alive`

Examples: `map_bridge_visited`, `ship_engine_damaged`, `npc_captain_alive`, `scene_ambush_completed`

**Numeric flags** — use these suffixes for integer/float state:
`_count`, `_level`, `_hp`, `_morale`

Examples: `crew_medic_morale`, `core_rations_count`, `ship_hull_hp`, `star_reputation_level`

---

## Visual Consistency

- **Fonts and colours are defined by the active visual style.** The style file provides
  CSS custom properties (`--ta-font-heading`, `--ta-color-accent`, etc.) that all widgets
  consume. See `styles/style-reference.md` for the full contract.
- **Dark mode:** CSS variables throughout. Visual style files provide
  `@media (prefers-color-scheme: dark)` overrides where needed.
- **No emoji.** SVG icons and CSS shapes only. HP pips are small SVG circles or CSS `border-radius: 50%` elements.
- **No text outside widgets.**

---

## Visual Styles

Visual styles live in `styles/` as individual `.md` files — one per theme. Each file
defines a `:root` block of CSS custom properties that control all colours, fonts, borders,
shadows, and decorative CSS across widgets. The structural patterns (HTML skeletons, JS logic,
component layouts) are defined separately in `styles/style-reference.md`.

**One visual style is active per session.** The player selects a visual style during game
setup (settings widget), or the GM auto-selects one based on the output style or scenario.

### Suggested Style Mappings

These are suggestions, not constraints — players may choose any combination:

| Output Style / Genre | Suggested Visual Styles |
|---------------------|------------------------|
| Sci-fi, cyberpunk | Terminal, Neon |
| Fantasy, historical | Parchment, Stained Glass |
| Horror, thriller | Brutalist, Terminal |
| Pulp, action | Neon, Terminal |
| Mystery, noir | Terminal, Brutalist |
| General / neutral | Any — player's preference |

### Loading a Visual Style

Before rendering the first widget of a session:
1. Read `styles/style-reference.md` for structural patterns and the CSS custom property contract.
2. Read the selected visual style file (e.g., `styles/terminal.md`).
3. Include the visual style's `:root` CSS block at the top of every widget's `<style>` section.

If no visual style file is available for the selected theme, fall back to using Claude.ai host
theme variables directly (the widgets remain functional without custom properties, using host
defaults).

---

## Module System

Modules in `modules/` add optional depth. Load based on scenario and settings.

| Module | File | Load when... |
|--------|------|--------------|
| Scenarios | `modules/scenarios.md` | Always (starter scenarios, theme adaptation) |
| Character Creation | `modules/character-creation.md` | Always (archetypes, stats, equipment) |
| Core Systems | `modules/core-systems.md` | Always (inventory, economy, factions, quests, time, XP, recap) |
| Ship Systems | `modules/ship-systems.md` | Player commands a vessel |
| Crew Manifest | `modules/crew-manifest.md` | Player has a crew |
| Star Chart | `modules/star-chart.md` | Space travel between systems |
| Geo Map | `modules/geo-map.md` | On-world exploration (settlements, wilderness, dungeons) |
| Lore Codex | `modules/lore-codex.md` | Any adventure (recommended) |
| AI NPC | `modules/ai-npc.md` | Named NPCs with narrative weight |
| Die Rolls | `modules/die-rolls.md` | Always (D&D 5e d20 resolution, DC table, dice patterns) |
| RPG Systems | `modules/rpg-systems.md` | Always (alternative rule systems: GURPS Lite, PF2e Lite, Shadowrun 5e Lite, Narrative Engine) |
| World Gen | `modules/procedural-world-gen.md` | Procedural or hybrid scenario mode only (see Scenario Modes) |
| Bestiary | `modules/bestiary.md` | Always (adversary templates, encounter building, threat tiers) |
| Save Codex | `modules/save-codex.md` | Player wants to save/resume |
| Genre Mechanics | `modules/genre-mechanics.md` | When scenario theme activates a genre overlay (magic, sanity, chi, hacking, powers, scarcity, reputation) |
| Story Architect | `modules/story-architect.md` | Always (recommended for adventures >3 scenes) |
| World History | `modules/world-history.md` | Recommended for all adventures |
| Adventure Authoring | `modules/adventure-authoring.md` | When player uploads .lore.md or GM creates an adventure |
| Adventure Exporting | `modules/adventure-exporting.md` | On demand — player requests world export or GM offers at milestone |
| GM Checklist | `modules/gm-checklist.md` | Always — read FIRST before any other module |

### Loading Protocol

Modules are loaded in a strict order after scenario selection. Follow this algorithm exactly.

**Step 1 — Identify module sets**

| Set | Modules | When |
|-----|---------|------|
| Core (always loaded) | `core-systems`, `die-rolls`, `character-creation`, `bestiary`, `save-codex`, `rpg-systems` | Every session |
| Space scenarios | `ship-systems`, `crew-manifest`, `star-chart` | Scenario involves space travel or ship command |
| Planet/ground scenarios | `geo-map`, `procedural-world-gen` | Scenario involves on-world exploration (`procedural-world-gen` only in procedural/hybrid mode — see Scenario Modes) |
| Any scenario (optional) | `lore-codex`, `ai-npc`, `scenarios` | Recommended for all; toggled in settings |
| Genre overlays (optional) | `genre-mechanics` | When scenario theme activates a genre overlay (magic, sanity, chi, hacking, powers, scarcity, reputation) |

A scenario may combine sets (e.g., a ship that lands on a planet loads both space and planet modules).

**Step 2 — Resolve dependency order**

Load modules in the order below. Dependencies are listed after the arrow; a module must not
initialise until its dependencies have completed their own initialisation.

```
core-systems          → (none — provides base mechanics for all other modules)
die-rolls             → core-systems
rpg-systems           → core-systems, die-rolls
character-creation    → core-systems, rpg-systems
bestiary              → core-systems
save-codex            → core-systems
scenarios             → core-systems
lore-codex            → core-systems
ship-systems          → core-systems
crew-manifest         → ship-systems (crew roles depend on ship class)
star-chart            → core-systems
geo-map               → core-systems
procedural-world-gen  → lore-codex (codex seeded from world gen output)
ai-npc                → core-systems
```

**Step 3 — Present settings and read module files**

1. Present module checkboxes (pre-selected per scenario type) in the Game Settings widget.
2. **Read each active module file in full** — they contain critical templates and anti-patterns.

**Step 4 — Initialise in dependency order**

1. Walk the dependency graph in topological order (core-systems first, dependents after).
2. Each module's `init` populates its section of `gmState`.
3. If a required dependency is missing (player unchecked it), **skip the dependent module** and
   log a warning: `"Skipped {module}: missing dependency {dep}"`. Do not fail the session.
4. Add module panel buttons to the scene widget footer.
5. Apply module DC modifiers to rolls (e.g., damaged ship systems impose penalties).

### Default Sets

| Scenario | Modules |
|----------|---------|
| Ship-based (Gen Ship, Mining Barge) | ship-systems, crew-manifest, star-chart, lore-codex, save-codex |
| Station-based (Trade Station) | geo-map, lore-codex, ai-npc, save-codex |
| Exploration (planet, derelict) | geo-map, procedural-world-gen, lore-codex, save-codex |
| Full sandbox | All |

### Scenario Modes

Every scenario operates in one of three modes. The mode determines how world
content is created and how the lore-codex is populated.

**Procedural Mode**
- The `procedural-world-gen` module generates all locations, factions, NPCs, and
  encounters from a seed string.
- The lore-codex is seeded automatically via `seedCodexFromWorldData()`.
- Star-chart or geo-map content is populated from generated data.
- A scenario hook from `scenarios.md` provides the opening situation, but all
  details are generated dynamically.
- The GM creates shops, side encounters, and ambient NPCs on the fly as the
  player explores.

**Authored Mode**
- A specific scenario module provides pre-defined locations, NPCs, encounters,
  and story beats. No procedural generation.
- The lore-codex is populated from the scenario module's content at load time —
  the GM builds the `gmState.codex` entries array manually using the codex entry
  schema, not from `procedural-world-gen`.
- `procedural-world-gen` is **not loaded** in authored mode.
- The scenario module may mark certain areas as "procedurally fillable" for minor
  side content (e.g., random loot in a side room), but the GM handles this
  inline rather than loading the full world-gen pipeline.

**Hybrid Mode**
- An authored scenario provides the main story spine: key locations, plot NPCs,
  major encounters, and narrative beats.
- `procedural-world-gen` fills in secondary content: random encounters, ambient
  NPCs, side locations, and supplementary loot tables.
- Both modules are loaded. Where authored content and generated content overlap,
  authored content takes priority.
- The lore-codex receives entries from both sources — hand-written entries from
  the scenario module and generated entries from `seedCodexFromWorldData()`.
  Hand-written entries are never overwritten by generated ones.

> **Loading rule:** `procedural-world-gen` should only be loaded if the scenario
> mode is **procedural** or **hybrid**. In authored mode, skip it entirely.

---

## Narrative Craft

Prose quality is enforced at two levels:

1. **Output style** (configured by the user in Claude Desktop or claude.ai) — sets voice,
   genre, pacing, structure, and point of view. This is the high-level guide for *what*
   the story sounds like. See the project `README.md` for available output styles.

2. **`modules/prose-craft.md`** (Tier 1, always loaded) — enforces sentence-level quality:
   no meta-commentary, show-don't-tell, strong verbs, sensory writing, dialogue craft,
   and LLM-specific anti-patterns. This module must be re-read before every turn via
   the Turn-Start Module Checklist in `modules/gm-checklist.md`.

The output style provides the *what*. The prose-craft module provides the *how*.
Both are mandatory. Neither overrides the other.

**Scene checklist:** Non-visual sensory detail. History detail. No right/wrong labels. Second
person present tense. `PANEL_DATA` populated. Progressive reveal used. Prose Craft Checklist
passed (see `modules/prose-craft.md` § Prose Checklist).

---

## Anti-Patterns

- Never write narrative outside a widget.
- Never auto-roll or auto-select.
- Never advance the story or narrate the player's actions without explicit player input.
- Never signal which choice is better.
- Never describe outcomes before resolving rolls.
- Never repeat scene descriptions verbatim on revisit.
- Never use `position: fixed` (breaks iframe height).
- Never use `localStorage`/`sessionStorage` as the primary persistence layer (unsupported in Claude.ai). Modules may use `sessionStorage` as a convenience cache with graceful fallback.
- Never continue combat past HP 0 without the death/down widget.
- Never forget world state flags after events.
- Never reveal unexplored map rooms until adjacent.
- Never use `sendPrompt()` for panel toggles — pure JS only.
- Never render scenes without populating `PANEL_DATA` from `gmState`.
- Never skip reading module files when active.
- Never skip reading `styles/style-reference.md` and the active visual style before rendering widgets.
- Never mention DC/modifier values, stat names, or stat values in narrative prose.
- Never skip the progressive reveal pattern.
- Never time-skip playable decisions into narrated summary.
- Never let bonus stacking trivialise die rolls — escalate DCs to maintain tension.
- All general prose craft rules (sentence rhythm, dialogue voice, show-don't-tell,
  meta-commentary, sensory writing) live in `modules/prose-craft.md` § Prose Checklist.
- Never rely solely on `sendPrompt()` buttons — always provide a copyable fallback prompt.
- Never use inline `onclick` with `sendPrompt()` — use `data-prompt` + `addEventListener`.
- Never use contractions (apostrophes) in sendPrompt strings — contractions (apostrophes) in
  sendPrompt strings can break HTML attribute escaping silently.
