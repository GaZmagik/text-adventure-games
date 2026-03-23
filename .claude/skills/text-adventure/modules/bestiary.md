# Bestiary — Adversaries and Creatures
> Module for text-adventure orchestrator. Provides reusable adversary templates across all genres. Loaded alongside core-systems.

Loaded by the text-adventure orchestrator (SKILL.md). Depends on: core-systems.

---

## CRITICAL — Hidden Adversary Rolls

For non-combat interactions with adversaries (sneak past, persuade, distract, etc.),
follow the **Hidden Roll Resolution Pattern** in `modules/die-rolls.md` § CRITICAL — Hidden Roll
Resolution Pattern. Adversaries use tier-based resistance modifiers (below) instead of
individual stat blocks (which are reserved for named NPCs in `ai-npc.md`).

### Tier-Based Resistance Modifiers

| Threat Tier | Resistance Modifier | Example Adversaries |
|-------------|-------------------|---------------------|
| Minion | +0 to +2 | Standard guard, patrol drone, street thug |
| Lieutenant | +3 to +5 | Squad leader, security chief, trained operative |
| Boss | +5 to +8 | Crime lord, military commander, apex predator |

### Situational Modifier Adjustments

| Situation | Modifier Adjustment |
|-----------|-------------------|
| Adversary is alert/suspicious | +1 to +2 |
| Adversary is distracted/relaxed | -1 to -2 |
| Adversary is in darkness/poor conditions | -1 to -3 |
| Adversary has been warned about the player | +2 to +3 |
| Player has environmental advantage | -1 to -2 |

---

## Threat Tiers

All adversaries fall into one of three tiers. Each tier defines HP ranges, damage output,
behavioural complexity, and loot expectations. The GM selects a template from the appropriate
tier and reskins it to match the active scenario's genre and tone.

---

## Minions (Fodder)

Low HP (4–8), low damage (1d4–1d6), simple behaviour patterns. Minions appear in groups of
2–4 and exist to create pressure, drain resources, and establish the threat level of an area.
They are not individually dangerous but become lethal through numbers and attrition.

**Loot:** Minor — 5–15 credits (or setting equivalent) per minion defeated.

### Minion Templates

#### 1. Grunt

Generic melee combatant. STR-focused. The most common adversary in any setting — the rank
and file, the cannon fodder, the expendable muscle.

**Stat Block:**

```
**Grunt** [Minion] — Melee combatant, charges headlong into the fray.
- HP: 6 | Damage: 1d6 | Defence: 8 | Soak: 1
- Abilities: None
- Behaviour: Charges the nearest target. Flees at 2 HP or below.
- Loot: 5–10 credits, minor salvage
```

**Theme Adaptations:**

| Genre | Name | Flavour |
|-------|------|---------|
| Space | Pirate Thug | Scarred spacer with a makeshift cudgel and stolen vac-suit |
| Fantasy | Goblin | Small, vicious, fights with a rusty blade and feral cunning |
| Horror | Shambler | Slow-moving corpse, grasping hands, relentless forward momentum |
| Cyberpunk | Gang Punk | Neon-tattooed enforcer with a shock baton and too much adrenaline |
| Wuxia | Bandit | Road thief with a notched sword and no formal training |
| Survival | Feral Dog | Starving predator, hunts in packs, goes for the legs |
| Steampunk | Clockwork Drone | Grinding gears, brass fists, follows its last instruction |
| Post-Apocalyptic | Raider | Scrap-armoured scavenger with a blunt weapon |
| Historical | Levy Conscript | Poorly armed peasant pressed into service |
| Superhero | Street Thug | Hired muscle with a crowbar and a grudge |
| Isekai | Slime | Gelatinous blob, slow but persistent, dissolves on contact |
| Political | Hired Brute | Deniable muscle employed by a rival faction |

---

#### 2. Shooter

Ranged attacker. AGI-focused. Prefers to keep distance and punish targets caught in the open.
Fragile if cornered — prioritises repositioning over fighting up close.

**Stat Block:**

```
**Shooter** [Minion] — Ranged attacker, stays at distance.
- HP: 4 | Damage: 1d6 | Defence: 10 | Soak: 0
- Abilities: None
- Behaviour: Stays at range. Retreats if engaged in melee. Prioritises exposed targets.
- Loot: 5–10 credits, ammunition or ranged weapon component
```

**Theme Adaptations:**

| Genre | Name | Flavour |
|-------|------|---------|
| Space | Pirate Gunner | Crouches behind cargo crates, fires a beat-up blaster |
| Fantasy | Goblin Archer | Perched on a ledge, looses crude arrows with surprising accuracy |
| Horror | Spitter | Distended jaw, projects a stream of caustic bile from a distance |
| Cyberpunk | Sniper Drone Operator | Controls a cheap surveillance drone fitted with a holdout pistol |
| Wuxia | Dart Thrower | Hidden-weapon specialist, flicks poisoned needles from a sleeve |
| Survival | Territorial Archer | Defends a resource cache with a hunting bow |
| Steampunk | Pneumatic Rifleman | Brass-fitted air rifle, slow to reload but punishing at range |
| Post-Apocalyptic | Scrap Gunner | Improvised firearm, unreliable but deadly when it works |
| Historical | Skirmisher | Javelin or sling, harasses from the flanks and melts away |
| Superhero | Rooftop Gunman | Hired sniper with a cheap rifle and a fire escape |
| Isekai | Imp | Hovering nuisance, hurls small fireballs that sting more than they burn |
| Political | Crossbow Assassin | Concealed in a crowd, fires once and disappears |

---

#### 3. Swarm

Numerous weak creatures acting as a single entity. Overwhelm through sheer numbers. The
swarm shares a single HP pool — as it takes damage, its offensive output diminishes.

**Stat Block:**

```
**Swarm** [Minion] — Numerous weak creatures, shared HP pool.
- HP: 8 (shared pool) | Damage: 1d4 per surviving member | Defence: 6 | Soak: 0
- Abilities: None
- Behaviour: Surround and attack. Lose 1d4 damage per 2 HP lost from the pool.
  Area-of-effect attacks deal double damage to swarms.
- Loot: 5 credits equivalent (organic residue, salvageable parts)
```

**Theme Adaptations:**

| Genre | Name | Flavour |
|-------|------|---------|
| Space | Voidmites | Tiny hull-eating parasites that pour through breached seals |
| Fantasy | Rat Swarm | A living carpet of vermin boiling out of the walls |
| Horror | Crawling Mass | Indistinct shapes, too many legs, moving as one |
| Cyberpunk | Microdrones | Cloud of razor-edged surveillance drones gone haywire |
| Wuxia | Hornet Swarm | Disturbed nest, furious and blinding |
| Survival | Fire Ants | Agonising bites, relentless, drawn by warmth |
| Steampunk | Clockwork Beetles | Tiny brass constructs that strip copper wiring |
| Post-Apocalyptic | Mutant Roaches | Fist-sized insects with an appetite for everything |
| Historical | Plague Rats | Disease-carrying vermin driven out by flooding |
| Superhero | Nanite Cloud | Escaped experimental nanobots, disassemble on contact |
| Isekai | Pixie Mob | Malicious fae, individually harmless, collectively terrifying |
| Political | Angry Mob | Civilians whipped into a frenzy — not enemies, but dangerous |

---

#### 4. Guard

Defensive obstacle. Blocks passage and buys time. Not aggressive — the guard's purpose is
to hold a position and prevent the player from passing. High defence, low damage.

**Stat Block:**

```
**Guard** [Minion] — Defensive blocker, holds position.
- HP: 8 | Damage: 1d4 | Defence: 12 | Soak: 3
- Abilities: None
- Behaviour: Holds position. Does not pursue. Calls for reinforcements if not
  defeated within 3 rounds (GM adds 1d4 Grunts to the encounter).
- Loot: 10–15 credits, key or access token (narrative reward)
```

**Theme Adaptations:**

| Genre | Name | Flavour |
|-------|------|---------|
| Space | Station Sentry | Armoured guard with a stun baton and a comm link |
| Fantasy | Shield Bearer | Heavy shield, dug in, blocks a narrow corridor |
| Horror | Blocker | Immovable fleshy mass wedged into a doorway, pulsing |
| Cyberpunk | Security Bot | Wall-mounted turret with a challenge protocol and armour plating |
| Wuxia | Gate Keeper | Staff-wielding sentry guarding a sect's entrance |
| Survival | Territorial Beast | Large herbivore defending its den, charges if provoked |
| Steampunk | Automaton Sentinel | Brass guardian, follows patrol orders to the letter |
| Post-Apocalyptic | Barricade Watcher | Sits behind improvised cover, shouts warnings first |
| Historical | Man-at-Arms | Professional soldier in mail, holds the gate |
| Superhero | Powered Suit Guard | Corporate security in light exoskeleton armour |
| Isekai | Living Armour | Empty suit of plate mail, animated by residual enchantment |
| Political | Palace Guard | Loyal retainer, fights defensively, sounds the alarm |

---

#### 5. Scout

Fast and evasive. The scout's purpose is reconnaissance — it flees after a single round. If
it escapes, it triggers an alarm or reinforcement encounter in the next scene.

**Stat Block:**

```
**Scout** [Minion] — Fast, evasive, reports back if not stopped.
- HP: 4 | Damage: 1d4 | Defence: 12 | Soak: 0
- Abilities: None
- Behaviour: Attacks once, then flees at the start of its second turn. If it escapes
  (leaves the encounter), trigger an alarm — the next encounter gains +2 additional
  minions or the player loses the element of surprise (GM's discretion).
- Loot: 5 credits, intelligence item (map fragment, coded message, signal frequency)
```

**Theme Adaptations:**

| Genre | Name | Flavour |
|-------|------|---------|
| Space | Recon Drone | Small, fast, transmits data back to the main force |
| Fantasy | Goblin Runner | Nimble, cowardly, bolts for the nearest tunnel |
| Horror | Watcher | Eyeless figure that sees nonetheless, vanishes through walls |
| Cyberpunk | Info-Runner | Light on their feet, recording everything on ocular implant |
| Wuxia | Messenger Bird Handler | Releases a trained bird before drawing a blade |
| Survival | Lookout Animal | Alert prey animal whose flight warns the herd |
| Steampunk | Courier Automaton | Spring-legged construct, built for speed not combat |
| Post-Apocalyptic | Signal Runner | Sprints back to camp with a flare gun |
| Historical | Mounted Scout | Light cavalry, fast horse, reports to the main column |
| Superhero | Surveillance Drone | Remote-piloted quadcopter with a camera feed |
| Isekai | Fairy Spy | Invisible until spotted, teleports short distances |
| Political | Court Spy | Slips away to report what they have witnessed |

---

#### 6. Trap/Hazard Creature

Environmental threat that ambushes from concealment. Inflicts a condition on hit, making it
more dangerous than its raw damage suggests. Often guards a specific area or resource.

**Stat Block:**

```
**Trap/Hazard Creature** [Minion] — Ambush predator, inflicts conditions.
- HP: 6 | Damage: 1d6 + condition | Defence: 8 | Soak: 2
- Abilities: On hit, inflict one condition (choose: Poisoned, Stunned, or Frightened).
  The condition is determined by the creature's theme adaptation.
- Behaviour: Hides until a target enters its area. Attacks with surprise (target does
  not act in the first round unless they pass an INT DC 12 Perception check).
  After ambush, fights normally.
- Loot: 10 credits, venom sac or trap component (crafting material)
```

**Theme Adaptations:**

| Genre | Name | Condition | Flavour |
|-------|------|-----------|---------|
| Space | Hull Leech | Stunned | Attaches to the suit, delivers an electric shock |
| Fantasy | Venomous Serpent | Poisoned | Strikes from tall grass, fangs dripping |
| Horror | Face Hugger | Frightened | Drops from the ceiling, wraps around the head |
| Cyberpunk | Shock Mine | Stunned | Concealed device, detonates on proximity |
| Wuxia | Hidden Viper | Poisoned | Coiled in a scroll case, strikes when opened |
| Survival | Trapdoor Spider | Stunned | Bursts from a silk-lined hole underfoot |
| Steampunk | Pressure Trap | Stunned | Steam vent rigged to scald intruders |
| Post-Apocalyptic | Toxic Spore Cluster | Poisoned | Fungal bloom that bursts when disturbed |
| Historical | Caltrops and Serpent | Poisoned | Snake hidden among iron spikes |
| Superhero | Tripwire Turret | Stunned | Concealed automated defence system |
| Isekai | Mimic | Frightened | Disguised as a treasure chest, all teeth |
| Political | Poisoned Gift | Poisoned | Trapped object left as a "peace offering" |

---

## Rivals (Threats)

Medium HP (12–20), moderate damage (1d8–2d6), tactical behaviour patterns. Rivals represent
meaningful individual threats — skilled fighters, dangerous predators, or cunning opponents
who require strategy to defeat. They appear alone or in pairs.

Each rival has one special ability that distinguishes it from a simple damage-dealer.

**Loot:** Standard — 20–50 credits (or setting equivalent), plus a usable item or equipment piece.

### Rival Templates

#### 1. Enforcer

Tough melee fighter. Tank-like. The enforcer closes distance and hits hard, targeting the
weakest member of the group. Ignores crowd-control effects that would slow it down.

**Stat Block:**

```
**Enforcer** [Rival] — Heavy melee combatant, shrugs off punishment.
- HP: 16 | Damage: 2d6 | Defence: 10 | Soak: 3
- Abilities: "Relentless" — ignores the Stunned condition entirely.
- Behaviour: Focuses the weakest target (lowest current HP). Does not retreat.
  Switches targets only if current target is downed or flees.
- Loot: 30–50 credits, heavy weapon or armour piece
```

**Theme Adaptations:**

| Genre | Name | Flavour |
|-------|------|---------|
| Space | Pirate Brute | Cybernetically augmented thug, metal jaw, powered gauntlets |
| Fantasy | Ogre | Towering, thick-skinned, swings a tree trunk as a club |
| Horror | Butcher | Apron-clad figure, impossibly strong, shrugs off pain |
| Cyberpunk | Chrome Enforcer | Full-body cybernetics, subdermal armour, hydraulic fists |
| Wuxia | Iron Body Fighter | Hard qi technique renders flesh like iron, fights barehanded |
| Survival | Alpha Predator | Apex carnivore, scarred from a hundred territorial fights |
| Steampunk | Brass Golem | Steam-powered construct, relentless and unfeeling |
| Post-Apocalyptic | Mutant Bruiser | Radiation-warped muscle, pain receptors burned away |
| Historical | Berserker | Frothing warrior who fights through wounds that would fell others |
| Superhero | Powerhouse Villain | Super-strength, limited intellect, directed by someone smarter |
| Isekai | Troll | Regenerating brute, needs fire or acid to stay down |
| Political | Champion Duelist | Undefeated in formal combat, retained by a powerful patron |

---

#### 2. Sharpshooter

Elite ranged combatant. Patient and precise. The sharpshooter waits for the optimal moment
to deliver a devastating shot. Its signature ability — Aimed Shot — guarantees a single
maximum-damage hit per encounter.

**Stat Block:**

```
**Sharpshooter** [Rival] — Elite ranged combatant, patient and lethal.
- HP: 12 | Damage: 2d6 | Defence: 12 | Soak: 1
- Abilities: "Aimed Shot" — once per encounter, automatically hits for maximum
  damage (12). Declared at the start of the sharpshooter's turn; cannot be used
  if the sharpshooter is engaged in melee.
- Behaviour: Maintains maximum distance. Repositions if approached. Uses Aimed Shot
  when the target is most vulnerable (low HP, no cover, mid-action).
- Loot: 30–40 credits, precision ranged weapon
```

**Theme Adaptations:**

| Genre | Name | Flavour |
|-------|------|---------|
| Space | Bounty Hunter | Scoped rifle, thermal visor, patient as stone |
| Fantasy | Elven Archer | Longbow, preternatural calm, never wastes an arrow |
| Horror | The Marksman | Unseen, a red dot appears on the chest before the crack of the shot |
| Cyberpunk | Netrunner Sniper | Smart-linked rifle, targeting software compensates for wind |
| Wuxia | Jade Archer | Recurve bow, fires from horseback or rooftop with deadly grace |
| Survival | Poacher | Camouflaged, knows the terrain, fires from a prepared hide |
| Steampunk | Aether Rifleman | Crystal-focused energy weapon, charges between devastating shots |
| Post-Apocalyptic | Wasteland Marksman | Pre-war rifle maintained with obsessive care |
| Historical | Longbowman | Draws a warbow that lesser archers cannot string |
| Superhero | Trick-Shot Villain | Never misses, uses ricochets and impossible angles |
| Isekai | Magic Archer | Arrows wreathed in elemental energy, seeks the target |
| Political | Hired Assassin | A single crossbow bolt from a window, then gone |

---

#### 3. Trickster

Uses deception and misdirection. The trickster is not the strongest fighter but is the most
frustrating — forcing rerolls, creating false openings, and punishing overcommitment.

**Stat Block:**

```
**Trickster** [Rival] — Deceptive combatant, misdirects and frustrates.
- HP: 14 | Damage: 1d8 | Defence: 14 | Soak: 1
- Abilities: "Misdirect" — once per encounter, force the player to reroll a
  successful attack against any target. The second roll stands.
- Behaviour: Uses terrain and cover. Baits attacks, then punishes. Taunts the player
  to provoke reckless action. May attempt to negotiate if losing.
- Loot: 20–40 credits, unusual gadget or deceptive item
```

**Theme Adaptations:**

| Genre | Name | Flavour |
|-------|------|---------|
| Space | Con Artist | Holographic decoys, misdirecting chatter on comms |
| Fantasy | Illusionist | Mirror images, displaced sounds, nothing is where it appears |
| Horror | Doppelgänger | Wears a familiar face, exploits trust and hesitation |
| Cyberpunk | Hacker | Spoofs targeting systems, feeds false data to implants |
| Wuxia | Drunken Boxer | Stumbles and sways, but every stumble is a feint |
| Survival | Cunning Prey | An animal that uses decoys, false trails, and ambush reversals |
| Steampunk | Stage Magician | Smoke bombs, trap doors, misdirection as art |
| Post-Apocalyptic | Scam Artist | Friendly face, poisoned handshake, always has an escape route |
| Historical | Court Jester | Plays the fool, but the fool sees everything and strikes unseen |
| Superhero | Illusionist Villain | Hard-light projections that deceive the senses |
| Isekai | Shapeshifter | Changes form mid-combat, confusing targeting |
| Political | Double Agent | Ally one moment, enemy the next, loyalties unknowable |

---

#### 4. Beast

Large predatory creature. Raw physical power and animal cunning. The beast's signature
ability — Pounce — makes its opening attack devastating, rewarding players who prepare
before engaging and punishing those caught off-guard.

**Stat Block:**

```
**Beast** [Rival] — Large predator, devastating initial strike.
- HP: 20 | Damage: 2d6 | Defence: 8 | Soak: 2
- Abilities: "Pounce" — the beast's first attack in the encounter deals double
  damage (4d6). This represents its ambush charge. If the player detects the beast
  before combat begins (INT DC 12 Perception), Pounce is negated.
- Behaviour: Ambushes from concealment. After Pounce, fights aggressively. Retreats
  at 5 HP or below — wounded predators do not fight to the death.
- Loot: 25–40 credits equivalent (pelt, fangs, organs — crafting or trade value)
```

**Theme Adaptations:**

| Genre | Name | Flavour |
|-------|------|---------|
| Space | Void Stalker | Eyeless predator adapted to low-gravity environments |
| Fantasy | Dire Wolf | Shoulder-height, intelligent eyes, hunts with terrible patience |
| Horror | The Thing in the Walls | Bursts through plasterboard, all claws and hunger |
| Cyberpunk | Cyber-Hound | Military-grade attack dog with titanium teeth and targeting implants |
| Wuxia | Mountain Tiger | Striped ghost of the forest, revered and feared |
| Survival | Bear | Territorial apex predator, encountered near food or cubs |
| Steampunk | Clockwork Hound | Brass-plated hunting machine, tireless and precise |
| Post-Apocalyptic | Mutant Predator | Radiation-warped carnivore, extra limbs, wrong number of eyes |
| Historical | War Dog | Trained for combat, armoured collar, obeys only its handler |
| Superhero | Escaped Lab Creature | Genetically modified, unstable, frightened and lashing out |
| Isekai | Warg | Intelligent wolf-creature, possibly domesticable |
| Political | Hunting Cat | Exotic beast kept by a noble, released to hunt trespassers |

---

#### 5. Leader

Commands minions. The leader's strength lies not in personal combat but in tactical
coordination — summoning reinforcements and directing subordinates. Defeat the leader
and the minions scatter.

**Stat Block:**

```
**Leader** [Rival] — Tactical commander, fights through subordinates.
- HP: 14 | Damage: 1d8 | Defence: 12 | Soak: 2
- Abilities: "Rally" — once per encounter, summon 1d4 Grunt minions as
  reinforcements. They arrive at the start of the leader's next turn.
- Behaviour: Stays behind minions. Never engages in melee willingly. Targets
  the party's most dangerous member with debuffs or focused fire from subordinates.
  If all minions are defeated, attempts to flee or surrender.
- Loot: 40–50 credits, command item (communicator, war horn, signet ring)
```

**Theme Adaptations:**

| Genre | Name | Flavour |
|-------|------|---------|
| Space | Pirate Captain | Barking orders from the bridge, subordinates do the dying |
| Fantasy | Hobgoblin Warlord | Disciplined, armoured, commands with iron authority |
| Horror | The Whisperer | Unseen voice that directs the horrors, puppeteer in the dark |
| Cyberpunk | Gang Boss | AR overlay coordinating squad movements in real time |
| Wuxia | Bandit Chief | Experienced fighter who lets disciples fight first |
| Survival | Pack Alpha | Dominant animal that coordinates the hunt with body language |
| Steampunk | Foreman | Directs automaton workers turned violent, wrench in hand |
| Post-Apocalyptic | Warlord's Lieutenant | Commands through fear and a working radio |
| Historical | Centurion | Professional officer, fights only when the line breaks |
| Superhero | Villain Commander | Tactical genius, directs henchmen from a command post |
| Isekai | Goblin King | Wears a crown of bent tin, but the goblins obey |
| Political | Spymaster | Never fights directly, sends agents and information |

---

#### 6. Specialist

Uses unique abilities tied to the setting's technology, magic, or expertise. The specialist's
signature ability disrupts the player's equipment or capabilities, forcing adaptation.

**Stat Block:**

```
**Specialist** [Rival] — Unique abilities, disrupts player capabilities.
- HP: 12 | Damage: 1d8 + special | Defence: 10 | Soak: 1
- Abilities: "Override/Hex/Disrupt" — once per encounter, disable one piece of
  player equipment for 2 rounds. The equipment cannot be used, equipped, or
  swapped during this time. The ability's name adapts to the setting (Override
  for tech, Hex for magic, Disrupt for general).
- Behaviour: Opens with the disruptive ability, targeting the player's most
  powerful piece of equipment. Then fights at range using setting-appropriate
  special attacks. Retreats if cornered.
- Loot: 30–50 credits, specialist tool or component (tech kit, spell focus, hacking rig)
```

**Theme Adaptations:**

| Genre | Name | Ability Name | Flavour |
|-------|------|-------------|---------|
| Space | Systems Hacker | Override | Remotely disables suit functions or weapon systems |
| Fantasy | Hedge Witch | Hex | Curses equipment, weapons turn heavy and armour binds |
| Horror | Poltergeist | Disrupt | Flings equipment across the room, pins it to the wall |
| Cyberpunk | Netrunner | Override | Hacks cyberware, locks joints, blinds smart-optics |
| Wuxia | Pressure Point Striker | Disrupt | Seals meridians, numbing the hand that holds the weapon |
| Survival | Corrosive Creature | Disrupt | Acid spray dissolves straps and corrodes metal |
| Steampunk | Saboteur | Disrupt | Jams clockwork mechanisms, vents steam lines |
| Post-Apocalyptic | EMP Specialist | Override | Pulse fries electronics, darkens powered equipment |
| Historical | Cunning Alchemist | Hex | Thrown concoctions that corrode metal and blind |
| Superhero | Tech Villain | Override | Electromagnetic pulse targeting specific frequencies |
| Isekai | Enchanter | Hex | Dispels enchantments on magical equipment |
| Political | Saboteur Agent | Disrupt | Poisons weapons, loosens armour straps before the fight |

---

## Nemeses (Boss-Tier)

High HP (25–40), high damage (2d8–3d6), complex behaviour with phased encounters. Nemeses
are climactic opponents — each fight should feel like a significant narrative event. They
always appear alone (though they may summon or command minions during the fight).

Each nemesis has 2–3 special abilities and a two-phase structure. At 50% HP, behaviour and
tactics shift dramatically. Phase transitions must be narrated — the player sees the change
and understands the stakes have risen.

**Loot:** Major — 100+ credits (or setting equivalent), a rare item, or a quest reward.

### Nemesis Templates

#### 1. Warlord

Combat-focused boss. The warlord is a master of violence who dominates through sheer
martial superiority. Phase 1 is controlled aggression; Phase 2 is desperate fury.

**Stat Block:**

```
**Warlord** [Nemesis] — Martial master, multi-phase combatant.
- HP: 30 | Damage: 2d8 | Defence: 12 | Soak: 4
- Phase 1 (100–50% HP): Standard attacks. Uses "Cleave" — hits all engaged
  targets for 1d6 damage each. Fights with discipline and positioning.
- Phase 2 (below 50% HP): Enters a rage. Damage increases by +1d6 (total 2d8+1d6).
  Defence drops to 10. Attacks become reckless and relentless.
- Abilities:
  - "Intimidating Presence" — at the start of the encounter, all targets must
    pass an INT DC 12 check or gain the Frightened condition for 2 rounds.
  - "Cleave" — once per round, hit all targets engaged in melee for 1d6 each.
  - "Armour Break" — on a critical hit, permanently reduce the target's Soak by 1
    for the remainder of the encounter.
- Behaviour: Phase 1 — controls the battlefield, uses Cleave to punish clustering.
  Phase 2 — focuses the strongest remaining target with single-minded fury.
- Loot: 100–150 credits, rare weapon or armour, quest-relevant trophy
```

**Theme Adaptations:**

| Genre | Name | Flavour |
|-------|------|---------|
| Space | Fleet Commander | Powered exoskeleton, energy blade, fights on the bridge |
| Fantasy | Dragon Knight | Fire-blackened plate, greatsword, rides nothing — is the dragon's equal |
| Horror | The Butcher | Unstoppable slasher, each wound only makes it angrier |
| Cyberpunk | Cyborg Enforcer | Military-grade full-body conversion, barely human |
| Wuxia | Sword Saint | Legendary blade technique, each strike a calligraphic masterwork |
| Survival | Apex Predator | Ancient, scarred, territorial — the apex of its ecosystem |
| Steampunk | War Automaton | Factory-built for a forgotten conflict, reactivated and purposeful |
| Post-Apocalyptic | Raider King | Rules through violence, wears the trophies of defeated challengers |
| Historical | Warlord Champion | Undefeated general, fights at the head of their army |
| Superhero | Arch-Nemesis Bruiser | Powers matched to the hero, a dark mirror of strength |
| Isekai | Demon General | Commanding presence, sword wreathed in dark flame |
| Political | Grand Champion | Arena legend, fights duels to settle affairs of state |

---

#### 2. Mastermind

Social and intellectual boss. The mastermind avoids direct combat, using minions, traps,
and environmental hazards as weapons. Defeating the mastermind requires reaching them
first — and they always have an escape plan.

**Stat Block:**

```
**Mastermind** [Nemesis] — Intellectual antagonist, fights through proxies.
- HP: 25 | Damage: 1d8 | Defence: 14 | Soak: 2
- Phase 1 (100–50% HP): Fights through minions and traps. Personally stays at
  maximum range, using ranged attacks or directing subordinates. The encounter
  area contains 2–3 pre-placed traps (GM selects from environmental hazards
  in core-systems).
- Phase 2 (below 50% HP): Activates a major environmental hazard (choose from
  the hazards table in core-systems). Attempts to flee to an adjacent area.
  If cornered, fights desperately but erratically.
- Abilities:
  - "Contingency" — once per encounter, negate a killing blow. The mastermind
    escapes to an adjacent area with 1 HP. The player must pursue or lose them.
  - "Monologue" — once per encounter, force a CHA vs INT check. If the player
    fails, they lose their next action (captivated, hesitating, or deceived).
    If the player succeeds, they gain advantage on their next attack (the
    monologue revealed a weakness).
- Behaviour: Phase 1 — never engages directly whilst minions survive. Directs
  the fight, springs traps, taunts. Phase 2 — panics, activates contingencies,
  attempts to escape. A cornered mastermind is dangerous but sloppy.
- Loot: 150+ credits, intelligence item (plans, codes, ledger), rare equipment
```

**Theme Adaptations:**

| Genre | Name | Flavour |
|-------|------|---------|
| Space | Crime Lord | Controls the encounter from a shielded observation deck |
| Fantasy | Lich | Phylactery hidden elsewhere, fights through summoned dead |
| Horror | The Puppeteer | Strings of influence invisible to the eye, victims do its work |
| Cyberpunk | Corporate Executive | Drone army, panic room, lawyers more dangerous than soldiers |
| Wuxia | Poisoner Sect Leader | Never touches a blade, every surface is coated, every drink suspect |
| Survival | Trapper | The entire territory is a kill zone of snares and deadfalls |
| Steampunk | Mad Inventor | Laboratory of lethal devices, pulls levers and laughs |
| Post-Apocalyptic | Settlement Tyrant | Rules through information control and rigged defences |
| Historical | Scheming Cardinal | Agents, assassins, and the weight of the Church as a weapon |
| Superhero | Criminal Mastermind | Always three steps ahead, the lair is the real weapon |
| Isekai | Demon Strategist | Commands from a throne, the dungeon itself obeys |
| Political | Shadow Chancellor | Pulls strings from behind the throne, never seen in public |

---

#### 3. Abomination

Monstrous creature boss. The abomination is a wall of HP and damage — a physical
confrontation that tests resources and endurance. Its regeneration mechanic forces the
player to think beyond raw damage output and exploit a specific weakness.

**Stat Block:**

```
**Abomination** [Nemesis] — Monstrous creature, regenerating horror.
- HP: 35 | Damage: 3d6 | Defence: 8 | Soak: 5
- Phase 1 (100–50% HP): Straightforward melee devastation. Attacks the nearest
  target with overwhelming force. Low defence compensated by massive HP and Soak.
- Phase 2 (below 50% HP): Gains "Regeneration" — recovers 1d4 HP at the start
  of each of its turns. Regeneration continues until the player exploits a
  specific weakness (see below).
- Abilities:
  - "Swallow/Engulf" — on a critical hit, the target is Restrained and takes
    1d6 damage at the start of each round. Escape requires a STR check DC 14.
    Allies may attack the abomination to free the target (dealing 8+ damage in
    a single hit forces it to release).
  - "Terrifying Roar" — once per encounter, all targets must pass an INT DC 12
    check or gain the Frightened condition for 2 rounds.
- Weakness: The GM defines a specific weakness at encounter creation. Exploiting
  the weakness stops Regeneration permanently. Examples: fire damage, destroying
  a visible crystal/core, a specific element, removing a parasite, severing a
  specific limb. The weakness should be discoverable through observation (INT
  check DC 12) or narrative clues planted before the encounter.
- Behaviour: Phase 1 — advances relentlessly, attacks whatever is closest.
  Phase 2 — becomes more desperate, uses Swallow on opportunity, roars when
  regeneration is disrupted.
- Loot: 100–200 credits, rare crafting material, quest reward
```

**Theme Adaptations:**

| Genre | Name | Weakness Example | Flavour |
|-------|------|-----------------|---------|
| Space | Void Leviathan | Destroy the nerve cluster behind its maw | Fills the corridor, pseudopods reaching |
| Fantasy | Troll King | Fire stops regeneration | Ancient, massive, bark-like hide |
| Horror | The Mass | Sever the original host's head from the amalgam | Fused bodies, too many mouths |
| Cyberpunk | Bioweapon Prototype | EMP the control chip at its spine | Corporate experiment gone wrong |
| Wuxia | Demon Beast | Strike the inverse scale beneath its chin | Mountain-dwelling horror of legend |
| Survival | Megafauna | Blind it — destroy its eyes | Prehistoric scale, shouldn't exist |
| Steampunk | Flesh Engine | Destroy the furnace in its chest cavity | Meat grafted to machinery |
| Post-Apocalyptic | Irradiated Colossus | Lead-lined weapon stops regeneration | Glowing, weeping radiation |
| Historical | Sea Serpent | Greek fire or boiling pitch | Coils around the ship, barnacle-encrusted |
| Superhero | Kaiju | Overload its energy absorption organ | City-block scale, origin unknown |
| Isekai | World Boss | Destroy the dungeon core powering it | Impossible anatomy, game-logic biology |
| Political | — | *(Abomination template is rarely used in political games)* | — |

---

#### 4. Rival Turned Enemy

An NPC who was once an ally — or could have been one. This template uniquely offers a
**social resolution path**. The player can choose to fight, but they can also choose to talk.
Defeating through persuasion is a valid (and often more rewarding) victory.

**Stat Block:**

```
**Rival Turned Enemy** [Nemesis] — Former ally, conflicted antagonist.
- HP: 25 | Damage: 2d6 | Defence: 14 | Soak: 3
- Phase 1 (100–50% HP OR before failed persuasion): Fights reluctantly.
  Pulls punches — uses non-lethal attacks where possible (damage is real,
  but narrated as restraining or disabling rather than killing).
  CAN BE TALKED DOWN: CHA DC 16. Success ends the encounter peacefully.
  The DC decreases by 2 for each piece of relevant evidence, shared memory,
  or emotional appeal the player presents (minimum DC 10).
- Phase 2 (below 50% HP OR after failed persuasion attempt): Fights with
  full commitment. No longer pulls punches. The social resolution path
  closes — this is now a fight to the end.
- Abilities:
  - "Mirror" — knows the player's abilities. Once per encounter, counter
    a Skill action entirely (the ability is wasted, no effect). The rival
    narrates how they anticipated the move.
  - "Shared History" — has advantage on all attack rolls against the player
    due to familiarity with their fighting style. This applies in both phases.
- Behaviour: Phase 1 — hesitant, speaks during combat, references shared
  history, leaves openings (the GM should make the social path feel possible).
  Phase 2 — cold, efficient, stops talking, fights like someone who knows
  exactly how the player moves.
- Loot: Phase 1 resolution (social): Full quest reward, ally recovered,
  no combat loot. Phase 2 resolution (combat): 100+ credits, the rival's
  signature weapon or item, but narrative consequences (guilt, reputation
  loss, faction standing change).
```

**Theme Adaptations:**

| Genre | Name | Flavour |
|-------|------|---------|
| Space | Former Crewmate | "We used to watch the stars from the observation deck. Remember?" |
| Fantasy | Fallen Paladin | Once swore the same oath, now serves a different master |
| Horror | Infected Friend | Still in there, somewhere, fighting for control |
| Cyberpunk | Ex-Partner | Sold out to the corp, or did the player sell out first? |
| Wuxia | Senior Disciple | Same school, same master, different interpretation of the teaching |
| Survival | Former Ally | Resources are scarce, and they chose their people over yours |
| Steampunk | Rival Inventor | Once collaborated, now their creation threatens everything |
| Post-Apocalyptic | Exile | Banished from the settlement, returned with grievances and followers |
| Historical | Brother-in-Arms | Served together, now on opposite sides of a war |
| Superhero | Former Sidekick | Grew tired of the shadow, now carving their own path — violently |
| Isekai | Rival Summoned Hero | Another person pulled to this world, with a different mission |
| Political | Former Protégé | Learned everything from the player, now uses it against them |

---

## § CLI Commands

| Command | Purpose |
|---------|---------|
| `tag compute encounter --level {n} --tier {minion\|rival\|nemesis}` | Generate an encounter scaled to the player's level using templates from this module |
| `tag state create-npc --template {template} --tier {tier} --genre {genre}` | Create an adversary NPC from a bestiary template with genre-appropriate reskinning |
| `tag state get encounter` | Read the current encounter state (active adversaries, round, HP) |

---

## Encounter Building Guidelines

Use the table below to select appropriate adversary combinations for the player's current
level. These are guidelines, not hard rules — the GM should adjust based on narrative
context, available resources, and recent encounter difficulty.

| Player Level | Recommended Encounter |
|-------------|----------------------|
| 1–2 | 2–3 Minions or 1 Rival |
| 3–4 | 3–4 Minions or 1 Rival + 2 Minions |
| 5–6 | 1 Rival + 3 Minions or 2 Rivals |
| 7–8 | 2 Rivals + 2 Minions or 1 Nemesis |
| 9–10 | 1 Nemesis + 2–3 Minions |

**Encounter pacing:** Not every scene needs combat. The GM should aim for roughly one
combat encounter per 3–4 scenes, with social encounters, exploration, and puzzle-solving
filling the gaps. Back-to-back combat encounters drain resources and flatten the pacing.

### XP Rewards

| Tier | XP per Adversary |
|------|-----------------|
| Minion | 5 XP |
| Rival | 15 XP |
| Nemesis | 50 XP |

XP is awarded upon defeating or resolving the encounter (including social resolution for
the Rival Turned Enemy template). Fleeing from an encounter awards no XP.

---

## Stat Block Format

The canonical format for all adversary stat blocks in this module. The GM uses this format
internally — stat blocks are **never shown to the player**.

```
**Name** [Tier] — Description
- HP: X | Damage: XdY | Defence: Z | Soak: W
- Abilities: Name (effect)
- Behaviour: How the GM should play this adversary
- Loot: What drops on defeat
```

**Fields:**
- **Name:** The adversary's name or title. Adapts to the genre.
- **Tier:** Minion, Rival, or Nemesis.
- **Description:** One sentence summarising the adversary's role.
- **HP:** Hit points. Reduced by damage after Soak is applied.
- **Damage:** Dice rolled for the adversary's attacks.
- **Defence:** The target number the player must meet or exceed to hit.
- **Soak:** Flat damage reduction applied to every hit the adversary takes.
- **Abilities:** Named special abilities with mechanical effects.
- **Behaviour:** Instructions for the GM on how to run the adversary tactically.
- **Loot:** What the adversary drops when defeated.

---

## gmState Fields

This module adds the following field to `gmState`:

<!-- CLI implementation detail — do not hand-code -->
```js
// Bestiary encounter tracking
encounter: {
  active: false,                // is an encounter in progress?
  adversaries: [],              // array of active adversary objects
  // Each adversary: { template, tier, name, hp, maxHp, damage, defence, soak,
  //                    abilities: [], phase: 1, conditions: [], behaviour }
  round: 0,                     // current combat round
  reinforcementsTriggered: false, // has a Guard/Leader summoned reinforcements?
},
```

### World Flag Prefix

Bestiary-related world flags use the `enc_` prefix:

- `enc_[location]_cleared` — encounter at this location has been resolved
- `enc_[adversary]_defeated` — a named adversary has been defeated
- `enc_[adversary]_spared` — a named adversary was resolved socially

Examples: `enc_bridge_cleared`, `enc_warlord_defeated`, `enc_rival_spared`

---

## Anti-Patterns

- **Never reveal stat blocks to the player** — describe capabilities narratively. "The
  creature shrugs off the blow as though it felt nothing" not "It has Soak 5."
- **Never use the same adversary template twice in a row without reskinning** — if the last
  encounter featured Grunts, the next should use a different template or a dramatically
  different theme adaptation of the same template.
- **Never make every encounter combat** — some adversaries can be negotiated with, bribed,
  intimidated, or avoided entirely. The Trickster and Leader templates lend themselves to
  social resolution. The Rival Turned Enemy demands it.
- **Never ignore the social resolution path on Rival Turned Enemy** — always offer
  alternatives to violence. If the player attempts persuasion, honour the attempt with a
  fair check. Closing off the social path without giving the player a chance is a violation
  of player agency.
- **Never spawn reinforcements without narrative justification** — Guards call for backup
  because they have a comm link. Leaders rally troops because they have authority. Isolated
  adversaries in sealed rooms do not summon help from nowhere.
- **Never exceed the encounter limits defined in SKILL.md** — max 3 standard enemies or
  1 boss per encounter. Reinforcements from Rally or Guard abilities count towards this limit.
- **Never forget to narrate phase transitions for Nemeses** — the shift from Phase 1 to
  Phase 2 is a dramatic moment. The warlord screams in rage. The mastermind triggers the
  failsafe. The abomination splits open and begins to regrow. The rival stops talking.
  These transitions are story beats, not just mechanical thresholds.
