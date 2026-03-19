# Text Adventure Game System

A comprehensive text adventure engine for Claude.ai, built entirely on `visualize:show_widget`.
All gameplay, narrative, mechanics, and UI are rendered as interactive HTML widgets — no plain
text output.

---

## Architecture

```
SKILL.md (orchestrator)
  Core game engine: session lifecycle, character creation, die rolls,
  scene rendering, panel system, combat, maps, XP/levelling, visual rules.

modules/
  adventure-authoring.md  .lore.md file format for authored adventures
  ai-npc.md               Live AI-powered NPC dialogue via Anthropic API
  bestiary.md             Adversary templates, encounter building, threat tiers
  character-creation.md   Archetypes, stats, equipment, theme-adapted names
  core-systems.md         Inventory, economy, factions, quests, time, XP, session recap
  crew-manifest.md        Living crew with morale, tensions, secrets
  die-rolls.md            Progressive d20 resolution (declare → animate → resolve → continue)
  genre-mechanics.md      Genre-specific mechanical additions
  geo-map.md              On-world maps: settlements, wilderness, dungeons
  lore-codex.md           Player-facing encyclopaedia with discovery states
  procedural-world-gen.md Seed-based deterministic world generation
  rpg-systems.md          Alternative systems: GURPS Lite, PF2e Lite, Shadowrun 5e Lite, Narrative
  save-codex.md           Session persistence via copyable strings
  scenarios.md            Starter scenarios and theme adaptation (space, fantasy, horror, etc.)
  ship-systems.md         Vessel integrity, power allocation, damage, repair
  star-chart.md           Sector navigation, jump routes, faction territory
  story-architect.md      Plotline tracking, foreshadowing, consequence chains, dramatic pacing
  world-history.md        Pre-adventure world building, epochs, power structures, cultural layer

styles/
  style-reference.md    Structural patterns: panel CSS, scene skeleton, loading messages,
                        CSS custom property contract, worked examples.
  *.md                  Visual style definitions (one per theme) providing colours,
                        fonts, and decorative CSS as CSS custom properties.
```

The orchestrator (`SKILL.md`) is self-sufficient for running a basic text adventure. Modules
add optional depth and are loaded based on scenario type and player settings.

---

## Quick Start

Ask Claude to play a text adventure. The skill triggers automatically on phrases like:
- "Play a text adventure"
- "Run a space RPG"
- "I want to play a game"
- "Start a sci-fi campaign"

The game presents scenario selection, then game settings, then character creation, then play begins.

---

## Game Settings

Settings are presented as an interactive widget at game start. Players can adjust these before
or during play.

### Rulebook

| System | Description | Mechanics |
|--------|-------------|-----------|
| **D&D 5e** (default) | Classic d20 system with six attributes | d20 + modifier vs DC threshold |
| **Custom** | Player-provided rulebook | Supply a PDF or markdown file with mechanics |

**D&D 5e** uses STR/DEX/INT/WIS/CON/CHA, modifiers from `floor((stat - 10) / 2)`, and the
standard DC table (Trivial 5, Easy 8, Moderate 12, Hard 16, Very Hard 20, Near-impossible 25).

**Custom rulebooks** must define: attributes, resolution mechanic, success/failure criteria,
and character advancement. Provide the document at game start.

> **Note:** This skill is system-agnostic. Specific game systems (such as Star Wars: Edge of
> the Empire) have their own dedicated skills with tailored dice mechanics, character creation,
> and adventures.

### Difficulty

| Level | Effect |
|-------|--------|
| Easy | All DCs reduced by 2. More generous loot. |
| Normal | Standard DC table. Balanced resources. |
| Hard | All DCs increased by 2. Scarcer resources. |
| Brutal | All DCs increased by 4. Minimal healing. Permanent consequences. |

### Pacing

| Speed | Effect |
|-------|--------|
| Fast | Shorter scene descriptions. Quicker escalation. Fewer side encounters. |
| Normal | Standard 3-act structure. Balanced exploration and action. |
| Slow | Deeper world-building. More NPC interactions. Extended exploration phases. |

### Active Modules

Module checkboxes are pre-selected based on the chosen scenario (see Default Module Sets below).
Players can enable or disable individual modules before play begins.

### Text-to-Speech

TTS defaults to **On** with a English voice (Google UK English preferred, falls back to any available English voice).
When enabled, scene narrative is read aloud using the Web Speech API. TTS activates
automatically on scene reveal and can be toggled via the footer button.

---

## Modules

### Ship Systems (`modules/ship-systems.md`)

**Load when:** The player commands a vessel.

Adds a seven-system integrity model: Hull, Engines, Power Core, Life Support, Weapons, Sensors,
Shields. Each system has its own integrity track (0–100), power allocation, and failure mode.

**Key features:**
- Status thresholds: Operational → Degraded → Critical → Failing → Offline
- DC modifiers from damaged systems (e.g., degraded engines impose −1 on jump rolls)
- Cascade failures when systems go offline
- Power allocation: fixed pool distributed across systems, player-controlled rebalancing
- Field repairs (INT rolls + parts) and station repairs (credits, full restoration)
- Four ship classes: heavy freighter, light corvette, salvage tug, research vessel
- Ship status panel integrated into the scene widget

### Crew Manifest (`modules/crew-manifest.md`)

**Load when:** The player has a crew aboard their vessel.

Models 3–6 crew members, each with a role, personal tension, and a secret. Morale is a shared
resource that affects the entire ship.

**Key features:**
- Crew roles tied to ship systems (e.g., Engineer boosts repair rolls)
- Morale track (0–100) with mechanical effects on DCs
- Personal tensions that create story pressure
- Secrets that may surface through play
- Crew reactions to player decisions
- Death, defection, and breakdown mechanics

### Geo Map (`modules/geo-map.md`)

**Load when:** The adventure involves on-world exploration.

Handles three map types: settlement maps (towns, stations, outposts), wilderness/overland maps
(terrain, travel, resource consumption), and dungeon/interior floor-plans (rooms, corridors,
doors). All maps use progressive revelation — the player earns the map by exploring it.

**Key features:**
- Three map types with distinct visual styles and mechanics
- Fog of war: unexplored zones hidden, revealed zones dimmed, visited zones fully rendered
- Settlement zones with faction control, threat levels, and access restrictions
- Wilderness terrain with travel time modifiers, encounter rolls, and supply consumption
- Dungeon rooms with locked/hidden doors, traps, and room status tracking
- Interactive SVG widgets with click-to-travel and zone inspection
- MAP_EVENT protocol for zone entry, discovery, and status changes
- Physical map items as loot (reveal entire regions at once)
- Integration with lore-codex (auto-unlock location entries on visit)
- Panel summary view (quick reference) + full standalone widget (interaction)

### Star Chart (`modules/star-chart.md`)

**Load when:** The adventure involves space travel between star systems.

Generates a sector of star systems with jump routes, faction territories, and hazard zones.
Seeded from the world PRNG for deterministic, reproducible sectors.

**Key features:**
- SVG starmap widget with interactive system inspection
- Progressive system revelation (adjacent systems only)
- Jump fuel economy
- Faction territory overlay
- Hazard zones with encounter tables
- Travel time and route planning
- Navigation panel integrated into the scene widget

### Lore Codex (`modules/lore-codex.md`)

**Load when:** Any adventure (recommended for all games).

A player-facing encyclopaedia that unlocks entries as the player discovers lore. Entries are
gated — the player only sees what their character has actually learned.

**Key features:**
- Entry states: Locked → Partial → Discovered → Redacted
- Seven categories: Faction, Location, Character, Item, Event, Secret, Bestiary
- Discovery stamps (how/where/when the player learned it)
- Cross-reference links between entries
- Search and category filtering
- LORE_EVENT protocol for unlocking entries during play
- Codex panel integrated into the scene widget
- Toast notifications when new entries are discovered

### AI NPC (`modules/ai-npc.md`)

**Load when:** Named NPCs with narrative weight need live, freeform dialogue.

Replaces the static dialogue widget with an AI-powered conversation engine. NPCs have genuine
knowledge limits, agendas, secrets, and evolving dispositions. The player converses in freeform
text; responses are generated via the Anthropic API.

**Key features:**
- NPC definition objects with voice, knowledge fences, lies, and agendas
- Dynamic system prompt engineering from NPC state
- Disposition engine (0–100 trust score mapped to six states)
- Trigger-based trust deltas from player dialogue
- World state propagation via GM_EVENT protocol
- Multi-NPC support with isolated conversation histories
- Five NPC archetypes: Gatekeeper, Reluctant Witness, True Believer, Broken Expert, Adversary with a Point

**Note:** Requires API access. Each NPC exchange costs approximately 400–600 tokens.

### Procedural World Gen (`modules/procedural-world-gen.md`)

**Load when:** The scenario uses generated (not hand-authored) content.

Generates deterministic game worlds from a seed string. Same seed always produces the same
world — sessions are shareable and replayable.

**Key features:**
- Seeded PRNG (mulberry32) for reproducible generation
- Room/area generation with typed layouts
- NPC roster generation with personality traits and factions
- Faction graph with relationships (allied, neutral, hostile, at war)
- Loot tables with rarity tiers
- Encounter tables with threat scaling
- Quest hook generation (main + side threads)
- Atmosphere generation (lighting, sound, smell, hazards)

### Save Codex (`modules/save-codex.md`)

**Load when:** The player wants to save progress or resume a prior session.

Encodes the full session state into a copyable string. No servers, no localStorage — the
save *is* the string.

**Key features:**
- Compact mode: for procedural worlds, stores seed + player deltas only (tweet-length saves)
- Full mode: for hand-authored worlds, LZ-compressed serialised state
- Versioned, checksummed payloads
- Save widget with copy button
- Resume flow with validation
- Captures all module state (ship, crew, nav, codex)

---

## Core Systems

### Inventory
8-slot capacity (expandable via equipment). Key items don't consume slots. Consumables have limited uses. Combining items requires a skill check. Encumbrance forces the player to drop items when over capacity.

### Economy and Trading
Setting-appropriate currency (credits, gold, denarii, etc.) earned through quests, loot, and work. Spent on repairs, supplies, equipment, and information. Shops are NPC interactions with bartering via CHA checks. Selling yields 50-75% of item value; buying costs 100-150% depending on faction standing.

### Faction Reputation
Faction standing tracked as -100 (hostile) to +100 (allied). Actions that help a faction increase standing; opposing actions decrease it. Affects prices, access, NPC attitudes, and available missions. Standing ranges: Hostile / Unfriendly / Neutral / Friendly / Allied.

### Quest and Objective Tracking
Active quest log with objectives, completion status, and gathered clues. Accessible via a footer panel toggle. Quests discovered through exploration, NPC dialogue, and codex entries. Never auto-completed — the GM marks objectives based on player actions.

### Time and Calendar
Time adapts to the setting's technology level. Pre-clock settings use natural periods (dawn, morning, midday, dusk, evening, night). Clock settings use hours. Calendar tracked using the setting's system (Roman, Gregorian, stardate) when known. Time pressure is narrative, never a real-time countdown. Displayed in the scene widget location bar.

### Session Recap
When resuming from a save, a recap widget shows: key events summary, active quest status, character snapshot, and current location/time. Answers "Where was I? What was I doing?" before play resumes.

---

## Default Module Sets

The orchestrator recommends module combinations based on scenario type:

| Scenario | Modules |
|----------|---------|
| Ship-based (Generation Ship, Mining Barge) | ship-systems, crew-manifest, star-chart, lore-codex, save-codex |
| Station-based (Trade Station) | geo-map, lore-codex, ai-npc, save-codex |
| Exploration (planet, derelict) | geo-map, procedural-world-gen, lore-codex, save-codex |
| Full sandbox | All modules |

Players can override these defaults in the settings widget.

---

## Character Archetypes

Default archetypes for D&D 5e mode (names and flavour adapt to scenario theme):

| Archetype | Primary Stats | HP | Flavour |
|-----------|-------------|-----|---------|
| Soldier | STR 16, CON 14 | 12 | Combat-trained, tactical instincts |
| Scout | DEX 16, WIS 14 | 9 | Agile, perceptive, evasive |
| Engineer | INT 16, DEX 12 | 8 | Improviser, systems expert |
| Medic | WIS 16, INT 14 | 9 | Healer, calm under pressure |
| Diplomat | CHA 16, INT 14 | 8 | Persuader, reads people |
| Smuggler | DEX 16, CHA 14 | 10 | Slippery, charming, resourceful |

For other game systems, dedicated skills provide their own archetype and career definitions.

---

## XP and Levelling

| Action | XP |
|--------|----|
| Scene with meaningful decision | 25 |
| Combat victory | 50 |
| Secret/hidden area discovered | 30 |
| NPC interaction resolved favourably | 20 |
| Critical success bonus | 10 |
| Quest thread completed | 100 |
| Near-death survival | 40 |

| Level | XP Required | HP Bonus | Improvement |
|-------|-------------|----------|-------------|
| 1 | 0 | — | Starting stats |
| 2 | 100 | +3 | +1 attribute |
| 3 | 250 | +3 | New proficiency |
| 4 | 500 | +4 | +1 attribute |
| 5 | 800 | +4 | +1 attribute, new ability |
| 6 | 1200 | +5 | New proficiency |
| 7 | 1700 | +5 | +1 attribute |
| 8 | 2300 | +6 | +1 attribute, new ability |

---

## Starter Scenarios

Four space-themed scenarios are offered by default:

1. **Generation Ship Colonist** — Deep space survival and politics aboard a centuries-old vessel
2. **Mining Barge Engineer** — Blue-collar mystery in the asteroid belt
3. **Trade Station Bartender** — Social intrigue at a crossroads station
4. **GM's Choice** — A fourth scenario generated to complement the above three

Players select before character creation. The GM does not pull from memory for scenario content.

**Note:** The space theme is the default, not a constraint. The system supports any genre —
fantasy, horror, post-apocalyptic, and so on. If the player requests a different genre, scenarios,
archetypes, and module selection adapt accordingly.

---

## Widget Types

| Widget | Purpose |
|--------|---------|
| Settings | Game configuration before play |
| Scenario Select | Choose starting scenario |
| Character Creation | Name, archetype, stat block |
| Scene / Room | Primary gameplay — narrative, POIs, actions, panels |
| Die Roll | Progressive d20 resolution (declare → animate → resolve → continue) |
| Dialogue | NPC conversation with response options |
| Combat | Turn-based encounters with initiative and actions |
| Map | SVG spatial overview (floor-plan, region, or starmap) |
| Outcome | Narrative consequence of rolls/decisions |
| Level Up | Stat improvements and ability selection |
| Quests | Active objectives, clues, and quest progress |
| Save | Session persistence (save-codex module) |

---

## Visual Standards

- **Fonts and colours are defined by the active visual style.** Visual style files in
  `styles/` provide CSS custom properties consumed by all widgets. The structural
  reference (`styles/style-reference.md`) defines the contract that styles must fulfil.
- **Visual styles** are selectable per session — one `.md` file per theme (e.g., Terminal,
  Parchment, Neon, Gothic). The player chooses during game setup, or the GM auto-selects
  based on the scenario.
- **Dark mode:** All widgets use CSS variables; visual style files provide
  `@media (prefers-color-scheme: dark)` overrides where needed.
- **No emoji** — SVG icons and CSS shapes only
- **No text outside widgets** — every output is a `visualize:show_widget` call

---

## Adding Custom Mechanics

To use a custom rulebook:

1. Prepare a PDF or markdown document defining your mechanics
2. At game start, select "Custom" as the rulebook in settings
3. Provide the document when prompted
4. The GM reads and applies the custom rules throughout the session

Custom rulebooks must define at minimum:
- **Attributes:** What stats characters have and their value ranges
- **Resolution mechanic:** How uncertain actions are resolved (dice, cards, etc.)
- **Success criteria:** What constitutes success, failure, partial success
- **Character advancement:** How characters improve over time
