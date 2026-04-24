# Genre Mechanics — Optional Rule Overlays

> Module for text-adventure orchestrator. Loaded when the scenario theme activates genre-specific mechanics. Provides thematic systems that layer on top of core-systems without replacing them.

Loaded by the text-adventure orchestrator (SKILL.md). Depends on: core-systems.

---

## Magic System (Fantasy, Steampunk)

Activate this overlay when the scenario uses a fantasy, steampunk, or any setting where
arcane or mechanical magic is a core element.

### Mana Pool

Equal to INT x 2. Recovers fully on rest. Recovers 1d4 on a short rest (brief pause in a
safe location, advances time by one period).

### Spell Slots

- **Level 1:** 3 spell slots.
- **Per 2 levels:** +1 slot.
- **Maximum:** 8 slots at level 10.

### Spell Schools

| School      | Domain           | Examples                              |
| ----------- | ---------------- | ------------------------------------- |
| Elemental   | Damage           | Fireball, lightning bolt, frost shard |
| Restoration | Healing          | Mend wounds, purify, revitalise       |
| Illusion    | Social / Stealth | Disguise, invisibility, phantom sound |
| Enchantment | Buffs / Debuffs  | Strengthen, weaken, charm, slow       |
| Divination  | Information      | Detect magic, scry, reveal hidden     |

### Casting

Casting a spell requires an action. Each spell has a tier (1–5). Casting costs 1 mana per
spell tier.

**Resolution:** Roll d20 + INT vs DC (10 + spell tier x 2).

- **Success:** Spell takes effect as described.
- **Failure:** Mana is spent, but the spell has no effect.
- **Critical failure (natural 1):** Mana is spent, spell fails, and a wild magic surge occurs.

### Wild Magic Surge Table (d6)

| Roll | Effect                                                                            |
| ---- | --------------------------------------------------------------------------------- |
| 1    | Caster takes 1d6 damage from uncontrolled magical backlash.                       |
| 2    | A random ally is healed for 1d6 HP by stray restorative energy.                   |
| 3    | A loud, unnatural noise erupts — all enemies in the area are alerted.             |
| 4    | Temporary blindness afflicts the caster (disadvantage on all checks for 1 round). |
| 5    | The spell hits the wrong target (GM determines who, friend or foe).               |
| 6    | The spell works as intended but at double the mana cost.                          |

### Learning Spells

Characters discover new spells through:

- **Scrolls:** Found as loot or purchased from merchants. Consumed on learning.
- **NPC teachers:** Require a favour, payment, or quest completion.
- **Level-up choices:** At each level, the character may learn one new spell from any known school.

**Maximum spells known:** INT + character level.

---

## Sanity System (Horror)

Activate this overlay when the scenario involves horror, cosmic dread, or encounters with
the unnatural. Sanity is a separate resource from HP and strain — it represents the
character's grip on reality.

### Sanity Pool

**Starting sanity:** 10 + INT modifier. Tracked separately from HP and all other resources.

### Sanity Checks

When the character encounters something unnatural — eldritch entities, impossible geometry,
witnessing extreme violence, or reading forbidden texts — the GM calls for a sanity check.

**Resolution:** Roll d20 + INT vs DC (varies by horror severity).

| Severity         | DC  | Examples                                                         |
| ---------------- | --- | ---------------------------------------------------------------- |
| Unsettling       | 10  | Strange noises, minor gore, eerie atmosphere                     |
| Disturbing       | 13  | Witnessing a supernatural event, grotesque scenes                |
| Horrifying       | 16  | Encountering an eldritch entity, extreme body horror             |
| Reality-breaking | 19  | Direct contact with cosmic horrors, witnessing impossible events |

- **Failure:** Lose 1d4 sanity.
- **Critical failure (natural 1):** Lose 1d6 sanity and gain a temporary madness (see table below).

### Sanity Thresholds

| Threshold | Condition | Effect                                                                                                                                          |
| --------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 75%       | Nervous   | Disadvantage on CHA checks — the character's unease shows.                                                                                      |
| 50%       | Paranoid  | Disadvantage on all social checks. The GM may insert hallucination prompts into scene descriptions (the player cannot be certain what is real). |
| 25%       | Unhinged  | The GM may narrate unreliable perceptions — what the character sees may not be what is there.                                                   |
| 0%        | Catatonic | The character is incapacitated and cannot act until sanity is restored above 0.                                                                 |

### Sanity Recovery

| Method                                                                  | Recovery   |
| ----------------------------------------------------------------------- | ---------- |
| Safe rest (full rest at a secure location)                              | 1d4 sanity |
| Professional help (therapist, priest, healer — if available in setting) | 2d4 sanity |
| Completing a quest objective                                            | 1d6 sanity |

### Temporary Madness Table (d6)

| Roll | Effect                                                                                         |
| ---- | ---------------------------------------------------------------------------------------------- |
| 1    | **Flee:** The character flees uncontrollably for 1 round, moving away from the source.         |
| 2    | **Frozen in terror:** The character gains the Stunned condition for 1 round.                   |
| 3    | **Babbling:** The character cannot communicate coherently for 2 rounds.                        |
| 4    | **Lash out:** The character attacks the nearest creature (friend or foe) on their next action. |
| 5    | **Faint:** The character falls unconscious for 1 round, then awakens prone.                    |
| 6    | **Scream:** The character screams involuntarily, alerting all enemies in the area.             |

---

## Chi/Ki System (Wuxia)

Activate this overlay when the scenario involves wuxia, martial arts, or Eastern fantasy
settings where internal energy and martial discipline are central.

### Chi Pool

Equal to WIS x 2. Recovers 1d4 per
round of meditation (requires an action). Full recovery on rest.

### Martial Techniques

- **Level 1:** Each character knows 2 techniques.
- **Per 3 levels:** +1 technique.

### Technique Types

| Type           | Domain               | Examples                                                      |
| -------------- | -------------------- | ------------------------------------------------------------- |
| Strike         | Damage + effect      | Iron Fist (bonus damage), Thunder Palm (knockback)            |
| Flow           | Defensive / movement | Water Step (dodge bonus), Wind Walk (double movement)         |
| Pressure Point | Disable              | Nerve Strike (paralyse limb), Qi Block (silence spellcasting) |
| Inner Force    | Buff                 | Iron Skin (damage reduction), Focus (bonus to next check)     |
| External Force | Ranged / area        | Gale Fist (ranged strike), Shockwave (area damage)            |

### Using Techniques

Using a technique requires an action. Each technique costs 1–3 chi depending on its power.
Roll d20 + relevant stat (STR for Strikes, DEX for Flow, INT for Pressure Points, WIS for
Inner/External Force). Success = technique takes effect.

**Chaining:** If a technique succeeds, the character may immediately attempt a second
technique as part of the same action. The second technique receives a +2 bonus to its roll.
A chain can only extend to two techniques — no further chaining beyond the second.

### Honour

Tracked on a scale of 0–10. Starting value: 5.

| Action                                                                     | Honour Change |
| -------------------------------------------------------------------------- | ------------- |
| Honourable act (keeping a promise, fair combat, protecting the weak)       | +1            |
| Dishonourable act (breaking an oath, attacking the defenceless, treachery) | −1            |

**Effects:**

- **Honour 7+:** Wuxia NPCs treat the character with respect. Disposition starts one step
  friendlier. Some advanced techniques require honour 7+ to use.
- **Honour 3−:** Wuxia NPCs distrust the character. Disposition starts one step more hostile.
  Certain dishonourable techniques become available.
- **Honour 0:** The character is considered an outcast. Most honourable NPCs refuse to interact.
- **Honour 10:** The character is revered. Access to legendary technique teachers and sacred sites.

---

## Hacking System (Cyberpunk)

Activate this overlay when the scenario involves cyberpunk, near-future dystopia, or any
setting where digital intrusion and cyberware are central.

### ICE Rating

ICE (Intrusion Countermeasures Electronics) represents digital security difficulty. It
replaces standard DC for all hacking checks.

| ICE Rating | Security Level     | Examples                                                |
| ---------- | ------------------ | ------------------------------------------------------- |
| 1–3        | Civilian           | Personal devices, home networks, small business systems |
| 4–6        | Corporate          | Corporate servers, government databases, secure comms   |
| 7–9        | Military           | Military networks, intelligence agencies, secure vaults |
| 10         | Black ICE (lethal) | Top-secret installations, AI cores, megacorp mainframes |

### Hacking Checks

**Resolution:** Roll d20 + INT vs DC (ICE rating x 2).

**Tool bonuses:**

- Basic cyberdeck: +2
- Military-grade cyberdeck: +4
- Custom/modified deck: +1 to +3 (based on quality)

### Hack Types

| Hack    | Purpose                                                 |
| ------- | ------------------------------------------------------- |
| Bypass  | Open locked doors, disable cameras, circumvent security |
| Extract | Steal data, copy files, download intelligence           |
| Inject  | Plant false data, alter records, forge credentials      |
| Crash   | Disable systems, shut down networks, cause malfunctions |
| Trace   | Find information, track targets, map network topology   |

### Countermeasures

On a failed hacking check, the system fights back. Severity depends on the ICE rating.

| ICE Level | Countermeasure | Effect                                                           |
| --------- | -------------- | ---------------------------------------------------------------- |
| 1–3       | Mild           | Alert triggered — security is aware of the intrusion.            |
| 4–6       | Moderate       | Deck damaged — the hacker suffers −2 to their next hack attempt. |
| 7–9       | Severe         | Neural feedback — 2d6 strain damage to the hacker.               |
| 10        | Lethal         | Black ICE strikes — 3d6 damage + Stunned condition.              |

### Augmentations

Cybernetic implants function as equipment. Each implant has an encumbrance of 0 but carries
a "humanity cost" of 1–3, representing the psychological toll of replacing flesh with chrome.

**Humanity cost threshold:** If the total humanity cost of all installed augmentations exceeds
the character's CHA modifier, the character suffers disadvantage on all social checks — the
uncanny valley effect makes others instinctively uncomfortable.

| Augmentation Tier | Humanity Cost | Examples                                                     |
| ----------------- | ------------- | ------------------------------------------------------------ |
| Minor             | 1             | Retinal HUD, subdermal pocket, reflex booster                |
| Standard          | 2             | Cyberlimb, neural interface, dermal plating                  |
| Major             | 3             | Full body conversion, military combat suite, AI co-processor |

---

## Powers System (Superhero)

Activate this overlay when the scenario involves superheroes, superpowers, or any setting
where characters possess extraordinary abilities beyond normal human capability.

### Power Pool

- **Character creation:** 3 powers.
- **Level 4:** +1 power.
- **Level 8:** +1 power.
- **Maximum:** 5 powers.

### Power Tiers

| Tier     | Usage              | Cost | Examples                                                        |
| -------- | ------------------ | ---- | --------------------------------------------------------------- |
| Minor    | At-will (no limit) | None | Enhanced Reflexes (+2 to DEX checks, passive)                   |
| Standard | 1 per encounter    | None | Force Blast (ranged attack, 3d6 damage, knockback)              |
| Major    | 1 per session      | None | Time Stop (take 3 consecutive actions, usable once per session) |

### Power Creation

The player defines each power with:

- **Name:** A distinctive title.
- **Tier:** Minor, Standard, or Major.
- **Effect:** Mechanical description of what the power does.
- **Limitation:** A narrative or mechanical drawback (required for Standard and Major tiers).

The GM approves all power definitions, ensuring they are balanced and thematically appropriate.

### Collateral Damage

Tracked on a scale of 0–10. Using powers in populated areas risks collateral damage.

| Power Tier | Collateral Risk                                     |
| ---------- | --------------------------------------------------- |
| Minor      | No collateral risk.                                 |
| Standard   | +1 collateral per use in a populated area.          |
| Major      | +2 collateral per reckless use in a populated area. |

**Collateral thresholds:**

- **Collateral 5+:** Media attention — the character's actions are reported. Public opinion shifts.
- **Collateral 8+:** Authorities intervene — law enforcement or government agencies take action.
- **Collateral 10:** Full crackdown — the character is hunted and public spaces become hostile.

**Reducing collateral:** Careful use of powers (GM discretion), community service, positive
media coverage, or resolving a public crisis can reduce collateral by 1–2 points.

### Secret Identity

An obligation-like mechanic representing the risk of exposure.

**Each session:** Roll d20.

- **5 or lower:** An NPC grows suspicious — they notice something odd, ask probing questions,
  or connect dots. The GM narrates the close call.
- **Natural 1:** An NPC discovers the truth. The GM determines which NPC and the consequences.
  This may trigger a story arc, blackmail opportunity, or public exposure.

Secret identity checks occur at the start of each session, before the first scene.

---

## Resource Scarcity System (Survival, Post-Apocalyptic)

Activate this overlay when the scenario involves survival horror, post-apocalyptic settings,
wilderness expeditions, or any scenario where basic resources are not guaranteed.

### Vital Resources

Four resource types are tracked, each measured in days of supply:

| Resource         | Purpose            | Starting Amount (GM sets based on scenario) |
| ---------------- | ------------------ | ------------------------------------------- |
| Food             | Sustenance         | Varies                                      |
| Water            | Hydration          | Varies                                      |
| Fuel             | Travel and heating | Varies                                      |
| Medical supplies | Healing            | Varies                                      |

### Daily Consumption

- **Food:** 1 unit per person per day.
- **Water:** 1 unit per person per day.
- **Fuel:** 1 unit per day of travel. Also consumed for heating in cold environments.
- **Medical supplies:** 1 unit per healing action.

### Scarcity Effects

| Deprivation         | Duration | Effect                                                         |
| ------------------- | -------- | -------------------------------------------------------------- |
| No food             | 1 day    | Exhausted condition.                                           |
| No food             | 3+ days  | Exhausted + 1d4 damage per day.                                |
| No water            | 1 day    | Exhausted + Injured condition.                                 |
| No water            | 2+ days  | Incapacitated — the character cannot act until water is found. |
| No fuel             | Ongoing  | Cannot travel. No heating (cold hazard applies if applicable). |
| No medical supplies | Ongoing  | Healing actions are unavailable.                               |

### Foraging

The character may spend time searching for resources in the environment.

**Resolution:** Roll d20 + INT or STR (player's choice) vs DC based on environment.

| Environment | DC  | Examples                                      |
| ----------- | --- | --------------------------------------------- |
| Abundant    | 8   | Forest, river valley, intact settlement       |
| Moderate    | 12  | Plains, light woodland, partially looted town |
| Scarce      | 16  | Desert, tundra, heavily looted ruins          |
| Barren      | 20  | Wasteland, irradiated zone, deep underground  |

- **Success:** Find 1d4 days of food or water (player chooses which).
- **Failure:** Nothing found. 1 hour wasted — the GM checks for a random encounter.

### Crafting

The character may combine salvaged items to create tools, weapons, or shelter.

**Resolution:** Roll d20 + INT vs DC based on complexity.

| Complexity | DC  | Examples                                          |
| ---------- | --- | ------------------------------------------------- |
| Simple     | 10  | Torch, basic snare, crude shelter                 |
| Moderate   | 14  | Weapon repair, water filter, signal fire          |
| Complex    | 18  | Firearm assembly, radio repair, fortified shelter |

- **Success:** Item is created and added to inventory.
- **Failure:** Components are consumed but the item is not created. The character may try again
  with new components.

---

## Reputation Web (Political Intrigue)

Activate this overlay when the scenario involves political intrigue, courtly drama, factional
warfare, or any setting where social manoeuvring is as important as combat.

### Faction Tracking

Each faction has a disposition toward the player, tracked on a simplified scale:

| Disposition | Modifier | Effect                                                                                     |
| ----------- | -------- | ------------------------------------------------------------------------------------------ |
| Hostile     | −2       | Faction actively works against the character. Agents sent, rumours spread, access blocked. |
| Unfriendly  | −1       | Faction is wary. Higher prices, guarded NPCs, limited information.                         |
| Neutral     | 0        | Standard interactions. No bonuses or penalties.                                            |
| Friendly    | +1       | Faction offers resources, information, and sanctuary when needed.                          |
| Allied      | +2       | Full support. Joint missions, shared intelligence, combat backup.                          |

Disposition modifiers apply directly to social check DCs when interacting with faction members.

### Favour Economy

NPCs grant and call in favours. Favours are tracked as inventory items (zero encumbrance,
cannot be dropped or sold).

- **Completing a favour for a faction:** Disposition improves by +1.
- **Refusing a called-in favour:** Disposition worsens by −1.
- **Betraying a favour:** Disposition worsens by −2 and the faction retaliates.

### Intrigue Actions

Each "round" of political play (typically a day or a significant social event), the player
may take **one intrigue action:**

| Action              | Attribute | Effect                                                                                                                                                                 |
| ------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gather intelligence | INT       | Learn a faction's current plans, alliances, or vulnerabilities. DC based on faction secrecy.                                                                           |
| Spread rumour       | CHA       | Shift one faction's view of another faction by one step (positive or negative). DC 14.                                                                                 |
| Form alliance       | CHA       | Attempt to upgrade a faction's disposition toward the character by one step. DC based on current disposition (Hostile: 18, Unfriendly: 15, Neutral: 12, Friendly: 10). |
| Sabotage            | DEX       | Undermine a faction's plans without being caught. DC based on faction vigilance.                                                                                       |

### Discovery

If the character is caught acting against a faction (failed sabotage, exposed rumour-spreading,
revealed deception):

- **Disposition drops by 2** immediately.
- **The faction retaliates** — the GM determines the response based on the faction's nature and
  resources (assassination attempt, public denouncement, trade embargo, etc.).

---

## Combining Genre Overlays

A scenario may activate 1–2 overlays to create hybrid genres. Examples:

| Combination                | Genre              | Active Overlays                    |
| -------------------------- | ------------------ | ---------------------------------- |
| Fantasy + Horror           | Dark fantasy       | Magic System + Sanity System       |
| Cyberpunk + Survival       | Dystopian survival | Hacking System + Resource Scarcity |
| Wuxia + Political Intrigue | Court martial arts | Chi/Ki System + Reputation Web     |
| Superhero + Horror         | Eldritch heroes    | Powers System + Sanity System      |

### Rules for Combining

- Overlays never contradict core-systems — they add mechanics, they do not replace them.
- If two overlays provide similar mechanics (e.g., chi pool and mana pool), use only the
  thematically dominant one. Never run both simultaneously.
- Resource pools from overlays (mana, sanity, chi, collateral, honour) are tracked alongside
  HP and standard resources in the Character panel.
- The GM declares active overlays during the Game Settings phase. They cannot be changed
  mid-session without restarting.

---

## gmState Fields

Genre overlays add the following optional fields to `gmState`:

<!-- CLI implementation detail — do not hand-code -->

```js
// Magic System
genreMagic: {
  mana: 0,            // current mana (INT x 2 max)
  maxMana: 0,
  spellSlots: 3,      // available spell slots
  maxSpellSlots: 3,
  knownSpells: [],     // { name, school, tier, description }
},

// Sanity System
genreSanity: {
  sanity: 0,           // current sanity (10 + INT modifier max)
  maxSanity: 0,
  threshold: 'normal', // normal / nervous / paranoid / unhinged / catatonic
},

// Chi/Ki System
genreChi: {
  chi: 0,              // current chi (WIS x 2 max)
  maxChi: 0,
  techniques: [],      // { name, type, chiCost, description }
  honour: 5,           // 0–10 scale
},

// Hacking System
genreHacking: {
  deckType: 'basic',   // basic / military / custom
  deckBonus: 2,        // +2 for basic, +4 for military
  augmentations: [],   // { name, tier, humanityCost, effect }
  totalHumanityCost: 0,
},

// Powers System
genrePowers: {
  powers: [],          // { name, tier, effect, limitation, usedThisEncounter, usedThisSession }
  collateral: 0,       // 0–10 scale
  secretIdentity: true,
},

// Resource Scarcity System
genreScarcity: {
  food: 0,             // days of supply
  water: 0,
  fuel: 0,
  medical: 0,
},

// Reputation Web
genreReputation: {
  factions: {},        // { factionId: { name, disposition, favours: [] } }
  intrigueActionsToday: 0, // max 1 per round of political play
},
```

---

## World Flag Prefixes

Genre overlay flags use the prefix `genre_`:

| Flag                                | Example                                                  |
| ----------------------------------- | -------------------------------------------------------- |
| `genre_magic_wildSurge_occurred`    | Boolean — a wild magic surge happened this scene         |
| `genre_sanity_hallucination_active` | Boolean — the character is experiencing hallucinations   |
| `genre_chi_honour_changed`          | Boolean — honour shifted this scene                      |
| `genre_hacking_alert_triggered`     | Boolean — a system alert is active                       |
| `genre_powers_identity_exposed`     | Boolean — secret identity has been discovered            |
| `genre_scarcity_foraging_attempted` | Boolean — foraging was attempted this day                |
| `genre_reputation_caught_sabotage`  | Boolean — the character was caught in an intrigue action |

---

## Anti-Patterns

- Never force a genre overlay — they are optional enhancements, not requirements. A fantasy
  scenario can run perfectly well without the Magic System if the player prefers mundane gameplay.
- Never let overlay mechanics overshadow core gameplay — they should add flavour, not complexity.
  If the player is spending more time managing mana and spell slots than making story decisions,
  the overlay is too heavy.
- Never stack more than 2 overlays — diminishing returns and cognitive overload make the game
  less enjoyable, not more.
- Never allow overlay resource pools to bypass core healing and rest mechanics — mana recovery
  on rest does not also restore HP unless the player uses a healing action.
- Never display overlay-specific mechanical values in narrative prose — "your hands tremble and
  the shadows seem to crawl" not "your sanity is at 4 out of 12".
