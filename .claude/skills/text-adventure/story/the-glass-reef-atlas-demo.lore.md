---
format: text-adventure-lore
version: 1
skill-version: "1.3.0"

title: "The Glass Reef Atlas"
subtitle: "A Salvage-Mystery on the Shattersea Frontier"
description: >
  On the night a live atlas shard comes to auction under emergency law,
  cartographer Callis Dray vanishes. In Cinder Anchorage, a harbour welded from
  wrecks at the edge of the Shattersea, every faction wants the shard, every
  ledger lies, and every safe route may be killing someone out of sight. To go
  looking is to descend into the living Glass Reef, where memory can be edited,
  danger is only ever moved, and the future of the frontier may hinge on who is
  forced to bear the cost of safety.
author: "Gareth Williams"
theme: space
tone: mystery
acts: 1
episodes: 1
estimated-scenes: "7-9"
players: "1"
difficulty: hard
pacing: slow
edited: true
demo: true

recommended-styles:
  output: Sci-Fi-Narrator
  visual: holographic

seed: "glass-reef-atlas-31"
rulebook: d20_system

calendar-system: "Anchorage Drift Reckoning (26-hour tide cycle)"
start-date: "Cycle 403.19"
start-time: "21:00"

pre-generated-characters:
  - name: "Rian Vale"
    class: "Cartographer"
    pronouns: "he/him"
    stats: { STR: 9, DEX: 13, CON: 10, INT: 16, WIS: 14, CHA: 12 }
    hp: 10
    ac: 12
    openingLens: "rian"
    prologueVariant: "pregen_rian"
    hook: "Callis Dray trusted you with a route fragment, a warning about the quay, and a promise you reached too late."
    background: >
      You made your name charting quiet dangers for crews who could not afford
      licensed pilots. You know how to read panic in a ship log, how to tell
      when a safe route has started lying, and how long guilt can stay lodged in
      a person's hands after the wrong delay.
    proficiencies: ["Investigation", "Navigation", "Insight", "Perception"]
    starting-inventory:
      - { name: "Folded route-slate", type: "key_item", effect: "Compares live routes against known charts" }
      - { name: "Pressure hood", type: "gear", effect: "Protects against brief hull exposure" }
    starting-currency: 90
  - name: "Suri Kade"
    class: "Reef Diver"
    pronouns: "she/her"
    stats: { STR: 12, DEX: 15, CON: 13, INT: 11, WIS: 13, CHA: 10 }
    hp: 12
    ac: 13
    openingLens: "suri"
    prologueVariant: "pregen_suri"
    hook: "The Wakebound will lend you the Borrowed Tide if you bring back more than excuses from the berth that failed on your watch."
    background: >
      You grew up on improvised docks, breathing recycled air and learning that
      courage is often just labour with better stories told about it. Some of
      the outer-moorings crews still call you family. Others remember exactly
      which shift taught you to leave before the hull finished teaching harder.
    proficiencies: ["Athletics", "Stealth", "Survival", "Perception"]
    starting-inventory:
      - { name: "Wakebound dive rig", type: "gear", effect: "Lets you work exposed hulls and flooded compartments" }
      - { name: "Glass hook", type: "weapon", effect: "Tool and weapon for climbing raw reef surfaces" }
    starting-currency: 55
  - name: "Mara Ilex"
    class: "Choir Defector"
    pronouns: "they/them"
    stats: { STR: 8, DEX: 12, CON: 11, INT: 14, WIS: 15, CHA: 14 }
    hp: 9
    ac: 11
    openingLens: "mara"
    prologueVariant: "pregen_mara"
    hook: "You know one stanza of the forbidden route-song, and one patient at Salt Wound still remembers the part you played in teaching it."
    background: >
      You were taught to preserve memory as prayer. Then you learned some hymns
      were written to edit the living, not honour the dead. Someone inside the
      hospice once covered your exit. You do not know whether they bought you
      time, silence, or both.
    proficiencies: ["Insight", "Persuasion", "Medicine", "Lore"]
    starting-inventory:
      - { name: "Resonance veil", type: "gear", effect: "Helps you hear signal drift inside memory storms" }
      - { name: "Choir signet", type: "key_item", effect: "Grants narrow access to hospice and reliquary spaces" }
    starting-currency: 70

required-modules:
  - core-systems
  - bestiary
  - story-architect
  - ship-systems
  - crew-manifest
  - geo-map
  - procedural-world-gen
  - lore-codex
  - world-history
  - ai-npc
  - pre-generated-characters

optional-modules:
  - star-chart
  - atmosphere
  - audio
  - save-codex
---

## World History

### Epoch 1 - The Nacre Survey
- **Era:** Pre-human mnemonic engineering
- **Key event:** The Nacre civilisation threaded the Shattersea with living route-lattices, memory vaults, and tuned glass growth that responded to chorus-frequency rather than command code.
- **Power structure:** Survey choristers and vault keepers. Knowledge was territorial and sung into matter.
- **Legacy:** The Glass Reef still hums with half-failed route-song. Dead apertures wake without warning. Nacre glyphs bloom like frost under certain wavelengths.
- **Cultural detail:** Reef-workers still say, "The glass remembers first," when someone is slow to trust a clean explanation.

### Epoch 2 - The Lantern Rush
- **Era:** Settlement and salvage boom
- **Key event:** Independent captains discovered stable outer routes and welded a harbour out of burned haulers, refinery shells, and shrine modules. That improvised port became Cinder Anchorage.
- **Power structure:** Free captains, salvage co-ops, and debt-sharing crews. No law held longer than the next shortage, but mutual aid was real.
- **Legacy:** Every dock wall bears old claim marks. The oldest berths are named for ships, not owners. Emergency bells still ring the count of vessels that failed to return on a shift.
- **Cultural detail:** A new crew member is expected to leave one tool, one coin, or one prayer at the return bell before their first deep run.

### Epoch 2.5 - The Parliament Drift
- **Era:** Early civic experiment between salvage mutual aid and licensed enclosure
- **Key event:** After the first rush years became too large for handshake law, berth stewards, convoy captains, kitchen organisers, and bell keepers formed a chamber beneath the old anchorage core to rotate route burden, publish casualty tallies, and keep no district permanently sacrificial. That chamber later became the Sunken Parliament.
- **Power structure:** Delegated speaking crews, rotating burden boards, public casualty accounting, and a fragile expectation that legitimacy required visibility.
- **Legacy:** Bell timing patterns, witness suppers, and some Wakebound customs are leftovers from Parliament procedure rather than folklore. The chamber itself was later flooded, damaged, and deliberately misremembered.
- **Cultural detail:** Older mooring families still say "count it where all can hear" when they mean a decision should not stay private.

### Epoch 3 - The Charter Pacification
- **Era:** Regulation and enclosure
- **Key event:** After three consecutive mass-loss seasons, the Parliament order fractured under panic, sabotage, and blame. Insurers, market houses, and senior captains then formed the Charter of Soundings, licensing safe routes and charging everyone else for the right to survive.
- **Power structure:** Licensed salvage guilds backed by contract law, market finance, and berth control.
- **Legacy:** Checkpoints, permit vaults, emergency powers, a permanent split between licensed crews and the Wakebound who still work outside the system, and a public story that the Parliament was naive chaos rather than an order deliberately replaced.
- **Cultural detail:** Charter officers call permits "protection." Wakebound divers call them "fences built around oxygen."
- **Contested memory:** The Charter teaches that it ended the death spiral. The Wakebound teach that it priced the poor out of safety and renamed exclusion as order.

### Epoch 4 - The Long Low Tide
- **Era:** Unstable present
- **Key event:** Stable routes have begun collapsing. Fresh songs appear in dead sectors. The Null Shepherds raid supply chains, and entire crews vanish after following charts that were safe for decades.
- **Power structure:** A brittle compromise between Charter officials, Concord brokers, Velvet Choir archivists, and Wakebound labour the compromise cannot function without.
- **Legacy:** Black-market charts, rationed launches, panic-buying of seals and meds, and a growing belief that the Reef itself is changing faster than institutions can respond.
- **Cultural detail:** Nobody in Cinder Anchorage says "safe passage" anymore. They say "cheap passage," "paid passage," or "lucky passage."

## Setting Assumptions

- **The Shattersea is vacuum, not ocean.** People call it a sea because routes drift, fail, and return like weather, and because harbour culture outlived precise technical language.
- **The tide cycle is navigational.** "Low tide" and "high tide" refer to aperture rhythm, route exposure, and reef responsiveness across the 26-hour cycle, not literal water movement.
- **The anchorage feels damp because it is industrially wet.** Condensation, coolant brine, scrubber runoff, rope fibres, med humidity, and refinery lungs make inhabited spaces smell like salt and metal even though the void outside is hard vacuum.
- **Most walked spaces have local gravity or magnetic footing.** Exterior work, derelicts, and deep-reef structures do not always honour those assumptions.
- **When the text uses pressure like weather, it is partly literal and partly cultural.** Hull integrity, crowd load, signal stress, and civic panic are spoken about in one vocabulary because the setting lives where engineering and politics keep failing together.

## Historical Memory

### What Different Generations Think Happened

- **Lantern Rush families:** Remember the anchorage as a place where risk was ugly but mutual, and still talk about ships by crew name rather than ownership chain. They believe the Charter took emergency customs, froze them into law, and then charged everyone for remembering them.
- **Pacification generation officials:** Came of age during mass-loss seasons and sincerely believe gatekeeping saved the port from collapse. They talk about the Parliament as a brave but unserious experiment because admitting otherwise would make the present order look elective rather than necessary.
- **Choir and hospice memory workers:** Inherit the past as damaged testimony, edited ritual, and half-cleaned grief. They tend to believe history was not wholly falsified so much as made survivable for power.
- **Pilgrim witnesses and convoy drifters:** Do not treat Cinder Anchorage as uniquely tragic. To them it is one compromised port among many, which makes local elites sound provincial whenever they pretend this crisis is unprecedented.
- **Anchorage-born young adults:** Grew up with blackouts, delay, scrip erosion, and closed routes as the normal shape of life. They are less nostalgic than their elders and more willing to believe every institution is simultaneously necessary and rotten.

### Words That Mean Different Things Depending on Who Says Them

- **Order:** To Charter staff, predictable routing; to Wakebound, a claim about who gets protected first; to Pilgrims, a promise tested only by whether the weak still count.
- **Mercy:** To the Choir, curated care; to Furnace Row, food without humiliation; to Concord, a public-relations cost center unless someone forces it to matter.
- **Witness:** To Daxa and the Pilgrim Chain, evidence carried by people; to officials, a destabilising category that must be formalised before it spreads.
- **Loss:** To brokers, priced risk; to rescue crews, names and missing seats; to old mooring families, a civic debt that compounds if left uncounted.
- **Commons:** To idealists, shared burden; to hardliners, undisciplined access; to people already surviving behind the counters, the thing the city is secretly doing whenever it forgets to call itself lawful.

## Location Atlas

### Cinder Anchorage - Ember Quay
- **Type:** Dock concourse, social hub, auction floor
- **Description:** Ember Quay is a crescent of welded hull plates and amber work-lamps wrapped around the anchorage's oldest berths. Cargo lifts hang like teeth over the water-black void, and every visible surface carries soot from the furnaces that keep the port alive. Tonight the quay is crowded, half-market and half-wake.
- **Atmosphere:** Hot metal and salt ozone. Ship bells, bootfalls on grating, the low hiss of shutters preparing for blackout.
- **Exits:** Sounding House (east), Coalglass Market (north), Wakehold pressure docks (south), outer moorings and launch clamps (west)
- **NPCs present:** Oren Silt, auction brokers, berth guards, unlicensed crews waiting to see who gets priced out next
- **Secrets:** A ballast tunnel runs behind the customs shrine and resurfaces beneath berth seven. Oren knows the latch; the Charter forgot the old emergency schematics ever mattered.
- **Hazards:** Crowd crush during the auction, blackout shutters that can seal sections without warning, easy ambush lines from the crane gantries
- **Story relevance:** Opening scene, first atlas shard, first public clash between every major faction

### Outer Moorings and the Return Bell
- **Type:** Refuge berth, rescue pier, civic memory point
- **Description:** Beyond the main concourse, the outer moorings stretch into colder dark where old rescue craft, drifting hospice barges, and debt-crushed tramp hulls wait for inspection that may never come. A skeletal bell tower rises from the oldest spar, and every shift its bronze throat counts who came back, who did not, and who was never entered on any official ledger.
- **Atmosphere:** Cold wind through rigging, triage lamps, damp rope, coolant steam, exhausted prayers muttered without ceremony.
- **Exits:** Ember Quay (east), rescue pier (south, restricted), bell tower stairs (up), launch clamps and refugee gangways (west)
- **NPCs present:** Daxa Thorn, Havel Pike, rescue tug crews, displaced families from the Pilgrim Chain, med-runners waiting on berth priority
- **Secrets:** The bell tower contains a hidden archive of casualty tallies, erased manifests, and route obituaries that never reached the Sounding House. Daxa has been preserving a second history of the anchorage in grease pencil, brass shims, and names no broker can turn into inventory.
- **Hazards:** Hull-to-hull crushes during panic docking, pressure-seal failures on refugee ships, armed inspections when the Charter decides scarcity needs witnesses
- **Story relevance:** Fastest way to show the human cost of route collapse, first doorway into the Seventh Bell arc, and the place where the wider frontier physically arrives at Cinder Anchorage

### The Sounding House
- **Type:** Guildhall, permit office, political fortress
- **Description:** The Sounding House was once a salvage chapel and still looks like one if you squint past the counters, ledgers, and permit locks. Brass route-rings hang from the ceiling above a marble floor cracked by decades of boots and arguments. Its upper gallery watches the quay like a courtroom.
- **Atmosphere:** Waxed brass, dry paper, recycled chill. Voices fall quiet here unless they are trying to become policy.
- **Exits:** Ember Quay (west), permit vault mezzanine (up, restricted), berth records office (north), emergency service tunnels (sealed, below)
- **NPCs present:** Sael Vane, Dr. Halek Ves, clerks, licensed pilots, hired guards
- **Secrets:** Sael keeps two ledgers: one public, one real. The mezzanine vault contains a confiscated cache of unlicensed route fragments and evidence the Concord has been bidding on both sides of the shortage.
- **Hazards:** Social exposure, surveillance, armed response if the permit vault is breached
- **Story relevance:** Source of official truth, false truth, and the records that prove the dock leak reaches higher than anybody wants admitted

### Coalglass Market
- **Type:** Trade quarter, black market, supply choke-point
- **Description:** Coalglass Market sprawls through a ribbon of semi-transparent stalls grown from heat-shocked reef glass and reinforced with salvage lattice. Underlit counters show everything and nothing: med gels, forged seals, prayer scraps, sensor mesh, preserved fruit from somewhere with actual sunlight. Prices shift by the hour and sometimes by the face looking at them.
- **Atmosphere:** Spice oil, coolant stink, close voices. Glass beads clicking against one another like rain inside a skull.
- **Exits:** Ember Quay (south), Choir Steps (east), smuggler crawlways (hidden, below), Concord counting rooms (north, controlled)
- **NPCs present:** Tamsin Reed, Brin Roe, fence-merchants, debt collectors, chorus brokers
- **Secrets:** One stall sells counterfeit charts that are not counterfeit at all. Another rents memories disguised as salvage insurance.
- **Hazards:** Pickpockets, pressure gangs, counterfeit meds, faction watchers looking for leverage
- **Story relevance:** Best place to solve a problem badly, profitably, or both

### Choir Steps and Salt Wound Hospice
- **Type:** Memory hospice, shrine-complex, secret archive
- **Description:** The Choir Steps descend around a cylindrical wound in the anchorage hull where the Reef once touched bare metal and fused itself to it. The hospice clings to that wound in layered curtains, mirrored rails, and prayer-speakers that murmur to the dying and the sleepless alike. The Velvet Choir keeps its grief polished.
- **Atmosphere:** Incense cut with antiseptic. Soft humming in the walls, warm breath from med pumps, velvet under the fingertips where it should be steel.
- **Exits:** Coalglass Market (west), undertide crypt (below, sealed), hospice wards (north), pilgrim landing (east)
- **NPCs present:** Mother Ioris, Yara Sunfold, choir attendants, mourners, quiet pilgrims
- **Secrets:** The undertide crypt contains edited memory reliquaries and one forbidden stanza that can harmonise a live route-song. Yara suspects the missing reliquary was stolen to reach the Vault, not to sell.
- **Hazards:** Emotional manipulation, memory contamination, devotional crowds that can turn hostile if the Choir feels profaned
- **Story relevance:** Moral pressure point of the setting; where the player learns memory is currency, medicine, and weapon

### Wakehold Pressure Docks
- **Type:** Co-op habitat, machine yard, launch bay
- **Description:** Wakehold is what remains when people keep repairing a place after the people with permits stop counting them. Its bulkheads are patched with different centuries of salvage, its gantries lean at suspicious angles, and its pressure docks are busier than any official berth ledger admits. Here, everything useful looks borrowed and everything borrowed has a story.
- **Atmosphere:** Welding flash, brine, cheap food, engine grease. Laughter that sounds like defiance more than joy.
- **Exits:** Ember Quay (north), Borrowed Tide dock (south), co-op dorms (east), maintenance hollows (hidden, west)
- **NPCs present:** Imra Quill, Nivek Ash, co-op mechanics, riggers, exhausted shift crews
- **Secrets:** The Wakebound maintain unlicensed reef routes marked by touch-signs instead of nav data. One of those routes reaches the Latchkey Stair faster than the Charter charts, but only if the player trusts people with no legal claim to be alive there.
- **Hazards:** Structural failures, improvised power lines, retaliatory Charter inspections
- **Story relevance:** Main ally base if the player sides with labour or simply values competence over paperwork

### Bell Tower Archive
- **Type:** Hidden record vault, civic reliquary, evidence chamber
- **Description:** The archive occupies the inside skin of the old return bell tower, packed into maintenance hollows, counterweight cavities, and sealed lamp lockers. It is not elegant. It is careful. Ledger slips, captain tags, hand-copied route losses, and unofficial burial counts hang from wires like a second nervous system for the anchorage.
- **Atmosphere:** Lamp heat, brass dust, old paper oil, the soft knock of the bell mechanism taking up tension.
- **Exits:** Outer Moorings stairs (down), dead lamp crawlspace (north, hidden), emergency signal conduit (up, jammed)
- **NPCs present:** Usually Daxa Thorn alone; later, anyone desperate enough to need proof more than permission
- **Unlock condition:** Earn Daxa's trust, steal a bell key, or trace the erased manifests through Sael's private ledger
- **Secrets:** The archive proves that ghost crews have been left alive on paper for debt, legal precedent, and insurance manipulation. It also contains the first surviving reference to the Sunken Parliament.
- **Hazards:** Structural weakness, politically explosive evidence, pursuit if the Charter realises what was preserved here
- **Story relevance:** Core node for the Lockdown Ledger branch, the Seventh Bell arc, and any campaign that uses civic evidence instead of deep-reef access to change the world

### Furnace Row and Ration Kitchens
- **Type:** Worker quarter, food line, morale front
- **Description:** Furnace Row runs beneath the quay furnaces and beside old refinery lungs that now vent enough heat to keep communal kitchens alive. This is where shifts end, grudges spread, strike talk becomes practical, and the anchorage remembers that nobody can eat an ideology without stew around it.
- **Atmosphere:** Broth steam, weld heat, card games, cheap spirits, arguments interrupted whenever the ration bell rings.
- **Exits:** Clamp-Rail Spine, Wakehold alleys, berthside sleeping tiers, ash chutes up toward the furnaces
- **NPCs present:** Edda Brine, Nera Coil, casual labourers, kitchen volunteers, debt collectors careful not to arrive alone
- **Secrets:** Kitchen ledgers are sometimes better than shipping ledgers for measuring real crisis. Edda can tell which district is about to break by who starts watering the broth first.
- **Hazards:** Food riots, grease fires, political recruitment, exhausted people one bad sentence away from collective action
- **Story relevance:** Core node for Commons Tide and Harbour Breaks campaigns, while also giving the setting a working-class heartbeat that makes economy, hunger, and morale materially visible

### Clamp-Rail Spine
- **Type:** Transit backbone, labour bottleneck, moving social stage
- **Description:** The Clamp-Rail Spine is a network of cargo cages, hand-winched trams, pressure lifts, and maintenance walkways that bind the anchorage's districts together. It is loud, always half-overloaded, and impossible to govern cleanly because everything important eventually passes through it in a crate, a stretcher, or a bad mood.
- **Atmosphere:** Metal screech, brake sparks, shouted manifests, grease, overheard deals that were meant for one platform farther down.
- **Exits:** Ember Quay, Sounding House service level, Furnace Row, Outer Moorings, Coalglass back platforms
- **NPCs present:** Shift crews, clamp operators, inspectors, runners, thieves too poor to look criminal in daylight
- **Secrets:** Whoever controls the Spine controls delay, and delay is often worth more than ownership. Several recent "accidents" were timed well enough to look like policy.
- **Hazards:** Crowd crush, dropped cargo, sabotage, transit curfews that strand the wrong people at the wrong hour
- **Story relevance:** Makes local travel visible, political, and interruptible; ideal for strikes, chases, riots, and quiet logistics play

### Pilgrim Landing
- **Type:** Refuge intake pier, shrine-dock, frontier witness point
- **Description:** Attached to the outer moorings by a flexing bridge and too few customs lights, Pilgrim Landing receives shrine barges, hospice hulls, and family ships with nowhere better left to aim. The berths are marked by prayer ribbons, quarantine paint, and the kind of careful silence that only exists where everyone is waiting for bad news to become official.
- **Atmosphere:** Salt air, med alcohol, hymn fragments from cheap speakers, children trying not to sound hungry.
- **Exits:** Outer Moorings, hospice transfer bridge, quarantine sheds, skiff tie-lines toward refugee craft
- **NPCs present:** Captain Serit Nox, triage crews, shrine attendants, displaced passengers, food inspectors pretending not to count portions
- **Secrets:** Some Pilgrim hulls carry sealed testimony instead of cargo. A few have been following route-marks that do not exist in any published chart.
- **Hazards:** Quarantine panic, ration theft, med shortages, violent arguments over berth priority
- **Story relevance:** Best doorway into the wider frontier's human cost and a recurring source of testimony, allies, and impossible demands

### Broker Ninth Counting House
- **Type:** Financial sanctum, debt engine, polite battlefield
- **Description:** Tucked behind mirrored partitions above Coalglass Market, the Counting House is where risk is refined into products people can pretend are not cruelty. Thin clerks work at standing desks under filtered light while graph-glass panels track launch failure, salvage yield, futures, and missing ships as if all of them were merely weather.
- **Atmosphere:** Paper dust, cool recycled air, expensive tea, money spoken in the tone other people reserve for medicine.
- **Exits:** Coalglass Market (down), private contract rooms, sealed archive vault, roof antenna balcony
- **NPCs present:** Tamsin Reed, Ivo March, Concord scribes, insurance tacticians, desperate captains trying to refinance tomorrow
- **Secrets:** Broker Ninth is underwriting both legitimate rescue and synthetic scarcity plays. Several current shortages only make financial sense if someone expects route failures to continue.
- **Hazards:** Contract entrapment, evidence disappearing into legal process, being made solvent by people who would rather own you than kill you
- **Story relevance:** Core node for the Lockdown Ledger and Stewardship Machine branches; the cleanest place to expose how the economy feeds on instability, and the fastest place to become trapped inside it

## The Wider Shattersea

### The Pilgrim Chain
- **Role in the setting:** A drifting flotilla of hospice ships, shrine barges, and patched family haulers that carry refugees, witnesses, and songs between unsafe ports.
- **Current pressure:** Overflowing after the latest route collapses. Its arrivals strain Cinder Anchorage's med stores and make the Choir's moral authority impossible to keep abstract.
- **Campaign use:** Humanises every scarcity question. Also the first off-screen region to hear and answer a Sunless Relay broadcast.

## Transit and Travel

### Local Movement Inside Cinder Anchorage

| Method | Typical use | Cost / access | Risk profile |
|--------|-------------|---------------|--------------|
| Foot grates and ladderwells | Short movement, eavesdropping, street-level play | Free, slow, physical | Crowds, surveillance, fatigue |
| Clamp-rail cages | Rapid district transfer for people and cargo | Cheap if public, waived with work badge | Delays, sabotage, transit curfew |
| Dock skiffs | Moorings, refugee hulls, ship-to-ship movement | Paid by berth, favour, or fuel chit | Hull scrape, inspection, ambush |
| Pressure walks | Exterior traversal, emergency rerouting, stealth | Gear-dependent | Vacuum, panic, weathered seals |
| Service ducts and ballast tunnels | Smuggling, escapes, bypasses | Access controlled by locals, not law | Getting lost, collapses, someone waiting |

### What Travel Says About Society

- **Fast movement belongs to whoever controls delay:** The Charter governs launches, Concord governs financing, locals govern shortcuts, and the Choir governs some doors nobody admits are doors.
- **The poor travel in labour time:** Most workers do not pay credits for movement. They pay by where they have to arrive tired.
- **Every route is political:** Safe passage is never just geometry in this setting. It is entitlement, reputation, access, and who is allowed to risk whom.

### Harbour Traffic and Ship Registry

- **Use:** Ships are the anchorage's weather. People read the registry for food pressure, grief, work, and politics long before they read any official speech.

| Vessel | Type | Ordinary pattern | What people watch for |
|--------|------|------------------|-----------------------|
| Mercy of Hours | Pilgrim hospice hauler | Docks every third return bell with patients, shrines, and testimony packets | If it is late, hospice stores run thin and witness traffic starts arriving angry |
| Needle Grant | Charter rescue tug | Launches on overflow or distress traffic and is usually back before the next first bell | If absent too long, Havel is running a rescue the Charter may not want counted cleanly |
| Distant Loam | Lantern Verge crop tender | Expected every fifth first bell with protein gel, grow-light parts, and seed stock | One missed arrival pushes kitchen prices upward within two scenes |
| Ravel's Due | Wakebound parts scow | Irregular but honest salvage and repair runs from breaker fields | If it arrives stripped, Wakehold assumes official salvage tallies are being laundered |
| Ninth Petition | Concord courier cutter | Two quiet dockings a day at private Broker Ninth clamps | A cancelled stop means the market already knows a public bad thing is coming |
| Ashwake Reliant | Choir ferry barge | Carries reliquary ash, patients, and rite gear on a seven-bell loop | Overweight manifests suggest the Choir is moving archives instead of mercy |
| Grey Lattice | Outer moorings trawler | Brings undocumented arrivals, spare netting, and mooring gossip at ugly hours | When impounded, the outer bunks radicalise overnight |
| Hollow Dividend | Insured salvage cutter | Appears wherever the charts promise clean profit and cheap wrecks | Too-early returns imply bribery, too-late returns imply bodies |
| Spare Lantern | Clamp-rail ferry lighter | Moves rail parts, ration sacks, and shift workers between districts | Delay here makes ordinary life feel broken before politics has words for it |
| Orison Black | Survey sloop, officially lost | Still appears on old boards and debt ledgers despite vanishing on White Maw duty | Anyone who proves where it went can crack open several secret chains at once |

- **Missed returns that matter right now:**
  - **Saint Brindle:** Four return bells overdue from a food-lane escort and still being billed for berth fees.
  - **Kindred Wake:** Declared stripped and sold, yet its transponder answers faintly near Prism Grave.
  - **Orison Black:** Missing for months, but still generating legal signatures inside fuel and insurance instruments.

### Missed-Return Side Arcs

- **Saint Brindle - Food Lane, Missing Witnesses:** Rescue or trace the escort hull before its overdue status gets converted into a profitable write-off. Best payoff: exposes how food security, refugee routing, and fuel-note speculation are coupled.
- **Kindred Wake - Salvage Fraud Under Fire:** Track the transponder into Prism Grave and determine whether the ship was stripped by opportunists, seized by Shepherds, or quietly reassigned under a false loss declaration. Best payoff: proves official salvage tallies and frontier threat reports are being laundered together.
- **Orison Black - The Ship That Never Left the Ledger:** Follow the White Maw survey sloop through insurance residue, hidden berths, and relay ghosts to find out whether it was lost outward or hidden inward. Best payoff: bridges White Maw, ghost-ledger law, and the deepest anti-enclosure evidence in the campaign.
- **GM guidance:** Treat these as optional slow-burn arcs, not mandatory errands. Each one should pay out hard proof from a different layer of the world: food, salvage, and legal memory.

## Economy and Debt

### Currencies, Chits, and Obligations

| Instrument | What it means | Who trusts it |
|-----------|---------------|---------------|
| Frontier credits | General trade currency | Everyone, in theory |
| Dock scrip | Local wage paper valid around kitchens, rails, and co-op supply | Workers, kitchen lines, opportunists |
| Fuel notes | Promise of future propellant or launch allotment | Pilots, brokers, quartermasters |
| Salvage shares | Cut of a future recovery not yet made | Crews, co-ops, gamblers |
| Favour ledgers | Social debt written down because trust got too scarce to stay oral | Wakebound, fixers, old captains |
| Reliquary tithe | Spiritual or memory obligation instead of cash | Choir networks and the desperate |

### What the Anchorage Actually Trades In

- **Fuel and sealant:** Without them, nothing leaves and nothing survives pressure loss.
- **Food concentrates and light-crop shipments:** The quiet foundation of political legitimacy.
- **Repair parts:** Especially sensor mesh, shield ceramics, and pressure valves.
- **Route information:** Licensed, forged, partial, or sung. Often the most valuable commodity in the setting.
- **Debt itself:** Concord and some Charter interests can profit more from the expectation of failure than from successful trade.
- **Grief and testimony:** The Choir stores it, brokers counterfeit it, and the frontier increasingly needs it as evidence.

### Everyday Price Pressure

- **Bunk slot in a shared worker tier:** Cheap in credits, expensive in patience and safety
- **Hot meal in Furnace Row:** Affordable until shipments run late, then politically meaningful
- **Emergency med patch:** Always overpriced the hour before a launch window closes
- **Licensed passage:** Officially regulated, practically extortionary when panic rises
- **Black-route guidance:** Paid in cash, favours, or future silence

### How Scarcity Is Manufactured

- **Delay:** Hold a shipment, miss a window, and everything downstream costs more.
- **Documentation:** If a manifest is wrong, whole loads can become unsellable until someone bribes certainty back into existence.
- **Insurance language:** Concord can redefine risk faster than workers can define hunger.
- **Moral authority:** Choir endorsement can stabilise a run without ever touching a cargo clamp.

### Economic Pressure Points for Play

- **Dock scrip inflation:** Good for scenes about labour unrest, kitchen lines, and barter economies.
- **Fuel note collapse:** Good for ship politics, convoy leverage, and quartermaster drama.
- **Concord futures spikes:** Good for exposing who is betting on disaster.
- **Food lane disruption from Lantern Verge:** Good for turning distant geography into immediate domestic pressure.

## Institutional Procedures

### How a Launch Permit Actually Moves

- **Sponsor and route justification:** A captain, co-op, hospice transfer, or brokered client needs a named sponsor before the Sounding House pretends the request is real.
- **Paper pass:** Registry clerks confirm hull identity, crew count, berth debt, declared purpose, and whether any quiet hold is already sitting on the vessel.
- **Finance pass:** Broker Ninth, quartermasters, or internal Charter desks confirm fuel backing, bond coverage, and who will absorb liability if the run vanishes.
- **Seal and body pass:** Clamp teams inspect seals, med clearances, cargo restraints, and whether the crew looks healthy enough to be lost respectably.
- **Discretion window:** Sael, Havel, or a lower official with enough fear can quietly delay, expedite, or reroute a launch without ever changing the public principles used to justify it.
- **Where it fails in play:** Missing badges, contradictory manifests, unpaid notes, whisper-blacklisting, overloaded witness traffic, or an inspection team deciding your emergency is politically inconvenient.

### How a Salvage Claim Becomes Property

- **First mark:** The first crew to tag a wreck acquires a temporary moral claim, not yet a secure legal one.
- **Witnessing:** A second crew, dock copyist, or market-recognised observer has to confirm the mark unless the claimant wants years of dispute.
- **Tow, inventory, and skim:** By the time a wreck reaches Ember Quay, parts have often been stabilised, pocketed, or "lost to pressure" three times over.
- **Adjudication:** Charter law privileges licensed recovery, while Wakebound custom privileges labour and hazard actually borne. Most conflicts are settled by intimidation before doctrine.
- **Conversion into value:** Parts become repair stock, salvage shares, insurance evidence, or fraud depending on who controls the paperwork after the hull stops moving.

### How the Dead Become Official

- **Provisional naming:** The Return Bell and rescue crews mark the missing first because grief outruns paperwork.
- **Clinic and witness filter:** Hospice staff, rescue logs, and family testimony decide whether a person is confirmed dead, suspected dead, or quietly uncounted while an institution buys time.
- **Registry merge:** Only after the Sounding House accepts the name do berth rights, rations, and debt instruments shift into their next legal form.
- **Afterlife in the ledgers:** A delayed death is politically useful. It keeps permits alive, payouts frozen, bunks occupied on paper, and inconvenient causality suspended.

### How Quarantine Really Works

- **Medical trigger:** A clinic, tug medic, or berth watcher marks contamination risk first.
- **Paint and notice:** Cori Wren's boards, clamp notices, and berth chalk turn illness into visible jurisdiction.
- **Movement restriction:** Cages reroute, bunks close, and relief tables start sorting the deserving sick from the inconvenient sick.
- **Quiet exceptions:** Charter launches, broker cargo, and certain Choir transfers still move when someone important decides the risk belongs somewhere else.
- **Abuse pattern:** Crowd control, witness isolation, and berth denial are often disguised as infection management because medical language is harder to argue with at speed.

### How Debt Conversion Happens

- **Immediate shortage:** Someone needs fuel, med patches, a launch slot, or a bed before they can afford one.
- **Short paper:** A note is issued against future cargo, future labour, future salvage, or future silence.
- **Collateral creep:** Miss one payment and the instrument starts eating adjacent things: berth access, crew shares, route priority, kin obligations.
- **Institutional capture:** Concord prefers this stage because the debtor now behaves like infrastructure.
- **Quiet mercy:** The shadow welfare web survives partly by intercepting people before they become legible enough to be refinanced.

### What Counts As Proof Here

- **Docks trust bodies and timing:** If the right person returned late, the wrong berth stayed occupied, or a hull sounds wrong under stress, that often outranks paper.
- **Markets trust pattern before morality:** Repeated price movement, courier routes, and note behaviour are admissible truth in Coalglass long before they become ethical truth anywhere else.
- **The Choir trusts residue and witness coherence:** Ash trace, memory fracture, and what different mourners remember in common matter more than single statements.
- **The Charter trusts paper unless paper threatens the Charter:** Then it prefers chain of custody, formal seals, and delaying language until reality becomes governable again.
- **Pilgrims trust repeated testimony across hulls:** If three ships from different routes carry the same warning, it becomes truth whether or not a clerk approves it.
- **GM use:** Scenes get stronger when the player has the wrong kind of proof for the audience in front of them.

### Institutional Voice Samples

- **Launch notice:** `By order of the Sounding House, departure is delayed pending seal confirmation, berth reconciliation, and revised casualty-weighted routing.`
- **Debt demand:** `Failure to cure note exposure before next first bell authorises berth suspension, wage interception, and collateral review under emergency scarcity terms.`
- **Quarantine board:** `TEMPORARY ACCESS RESTRICTION. Entry remains a medical privilege, not a public right. State your purpose before approaching the yellow line.`
- **Rescue caucus slate:** `Count survivors first. Count claims later. Any officer reversing that order writes it in full name.`
- **Choir notice:** `Memory offered here may return altered by mercy, fatigue, or truth. Enter prepared to lose one version of yourself.`
- **Kitchen chalk:** `BOWLS ONE PER. TAKE FOR KIN ONLY IF YOU WILL SAY THEIR NAME.`
- **Broker Ninth language:** `Continuity service available for qualified clients. Distress may be refinanced into orderly participation.`

## Living Anchorage

### What Changes Even If the Player Does Nothing
- **Scenes 1-6:** Auction fever, blackout rumours, and the first refugee hulls push Ember Quay into a boil. Prices rise faster than facts, but most people still pretend this is a temporary spike.
- **Scenes 7-12:** Charter inspections harden, Wakehold crews start talking strike logistics instead of complaint, and the outer moorings fill with people who thought Cinder Anchorage still had room.
- **Scenes 13-20:** Echo-plague cases appear in the hospice, Concord launches a shadow market on expected losses, and the Return Bell starts ringing names the public ledgers do not contain.
- **Scenes 21-40:** The anchorage stops waiting for a clean fix. Kitchen lines lengthen, informal rescue committees form, and the player's early route choices begin changing who can still afford to stay.
- **Scenes 41-60:** Bell tallies, relay rumours, and neighbourhood arguments turn background suffering into civic politics. The world does not explode; it becomes impossible to ignore.
- **Scenes 61-80:** Outer districts open, buried systems wake, and every institution that counted on the crisis staying local loses that luxury.
- **Scenes 81+:** The Sunken Parliament, the Crown Below, and frontier arrivals force every district to live inside consequences that can no longer be deferred.

### District Stress States

| District | Normal day | Strained day | Breaking day |
|----------|------------|--------------|--------------|
| Ember Quay | Loud auctions, routine inspections, people still pretending delay is temporary | Retagged lots, visible clamp queues, too many guards drinking tea too fast | Closed shutters, crowd surges, emergency law read aloud over industrial speakers |
| Coalglass Market | Haggling, gossip, small forgery, managed vice | Panic buying, cut meds, whisper sales under the stalls | Prices change mid-conversation, stalls vanish, couriers move like prey animals |
| Wakehold | Repair noise, co-op bargaining, blunt competence | Silent tool checks, arguments about whose run matters most | Strike prep, gear hoarding, every stranger treated as a possible informer |
| Furnace Row | Queue discipline, rough humour, post-shift exhaustion | Thinner broth, louder songs, collectors keeping backup nearby | Bowls counted publicly, fights become votes, kitchens turn into civic command posts |
| Outer Moorings and Pilgrim Landing | Triage pressure, ropework, layered patience | Overflow cots, duplicate names, quarantine arguments | Intake collapse, witness panic, berth access becoming a moral scandal in public |
| Choir Steps and Salt Wound Hospice | Ritual traffic, quiet grief, controlled memory work | Overfull side cells, doctrinal friction, too many sealed trays moving at dawn | Visitors screened, censors active, every act of care also feeling like evidence control |
| Clamp-Rail Spine and Broker Ninth | Managed delay, tired commuters, boring paperwork with hidden teeth | Patterned outages, courier priority, resentment turning procedural | Cages halted, guards posted, contracts deciding where bodies are allowed to go |

### Revisit Matrix For Core Districts

- **Ember Quay after a player victory:** People make room for the crew, inspectors become polite, and three separate strangers offer "small help" that is really political alignment.
- **Ember Quay after a public scandal:** Every crane gantry becomes an audience. Workers stop pretending not to listen, and officials speak as if every sentence might be quoted back at them.
- **Coalglass after shortage relief:** The market relaxes into humour and counterfeit luxury; people become generous with rumours because panic has stopped paying premium rates.
- **Coalglass after a betrayal:** Buyers ask fewer direct questions, sellers use more runners, and anyone with clean hands suddenly looks like an informant.
- **Wakehold after rescue success:** Tools come out faster, silence becomes approving rather than suspicious, and co-op labour feels like a future instead of a holding action.
- **Wakehold after permit humiliation:** Doors shut halfway, patchwork stops being visible, and all competence becomes conditional until trust is rebuilt.
- **Furnace Row after a shared meal scene lands well:** The district starts acting as if collective action might actually hold. Jokes sharpen, fear softens, and people begin naming tomorrow aloud.
- **Furnace Row after a cut or riot:** Every queue becomes a vote, every argument becomes recruitment, and kindness is measured in calories rather than sentiment.
- **Outer Moorings after witness protection:** New arrivals stop flinching at every clipboard. The place feels tired but moral.
- **Outer Moorings after abandonment:** Intake becomes mechanical, names repeat, and even the lamps seem accusatory.

### Recurring Micro-Sites

- **Crane Nine tea shelf:** A ledge on Ember Quay where berth hands, inspectors, and runners all briefly become equal because everyone needs the same kettle.
- **The split rung:** A ladder break in Wakehold where people stop to decide whether they are still acting like workers, thieves, or rescuers.
- **Third pot corner:** The place in Furnace Row where the line boss quietly feeds the ashamed, the grieving, and the nearly dangerous.
- **Yellow board hinge:** A Pilgrim Landing choke point where quarantine paint, witness traffic, and dock authority literally meet at one metal seam.
- **Clamp Forty-Seven bench:** A transit waiting rail where rumours become class-specific; workers hear one city there, brokers another.
- **Salt glass alcove:** A side niche near the hospice where families negotiate whether recovery, testimony, and truth are actually the same task.

### NPC Motion and District Drift
- **Sael Vane:** Stays in the Sounding House until public order slips, then moves physically closer to the docks because control from a balcony stops working.
- **Tamsin Reed:** Retreats into Concord counting rooms once open violence becomes bad for margins, then reappears the second truth becomes tradable again.
- **Mother Ioris:** Holds the hospice publicly, but if the reliquary arc breaks her control she descends toward the Array and starts acting like doctrine is triage.
- **Daxa Thorn:** Almost never leaves the outer moorings. If she does, treat it as evidence that the dead have finally become politically useful.
- **Havel Pike:** Appears whenever evacuation or rescue priorities are up for argument. He is the Charter made human enough to disagree with itself.

### Shift Rhythm and Ordinary Life

- **First bell:** Freight transfer, ration prep, permit queues, and the day's cleanest lies.
- **Second bell:** Most legal business, contract work, med appointments, and official inspections.
- **Third bell:** Market opportunism, under-table transport, kitchen politics, and favours getting expensive.
- **Blackout bell:** The anchorage contracts. Doors seal, gossip accelerates, and only the people who must move keep moving.
- **Return bell:** The emotional center of the setting. Some people count it for grief, others for labour, and Daxa counts it for truth.

### Food, Shelter, and Habit

- **Common meals:** Broth thickened with protein dust, fried lantern fungus, preserved fruit when somebody is showing off, and tea strong enough to pass for morale.
- **Worker housing:** Bunk tiers, curtain cubbies, docked ship berths, and co-op dorms held together by custom more than comfort.
- **Middle-tier housing:** Contract rooms, small leased cabins, office sleep pods, and hospice side cells for people with status or good paperwork.
- **Wealth display:** Quiet air filters, private light panels, clean ceramic cups, and not needing to look at the ration board while ordering.

### Household and Bunk Logic

- **No bunk is truly private if the district thinks you owe it survival.**
- **A made bunk after dawn means either discipline, grief, or someone trying to hide how little they slept.**
- **Shared shelf space is intimacy in this setting:** medicine tins, dry socks, and spare filter tabs say more than declared affection.
- **An untouched berth becomes political after two bells:** either the district is protecting the absent, or someone is profiting from pretending they still occupy space.
- **Children, witnesses, and the newly arrived are moved first through kin logic, not legal logic.** The paperwork catches up later if it can.
- **GM use:** When someone disappears, decide who keeps their shelf, who refuses it, and who quietly starts sleeping closer to the exit.

### Practical Services: Shops, Repair, and Rest

- **Why it matters:** Slow-burn play needs places to spend money, trade favours, recover, and overhear life that is not the main plot.

#### Shop and Service Hubs

- **Ember Quay auction cages and customs stalls:** Heavy salvage, launch gear, licensed tools, auction leftovers, and quick bribes dressed as paperwork.
- **Coalglass Market:** Everyday black-market trade, meds, forged seals, personal luxuries, low-tier route scraps, and rumours sold as convenience.
- **Broker Ninth Counting House:** Contracts, fuel notes, debt conversion, insurance, and any expensive purchase that would rather own the buyer than satisfy them.
- **Wakehold yard exchange:** Parts, patchwork repairs, dive gear, co-op barter, labour-only deals, and tools that come with opinions attached.
- **Furnace Row kitchen counters:** Meals, ration swaps, kitchen credit, informal hiring, neighbourhood favours, and gossip good enough to change a route choice.
- **Pilgrim Landing relief tables:** Blankets, med patches, shrine supplies, witness caches, and emergency barter disguised as mercy.

#### Rest and Recovery Anchors

- **Wakehold co-op dorms:** Safest low-cost bunking for people labour trusts, though privacy is mostly theoretical.
- **Furnace Row sleeping tiers:** Loud, communal, cheap, and one of the best places to hear what the city actually thinks overnight.
- **Salt Wound Hospice side cells:** Best recovery space for injury, memory harm, grief, and anyone who needs quiet more than comfort.
- **Outer Moorings rescue bunks:** Temporary shelter, triage cots, and the best place to overhear new arrivals before policy reaches them.
- **Pilgrim hull guest berths:** Unstable but humane refuge for witnesses, exiles, and people hiding in plain sight.

#### Counts That Matter in Play

- **Explicit shopping or service nodes:** 6 major hubs
- **Dependable rest or shelter nodes:** 5
- **Medical or recovery anchors:** 3 if counted separately: Salt Wound Hospice, Pilgrim triage, and Outer Moorings rescue bunks
- **Repair or resupply hubs:** 3 major ones: Ember Quay, Wakehold, and Coalglass/Broker Ninth acting together

### Named Minor Proprietors and Caretakers

| Node | Keeper | Public role | Quiet leverage |
|------|--------|-------------|----------------|
| Ember Quay auction cages and customs stalls | Lio Marr | Salvage clerk, launch-gear lender, tea seller to people in a hurry | Knows which lots were resealed after inspection and which manifests changed hands twice |
| Coalglass Market | Pera Flint | Patch-med vendor, gossip broker, unofficial fence for small luxuries | Hides couriers under her stall grating and can identify who is buying panic rather than goods |
| Broker Ninth Counting House | Sellen Gorse | Contract closer, debt translator, keeper of the expensive tea table | Reads desperation faster than ledgers and quietly steers who gets ruinous terms |
| Wakehold yard exchange | Tor Jast | Yard steward, parts matcher, breaker of bad tools over the counter | Tracks which crews are being denied safe repairs on purpose |
| Furnace Row kitchen counters | Nera Coil | Line boss, soup keeper, allocator of shift-credit bowls | Can tell who is about to organise, flee, or starve by how they hold a tin cup |
| Pilgrim Landing relief tables | Veda Rusk | Relief registrar, blanket quartermaster, witness queue manager | Keeps duplicate arrival tallies separate from official berth counts |
| Wakehold co-op dorms | Toll Renn | Bunk marshal, locker keeper, co-op night watch | Hides pressure suits and spare names for workers about to disappear for good reasons |
| Furnace Row sleeping tiers | Jori Tern | Night steward, ash-filter minder, argument breaker after shift end | Hears every feud, apology, and mutiny rehearsal worth hearing |
| Salt Wound Hospice side cells | Len Miri | Quiet nurse, cell custodian, memory-watch attendant | Knows which patients were visited by Choir censors before dawn |
| Outer Moorings rescue bunks | Sova Trask | Cot clerk, boil-water tyrant, intake watcher | Keeps the only honest list of who arrived without papers and who was turned away |
| Pilgrim hull guest berths | Aunt Keph | Berth mother, rope judge, keeper of the spare lamps | Decides who is hiding, who is merely resting, and who needs to be moved before morning |

### Rotating Rumours and Job Boards

- **Use:** Start each bell by surfacing one rumour and one paid or favour-based job from every district currently in play. Let ignored boards expire and return later with sharper stakes.

| District | Most active shift | Typical rumours | Typical jobs |
|----------|-------------------|-----------------|--------------|
| Ember Quay | First bell and return bell | Inspectors are short on sealant again, an auction lot was retagged overnight, a missing crew was seen on the upper catwalk | Unload shadow cargo, find a lost manifest stub, escort a tug pilot to a hearing |
| Coalglass Market | Third bell and blackout bell | Med patches are cut with ballast dust, Concord bought Lantern futures early, Rook was heard near the ventworks | Carry a sealed parcel, verify a forged seal, identify a buyer from description alone |
| Wakehold | First bell and third bell | Latchkey marks changed overnight, a deep-run crew wants a silent partner, union votes are moving faster than admitted | Pressure-test a skiff, find an absent diver, recover stolen drill bits before shift change |
| Furnace Row | Third bell and return bell | Portions thinned again, debt collectors hired muscle, someone is counting strike songs under their breath | Haul ration drums, find a missing child, deliver an apology before a feud becomes public |
| Outer Moorings and Pilgrim Landing | Second bell and return bell | The quarantine board was falsified, a witness cache is incoming, Daxa rang an extra name after curfew | Escort arrivals, clear bunks, verify a missing hull's roster against what survivors remember |
| Clamp-Rail Spine and Broker Ninth | Second bell and blackout bell | Dispatch ledgers were edited, the same wards keep getting delayed, an insurer already priced tomorrow's loss | Ride shotgun on an emergency cage, recover a dropped contract packet, prove whether an outage was sabotage |

### Rumour Drift Rules

- **Ember Quay turns truth into blame:** By the time a fact crosses the cranes, people want a responsible hand attached to it.
- **Coalglass turns truth into opportunity:** Rumours arrive as prices, angles, and suspicion about who moved first.
- **Wakehold turns truth into practical consequence:** If a story does not change who must dive, patch, strike, or flee, it is treated as noise.
- **Furnace Row turns truth into moral weather:** The important question is not "is it true?" but "who eats thinner because of it?"
- **Moorings and Pilgrim traffic turn truth into names:** Stories become more human, more specific, and harder for officials to abstract safely.
- **Broker Ninth turns truth into instrument language:** A scandal becomes exposure, then volatility, then a service line someone can buy.
- **GM use:** Let the same fact sound different depending on where the player hears it next.

### Ritual and Civic Calendar

- **Use:** Cinder Anchorage does not keep a neat civil week, but institutions still repeat themselves. Repetition is how people predict mercy, danger, and paperwork.

| Cycle point | What happens | Why it matters in play |
|-------------|--------------|------------------------|
| Day 1, first bell: Posting Bell | Charter lane changes, inspection rosters, and clamp notices go up | Crowds form early, arguments become public, and every movement-heavy plan can be complicated before breakfast |
| Day 2, return bell: Names Bell | Daxa and the bell keepers read the confirmed dead, the suspected dead, and the names institutions are trying not to admit | Grief becomes evidence, and NPCs tied to loss become easier to find and easier to anger |
| Day 3, second bell: Kitchen Weigh | Furnace Row and Wakehold kitchens compare ration stocks, dilution rates, and volunteer needs | The city reads this like weather; shortages become visible before officials acknowledge them |
| Day 4, third bell: Co-op Draw | Wakebound assigns dangerous repair work, spare bunks, and pressure-loan gear | New labour hooks appear, resentments flare, and missing workers are noticed quickly |
| Day 5, second bell: Tithe and Clinic | Choir shrines collect reliquary dues, hear grief petitions, and triage memory harm | The hospice fills, doctrinal disputes surface, and witness scenes become easier to trigger |
| Day 6, blackout bell: Hullfast Inspection | Charter clamp teams sweep berths, seals, extinguishers, and permit badges | Smuggling routes shift, tempers rise, and whole districts feel watched at once |
| Day 7, return bell: Pilgrim Table | Refugee hulls hold witness suppers, swap names, and ask who still counts as reachable | Frontier rumours consolidate into actionable leads, and off-station stakes stop feeling theoretical |

- **Seasonal observances:**
  - **Ash Waking:** Choir rite for patients and missing crews whose remains never returned.
  - **White Maw Remembrance:** Quiet civic memorial that turns political whenever someone asks why the lane failed.
  - **Low Aperture:** Salvagers celebrate the first wide reef opening of the cycle, and everyone else watches prices jump.
  - **Night of Spare Lights:** Every district hangs one extra lamp for those still en route, and smugglers use the glow to hide movement in sentiment.

### Off-Screen Event Clocks

- **GM cadence:** Advance one clock by 1 tick every 2-4 scenes, or immediately when the player ignores, fails, or cynically exploits the pressure point attached to it.

- **Kitchen dilution (6):** At 2 ticks portions shrink and gossip sharpens. At 4 ticks hot meals cost more, Edda and Nera stop leaving Furnace Row, and neighbourhood favours replace cash. At 6 ticks public ration anger spills into protest, theft, or Commons Tide momentum.
- **Fuel-note panic (6):** At 2 ticks launch fees rise and quartermasters start hoarding. At 4 ticks Broker Ninth only sells meaningful fuel on debt terms and Pall Orin becomes hard to reach except through work. At 6 ticks civilian departures stall, convoy leverage hardens, and every ship scene starts with finance before mechanics.
- **Berth saturation (6):** At 2 ticks the outer bunks fill and temporary cots spill into walkways. At 4 ticks rescue space closes to strangers, Havel and Sova become pinned to intake work, and berth arguments turn violent. At 6 ticks an annex district opens or the moorings rupture politically.
- **Clamp strike readiness (6):** At 2 ticks delays become patterned. At 4 ticks public cages shut intermittently, Sol lives on the Spine, and legal movement slows enough to change scene geography. At 6 ticks transit workers either walk out or are forced back under guard.
- **Echo-plague spread (6):** At 2 ticks side cells fill and memory-static becomes common gossip. At 4 ticks Salt Wound restricts visitors, Yara and Len Miri become difficult to access, and the Choir starts using triage to justify secrecy. At 6 ticks witness scenes destabilise, Choir Undertow accelerates, and ordinary conversations begin carrying other people's grief.
- **Ghost-ledger exposure (4):** At 1 tick workers whisper that dead crews still own live permits. At 2 ticks Daxa's copies circulate quietly and Sael starts internal containment. At 3 ticks Charter and Concord teams attempt seizures around the Bell Tower. At 4 ticks ghost names become open civic scandal.

### Scarcity Psychology Stages

- **Tight:** People joke harder, hide small reserves, and start watching line length before they watch speeches.
- **Worrying:** Politeness becomes conditional. Borrowing gets formal. Ordinary gossip acquires accounting language.
- **Acute:** Hoarding turns moral, then shameful, then ordinary. People start sorting neighbours into "ours" and "not ours" without saying it cleanly.
- **Breaking:** Every public object becomes political: bowls, bunks, benches, clamps, lamps, names boards. Violence becomes thinkable even to people who still hate it.
- **After partial relief:** Nobody fully relaxes. Generosity returns first in tiny forms, then humour, and only much later trust.

### Aftermath Memory

- **Every major scene leaves at least one physical trace:** scorched paint, a rewritten board, a missing stool, a sealed hatch, a chalk warning left up too long.
- **Every district keeps memory differently:** Ember Quay remembers in retold blame, Furnace Row in practical story, the Moorings in names, and the Choir in what gets archived versus softened.
- **Every public success is misremembered by someone powerful within two bells.** Decide who edits the meaning first, not only who caused the event.
- **Every failure creates a small private custodian:** someone keeps the list, washes the cup, guards the berth, or repeats the names until the city catches up.
- **GM use:** When a scene matters, record who still talks about it one week later, who has already monetised it, and what object or place still carries its residue.

### Social Rules That Matter

- **Never waste pressure gear in sight of someone who cannot replace theirs.**
- **Do not ask about a missing crew before the second return bell unless you are ready to help look.**
- **A hot meal creates a favour if refused once, a bond if accepted twice, and a political bloc if shared during shortage.**
- **Everyone watches who walks through the wrong district without slowing down.**

### Slang and Street Knowledge

- **Glass-blind:** Someone following clean charts into obvious trouble.
- **Bought oxygen:** Legal access that came by enclosure rather than solidarity.
- **Cold berth:** A ship space nobody expects to be used again, until it is.
- **Eating the map:** Making short-term profit off long-term route collapse.
- **Bell-poor:** So indebted or erased that only the dead are counting you fairly.

## Material Culture

### Clothing, Repairs, and Carry

- **Workwear reads like biography:** Wakebound layers are patched for motion and seal integrity; Charter cloth is cleaner, stiffer, and meant to show who can afford replacement instead of repair.
- **Pressure gear is personalised because anonymity kills:** Gloves are scored for grip preference, visor rims carry kin marks, and spare clips are traded like trust tokens.
- **Bags matter:** Couriers wear body-close sling rigs, kitchen workers favour dented tins and cloth wraps, and officials carry hard cases that announce process before speech.

### Memorial Objects and Domestic Shrines

- **Bell shims:** Thin brass scraps etched with names, tied above bunks or inside helmets so the missing travel with the living.
- **Mug shrines:** A clean cup, a bolt, a ration chit, and one lamp is enough to make a worker's memorial if space is scarce.
- **Return-thread bracelets:** Woven from old suit cord and berth rope, often cut and retied when a crew member comes home changed.

### Kitchen Etiquette

- **Do not season before the pot keeper tastes.** It implies the line cannot be trusted to feed itself.
- **Do not ask the source of extra food in shortage.** If someone is feeding you, the first duty is not to make them narrate the theft.
- **An upside-down bowl means grief, debt, or refusal.** People will usually ask which only if they are offering to help.

### Suit Superstitions, Children's Games, and Dock Graffiti

- **Never rename a suit on the day of launch.**
- **Children play Missing Bell by hopping marked routes and daring each other to leave one name uncounted, which adults hate because it is too close to civic practice.**
- **Dock chalk carries politics:** `COUNT THEM CLEAN`, `NO PRIVATE AIR`, `THE GLASS HEARD THAT`, and crossed-bell sigils show up wherever trust has gone thin.
- **A lamp drawn with three strokes means safe bunk, false papers, or both depending on district and hour.**

### Status Signals and Cheap Luxury

- **Status shows up as dryness, quiet, and spare time:** Clean cuffs, private airflow, unfogged lenses, and the ability to sit while waiting all read as power.
- **Cheap luxury is intensely local:** fresh citrus oil on the wrist, real sugar in tea, dry socks, polished ceramic instead of tin, a blanket that does not smell like shared sleep.
- **Concord wealth is understated on purpose:** The expensive people prefer clean hands, soft seals, and being served hot water without asking.

### District Speech

| District | Typical speech habit | What it implies |
|----------|----------------------|-----------------|
| Ember Quay | Short sentences, tool names, open accusation when patience breaks | People expect facts to arrive mid-motion |
| Coalglass Market | Indirection, price metaphor, questions that are actually offers | Nobody wants to be the first person on record as knowing |
| Wakehold | Blunt competence, insults as trust, silence as evaluation | Respect is practical before it is emotional |
| Furnace Row | Story-first, joke-laced, grief and politics braided together | People test whether you can stand community pressure |
| Moorings and Pilgrim hulls | Name-heavy, witness-oriented, unusually specific about the vulnerable | The human cost has to stay visible to stay real |
| Choir spaces | Softened syntax, layered caution, certainty only around ritual form | Meaning is constantly being managed for impact |
| Broker Ninth | Polite compression, abstract nouns, removal of visible blood from every sentence | Harm becomes acceptable once phrased as procedure |

### Entertainment and Humour

- **Shift-card games:** Usually about counting risk, bluffing lack, or forcing someone to admit which loss they would choose.
- **Bad quay theatre:** Dock runners and kitchen staff mock officials by reenacting inspections with soup ladles and broken seals.
- **Rhyme bets on the clamp rails:** People wager on arrival time, inspection mood, and whether a public speech will survive its own first question.
- **Children's lamp stories:** Kids dare each other to identify which extra lights are memorial, which are smuggler code, and which are both.
- **Furnace Row humour:** If a joke survives the ration line, it becomes politically important. That is how the district tests whether despair has won today.

### Object Biographies

- **Daxa's brass shim bundle:** Once a practical bell-keeper kit, now part memorial ledger, part route key, part proof that names were edited by hand.
- **The cracked white cup at Salt Wound:** Passed between families during hard testimony because it does not tip easily when hands shake.
- **Oren's latch tool:** An old emergency schematic key worn smooth enough to count as biography. It opens more trust than metal when shown to the right workers.
- **Nera's long ladle:** Bent twice, never replaced, and known well enough that a changed serving motion signals bad news before words do.
- **The Borrowed Tide ghost-ping sensor coil:** A failing piece of machinery that has already become crew folklore, tactical problem, and omen all at once.

## NPC Roster

### Sael Vane
- **Role:** Gatekeeper, lawful rival, possible state-builder
- **Species/Background:** Human, station-born, former tug pilot who rose through crises instead of elections. She looks like someone who decided long ago that exhaustion is not a public-facing emotion.
- **Motivation:** Keep Cinder Anchorage solvent and prevent a panic she cannot control.
- **Secret:** She authorised the "private" atlas auction because she already suspects at least one Concord broker and one Choir cell will kill for the shard if it hits open market.
- **Reveal condition:** Player steals her private ledger or earns her trust by proving who leaked the berth schedules.
- **Arc:** Duty -> compromise -> public order or managed monopoly, depending on who the player teaches her to fear more
- **Disposition start:** Neutral-guarded
- **Speech pattern:** Precise, clipped, maritime metaphors, never raises her voice when she can lower the room instead.
- **Faction:** Charter of Soundings
- **Location:** The Sounding House, then Ember Quay during any crisis
- **Relationship triggers:**
  - Trust +10: Bring evidence, not accusations
  - Trust -15: Humiliate the Charter in public
  - Trust +15: Choose public safety over easy profit when she can see it

### Tamsin Reed
- **Role:** Broker, tempter, elegant parasite
- **Species/Background:** Human, Concord-bred, dressed like scarcity is something that only happens to other people.
- **Motivation:** Turn the atlas crisis into a permanent market position before anyone else realises the price of certainty is rising by the minute.
- **Secret:** He is financing both legal salvage enforcement and at least one smuggling channel that feeds the same shortage.
- **Reveal condition:** Player tracks Concord purchases across two fronts or corners Brin Roe after a failed courier handoff.
- **Arc:** Smiling advantage -> exposure -> either indispensable fixer or exemplary casualty
- **Disposition start:** Suspicious-polite
- **Speech pattern:** Soft, amused, flattering without warmth, always speaking as if a better offer exists just off-stage.
- **Faction:** Market Concord
- **Location:** Coalglass Market and private counting rooms

### Mother Ioris
- **Role:** Spiritual authority, memory warden, ambiguous mentor
- **Species/Background:** Human, senior cantor of the Velvet Choir, wrapped in authority she insists is devotional rather than political.
- **Motivation:** Keep dangerous memories curated and away from those who would reduce them to property.
- **Secret:** She knows some Choir rites are engineered to edit living memory, not preserve it, and has justified that knowledge for years.
- **Reveal condition:** Player recovers the stolen reliquary, survives a Choir rite, or questions her with proof from Yara or Callis.
- **Arc:** Keeper -> confessor -> penitent or zealot
- **Disposition start:** Suspicious-receptive
- **Speech pattern:** Measured, ceremonial, uses second meanings and asks questions that sound like blessings until they do not.
- **Faction:** Velvet Choir
- **Location:** Choir Steps and Salt Wound Hospice

### Dr. Halek Ves
- **Role:** Scholar ally, translator, fragile truth-teller
- **Species/Background:** Human academic sponsored by the Charter and quietly disgusted by how sponsorship works.
- **Motivation:** Understand what the Nacre built before politics destroys the evidence.
- **Secret:** He has already translated enough to know the atlas is redistributive, not purely navigational, but has delayed publishing it out of fear and dependence.
- **Reveal condition:** Player shares raw glyph data, protects him during a deep run, or confronts him after the Reliquary Bloom revelation.
- **Arc:** Cowardice -> courage -> costly honesty
- **Disposition start:** Friendly-cautious
- **Speech pattern:** Dense, excited, apologetic when interrupted by his own thinking.
- **Faction:** Publicly Charter-sponsored, privately none
- **Location:** The Sounding House

### Oren Silt
- **Role:** Dock fixer, local guide, practical ally
- **Species/Background:** Human, ember-quay native, knows every service latch worth knowing and several that officially do not exist.
- **Motivation:** Keep useful people alive and make sure the anchorage still belongs to the people who maintain it.
- **Secret:** Oren has been hiding undocumented arrivals in the ballast tunnels for months and can connect the player to the dock leak if pressured carefully.
- **Reveal condition:** Player chooses subtlety over spectacle on Ember Quay or pays back a favour without bargaining over it.
- **Arc:** Steady ally who deepens rather than changes
- **Disposition start:** Friendly
- **Speech pattern:** Fast, practical, teasing, never explains a shortcut until already taking it.
- **Faction:** Unaligned, Wakebound-adjacent
- **Location:** Ember Quay and maintenance hollows

### Brin Roe
- **Role:** Courier, wildcard, opportunist
- **Species/Background:** Human, market-raised, small-time until the shortage made everyone bigger and meaner than they intended to become.
- **Motivation:** Stay solvent long enough to pick the winning side second, not first.
- **Secret:** She already moved one package for Tamsin that used a Charter seal and a Shepherd route in the same night.
- **Reveal condition:** Intercept her delivery, buy her silence twice, or rescue her from a deal gone wrong.
- **Arc:** Survivor -> witness -> ally or scapegoat
- **Disposition start:** Neutral
- **Speech pattern:** Quick, deflective, streetwise, jokes hardest when she is most frightened.
- **Faction:** Market Concord contractor, loyalties rented by the hour
- **Location:** Coalglass Market, smuggler crawlways, moving fast

### Yara Sunfold
- **Role:** Healer, memory diver, moral interpreter
- **Species/Background:** Human hospice keeper who has spent years separating grief from propaganda one patient at a time.
- **Motivation:** Preserve the dignity of the dying and stop the Choir, Charter, or player from turning memory into a convenience.
- **Secret:** She can extract stable scene echoes strong enough to function as evidence, but each dive costs her something she never names.
- **Reveal condition:** Player treats the hospice as more than scenery, shares a truth before asking for one, or returns the reliquary intact.
- **Arc:** Caretaker -> witness -> quiet judge of the player's final choice
- **Disposition start:** Friendly-reserved
- **Speech pattern:** Gentle, lucid, exact, with no patience for melodrama.
- **Faction:** Velvet Choir by employment, her own conscience by loyalty
- **Location:** Salt Wound Hospice

### Nivek Ash
- **Role:** Scout, runner, access key for hidden routes
- **Species/Background:** Human, reef-born teenager who climbs raw glass like it owes him rent.
- **Motivation:** Prove usefulness without becoming disposable.
- **Secret:** Nivek has seen one of the hidden signs inside the Latchkey Stair change on its own.
- **Reveal condition:** Player treats him like a person instead of a tool, or follows him into the maintenance skin between Wakehold and the Stair.
- **Arc:** Reckless asset -> reliable witness -> next generation of the anchorage, if he survives
- **Disposition start:** Friendly
- **Speech pattern:** Breathless, sharp, proud, with the absolute certainty of youth until reality makes its case.
- **Faction:** Wakebound Union
- **Location:** Wakehold, maintenance hollows, high ledges

### Daxa Thorn
- **Role:** Bell keeper, casualty archivist, steward of unofficial truth
- **Species/Background:** Human, outer-moorings lifer, survivor of two mass-loss seasons and one fire that officially never reached the bell tower.
- **Motivation:** Keep the dead named and the living from being quietly converted into accounting residue.
- **Secret:** Daxa knows the ghost crews are not a metaphor. She can prove the same erased names still move debt, permits, and berth claims through the harbour's legal bloodstream.
- **Reveal condition:** Player protects the moorings during a panic, brings her evidence instead of rhetoric, or asks who the extra bell-strike is really for.
- **Arc:** Quiet witness -> reluctant archivist -> civic detonator if the player chooses to weaponise truth
- **Disposition start:** Friendly-cautious
- **Speech pattern:** Low, dry, never wastes a sentence on the living that she would not be willing to say over the dead.
- **Faction:** Unaligned
- **Location:** Outer Moorings and Bell Tower Archive

### Havel Pike
- **Role:** Rescue captain, internal reformer, institutional conscience under stress
- **Species/Background:** Human, Charter tug commander who still thinks rescue is a duty rather than a service tier. Looks permanently sleep-deprived and slightly offended by preventable death.
- **Motivation:** Keep people alive long enough to matter and drag the Charter back toward triage before hardliners finish turning it into pure enclosure.
- **Secret:** Havel is already preserving manifests and fuel orders for a breakaway rescue caucus inside the Charter.
- **Reveal condition:** Player helps an evacuation, refuses an easy cruelty in the name of order, or proves the Charter's monopoly is costing lives it claims to save.
- **Arc:** Loyal officer -> internal dissident -> architect of reform or casualty of it
- **Disposition start:** Neutral-measured
- **Speech pattern:** Blunt, procedural, angriest when he sounds calmest.
- **Faction:** Charter of Soundings
- **Location:** Outer Moorings, rescue pier, emergency launch corridors

### Edda Brine
- **Role:** Kitchen matron, morale broker, quiet organiser
- **Species/Background:** Human, Furnace Row mainstay, knows who is hungry before they admit it and who is organising before they know it themselves.
- **Motivation:** Keep the kitchens running because food is the only thing standing between grievance and catastrophe.
- **Secret:** Edda's ration ledgers are one of the best predictors of unrest anywhere in the anchorage.
- **Reveal condition:** Help the kitchens during shortage, refuse to exploit a ration crisis, or ask the right question about watered broth.
- **Arc:** Practical caretaker -> neighbourhood organiser -> one of the first people who can turn hardship into collective action
- **Disposition start:** Friendly-appraising
- **Speech pattern:** Warm until crossed, then exact enough to count against.
- **Faction:** Unaligned, Wakebound-sympathetic
- **Location:** Furnace Row and ration kitchens

### Sol Morrow
- **Role:** Clamp-rail dispatcher, transit fixer, witness to everything that moves
- **Species/Background:** Human, rail-born, keeps the Spine running with a whistle, a ledger stylus, and contempt for anyone who thinks transport is neutral.
- **Motivation:** Keep the rail alive and stop delay from becoming a weapon against the same districts every time.
- **Secret:** Sol can prove several recent transit failures were chosen, not accidental.
- **Reveal condition:** Investigate a clamp derailment, protect a worker transfer, or buy time for a crowd instead of cutting through it.
- **Arc:** Harried technician -> indispensable witness -> transit strike architect if the city keeps learning the wrong lessons
- **Disposition start:** Neutral-busy
- **Speech pattern:** Fast, clipped, full of timetable metaphors.
- **Faction:** Transit crews
- **Location:** Clamp-Rail Spine

### Prelate Venn Arcos
- **Role:** Choir hardliner, doctrinal antagonist, respectable censor
- **Species/Background:** Human, polished, educated, and sincerely convinced that panic makes cowards of the dead as well as the living.
- **Motivation:** Keep memory under disciplined stewardship and prevent the Array from becoming a populist weapon.
- **Secret:** Venn knows the Choir's emergency scripts were used to manage riot testimony after earlier mass-loss events.
- **Reveal condition:** Force a doctrinal debate, break a sealed hymn vault, or corner him with corroborated witness memory.
- **Arc:** Smooth authority -> exposed censor -> dangerous man with a holy vocabulary for suppression
- **Disposition start:** Suspicious-courteous
- **Speech pattern:** Silk over steel.
- **Faction:** Velvet Choir
- **Location:** Choir Steps, doctrinal chambers

### Captain Serit Nox
- **Role:** Pilgrim convoy master, refugee advocate, frontier witness
- **Species/Background:** Human, ship-born, captain of a patched hospice hauler that has become three families and one legal fiction tied together by bolts.
- **Motivation:** Keep the Pilgrim Chain moving and stop the rich core ports from treating overflow as weather.
- **Secret:** Serit carries sealed testimony from three frontier settlements that already know route collapse is being exploited.
- **Reveal condition:** Aid a refugee docking, escort a Pilgrim hull, or protect testimony instead of cargo.
- **Arc:** Tired witness -> respected ally -> voice that can pull the wider frontier into the campaign
- **Disposition start:** Guarded
- **Speech pattern:** Slow, deliberate, never wastes outrage.
- **Faction:** Pilgrim Chain
- **Location:** Pilgrim Landing and convoy decks

### Dren Vale
- **Role:** Lantern Verge factor, food-lane negotiator, off-station stakeholder
- **Species/Background:** Human, greenhouse-bred, dresses plainly because food merchants who look expensive get robbed first.
- **Motivation:** Keep Lantern Verge fed, lit, and independent of pure Concord pricing logic.
- **Secret:** Dren suspects White Maw was sabotaged long before anyone in Cinder Anchorage started saying so aloud.
- **Reveal condition:** Follow food shortages outward, answer Verge distress traffic, or expose Concord timing around crop futures.
- **Arc:** Distant supplier -> pressured partner -> crucial anchor for any humane frontier settlement
- **Disposition start:** Neutral-practical
- **Speech pattern:** Agricultural metaphors deployed like threat assessment.
- **Faction:** Lantern Verge
- **Location:** Coalglass Market, Outer Moorings

### Ivo March
- **Role:** Fuel broker, debt engineer, smiling vulture
- **Species/Background:** Human, Concord-aligned, carries himself like a man who has never touched a loader winch and still thinks that means discipline.
- **Motivation:** Own launch timing by owning fuel timing.
- **Secret:** Ivo has been bundling rescue traffic and speculative freight into the same financial products.
- **Reveal condition:** Audit Broker Ninth, intercept a fuel note bundle, or follow Pall's suspicions far enough.
- **Arc:** Side broker -> structural villain -> useful hostage to whatever economic order replaces him
- **Disposition start:** Suspicious
- **Speech pattern:** Soft, affable, predatory in the pauses.
- **Faction:** Market Concord
- **Location:** Broker Ninth Counting House

### Nera Coil
- **Role:** Rig chief, Wakehold enforcer, labour realist
- **Species/Background:** Human, older than most current dock grudges and stronger than some of them.
- **Motivation:** Keep the co-op from being turned into heroic scrap by people who like its symbolism more than its survival.
- **Secret:** Nera has hidden parts caches large enough to start or stop a strike's endurance window.
- **Reveal condition:** Share risk in Wakehold, help repair before negotiating, or defend a crew without expecting gratitude.
- **Arc:** Hard ally -> trusted operator -> the person who decides whether labour militancy stays defensive
- **Disposition start:** Watchful
- **Speech pattern:** Minimal, dry, and devastating when she finally commits to a view.
- **Faction:** Wakebound Union
- **Location:** Wakehold and Furnace Row

### Malk Tern
- **Role:** Berth clerk, leak vector, frightened hinge
- **Species/Background:** Human, junior Charter clerk, looks like the sort of man who became corrupt by surviving one month at a time.
- **Motivation:** Stay alive, keep his sister housed, and avoid becoming the first disposable culprit in a scandal built by superiors.
- **Secret:** Malk is not the whole leak, only the most visible, and he knows names above his pay grade.
- **Reveal condition:** Catch him during a manifest handoff, offer protection instead of spectacle, or let him think confession is cheaper than silence.
- **Arc:** Small coward -> key witness -> corpse, exile, or reluctant reform asset
- **Disposition start:** Nervous-hostile
- **Speech pattern:** Apologetic right up until panic takes over.
- **Faction:** Charter of Soundings
- **Location:** Sounding House records and clamp transfer desks

### Astra Pell
- **Role:** White Maw survivor, damaged witness, proof that yesterday's disaster never ended
- **Species/Background:** Human, former convoy navigator, one of the few living people who crossed White Maw during its first engineered collapse and kept enough memory to testify.
- **Motivation:** Make the right people finally hear what happened before her memory unravels or gets curated away.
- **Secret:** Astra remembers a route-balancing signature that predates Callis, the Shepherds, and the present crisis.
- **Reveal condition:** Treat the hospice as investigative ground, protect her from a memory edit, or bring her evidence strong enough to trust.
- **Arc:** Fragile witness -> cornerstone testimony -> living bridge between old and current catastrophe
- **Disposition start:** Fearful
- **Speech pattern:** Interrupted, lucid in bursts, absolutely devastating when the fragments line up.
- **Faction:** None
- **Location:** Salt Wound Hospice and Pilgrim Landing

### Jori Slate
- **Role:** Dock runner, gossip courier, low-level chaos engine
- **Species/Background:** Human, teenage message runner who knows which corridors are safe because they were never safe for adults to bother memorising.
- **Motivation:** Get paid, stay fast, and never become the slowest person in a bad hallway.
- **Secret:** Jori has accidentally carried pieces of three major conspiracies and remembers more than people think.
- **Reveal condition:** Tip fairly, protect them from collector pressure, or ask about routes instead of errands.
- **Arc:** Background runner -> useful informant -> inheritor of whichever city survives
- **Disposition start:** Friendly if paid, gone if not
- **Speech pattern:** Quick, irreverent, ruthlessly observant.
- **Faction:** Unaligned
- **Location:** Ember Quay, Clamp-Rail Spine, Market alleys

## Minor Roster

- **Use:** These are recurring faces for slow scenes, side errands, overheard politics, and consequence without full subplot overhead. They should make the anchorage feel inhabited even when the major cast is off-stage.
- **Mechanical note:** These are ambient recurring NPCs by default, not rival-tier roster entries. Promote them into full mechanical NPCs only if play keeps returning to them.
- **Escalation rule:** Do not build whole arcs around them unless the player insists. Let them become helpers, witnesses, casualties, or small moral anchors when bigger systems hit the street.

### Ember Quay and Coalglass

- **Quill Fen:** Dock-lamp rigger on Ember Quay who knows which blackouts were staged and which were real failures, but only speaks plainly when hanging upside down from a lighting brace.
- **Ressa Bole:** Tea and starch-cake seller near the auction pens who tracks who stopped tipping, who suddenly pays in Concord paper, and who drinks like they expect a death notice.
- **Cato Verne:** Weigh-cage spotter with one ruined eye and perfect memory for salvage lots, useful whenever cargo was resealed after inspection or swapped between manifests.
- **Deya Rhune:** Polish artist and petty seal-forger in Coalglass who can tell which fake documents are amateur work and which came from somebody with access to official dies.
- **Sira Keld:** Market chalk-runner who updates prices before merchants admit them, making inflation and panic-buying visible in real time.

### Wakehold and Furnace Row

- **Bex Tallow:** Clamp-rail grease hand who always smells like hot metal and notices sabotage by sound before paperwork notices it by absence.
- **Omi Hush:** Curtain-mender in the co-op dorms who knows who slept, who packed to leave, and who kept a berth warm for someone who never came back.
- **Par Lune:** Kitchen singer whose work chants sometimes become strike counts, making them a clean barometer for whether Furnace Row is moving toward solidarity or explosion.
- **Ral Beck:** Pressure-suit stitcher and boot patcher who can tell how desperate a crew is by what damage they are willing to ignore.
- **Henna Mott:** Ash-chute cleaner who passes under half the district unnoticed and hears organising, confessions, and whispered deals through vent grates.

### Moorings, Hospice, and Choir Steps

- **Tavi Sen:** Child minder at the rescue bunks who knows which arrivals are truly alone and which are being separated from witnesses on purpose.
- **Pev Rowan:** Hospice cup washer and corridor fixture who sees which beds receive unofficial visitors after lights-out and which patients wake speaking with borrowed memories.
- **Brother Alen Dross:** Ash porter for the Choir who looks devout, thinks logistically, and can identify when a reliquary shipment is too heavy for mere ritual.
- **Ysol Mere:** Shrine-copy novice who copies petition names into ledgers and can surface duplicate identities, ghost relatives, and grief that has been administratively trimmed.
- **Cori Wren:** Quarantine board painter at Pilgrim Landing who knows when restrictions are genuine disease control and when they are crowd management dressed up as medicine.

### Transit, Registry, and Frontier Traffic

- **Vek Harrow:** Clamp caller with theatre-school lungs and no patience for officials slowing the wrong cage, ideal whenever transit becomes public politics.
- **Cinna Rell:** Launch-slate copyist in the Sounding House who privately memorises the names erased between draft and final board.
- **Rho Keel:** Deckhand on the *Needle Grant* who believes rescue is work rather than heroism and can describe the outer districts before reports are edited.
- **Tam Orell:** Freezer tech on the *Distant Loam* and usually the first person in harbour to know when crop shipments are short, spoiled, or deliberately misdeclared.
- **Lysa Quen:** Hull-tax clerk at private Broker Ninth clamps who smiles constantly, notices everything, and can usually tell whether a courier cutter is carrying contracts, bribes, or panic.

### Floating Regulars

- **Hesh Brindle:** Brother of a *Saint Brindle* crewman who checks the missed-return board at every second Names Bell, keeping the registry crisis human and visible.
- **Nomi Valek:** Cardsharp on Furnace Row bunks who wins mostly from people too tired to count and hears more about wage cuts and private jobs than any formal office.
- **Erel Pike:** Off-duty tug mechanic who drinks in three different districts to avoid belonging wholly to any one of them, useful when Charter machinery needs explaining without Charter rhetoric.
- **Sada Thorn:** Daxa's estranged cousin in the moorings, angry at memorial politics and useful for showing that even truth keepers have family fractures.
- **Kel Marr:** Pilgrim galley hand who trades soup for names, rumours, and off-station news, keeping the wider frontier present during local scenes.

## NPC Relations

- **Use:** The city should pass information faster than the player expects, but less cleanly than any institution claims. When one NPC moves, trust shifts through linked people before it becomes public fact.
- **Rule of play:** Whenever the player materially changes one NPC's trust, update two linked people as well: one who benefits from that new closeness and one who feels threatened by it.
- **Visibility tags:** Treat some links as public, some as district knowledge, and some as hidden until exposed through scenes, mistakes, or deliberate investigation.

### Principal Web

- **Sael Vane <-> Havel Pike:** Mutual respect warped by policy. Havel still believes Sael could choose rescue first; Sael thinks Havel mistakes conscience for governance.
- **Sael Vane <-> Tamsin Reed:** Cold partnership built on launch timing, debt pressure, and mutual blackmail.
- **Sael Vane <-> Daxa Thorn:** Daxa treats Sael as the face of erased names; Sael sees Daxa as a truth-teller who can detonate civic order.
- **Sael Vane <-> Malk Tern / Cinna Rell:** The registry chain beneath her authority is staffed by frightened clerks who know too much and trust her less than they fear what replaces her.
- **Tamsin Reed <-> Ivo March / Brin Roe / Lysa Quen:** Money, errands, and clamp intelligence; if one breaks, the whole Concord edge gets noisier.
- **Mother Ioris <-> Yara Sunfold / Prelate Venn:** One institution, two moral directions: care and control.
- **Oren Silt <-> Jori Slate / Quill Fen / Cato Verne:** Dock whisper network with better memory than the Sounding House.
- **Daxa Thorn <-> Havel Pike / Hesh Brindle / Sada Thorn:** Grief, manifest truth, and family resentment all pull on the same bell ropes.
- **Havel Pike <-> Serit Nox / Rho Keel / Erel Pike:** Rescue caucus core and its civilian edge.
- **Edda Brine <-> Nera Coil / Sol Morrow / Par Lune / Nomi Valek:** Kitchens, transport, labour mood, and after-shift rumour all converge here.
- **Serit Nox <-> Dren Vale / Kel Marr / Cori Wren / Astra Pell:** Frontier witness chain connecting food, refugees, and testimony.
- **Yara Sunfold <-> Astra Pell / Pev Rowan / Mother Ioris:** Care can become evidence or censorship depending on who reaches a patient first.

### Neighbourhood Links

- **Ember Quay:** Lio Marr quietly trades odd manifests to Oren; Ressa Bole hears which Charter staff are cracking; Cato Verne and Quill Fen corroborate when a blackout or lot swap was staged.
- **Coalglass Market:** Pera Flint gives Brin temporary cover; Deya Rhune and Sira Keld can identify forged seals and panic pricing faster than Concord admits either exists.
- **Wakehold and Furnace Row:** Toll Renn, Omi Hush, Ral Beck, and Henna Mott form an unofficial welfare web around Nera and Edda.
- **Moorings and Pilgrim Landing:** Veda Rusk, Sova Trask, Tavi Sen, Cori Wren, and Kel Marr know which arrivals were counted honestly and which were administratively thinned.
- **Hospice and Choir:** Len Miri, Pev Rowan, Brother Alen Dross, and Ysol Mere see the human residue of every edited testimony, heavy reliquary, and suspiciously timed visit.
- **Transit and Registry:** Sol Morrow, Bex Tallow, Vek Harrow, Cinna Rell, and Malk Tern can usually prove sabotage or clerical manipulation, but almost never in the same room at the same time.

### Who Hears First

- **If the player wins Sael's confidence:** Havel hears by direct work, Tamsin by clamp gossip, and Daxa by discrepancy in the public story.
- **If the player crosses Mother Ioris:** Venn hardens immediately and Yara becomes much more careful with access.
- **If the player protects refugee or rescue traffic:** Serit, Havel, Daxa, Veda Rusk, and Sova Trask all hear within the next bell cycle.
- **If the player manipulates markets or steals from Concord:** Tamsin reacts strategically, Ivo reacts financially, Lysa Quen notices the courier pattern, and Sira Keld notices the street consequence.
- **If the player stabilises kitchens or transit:** Edda and Sol spread the story in different classes of audience, which means both labour and officials hear by next shift.
- **If the player starts chasing ghost ledgers:** Cinna Rell goes quiet, Malk panics, Daxa opens one more drawer, and Sael decides whether to help or contain.
- **If the player helps Astra Pell remember cleanly:** Yara trusts faster and Venn starts preparing to call the testimony unstable.
- **If the player becomes visibly generous to the minor cast:** The anchorage starts offering unasked help in small forms: bunk space, copied keys, early warnings, and the right rumour at the right bell.

### Relationship Temperature States

- **Wary:** Conversation shortens, practical help still happens, and everyone pretends the distance is about efficiency rather than injury.
- **Warm:** People volunteer context, not only facts. They start telling the player who else matters instead of guarding access as leverage.
- **Indebted:** Help becomes immediate and slightly dangerous. The person will overextend once, then expect the debt to become legible in behaviour later.
- **Strained:** Third parties start hearing about the relationship before the player does. This is how the city tells you something already broke.
- **Mended:** Trust returns unevenly. The first sign is usually mundane: a copied key, a saved bowl, a corrected name, a warning given without ceremony.
- **Grieving:** The relationship now routes through an absence. Any request touching the missing person or failed scene carries more voltage than its surface wording suggests.

### Private Contradictions

- **Sael Vane:** Wants order that can be defended in daylight, but repeatedly relies on private containment, selective truth, and unofficial favours to keep the docks from tearing open.
- **Havel Pike:** Talks like rescue should outrank policy, but still needs Charter signatures, chartered fuel, and legal cover to keep his crews airborne.
- **Tamsin Reed:** Profits from managed scarcity and still genuinely hates uncontrolled collapse, because dead markets are less useful than frightened living ones.
- **Mother Ioris:** Believes memory should be protected from power and keeps proving it by deciding who can bear the truth without being broken by it.
- **Halek Ves:** Wants public knowledge, but his research tempo is often subsidised by workers absorbing risk he can later describe elegantly.
- **Daxa Thorn:** Treats names as sacred truth while still withholding them whenever timing is the difference between witness and retaliation.

### Dependence Chains

- **Food chain:** Edda and Nera hold morale, but they depend on Dren Vale's arrivals, Kel Marr's off-station barter, and Sira Keld noticing price shifts before the line turns ugly.
- **Sleep chain:** Toll Renn, Jori Tern, Sova Trask, and Aunt Keph decide where bodies can safely stop being visible. Their choices quietly determine who is rested enough to keep telling the truth.
- **Medicine and memory chain:** Len Miri, Yara, and Pera Flint move patches, sedatives, and quiet triage around official shortages, which means health is already partly a shadow commons.
- **Paper chain:** Lio Marr, Cinna Rell, Veda Rusk, and Daxa do not control law, but they control whether law can still be cross-checked by human eyes.
- **Mobility chain:** Sol, Bex, Oren, Tor Jast, and Havel each hold one boring piece of the city's movement system. If any two stop cooperating, whole districts start behaving like islands.
- **Child and witness chain:** Tavi Sen, Cori Wren, Pev Rowan, and Serit Nox together decide whether the vulnerable remain people, become evidence, or disappear into procedure.

### Dependency Signals For Play

- **If a keeper vanishes, do not only remove information.** Remove sleep, hot food, copied keys, patched gear, or witness confidence from scenes that depended on them.
- **If the player protects a mundane chain, pay it back mundanely first.** A safer bunk, a faster bowl, a cleaner permit copy, or a quiet warning should precede big plot reward.
- **If one district's dependency web collapses, another district should feel the cost by next bell.** The city works because favours travel faster than doctrine.

### Ordinary Ambitions In Circulation

- **Dry boots for a full week:** a real aspiration for bunk workers, runners, and anyone living berthside.
- **A private room with a latch that holds:** what clerks, med staff, and small keepers dream about when they say they want "stability."
- **One child apprenticed somewhere safer than the clamps:** a common family goal in the Moorings and Furnace Row.
- **Enough saved sealant to choose one emergency freely:** the practical version of dignity among pilots and divers.
- **Real sugar for a memorial tea:** tiny, expensive, and emotionally enormous.
- **A berth that stays yours even if you vanish for one shift:** the working-class definition of security.
- **To leave well rather than flee badly:** the dream that keeps half the city pretending the next route might still be chosen on purpose.

## NPC Knowledge Map

- **Use:** Treat truth as unevenly distributed. Most people know effects, fewer know mechanisms, and only a handful know intent.
- **Reading guide:**
  - **Knows:** Has direct evidence, witnessed the event, or is part of the mechanism.
  - **Suspects:** Has enough pattern recognition to lean the right way, but cannot yet prove it.
  - **Curates a false version:** Knows or suspects more, but actively maintains a safer public story.
  - **Best corroboration:** Secondary source least likely to share the same bias.
- **GM rule:** A secret becomes stable public truth only when the player gets two corroborating voices from different social layers, such as one institutional source and one street-level source.

### The Dock Leak Is Structural

- **Knows:** Oren Silt, Brin Roe, parts of the Shepherd courier chain, at least one unseen superior above Malk.
- **Suspects:** Sael Vane, Daxa Thorn, Cato Verne, Quill Fen, Jori Slate.
- **Curates a false version:** Sael publicly frames the problem as a limited breach; Malk tries to behave like he is the whole problem because it is cheaper than naming the rest.
- **Best corroboration:** Bell Tower berth discrepancies, Brin's delivery memory, and Cinna Rell's draft-to-final registry differences.

### Ghost Crews Still Rule the Ledger

- **Knows:** Daxa Thorn, Cinna Rell, Ivo March, someone inside Concord actuarial rooms, and at least one Bell Tower copyist now dead or disappeared.
- **Suspects:** Havel Pike, Sael Vane, Hesh Brindle, Sova Trask, Veda Rusk.
- **Curates a false version:** Charter offices call these clerical lag; Concord calls them legacy obligations; both are lying by scale if not by raw existence.
- **Best corroboration:** Daxa's hidden copies, fuel-note residue, and Havel's rescue manifests.

### Scarcity Has Investors

- **Knows:** Tamsin Reed, Ivo March, Lysa Quen, selected Broker Ninth tacticians.
- **Suspects:** Dren Vale, Sira Keld, Edda Brine, Tam Orell.
- **Curates a false version:** Concord insists it is merely pricing risk; Sael sometimes repeats that line when she needs launches to continue without riot.
- **Best corroboration:** Broker Ninth timing, Lantern Verge cargo gaps, and Furnace Row price-board jumps logged by Sira.

### Knowledge Pockets by District

- **Ember Quay knows manifests, blackouts, and who was physically present when a story changed.** Best faces: Lio Marr, Cato Verne, Quill Fen, Oren Silt.
- **Coalglass knows price movement, courier traffic, and which documents are false in style before they are false in fact.** Best faces: Pera Flint, Deya Rhune, Sira Keld, Lysa Quen.
- **Wakehold knows which danger is practical, which is staged, and who is being asked to die cheaply.** Best faces: Nera Coil, Ral Beck, Omi Hush, Bex Tallow.
- **Furnace Row knows morale collapse first.** Best faces: Edda Brine, Par Lune, Henna Mott, Nomi Valek.
- **Moorings and Pilgrim Landing know who arrived, who was omitted, and which testimonies were thinned before entering official channels.** Best faces: Daxa Thorn, Veda Rusk, Sova Trask, Tavi Sen, Cori Wren, Kel Marr.
- **Hospice and Choir spaces know what memory has been touched, curated, or delayed.** Best faces: Yara Sunfold, Pev Rowan, Len Miri, Brother Alen Dross, Ysol Mere.
- **Transit and registry spaces know when delay is policy rather than failure.** Best faces: Sol Morrow, Vek Harrow, Cinna Rell, Malk Tern, Havel Pike.

### Common Misreadings

- **Sael Vane is often mistaken for knowing everything.** In truth she knows enough to fear systemic scandal, but not enough to control it cleanly.
- **Mother Ioris is often mistaken for either pure censor or pure guardian.** She is both, at different moments, which makes her more dangerous than either role alone.
- **Tamsin Reed is often mistaken for the architect of every market abuse.** He is a major operator, but some of the worst structures predate him and will survive him.
- **Daxa Thorn is often mistaken for a grieving archivist with good instincts.** She has harder proof than most power brokers realise.
- **Minor NPCs are often mistaken for flavour.** In this setting, they are the safest route to unbiased corroboration because they see consequences before doctrine reaches them.

## Faction Dynamics

### Faction Legibility At First Contact

- **Charter of Soundings:** Public promise: clean launches and hard choices made by adults. Private rot: selective omission and enclosure disguised as order. Practical usefulness: permits, escorts, rescue corridors, legal cover. Method: paperwork, queue control, and emergency authority.
- **Wakebound Union:** Public promise: nobody should dive, patch, or starve alone. Private rot: kin bias, exhaustion, and a willingness to turn leverage into moral certainty. Practical usefulness: labour, repair, hidden routes, local protection. Method: solidarity, tools, and stoppage.
- **Market Concord:** Public promise: liquidity, supplies, and options while everyone else panics. Private rot: profit built directly out of managed loss. Practical usefulness: money, rare gear, transport access, fast intelligence. Method: debt, pricing, and elegant pressure.
- **Velvet Choir:** Public promise: dignity, witness, and care for minds the frontier would rather grind down. Private rot: curation that shades easily into censorship. Practical usefulness: hospice access, reliquaries, testimony, and moral authority. Method: ritual, archives, and social permission.
- **Null Shepherds:** Public promise: nobody should own survival. Private rot: attrition, theatrical cruelty, and a habit of treating collapse as clarification. Practical usefulness: black routes, hard passage, destabilising force. Method: sabotage, raids, and fear.
- **GM use:** Teach factions through what they can do for or to the player in one scene, not through ideology dumps.

### Charter of Soundings
- **Starting disposition:** Neutral (5)
- **Ideology:** Stability is a thing built by gatekeeping before it is defended by force.
- **Internal caucuses:** Dock hardliners want curfew, scarcity discipline, and visible obedience; the rescue caucus around Havel wants legitimacy through saved lives and clean tallies; registry quietists want the scandal contained above all because they know the ledgers are already structurally compromised.
- **Fault line:** The Charter can survive embarrassment, but not proof that its paperwork has been governing through selective omission for years.
- **Shifts positive if:** Player preserves public order, protects launches, shares evidence privately, limits panic
- **Shifts negative if:** Player humiliates the Charter, opens licensed routes to unregulated access, aids outright dock sabotage
- **At +50 (Allied):** Official route support, chartered escort, legal cover in the anchorage
- **At -50 (Hostile):** Wanted status, permit revocation, armed seizure attempts around the Vault

### Wakebound Union
- **Starting disposition:** Neutral-positive (10)
- **Ideology:** If labour keeps everyone breathing, labour deserves more than scraps and gratitude.
- **Internal caucuses:** Co-op mutualists want public burden rotation and stronger commons law; deep-run pragmatists mostly want tools, route autonomy, and fewer speeches; young rupture crews increasingly think the powerful only understand sabotage once every legal route has been priced shut.
- **Fault line:** Wakebound solidarity strains hardest when rescue, strike leverage, and private kin obligation all point at different hulls on the same shift.
- **Shifts positive if:** Player shares risk, honours co-op agreements, exposes permit corruption, keeps routes from becoming private property
- **Shifts negative if:** Player sells access upward, treats Wakebound labour as disposable, enforces Charter exclusivity
- **At +50 (Allied):** Hidden routes, manpower, ship maintenance, neighbourhood protection
- **At -50 (Hostile):** No quiet access to docks, sabotage, loss of local legitimacy

### Market Concord
- **Starting disposition:** Neutral (0)
- **Ideology:** Scarcity is information with a price attached.
- **Internal caucuses:** Risk engineers want volatility managed and legible; shock buyers want panic sharp enough to securitise; continuity brokers want the city barely stable enough that future profit survives the present extraction.
- **Fault line:** Concord's biggest fear is not riot but forced transparency, because a truly legible market would reveal how many instruments require loss to stay solvent.
- **Shifts positive if:** Player makes profitable deals, protects trade, accepts leverage as the natural language of crisis
- **Shifts negative if:** Player exposes Concord double-dealing, crashes a market, reveals the real cost of atlas certainty
- **At +50 (Allied):** Funding, rare equipment, fast information
- **At -50 (Hostile):** Price manipulation, blacklisting, hired intermediaries working against the player

### Velvet Choir
- **Starting disposition:** Neutral-low (-5)
- **Ideology:** Memory must be curated or power will edit the living through the dead.
- **Internal caucuses:** Pastoral wardens want care before doctrine; harmonic technicians want the buried systems understood and, if necessary, reopened; doctrinal curators want every dangerous truth filtered through hierarchy even when delay starts looking like complicity.
- **Fault line:** The Choir can survive heresy more easily than it can survive proof that its gentlest practices have also been tools of political thinning.
- **Shifts positive if:** Player treats the hospice and reliquaries with respect, returns what was stolen, protects memory from commodification
- **Shifts negative if:** Player loots sacred archives, weaponises extracted memories, dismisses grief as a luxury
- **At +50 (Allied):** Ritual guidance, trusted access to restricted memory spaces, moral authority in the finale
- **At -50 (Hostile):** Closed shrines, edited testimony, spiritual denunciation that matters politically

### Null Shepherds
- **Starting disposition:** Unfriendly (-30)
- **Ideology:** No route should stay stable long enough for ownership to harden around it.
- **Internal caucuses:** Pure breakers want attrition and exemplary fear; haven-builders want displaced people, deserters, and black-route families protected behind the violence; opportunists wear Shepherd colours because collapse creates careers for anyone ruthless enough to harvest it.
- **Fault line:** The Shepherds fracture whenever protecting the unwanted starts slowing the war against the systems that made them unwanted.
- **Shifts positive if:** Player destroys monopolies violently, proves institutions cannot be trusted, bargains from strength
- **Shifts negative if:** Player stabilises access, protects civilians, or builds any durable governance structure
- **At +50 (Allied):** Fear-backed passage through hostile drift zones and a catastrophic ending waiting to happen
- **At -50 (Hostile):** Boarding actions, sabotage, targeted strikes on crew and route infrastructure

### Linked Factions
- Charter of Soundings and Wakebound Union are **opposed**.
  A gain of +20 with one usually imposes -10 with the other unless the player solves a concrete shared problem.
- Market Concord benefits whenever scarcity survives.
  Large positive shifts with either Charter or Wakebound should usually create a smaller positive shift with Concord unless the player exposes market profiteering publicly.
- Velvet Choir opposes anyone who treats the atlas as purely commercial.
  Major Concord gains should drag the Choir downward unless offset by sincere restitution.
- Null Shepherds rise whenever public trust fails.
  If the player repeatedly solves problems with secrecy, coercion, or selective truth, Shepherd pressure should intensify even if their nominal standing does not.

## Hidden Truth Ladder

- **Use:** Not every secret should surface in the demo. The entries below cover only those truths that can first become legible during the auction night and the immediate aftermath.

### Secret Surface Map

- **Secret 1 - The Dock Leak Is Structural:** Surface symptom: the same loaders, berth hands, and missing names recur around supposedly isolated failures. False explanation: one bad clerk or one clever bribe. Who benefits from that explanation: supervisors, couriers, and any institution that can survive scandal but not ecology. Cheapest first glimpse: compare a blackout-night berth list with Brin's memory and one dockside hand-copy.
- **Secret 4 - Ghost Crews Still Rule the Ledger:** Surface symptom: dead crews keep holding bunks, permits, and payment timing in place. False explanation: harmless clerical lag. Who benefits: insurers, berth controllers, and anyone buying time by leaving grief unfinalised. Cheapest first glimpse: notice one rescue manifest that still does not release a bunk after a confirmed loss.

### Secret 1 - The Dock Leak Is Structural
- **Truth:** The Shepherds do not rely on a single bribed clerk. They exploit a whole ecology of debt, ghost permits, desperate loaders, and plausible deniability.
- **Best reveal path:** Sael's ledger, Brin's courier case, and Bell Tower manifests all pointing at the same missing names.

### Secret 4 - Ghost Crews Still Rule the Ledger
- **Truth:** The dead still hold permits, debt instruments, and legal precedent. The anchorage is partially governed by people it already abandoned.
- **Best reveal path:** Bell Tower Archive, rescue-caucus manifests, and Concord debt books.

## Prologue - Before the Blackout (3-5 scenes)
**Purpose:** Let the player live inside Cinder Anchorage before the crisis asks them to judge it. The prologue should teach one ordinary routine, one local strain, and one obligation worth carrying into the blackout.
**Shared rules:** Use only 2-3 locations. Introduce no more than five important setting terms. End with bells, power loss, or a direct summons pulling the player toward Ember Quay. No major atlas explanation belongs here.
**Required outputs:** By the handoff, the player should know one useful person, one vulnerable place, one small favour they actually managed to do, and one reason the blackout auction will hurt ordinary people more than powerful ones.

### Variant A - Rian Vale: The Missed Route
- **Emotional centre:** Loyalty and professional guilt before conspiracy.
- **First recognitions:** Oren Voss recognises the player's handwriting; Havel Pike recognises how late they arrived.
- **Scene P1 - Bell Copy:** At the Bell Tower or a clerk's annex, the player compares a folded route fragment against casualty tallies and realises Callis sent a warning about quay instability before vanishing. The task is practical: copy names correctly, mark one berth as unsafe, and decide whether to quietly fix the record or expose a discrepancy immediately.
- **Scene P2 - The Wrong Corridor:** The warning leads toward the Outer Moorings, where one rescue corridor is already being squeezed by auction traffic. The player can help Tavi Sen's bunk row secure a heater fuse, steady a panicking relative, or move one crate of filters before officials redirect attention back to the sale.
- **Scene P3 - The Cup and the Promise:** In a quieter corner of Salt Wound or a bell-side canteen, the player gets a short, ordinary exchange with Havel, Yara, or Edda about Callis's habits, what a late promise costs, and why the harbour keeps counting the dead aloud when nobody in power wants to hear it.
- **Handoff:** The bells double. Auction lamps flare under emergency law. Someone says Callis was meant to be at the quay already, and the player is pulled toward Ember Quay with the sense that this night is their fault in part, not only their opportunity.

### Variant B - Suri Kade: Shift Debt
- **Emotional centre:** Labour debt and abandonment before exploration.
- **First recognitions:** Wakebound deckhands know the player by shift history; Havel knows exactly which failed berth still follows their name.
- **Scene P1 - Mooring Shift:** Start at the Outer Moorings during a dirty, ordinary maintenance run. The player patches a line, takes abuse from someone who remembers the failed berth, and learns that rescue traffic is already being delayed because the quay is preparing for the auction under emergency law.
- **Scene P2 - Hold the Corridor:** The prologue's small problem is direct: keep one rescue launch from cancellation, keep one bunk from reassignment, or carry a patient and their gear across a clamp-rail bottleneck before the corridor closes. This is where Tavi's bunk row should first become human rather than symbolic.
- **Scene P3 - Furnace Row Debt:** In a kitchen, repair bay, or rail queue, the player gets a breath with Edda, Sova, or an older dockhand who makes the moral stakes plain in concrete terms: who gets soup, who gets charged for air, and who is told to wait while rich people auction certainty.
- **Handoff:** A messenger or dockwide recall reaches the player mid-task: the shard sale is going ahead, the berth is worsening, and if they want the Borrowed Tide later they need to show up now with more than excuses.

### Variant C - Mara Ilex: The Stanza You Kept
- **Emotional centre:** Complicity and fear of recognition before metaphysics.
- **First recognitions:** Someone at Salt Wound or the Choir steps knows the player's face from before they defected; Yara or a patient recognises the harm hidden inside polite ritual language.
- **Scene P1 - Hospice Quiet:** Begin in Salt Wound on an ordinary care errand: change a filter, copy a name, calm a memory-static episode, or decide whether to let a Choir formality stand when it clearly erases the wrong part of a patient's testimony.
- **Scene P2 - The Forbidden Stanza:** A whispered line of the route-song or an edited reliquary fragment reminds the player that the Choir once treated panic, witness, and memory as things to be managed at scale. The local choice is still small: protect one patient, keep one memory intact, or smuggle one copied statement out before it is harmonised away.
- **Scene P3 - Threshold Talk:** In a side chapel, kitchen corner, or outside ward corridor, the player gets a private exchange with Yara, Edda, or one exhausted aide who makes the stakes intimate rather than doctrinal: people are not afraid of mysteries tonight, they are afraid of being quietly filed into the wrong category of loss.
- **Handoff:** Choir alarms and quay bells overlap. Word arrives that a live atlas shard is being sold under emergency law, Callis is missing, and the player knows enough to fear that the wrong people are about to turn a crisis into liturgy.

### Variant D - Custom Character: Harbour-Chosen Lens
- **Rule:** Custom characters do not get a fourth emotional lane. Instead, the harbour routes them into one of the three lanes above.
- **Inference order:** Match explicit role or archetype first, then proficiencies, then dominant stat cluster. Use the `Rian` lane for cartographers, investigators, navigators, and lore-heavy builds; the `Suri` lane for divers, pilots, workers, repair hands, and survival-heavy builds; and the `Mara` lane for medics, speakers, defectors, and witness- or memory-facing builds.
- **Tie-break:** If a custom build lands between lanes, default to `Suri`. It gives the clearest material grounding and the least assumed backstory.
- **GM use:** Mirror the emotional lane, not the named biography. A custom character can inherit the same kind of harbour problem, recognition, and obligation without inheriting Rian's promise, Suri's exact failed shift, or Mara's specific Choir history.
- **Shared handoff:** However the lane is chosen, the prologue must still end with the same pull toward Ember Quay: one living shard, one missing cartographer, one public emergency, and one private obligation already in motion.

### Early Human Anchors
- **Havel Pike:** Straightforwardly useful authority. Keep him humane unless the player gives him a direct reason to close.
- **Yara Sunfold:** The clearest witness that dignity matters more than rhetoric.
- **Edda Brine:** The kitchen anchor who makes shortage legible without speeches.
- **Anchor spaces:** Outer Moorings for visible stakes, Salt Wound for intimate witness, Furnace Row for ordinary life under pressure.

### Recurring Human Obligation - Tavi's Bunk Row
- **Setup:** Seed this during the prologue when possible. Otherwise, after Beat 1, Havel or Sova can ask the player to keep an eye on Tavi Sen's rescue bunk row at the Outer Moorings.
- **Recurrence cadence:** Recur every 4-6 scenes with small needs: broth, a filter tab, a copied name, a heater fuse, a missing relative, or an honest explanation for delay.
- **Story function:** This row tracks whether the city is becoming more humane or merely more efficient.
- **Signals:** Neglect means emptied cots, moved families, and quieter questions; care means a place to sit, a quicker witness, a saved bowl, or a warning before order turns ugly.

### Human-Scale Texture Rules
- **Let some truths stay local:** A falsified death chit, a diverted ration crate, a borrowed name, or a missing med pouch can matter deeply without widening into system revelation.
- **Let some wins hold:** A rescue launch, a bunk, a meal line, a witness transfer, or a returned object should sometimes stay saved.
- **Show consequences socially before structurally:** Faces disappear, bowls cool, copied names slow down, and one door closes before the city changes policy.
- **Keep pettiness and kindness alive:** queue irritations, bad tea, territorial bunks, exhausted jokes, dry socks, and corrected names all matter.
- **Recur a few anchoring objects:** Daxa's brass shims, the cracked white cup, Oren's latch tool, Nera's ladle, and the Borrowed Tide sensor coil should keep the story tactile.

## Story Spine

### Opening State
- **Starting frame:** Run a 3-5 scene prologue keyed to the chosen character before the blackout auction.
- **Common handoff room:** `ember_quay` (Cinder Anchorage - Ember Quay)
- **Opening scene:** After the prologue handoff, Scene 1 begins at night during the blackout auction under emergency law.
- **GM setup note:** If running from the authored structure rather than only the embedded payload, play the matching prologue first, then use `tag state sync --apply --scene 1 --room ember_quay` and render Beat 1 from Act 1.

### Opening Priorities
- **Keep the first hour to one visible problem:** hold a rescue corridor and one vulnerable bunk row together long enough to understand why Callis vanished and why the auction matters.
- **Stage the opening as contested attention:** the shard, the missing cartographer, and the harbour crisis should compete for focus inside the same night rather than arrive as three separate mysteries.
- **Keep the first ten scenes concrete:** rescue pressure -> stripped berth -> queue or kitchen -> hospice or bunk row -> private conversation -> departure logistics.
- **Control early noun-load:** In the first 5-6 scenes, `the Charter`, `the Wakebound`, `the Choir`, and `Callis` are enough. Introduce everything else through use.
- **Keep one mundane beat every 3-4 scenes:** work, waiting, repair, gossip, tea, or awkward gratitude should keep the setting human before it turns grand.

### Act Emotional Verbs
- **Act 1:** Care
- **GM use:** If a scene does not serve the act's verb, cut it, quiet it, or move its information into a more human exchange.

### Act 1 - The Quay Blackout (Scenes 1-20)
**Tension range:** 2-4
**Goal:** Establish the anchorage as a place worth caring about, introduce the atlas shard, and let the player spend time learning who gets protected when people say "safety."

#### Beat 1: The Auction Under Emergency Law (Scenes 1-4)
- **Type:** Discovery / social
- **Setup:** Ember Quay is blacked down except for the auction lamps. A live atlas shard is due to change hands under Charter control just as a damaged berth at the outer moorings begins losing pressure. Oren knows Callis Dray is missing. Havel is trying to keep a rescue corridor open while the quay fills with brokers, guards, and witnesses. Every faction is present, but the player's first understanding of the crisis should be simple: rich people are arguing over certainty while ordinary people are trying to keep one ship alive.
- **GM priority:** Run the failing berth as the dominant opening line. Let the auction and Callis's disappearance complicate that pressure rather than replace it.
- **Decision point:** How to respond to the auction
  - Step away from the auction to help the failing berth or the people trapped behind it
  - Ignore the sale and investigate Callis's disappearance first
  - Bid, bluff, or publicly disrupt the sale
  - Steal the shard in the blackout
  - Follow a faction representative instead of the shard itself
- **Consequences:** The player defines their first public reputation, which kind of problem they instinctively treat as urgent, and which faction or neighbourhood believes they are serious. Social effects should show by next scene, not next chapter.
- **Foreshadowing planted:** The new route-song, Sael's private ledger, Brin's false courier case, the first mention of low-tide closure

## Encounter Tables

### Ember Quay - Night Shift Friction (d6)
1. Dockworkers nearly come to blows over a cancelled launch slot.
2. A Charter inspector asks the wrong question in the wrong tone.
3. No new encounter, just the crowd leaning toward the auction bell like a weather front.
4. Brin Roe tries to move a case through the blackout under borrowed authority.
5. A Wakebound mechanic begs for med gel and offers a hidden route-sign in return.
6. A hush ripples through the quay as the route-song becomes audible to everyone at once.

### Coalglass Market - Pressure Deals (d6)
1. Tamsin offers the player a deal that solves one problem and creates two.
2. Empty lane, shuttered stalls, someone clearly warned the market ahead of trouble.
3. Counterfeit pressure seals hit the floor from a fleeing courier.
4. A Choir broker auctions a memory fragment instead of merchandise.
5. Debt collectors corner a supplier the player needs alive.
6. Null Shepherd money surfaces in a transaction no loyalist should touch.

### Outer Moorings - Rescue Traffic (d6)
1. A Pilgrim Chain hull arrives with a failing seal and a song in its sensor logs.
2. Havel Pike demands immediate hands for evacuation, politics be damned.
3. Daxa hears the bell answer itself from inside the tower.
4. A refugee manifest does not match the people stepping off the gangway.
5. Charter inspectors arrive ready to treat triage as a permit problem.
6. Someone tries to steal the dead from the archive before the living can read them.

### Bell Tower Archive - Silent Evidence (d4)
1. A ledger slip names someone still alive and owing debt under a dead crew's permit
2. Daxa finds a manifest page Sael never saw
3. A hidden speaker carries the Array's ash-hum into the tower for one scene
4. Someone has already removed exactly the page the player came to find

### Clamp-Rail Spine - Transit Pressure (d6)
1. A derailment strands the wrong people together long enough to change politics
2. Sol Morrow asks for hands before the inspectors arrive
3. Cargo marked as kitchen goods is clearly something else
4. Clamp police lock down a platform over one missing manifest stub
5. A runner passes through with a message meant to become public if intercepted
6. A cage arrives carrying someone who should have been dead, absent, or richer

### Furnace Row - Shift-End Heat (d6)
1. Edda Brine shortens portions and everyone notices
2. Nera Coil shuts down a recruiter with one sentence and no movement
3. Someone starts a song that is really a strike count
4. No incident, just everyone listening to the ration bell too carefully
5. Debt collectors misread the room and become the evening's lesson
6. A Lantern Verge shipment turns up late enough to look sabotaged

## Loot and Rewards

### Act 1 Rewards
- **Breaking the auction or surviving it cleanly:** 50 XP, one atlas shard trace, immediate faction shift depending on method
- **Reconstructing Callis's disappearance:** 30 XP, berth evidence, one hidden route clue
- **Securing the Borrowed Tide:** 50 XP, ship access, crew support, reputation with either Wakebound or Charter

### Merchant Inventory - Coalglass Market, Broker Ninth

| Item | Type | Tier | Price | Effect |
|------|------|------|-------|--------|
| Pressure seals (3) | Consumable | 1 | 20 cr | Ignore one minor hull leak or decompression complication |
| Reef lantern | Gear | 1 | 35 cr | Reveals hidden glyph bloom and false reflective corridors |
| Resonance veil | Gear | 2 | 90 cr | Advantage on checks involving route-song or memory static |
| Charter override chit | Key item | 2 | 140 cr | One use to bypass a licensed gate before consequences land |
| Mnemonic anchor coin | Relic | 3 | 260 cr | Stabilises one memory echo long enough to question it |
| Silent mag-boots | Gear | 3 | 320 cr | Improved movement on exposed hull and zero-grav surfaces |

---

## Demo Ends Here

*The Glass Reef Atlas demo covers the Prologue and the Auction Under Emergency Law (Scenes 1–4).*

*The full campaign continues across 4 more acts (96–128 scenes), including:*
- *Beat 2: An Empty Berth and Three Distress Pings — investigation phase*
- *Beat 3: Borrowed Passage — securing a ship and allies*
- *Three branching Act 2 routes through the Reef, the Lockdown Ledger, or the Choir Undertow*
- *Acts 3–5: civic transformation, the Spindle, the Crown Below, and the fate of the frontier*

*The full skill is available on Gumroad: [The Glass Reef Atlas — Full Campaign](https://gumroad.com/)*
