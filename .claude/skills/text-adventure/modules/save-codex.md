# Save Codex — Session Persistence Engine
> Module for text-adventure orchestrator. Loaded when the player wants to save or resume sessions.

The Save Codex encodes everything needed to resume a text adventure session into a single copyable
string. That string can be pasted into a new conversation, shared with another player, posted to a
forum, or stored in a notes app. No accounts. No servers. No localStorage. The save *is* the string.

Current CLI behaviour in v1.3.0:

- `tag save generate` emits a checksummed `SF2:` payload containing full game state as raw base64 JSON.
- Save and export payloads are generated on demand from the footer `Save ↗` / `Export ↗` actions.
  They are not embedded in scene HTML.
- Legacy `SC1:` / `SF1:` payloads are accepted on load for migration and resume only.

Historical compact/full design notes remain below for migration context, but they do **not**
describe the live generation path used by the current CLI.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: all other modules (captures their state for persistence).

---

## CRITICAL — Resume Setup Requirements

**Resuming from a save requires the same engine boot as a new game.** Before rendering
the resume scene, the GM **must** follow the **Resume from Save Checklist** in
`modules/gm-checklist.md`. The most commonly skipped steps:

1. **Read the active visual style file** from `styles/` (determined by save metadata)
2. **Read `styles/style-reference.md`** for structural patterns
3. **Load all required modules** for the scenario type
4. **Reinitialise storyArchitect and worldHistory** from restored state
5. **If the save contains an `arc` field**, load arc context and apply `carryForward` data before generating the world

Skipping these causes visual style drift, missing module behaviour, and broken
narrative tracking. A resume is not "just render a scene" — it is a full engine boot
with pre-loaded state.

---

## § CLI Commands for This Module

| Action | Command | Tool |
|--------|---------|------|
| Generate save | `tag save generate` | Run via Bash tool |
| Load save | `tag save load <file.save.md>` | Run via Bash tool |
| Validate save | `tag save validate <file.save.md>` | Run via Bash tool |
| Migrate old save | `tag save migrate <file>` | Run via Bash tool |

---

## Architecture Overview

```
GM renders scene widget
        ↓
Player clicks Save ↗ in the footer
        ↓
sendPrompt asks Claude to run `tag save generate`
        ↓
Save Codex reads current gmState and serialises full state
        ↓
JSON → base64 → `SF2:` prefix → checksum prepended
        ↓
Claude presents a downloadable `.save.md` artifact
        ↓
Fallback (sendPrompt unavailable): copy the prompt from the tooltip and run it manually
        ═══════════════════════════════════════════════════
Player resumes: pastes save string, uploads `.save.md`, or pastes `.save.md` content
        ↓
Save Codex validates checksum, decodes `SF2:` base64 JSON, and loads state
        ↓
Legacy `SC1:` / `SF1:` payloads are accepted only for migration and resume
        ↓
Send gmState to GM via sendPrompt → session resumes
```

---

## Save File Format — `.save.md`

When the player clicks Save, `sendPrompt()` asks Claude to generate the `.save.md` file as a downloadable
conversation artifact. The file uses YAML frontmatter for metadata and markdown body for
the save payload. This format is both human-readable (the frontmatter) and
machine-parseable (the payload string).

### File structure

```yaml
---
format: text-adventure-save
version: 1
skill-version: "1.3.0"
character: "Gareth Williams"
class: "Bartender"
level: 2
scene: 7
location: "The Oxidiser — Bar Floor"
date-saved: "2026-03-19T22:30:00Z"
game-title: "Freeport Meridian"
theme: "space"
visual-style: "station"
seed: "pale-threshold-7"
mode: "full"
arc: 1
arc-type: "standard"
---

# Save — Gareth Williams, Scene 7

To resume this adventure, paste the string below into a new conversation along with
the instruction "Continue this text adventure":

```
2f3c4d5e.SF2:eyJ2IjoxLCJtb2RlIjoiZnVsbCIsInNjZW5lIjo3LCJjaGFyYWN0ZXIiOns...
```

*Saved from Freeport Meridian — The Oxidiser, Bar Floor*
*Scene 7 · Level 2 · 2026-03-19*
```

### Frontmatter fields

| Field | Required | Description |
|-------|----------|-------------|
| `format` | Yes | Always `text-adventure-save` — identifies the file type |
| `version` | Yes | Save format version (integer, currently `1`) |
| `skill-version` | Yes | Text-adventure skill version for compatibility checking |
| `character` | Yes | Character name |
| `class` | Yes | Character class/archetype |
| `level` | Yes | Current level |
| `scene` | Yes | Scene number |
| `location` | Yes | Current location name |
| `date-saved` | Yes | ISO 8601 timestamp |
| `game-title` | Yes | Adventure/campaign title |
| `theme` | Yes | Genre theme (space, fantasy, horror, etc.) |
| `visual-style` | Yes | Active visual style filename without extension (e.g. `station`, `neon`) |
| `seed` | If compact | World generation seed |
| `mode` | Yes | `compact` or `full` |
| `arc` | No (defaults to 1) | Current arc number |
| `arc-type` | No (defaults to standard) | `standard`, `epic`, or `branching` |

---

> **CLI:** The `tag save generate` command produces identical save payloads using
> the same FNV-1a checksum and base64 encoding.

## Footer-Initiated Save Generation

Scene widgets do **not** embed hidden save payloads. The footer `Save ↗` action asks Claude
to run `tag save generate`, and the generated `.save.md` artifact becomes the canonical save output.
If `sendPrompt()` is unavailable, the widget falls back to a copyable prompt in the button tooltip.

### Implementation

The GM generates save data for every scene by running:

```bash
tag save generate
```

The CLI produces the checksummed, encoded save payload. The footer Save button uses
`sendPrompt()` to ask Claude to generate the `.save.md` file as a downloadable
conversation artifact.




### GM Instruction — Generating Saves

The GM **must** run `tag save generate` via the Bash tool to produce the save payload.
Never hand-code save encoding, checksums, or base64. The CLI handles all of this.
Manual encoding produces incorrect FNV-1a checksums — the load command will reject the
save as corrupt, and the player will be unable to resume their session. Even if the
checksum happens to pass, hand-built base64 frequently drops fields or mis-compresses
keys, causing silent data loss (missing inventory, reset faction standings, lost story
threads) that only surfaces mid-session when the damage is irreversible.

When the player clicks Save, the scene widget fires a `sendPrompt()` that instructs the
GM to:

1. Run `tag save generate` via the Bash tool.
2. Take the CLI output and present it as a downloadable `.save.md` artifact.

This approach bypasses the iframe sandbox restrictions that silently block Blob downloads
in Claude.ai widgets.

---

## The Full gmState Contract

Before building the save payload, the Save Codex must understand the complete state shape
contributed by each skill in the toolkit. This is the canonical `gmState` schema when all skills
are active:

<!-- CLI implementation detail — do not hand-code -->
```js
const gmState = {
  // ── Core (orchestrator) ─────────────────────────────────────
  scene: 7,
  currentRoom: 'room_4',
  visitedRooms: ['room_0', 'room_1', 'room_2', 'room_4'],
  rollHistory: [
    { scene: 3, action: 'force door', roll: 14, dc: 12, outcome: 'success' },
  ],

  // ── Character ───────────────────────────────────────────────────────────
  character: {
    name: 'Kira Sable',
    class: 'Scout',
    hp: 7,
    maxHp: 9,
    stats: { STR: 10, DEX: 16, INT: 12, WIS: 14, CON: 11, CHA: 13 },
    inventory: [
      { id: 'medkit',    name: 'Emergency medkit', type: 'consumable', uses: 1  },
      { id: 'keycard_b', name: 'Level-B keycard',  type: 'key_item',   uses: -1 },
    ],
    conditions: ['poisoned'],
    xp: 340,
    level: 2,
  },

  // ── World flags (any skill can set these) ────────────────────────────────
  worldFlags: {
    alarmTriggered: true,
    escalationTier: 2,
    npcAlive_maren_voss: false,
    doorOpen_room2_north: true,
    itemTaken_item_keycard_b: true,
    factionAllied_crew: true,
  },

  // ── Procedural world (procedural-world-gen module) ─────────────────────
  seed: 'pale-threshold-7',
  theme: 'space',
  // worldData is NOT stored — regenerated from seed on resume

  // ── NPC roster mutations (ai-npc module) ──────────────────────────────
  // Only NPCs whose state has diverged from the generated default are stored.
  // pronouns is always stored — it is not part of the procedural seed in
  // authored adventures and must survive resume even in procedural mode as
  // a consistency safeguard.
  rosterMutations: [
    { id: 'maren_voss', pronouns: 'she/her', alive: false, killedInScene: 5 },
    { id: 'finn_holt',  pronouns: 'he/him', disposition: 'friendly', trust: 72, currentRoom: 'room_6' },
  ],

  // ── Codex mutations (lore-codex module) ────────────────────────────────
  // Only entries that have changed from their generated initial state.
  codexMutations: [
    { id: 'faction_crew',           state: 'discovered', discoveredAt: 2, via: 'told:Finn Holt' },
    { id: 'location_room_4',        state: 'discovered', discoveredAt: 4, via: 'observed:direct observation' },
    { id: 'character_maren_voss',   state: 'discovered', discoveredAt: 3, via: 'told:Finn Holt',
      secrets: ['She falsified the manifest on the captain\'s orders.'] },
    { id: 'item_keycard_b',         state: 'discovered', discoveredAt: 4, via: 'read:keycard label' },
    { id: 'quest_main',             state: 'discovered', discoveredAt: 2, via: 'deduced:direct observation' },
  ],

  // ── Time state (core-systems module) ──────────────────────────────────
  // The GM always tracks internal truth. Player visibility is a separate concern —
  // a pre-clock character may only see "dusk" while the GM knows "18:30, Day 3".
  time: {
    period: 'dusk',                     // dawn | morning | midday | afternoon | dusk | evening | night | late_night | small_hours
    date: 'Day 3 of the Siege',         // setting-appropriate date format (internal truth)
    elapsed: 3,                          // days elapsed since adventure start (always tracked)
    hour: 18,                            // 0–23 internal hour (always tracked, even in pre-clock settings)
    playerKnowsDate: false,              // does the character have access to a calendar?
    playerKnowsTime: false,              // does the character have a clock, sundial, or equivalent?
    calendarSystem: 'custom',            // gregorian | stardate | roman | custom | elapsed-only
    deadline: null,                      // null or { label: 'Storm arrives', remainingScenes: 4 }
  },

  // ── Story Architect state (story-architect module) ────────────────────
  // Persists ALL narrative scaffolding — threads, foreshadowing, consequences.
  // Without this, the GM loses the entire plot structure on resume.
  storyArchitect: {
    threads: [
      { id: 'main-quest', type: 'main', status: 'active', priority: 1,
        seedScene: 1, lastTouched: 7, crossArc: false,
        beats: ['discovered contamination', 'confronted Voss', 'accessed section 7'] },
      { id: 'maren-guilt', type: 'character', status: 'escalating', priority: 2,
        seedScene: 3, lastTouched: 6, crossArc: true,
        beats: ['first evasion', 'player showed evidence'] },
    ],
    foreshadowing: [
      { id: 'fs_cargo_noise', planted: 2, reinforced: [4], status: 'planted' },
    ],
    consequences: [
      { trigger: 'alarm_triggered', immediate: 'escalationTier +1',
        delayed: [{ effect: 'security_lockdown', deliverAfterScenes: 2, delivered: false }] },
    ],
    pacing: { act: 1, actProgress: 0.4, recentBeats: ['action','discovery','action'] },
  },

  // ── Ship state (ship-systems module) ──────────────────────────────────
  // Persists vessel damage, power allocation, conditions. Without this,
  // a ship at 15% hull resumes at full health and DC modifiers silently change.
  shipState: {
    name: 'Ulysses',
    systems: {
      hull:         { integrity: 85, status: 'operational', conditions: [] },
      engines:      { integrity: 45, status: 'degraded',    conditions: ['venting'] },
      power_core:   { integrity: 100, status: 'operational', conditions: [] },
      life_support: { integrity: 70, status: 'operational', conditions: [] },
      weapons:      { integrity: 0,  status: 'offline',     conditions: [] },
      sensors:      { integrity: 60, status: 'degraded',    conditions: [] },
      shields:      { integrity: 30, status: 'critical',    conditions: [] },
    },
    powerAllocations: { engines: 2, life_support: 2, weapons: 0, sensors: 1, shields: 1 },
    repairParts: 3,
    scenesSinceRepair: 2,
  },

  // ── Crew state (crew-manifest module) ─────────────────────────────────
  // Persists individual morale, loyalty, stress — without this, a mutinous
  // crew member resumes as a happy employee.
  crewMutations: [
    { id: 'petrov_vas', pronouns: 'he/him', morale: 35, loyalty: 40, stress: 70,
      status: 'active', assignedTo: 'engines',
      relationships: { chen_ora: 'hostile', sable_rin: 'bonded' } },
    { id: 'chen_ora', pronouns: 'she/her', morale: 60, loyalty: 55, stress: 30,
      status: 'active', assignedTo: null,
      relationships: { petrov_vas: 'wary' } },
  ],

  // ── Map state (geo-map module) ────────────────────────────────────────
  // Persists progressive revelation, door states, wilderness supplies.
  mapState: {
    activeMapType: 'settlement',          // settlement | wilderness | dungeon
    revealedRooms: ['room_3', 'room_5'],  // revealed but not yet visited
    doorStates: {                          // only doors whose state changed from default
      'room_2_north': 'open',             // open | closed | locked | jammed | destroyed
      'room_5_east': 'locked',
    },
    supplies: { rations: 5, water: 3 },   // wilderness survival tracking
  },

  // ── RPG system resources (rpg-systems module) ─────────────────────────
  // System-specific resource pools that reset incorrectly without persistence.
  systemResources: null,                   // null for d20_system (no extra resources)
  // Examples for other systems:
  // { spellSlots: [3, 2, 1], hitDice: 4, hitDiceUsed: 1 }              // D&D 5e
  // { momentum: 3 }                                                      // Narrative Engine
  // { fatigue: 2 }                                                       // GURPS Lite
  // { edge: 2 }                                                          // Shadowrun

  // ── Navigation state (star-chart module) ──────────────────────────────
  // plottedCourse is the only nav field not captured by worldFlags.
  navPlottedCourse: null,                  // null or ['system_a', 'system_b', 'system_c']
};
```

---

## Arc System — carryForward

When the player transitions to a new arc at adventure conclusion, the save-codex
builds a `carryForward` object that captures everything the new arc needs from the
previous one. This object is embedded in the save payload and applied to the fresh
gmState when the new arc begins.

### carryForward Schema

<!-- CLI implementation detail — do not hand-code -->
```js
const carryForward = {
  characterIdentity: {
    name: 'Tessa Marchetti',
    class: 'Cargo Runner',
    level: 5,
    xp: 2400,
    stats: { STR: 10, DEX: 16, CON: 11, INT: 11, WIS: 10, CHA: 14 },
    proficiencies: ['Stealth', 'Deception', 'Persuasion', 'Acrobatics'],
    abilities: ['Evasion', 'Quick Draw'],
    reputation: 'Known smuggler-turned-whistleblower. Allied with naval intelligence.',
  },
  factionStates: {
    meridian_shipping: -80,  // hostile after exposure
    naval_intelligence: 65,  // allied through cooperation
    dock_workers_union: 30,  // neutral-positive
  },
  npcDispositions: [
    { id: 'strand', pronouns: 'he/him', alive: true, disposition: 'allied', toward_player: 85 },
    { id: 'karim', pronouns: 'she/her', alive: true, disposition: 'friendly', toward_player: 72 },
    { id: 'mori', pronouns: 'she/her', alive: true, disposition: 'guarded', toward_player: 35 },
    { id: 'harlow', pronouns: 'he/him', alive: false },
  ],
  worldConsequences: [
    'Meridian Shipping conspiracy exposed — corporate leadership arrested.',
    'Josue rescued from container — revealed as naval intelligence asset.',
    'Chief Purser Mori cooperated under duress — daughter relocated to safety.',
    'Helios Reach arrived at Brannock Colonies under naval escort.',
  ],
  codexDiscoveries: [
    { id: 'faction_meridian', state: 'discovered' },
    { id: 'character_josue', state: 'discovered' },
    { id: 'location_hold3', state: 'discovered' },
  ],
  previousArcSummaries: [
    {
      arc: 1,
      title: 'The Quiet Berth',
      summary: 'Cargo runner Tessa Marchetti uncovered a human trafficking operation aboard the liner Helios Reach. Allied with the captain and ship doctor to rescue the prisoner and expose the corporate conspiracy.',
      keyOutcome: 'conspiracy_exposed',
    },
  ],
};
```

### Building carryForward at Arc Conclusion

When the player clicks "Continue to next arc", the GM builds the carryForward
object from the current gmState:

<!-- CLI implementation detail — do not hand-code -->
```js
function buildCarryForward(gmState) {
  const c = gmState.character;
  return {
    characterIdentity: {
      name: c.name,
      class: c.class,
      level: c.level,
      xp: c.xp,
      stats: { ...c.stats },
      proficiencies: [...(c.proficiencies || [])],
      abilities: [...(c.abilities || [])],
      reputation: generateReputationSummary(gmState),  // GM writes 1-2 sentences
    },
    factionStates: Object.entries(gmState.worldFlags)
      .filter(([k]) => k.startsWith('faction_'))
      .reduce((acc, [k, v]) => { acc[k.replace('faction_', '')] = v; return acc; }, {}),
    npcDispositions: (gmState.rosterMutations || [])
      .filter(n => n.toward_player > 70 || n.toward_player < 30 || !n.alive)
      .map(n => ({ id: n.id, pronouns: n.pronouns, alive: n.alive !== false, disposition: n.disposition, toward_player: n.toward_player })),
    worldConsequences: generateConsequenceSummaries(gmState),  // GM writes 3-5 sentences
    codexDiscoveries: (gmState.codexMutations || [])
      .filter(m => m.state === 'discovered')
      .map(m => ({ id: m.id, state: m.state })),
    previousArcSummaries: [
      ...(gmState.arcHistory || []).slice(-2),  // keep last 2
      {
        arc: gmState.arc || 1,
        title: gmState.adventureTitle || 'Untitled',
        summary: generateArcSummary(gmState),  // GM writes 2-3 sentences
        keyOutcome: deriveKeyOutcome(gmState),
      },
    ],
  };
}
```

### Arc Summaries Cap

The `previousArcSummaries` array is capped at **3 entries** (FIFO). When a 4th arc
completes, the oldest summary is dropped. This prevents the carryForward object from
growing unboundedly and competing with the skill instructions for context space.

### Applying carryForward to New Arc

When the new arc begins, the GM applies carryForward to the fresh gmState:

<!-- CLI implementation detail — do not hand-code -->
```js
function applyCarryForward(gmState, carryForward) {
  // Character identity and progression
  gmState.character = {
    name: carryForward.characterIdentity.name,
    class: carryForward.characterIdentity.class,
    level: carryForward.characterIdentity.level,
    xp: carryForward.characterIdentity.xp,
    stats: { ...carryForward.characterIdentity.stats },
    proficiencies: [...carryForward.characterIdentity.proficiencies],
    abilities: [...carryForward.characterIdentity.abilities],
    hp: calculateMaxHp(carryForward.characterIdentity),  // full HP
    maxHp: calculateMaxHp(carryForward.characterIdentity),
    inventory: generateStartingGear(carryForward.characterIdentity.level),  // see core-systems.md
    conditions: [],
  };

  // World state from previous arc
  carryForward.factionStates.forEach(([faction, standing]) => {
    gmState.worldFlags['faction_' + faction] = standing;
  });

  // NPC dispositions as initial mutations
  gmState.rosterMutations = carryForward.npcDispositions;

  // Codex discoveries
  gmState.codexMutations = carryForward.codexDiscoveries;

  // Arc metadata
  gmState.arc = (carryForward.previousArcSummaries.length || 0) + 1;
  gmState.arcHistory = carryForward.previousArcSummaries;
  gmState.carryForward = carryForward;

  return gmState;
}
```

### Seed Derivation for New Arcs

The new arc's world seed is derived from the original:

<!-- CLI implementation detail — do not hand-code -->
```js
const newSeed = originalSeed + '_arc' + newArcNumber;
// See modules/procedural-world-gen.md for deriveArcSeed()
```

---

> **Historical note:** The implementation sketches below document earlier compact/full save
> strategies retained for migration context. They are not the live v1.3.0 generation path,
> which always emits checksummed `SF2:` payloads from `tag save generate`.

**What is never stored in the save payload:**
- `worldData` — always regenerated from `seed` + `theme` in compact mode
- `rollHistory` — cosmetic; not needed to resume
- Full NPC conversation histories — conversations do not persist across sessions by design
- Any field that can be derived from the seed

**What must always be stored:**
- Everything in `character` (player progression is not regenerable)
- `worldFlags` in full (every flag is a permanent consequence)
- `rosterMutations` for any NPC that is dead, has moved rooms, or has a trust score above 60
  or below 40 (i.e., meaningfully diverged from neutral) — always include `pronouns`
- `codexMutations` for every entry that has transitioned out of `locked`
- `scene` and `currentRoom`
- `time` (period, date, deadline) — without this, in-world time resets on resume
- `storyArchitect` (threads, foreshadowing, consequences, pacing) — without this, all
  narrative scaffolding is lost and the GM must reconstruct plot structure from worldFlags alone
- `shipState` when ship-systems module is active — without this, all vessel damage, power
  allocation, and system conditions reset to defaults, silently changing DC modifiers
- `crewMutations` when crew-manifest module is active — without this, individual morale,
  loyalty, and stress reset to template defaults
- `mapState` when geo-map module is active — without this, revealed zones, door states,
  and wilderness supplies are lost
- `systemResources` when using non-default rulebooks with resource tracking
- `navPlottedCourse` when star-chart module is active

---

## Compact Mode — Procedural Save

Used when `gmState.seed` is present. Stores the minimum required to restore all meaningful
player progress. The world itself is regenerated from the seed.

### Build

<!-- CLI implementation detail — do not hand-code -->
```js
function buildCompactSave(gmState) {
  const payload = {
    v: 1,                          // schema version
    mode: 'compact',
    seed: gmState.seed,
    theme: gmState.theme,
    scene: gmState.scene,
    room: gmState.currentRoom,
    visited: gmState.visitedRooms,
    char: compressCharacter(gmState.character),
    flags: gmState.worldFlags,
    npcs: compressRosterMutations(gmState.rosterMutations),
    codex: compressCodexMutations(gmState.codexMutations),
    arc: gmState.arc || 1,
    arcType: gmState.arcType || 'standard',
    carry: gmState.carryForward ? compressCarryForward(gmState.carryForward) : null,
    arcHist: gmState.arcHistory || [],
    // v1.2.0 additions — all optional, omitted when module inactive
    time: gmState.time || null,
    story: compressStoryArchitect(gmState.storyArchitect),
    ship: compressShipState(gmState.shipState),
    crew: compressCrewMutations(gmState.crewMutations),
    map: compressMapState(gmState.mapState),
    res: gmState.systemResources || null,
    navCourse: gmState.navPlottedCourse || null,
  };
  const json = JSON.stringify(payload);
  const code = 'SC1:' + btoa(json);
  return attachChecksum(code);
}

// Strip verbose character fields to minimal keys
function compressCharacter(c) {
  return {
    n: c.name,
    cl: c.class,
    hp: c.hp,
    mhp: c.maxHp,
    st: [c.stats.STR, c.stats.DEX, c.stats.INT, c.stats.WIS, c.stats.CON, c.stats.CHA],
    inv: c.inventory.map(i => ({ id: i.id, u: i.uses })),
    cond: c.conditions,
    xp: c.xp,
    lvl: c.level,
  };
}

// Only mutations that diverge meaningfully from generated defaults.
// pronouns is ALWAYS included — it is cheap (3–7 chars) and prevents
// gender drift on resume, which is a jarring continuity break.
function compressRosterMutations(mutations) {
  return (mutations || [])
    .filter(m => !m.alive || m.trust < 40 || m.trust > 60 || m.currentRoom || m.pronouns)
    .map(m => {
      const out = { id: m.id };
      if (m.pronouns)          out.pr = m.pronouns;  // 'she/her','he/him','they/them'
      if (m.alive === false)   out.dead = 1;
      if (m.trust !== undefined && (m.trust < 40 || m.trust > 60)) out.tr = m.trust;
      if (m.disposition)       out.di = m.disposition.slice(0, 3); // 'gua','neu','fri','hos','des'
      if (m.currentRoom)       out.rm = m.currentRoom;
      return out;
    });
}

// Only codex entries that have left LOCKED state
function compressCodexMutations(mutations) {
  return (mutations || []).map(m => {
    const out = { id: m.id, st: m.state === 'discovered' ? 'd' : m.state === 'partial' ? 'p' : 'r' };
    if (m.discoveredAt) out.sc = m.discoveredAt;
    if (m.via)          out.via = m.via;
    if (m.secrets && m.secrets.length) out.sec = m.secrets;
    return out;
  });
}

// Story threads, foreshadowing, and consequence chains — the entire narrative scaffold.
// Compressed keys: th=threads, fs=foreshadowing, cq=consequences, pa=pacing
function compressStoryArchitect(sa) {
  if (!sa) return null;
  return {
    th: (sa.threads || []).map(t => ({
      id: t.id, tp: t.type, s: t.status, p: t.priority,
      ss: t.seedScene, lt: t.lastTouched, ca: t.crossArc || false,
      b: t.beats || [],
    })),
    fs: (sa.foreshadowing || []).map(f => ({
      id: f.id, pl: f.planted, rf: f.reinforced || [], s: f.status,
    })),
    cq: (sa.consequences || []).map(c => ({
      tr: c.trigger, im: c.immediate,
      dl: (c.delayed || []).map(d => ({ ef: d.effect, af: d.deliverAfterScenes, dv: d.delivered })),
    })),
    pa: sa.pacing ? { a: sa.pacing.act, ap: sa.pacing.actProgress, rb: sa.pacing.recentBeats } : null,
  };
}

// Ship integrity, power, conditions — 7 systems + allocations + repair state.
function compressShipState(ship) {
  if (!ship) return null;
  const sys = {};
  Object.entries(ship.systems || {}).forEach(([k, v]) => {
    sys[k] = { i: v.integrity, s: v.status.slice(0, 3) }; // 'ope','deg','cri','fai','off'
    if (v.conditions && v.conditions.length) sys[k].c = v.conditions;
  });
  return {
    nm: ship.name,
    sys,
    pw: ship.powerAllocations,
    rp: ship.repairParts,
    sr: ship.scenesSinceRepair,
  };
}

// Crew morale, loyalty, stress, assignments, relationships.
// Only crew members whose state has diverged from template defaults.
function compressCrewMutations(crew) {
  if (!crew) return null;
  return crew.map(c => {
    const out = { id: c.id };
    if (c.pronouns)      out.pr = c.pronouns;
    if (c.morale !== undefined)  out.mo = c.morale;
    if (c.loyalty !== undefined) out.lo = c.loyalty;
    if (c.stress !== undefined)  out.st = c.stress;
    if (c.status && c.status !== 'active') out.s = c.status;
    if (c.assignedTo)    out.at = c.assignedTo;
    if (c.relationships) out.rel = c.relationships;
    if (c.alive === false) out.dead = 1;
    return out;
  });
}

// Map state: revealed rooms, door states, wilderness supplies.
function compressMapState(map) {
  if (!map) return null;
  return {
    tp: map.activeMapType,
    rv: map.revealedRooms || [],
    dr: map.doorStates || {},
    sp: map.supplies || null,
  };
}
```

### Restore

<!-- CLI implementation detail — do not hand-code -->
```js
function restoreCompactSave(saveString) {
  const { payload, valid } = validateAndDecode(saveString);
  if (!valid) return { error: 'CORRUPT' };
  if (payload.mode !== 'compact') return { error: 'WRONG_MODE' };

  // Regenerate world from seed
  // (requires the procedural-world-gen module to be loaded)
  const worldData = generateWorld(payload.seed, payload.theme);

  // Expand character
  const character = expandCharacter(payload.char, worldData);

  // Apply NPC mutations back onto roster
  const rosterMutations = expandRosterMutations(payload.npcs);
  rosterMutations.forEach(m => {
    const npc = worldData.roster.find(n => n.id === m.id || n.name.toLowerCase().replace(/\s+/g,'_') === m.id);
    if (npc) Object.assign(npc, m);
  });

  // Expand codex mutations
  const codexMutations = expandCodexMutations(payload.codex);

  return {
    seed: payload.seed,
    theme: payload.theme,
    scene: payload.scene,
    currentRoom: payload.room,
    visitedRooms: payload.visited,
    character,
    worldFlags: payload.flags,
    worldData,
    rosterMutations,
    codexMutations,
    rollHistory: [],
    arc: payload.arc || 1,
    arcType: payload.arcType || 'standard',
    carryForward: payload.carry || null,
    arcHistory: payload.arcHist || [],
    // v1.2.0 additions — restore if present, default to null if absent (pre-1.2.0 save)
    time: payload.time || null,
    storyArchitect: expandStoryArchitect(payload.story),
    shipState: expandShipState(payload.ship),
    crewMutations: expandCrewMutations(payload.crew),
    mapState: expandMapState(payload.map),
    systemResources: payload.res || null,
    navPlottedCourse: payload.navCourse || null,
  };
}

function expandCharacter(c, worldData) {
  const statKeys = ['STR','DEX','INT','WIS','CON','CHA'];
  const stats = {};
  statKeys.forEach((k, i) => { stats[k] = c.st[i]; });

  // Look up full item data from worldData loot tables
  const allItems = [];
  Object.values(worldData.rooms).forEach(r => r.loot.forEach(i => allItems.push(i)));
  const inventory = c.inv.map(saved => {
    const full = allItems.find(i => i.id === saved.id) || { id: saved.id, name: saved.id };
    return { ...full, uses: saved.u };
  });

  return {
    name: c.n, class: c.cl, hp: c.hp, maxHp: c.mhp,
    stats, inventory, conditions: c.cond || [], xp: c.xp, level: c.lvl,
  };
}

function expandRosterMutations(npcs) {
  const dispMap = { gua:'guarded', neu:'neutral', fri:'friendly', hos:'hostile', des:'desperate' };
  return (npcs || []).map(m => {
    const out = { id: m.id };
    if (m.pr)                    out.pronouns = m.pr;
    if (m.dead)                  out.alive = false;
    if (m.tr !== undefined)      out.trust = m.tr;  // !== undefined: trust of 0 is valid
    if (m.di)                    out.disposition = dispMap[m.di] || m.di;
    if (m.rm)                    out.currentRoom = m.rm;
    return out;
  });
}

function expandCodexMutations(codex) {
  const stateMap = { d:'discovered', p:'partial', r:'redacted' };
  return (codex || []).map(m => ({
    id: m.id,
    state: stateMap[m.st] || 'partial',
    discoveredAt: m.sc || null,
    via: m.via || null,
    secrets: m.sec || [],
  }));
}

// v1.2.0 expand functions — return null gracefully for pre-1.2.0 saves

function expandStoryArchitect(sa) {
  if (!sa) return null;
  return {
    threads: (sa.th || []).map(t => ({
      id: t.id, type: t.tp, status: t.s, priority: t.p,
      seedScene: t.ss, lastTouched: t.lt, crossArc: t.ca || false,
      beats: t.b || [],
    })),
    foreshadowing: (sa.fs || []).map(f => ({
      id: f.id, planted: f.pl, reinforced: f.rf || [], status: f.s,
    })),
    consequences: (sa.cq || []).map(c => ({
      trigger: c.tr, immediate: c.im,
      delayed: (c.dl || []).map(d => ({
        effect: d.ef, deliverAfterScenes: d.af, delivered: d.dv,
      })),
    })),
    pacing: sa.pa ? {
      act: sa.pa.a, actProgress: sa.pa.ap, recentBeats: sa.pa.rb || [],
    } : { act: 1, actProgress: 0, recentBeats: [] },
  };
}

function expandShipState(ship) {
  if (!ship) return null;
  const statusMap = { ope:'operational', deg:'degraded', cri:'critical', fai:'failing', off:'offline' };
  const systems = {};
  Object.entries(ship.sys || {}).forEach(([k, v]) => {
    systems[k] = {
      integrity: v.i,
      status: statusMap[v.s] || 'operational',
      conditions: v.c || [],
    };
  });
  return {
    name: ship.nm,
    systems,
    powerAllocations: ship.pw || {},
    repairParts: ship.rp || 0,
    scenesSinceRepair: ship.sr || 0,
  };
}

function expandCrewMutations(crew) {
  if (!crew) return null;
  return crew.map(c => ({
    id: c.id,
    pronouns: c.pr || null,
    morale: c.mo !== undefined ? c.mo : 50,
    loyalty: c.lo !== undefined ? c.lo : 50,
    stress: c.st !== undefined ? c.st : 0,
    status: c.s || 'active',
    assignedTo: c.at || null,
    relationships: c.rel || {},
    alive: c.dead ? false : true,
  }));
}

function expandMapState(map) {
  if (!map) return null;
  return {
    activeMapType: map.tp || 'settlement',
    revealedRooms: map.rv || [],
    doorStates: map.dr || {},
    supplies: map.sp || null,
  };
}
```

---

## Full Mode — Hand-Authored Save

Used when no seed is present. The complete `gmState` is serialised, compressed with LZ-String,
and base64-encoded. Larger strings, but still paste-able.

LZ-String compression is handled by the CLI (Bun implementation — no CDN). The save/load widget does not load external scripts.

### Build

<!-- CLI implementation detail — do not hand-code -->
```js
function buildFullSave(gmState) {
  const payload = {
    v: 1,
    mode: 'full',
    scene: gmState.scene,
    room: gmState.currentRoom,
    visited: gmState.visitedRooms,
    char: gmState.character,
    flags: gmState.worldFlags,
    npcs: gmState.rosterMutations || [],
    codex: gmState.codexMutations || [],
    arc: gmState.arc || 1,
    arcType: gmState.arcType || 'standard',
    carry: gmState.carryForward || null,
    arcHist: gmState.arcHistory || [],
    // Hand-authored worlds store their room graph minimally
    worldSnapshot: buildWorldSnapshot(gmState),
    // v1.2.0 additions — stored uncompressed in full mode (LZ-String handles size)
    time: gmState.time || null,
    story: gmState.storyArchitect || null,
    ship: gmState.shipState || null,
    crew: gmState.crewMutations || null,
    map: gmState.mapState || null,
    res: gmState.systemResources || null,
    navCourse: gmState.navPlottedCourse || null,
  };
  const json = JSON.stringify(payload);
  const compressed = LZString.compressToBase64(json);
  const code = 'SF1:' + compressed;
  return attachChecksum(code);
}

// For hand-authored worlds, store only what cannot be reconstructed:
// room labels, connection graph, and any GM-authored content.
// Skip atmosphere/loot/encounter — those are authored per-scene anyway.
function buildWorldSnapshot(gmState) {
  if (!gmState.worldData) return null;
  const rooms = {};
  Object.entries(gmState.worldData.rooms || {}).forEach(([id, r]) => {
    rooms[id] = {
      type: r.type,
      connections: r.connections,
    };
  });
  return { rooms, startRoom: gmState.worldData?.startRoom };
}
```

### Restore

<!-- CLI implementation detail — do not hand-code -->
```js
function restoreFullSave(saveString) {
  const { payload, valid } = validateAndDecode(saveString);
  if (!valid) return { error: 'CORRUPT' };
  if (payload.mode !== 'full') return { error: 'WRONG_MODE' };

  return {
    scene: payload.scene,
    currentRoom: payload.room,
    visitedRooms: payload.visited,
    character: payload.char,
    worldFlags: payload.flags,
    rosterMutations: payload.npcs,
    codexMutations: payload.codex,
    worldData: payload.worldSnapshot
      ? { rooms: payload.worldSnapshot.rooms, startRoom: payload.worldSnapshot.startRoom }
      : null,
    rollHistory: [],
    arc: payload.arc || 1,
    arcType: payload.arcType || 'standard',
    carryForward: payload.carry || null,
    arcHistory: payload.arcHist || [],
    // v1.2.0 additions — stored uncompressed, restore directly
    time: payload.time || null,
    storyArchitect: payload.story || null,
    shipState: payload.ship || null,
    crewMutations: payload.crew || null,
    mapState: payload.map || null,
    systemResources: payload.res || null,
    navPlottedCourse: payload.navCourse || null,
  };
}
```

---

## Checksum & Validation

Every save string carries a CRC32-style checksum to detect corruption or truncation.

<!-- CLI implementation detail — do not hand-code -->
```js
// Simple FNV-1a 32-bit hash — fast, good distribution
function fnv32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

// Attach: prefix with 8-char checksum separated by '.'
function attachChecksum(code) {
  return fnv32(code) + '.' + code;
}

// Validate: split on first '.', recompute, compare
function validateAndDecode(saveString) {
  const dotIdx = saveString.indexOf('.');
  if (dotIdx !== 8) return { valid: false, error: 'BAD_FORMAT' };

  const checksum = saveString.slice(0, 8);
  const code = saveString.slice(9);

  if (fnv32(code) !== checksum) return { valid: false, error: 'CHECKSUM_FAIL' };

  try {
    const mode = code.startsWith('SC1:') ? 'compact' : code.startsWith('SF1:') ? 'full' : null;
    if (!mode) return { valid: false, error: 'UNKNOWN_VERSION' };

    const encoded = code.slice(4);
    const json = mode === 'compact'
      ? atob(encoded)
      : LZString.decompressFromBase64(encoded);

    const payload = JSON.parse(json);
    return { valid: true, payload, mode };
  } catch (e) {
    return { valid: false, error: 'DECODE_FAIL', detail: e.message };
  }
}
```

### Version compatibility table

| Prefix | Mode | Compression | Compatible |
|--------|------|-------------|------------|
| `SF2:` | Full — current CLI format | Base64 (raw JSON) | Current |
| `SC1:` | Compact — legacy import only | Base64 (raw JSON) | Legacy |
| `SF1:` | Full — legacy import only | LZ-String + Base64 | Legacy |

The current CLI always generates `SF2:`. The loader keeps `SC1:` / `SF1:` support only so older
saves can still be resumed and migrated forward safely.

---

## Save Slots

Within a session, the save widget maintains up to five named save slots in JS module scope.
Slots persist across widget re-renders within the same browser tab.

<!-- CLI implementation detail — do not hand-code -->
```js
// Module-scoped slot store — resets when the page reloads (by design)
const SAVE_SLOTS = {
  slots: [null, null, null, null, null],  // indices 0–4
  activeSlot: null,
};

function writeSlot(index, gmState, label) {
  const code = detectMode(gmState) === 'compact'
    ? buildCompactSave(gmState)
    : buildFullSave(gmState);
  SAVE_SLOTS.slots[index] = {
    code,
    label: label || `Scene ${gmState.scene} — ${gmState.character?.name || 'Unknown'}`,
    scene: gmState.scene,
    location: gmState.currentRoom,
    hp: gmState.character?.hp,
    maxHp: gmState.character?.maxHp,
    ts: Date.now(),
  };
  SAVE_SLOTS.activeSlot = index;
  return code;
}

function readSlot(index) {
  return SAVE_SLOTS.slots[index] || null;
}

function detectMode(gmState) {
  return gmState.seed ? 'compact' : 'full';
}
```

Slot labels are shown in the save widget so the player can identify which save is which without
decoding. They include: scene number, character name, current HP, location, and a timestamp.

---

## The Save Widget

The save/load widget is rendered by the CLI. Do not hand-code the widget HTML, CSS, or JS.

```bash
tag render save-div
```

The CLI produces the complete interactive save/load widget with slot management,
copy functionality, QR code generation, and the paste-to-resume flow.

---

## Resume Protocol — Loading a Save

When the player provides a save (pasted string, uploaded file, or pasted `.save.md`
content), the GM must use the CLI to load it:

### Step 1 — Parse and validate

To load a save, run:

```bash
tag save load <file.save.md>
```

The CLI extracts the JSON payload, validates the checksum, and returns the parsed save data.

### Step 2 — Reconstruct gmState

The `tag save load` command handles full reconstruction automatically — it regenerates
the world from the seed (compact mode) or restores the world snapshot (full mode),
expands compressed character data, applies NPC mutations, and returns the complete
`gmState` object ready for use.

<!-- CLI implementation detail — do not hand-code -->

### Step 3 — Rebuild the codex from mutations

After `tag save load` returns the reconstructed `gmState`, the codex mutations are
automatically applied onto the seeded codex. The CLI handles the full expansion from
compressed mutation format back to the complete codex entry structure.

<!-- CLI implementation detail — do not hand-code -->

### Step 4 — Boot the engine (CRITICAL)

**Before rendering anything**, follow the **Resume from Save Checklist** in
`modules/gm-checklist.md`. This means:

1. Read the active visual style file from `styles/` (use `visual-style` from save
   metadata, or default to `station`)
2. Read `styles/style-reference.md` for structural patterns
3. Load all required modules for the scenario type
4. Reinitialise storyArchitect from worldFlags and codexMutations
5. Reinitialise worldHistory context from seed/theme (if procedural)

**Do not skip this step.** Without it, the resume scene renders with default styling
and missing module behaviour.

### Step 5 — Render the resume scene

Once the engine is booted and `gmState` is reconstructed, render a scene widget for
the current room with a brief "resumed from save" context note — one sentence only,
then the scene continues normally. Do not replay what happened before. The player
remembers; the codex remembers.

```
"You find yourself back in the [room name]. The weight of everything that's happened is still
with you. [Continue with normal scene widget for currentRoom]"
```

---

## Save Button in Scene Widget

The save button is included automatically by `tag render scene`. Do not hand-code
the button HTML. The rendered button uses `sendPrompt()` to trigger `tag save generate`,
which produces the `.save.md` file as a downloadable conversation artifact.

### Resume Formats

The resume flow accepts any of the following inputs:

- **Raw save string** — pasting the checksummed save string directly into the chat (the
  original method, still fully supported).
- **Uploading the `.save.md` file** — Claude reads the YAML frontmatter for version checking
  and extracts the save payload from the fenced code block in the markdown body.
- **Pasting the entire `.save.md` content** (frontmatter + body) — Claude parses the YAML
  frontmatter for metadata and extracts the payload string from the code block.

In all three cases, the GM runs `tag save load <file.save.md>` which validates the checksum,
detects the mode, and reconstructs `gmState` using the standard resume protocol documented above.

---

## Save String Size Reference

Approximate sizes for planning. Compact mode is fast enough to QR-encode for most sessions.
Full mode strings are always paste-able but may exceed QR capacity after many scenes.

| Scenario | Mode | Typical size | QR-encodable |
|---|---|---|---|
| 10 scenes, 2 factions, 5 NPCs met | Compact | ~800 chars | Yes |
| 20 scenes, full session | Compact | ~1,400 chars | Marginal |
| Hand-authored, small | Full (compressed) | ~2,000 chars | No |
| Hand-authored, large | Full (compressed) | ~4,000 chars | No |

For compact saves that exceed ~1,800 chars, suppress the QR option and display a note:
`"Code is too long to QR-encode — use text copy."`

---

## Integration Summary

| Source skill | What the save preserves | Storage strategy |
|---|---|---|
| Orchestrator (SKILL.md) | scene, currentRoom, visitedRooms, worldFlags | Stored directly |
| Orchestrator (SKILL.md) | character (name, class, hp, stats, inventory, conditions, xp, level) | Compressed in compact mode |
| procedural-world-gen module | Full world structure | Seed only (compact) or worldSnapshot (full) |
| ai-npc module | NPC trust scores, dispositions, alive state, room position | Delta-only rosterMutations |
| lore-codex module | All entry state transitions, discovery stamps, secrets | Delta-only codexMutations |

---

## Anti-Patterns (never do these)

- Never store the full `worldData` in the save payload — it is always regenerable from the seed in
  compact mode. Storing it would bloat saves by 10-50x.
- Never store NPC conversation histories in the save — they do not persist across sessions by
  design. The NPC greets the player fresh, informed only by world flags and trust state.
- Never skip the checksum step — a save string corrupted by a missing character should be caught
  cleanly, not silently loaded into a broken state.
- Never use `localStorage` or `sessionStorage` as the primary persistence layer — the widget uses
  `sessionStorage` as a convenience cache for the current tab only, not as the save mechanism. The
  exported string is the canonical save.
- Never auto-save without player consent — the save widget is player-triggered only. Surprise
  auto-saves would confuse players about which state they are actually resuming.
- Never render the resume scene without acknowledging the save context — one sentence of
  re-grounding is essential. The player may be coming back after days; orient them.
- Never fail silently on a bad save string — always display the specific error (checksum fail,
  decode error, unknown version) so the player knows whether to try again or accept the loss.
- Never compress compact-mode saves with LZ-String — the raw JSON is already small and base64
  is universally decodable. LZ-String is only for full-mode saves where size matters.
- Never omit the version prefix (`SC1:` / `SF1:`) — it is the migration hook for future schema
  changes, not decoration.
