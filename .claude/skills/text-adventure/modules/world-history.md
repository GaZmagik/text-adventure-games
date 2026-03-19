# World History — Pre-Adventure World Building
> Module for text-adventure orchestrator. Recommended for all adventures.

The world did not spring into existence the moment the adventure began. Empires rose before
the player arrived. Wars ended inconclusively. Institutions that started with noble purposes
calcified into something else. Fortunes shifted. People were displaced. The scars of all of
that are still here — in the architecture, in the slang, in the things nobody talks about at
the bar unless they've had three drinks and forgotten to be careful.

World History is a GM-side pre-adventure building system. It gives the world a past that is
deeper than the adventure needs, structured around the Iceberg Rule: generate ten times more
history than the player will ever see. What reaches the surface comes filtered through NPC
memory, physical evidence, and rumour — never through exposition dumps. The player discovers
the world's past by living in its present.

This module is GM-internal. Players never see epochs, power structure genealogies, or cultural
layer data directly. What they encounter are the consequences: an NPC who won't say a
faction's name aloud, a district that rebuilt with cheaper materials after the fire, a toast
that everyone at the bar knows and nobody can explain the origin of.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: lore-codex (surface
history as discoverable entries), story-architect (history informs thread motivations and the
Act 2 reversal), ai-npc (NPC voices carry historical weight), procedural-world-gen (epochs
seed the generated world's texture), core-systems (factions begin in history), scenarios.

---

## Architecture Overview

```
Generation Process (pre-session, GM-authored or seeded)
        ↓
worldHistory.epochs[] — 3–5 epochs, most recent sets up conflict
        ↓
powerStructures[] — who holds power, how they got it, what they hide
        ↓
pastConflicts[] — wars, purges, collapses, betrayals
        ↓
culture{} — language, customs, economy, technology
        ↓
beforeSnapshot{} — the world the day the adventure begins
        ↓
environmentalMemory — physical world carries historical weight
        ↓
Iceberg surface → lore-codex entries, NPC references,
  environmental details, story-architect thread seeds
```

The GM builds `gmState.worldHistory` before the first scene renders. None of it is presented
to the player directly. All of it shapes everything.

---

## Historical Epoch System

Epochs are the chapters of the world's past. Generate three to five per adventure. They need
not be evenly spaced — two might overlap, one might have lasted five hundred years, the most
recent might be only a decade old. What matters is that each epoch produced consequences that
the present world is still living with.

```js
const epochSchema = {
  id: string,               // e.g. "the_consolidation"
  name: string,             // e.g. "The Consolidation"
  timeframe: string,        // e.g. "~90 years ago" or "230–180 years ago"
  definingEvent: string,    // the single event that defines this era
  consequences: string[],   // what the epoch produced that still matters today
  survivors: [              // factions, institutions, or lineages that persist
    {
      name: string,
      then: string,         // what they were
      now: string,          // what they became
    }
  ],
  artifacts: string[],      // physical objects, structures, or documents that remain
  publicKnowledge: boolean, // true = commonly known; false = contested, suppressed, or forgotten
  contested: boolean,       // different factions remember it differently
  contestedVersions: [      // only populated if contested: true
    { faction: string, version: string }
  ],
};
```

### Rules

**Most recent epoch sets up the central conflict.** Whatever broke, whoever fell from power,
whatever deal was made and is now straining — that is the friction the adventure runs on.

**At least one epoch must be contested.** Different factions hold different versions of the
same events. What the docking authority calls the Pacification, the outer-ring residents call
the Clearance. The same event. Completely different meaning. The player will hear both
versions if they talk to the right people, and must decide what to believe — or recognise
that both are partial truths.

**Most ancient epochs are barely remembered.** Three generations back is living memory. Seven
generations back is myth, family story, and institution name. Twelve generations back is
archaeology. Apply appropriate epistemic weight.

**Consequences are not lore.** They are present-tense facts that the history produced. An
epoch that ended in famine does not produce an entry about famine — it produces a population
that hoards food, distrust of central distribution, black markets in preserved goods.

### Freeport Meridian Example — Five Epochs

```js
gmState.worldHistory.epochs = [
  {
    id: "the_founding_compact",
    name: "The Founding Compact",
    timeframe: "~340 years ago",
    definingEvent: "Six independent mining consortia signed the Compact, pooling transit rights and establishing a permanent station at the Meridian waypoint.",
    consequences: [
      "Station governance is still formally a consortium council — six seats, rotating chair.",
      "The original six family names still appear on docking berths, corridors, and founding plaques.",
      "Legal disputes between corporate descendants are resolved under Compact Law, not Sector Authority law — a loophole traffickers and traders exploit routinely.",
    ],
    survivors: [
      { name: "Meridian Docking Consortium", then: "An administrative body formed to manage the shared waypoint", now: "The effective government of the station, holding monopoly on docking fees and resupply contracts" },
      { name: "Orwen & Heist Extractives", then: "One of the six original signatory consortia", now: "A shell holding company; its assets were absorbed by the Meridian Docking Consortium seventy years ago, but the seat on the council still exists and is technically vacant" },
    ],
    artifacts: [
      "The Compact itself — a physical document in the portmaster's office, sealed under glass, signed in six different inks",
      "The Six Pillars corridor on Level 2, carved with the founding consortium names and their seals",
    ],
    publicKnowledge: true,
    contested: false,
    contestedVersions: [],
  },

  {
    id: "the_expansion_wars",
    name: "The Expansion Wars",
    timeframe: "~190–160 years ago",
    definingEvent: "Three decades of intermittent conflict as rival sector powers contested transit routes through Meridian space. The station changed administrative control four times.",
    consequences: [
      "Freeport Meridian's formal neutrality doctrine — no armed vessel may berth for more than 48 hours — dates from the peace settlement.",
      "The outer ring of the station was added as emergency refugee housing during the wars; it was never properly integrated and still runs on its own maintenance rota.",
      "Deep distrust of Sector Authority representatives — many families lost people to Authority conscription drafts during the third phase of the wars.",
    ],
    survivors: [
      { name: "The Outer Ring Residents' Association", then: "A wartime mutual aid committee for displaced refugees", now: "An informal but powerful political bloc on the station, with its own dispute resolution and a deeply adversarial relationship with the Docking Consortium" },
    ],
    artifacts: [
      "The blast scoring on the Level 4 bulkheads, never fully repaired — considered a memorial by outer-ring residents, an eyesore by the Consortium",
      "The neutrality plaques at each docking approach, in the three languages of the warring powers",
    ],
    publicKnowledge: true,
    contested: true,
    contestedVersions: [
      { faction: "Meridian Docking Consortium", version: "The Consortium's neutrality doctrine saved the station from destruction — administrative flexibility under pressure was leadership." },
      { faction: "Outer Ring Residents' Association", version: "The Consortium sold docking rights to whoever was winning at the time. They called it neutrality. The outer ring called it survival at everyone else's expense." },
    ],
  },

  {
    id: "the_great_refit",
    name: "The Great Refit",
    timeframe: "~80 years ago",
    definingEvent: "A twenty-year infrastructure project that modernised the station's core systems, funded by a Sector Authority development bond — the first Sector money ever accepted by Meridian governance.",
    consequences: [
      "The bond was never fully repaid. Sector Authority holds partial financial jurisdiction over core station systems as collateral — the term that allows the docking authority's expanded presence on the station.",
      "The Refit replaced older architecture with standardised Sector-spec construction. The original Level 1 and 2 aesthetic — heavier, more ornate, darker metal — is now only preserved in the founding corridors.",
      "A generation of station engineers trained under Sector Authority technical teams. Those engineers trained the next generation. The technical culture of Freeport Meridian is now more Sector-aligned than its governance.",
    ],
    survivors: [
      { name: "Sector Docking Authority — Meridian Station", then: "A temporary Sector technical oversight body during the Refit", now: "A permanent administrative presence with jurisdiction over safety compliance, weapons inspection, and financial audit — technically advisory, practically influential" },
    ],
    artifacts: [
      "The bond documentation — locked in the portmaster's archive, its terms not publicly disclosed",
      "The contrast between the old-spec corridors of Level 1 and the Sector-standard construction everywhere above Level 3",
      "The Authority's administrative block on Level 5 — the only part of the station built entirely to Sector specification",
    ],
    publicKnowledge: false, // the bond's full terms are not public knowledge
    contested: false,
    contestedVersions: [],
  },

  {
    id: "the_quiet_decade",
    name: "The Quiet Decade",
    timeframe: "~25–15 years ago",
    definingEvent: "Ten years of relative prosperity — high transit traffic, low faction conflict, strong resupply contracts. Remembered fondly by those who lived through it, used rhetorically by politicians to imply the current period is a decline.",
    consequences: [
      "The generation that grew up during the Quiet Decade has expectations of stability that the current political climate cannot meet.",
      "Several side enterprises — The Oxidiser bar among them — expanded during this period and are now over-committed on leases signed under optimistic projections.",
      "Gareth Williams opened The Oxidiser bar on Level 2 in the third year of the Quiet Decade, capitalising on increased foot traffic from transit crews. His lease was signed at peak rates.",
    ],
    survivors: [
      { name: "The Level 2 Traders' Informal Guild", then: "A loose association formed to share resupply contacts during the boom", now: "A tension-filled body increasingly divided between those who want Consortium backing and those who want to stay independent" },
    ],
    artifacts: [
      "The over-extended leases held by Level 2 businesses, including The Oxidiser",
      "The expansion corridors built during the boom that are now only half-occupied",
    ],
    publicKnowledge: true,
    contested: false,
    contestedVersions: [],
  },

  {
    id: "the_contract_dispute",
    name: "The Contract Dispute",
    timeframe: "~8 years ago to present",
    definingEvent: "The Meridian Docking Consortium attempted to renegotiate resupply contracts with the outer ring's independent operators, offering lower rates in exchange for exclusive agreements. The outer ring refused. The Consortium responded by redirecting premium berths to Consortium-aligned traders.",
    consequences: [
      "Transit traffic on Level 2 — the traditional independent trader level — dropped 40% over four years.",
      "The Sector Docking Authority quietly backed the Consortium position, citing the bond agreement.",
      "A black market in unofficial berth reassignments emerged, run by parties unknown — probably with connections to both sides.",
      "Several Level 2 businesses closed. Those that survived did so on thinner margins and with more difficult customers.",
      "The Oxidiser bar is still open. Gareth Williams has not closed it, but he is three months behind on his lease and deeply familiar with the people who need a drink and a place to talk.",
    ],
    survivors: [
      { name: "Outer Ring Residents' Association", then: "A political bloc resisting the contract terms", now: "Increasingly organised, increasingly desperate, and — unknown to the Consortium — in contact with a Sector auditor who may be interested in the bond documentation" },
    ],
    artifacts: [
      "The disputed contract itself, filed with the Consortium's legal office",
      "The empty units on Level 2 — dark shopfronts with old signs still in them",
      "The unofficial berth reassignment system — a network of handshakes and data chips left in specific locations",
    ],
    publicKnowledge: true,
    contested: true,
    contestedVersions: [
      { faction: "Meridian Docking Consortium", version: "Rationalisation of berth allocation for efficiency. Independent operators who could not meet the new standards were not competitive." },
      { faction: "Outer Ring Residents' Association", version: "A deliberate campaign to starve independent operators until they either accept Consortium terms or leave. It is working." },
    ],
  },
];
```

---

## Power Structure Genealogy

Power structures are the organisations, institutions, and networks that shape the world. Every
one of them began as something — and most of them became something else. The gap between the
original purpose and the current purpose is where secrets and tension live.

```js
const powerStructureSchema = {
  id: string,
  name: string,
  type: string,              // "government" | "corporation" | "guild" | "criminal" |
                             //   "religious" | "military" | "informal" | "legacy"
  founded: string,           // approximate timeframe
  foundedBy: string,         // who created it and why
  originalPurpose: string,   // what it was meant to do
  currentPurpose: string,    // what it actually does now
  evolution: string,         // the path from then to now — the drift
  currentLeader: {
    name: string,
    characterisation: string,
    motivation: string,
    vulnerability: string,
  },
  internalTension: string,   // the fault line inside the organisation
  externalThreat: string,    // what threatens it from outside
  publicPerception: string,  // how most people see it
  secretTruth: string,       // what is true but not publicly known
  worldFlags: {
    prefix: string,          // e.g. "faction_consortium_"
  },
};
```

### Freeport Meridian — Power Structures

```js
gmState.worldHistory.powerStructures = [
  {
    id: "meridian_docking_consortium",
    name: "Meridian Docking Consortium",
    type: "government",
    founded: "~340 years ago",
    foundedBy: "Six mining consortia who needed a shared administrative body for the waypoint station",
    originalPurpose: "Neutral management of shared transit infrastructure — docking fees, resupply coordination, dispute resolution",
    currentPurpose: "De facto governance of Freeport Meridian; extraction of transit revenue; protection of Consortium-aligned commercial interests",
    evolution: "Administrative legitimacy accumulated naturally as the station grew. No single moment of seizure — just incremental scope expansion over three centuries, each step justifiable in isolation.",
    currentLeader: {
      name: "Portmaster Elara Voss",
      characterisation: "Precise, composed, and genuinely believes the Consortium's stability is indistinguishable from the station's survival. She is not wrong that the station needs management. She is wrong about whose interests that management serves.",
      motivation: "To preserve the station through a period she knows is more dangerous than it appears — the Sector auditor's inquiry is closer than her colleagues realise.",
      vulnerability: "She knows about the bond documentation and what it reveals. She has been managing that knowledge for six years. It is exhausting.",
    },
    internalTension: "The six council seats represent different commercial interests that are no longer aligned. Two seats want to settle with the outer ring. Two want to accelerate the consolidation. Two are waiting to see which way it falls.",
    externalThreat: "The Sector Authority audit, which may expose the bond terms. And the outer ring's growing organisation, which is no longer simply refusing — it is building leverage.",
    publicPerception: "Legitimate station governance. Bureaucratic, occasionally self-serving, but the lights stay on and the docking approach is safe.",
    secretTruth: "The bond repayment default sixteen years ago was deliberate — the Consortium's financial director at the time structured it to give the Sector Authority a financial lever in exchange for Authority backing of the Consortium's internal monopoly. The current portmaster inherited this arrangement.",
    worldFlags: { prefix: "faction_consortium_" },
  },

  {
    id: "sector_docking_authority",
    name: "Sector Docking Authority — Meridian Station",
    type: "government",
    founded: "~80 years ago (permanent presence)",
    foundedBy: "Sector Authority, as technical oversight for the Great Refit bond",
    originalPurpose: "Temporary technical oversight to ensure Sector construction standards during the Refit",
    currentPurpose: "Permanent administrative presence; enforcement of safety and weapons compliance; quiet leverage over Consortium decisions via bond collateral",
    evolution: "The bond's unpaid balance gave the Authority a legal basis to remain. Each renewal of the oversight mandate added scope. Nobody voted for permanent Authority presence — it simply never ended.",
    currentLeader: {
      name: "Inspector Reyan Torr",
      characterisation: "By-the-book in the specific way that people who know where the bodies are buried tend to be — everything precisely documented, nothing done without a paper trail, no enthusiasm for improvisation.",
      motivation: "He wants the audit completed and the bond terms resolved before his posting ends. He would prefer clean resolution. He suspects clean resolution is not what he is going to get.",
      vulnerability: "He is aware that the bond arrangement was corrupt from the start. He does not know what to do with that knowledge yet.",
    },
    internalTension: "The Authority inspectors on-station are split between those who see Meridian as a routine posting and those who understand that the audit could be significant. Inspector Torr is in the second group. Most of his staff are in the first.",
    externalThreat: "Outer ring legal action, which would force the bond documentation into a public proceeding and expose the arrangement.",
    publicPerception: "Officious Sector bureaucrats with clipboards. Tolerated because they keep the weapons checks running. Resented by outer-ring residents who see them as the Consortium's enforcement arm.",
    secretTruth: "Inspector Torr has already found the bond documentation. He has not filed his report yet. He is waiting to understand what he is looking at.",
    worldFlags: { prefix: "faction_authority_" },
  },

  {
    id: "outer_ring_residents_association",
    name: "Outer Ring Residents' Association",
    type: "informal",
    founded: "~190 years ago (wartime), current form ~8 years ago",
    foundedBy: "Wartime refugees who needed mutual aid structures; current leadership formed in response to the Contract Dispute",
    originalPurpose: "Wartime mutual aid — food distribution, housing allocation, dispute mediation among displaced persons",
    currentPurpose: "Political representation and economic defence for outer-ring residents against Consortium encroachment; increasingly, legal coordination",
    evolution: "Dormant for most of its history — a community body that managed local disputes and organised festival days. The Contract Dispute turned it into a political force inside six months.",
    currentLeader: {
      name: "Dael Orwen",
      characterisation: "A cargo-master turned association chair, elected because nobody else wanted the job and she was the only one who understood what the Consortium's contract terms actually meant. She has had to learn everything else on the move.",
      motivation: "She wants a negotiated settlement that gives outer-ring operators real berth access, not Consortium charity. She will take the audit route if negotiation is genuinely off the table.",
      vulnerability: "She is holding the association together through personal credibility. If the audit produces nothing, or is buried, she has no fallback.",
    },
    internalTension: "Older residents who remember the Quiet Decade and want any deal that returns stability versus younger residents who have only known the Contract Dispute and want the Consortium structurally restrained.",
    externalThreat: "The Consortium's legal resources. A protracted dispute costs the association money it does not have.",
    publicPerception: "Sympathetic victims of Consortium consolidation, to those who know. Invisible, to those who don't. Troublemakers, in Consortium-adjacent framing.",
    secretTruth: "Dael Orwen has the name of a Sector auditor who is interested in the bond documentation. She does not yet have the document itself. Someone on-station does — she just doesn't know who.",
    worldFlags: { prefix: "faction_outer_ring_" },
  },
];
```

---

## Past Conflicts

Conflicts leave residue. Not just in monuments and graveyards — in institutions that were
built to prevent recurrence, in policies that make no sense until you know what they were
responding to, in people who were on the wrong side and are still here.

```js
const pastConflictSchema = {
  id: string,
  name: string,
  when: string,
  parties: string[],          // who was involved
  cause: string,              // what started it
  outcome: string,            // how it ended
  unresolved: string[],       // what was not settled — feeds present tensions
  physicalEvidence: string[], // what can still be seen or found
  livingMemory: boolean,      // true = at least one person on-stage remembers it directly
  taboo: boolean,             // true = people actively avoid discussing it
  tabooReason: string,        // why (if taboo: true)
};
```

### Freeport Meridian Example

```js
gmState.worldHistory.pastConflicts = [
  {
    id: "the_level_three_riot",
    name: "The Level Three Riot",
    when: "~12 years ago",
    parties: ["Outer ring dockworkers", "Meridian Docking Consortium security", "Sector Docking Authority inspectors"],
    cause: "A Consortium security sweep of unofficial berths on Level 3, conducted without notice, damaged or confiscated equipment belonging to independent operators. Three dockworkers were injured in the resulting confrontation.",
    outcome: "Nominal: the Consortium agreed to a 48-hour notice period for security sweeps. Practical: four of the dockworkers involved were banned from Level 3 and above for six months. The ban was 'temporary'. It was never formally lifted.",
    unresolved: [
      "The four dockworkers were never compensated for confiscated equipment.",
      "The Consortium security officer who ordered the sweep was quietly promoted.",
      "The notice-period agreement is honoured in letter — 48 hours is given — but sweep scope expanded progressively. The notice became a formality.",
      "Two of the four banned dockworkers are still on-station, now outer ring association members.",
    ],
    physicalEvidence: [
      "Scuff marks and a patched section of wall on the Level 3 main corridor — the patch is slightly lighter than the surrounding material",
      "A memorial scratched into the underside of a loading platform — four names, a date",
    ],
    livingMemory: true,
    taboo: true,
    tabooReason: "The Consortium successfully framed it as a security incident rather than a labour dispute. Discussing it as a riot implies sympathy with the dockworkers, which carries professional risk on the upper levels.",
  },

  {
    id: "the_oxidiser_arbitration",
    name: "The Oxidiser Lease Arbitration",
    when: "~4 years ago",
    parties: ["Gareth Williams", "Meridian Docking Consortium (Level 2 leasing office)"],
    cause: "Gareth Williams, facing declining revenue from reduced foot traffic, petitioned for a lease reduction under the Compact Law hardship clause. The Consortium argued the hardship clause applied only to extractive operations, not hospitality.",
    outcome: "The arbitration found in the Consortium's favour on the technical legal question. Gareth's lease was not reduced. A payment schedule was agreed that gave him six months of relief. That schedule ended two years ago.",
    unresolved: [
      "Gareth is three months behind on the current lease rate.",
      "He has not petitioned again. He knows the result.",
      "The Consortium's Level 2 leasing officer visits The Oxidiser irregularly. Always orders something. Never causes a scene. Gareth is not certain whether this is oversight or a message.",
    ],
    physicalEvidence: [
      "The arbitration filing — a matter of public record in the Compact Law archive on Level 1",
      "The payment schedule agreement, posted in a drawer behind the bar",
    ],
    livingMemory: true,
    taboo: false,
    tabooReason: "",
  },
];
```

---

## Cultural Layer

Culture is not background colour. It is information — about who the people are, where they
came from, what they're afraid of, and what they take for granted. The cultural layer
populates the texture of NPC dialogue, environmental description, and the economy the player
operates within.

```js
gmState.worldHistory.culture = {

  language: {
    commonGreetings: [
      "'Dock safe' — standard among transit crews and anyone who works near vacuum",
      "'Cleared to berth' — used ironically to mean 'you are welcome here', heavy outer-ring usage",
    ],
    slang: [
      "'Consortium-spec' — euphemism for something technically functional but stripped of any actual quality",
      "'Level Five problem' — any issue that will be resolved in the Authority's favour",
      "'The Compact says' — used to precede any argument the speaker knows is doomed but legally correct",
      "'A Quiet Decade price' — something quoted at a rate that hasn't been realistic for years",
    ],
    tabooWords: [
      "Calling the Expansion Wars 'the wars' on the upper levels — the Consortium prefers 'the consolidation period'",
      "Saying 'riot' about the Level Three incident anywhere Consortium staff might hear",
    ],
    namesAndTitles: [
      "Portmaster is a formal title; calling Voss 'the portmaster' without the title is a deliberate slight",
      "Outer ring residents refer to the Docking Authority as 'Level Five' — location as dismissal",
      "'The Compact families' — referring to anyone whose family name appears on the founding plaques; said with varying degrees of irony",
    ],
  },

  customs: [
    {
      name: "The Founding Toast",
      description: "On the anniversary of the Compact signing, bars across the station serve a round in the six founding consortium colours — six differently coloured drinks. Nobody is certain the colours are historically accurate. Nobody cares. Gareth has run it at The Oxidiser for fifteen years. Attendance has dropped with the foot traffic.",
    },
    {
      name: "Docking day superstitions",
      description: "Transit crews do not bring new purchases aboard immediately after docking — they leave them at the berth for at least one sleep cycle, 'so the ship knows what's coming'. This has no practical effect and everyone knows it. Everyone does it anyway.",
    },
    {
      name: "The level line",
      description: "There is an unspoken social division between residents of Levels 1–3 (commercial, transit, administrative) and Levels 4–5 (outer ring, storage, maintenance). Crossing levels for work is unremarkable. Socialising across the level line is uncommon enough to be noticed.",
    },
  ],

  economy: {
    currency: "Standard Sector Credits — physical chit form common among outer ring traders who distrust the station's digital ledger (controlled by the Consortium)",
    primaryIndustry: "Transit services — docking, resupply, maintenance, crew rest",
    secondaryIndustry: "Information brokering. A station at the intersection of three trade routes hears everything. Some people charge for what they know.",
    blackMarket: [
      "Unofficial berth reassignments — a handshake economy that operates around the Consortium's preferred-trader system",
      "Compact Law jurisdiction shopping — using the founding charter's loopholes to conduct transactions that would require Sector Authority approval elsewhere",
      "Data chips with sensitive Consortium or Authority documentation — provenance unclear, demand consistent",
    ],
    tension: "The level-line economy: Level 1–3 businesses operate on Consortium-rate leases and serve higher-spending transit clientele. Level 4–5 operators run on lower margins with a more reliable but less lucrative local customer base. The Quiet Decade blurred this line; the Contract Dispute has redrawn it harder.",
  },

  technology: {
    level: "Mid-range interstellar standard. The station has functional jump-transit support infrastructure, medical facilities, and communications, but nothing cutting-edge.",
    unique: [
      "The Compact Law arbitration system — an anachronistic but legally valid alternative jurisdiction that predates Sector standardisation and has never been successfully superseded",
      "Level 2's original atmospheric filtration system — older than the Refit, maintained by muscle memory and a manual that exists in one copy behind the engineer's station on Level 2",
    ],
    lost: [
      "The original Expansion Wars-era emergency beacon array — replaced during the Refit with Sector-standard equipment. Several outer-ring residents claim the old array had a frequency the new one cannot replicate, useful for a signal type they will not specify.",
    ],
    cuttingEdge: [
      "Inspector Torr's documentation system — Sector-standard audit technology that is notably more sophisticated than anything the Consortium has access to, and they have noticed",
    ],
  },
};
```

---

## The "Before" Snapshot

The Before Snapshot captures the world the day before the adventure begins — not as history,
but as present tense. It is the texture of ordinary life that the adventure will disrupt. The
GM builds it from the epoch and power structure data, then seeds it into the opening scene.

```js
const beforeSnapshotSchema = {
  normalDay: string,       // what a typical day looks like — the rhythm before disruption
  simmeringTensions: [     // things that are wrong but have not yet broken
    { tension: string, proximity: string }  // proximity: "days" | "weeks" | "months"
  ],
  aboutToBreak: string,    // the specific thing that will not hold — the inciting incident
  whoKnows: string,        // who is already aware that something is coming
  signs: string[],         // things a perceptive person might have noticed already
};
```

### Freeport Meridian Example

```js
gmState.worldHistory.beforeSnapshot = {
  normalDay: "Morning on Level 2 means the transit crew shift change — the overnight arrivals filing off their berths toward the food stalls, the day traders setting up, the Authority compliance check at Berth 7 that happens every Tuesday regardless of whether there is anything to check. Gareth Williams opens The Oxidiser at 0900, which is when the people who worked all night need somewhere to be that isn't the berth or the bunkhouse. He pours the first drink himself. He has done it every morning for fifteen years.",

  simmeringTensions: [
    {
      tension: "Gareth is three months behind on his lease. The Level 2 leasing office has sent two written notices. A third notice triggers a formal review, which triggers Consortium involvement at a level where informal resolution becomes impossible.",
      proximity: "days",
    },
    {
      tension: "Inspector Torr has the bond documentation. He has not filed his report. He is waiting for something — either confirmation of what he suspects, or a reason not to proceed.",
      proximity: "weeks",
    },
    {
      tension: "Dael Orwen has scheduled a meeting of the Outer Ring Residents' Association for the end of the month. The agenda item she has not published is a vote on whether to proceed with legal action against the Consortium. She needs the bond documentation to make the case. She does not have it yet.",
      proximity: "weeks",
    },
    {
      tension: "The Consortium's two pro-settlement council seats are planning to request an emergency session. The two consolidation seats know this. The meeting has not been requested yet, but both sides are positioning.",
      proximity: "months",
    },
  ],

  aboutToBreak: "A cargo manifest filed with the Docking Authority last night does not match the physical inventory at Berth 12. The discrepancy is small enough to be clerical error. It is not clerical error. Someone has moved something, or someone has paid someone to record something that didn't happen. By midday, the Authority will have flagged it. By evening, it will involve people who do not want it to involve them.",

  whoKnows: "Portmaster Voss was informed at 0600 — the automated flag goes to her office first. She has not yet decided what to do with the information. Inspector Torr does not know yet. Gareth Williams does not know yet, but the person who filed the false manifest will be at The Oxidiser this morning. They always are when they're nervous.",

  signs: [
    "Berth 12 had its lighting replaced last week — a maintenance job that required the corridor cameras to be offline for six hours. The timing was a coincidence. Probably.",
    "Three regular Level 2 traders have not been in The Oxidiser for the past week. Gareth noticed. He has not mentioned it.",
    "The Level 2 leasing officer's visit last Thursday was unusual — she stayed for forty minutes and spoke to two people Gareth didn't recognise before ordering her drink.",
    "A data chip was left under a glass at The Oxidiser's bar two days ago. The customer who left it did not return. Gareth kept it in his drawer. He has not looked at it.",
  ],
};
```

---

## Environmental Memory

The physical world carries history. The GM reads history into environments not through
exposition but through specific, observable detail — the kind of thing a character would
notice without being told what it means. The player may ask. NPCs may explain. Or it may
simply accumulate as texture.

### Architecture tells stories

Buildings and spaces are built by someone, for a purpose, at a point in time. When those
things change, the architecture shows the seam.

- **Freeport Meridian:** The Level 1 and 2 corridors use heavier-gauge metal, wider
  archways, and structural ornamentation that the Refit-era construction above Level 3
  abandoned entirely. The older sections feel different — more deliberate, built to impress
  as well as function. The newer sections feel standard. Many residents prefer the old sections
  without knowing exactly why.
- **Gareth's bar, The Oxidiser:** The sign is original — the same one from when he opened
  during the Quiet Decade. The lettering has been re-painted twice. The frame is the original
  metal, and it has small scratches along the lower edge where the door used to stick before
  he had the hinge replaced.

### Damage tells stories

What has been broken, patched, burned, or repaired is as informative as what was built.

- **Freeport Meridian:** The Level 3 corridor patch — slightly lighter than the surrounding
  wall — is visible to anyone who walks past it. It is not labelled. It does not need to be,
  for people who know what happened there. For everyone else it is simply a patch.
- **The Oxidiser:** One of the bar stools has a different leg than the other three — a
  different metal, a slightly different colour. It was replaced. Gareth does not volunteer
  why. The answer involves a customer who is no longer welcome, and a night that is not a
  story he tells.

### Absence tells stories

Empty spaces, unused infrastructure, and vacancies carry as much weight as what occupies them.

- **Freeport Meridian:** The empty units on Level 2 — six of them, dark shopfronts with
  old signs still mounted, some with stock displays that were never fully cleared. Each one
  has a name above the door. Each name is a business that did not survive the Contract Dispute.
  Gareth knows whose they all were.
- **The Oxidiser:** The three stools at the far end of the bar that are never occupied — not
  because they are reserved, but because that end of the bar got the reputation as where you
  sit if you want to be left alone. The reputation has its own history.

### Nature tells stories

On a space station, nature is what grows without permission — rust, corrosion, the biological
weight of a structure that has been inhabited for three centuries.

- **Freeport Meridian:** Level 4 has a culture of corridor gardens — small plots growing
  in repurposed cargo containers, tended by residents as a community activity. The practice
  started during the Expansion Wars as food supplementation. It has no practical necessity
  now. It persists because the people who started it taught their children, and their children
  taught theirs. The Consortium considers it a sanitation concern. They have not yet pushed
  the point.
- **The Oxidiser:** There is a crack in the corner of the bar's back wall where the two
  panel sections meet. A thin green line of something biological — not harmful, just persistent
  — has established itself in the crack. Gareth has tried to remove it three times. It keeps
  returning. He has stopped trying.

---

## The Iceberg Rule

Generate ten times more history than the player will ever see. The depth is not waste — it
is the structural integrity that makes the surface convincing. A world whose history can be
exhausted in three questions is a world whose NPCs run out of things to know, whose
environments run out of things to imply, whose conflicts run out of stakes.

The player encounters the surface. The GM holds the iceberg.

### How history reaches the surface

**Player questions.** An NPC who has lived in the world knows its history personally. When
a player asks Gareth about the Level Three Riot, he does not deliver an exposition summary —
he tells the story the way a person who was on Level 2 when it happened tells a story. Partial.
Filtered through what he saw and what he felt. Missing the parts he wasn't there for.

**NPC references.** History surfaces in passing — in the slang someone uses, in the toast
they make, in the name they won't say, in the assumption they make about what the player
already knows. Gareth says 'Consortium-spec' about a drink he doesn't rate. He does not
explain the phrase. The player can ask.

**Environmental evidence.** The Level 3 patch, the empty units, the darker metal of the old
corridors — these are visible without explanation. The player may investigate or may walk past.
Either is valid. The history is there whether the player pulls on it or not.

**Lore-codex discoveries.** Formal historical entries unlock through specific player actions —
examining the founding plaques, reading the arbitration record, finding a data chip. The
lore-codex surfaces structured history; the world surfaces felt history. Both are valid
access points. Neither spoils the other.

**Story thread connections.** When the player engages with the main conflict, its historical
roots become relevant. Understanding that the bond documentation exists, and why it was
structured the way it was, reframes what the Consortium actually is. The history is not
backstory — it is the explanation for why the present situation exists and why it is so
difficult to resolve.

### Surfacing rules

- **Never lecture.** History in dialogue comes in fragments, not summaries. NPCs know their
  piece of it — rarely the whole.
- **Never over-explain.** A detail that the player understands without explanation is more
  effective than one that comes with its own footnote.
- **Never withhold when asked.** If the player asks directly, the NPC answers — filtered
  through their perspective and knowledge limits, but answers.
- **Never make all history accessible.** Some things are genuinely lost. Some things are
  known only to people the player may never meet. Some things are documented in the
  portmaster's archive, which the player may never access. The world has things it doesn't
  share.

---

## Generation Process

Build world history in this order. Each step feeds the next.

### Step 1 — Current era

What is the world the day the adventure starts? Identify the central conflict, the tension
that cannot hold, and the faction or institution driving events. This is the most recent
epoch. Everything else is built backwards from here.

*Freeport Meridian: The Contract Dispute. The Consortium consolidating. The outer ring
organising. Something in a cargo manifest that has caught the wrong kind of attention.*

### Step 2 — Inciting incident

What event, within living memory, started the chain that produced the current era? This is
usually the second-to-last epoch — close enough that people who were there are still around.

*Freeport Meridian: The Great Refit bond and its deliberate default — a financial arrangement
structured to give the Sector Authority leverage in exchange for backing the Consortium's
internal monopoly. Eight years of contract dispute flow directly from the Authority's
willingness to back the Consortium because of that arrangement.*

### Step 3 — Work backwards (3–5 epochs total)

Add two to three more epochs, moving further into the past. At each step, ask:
- What produced the inciting incident?
- What institutions existed before the current ones?
- What was lost that people still miss, or lost that nobody mourns?
- What is contested — where do different factions disagree about the past?

Oldest epochs may be mythic, partially documented, or archaeologically inferred. That is
appropriate — the world does not know its own complete history.

### Step 4 — Power structures

For each major organisation currently active, trace its founding to one of the epochs. Track
the drift between original purpose and current purpose. Populate `currentLeader` with
someone who is a product of the structure's history, not just an occupant of a title.

### Step 5 — Cultural layer

Derive slang, customs, and economic texture directly from the epoch consequences. The
Founding Compact toast comes from the first epoch. The 'Level Five problem' slang comes from
the Great Refit. The level-line economy comes from the Expansion Wars and was redrawn by the
Contract Dispute. Culture is compressed history.

### Step 6 — Before Snapshot

Write the world as a single ordinary morning — the texture of normal life — and then
layer the specific tensions that will not hold. Identify the one thing that is about to
break. Identify who already knows. Plant the signs.

### Step 7 — Seed environmental details

Assign at least one physical detail to each epoch and each past conflict. These become the
environmental memory that scene descriptions draw from — the patch on the wall, the empty
units, the sign with the original metal frame.

---

## gmState Integration

The World History module adds a single structured key to `gmState`:

```js
gmState.worldHistory = {

  // Historical Epoch System
  epochs: [],              // epochSchema[] — 3–5 epochs, ordered oldest to newest

  // Current era summary (derived from most recent epoch)
  currentEra: {
    name: string,          // e.g. "The Contract Dispute"
    summary: string,       // one-sentence present-tense description of the world
    centralConflict: string,
  },

  // Calendar and time reference
  calendarSystem: {
    name: string,          // e.g. "Sector Standard", "Station Rota Year"
    epoch: string,         // what year zero refers to
    currentYear: string,   // how the world refers to now
  },
  startDate: string,       // the in-world date on Scene 1, Day 1

  // Power Structure Genealogy
  powerStructures: [],     // powerStructureSchema[]

  // Past Conflicts
  pastConflicts: [],       // pastConflictSchema[]

  // Cultural Layer
  culture: {
    language: {
      commonGreetings: string[],
      slang: string[],
      tabooWords: string[],
      namesAndTitles: string[],
    },
    customs: [{ name: string, description: string }],
    economy: {
      currency: string,
      primaryIndustry: string,
      secondaryIndustry: string,
      blackMarket: string[],
      tension: string,
    },
    technology: {
      level: string,
      unique: string[],
      lost: string[],
      cuttingEdge: string[],
    },
  },

  // Before Snapshot
  beforeSnapshot: {
    normalDay: string,
    simmeringTensions: [{ tension: string, proximity: string }],
    aboutToBreak: string,
    whoKnows: string,
    signs: string[],
  },
};
```

### World Flag Prefix

The World History module uses prefix `hist_` for flags it sets directly. Examples:

```
hist_epoch_founding_compact_known     // player has learned the founding terms
hist_bond_documentation_found         // player has located the bond document
hist_level_three_riot_known           // player knows about the riot
hist_outer_ring_legal_action_filed    // outer ring has moved to formal proceedings
hist_portmaster_told_about_manifest   // portmaster has been directly confronted
```

### Relationship to Lore Codex

World history is the GM-internal iceberg. The lore-codex is the player-facing surface. When
a player discovers historical information, the GM creates a lore-codex entry from the
relevant epoch, power structure, or past conflict data. The codex entry is not a summary of
the underlying data — it is what that particular discovery revealed, from that particular
angle, at that particular moment.

The same historical event may produce multiple codex entries with different framings depending
on how the player encountered it — an NPC's account, an official document, and a scratched
memorial tell different parts of the same story.

### Relationship to Story Architect

The Story Architect's Act 2 reversal is almost always rooted in world history. The player
believes they understand the conflict; history reveals a layer they did not account for.

In Freeport Meridian: the player investigates the manifest discrepancy as an apparent
smuggling operation. The Act 2 reversal is that the discrepancy is not smuggling — it is
the outer ring moving people through unofficial channels, using the very berth-reassignment
network the player may have already encountered. The player's investigation has endangered
the operation. The history of the Expansion Wars, the refugee origins of the outer ring, and
the current Contract Dispute all converge at that moment. None of it would land without the
history behind it.

### Relationship to AI NPC

Every NPC with a significant role carries a fragment of world history. The AI NPC module's
`knowledge.knows` array should include the historical facts relevant to that character —
what they lived through, what they were told, what they have pieced together, and what they
believe. Historical knowledge is personal. Gareth Williams knows the Level Three Riot through
the eyes of someone who was serving drinks two levels away and heard about it from a dockworker
who came in shaking. He knows the Quiet Decade as the years when his lease made sense. His
history is not objective. It is his.

---

## Anti-Patterns

- Never deliver history as exposition. An NPC who recites a timeline is not a person — they
  are a plot convenience. History surfaces through lived experience, overheard fragments, and
  environmental observation.
- Never make all history equally accessible. Things that are suppressed should be harder to
  find. Things that are contested should produce contradictory accounts. Things that are truly
  lost should remain lost.
- Never contradict epoch-established facts mid-adventure. The history was built before play
  began; it does not change retroactively. If new information reframes events, it must be
  consistent with everything already established.
- Never create history that does not connect to the present. Every epoch must have at least
  one consequence that is still visible today. History with no living consequences is
  backstory without purpose.
- Never make contested history resolvable by the player in a single scene. Contested history
  is contested because the evidence is ambiguous, the witnesses are compromised, or the truth
  is genuinely complicated. Resolution, if it comes, should cost something.
- Never skip the Before Snapshot. The world must have a texture of normality before the
  adventure disrupts it — otherwise the disruption has nothing to disrupt.
- Never generate history in the abstract. Every epoch needs a physical artifact and an NPC
  consequence — something the player can see and someone whose life it shaped.
- Never treat living memory as reliable. People who were there remember what they saw and
  what they felt, filtered through what they have concluded since. Living memory is evidence,
  not fact.
- Never surface more than two pieces of historical information in a single scene. History
  accumulates through the adventure — it is not delivered in blocks.
- Never use world history to frontload lore-codex entries. Codex entries earn their discovery.
  History that arrives as a data dump before the player has asked anything is wasted.
