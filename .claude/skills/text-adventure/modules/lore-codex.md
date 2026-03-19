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
Additional icons can be assigned per-entry to add flavour.

```js
const ICONS = {
  // Category defaults
  faction:   '<svg viewBox="0 0 16 16" width="14" height="14"><path fill="none" stroke="currentColor" stroke-width="1.5" d="M8 2L2 6v8h4v-4h4v4h4V6z"/></svg>',
  location:  '<svg viewBox="0 0 16 16" width="14" height="14"><circle cx="8" cy="6" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path fill="none" stroke="currentColor" stroke-width="1.5" d="M8 9c0 0-5 4-5 0a5 5 0 0110 0c0 4-5 0-5 0z"/></svg>',
  character: '<svg viewBox="0 0 16 16" width="14" height="14"><circle cx="8" cy="5" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path fill="none" stroke="currentColor" stroke-width="1.5" d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>',
  item:      '<svg viewBox="0 0 16 16" width="14" height="14"><rect x="2" y="6" width="12" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><path fill="none" stroke="currentColor" stroke-width="1.5" d="M5 6V5a3 3 0 016 0v1"/></svg>',
  event:     '<svg viewBox="0 0 16 16" width="14" height="14"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path fill="none" stroke="currentColor" stroke-width="1.5" d="M8 4v4l3 2"/></svg>',
  secret:    '<svg viewBox="0 0 16 16" width="14" height="14"><path fill="none" stroke="currentColor" stroke-width="1.5" d="M8 2a6 6 0 000 12M8 2a6 6 0 010 12M2 8h12M3.5 4.5C5 6 6.5 7 8 8M3.5 11.5C5 10 6.5 9 8 8"/></svg>',
  bestiary:  '<svg viewBox="0 0 16 16" width="14" height="14"><path fill="none" stroke="currentColor" stroke-width="1.5" d="M3 13c0-3 1-5 5-5s5 2 5 5M8 4a2.5 2.5 0 000 5M5 3l1 2M11 3l-1 2"/></svg>',
};
```

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

```html
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400&family=Playfair+Display:ital,wght@0,600;1,400&display=swap');

  .codex-root { font-family: 'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', monospace; padding: 1rem 0 1.5rem; position: relative; }

  .codex-header { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:1rem; flex-wrap:wrap; gap:8px; }
  .codex-title { font-family:'Playfair Display',serif; font-size:22px; font-weight:600; color:var(--color-text-primary); margin:0; }
  .codex-meta { font-size:11px; color:var(--color-text-tertiary); }

  .search-bar { width:100%; box-sizing:border-box; padding:8px 12px; margin-bottom:12px;
    font-family:'IBM Plex Mono','SF Mono','Cascadia Code','Consolas',monospace; font-size:13px;
    border:0.5px solid var(--color-border-secondary); border-radius:var(--border-radius-md);
    background:var(--color-background-primary); color:var(--color-text-primary); }
  .search-bar:focus { outline: 2px solid var(--color-border-primary, #4a90d9); outline-offset: 2px; border-color:var(--color-border-primary); }
  .search-bar::placeholder { color:var(--color-text-tertiary); }

  .tab-row { display:flex; gap:4px; flex-wrap:wrap; margin-bottom:12px; }
  .tab-btn { padding:8px 14px; min-height:44px; min-width:44px; box-sizing:border-box; font-family:'IBM Plex Mono','SF Mono','Cascadia Code','Consolas',monospace; font-size:10px;
    letter-spacing:0.08em; background:transparent;
    border:0.5px solid var(--color-border-tertiary); border-radius:var(--border-radius-md);
    color:var(--color-text-secondary); cursor:pointer; transition:all 0.1s; white-space:nowrap; }
  .tab-btn:hover { background:var(--color-background-secondary); }
  .tab-btn.active { border-color:var(--color-border-info); background:var(--color-background-info); color:var(--color-text-info); }

  .codex-body { display:grid; grid-template-columns:200px 1fr; gap:12px; min-height:min(360px, 60vh); }
  @media (max-width:520px) { .codex-body { grid-template-columns:1fr; } }

  .entry-list { display:flex; flex-direction:column; gap:4px; overflow-y:auto; max-height:420px; }

  .entry-row { display:flex; align-items:center; gap:8px; padding:8px 10px;
    border-radius:var(--border-radius-md); cursor:pointer;
    border:0.5px solid transparent; transition:all 0.1s; }
  .entry-row:hover { background:var(--color-background-secondary); border-color:var(--color-border-tertiary); }
  .entry-row.selected { background:var(--color-background-info); border-color:var(--color-border-info); }
  .entry-row.new-entry { border-color:var(--color-border-warning, #ffc107); background:var(--color-background-warning, #fef3cd); }

  .entry-icon { width:14px; height:14px; flex-shrink:0; color:var(--color-text-tertiary); }
  .entry-row.selected .entry-icon { color:var(--color-text-info); }

  .entry-row-title { font-size:12px; flex:1; color:var(--color-text-primary); line-height:1.3; }
  .entry-row-title.partial { color:var(--color-text-secondary); }

  .state-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
  .dot-partial    { background:#EF9F27; }
  .dot-discovered { background:#1D9E75; }
  .dot-redacted   { background:#888780; }

  .detail-panel { background:var(--color-background-secondary);
    border:0.5px solid var(--color-border-tertiary); border-radius:var(--border-radius-lg, 12px);
    padding:1.25rem; overflow-y:auto; max-height:420px; }

  .detail-empty { display:flex; align-items:center; justify-content:center; height:100%;
    font-size:12px; color:var(--color-text-tertiary); font-style:italic; }

  .detail-category { font-size:11px; letter-spacing:0.15em; text-transform:uppercase;
    color:var(--color-text-tertiary); margin-bottom:6px; display:flex; align-items:center; gap:6px; }
  .detail-title { font-family:'Playfair Display',serif; font-size:18px; font-weight:600;
    color:var(--color-text-primary); margin:0 0 4px; line-height:1.2; }
  .discovery-stamp { font-size:10px; color:var(--color-text-tertiary); font-style:italic;
    margin-bottom:1rem; padding-bottom:0.75rem;
    border-bottom:0.5px solid var(--color-border-tertiary); }

  .detail-section { margin-bottom:0.75rem; }
  .detail-section-label { font-size:11px; letter-spacing:0.12em; text-transform:uppercase;
    color:var(--color-text-tertiary); margin-bottom:4px; }
  .detail-section-body { font-size:13px; color:var(--color-text-secondary); line-height:1.75; }
  .detail-section-body.serif { font-family:'Playfair Display',serif; font-style:italic; font-size:14px; }

  .detail-locked { background:var(--color-background-tertiary);
    border-radius:var(--border-radius-md); padding:8px 12px;
    font-size:12px; color:var(--color-text-tertiary);
    font-style:italic; letter-spacing:0.05em; margin-bottom:0.75rem; }

  .mechanical-block { background:var(--color-background-primary);
    border-left:2px solid var(--color-border-info); padding:8px 12px;
    border-radius:0 var(--border-radius-md) var(--border-radius-md) 0;
    font-size:12px; color:var(--color-text-info); line-height:1.6;
    border-top:0.5px solid var(--color-border-tertiary);
    border-bottom:0.5px solid var(--color-border-tertiary);
    border-right:0.5px solid var(--color-border-tertiary);
    margin-bottom:0.75rem; }

  .secret-block { background:var(--color-background-warning, #fef3cd);
    border-left:2px solid var(--color-border-warning, #ffc107);
    border-top:0.5px solid var(--color-border-warning, #ffc107);
    border-bottom:0.5px solid var(--color-border-warning, #ffc107);
    border-right:0.5px solid var(--color-border-tertiary);
    padding:8px 12px; border-radius:0 var(--border-radius-md) var(--border-radius-md) 0;
    margin-bottom:0.75rem; }
  .secret-label { font-size:11px; letter-spacing:0.12em; text-transform:uppercase;
    color:#633806; margin-bottom:4px; }
  @media (prefers-color-scheme:dark) { .secret-label { color:var(--color-text-warning, #FAC775); } }
  .secret-text { font-size:12px; font-style:italic; color:var(--color-text-warning, #856404); line-height:1.6; }

  .see-also { display:flex; flex-wrap:wrap; gap:4px; margin-top:0.75rem;
    padding-top:0.75rem; border-top:0.5px solid var(--color-border-tertiary); }
  .see-also-label { font-size:11px; letter-spacing:0.12em; text-transform:uppercase;
    color:var(--color-text-tertiary); width:100%; margin-bottom:2px; }
  .see-also-link { font-size:10px; padding:2px 8px; border-radius:var(--border-radius-md);
    background:var(--color-background-primary); border:0.5px solid var(--color-border-secondary);
    color:var(--color-text-secondary); cursor:pointer; transition:all 0.1s; }
  .see-also-link:hover { border-color:var(--color-border-info); color:var(--color-text-info); background:var(--color-background-info); }

  .section-divider { font-size:11px; letter-spacing:0.15em; text-transform:uppercase;
    color:var(--color-text-tertiary); padding:4px 0 6px;
    border-top:0.5px solid var(--color-border-tertiary); margin-top:6px; }

  .footer-row { display:flex; justify-content:space-between; align-items:center;
    margin-top:1rem; padding-top:0.75rem;
    border-top:0.5px solid var(--color-border-tertiary); }
  .close-btn { font-family:'IBM Plex Mono','SF Mono','Cascadia Code','Consolas',monospace; font-size:10px; letter-spacing:0.08em;
    background:transparent; border:0.5px solid var(--color-border-secondary);
    border-radius:var(--border-radius-md); padding:8px 14px; min-height:44px; min-width:44px; box-sizing:border-box;
    color:var(--color-text-secondary); cursor:pointer; }
  .close-btn:hover { background:var(--color-background-secondary); }
  .entry-counter { font-size:11px; color:var(--color-text-tertiary); }

  @media (prefers-reduced-motion: reduce) {
    * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
  }

  button:focus-visible, [data-prompt]:focus-visible, input:focus-visible {
    outline: 2px solid var(--color-border-primary, #4a90d9);
    outline-offset: 2px;
  }
</style>

<div class="codex-root">
  <div class="codex-header">
    <p class="codex-title">Field Codex</p>
    <span class="codex-meta" id="codex-meta">Loading...</span>
  </div>

  <input class="search-bar" id="search" placeholder="Search entries..." />

  <div class="tab-row" id="tab-row"></div>

  <div class="codex-body">
    <div class="entry-list" id="entry-list"></div>
    <div class="detail-panel" id="detail-panel">
      <div class="detail-empty">Select an entry to read it.</div>
    </div>
  </div>

  <p id="lc-fallback" style="display:none; font-size:11px; padding:8px 12px; margin:0.5rem 0; background:var(--color-background-warning); border:0.5px solid var(--color-border-warning); border-radius:var(--border-radius-md); color:var(--color-text-warning); word-break:break-word; user-select:all;"></p>

  <!-- Overlay controls (not a scene footer — see styles/style-reference.md for the canonical scene footer) -->
  <div class="footer-row">
    <span class="entry-counter" id="entry-counter"></span>
    <button class="close-btn" data-prompt="Close the codex. Continue the adventure.">Close codex ↗</button>
  </div>
</div>

<script>
// ── INJECT CODEX DATA HERE ──────────────────────────────────────────────────
// Replace CODEX_DATA with JSON.stringify(gmState.codex) when building widget
const CODEX_DATA = /* INJECT_CODEX_JSON */ [];
const CURRENT_SCENE = /* INJECT_SCENE_NUMBER */ 1;
// ───────────────────────────────────────────────────────────────────────────

const ICONS_SVG = {
  faction:   '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2L2 6v8h4v-4h4v4h4V6z"/></svg>',
  location:  '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="6" r="3"/><path d="M8 9c0 0-5 4-5 0a5 5 0 0110 0c0 4-5 0-5 0z"/></svg>',
  character: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>',
  item:      '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="6" width="12" height="8" rx="1"/><path d="M5 6V5a3 3 0 016 0v1"/></svg>',
  event:     '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/></svg>',
  secret:    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2a6 6 0 000 12M8 2a6 6 0 010 12M2 8h12"/></svg>',
  bestiary:  '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 13c0-3 1-5 5-5s5 2 5 5M8 4a2.5 2.5 0 000 5M5 3l1 2M11 3l-1 2"/></svg>',
};

const CATEGORIES = ['all','faction','location','character','item','event','bestiary'];
const CAT_LABELS  = { all:'All', faction:'Factions', location:'Locations', character:'Characters', item:'Items', event:'Events', bestiary:'Bestiary' };

function showFallback(text) {
  const el = document.getElementById('lc-fallback');
  if (!el) return;
  el.textContent = text;
  el.style.display = 'block';
}

// esc() escapes interpolated values to prevent XSS when building HTML via innerHTML
function esc(str) {
  if (typeof str !== 'string') return str == null ? '' : String(str);
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

let codex = CODEX_DATA.filter(e => e.state !== 'locked');
let activeCategory = 'all';
let selectedId = null;
let searchTerm = '';

function countByCategory(cat) {
  return codex.filter(e => cat === 'all' || e.category === cat).length;
}

function buildTabs() {
  const row = document.getElementById('tab-row');
  // Uses data-category attribute + event delegation instead of inline onclick
  row.innerHTML = CATEGORIES.map(c => {
    const n = countByCategory(c);
    return `<button class="tab-btn${c === activeCategory ? ' active':''}" data-category="${esc(c)}">${CAT_LABELS[c]} ${n > 0 ? `(${n})` : ''}</button>`;
  }).join('');
}

function setCategory(cat) {
  activeCategory = cat;
  buildTabs();
  renderList();
}

function filterEntries() {
  searchTerm = document.getElementById('search').value.toLowerCase();
  renderList();
}

function visibleEntries() {
  return codex.filter(e => {
    const catMatch = activeCategory === 'all' || e.category === activeCategory;
    const searchMatch = !searchTerm
      || e.title.toLowerCase().includes(searchTerm)
      || (e.content.summary || '').toLowerCase().includes(searchTerm);
    return catMatch && searchMatch;
  });
}

function renderList() {
  const list = document.getElementById('entry-list');
  const entries = visibleEntries();

  // Split: recent (last 3 scenes) vs rest
  const recent = entries.filter(e => e.discoveredAt && CURRENT_SCENE - e.discoveredAt <= 3);
  const rest    = entries.filter(e => !(e.discoveredAt && CURRENT_SCENE - e.discoveredAt <= 3));

  let html = '';
  if (recent.length) {
    html += `<div class="section-divider">Recently discovered</div>`;
    recent.forEach(e => { html += entryRowHTML(e, true); });
    if (rest.length) html += `<div class="section-divider">All entries</div>`;
  }
  rest.forEach(e => { html += entryRowHTML(e, false); });

  if (!entries.length) {
    html = `<div style="font-size:12px;color:var(--color-text-tertiary);padding:1rem;font-style:italic;">No entries found.</div>`;
  }

  list.innerHTML = html;

  const discovered = codex.filter(e => e.state === 'discovered').length;
  const total = codex.length;
  document.getElementById('codex-meta').textContent = `${discovered}/${total} fully documented`;
  document.getElementById('entry-counter').textContent = `${entries.length} entr${entries.length !== 1 ? 'ies' : 'y'} shown`;
}

function entryRowHTML(e, isNew) {
  const icon = ICONS_SVG[e.icon] || ICONS_SVG[e.category] || '';
  const dotClass = e.state === 'discovered' ? 'dot-discovered' : e.state === 'partial' ? 'dot-partial' : 'dot-redacted';
  const isSelected = e.id === selectedId;
  const titleClass = e.state === 'partial' ? 'entry-row-title partial' : 'entry-row-title';
  return `<div class="entry-row${isSelected ? ' selected' : ''}${isNew ? ' new-entry' : ''}"
    data-entry-id="${esc(e.id)}">
    <span class="entry-icon">${icon}</span>
    <span class="${titleClass}">${esc(e.title)}</span>
    <span class="state-dot ${dotClass}"></span>
  </div>`;
}

function selectEntry(id) {
  selectedId = id;
  renderList();
  renderDetail();
}

function renderDetail() {
  const panel = document.getElementById('detail-panel');
  const e = codex.find(x => x.id === selectedId);
  if (!e) { panel.innerHTML = '<div class="detail-empty">Select an entry to read it.</div>'; return; }

  const icon = ICONS_SVG[e.icon] || ICONS_SVG[e.category] || '';
  const methodMap = { observed:'Direct observation', told:'Told by', read:'Read in', deduced:'Deduced from', overheard:'Overheard from', forced:'Extracted from' };
  const stamp = e.discoveredVia
    ? `${esc(methodMap[e.discoveredVia.method] || e.discoveredVia.method)} ${e.discoveredVia.source !== 'direct observation' ? esc(e.discoveredVia.source) : ''} — Scene ${esc(e.discoveredAt)}`
    : '';
  const context = esc(e.sceneContext || '');

  let html = `
    <div class="detail-category">${icon}<span>${esc(CAT_LABELS[e.category] || e.category)}</span></div>
    <p class="detail-title">${esc(e.title)}</p>
  `;

  if (stamp || context) {
    html += `<div class="discovery-stamp">${[stamp, context].filter(Boolean).join(' · ')}</div>`;
  }

  if (e.state === 'redacted') {
    html += `<div class="detail-locked">[REDACTED — this knowledge has been taken from you]</div>`;
    panel.innerHTML = html;
    return;
  }

  // Summary — always shown for partial+
  if (e.content.summary) {
    html += `<div class="detail-section">
      <div class="detail-section-body serif">${esc(e.content.summary)}</div>
    </div>`;
  }

  // Detail — only at discovered
  if (e.state === 'discovered' && e.content.detail) {
    html += `<div class="detail-section">
      <div class="detail-section-label">Full account</div>
      <div class="detail-section-body">${esc(e.content.detail)}</div>
    </div>`;
  } else if (e.state === 'partial') {
    html += `<div class="detail-locked">[ Further details undiscovered — investigate further ]</div>`;
  }

  // Mechanical note — only at discovered
  if (e.state === 'discovered' && e.content.mechanical) {
    html += `<div class="mechanical-block">${esc(e.content.mechanical)}</div>`;
  }

  // Secrets (amendments)
  if (e.state === 'discovered' && e.secrets && e.secrets.length) {
    e.secrets.forEach(s => {
      html += `<div class="secret-block">
        <div class="secret-label">Secret unlocked</div>
        <div class="secret-text">${esc(s.text)}</div>
      </div>`;
    });
  }

  // Conditional content — shown if world flag matches
  // (flags passed in via CODEX_DATA enrichment — GM sets entry.resolvedConditionals at render time)
  if (e.state === 'discovered' && e.resolvedConditionals && e.resolvedConditionals.length) {
    e.resolvedConditionals.forEach(c => {
      html += `<div class="detail-section">
        <div class="detail-section-label">Additional intelligence</div>
        <div class="detail-section-body">${esc(c)}</div>
      </div>`;
    });
  }

  // Cross-references
  const refs = (e.seeAlso || []).filter(refId => codex.find(x => x.id === refId));
  if (refs.length) {
    html += `<div class="see-also">
      <div class="see-also-label">See also</div>
      ${refs.map(refId => {
        const ref = codex.find(x => x.id === refId);
        return `<span class="see-also-link" data-entry-id="${esc(refId)}">${esc(ref.title)}</span>`;
      }).join('')}
    </div>`;
  }

  panel.innerHTML = html;
}

// Initialise
buildTabs();
renderList();

// ── Event delegation for data-category, data-entry-id, and data-prompt ────
document.querySelector('.codex-root').addEventListener('click', (e) => {
  // Category tab buttons
  const tabBtn = e.target.closest('[data-category]');
  if (tabBtn) { setCategory(tabBtn.dataset.category); return; }

  // Entry row or see-also link clicks
  const entryEl = e.target.closest('[data-entry-id]');
  if (entryEl) { selectEntry(entryEl.dataset.entryId); return; }

  // sendPrompt buttons (e.g. Close codex)
  const promptBtn = e.target.closest('[data-prompt]');
  if (promptBtn) {
    const prompt = promptBtn.dataset.prompt;
    if (typeof sendPrompt === 'function') { sendPrompt(prompt); }
    else { showFallback(prompt); }
  }
});

document.getElementById('search').addEventListener('input', filterEntries);
</script>
```

---

## Injection Pattern

When rendering the codex widget, the GM must inject the current codex state and scene number
into the two placeholder constants before calling `visualize:show_widget`.

The GM also resolves conditional content flags before injection:

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
active scene widget. Add this block to the scene widget template:

```html
<div id="lore-toast" style="display:none; position:absolute; bottom:12px; right:12px;
  background:var(--color-background-warning, #fef3cd); border:0.5px solid var(--color-border-warning, #ffc107);
  border-radius:var(--border-radius-md); padding:6px 12px; font-size:11px;
  color:var(--color-text-warning, #856404); font-family:'IBM Plex Mono','SF Mono','Cascadia Code','Consolas',monospace;
  letter-spacing:0.06em; z-index:10; max-width:220px;">
</div>

<script>
function showLoreToast(entryTitle) {
  const t = document.getElementById('lore-toast');
  if (!t) return;
  t.textContent = '+ Codex: ' + entryTitle;
  t.style.display = 'block';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fadeMs = prefersReduced ? 0 : 500;
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = prefersReduced ? 'none' : 'opacity 0.5s'; }, 2800);
  setTimeout(() => { t.style.display = 'none'; t.style.opacity = '1'; t.style.transition = ''; }, 2800 + fadeMs + 100);
}
// Called by GM when LORE_EVENT is processed:
// showLoreToast('The Hollow Circle');
</script>
```

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
