# RPG Systems — Alternative Rule Systems
> Module for text-adventure orchestrator. Provides alternative RPG rule systems that replace or overlay the default D&D 5e-lite mechanics in core-systems. One system is active per session, selected during game setup.

Loaded by the text-adventure orchestrator (SKILL.md). Depends on: core-systems, die-rolls.

---

## System Selection

At game setup, after scenario selection, present the rulebook choice as a set of selectable
cards. Each card shows the system name, a one-line summary, the resolution mechanic, and a
"best for" recommendation. The player selects one; it locks for the session.

| System | Resolution | Best For |
|--------|-----------|----------|
| **d20 System** (default) | d20 + modifier vs DC. 6 ability scores (STR, DEX, CON, INT, WIS, CHA), HP tracking. | Casual play, newcomers, fast sessions. |
| **D&D 5e** | d20 + ability mod + proficiency vs DC. 6 ability scores, class features, spell slots. | Classic fantasy RPG, faithful to 5th Edition rules. |
| **GURPS Lite** | 3d6 roll-under. Point-buy characters, advantages/disadvantages. | Realistic and simulationist play. |
| **Pathfinder 2e Lite** | d20 + modifier + proficiency vs DC. Three-action economy, crit ranges. | Tactical combat-focused play. |
| **Shadowrun 5e Lite** | Dice pool (d6s), hits on 5+. Edge resource, matrix/magic subsystems. | Cyberpunk and near-future settings. |
| **Narrative Engine** | No dice. Fiction-first momentum track. | Story-driven play where mechanics should be invisible. |
| **SWRPG (Narrative Dice)** | Narrative dice pool (custom symbols). Triumph/Despair, Advantage/Threat. | Star Wars and other cinematic settings. |

When a system is selected, it **replaces** the corresponding sections in core-systems (stats,
resolution, combat) but does **not** replace universal systems (inventory, economy, conditions,
save). The universal systems adapt their language — e.g., "STR modifier" becomes "ST bonus" in
GURPS — but the underlying tracking (slots, currency, faction scores) remains identical.

Store the active system in `gmState.settings.rulebook` using one of: `'d20_system'`,
`'dnd_5e'`, `'gurps_lite'`, `'pf2e_lite'`, `'shadowrun_lite'`, `'narrative_engine'`, `'swrpg_narrative'`.

---

## d20 System (Default)

This is the built-in system from `core-systems.md` and `die-rolls.md`. No additional rules
are needed — selecting this option activates the standard engine as documented in those files.

**Summary:** 6 ability scores (STR, DEX, CON, INT, WIS, CHA), d20 + modifier vs DC, HP tracking, conditions,
proficiency bonuses, six archetypes. See `core-systems.md` for full details.

---

## D&D 5e (adapted for text adventure)

### Ability Scores (6, range 8–20)

| Ability | Governs | Modifier |
|---------|---------|----------|
| **Strength** | Melee attack/damage, Athletics, carrying capacity | (Score − 10) / 2, rounded down |
| **Dexterity** | Ranged attack, AC, initiative, Stealth, Acrobatics | (Score − 10) / 2, rounded down |
| **Constitution** | Hit points per level, concentration, endurance | (Score − 10) / 2, rounded down |
| **Intelligence** | Arcana, History, Investigation, Nature, Religion | (Score − 10) / 2, rounded down |
| **Wisdom** | Perception, Insight, Medicine, Survival, Animal Handling | (Score − 10) / 2, rounded down |
| **Charisma** | Deception, Intimidation, Performance, Persuasion | (Score − 10) / 2, rounded down |

### Character Creation

**Step 1 — Race** (provides ability score bonuses and racial traits):

| Race | Ability Bonus | Notable Traits |
|------|---------------|----------------|
| Human | +1 to all ability scores | Versatile, extra language |
| Elf | +2 DEX | Darkvision, Fey Ancestry (advantage vs charm), Trance (4-hour rest) |
| Dwarf | +2 CON | Darkvision, Dwarven Resilience (advantage vs poison), stonework lore |
| Halfling | +2 DEX | Lucky (reroll natural 1s on attacks/checks/saves), Brave (advantage vs frightened) |
| Half-Orc | +2 STR, +1 CON | Darkvision, Relentless Endurance (drop to 1 HP instead of 0 once per long rest) |
| Gnome | +2 INT | Darkvision, Gnome Cunning (advantage on INT/WIS/CHA saves vs magic) |
| Tiefling | +2 CHA, +1 INT | Darkvision, fire resistance, Infernal Legacy (innate spellcasting) |

**Step 2 — Class:**

| Class | Hit Die | Primary Ability | Saving Throw Proficiencies | Role |
|-------|---------|-----------------|---------------------------|------|
| Fighter | d10 | STR or DEX | STR, CON | Martial combat, weapon mastery, multiple attacks |
| Rogue | d8 | DEX | DEX, INT | Stealth, skills, Sneak Attack damage |
| Wizard | d6 | INT | INT, WIS | Arcane spellcasting, ritual casting, broad spell list |
| Cleric | d8 | WIS | WIS, CHA | Divine spellcasting, healing, armoured caster |
| Ranger | d10 | DEX or WIS | STR, DEX | Ranged combat, tracking, favoured terrain/enemy |
| Bard | d8 | CHA | DEX, CHA | Versatile spellcasting, Bardic Inspiration, social skills |
| Paladin | d10 | STR, CHA | WIS, CHA | Holy warrior, smites, aura of protection, healing |
| Warlock | d8 | CHA | WIS, CHA | Pact magic (few slots, recover on short rest), eldritch invocations |
| Monk | d8 | DEX, WIS | STR, DEX | Unarmed combat, Ki points, speed, deflect missiles |
| Barbarian | d12 | STR | STR, CON | Rage (damage resistance, bonus melee damage), reckless attack |
| Druid | d8 | WIS | INT, WIS | Nature magic, Wild Shape (transform into beasts) |
| Sorcerer | d6 | CHA | CON, CHA | Innate arcane magic, Metamagic (modify spells), Font of Magic |

**Step 3 — Background** (provides 2 skill proficiencies + 1 tool or language):

| Background | Skill Proficiencies | Tool/Language | Flavour |
|------------|-------------------|---------------|---------|
| Acolyte | Insight, Religion | Two languages | Raised in temple service |
| Criminal | Deception, Stealth | Thieves' tools | Life of crime and contacts |
| Folk Hero | Animal Handling, Survival | One artisan's tool | Local legend, common roots |
| Noble | History, Persuasion | One gaming set | Privilege, title, retainers |
| Sage | Arcana, History | Two languages | Scholar, researcher, librarian |
| Soldier | Athletics, Intimidation | One gaming set | Military rank and discipline |

**Step 4 — Ability Scores:** Assign the standard array (15, 14, 13, 12, 10, 8) across the six abilities. Apply racial bonuses. Present as a drag-and-drop or selection widget showing each score, its modifier, and which abilities benefit the chosen class.

**Step 5 — Starting Equipment:** Determined by class and background. The GM provides a sensible default loadout rather than requiring the player to shop.

### Core Mechanic — d20 + Ability Modifier + Proficiency Bonus vs DC/AC

Roll 1d20 + ability modifier + proficiency bonus (if proficient) against the target's DC or AC.

**Proficiency bonus by level:**

| Level | Proficiency Bonus |
|-------|-------------------|
| 1–4 | +2 |
| 5–8 | +3 |
| 9–12 | +4 |

**Advantage/Disadvantage:** Roll 2d20. With Advantage, take the higher result. With Disadvantage, take the lower. They do not stack — multiple sources of advantage still mean roll 2d20 take highest. If you have both advantage and disadvantage from any number of sources, they cancel out and you roll normally.

**Natural 20:** Automatic success on attack rolls (always hits, always a critical hit). On ability checks, it is simply a high roll — not an automatic success.

**Natural 1:** Automatic miss on attack rolls. On ability checks, it is simply a low roll.

### Skills (18)

| Ability | Skills |
|---------|--------|
| STR | Athletics |
| DEX | Acrobatics, Sleight of Hand, Stealth |
| INT | Arcana, History, Investigation, Nature, Religion |
| WIS | Animal Handling, Insight, Medicine, Perception, Survival |
| CHA | Deception, Intimidation, Performance, Persuasion |

Skill check = d20 + ability modifier + proficiency bonus (if proficient). Class and background each grant proficiency in a set of skills chosen during character creation.

### Hit Points

HP at level 1 = maximum hit die value + CON modifier.
Each subsequent level: roll the class hit die + CON modifier (minimum 1 HP per level).

| Hit Die | Classes |
|---------|---------|
| d6 | Wizard, Sorcerer |
| d8 | Rogue, Bard, Cleric, Druid, Monk, Warlock |
| d10 | Fighter, Paladin, Ranger |
| d12 | Barbarian |

### Armour Class

| Armour Type | AC Calculation |
|-------------|---------------|
| Unarmoured | 10 + DEX modifier |
| Light armour | Armour base + DEX modifier |
| Medium armour | Armour base + DEX modifier (max +2) |
| Heavy armour | Armour base only (no DEX modifier) |
| Shield | +2 to AC (stacks with armour) |

### Combat

**Initiative:** d20 + DEX modifier. Highest goes first. Ties broken by DEX score.

**Each turn:** 1 Action + 1 Bonus Action + 1 Movement (up to speed) + 1 Free Object Interaction.

| Action | Effect |
|--------|--------|
| **Attack** | d20 + ability mod + proficiency vs AC. Damage = weapon die + ability modifier. |
| **Cast a Spell** | As described by the spell. Uses the caster's action (some spells use bonus action or reaction). |
| **Dash** | Double movement for the turn. |
| **Disengage** | Movement does not provoke opportunity attacks this turn. |
| **Dodge** | Attacks against you have disadvantage until your next turn. |
| **Help** | Give an ally advantage on their next ability check or attack roll. |
| **Hide** | DEX (Stealth) check to become hidden. |
| **Use an Object** | Interact with a second object or use a complex item. |

**Opportunity attacks:** When a creature you can see moves out of your reach, you may use your reaction to make one melee attack against it.

**Critical hits:** On a natural 20, roll all damage dice twice (double dice, not double modifier).

### Saving Throws

Each class is proficient in two saving throws (listed in the class table above). Saving throw = d20 + ability modifier + proficiency bonus (if proficient) vs DC.

### Spell Slots (simplified)

Spellcasting classes have a limited number of spell slots per day. Cantrips (level 0) are at-will and unlimited.

| Character Level | 1st-Level Slots | 2nd-Level Slots | 3rd-Level Slots |
|-----------------|-----------------|-----------------|-----------------|
| 1 | 2 | — | — |
| 2 | 3 | — | — |
| 3 | 4 | 2 | — |
| 4 | 4 | 3 | — |
| 5 | 4 | 3 | 2 |

**Spell attack roll** = d20 + spellcasting ability modifier + proficiency bonus.
**Spell save DC** = 8 + spellcasting ability modifier + proficiency bonus.

Spellcasting ability depends on class: INT (Wizard), WIS (Cleric, Druid, Ranger), CHA (Bard, Paladin, Sorcerer, Warlock).

### Short Rest and Long Rest

- **Short rest** = 1 hour of downtime. A character may spend one or more Hit Dice to recover HP. Roll each Hit Die + CON modifier; regain that many HP.
- **Long rest** = 8 hours (at least 6 of which are sleep). Regain all lost HP. Regain spent Hit Dice up to half your total (minimum 1). Spell slots are restored. Most class features that recharge on a long rest are restored.

### Die Roll Adaptation

When adapting the die widget for D&D 5e, use the standard click-to-roll flow with the
following reveal details:
- **Declare:** Modifier breakdown (ability mod + proficiency bonus + situational bonuses), target DC/AC. Advantage/disadvantage shows 2d20.
- **Resolve:** Total vs DC/AC. Natural 20/1 on attack rolls. Critical hits roll bonus damage dice. Badge: CRITICAL HIT / HIT / MISS / CRITICAL MISS (attacks) or SUCCESS / FAILURE (checks/saves).

---

## GURPS Lite (adapted for text adventure)

### Characteristics (4, scale 1–20, average 10)

| Characteristic | Governs | Derived |
|----------------|---------|---------|
| **ST** (Strength) | Physical power, melee damage | HP = ST |
| **DX** (Dexterity) | Agility, coordination, combat skill | Base Speed = (DX + HT) / 4 |
| **IQ** (Intelligence) | Mental ability, perception, will | Perception = IQ, Will = IQ |
| **HT** (Health) | Stamina, resistance, recovery | Fatigue Points (FP) = HT |

### Character Creation — 100 Points

Characteristics cost 10 points per +1 above 10 and give back 10 points per −1 below 10.
Skills cost 1–4 points per level depending on difficulty. Advantages cost 10–25 points each.
Disadvantages give back 10–25 points (maximum −40 points from disadvantages).

**Chargen flow:**
1. Set characteristics (allocate points across ST, DX, IQ, HT).
2. Choose 1–2 advantages from the list below.
3. Choose 1–2 disadvantages from the list below (to free up points).
4. Spend remaining points on skills.
5. GM calculates derived stats (HP, FP, Base Speed).

The character creation scene template presents a point-buy interface with increment/decrement
controls for each characteristic, a running total of points spent, and selectable
advantage/disadvantage cards.

### Core Mechanic — 3d6 Roll-Under

Roll 3d6 against your skill or attribute. Lower is better.

| Result | Condition |
|--------|-----------|
| Roll ≤ skill | **Success** |
| Roll ≤ skill by 5+ | **Critical success** |
| Roll ≥ 17 | **Automatic failure** (regardless of skill) |
| Roll = 18 | **Critical failure** |

**Margin of success/failure** = skill − roll. Positive = success margin; negative = failure
margin. The margin determines the quality of the outcome — a margin of +6 on a lockpicking
check means the lock opens silently; a margin of +1 means it opens with a worrying click.

**Difficulty modifiers:** Easy +2, Average +0, Hard −2, Very Hard −4. Applied to the
effective skill before rolling.

### Skills (12, mapped to characteristics)

| Characteristic | Skills |
|----------------|--------|
| ST | Brawling, Climbing |
| DX | Stealth, Shooting, Melee Weapon |
| IQ | Electronics, Medicine, Fast-Talk, Perception, Research |
| HT | Running, Swimming |

Skills default to characteristic −4 (untrained). Each point spent raises the skill by +1
from that default. Maximum skill level = characteristic + 4 at character creation.

### Advantages (pick 1–2 during chargen)

| Advantage | Cost | Effect |
|-----------|------|--------|
| Combat Reflexes | 15 pts | +1 to all combat rolls; never freeze in surprise. |
| Danger Sense | 15 pts | GM rolls Perception for you when danger is near; success gives a warning. |
| Luck | 15 pts | Once per session, reroll any one roll and take the better result. |
| High Pain Threshold | 10 pts | Ignore wound penalties up to −2. |
| Charisma +2 | 10 pts | +2 to all social skill rolls. |

### Disadvantages (pick 1–2, give back points)

| Disadvantage | Value | Effect |
|--------------|-------|--------|
| Bad Temper | −10 pts | Must make IQ roll to avoid responding violently to provocation. |
| Curious | −10 pts | Must make IQ roll to resist investigating mysterious things. |
| Sense of Duty | −10 pts | Cannot abandon allies, even when tactically smart. |
| Overconfidence | −10 pts | Must make IQ roll to recognise when a plan is too risky. |
| Debt | −15 pts | Owe a dangerous party; they will come collecting. |

**Disadvantage triggers:** When a situation activates a disadvantage, the GM calls for an IQ
roll (or the relevant resistance roll). Failure means the disadvantage manifests — the
character acts on their flaw. Success means they resist the impulse, but the GM should note
the internal struggle in narration.

### Combat

Each round: **1 action** (attack, defend, move, or use item).

- **Attack:** Roll 3d6 under combat skill (Melee Weapon, Brawling, or Shooting).
- **Defence:** Dodge (DX-based, roll 3d6 under DX/2 + 3) or Parry (weapon skill / 2 + 3).
  The defender chooses one defence per attack.
- **Damage:** Weapon base + ST bonus (for melee), reduced by DR (damage resistance from armour).
- **Injury:** Damage that penetrates DR is subtracted from HP.
- **Incapacitation:** At HP 0, make HT rolls each round to stay conscious. At −HP, death.

### Die Roll Adaptation

When adapting the die widget for GURPS, use the click-to-roll flow with the following
reveal details:
- **Declare:** Effective skill (attribute + modifiers), difficulty modifier, target number (roll-under).
- **Resolve:** Sum of 3d6 vs effective skill. Margin of success/failure displayed. Badge: CRITICAL SUCCESS / SUCCESS / FAILURE / CRITICAL FAILURE.

---

## Pathfinder 2e Lite (adapted for text adventure)

### Ability Scores (6)

| Ability | Governs |
|---------|---------|
| **Strength** | Melee attack/damage, Athletics, carrying capacity |
| **Dexterity** | Ranged attack, AC, Reflex saves, Stealth |
| **Constitution** | HP per level, Fortitude saves |
| **Intelligence** | Trained skills, Arcana, Crafting, recall knowledge |
| **Wisdom** | Perception, Will saves, Medicine, Survival |
| **Charisma** | Social skills, Deception, Diplomacy, Intimidation |

Scores range 10–18 at creation. Modifier = (score − 10) / 2, rounded down.

### Character Creation

**Step 1 — Ancestry** (provides HP bonus and one ability boost):

| Ancestry | HP Bonus | Ability Boost | Flavour |
|----------|----------|---------------|---------|
| Human | 8 | Any one | Versatile, adaptable |
| Elf | 6 | DEX | Graceful, long-lived, perceptive |
| Dwarf | 10 | CON | Hardy, stubborn, traditional |
| Halfling | 6 | DEX | Lucky, stealthy, cheerful |
| Orc | 10 | STR | Strong, fierce, resilient |
| Gnome | 8 | CHA | Curious, magical, eccentric |

**Step 2 — Background** (provides 2 skill proficiencies and 1 ability boost):

Backgrounds are generated to fit the scenario theme. Each grants Trained proficiency in two
skills and a +2 boost to one ability score. Examples: Acolyte (Religion, Diplomacy, +2 WIS),
Street Urchin (Stealth, Thievery, +2 DEX), Scholar (Arcana, Society, +2 INT).

**Step 3 — Class:**

| Class | Key Ability | HP/Level | Role |
|-------|-------------|----------|------|
| Fighter | STR or DEX | 10 | Martial combat, weapon mastery |
| Rogue | DEX | 8 | Stealth, skills, sneak attack |
| Wizard | INT | 6 | Arcane spells, knowledge |
| Cleric | WIS | 8 | Divine spells, healing |
| Ranger | DEX or WIS | 10 | Ranged combat, tracking, animal companion |
| Bard | CHA | 8 | Inspiration, versatile spells, social skills |

### Core Mechanic — d20 + Modifier + Proficiency vs DC

**Proficiency tiers:**

| Tier | Bonus | Earned |
|------|-------|--------|
| Untrained | +0 | Default for all skills |
| Trained | +2 + level | Class/background grants at creation |
| Expert | +4 + level | Level 3+ |
| Master | +6 + level | Level 7+ |
| Legendary | +8 + level | Level 9+ (rare) |

**Critical success/failure system:**
- Beat DC by 10+ → **Critical success** (enhanced outcome).
- Miss DC by 10+ → **Critical failure** (worse outcome).
- Natural 20 → Upgrades result one step (failure → success, success → critical success).
- Natural 1 → Downgrades result one step (success → failure, failure → critical failure).

This means a natural 20 does not guarantee success on extreme DCs — it merely upgrades.
Likewise, a natural 1 on an easy check might still succeed (downgraded from critical success
to regular success).

### Three-Action Economy

Each turn, a character receives **3 actions**. Possible actions:

| Action | Cost | Effect |
|--------|------|--------|
| **Strike** | 1 action | Attack. Multiple Attack Penalty: 2nd strike −5, 3rd strike −10. |
| **Move** | 1 action | Move one range band. |
| **Cast a Spell** | 1–3 actions | Depends on the spell. More actions = more powerful effect. |
| **Raise Shield** | 1 action | +2 AC until start of next turn. |
| **Recall Knowledge** | 1 action | INT check to learn about an enemy (weaknesses, abilities). |
| **Demoralise** | 1 action | CHA vs enemy Will DC to inflict Frightened (−1 to all checks). |
| **Aid** | 1 action | Help an ally's next check (+1 circumstance bonus). |
| **Take Cover** | 1 action | +2 AC, +1 Reflex saves. |

The three-action economy is the heart of PF2e. The scene template presents available actions
as buttons with their action cost shown as pips (●○○ for 1 action, ●●○ for 2, ●●● for 3). Track remaining
actions in the combat widget header.

### Skills (16)

| Attribute | Skills |
|-----------|--------|
| STR | Athletics |
| DEX | Acrobatics, Stealth, Thievery |
| INT | Arcana, Crafting, Occultism, Society |
| WIS | Medicine, Nature, Religion, Survival |
| CHA | Deception, Diplomacy, Intimidation, Performance |

### Hit Points

HP = Ancestry HP bonus + (Class HP per level × level) + (CON modifier × level).

### Combat

- **AC** = 10 + DEX modifier + proficiency bonus + armour item bonus.
- **Melee damage** = weapon die + STR modifier.
- **Ranged damage** = weapon die + DEX modifier (finesse/ranged weapons).
- **Saving throws:** Fortitude (CON), Reflex (DEX), Will (WIS). Each has its own proficiency tier.

### Die Roll Adaptation

When adapting the die widget for PF2e, use the click-to-roll flow with the following
reveal details:
- **Declare:** Modifier breakdown (ability + proficiency tier + bonuses), action cost in pips.
- **Resolve:** Total vs DC. Critical thresholds at +/-10 from DC. Natural 20/1 step adjustments. Badge: CRITICAL SUCCESS / SUCCESS / FAILURE / CRITICAL FAILURE.

---

## Shadowrun 5e Lite (adapted for text adventure)

### Attributes (8, scale 1–6, human average 3)

**Physical:**
| Attribute | Governs |
|-----------|---------|
| **Body** | Toughness, damage resistance, physical damage track |
| **Agility** | Dexterity, combat accuracy, stealth |
| **Reaction** | Reflexes, initiative, dodge |
| **Strength** | Physical power, melee damage |

**Mental:**
| Attribute | Governs |
|-----------|---------|
| **Willpower** | Resolve, drain resistance, stun damage track |
| **Logic** | Reasoning, hacking, technical skills |
| **Intuition** | Gut feeling, initiative, perception |
| **Charisma** | Presence, social skills, leadership |

### Derived Stats

| Stat | Formula |
|------|---------|
| Initiative | Reaction + Intuition + 1d6 |
| Physical damage track | 8 + ceil(Body / 2) |
| Stun damage track | 8 + ceil(Willpower / 2) |
| Composure | Willpower + Charisma |
| Judge Intentions | Intuition + Charisma |
| Lifting/Carrying | Strength + Body |

### Character Creation — Priority System (simplified)

Assign priorities A through E (each used once) to five categories:

| Priority | Metatype | Attributes | Skills | Magic/Resonance | Resources |
|----------|----------|------------|--------|-----------------|-----------|
| A | Troll (8 pts) | 24 pts | 36 pts | Full Mage / Full Decker | 450,000¥ |
| B | Ork (7 pts) | 20 pts | 28 pts | Adept / Aspected Mage | 275,000¥ |
| C | Dwarf (5 pts) | 16 pts | 22 pts | Aware (limited magic) | 140,000¥ |
| D | Elf (3 pts) | 14 pts | 18 pts | Mundane | 50,000¥ |
| E | Human (1 pt) | 12 pts | 10 pts | Mundane | 6,000¥ |

**Metatypes:**
| Metatype | Notable Traits |
|----------|---------------|
| Human | Versatile; extra Edge point |
| Elf | +1 AGI, +2 CHA; low-light vision |
| Dwarf | +2 Body, +1 Willpower; thermographic vision; reduced movement |
| Ork | +3 Body, +1 STR; low-light vision |
| Troll | +4 Body, +1 STR; thermographic vision; natural armour (+1 DR); reach |

The character creation scene template presents the priority system as a selection grid. Each
category shows what each priority tier provides. The player assigns letters and the GM
calculates totals.

### Core Mechanic — Dice Pool (d6s)

Roll a pool of d6s equal to **attribute + skill**. Each die showing **5 or 6 = 1 hit**.
Compare total hits to the threshold.

| Threshold | Difficulty | Example |
|-----------|-----------|---------|
| 1 | Easy | Picking a simple lock, recalling common knowledge |
| 2 | Average | Hacking a civilian system, fast-talking a bored clerk |
| 3 | Hard | Fast-talking a suspicious guard, bypassing corporate security |
| 4 | Very Hard | Cracking military ICE, convincing an enemy to stand down |
| 5+ | Extreme | Legendary feats, once-in-a-lifetime actions |

**Glitch:** Half or more dice show 1s **and** you fail to meet the threshold → **Glitch**
(something goes wrong alongside the failure — you hack the system but trip a silent alarm).

**Critical glitch:** Half or more dice show 1s **and** zero hits → **Critical glitch**
(catastrophic failure — your deck fries, your cover is blown, your weapon jams spectacularly).

### Edge (luck resource)

Edge is a pool of 1–6 points (determined by metatype and build). Spend 1 Edge to:
- Reroll all failures in a dice pool.
- Add your Edge rating as extra dice to a roll.
- Go first in initiative (seize the initiative).
- Negate a glitch entirely.

Edge refreshes at the start of each session. Exceptional roleplaying or clever tactics may
earn bonus Edge during play (GM's discretion, maximum 1 bonus per session).

### Skills (12, simplified)

| Category | Skills |
|----------|--------|
| **Combat** | Firearms, Close Combat, Heavy Weapons |
| **Physical** | Athletics, Stealth, Perception |
| **Technical** | Electronics, Mechanics, First Aid |
| **Social** | Con, Intimidation, Negotiation |

Skills range 1–6 at character creation. Skill + linked attribute = dice pool for that action.

### Combat

**Initiative:** Reaction + Intuition + 1d6. Highest goes first. Ties broken by Edge, then
Reaction.

**Each turn:** 1 Free Action + 1 Simple Action + 1 Complex Action (or 2 Simple Actions
instead of 1 Complex Action).

| Action Type | Examples |
|-------------|----------|
| Free Action | Drop item, speak, observe |
| Simple Action | Ready weapon, take aim (+1 die next attack), call a shot |
| Complex Action | Fire weapon, cast spell, hack a device, sprint |

**Attack resolution:**
- **Ranged:** Agility + Firearms vs target's Reaction + Intuition.
- **Melee:** Agility + Close Combat vs target's Reaction + Intuition (or Close Combat if they
  choose to parry).
- **Net hits** (attacker hits minus defender hits) = bonus damage.
- **Damage:** Weapon base damage + net hits, resisted by Body + Armour (each hit on the
  resistance roll reduces damage by 1).

**Damage types:**
- **Physical damage** — bullets, blades, explosions. Fills the physical damage track.
- **Stun damage** — tasers, gel rounds, drain, exhaustion. Fills the stun damage track.
- When either track is full, the character is incapacitated.

### Matrix (hacking) — simplified

The Matrix is the augmented-reality network overlaying the physical world. Deckers interact
with it using a cyberdeck.

- **Hack attempt:** Logic + Electronics vs device rating × 2 as threshold.
- **Success** = gain access (read data, control device, loop camera feed).
- **Overwatch Score (OS):** Each Matrix action adds 2d6 to the Overwatch Score. At OS 40,
  GOD (Grid Overwatch Division) locates the decker and forces disconnect — the decker takes
  6 stun damage and loses Matrix access for the scene.
- **Tactics:** Quick hacks (threshold 1–2) add less OS. Deep dives (threshold 3–4) are
  riskier but yield better results. The player must balance ambition against time.

### Magic — simplified

Available if Magic/Resonance priority is C or higher.

- **Spellcasting:** Magic attribute + Spellcasting skill. Threshold varies by spell power.
- **Drain:** After casting, resist drain by rolling Willpower + Logic. Failure to meet the
  drain threshold causes stun damage equal to the shortfall. Powerful spells have higher
  drain — casting recklessly can knock a mage unconscious.
- **Spell force:** The caster chooses the force (power level) of each spell. Higher force
  = greater effect but higher drain threshold.
- **Astral perception:** Mages can perceive the astral plane, seeing magical auras, spirits,
  and concealed magical effects. Useful for investigation and detecting ambushes.

### Die Roll Adaptation

When adapting the dice UI for Shadowrun, use a click-to-roll pool presentation with the
following reveal details:
- **Declare:** Dice pool size (attribute + skill + modifiers), threshold. Edge option if available.
- **Resolve:** Count hits (5-6), compare to threshold. Check glitch/critical glitch (half or more dice show 1s). Badge: CRITICAL GLITCH / GLITCH / FAILURE / SUCCESS / EXCEPTIONAL SUCCESS (hits exceed threshold by 3+).

---

## Narrative Engine (original system)

### Design Philosophy

No numeric stats. No dice. Resolution through narrative momentum and player creativity.
Inspired by Powered by the Apocalypse and Fate, but even lighter. Perfect for story-first
play where mechanical resolution should be invisible.

### Character Definition

Each character has:
- **Concept** — one sentence describing who they are (e.g., "Disgraced starship captain
  seeking redemption").
- **3 Strengths** — things they are good at. Broad and narrative, not mechanical (e.g.,
  "silver tongue", "steady under fire", "knows every back alley on the station").
- **2 Flaws** — things that get them into trouble (e.g., "trusts too easily", "owes the
  wrong people").
- **1 Bond** — a relationship that matters (e.g., "my daughter does not know what I do for
  a living").

**No stats, no modifiers.** The character sheet IS the narrative. Present character creation
as a free-form widget with text inputs for each field. No stat blocks, no numbers, no
point-buy — pure narrative identity.

### Resolution — The Momentum System

The story has a **Momentum track** ranging from 0 to 10. It starts at 5.

When a player attempts something:

| Situation | Outcome | Momentum Change |
|-----------|---------|-----------------|
| **Within their Strengths** | Succeeds. Complication only if Momentum is low (0–3). | Stays or rises by 1. |
| **Neutral** (neither strength nor flaw) | GM presents a choice: succeed at a cost, or fail but gain Momentum +1. | Player decides. |
| **Against their Flaws** | The flaw manifests in the narrative. | Drops by 1. |

**High Momentum (8+):** The player is on a roll. Successes come easily and the narrative
flows in their favour. But a flaw trigger at high momentum causes a **dramatic reversal** —
Momentum crashes to 3 and the GM narrates a sudden turn of fortune.

**Momentum 0 — Crisis:** The GM presents a dire situation (captured, betrayed, injured,
cornered). Resolution requires the player to **sacrifice something** — an item, a
relationship, a secret, a position of safety — to reset Momentum to 5. The sacrifice must
be narratively meaningful; the GM does not accept trivial offerings.

**Momentum display:** Render as a horizontal track of 11 segments (0–10) in the status bar.
The current position is highlighted. Colour shifts from red (0–3) through amber (4–6) to
green (7–10). No numeric label — the visual conveys the state.

### Conflict Resolution

- **No initiative.** Narrative determines who acts. The GM follows dramatic logic — the
  character in the most precarious position acts first.
- **Harm is fictional, not numeric.** Three tiers:
  1. **Hurt** — bruised, shaken, winded. No mechanical effect; narrated discomfort.
  2. **Badly hurt** — bleeding, limping, dazed. Actions within Strengths still succeed;
     Neutral actions are treated as if against a Flaw.
  3. **Incapacitated** — cannot act until rescued or recovered.
- **Recovery** requires downtime and narrative justification. A quiet moment, medical
  attention, or rest at a safe place moves the character one tier up.
- **Death** is only possible with player consent or as the consequence of a Crisis sacrifice
  the player agrees to. The Narrative Engine never kills a character through random chance.

### Why This System Works for Text Adventures

- No dice rolling means no widget overhead — pure narrative flow with zero mechanical
  interruption.
- The Momentum track creates natural dramatic pacing: rising action → crisis → resolution →
  rising action. The structure mirrors classic story arcs without the GM needing to force it.
- Flaws drive story more than strengths. A character with "trusts too easily" will generate
  more interesting scenes than one with "good at fighting".
- The Bond creates emotional stakes without mechanical complexity — it gives the GM a lever
  to pull when the story needs personal weight.
- Perfect for genres where combat is not the focus: political intrigue, horror, mystery,
  isekai, romance, slice-of-life, psychological thriller.

### Character Creation Adaptation

The character creation scene template replaces the standard stat-block interface with a
narrative identity form:
- **Concept:** single-line text input ("Who are you, in one sentence?").
- **Strengths:** three text inputs ("What are you good at?").
- **Flaws:** two text inputs ("What gets you into trouble?").
- **Bond:** one text input ("Who matters to you, and why?").
- **No archetype selector.** The concept replaces the archetype.
- **Confirm button** triggers `sendPrompt` to begin the adventure.

---

## SWRPG Narrative Dice (adapted for text adventure)

### Characteristics (6, range 1–5, human average 2–3)

| Characteristic | Governs |
|----------------|---------|
| **Brawn** | Physical power, melee damage, soak, wound threshold |
| **Agility** | Ranged combat, coordination, reflexes, piloting |
| **Intellect** | Knowledge, mechanics, computers, medical skill |
| **Cunning** | Deception, streetwise, perception, craftiness |
| **Willpower** | Discipline, resilience, strain threshold, coercion resistance |
| **Presence** | Leadership, charm, social influence, commanding attention |

### Derived Stats

| Stat | Formula |
|------|---------|
| Wound Threshold | 10 + Brawn (species may modify) |
| Strain Threshold | 10 + Willpower (species may modify) |
| Soak | Brawn + armour value |
| Defence | From armour and cover (ranged defence, melee defence) |

### The Narrative Dice Pool

The system uses custom dice with symbols rather than numeric faces. Each die type contributes specific symbols to the pool:

| Die | Colour | Sides | Symbols Generated | Role |
|-----|--------|-------|-------------------|------|
| **Ability** | Green | d8 | Success, Advantage | Base positive die — one per rank of higher value (characteristic or skill) |
| **Proficiency** | Yellow | d12 | Success, Advantage, Triumph | Upgraded positive die — one per rank of lower value (characteristic or skill) |
| **Difficulty** | Purple | d8 | Failure, Threat | Base negative die — set by GM based on task difficulty |
| **Challenge** | Red | d12 | Failure, Threat, Despair | Upgraded negative die — added for especially dangerous or opposed tasks |
| **Boost** | Blue | d6 | Success, Advantage | Situational bonus — favourable circumstances, assistance, clever tactics |
| **Setback** | Black | d6 | Failure, Threat | Situational penalty — poor conditions, hindrances, environmental hazards |
| **Force** | White | d12 | Light Side, Dark Side | Force power checks and Destiny Pool — not used in standard skill checks |

#### Die Face Distributions

**Ability (Green d8):** Blank, Success, Success, Success×2, Advantage, Advantage, Success+Advantage, Advantage×2

**Proficiency (Yellow d12):** Blank, Success, Success, Success×2, Success×2, Advantage, Success+Advantage, Success+Advantage, Success+Advantage, Advantage×2, Advantage×2, Triumph

**Difficulty (Purple d8):** Blank, Failure, Failure×2, Threat, Threat, Threat, Threat×2, Failure+Threat

**Challenge (Red d12):** Blank, Failure, Failure, Failure×2, Failure×2, Threat, Threat, Failure+Threat, Failure+Threat, Threat×2, Threat×2, Despair

**Boost (Blue d6):** Blank, Blank, Success, Success+Advantage, Advantage×2, Advantage

**Setback (Black d6):** Blank, Blank, Failure, Failure, Threat, Threat

**Force (White d12):** Light×1, Light×1, Light×1, Light×1, Light×1, Light×1, Light×2, Dark×1, Dark×1, Dark×2, Dark×2, Dark×2

*Force die: 8 light pips across 7 faces, 8 dark pips across 5 faces. Light side appears more often but in smaller amounts; dark side appears less often but in larger bursts.*

### Building Dice Pools

1. **Start with the characteristic or skill, whichever is higher.** Add that many green Ability dice.
2. **Upgrade green dice to yellow Proficiency dice** equal to the lower of characteristic or skill. (Each upgrade replaces one green with one yellow.)
3. **GM sets difficulty** as purple Difficulty dice (typically 1–5).
4. **Add blue Boost dice** for advantages: good positioning, prior preparation, allied assistance.
5. **Add black Setback dice** for hindrances: poor lighting, injuries, time pressure.
6. **Upgrade purple to red Challenge dice** for particularly dangerous or opposed situations.

**Example:** A character with Agility 3 and Ranged Combat 2 shooting in dim light. Pool = 3 green (Agility, the higher value), upgrade 2 to yellow (Ranged Combat, the lower value) → 1 green + 2 yellow. GM sets Average difficulty (2 purple). Dim light adds 1 black Setback. Final pool: 1 green + 2 yellow + 2 purple + 1 black.

### Resolution — Two Independent Axes

The dice pool produces results on two separate axes that are resolved independently:

**Axis 1 — Success/Failure:**
- Each Success symbol cancels one Failure symbol (1:1).
- After cancellation, net Success remaining = the task **succeeds**.
- Net Failure remaining (or zero net) = the task **fails**.

**Axis 2 — Advantage/Threat:**
- Each Advantage symbol cancels one Threat symbol (1:1).
- Net Advantage = positive side effects occur alongside the main result.
- Net Threat = negative side effects occur alongside the main result.

**Special symbols (cannot be cancelled):**
- **Triumph** = counts as one Success AND triggers a dramatic positive narrative effect. Triumph cannot be cancelled by Failure — it always provides its Success and its narrative bonus.
- **Despair** = counts as one Failure AND triggers a dramatic negative narrative effect. Despair cannot be cancelled by Success — it always provides its Failure and its narrative consequence.

This creates four common outcome types:
| Success? | Side Effects | Example |
|----------|-------------|---------|
| Success + Advantage | Best case — succeed and gain a bonus | Hack the terminal and discover bonus intel |
| Success + Threat | Succeed but suffer a complication | Pick the lock but the noise alerts a nearby guard |
| Failure + Advantage | Fail but gain a silver lining | Miss the shot but force the target into worse cover |
| Failure + Threat | Worst case — fail and suffer a complication | Fail the negotiation and offend the crime lord |

### Spending Advantage and Threat

**Advantage (spent by the player):**

| Cost | Effect |
|------|--------|
| 1 Advantage | Recover 1 strain |
| 1 Advantage | Notice a minor detail or environmental feature |
| 2 Advantage | Perform a bonus manoeuvre (move, draw weapon, take cover) |
| 2 Advantage | Grant an ally a Boost die on their next check |
| 3 Advantage | Inflict a Critical Injury (in combat, if attack also succeeded) |

**Threat (spent by the GM):**

| Cost | Effect |
|------|--------|
| 1 Threat | Suffer 1 strain |
| 1 Threat | A minor environmental complication arises |
| 2 Threat | Target gains a bonus manoeuvre on their next turn |
| 2 Threat | Add a Setback die to the character's next check |
| 3 Threat | A weapon runs out of ammunition or an item is damaged |

**Triumph:** In addition to its automatic Success, a Triumph can be spent on any Advantage effect regardless of cost, or on a unique dramatic positive (the GM offers a narrative boon — an ally arrives, a secret is revealed, an enemy's plan is disrupted).

**Despair:** In addition to its automatic Failure, a Despair triggers a dramatic negative chosen by the GM — a weapon breaks, an ally is compromised, the situation escalates dangerously. Despair effects should always change the narrative landscape, not merely inflict damage.

### Combat

**Initiative:** Roll Cool (Presence + Cool, for characters who were prepared) or Vigilance (Willpower + Vigilance, for characters caught off guard). Results generate initiative **slots**, not individual turn order — the side (PCs or NPCs) with the highest slot acts first, and any member of that side may fill the slot.

**Each turn:** 1 Action + 1 Manoeuvre. A character may take a second manoeuvre by suffering 2 strain.

| Type | Examples |
|------|----------|
| **Action** | Attack, use a skill, activate an ability, cast a Force power, first aid |
| **Manoeuvre** | Move one range band, take cover, draw/holster a weapon, aim (+1 Boost to next attack), stand up |

**Range bands** (abstract, not measured in metres):

| Band | Description |
|------|-------------|
| Engaged | Melee distance, in physical contact |
| Short | A few metres, a small room |
| Medium | Up to ~40 metres, across a hangar |
| Long | Up to ~100 metres, sniper range |
| Extreme | Beyond ~100 metres, extreme range penalties |

Moving one range band = 1 manoeuvre. Moving from Engaged to Short (or vice versa) = 1 manoeuvre. Moving two range bands in one turn requires 2 manoeuvres (costing 2 strain for the second).

**Attack resolution:** Assemble the dice pool (combat skill + characteristic vs difficulty set by range/defence), roll, and resolve on both axes. Net Success = hit; damage = weapon base damage + net Success beyond the first. Soak (Brawn + armour) reduces damage. Remaining damage reduces Wound Threshold. Reaching Wound Threshold = incapacitated.

### Skills (12, simplified)

| Category | Skills | Linked Characteristic |
|----------|--------|-----------------------|
| **Combat** | Ranged Combat, Melee Combat | Agility, Brawn |
| **Physical** | Athletics, Stealth | Brawn, Agility |
| **Knowledge** | Mechanics, Medicine, Computers | Intellect |
| **Exploration** | Piloting, Streetwise | Agility, Cunning |
| **Social** | Charm, Coercion, Deception | Presence, Willpower, Cunning |

Skills range 0–5. A character with 0 ranks in a skill may still attempt the check using only their characteristic (green Ability dice, no yellow upgrades).

### Character Creation

**Step 1 — Species** (provides starting characteristics, wound/strain threshold modifiers, and a species ability):

| Species | Starting Characteristics | Special |
|---------|------------------------|---------|
| Human | 2 in all, +1 to any two | 110 XP to spend; versatile |
| Twi'lek | 1 Brawn, 3 Cunning, 2 others | Remove 1 Setback from Charm/Deception; natural negotiators |
| Wookiee | 3 Brawn, 1 Cunning, 2 others | +4 Wound Threshold; Rage (bonus Brawl damage when wounded) |
| Rodian | 3 Agility, 1 Intellect, 2 others | Natural hunters; bonus rank in Survival |
| Droid | Varies by model | No strain (system strain instead); immune to poison/disease; social stigma |
| Bothan | 3 Cunning, 1 Brawn, 2 others | Convincing Demeanour (remove 1 Setback from Deception/Streetwise) |

**Step 2 — Career** (provides 8 career skills, of which the character begins with 4 free ranks distributed among them):

| Career | Career Skills Include | Archetype |
|--------|----------------------|-----------|
| Bounty Hunter | Ranged Combat, Stealth, Streetwise, Athletics | Tracker, enforcer, skip tracer |
| Colonist | Charm, Deception, Medicine, Streetwise | Doctor, politician, merchant |
| Explorer | Piloting, Survival, Athletics, Perception | Scout, trader, archaeologist |
| Hired Gun | Ranged Combat, Melee Combat, Athletics, Coercion | Mercenary, bodyguard, heavy |
| Smuggler | Piloting, Deception, Streetwise, Charm | Scoundrel, pilot, thief |
| Technician | Mechanics, Computers, Medicine, Piloting | Slicer, outlaw tech, droid specialist |

**Step 3 — Obligation** (starting narrative hook):

Each character begins with a starting Obligation that ties them to the setting and creates ongoing narrative tension:

| Obligation | Description |
|------------|-------------|
| Debt | Owes credits to a dangerous creditor — the Hutts, a crime syndicate, or a loan shark |
| Bounty | Wanted by someone — a guild, a rival, or an authority |
| Oath | Sworn to a cause, a person, or a code that demands action and sacrifice |
| Family | Responsible for family members who may be in danger or need support |
| Criminal | Past crimes that could surface — warrants, witnesses, evidence |
| Favour | Owes a significant favour to a powerful figure who will eventually collect |

**Obligation mechanic:** At the start of each session, roll d100. If the result falls within a PC's Obligation range, that Obligation triggers — it becomes a narrative complication woven into the session's events. Higher total Obligation = wider range = more likely to trigger. The GM narrates how the Obligation manifests: a bounty hunter appears, a creditor sends a threatening message, a family member goes missing.

**Step 4 — Spend XP:** Spend starting XP (determined by species) on increasing characteristics, purchasing skill ranks, or acquiring talents.

### Die Roll Adaptation

When adapting the dice UI for SWRPG narrative dice, use a click-to-roll pool presentation
with the following reveal details:
- **Declare:** Assembled dice pool as coloured dice icons (green, yellow, purple, red, blue, black). Skill, characteristic, difficulty, and Boost/Setback sources displayed.
- **Resolve:** Cancel Success vs Failure, then Advantage vs Threat. Display net results on both axes. Triumph and Despair shown separately (cannot be cancelled). Badge: TRIUMPH / SUCCESS + ADVANTAGE / SUCCESS + THREAT / FAILURE + ADVANTAGE / FAILURE + THREAT / DESPAIR. Contextual spending options for net Advantage or Threat.

---

## System Integration Notes

When a non-default system is selected, the following modules adapt their behaviour:

### Die-Rolls Module

| Active System | Resolution Display |
|---------------|-------------------|
| d20 System | d20 + modifier vs DC (standard click-to-roll single-die flow) |
| D&D 5e | d20 + ability mod + proficiency vs DC/AC (click-to-roll, advantage/disadvantage shows 2d20) |
| GURPS Lite | 3d6 roll-under vs effective skill (click-to-roll, target shown before roll) |
| Pathfinder 2e Lite | d20 + modifier + proficiency vs DC (click-to-roll, crit range ±10) |
| Shadowrun 5e Lite | Xd6 dice pool, count hits vs threshold (click-to-roll pool, colour-coded dice) |
| Narrative Engine | No dice widgets — pure prose resolution via Momentum track |
| SWRPG Narrative Dice | Narrative dice pool with colour-coded symbol dice (click-to-roll pool, dual-axis resolution) |

### Combat Widget

| Active System | Action Economy |
|---------------|---------------|
| d20 System | 1 action per turn (Attack / Skill / Item / Retreat) |
| D&D 5e | 1 Action + 1 Bonus Action + 1 Movement + 1 Free Object Interaction |
| GURPS Lite | 1 action per turn (Attack / Defend / Move / Use Item) |
| Pathfinder 2e Lite | 3 actions per turn (shown as action pips ●●●) |
| Shadowrun 5e Lite | 1 Free + 1 Simple + 1 Complex (or 1 Free + 2 Simple) |
| Narrative Engine | No structured turns — narrative flow with Momentum consequences |
| SWRPG Narrative Dice | 1 Action + 1 Manoeuvre (second manoeuvre costs 2 strain) |

### Character Creation

| Active System | Chargen Flow |
|---------------|-------------|
| d20 System | Archetype selection → stat reveal → proficiency pick → confirm |
| D&D 5e | Race → class → background → ability scores (standard array) → equipment → confirm |
| GURPS Lite | Point-buy characteristics → advantages/disadvantages → skills → confirm |
| Pathfinder 2e Lite | Ancestry → background → class → ability scores → confirm |
| Shadowrun 5e Lite | Priority assignment → metatype → attributes → skills → gear → confirm |
| Narrative Engine | Concept → strengths → flaws → bond → confirm |
| SWRPG Narrative Dice | Species → career → Obligation → spend XP on characteristics/skills → confirm |

### Bestiary

Stat blocks from `bestiary.md` adapt to the active system. The GM reskins each template with
system-appropriate statistics:

| System | Stat Block Contains |
|--------|-------------------|
| d20 System | HP, AC, Attack bonus, Damage, Defence rating |
| D&D 5e | HP, AC, Ability Scores, Saving Throws, Skills, Attacks, Damage, CR, Traits |
| GURPS Lite | ST, DX, IQ, HT, HP, DR, Skills, Damage |
| Pathfinder 2e Lite | HP, AC, Saves (Fort/Ref/Will), Attacks, Abilities, Level |
| Shadowrun 5e Lite | Body, Agility, Reaction, Strength, Armour, Weapons, Initiative |
| Narrative Engine | Threat description (narrative), Momentum cost to overcome |
| SWRPG Narrative Dice | Characteristics, Wound/Strain Thresholds, Soak, Defence, Skills, Weapons, Abilities |

### Conditions

Core conditions (Stunned, Poisoned, Frightened, Injured, Exhausted) map to system equivalents
where they exist:

| Core Condition | D&D 5e Equivalent | GURPS Equivalent | PF2e Equivalent | Shadowrun Equivalent | Narrative Engine | SWRPG Narrative Dice |
|----------------|-------------------|------------------|-----------------|---------------------|------------------|----------------------|
| Stunned | Stunned (lose action + bonus action, auto-fail STR/DEX saves) | Stunned (skip turn) | Stunned (lose actions) | Stun damage overflow | Narratively dazed (Neutral → Flaw) | Staggered (upgrade difficulty once) |
| Poisoned | Poisoned (disadvantage on attacks + ability checks) | Poisoned (HT roll/round) | Sickened (−1 to all checks) | Toxin (Body resistance/round) | "Poisoned" flaw trigger | Poisoned (suffer wound per round, Resilience check to resist) |
| Frightened | Frightened (disadvantage on checks/attacks while source visible, cannot move closer) | Fright Check failed | Frightened (−1 to checks, fleeing) | Composure failure | Momentum −2 | Fear (upgrade difficulty of all checks once, cannot move towards source) |
| Injured | Wounded (death saves at 0 HP) | Wounded (−1 per wound) | Wounded (worse dying) | Physical damage boxes | "Badly hurt" tier | Critical Injury (roll on severity table, lasting narrative effect) |
| Exhausted | Exhaustion levels 1–6 (cumulative penalties, death at 6) | Fatigue loss (FP drain) | Fatigued (−1, no exploration) | Stun damage boxes | "Hurt" tier | Strain threshold exceeded (incapacitated, excess becomes wounds) |

---

## gmState Additions

When this module is active, the following fields are added or modified in `gmState`:

<!-- CLI implementation detail — do not hand-code -->
```js
gmState.settings.rulebook = 'd20_system'; // or 'dnd_5e', 'gurps_lite', 'pf2e_lite', 'shadowrun_lite', 'narrative_engine', 'swrpg_narrative'

// D&D 5e additions
gmState.character.dnd5e = {
  race: '',              // 'Human', 'Elf', 'Dwarf', 'Halfling', 'Half-Orc', 'Gnome', 'Tiefling'
  class: '',             // 'Fighter', 'Rogue', 'Wizard', 'Cleric', etc.
  background: '',        // 'Acolyte', 'Criminal', 'Folk Hero', etc.
  abilityScores: {},     // { strength: 15, dexterity: 14, ... }
  abilityModifiers: {},  // { strength: 2, dexterity: 2, ... } — derived from scores
  proficiencyBonus: 2,   // +2 at levels 1–4, +3 at 5–8, +4 at 9–12
  skillProficiencies: [],// e.g. ['Athletics', 'Perception', 'Stealth']
  saveProficiencies: [], // e.g. ['STR', 'CON'] — from class
  ac: 10,               // calculated from armour + DEX
  maxHP: 0,             // max hit die + CON mod at level 1
  currentHP: 0,         // current hit points
  hitDice: '',          // e.g. 'd10' — from class
  hitDiceRemaining: 1,  // number of unspent Hit Dice
  spellSlots: {},       // e.g. { 1: { max: 2, remaining: 2 }, 2: { max: 0, remaining: 0 } }
  spellcastingAbility: '',// 'INT', 'WIS', or 'CHA' — from class (null if non-caster)
  conditions: [],       // active 5e conditions: 'frightened', 'poisoned', etc.
  deathSaves: { successes: 0, failures: 0 }, // tracked at 0 HP
};

// GURPS Lite additions
gmState.character.gurps = {
  advantages: [],       // e.g. ['Combat Reflexes', 'Luck']
  disadvantages: [],    // e.g. ['Curious', 'Debt']
  skills: {},           // e.g. { Stealth: 12, Shooting: 14 }
  fatigue: 0,           // current FP loss
  maxFatigue: 10,       // = HT
};

// PF2e Lite additions
gmState.character.pf2e = {
  ancestry: '',         // 'Human', 'Elf', 'Dwarf', etc.
  background: '',       // 'Acolyte', 'Street Urchin', etc.
  class: '',            // 'Fighter', 'Rogue', 'Wizard', etc.
  proficiencies: {},    // { Athletics: 'trained', Stealth: 'expert', ... }
  saves: {},            // { fortitude: 'trained', reflex: 'expert', will: 'trained' }
  actionsRemaining: 3,  // resets each turn
};

// Shadowrun Lite additions
gmState.character.shadowrun = {
  metatype: '',         // 'Human', 'Elf', 'Dwarf', 'Ork', 'Troll'
  edge: 0,             // current Edge points
  maxEdge: 0,          // maximum Edge pool
  physicalTrack: 0,    // current physical damage
  stunTrack: 0,        // current stun damage
  nuyen: 0,            // currency (¥)
  overwatchScore: 0,   // Matrix overwatch accumulator
  magic: null,         // { tradition, spells: [] } or null if mundane
};

// Narrative Engine additions
gmState.character.narrative = {
  concept: '',          // one-sentence character concept
  strengths: [],        // 3 narrative strengths
  flaws: [],            // 2 narrative flaws
  bond: '',             // 1 relationship bond
  momentum: 5,          // 0–10 momentum track
  harmTier: 0,          // 0 = fine, 1 = hurt, 2 = badly hurt, 3 = incapacitated
};

// SWRPG Narrative Dice additions
gmState.character.swrpg = {
  species: '',            // 'Human', 'Twi\'lek', 'Wookiee', 'Rodian', 'Droid', 'Bothan'
  career: '',             // 'Bounty Hunter', 'Colonist', 'Explorer', etc.
  characteristics: {},    // { brawn: 2, agility: 3, intellect: 2, cunning: 2, willpower: 2, presence: 2 }
  skills: {},             // e.g. { rangedCombat: 2, stealth: 1, charm: 0 }
  woundThreshold: 0,      // 10 + Brawn (modified by species)
  currentWounds: 0,       // current wound damage taken
  strainThreshold: 0,     // 10 + Willpower (modified by species)
  currentStrain: 0,       // current strain taken
  soak: 0,                // Brawn + armour value
  defence: { ranged: 0, melee: 0 }, // from armour and cover
  obligation: {           // Obligation mechanic
    type: '',             // 'Debt', 'Bounty', 'Oath', etc.
    value: 10,            // Obligation magnitude (affects trigger range)
    triggered: false,     // whether Obligation is active this session
  },
  criticalInjuries: [],   // active Critical Injury results
  xpTotal: 0,            // total XP earned
  xpAvailable: 0,        // unspent XP
};
```

Only the fields for the active system are populated. The others remain `undefined`.

---

## Anti-Patterns

- **Never mix mechanics from two systems in the same session.** If GURPS is active, never
  roll a d20 for resolution. If Narrative Engine is active, never generate a dice widget.
- **Never force dice widgets when Narrative Engine is active.** Use pure prose. The Momentum
  track is the only mechanical element — and even that should feel invisible.
- **Never convert stats between systems mid-session.** Pick one system at setup and commit.
  If the player wants to switch, it requires a new session or a fresh character.
- **Never assume d20 resolution when a different system is active.** Always check
  `gmState.settings.rulebook` before generating any dice widget or resolution mechanic.
- **Never present system-specific jargon to the player without context.** "Roll under your
  effective skill" is meaningless to a player unfamiliar with GURPS — frame it as "Roll 3d6
  and try to get under [number]."
- **Never allow the Shadowrun Overwatch Score to be ignored.** Every Matrix action must
  increment it. At 40, GOD acts — no exceptions, no GM fiat.
- **Never skip the priority assignment in Shadowrun chargen.** The priority system is
  fundamental to character balance — do not allow free-form attribute assignment.
- **Never let PF2e characters exceed 3 actions per turn.** The action economy is the core
  tactical constraint — haste effects grant at most 1 extra action with restrictions.
- **Never kill a Narrative Engine character without player consent.** Death is a narrative
  choice in this system, not a mechanical outcome.
