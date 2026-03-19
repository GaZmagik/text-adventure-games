# Crew Manifest — Living Crew Engine
> Module for text-adventure orchestrator. Loaded when the player commands a vessel with crew.

The crew are not passengers. They are not quest dispensers. They are people who have chosen —
or been forced — to share a pressurised metal tube with the player across the void between stars,
and every decision the player makes happens in front of them. They remember. They react. They talk
to each other when the player isn't in the room, and what they say shapes the ship's atmosphere
long before it shapes its mechanics.

This skill models a crew of three to six individuals, each with a role that contributes to ship
function, a personal tension that creates story pressure, and a secret that may never surface —
or may change everything when it does. Morale is a shared resource, like hull integrity or fuel:
it depletes under stress, recovers slowly, and when it bottoms out, people leave or break.

The crew manifest integrates with the ai-npc module for individual conversations, but adds a
layer that single NPCs don't have: *collective weight*. When one crew member dies, the others
grieve differently. When morale is low, the ship feels it before anyone says a word.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: ship-systems, star-chart, lore-codex, ai-npc, save-codex modules.

---

## Architecture Overview

```
World generation → generateCrew(seed, shipClass, factions)
        ↓
crewState: roster[] + moralePool + shipAtmosphere
        ↓
Crew react to events: CREW_EVENTs mutate morale, dispositions, assignments
        ↓
Player interacts with individual crew → ai-npc module dialogue widget
        ↓
Crew manifest widget: roster overview, morale, assignments, tensions visible
        ↓
Crisis events: defection check, breakdown, heroism, sacrifice
        ↓
Deaths, departures, new crew persist in rosterMutations (save-codex pattern)
```

---

## Crew Roles

Every crew member holds exactly one role. Roles determine what tasks they can perform, which
ship systems they are bonded to, and what DCs they add their expertise bonus to.

Not all ships require all seven roles. Smaller vessels have fewer mandatory positions — a
salvage tug has no need for a dedicated gunner, and a corvette can manage without a navigator.
When a crew member is forced to cover a role outside their specialism (e.g. the engineer
handling comms), all related rolls take a **+2 DC penalty** (skill penalty for operating
outside their expertise). This creates meaningful crew composition choices without locking
ship classes out of capabilities entirely.

**Bonded system summary** — each role is tied to a specific ship system (see ship-systems
module) that determines where their expertise applies:

| Role | Bonded system | Notes |
|---|---|---|
| pilot | engines | Helm and drive assembly |
| engineer | power_core | Reactor maintenance and repair |
| medic | life_support | Atmosphere, medical bay |
| gunner | weapons | Turrets and defensive armament |
| comms | sensors | Comms array shares the sensor bus |
| navigator | engines | Nav computer feeds jump calculations to drives |
| cargo_master | cargo_hold | Logical system — not one of the seven power-draw systems |

```js
const CREW_ROLES = {
  pilot: {
    label:       'Pilot',
    bonusStat:   'DEX',
    expertiseDC: -2,    // negative = reduces DC (makes task easier)
    bonusTasks:  ['navigate','jump','dock','evasive_manoeuvre'],
    bondedSystem: 'engines',
    shortfall:   'Without a pilot: all navigation DCs +3. Jump DC 20.',
  },
  engineer: {
    label:       'Engineer',
    bonusStat:   'INT',
    expertiseDC: -2,
    bonusTasks:  ['repair','power_reroute','jury_rig','salvage'],
    bondedSystem: 'power_core',
    shortfall:   'Without an engineer: all repair rolls at disadvantage. Parts cost +1.',
  },
  medic: {
    label:       'Medic',
    bonusStat:   'WIS',
    expertiseDC: -2,
    bonusTasks:  ['treat_wounds','stabilise','diagnose_condition','surgery'],
    bondedSystem: 'life_support',
    shortfall:   'Without a medic: healing items restore half HP. Conditions last twice as long.',
  },
  gunner: {
    label:       'Gunner',
    bonusStat:   'STR',
    expertiseDC: -2,
    bonusTasks:  ['combat_targeting','turret','boarding_defence','weapons_repair'],
    bondedSystem: 'weapons',
    shortfall:   'Without a gunner: all combat attack rolls −2. Turret unavailable.',
  },
  comms: {
    label:       'Comms officer',
    bonusStat:   'CHA',
    expertiseDC: -2,
    bonusTasks:  ['hail','negotiate','decrypt','intercept_signal','faction_contact'],
    bondedSystem: 'sensors',   // comms array piggybacks the sensor bus
    shortfall:   'Without comms: all faction interaction DCs +2. Signal-decoder puzzles unassisted.',
  },
  navigator: {
    label:       'Navigator',
    bonusStat:   'INT',
    expertiseDC: -2,
    bonusTasks:  ['plot_course','chart_hazard','survey_system','calculate_jump'],
    bondedSystem: 'engines',   // nav computer feeds jump calculations to the drive assembly
    shortfall:   'Without a navigator: star-chart hazard DCs +2. Dark system entry DC 18.',
  },
  cargo_master: {
    label:       'Cargo master',
    bonusStat:   'WIS',
    expertiseDC: -2,
    bonusTasks:  ['trade','contraband_concealment','load_assessment','salvage_sort'],
    bondedSystem: 'cargo_hold', // logical system — not one of the seven power-draw systems
    shortfall:   'Without cargo master: trade prices −15%. Contraband always detected on inspection.',
  },
};
```

---

## The Crew Member Schema

```js
const crewMember = {
  id:          'petrov_vas',
  name:        'Petrov Vas',
  role:        'engineer',
  portrait:    { initials: 'PV', ramp: 'teal' },

  // Mechanical stats
  morale:      70,       // 0–100: individual morale
  loyalty:     60,       // 0–100: loyalty to player specifically (separate from general morale)
  stress:      20,       // 0–100: accumulated stress; high stress triggers events
  alive:       true,
  status:      'active', // active | injured | incapacitated | missing | defected | dead

  // Assignment
  assignedTask: null,    // null = off-duty / available; string = current assignment
  assignedTo:  null,     // ship system they're actively working on

  // Personality (lightweight vs full ai-npc)
  voice: {
    pattern:    'Quiet, methodical. Speaks in observations, rarely opinions. Deflects with humour when scared.',
    never_says: ['I quit', 'It\'s impossible'],
  },
  tension:      'He hasn\'t spoken about what happened at the relay station. The rest of the crew has noticed.',
  wants:        'to fix the ship — the one thing he can actually control',
  quirk:        'Always has grease on his hands even when he hasn\'t been working',

  // Secret (may or may not surface)
  hasSecret:    true,
  secret:       'He was on the crew of the ship that caused the relay incident. He survived because he wasn\'t on shift.',
  secretThreshold: 75,   // loyalty level at which secret becomes accessible via ai-npc dialogue

  // Relationship web
  relationships: {
    chen_ora:  'wary',   // wary | neutral | friendly | hostile | bonded
    sable_rin: 'neutral',
  },

  // History hooks (feed lore-codex)
  loreHooks: [
    'crewmember_petrov_relay_incident',
    'faction_meridian_corp',
  ],

  // World flags this crew member sets
  world_flags: {
    on_defect:    'crew_petrov_defected',
    on_death:     'crew_petrov_dead',
    on_secret_revealed: 'petrov_relay_confession',
  },
};
```

---

## Morale System

Morale operates at two levels: **individual morale** (per crew member, 0–100) and the
**ship morale pool** (the collective average, displayed on the manifest widget).

```js
function getShipMorale(crewState) {
  const active = crewState.roster.filter(c => c.alive && c.status === 'active');
  if (!active.length) return 0;
  return Math.round(active.reduce((sum, c) => sum + c.morale, 0) / active.length);
}

function getMoraleLabel(morale) {
  if (morale >= 80) return { label: 'High',     ramp: 'teal'   };
  if (morale >= 60) return { label: 'Steady',   ramp: 'blue'   };
  if (morale >= 40) return { label: 'Strained', ramp: 'amber'  };
  if (morale >= 20) return { label: 'Low',      ramp: 'coral'  };
  return              { label: 'Breaking',  ramp: 'red'    };
}
```

### Morale events — what moves it

```js
const MORALE_DELTAS = {
  // Positive
  player_kept_promise:          +8,
  successful_mission:           +6,
  crew_member_rescued:          +10,
  player_shared_information:    +5,
  player_acknowledged_sacrifice: +7,
  found_supplies:               +4,
  reached_safe_port:            +5,
  player_took_personal_risk:    +6,

  // Negative
  crew_member_died:             -15,  // applied to all surviving crew
  player_broke_promise:         -10,
  mission_failed:               -8,
  player_withheld_critical_info:-6,
  ship_systems_critical:        -4,   // per critical system, per scene
  life_support_failing:         -12,
  adrift_without_plan:          -7,
  player_abandoned_crew_member: -20,
  rations_depleted:             -5,
};

function adjustMorale(crewMember, delta, reason, gmState) {
  const prev = crewMember.morale;
  crewMember.morale = Math.max(0, Math.min(100, crewMember.morale + delta));

  // Stress accumulates from negative morale events
  if (delta < 0) {
    crewMember.stress = Math.min(100, crewMember.stress + Math.abs(delta) * 0.5);
  }

  // Check defection threshold
  if (crewMember.morale <= 15 && prev > 15) {
    return triggerDefectionCheck(crewMember, gmState);
  }
  // Check breakdown threshold
  if (crewMember.stress >= 80 && crewMember.morale <= 30) {
    return triggerBreakdown(crewMember, gmState);
  }
  return { type: 'morale_changed', crewId: crewMember.id, delta, reason };
}
```

### Morale thresholds and consequences

| Pool morale | Ship atmosphere | DC effect | Crew behaviour |
|---|---|---|---|
| 80–100 | Resolute | No modifier | Crew volunteers for dangerous tasks |
| 60–79 | Steady | — | Normal. Crew does their jobs |
| 40–59 | Strained | +1 to all crew-assisted rolls | Tension shows. Short tempers |
| 20–39 | Low | +2 to all crew-assisted rolls | Crew avoids the player. Whispers |
| 1–19 | Breaking | +3, disadvantage on morale checks | Defection risk each scene |
| 0 | Mutiny | Crew acts independently | Player loses command authority |

---

## Crew Generation

```js
// Name tables shared with procedural-world-gen — use same seed pass + ':crew' suffix
const CREW_FIRST = ['Petrov','Chen','Sable','Rin','Oryn','Talia','Holt','Dael','Zev','Cass','Finn','Kira'];
const CREW_LAST  = ['Vas','Ora','Maret','Wren','Crane','Sable','Holt','Thrace','Kade','Oryn','Vane','Sorrel'];

const CREW_TENSIONS = [
  'hasn\'t spoken about something that happened before the player came aboard',
  'owes a debt to a faction the player may be working against',
  'is protecting someone planetside and keeps making risky calls',
  'knows the player\'s reputation and isn\'t sure what to believe',
  'was supposed to be somewhere else when this voyage started',
  'has a history with another crew member that neither will discuss',
  'was recruited under false pretences and knows it',
  'is running from something that may catch up with the ship',
  'doesn\'t believe the stated mission is the real mission',
  'lost someone on the last ship they served on',
];

const CREW_WANTS_SPACE = [
  'to earn enough to buy out their contract and disappear',
  'to prove they made the right call during the incident',
  'to find out what really happened to their previous crew',
  'to get back to someone they left behind',
  'to make sure this job goes cleanly — for once',
  'to be trusted with the truth, whatever it is',
  'to finish the job before the past catches up',
  'to keep the ship flying long enough to matter',
];

const CREW_QUIRKS = [
  'keeps a handwritten log in a language no one else on the ship speaks',
  'always knows the exact fuel reserves to three decimal places without checking',
  'names the tools — not the ship, just the tools',
  'hasn\'t taken off their jacket in six weeks',
  'talks to the ship when they think no one is listening',
  'makes terrible coffee and will not accept that it is terrible',
  'always sits facing the door',
  'measures time in jumps, not hours',
];

function generateCrew(worldSeed, shipClass, crewSize) {
  // Separate PRNG stream — doesn't consume world generation sequence
  function mulberry32(s) { return ()=>{ s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}; }
  function hashSeed(str) { let h=0xDEADBEEF;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),0x9E3779B9);h^=h>>>16;}return h>>>0; }
  const rng = mulberry32(hashSeed(worldSeed + ':crew'));
  const pick = (arr) => arr[Math.floor(rng()*arr.length)];
  const ri = (mn,mx) => Math.floor(rng()*(mx-mn+1))+mn;
  const pickN = (arr,n) => { const c=[...arr],r=[];for(let i=0;i<Math.min(n,c.length);i++)r.push(c.splice(Math.floor(rng()*(c.length-i)),1)[0]);return r; };

  // Mandatory roles based on ship class
  const MANDATORY = {
    freighter:       ['pilot','engineer','cargo_master','comms'],
    corvette:        ['pilot','engineer','gunner','comms'],
    salvage_tug:     ['pilot','engineer','cargo_master','navigator'],
    research_vessel: ['pilot','navigator','medic','comms'],
  };
  const mandatory = (MANDATORY[shipClass] || ['pilot','engineer']).slice(0, crewSize);
  const optional  = Object.keys(CREW_ROLES).filter(r => !mandatory.includes(r));
  const roles = [...mandatory, ...pickN(optional, Math.max(0, crewSize - mandatory.length))];

  const usedNames = new Set();
  const rampPool = ['teal','blue','purple','amber','coral','pink'];
  let rampIdx = 0;

  return roles.map((role, i) => {
    let name;
    let attempts = 0;
    do { name = `${pick(CREW_FIRST)} ${pick(CREW_LAST)}`; attempts++; }
    while (usedNames.has(name) && attempts < 20);
    usedNames.add(name);

    const initials = name.split(' ').map(p=>p[0]).join('');
    const ramp = rampPool[rampIdx++ % rampPool.length];
    const hasSecret = rng() < 0.65;

    return {
      id:     name.toLowerCase().replace(/\s+/g,'_'),
      name,
      role,
      portrait: { initials, ramp },
      morale:  ri(55, 80),
      loyalty: ri(40, 65),
      stress:  ri(5, 25),
      alive:   true,
      status:  'active',
      assignedTask: null,
      assignedTo:   null,
      voice: {
        pattern: pick([
          'Quiet, methodical. Speaks in observations, rarely opinions.',
          'Dry and direct. Never wastes words. Laughs rarely but genuinely.',
          'Warm, slightly too chatty when nervous. Trails off mid-sentence under stress.',
          'Precise. Always checks the maths twice. Uncomfortable with ambiguity.',
          'Guarded. Answers questions with questions. Warms slowly.',
          'Sardonic. Uses humour to keep people at arm\'s length.',
          'Earnest, sometimes to a fault. Bad at hiding what they feel.',
          'Careful. Considers before speaking. Rarely wrong but slow to commit.',
        ]),
        never_says: ['I can\'t', 'It doesn\'t matter'],
      },
      tension:  pick(CREW_TENSIONS),
      wants:    pick(CREW_WANTS_SPACE),
      quirk:    pick(CREW_QUIRKS),
      hasSecret,
      secret:   hasSecret ? pick([
        'was the one who reported the incident that cost someone their career',
        'is carrying cargo they haven\'t declared to the captain',
        'has been in contact with a faction the player is working against',
        'survived something that killed everyone else and doesn\'t know why they were spared',
        'their credentials are real but their identity is not',
        'owes someone on this voyage a debt they cannot repay',
        'knows where the ship is actually going, and it isn\'t where the player thinks',
      ]) : null,
      secretThreshold: ri(65, 85),
      relationships: {},
      loreHooks: [`crewmember_${name.toLowerCase().replace(/\s+/g,'_')}`],
      world_flags: {
        on_defect:  `crew_${name.split(' ')[1].toLowerCase()}_defected`,
        on_death:   `crew_${name.split(' ')[1].toLowerCase()}_dead`,
        on_secret_revealed: `crew_${name.split(' ')[1].toLowerCase()}_confession`,
      },
    };
  });
}

function initCrewState(worldSeed, shipClass, crewSize = 4) {
  const roster = generateCrew(worldSeed, shipClass, crewSize);

  // Seed cross-relationships
  roster.forEach((a, i) => {
    roster.forEach((b, j) => {
      if (i === j) return;
      const roll = Math.random();
      a.relationships[b.id] = roll > 0.7 ? 'friendly' : roll > 0.3 ? 'neutral' : 'wary';
    });
  });

  return {
    roster,
    scenesSinceLastMoraleEvent: 0,
    shipAtmosphere: 'steady',  // resolute|steady|strained|low|breaking|mutiny
  };
}
```

---

## Crisis Events

### Defection check

```js
const DEFECTION_TRIGGERS = [
  'Crew morale ≤ 15 for two consecutive scenes',
  'Player broke a direct promise to this crew member',
  'Player abandoned a crew member and this one witnessed it',
  'This crew member\'s secret was exposed and player reacted badly',
  'Faction contact offers better terms',
];

function triggerDefectionCheck(crewMember, gmState) {
  // Loyalty modifies the defection roll — high loyalty resists even low morale
  const dc = 12 - Math.floor((crewMember.loyalty - 50) / 10);
  return {
    type:     'defection_check',
    crewId:   crewMember.id,
    crewName: crewMember.name,
    dc,
    narrative: `${crewMember.name} is at a breaking point. Something has to change — or they leave.`,
    // GM must present a d20 roll widget
    // Success = crew member stays, morale stabilises at 20
    // Failure = crew member defects — fires world_flags.on_defect
    onSuccess: { moraleGain: 10, loyaltyGain: 5, narrative: 'They stay. But they remember.' },
    onFailure: { status: 'defected', narrative: `${crewMember.name} takes what they need and goes.` },
  };
}
```

### Breakdown event

```js
const BREAKDOWN_TYPES = [
  {
    id:        'panic',
    threshold: { stress: 80, morale: 20 },
    narrative: '{name} locks themselves in their quarters. They\'re not responding.',
    effect:    { status: 'incapacitated', duration: 2 },  // scenes until they recover
    recovery:  'Player must spend a scene talking them through it. WIS check DC 13.',
  },
  {
    id:        'reckless',
    threshold: { stress: 75, morale: 25 },
    narrative: '{name} makes a unilateral call that endangers the ship. They believed it was right.',
    effect:    { worldFlag: 'crew_reckless_action', damage: true },
    recovery:  'Consequence plays out in scene. Morale loss: −5 to all crew.',
  },
  {
    id:        'confession',
    threshold: { stress: 85, morale: 35 },
    narrative: '{name} tells you something they\'ve been holding for the whole voyage.',
    effect:    { revealSecret: true },
    recovery:  'Secret enters lore-codex. Relationship with player shifts based on response.',
  },
];

function triggerBreakdown(crewMember, gmState) {
  // Confession breakdown only fires if crew member has a secret
  const eligible = BREAKDOWN_TYPES.filter(b => {
    if (b.id === 'confession' && !crewMember.hasSecret) return false;
    return crewMember.stress >= b.threshold.stress && crewMember.morale <= b.threshold.morale;
  });
  if (!eligible.length) return null;

  // Weight toward confession if loyalty is high — they trust the player
  const weighted = eligible.map(b => ({ b, weight: b.id === 'confession' && crewMember.loyalty > 60 ? 3 : 1 }));
  const total = weighted.reduce((t,w)=>t+w.weight,0);
  let v = Math.random() * total;
  let chosen = eligible[0];
  for (const {b, weight} of weighted) { v -= weight; if (v <= 0) { chosen = b; break; } }

  return {
    type:      'breakdown',
    crewId:    crewMember.id,
    crewName:  crewMember.name,
    breakdown: chosen,
    narrative: chosen.narrative.replace('{name}', crewMember.name),
  };
}
```

### Heroism event

Crew members at high morale and loyalty can volunteer for dangerous tasks, absorb
consequences, or sacrifice themselves for the crew. This is never automatic — the GM
presents the moment and the player can accept or refuse.

```js
const HEROISM_TRIGGERS = [
  { condition: 'loyalty >= 80 && shipState.hull.status === "failing"',
    offer: '{name} offers to do the hull walk. "I\'ve done it before. Let me."' },
  { condition: 'loyalty >= 75 && worldFlags.boarding',
    offer: '{name} moves to intercept. "Get the others out. I\'ll hold them here."' },
  { condition: 'loyalty >= 85 && worldFlags.crew_member_trapped',
    offer: '{name} goes back in. No one asked them to.' },
  { condition: 'morale >= 70 && loyalty >= 70 && scene >= 8',
    offer: '{name} tells you something that changes the calculus. They\'ve been sitting on it since the start.' },
];
```

---

## Task Assignment

Crew members can be assigned to specific tasks that improve their effectiveness or unlock
capabilities. Assignment persists until changed or the crew member is incapacitated.

```js
const TASK_DEFINITIONS = {
  // Ship-bonded tasks
  engine_watch: {
    label:        'Engine watch',
    requires:     ['engineer','pilot'],
    bondedSystem: 'engines',
    effect:       'Engine repair rolls: −2 DC. Notified immediately if engines degrade.',
  },
  sensor_sweep: {
    label:        'Sensor sweep',
    requires:     ['navigator','comms'],
    bondedSystem: 'sensors',
    effect:       'Passive detection of hazards before entry. +1 on all scan rolls.',
  },
  medical_standby: {
    label:        'Medical standby',
    requires:     ['medic'],
    bondedSystem: 'life_support',
    effect:       'Crew injuries stabilise automatically. Healing items restore full HP.',
  },
  weapons_hot: {
    label:        'Weapons ready',
    requires:     ['gunner'],
    bondedSystem: 'weapons',
    effect:       'First round of any combat: free attack with no initiative roll.',
  },
  // Strategic tasks
  morale_work: {
    label:        'Morale support',
    requires:     null,   // any crew member
    bondedSystem: null,
    effect:       'Ship morale +3 per scene. Crew member unavailable for other tasks.',
  },
  intel_dig: {
    label:        'Intelligence gathering',
    requires:     ['comms','navigator'],
    bondedSystem: null,
    effect:       'Each scene in a known system: chance to surface lore-codex partial entry.',
  },
  repair_rotation: {
    label:        'Repair rotation',
    requires:     ['engineer'],
    bondedSystem: null,
    effect:       'One degraded system recovers 5 integrity per scene without a roll.',
  },
};

function assignCrewToTask(crewMember, taskId, crewState) {
  const task = TASK_DEFINITIONS[taskId];
  if (!task) return { success: false, reason: 'Unknown task.' };
  if (crewMember.status !== 'active') return { success: false, reason: `${crewMember.name} is not available.` };
  if (task.requires && !task.requires.includes(crewMember.role)) {
    return { success: false, reason: `${crewMember.name} lacks the role for this task. Requires: ${task.requires.join(' or ')}.` };
  }
  // Unassign from previous task
  crewMember.assignedTask = taskId;
  crewMember.assignedTo   = task.bondedSystem;
  return { success: true, task };
}
```

---

## The Crew Manifest Widget

The full interactive widget. Surfaces the roster with individual morale bars, assigned tasks,
status badges, and the collective ship morale pool. Each crew member has a quick-action panel.

```html
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Syne:wght@700&family=Playfair+Display:ital@1&display=swap');

  .cm-root { font-family:'IBM Plex Mono','SF Mono','Cascadia Code','Consolas',monospace; padding:1rem 0 1.5rem; }

  .cm-header { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:0.75rem; flex-wrap:wrap; gap:8px; }
  .cm-title  { font-family:'Syne','Segoe UI',system-ui,sans-serif; font-size:18px; font-weight:700; color:var(--color-text-primary); margin:0; }
  .cm-meta   { font-size:10px; color:var(--color-text-tertiary); }

  /* Ship morale pool bar */
  .morale-pool {
    display:flex; align-items:center; gap:10px; padding:10px 14px;
    background:var(--color-background-secondary); border-radius:var(--border-radius-md);
    margin-bottom:1rem;
  }
  .morale-label { font-size:10px; letter-spacing:0.1em; text-transform:uppercase; color:var(--color-text-tertiary); min-width:80px; }
  .morale-track { flex:1; height:5px; background:var(--color-border-tertiary); border-radius:3px; overflow:hidden; }
  .morale-fill  { height:100%; border-radius:3px; transition:width 0.5s ease; }
  .m-resolute { background:#1D9E75; }
  .m-steady   { background:#378ADD; }
  .m-strained { background:#EF9F27; }
  .m-low      { background:#D85A30; }
  .m-breaking { background:#E24B4A; }
  .morale-badge {
    font-size:11px; letter-spacing:0.1em; text-transform:uppercase;
    padding:3px 9px; border-radius:var(--border-radius-md); font-weight:500; flex-shrink:0;
  }
  .mb-resolute { background:#E1F5EE; color:#085041; }
  .mb-steady   { background:#E6F1FB; color:#0C447C; }
  .mb-strained { background:#FAEEDA; color:#633806; }
  .mb-low      { background:#FAECE7; color:#712B13; }
  .mb-breaking { background:#FCEBEB; color:#791F1F; }
  @media(prefers-color-scheme:dark){
    .mb-resolute { background:#085041; color:#9FE1CB; }
    .mb-steady   { background:#0C447C; color:#B5D4F4; }
    .mb-strained { background:#633806; color:#FAC775; }
    .mb-low      { background:#712B13; color:#F5C4B3; }
    .mb-breaking { background:#791F1F; color:#FFD0D0; }
  }
  /* Note: morale badge dark mode colours are semantic design tokens (success/info/warning/danger) — intentionally hardcoded */

  /* Crew cards */
  .crew-list { display:flex; flex-direction:column; gap:8px; }

  .crew-card {
    background:var(--color-background-primary);
    border:0.5px solid var(--color-border-tertiary);
    border-radius:var(--border-radius-lg, 12px);
    padding:0.9rem 1rem;
    transition:border-color 0.12s;
  }
  .crew-card.c-strained { border-color:#854F0B; }
  .crew-card.c-low      { border-color:#993C1D; }
  .crew-card.c-breaking { border-color:#791F1F; border-width:1.5px; }
  .crew-card.c-dead, .crew-card.c-defected { opacity:0.4; }
  .crew-card.c-injured  { border-color:#BA7517; }

  .crew-top { display:flex; align-items:center; gap:10px; margin-bottom:8px; }

  .portrait {
    width:36px; height:36px; border-radius:50%; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-size:11px; font-weight:500; font-family:'IBM Plex Mono','SF Mono','Cascadia Code','Consolas',monospace;
  }
  .p-teal   { background:var(--color-background-success, #085041); color:var(--color-text-success, #9FE1CB); }
  .p-blue   { background:var(--color-background-info, #0C447C);    color:var(--color-text-info, #B5D4F4);    }
  .p-purple { background:#EEEDFE; color:#3C3489; }
  .p-amber  { background:#FAEEDA; color:#633806; }
  .p-coral  { background:#FAECE7; color:#712B13; }
  .p-pink   { background:#FBEAF0; color:#72243E; }
  @media(prefers-color-scheme:dark){
    .p-purple { background:#3C3489; color:#CECBF6; }
    .p-amber  { background:#633806; color:#FAC775; }
    .p-coral  { background:#712B13; color:#F5C4B3; }
    .p-pink   { background:#72243E; color:#F4C0D1; }
  }
  /* Note: portrait dark mode colours are accent design tokens — intentionally hardcoded */

  .crew-meta { flex:1; }
  .crew-name { font-family:'Syne','Segoe UI',system-ui,sans-serif; font-size:14px; font-weight:700; color:var(--color-text-primary); margin:0 0 2px; }
  .crew-role-badge {
    font-size:11px; letter-spacing:0.08em; text-transform:uppercase; padding:2px 7px;
    border-radius:var(--border-radius-md); background:var(--color-background-secondary);
    color:var(--color-text-secondary); border:0.5px solid var(--color-border-tertiary);
    display:inline-block;
  }

  .crew-status-badge {
    font-size:8px; letter-spacing:0.1em; text-transform:uppercase;
    padding:2px 7px; border-radius:var(--border-radius-md); flex-shrink:0; font-weight:500;
  }
  .cs-active       { background:#E1F5EE; color:#085041; }
  .cs-injured      { background:#FAEEDA; color:#633806; }
  .cs-incapacitated{ background:#FAECE7; color:#712B13; }
  .cs-missing      { background:#F1EFE8; color:#444441; }
  .cs-defected     { background:#FCEBEB; color:#791F1F; }
  .cs-dead         { background:#F1EFE8; color:#2C2C2A; }
  @media(prefers-color-scheme:dark){
    .cs-active       { background:#085041; color:#9FE1CB; }
    .cs-injured      { background:#633806; color:#FAC775; }
    .cs-incapacitated{ background:#712B13; color:#F5C4B3; }
    .cs-missing      { background:var(--color-background-secondary, #444441); color:var(--color-text-secondary, #D3D1C7); }
    .cs-defected     { background:#791F1F; color:#FFD0D0; }
    .cs-dead         { background:var(--color-background-primary, #2C2C2A); color:var(--color-text-tertiary, #888780); }
  }

  /* Morale + stress bars */
  .bars-row { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px; }
  .bar-item {}
  .bar-item-label { font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--color-text-tertiary); margin-bottom:3px; }
  .bar-track { height:3px; background:var(--color-border-tertiary); border-radius:2px; overflow:hidden; }
  .bar-fill  { height:100%; border-radius:2px; transition:width 0.4s ease; }
  .morale-high  { background:#1D9E75; }
  .morale-mid   { background:#EF9F27; }
  .morale-low   { background:#E24B4A; }
  .stress-fill  { background:#D85A30; }

  .crew-tension {
    font-family:'Playfair Display',serif; font-style:italic;
    font-size:11px; color:var(--color-text-tertiary); line-height:1.6;
    margin-bottom:8px;
    border-left:2px solid var(--color-border-tertiary); padding-left:8px;
  }

  .crew-assignment {
    font-size:10px; color:var(--color-text-secondary);
    padding:4px 8px; border-radius:var(--border-radius-md);
    background:var(--color-background-secondary); margin-bottom:8px; display:inline-block;
  }

  .crew-actions { display:flex; gap:5px; flex-wrap:wrap; }
  .crew-btn {
    padding:8px 14px; min-height:44px; min-width:44px; box-sizing:border-box;
    font-family:'IBM Plex Mono','SF Mono','Cascadia Code','Consolas',monospace; font-size:11px; letter-spacing:0.08em;
    background:transparent; border:0.5px solid var(--color-border-secondary);
    border-radius:var(--border-radius-md); color:var(--color-text-secondary);
    cursor:pointer; transition:background 0.1s;
  }
  .crew-btn:hover { background:var(--color-background-secondary); }
  .crew-btn:disabled { opacity:0.3; cursor:not-allowed; }

  .cm-footer { display:flex; justify-content:space-between; align-items:center; padding-top:0.75rem; border-top:0.5px solid var(--color-border-tertiary); margin-top:0.5rem; flex-wrap:wrap; gap:8px; }
  .close-btn { font-family:'IBM Plex Mono','SF Mono','Cascadia Code','Consolas',monospace; font-size:11px; letter-spacing:0.08em; background:transparent; border:0.5px solid var(--color-border-secondary); border-radius:var(--border-radius-md); padding:8px 14px; min-height:44px; min-width:44px; box-sizing:border-box; color:var(--color-text-secondary); cursor:pointer; }
  .close-btn:hover { background:var(--color-background-secondary); }

  @media (prefers-reduced-motion: reduce) {
    * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
  }

  button:focus-visible, [data-prompt]:focus-visible, input:focus-visible {
    outline: 2px solid var(--color-border-primary, #4a90d9);
    outline-offset: 2px;
  }
</style>

<div class="cm-root">
  <div class="cm-header">
    <p class="cm-title">Crew manifest</p>
    <span class="cm-meta" id="cm-meta">—</span>
  </div>

  <div class="morale-pool">
    <span class="morale-label">Ship morale</span>
    <div class="morale-track"><div class="morale-fill" id="morale-fill" style="width:0%"></div></div>
    <span class="morale-badge" id="morale-badge">—</span>
  </div>

  <div class="crew-list" id="crew-list"></div>

  <p class="cm-fallback" id="cm-fallback" style="display:none; font-size:11px; padding:8px 12px; margin:0.5rem 0; background:var(--color-background-warning); border:0.5px solid var(--color-border-warning); border-radius:var(--border-radius-md); color:var(--color-text-warning); word-break:break-word; user-select:all;"></p>

  <div class="cm-footer">
    <button class="close-btn" data-prompt="Close the crew manifest. Continue the adventure.">Close ↗</button>
    <button class="close-btn" data-prompt="I want to address the whole crew.">Address crew ↗</button>
  </div>
</div>

<script>
const CREW = /* INJECT_CREW_JSON */ [];

function esc(str) {
  if (typeof str !== 'string') return str == null ? '' : String(str);
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showFallback(text) {
  const el = document.getElementById('cm-fallback');
  if (!el) return;
  el.textContent = text;
  el.style.display = 'block';
}

function getMoraleClass(m) {
  if (m >= 80) return 'resolute';
  if (m >= 60) return 'steady';
  if (m >= 40) return 'strained';
  if (m >= 20) return 'low';
  return 'breaking';
}

function getCardClass(member) {
  if (!member.alive || member.status === 'dead') return 'c-dead';
  if (member.status === 'defected') return 'c-defected';
  if (member.status === 'injured') return 'c-injured';
  const mc = getMoraleClass(member.morale);
  if (mc === 'strained') return 'c-strained';
  if (mc === 'low')      return 'c-low';
  if (mc === 'breaking') return 'c-breaking';
  return '';
}

function render() {
  const activeList = CREW.filter(c => c.alive && c.status !== 'dead' && c.status !== 'defected');
  const pool = activeList.length
    ? Math.round(activeList.reduce((s,c)=>s+c.morale,0)/activeList.length) : 0;
  const mc   = getMoraleClass(pool);

  document.getElementById('morale-fill').style.width  = pool + '%';
  document.getElementById('morale-fill').className = `morale-fill m-${mc}`;
  document.getElementById('morale-badge').className = `morale-badge mb-${mc}`;
  document.getElementById('morale-badge').textContent = mc.charAt(0).toUpperCase() + mc.slice(1);
  document.getElementById('cm-meta').textContent =
    `${activeList.length} active · ${CREW.length - activeList.length} lost`;

  const list = document.getElementById('crew-list');
  list.innerHTML = '';

  CREW.forEach(member => {
    const card = document.createElement('div');
    const cc = getCardClass(member);
    card.className = 'crew-card' + (cc ? ' ' + cc : '');

    const mor = Math.round(member.morale || 0);
    const str = Math.round(member.stress || 0);
    const morClass = mor >= 60 ? 'morale-high' : mor >= 35 ? 'morale-mid' : 'morale-low';
    const ramp = (member.portrait?.ramp) || 'blue';
    const badge = ({active:'cs-active',injured:'cs-injured',incapacitated:'cs-incapacitated',
      missing:'cs-missing',defected:'cs-defected',dead:'cs-dead'})[member.status] || 'cs-active';

    const alive = member.alive && member.status !== 'dead' && member.status !== 'defected';
    const roleLabel = member.role ? member.role.replace(/_/g,' ') : '—';

    // All interpolated values escaped via esc() to prevent XSS from injected crew data
    const safeName = esc(member.name);
    const safeInitials = esc(member.portrait?.initials || '?');
    const safeStatus = esc(member.status || 'active');
    const safeTension = esc(member.tension || '');
    const safeAssigned = member.assignedTask ? esc(member.assignedTask.replace(/_/g,' ')) : '';

    card.innerHTML = `
      <div class="crew-top">
        <div class="portrait p-${esc(ramp)}">${safeInitials}</div>
        <div class="crew-meta">
          <p class="crew-name">${safeName}</p>
          <span class="crew-role-badge">${esc(roleLabel)}</span>
        </div>
        <span class="crew-status-badge ${badge}">${safeStatus}</span>
      </div>
      <div class="bars-row">
        <div class="bar-item">
          <div class="bar-item-label">Morale · ${mor}</div>
          <div class="bar-track"><div class="bar-fill ${morClass}" style="width:${mor}%"></div></div>
        </div>
        <div class="bar-item">
          <div class="bar-item-label">Stress · ${str}</div>
          <div class="bar-track"><div class="bar-fill stress-fill" style="width:${str}%"></div></div>
        </div>
      </div>
      ${alive ? `<div class="crew-tension">${safeTension}</div>` : ''}
      ${safeAssigned ? `<div class="crew-assignment">Assigned: ${safeAssigned}</div>` : ''}
      <div class="crew-actions">
        ${alive ? `<button class="crew-btn" data-prompt="I speak privately with ${safeName}.">Talk ↗</button>` : ''}
        ${alive && !member.assignedTask ? `<button class="crew-btn" data-prompt="I assign ${safeName} to a task.">Assign ↗</button>` : ''}
        ${alive && member.assignedTask  ? `<button class="crew-btn" data-prompt="I pull ${safeName} off their current task.">Reassign ↗</button>` : ''}
        ${alive && member.stress >= 60  ? `<button class="crew-btn" data-prompt="I check in on ${safeName} -- they seem under a lot of stress.">Check in ↗</button>` : ''}
      </div>
    `;
    list.appendChild(card);
  });
}

render();

// ── sendPrompt wiring (data-prompt + addEventListener pattern) ────────────
// Use event delegation on the document since crew cards are rendered dynamically
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-prompt]');
  if (btn) {
    const prompt = btn.dataset.prompt;
    if (typeof sendPrompt === 'function') { sendPrompt(prompt); }
    else { showFallback(prompt); }
  }
});
</script>
```

---

## CREW_EVENT Protocol

```
CREW_EVENT: morale   | [crewId|all] | [+/-amount] | [reason]
CREW_EVENT: loyalty  | [crewId]     | [+/-amount] | [reason]
CREW_EVENT: stress   | [crewId|all] | [+/-amount] | [reason]
CREW_EVENT: status   | [crewId]     | [newStatus: active|injured|incapacitated|missing|defected|dead]
CREW_EVENT: assign   | [crewId]     | [taskId]
CREW_EVENT: address  | [message]    | [effect: +morale|-morale|+loyalty]
CREW_EVENT: death    | [crewId]     | [cause]
CREW_EVENT: secret   | [crewId]     | (trigger secret reveal for this crew member)
```

---

## Integration with the AI NPC Module

When the player speaks privately with a crew member, expand their `crewMember` profile into a
full ai-npc `NPC` definition object. Key differences from world NPCs:

```js
function crewMemberToNPC(member, crewState, gmState) {
  const shipMorale = getMoralePool(crewState);
  const otherCrew = crewState.roster.filter(c => c.id !== member.id && c.alive);

  return {
    id:   member.id,
    name: member.name,
    role: `${member.role.replace(/_/g,' ')}, your ship`,
    portrait: member.portrait,
    voice: {
      pattern:    member.voice.pattern,
      speaks_in:  'sentences that reflect their current stress level',
      never_says: member.voice.never_says,
    },
    disposition: {
      initial:      loyaltyToDisposition(member.loyalty),
      current:      loyaltyToDisposition(member.loyalty),
      toward_player: member.loyalty,
      triggers: {
        hostile:   ['threaten to leave them behind', 'dismiss their concern'],
        friendly:  ['acknowledge their contribution', 'ask about their wellbeing'],
        desperate: ['ship morale drops below 20', 'crew member death mentioned'],
      },
    },
    knowledge: {
      knows: [
        `The ship\'s current condition: ${Object.values(gmState.shipState?.systems||{}).map(s=>s.label+' '+s.status).join(', ')}`,
        `Ship morale is ${getMoraleClass(shipMorale)} (${shipMorale}/100)`,
        `They are assigned to: ${member.assignedTask || 'no current task'}`,
        `Their relationships with the crew: ${Object.entries(member.relationships).map(([id,r])=>{const c=crewState.roster.find(m=>m.id===id);return c?c.name+': '+r:'';}).filter(Boolean).join(', ')}`,
        member.hasSecret && member.loyalty >= member.secretThreshold
          ? `Secret (now accessible at this trust level): ${member.secret}`
          : 'Their secret, if they have one, is not yet accessible',
      ],
      does_not_know: [
        'The player\'s full plan or next destination unless told',
        'What other crew members have said in private',
      ],
      will_lie_about: member.loyalty < 40
        ? ['Their true intentions — they are thinking about leaving']
        : [],
      will_never_reveal: member.loyalty < member.secretThreshold && member.hasSecret
        ? ['Their secret — trust level too low']
        : [],
    },
    agenda: [
      `Primary: ${member.wants}`,
      `Secondary: gauge whether the player is someone worth trusting`,
      member.tension ? `Tension: ${member.tension}` : 'Keep their head down and do the job',
    ],
    opening_line: generateCrewOpeningLine(member, gmState),
  };
}

function loyaltyToDisposition(loyalty) {
  if (loyalty >= 75) return 'friendly';
  if (loyalty >= 55) return 'neutral';
  if (loyalty >= 35) return 'guarded';
  return 'hostile';
}

function generateCrewOpeningLine(member, gmState) {
  const mc = getMoraleClass(member.morale);
  if (mc === 'breaking') return `*${member.name} doesn\'t look up when you enter.* "What do you need."`;
  if (mc === 'low')      return `*${member.name} glances over.* "You got a minute? Or — no, it\'s fine."`;
  if (mc === 'strained') return `*${member.name} looks tired.* "Captain." A beat. "Something on your mind?"`;
  if (mc === 'steady')   return `*${member.name} acknowledges you.* "What is it?"`;
  return `*${member.name} looks up, something like relief crossing their face.* "Good timing. Got a moment?"`;
}
```

---

## Addressing the Crew

When the player addresses the whole crew, it's a social roll (CHA, DC 12–18 depending on
current morale) that can shift the collective mood. The GM authors the player's speech; the
roll determines how it lands.

| Outcome | Morale effect | Loyalty effect | Narrative |
|---|---|---|---|
| Critical success | +12 all crew | +5 all crew | They believe you. Fully, for now. |
| Success | +7 all crew | +2 all crew | It helps. Not everything, but enough. |
| Partial success | +3 all crew | — | They hear you. They aren't sure yet. |
| Failure | −3 all crew | −2 all crew | It came out wrong. They needed more than that. |
| Critical failure | −8 all crew | −5 all crew | It made things worse. Someone walks out. |

---

## gmState Integration and Save

`crewState` lives at `gmState.crewState`. Save-codex stores delta mutations only:

```js
// Save compact: only changed fields
const crewFlags = {};
crewState.roster.forEach(m => {
  const prefix = `crew_${m.id}_`;
  crewFlags[prefix+'morale']  = Math.round(m.morale);
  crewFlags[prefix+'loyalty'] = Math.round(m.loyalty);
  crewFlags[prefix+'stress']  = Math.round(m.stress);
  crewFlags[prefix+'status']  = m.status;
  crewFlags[prefix+'task']    = m.assignedTask || '';
});
Object.assign(gmState.worldFlags, crewFlags);
```

**Scene footer:** Use the canonical scene footer from `reference.md`. This module adds
the **Crew** panel button to the footer when loaded. Do not define a custom footer here.

---

## Anti-Patterns (never do these)

- Never treat crew deaths as mechanical events only — every named crew member death must get
  its own cinematic moment. The crew remember.
- Never reduce crew to a resource pool — they have names, tensions, and quirks that should
  appear in scene prose even when not directly interacted with. They are present.
- Never auto-trigger defection without a roll — the player must have a chance to respond.
  Defection is a story beat, not a penalty.
- Never let morale recover as fast as it falls — gains should feel earned. One successful
  mission buys +6. One crew member death costs −15 from everyone. Asymmetry is intentional.
- Never reveal a crew member's secret before their loyalty threshold is met through a private
  conversation — secrets earned through play carry far more weight than delivered exposition.
- Never assign the same crew member to multiple tasks simultaneously — the assignment system
  is a commitment mechanism. Being useful somewhere means being unavailable elsewhere.
- Never skip the relationship web between crew members — when one crew member dies, the
  others who were bonded to them should react differently from those who were merely neutral.
- Never use the crew manifest as the opening widget of a session — like the ship status, it
  surfaces reactively during play, not as an onboarding checklist.
- Never make heroism automatic — when a crew member volunteers to sacrifice themselves, the
  player must decide whether to accept. Refusing is a valid choice and should cost something.
- Never let crew morale hit zero without a scene — mutiny is a narrative event, not a game
  over screen. Someone puts down their tools and says the thing that needed saying.
