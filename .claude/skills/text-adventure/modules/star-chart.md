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

```js
function mulberry32(seed) {
  return function() {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hashSeed(str) {
  let h = 0xDEADBEEF;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x9E3779B9);
    h ^= h >>> 16;
  }
  return h >>> 0;
}
function createSectorPRNG(worldSeed) {
  return mulberry32(hashSeed(worldSeed + ':sector'));
}
function ri(rng, min, max) { return Math.floor(rng() * (max - min + 1)) + min; }
function rf(rng, min, max) { return rng() * (max - min) + min; }
function pick(rng, arr)    { return arr[Math.floor(rng() * arr.length)]; }
function chance(rng, p)    { return rng() < p; }
function pickN(rng, arr, n) {
  const c = [...arr], r = [];
  for (let i = 0; i < Math.min(n, c.length); i++) {
    r.push(c.splice(Math.floor(rng() * (c.length - i)), 1)[0]);
  }
  return r;
}
```

---

## System Generation

### System name tables

```js
const SYSTEM_PREFIXES = [
  'Kael','Vor','Seren','Ash','Drav','Obel','Miren','Thal','Zura','Cass',
  'Fenix','Irath','Novu','Korex','Aldis','Vael','Soth','Quen','Ira','Braxis',
];
const SYSTEM_SUFFIXES = [
  'Prime','Station','Reach','Gate','Deep','Margin','Drift','Relay','Hold','Point',
  'Cross','Anchor','Shelf','Spur','Breach','Fold','Watch','Run','Null','Fringe',
];
const SYSTEM_DESIGNATORS = ['I','II','III','IV','V','VI','VII','VIII'];

function generateSystemName(rng, usedNames) {
  let name, attempts = 0;
  do {
    const style = ri(rng, 0, 2);
    if (style === 0) {
      name = pick(rng, SYSTEM_PREFIXES) + '-' + ri(rng, 1, 99).toString().padStart(2,'0');
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

```js
const SYSTEM_TYPES = [
  { type: 'inhabited',    weight: 4, icon: 'circle',   desc: 'Active population. Docking available.'          },
  { type: 'station',      weight: 3, icon: 'hex',      desc: 'Orbital platform. No planetary surface.'        },
  { type: 'abandoned',    weight: 2, icon: 'circle',   desc: 'Once inhabited. No active response.'            },
  { type: 'gas_giant',    weight: 2, icon: 'circle',   desc: 'Gas giant system. Fuel scooping possible.'      },
  { type: 'debris_field', weight: 1, icon: 'scatter',  desc: 'Navigational hazard. Salvage likely.'           },
  { type: 'anomaly',      weight: 1, icon: 'diamond',  desc: 'Sensor-disruptive phenomenon. Unknown origin.'  },
  { type: 'dark',         weight: 1, icon: 'circle',   desc: 'Last contact lost. Status unknown.'             },
];
const TYPE_WEIGHTS = SYSTEM_TYPES.map(t => t.weight);

const SYSTEM_HAZARDS = [
  null, null, null,
  'radiation_belt',
  'interdiction_field',
  'debris_field',
  'patrol_zone',
  'sensor_dead_zone',
];

const STATUS_INTEL = {
  inhabited:    ['Receiving standard transponder.','Trade traffic nominal.','Defence grid active.'],
  station:      ['Platform beacon active.','Docking queue reported.','Restricted approach vector.'],
  abandoned:    ['No transponder signal.','Atmosphere vented — estimated 3 years prior.','Last logged entry redacted.'],
  gas_giant:    ['Automated fuel depot in high orbit.','Storm season. Scooping window: 4 hours.','No permanent population.'],
  debris_field: ['Navigate at 0.1c or below.','Salvage tags from Meridian Corp — pre-conflict.','Automated beacon warns clear passage.'],
  anomaly:      ['All scans return null.','Previous survey team: missing.','Signal origin unresolved.'],
  dark:         ['No response on any frequency.','Last contact: 6 months, 14 days ago.','Meridian Corp has quarantined approach.'],
};
```

### Layout generation

Systems are placed using a force-relaxation pass to prevent overlap, then routes are
determined by proximity with a minimum spanning tree plus random extra connections.

```js
function generateSector(worldSeed, factionData) {
  const rng = createSectorPRNG(worldSeed);
  const SYSTEM_COUNT = ri(rng, 10, 16);
  const CANVAS_W = 640, CANVAS_H = 520;
  const MARGIN = 60;
  const usedNames = new Set();

  // ── Place systems ──────────────────────────────────────────────────────
  const systems = [];
  for (let i = 0; i < SYSTEM_COUNT; i++) {
    const typeEntry = SYSTEM_TYPES[
      (() => {
        let total = TYPE_WEIGHTS.reduce((a,b)=>a+b,0), v = rng()*total;
        for(let j=0;j<SYSTEM_TYPES.length;j++){v-=TYPE_WEIGHTS[j];if(v<=0)return j;}
        return SYSTEM_TYPES.length-1;
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
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < MIN_DIST && dist > 0.1) {
          const push = (MIN_DIST - dist) / 2;
          const nx = dx / dist, ny = dy / dist;
          systems[a].x = Math.max(MARGIN, Math.min(CANVAS_W-MARGIN, systems[a].x - nx*push));
          systems[a].y = Math.max(MARGIN, Math.min(CANVAS_H-MARGIN, systems[a].y - ny*push));
          systems[b].x = Math.max(MARGIN, Math.min(CANVAS_W-MARGIN, systems[b].x + nx*push));
          systems[b].y = Math.max(MARGIN, Math.min(CANVAS_H-MARGIN, systems[b].y + ny*push));
        }
      }
    }
  }

  // ── Build routes via nearest-neighbour spanning tree ──────────────────
  const routes = [];
  const connected = new Set([0]);
  while (connected.size < systems.length) {
    let bestDist = Infinity, bestA = -1, bestB = -1;
    connected.forEach(ai => {
      for (let bi = 0; bi < systems.length; bi++) {
        if (connected.has(bi)) continue;
        const dx = systems[bi].x - systems[ai].x;
        const dy = systems[bi].y - systems[ai].y;
        const d = Math.sqrt(dx*dx+dy*dy);
        if (d < bestDist) { bestDist = d; bestA = ai; bestB = bi; }
      }
    });
    if (bestB < 0) break;
    routes.push({ a: bestA, b: bestB, dist: Math.round(bestDist * 0.8 + ri(rng,0,30)) });
    connected.add(bestB);
  }

  // ── Extra routes for interesting topology ─────────────────────────────
  const EXTRA = ri(rng, 2, 4);
  for (let e = 0; e < EXTRA; e++) {
    const ai = ri(rng, 0, systems.length-1);
    let bi = ri(rng, 0, systems.length-1);
    if (bi === ai) bi = (bi + 1) % systems.length;
    const already = routes.some(r=>(r.a===ai&&r.b===bi)||(r.a===bi&&r.b===ai));
    if (!already) {
      const dx = systems[bi].x - systems[ai].x;
      const dy = systems[bi].y - systems[ai].y;
      routes.push({ a: ai, b: bi, dist: Math.round(Math.sqrt(dx*dx+dy*dy)*0.8+ri(rng,0,30)) });
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
  const startIdx = ri(rng, 0, systems.length-1);
  systems[startIdx].revealed = true;
  systems[startIdx].visited = true;
  systems[startIdx].isStart = true;

  // Reveal adjacent systems to start
  getAdjacentIds(startIdx, routes).forEach(idx => {
    systems[idx].revealed = true;
  });

  // One system is the primary objective (farthest from start, non-dark preferred)
  let maxDist = 0, objectiveIdx = startIdx;
  systems.forEach((s, i) => {
    if (i === startIdx) return;
    const dx = s.x - systems[startIdx].x, dy = s.y - systems[startIdx].y;
    const d = dx*dx + dy*dy;
    if (d > maxDist && s.type !== 'debris_field') { maxDist = d; objectiveIdx = i; }
  });
  systems[objectiveIdx].isObjective = true;

  return { systems, routes, startSystem: startIdx, objectiveSystem: objectiveIdx };
}

function getAdjacentIds(sysIdx, routes) {
  return routes
    .filter(r => r.a === sysIdx || r.b === sysIdx)
    .map(r => r.a === sysIdx ? r.b : r.a);
}

function distLabel(d) {
  if (d < 60)  return Math.round(d * 1.2) + 'h';
  if (d < 120) return (d / 24).toFixed(1) + 'd';
  return Math.round(d / 24) + 'd';
}
```

---

## navState — Navigation State Object

Tracks player position, visited systems, and plotted course. Lives in `gmState.navState`.
Persisted in the save-codex `worldFlags` as delta mutations.

```js
const navState = {
  currentSystem: 'sys_3',         // id of current system
  visitedSystems: ['sys_0','sys_3'],
  revealedSystems: ['sys_0','sys_1','sys_3','sys_5'],  // seen on chart
  plottedCourse: null,             // { destination: 'sys_7', travelHours: 42 }
  jumpFuelRemaining: 4,            // jumps before refuel needed (if using fuel mechanic)
  darkSystemsIntel: {},            // { 'sys_9': 'Meridian quarantine active' }
  factionStandingVisible: [],      // which factions the player knows have territory here
};
```

**Save-codex integration:** `navState` is stored as part of `gmState.worldFlags` using prefixed
keys: `nav_current`, `nav_visited`, `nav_revealed`, `nav_fuel`. The full `sectorData` is never
stored — regenerated from `worldSeed + ':sector'` on resume.

---

## The Star Chart Widget

The complete interactive SVG widget. Hardcoded dark background (per the `starmap` variant rule
in the orchestrator (SKILL.md) — physical-colour scenes use hardcoded hex, not theme variables).
Faction colour tints, system state encoding, animated pulse on current system, and a slide-out
inspect panel.

```html
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Syne:wght@700&display=swap');

  .sc-root { font-family:'IBM Plex Mono','SF Mono','Cascadia Code','Consolas',monospace; padding:1rem 0 1.5rem; }

  .sc-header {
    display:flex; align-items:baseline; justify-content:space-between;
    margin-bottom:0.75rem; flex-wrap:wrap; gap:8px;
  }
  .sc-title { font-family:'Syne','Segoe UI',system-ui,sans-serif; font-size:18px; font-weight:700; color:var(--color-text-primary); margin:0; }
  .sc-meta  { font-size:10px; color:var(--color-text-tertiary); letter-spacing:0.08em; }

  .sc-map-wrap {
    position:relative; border-radius:var(--border-radius-lg, 12px); overflow:hidden;
    border:0.5px solid #1e2430;
  }
  .sc-map-wrap svg { display:block; width:100%; max-width:640px; height:auto; }

  /* System node styles */
  .sys-node { cursor:pointer; }
  .sys-node:hover .sys-ring { opacity:0.5; }

  @keyframes sys-pulse {
    0%,100% { r:10; opacity:0.6; }
    50%     { r:14; opacity:0.2; }
  }
  .sys-current-pulse { animation: sys-pulse 2s ease-in-out infinite; }

  /* Inspect panel */
  .sc-inspect {
    margin-top:8px; padding:1rem 1.1rem;
    background:var(--color-background-primary);
    border:0.5px solid var(--color-border-tertiary);
    border-radius:var(--border-radius-lg, 12px);
    display:none;
  }
  .sc-inspect.open { display:block; }

  .insp-top { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:0.75rem; }
  .insp-name { font-family:'Syne','Segoe UI',system-ui,sans-serif; font-size:16px; font-weight:700; color:var(--color-text-primary); margin:0; }
  .insp-type-badge {
    font-size:11px; letter-spacing:0.12em; text-transform:uppercase; padding:3px 8px;
    border-radius:var(--border-radius-md); font-weight:500; flex-shrink:0;
  }
  .type-inhabited  { background:#E6F1FB; color:#0C447C; }
  .type-station    { background:#EEEDFE; color:#3C3489; }
  .type-abandoned  { background:#F1EFE8; color:#444441; }
  .type-dark       { background:#FCEBEB; color:#791F1F; }
  .type-anomaly    { background:#FBEAF0; color:#72243E; }
  .type-gas_giant  { background:#FAEEDA; color:#633806; }
  .type-debris_field { background:#EAF3DE; color:#27500A; }
  @media(prefers-color-scheme:dark){
    .type-inhabited  { background:#0C447C; color:#B5D4F4; }
    .type-station    { background:#3C3489; color:#CECBF6; }
    .type-abandoned  { background:var(--color-background-secondary, #444441); color:var(--color-text-secondary, #D3D1C7); }
    .type-dark       { background:#791F1F; color:#FFD0D0; }
    .type-anomaly    { background:#72243E; color:#F4C0D1; }
    .type-gas_giant  { background:#633806; color:#FAC775; }
    .type-debris_field { background:#27500A; color:#C0DD97; }
  }

  .insp-grid {
    display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:0.75rem;
  }
  .insp-cell { background:var(--color-background-secondary); border-radius:var(--border-radius-md); padding:8px 10px; }
  .insp-cell-label { font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:var(--color-text-tertiary); margin-bottom:3px; }
  .insp-cell-val   { font-size:12px; color:var(--color-text-primary); font-weight:500; }

  .insp-intel { font-size:12px; color:var(--color-text-secondary); line-height:1.75; font-style:italic; margin-bottom:0.75rem; border-left:2px solid var(--color-border-tertiary); padding-left:10px; }

  .insp-hazard {
    display:none; font-size:11px; padding:6px 10px; border-radius:var(--border-radius-md);
    background:var(--color-background-warning, #fef3cd); color:var(--color-text-warning, #856404);
    border:0.5px solid var(--color-border-warning, #ffc107); margin-bottom:0.75rem;
    letter-spacing:0.04em;
  }
  .insp-hazard.show { display:block; }

  .insp-routes { margin-bottom:0.75rem; }
  .insp-routes-label { font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:var(--color-text-tertiary); margin-bottom:5px; }
  .route-tags { display:flex; flex-wrap:wrap; gap:5px; }
  .route-tag {
    font-size:11px; padding:8px 14px; min-height:44px; min-width:44px; box-sizing:border-box; border-radius:var(--border-radius-md);
    background:var(--color-background-secondary); border:0.5px solid var(--color-border-secondary);
    color:var(--color-text-secondary); cursor:pointer; transition:all 0.1s;
  }
  .route-tag:hover { border-color:var(--color-border-info); color:var(--color-text-info); background:var(--color-background-info); }
  .route-tag.unreachable { opacity:0.4; cursor:default; }
  .route-tag.unreachable:hover { border-color:var(--color-border-secondary); color:var(--color-text-secondary); background:var(--color-background-secondary); }

  .insp-actions { display:flex; gap:8px; flex-wrap:wrap; }
  .jump-btn {
    padding:8px 18px; min-height:44px; min-width:44px; box-sizing:border-box; font-family:'IBM Plex Mono','SF Mono','Cascadia Code','Consolas',monospace; font-size:11px; letter-spacing:0.1em;
    background:transparent; border:0.5px solid var(--color-border-secondary);
    border-radius:var(--border-radius-md); color:var(--color-text-primary); cursor:pointer; transition:background 0.12s;
  }
  .jump-btn:hover { background:var(--color-background-secondary); }
  .jump-btn:disabled { opacity:0.35; cursor:not-allowed; }
  .jump-btn.primary { border-color:var(--color-border-info); color:var(--color-text-info); }
  .jump-btn.primary:hover { background:var(--color-background-info); }

  .sc-footer {
    display:flex; justify-content:space-between; align-items:center;
    margin-top:0.75rem; flex-wrap:wrap; gap:8px;
  }
  .sc-legend { display:flex; gap:12px; flex-wrap:wrap; }
  .leg-item { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--color-text-tertiary); }
  .leg-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }

  .close-btn {
    font-family:'IBM Plex Mono','SF Mono','Cascadia Code','Consolas',monospace; font-size:11px; letter-spacing:0.08em;
    background:transparent; border:0.5px solid var(--color-border-tertiary);
    border-radius:var(--border-radius-md); padding:8px 14px; min-height:44px; min-width:44px; box-sizing:border-box;
    color:var(--color-text-tertiary); cursor:pointer;
  }
  .close-btn:hover { background:var(--color-background-secondary); }

  .fuel-bar-wrap { display:flex; align-items:center; gap:8px; }
  .fuel-label { font-size:10px; color:var(--color-text-tertiary); }
  .fuel-pips { display:flex; gap:3px; }
  .fuel-pip {
    width:10px; height:10px; border-radius:2px;
    border:0.5px solid #2a3040;
  }
  .fuel-pip.full  { background:#1a4a6a; border-color:#2a6a9a; }
  .fuel-pip.empty { background:#1a1e24; }

  @media (prefers-reduced-motion: reduce) {
    * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
  }

  button:focus-visible, [data-prompt]:focus-visible, input:focus-visible {
    outline: 2px solid var(--color-border-primary, #4a90d9);
    outline-offset: 2px;
  }
</style>

<div class="sc-root">
  <div class="sc-header">
    <p class="sc-title">Sector nav chart</p>
    <span class="sc-meta" id="sc-meta">Loading sector data…</span>
  </div>

  <div class="sc-map-wrap">
    <svg id="sc-svg" viewBox="0 0 640 520" xmlns="http://www.w3.org/2000/svg">
      <rect width="640" height="520" fill="#060810"/>
      <!-- Stars background — static noise field -->
      <g id="star-field"></g>
      <!-- Faction territory zones (low-opacity fills) -->
      <g id="faction-zones"></g>
      <!-- Jump routes -->
      <g id="route-layer"></g>
      <!-- System nodes -->
      <g id="system-layer"></g>
      <!-- Player position indicator -->
      <g id="player-layer"></g>
    </svg>
  </div>

  <div class="sc-inspect" id="sc-inspect">
    <div class="insp-top">
      <p class="insp-name" id="insp-name">—</p>
      <span class="insp-type-badge" id="insp-type-badge">—</span>
    </div>
    <div class="insp-intel" id="insp-intel">—</div>
    <div class="insp-hazard" id="insp-hazard">—</div>
    <div class="insp-grid">
      <div class="insp-cell">
        <div class="insp-cell-label">Control</div>
        <div class="insp-cell-val" id="insp-faction">Unknown</div>
      </div>
      <div class="insp-cell">
        <div class="insp-cell-label">Travel time</div>
        <div class="insp-cell-val" id="insp-travel">—</div>
      </div>
      <div class="insp-cell">
        <div class="insp-cell-label">Status</div>
        <div class="insp-cell-val" id="insp-status">—</div>
      </div>
      <div class="insp-cell">
        <div class="insp-cell-label">Hazard</div>
        <div class="insp-cell-val" id="insp-hazard-cell">None detected</div>
      </div>
    </div>
    <div class="insp-routes">
      <div class="insp-routes-label">Jump connections from here</div>
      <div class="route-tags" id="insp-routes"></div>
    </div>
    <p class="sc-fallback" id="sc-fallback" style="display:none; font-size:11px; padding:8px 12px; margin:6px 0 0; background:var(--color-background-warning); border:0.5px solid var(--color-border-warning); border-radius:var(--border-radius-md); color:var(--color-text-warning); word-break:break-word; user-select:all;"></p>
    <div class="insp-actions">
      <button class="jump-btn primary" id="jump-btn">Plot course ↗</button>
      <button class="jump-btn" id="scan-btn">Scan ↗</button>
      <button class="jump-btn" id="close-inspect-btn">Close</button>
    </div>
  </div>

  <div class="sc-footer">
    <div class="sc-legend">
      <div class="leg-item"><div class="leg-dot" style="background:#3a8aff; border:1.5px solid #5aaafe;"></div>Current</div>
      <div class="leg-item"><div class="leg-dot" style="background:#2a3850; border:0.5px solid #3a5070;"></div>Visited</div>
      <div class="leg-item"><div class="leg-dot" style="background:#151a20; border:0.5px dashed #2a3040;"></div>Unvisited</div>
      <div class="leg-item"><div class="leg-dot" style="background:#3a1010; border:0.5px solid #6a2020;"></div>Dark</div>
      <div class="leg-item"><div class="leg-dot" style="background:#0a0e14;"></div>Unknown</div>
    </div>
    <div style="display:flex; align-items:center; gap:12px;">
      <div class="fuel-bar-wrap" id="fuel-bar-wrap" style="display:none;">
        <span class="fuel-label">Fuel</span>
        <div class="fuel-pips" id="fuel-pips"></div>
      </div>
      <button class="close-btn" data-prompt="Close the star chart. Continue the adventure.">Close chart ↗</button>
    </div>
  </div>
</div>

<script>
// ── INJECT DATA ─────────────────────────────────────────────────────────────
const SECTOR   = /* INJECT_SECTOR_JSON  */ { systems:[], routes:[], startSystem:0, objectiveSystem:0 };
const NAV      = /* INJECT_NAV_JSON     */ { currentSystem:'sys_0', visitedSystems:['sys_0'], revealedSystems:['sys_0'], jumpFuelRemaining:4 };
const FACTIONS = /* INJECT_FACTIONS_JSON*/ {};
// ────────────────────────────────────────────────────────────────────────────

const SVG_NS = 'http://www.w3.org/2000/svg';
let selectedSystem = null;

// Faction colour palette (hex, not CSS vars — dark map needs hardcoded colours)
const FACTION_COLOURS = {
  corp:     { zone:'rgba(56,120,220,0.07)', border:'#204080', dot:'#3878dc' },
  crew:     { zone:'rgba(30,160,100,0.07)', border:'#1a5a40', dot:'#1ea064' },
  infected: { zone:'rgba(200,60,60,0.07)',  border:'#6a2020', dot:'#c83c3c' },
  rogue_ai: { zone:'rgba(140,100,220,0.07)',border:'#503888', dot:'#8c64dc' },
};
const DEFAULT_FACTION_COLOUR = { zone:'rgba(100,100,120,0.07)', border:'#303040', dot:'#6a6a80' };

function getFactionColour(factionId) {
  return FACTION_COLOURS[factionId] || DEFAULT_FACTION_COLOUR;
}

// ── Star field background ──────────────────────────────────────────────────
function buildStarField() {
  const g = document.getElementById('star-field');
  const count = 180;
  // Use a deterministic sequence based on sector hash for consistent stars
  let h = 0x12345678;
  for (let i = 0; i < count; i++) {
    h = (Math.imul(h ^ 0x9E3779B9, 0x6D2B79F5) >>> 0);
    const x = (h % 640);
    h = (Math.imul(h ^ 0x9E3779B9, 0x6D2B79F5) >>> 0);
    const y = (h % 520);
    h = (Math.imul(h ^ 0x9E3779B9, 0x6D2B79F5) >>> 0);
    const r = 0.4 + (h % 10) * 0.1;
    h = (Math.imul(h ^ 0x9E3779B9, 0x6D2B79F5) >>> 0);
    const opacity = 0.15 + (h % 40) * 0.01;
    const star = document.createElementNS(SVG_NS, 'circle');
    star.setAttribute('cx', x); star.setAttribute('cy', y);
    star.setAttribute('r', r.toFixed(1));
    star.setAttribute('fill', `rgba(200,210,255,${opacity.toFixed(2)})`);
    g.appendChild(star);
  }
}

// ── Route lines ────────────────────────────────────────────────────────────
function buildRoutes() {
  const g = document.getElementById('route-layer');
  SECTOR.routes.forEach((route, i) => {
    const a = SECTOR.systems[route.a], b = SECTOR.systems[route.b];
    const aVis = NAV.revealedSystems.includes(a.id);
    const bVis = NAV.revealedSystems.includes(b.id);
    if (!aVis && !bVis) return;

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', Math.round(a.x)); line.setAttribute('y1', Math.round(a.y));
    line.setAttribute('x2', Math.round(b.x)); line.setAttribute('y2', Math.round(b.y));

    const bothKnown = aVis && bVis;
    line.setAttribute('stroke', bothKnown ? '#1e2d40' : '#131820');
    line.setAttribute('stroke-width', '1');
    if (!bothKnown) line.setAttribute('stroke-dasharray','4 4');
    line.setAttribute('id', `route_${i}`);
    g.appendChild(line);

    // Travel time label on known routes
    if (bothKnown) {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('x', Math.round(mx));
      label.setAttribute('y', Math.round(my - 5));
      label.setAttribute('text-anchor','middle');
      label.setAttribute('font-family','IBM Plex Mono, monospace');
      label.setAttribute('font-size','9');
      label.setAttribute('fill','#2a3a50');
      label.textContent = distLabel(route.dist);
      g.appendChild(label);
    }
  });
}

// ── System icons ───────────────────────────────────────────────────────────
const SYSTEM_ICON_FNS = {
  circle:  (cx,cy,r) => { const c = document.createElementNS(SVG_NS,'circle'); c.setAttribute('cx',cx); c.setAttribute('cy',cy); c.setAttribute('r',r); return c; },
  hex:     (cx,cy,r) => {
    const pts = Array.from({length:6},(_,i)=>{const a=i*Math.PI/3-Math.PI/6; return `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`;}).join(' ');
    const p = document.createElementNS(SVG_NS,'polygon'); p.setAttribute('points',pts); return p;
  },
  diamond: (cx,cy,r) => {
    const p = document.createElementNS(SVG_NS,'polygon');
    p.setAttribute('points',`${cx},${cy-r*1.2} ${cx+r},${cy} ${cx},${cy+r*1.2} ${cx-r},${cy}`); return p;
  },
  scatter: (cx,cy,r) => {
    const g = document.createElementNS(SVG_NS,'g');
    [[-3,-3],[3,-2],[-2,4],[4,2],[0,-5]].forEach(([dx,dy])=>{
      const c = document.createElementNS(SVG_NS,'circle'); c.setAttribute('cx',cx+dx); c.setAttribute('cy',cy+dy); c.setAttribute('r',r*0.35); g.appendChild(c);
    }); return g;
  },
};

function buildSystems() {
  const g = document.getElementById('system-layer');
  const pLayer = document.getElementById('player-layer');

  SECTOR.systems.forEach(sys => {
    if (!NAV.revealedSystems.includes(sys.id) && !sys.visited) return;

    const isRevealed = NAV.revealedSystems.includes(sys.id);
    const isVisited  = NAV.visitedSystems.includes(sys.id);
    const isCurrent  = sys.id === NAV.currentSystem;
    const isDark     = sys.dark;
    const isObjective = sys.isObjective && isVisited;

    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('class','sys-node');
    group.setAttribute('id','sys_node_'+sys.id);

    // Faction territory tint ring (if known and controlled)
    if (isVisited && sys.factionControl && FACTIONS) {
      const col = getFactionColour(sys.factionControl);
      const ring = document.createElementNS(SVG_NS,'circle');
      ring.setAttribute('cx', Math.round(sys.x)); ring.setAttribute('cy', Math.round(sys.y));
      ring.setAttribute('r','18'); ring.setAttribute('fill',col.zone);
      ring.setAttribute('stroke',col.border); ring.setAttribute('stroke-width','0.5');
      group.appendChild(ring);
    }

    // Pulse ring for current system
    if (isCurrent) {
      const pulse = document.createElementNS(SVG_NS,'circle');
      pulse.setAttribute('cx',Math.round(sys.x)); pulse.setAttribute('cy',Math.round(sys.y));
      pulse.setAttribute('r','10'); pulse.setAttribute('fill','none');
      pulse.setAttribute('stroke','#3a8aff'); pulse.setAttribute('stroke-width','1');
      pulse.setAttribute('class','sys-current-pulse');
      group.appendChild(pulse);
    }

    // Main icon
    const iconFn = SYSTEM_ICON_FNS[sys.icon] || SYSTEM_ICON_FNS.circle;
    const icon = iconFn(Math.round(sys.x), Math.round(sys.y), isCurrent ? 7 : 6);

    // Colour based on state
    let fill, stroke, strokeW = '0.8';
    if (isCurrent)     { fill='#1a4a8a'; stroke='#5aaafe'; strokeW='1.5'; }
    else if (isDark && isRevealed) { fill='#2a0808'; stroke='#6a2020'; }
    else if (isVisited){ fill='#1a2840'; stroke='#3a5878'; }
    else               { fill='#0e131a'; stroke='#1e2830'; }

    if (isObjective && isVisited) { stroke='#c8a030'; strokeW='1.5'; }

    if (icon.tagName === 'g') {
      icon.querySelectorAll ? icon.querySelectorAll('circle').forEach(c=>{ c.setAttribute('fill',fill); c.setAttribute('stroke',stroke); c.setAttribute('stroke-width',strokeW); }) : null;
    } else {
      icon.setAttribute('fill',fill); icon.setAttribute('stroke',stroke); icon.setAttribute('stroke-width',strokeW);
    }
    group.appendChild(icon);

    // System name label
    const label = document.createElementNS(SVG_NS,'text');
    label.setAttribute('x',Math.round(sys.x)); label.setAttribute('y',Math.round(sys.y+20));
    label.setAttribute('text-anchor','middle');
    label.setAttribute('font-family','IBM Plex Mono, monospace'); label.setAttribute('font-size','9');
    label.setAttribute('fill', isRevealed ? (isCurrent ? '#7ab8ff' : '#3a5878') : '#1e2830');
    label.textContent = sys.name;
    group.appendChild(label);

    // Objective marker
    if (isObjective && isVisited) {
      const oLabel = document.createElementNS(SVG_NS,'text');
      oLabel.setAttribute('x',Math.round(sys.x+10)); oLabel.setAttribute('y',Math.round(sys.y-8));
      oLabel.setAttribute('font-family','IBM Plex Mono, monospace'); oLabel.setAttribute('font-size','8');
      oLabel.setAttribute('fill','#c8a030');
      oLabel.textContent = '◈ objective';
      group.appendChild(oLabel);
    }

    // Dark indicator
    if (isDark && isRevealed) {
      const dLabel = document.createElementNS(SVG_NS,'text');
      dLabel.setAttribute('x',Math.round(sys.x+10)); dLabel.setAttribute('y',Math.round(sys.y-8));
      dLabel.setAttribute('font-family','IBM Plex Mono, monospace'); dLabel.setAttribute('font-size','8');
      dLabel.setAttribute('fill','#8a3030');
      dLabel.textContent = '◉ dark';
      group.appendChild(dLabel);
    }

    // Click handler
    group.addEventListener('click', () => inspectSystem(sys));
    g.appendChild(group);
  });

  // Fuel pips
  const fuelWrap = document.getElementById('fuel-bar-wrap');
  const fuelPips = document.getElementById('fuel-pips');
  if (NAV.jumpFuelRemaining !== undefined && NAV.jumpFuelRemaining !== null) {
    fuelWrap.style.display = 'flex';
    const maxFuel = 6;
    for (let i = 0; i < maxFuel; i++) {
      const pip = document.createElement('div');
      pip.className = 'fuel-pip ' + (i < NAV.jumpFuelRemaining ? 'full' : 'empty');
      fuelPips.appendChild(pip);
    }
  }

  const discovered = NAV.visitedSystems.length;
  const total = SECTOR.systems.length;
  document.getElementById('sc-meta').textContent =
    `${discovered}/${total} systems surveyed · ${NAV.revealedSystems.length} on chart`;
}

// ── System inspection ──────────────────────────────────────────────────────
function inspectSystem(sys) {
  if (!NAV.revealedSystems.includes(sys.id)) return;
  selectedSystem = sys;

  const panel = document.getElementById('sc-inspect');
  panel.classList.add('open');

  // Badge type class
  const badge = document.getElementById('insp-type-badge');
  badge.className = 'insp-type-badge type-' + sys.type;
  badge.textContent = sys.type.replace('_',' ');

  document.getElementById('insp-name').textContent = sys.name;
  document.getElementById('insp-intel').textContent = NAV.visitedSystems.includes(sys.id)
    ? (sys.status || 'No recorded intelligence.')
    : 'No close-range intelligence. Jump to survey.';

  // Hazard
  const hazardDiv = document.getElementById('insp-hazard');
  const hazardCell = document.getElementById('insp-hazard-cell');
  if (sys.hazard) {
    hazardDiv.classList.add('show');
    hazardDiv.textContent = 'Hazard: ' + sys.hazard.replace(/_/g,' ');
    hazardCell.textContent = sys.hazard.replace(/_/g,' ');
  } else {
    hazardDiv.classList.remove('show');
    hazardCell.textContent = 'None detected';
  }

  // Faction
  const factionEl = document.getElementById('insp-faction');
  if (sys.factionControl && FACTIONS.factions) {
    const f = FACTIONS.factions.find(f => f.id === sys.factionControl);
    factionEl.textContent = f ? f.name : sys.factionControl;
  } else {
    factionEl.textContent = NAV.visitedSystems.includes(sys.id) ? 'Unclaimed' : 'Unknown';
  }

  // Travel time from current system
  const travelEl = document.getElementById('insp-travel');
  const currentSys = SECTOR.systems.find(s => s.id === NAV.currentSystem);
  if (currentSys && sys.id !== NAV.currentSystem) {
    const route = SECTOR.routes.find(r =>
      (SECTOR.systems[r.a].id === NAV.currentSystem && SECTOR.systems[r.b].id === sys.id) ||
      (SECTOR.systems[r.b].id === NAV.currentSystem && SECTOR.systems[r.a].id === sys.id)
    );
    travelEl.textContent = route ? distLabel(route.dist) : 'No direct route';
  } else if (sys.id === NAV.currentSystem) {
    travelEl.textContent = 'Current location';
  } else {
    travelEl.textContent = '—';
  }

  // Status
  document.getElementById('insp-status').textContent = sys.dark ? 'Silent' :
    (NAV.visitedSystems.includes(sys.id) ? 'Surveyed' : 'Unvisited');

  // Adjacent routes
  const routeContainer = document.getElementById('insp-routes');
  routeContainer.textContent = '';
  const adjRoutes = SECTOR.routes.filter(r =>
    SECTOR.systems[r.a].id === sys.id || SECTOR.systems[r.b].id === sys.id
  );
  adjRoutes.forEach(route => {
    const otherIdx = SECTOR.systems[route.a].id === sys.id ? route.b : route.a;
    const other = SECTOR.systems[otherIdx];
    const known = NAV.revealedSystems.includes(other.id);
    const tag = document.createElement('div');
    tag.className = 'route-tag' + (known ? '' : ' unreachable');
    tag.textContent = known ? `${other.name} · ${distLabel(route.dist)}` : `Unknown · ${distLabel(route.dist)}`;
    if (known) tag.addEventListener('click', () => inspectSystem(other));
    routeContainer.appendChild(tag);
  });

  // Jump button state
  const jumpBtn = document.getElementById('jump-btn');
  const isCurrent = sys.id === NAV.currentSystem;
  const isDirectRoute = SECTOR.routes.some(r =>
    (SECTOR.systems[r.a].id === NAV.currentSystem && SECTOR.systems[r.b].id === sys.id) ||
    (SECTOR.systems[r.b].id === NAV.currentSystem && SECTOR.systems[r.a].id === sys.id)
  );
  jumpBtn.disabled = isCurrent || !isDirectRoute;
  jumpBtn.textContent = isCurrent ? 'You are here' : (isDirectRoute ? 'Plot course ↗' : 'No direct route');
}

function closeInspect() {
  document.getElementById('sc-inspect').classList.remove('open');
  selectedSystem = null;
}

function showFallback(text) {
  const el = document.getElementById('sc-fallback');
  if (!el) return;
  el.textContent = text;
  el.style.display = 'block';
}

function plotCourse() {
  if (!selectedSystem || selectedSystem.id === NAV.currentSystem) return;
  const route = SECTOR.routes.find(r =>
    (SECTOR.systems[r.a].id === NAV.currentSystem && SECTOR.systems[r.b].id === selectedSystem.id) ||
    (SECTOR.systems[r.b].id === NAV.currentSystem && SECTOR.systems[r.a].id === selectedSystem.id)
  );
  if (!route) return;

  const travelStr = distLabel(route.dist);
  const hazardNote = selectedSystem.hazard ? ` Hazard en route: ${selectedSystem.hazard.replace(/_/g,' ')}.` : '';
  const fuelNote = (NAV.jumpFuelRemaining !== null && NAV.jumpFuelRemaining !== undefined)
    ? ` Jump fuel remaining after this: ${Math.max(0, NAV.jumpFuelRemaining - 1)}.`
    : '';

  const prompt =
    `JUMP_COURSE: destination="${selectedSystem.name}" id="${selectedSystem.id}" ` +
    `type="${selectedSystem.type}" travel="${travelStr}"${hazardNote}${fuelNote} ` +
    `Execute the jump sequence and render the arrival scene.`;

  if (typeof sendPrompt === 'function') { sendPrompt(prompt); }
  else { showFallback(prompt); }
}

function distLabel(d) {
  if (d < 60)  return Math.round(d * 1.2) + 'h';
  if (d < 120) return (d / 24).toFixed(1) + 'd';
  return Math.round(d / 24) + 'd';
}

// ── Init ──────────────────────────────────────────────────────────────────
buildStarField();
buildRoutes();
buildSystems();

// ── sendPrompt wiring (data-prompt + addEventListener pattern) ────────────
document.querySelectorAll('[data-prompt]').forEach(btn => {
  btn.addEventListener('click', () => {
    const prompt = btn.dataset.prompt;
    if (typeof sendPrompt === 'function') { sendPrompt(prompt); }
    else { showFallback(prompt); }
  });
});
// Plot Course button — wired via addEventListener (no inline onclick)
document.getElementById('jump-btn').addEventListener('click', () => { plotCourse(); });
// Close inspect panel button — wired via addEventListener (no inline onclick)
document.getElementById('close-inspect-btn').addEventListener('click', () => { closeInspect(); });
// Dynamic scan button — prompt built from selected system at click time
document.getElementById('scan-btn').addEventListener('click', () => {
  if (!selectedSystem) return;
  const prompt = 'Scan ' + selectedSystem.name + ' for more intelligence.';
  if (typeof sendPrompt === 'function') { sendPrompt(prompt); }
  else { showFallback(prompt); }
});
</script>
```

---

## Progressive Reveal Logic

The chart never shows the full sector at once. When the player jumps to a new system, three
things happen:

1. The destination is added to `navState.visitedSystems` and `navState.revealedSystems`.
2. All systems adjacent to the destination (connected by a direct route) are added to
   `navState.revealedSystems` (but NOT `visitedSystems` — they appear on the chart as
   dim, unvisited nodes the player can inspect and jump to).
3. The chart is re-rendered with the updated `navState`.

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
```js
// Extract fields from the JUMP_COURSE string
// destination="Vor Station" id="sys_7" type="station" travel="18h"
// Hazard: patrol_zone. Jump fuel remaining after this: 3.
```

### Step 2 — Fire NAV_EVENT
Before rendering the arrival scene, choose a transition based on destination type:

| Destination type | Transition | Tone |
|---|---|---|
| `inhabited` / `station` | `scanline_wipe` | Arrival at a known port |
| `abandoned` | `fade_black` | Crossing into silence |
| `dark` | `fade_black` | Heavy, oppressive |
| `anomaly` | `fade_white` | Something overwhelming |
| `debris_field` | `screen_shake` (light) + `fade_black` | Turbulence through debris |
| `gas_giant` | `fade_black` | Atmospheric entry |

### Step 3 — Update navState
```js
gmState.navState = arriveAtSystem(destination_id, gmState.navState, gmState.sectorData);
```

### Step 4 — Apply hazard if present
Hazard DCs on arrival:

| Hazard | DC | Attribute | Failure consequence |
|---|---|---|---|
| `radiation_belt` | 13 | CON | 1d6 damage, poisoned condition |
| `interdiction_field` | 14 | INT | Ship systems offline for 1 scene |
| `debris_field` | 12 | DEX | 1d4 damage to hull (ship-systems skill) |
| `patrol_zone` | 15 | CHA | Detained — faction encounter |
| `sensor_dead_zone` | — | — | No roll — all scans return null for this scene |

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

| Type | Lighting | Sound | Temperature |
|---|---|---|---|
| `inhabited` | Port lights, crowded docking | Traffic chatter, distant engines | Controlled |
| `station` | Harsh industrial | Ventilation hum, clank of docking clamps | Cold sterile |
| `abandoned` | Emergency red or none | Complete silence or hull groaning | Freezing |
| `dark` | Nothing | Complete silence | Unknown |
| `gas_giant` | Churning amber | Distant storms, pressure groans | Scalding near vents |
| `debris_field` | Sunlight through tumbling wreckage | Distant impacts, your own breathing | Vacuum cold |
| `anomaly` | Wrong — colours that shouldn't exist | Your own heartbeat | Neither cold nor warm |

---

## Integration with the Lore Codex Module

Seed the codex with one entry per star system at world-generation time:

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
      summary: `A ${sys.type.replace('_',' ')} in the sector. ${sys.status}`,
      detail: [
        sys.factionControl ? `Under the influence of ${sys.factionControl}.` : 'No faction claims this system.',
        sys.hazard ? `Known hazard: ${sys.hazard.replace(/_/g,' ')}.` : 'No charted hazards.',
        sys.dark ? 'All communication has ceased. Reason unknown.' : '',
      ].filter(Boolean).join(' '),
      mechanical: sys.hazard
        ? `Hazard check required on arrival: ${sys.hazard.replace(/_/g,' ')}.`
        : null,
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

```js
// In the save payload (compact mode), store as worldFlags prefixed entries:
const navFlags = {
  nav_current:  navState.currentSystem,
  nav_visited:  navState.visitedSystems.join(','),
  nav_revealed: navState.revealedSystems.join(','),
  nav_fuel:     navState.jumpFuelRemaining,
};
// Merge into gmState.worldFlags before serialising
Object.assign(gmState.worldFlags, navFlags);

// On resume: extract and rebuild navState
function restoreNavState(worldFlags) {
  return {
    currentSystem:    worldFlags.nav_current || 'sys_0',
    visitedSystems:   (worldFlags.nav_visited  || 'sys_0').split(','),
    revealedSystems:  (worldFlags.nav_revealed || 'sys_0').split(','),
    jumpFuelRemaining: worldFlags.nav_fuel !== undefined ? parseInt(worldFlags.nav_fuel) : 4,
    plottedCourse: null,
    darkSystemsIntel: {},
    factionStandingVisible: [],
  };
}
```

---

## Chart Access Button in Scene Widget

Add this alongside the codex and save buttons in the scene widget footer:

```html
<button class="footer-btn" data-prompt="Open the star chart."
  style="font-family:'IBM Plex Mono','SF Mono','Cascadia Code','Consolas',monospace; font-size:10px; letter-spacing:0.08em;
  background:transparent; border:0.5px solid var(--color-border-tertiary);
  border-radius:var(--border-radius-md); padding:8px 14px;
  color:var(--color-text-tertiary); cursor:pointer;">
  Nav chart ↗
</button>
```

When the GM receives `'Open the star chart.'`, inject the current `sectorData` and `navState`
into the widget template and render it.

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
