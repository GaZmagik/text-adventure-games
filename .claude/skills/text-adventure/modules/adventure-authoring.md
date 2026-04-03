# Adventure Authoring — The `.lore.md` File Format
> Module for text-adventure orchestrator. Loaded when the player uploads or pastes a `.lore.md`
> file, or when the GM is asked to create an adventure.

A `.lore.md` file is a structured adventure template that contains everything the GM needs to
run a multi-session adventure: world context, NPC roster, location atlas, story beats, encounter
tables, and loot tables. Authors — human or AI — craft these files offline. The GM reads the
`.lore.md` before the session, internalises the threads, and improvises within the framework
based on player choices. The adventure is a reference, not a script.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: story-architect,
core-systems, lore-codex, ai-npc, geo-map, procedural-world-gen (hybrid mode), save-codex.

---

## Architecture Overview

```
Author creates .lore.md (offline, any text editor)
        |
Player uploads / pastes .lore.md into session
        |
Adventure Authoring module parses the file:
  1. YAML frontmatter  -> metadata, modules, styles, seed, characters
  2. World History      -> gmState.worldHistory
  3. Location Atlas     -> geo-map entries (locked in lore-codex)
  4. NPC Roster         -> ai-npc profiles (locked in lore-codex)
  5. Story Spine        -> story-architect threads, foreshadowing, pacing
  6. Encounter Tables   -> per-location / per-act random encounter pools
  7. Loot and Rewards   -> item tables, quest rewards, merchant inventories
  8. Faction Dynamics   -> gmState.factions with shift rules
        |
GM initialises session in authored mode (or hybrid if seed present)
        |
Play begins at Act 1, Beat 1
```

The `.lore.md` file is consumed once at session start. After loading, the GM holds the full
adventure in context and improvises from it. The file is never shown to the player — what
they experience is a living world that happens to have been carefully designed.

---

## The YAML Frontmatter

Every `.lore.md` file begins with a YAML frontmatter block enclosed in `---` delimiters.
This block carries all machine-parseable metadata. The GM reads it first to determine which
modules to load, which styles to apply, and how the adventure is structured.

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `format` | string | Always `text-adventure-lore` — identifies the file type |
| `version` | integer | Lore format version (currently `1`) |
| `skill-version` | string | Minimum text-adventure skill version required |
| `title` | string | Adventure title |
| `author` | string | Author name |
| `theme` | string | Genre theme: `space`, `fantasy`, `horror`, `historical`, `post-apocalyptic`, etc. |
| `tone` | string | Narrative tone: `thriller`, `comedy`, `tragedy`, `mystery`, `epic`, `noir`, etc. |
| `acts` | integer | Number of acts (typically 3, but 1-5 supported) |
| `estimated-scenes` | string | Scene count range, e.g. `"15-20"` |
| `players` | string | Player count range, e.g. `"1-2"` |
| `difficulty` | string | `easy`, `moderate`, `hard`, or `brutal` |
| `required-modules` | list | Module names the adventure depends on |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `subtitle` | string | Tagline or series name |
| `episodes` | integer | Episode number within a series (default `1`) |
| `recommended-styles` | object | `output` (narrative style) and `visual` (CSS theme) |
| `seed` | string | World seed — if present, `procedural-world-gen` fills secondary content (hybrid mode) |
| `calendar-system` | string | Calendar name, e.g. `"Station Standard (24h, 365-day cycle)"` |
| `start-date` | string | In-world date when the adventure begins |
| `start-time` | string | In-world time when the adventure begins |
| `pre-generated-characters` | list | Ready-made characters the player can adopt |
| `optional-modules` | list | Modules that enhance but are not required |

### Pre-Generated Character Schema

Each entry in `pre-generated-characters` follows this structure:

```yaml
pre-generated-characters:
  - name: "Gareth Williams"
    class: Bartender
    stats: { STR: 10, DEX: 11, CON: 13, INT: 10, WIS: 15, CHA: 16 }
    hook: "A data chip appears under your bar counter with your name etched into it"
    background: "Thirty years on Freeport Meridian. You know every corridor, every regular, every secret."
    proficiencies: ["Insight", "Persuasion", "Investigation", "Performance"]
    starting-inventory:
      - { name: "Bar rag", type: "misc", effect: "Comfort item — +1 to composure checks" }
      - { name: "Master keycard — The Oxidiser", type: "key_item", effect: "Opens all Oxidiser doors" }
    starting-currency: 200
```

### Full Frontmatter Example — The Oxidiser Conspiracy

```yaml
---
format: text-adventure-lore
version: 1
skill-version: "1.0.0"

title: "The Oxidiser Conspiracy"
subtitle: "A Freeport Meridian Adventure"
author: "Gareth Williams"
theme: space
tone: thriller
acts: 3
episodes: 1
estimated-scenes: "15-20"
players: "1-2"
difficulty: moderate

recommended-styles:
  output: Sci-Fi-Narrator
  visual: station

seed: "pale-threshold-7"
rulebook: d20_system

calendar-system: "Station Standard (24h, 365-day cycle)"
start-date: "2347-03-15"
start-time: "2200 hours"

pre-generated-characters:
  - name: "Gareth Williams"
    class: Bartender
    stats: { STR: 10, DEX: 11, CON: 13, INT: 10, WIS: 15, CHA: 16 }
    hook: "A data chip appears under your bar counter with your name etched into it"
    background: >
      Thirty years on Freeport Meridian. You know every corridor, every regular,
      every secret. The Oxidiser is yours — not by deed, but by decades of presence.
      When people need something found, fixed, or forgotten, they come to your bar.
    proficiencies: ["Insight", "Persuasion", "Investigation", "Performance"]
    starting-inventory:
      - { name: "Bar rag", type: "misc", effect: "Comfort item" }
      - { name: "Master keycard — The Oxidiser", type: "key_item", effect: "Opens all Oxidiser doors" }
    starting-currency: 200

required-modules:
  - core-systems
  - story-architect
  - lore-codex
  - ai-npc
  - geo-map

optional-modules:
  - ship-systems
  - crew-manifest
  - star-chart
---
```

---

## Markdown Body Sections

The markdown body follows the frontmatter and is structured into named sections using `##`
headings. Each section maps to a specific module or GM subsystem. Sections may appear in any
order, but the recommended order matches the loading sequence below.

The GM parses these sections by heading name. Unrecognised sections are ignored gracefully —
authors may include notes, appendices, or designer commentary without breaking the parser.

---

## Section: World History

Maps to the world-history module (when available) and seeds `gmState.worldHistory`.

Define 3-5 epochs that shaped the world before the adventure begins. Each epoch establishes
a layer of history that NPCs reference, ruins commemorate, and factions dispute. The player
discovers this history through play — it is never delivered as exposition.

### Structure

```markdown
## World History

### Epoch 1 — The Founding (2280-2295)
- **Era:** Expansion
- **Key event:** Freeport Meridian constructed as a deep-space refuelling waypoint
- **Power structure:** Corporate charter — Meridian Corp holds governance rights
- **Legacy:** The original docking pylons still bear the Meridian Corp sigil, though
  half are decommissioned. Older residents remember when the corp kept the lights on.
- **Cultural detail:** "Founding Day" is still celebrated on Deck 1, though attendance
  has dwindled to a handful of loyalists and free-drink opportunists.

### Epoch 2 — The Sovereignty Crisis (2310-2318)
- **Era:** Conflict
- **Key event:** Station residents demanded self-governance after Meridian Corp
  cut life-support budgets to boost quarterly returns
- **Power structure:** Transitional council — elected from deck representatives
- **Legacy:** The council chambers on Deck 4 still have scorch marks from the
  standoff. The phrase "breathing tax" remains a bitter joke.
- **Cultural detail:** Deck representatives still wear a blue armband during council
  sessions — a tradition from the original protest movement.
```

### Rules

- **Each epoch must leave a visible trace.** Architecture, slang, faction grudges,
  memorial plaques, abandoned infrastructure — the player should be able to *see*
  history in the world without being told about it.
- **Epochs should conflict.** One faction's golden age is another's oppression. This
  creates NPC disagreements that feel organic rather than scripted.
- **The most recent epoch should be unstable.** The adventure takes place during a
  period of change — that is what makes it an adventure.
- **Do not write more than 5 epochs.** Diminishing returns. Three is often sufficient
  for a single-episode adventure.

---

## Section: Location Atlas

Maps to the geo-map module. Defines all locations the adventure uses — rooms, corridors,
outdoor areas, vehicles, and any space the player can visit.

### Location Entry Structure

```markdown
## Location Atlas

### The Oxidiser — Bar Floor
- **Type:** Interior, social hub
- **Description:** Twenty-three stools, nine booths, one battered pool table.
  Strip-lighting casts everything in amber. The bottles behind the bar are
  arranged by decade, not by spirit.
- **Atmosphere:** Recycled air, faintly metallic. Low hum of generators.
  Synth-hops from the jukebox. Warm despite the station's chill.
- **Exits:** Kitchen (west), Main corridor — Deck 7 (north), Back office
  (south, locked — requires Oxidiser master keycard)
- **NPCs present:** Renko (always), 1-3 patrons (variable, roll on Oxidiser
  Patron Table)
- **Secrets:** Maintenance hatch behind the jukebox (access panel 7-3C, leads
  to Deck 6-7 crawlways). Requires INT check DC 14 to notice, or automatic
  if the player has been told about it.
- **Hazards:** None (unless escalation tier >= 3, then security sweep risk)
- **Story relevance:** Act 1 hub — most early scenes begin or pass through here.
  Seren Voss first appears at Booth 7. The data chip is found under the bar.
```

### Required Fields Per Location

| Field | Description |
|-------|-------------|
| **Type** | Interior/exterior, purpose (social hub, transit, combat zone, etc.) |
| **Description** | 2-4 sentences of physical detail — what the player sees on entry |
| **Atmosphere** | At least 2 sensory details, at least one non-visual |
| **Exits** | Named connections to other locations, with lock conditions if any |

### Optional Fields Per Location

| Field | Description |
|-------|-------------|
| **NPCs present** | Who is here by default, and who appears conditionally |
| **Secrets** | Hidden details — require checks, items, or NPC information to discover |
| **Hazards** | Environmental dangers with DC and effect |
| **Story relevance** | Author's note on when/how this location matters (GM-only) |
| **Encounter override** | Specific encounter instead of rolling on the table |
| **Loot** | Fixed items found here (not random — use Loot Tables for random drops) |

### Rules

- **Every exit must be bidirectional.** If the Bar Floor connects north to the Main
  Corridor, the Main Corridor must list the Bar Floor as a south exit.
- **Locked exits must state their unlock condition.** Keycard, skill check, NPC
  permission, quest progress, or story beat.
- **Atmosphere entries must include at least one non-visual sense.** Sound, smell,
  temperature, or tactile detail. The GM pulls from these when writing scene prose.
- **Secrets should reward curiosity, not punish ignorance.** A secret passage is a
  bonus route, not the only route. Critical progression must never depend on finding
  a secret.

---

## Section: NPC Roster

Maps to the ai-npc module. Defines every named NPC in the adventure — their personality,
motivation, secrets, and mechanical profile. The GM uses these profiles to generate
authentic, consistent NPC behaviour throughout the adventure.

### NPC Entry Structure

```markdown
## NPC Roster

### Seren Voss — The Grey Coat Woman
- **Role:** Catalyst / quest giver
- **Species/Background:** Human, off-station. Expensive taste, real-gravity
  bearing — she grew up on a planet, not a station. Mid-forties, sharp eyes,
  no wasted movements.
- **Motivation:** Needs Gareth's station knowledge for an extraction operation.
  She cannot do this alone and she knows it.
- **Secret:** She is an intelligence operative for the Meridian Sovereignty
  Movement — the political descendants of the 2310 uprising.
- **Reveal condition:** Player reaches Act 2, or confronts her directly with
  evidence of her identity.
- **Arc:** Revelation -> reluctant trust -> possible betrayal or alliance
  (determined by player choices)
- **Disposition start:** Neutral-guarded
- **Speech pattern:** Precise, clipped, never wastes words. Uses silences as
  weapons. Avoids contractions. When uncomfortable, deflects with questions.
- **Stats:** STR 10, DEX 14, INT 16, WIS 13, CON 11, CHA 15
- **Faction:** Grey Network (hidden until revealed)
- **Location:** First appears at The Oxidiser, Booth 7 (Act 1, Scene 1).
  Moves to Deck 4 Council Chambers after Act 1.
- **Relationship triggers:**
  - Trust +10: Player agrees to help without demanding full disclosure
  - Trust +15: Player discovers her identity and keeps it secret
  - Trust -20: Player reports her to Station Authority
  - Trust -10: Player demands payment before helping

### Renko — The Regular
- **Role:** Informant / comic relief / canary
- **Species/Background:** Human, station-born. Dock worker, forty years on
  Meridian, knows everyone's business because nobody notices him listening.
- **Motivation:** Wants to keep his head down and his tab open. Will trade
  information for drinks or favours, but panics if things get dangerous.
- **Secret:** He saw the cargo transfer on Deck 3 last week. He knows
  exactly what was in those unmarked crates.
- **Reveal condition:** Player buys him three drinks, or player is at
  Trust 60+ with Renko, or player mentions Deck 3 cargo directly.
- **Arc:** Steadfast — Renko does not change, but he reveals depth.
  His loyalty is to the station itself, not to any faction.
- **Disposition start:** Friendly (he is a regular; he knows Gareth)
- **Speech pattern:** Rambling, self-interrupting, trails off when nervous.
  Starts sentences with "Look, I am not saying..." then says exactly the
  thing. Heavy station dialect.
- **Stats:** STR 9, DEX 10, INT 12, WIS 14, CON 10, CHA 11
- **Faction:** None (civilian)
- **Location:** The Oxidiser, Bar Floor (always, unless escalation tier >= 3)
```

### Required Fields Per NPC

| Field | Description |
|-------|-------------|
| **Role** | Narrative function: catalyst, ally, antagonist, informant, wildcard, vendor |
| **Motivation** | What they want — drives all their behaviour |
| **Disposition start** | Starting stance toward the player |
| **Speech pattern** | How they talk — diction, rhythm, verbal tics, vocabulary level |

### Optional but Recommended Fields

| Field | Description |
|-------|-------------|
| **Secret** | Information they hold back — with reveal condition |
| **Arc** | Character trajectory archetype (see story-architect NPC Arc Archetypes) |
| **Stats** | Mechanical profile for combat or contested checks |
| **Faction** | Allegiance — may be hidden |
| **Location** | Default location and movement triggers |
| **Relationship triggers** | Specific actions that shift trust score |

### Rules

- **Every NPC must have a motivation.** Not a backstory dump — a present-tense want.
  "Wants to protect her brother" not "Was born in the outer colonies and..."
- **Speech patterns must be distinct.** No two NPCs should sound alike. If you can
  swap their dialogue and nobody notices, the patterns are too similar.
- **Secrets must have reveal conditions.** The player earns information through action,
  not through the GM deciding it is time.
- **Do not write dialogue.** Write motivations, patterns, and secrets. The GM generates
  dialogue in the moment, informed by these profiles.

---

## Section: Story Spine

Maps to the story-architect module. Defines the act-by-act narrative structure — the beats
the adventure is designed around, the decision points that create branching, and the
consequences that ripple forward.

The story spine is a framework, not a script. It defines what *could* happen, not what
*will* happen. The GM uses it to understand the author's intent and improvise toward
dramatically satisfying outcomes regardless of player choices.

### Structure

```markdown
## Story Spine

### Act 1 — The Hook (Scenes 1-5)
**Tension range:** 2-5
**Goal:** Establish the world, introduce the mystery, give the player a reason to act.

#### Beat 1: The Chip Beneath the Glass (Scene 1)
- **Type:** Discovery
- **Setup:** During a routine evening shift, Gareth finds a data chip wedged
  beneath the bar counter. His name is etched into the casing. Seren Voss is
  watching from Booth 7.
- **Decision point:** What to do with the chip
  - Open the chip -> encrypted message, raises stakes immediately
  - Confront the woman at Booth 7 -> tense social encounter, she tests the player
  - Investigate the crawlway maintenance hatch -> physical exploration, finds evidence
  - Call Station Security -> introduces ally NPC, but tips off the antagonist
- **Consequences:** Each choice opens a different Act 1 path but all converge
  at Beat 3
- **Foreshadowing planted:** The maintenance hatch, the hooded figure outside,
  Renko's nervous glances toward Deck 3

#### Beat 2: First Contact (Scenes 2-3)
- **Type:** Varies by player choice in Beat 1
- **Branches:**
  - If opened chip: Encrypted message contains partial cargo manifest and a
    location — Deck 3, Bay 7. Player must decide whether to go alone or
    seek help.
  - If confronted Voss: She deflects, tests the player's discretion. Offers
    cryptic warning about "watching the cargo doors." Social encounter with
    Conviction Meter (3 segments).
  - If investigated crawlway: Finds boot prints, a dropped security badge
    (not station-issue), and a clear line of sight to Deck 3 cargo bay.
  - If called security: Officer Tomas arrives. Sympathetic but by-the-book.
    Reveals recent cargo discrepancies in passing. Antagonist learns someone
    is asking questions.
- **Convergence:** All paths lead to the player knowing something is wrong
  with Deck 3 cargo operations.

### Act 2 — The Escalation (Scenes 6-12)
**Tension range:** 4-8
**Goal:** Deepen the mystery, force difficult choices, deliver the reversal.

#### Beat 4: The Reversal (Scene 9-10)
- **Type:** Revelation
- **Setup:** The cargo discrepancy is not smuggling — it is a cover for
  evacuating political refugees from Meridian Corp's crackdown on the
  Sovereignty Movement. The player's investigation has drawn attention
  to the very operation they might want to protect.
- **Decision point:** What to do with this knowledge
  - Help the evacuation -> ally with the Grey Network, antagonise Station Authority
  - Report to Station Authority -> ally with Authority, betray Voss and the refugees
  - Play both sides -> highest risk, highest reward, requires CHA checks
  - Walk away -> the operation collapses without help, consequences follow the player
- **Consequences:** This decision shapes the entire third act. Every NPC
  reacts to it. Faction standings shift dramatically.
```

### Required Fields Per Beat

| Field | Description |
|-------|-------------|
| **Type** | `discovery`, `confrontation`, `revelation`, `chase`, `social`, `combat`, `quiet` |
| **Setup** | What the player walks into — situation, not script |
| **Decision point** | The meaningful choice, with at least 2 viable options |

### Optional but Recommended Fields

| Field | Description |
|-------|-------------|
| **Branches** | How prior choices alter this beat |
| **Consequences** | What each choice sets in motion |
| **Foreshadowing planted** | Seeds for later payoff |
| **Convergence** | How divergent paths rejoin (if they do) |

### Rules

- **Every beat must have a decision point.** If there is no meaningful choice, it is
  not a beat — it is flavour. Fold it into an adjacent beat.
- **Every decision point must have at least 2 viable paths.** Viable means the path
  advances the story. A dead end is not a viable path.
- **Beats are not scenes.** A beat may span 1-3 scenes. Scenes are pacing units;
  beats are structural units.
- **The Act 2 reversal is mandatory.** Something the player believed turns out to be
  wrong, incomplete, or more complicated than expected. This is the structural hinge
  of the adventure.
- **Convergence is encouraged but not required.** Parallel paths that never rejoin
  create replayability but demand more authoring effort.

---

## Section: Encounter Tables

Random or conditional encounters per location, per act, or per escalation tier. The GM
rolls on these tables when the player enters a location or when narrative pacing calls for
an interruption.

### Structure

```markdown
## Encounter Tables

### The Oxidiser — Random Patrons (d6)
1. Nervous courier, checking the door every 30 seconds
2. Off-duty security officer, drinking alone, talkative
3. Two merchants arguing about shipping tariffs
4. A child looking for a parent (should not be in a bar at this hour)
5. A regular who has not been seen in weeks, acting strangely
6. Nobody new — eerily quiet night

### Deck 3 Cargo Bay — Encounters by Escalation Tier

#### Tier 1 — Quiet (d4)
1. Empty — distant hum of cargo lifts
2. Dock worker on break, willing to chat
3. Automated cargo drone, scanning crates
4. Stray maintenance bot, sparking and confused

#### Tier 2 — Alert (d4)
1. Security patrol (2 officers), checking manifests
2. Grey Network operative, pretending to be a dock worker
3. Locked-down cargo lift — requires keycard or INT DC 14 to bypass
4. Station Authority drone conducting surveillance sweep

#### Tier 3 — Hostile (d4)
1. Armed security team (3 officers), shoot-on-sight orders
2. Grey Network extraction team, mistaking the player for Authority
3. Environmental hazard — coolant leak, STR DC 12 or Poisoned
4. Antagonist's enforcer, here to clean up loose ends
```

### Rules

- **Six entries per table maximum.** The GM improvises details — the table provides
  a seed, not a screenplay.
- **At least one social and one empty result per table.** Not every encounter is combat.
  Quiet moments are encounters too.
- **Escalation-tiered tables are optional but powerful.** They make the world feel
  responsive to the player's actions without the author scripting every reaction.
- **Encounter tables supplement, not replace, story beats.** A beat may specify a fixed
  encounter; tables handle the spaces between beats.

---

## Section: Loot and Rewards

Item tables, quest rewards, currency payouts, and merchant inventories. Maps to the
core-systems inventory and economy subsystems.

### Structure

```markdown
## Loot and Rewards

### Act 1 Rewards
- **Completing the chip mystery:** 50 XP, data chip contents (key item),
  Seren Voss as contact
- **Crawlway exploration:** 25 XP, maintenance access code (reusable),
  evidence photos (key item)
- **Helping Officer Tomas:** 30 XP, Station Authority trust +10,
  security frequency access

### Act 2 Rewards
- **Discovering the reversal truth:** 75 XP, moral dilemma (no mechanical
  reward — the reward is knowledge)
- **Completing the Deck 3 investigation:** 100 XP, choice of Grey Network
  or Station Authority alliance

### Merchant Inventory — Vex's Salvage Emporium (Deck 5)

| Item | Type | Tier | Price | Effect |
|------|------|------|-------|--------|
| Stim Pack | Consumable | 1 | 25 cr | Restore 2d6 HP |
| Signal Jammer | Gear | 2 | 80 cr | +2 Stealth near electronics |
| Patched Enviro-Suit | Armour | 2 | 150 cr | +2 AC, resist vacuum (1 scene) |
| Forged Security Badge | Gear | 3 | 300 cr | Bypass Tier 1 security checks |
| EMP Grenade | Consumable | 3 | 200 cr | Disable electronics in area, 2 rounds |

### Random Loot — Cargo Crates (d6)
1. Empty — already looted
2. Ration packs (3) — 5 cr each, +1 CON next roll
3. Maintenance toolkit — +2 to repair checks
4. Unmarked data chip — key item for side quest
5. Medical supplies — 1 Stim Pack + 1 antidote
6. Contraband — valuable (150 cr) but illegal to carry openly
```

### Rules

- **XP rewards should follow the core-systems XP Awards table.** Quest completions
  award 100 XP; minor discoveries award 25-30 XP; combat awards 50 XP.
- **Not every reward is mechanical.** Information, alliances, and access are rewards.
  State them explicitly so the GM delivers them.
- **Merchant inventories should be thematic.** A salvage shop sells salvage, not
  military-grade weapons. Location and NPC personality constrain stock.
- **Tier and price must follow core-systems pricing rules.** Tier 1: 10-50 cr,
  Tier 2: 50-200 cr, Tier 3: 200-500 cr, Tier 4: 500+ cr.

---

## Section: Faction Dynamics

Starting faction standings and the rules governing how they shift. Maps to
`gmState.factions` in core-systems.

### Structure

```markdown
## Faction Dynamics

### Station Authority
- **Starting disposition:** Neutral (0)
- **Ideology:** Order through procedure. The station runs on rules.
- **Shifts positive if:** Player cooperates with security, reports suspicious
  activity, assists Officer Tomas
- **Shifts negative if:** Player breaks into restricted areas, harbours
  fugitives, assaults security personnel
- **At +50 (Allied):** Authority provides backup on request, access to
  restricted areas, Officer Tomas becomes a reliable ally
- **At -50 (Hostile):** Wanted status, security patrols actively search for
  the player, merchants refuse service, safe locations shrink

### The Grey Network (Seren's people)
- **Starting disposition:** Unknown (--)
- **Ideology:** Freedom through action. The Sovereignty Movement reborn.
- **Revealed when:** Player engages with Seren's mission or discovers the
  cargo operation independently
- **Shifts positive if:** Player aids the evacuation, keeps Grey Network
  secrets, trusts Seren
- **Shifts negative if:** Player reports the operation, betrays Seren's
  identity, sides openly with Authority
- **At +50 (Allied):** Access to Grey Network safe houses, intelligence on
  Authority movements, extraction support in Act 3
- **At -50 (Hostile):** Grey Network operatives treat the player as a threat,
  Seren becomes an antagonist, evacuation routes close

### Linked Factions
- Station Authority and The Grey Network are **opposed**. Gaining +20 with
  one imposes -10 on the other. This linkage is not absolute — a skilled
  player can maintain both above neutral through careful choices, but it
  requires effort and deception.
```

### Required Fields Per Faction

| Field | Description |
|-------|-------------|
| **Starting disposition** | Numeric value and label |
| **Shifts positive if** | Actions that increase standing |
| **Shifts negative if** | Actions that decrease standing |

### Optional but Recommended Fields

| Field | Description |
|-------|-------------|
| **Ideology** | One-sentence belief statement — drives NPC behaviour |
| **At +50 / -50** | Concrete gameplay effects at extreme standings |
| **Linked factions** | Opposing or allied faction relationships with shift ratios |
| **Revealed when** | For hidden factions — the condition that makes them visible |

---

## Loading a .lore.md File

When the player uploads or pastes a `.lore.md` file, the GM follows this protocol:

### Step 1 — Parse and Validate

1. Extract YAML frontmatter between `---` delimiters.
2. Validate `format: text-adventure-lore` is present.
3. Check `skill-version` compatibility against the current skill version.
4. If validation fails, inform the player with the specific error.

### Step 2 — Configure Session

1. Set `gmState.loreFile` to the adventure title (stored in saves for reference).
2. Set session mode to **authored** (or **hybrid** if `seed` is present in frontmatter).
3. Load all `required-modules` using the orchestrator's loading protocol.
4. Offer `optional-modules` as toggleable in the Game Settings widget.
5. Apply `recommended-styles` if the player does not override them.

### Step 3 — Populate World State

1. **World History** -> `gmState.worldHistory` (epochs array).
2. **Location Atlas** -> geo-map room graph. Each location becomes a room node with
   connections derived from the Exits field. Populate `gmState.mapState`.
3. **NPC Roster** -> ai-npc profile objects. Each NPC is expanded into a full NPC
   definition using the profile fields. Store in `gmState.npcProfiles`.
4. **Story Spine** -> story-architect structures:
   - Each beat becomes a seeded story thread in `gmState.storyArchitect.storyThreads`.
   - Foreshadowing entries become seeds in `gmState.storyArchitect.foreshadowing`.
   - Act structure populates `gmState.storyArchitect.pacing` (tension ranges,
     complication budget derived from act count).
   - NPC arcs populate `gmState.storyArchitect.npcArcs`.
5. **Faction Dynamics** -> `gmState.factions` with starting values. Store shift rules
   in `gmState.factionRules` for the GM to consult during play.
6. **Encounter Tables** -> `gmState.encounterTables` keyed by location and tier.
7. **Loot and Rewards** -> `gmState.lootTables` and `gmState.rewardSchedule`.

### Step 4 — Seed the Lore Codex

All locations, NPCs, factions, and key items from the `.lore.md` are added to the
lore-codex in **locked** state. The player discovers them through play — exploring a
location unlocks its codex entry, meeting an NPC unlocks theirs, and so on.

Secrets within NPC entries are added as redacted sub-entries, unlocked only when their
reveal conditions are met.

### Step 5 — Set Calendar and Time

1. Set `gmState.time.calendar` from `calendar-system`.
2. Set `gmState.time.date` from `start-date`.
3. Set `gmState.time.period` derived from `start-time` (or the closest time period).

### Step 6 — Character Creation

1. If `pre-generated-characters` are present, offer them alongside "Create your own"
   in the character creation widget.
2. Pre-generated characters use the stats, proficiencies, inventory, and currency
   from their definition. The hook text is shown as flavour during selection.
3. If the player chooses "Create your own," standard character creation proceeds
   with the adventure's theme applied.

### Step 7 — Begin Play

Begin at Act 1, Beat 1. The GM renders the opening scene using the first beat's setup,
the starting location's atmosphere, and any NPCs marked as present.

---

## Authoring a .lore.md File

The GM can also be asked to CREATE a `.lore.md` file from scratch. This is the generative
flow — the inverse of loading.

### Step 1 — Gather Requirements

Ask the player for:
- **Theme** — genre and setting (required)
- **Tone** — narrative feel (required)
- **Number of acts** — scope of the adventure (default: 3)
- **Estimated length** — number of sessions or scenes (default: 15-20 scenes)
- **Specific ideas** — any concepts, characters, or situations they want included
- **Player count** — how many characters (default: 1)

### Step 2 — Generate World History

Create 3-5 epochs following the World History section rules. Each epoch must:
- Leave a visible trace in the world
- Create at least one faction grudge or cultural artefact
- Connect to the adventure's central conflict in some way

### Step 3 — Design the NPC Roster

Create NPCs to fill these narrative roles:
- **Catalyst** — the NPC who sets events in motion (1 required)
- **Antagonist** — the opposing force, which may be a person, faction, or system (1 required)
- **Ally** — a potential helper with their own agenda (1-2 recommended)
- **Informant** — someone who trades information (1 recommended)
- **Wildcard** — an NPC whose allegiance is genuinely uncertain (0-1 recommended)

Each NPC must have a unique speech pattern and a motivation independent of the player.

### Step 4 — Build the Location Atlas

Create locations to support the story spine:
- **Hub** — where the player starts and returns to (1 required)
- **Investigation sites** — where clues and evidence are found (2-4)
- **Confrontation spaces** — where key encounters happen (1-2)
- **Secret locations** — discovered through play, not given (1-2)
- **Transit routes** — corridors, streets, or paths connecting areas (as needed)

Every location must connect to at least one other location. No orphan nodes.

### Step 5 — Craft the Story Spine

Build the act structure with branching decision points:
- **Act 1** — 3-5 beats, tension 2-5, goal: hook the player
- **Act 2** — 4-6 beats, tension 4-8, goal: escalate and reverse
- **Act 3** — 3-4 beats, tension 6-10 then 3-4, goal: climax and resolve

The Act 2 reversal is mandatory. Every decision point needs at least 2 viable paths.

### Step 6 — Create Tables

- Encounter tables: 1 per major location, d6 entries, escalation-tiered where appropriate
- Loot tables: Per-act rewards, 1-2 merchant inventories, 1 random loot table
- Reward schedule: XP and item rewards for each major quest milestone

### Step 7 — Compile and Present

Assemble everything into a single `.lore.md` file following the format defined in this
module. Present the file to the player for download.

The player can then use the `.lore.md` file in any future session — upload it, and the
adventure loads from scratch with a fresh state.

---

## Hybrid Mode — Authored Spine with Procedural Flesh

When a `.lore.md` file includes a `seed` field in the frontmatter, the adventure runs in
**hybrid mode**. The authored content provides the story spine, key NPCs, and critical
locations. The `procedural-world-gen` module fills in secondary content:

| Layer | Source |
|-------|--------|
| Main plot beats | `.lore.md` Story Spine |
| Key NPCs (named, with arcs) | `.lore.md` NPC Roster |
| Critical locations | `.lore.md` Location Atlas |
| Side encounters | `procedural-world-gen` from seed |
| Ambient NPCs (unnamed, background) | `procedural-world-gen` from seed |
| Side locations (optional exploration) | `procedural-world-gen` from seed |
| Random loot in non-critical areas | `procedural-world-gen` from seed |

**Conflict resolution:** Authored content always takes priority. If the seed generates an
NPC with the same name as an authored NPC, the authored version wins. If the seed generates
a room that overlaps with an authored location, the authored version wins.

**Codex seeding:** In hybrid mode, the lore-codex receives entries from both sources.
Hand-written entries from the `.lore.md` are marked as `source: authored` and are never
overwritten by generated entries.

---

## Relationship to Other Modules

| Module | What `.lore.md` provides to it |
|--------|--------------------------------|
| story-architect | Pre-seeded story threads, foreshadowing registry, NPC arcs, pacing structure |
| core-systems | Starting faction standings, economy state, quest seeds, reward schedule |
| lore-codex | All discoverable entries in locked state (locations, NPCs, factions, items) |
| ai-npc | NPC personality profiles, speech patterns, secrets, reveal conditions |
| geo-map | Location descriptions, exits, hazards, secrets, atmosphere details |
| procedural-world-gen | World seed for hybrid mode — authored spine + procedural flesh |
| save-codex | The `.lore.md` filename is stored in the save's `game-title` field |

---

## gmState Fields

The Adventure Authoring module adds the following fields to `gmState`:

<!-- CLI implementation detail — do not hand-code -->
```js
gmState: {
  // ...existing fields...
  loreFile: "The Oxidiser Conspiracy",  // adventure title from frontmatter
  loreVersion: 1,                        // format version
  sessionMode: "authored",               // "authored" | "hybrid" | "procedural"
  worldHistory: [
    {
      epoch: 1,
      name: "The Founding",
      era: "Expansion",
      dateRange: "2280-2295",
      keyEvent: "Freeport Meridian constructed...",
      powerStructure: "Corporate charter...",
      legacy: "The original docking pylons...",
      culturalDetail: "Founding Day is still celebrated..."
    }
  ],
  npcProfiles: [],          // expanded NPC definition objects from the roster
  encounterTables: {},      // keyed by location ID and escalation tier
  lootTables: {},           // random loot tables keyed by location or act
  rewardSchedule: [],       // per-beat reward definitions
  factionRules: {},         // shift conditions per faction (GM reference)
};
```

### World Flag Prefix

The Adventure Authoring module uses prefix `lore_` for flags it sets directly:
- `lore_loaded` — set to `true` when a `.lore.md` file is successfully parsed
- `lore_act_{n}_started` — set when an act begins
- `lore_beat_{id}_reached` — set when the player reaches a specific beat
- `lore_npc_{name}_revealed` — set when a hidden NPC's true nature is uncovered

---

## Anti-Patterns

- **Do not railroad.** The story spine defines beats, not scripts. If the player goes
  off-book, the GM adapts using NPC motivations and faction dynamics. The authored
  content is a safety net, not a cage.
- **Do not reveal everything in Act 1.** The `.lore.md` knows the full truth. The player
  discovers it gradually. The GM must respect reveal conditions and never volunteer
  information the player has not earned.
- **Do not lock critical progression behind a single path.** Every decision point must
  have at least 2 viable paths that advance the story. If the player misses a clue,
  the GM finds another way to surface the information through a different NPC, location,
  or event.
- **Do not write dialogue.** Write motivations, speech patterns, and secrets. The GM
  generates dialogue in the moment, informed by the NPC profile. Pre-written dialogue
  sounds pre-written — the player can tell.
- **Do not over-specify random encounters.** Six entries per table is sufficient. The GM
  improvises details, adapts to the current tension level, and ensures variety. A table
  with twenty entries is a reference book, not a game tool.
- **Do not duplicate module data.** The `.lore.md` provides source data that modules
  consume. It does not redefine how modules work — that is the module's responsibility.
  If the `.lore.md` specifies an NPC, the ai-npc module handles how that NPC behaves
  in conversation.
- **Do not embed save data in a `.lore.md` file.** The `.lore.md` is a template, not a
  session record. Session state belongs in `.save.md` files. The two formats are
  complementary — `.lore.md` defines the adventure, `.save.md` records progress through it.
- **Do not use contractions in example `sendPrompt()` strings.** Apostrophes in prompt
  strings can break HTML attribute escaping silently (see gotcha in memory).
