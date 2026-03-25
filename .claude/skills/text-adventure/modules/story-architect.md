# Story Architect — Narrative Tracking Engine
> Module for text-adventure orchestrator. Always loaded (recommended for all adventures longer than 3 scenes).

The Story Architect is a GM-side narrative tracking system for branching plotlines, consequence
propagation, foreshadowing, and dramatic pacing. The player never sees these data structures
directly — what they feel is a world that remembers, a story that responds to their decisions,
and a pace that never stalls or overwhelms.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: all other modules (consumes
quest data from core-systems, world flags from the orchestrator, NPC profiles from ai-npc and
procedural-world-gen, and session state from save-codex). For multi-arc campaign structure,
arc type selection, reversal variety, and downtime patterns, see `modules/arc-patterns.md`.

---

## § CLI Commands

| Action | Command | Tool |
|--------|---------|------|
| Render scene | `tag render scene --style <style>` | Run via Bash tool |
| Set story state | `tag state set storyArchitect.<path> <value>` | Run via Bash tool |

> **All widget output must be produced by running the `tag` CLI via Bash tool.** Do not hand-code HTML, CSS, or JS for scene rendering — use the commands above.

---

## CRITICAL — Cross-Arc Thread Continuation

When an arc concludes, the Story Architect determines which threads carry forward
into the next arc. This is the narrative bridge between adventures.

### Thread Fate at Arc Conclusion

| Thread Status | Fate |
|--------------|------|
| `resolved` | Archived. Referenced in arc summary but not carried forward. |
| `active` or `escalating` | If marked `crossArc: true`: seeded into new arc as `dormant`. Otherwise: force-resolved in epilogue. |
| `climaxing` | Must resolve before arc ends. Cannot carry forward mid-climax. |
| `dormant` | Carried forward automatically — these are unfinished business. |
| `abandoned` | Dropped. Not carried forward. |

### Marking Threads for Cross-Arc Carry

Add `crossArc: true` to any thread that should persist across arc boundaries:

```js
{
  id: 'naval-conspiracy',
  type: 'faction',
  status: 'active',
  crossArc: true,  // this thread continues in the next arc
  crossArcNote: 'The conspiracy extends beyond this ship.',
}
```

### Seeding Threads from carryForward

When a new arc begins, the Story Architect seeds threads from the previous arc's
carryForward data:

```js
function seedThreadsFromCarryForward(carryForward, newArcNumber) {
  const threads = [];

  // Main thread: derived from world consequences
  threads.push({
    id: 'main-quest-arc' + newArcNumber,
    type: 'main',
    status: 'seeded',
    priority: 1,
    seedScene: 1,
    crossArcOrigin: carryForward.worldConsequences,
    // GM generates title and beats from consequences
  });

  // NPC threads: from NPCs with strong dispositions
  carryForward.npcDispositions
    .filter(n => n.alive && (n.toward_player > 70 || n.toward_player < 30))
    .forEach(n => {
      threads.push({
        id: 'npc-' + n.id + '-arc' + newArcNumber,
        type: 'npc-arc',
        status: 'seeded',
        priority: 3,
        crossArcOrigin: { npcId: n.id, disposition: n.disposition },
      });
    });

  // Faction threads: from factions with extreme standings
  Object.entries(carryForward.factionStates)
    .filter(([, standing]) => standing > 60 || standing < -60)
    .forEach(([faction, standing]) => {
      threads.push({
        id: 'faction-' + faction + '-arc' + newArcNumber,
        type: 'faction',
        status: 'seeded',
        priority: 2,
        crossArcOrigin: { faction, standing },
      });
    });

  return threads;
}
```

---

## Architecture Overview

```
GM receives player input
        ↓
Pre-scene checklist runs (see §9)
        ↓
GM identifies: thread(s) to advance, foreshadowing to reinforce/pay off,
  consequence effects due, pacing recommendation
        ↓
Scene generated with narrative intent baked in
        ↓
Post-scene: GM updates storyArchitect state
        ↓
State persists in gmState.storyArchitect for next scene
```

The Story Architect organises narrative intent — it does not generate prose.

---

## Story Thread System

A story thread is any narrative strand the player might follow, ignore, or stumble into.
Track threads in `gmState.storyArchitect.storyThreads`.

### Thread Structure

```js
{
  id: string,           // e.g. "main-quest", "npc-voss-arc", "faction-meridian"
  type: string,         // "main" | "subplot" | "npc-arc" | "faction" | "mystery" | "personal"
  title: string,        // e.g. "The Chip Beneath the Glass"
  status: string,       // lifecycle state (see Thread Lifecycle)
  priority: number,     // 1 (most urgent) to 5 (background texture)
  seedScene: number,    // scene where this thread was introduced
  lastTouched: number,  // last scene where this thread was advanced
  beats: [
    { scene: number, event: string, consequence: string }
  ],
  branches: [
    { scene: number, choice: string, taken: string, notTaken: string[] }
  ],
  connections: string[], // IDs of related threads
  resolution: string|null
}
```

### Example — Freeport Meridian

```js
{
  id: "main-quest", type: "main", title: "The Manifest Discrepancy",
  status: "active", priority: 1, seedScene: 1, lastTouched: 3,
  beats: [
    { scene: 1, event: "Gareth noticed the cargo manifest totals do not match",
      consequence: "Docking authority has a reason to detain the ship" },
    { scene: 3, event: "Bartender mentioned a second manifest",
      consequence: "New objective: find the original in the portmaster's office" }
  ],
  branches: [
    { scene: 2, choice: "Report the discrepancy or stay quiet",
      taken: "Stayed quiet and investigated privately",
      notTaken: ["Reported to docking authority", "Confronted the first mate"] }
  ],
  connections: ["npc-bartender-arc", "faction-docking-authority"],
  resolution: null
}
```

---

## Thread Lifecycle

```
seeded → active → escalating → climaxing → resolving → resolved
                                    ↑            ↓
                                dormant ←────────┘
                                    ↓
                                abandoned
```

| Status | Meaning |
|--------|---------|
| **seeded** | Introduced via environmental detail, NPC mention, or background event. Player may not be aware yet. |
| **active** | Player has engaged directly — asked, investigated, or acted on it. |
| **escalating** | Stakes rising, complications multiplying. New obstacles emerge. |
| **climaxing** | Peak moment — confrontation, revelation, or point of no return. |
| **resolving** | Aftermath playing out. NPCs react, world reshapes. Consequence chains deliver. |
| **resolved** | Complete. Record resolution for callbacks. No longer demands scene time. |
| **dormant** | Deliberately paused. Track why and what reactivates it. Not forgotten — waiting. |
| **abandoned** | Player chose not to engage. May still affect world state passively. |

An abandoned thread does not vanish — the docking authority still acts on the manifest
discrepancy even if the player ignores it.

---

## Foreshadowing Registry

Track foreshadowing in `gmState.storyArchitect.foreshadowing`.

### Structure

```js
{
  id: string,              // e.g. "maintenance-hatch-ajar"
  planted: number,         // scene where seed was planted
  detail: string,          // what the player saw/heard
  payoff: string,          // intended payoff
  status: string,          // "planted" | "reinforced" | "paid-off" | "subverted"
  reinforcedIn: number[],  // scenes where the seed was reinforced
  linkedThread: string     // thread ID this serves
}
```

### Rules

**Every seed must resolve.** Paid off (significance revealed) or deliberately subverted
(means something different than expected). Never plant and forget.

**Reinforce before payoff.** At least one reinforcement — a subtle reminder, related
observation, or near-miss — before the payoff lands. This builds unconscious expectation.

Example for the Freeport Meridian:
- Scene 4 (planted): "The maintenance hatch on Deck 3 was ajar."
- Scene 7 (reinforced): "Scuff marks on the corridor floor near Deck 3."
- Scene 10 (paid off): "The hatch opens onto a crawlway packed with unmarked crates."

**Staleness check.** If a seed has not been reinforced within 5 scenes, weave it back in.
The player's memory fades; the narrative must refresh it before payoff.

**Subversion is powerful but honest.** The planted detail gains different significance than
expected. Subversion recontextualises — it never ignores the original detail.

---

## Consequence Chain System

Every significant player choice ripples outward. The consequence chain system tracks what
happened immediately, what will happen later, and who is affected.

Track chains in `gmState.storyArchitect.consequenceChains`.

### Structure

```js
{
  trigger: { scene: number, action: string },
  immediateEffect: string,
  delayedEffects: [
    {
      triggerCondition: string,   // e.g. "Player returns to the bar"
      effect: string,
      delivered: boolean,
      deliveryScene: number|null
    }
  ],
  affectedThreads: string[],
  affectedNPCs: string[],
  worldFlagSet: string|null       // e.g. "npc_bartender_knows_manifest"
}
```

### Example — Freeport Meridian

```js
{
  trigger: { scene: 3, action: "Told the bartender about the manifest discrepancy" },
  immediateEffect: "The bartender paused mid-pour. She knows more than she is saying.",
  delayedEffects: [
    { triggerCondition: "Player returns to bar after visiting portmaster's office",
      effect: "Data chip left under Gareth's usual glass — crawlway coordinates.",
      delivered: false, deliveryScene: null },
    { triggerCondition: "Player encounters docking authority patrol",
      effect: "Patrol mentions someone matching Gareth's description asking questions.",
      delivered: false, deliveryScene: null }
  ],
  affectedThreads: ["main-quest", "npc-bartender-arc"],
  affectedNPCs: ["Seren Voss"],
  worldFlagSet: "npc_bartender_knows_manifest"
}
```

### Rules

**Every significant choice creates a chain.** Confiding in an NPC, betraying a faction,
destroying evidence, or sparing an enemy always qualifies. Walking through a door does not.
The test: does this action change someone's disposition, reveal information, or close a path?

**Delayed effects trigger naturally.** Fire when the player revisits a location, encounters
an affected NPC, or when the narrative demands it. Never force a consequence into a scene
where it would feel contrived.

**Limit delivery.** Never deliver more than 2 delayed consequences in a single scene.
Prioritise the most dramatically relevant; defer the rest.

**Contradiction resolution.** When chains produce contradictory effects, resolve in favour
of the most recent player choice.

**World flag linkage.** When a chain sets a flag via `worldFlagSet`, it enters
`gmState.worldFlags` and persists for the rest of the adventure.

---

## Dramatic Pacing Tracker

Track pacing in `gmState.storyArchitect.pacing`.

### Structure

```js
{
  currentAct: number,         // 1, 2, or 3
  tensionLevel: number,       // 1 (calm) to 10 (climax)
  lastTensionShift: number,   // scene of last significant tension change
  pacingNotes: string,        // GM reminder, e.g. "Player needs a breather"
  complicationBudget: number, // complications remaining before climax
  recentBeats: string[]       // last 5 scene types: "action" | "discovery" |
                              //   "dialogue" | "quiet" | "confrontation"
}
```

### Rules

**Vary scene types.** Never 3+ scenes of the same type in a row. Check `recentBeats`
before every scene. Engagement depends on contrast.

**Tension rises with local dips.** General trajectory is upward within each act, but
dip after peaks for breathing room. 4→6→5→7→6→8 is healthier than 4→5→6→7→8.

**Act structure:**

| Act | Scenes | Tension | Purpose |
|-----|--------|---------|---------|
| 1 | 1–4 | 2–5 | Establish world, introduce threads, plant foreshadowing |
| 2 | 5–10 | 4–8 | Escalate threads, deliver consequences, major reversal |
| 3 | 11–15 | 6–10→3–4 | Climax, pay off foreshadowing, denouement |

**Act 2 reversal (mandatory).** Something the player believed turns out to be wrong, a
trusted ally reveals an unexpected agenda, or the apparent solution creates a bigger problem.
In the Freeport Meridian: the manifest discrepancy was not smuggling — it was a cover for
evacuating political refugees. The player's investigation has endangered the very people
they might want to protect.

**Act 3 denouement (mandatory).** Tension peaks at 8–10, then resolves to 3–4. Never end
on the climax beat — always provide at least one quiet scene after.

**Complication budget.** Starts at 4–6. Each significant complication decrements by 1.
When it reaches 0, the next escalating thread should shift to climaxing.

### Example — Freeport Meridian

```js
{
  currentAct: 2, tensionLevel: 6, lastTensionShift: 5,
  pacingNotes: "Gareth survived the cargo bay confrontation — next scene should breathe.",
  complicationBudget: 3,
  recentBeats: ["action", "dialogue", "discovery", "action", "confrontation"]
}
```

### Epic Arc Pacing (Level 5+ Required)

Epic arcs extend the standard 3-act structure for longer, more complex narratives.
They are only available when the player's character is level 5 or above.

| Act | Scenes | Tension | Purpose |
|-----|--------|---------|---------|
| 1 | 1-6 | 2-5 | Extended establishment, multiple thread introductions, deeper world-building |
| 2 | 7-14 | 4-9 | Multiple reversals, faction power shifts, alliance tests |
| 3 | 15-20 | 6-10→3-4 | Multi-stage climax, cascading consequences, extended denouement |

Epic arcs have:
- **Higher complication budget:** 6-8 complications (vs 4-6 for standard)
- **Tension ceiling of 10+** for climax moments (standard caps at 8)
- **Multiple simultaneous escalating threads** (3-4 vs standard's 2-3)
- **At least one major reversal** per act (standard has one in Act 2)

### Branching Arc Paths

Branching arcs add decision points at arc conclusion that determine the next arc's
scenario. The Story Architect tracks these via `branchPoints`:

```js
branchPoints: [
  {
    scene: 15,                // when the branch is presented
    description: 'The conspiracy is exposed. What does Tessa do next?',
    paths: [
      {
        id: 'witness-protection',
        label: 'Enter witness protection',
        consequence: 'Tessa disappears. New identity, new station, old enemies.',
        nextArcSeed: 'witness-protection',
      },
      {
        id: 'double-agent',
        label: 'Go undercover inside Meridian',
        consequence: 'Tessa becomes a double agent. Higher stakes, deeper cover.',
        nextArcSeed: 'double-agent',
      },
      {
        id: 'freelance',
        label: 'Go freelance with the evidence',
        consequence: 'Tessa sells information to the highest bidder. Everyone is a client and a threat.',
        nextArcSeed: 'freelance',
      },
    ],
    chosen: null,  // set when player decides
  },
]
```

At arc conclusion, branching arcs present the paths as action cards in the conclusion
widget instead of a single "Continue to next arc" button. The chosen path determines
the `nextArcSeed` which is passed to `deriveArcSeed()` in procedural-world-gen.

---

## Thread Management Rules

### Limits

- **Maximum 3 active threads at once.** If a fourth needs activating, one must shift to
  dormant, resolving, or resolved first.
- **Maximum 5 total tracked threads** (active + seeded + escalating). Resolve or shelve
  before introducing more.
- **One dormant thread resurfacing per session.** Never reactivate multiple simultaneously.

### Hygiene

- **Review every 3–5 scenes.** Advance or touch at least one thread that has been quiet.
- **Dormant threads decay gracefully.** Record why paused and what reactivates. If the
  condition becomes impossible (NPC dead, location destroyed), shift to abandoned.
- **Abandoned threads echo.** Their consequences may still surface — an affected NPC might
  reference it, a world flag from earlier beats might influence a later scene.

### Scene Planning

Before generating each scene, consult `storyThreads`:

- **1–2 threads per scene** — a primary that the scene directly advances, and optionally
  a secondary receiving a minor beat or foreshadowing plant.
- **No purely flavour scenes.** Every scene advances at least one thread, even subtly. A
  marketplace scene is an opportunity to overhear faction gossip, spot a familiar face, or
  notice something out of place.

In the Freeport Meridian, even ordering a drink at the bar advances the npc-bartender-arc —
her reaction, whether she meets Gareth's eyes, the shift in atmosphere when the docking
authority patrol walks past the window.

---

## NPC Arc Integration

Track NPC arcs in `gmState.storyArchitect.npcArcs`.

### Structure

```js
{
  npcName: string,            // matches roster or ai-npc definition
  arc: string,                // "betrayal"|"redemption"|"fall"|"growth"|"revelation"|"steadfast"|"corruption"
  currentPhase: string,       // plain-language description of where they are
  linkedThreads: string[],    // story threads they are involved in
  playerRelationship: string, // "ally"|"neutral"|"rival"|"enemy"|"unknown"
  secrets: string[],          // things the NPC knows that the player does not
  revealConditions: string[]  // parallel array — revealConditions[i] unlocks secrets[i]
}
```

### Arc Archetypes

| Archetype | Trajectory | Freeport Meridian Example |
|-----------|-----------|--------------------------|
| betrayal | Trusted → suspicious → revealed | Crew member reporting to docking authority |
| redemption | Hostile → understanding → sacrifice | Docking officer who helps despite orders |
| fall | Noble → compromised → lost | Faction leader whose idealism curdles |
| growth | Fearful → tested → capable | Bartender who becomes an active ally |
| revelation | Mysterious → partially known → understood | NPC whose true motive reframes events |
| steadfast | Consistent — reveals depth, not change | A loyal companion as a rock in shifting sands |
| corruption | Good → tempted → turned | Ally co-opted by an opposing faction |

### Rules

- **Link arcs to threads.** Every arc must connect to at least one story thread.
- **Gate secrets behind conditions.** Never reveal arbitrarily — the player earns it
  through actions, trust, or thread progress.
- **Phases are descriptive.** "Guarded but curious — watching what Gareth does with the
  information she shared" is a valid phase.

### Example — Freeport Meridian

```js
{
  npcName: "Seren Voss", arc: "growth",
  currentPhase: "Guarded but curious — shared one piece of information, watching what Gareth does with it.",
  linkedThreads: ["main-quest", "npc-bartender-arc"],
  playerRelationship: "neutral",
  secrets: [
    "She is the portmaster's sister with after-hours office access.",
    "She has been helping refugees — the data chip was not the first."
  ],
  revealConditions: [
    "Relationship shifts to ally, or player discovers the family connection independently.",
    "Main quest completed, or player asks directly after finding evidence."
  ]
}
```

---

## Session Recap Integration

When the save-codex generates a session recap, the Story Architect contributes:

- **Active thread summaries** — one sentence per active/escalating thread.
- **Unresolved foreshadowing count** — "There are 3 threads you have not yet pulled on."
- **Pending consequence count** — "Your earlier choices have set 4 events in motion."
- **Act and tension** — presented narratively: "You are in the middle of the story."
- **Attention flag** — which thread needs attention based on `lastTouched` and priority.

---

## GM Internal Checklist

### Pre-Scene

```
1. THREADS      Which thread(s) does this scene advance?
2. FORESHADOW   Any seeds to reinforce or pay off? (Stale if >5 scenes without reinforcement)
3. CONSEQUENCES Any pending delayed effects whose trigger condition is now met? (Max 2 per scene)
4. PACING       recentBeats: 3+ same type? → vary. Tension vs act target?
5. NEGLECT      Any thread untouched for 3+ scenes? Weave it in.
6. NPC ARCS     Any NPC present whose arc has not advanced in 3+ scenes?
```

This checklist is a tool, not a cage. Never force a reference where it would feel unnatural,
but if the checklist reveals neglect, address it within 1–2 scenes.

### Post-Scene Update

1. Advance thread statuses. Record new beats and branches.
2. Update foreshadowing — mark reinforced, paid-off, or subverted.
3. Mark delivered consequences and set `deliveryScene`.
4. Adjust tension level. Append to `recentBeats` (keep last 5).
5. Decrement complication budget if a new complication was introduced.
6. Update NPC arc phases for any NPCs who appeared.

---

## Integration with gmState

The Story Architect adds a single key to `gmState`:

```js
gmState: {
  // ...existing fields...
  storyArchitect: {
    storyThreads: [],
    foreshadowing: [],
    consequenceChains: [],
    pacing: {
      currentAct: 1,
      tensionLevel: 2,
      lastTensionShift: 0,
      pacingNotes: "",
      complicationBudget: 5,
      recentBeats: []
    },
    npcArcs: []
  }
}
```

### World Flag Prefix

The Story Architect uses prefix `story_` for flags it sets directly (e.g.,
`story_act2_reversal_delivered`, `story_climax_reached`). Consequence chains may set
flags with other prefixes (e.g., `npc_bartender_knows_manifest`) on behalf of the
relevant module.

### Relationship to Core Systems

The `quests` array (core-systems) tracks mechanical objectives — what the player needs to
do. The `storyThreads` track the narrative layer above — why it matters and where it is
going. They are complementary:

| | core-systems `quests` | story-architect `storyThreads` |
|-|----------------------|-------------------------------|
| Scope | Task ("Find the manifest") | Narrative ("The Manifest Discrepancy") |
| Player-facing? | Yes (quest panel) | No (GM-internal) |
| Lifecycle | active → completed/failed | seeded → ... → resolved/abandoned |

When a quest objective completes, the corresponding thread should receive a beat.

### Relationship to Procedural World Gen

When `procedural-world-gen` is active, the Story Architect seeds threads from generated data:

- Quest hooks from `worldData.hooks` → seeded story threads
- Faction tensions from `worldData.factions.relations` → faction-type threads
- NPC secrets from the roster → mystery or npc-arc threads

The Story Architect builds a narrative layer on top of `worldData` — it never modifies it.

---

## Initialisation

```js
gmState.storyArchitect = {
  storyThreads: [],
  foreshadowing: [],
  consequenceChains: [],
  pacing: {
    currentAct: 1, tensionLevel: 2, lastTensionShift: 0,
    pacingNotes: "Opening — establish atmosphere and introduce the world.",
    complicationBudget: 5, // 4–6 typical; hand-set in authored mode
    recentBeats: []
  },
  npcArcs: []
};

// Procedural mode: seed from worldData
if (gmState.worldData) {
  // Main hook → main thread (seeded, priority 1)
  // Side hooks → subplot threads (seeded, priority 3)
  // NPCs with secrets → npc-arc entries (arc: "revelation", relationship: "unknown")
}
```

---

## Anti-Patterns

- Never expose Story Architect data to the player — thread IDs, tension levels, and
  consequence chains are GM-internal.
- Never let a foreshadowing seed go unpaid — if the adventure ends with "planted" seeds,
  the GM has dropped a thread.
- Never deliver more than 2 delayed consequences in a single scene.
- Never run 3+ scenes of the same type consecutively.
- Never exceed 3 active threads or 5 total tracked threads simultaneously.
- Never skip the pre-scene checklist.
- Never create a scene that advances zero threads.
- Never contradict a world flag set by a consequence chain.
- Never reactivate more than one dormant thread per session.
- Never reveal NPC secrets without their reveal condition being met.
- Never forget abandoned threads — their passive effects persist.
- Never let the Act 2 reversal slide — it is the structural hinge of the adventure.
