# Ship Systems — Vessel Integrity Engine

> Module for text-adventure orchestrator. Loaded when the player commands a vessel.

The ship is not a vehicle. It is the most important NPC in a space adventure — a partner that can
fail you at the worst moment, that costs resources to keep alive, and that changes every risk
calculation when it starts to die. A hull breach during a tense negotiation is not a side problem;
it _is_ the problem. Power drained to life support means weapons are offline. Damaged sensors mean
you are flying blind into a system you already know is hostile.

This skill models the ship as a network of seven interdependent systems, each with its own
integrity track, its own failure mode, and its own cascade effects on every other system. Damage
is not abstract — it creates new story pressure with each point lost.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: crew-manifest, star-chart, lore-codex, save-codex modules.

---

## § CLI Commands

| Action             | Command                                  | Tool              |
| ------------------ | ---------------------------------------- | ----------------- |
| Render ship status | `tag render ship --style <style>`        | Run via Bash tool |
| Set ship state     | `tag state set shipState.<path> <value>` | Run via Bash tool |

> **Do not hand-code ship status HTML/CSS/JS.** Always run the CLI command via Bash tool to render the ship status widget. The `tag render ship` command handles all system cards, power pips, condition pills, integrity bars, action buttons, and sendPrompt wiring automatically.

---

## Architecture Overview

```
Ship initialised from class template at world-generation time
        ↓
shipState stored in gmState.shipState
        ↓
Events mutate shipState: damage, repair, power shifts, conditions
        ↓
SHIP_EVENT protocol propagates changes to GM layer
        ↓
GM applies cascade effects, DC modifiers, and narrative consequences
        ↓
Ship status widget rendered via CLI on demand or auto-surfaced at crisis threshold
        ↓
Player allocates power / initiates repairs / makes triage decisions
        ↓
sendPrompt() carries decision forward into next scene
```

---

## The Seven Systems

Every ship has exactly these seven systems. Their names and flavour may be reskinned per vessel
class, but the mechanical roles are fixed.

```
HULL        — physical integrity of the vessel
ENGINES     — propulsion, jump capability, emergency thrust
POWER CORE  — energy generation; feeds all other systems
LIFE SUPPORT — atmosphere, temperature, gravity
WEAPONS     — offensive and defensive armament
SENSORS     — scanners, comms, navigation data
SHIELDS     — energy barriers; absorbs damage before hull
```

Each system has:

- `integrity` — current value (0–100)
- `power` — power units currently allocated (0–4)
- `status` — operational | degraded | critical | offline
- `conditions` — array of active conditions (e.g. `['venting', 'overclocked']`)
- `repairCost` — parts units required for full repair

### Status thresholds

| Integrity | Status      | Narrative implication                                  |
| --------- | ----------- | ------------------------------------------------------ |
| 76–100    | Operational | Fully functional. No modifier.                         |
| 51–75     | Degraded    | Functional but strained. −1 to related rolls.          |
| 26–50     | Critical    | Barely holding. −2 to related rolls. Risk of cascade.  |
| 1–25      | Failing     | On the verge. −3 to related rolls. Cascade each scene. |
| 0         | Offline     | Completely non-functional. See failure modes.          |

---

## Ship Class Templates

Ships are generated at world-creation time from a class template. The class defines starting
integrity values, power capacity, weapons loadout, and the vessel's personality — the flavour
text that makes this specific ship feel like somewhere the player has lived.

**Crew role alignment** — each ship class has mandatory crew roles defined in the crew-manifest
module. The seven crew roles bond to ship systems as follows: pilot and navigator bond to
`engines`, engineer bonds to `power_core`, medic bonds to `life_support`, gunner bonds to
`weapons`, comms bonds to `sensors`, and cargo_master bonds to `cargo_hold` (a logical system
outside the seven power-draw systems). See crew-manifest module for the full role/system mapping
and mandatory roles per ship class.

<!-- CLI implementation detail — do not hand-code -->

```js
const SHIP_CLASSES = {
  freighter: {
    name: 'Heavy freighter',
    flavour: 'Built to carry, not to fight. Every panel shows the repair history.',
    maxPower: 12,
    systems: {
      hull: { integrity: 85, power: 0, maxPower: 0, repairCost: 4, label: 'Hull plating' },
      engines: { integrity: 80, power: 3, maxPower: 4, repairCost: 3, label: 'Drive assembly' },
      power_core: { integrity: 90, power: 0, maxPower: 0, repairCost: 5, label: 'Reactor core' },
      life_support: { integrity: 90, power: 2, maxPower: 3, repairCost: 2, label: 'Life support' },
      weapons: { integrity: 50, power: 1, maxPower: 2, repairCost: 3, label: 'Point defence' },
      sensors: { integrity: 70, power: 2, maxPower: 3, repairCost: 2, label: 'Sensor array' },
      shields: { integrity: 40, power: 4, maxPower: 4, repairCost: 4, label: 'Deflector grid' },
    },
    cargoCapacity: 8,
    jumpRange: 3,
    hullPoints: 120,
  },

  corvette: {
    name: 'Light corvette',
    flavour: 'Fast and mean. Not built for comfort. Built to survive.',
    maxPower: 14,
    systems: {
      hull: { integrity: 75, power: 0, maxPower: 0, repairCost: 3, label: 'Hull plating' },
      engines: { integrity: 90, power: 4, maxPower: 5, repairCost: 3, label: 'Thrust array' },
      power_core: { integrity: 90, power: 0, maxPower: 0, repairCost: 4, label: 'Dual reactor' },
      life_support: { integrity: 85, power: 1, maxPower: 2, repairCost: 2, label: 'Life support' },
      weapons: { integrity: 90, power: 5, maxPower: 6, repairCost: 3, label: 'Weapons battery' },
      sensors: { integrity: 80, power: 2, maxPower: 3, repairCost: 2, label: 'Combat sensors' },
      shields: { integrity: 70, power: 2, maxPower: 4, repairCost: 3, label: 'Shield emitters' },
    },
    cargoCapacity: 2,
    jumpRange: 4,
    hullPoints: 80,
  },

  salvage_tug: {
    name: 'Salvage tug',
    flavour: "It shouldn't still be running. It knows it shouldn't still be running.",
    maxPower: 10,
    systems: {
      hull: { integrity: 60, power: 0, maxPower: 0, repairCost: 3, label: 'Reinforced hull' },
      engines: { integrity: 65, power: 3, maxPower: 3, repairCost: 4, label: 'Tug drives' },
      power_core: { integrity: 75, power: 0, maxPower: 0, repairCost: 5, label: 'Reactor' },
      life_support: { integrity: 70, power: 2, maxPower: 2, repairCost: 2, label: 'Life support' },
      weapons: { integrity: 20, power: 1, maxPower: 1, repairCost: 4, label: 'Emergency rail' },
      sensors: { integrity: 60, power: 2, maxPower: 2, repairCost: 3, label: 'Salvage sensors' },
      shields: { integrity: 20, power: 2, maxPower: 3, repairCost: 5, label: 'Deflectors' },
    },
    cargoCapacity: 12,
    jumpRange: 2,
    hullPoints: 100,
  },

  research_vessel: {
    name: 'Research vessel',
    flavour: "Every surface covered in readings. The crew would die before they'd lose their data.",
    maxPower: 13,
    systems: {
      hull: { integrity: 80, power: 0, maxPower: 0, repairCost: 3, label: 'Hull plating' },
      engines: { integrity: 75, power: 2, maxPower: 3, repairCost: 3, label: 'Drive systems' },
      power_core: { integrity: 95, power: 0, maxPower: 0, repairCost: 4, label: 'Reactor core' },
      life_support: { integrity: 95, power: 3, maxPower: 3, repairCost: 2, label: 'Life support' },
      weapons: { integrity: 30, power: 0, maxPower: 1, repairCost: 3, label: 'Deterrent array' },
      sensors: { integrity: 95, power: 5, maxPower: 6, repairCost: 2, label: 'Science array' },
      shields: { integrity: 55, power: 3, maxPower: 4, repairCost: 3, label: 'Deflector grid' },
    },
    cargoCapacity: 4,
    jumpRange: 3,
    hullPoints: 90,
  },
};
```

### Initialise ship from class

<!-- CLI implementation detail — do not hand-code -->

```js
function initShip(classKey, shipName) {
  const template = SHIP_CLASSES[classKey] || SHIP_CLASSES.freighter;
  const systems = {};
  Object.entries(template.systems).forEach(([id, s]) => {
    systems[id] = {
      id,
      label: s.label,
      integrity: s.integrity,
      maxIntegrity: 100,
      power: s.power,
      maxPower: s.maxPower,
      status: integrityToStatus(s.integrity),
      conditions: [],
      repairCost: s.repairCost,
      repairProgress: 0,
    };
  });

  return {
    name: shipName || template.name,
    class: classKey,
    flavour: template.flavour,
    maxPower: template.maxPower,
    powerUsed: Object.values(systems).reduce((t, s) => t + s.power, 0),
    hullPoints: template.hullPoints,
    maxHullPoints: template.hullPoints,
    cargoCapacity: template.cargoCapacity,
    cargo: [],
    jumpRange: template.jumpRange,
    systems,
    conditions: [], // ship-level conditions: 'venting', 'overclocked', 'boarded', 'adrift'
    repairParts: 3, // starting repair parts in inventory
    scenesSinceRepair: 0,
  };
}

function integrityToStatus(integrity) {
  if (integrity > 75) return 'operational';
  if (integrity > 50) return 'degraded';
  if (integrity > 25) return 'critical';
  if (integrity > 0) return 'failing';
  return 'offline';
}
```

---

## DC Modifier Table

Every system in a degraded or worse state imposes DC modifiers on relevant skill checks.
The GM applies these automatically — never mention the modifier label to the player, only the
narrative consequence.

| System       | Affected actions                      | Degraded  | Critical  | Failing   | Offline                             |
| ------------ | ------------------------------------- | --------- | --------- | --------- | ----------------------------------- |
| Hull         | Boarding defence, enduring impacts    | −1        | −2        | −3        | Auto-fail: hull breach              |
| Engines      | Jump rolls, evasion, docking approach | −1        | −2        | −3        | Cannot jump or manoeuvre            |
| Power Core   | All powered systems (extra −1 on top) | −1        | −2        | −3        | Cascade: all systems lose 2 power   |
| Life Support | CON checks in affected areas, focus   | −1        | −2        | −3        | Atmosphere loss — suit up or die    |
| Weapons      | Attack rolls, deterrence checks       | −1        | −2        | −3        | No weapons available                |
| Sensors      | Navigation, detection, social (comms) | −1        | −2        | −3        | Flying blind — all navigation DC +4 |
| Shields      | Damage absorption (see Combat rules)  | −1 absorb | −2 absorb | −3 absorb | No shield absorption                |

**Stacking rule:** modifiers from multiple damaged systems stack. A ship with critical engines
and degraded sensors imposes −2 on jumps and an additional −1. The player should feel the
compounding pressure of a vessel coming apart.

---

## Power Allocation System

The ship's power core generates a fixed pool of power units. Every powered system draws from
this pool. The player can reallocate power between scenes — but never during active events
unless a system goes offline (freeing its allocation automatically).

<!-- CLI implementation detail — do not hand-code -->

```js
function getPowerPool(shipState) {
  return {
    total: shipState.maxPower,
    used: Object.values(shipState.systems).reduce((t, s) => t + s.power, 0),
    free: shipState.maxPower - Object.values(shipState.systems).reduce((t, s) => t + s.power, 0),
  };
}

function reallocatePower(shipState, fromSystemId, toSystemId, units) {
  const from = shipState.systems[fromSystemId];
  const to = shipState.systems[toSystemId];
  if (!from || !to) return { success: false, reason: 'System not found.' };
  if (from.power < units) return { success: false, reason: `${from.label} only has ${from.power} power to spare.` };
  if (to.power + units > to.maxPower)
    return { success: false, reason: `${to.label} cannot accept more than ${to.maxPower} power.` };
  if (to.status === 'offline')
    return { success: false, reason: `${to.label} is offline — power cannot be routed to a dead system.` };
  from.power -= units;
  to.power += units;
  shipState.powerUsed = Object.values(shipState.systems).reduce((t, s) => t + s.power, 0);
  applyPowerEffects(shipState, toSystemId);
  return { success: true };
}

// Power level → bonus/penalty on that system's rolls
function powerBonus(systemId, power) {
  const maxPower = POWER_BONUSES[systemId] || 3;
  if (power === 0) return -3;
  if (power === 1) return -1;
  if (power === maxPower) return +1;
  if (power > maxPower) return +2;
  return 0;
}

const POWER_BONUSES = { engines: 4, weapons: 6, sensors: 3, shields: 4, life_support: 3 };

function applyPowerEffects(shipState, changedSystemId) {
  const sys = shipState.systems[changedSystemId];
  // Life support at 0 power: condition 'atmosphere_degrading'
  if (changedSystemId === 'life_support' && sys.power === 0) {
    if (!sys.conditions.includes('atmosphere_degrading')) {
      sys.conditions.push('atmosphere_degrading');
    }
  } else if (changedSystemId === 'life_support') {
    sys.conditions = sys.conditions.filter(c => c !== 'atmosphere_degrading');
  }
  // Engines at max power: condition 'overclocked' (+1 bonus but take 1d4 damage per jump)
  if (changedSystemId === 'engines' && sys.power >= sys.maxPower) {
    if (!sys.conditions.includes('overclocked')) sys.conditions.push('overclocked');
  } else if (changedSystemId === 'engines') {
    sys.conditions = sys.conditions.filter(c => c !== 'overclocked');
  }
}
```

### Power allocation widget embed

The power allocation panel is embedded within the ship status widget (not standalone).
It shows each system's current draw and `+/-` buttons for reallocation, with the power
pool bar updating live.

---

## Damage System

Damage is applied per system. Sources: combat hits, hazard rolls (from the star-chart module),
environmental events, cascade failures.

<!-- CLI implementation detail — do not hand-code -->

```js
function damageSystem(shipState, systemId, amount, source) {
  const sys = shipState.systems[systemId];
  if (!sys) return [];

  const prevStatus = sys.status;
  sys.integrity = Math.max(0, sys.integrity - amount);
  sys.status = integrityToStatus(sys.integrity);

  const events = [];

  // Status threshold crossed — narrative event
  if (prevStatus !== sys.status) {
    events.push({
      type: 'status_change',
      system: sys.label,
      from: prevStatus,
      to: sys.status,
      narrative: STATUS_CHANGE_NARRATIVES[systemId]?.[sys.status] || `${sys.label} status: ${sys.status}.`,
    });
  }

  // System went offline — free its power and cascade
  if (sys.status === 'offline' && prevStatus !== 'offline') {
    const freedPower = sys.power;
    sys.power = 0;
    shipState.powerUsed -= freedPower;
    events.push({ type: 'power_freed', system: sys.label, amount: freedPower });
    const cascades = triggerCascade(shipState, systemId);
    events.push(...cascades);
  }

  // Critical hull — venting condition
  if (systemId === 'hull' && sys.integrity <= 25 && !shipState.conditions.includes('venting')) {
    shipState.conditions.push('venting');
    events.push({
      type: 'ship_condition',
      condition: 'venting',
      narrative: 'Hull breach detected. Atmosphere venting in affected sections.',
    });
  }

  // Hull at 0 — ship destroyed
  if (systemId === 'hull' && sys.integrity === 0) {
    shipState.conditions.push('destroyed');
    events.push({ type: 'ship_destroyed' });
  }

  return events;
}

const STATUS_CHANGE_NARRATIVES = {
  hull: {
    degraded: 'The hull takes another hit. Structural warnings are amber across the board.',
    critical: 'Hull integrity critical. Stress fractures visible on three sections. Any more and she vents.',
    failing: "The hull is tearing. You can hear it — a low groan that shouldn't be audible in vacuum.",
    offline: 'Hull failure. Atmosphere venting.',
  },
  engines: {
    degraded: 'The drives are struggling. Response lag is noticeable now.',
    critical: 'Engines critical. Jump capability compromised. Best speed: 40%.',
    failing: 'Drive assembly failing. Manoeuvrability minimal. No jump.',
    offline: 'Engines offline. The ship is adrift.',
  },
  life_support: {
    degraded: 'Life support strained. CO₂ scrubbers running at 70%.',
    critical: 'Life support critical. Suit up in the next two hours or start feeling it.',
    failing: 'Life support failing. Atmosphere thinning. Suit up now.',
    offline: 'Life support offline. You have minutes before hypoxia.',
  },
  weapons: {
    degraded: 'Weapons systems degraded. Targeting is sluggish.',
    critical: 'Weapons critical. Half the battery is unresponsive.',
    failing: 'Weapons nearly gone. One shot remaining, maybe two.',
    offline: 'Weapons offline. You are defenceless.',
  },
  sensors: {
    degraded: 'Sensor resolution dropping. Long-range data is unreliable.',
    critical: 'Sensor array critical. Short-range only. Flying half-blind.',
    failing: 'Sensors failing. Proximity warnings only.',
    offline: "Sensors offline. You can't see anything coming.",
  },
  shields: {
    degraded: 'Shield emitters degraded. Coverage down to 70%.',
    critical: 'Shields critical. Point impacts are getting through.',
    failing: 'Shields nearly gone. One good hit and they drop.',
    offline: "Shields offline. Nothing between you and what's out there.",
  },
  power_core: {
    degraded: 'Power core fluctuating. Minor brownouts across secondary systems.',
    critical: 'Power core critical. All systems drawing from emergency reserve.',
    failing: 'Power core failing. You have minutes before total blackout.',
    offline: 'Power core offline. Everything runs on backup. You have one jump. Maybe.',
  },
};
```

---

## Cascade Failure Rules

When a system goes offline, dependent systems lose power and take damage. The cascade
chain is the most dramatic mechanical moment in a ship-systems session.

<!-- CLI implementation detail — do not hand-code -->

```js
// Dependency graph: which systems are affected when a given system fails
const CASCADE_DEPENDENCIES = {
  power_core: ['engines', 'weapons', 'sensors', 'shields'], // power failure hits everything
  life_support: [], // self-contained failure
  engines: [], // mechanical, not power-dependent
  hull: ['life_support'], // breach affects atmosphere
  weapons: [],
  sensors: [],
  shields: [],
};

// Cascade damage amounts (integrity lost by dependent systems)
const CASCADE_DAMAGE = {
  power_core: 20, // catastrophic — power outage hits all systems hard
  hull: 15, // hull breach pressurises life support
};

function triggerCascade(shipState, offlineSystemId) {
  const dependents = CASCADE_DEPENDENCIES[offlineSystemId] || [];
  const events = [];
  dependents.forEach(depId => {
    const dep = shipState.systems[depId];
    if (!dep || dep.status === 'offline') return;
    const dmg = CASCADE_DAMAGE[offlineSystemId] || 10;
    const cascadeEvents = damageSystem(shipState, depId, dmg, `cascade from ${offlineSystemId}`);
    events.push({
      type: 'cascade',
      from: offlineSystemId,
      to: depId,
      damage: dmg,
      narrative: `${shipState.systems[offlineSystemId]?.label} failure cascades to ${dep.label}.`,
    });
    events.push(...cascadeEvents);
  });
  return events;
}
```

---

## Repair System

Repairs cost parts and time (scenes). They can be attempted in the field (partial repair)
or at a station (full repair). The player makes a repair roll; outcome determines recovery.

<!-- CLI implementation detail — do not hand-code -->

```js
const REPAIR_DCS = {
  operational: null, // no repair needed
  degraded: 10,
  critical: 14,
  failing: 17,
  offline: 20,
};

const REPAIR_PARTS_COST = {
  degraded: 0, // minor repair — no parts, just time
  critical: 1,
  failing: 2,
  offline: 3,
};

function repairRoll(shipState, systemId, rollResult, repairType) {
  const sys = shipState.systems[systemId];
  if (!sys || sys.status === 'operational') return { success: false, reason: 'No repair needed.' };

  const dc = REPAIR_DCS[sys.status];
  const partsCost = repairType === 'field' ? REPAIR_PARTS_COST[sys.status] : 0;

  if (repairType === 'field' && shipState.repairParts < partsCost) {
    return { success: false, reason: `Insufficient parts. Need ${partsCost}, have ${shipState.repairParts}.` };
  }

  const success = rollResult >= dc;
  const partial = !success && rollResult >= dc - 4;
  const critSuccess = rollResult >= dc + 5;

  if (critSuccess) {
    sys.integrity = Math.min(100, sys.integrity + 40);
    if (repairType === 'field') shipState.repairParts -= partsCost;
  } else if (success) {
    sys.integrity = Math.min(100, sys.integrity + 25);
    if (repairType === 'field') shipState.repairParts -= partsCost;
  } else if (partial) {
    sys.integrity = Math.min(100, sys.integrity + 10);
    // Partial repairs cost no parts — just stabilisation
  }

  // Station repair: full restoration (no roll required, costs credits)
  if (repairType === 'station') {
    sys.integrity = 100;
    sys.conditions = [];
  }

  sys.status = integrityToStatus(sys.integrity);
  if (sys.status !== 'offline' && sys.power === 0 && sys.maxPower > 0) {
    // Restored system needs manual power reallocation — cannot auto-allocate
    sys.conditions.push('needs_power');
  }

  return {
    success: success || critSuccess,
    partial,
    critSuccess,
    integrityGained: critSuccess ? 40 : success ? 25 : partial ? 10 : 0,
    newStatus: sys.status,
  };
}
```

### Repair types

| Type            | Where                    | Cost      | Roll                 | Integrity restored                    |
| --------------- | ------------------------ | --------- | -------------------- | ------------------------------------- |
| Field stabilise | Anywhere                 | 0 parts   | INT (DC by status)   | Partial: +10, success: +25, crit: +40 |
| Field overhaul  | Docked/stationary        | 1–3 parts | INT+2 (DC by status) | Success: +25, crit: +50               |
| Station repair  | Inhabited/station system | Credits   | No roll              | Full restoration to 100               |
| Emergency patch | Combat/crisis            | 1 part    | DEX (DC+3)           | Success: +15 (one status tier up)     |

---

## Combat Damage Integration

When the ship takes weapons fire, damage is distributed across systems based on hit location.
Roll 1d6 for hit location:

| d6  | Location       | System hit                                           |
| --- | -------------- | ---------------------------------------------------- |
| 1   | Forward hull   | `hull` (full damage)                                 |
| 2   | Engines        | `engines` (full damage)                              |
| 3   | Port/starboard | `shields` first; overflow to `hull`                  |
| 4   | Weapons bay    | `weapons` (full damage)                              |
| 5   | Sensor array   | `sensors` (full damage)                              |
| 6   | Core section   | `power_core` (half damage) + `shields` (half damage) |

Shields absorb damage before it reaches other systems:

<!-- CLI implementation detail — do not hand-code -->

```js
function applyWeaponsDamage(shipState, rawDamage, hitLocation) {
  const shields = shipState.systems.shields;
  let remainingDamage = rawDamage;

  // Shields absorb first if operational
  if (shields.integrity > 0 && hitLocation !== 'sensors' && hitLocation !== 'weapons') {
    const absorbRate =
      shields.status === 'operational'
        ? 0.6
        : shields.status === 'degraded'
          ? 0.4
          : shields.status === 'critical'
            ? 0.2
            : shields.status === 'failing'
              ? 0.1
              : 0;
    const absorbed = Math.floor(rawDamage * absorbRate);
    remainingDamage -= absorbed;
    // Shields themselves take a fraction of absorbed damage
    damageSystem(shipState, 'shields', Math.floor(absorbed * 0.3), 'combat');
  }

  return damageSystem(shipState, hitLocation, remainingDamage, 'combat');
}
```

---

## The Ship Status Widget

To render the ship status widget, run the CLI command via Bash tool:

```
tag render ship --style <style>
```

The CLI handles all system cards, power pips, condition pills, integrity bars, repair/power
action buttons, and sendPrompt wiring. Do not hand-code the widget HTML/CSS/JS.

<!-- Widget HTML/CSS/JS removed — CLI renders this widget. See § CLI Commands above. -->

### Power allocation widget embed

The power allocation panel is embedded within the ship status widget (not standalone).
It shows each system's current draw and `+/-` buttons for reallocation, with the power
pool bar updating live.

---

## SHIP_EVENT Protocol

Events use the same pipe-delimited pattern as `LORE_EVENT`.

```
SHIP_EVENT: damage   | [systemId] | [amount] | [source]
SHIP_EVENT: repair   | [systemId] | [rollResult] | [repairType: field|station]
SHIP_EVENT: power    | [fromSystemId] | [toSystemId] | [units]
SHIP_EVENT: condition| [add|remove] | [conditionName]
SHIP_EVENT: parts    | [add|remove] | [amount]
SHIP_EVENT: status   | (opens the ship status widget)
```

---

## gmState Integration

`shipState` lives at `gmState.shipState`. It is saved and restored by the save-codex module.

<!-- CLI implementation detail — do not hand-code -->

```js
// In save-codex compact mode: ship state stored as worldFlags delta
const shipFlags = {
  ship_class: shipState.class,
  ship_name: shipState.name,
  ship_hull: shipState.systems.hull.integrity,
  ship_eng: shipState.systems.engines.integrity,
  ship_pwr: shipState.systems.power_core.integrity,
  ship_ls: shipState.systems.life_support.integrity,
  ship_wpn: shipState.systems.weapons.integrity,
  ship_sen: shipState.systems.sensors.integrity,
  ship_shd: shipState.systems.shields.integrity,
  ship_parts: shipState.repairParts,
  ship_fuel: shipState.jumpFuelRemaining,
  ship_cond: (shipState.conditions || []).join(','),
  // Power allocations
  ship_pow_eng: shipState.systems.engines.power,
  ship_pow_ls: shipState.systems.life_support.power,
  ship_pow_wpn: shipState.systems.weapons.power,
  ship_pow_sen: shipState.systems.sensors.power,
  ship_pow_shd: shipState.systems.shields.power,
};
Object.assign(gmState.worldFlags, shipFlags);
```

Auto-surface the widget (without player prompt) when any system crosses into critical:

<!-- CLI implementation detail — do not hand-code -->

```js
if (Object.values(shipState.systems).some(s => s.status === 'critical' || s.status === 'failing')) {
  // Include a note in the next scene widget: "Ship status requires attention."
  // Render the status widget as the first widget of the scene, before narrative prose.
}
```

---

## Scene Footer Integration

Use the canonical scene footer from `styles/style-reference.md`. This module adds the **Ship**
panel button to the footer when loaded. The ship status widget is an overlay with
its own Close button — it does not define its own footer.

---

## Anti-Patterns (never do these)

- Never treat ship damage as flavour text — every system that drops a status tier changes
  the game mechanically. Apply the DC modifier immediately and let the player feel it.
- Never repair a system to full without cost — field repairs are partial, station repairs
  cost credits. Full restoration for free removes all tension from the damage economy.
- Never auto-allocate power after a system comes back online — restored systems `need_power`
  condition requires the player to consciously reroute, making it a decision rather than
  a stat reset.
- Never cascade more than two levels deep in a single event — a power core failure hitting
  all four dependent systems simultaneously is overwhelming. Stagger cascades one step per
  scene beat to give the player space to react.
- Never store the full system descriptions or narrative strings in the save payload — only
  store the seven integrity values, power allocations, conditions, and parts count.
- Never show the DC modifier number to the player in narrative prose — say "the engines are
  struggling" not "you have a −2 penalty". The fiction carries the mechanics.
- Never let life support hit offline without a countdown — the atmosphere loss should be a
  ticking clock the player can race, not an instant kill. Always give two to three scenes of
  warning before it becomes fatal.
- Never use the ship status widget as the first thing the player sees in a session — it is
  a reference tool and a crisis surface, not an opening screen. Start with narrative; the
  ship's condition emerges through events.
