# Adventure Exporting — World-Sharing via `.lore.md` Export
> Module for text-adventure orchestrator. Loaded on demand — when the player requests a world
> export, or when the GM offers it at a milestone.

A live game's world is a living thing — shaped by player choices, NPC deaths, faction shifts,
and consequences that have rippled through dozens of scenes. Adventure Exporting captures that
world as a `.lore.md` file that another player can use to start their own adventure in the
same world. It is world-sharing, not save-sharing. The exported file contains the world state
but strips the player's character so a new player creates their own.

**Export vs Save:**
- `.save.md` = continue MY character in MY game (save-codex module)
- Exported `.lore.md` = share MY WORLD for SOMEONE ELSE to play a new character in

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: adventure-authoring
(target format), save-codex (download mechanism), story-architect (thread conversion),
world-history (epoch extraction), core-systems (faction/quest state), lore-codex (codex
entries), ai-npc (NPC roster), geo-map (location atlas), bestiary (encounter generation),
procedural-world-gen (seed preservation).

---

## Architecture Overview

```
Player requests world export (or GM offers at milestone)
        |
Export eligibility check — not mid-combat, not mid-dialogue
        |
Snapshot gmState
        |
Serialisation pipeline:
  1. World history         -> .lore.md World History section
  2. NPC roster            -> .lore.md NPC Roster section (ALL secrets retained)
  3. Location atlas        -> .lore.md Location Atlas section (discovery states reset)
  4. Story threads         -> .lore.md Story Spine (resolved -> history, active -> seeds)
  5. Faction dynamics      -> .lore.md Faction Dynamics section (current as starting state)
  6. Encounter tables      -> .lore.md Encounter Tables section (from bestiary state)
  7. Previous Adventurer   -> .lore.md World History addendum + NPC Roster entry
  8. Calendar and date     -> frontmatter start-date / start-time
  9. YAML frontmatter      -> export metadata
        |
Compile markdown body
        |
Present export widget with preview and export button
        |
Export via sendPrompt (asks Claude to generate .lore.md artifact)
        |
Fallback (sendPrompt unavailable): display .lore.md content inline as copyable text
```

The exported `.lore.md` file conforms fully to the adventure-authoring module's format. Any
GM that can load a `.lore.md` can load an exported one — the `exported: true` frontmatter
field is metadata, not a format divergence.

---

## What Gets Exported

Everything the GM needs to run the world for a new player. The export is a complete GM
briefing — the new player never sees the `.lore.md` contents. They experience the world
through play.

| Source | What is exported | Transformation |
|--------|-----------------|----------------|
| `gmState.worldHistory` | Epochs, power structures, past conflicts, cultural layer | Direct copy + new entries from resolved threads |
| `gmState.rosterMutations` / ai-npc roster | All NPCs with current state | Dispositions, secrets (ALL — revealed and unrevealed), alive/dead status preserved |
| `gmState.mapState` / geo-map | All locations (discovered and undiscovered) | Current physical state preserved (damage, changes, items); discovery states reset to undiscovered |
| `gmState.storyArchitect.storyThreads` | All story threads | Resolved -> world history events; Active/Escalating -> seeded threads; Dormant -> dormant; Abandoned -> removed |
| `gmState.factions` | All faction standings | Current standings become the starting state for the new player |
| Bestiary module state | Current creature pool | Encounter tables generated from the bestiary's active creature set |
| `gmState.time` | Calendar and current date | Export date becomes the new adventure's start date |
| `gmState.worldFlags` | All permanent world consequences | Preserved as starting world state — bridges stay destroyed, alliances persist |

## What Gets Stripped

Everything specific to the original player's personal experience.

| Source | What is stripped | Reason |
|--------|-----------------|--------|
| `gmState.character` | Player character stats, name, class, background | New player creates their own character |
| `gmState.character.inventory` | All equipment and items | New player starts fresh |
| `gmState.quests` | Player's quest log | Resolved quests become world history; active quests become available story threads |
| `gmState.visitedRooms` | Player's exploration history | All rooms reset to undiscovered for fog of war |
| `gmState.rollHistory` | All dice roll records | Cosmetic — not relevant to the new world |
| `gmState.codex` (discovery states) | Player's codex progress | All entries reset to locked — new player discovers through play |

## What Gets Added

The original player's adventure becomes part of the world's history.

| Addition | Purpose |
|----------|---------|
| **Previous Adventurer entry** | Original player's character becomes a historical figure or NPC in the world |
| **Consequences of the First Adventure** | World flags set by the original player become permanent features of the exported world |
| **Post-adventure epoch** | If the original adventure resolved a major conflict, a new epoch entry is created |

---

## Export Triggers

### When to Offer Export

The GM may offer an export at natural pause points:

- **After completing a major story arc** — Act 1, Act 2, or the full adventure. The arc
  resolution creates a clean world state worth sharing.
- **When the player explicitly asks** — "Can I share this world?" or "Export my world" or
  similar phrasing.
- **At natural pause points** — before a time skip, after a climactic battle, at the end of
  a session where the world has changed significantly.
- **After the adventure concludes** — the denouement scene is complete, consequences have
  settled, and the world has reached a new equilibrium.

### When to Block Export

- **Mid-combat.** World state is unstable — HP values, conditions, and positioning are in
  flux. The export would capture an inconsistent snapshot.
- **Mid-dialogue.** NPC dispositions and trust values may be in the process of shifting.
  Conviction meters are partially filled. Wait for the conversation to conclude.
- **During active resolution.** If a die roll has been declared but not resolved, or an
  outcome widget is pending, the world state is incomplete.

The GM checks `gmState.exportState.available` before presenting the export option. This flag
is set to `false` during combat, dialogue, and active resolution sequences, and `true` at all
other times.

---

## Export Process — Step by Step

### Step 1 — Snapshot gmState

Capture a frozen copy of the entire `gmState` at the moment of export. All subsequent steps
operate on this snapshot, not on the live state — the game continues unaffected by the export
process.

<!-- CLI implementation detail — do not hand-code -->
```js
const exportSnapshot = JSON.parse(JSON.stringify(gmState));
```

### Step 2 — Extract World History

Copy `exportSnapshot.worldHistory` directly into the `.lore.md` World History section. This
includes all epochs, power structures, past conflicts, and the cultural layer.

If the original adventure resolved a major conflict (any story thread with `type: "main"` and
`status: "resolved"`), create a new epoch entry:

<!-- CLI implementation detail — do not hand-code -->
```js
const newEpoch = {
  id: generateEpochId(exportSnapshot),
  name: deriveEpochName(resolvedMainThread),
  timeframe: exportSnapshot.time.date + " (recent)",
  definingEvent: resolvedMainThread.resolution,
  consequences: deriveConsequences(exportSnapshot.worldFlags, resolvedMainThread),
  survivors: deriveSurvivors(exportSnapshot.factions, exportSnapshot.npcProfiles),
  artifacts: deriveArtifacts(exportSnapshot.worldFlags),
  publicKnowledge: true,
  contested: false,
  contestedVersions: [],
};
```

Append this epoch to the epochs array as the most recent entry. It becomes part of the
world's history for the new player.

### Step 3 — Extract NPC Roster

Export every NPC from the roster with their **current** state:

- **Alive NPCs:** Export with current disposition, trust level, location, and all secrets —
  both revealed and unrevealed.
- **Dead NPCs:** Export with `alive: false` and cause of death. They become historical
  figures referenced by surviving NPCs.
- **NPC secrets:** Include ALL secrets, including those the original player never discovered.
  The `.lore.md` is a GM document. The new GM (Claude) needs complete information to run the
  world properly. The new player will not see the file — they discover secrets through play.

For each NPC, update their profile to reflect the passage of the original adventure:

```markdown
### Seren Voss — The Grey Coat Woman
- **Role:** Catalyst / quest giver
- **Disposition start:** Friendly (was Neutral-guarded; shifted through events of the
  previous adventure)
- **History with previous adventurer:** Worked alongside Gareth Williams during the
  Oxidiser Conspiracy. Trusts people who have earned it through action. References
  "the bartender" occasionally — a mark of respect.
- **Secret:** She is an intelligence operative for the Meridian Sovereignty Movement.
  [Previously revealed to Gareth Williams — she may reference this openly if the new
  player earns similar trust.]
- **Secret:** She has a second extraction route through the Level 4 maintenance
  crawlways. [Never discovered — fully hidden for the new player.]
```

### Step 4 — Extract Location Atlas

Export all locations from `gmState.mapState` — both discovered and undiscovered by the
original player. For each location:

- **Physical state is preserved.** If the original player blew up a bridge, the bridge is
  still destroyed. If they unlocked a door permanently, it stays unlocked. If an area was
  damaged in combat, the damage persists. World flags determine physical state.
- **Discovery states are reset.** Every location becomes undiscovered for the new player.
  Fog of war resets completely.
- **Items and loot are preserved.** Fixed items that were not taken by the original player
  remain. Items that were taken are gone — the world remembers what was removed.
- **NPC presence is updated.** NPCs who moved during the original adventure are placed at
  their current locations. Dead NPCs are removed from location presence lists.

```markdown
### The Oxidiser — Bar Floor
- **Type:** Interior, social hub
- **Description:** Twenty-three stools, nine booths, one battered pool table. The sign
  outside has been re-painted — the old name is the same, but the lettering is sharper
  than it used to be. A photograph behind the bar shows a man who is no longer here.
- **Atmosphere:** Recycled air, faintly metallic. The jukebox plays synth-hops.
  Warm despite the station's chill. Quieter than it used to be.
- **Exits:** Kitchen (west), Main corridor — Deck 7 (north), Back office (south,
  unlocked — the previous owner left it open)
- **NPCs present:** Renko (always), new bartender (variable)
- **Story relevance:** Hub location. The previous adventurer's base of operations —
  regulars may reference "the old bartender" in passing.
```

### Step 5 — Convert Story Threads

Transform `gmState.storyArchitect.storyThreads` according to their status:

| Original status | Export transformation |
|-----------------|---------------------|
| **resolved** | Becomes a "past conflict" entry in World History. Resolution recorded as a world event. Connected NPC arcs updated to reflect the outcome. |
| **active** | Becomes a **seeded** thread in the Story Spine. The new player can discover and engage with it. Decision points reset — the new player makes their own choices. |
| **escalating** | Becomes a **seeded** thread with higher priority. The escalation context is preserved as narrative setup — "tensions have been rising since..." |
| **dormant** | Stays **dormant**. The reactivation condition is preserved. |
| **abandoned** | Removed from the Story Spine. Passive effects persist through world flags but the thread itself is not offered to the new player. |
| **seeded** (never engaged) | Preserved as **seeded**. Identical to the original — the new player encounters it fresh. |
| **climaxing** / **resolving** | Treated as **active** for export purposes — the climax is reset so the new player can experience it. Context from the original escalation is preserved as setup. |

Foreshadowing entries are regenerated from the converted threads. Paid-off foreshadowing is
removed (the payoff already happened). Planted and reinforced foreshadowing is preserved for
the new player to encounter.

Consequence chains are evaluated: delivered consequences become world state (already captured
in world flags). Undelivered consequences with trigger conditions that are still possible are
preserved as delayed effects in the new story threads.

### Step 6 — Extract Faction Dynamics

Export `gmState.factions` with current standings as the new starting state:

```markdown
## Faction Dynamics

### Station Authority
- **Starting disposition:** Friendly (+35)
- **Context:** The previous adventurer cooperated extensively with Station Authority
  during the Oxidiser Conspiracy. Officer Tomas remembers and speaks well of outside
  help. New arrivals may benefit from residual goodwill — or may find Authority
  expectations higher than usual.
- **Shifts positive if:** [standard rules preserved]
- **Shifts negative if:** [standard rules preserved]
```

Faction shift rules are preserved from the original adventure-authoring data or generated
from the current game state. Linked faction relationships are maintained.

### Step 7 — Transform Player into Historical NPC

The original player's character becomes part of the world's history. This is the core
transformation that makes exported worlds feel lived-in.

#### The Previous Adventurer Entry

Build a World History addendum and an NPC Roster entry from the original player's character:

**World History — Previous Adventurer section:**

```markdown
## Previous Adventurer

### Gareth Williams — The Bartender Who Uncovered the Conspiracy

A bartender on Freeport Meridian for thirty years, Gareth Williams stumbled into the
Oxidiser Conspiracy when a data chip appeared beneath his bar counter. Over the course
of twelve scenes, he uncovered the cargo manifest discrepancy, allied with Station
Authority, confronted Seren Voss, and ultimately helped expose the Consortium's bond
arrangement.

**Major decisions:**
- Allied with Station Authority over the Grey Network
- Revealed the bond documentation to Inspector Torr
- Spared Renko when he was caught passing information
- Destroyed the false manifest rather than using it as leverage

**Fate:** Left Freeport Meridian after the conspiracy unravelled. The Oxidiser bar
passed to a new owner. Regulars still mention him — "the old bartender" — with the
particular warmth reserved for someone who did the right thing and paid for it.

**World impact:**
- Station Authority standing: +35 (residual goodwill)
- Grey Network standing: -20 (Voss considers him a necessary loss)
- The bond documentation is now semi-public knowledge
- The Oxidiser's back office is unlocked (he left the master keycard behind)
```

**NPC Roster — Previous Adventurer as historical figure:**

The previous adventurer does NOT become an active NPC that the new player can interact with
(unless they are still physically present in the world — see Fate below). They become a
historical reference — someone NPCs mention, whose decisions shaped the world, but who is
not available for conversation.

**Fate determination:**
- If the adventure concluded fully (Act 3 resolved), the character **left the area** or
  **settled into a background role**. They are referenced but not present.
- If the export happened mid-adventure (Act 1 or Act 2), the character **is still somewhere
  in the world** but has become an NPC. Their unfinished business becomes a story thread the
  new player may encounter.

#### NPC References to the Previous Adventurer

NPCs who interacted significantly with the original player (trust >= 40 or trust <= -20)
gain a reference in their profile:

<!-- CLI implementation detail — do not hand-code -->
```js
npc.previousAdventurerRelationship = {
  knew: true,
  sentiment: deriveSentiment(npc.trust),  // "fond", "wary", "hostile", "indifferent"
  referenceStyle: deriveReferenceStyle(npc),
  // e.g. "Mentions 'the bartender' when discussing the conspiracy.
  //  Speaks with guarded respect."
};
```

NPCs who never met the original player (trust === 50 / neutral default) have no reference.
They encounter the new player without preconceptions.

#### Unfinished Quests Become Rumours

Active quests from the original player's quest log are transformed:

- **Completed quests** -> world history events (already handled in Step 5)
- **Active quests** -> rumours and available story threads. "They say someone was
  investigating the crawlways beneath The Oxidiser, but they left before finishing..."
- **Failed quests** -> consequences. The failure is part of the world now.

### Step 8 — Generate Encounter Tables

Build encounter tables from the bestiary module's current creature pool. The tables reflect
the world as it is after the original adventure — if the original player cleared out a nest,
those creatures are gone. If they angered a faction, patrol encounters increase.

Use the adventure-authoring Encounter Tables format: d6 tables, escalation-tiered where
appropriate, at least one social and one empty result per table.

World flags influence table composition:
- `faction_{name}_hostile` -> increase hostile faction patrol encounters
- `creature_{type}_cleared` -> remove that creature type from location tables
- `location_{name}_damaged` -> add environmental hazard entries

### Step 9 — Build YAML Frontmatter

Compile the export metadata into YAML frontmatter that follows the adventure-authoring format
with additional export-specific fields:

```yaml
---
format: text-adventure-lore
version: 1
skill-version: "1.0.0"

title: "Freeport Meridian — After the Conspiracy"
subtitle: "An exported world from The Oxidiser Conspiracy"
author: "Exported from live session"
theme: space
tone: thriller
acts: 3
estimated-scenes: "15-20"
players: "1"
difficulty: moderate

exported: true
exported-from: "Gareth Williams — Scene 12"
exported-date: "2026-03-20T08:30:00Z"
original-seed: "pale-threshold-7"
world-state: "post-act-1"
previous-adventurer:
  name: "Gareth Williams"
  class: "Bartender"
  fate: "Left Freeport Meridian after uncovering the conspiracy"

recommended-styles:
  output: Sci-Fi-Narrator
  visual: station

calendar-system: "Station Standard (24h, 365-day cycle)"
start-date: "2347-03-16"
start-time: "0900 hours"

required-modules:
  - core-systems
  - story-architect
  - lore-codex
  - geo-map

optional-modules:
  - ai-npc
  - ship-systems
  - crew-manifest
  - star-chart
---
```

**Export-specific frontmatter fields:**

| Field | Type | Description |
|-------|------|-------------|
| `exported` | boolean | Always `true` — identifies this as an exported world, not a hand-authored adventure |
| `exported-from` | string | Character name and scene number at time of export |
| `exported-date` | string | ISO 8601 timestamp of the real-world export time |
| `original-seed` | string | World generation seed (if the original game was procedural/hybrid) |
| `world-state` | string | Narrative state: `"post-act-1"`, `"post-act-2"`, `"post-adventure"`, `"mid-adventure"` |
| `previous-adventurer` | object | Name, class, and fate summary of the original player's character |

These fields are informational. The GM reads them for context when loading the exported
`.lore.md` — they do not change how the file is parsed. An exported `.lore.md` loads
identically to a hand-authored one.

### Step 10 — Compile Markdown Body

Assemble all sections into the `.lore.md` markdown body following the adventure-authoring
module's section order:

1. `## World History` — epochs (including new post-adventure epoch if applicable)
2. `## Previous Adventurer` — the original player's legacy (new section, unique to exports)
3. `## Location Atlas` — all locations with reset discovery states
4. `## NPC Roster` — all NPCs with current state and full secrets
5. `## Story Spine` — converted threads as seeded beats with act structure
6. `## Encounter Tables` — generated from current bestiary state
7. `## Loot and Rewards` — preserved from original, adjusted for taken items
8. `## Faction Dynamics` — current standings as starting state

### Step 11 — Export as `.lore.md`

The export is triggered via `tag save generate --format lore`. The CLI computes the
complete `.lore.md` content from the current `gmState` (Steps 2-10 above) and presents
it as a downloadable artifact.

The scene template's export widget uses `sendPrompt()` to invoke the export flow. The
GM does not hand-code the export widget — the scene template handles the preview,
confirmation, and download mechanism automatically.

---

## The Export Widget

The export widget is rendered by the scene template when the player requests an export
or accepts the GM's offer. The GM does not hand-code the export widget — the scene
template handles the preview, included/stripped breakdown, Previous Adventurer preview,
and download mechanism automatically.

The GM provides the export data via `tag state` fields:

| Field | Source |
|-------|--------|
| `characterName` | `gmState.character.name` |
| `characterClass` | `gmState.character.class` |
| `scenesPlayed` | `gmState.scene` |
| `locationCount` | `Object.keys(gmState.mapState?.rooms ?? {}).length` |
| `npcCount` | `(gmState.rosterMutations ?? []).length` |
| `threadCount` | `(gmState.storyArchitect?.storyThreads ?? []).length` |
| `factionCount` | `Object.keys(gmState.factions ?? {}).length` |
| `flagCount` | `Object.keys(gmState.worldFlags ?? {}).length` |
| `worldState` | Derived: `"post-act-1"`, `"post-act-2"`, etc. |
| `exportCount` | `gmState.exportState?.exportCount ?? 0` |
| `originalSeed` | `gmState.seed ?? null` |
| `adventurerFate` | Derived from character fate |
| `loreFileContent` | Complete `.lore.md` string (Steps 2-10) |

The export button uses `sendPrompt()` to ask Claude to generate the `.lore.md` as a
downloadable artifact. If `sendPrompt()` is unavailable, the widget falls back to
displaying the content in a readonly textarea with a copy button.

---

## Integration with gmState

The Adventure Exporting module adds a single key to `gmState`:

<!-- CLI implementation detail — do not hand-code -->
```js
gmState.exportState = {
  available: true,          // whether export is currently possible
  lastExport: null,         // ISO timestamp of last export, or null
  exportCount: 0,           // how many times this world has been exported
};
```

### State Updates

- `available` is set to `false` during combat (`gmState.inCombat`), dialogue sequences, and
  active resolution. It is set to `true` at all other times.
- `lastExport` is updated to the current ISO timestamp after a successful export.
- `exportCount` is incremented by 1 after each successful export.

### World Flag Prefix

The Adventure Exporting module uses prefix `export_` for flags it sets directly:

```
export_completed           // at least one export has been performed
export_count               // number of exports (numeric flag)
```

### Dependency on Other Modules

| Module | What export reads from it |
|--------|--------------------------|
| adventure-authoring | Target file format, section structure, frontmatter schema |
| save-codex | sendPrompt download pattern, file naming convention |
| story-architect | Story threads, foreshadowing, consequence chains, NPC arcs, pacing |
| world-history | Epochs, power structures, past conflicts, cultural layer |
| core-systems | Factions, quests, economy state, time/calendar |
| lore-codex | Codex entries (all reset to locked in export) |
| ai-npc | NPC profiles, trust values, dispositions, secrets |
| geo-map | Location atlas, room graph, physical state |
| bestiary | Creature pool for encounter table generation |
| procedural-world-gen | Seed string (preserved in frontmatter for hybrid mode) |

---

## Worked Example — Freeport Meridian After Act 1

The player — Gareth Williams, Bartender — has completed Act 1 of The Oxidiser Conspiracy.
Over 12 scenes, they:

- Met Seren Voss (trust: 65, disposition: friendly)
- Met Renko (trust: 72, disposition: friendly)
- Met Officer Tomas (trust: 45, disposition: neutral)
- Discovered the crawlway beneath The Oxidiser
- Allied with Station Authority (faction: +35)
- Antagonised the Grey Network (faction: -20)
- Set world flags: `scene_crawlway_discovered`, `npc_voss_identity_revealed`,
  `faction_authority_allied`, `lore_bond_documentation_found`

The GM offers an export. The player accepts. Here is the resulting `.lore.md` (abbreviated):

```markdown
---
format: text-adventure-lore
version: 1
skill-version: "1.0.0"

title: "Freeport Meridian — After the Conspiracy"
subtitle: "An exported world from The Oxidiser Conspiracy"
author: "Exported from live session"
theme: space
tone: thriller
acts: 3
estimated-scenes: "15-20"
players: "1"
difficulty: moderate

exported: true
exported-from: "Gareth Williams — Scene 12"
exported-date: "2026-03-20T08:30:00Z"
original-seed: "pale-threshold-7"
world-state: "post-act-1"
previous-adventurer:
  name: "Gareth Williams"
  class: "Bartender"
  fate: "Left Freeport Meridian after uncovering the conspiracy"

recommended-styles:
  output: Sci-Fi-Narrator
  visual: station

calendar-system: "Station Standard (24h, 365-day cycle)"
start-date: "2347-03-16"
start-time: "0900 hours"

required-modules:
  - core-systems
  - story-architect
  - lore-codex
  - geo-map

optional-modules:
  - ai-npc
  - ship-systems
  - star-chart
---

## World History

### Epoch 1 — The Founding Compact (~340 years ago)
- **Era:** Foundation
- **Key event:** Six independent mining consortia signed the Compact, pooling transit
  rights and establishing Freeport Meridian at the waypoint.
- **Power structure:** Consortium council — six seats, rotating chair
- **Legacy:** The original six family names still appear on docking berths and
  founding plaques. Legal disputes are resolved under Compact Law.
- **Cultural detail:** "Founding Day" is still celebrated on Level 2, though
  attendance has dwindled.

### Epoch 2 — The Expansion Wars (~190-160 years ago)
- **Era:** Conflict
- **Key event:** Three decades of intermittent conflict as rival sector powers
  contested transit routes. The station changed administrative control four times.
- **Power structure:** Transitional — shifted with each occupation
- **Legacy:** The outer ring was added as emergency refugee housing and never
  properly integrated. Deep distrust of Sector Authority representatives persists.
- **Cultural detail:** The 48-hour armed vessel berth limit dates from the peace
  settlement. The blast scoring on Level 4 bulkheads is considered a memorial by
  outer-ring residents.

### Epoch 3 — The Great Refit (~80 years ago)
- **Era:** Modernisation
- **Key event:** A twenty-year infrastructure project funded by a Sector Authority
  development bond — the first Sector money accepted by Meridian governance.
- **Power structure:** Consortium with Sector oversight
- **Legacy:** The bond was never fully repaid. Sector Authority holds partial financial
  jurisdiction as collateral. The contrast between old-spec Level 1-2 corridors and
  Sector-standard construction above Level 3 is visible throughout the station.
- **Cultural detail:** A generation of station engineers trained under Sector teams.
  The technical culture is now more Sector-aligned than the governance.

### Epoch 4 — The Quiet Decade (~25-15 years ago)
- **Era:** Prosperity
- **Key event:** Ten years of relative prosperity — high transit traffic, low faction
  conflict. The Oxidiser bar opened during this period.
- **Power structure:** Stable consortium governance
- **Legacy:** Several businesses expanded on leases signed at peak rates. Those leases
  are now over-committed. The generation that grew up during this period has expectations
  of stability the current climate cannot meet.

### Epoch 5 — The Contract Dispute (~8 years ago to present)
- **Era:** Tension
- **Key event:** The Consortium attempted to renegotiate resupply contracts with the
  outer ring's independent operators. The outer ring refused. Transit traffic on Level 2
  dropped 40% over four years.
- **Power structure:** Consortium vs. Outer Ring Residents' Association, with Sector
  Authority backing the Consortium via the bond arrangement
- **Legacy:** Empty units on Level 2. A black market in unofficial berth reassignments.
  The Oxidiser bar is still open — barely.

### Epoch 6 — The Oxidiser Conspiracy (recent)
- **Era:** Upheaval
- **Key event:** A bartender named Gareth Williams discovered a cargo manifest
  discrepancy that led to the exposure of the Consortium's bond arrangement with
  the Sector Authority. The bond documentation became semi-public knowledge.
  Station Authority gained credibility. The Grey Network's operations were disrupted.
- **Power structure:** Station Authority ascendant; Consortium weakened; Grey Network
  regrouping
- **Legacy:** The bond terms are now known. Inspector Torr has filed his report.
  The Outer Ring Residents' Association is preparing legal action with actual evidence.
  The Oxidiser bar has a new owner. Regulars still mention "the old bartender."


## Previous Adventurer

### Gareth Williams — The Bartender Who Uncovered the Conspiracy

Thirty years on Freeport Meridian. He knew every corridor, every regular, every
secret. When a data chip appeared under his bar counter with his name etched into
it, he could have ignored it. He did not.

**Major decisions:**
- Allied with Station Authority over the Grey Network
- Revealed the bond documentation to Inspector Torr
- Discovered the crawlway maintenance network beneath The Oxidiser
- Earned Seren Voss's trust despite their factional opposition

**Fate:** Left Freeport Meridian after the conspiracy unravelled. The Oxidiser
passed to a new owner. The master keycard was left behind — the back office
is unlocked.

**NPCs who remember him:**
- Seren Voss — guarded respect. "He did what he thought was right. I cannot
  fault the intent, only the cost."
- Renko — warm nostalgia. "Best bartender this station ever had. Not saying
  that because of the free drinks. Well. Partly."
- Officer Tomas — professional appreciation. "A civilian who understood procedure.
  Rare and valuable."


## Location Atlas

### The Oxidiser — Bar Floor
- **Type:** Interior, social hub
- **Description:** Twenty-three stools, nine booths, one battered pool table.
  Strip-lighting casts everything in amber. A photograph behind the bar shows
  the previous owner — a broad-shouldered man with a bar rag over one shoulder.
  The bottles behind the bar are arranged by decade, not by spirit.
- **Atmosphere:** Recycled air, faintly metallic. Low hum of generators.
  Synth-hops from the jukebox. Warm despite the station's chill. Quieter
  than it used to be.
- **Exits:** Kitchen (west), Main corridor — Deck 7 (north), Back office
  (south, unlocked — master keycard left behind by previous owner)
- **NPCs present:** Renko (always), 1-3 patrons (variable)
- **Secrets:** Maintenance hatch behind the jukebox (access panel 7-3C, leads
  to Deck 6-7 crawlways). The hatch is now known to station regulars — no
  longer a secret, but not widely advertised.
- **Story relevance:** Former hub of the previous adventure. NPCs here may
  reference the old bartender. The crawlway access is an established route.

### Deck 3 — Cargo Bay
- **Type:** Interior, transit zone
- **Description:** High-ceilinged bay with rows of cargo containers, automated
  drones scanning crate manifests. The lighting was replaced recently — brighter
  than the corridor outside. Scuff marks on the floor near the north wall.
- **Atmosphere:** The deep hum of cargo lifts. Cold — the bay is only partially
  climate-controlled. The smell of packing materials and machine oil.
- **Exits:** Main corridor — Deck 3 (south), Loading platform (east, restricted
  — requires security clearance or INT DC 14 bypass)
- **Secrets:** The false manifest system has been partially dismantled. Some
  unofficial cargo channels remain, now operated more cautiously.
- **Story relevance:** Site of the previous adventure's investigation. Security
  presence has increased since the conspiracy was exposed.

### Deck 6-7 Crawlways
- **Type:** Interior, transit route (maintenance)
- **Description:** Narrow maintenance corridors running between the main decks.
  Dim emergency lighting. Cables and pipe runs along the walls. Boot prints in
  the dust — some old, some recent.
- **Atmosphere:** The sound of the station's bones — power conduits humming,
  water recyclers cycling, the distant thrum of the gravity plating. Cooler
  than the main corridors. Smells of dust and ozone.
- **Exits:** The Oxidiser — Bar Floor (via maintenance hatch), Deck 3 Cargo Bay
  (via service ladder), Deck 4 Council Chambers (via junction 7-4A)
- **Secrets:** Junction 7-4A has a secondary access point that is not on any
  official maintenance map. It was used by the Grey Network. Still passable.
- **Story relevance:** Discovered by the previous adventurer. Now an
  established alternative route through the station.


## NPC Roster

### Seren Voss — The Grey Coat Woman
- **Role:** Catalyst / potential ally or antagonist
- **Species/Background:** Human, off-station. Expensive taste, real-gravity
  bearing. Mid-forties, sharp eyes, no wasted movements.
- **Motivation:** The Grey Network's operations have been disrupted. She is
  rebuilding, more cautiously. Needs new contacts she can trust.
- **Secret:** She has a second extraction route through the Level 4 maintenance
  crawlways that was never discovered during the previous adventure.
- **Reveal condition:** Player earns Trust 50+ with Voss, or discovers the
  route independently through Level 4 exploration.
- **Disposition start:** Neutral-guarded (reset from Friendly — trust must be
  re-earned by a new person)
- **Speech pattern:** Precise, clipped, never wastes words. Uses silences as
  weapons. Avoids contractions. When uncomfortable, deflects with questions.
- **Stats:** STR 10, DEX 14, INT 16, WIS 13, CON 11, CHA 15
- **Faction:** Grey Network
- **Location:** Deck 4 Council Chambers (moved from The Oxidiser after Act 1)
- **Previous adventurer relationship:** Worked with Gareth Williams. Guarded
  respect. Will mention "the bartender" if the new player demonstrates similar
  qualities — courage, discretion, willingness to act.

### Renko — The Regular
- **Role:** Informant / comic relief / canary
- **Species/Background:** Human, station-born. Dock worker, forty years on
  Meridian, knows everyone's business.
- **Motivation:** Wants to keep his head down and his tab open. Misses the
  old bartender. Will warm to a new face who treats him right.
- **Secret:** He knows about the second extraction route — overheard Voss
  mention it after three drinks. He has not told anyone.
- **Reveal condition:** Player buys him three drinks AND mentions Voss or the
  Grey Network. Or player reaches Trust 70+ with Renko.
- **Disposition start:** Neutral (was Friendly with Gareth — new player must
  earn it)
- **Speech pattern:** Rambling, self-interrupting, trails off when nervous.
  Starts sentences with "Look, I am not saying..." then says exactly the thing.
- **Stats:** STR 9, DEX 10, INT 12, WIS 14, CON 10, CHA 11
- **Faction:** None (civilian)
- **Location:** The Oxidiser, Bar Floor (always)
- **Previous adventurer relationship:** Warm nostalgia. Will tell stories about
  the old bartender to anyone who listens. These stories are mostly accurate.

### Officer Tomas — Station Authority
- **Role:** Ally / law enforcement contact
- **Species/Background:** Human, transferred to Meridian five years ago.
  Thorough, principled, occasionally inflexible.
- **Motivation:** Wants to maintain order on the station through proper channels.
  The conspiracy validated his methods. He is more confident now.
- **Secret:** He has been promoted to senior investigator since the conspiracy.
  He now has access to the portmaster's scheduling records.
- **Reveal condition:** Player demonstrates cooperation with Authority, or
  asks Tomas directly about his current role.
- **Disposition start:** Neutral-friendly (+10 — residual goodwill from the
  previous adventure, but cautious with new faces)
- **Speech pattern:** Formal, measured, uses procedure as a conversational
  framework. "For the record..." precedes important statements.
- **Stats:** STR 13, DEX 12, INT 14, WIS 13, CON 12, CHA 11
- **Faction:** Station Authority
- **Location:** Level 5 Authority administrative block
- **Previous adventurer relationship:** Professional appreciation. Will
  reference Gareth Williams as an example of productive civilian cooperation
  if the topic arises naturally.


## Story Spine

### Act 1 — The Aftermath (Scenes 1-5)
**Tension range:** 2-5
**Goal:** Establish the post-conspiracy world, introduce the new player to a
changed station, plant seeds for the next conflict.

#### Beat 1: Arrival (Scene 1)
- **Type:** Discovery
- **Setup:** The new player arrives on Freeport Meridian — or has been here
  all along and is now drawn into events. The station is different from what
  the rumours suggested. The Oxidiser has a new face behind the bar. Renko
  is in his usual seat. The regulars are talking about things that happened
  before the player arrived.
- **Decision point:** How to engage with the station
  - Explore the station freely -> discover the post-conspiracy landscape
  - Visit The Oxidiser -> meet Renko, hear about the old bartender
  - Seek out Station Authority -> meet Officer Tomas, learn the official story
  - Follow rumours of the Grey Network -> encounter Voss's rebuilt operation

#### Beat 2: Echoes (Scenes 2-3)
- **Type:** Discovery / social
- **Setup:** The consequences of the previous adventure are visible everywhere.
  Empty units on Level 2. Increased security on Deck 3. Outer-ring residents
  organising. The bond documentation is semi-public — everyone has an opinion.
- **Decision point:** Whose story to believe
  - Trust the Authority narrative -> cleaner picture, incomplete
  - Seek the outer-ring perspective -> messier, more complete
  - Investigate independently -> find details neither side advertises

### Act 2 — The New Conflict (Scenes 6-12)
**Tension range:** 4-8
**Goal:** The post-conspiracy power vacuum creates a new conflict. The outer ring
is preparing legal action. The Consortium is manoeuvring. The Grey Network is
rebuilding. The new player is drawn in — by choice or circumstance.

#### Beat 4: The Reversal
- **Type:** Revelation
- **Setup:** [Seeded — the specific reversal depends on the new player's choices
  and the GM's adaptation of the post-conspiracy dynamics. The previous adventure's
  consequences create multiple possible reversal vectors.]

### Act 3 — Resolution (Scenes 13-15+)
**Tension range:** 6-10 then 3-4
**Goal:** Climax and denouement for the new conflict, shaped by the new player's
decisions and the world the previous adventurer left behind.


## Encounter Tables

### The Oxidiser — Random Patrons (d6)
1. A transit crew member asking about "the old bartender" — heard the story on
   another station
2. Off-duty Authority officer, more relaxed than they used to be, willing to chat
3. Two outer-ring residents arguing about the legal action — voices drop when
   they notice the player listening
4. A nervous courier who keeps checking the door. Different from the last one.
5. Renko, holding court about the conspiracy to anyone who will listen. Accuracy
   varies with drink count.
6. Nobody new — eerily quiet. The jukebox plays to empty stools.

### Deck 3 Cargo Bay — Encounters by Escalation Tier

#### Tier 1 — Post-Conspiracy Quiet (d4)
1. Empty — security cameras active, the bay is calmer than it used to be
2. Authority inspector reviewing manifests with notably more attention than before
3. Dock worker who remembers the conspiracy — will share opinions freely
4. Automated cargo drone. New model — Authority-requisitioned after the conspiracy.

#### Tier 2 — Tensions Rising (d4)
1. Grey Network operative, cautiously re-establishing presence. Testing the waters.
2. Authority patrol — doubled since the conspiracy. They know the player's face.
3. Outer-ring courier using unofficial channels. The network survived, diminished.
4. A locked cargo container with manifests that do not quite add up. Again.


## Loot and Rewards

### Act 1 Rewards
- **Exploring post-conspiracy Oxidiser:** 25 XP, Renko as contact, stories of the
  previous adventurer
- **Meeting Officer Tomas:** 30 XP, Authority trust +10, access to public records
  of the conspiracy investigation
- **Discovering the crawlway (if not already known):** 25 XP, alternative route
  through the station

### Merchant Inventory — Vex's Salvage Emporium (Deck 5)

| Item | Type | Tier | Price | Effect |
|------|------|------|-------|--------|
| Stim Pack | Consumable | 1 | 25 cr | Restore 2d6 HP |
| Signal Jammer | Gear | 2 | 80 cr | +2 Stealth near electronics |
| Authority-Issue Scanner | Gear | 2 | 120 cr | +2 Investigation in cargo areas |
| Patched Enviro-Suit | Armour | 2 | 150 cr | +2 AC, resist vacuum (1 scene) |
| Consortium Access Token | Gear | 3 | 350 cr | Bypass Tier 1 Consortium security |


## Faction Dynamics

### Station Authority
- **Starting disposition:** Friendly (+10)
- **Context:** The previous adventurer cooperated extensively with Station Authority.
  Residual goodwill extends to new faces — slightly. Officer Tomas speaks well of
  outside help. Authority is more confident after the conspiracy exposure.
- **Shifts positive if:** Player cooperates with Authority procedures, provides
  information, assists investigations
- **Shifts negative if:** Player breaks into restricted areas, aids the Grey Network
  openly, obstructs Authority operations
- **At +50 (Allied):** Full access to Authority resources, Tomas as reliable ally
- **At -50 (Hostile):** Wanted status, security patrols actively searching

### The Grey Network
- **Starting disposition:** Hostile (-20)
- **Context:** The previous adventurer's alliance with Authority disrupted Grey Network
  operations. Seren Voss is cautious about new faces. Trust must be built from scratch
  — and the starting deficit means the new player has ground to make up.
- **Shifts positive if:** Player aids Grey Network operations, keeps their secrets,
  demonstrates opposition to Consortium overreach
- **Shifts negative if:** Player reports Grey Network activity to Authority, betrays
  Voss's trust, sides openly with the Consortium
- **At +50 (Allied):** Access to Grey Network safe houses, intelligence, extraction routes
- **At -50 (Hostile):** Grey Network operatives treat the player as a direct threat

### Meridian Docking Consortium
- **Starting disposition:** Neutral-wary (-10)
- **Context:** The Consortium is weakened after the bond documentation exposure. They
  are defensive, politically manoeuvring, and suspicious of outsiders asking questions.
- **Shifts positive if:** Player supports Consortium authority, opposes outer-ring
  legal action, demonstrates commercial value to the station
- **Shifts negative if:** Player investigates Consortium dealings, supports outer-ring
  claims, publishes evidence of Consortium misconduct

### Linked Factions
- Station Authority and The Grey Network are **opposed**. Gaining +20 with one
  imposes -10 on the other.
- The Consortium and Station Authority are **uneasy allies**. The bond arrangement
  is now public knowledge — their relationship is strained but functional.
- The Outer Ring Residents' Association and the Consortium are **opposed**. Legal
  action is pending.
```

---

## Anti-Patterns

- **Never export mid-combat or mid-dialogue.** The world state is unstable during active
  resolution. Wait for the current sequence to conclude before capturing the snapshot.
- **Never include the player's character stats in the export.** The character is stripped
  completely. Their legacy is preserved as world history, not as a playable entity.
- **Never strip NPC secrets from the export.** The `.lore.md` is a GM document, not a player
  document. The new GM needs all secrets — revealed and unrevealed — to run the world
  properly. The new player discovers secrets through play, not by reading the file.
- **Never reset world flags in the export.** If the original player blew up a bridge, it
  stays destroyed. If they allied with a faction, that faction remembers. World flags are
  permanent consequences — they define the exported world's state.
- **Never preserve the original player's fog of war.** All discovery states reset for the
  new player. They experience the world fresh, with their own exploration progress.
- **Never make the Previous Adventurer an interactive NPC** (unless they are explicitly still
  present in the world mid-adventure). They are a historical figure — referenced, remembered,
  but not available for conversation. The new player's story is their own.
- **Never export without showing the preview widget.** The player must see what is being
  exported and what is being stripped before confirming the download. The scene template
  handles the preview widget automatically.
- **Never auto-export.** The export is always player-triggered or player-accepted. The GM may
  offer, but never performs the export without confirmation.
- **Never hand-code the export widget.** The scene template renders the export preview,
  confirmation, and download mechanism. Use `tag save generate --format lore` for the
  data pipeline.
- **Never embed save data in an exported `.lore.md`.** The export is a world template, not a
  session record. Save data belongs in `.save.md` files. The two formats are complementary.
- **Never use contractions in `sendPrompt()` strings.** Apostrophes in prompt strings can
  break HTML attribute escaping silently.
