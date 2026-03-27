# Lore Codex — Living Encyclopaedia Engine
> Module for text-adventure orchestrator. Loaded for any adventure requiring a player-facing knowledge base.

The Lore Codex is the player's accumulated record of everything their character has learned: faction
histories, NPC dossiers, location notes, item lore, discovered secrets, and quest threads. It is
**player-state**, not world-state — the same world event means different things depending on whether
the player witnessed it, heard about it second-hand, or has not yet encountered it at all.

The codex is a persistent widget rendered on demand. It does not auto-open. The player summons it
when they want to review what they know. The GM seeds it with entries at world-generation time and
unlocks new entries via `LORE_EVENT` triggers throughout the session.

Entries are categorised, searchable, and stamped with how the player learned them. An entry the
player pried out of a reluctant NPC reads differently from one found etched on a wall. Context of
discovery is part of the knowledge.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: ai-npc, procedural-world-gen, save-codex modules.

---

## § CLI Commands

| Action | Command | Tool |
|--------|---------|------|
| Render codex panel | `tag render codex --style <style>` | Run via Bash tool |
| Set codex state | `tag state set codexMutations.<index>.<field> <value>` | Run via Bash tool |

---

## Architecture Overview

```
World generation (or GM hand-authoring)
        ↓
Codex seeded — all entries created in LOCKED state
        ↓
Player explores, interrogates NPCs, reads documents, survives encounters
        ↓
GM fires LORE_EVENT → entry transitions LOCKED → DISCOVERED (or PARTIAL → FULL)
        ↓
Optional: toast notification in scene widget ("New codex entry: The Hollow Circle")
        ↓
Player opens codex widget on demand
        ↓
Browsable entries, category filters, search, discovery stamps
        ↓
Player closes → sendPrompt('Close the codex. Continue the adventure.')
```

The codex never generates narrative. It stores and displays what the GM has authored or
procedurally built. Discovery logic is pure JS — no API calls needed to unlock entries.

---

## The Codex Entry Schema

Every entry follows this structure. All fields are authored at world-generation time; `state` and
`discoveredVia` are updated at runtime.

<!-- CLI implementation detail — do not hand-code -->
```js
const codexEntry = {
  id: 'faction_hollow_circle',       // unique, stable, kebab-case
  category: 'faction',               // faction | location | character | item | event | secret | bestiary
  title: 'The Hollow Circle',
  icon: 'circle',                    // icon key — see Icon Vocabulary below

  // Discovery states
  state: 'locked',                   // locked | partial | discovered | redacted
  discoveredVia: null,               // filled on unlock: { method, source, scene }

  // Content tiers — shown progressively as state advances
  content: {
    // Always visible once PARTIAL or above
    summary: 'A secretive cult operating from within the dungeon\'s lower levels, dedicated to '
            + 'the resurrection of a pre-human deity known only as the Hollow One.',

    // Only visible at DISCOVERED
    detail: 'The Hollow Circle predates the current dungeon by at least three centuries. Their '
           + 'rituals require a living host — specifically one who has crossed the threshold '
           + 'between life and death and returned. They believe the player may qualify. The '
           + 'current high priest, Brother Aldric Ashwood, has been searching for a suitable '
           + 'candidate for eleven years.',

    // Only visible at DISCOVERED — the mechanically relevant fragment
    mechanical: 'Hollow Circle cultists gain +2 to all rolls if fighting in the ritual chamber. '
               + 'They will not pursue past the threshold marker on the third floor — doing so '
               + 'would violate their own sacred law.',

    // Optional: only visible if a specific world flag is set
    conditional: [
      {
        flag: 'player_died_and_revived',
        text: 'You now understand why they keep looking at you the way they do.',
      },
    ],
  },

  // Cross-references — rendered as clickable links to other entries
  seeAlso: ['character_brother_aldric', 'location_ritual_chamber', 'event_the_hollow_war'],

  // Discovery metadata — used to filter "recently discovered" and stamp entries
  discoveredAt: null,    // scene number when unlocked
  sceneContext: null,    // short string: "Found in Brother Aldric's journal"
};
```

### State definitions

| State | What the player sees | When it applies |
|-------|---------------------|-----------------|
| `locked` | Entry does not appear in the codex | Not yet encountered |
| `partial` | Title + summary only. Detail is hidden behind `[...]` | Heard about it, not fully understood |
| `discovered` | Full entry including detail and mechanical notes | Directly witnessed or thoroughly researched |
| `redacted` | Title visible, all content replaced with `[CLASSIFIED]` | Player knew, then the knowledge was taken (amnesia, mind-wipe, etc.) |

The `redacted` state is for dramatic moments — not a common mechanic. Use sparingly.

---

## Entry Categories

### faction
Factions, organisations, cults, corporations, gangs. Includes ideology, known members,
territory, and current status.

**Required fields:** name, ideology summary, known strength (1–5), territory note.
**Partial reveals:** name + ideology only.
**Full reveals:** membership, territory, internal tensions, mechanical notes.

### location
Rooms, regions, buildings, planets. Physical description, history, and notable features.

**Required fields:** name, type (room/region/structure), one-sentence flavour.
**Partial reveals:** name + flavour.
**Full reveals:** full atmospheric description, hidden features, exit connections, hazards.

### character
Named NPCs. Identity, role, faction affiliation, and what the player knows of their agenda.
**Never** auto-populate from the ai-npc definition object — the codex entry reflects only
what the *player* has learned, not the full NPC truth.

**Required fields:** name, role/title, faction.
**Partial reveals:** name + role.
**Full reveals:** personality summary, known agenda, disposition toward player, secrets
(only those the player has uncovered through dialogue).

### item
Notable items: key items, unique weapons, quest objects, mysterious artefacts.

**Required fields:** name, type, appearance.
**Partial reveals:** name + appearance.
**Full reveals:** lore, properties, any mechanical effects, origin.

### event
Historical or in-progress events: wars, incidents, disasters, crimes, betrayals.

**Required fields:** name, timeframe (past/ongoing), one-sentence summary.
**Partial reveals:** name + summary.
**Full reveals:** full account, who was responsible, ongoing consequences.

### secret
Information that changes the meaning of something already known. Secrets are not standalone
discoveries — they are *amendments* to existing entries. When a secret is discovered, the
relevant entry's `content.detail` gains an appended revelation.

**Displayed as:** a `[SECRET UNLOCKED]` badge on the parent entry, with the revelation
rendered in a distinct visual style (amber tinted, italic).

### bestiary
Enemy types and creatures. Stats, behaviours, weaknesses.

**Required fields:** name, type, threat level (1–5).
**Partial reveals:** name + type only.
**Full reveals:** full description, combat behaviour, known weaknesses, lore.

---

## Icon Vocabulary

Icons are rendered as small inline SVGs, never emoji. Each category has a default icon.
Additional icons can be assigned per-entry to add flavour. The CLI handles icon rendering
automatically — icon SVGs are embedded in the `tag render codex` output.

---

## LORE_EVENT Protocol

The GM fires a `LORE_EVENT` to unlock or advance a codex entry. This is the single integration
seam between the scene layer and the codex layer. Events are fired via `sendPrompt()` from scene
widgets, NPC widgets, or outcome widgets.

### Event string format

```
LORE_EVENT: unlock | [entryId] | [method] | [source] | [scene]
LORE_EVENT: advance | [entryId] | [method] | [source] | [scene]
LORE_EVENT: secret  | [parentEntryId] | [secretText] | [scene]
LORE_EVENT: redact  | [entryId] | [reason]
```

**Fields:**
- `entryId` — matches `codexEntry.id` exactly.
- `method` — how the player learned it: `observed`, `told`, `read`, `deduced`, `overheard`, `forced`
- `source` — what/who told them: NPC name, item name, room name, or `'direct observation'`
- `scene` — current scene number from `gmState.scene`

### Examples

```
LORE_EVENT: unlock  | faction_hollow_circle | told     | Brother Aldric | 4
LORE_EVENT: advance | faction_hollow_circle | read     | Aldric's journal | 6
LORE_EVENT: secret  | character_brother_aldric | He is not actually ordained — the robes were stolen from a body in the crypts. | 8
LORE_EVENT: unlock  | location_ritual_chamber | observed | direct observation | 7
LORE_EVENT: redact  | event_the_hollow_war | mindwipe trap triggered
```

### When to fire LORE_EVENTs

| Trigger | Event to fire |
|---------|--------------|
| Player enters a room for the first time | `unlock` → location entry at `partial` |
| Player examines a room fully | `advance` → location entry to `discovered` |
| NPC mentions a faction by name | `unlock` → faction entry at `partial` |
| Player earns NPC trust ≥ 60 and NPC reveals agenda | `advance` → character entry |
| NPC admits a secret (ai-npc GM_EVENT received) | `secret` → amends character entry |
| Player picks up a key item | `unlock` → item entry at `partial` |
| Player reads item's inscription or documentation | `advance` → item entry to `discovered` |
| Player witnesses a combat encounter type for the first time | `unlock` → bestiary entry |
| Player defeats an enemy type | `advance` → bestiary entry (reveals weakness) |
| Player deduces a connection between two events | `unlock` → event entry at `discovered` |

**Batch unlock rule:** When a scene transition occurs, fire all relevant `unlock` events for the
new room before the scene widget renders. The toast notifications stack and dismiss in sequence.

---

## Seeding the Codex from procedural-world-gen

When the procedural-world-gen module is active, the codex is seeded automatically from
`worldData` at generation time. Use this function:

<!-- CLI implementation detail — do not hand-code -->
```js
function seedCodexFromWorldData(worldData) {
  const entries = [];

  // Faction entries — one per faction, all start LOCKED
  worldData.factions.factions.forEach(f => {
    entries.push({
      id: `faction_${f.id}`,
      category: 'faction',
      title: f.name,
      icon: 'faction',
      state: 'locked',
      discoveredVia: null,
      content: {
        summary: `A faction operating within this location. Ideology: ${f.ideology}.`,
        detail: `Strength rating: ${f.strength}/5. Controls ${f.territory.length} zone(s). `
               + `Current status: unknown.`,
        mechanical: f.strength >= 4
          ? `Dominant faction — ${f.name} members gain advantage on intimidation rolls here.`
          : null,
        conditional: [],
      },
      seeAlso: [],
      discoveredAt: null,
      sceneContext: null,
    });
  });

  // Faction relation entries — one per hostile/at_war pair, start LOCKED
  const relEntries = {};
  worldData.factions.factions.forEach((fa, i) => {
    worldData.factions.factions.slice(i + 1).forEach(fb => {
      const rel = worldData.factions.relations[`${fa.id}_${fb.id}`]
               || worldData.factions.relations[`${fb.id}_${fa.id}`];
      if (rel === 'hostile' || rel === 'at_war') {
        const id = `event_conflict_${fa.id}_${fb.id}`;
        entries.push({
          id,
          category: 'event',
          title: `Conflict: ${fa.name} vs ${fb.name}`,
          icon: 'event',
          state: 'locked',
          discoveredVia: null,
          content: {
            summary: `An ongoing conflict between ${fa.name} and ${fb.name}.`,
            detail: `Status: ${rel}. The roots of this conflict are not yet clear. `
                  + `Both factions consider this location strategically important.`,
            mechanical: `Being known as an ally of one faction imposes −10 trust with the other on introduction.`,
            conditional: [],
          },
          seeAlso: [`faction_${fa.id}`, `faction_${fb.id}`],
          discoveredAt: null,
          sceneContext: null,
        });
      }
    });
  });

  // Location entries — one per room, all start LOCKED
  Object.values(worldData.rooms).forEach(room => {
    const roomName = room.type.replace(/_/g, ' ');
    entries.push({
      id: `location_${room.id}`,
      category: 'location',
      title: roomName.charAt(0).toUpperCase() + roomName.slice(1),
      icon: 'location',
      state: 'locked',
      discoveredVia: null,
      content: {
        summary: `A ${roomName} within this location.`,
        detail: [
          room.atmosphere.lighting   ? `Lighting: ${room.atmosphere.lighting}.`   : '',
          room.atmosphere.smell      ? `Smell: ${room.atmosphere.smell}.`         : '',
          room.atmosphere.sound      ? `Sound: ${room.atmosphere.sound}.`         : '',
          room.atmosphere.hazard     ? `Known hazard: ${room.atmosphere.hazard.replace(/_/g,' ')}.` : '',
        ].filter(Boolean).join(' '),
        mechanical: room.encounter
          ? `Encounter present: ${room.encounter.name || 'unknown threat'} (threat ${room.encounter.threat}/3).`
          : null,
        conditional: [],
      },
      seeAlso: [],
      discoveredAt: null,
      sceneContext: null,
    });
  });

  // NPC/Character entries — one per roster member, all start LOCKED
  worldData.roster.forEach(profile => {
    entries.push({
      id: `character_${profile.name.toLowerCase().replace(/\s+/g, '_')}`,
      category: 'character',
      title: profile.name,
      icon: 'character',
      state: 'locked',
      discoveredVia: null,
      content: {
        summary: `${profile.factionName} member. First encountered in the ${profile.startRoom.replace(/_/g,' ')}.`,
        detail: `Personality: ${profile.trait}. Speech pattern: ${profile.speech}. `
              + `They want: ${profile.wants}. `
              + (profile.hasSecret ? 'They appear to be concealing something.' : ''),
        mechanical: null,
        conditional: [],
      },
      seeAlso: [`faction_${profile.faction}`],
      discoveredAt: null,
      sceneContext: null,
    });
  });

  // Item entries — seeded from loot tables, all start LOCKED
  const seenItems = new Set();
  Object.values(worldData.rooms).forEach(room => {
    room.loot.forEach(item => {
      if (seenItems.has(item.id)) return;
      seenItems.add(item.id);
      entries.push({
        id: `item_${item.id}`,
        category: 'item',
        title: item.name,
        icon: 'item',
        state: 'locked',
        discoveredVia: null,
        content: {
          summary: `A ${item.type} item.`,
          detail: `Effect: ${item.effect}.${item.uses > 0 ? ` Uses remaining: ${item.uses}.` : ''}`,
          mechanical: `Type: ${item.type}. ${item.effect}`,
          conditional: [],
        },
        seeAlso: [],
        discoveredAt: null,
        sceneContext: null,
      });
    });
  });

  // Quest hook entries — always start PARTIAL so player knows something is in motion
  entries.push({
    id: 'quest_main',
    category: 'event',
    title: 'Primary Objective',
    icon: 'event',
    state: 'partial',
    discoveredVia: { method: 'deduced', source: 'direct observation', scene: 1 },
    content: {
      summary: worldData.hooks.main,
      detail: 'The full implications of this situation are not yet clear.',
      mechanical: null,
      conditional: [],
    },
    seeAlso: [],
    discoveredAt: 1,
    sceneContext: 'Established at the start of your mission',
  });

  worldData.hooks.side.forEach((hook, i) => {
    entries.push({
      id: `quest_side_${i + 1}`,
      category: 'event',
      title: `Thread ${i + 1}`,
      icon: 'event',
      state: 'locked',
      discoveredVia: null,
      content: {
        summary: hook,
        detail: 'Further investigation required.',
        mechanical: null,
        conditional: [],
      },
      seeAlso: [],
      discoveredAt: null,
      sceneContext: null,
    });
  });

  return entries;
}
```

Store the result in `gmState.codex`:
<!-- CLI implementation detail — do not hand-code -->
```js
gmState.codex = seedCodexFromWorldData(gmState.worldData);
```

For hand-authored scenarios (no procedural-world-gen), build the entries array manually using
the schema above and assign it to `gmState.codex` before the first scene.

---

## The Codex Widget

The full interactive widget. Self-contained — reads from a `CODEX` constant embedded at render
time. The GM injects the current `gmState.codex` as a JSON literal when building the widget.

### Features
- Category filter tabs (All / Faction / Location / Character / Item / Event / Bestiary)
- Search (filters by title and summary text, live as the player types)
- Entry list with state badges and discovery stamps
- Entry detail panel — progressive reveal based on state
- Secret amendments highlighted in amber
- Cross-reference links that filter to the linked entry
- Recently discovered section (entries unlocked in last 3 scenes)
- Entry count by category in tab labels

Run `tag render codex --style <style>` via Bash tool to produce the full codex widget.
Never hand-code the codex HTML/CSS/JS.

---

## Injection Pattern

When rendering the codex widget, run `tag render codex --style <style>` via Bash tool. The CLI
handles injection of the current codex state and scene number automatically.

The GM also resolves conditional content flags before injection:

<!-- CLI implementation detail — do not hand-code -->
```js
function prepareCodexForRender(gmState) {
  return gmState.codex
    .filter(e => e.state !== 'locked')  // strip locked entries — player cannot see them
    .map(e => ({
      ...e,
      // Resolve conditionals against current world flags
      resolvedConditionals: (e.content.conditional || [])
        .filter(c => gmState.worldFlags[c.flag])
        .map(c => c.text),
    }));
}

// In the widget template, replace the placeholder lines with:
// const CODEX_DATA = ${JSON.stringify(prepareCodexForRender(gmState))};
// const CURRENT_SCENE = ${gmState.scene};
```

---

## Toast Notification System

When a LORE_EVENT fires during a scene, a small toast notification appears at the bottom of the
active scene widget. The toast is rendered automatically by the CLI when a LORE_EVENT is
processed — run `tag render codex --style <style>` via Bash tool. Never hand-code toast HTML/JS.

The toast is non-blocking — it appears, pauses, then fades. It never interrupts player input.

---

## GM Codex Processing Checklist

When the GM receives a `LORE_EVENT` string via `sendPrompt()`:

1. Parse the event type and fields from the pipe-delimited string.
2. Find the matching entry in `gmState.codex` by `id`.
3. Apply the state transition:
   - `unlock` → set `state: 'partial'`, populate `discoveredVia`, set `discoveredAt`.
   - `advance` → set `state: 'discovered'`, update `discoveredVia` to latest source.
   - `secret` → push `{ text }` into `entry.secrets` array (create if absent). State stays `discovered`.
   - `redact` → set `state: 'redacted'`, clear `content`.
4. If the new entry is a location that has `seeAlso` refs to NPCs in that room,
   auto-unlock those NPC entries to `partial` (player sees someone is there, but knows nothing yet).
5. Fire `showLoreToast(entry.title)` in the current scene widget (if accessible).
6. Persist the updated `gmState.codex` — pass it in the next `sendPrompt()` state string.

---

## Integration Summary

| Source | What feeds the codex | How |
|---|---|---|
| text-adventure orchestrator | Scene transitions, room exploration, item discovery | `LORE_EVENT: unlock / advance` |
| ai-npc module | NPC secrets revealed, disposition changes, agenda exposed | `LORE_EVENT: advance / secret` via GM_EVENT processing |
| procedural-world-gen module | Initial world structure | `seedCodexFromWorldData(worldData)` at session start |
| Hand-authored scenarios | GM-written entries | Manual entry array assigned to `gmState.codex` |

The codex never drives narrative — it reflects it. The world generates events. The GM narrates
them. The codex records what the player's character actually knows.

---

## Scene Footer Integration

Use the canonical scene footer from `styles/style-reference.md`. This module adds the **Codex**
panel button to the footer when loaded. The codex widget is an overlay with its own
Close button — it does not define its own footer.

---

## Quest Log

The Quest Log is a tab within the Codex panel that tracks the player's objectives. It
integrates with the world flag system to auto-advance quest steps and provides a
persistent record of what the player is trying to achieve.

### Quest Structure

Each quest has:
- **Title** — short name (e.g., "Escape the Station").
- **Status** — Active / Completed / Failed / Optional.
- **Objective** — one-line description of what needs to be done.
- **Steps** — ordered list of sub-objectives, each with a checkbox (done/not done).
- **Reward** — what the player gets on completion (credits, items, reputation, XP).
- **Source** — who or what gave the quest.

### Quest Types

- **Main quest** — drives the primary story arc. Always visible. Cannot be abandoned.
- **Side quest** — optional objectives discovered through exploration or NPC interaction.
- **Crew quest** — personal objectives for crew members (if crew-manifest loaded).
  Completing these improves crew morale.

### Quest State Management

- Quests are stored as world flags: `quest_{id}_status`, `quest_{id}_step_{n}_completed`.
- New quests are added when the player accepts them or when story triggers fire.
- Steps auto-complete when relevant world flags are set (e.g., `scene_reactor_visited`
  triggers the "Investigate the reactor" step).
- Failed conditions: if a quest becomes impossible (NPC dies, timer expires), mark as
  Failed with an explanation.

### Display in Codex Panel

The Quest Log appears as a tab alongside Lore Entries and Faction Standings within the
codex panel.

- Active quests at top, completed below (collapsed), failed at bottom (greyed out).
- Each quest is expandable to show steps with checkboxes.
- Main quests marked with a star highlight.

### gmState Fields

<!-- CLI implementation detail — do not hand-code -->
```js
// Quest log entries stored in gmState.quests (see core-systems.md)
// Each quest object:
{
  id: 'escape_station',
  type: 'main',                    // main | side | crew
  title: 'Escape the Station',
  status: 'active',                // active | completed | failed | optional
  objective: 'Find a way off the station before the lockdown.',
  steps: [
    { text: 'Find a ship', done: false },
    { text: 'Acquire launch codes', done: false },
  ],
  reward: { xp: 100, credits: 200 },
  source: 'Opening scenario',
}

// World flags used for quest tracking:
// quest_escape_station_status = 'active'
// quest_escape_station_step_0_completed = false
// quest_escape_station_step_1_completed = false
```

---

## Anti-Patterns (never do these)

- Never reveal a `locked` entry in the widget — strip all locked entries before injection.
- Never unlock an entry before the player has had a plausible in-world reason to learn it.
- Never auto-advance an entry to `discovered` in the same scene it was unlocked to `partial` —
  partial discoveries should linger for at least one scene before full revelation.
- Never put mechanical notes in the `summary` tier — they belong in `mechanical`, shown only at `discovered`.
- Never add `seeAlso` cross-references to locked entries — the player would see a link they
  cannot click yet, which implies the existence of unknown knowledge.
- Never store the full codex in a `sendPrompt()` call — store only the seed, flags, and
  mutation list. Regenerate and re-apply on each GM render pass.
- Never use the codex as a plot device — it records what is known, not what is true. An NPC can
  lie; the codex will faithfully record the lie until a `secret` event amends it.
- Never open the codex automatically — it is player-summoned, always. The world should not
  pause itself to do bookkeeping the player did not ask for.
- Never put unresolved `[...]` placeholders in `summary` — the summary must be complete and
  self-contained for partial-state entries. Only the `detail` tier is gated.
