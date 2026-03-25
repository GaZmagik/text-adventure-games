# Arc Patterns — Structural Variety Across Multi-Arc Campaigns
> Module for text-adventure orchestrator. Loaded on demand — when planning arc transitions,
> branching paths, or downtime sequences.

This module defines the structural patterns that prevent multi-arc campaigns from feeling
repetitive. It complements story-architect.md (which tracks threads, pacing, and NPC arcs
within a single arc) by governing the shape of arcs themselves — what types exist, how they
transition, and how settings evolve across a campaign.

**Read this module when planning an arc transition, selecting a branching path, or designing
a downtime sequence.** It is not needed for scene-to-scene play within an arc.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: story-architect
(thread management), core-systems (carry-forward mechanics), scenarios (scenario generation),
adventure-authoring (authored arc structure), procedural-world-gen (seed-derived content).

---

## Arc Types

Every arc belongs to one of four types. The type determines scope, setting, mechanical
focus, and transition pattern. A healthy campaign alternates types — never three of the
same type in a row.

### Standard Arc
- **Scope:** Single location complex (station, town, ship, dungeon)
- **Acts:** 3 (hook → escalation → resolution)
- **Duration:** 10–20 scenes
- **Setting:** One interconnected map with 5–8 zones
- **Focus:** Investigation, social dynamics, exploration, combat
- **Transition:** Single "Continue" button → next arc inherits carryForward

### Branching Arc
- **Scope:** Player chooses between 2–3 divergent paths at arc conclusion
- **Acts:** 3, but Act 3 presents the branch choice instead of a single resolution
- **Duration:** 10–20 scenes
- **Setting:** Current location, but the branch choice determines the NEXT arc's setting
- **Focus:** Same as standard, but consequences are amplified — each choice leads somewhere different
- **Transition:** 2–3 path cards replace the single "Continue" button. Each card shows:
  - Path title and genre pills
  - Consequence preview (what changes, what carries)
  - New setting hint ("You board the transport to..." / "The guild hall awaits in...")
  - `nextArcSeed` passed to procedural-world-gen for the chosen path

### Epic Arc
- **Scope:** Expanded scale — multiple connected locations, higher stakes, longer duration
- **Prerequisite:** Character level 5+ (enforced by the CLI)
- **Acts:** 3–5 (extended Act 2 with multiple escalation phases)
- **Duration:** 20–40 scenes
- **Setting:** Multiple interconnected maps — e.g. a station AND the asteroid it orbits,
  a city AND the wilderness beyond, a ship AND the port it docks at
- **Focus:** High-stakes narrative with faction wars, betrayals, large-scale consequences
- **Transition:** Single "Continue" with EPIC badge. carryForward includes major world changes.

### Downtime Arc
- **Scope:** Character-focused interlude between action arcs
- **Acts:** 1–2 (no mandatory reversal — this is a breathing space)
- **Duration:** 5–10 scenes
- **Setting:** Safe location — a hub, port, city, camp, or allied territory
- **Focus:** Training, shopping, relationship building, skill acquisition, lore discovery
- **Transition:** Single "Continue" — character returns to the campaign with new capabilities

---

## Downtime Arc Pattern

Downtime arcs prevent mechanical stagnation and provide narrative breathing room. They are
not filler — they are where characters become more than their stat blocks.

### When to Offer Downtime

Offer a downtime arc when ANY of these conditions are met:
- The player has completed 2+ standard/branching arcs without rest
- The character has accumulated currency with nothing to spend it on
- The character has reached a level threshold (3, 5, 7) without training
- The narrative calls for a time skip between major events
- The player explicitly requests downtime ("I want to train" / "let's go shopping")

### Downtime Activities

Each activity is a scene with choices and potential skill checks:

| Activity | Mechanic | Example |
|----------|----------|---------|
| **Training** | INT or WIS check (DC 12–16) to learn a new proficiency or improve a stat modifier by +1. Costs currency + 2–3 scenes. Failure means partial progress — can retry next downtime. | Sparring with a weapons master, studying ancient texts, practising zero-G manoeuvres |
| **Shopping** | Browse merchant inventories themed to the location. Prices follow core-systems tier table. Rare items require a CHA check to negotiate or a quest to unlock. | Shipyard parts dealer, apothecary, black market tech fence, guild quartermaster |
| **Mentorship** | Build relationship with a mentor NPC. 3 scenes of interaction → mentor grants a unique ability or lore insight not available through training. Mentor must be in rosterMutations with trust >= 40. | Retired pilot teaches emergency manoeuvres, former spy teaches ciphers |
| **Crafting** | INT check (DC 14) + materials (purchased or found) to create or upgrade equipment. One crafting attempt per downtime arc. Critical success adds a bonus property. | Modifying a weapon, brewing potions, upgrading ship components |
| **Lore Research** | WIS or INT check (DC 10–14) at a library, archive, or data terminal. Success unlocks codex entries and may reveal hidden information about upcoming arcs. | Researching faction histories, decrypting recovered data, consulting star charts |
| **Relationship Building** | CHA check (DC 10–12) to improve disposition with NPCs. Each scene of genuine interaction shifts trust by +5 to +15. No mechanical cap — but NPCs with secrets have trust thresholds that gate reveals. | Sharing a meal, helping with a personal problem, exchanging stories |

### Downtime Scene Structure

A downtime scene follows a simplified pattern:
1. Location description (brief — 1–2 paragraphs, transition density)
2. Available activities (presented as action cards)
3. Player chooses an activity
4. Activity resolution (skill check if applicable)
5. Outcome narration (brief — consequences of the activity)

No atmosphere strip required. No mandatory combat. Footer buttons remain active.

---

## Location Transitions Between Arcs

Every arc transition is an opportunity to change the physical setting. The type of arc
determines how dramatic the change should be.

### Transition Scale by Arc Type

| From → To | Setting Change | Example |
|-----------|---------------|---------|
| Standard → Standard | **Minor shift** — different section of the same region, or a nearby location | Station docking bay → station processing deck; village → nearby ruins |
| Standard → Branching | **Same setting** — the branch choice determines the NEXT setting | Investigation concludes; player chooses: pursue the contact off-world, or dig deeper locally |
| Branching → Standard | **Major shift** — new location determined by the branch chosen | Chose "board the transport" → arrive at a new station; chose "stay" → new threat arrives locally |
| Standard → Epic | **Expansion** — current setting grows to include connected areas | Station map expands to include the asteroid field, the corporate HQ, the smuggler's moon |
| Any → Downtime | **Safe hub** — a known, controlled environment | Return to home port, arrive at a guild hall, set up camp in allied territory |
| Downtime → Any | **Departure** — leave the safe hub for the next arc's setting | Board a ship, pass through a portal, march out of the city gates |

### Location Atlas Rules for New Arcs

When an arc transitions to a new setting:
1. **Generate a fresh location atlas** — 5–8 zones minimum for standard, 8–12 for epic
2. **Carry forward known locations** — if the new setting is connected to the old one,
   include 1–2 zones from the previous arc as "transit points" (e.g. the docking bay
   you arrived through)
3. **Seed from carryForward.worldConsequences** — if the player destroyed a bridge, the
   new setting should not have that bridge. If they allied with a faction, that faction
   has a presence here.
4. **Genre-appropriate geography:**
   - **Space:** Stations, ships, asteroids, moons, orbital platforms, planetary surfaces
   - **Fantasy:** Towns, dungeons, wilderness, castles, underground, planar portals
   - **Historical:** Cities, battlefields, courts, markets, harbours, frontier outposts
   - **Horror:** Isolated locations, abandoned structures, underground, liminal spaces

---

## Multi-Act Turning Points

Story-architect mandates an Act 2 reversal. This module extends that to require distinct
structural beats in each act, preventing the three-act structure from feeling formulaic.

### Act 1 — The Escalation Gate

The final scene of Act 1 must include an **escalation gate**: a moment where the player
commits to the arc's central conflict. Before this point, retreat is possible. After it,
the stakes are locked in.

**Escalation gate patterns:**
- **Discovery:** The player finds evidence they cannot un-see ("the cargo manifest lists materials that don't exist")
- **Commitment:** The player makes a public choice that closes a door ("you told the supervisor you know about the third shift")
- **Threat:** Something happens that makes the problem personal ("your shuttle has been disabled — you're not leaving")
- **Alliance:** The player allies with someone who has enemies ("Marin hands you his private logs — if Druze finds out, you're both finished")

### Act 2 — The Reversal (existing)

Mandatory reversal — already defined in story-architect.md. The key addition from this
module: **vary the reversal type across arcs in a campaign.** If Arc 1 used a "trusted
ally has a hidden agenda" reversal, Arc 2 should use a different type:

| Reversal type | Description | Use when... |
|---------------|-------------|-------------|
| **Recontextualisation** | A known fact gains new meaning | ...the mystery has layers |
| **Scope expansion** | The problem is bigger than assumed | ...the player thinks they're close to solving it |
| **Stakes inversion** | The solution creates a new threat | ...the player has been successful so far |
| **Betrayal** | A trusted figure has opposing goals | ...the player has formed strong NPC bonds |
| **Revelation** | A hidden truth reframes the narrative | ...the player has been investigating |
| **Reversal of fortune** | External event changes the power dynamic | ...the player has been building momentum |

**Rule: Never use the same reversal type in consecutive arcs.** Track the last reversal
type in `storyArchitect.lastReversalType` and select a different one.

### Act 3 — The Point of No Return

The opening of Act 3 must include a **point of no return**: a scene where the player
chooses their endgame approach. This is not the climax — it is the commitment to how the
climax will unfold.

**Point of no return patterns:**
- **Confrontation path:** "You kick down the door" — direct, high-risk, decisive
- **Negotiation path:** "You arrange a meeting" — social, nuanced, unpredictable
- **Sabotage path:** "You disable the systems first" — indirect, technical, slower
- **Escape path:** "You get everyone out before it blows" — preservation over victory
- **Exposure path:** "You transmit the evidence" — truth over personal resolution

The player's choice determines the climax scene type and available actions. All paths
must be viable — no trap options, no "correct" answer.

---

## Branching Arc Convergence

When a branching arc offers 2–3 paths, those paths must eventually produce meaningful
outcomes. This section defines when paths converge and when they diverge permanently.

### Convergence Rules

1. **Short-term branches converge within the same arc.** If Act 2 offers a choice between
   two approaches (sneak vs. confront), both paths should lead to the same Act 3 — but
   with different NPC dispositions, available information, and world flags.

2. **Arc-level branches diverge permanently.** If an arc conclusion offers 2–3 path cards
   for the next arc, each path leads to a genuinely different arc — different setting,
   different NPCs, different central conflict. These do NOT reconverge.

3. **Thematic convergence is acceptable.** Two permanently divergent paths may address
   the same overarching theme (e.g. both deal with corporate corruption) but through
   different lenses, locations, and casts.

4. **Carry-forward provides continuity.** Even on divergent paths, the player's character
   progression, faction standings, and world consequences carry through. The campaign
   feels continuous even when the setting changes completely.

### Branch Quality Checklist

Before presenting a branch choice:
- [ ] Each path has a distinct genre/tone flavour (not just "go left or go right")
- [ ] Each path has at least 2 unique NPCs not shared with other paths
- [ ] Each path has a different central conflict type (investigation vs. survival vs. social)
- [ ] Each path's consequences are previewed honestly — no bait-and-switch
- [ ] The branch is presented AFTER the player has enough information to choose meaningfully

---

## Genre-Specific Arc Patterns

### Space

| Arc sequence | Pattern | Setting progression |
|-------------|---------|---------------------|
| 1 (Standard) | Station mystery | Single orbital platform |
| 2 (Branching) | Conspiracy revealed | Station → choose: pursue off-world OR dig deeper |
| 3 (Epic) | Sector-wide conflict | Multiple stations + ship travel + planetary surface |
| 4 (Downtime) | Port leave | Allied station — training, shopping, ship upgrades |
| 5 (Standard) | New threat | Different station or moon base |

### Fantasy

| Arc sequence | Pattern | Setting progression |
|-------------|---------|---------------------|
| 1 (Standard) | Village mystery | Town + surrounding wilderness |
| 2 (Standard) | Dungeon delve | Underground complex beneath the town |
| 3 (Branching) | Faction war | Town → choose: join the crown OR join the rebellion OR go freelance |
| 4 (Downtime) | Guild training | City guild hall — mentorship, crafting, lore research |
| 5 (Epic) | Kingdom at stake | City + wilderness + enemy stronghold + ancient ruins |

### Historical

| Arc sequence | Pattern | Setting progression |
|-------------|---------|---------------------|
| 1 (Standard) | Court intrigue | Palace and surrounding district |
| 2 (Standard) | Military campaign | Battlefield + camp + nearby town |
| 3 (Branching) | Allegiance test | Choose: loyalty to the crown OR defect OR play both sides |
| 4 (Downtime) | Between campaigns | Home estate — training, relationships, political manoeuvring |
| 5 (Epic) | War of succession | Multiple cities + armies + diplomatic missions |

---

## Campaign Rhythm

A well-paced campaign alternates intensity and type. The rhythm should feel like breathing —
tension, release, tension, release — with escalating stakes across the full campaign.

### Anti-Patterns (avoid)

- **Three standard arcs in a row** — becomes a treadmill. Insert a branching or downtime arc.
- **Epic arc before level 5** — the character isn't ready for expanded scope.
- **Downtime immediately after downtime** — nothing happened. Something should happen.
- **Same reversal type twice** — the player will see it coming.
- **Same setting type twice** — if Arc 1 was a space station, Arc 2 should not be another space station.
- **All arcs the same length** — vary between 5-scene downtime, 15-scene standard, 30-scene epic.

### Recommended First-Campaign Rhythm

For a new player's first campaign (arcs 1–5):

```
Arc 1: Standard (10–15 scenes) — establish the world, teach mechanics
Arc 2: Standard (12–18 scenes) — deepen the world, introduce factions
Arc 3: Branching (15–20 scenes) — first major choice, stakes rise
Arc 4: Downtime (5–8 scenes) — breathe, train, build relationships
Arc 5: Epic (25–35 scenes) — everything converges, high stakes
```

After Arc 5, the cycle can repeat with higher-level variants, or the campaign can conclude
with an epilogue scene.

---

## Integration Notes

This module complements but does not replace:
- **story-architect.md** — still governs thread tracking, pacing, NPC arcs, and foreshadowing
  within each arc. This module governs the shape of arcs across a campaign.
- **core-systems.md** — still defines carry-forward rules, level thresholds, and arc transition
  mechanics. This module defines WHICH arc type to transition to.
- **scenarios.md** — still generates scenario cards for the player to choose. This module
  defines the arc type that constrains scenario generation.
- **adventure-authoring.md** — authored adventures can specify arc types in their story spine.
  This module provides the patterns that authors should follow.

The GM should consult this module when:
1. Planning the next arc after a conclusion
2. Designing a branch choice for a branching arc
3. Deciding whether to offer downtime
4. Choosing a reversal type that differs from the previous arc
5. Building the location atlas for a new setting
