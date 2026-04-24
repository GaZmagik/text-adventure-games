# Star Chart — Sector Navigation Engine

> Module for text-adventure orchestrator. Loaded for space travel between star systems.

The star chart is the macro layer. Where the floor-plan map shows corridors and airlocks, the star
chart shows what hangs in the dark between destinations: fourteen star systems, some reachable in
hours, one that stopped responding six months ago, another that three different factions claim to
own. It is navigational data and political intelligence at the same time.

Everything is seeded. The same seed string always produces the same sector — the same system names,
the same jump routes, the same faction territories, the same hazard zones. The player discovers it
progressively: adjacent systems light up as they jump; the full chart never reveals itself at once.

The star chart lives in its own widget, summoned on demand. It does not interrupt scenes. When the
player plots a course, it fires a `sendPrompt()` carrying the destination and travel time into the
next scene.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: ship-systems, crew-manifest, lore-codex, procedural-world-gen, save-codex modules.

---

## § CLI Commands

| Action               | Command                                  | Tool              |
| -------------------- | ---------------------------------------- | ----------------- |
| Render star chart    | `tag render starchart --style <style>`   | Run via Bash tool |
| Set navigation state | `tag state set navPlottedCourse <value>` | Run via Bash tool |
| Set navigation flags | `tag state set worldFlags.<key> <value>` | Run via Bash tool |

> **Do not hand-code star chart HTML/CSS/JS.** Always run the CLI command via Bash tool to render the star chart widget. The `tag render starchart` command handles the SVG map, system nodes, route lines, faction zones, inspect panel, jump buttons, and sendPrompt wiring automatically.

---

## Architecture Overview

```
World generation (procedural-world-gen module)
        ↓
generateSector(seed, factions) called as part of world pipeline
        ↓
Sector data: systems[], routes[], factionZones[], hazards[]
        ↓
Stored in gmState.sectorData (regenerable from seed — not in save payload)
        ↓
Player opens star chart → widget renders with injected sectorData + navState
        ↓
Progressive reveal: only visited/adjacent systems shown; others dim/hidden
        ↓
Player clicks system → inspect panel opens (intel, faction, status, jump cost)
        ↓
Player clicks "Plot course" → sendPrompt() with destination + travel context
        ↓
New scene renders at destination
```

---

## The PRNG Engine

Uses the same Mulberry32 PRNG from the procedural-world-gen module. The star chart generation
runs as a separate seeded pass using `seed + ':sector'` to avoid consuming the room-generation
sequence.

<!-- CLI implementation detail — do not hand-code -->

```js
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashSeed(str) {
  let h = 0xdeadbeef;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x9e3779b9);
    h ^= h >>> 16;
  }
  return h >>> 0;
}
function createSectorPRNG(worldSeed) {
  return mulberry32(hashSeed(worldSeed + ':sector'));
}
function ri(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function rf(rng, min, max) {
  return rng() * (max - min) + min;
}
function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}
function chance(rng, p) {
  return rng() < p;
}
function pickN(rng, arr, n) {
  const c = [...arr],
    r = [];
  for (let i = 0; i < Math.min(n, c.length); i++) {
    r.push(c.splice(Math.floor(rng() * (c.length - i)), 1)[0]);
  }
  return r;
}
```

---

## System Generation

### System name tables

<!-- CLI implementation detail — do not hand-code -->

```js
const SYSTEM_PREFIXES = [
  'Kael',
  'Vor',
  'Seren',
  'Ash',
  'Drav',
  'Obel',
  'Miren',
  'Thal',
  'Zura',
  'Cass',
  'Fenix',
  'Irath',
  'Novu',
  'Korex',
  'Aldis',
  'Vael',
  'Soth',
  'Quen',
  'Ira',
  'Braxis',
];
const SYSTEM_SUFFIXES = [
  'Prime',
  'Station',
  'Reach',
  'Gate',
  'Deep',
  'Margin',
  'Drift',
  'Relay',
  'Hold',
  'Point',
  'Cross',
  'Anchor',
  'Shelf',
  'Spur',
  'Breach',
  'Fold',
  'Watch',
  'Run',
  'Null',
  'Fringe',
];
const SYSTEM_DESIGNATORS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

function generateSystemName(rng, usedNames) {
  let name,
    attempts = 0;
  do {
    const style = ri(rng, 0, 2);
    if (style === 0) {
      name = pick(rng, SYSTEM_PREFIXES) + '-' + ri(rng, 1, 99).toString().padStart(2, '0');
    } else if (style === 1) {
      name = pick(rng, SYSTEM_PREFIXES) + ' ' + pick(rng, SYSTEM_SUFFIXES);
    } else {
      name = pick(rng, SYSTEM_PREFIXES) + ' ' + pick(rng, SYSTEM_DESIGNATORS);
    }
    attempts++;
  } while (usedNames.has(name) && attempts < 20);
  usedNames.add(name);
  return name;
}
```

### System types and properties

<!-- CLI implementation detail — do not hand-code -->

```js
const SYSTEM_TYPES = [
  { type: 'inhabited', weight: 4, icon: 'circle', desc: 'Active population. Docking available.' },
  { type: 'station', weight: 3, icon: 'hex', desc: 'Orbital platform. No planetary surface.' },
  { type: 'abandoned', weight: 2, icon: 'circle', desc: 'Once inhabited. No active response.' },
  { type: 'gas_giant', weight: 2, icon: 'circle', desc: 'Gas giant system. Fuel scooping possible.' },
  { type: 'debris_field', weight: 1, icon: 'scatter', desc: 'Navigational hazard. Salvage likely.' },
  { type: 'anomaly', weight: 1, icon: 'diamond', desc: 'Sensor-disruptive phenomenon. Unknown origin.' },
  { type: 'dark', weight: 1, icon: 'circle', desc: 'Last contact lost. Status unknown.' },
];
const TYPE_WEIGHTS = SYSTEM_TYPES.map(t => t.weight);

const SYSTEM_HAZARDS = [
  null,
  null,
  null,
  'radiation_belt',
  'interdiction_field',
  'debris_field',
  'patrol_zone',
  'sensor_dead_zone',
];

const STATUS_INTEL = {
  inhabited: ['Receiving standard transponder.', 'Trade traffic nominal.', 'Defence grid active.'],
  station: ['Platform beacon active.', 'Docking queue reported.', 'Restricted approach vector.'],
  abandoned: ['No transponder signal.', 'Atmosphere vented — estimated 3 years prior.', 'Last logged entry redacted.'],
  gas_giant: [
    'Automated fuel depot in high orbit.',
    'Storm season. Scooping window: 4 hours.',
    'No permanent population.',
  ],
  debris_field: [
    'Navigate at 0.1c or below.',
    'Salvage tags from Meridian Corp — pre-conflict.',
    'Automated beacon warns clear passage.',
  ],
  anomaly: ['All scans return null.', 'Previous survey team: missing.', 'Signal origin unresolved.'],
  dark: [
    'No response on any frequency.',
    'Last contact: 6 months, 14 days ago.',
    'Meridian Corp has quarantined approach.',
  ],
};
```

### Layout generation

Systems are placed using a force-relaxation pass to prevent overlap, then routes are
determined by proximity with a minimum spanning tree plus random extra connections.

<!-- CLI implementation detail — do not hand-code -->

```js
function generateSector(worldSeed, factionData) {
  const rng = createSectorPRNG(worldSeed);
  const SYSTEM_COUNT = ri(rng, 10, 16);
  const CANVAS_W = 640,
    CANVAS_H = 520;
  const MARGIN = 60;
  const usedNames = new Set();

  // ── Place systems ──────────────────────────────────────────────────────
  const systems = [];
  for (let i = 0; i < SYSTEM_COUNT; i++) {
    const typeEntry =
      SYSTEM_TYPES[
        (() => {
          let total = TYPE_WEIGHTS.reduce((a, b) => a + b, 0),
            v = rng() * total;
          for (let j = 0; j < SYSTEM_TYPES.length; j++) {
            v -= TYPE_WEIGHTS[j];
            if (v <= 0) return j;
          }
          return SYSTEM_TYPES.length - 1;
        })()
      ];
    systems.push({
      id: `sys_${i}`,
      name: generateSystemName(rng, usedNames),
      type: typeEntry.type,
      icon: typeEntry.icon,
      x: rf(rng, MARGIN, CANVAS_W - MARGIN),
      y: rf(rng, MARGIN, CANVAS_H - MARGIN),
      hazard: pick(rng, SYSTEM_HAZARDS),
      factionControl: null,
      status: pick(rng, STATUS_INTEL[typeEntry.type] || STATUS_INTEL.inhabited),
      revealed: false,
      visited: false,
      dark: typeEntry.type === 'dark',
    });
  }

  // ── Force-relaxation to reduce overlaps ────────────────────────────────
  const MIN_DIST = 72;
  for (let pass = 0; pass < 60; pass++) {
    for (let a = 0; a < systems.length; a++) {
      for (let b = a + 1; b < systems.length; b++) {
        const dx = systems[b].x - systems[a].x;
        const dy = systems[b].y - systems[a].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MIN_DIST && dist > 0.1) {
          const push = (MIN_DIST - dist) / 2;
          const nx = dx / dist,
            ny = dy / dist;
          systems[a].x = Math.max(MARGIN, Math.min(CANVAS_W - MARGIN, systems[a].x - nx * push));
          systems[a].y = Math.max(MARGIN, Math.min(CANVAS_H - MARGIN, systems[a].y - ny * push));
          systems[b].x = Math.max(MARGIN, Math.min(CANVAS_W - MARGIN, systems[b].x + nx * push));
          systems[b].y = Math.max(MARGIN, Math.min(CANVAS_H - MARGIN, systems[b].y + ny * push));
        }
      }
    }
  }

  // ── Build routes via nearest-neighbour spanning tree ──────────────────
  const routes = [];
  const connected = new Set([0]);
  while (connected.size < systems.length) {
    let bestDist = Infinity,
      bestA = -1,
      bestB = -1;
    connected.forEach(ai => {
      for (let bi = 0; bi < systems.length; bi++) {
        if (connected.has(bi)) continue;
        const dx = systems[bi].x - systems[ai].x;
        const dy = systems[bi].y - systems[ai].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < bestDist) {
          bestDist = d;
          bestA = ai;
          bestB = bi;
        }
      }
    });
    if (bestB < 0) break;
    routes.push({ a: bestA, b: bestB, dist: Math.round(bestDist * 0.8 + ri(rng, 0, 30)) });
    connected.add(bestB);
  }

  // ── Extra routes for interesting topology ─────────────────────────────
  const EXTRA = ri(rng, 2, 4);
  for (let e = 0; e < EXTRA; e++) {
    const ai = ri(rng, 0, systems.length - 1);
    let bi = ri(rng, 0, systems.length - 1);
    if (bi === ai) bi = (bi + 1) % systems.length;
    const already = routes.some(r => (r.a === ai && r.b === bi) || (r.a === bi && r.b === ai));
    if (!already) {
      const dx = systems[bi].x - systems[ai].x;
      const dy = systems[bi].y - systems[ai].y;
      routes.push({ a: ai, b: bi, dist: Math.round(Math.sqrt(dx * dx + dy * dy) * 0.8 + ri(rng, 0, 30)) });
    }
  }

  // ── Assign faction territories ──────────────────────────────────────────
  if (factionData && factionData.factions) {
    factionData.factions.forEach(faction => {
      const count = ri(rng, 1, 3);
      for (let c = 0; c < count; c++) {
        const unowned = systems.filter(s => !s.factionControl);
        if (unowned.length) {
          pick(rng, unowned).factionControl = faction.id;
        }
      }
    });
  }

  // ── Designate start and key systems ───────────────────────────────────
  const startIdx = ri(rng, 0, systems.length - 1);
  systems[startIdx].revealed = true;
  systems[startIdx].visited = true;
  systems[startIdx].isStart = true;

  // Reveal adjacent systems to start
  getAdjacentIds(startIdx, routes).forEach(idx => {
    systems[idx].revealed = true;
  });

  // One system is the primary objective (farthest from start, non-dark preferred)
  let maxDist = 0,
    objectiveIdx = startIdx;
  systems.forEach((s, i) => {
    if (i === startIdx) return;
    const dx = s.x - systems[startIdx].x,
      dy = s.y - systems[startIdx].y;
    const d = dx * dx + dy * dy;
    if (d > maxDist && s.type !== 'debris_field') {
      maxDist = d;
      objectiveIdx = i;
    }
  });
  systems[objectiveIdx].isObjective = true;

  return { systems, routes, startSystem: startIdx, objectiveSystem: objectiveIdx };
}

function getAdjacentIds(sysIdx, routes) {
  return routes.filter(r => r.a === sysIdx || r.b === sysIdx).map(r => (r.a === sysIdx ? r.b : r.a));
}

function distLabel(d) {
  if (d < 60) return Math.round(d * 1.2) + 'h';
  if (d < 120) return (d / 24).toFixed(1) + 'd';
  return Math.round(d / 24) + 'd';
}
```

---

## navState — Navigation State Object

Tracks player position, visited systems, and plotted course. Lives in `gmState.navState`.
Persisted in the save-codex `worldFlags` as delta mutations.

<!-- CLI implementation detail — do not hand-code -->

```js
const navState = {
  currentSystem: 'sys_3', // id of current system
  visitedSystems: ['sys_0', 'sys_3'],
  revealedSystems: ['sys_0', 'sys_1', 'sys_3', 'sys_5'], // seen on chart
  plottedCourse: null, // { destination: 'sys_7', travelHours: 42 }
  jumpFuelRemaining: 4, // jumps before refuel needed (if using fuel mechanic)
  darkSystemsIntel: {}, // { 'sys_9': 'Meridian quarantine active' }
  factionStandingVisible: [], // which factions the player knows have territory here
};
```

**Save-codex integration:** `navState` is stored as part of `gmState.worldFlags` using prefixed
keys: `nav_current`, `nav_visited`, `nav_revealed`, `nav_fuel`. The full `sectorData` is never
stored — regenerated from `worldSeed + ':sector'` on resume.

---

## The Star Chart Widget

To render the star chart widget, run the CLI command via Bash tool:

```
tag render starchart --style <style>
```

The CLI handles the SVG map, system nodes, route lines, faction territory zones, inspect
panel, jump/scan buttons, fuel pips, and sendPrompt wiring. Do not hand-code the widget
HTML/CSS/JS.

<!-- Widget HTML/CSS/JS removed — CLI renders this widget. See § CLI Commands above. -->

---

## Progressive Reveal Logic

The chart never shows the full sector at once. When the player jumps to a new system, three
things happen:

1. The destination is added to `navState.visitedSystems` and `navState.revealedSystems`.
2. All systems adjacent to the destination (connected by a direct route) are added to
   `navState.revealedSystems` (but NOT `visitedSystems` — they appear on the chart as
   dim, unvisited nodes the player can inspect and jump to).
3. The chart is re-rendered with the updated `navState`.

<!-- CLI implementation detail — do not hand-code -->

```js
function arriveAtSystem(systemId, navState, sectorData) {
  if (!navState.visitedSystems.includes(systemId)) {
    navState.visitedSystems.push(systemId);
  }
  if (!navState.revealedSystems.includes(systemId)) {
    navState.revealedSystems.push(systemId);
  }
  // Reveal adjacent systems
  const sysIdx = sectorData.systems.findIndex(s => s.id === systemId);
  if (sysIdx >= 0) {
    getAdjacentIds(sysIdx, sectorData.routes).forEach(adjIdx => {
      const adjId = sectorData.systems[adjIdx].id;
      if (!navState.revealedSystems.includes(adjId)) {
        navState.revealedSystems.push(adjId);
      }
    });
  }
  navState.currentSystem = systemId;
  return navState;
}
```

---

## JUMP_COURSE Protocol — GM Response

When the star chart fires `sendPrompt('JUMP_COURSE: ...')`, the GM must:

### Step 1 — Parse the jump

<!-- CLI implementation detail — do not hand-code -->

```js
// Extract fields from the JUMP_COURSE string
// destination="Vor Station" id="sys_7" type="station" travel="18h"
// Hazard: patrol_zone. Jump fuel remaining after this: 3.
```

### Step 2 — Fire NAV_EVENT

Before rendering the arrival scene, choose a transition based on destination type:

| Destination type        | Transition                            | Tone                      |
| ----------------------- | ------------------------------------- | ------------------------- |
| `inhabited` / `station` | `scanline_wipe`                       | Arrival at a known port   |
| `abandoned`             | `fade_black`                          | Crossing into silence     |
| `dark`                  | `fade_black`                          | Heavy, oppressive         |
| `anomaly`               | `fade_white`                          | Something overwhelming    |
| `debris_field`          | `screen_shake` (light) + `fade_black` | Turbulence through debris |
| `gas_giant`             | `fade_black`                          | Atmospheric entry         |

### Step 3 — Update navState

<!-- CLI implementation detail — do not hand-code -->

```js
gmState.navState = arriveAtSystem(destination_id, gmState.navState, gmState.sectorData);
```

### Step 4 — Apply hazard if present

Hazard DCs on arrival:

| Hazard               | DC  | Attribute | Failure consequence                            |
| -------------------- | --- | --------- | ---------------------------------------------- |
| `radiation_belt`     | 13  | CON       | 1d6 damage, poisoned condition                 |
| `interdiction_field` | 14  | INT       | Ship systems offline for 1 scene               |
| `debris_field`       | 12  | DEX       | 1d4 damage to hull (ship-systems skill)        |
| `patrol_zone`        | 15  | CHA       | Detained — faction encounter                   |
| `sensor_dead_zone`   | —   | —         | No roll — all scans return null for this scene |

### Step 5 — Fire LORE_EVENTs

```
LORE_EVENT: unlock | location_[system_id] | observed | direct observation | [scene]
```

If the destination has a faction, also fire:

```
LORE_EVENT: unlock | faction_[faction_id] | observed | [system_name] | [scene]
```

### Step 6 — Render arrival scene

Use the standard scene widget from the orchestrator (SKILL.md). The location header shows the
system name. Atmosphere draws from the system type rather than the room `atmosphere` object
(which applies to interiors).

**System-type atmosphere defaults:**

| Type           | Lighting                             | Sound                                    | Temperature           |
| -------------- | ------------------------------------ | ---------------------------------------- | --------------------- |
| `inhabited`    | Port lights, crowded docking         | Traffic chatter, distant engines         | Controlled            |
| `station`      | Harsh industrial                     | Ventilation hum, clank of docking clamps | Cold sterile          |
| `abandoned`    | Emergency red or none                | Complete silence or hull groaning        | Freezing              |
| `dark`         | Nothing                              | Complete silence                         | Unknown               |
| `gas_giant`    | Churning amber                       | Distant storms, pressure groans          | Scalding near vents   |
| `debris_field` | Sunlight through tumbling wreckage   | Distant impacts, your own breathing      | Vacuum cold           |
| `anomaly`      | Wrong — colours that shouldn't exist | Your own heartbeat                       | Neither cold nor warm |

---

## Integration with the Lore Codex Module

Seed the codex with one entry per star system at world-generation time:

<!-- CLI implementation detail — do not hand-code -->

```js
function seedCodexFromSector(sectorData) {
  return sectorData.systems.map(sys => ({
    id: `location_${sys.id}`,
    category: 'location',
    title: sys.name,
    icon: 'location',
    state: 'locked',
    discoveredVia: null,
    content: {
      summary: `A ${sys.type.replace('_', ' ')} in the sector. ${sys.status}`,
      detail: [
        sys.factionControl ? `Under the influence of ${sys.factionControl}.` : 'No faction claims this system.',
        sys.hazard ? `Known hazard: ${sys.hazard.replace(/_/g, ' ')}.` : 'No charted hazards.',
        sys.dark ? 'All communication has ceased. Reason unknown.' : '',
      ]
        .filter(Boolean)
        .join(' '),
      mechanical: sys.hazard ? `Hazard check required on arrival: ${sys.hazard.replace(/_/g, ' ')}.` : null,
      conditional: sys.isObjective ? [{ flag: 'objective_reached', text: 'This is why you came.' }] : [],
    },
    seeAlso: sys.factionControl ? [`faction_${sys.factionControl}`] : [],
    discoveredAt: null,
    sceneContext: null,
  }));
}
```

---

## Integration with the Save Codex Module

The full `sectorData` is never stored — regenerated from `worldSeed + ':sector'`. Only
`navState` mutations are stored:

<!-- CLI implementation detail — do not hand-code -->

```js
// In the save payload (compact mode), store as worldFlags prefixed entries:
const navFlags = {
  nav_current: navState.currentSystem,
  nav_visited: navState.visitedSystems.join(','),
  nav_revealed: navState.revealedSystems.join(','),
  nav_fuel: navState.jumpFuelRemaining,
};
// Merge into gmState.worldFlags before serialising
Object.assign(gmState.worldFlags, navFlags);

// On resume: extract and rebuild navState
function restoreNavState(worldFlags) {
  return {
    currentSystem: worldFlags.nav_current || 'sys_0',
    visitedSystems: (worldFlags.nav_visited || 'sys_0').split(','),
    revealedSystems: (worldFlags.nav_revealed || 'sys_0').split(','),
    jumpFuelRemaining: worldFlags.nav_fuel !== undefined ? parseInt(worldFlags.nav_fuel) : 4,
    plottedCourse: null,
    darkSystemsIntel: {},
    factionStandingVisible: [],
  };
}
```

---

## Chart Access Button in Scene Widget

The **Nav chart** button is included in the canonical scene footer from `styles/style-reference.md`.
When the GM receives `'Open the star chart.'`, run the CLI command via Bash tool to render it:

```
tag render starchart --style <style>
```

<!-- Footer button HTML removed — the scene footer template includes the Nav chart button. See § CLI Commands above. -->

---

## Anti-Patterns (never do these)

- Never reveal the full sector at once — the blank darkness at the chart's edge is
  itself information: there is more out there the player hasn't found yet.
- Never use CSS variable colours for the SVG starmap background or system fills — the map
  is a physical-colour scene that must not invert in dark mode. All fills and strokes are
  hardcoded hex.
- Never auto-jump without player confirmation — the `JUMP_COURSE` event must originate
  from an explicit `plotCourse()` click. Never auto-plot on system selection.
- Never reveal a `dark` system's interior status until the player has jumped there — the
  dread of the unknown is a resource. Spend it once.
- Never store `sectorData` in the save payload — it bloats the save string and is always
  regenerable from `worldSeed + ':sector'`.
- Never place the objective system adjacent to the start — the player should have to cross
  at least two jumps, encountering at least two intermediate systems, before reaching it.
- Never label hazards in the route lines themselves — hazards appear only in the inspect
  panel for systems the player has visited or scanned. Discovering them mid-jump is a story
  beat, not a label.
- Never allow the chart to auto-close after a course is plotted — the player may want to
  review the route or inspect adjacent systems before committing to the jump.
