# Scenarios — Starter Scenarios and Theme Adaptation
> Module for text-adventure orchestrator. Always loaded — provides scenario selection and theme adaptation.

This module defines the starter scenarios presented to the player at game start and the rules
for adapting scenarios to any genre or setting.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: all other modules.

---

## Scenario Card Format

Present four scenario cards in a widget. Each card contains:
- **Scenario number** (1–4)
- **Genre badge** — colour-coded by tone (horror = blue, thriller = teal, exploration = coral,
  sci-fi = purple, fantasy = amber, heist = pink, mystery = indigo, survival = grey)
- **Title** — evocative, specific, no more than 5 words
- **Hook** — 3–4 sentences. Sets the immediate situation. No spoilers. Ends on tension or a question.
- **Flavour tags** — three tags describing setting, role, and tone
- **Selection button** — `sendPrompt('I choose Scenario N: [Title]. Let\'s begin.')`

Footer note: "Tap any card to select — your character sheet will be generated on confirmation."

---

## Default Theme: Space

### 1. Generation Ship Colonist
Tags: `deep space` · `survival` · `political`

You have lived your entire life aboard the *Exodus Meridian*, a generation ship three centuries
into a journey none of the original crew survived to see. Your section — Deck 14, Hydroponics —
has just been sealed off. No announcement. No explanation. The bulkhead doors simply closed.

**Recommended modules:** ship-systems, crew-manifest, lore-codex, save-codex
**Tone:** Claustrophobic, political, slow-burn mystery with survival pressure.

### 2. Mining Barge Engineer
Tags: `asteroid belt` · `blue collar` · `mystery`

The *Grit Anvil* is a Kessler-class mining barge, held together by welding flux and stubbornness.
You keep her running. Fourteen hours ago, the drill punched into something that is not rock. The
core samples are warm. The company wants you to keep drilling.

**Recommended modules:** ship-systems, crew-manifest, star-chart, lore-codex, save-codex
**Tone:** Industrial horror meets workplace drama. The mystery is underground.

### 3. Trade Station Bartender
Tags: `station life` · `intrigue` · `social`

Waypoint Sigma sits at the junction of three shipping lanes and two disputed borders. You pour
drinks at the *Last Catch*, a bar where everyone talks too much. Tonight, a regular has not
shown up. Their tab is still open. Their ship is still docked. Their cabin does not answer.

**Recommended modules:** geo-map, lore-codex, ai-npc, save-codex
**Tone:** Noir-flavoured social intrigue. Everyone has a secret. The bartender sees everything.

### 4. GM's Choice

Generate a fourth scenario that complements the above three. It should offer a distinct tone
and gameplay style not already covered. Possibilities include:
- **Salvage Operator** — derelict ships, environmental hazards, moral dilemmas about property
- **Diplomatic Courier** — high-stakes delivery, faction politics, trust no one
- **Research Station Scientist** — isolated outpost, scientific mystery, something has changed
- **Stowaway** — no resources, no allies, discovered in transit, must survive by wit alone

---

## Theme Adaptation

If the player requests a non-space genre, generate four theme-appropriate scenarios instead.
The space scenarios above are defaults, not constraints.

### Fantasy

Example scenarios:
- **Village Blacksmith** — a frontier settlement, the forge, and something in the iron that should not be there
- **Travelling Herbalist** — the roads between towns, folk medicine, and a plague that does not behave like a plague
- **Tavern Keeper** — a crossroads inn, warring factions, and a guest who arrived without a shadow
- **Disgraced Knight** — stripped of rank, a debt unpaid, and a summons from someone who should be dead

**Module adaptation:** Ship-systems and star-chart are not relevant. Use geo-map for settlements
and wilderness. Crew-manifest can model a party of companions.

### Horror

Example scenarios:
- **Lighthouse Keeper** — isolation, the fog, and the ships that keep arriving empty
- **Asylum Orderly** — a patient who knows things they should not, and a ward that has too many beds
- **Archaeologist** — a dig site, a sealed chamber, and inscriptions that change overnight
- **Night Shift Security** — a building that is larger on the inside, and a colleague who left hours ago

**Module adaptation:** Geo-map for interior floor-plans. Lore-codex for escalating revelations.
Time system is critical — horror thrives on the passage of night.

### Post-Apocalyptic

Example scenarios:
- **Settlement Medic** — limited supplies, a community, and a sickness that the old world had a name for
- **Caravan Guard** — the road between safe zones, cargo that someone wants badly, and a shortcut through the dead zone
- **Radio Operator** — a signal from somewhere that should be empty, and the choice of whether to answer
- **Scavenger** — the ruins of a city, a map to something valuable, and someone else following the same map

**Module adaptation:** Geo-map for wilderness and ruins. Core-systems economy with scarcity
(barter, not currency). Faction reputation critical for settlement access.

### Historical

Example scenarios:
- **Post-Roman Briton** — a crumbling villa, Saxon raids, and a community choosing between flight and resistance
- **Medieval Pilgrim** — the road to a shrine, fellow travellers with hidden purposes, and miracles that may not be divine
- **Age of Sail Navigator** — a ship, uncharted waters, and a captain whose orders stopped making sense three days ago
- **Frontier Settler** — wilderness, indigenous peoples, harsh winters, and a neighbouring claim that encroaches by night

**Module adaptation:** Time system uses pre-clock periods (dawn, midday, dusk). Calendar uses
the period-appropriate system. Currency adapts (denarii, shillings, doubloons). Geo-map for
overland travel and settlements.

### Cyberpunk / Near-Future

Example scenarios:
- **Street Doc** — a back-alley clinic, corporate patients who pay in secrets, and a patient with implants that should not exist
- **Courier** — data runs through a neon-lit megacity, rival gangs, and a package that fights back
- **Corporate Whistleblower** — inside the arcology, evidence of something monstrous, and no one to trust
- **Fixer** — the go-between, favours owed and collected, and a job that connects to something much larger

**Module adaptation:** Geo-map for city districts and levels (surface, underground, corporate
zones). Currency is digital credits. Hacking uses INT checks. Cybernetic augmentations as
equipment with encumbrance.

### Steampunk / Ahistoric

Example scenarios:
- **Airship Engineer** — a dirigible fleet, clockwork automatons, and an invention that the guilds want suppressed
- **Detective** — gaslight streets, a series of impossible crimes, and a suspect who was seen in two places at once
- **Expedition Leader** — uncharted territories beyond the frontier, strange flora, and ruins predating recorded history
- **Revolutionary** — a stratified society, underground printing presses, and a speech that could topple an empire

**Module adaptation:** Ship-systems adapted for airships/trains. Currency in sovereigns/guineas.
Technology is mechanical, not electronic. Steam-powered equivalents replace digital systems.

### Wuxia / Martial Arts

Example scenarios:
- **Wandering Swordsman** — the jianghu, a debt of honour, and a martial arts tournament with a hidden agenda
- **Temple Disciple** — a mountain monastery, a stolen scroll, and a technique that consumes the user
- **Tea House Owner** — a neutral ground between rival sects, a poisoned guest, and a war that must not start
- **Imperial Investigator** — a provincial murder, corrupt magistrates, and martial arts that leave no wounds

**Module adaptation:** Replace standard combat with martial arts system — styles as "weapons"
with unique properties. Chi/Ki as a secondary resource (like strain). Honour replaces faction
reputation. Geo-map for provinces and martial arts schools.

### Isekai / Portal Fantasy

Example scenarios:
- **Office Worker Transported** — modern knowledge in a medieval world, language barriers, no combat skills but lateral thinking
- **Gamer Reborn** — a game-like interface overlays reality, levels are real, but the rules have hidden exceptions
- **Historian Displaced** — academic knowledge of this era, but the history books were wrong about everything
- **Child of Two Worlds** — born here but raised there, summoned back, and caught between loyalties

**Module adaptation:** Dual knowledge system — player has "Earth knowledge" (INT-based) that
can solve problems creatively but may backfire. Fish-out-of-water social checks at disadvantage
until acclimatised (3+ successful social encounters). Progression is faster than standard
(outsider learns quickly).

### Superhero

Example scenarios:
- **Newly Powered** — an origin event, unstable abilities, and a city that does not yet know what you are
- **Retired Hero** — hung up the cape, but someone is using your old methods, and they are getting it wrong
- **Villain's Henchman** — you work for the bad guy, you know it, and today's job crossed a line
- **Investigative Journalist** — no powers, just questions, a camera, and the knowledge that the heroes are lying about something

**Module adaptation:** Powers as special abilities (3–5 per character, scaling with level).
Secret identity as an Obligation-like mechanic — maintaining it requires social checks.
Collateral damage tracked as a reputation metric. Gear replaced by costume/gadgets.

### Survival / Wilderness

Example scenarios:
- **Shipwreck Survivor** — a hostile coast, wreckage to salvage, and other survivors who may not cooperate
- **Arctic Expedition** — a research station gone silent, dwindling supplies, and something moving under the ice
- **Desert Nomad** — a caravan route gone dry, a rival clan, and an oasis that appeared on no map before last season
- **Deep Cave Explorer** — a cave system that goes deeper than geology allows, bioluminescent fauna, and the sound of breathing

**Module adaptation:** Environmental hazards are central (use the hazards table heavily).
Resource tracking critical — food, water, fuel, medical supplies as consumables with daily
consumption rates. Shelter mechanics. Weather system affecting checks.

### Political Intrigue / Court Drama

Example scenarios:
- **Minor Noble** — a court of whispers, a betrothal that is a political weapon, and an alliance that smells of poison
- **Spymaster's Apprentice** — the intelligence network, coded messages, and an agent who has gone silent in enemy territory
- **Ambassador** — a peace negotiation, cultural misunderstandings weaponised, and a faction that profits from war
- **Merchant Prince** — trade routes as battlefields, tariffs as sieges, and a competitor whose ships keep arriving first

**Module adaptation:** Social encounters are the primary conflict system (Conviction meter
used extensively). Faction reputation is the core progression metric. Combat is rare and
carries severe political consequences. Information as currency — intel items in inventory.

---

## Custom Scenarios

The player may describe their own scenario concept. In this case:
1. Ask clarifying questions about setting, tone, and role.
2. Generate four scenario cards that explore different angles of their concept.
3. Recommend appropriate modules based on the gameplay style implied.
4. Adapt archetypes, currency, calendar, and terminology to match.

---

## Anti-Patterns

- Never offer scenarios that all have the same tone — variety is essential.
- Never spoil the central mystery in the scenario hook — the hook is a question, not an answer.
- Never force space-themed scenarios when the player requests a different genre.
- Never omit the fourth "GM's Choice" scenario — it provides creative range.
- Never copy scenario hooks verbatim between sessions — generate fresh hooks each time,
  even if using the same structural archetypes.
