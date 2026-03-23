# Save Codex — Session Persistence Engine
> Module for text-adventure orchestrator. Loaded when the player wants to save or resume sessions.

The Save Codex encodes everything needed to resume a text adventure session into a single copyable
string. That string can be pasted into a new conversation, shared with another player, posted to a
forum, or stored in a notes app. No accounts. No servers. No localStorage. The save *is* the string.

Two encoding modes handle the two world types:

- **Compact mode** — for procedurally generated worlds (procedural-world-gen module active). The
  world is always regenerable from its seed. Only player-driven mutations are stored. Saves are
  short enough to fit in a tweet.
- **Full mode** — for hand-authored worlds (no seed to regenerate from). The complete session state
  is serialised and LZ-compressed. Saves are longer but still a single copyable string.

Both modes produce a versioned, checksummed payload. The resume flow validates the checksum before
applying state, warns the player if the version is mismatched, and gracefully recovers what it can
from partially corrupt saves.

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

## Architecture Overview

```
GM renders scene widget
        ↓
Save Codex reads gmState (character, flags, visited rooms, NPC mutations, codex mutations)
        ↓
Mode detection: seed present? → compact mode : full mode
        ↓
Compact:  extract deltas only → JSON → base64
Full:     full state → JSON → LZ compress → base64
        ↓
Version header + checksum prepended → final save string
        ↓
Save string embedded in scene widget as hidden #save-data div (fallback display)
        ↓
Player clicks Save ↗ → sendPrompt asks Claude to generate .save.md artifact
        ↓
Fallback (sendPrompt unavailable): save string shown inline as copyable text
        ═══════════════════════════════════════════════════
Player resumes: pastes save string, uploads .save.md, or pastes .save.md content
        ↓
Save Codex decodes: base64 → decompress (if needed) → JSON
        ↓
Validate: checksum match? version compatible?
        ↓
Compact: regenerate world from seed → apply mutation patches
Full:    restore full gmState directly
        ↓
Send gmState to GM via sendPrompt → session resumes
```

---

## Save File Format — `.save.md`

Every scene widget includes a hidden pre-computed save payload. When the player clicks
Save, `sendPrompt()` asks Claude to generate the `.save.md` file as a downloadable
conversation artifact. The file uses YAML frontmatter for metadata and markdown body for
the save payload. This format is both human-readable (the frontmatter) and
machine-parseable (the payload string).

### File structure

```yaml
---
format: text-adventure-save
version: 1
skill-version: "1.2.4"
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
mode: "compact"
arc: 1
arc-type: "standard"
---

# Save — Gareth Williams, Scene 7

To resume this adventure, paste the string below into a new conversation along with
the instruction "Continue this text adventure":

```
SC1:eyJ2IjoxLCJtb2RlIjoiY29tcGFjdCIsInNlZWQiOiJwYWxlLXRocmVzaG9sZC03...
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

## Per-Scene Save Generation

Every scene widget includes a pre-computed save payload as a hidden data attribute.
This enables the inline fallback display if `sendPrompt()` is unavailable.

### Implementation

The GM embeds the save data in every scene widget:

```html
<div id="save-data" style="display:none"
  data-save="SC1:eyJ2Ij..."
  data-character="Gareth Williams"
  data-class="Bartender"
  data-level="2"
  data-scene="7"
  data-location="The Oxidiser — Bar Floor"
  data-title="Freeport Meridian"
  data-theme="space"
  data-seed="pale-threshold-7"
  data-mode="compact">
</div>
```

The footer Save button uses `sendPrompt()` to ask Claude to generate the `.save.md` file
as a downloadable conversation artifact. The pre-computed `#save-data` div serves as a
fallback — if `sendPrompt()` is unavailable, the save string is displayed inline in a
readonly textarea for the player to copy manually.

### Save Button Script — sendPrompt Primary, Inline Fallback

The Save button uses `sendPrompt()` to ask Claude to generate the `.save.md` file as a
downloadable artifact. If `sendPrompt()` is unavailable (timing, sandboxing), the button
falls back to displaying the pre-computed save string in a readonly textarea with a copy
button so the player can copy it manually.

```js
function showInlineSave() {
  const el = document.getElementById('save-data');
  if (!el || !el.dataset.save) return;

  const saveString = el.dataset.save;
  const character = el.dataset.character || 'Unknown';
  const scene = el.dataset.scene || '1';

  // Create or reuse the inline save display
  var container = document.getElementById('inline-save-display');
  if (!container) {
    container = document.createElement('div');
    container.id = 'inline-save-display';
    container.style.cssText = 'margin-top:0.75rem;padding:0.75rem 1rem;border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);background:var(--color-background-secondary);';

    var label = document.createElement('p');
    label.style.cssText = 'font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-tertiary);margin:0 0 6px;';
    label.textContent = 'Save string — copy and paste to resume later';
    container.appendChild(label);

    var ta = document.createElement('textarea');
    ta.id = 'inline-save-textarea';
    ta.readOnly = true;
    ta.rows = 4;
    ta.style.cssText = 'width:100%;box-sizing:border-box;padding:8px 10px;font-family:monospace;font-size:11px;line-height:1.5;background:var(--color-background-tertiary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-md);color:var(--color-text-secondary);word-break:break-all;resize:none;';
    container.appendChild(ta);

    var copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy';
    copyBtn.style.cssText = 'margin-top:6px;padding:4px 12px;font-family:monospace;font-size:10px;letter-spacing:0.08em;background:transparent;border:0.5px solid var(--color-border-secondary);border-radius:var(--border-radius-md);color:var(--color-text-secondary);cursor:pointer;';
    copyBtn.addEventListener('click', function() {
      navigator.clipboard.writeText(saveString).then(function() {
        copyBtn.textContent = 'Copied!';
        setTimeout(function() { copyBtn.textContent = 'Copy'; }, 2200);
      }).catch(function() {
        ta.select();
        document.execCommand('copy');
        copyBtn.textContent = 'Copied!';
        setTimeout(function() { copyBtn.textContent = 'Copy'; }, 2200);
      });
    });
    container.appendChild(copyBtn);

    // Insert after the save button or at end of footer
    var saveBtn = document.getElementById('save-btn');
    if (saveBtn && saveBtn.parentNode) {
      saveBtn.parentNode.insertAdjacentElement('afterend', container);
    } else {
      document.querySelector('.root').appendChild(container);
    }
  }

  document.getElementById('inline-save-textarea').value = saveString;
  container.style.display = 'block';
}
```

### Save Button Wiring

```js
document.getElementById('save-btn').addEventListener('click', function() {
  if (typeof sendPrompt === 'function') {
    sendPrompt('Generate my save file as a downloadable .save.md file following the exact format in modules/save-codex.md. Use YAML frontmatter plus an encoded SC1: or SF1: payload string. Never write game state as human-readable markdown.');
    this.textContent = 'Generating...';
    this.disabled = true;
  } else {
    // Fallback: display save string inline as copyable text
    showInlineSave();
    this.textContent = 'Shown below';
    setTimeout(function() { document.getElementById('save-btn').textContent = 'Save \u2197'; }, 2000);
  }
});
```

### GM Instruction — Embedding Save Data

The GM **must** embed the `#save-data` div in every scene widget, populated with the current
`gmState` serialisation. The GM builds the save string at render time using
`buildCompactSave(gmState)` or `buildFullSave(gmState)` and injects the result into the
`data-save` attribute along with all metadata fields.

The `#save-data` div is used for the **inline fallback display** — if `sendPrompt()` is
unavailable, the save string is shown in a readonly textarea for manual copying.

The **primary save path** is `sendPrompt()`: when the player clicks Save, the button fires
`sendPrompt('Generate my save file as a downloadable .save.md file following the exact format in modules/save-codex.md. Use YAML frontmatter plus an encoded SC1: or SF1: payload string. Never write game state as human-readable markdown.')`. Claude receives this
prompt and must:

1. Compute the save payload from the current `gmState` using `buildCompactSave()` or
   `buildFullSave()` as appropriate.
2. Build the complete `.save.md` content (YAML frontmatter + markdown body with the save
   payload in a fenced code block — see the Save File Format section above).
3. Present the `.save.md` as a downloadable artifact in the response.

This approach bypasses the iframe sandbox restrictions that silently block Blob downloads
in Claude.ai widgets.

---

## The Full gmState Contract

Before building the save payload, the Save Codex must understand the complete state shape
contributed by each skill in the toolkit. This is the canonical `gmState` schema when all skills
are active:

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

```js
const newSeed = originalSeed + '_arc' + newArcNumber;
// See modules/procedural-world-gen.md for deriveArcSeed()
```

---

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

LZ-String is loaded from CDN in the save/load widget:
```
https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js
```

### Build

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
| `SC1:` | Compact — procedural | Base64 (raw JSON) | Current |
| `SF1:` | Full — hand-authored | LZ-String + Base64 | Current |

When a future schema version increments to v2, the prefix becomes `SC2:` / `SF2:`. The decoder
checks `payload.v` and applies a migration function if loading an older save into a newer schema.

---

## Save Slots

Within a session, the save widget maintains up to five named save slots in JS module scope.
Slots persist across widget re-renders within the same browser tab.

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

The full interactive save/load widget. Handles writing slots, copying the save string, showing a
QR code for mobile sharing, and the paste-to-resume flow.

```html
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Syne:wght@700&display=swap');

  .sv-root { font-family:'IBM Plex Mono',monospace; padding:1rem 0 1.5rem; }

  .sv-header { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:1rem; flex-wrap:wrap; gap:8px; }
  .sv-title  { font-family:'Syne',sans-serif; font-size:22px; font-weight:700; color:var(--color-text-primary); margin:0; }
  .sv-sub    { font-size:11px; color:var(--color-text-tertiary); }

  .tab-row   { display:flex; gap:4px; margin-bottom:1rem; }
  .tab-btn   { padding:5px 14px; font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:0.1em;
    background:transparent; border:0.5px solid var(--color-border-tertiary); border-radius:var(--border-radius-md);
    color:var(--color-text-secondary); cursor:pointer; transition:all 0.1s; }
  .tab-btn:hover  { background:var(--color-background-secondary); }
  .tab-btn.active { border-color:var(--color-border-info); background:var(--color-background-info); color:var(--color-text-info); }

  .slots-grid { display:flex; flex-direction:column; gap:6px; margin-bottom:1rem; }
  .slot-row   { display:flex; align-items:center; gap:8px; padding:10px 12px;
    border:0.5px solid var(--color-border-tertiary); border-radius:var(--border-radius-md);
    background:var(--color-background-primary); transition:border-color 0.1s; }
  .slot-row.occupied { cursor:pointer; }
  .slot-row.occupied:hover { border-color:var(--color-border-secondary); background:var(--color-background-secondary); }
  .slot-row.active-slot { border-color:var(--color-border-info); background:var(--color-background-info); }

  .slot-num  { font-size:10px; color:var(--color-text-tertiary); min-width:16px; }
  .slot-info { flex:1; }
  .slot-label { font-size:12px; font-weight:500; color:var(--color-text-primary); }
  .slot-meta  { font-size:10px; color:var(--color-text-tertiary); margin-top:2px; }
  .slot-empty { font-size:11px; color:var(--color-text-tertiary); font-style:italic; }

  .slot-actions { display:flex; gap:4px; }
  .slot-btn { padding:4px 10px; font-size:10px; letter-spacing:0.08em; font-family:'IBM Plex Mono',monospace;
    background:transparent; border:0.5px solid var(--color-border-secondary);
    border-radius:var(--border-radius-md); color:var(--color-text-secondary); cursor:pointer; transition:background 0.1s; }
  .slot-btn:hover { background:var(--color-background-secondary); }
  .slot-btn.danger { border-color:var(--color-border-danger); color:var(--color-text-danger); }
  .slot-btn.danger:hover { background:var(--color-background-danger); }

  .hp-bar-wrap { display:flex; align-items:center; gap:6px; }
  .hp-bar-track { width:40px; height:3px; background:var(--color-border-tertiary); border-radius:2px; overflow:hidden; }
  .hp-bar-fill  { height:100%; border-radius:2px; transition:width 0.3s; }
  .hp-high   { background:#1D9E75; }
  .hp-mid    { background:#EF9F27; }
  .hp-low    { background:#D85A30; }

  .code-block { position:relative; margin:0.75rem 0; }
  .code-display { width:100%; box-sizing:border-box; padding:10px 12px; padding-right:80px;
    font-family:'IBM Plex Mono',monospace; font-size:11px; line-height:1.5;
    background:var(--color-background-tertiary); border:0.5px solid var(--color-border-tertiary);
    border-radius:var(--border-radius-md); color:var(--color-text-secondary);
    word-break:break-all; resize:none; min-height:72px; }
  .code-display:focus { outline:none; }
  .copy-btn { position:absolute; top:8px; right:8px; padding:4px 10px;
    font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:0.08em;
    background:var(--color-background-primary); border:0.5px solid var(--color-border-secondary);
    border-radius:var(--border-radius-md); color:var(--color-text-secondary); cursor:pointer;
    transition:all 0.1s; }
  .copy-btn:hover { background:var(--color-background-secondary); }
  .copy-btn.copied { border-color:var(--color-border-success); color:var(--color-text-success); }

  .qr-wrap { display:flex; justify-content:center; padding:1rem 0; }
  #qr-canvas { border-radius:var(--border-radius-md); }

  .paste-row { display:flex; gap:8px; }
  .paste-input { flex:1; font-family:'IBM Plex Mono',monospace; font-size:11px;
    padding:8px 12px; border:0.5px solid var(--color-border-secondary);
    border-radius:var(--border-radius-md); background:var(--color-background-primary);
    color:var(--color-text-primary); }
  .paste-input:focus { outline:none; border-color:var(--color-border-primary); }
  .paste-input::placeholder { color:var(--color-text-tertiary); }
  .load-btn { padding:8px 16px; font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:0.1em;
    background:transparent; border:0.5px solid var(--color-border-secondary);
    border-radius:var(--border-radius-md); color:var(--color-text-primary); cursor:pointer; white-space:nowrap; }
  .load-btn:hover { background:var(--color-background-secondary); }

  .status-msg { font-size:11px; margin-top:8px; min-height:18px; font-style:italic; }
  .status-ok   { color:var(--color-text-success); }
  .status-err  { color:var(--color-text-danger); }
  .status-warn { color:var(--color-text-warning); }

  .footer-row { display:flex; justify-content:space-between; align-items:center; margin-top:1rem;
    padding-top:0.75rem; border-top:0.5px solid var(--color-border-tertiary); }
  .close-btn { font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:0.08em;
    background:transparent; border:0.5px solid var(--color-border-secondary);
    border-radius:var(--border-radius-md); padding:5px 12px;
    color:var(--color-text-secondary); cursor:pointer; }
  .close-btn:hover { background:var(--color-background-secondary); }
  .mode-badge { font-size:10px; padding:3px 8px; border-radius:var(--border-radius-md);
    background:var(--color-background-secondary); color:var(--color-text-tertiary); letter-spacing:0.06em; }
</style>

<div class="sv-root">
  <div class="sv-header">
    <p class="sv-title">Save Codex</p>
    <span class="sv-sub" id="sv-sub">Session persistence</span>
  </div>

  <div class="tab-row">
    <button class="tab-btn active" data-tab="save">Save</button>
    <button class="tab-btn"        data-tab="load">Load / Resume</button>
  </div>

  <!-- SAVE TAB -->
  <div id="tab-save">
    <div class="slots-grid" id="slots-grid"></div>

    <div id="code-section" style="display:none;">
      <div class="code-block">
        <textarea class="code-display" id="code-display" readonly rows="4"></textarea>
        <button class="copy-btn" id="copy-btn">Copy</button>
      </div>
      <div id="qr-wrap" class="qr-wrap" style="display:none;">
        <canvas id="qr-canvas"></canvas>
      </div>
      <button id="qr-toggle-btn" style="font-size:10px;color:var(--color-text-tertiary);background:none;border:none;cursor:pointer;font-family:'IBM Plex Mono',monospace;letter-spacing:0.06em;margin-top:4px;">
        <span id="qr-toggle-label">Show QR code ↓</span>
      </button>
    </div>
  </div>

  <!-- LOAD TAB -->
  <div id="tab-load" style="display:none;">
    <p style="font-size:12px;color:var(--color-text-secondary);margin:0 0 0.75rem;line-height:1.7;">
      Paste a save code to resume a previous session. The world will be reconstructed and play
      will continue from where you left off.
    </p>
    <div class="paste-row">
      <input class="paste-input" id="paste-input" type="text" placeholder="Paste save code here…" oninput="validatePaste()" />
      <button class="load-btn" id="load-btn">Resume ↗</button>
    </div>
    <p class="status-msg" id="load-status"></p>

    <div id="load-preview" style="display:none;margin-top:1rem;
      padding:0.75rem 1rem; border:0.5px solid var(--color-border-tertiary);
      border-radius:var(--border-radius-lg); background:var(--color-background-secondary);">
      <p style="font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--color-text-tertiary);margin:0 0 6px;">Save preview</p>
      <p style="font-size:13px;font-weight:500;color:var(--color-text-primary);margin:0 0 4px;" id="prev-char">—</p>
      <p style="font-size:11px;color:var(--color-text-secondary);margin:0;" id="prev-meta">—</p>
    </div>
  </div>

  <div class="footer-row">
    <span class="mode-badge" id="mode-badge">Detecting…</span>
    <button class="close-btn" data-prompt="Close the save menu. Continue the adventure.">Close ↗</button>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<script>
// ── INJECT GMSTATE HERE ────────────────────────────────────────────────────
const GM_STATE = /* INJECT_GMSTATE_JSON */ {};
// ───────────────────────────────────────────────────────────────────────────

const SAVE_SLOTS = JSON.parse(sessionStorage.getItem('saveSlots') || 'null')
  || [null, null, null, null, null];

function persistSlots() {
  try { sessionStorage.setItem('saveSlots', JSON.stringify(SAVE_SLOTS)); } catch(_) {}
}

// ── PRNG & checksum (inline — no dependency on external PRNG file) ──────
function fnv32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}
function attachChecksum(code) { return fnv32(code) + '.' + code; }
function validateAndDecode(raw) {
  const s = raw.trim();
  const dotIdx = s.indexOf('.');
  if (dotIdx !== 8) return { valid: false, error: 'Format error — missing checksum.' };
  const checksum = s.slice(0, 8);
  const code = s.slice(9);
  if (fnv32(code) !== checksum) return { valid: false, error: 'Checksum mismatch — save may be corrupted.' };
  try {
    const isCompact = code.startsWith('SC1:');
    const isFull    = code.startsWith('SF1:');
    if (!isCompact && !isFull) return { valid: false, error: 'Unknown save format version.' };
    const encoded = code.slice(4);
    const json = isCompact ? atob(encoded) : LZString.decompressFromBase64(encoded);
    if (!json) return { valid: false, error: 'Decompression failed — save may be truncated.' };
    const payload = JSON.parse(json);
    return { valid: true, payload, mode: isCompact ? 'compact' : 'full' };
  } catch(e) { return { valid: false, error: 'Decode error: ' + e.message }; }
}

// ── Build save ────────────────────────────────────────────────────────────
function compressChar(c) {
  if (!c) return {};
  const st = c.stats ? [c.stats.STR,c.stats.DEX,c.stats.INT,c.stats.WIS,c.stats.CON,c.stats.CHA] : [];
  return { n:c.name, cl:c.class, hp:c.hp, mhp:c.maxHp, st, inv:(c.inventory||[]).map(i=>({id:i.id,u:i.uses})), cond:c.conditions||[], xp:c.xp||0, lvl:c.level||1 };
}
function compressNpcs(npcs) {
  return (npcs||[]).filter(m=>m.alive===false||(m.trust!=null&&(m.trust<40||m.trust>60))||m.currentRoom)
    .map(m=>{const o={id:m.id};if(m.alive===false)o.dead=1;if(m.trust!=null&&(m.trust<40||m.trust>60))o.tr=m.trust;if(m.disposition)o.di=m.disposition.slice(0,3);if(m.currentRoom)o.rm=m.currentRoom;return o;});
}
function compressCodex(codex) {
  return (codex||[]).map(m=>{const o={id:m.id,st:m.state==='discovered'?'d':m.state==='partial'?'p':'r'};if(m.discoveredAt)o.sc=m.discoveredAt;if(m.via)o.via=m.via;if(m.secrets&&m.secrets.length)o.sec=m.secrets;return o;});
}

function buildSave(state) {
  const isCompact = !!state.seed;
  if (isCompact) {
    const p = { v:1, mode:'compact', seed:state.seed, theme:state.theme||'space',
      scene:state.scene||1, room:state.currentRoom||'room_0',
      visited:state.visitedRooms||[], char:compressChar(state.character),
      flags:state.worldFlags||{}, npcs:compressNpcs(state.rosterMutations),
      codex:compressCodex(state.codexMutations) };
    return attachChecksum('SC1:' + btoa(JSON.stringify(p)));
  } else {
    const snapshot = state.worldData ? (() => {
      const rooms={};
      Object.entries(state.worldData.rooms||{}).forEach(([id,r])=>{rooms[id]={type:r.type,connections:r.connections};});
      return {rooms, startRoom:state.worldData.startRoom};
    })() : null;
    const p = { v:1, mode:'full', scene:state.scene||1, room:state.currentRoom||'room_0',
      visited:state.visitedRooms||[], char:state.character,
      flags:state.worldFlags||{}, npcs:state.rosterMutations||[],
      codex:state.codexMutations||[], worldSnapshot:snapshot };
    return attachChecksum('SF1:' + LZString.compressToBase64(JSON.stringify(p)));
  }
}

// ── Slots UI ──────────────────────────────────────────────────────────────
let currentCode = '';
let qrVisible = false;

function renderSlots() {
  const grid = document.getElementById('slots-grid');
  const mode = GM_STATE.seed ? 'compact' : 'full';
  document.getElementById('mode-badge').textContent = mode === 'compact' ? 'Compact · seed-based' : 'Full · compressed';

  grid.innerHTML = SAVE_SLOTS.map((slot, i) => {
    if (!slot) return `
      <div class="slot-row">
        <span class="slot-num">${i+1}</span>
        <span class="slot-empty">Empty slot</span>
        <div class="slot-actions">
          <button class="slot-btn" data-save-slot="${i}">Save here</button>
        </div>
      </div>`;

    const hpPct = slot.hp != null && slot.maxHp ? Math.round((slot.hp/slot.maxHp)*100) : null;
    const hpClass = hpPct != null ? (hpPct > 60 ? 'hp-high' : hpPct > 30 ? 'hp-mid' : 'hp-low') : '';
    const ts = new Date(slot.ts).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    return `
      <div class="slot-row occupied" data-show-slot="${i}">
        <span class="slot-num">${i+1}</span>
        <div class="slot-info">
          <div class="slot-label">${slot.label}</div>
          <div class="slot-meta">Scene ${slot.scene} · ${ts}${hpPct != null ? ` ·` : ''}</div>
        </div>
        ${hpPct != null ? `<div class="hp-bar-wrap">
          <div class="hp-bar-track"><div class="hp-bar-fill ${hpClass}" style="width:${hpPct}%"></div></div>
          <span style="font-size:10px;color:var(--color-text-tertiary);">${slot.hp}/${slot.maxHp}</span>
        </div>` : ''}
        <div class="slot-actions">
          <button class="slot-btn" data-save-slot="${i}">Overwrite</button>
          <button class="slot-btn danger" data-clear-slot="${i}">×</button>
        </div>
      </div>`;
  }).join('');

  // Wire dynamic slot buttons via addEventListener
  document.querySelectorAll('[data-save-slot]').forEach(function(btn) {
    btn.addEventListener('click', function(e) { e.stopPropagation(); saveToSlot(parseInt(this.dataset.saveSlot)); });
  });
  document.querySelectorAll('[data-clear-slot]').forEach(function(btn) {
    btn.addEventListener('click', function(e) { e.stopPropagation(); clearSlot(parseInt(this.dataset.clearSlot)); });
  });
  document.querySelectorAll('[data-show-slot]').forEach(function(row) {
    row.addEventListener('click', function() { showSlotCode(parseInt(this.dataset.showSlot)); });
  });
}

function saveToSlot(i) {
  if (!GM_STATE || !GM_STATE.scene) {
    showStatus('save', 'No active session to save.', 'err'); return;
  }
  const code = buildSave(GM_STATE);
  const char = GM_STATE.character;
  SAVE_SLOTS[i] = {
    code, scene: GM_STATE.scene,
    label: `Scene ${GM_STATE.scene} — ${char?.name || 'Unknown'}`,
    location: GM_STATE.currentRoom,
    hp: char?.hp, maxHp: char?.maxHp, ts: Date.now(),
  };
  persistSlots();
  renderSlots();
  showSlotCode(i);
}

function showSlotCode(i) {
  const slot = SAVE_SLOTS[i];
  if (!slot) return;
  currentCode = slot.code;
  document.getElementById('code-display').value = currentCode;
  document.getElementById('code-section').style.display = 'block';
  document.getElementById('copy-btn').textContent = 'Copy';
  document.getElementById('copy-btn').classList.remove('copied');
  if (qrVisible) renderQR();
}

function clearSlot(i) {
  SAVE_SLOTS[i] = null;
  persistSlots();
  renderSlots();
  document.getElementById('code-section').style.display = 'none';
}

function copyCode() {
  if (!currentCode) return;
  navigator.clipboard.writeText(currentCode).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2200);
  }).catch(() => {
    const el = document.getElementById('code-display');
    el.select(); document.execCommand('copy');
  });
}

function toggleQR() {
  qrVisible = !qrVisible;
  document.getElementById('qr-wrap').style.display = qrVisible ? 'flex' : 'none';
  document.getElementById('qr-toggle-label').textContent = qrVisible ? 'Hide QR code ↑' : 'Show QR code ↓';
  if (qrVisible && currentCode) renderQR();
}

function renderQR() {
  const canvas = document.getElementById('qr-canvas');
  canvas.innerHTML = '';
  try {
    new QRCode(canvas, { text: currentCode, width: 180, height: 180, colorDark: '#2C2C2A', colorLight: '#FFFFFF' });
  } catch(e) {
    canvas.style.cssText = 'font-size:11px;color:var(--color-text-tertiary);font-family:monospace;';
    canvas.textContent = 'QR unavailable — code may be too long for QR. Use text copy instead.';
  }
}

// ── Load tab ──────────────────────────────────────────────────────────────
function validatePaste() {
  const raw = document.getElementById('paste-input').value.trim();
  const status = document.getElementById('load-status');
  const preview = document.getElementById('load-preview');
  if (!raw) { status.textContent = ''; preview.style.display = 'none'; return; }

  const result = validateAndDecode(raw);
  if (!result.valid) {
    status.className = 'status-msg status-err';
    status.textContent = result.error;
    preview.style.display = 'none';
    return;
  }

  status.className = 'status-msg status-ok';
  status.textContent = `Valid ${result.mode} save (v${result.payload.v})`;

  const p = result.payload;
  const charName = result.mode === 'compact' ? p.char?.n : p.char?.name;
  const charClass = result.mode === 'compact' ? p.char?.cl : p.char?.class;
  const hp = result.mode === 'compact' ? p.char?.hp : p.char?.hp;
  const mhp = result.mode === 'compact' ? p.char?.mhp : p.char?.maxHp;

  document.getElementById('prev-char').textContent = `${charName || 'Unknown'} — ${charClass || ''}`;
  document.getElementById('prev-meta').textContent =
    `Scene ${p.scene} · ${p.seed ? `Seed: ${p.seed}` : 'Hand-authored world'} · HP: ${hp ?? '?'}/${mhp ?? '?'}`;
  preview.style.display = 'block';
}

function loadSave() {
  const raw = document.getElementById('paste-input').value.trim();
  if (!raw) return;
  const result = validateAndDecode(raw);
  if (!result.valid) { document.getElementById('load-status').textContent = result.error; return; }

  const p = result.payload;
  const resumeData = JSON.stringify({
    mode: result.mode,
    seed: p.seed || null,
    theme: p.theme || null,
    scene: p.scene,
    room: p.room,
    visited: p.visited,
    char: p.char,
    flags: p.flags,
    npcs: p.npcs,
    codex: p.codex,
    worldSnapshot: p.worldSnapshot || null,
  });

  sendPrompt(`RESUME_SAVE: ${resumeData}`);
}

// ── Tab switching ─────────────────────────────────────────────────────────
function showTab(tab) {
  document.getElementById('tab-save').style.display = tab === 'save' ? 'block' : 'none';
  document.getElementById('tab-load').style.display = tab === 'load' ? 'block' : 'none';
  document.querySelectorAll('.tab-btn').forEach((b,i) => b.classList.toggle('active', (i===0&&tab==='save')||(i===1&&tab==='load')));
}

function showStatus(tab, msg, type) {
  const id = tab === 'save' ? 'sv-sub' : 'load-status';
  const el = document.getElementById(id);
  if (!el) return;
  el.className = type === 'err' ? 'status-msg status-err' : type === 'ok' ? 'status-msg status-ok' : 'sv-sub';
  el.textContent = msg;
}

// ── Init ──────────────────────────────────────────────────────────────────
renderSlots();

// ── sendPrompt wiring (data-prompt + addEventListener pattern) ────────────
document.querySelectorAll('[data-prompt]').forEach(btn => {
  btn.addEventListener('click', () => {
    const prompt = btn.dataset.prompt;
    if (typeof sendPrompt === 'function') { sendPrompt(prompt); }
  });
});
</script>
```

---

## Resume Protocol — GM Response to RESUME_SAVE

When the GM receives a `sendPrompt()` containing `RESUME_SAVE: {...}`, it must:

### Step 1 — Parse and validate

```js
// Extract JSON from the RESUME_SAVE: prefix
const raw = message.replace('RESUME_SAVE: ', '');
const saveData = JSON.parse(raw);
```

### Step 2 — Reconstruct gmState

```js
async function reconstructFromSave(saveData) {
  let gmState = {};

  if (saveData.mode === 'compact' && saveData.seed) {
    // Procedural world: regenerate from seed
    const worldData = generateWorld(saveData.seed, saveData.theme);

    // Re-expand character (look up item details from loot tables)
    const allItems = [];
    Object.values(worldData.rooms).forEach(r => r.loot.forEach(i => allItems.push(i)));
    const char = saveData.char;
    const statKeys = ['STR','DEX','INT','WIS','CON','CHA'];
    const stats = {};
    statKeys.forEach((k,i) => { stats[k] = char.st[i]; });
    const inventory = (char.inv||[]).map(saved => {
      const full = allItems.find(i => i.id === saved.id) || { id: saved.id, name: saved.id };
      return { ...full, uses: saved.u };
    });
    const character = { name:char.n, class:char.cl, hp:char.hp, maxHp:char.mhp, stats, inventory, conditions:char.cond||[], xp:char.xp||0, level:char.lvl||1 };

    // Apply NPC mutations
    const dispMap = { gua:'guarded',neu:'neutral',fri:'friendly',hos:'hostile',des:'desperate' };
    const rosterMutations = (saveData.npcs||[]).map(m => {
      const o = { id:m.id };
      if (m.dead) o.alive = false;
      if (m.tr)   o.trust = m.tr;
      if (m.di)   o.disposition = dispMap[m.di] || m.di;
      if (m.rm)   o.currentRoom = m.rm;
      return o;
    });
    rosterMutations.forEach(mut => {
      const npc = worldData.roster.find(n => n.id === mut.id || n.name.toLowerCase().replace(/\s+/g,'_') === mut.id);
      if (npc) Object.assign(npc, mut);
    });

    // Expand codex mutations
    const stMap = { d:'discovered',p:'partial',r:'redacted' };
    const codexMutations = (saveData.codex||[]).map(m => ({
      id:m.id, state:stMap[m.st]||'partial', discoveredAt:m.sc||null, via:m.via||null, secrets:m.sec||[]
    }));

    gmState = { seed:saveData.seed, theme:saveData.theme, scene:saveData.scene, currentRoom:saveData.room,
      visitedRooms:saveData.visited||[], character, worldFlags:saveData.flags||{},
      worldData, rosterMutations, codexMutations, rollHistory:[] };

  } else {
    // Full/hand-authored mode: restore directly
    const char = saveData.char;
    gmState = { scene:saveData.scene, currentRoom:saveData.room, visitedRooms:saveData.visited||[],
      character:char, worldFlags:saveData.flags||{}, rosterMutations:saveData.npcs||[],
      codexMutations:saveData.codex||[], rollHistory:[],
      worldData: saveData.worldSnapshot ? { rooms:saveData.worldSnapshot.rooms, startRoom:saveData.worldSnapshot.startRoom } : null };
  }

  return gmState;
}
```

### Step 3 — Rebuild the codex from mutations

After reconstructing `gmState`, re-apply `codexMutations` onto the seeded codex:

```js
function applyCodexMutations(codex, mutations) {
  mutations.forEach(mut => {
    const entry = codex.find(e => e.id === mut.id);
    if (!entry) return;
    entry.state = mut.state;
    if (mut.discoveredAt) entry.discoveredAt = mut.discoveredAt;
    if (mut.via) {
      const [method, source] = (mut.via || ':').split(':');
      entry.discoveredVia = { method, source: source || 'direct observation' };
    }
    if (mut.secrets && mut.secrets.length) {
      entry.secrets = mut.secrets.map(s => ({ text: s }));
    }
  });
  return codex;
}

gmState.codex = applyCodexMutations(
  seedCodexFromWorldData(gmState.worldData),  // fresh seed
  gmState.codexMutations                       // player's history
);
```

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

## Codex Access Button in Scene Widget — Save Extension

Extend the scene widget footer with a save button alongside the codex button:

```html
<button class="footer-btn" id="save-btn"
  data-prompt="Generate my save file as a downloadable .save.md file following the exact format in modules/save-codex.md. Use YAML frontmatter plus an encoded SC1: or SF1: payload string. Never write game state as human-readable markdown."
  style="font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:0.08em;
  background:transparent; border:0.5px solid var(--color-border-tertiary);
  border-radius:var(--border-radius-md); padding:4px 10px;
  color:var(--color-text-tertiary); cursor:pointer;">
  Save ↗
</button>
```

The Save button uses `sendPrompt()` to ask Claude to generate the `.save.md` file as a
downloadable conversation artifact. The `↗` suffix indicates this button triggers a
`sendPrompt()` call. The `#save-data` div must be present in the scene widget for the
inline fallback display (see Per-Scene Save Generation above).

If `sendPrompt()` is unavailable, the button falls back to displaying the pre-computed
save string from the `#save-data` div in a readonly textarea with a copy button. The
player copies the string manually and pastes it to resume later.

### Resume Formats

The resume flow accepts any of the following inputs:

- **Raw save string** — pasting the checksummed save string directly into the chat (the
  original method, still fully supported).
- **Uploading the `.save.md` file** — Claude reads the YAML frontmatter for version checking
  and extracts the save payload from the fenced code block in the markdown body.
- **Pasting the entire `.save.md` content** (frontmatter + body) — Claude parses the YAML
  frontmatter for metadata and extracts the payload string from the code block.

In all three cases, the GM validates the checksum, detects the mode, and reconstructs `gmState`
using the standard resume protocol documented below.

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
