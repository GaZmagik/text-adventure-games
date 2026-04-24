# Geographical Map — On-World Navigation Engine

> Module for text-adventure orchestrator. Loaded for on-world exploration: settlements, wilderness, dungeons, and interiors.

Where the star-chart module handles the void between worlds, this module handles the ground
beneath the player's feet. A settlement with winding streets and locked districts. A wilderness
crossed on foot where the terrain itself is an antagonist. A dungeon where every corridor is a
decision and every room might be the last one.

The geographical map is the local layer. It tracks where the player is, what they can see, what
they have explored, and what lies beyond the edge of their knowledge. Fog of war is not optional —
the player earns the map by walking it.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: procedural-world-gen, lore-codex, crew-manifest, save-codex modules.

---

## § CLI Commands

| Action                        | Command                                                                                | Tool              |
| ----------------------------- | -------------------------------------------------------------------------------------- | ----------------- |
| Generate/apply procedural map | `tag world generate --seed <seed> [--theme <theme>] --apply`                           | Run via Bash tool |
| Move between zones            | `tag map enter <zone-id>`                                                              | Run via Bash tool |
| Reveal/discover/unlock zones  | `tag map reveal <zone-id>` / `tag map discover <from> <to>` / `tag map unlock <route>` | Run via Bash tool |
| Inspect zone                  | `tag map inspect <zone-id>`                                                            | Run via Bash tool |
| Plan route                    | `tag map route <from> <to>`                                                            | Run via Bash tool |
| Render world map              | `tag render map --style <style>`                                                       | Run via Bash tool |
| Render route planner          | `tag render route-planner --style <style> --data '{"from":"<zone>","to":"<zone>"}'`    | Run via Bash tool |
| Render world atlas            | `tag render world-atlas --style <style>`                                               | Run via Bash tool |
| Set map state                 | `tag state set mapState.<path> <value>`                                                | Run via Bash tool |

---

## Architecture Overview

```
World generation (procedural-world-gen module or hand-authored)
        ↓
Map data: zones[], connections[], terrain, points of interest
        ↓
Stored in gmState.mapState
        ↓
Player opens map → widget renders with injected mapState
        ↓
Progressive reveal: only visited/adjacent zones shown; others hidden
        ↓
Player clicks zone → inspect panel (description, known threats, resources)
        ↓
Player clicks "Travel to [zone]" → sendPrompt() with destination + travel context
        ↓
Travel resolution: time, encounters, resource cost
        ↓
New scene renders at destination
```

---

## Map Types

Three map types cover the full range of on-world exploration. Each has its own visual style,
scale, and mechanical concerns.

### Settlement Map

Towns, cities, stations, outposts, camps. The player navigates between named districts or
locations within an inhabited area.

**Visual style:** Top-down schematic. Buildings as labelled rectangles or simplified footprints.
Streets as lines connecting locations. Key landmarks rendered with distinct SVG icons.

**Scale:** Walking distances measured in minutes. Travel between adjacent locations is typically
5–15 minutes. No resource cost for movement within a settlement unless under time pressure.

**Zones:** Each location is a named zone — the market, the docks, the governor's quarters, the
slums, the cantina. Zones have:

- `type` — commercial, residential, industrial, restricted, derelict
- `faction` — who controls this area (if contested, show both)
- `threat` — none, low, medium, high (affects encounter likelihood)
- `status` — open, locked (requires key/persuasion), hostile (combat on entry), destroyed

**Mechanical effects:**

- Restricted zones require a check (Persuasion, Stealth, or a key item) to enter.
- Hostile zones trigger an encounter on entry — always.
- Faction-controlled zones grant advantage on social checks if the player is allied, disadvantage if opposed.

### Wilderness Map

Overland travel between settlements, through forests, across deserts, over mountains. The player
navigates a hex or node-based region map where terrain is the primary obstacle.

**Visual style:** Stylised top-down terrain map. Terrain fills rendered with colour and pattern:
forest (green hatching), desert (amber stipple), mountains (grey peaks), water (blue waves),
swamp (teal crosshatch), plains (pale green solid), road (brown dashed line).

**Scale:** Travel measured in hours or days. Each zone-to-zone movement consumes time and
potentially resources (rations, water, fuel).

**Terrain types and effects:**

| Terrain          | Travel time | DC modifier         | Hazard                        |
| ---------------- | ----------- | ------------------- | ----------------------------- |
| Road/path        | Normal      | None                | None                          |
| Plains/grassland | Normal      | None                | Exposure                      |
| Forest/woodland  | 1.5x        | +1 Navigation       | Ambush, wildlife              |
| Hills            | 1.5x        | +1 Athletics        | Rockfall, exposure            |
| Mountains        | 3x          | +3 Athletics        | Avalanche, altitude, exposure |
| Desert           | 2x          | +2 CON              | Dehydration, sandstorm, heat  |
| Swamp/marsh      | 2x          | +2 CON              | Disease, sinking, wildlife    |
| Tundra/ice       | 2x          | +2 CON              | Hypothermia, whiteout         |
| Water (crossing) | Special     | Swimming/boat check | Drowning, current             |
| Urban ruins      | 1.5x        | +1 Navigation       | Collapse, scavengers          |

**Travel encounters:** Each wilderness zone has an encounter chance rolled when the player enters.
Encounter tables are seeded from procedural-world-gen if active, or hand-authored by the GM.

**Resource consumption:** If the game tracks supplies (rations, water, fuel), wilderness travel
consumes them. Running out triggers escalating CON checks. The map widget shows remaining
supplies alongside travel time estimates.

### Dungeon / Interior Map

Floor-plans for buildings, ships, caves, ruins, bunkers — any enclosed space navigated room by
room. This is the classic dungeon crawl layer.

**Visual style:** Architectural floor-plan. Rooms as labelled rectangles. Corridors as 2px lines.
Doors as perpendicular ticks (open: gap, locked: filled, barred: cross). Stairs/lifts as
directional arrows.

**Scale:** Room-to-room movement is immediate. No travel time cost unless under pursuit or
time pressure (e.g., a collapsing structure, ticking bomb, draining atmosphere).

**Room states:**

- `unexplored` — dashed outline, no label (player knows a room exists but not what is in it)
- `visited` — solid outline, labelled (player has been here, contents known)
- `current` — info colour fill with pulse animation (player is here now)
- `danger` — coral outline (known threat present)
- `locked` — filled door tick (requires key, check, or force)
- `safe` — teal outline (cleared of threats, rest possible)

**Doors and connections:**

- Standard door: passable, no check.
- Locked door: requires key item, Lockpicking check, or Force (STR, may alert enemies).
- Hidden door: not visible until player passes Perception check or finds a clue.
- One-way passages: arrow indicator. Player can enter but not return the same way.
- Collapsed passage: impassable unless cleared (requires tools, time, and a check).

---

## The mapState Object

<!-- CLI implementation detail — do not hand-code -->

```js
gmState.mapState = {
  activeMapType: 'settlement', // 'settlement' | 'wilderness' | 'dungeon'
  mapId: 'trade_station', // unique identifier for this map
  mapName: 'Trade Station', // display name

  zones: [
    {
      id: 'cantina',
      name: 'The Cantina',
      type: 'commercial',
      terrain: null, // wilderness only: 'forest', 'desert', etc.
      x: 120,
      y: 80, // SVG coordinates for rendering
      width: 60,
      height: 40, // dungeon/settlement only
      status: 'visited', // 'unexplored' | 'visited' | 'current' | 'danger' | 'locked' | 'safe'
      faction: null,
      threat: 'low',
      description: 'A dimly lit cantina staffed by a surly Devaronian.',
      encounters: [], // encounter IDs that can trigger here
      loot: [], // item IDs discoverable here
      connections: ['market', 'landing_bay', 'back_alley'],
    },
    // ... more zones
  ],

  connections: [
    { from: 'cantina', to: 'market', type: 'road', bidirectional: true },
    { from: 'cantina', to: 'back_alley', type: 'hidden', bidirectional: true, discovered: false },
    { from: 'landing_bay', to: 'wasteland', type: 'gate', locked: true, keyItem: 'landing_permit' },
  ],

  currentZone: 'cantina',
  visitedZones: ['cantina', 'market'],
  revealedZones: ['cantina', 'market', 'landing_bay'], // visible but not necessarily visited

  // Wilderness-specific
  supplies: { rations: 5, water: 5 }, // null if not tracking
  travelLog: [], // history of zone-to-zone movements with timestamps

  // Dungeon-specific
  doors: [{ between: ['corridor_2', 'armoury'], type: 'locked', status: 'locked', keyItem: 'security_card' }],
};
```

---

## Progressive Revelation

The map never shows everything at once. The player earns knowledge by exploring.

### Revelation rules

1. **Starting zone:** The player's starting zone and its immediate connections are revealed.
2. **On entering a zone:** The zone becomes `visited`. All zones directly connected to it
   become `revealed` (visible outline, name shown, but details hidden until visited).
3. **Hidden connections:** Not revealed until the player discovers them (Perception check,
   NPC hint, item clue). Once discovered, the connection and its destination zone are revealed.
4. **Wilderness scouting:** A successful Perception or Survival check from high ground can
   reveal zones up to two connections away, without visiting them.
5. **Maps as items:** Finding a physical map item can reveal an entire region or dungeon
   layout at once — a significant reward.

### Fog of war rendering

```
Unexplored zone:  dashed outline, no fill, no label
Revealed zone:    solid outline, dim fill, name shown, "?" in centre
Visited zone:     solid outline, full fill, name + icon shown
Current zone:     info-colour fill with CSS pulse animation
```

---

## Travel Mechanics

### Settlement travel

Movement between connected zones in a settlement is free — the player simply clicks the
destination. No check required unless:

- The destination is `locked` or `restricted` (requires a check or key).
- The player is being pursued (triggers a chase encounter or Stealth check).
- There is a time constraint (each move consumes a time unit).

### Wilderness travel

Each zone-to-zone movement in the wilderness:

1. **Announce travel time** based on terrain (see terrain table).
2. **Consume resources** if supplies are tracked (1 ration + 1 water per day of travel).
3. **Roll for encounters** — each zone has an encounter chance. Roll percentile:
   - 01–15: hostile encounter (combat or obstacle)
   - 16–25: neutral encounter (NPC, discovery, weather change)
   - 26–100: uneventful travel
4. **Navigation check** if terrain is difficult (forest, mountains, ruins). Failure means
   the player arrives at the wrong zone or loses extra time.
5. **Arrive and reveal** — destination zone becomes visited, adjacent zones revealed.

### Dungeon movement

Room-to-room movement is immediate. No resource cost. The tension comes from:

- Locked doors requiring checks or keys.
- Hidden rooms requiring discovery.
- Trap checks when entering certain rooms.
- Encounter triggers on entry to danger-marked rooms.
- One-way passages that prevent backtracking.

---

## The Map Widget

Run `tag render map --style <style>` via Bash tool to produce the interactive map widget.
The map type determines the visual style. Never hand-code the map HTML/CSS/JS.

### Common elements

- `viewBox="0 0 680 [height]"` — height proportional to map content.
- Current zone: info-colour fill with CSS pulse animation.
- Visited zones: solid fill, clickable.
- Revealed zones: dim outline, clickable (shows "Travel to [zone]" prompt).
- Unexplored zones: not rendered at all.
- Player position: filled circle (8px, info colour) in the current zone.
- Zone labels: IBM Plex Mono, 10px, centred in zone.

### Interaction pattern

- **Click a visited zone:** Shows zone details panel (description, known contents, connections).
- **Click a revealed zone:** Shows travel prompt with estimated time and resource cost.
  Button: `sendPrompt('I travel to [zone name].')`.
- **Click current zone:** Shows "You are here" with full zone details and available actions.

### Settlement rendering

```
Zones as rounded rectangles with fill colour by type:
  commercial → warm amber
  residential → soft blue
  industrial → grey
  restricted → coral outline, dashed
  derelict → dim grey, dashed

Streets as 2px lines connecting zone centres.
Key landmarks: small SVG icons (star for cantina, anchor for docks, shield for garrison).
```

### Wilderness rendering

```
Zones as hexagons or circles with terrain fill:
  forest → green with tree icon
  desert → amber with sun icon
  mountains → grey with peak icon
  water → blue with wave pattern
  road → brown dashed line overlaid on terrain

Routes as lines connecting zones. Thicker lines for roads, thinner for trails.
Travel time labels on route lines (e.g., "4h", "1d").
```

### Dungeon rendering

```
Rooms as rectangles with status fill:
  unexplored → dashed outline only
  visited → solid outline, pale fill
  current → info fill + pulse
  danger → coral fill
  safe → teal fill

Corridors as 2px lines. Doors as perpendicular ticks on corridor lines.
  open → gap in line
  locked → filled rectangle tick
  hidden → not rendered until discovered

Stairs: triangle arrows. Lifts: double-headed arrows.
```

## Route Planning

Use `tag map route <from> <to>` to calculate a non-mutating route through discovered, unlocked
connections. The command returns:

- `reachable` and `path` for the shortest known route.
- `blockers` for locked or undiscovered frontier routes.
- `travelTime`, `steps`, and `supplyCost` for resource-aware travel.

Use `tag render route-planner --style <style> --data '{"from":"<zone>","to":"<zone>"}'`
when the player needs a visible route diagram. It renders a compact SVG path and explains why a
route is blocked without changing `gmState.mapState`.

Use `tag render world-atlas --style <style>` when the player needs a generated-world browser.
The atlas masks unrevealed room descriptions, loot, encounters, and exits.

---

## Panel Integration

The geo-map panel is toggled via the scene widget footer. The panel shows a summary version
of the current map with the player's position highlighted.

For full interaction (travel, inspect, scout), the player opens the full map widget via
`sendPrompt('Open the map.')`. Run `tag render map --style <style>` via Bash tool to
produce the complete interactive widget.

### Footer button (when module is active)

The map panel button is added to the canonical scene footer from `styles/style-reference.md`.
Run `tag render map --style <style>` via Bash tool to produce the full interactive map widget.

---

## MAP_EVENT Protocol

Events use the pipe-delimited pattern consistent with other modules.

```
MAP_EVENT: enter    | [zoneId]                           // player enters a zone
MAP_EVENT: reveal   | [zoneId]                           // zone becomes visible on map
MAP_EVENT: discover | [connectionId]                     // hidden connection found
MAP_EVENT: lock     | [connectionId] | [reason]          // connection becomes locked
MAP_EVENT: unlock   | [connectionId] | [method]          // connection unlocked
MAP_EVENT: status   | [zoneId] | [newStatus]             // zone status changes
MAP_EVENT: supplies | [type] | [delta]                   // supply change (+/-)
MAP_EVENT: map_item | [regionId]                         // physical map found, reveal region
```

### When to fire MAP_EVENTs

| Trigger                         | Event                                                   |
| ------------------------------- | ------------------------------------------------------- |
| Player moves to a new zone      | `enter` → zone becomes visited, adjacent zones revealed |
| Player passes Perception check  | `discover` → hidden connection revealed                 |
| Player finds a key item         | `unlock` → locked connection becomes passable           |
| Combat clears a zone            | `status` → zone changes from danger to safe             |
| Supplies consumed during travel | `supplies` → rations/water decremented                  |
| Player finds a map item         | `map_item` → entire region revealed at once             |
| Zone is destroyed/collapses     | `status` → zone changes to derelict                     |

---

## Integration with Other Modules

### procedural-world-gen

When the procedural-world-gen module is active, map data is generated as part of the world
pipeline. Run `tag world generate --seed <seed> [--theme <theme>] --apply`; the CLI consumes
`worldData.rooms` and populates `gmState.mapState`.

### lore-codex

When the player visits a zone for the first time, fire a `LORE_EVENT: unlock` for the
corresponding location entry. When they fully explore it (visit all sub-areas or pass an
investigation check), fire `LORE_EVENT: advance` to reveal the full codex entry.

### save-codex

The save-codex captures `gmState.mapState` for persistence. This skill version also persists full
`gmState.worldData` so map inspection can read generated room details directly.

---

## gmState Integration

<!-- CLI implementation detail — do not hand-code -->

```js
// Save-codex compact flags
const mapFlags = {
  map_type: mapState.activeMapType,
  map_id: mapState.mapId,
  map_current: mapState.currentZone,
  map_visited: mapState.visitedZones.join(','),
  map_revealed: mapState.revealedZones.join(','),
  map_supplies_rations: mapState.supplies?.rations ?? -1,
  map_supplies_water: mapState.supplies?.water ?? -1,
  // Door states (only changed doors)
  ...Object.fromEntries(
    mapState.doors.filter(d => d.status !== 'locked').map(d => [`map_door_${d.between.join('_')}`, d.status]),
  ),
};
```

---

## Anti-Patterns (never do these)

- Never reveal the full map at session start — the player earns it by exploring.
- Never show unrevealed zones on the map — they do not exist to the player yet.
- Never skip the travel encounter roll for wilderness movement — even "uneventful" results
  should be narrated briefly (the journey itself is atmosphere).
- Never let locked zones be bypassed without a check, key, or creative solution from the player.
- Never forget to fire LORE_EVENT when the player visits a new location.
- Never render terrain effects in the narrative using mechanical terms — "the sand drags at
  your boots" not "desert terrain imposes +2 DC".
- Never make all wilderness travel dangerous — some journeys should be peaceful, giving the
  player space to breathe between encounters.
- Never auto-move the player — every zone transition requires explicit player input via
  `sendPrompt('I travel to [zone].')`.
- Never consume supplies without informing the player — the map widget or scene status bar
  must show remaining supplies before and after travel.
