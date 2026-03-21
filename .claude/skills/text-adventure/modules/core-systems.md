# Core Systems — Inventory, Economy, Factions, Quests, Time, and Session Recap
> Module for text-adventure orchestrator. Always loaded — these are fundamental gameplay systems.

These systems are core to every text adventure regardless of theme or setting. They govern
what the player carries, what things cost, who trusts them, what they are trying to achieve,
and when things happen.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: all other modules.

---

## CRITICAL — Arc Transition Rules

When the player transitions to a new arc (via the "Continue to next arc" button at
adventure conclusion), the following state changes apply. These rules are mandatory.

### Carries Forward (persistent across arcs)

- **Character identity:** name, class
- **Character progression:** level, XP, stats (STR/DEX/CON/INT/WIS/CHA), proficiencies, abilities
- **Character reputation:** narrative summary carried as world context
- **Faction standings:** numeric values (-100 to +100) for each faction
- **NPC dispositions:** alive/dead status, disposition state, trust score (0-100)
- **Codex discoveries:** all lore entries the character has uncovered
- **World consequences:** 3-5 major choice outcomes that shape the new arc's starting conditions

### Resets (fresh start each arc)

- **Inventory:** cleared — replaced with level-appropriate starting gear (see table below)
- **HP:** restored to maxHp
- **Active conditions:** cleared (no carried-over poison, curses, etc.)
- **Scene position:** reset to scene 1, current room cleared
- **Visited rooms:** cleared
- **Active quests:** cleared — new arc generates new objectives
- **Roll history:** cleared
- **Time:** reset to arc start

### Starting Gear by Level (new arc equipment)

When a character transitions to a new arc, they receive gear appropriate to their
current level. The GM may theme the gear to match the new arc's setting.

| Level | Weapon | Armour | Consumables | Credits |
|-------|--------|--------|-------------|---------|
| 1-2 | Tier 1 (1d6 damage) | Light (AC +1) | 1 stim pack | 100 |
| 3-4 | Tier 2 (1d8 damage) | Light (AC +1) | 2 stim packs, 1 med kit | 200 |
| 5-6 | Tier 2 (1d8+1 damage) | Medium (AC +2) | 2 stim packs, 1 med kit | 350 |
| 7-8 | Tier 3 (1d10 damage) | Medium (AC +2) | 3 stim packs, 2 med kits | 500 |
| 9-10 | Tier 3 (1d10+2 damage) | Heavy (AC +3) | 3 stim packs, 2 med kits, 1 rare item | 750 |

The weapon and armour tiers adapt to the setting — a Tier 2 weapon is a "plasma pistol"
in a space arc, a "fine longsword" in fantasy, or a "combat shotgun" in post-apocalyptic.

---

## Inventory System

Inventory has limited capacity: **8 slots** by default, expandable via bags or equipment.
Each item occupies 1 slot regardless of size. **Key items** (quest-critical) do not consume
slots — they are tracked separately and cannot be dropped or sold.

- **Consumables:** Have a `uses` count. Depleted on use. Using an item requires
  `sendPrompt('I use [item].')` — never auto-consume.
- **Equipment:** Permanent until broken, traded, or dropped. Weapons and armour provide
  mechanical bonuses shown only in the character panel.
- **Combining items:** When the player attempts to combine two items, require a relevant
  skill check (INT, or a craft proficiency). Success produces the combined item; failure
  may consume one or both components.
- **Encumbrance:** If inventory exceeds capacity, the player must choose what to drop before
  any action. Present a widget with the full inventory and "Drop" buttons.

The character panel shows: item name, type badge (weapon/armour/consumable/key/misc),
remaining uses (if consumable), and a "Use" or "Drop" button.

---

## Inventory Management

### Capacity

Each character can carry items with total encumbrance up to **5 + STR modifier**. Exceeding
capacity imposes **−1 to AGI checks per point over the limit**. The GM enforces this on every
AGI-based roll — no silent ignoring of overencumbrance.

### Item Slots

| Slot | Limit | Notes |
|------|-------|-------|
| Weapon | 1 equipped, others stowed | Switching equipped weapon costs a manoeuvre in combat |
| Armour | 1 equipped | Changing armour outside combat only |
| Consumables | Up to 5 stacked per type | Stim packs, grenades, antidotes, rations |
| Gear | Up to 8 miscellaneous items | Tools, data pads, rope, grappling hooks |
| Credits | Unlimited | No encumbrance — currency is weightless |

### Encumbrance Values

| Category | Examples | Encumbrance |
|----------|----------|-------------|
| Light | Stim packs, data pads, small tools | 0 |
| Standard | Blaster pistol, med kit, rations | 1 |
| Heavy | Rifles, armour, toolkits | 2 |
| Very heavy | Heavy weapons, powered armour | 3 |

Key items (quest-critical) have zero encumbrance and do not occupy slots.

### Item Interaction

| Action | Outside Combat | During Combat |
|--------|----------------|---------------|
| Equip / unequip | Free action | Manoeuvre (costs movement, not main action) |
| Use consumable | Free action | Action (uses the character's turn) |
| Drop item | Free action (item lost unless retrieved) | Free action |
| Trade with crew / NPC | Requires dialogue interaction | Not permitted mid-combat |

### Inventory Display in Character Panel

- **Equipped items** highlighted at the top of the inventory list (weapon and armour).
- **Stowed items** listed below, each showing its encumbrance value.
- **Current / max encumbrance** rendered as a bar (e.g., `[████░░░] 4/7`).
- **Quick-use buttons** for consumables — each fires `sendPrompt('I use [item].')`.
- Items at or over capacity are flagged with an amber warning indicator.

---

## Economy and Currency

Starting credits: **100 per player** at character creation. The currency name adapts to the
setting (credits, gold, caps, denarii, etc.) — set in `gmState.character.currencyName`.

### Credit Rewards by Encounter

| Encounter Type | Credit Reward |
|----------------|---------------|
| Minor (simple puzzle, minor NPC favour) | 10–50 |
| Standard (combat encounter, quest step) | 50–100 |
| Major (boss fight, quest completion, significant discovery) | 100–250 |

### Credit Sources

- **Loot:** Defeated enemies drop items and currency. The GM determines amounts based on
  enemy tier and narrative context.
- **Quest rewards:** NPCs offer payment for completing objectives. Reward stated up front
  or discovered on completion.
- **Selling items:** Via merchant widgets. Sell price = base x 0.5 (default), up to base x 0.75
  with a successful CHA barter check.
- **Jobs and services:** The player may take on work — guard duty, courier runs, repairs —
  for payment. Payment scales with risk and time invested.
- **Gambling and trade:** High-risk, high-reward. Resolved via skill checks (WIS for reading
  opponents, CHA for bluffing, INT for calculating odds).

---

## Economy and Trading

Track currency in `gmState.character.currency` using a setting-appropriate name (credits,
gold, caps, denarii, etc.). The GM chooses the currency name at scenario creation.

- **Earning currency:** Quest rewards, looting, trading, work, gambling.
- **Spending currency:** Repairs (station), supplies, equipment, information, bribes, passage.
- **Shops:** Presented as NPC interactions. Show available goods with prices in a widget.
  Bartering uses a CHA check: success = discount, failure = markup, critical success = bonus
  item or significant discount, critical failure = offended shopkeeper (refused service).
- **Loot value:** Items have a `value` field. Selling to shops yields 50–75% of value.
  Buying costs 100–150% depending on faction standing and location scarcity.

---

## Faction Reputation

Track faction standing in `gmState.factions`: an object mapping faction IDs to reputation
scores (−100 to +100). Actions that help a faction increase standing; actions against it
decrease standing. Opposing factions may have linked reputation (helping one harms the other).

| Standing | Range | Effect |
|----------|-------|--------|
| Hostile | −100 to −50 | Attack on sight, no trading, restricted zones locked |
| Unfriendly | −49 to −10 | Higher prices (+50%), guarded NPCs, limited access |
| Neutral | −9 to +9 | Standard prices, standard access |
| Friendly | +10 to +49 | Lower prices (−20%), bonus intel, restricted access granted |
| Allied | +50 to +100 | Best prices (−40%), faction missions, safe houses, combat backup |

NPC initial disposition is influenced by faction standing — a friendly faction member starts
at higher trust. Faction changes are narrated in outcomes, never stated as numbers in prose.

---

## Quest and Objective Tracking

The GM maintains a quest log in `gmState.quests`. Each quest has:
- `id`, `title`, `status` (active / completed / failed), `description`
- `objectives` — sub-goals with completion state
- `clues` — information gathered relevant to this quest

The quest panel is toggled via the footer (pure JS, `togglePanel('quests')`). It shows:
- **Active quests** with objectives and progress
- **Recently completed/failed** quests (last 3)
- **Key clues** and leads

Quests are never auto-completed. The GM marks objectives done based on player actions.
Side quests can be discovered through exploration, NPC dialogue, or codex entries.

### Footer button

```html
<button class="footer-btn" onclick="togglePanel('quests')">Quests</button>
```

---

## Time and Calendar

Track time in `gmState.time`. Format adapts to the setting's technology level:

**Pre-clock settings** (ancient, medieval, post-apocalyptic): Time expressed as periods —
early dawn, dawn, morning, midday, afternoon, dusk, evening, night, late night, small hours.
No precise times unless the character possesses a sundial, hourglass, or equivalent device.

**Clock settings** (modern, sci-fi): Time as hours, with precision appropriate to the setting.

**Calendar:** Track the actual date using the setting's calendar system (Roman, Gregorian,
stardate, etc.). If the character would not know the date, track elapsed days instead.
Display date and time period in the scene widget location bar alongside location name.

Time advances through player actions: travel consumes hours/days (see geo-map), resting
advances to the next period, specific actions consume defined amounts. The GM narrates
time passing — "The light has shifted. It is well past midday now."

Never state time mechanically in prose — "it is dusk" not "it is 18:00" in a pre-clock setting.

**Time pressure:** Some scenarios involve deadlines. Track these in `gmState.time.deadline`.
The scene widget can show a deadline indicator. As the deadline approaches, the GM increases
tension in narration — but never displays a countdown timer. The player feels urgency through
the world's reactions, not through a clock on screen.

---

## Session Recap ("Previously On...")

When resuming from a save, present a **recap widget** before the first scene:
- 2–3 sentence summary of the last session's key events (reconstructed from world flags,
  quest status, and recent roll history — not from memory).
- Active quest status with current objectives.
- Character snapshot: HP, key items, active conditions, currency.
- Where the player left off: location name, time period, scene number.
- A "Continue" button to resume play.

The recap is purely informational — it does not require player decisions. It answers:
"Where was I? What was I doing? What do I have?"

---

## gmState Fields

These systems add the following fields to `gmState`:

```js
// Character additions
character: {
  // ...existing fields...
  currency: 0,
  currencyName: 'credits',  // setting-appropriate: 'gold', 'denarii', 'caps', etc.
},

// Core system state
quests: [
  { id: 'main', title: 'Escape the Station', status: 'active',
    description: 'Find a way off the station before the lockdown.',
    objectives: [
      { text: 'Find a ship', done: false },
      { text: 'Acquire launch codes', done: false },
    ],
    clues: ['A freighter is docked at Landing Bay Three.'],
  },
],

factions: {
  station_authority: -30,  // unfriendly
  merchant_guild: 5,       // neutral
  local_militia: 0,        // neutral
},

time: {
  period: 'morning',      // dawn/morning/midday/afternoon/dusk/evening/night/late night
  day: 1,
  date: null,             // setting-appropriate date string, if known
  calendar: null,         // calendar system name
  clockAvailable: false,  // does the character have access to precise time?
  deadline: null,         // { description, remainingDays } or null
},
```

---

## XP and Levelling

### XP Awards

| Action | XP |
|--------|----|
| Scene with meaningful decision | 25 |
| Combat victory | 50 |
| Secret/hidden area discovered | 30 |
| NPC interaction resolved favourably | 20 |
| Critical success bonus | 10 |
| Quest thread completed | 100 |
| Near-death survival | 40 |

### Level Thresholds

| Level | XP | HP | Improvement |
|-------|-----|-----|-------------|
| 1 | 0 | — | Starting stats |
| 2 | 100 | +3 | +1 attribute |
| 3 | 250 | +3 | New proficiency |
| 4 | 500 | +4 | +1 attribute |
| 5 | 800 | +4 | +1 attribute, new ability |
| 6 | 1200 | +5 | New proficiency |
| 7 | 1700 | +5 | +1 attribute |
| 8 | 2300 | +6 | +1 attribute, new ability |

### Level-Up Widget

When XP threshold is reached, present a level-up widget:
- Congratulations banner with new level number.
- HP increase applied automatically.
- Stat improvement: player chooses which attribute to increase (+1).
- New abilities (levels 5, 8): present 2–3 options for player to choose.
- Confirm button: `sendPrompt('Level up confirmed. Continue.')`.

The status bar in scene widgets includes an XP progress bar showing current XP / next threshold.

---

## Healing

Healing restores HP but is deliberately limited to maintain tension.

- **Stim pack:** Restores 2d6 HP. Usable in or out of combat. **Limit 1 per encounter** —
  after use, further stims have no effect until the encounter ends.
- **Med kit:** Restores 4d6 HP. Requires an INT check (DC 12) to apply correctly; failure
  restores only half (round down). **Usable outside combat only** — proper medical care
  takes time.
- **Rest at safe location:** Full HP restore. Requires narrative downtime at a safe location
  (camp, settlement, ship quarters). The GM advances time by one period (e.g. evening to
  night). Also removes the Exhausted condition.
- **Medic archetype bonus:** Characters with the Medic archetype add +2 to all healing rolls
  (both stim packs and med kits). This applies to healing themselves or others.
- **Sourcing healing items:** Found via exploration (loot crates, abandoned med bays),
  purchased at shops (setting-appropriate prices), or rewarded by NPCs for completing tasks.

Never auto-heal the player. Healing always requires a deliberate player action via
`sendPrompt('I use [item].')` or choosing to rest.

---

## Abilities

Each archetype gains abilities as they level. Abilities are narrative-focused — they should
feel impactful without requiring complex bookkeeping.

- **Level 1:** 1 starting ability (automatically granted).
- **Level 5:** Choose 1 of 2 new abilities.
- **Level 8:** Choose 1 of 2 advanced abilities.

Abilities are used via the SKILL action in combat or through narrative actions outside combat.
Unless stated otherwise, each ability can be used **once per encounter**.

### Warrior

| Level | Ability | Effect |
|-------|---------|--------|
| 1 | Shield Wall | Reduce incoming damage by 3 for 2 rounds. |
| 5a | Cleave | Attack hits all adjacent enemies for weapon damage. |
| 5b | War Cry | All enemies must pass a WIS check (DC 13) or gain Frightened for 1 round. |
| 8a | Last Stand | When below 25% HP, gain +4 to attack rolls for 3 rounds. Once per rest. |
| 8b | Fortify | Grant self and one ally +2 armour for the rest of the encounter. |

### Rogue

| Level | Ability | Effect |
|-------|---------|--------|
| 1 | Sneak Attack | Deal double damage if attacking from stealth or before the target has acted. |
| 5a | Smoke Bomb | Create cover; all enemies have disadvantage on attacks for 1 round. |
| 5b | Exploit Weakness | Next attack ignores enemy armour entirely. |
| 8a | Shadow Step | Teleport behind any enemy; guaranteed hit on next attack. Once per rest. |
| 8b | Venomous Strike | Attack applies Poisoned condition on hit (no save). |

### Scholar

| Level | Ability | Effect |
|-------|---------|--------|
| 1 | Analyse | Reveal one enemy's Defence, armour, and HP. Free action. |
| 5a | Overload | Disable one enemy's special ability for 2 rounds (INT check DC 13). |
| 5b | Tactical Insight | One ally gains advantage on their next roll. |
| 8a | Exploit Flaw | Deal triple damage to an Analysed enemy. Once per rest. |
| 8b | Countermeasure | Negate one enemy ability or attack entirely. Once per rest. |

### Medic

| Level | Ability | Effect |
|-------|---------|--------|
| 1 | Field Triage | Heal an ally for 1d6+2 HP as a bonus action (does not consume turn). |
| 5a | Purify | Remove one condition (Poisoned, Injured, or Frightened) from self or ally. |
| 5b | Adrenaline Shot | Target ally gains an extra action this round. |
| 8a | Emergency Revival | Stabilise an incapacitated ally and restore them to 1d6 HP. Once per rest. |
| 8b | Painkiller | Target ignores all negative conditions for 3 rounds. |

### Engineer

| Level | Ability | Effect |
|-------|---------|--------|
| 1 | Deploy Turret | Place an automated turret that deals 1d6 damage to a random enemy each round for 3 rounds. |
| 5a | EMP Blast | Stun all mechanical/electronic enemies for 1 round. |
| 5b | Reinforce Armour | Increase own or ally's armour by 2 for the encounter. |
| 8a | Overcharge Weapon | Next attack deals triple damage but destroys the weapon. |
| 8b | Drone Swarm | Deal 2d6 damage to all enemies for 2 rounds. Once per rest. |

### Diplomat

| Level | Ability | Effect |
|-------|---------|--------|
| 1 | Parley | Attempt to end combat peacefully (CHA check, DC varies by enemy disposition). |
| 5a | Inspire | All allies gain +2 to all checks for 2 rounds. |
| 5b | Demoralise | One enemy has disadvantage on all actions for 2 rounds (CHA vs WIS). |
| 8a | Turn Foe | Convince one non-boss enemy to switch sides for the encounter (CHA DC 16). |
| 8b | Rally | All allies regain 2d6 HP and lose the Frightened condition. Once per rest. |

---

## Conditions and Status Effects

Conditions modify a character's capabilities. Track active conditions in
`gmState.character.conditions` as objects: `{ name, remainingRounds, source }`.
Display active conditions as badges in the status bar.

| Condition | Effect | Duration | Cure |
|-----------|--------|----------|------|
| Stunned | Skip next action entirely. | 1 round | Automatic (wears off). |
| Poisoned | Lose 1d4 HP at the start of each round. | 3 rounds or until cured | INT check (DC 14) as an action, or antidote item. |
| Frightened | Disadvantage on all checks whilst the source is present. | Until source removed | Remove or defeat the source; Medic's Purify; Diplomat's Rally. |
| Injured | −2 to all physical checks (STR, DEX, CON/AGI). | Until healed | Healing (any source) or rest at a safe location. |
| Exhausted | −1 to all checks. Cumulative (stacks). | Until rested | Rest at a safe location removes all stacks. |

**Applying conditions:** Conditions are applied by enemy attacks, environmental hazards,
failed checks, or ability effects. The GM narrates the condition onset — "Your vision
blurs and your limbs feel heavy" not "You are now Poisoned."

**Stacking:** Conditions do not stack with themselves except Exhausted. Reapplying a
non-stackable condition resets its duration.

**Display:** Show conditions as compact badges in the status bar:
`<span class="condition-badge condition-[name]">[Name] ([rounds] left)</span>`.
Permanent conditions (Injured, Exhausted) show no round count.

---

## Environmental Hazards

Hazardous environments impose checks and consequences on all characters (players, NPCs,
and enemies alike). The GM determines which hazards are active in a given area and applies
them consistently.

### Hazard Types and Effects

| Hazard | Check | DC | Failure Effect | Duration |
|--------|-------|-----|----------------|----------|
| Extreme cold | STR | 12 | 1d4 damage per round exposed; Exhausted after 3 rounds | Until shelter/heat source |
| Extreme heat | STR | 12 | 1d4 damage per round; Exhausted after 3 rounds | Until shade/cooling |
| Toxic atmosphere | STR | 14 | Poisoned condition; 1d6 damage per round without mask | Until clean air/mask |
| Vacuum/decompression | STR | 16 | 2d6 damage per round; unconscious after 2 rounds | Until pressurised |
| Radiation | INT | 14 | 1d4 damage per round; Injured condition after 3 rounds | Until shielded area |
| Low gravity | AGI | 10 | Disadvantage on physical checks until acclimatised (3 rounds) | Ongoing |
| High gravity | STR | 12 | −1 to all physical checks; encumbrance capacity halved | Ongoing |
| Darkness | INT | 10 | Disadvantage on Perception; cannot target beyond short range | Until light source |
| Unstable terrain | AGI | 12 | Fall prone; 1d6 damage on critical failure | Per movement |
| Electrical hazard | AGI | 14 | 2d6 damage; Stunned on failure | One-time per source |

### Hazard Rules

- Environmental checks occur once when entering a hazardous area, then once per round if
  the hazard is ongoing.
- Appropriate gear negates or reduces hazards (e.g., enviro-suit negates toxic atmosphere,
  mag-boots negate low gravity).
- Engineer archetype gets +2 to checks for hazards that can be mitigated by equipment.
- Multiple hazards stack — each is checked separately.
- Hazards affect NPCs and enemies too (can be used tactically).

---

## Skills and Proficiencies

Characters have proficiency in specific skills that represent trained expertise. Proficiency
adds a bonus to checks using that skill, reflecting competence beyond raw attribute ability.

### Skill List (12 skills, mapped to attributes)

| Attribute | Skills |
|-----------|--------|
| STR | Athletics, Intimidation |
| AGI | Acrobatics, Stealth, Sleight of Hand |
| INT | Investigation, Medicine, Mechanics |
| CHA | Persuasion, Deception, Insight, Performance |

### Proficiency Bonus

The proficiency bonus scales with character level:

| Level | Proficiency Bonus |
|-------|-------------------|
| 1–4 | +2 |
| 5–8 | +3 |
| 9–10 | +4 |

### Skill Check Formula

**Proficient:** d20 + stat modifier + proficiency bonus
**Unproficient:** d20 + stat modifier only

The roll breakdown widget must show the proficiency bonus as a separate line item when
applicable (see `die-rolls.md` for display format).

### Archetype Starting Proficiencies

Each archetype grants 2 fixed proficiencies and the player chooses 2 more from any skill.

| Archetype | Fixed Proficiencies | Plus choose 2 from |
|-----------|--------------------|--------------------|
| Warrior | Athletics, Intimidation | Any |
| Rogue | Stealth, Sleight of Hand | Any |
| Scholar | Investigation, Medicine | Any |
| Medic | Medicine, Insight | Any |
| Engineer | Mechanics, Investigation | Any |
| Diplomat | Persuasion, Insight | Any |

### Gaining Proficiencies

Characters gain additional proficiencies at levels 3 and 6 (see Level Thresholds above).
When a new proficiency is gained, present the available unproficient skills and let the
player choose.

### gmState Fields

```js
character: {
  // ...existing fields...
  proficiencies: [],        // list of proficient skill names, e.g. ['Athletics', 'Stealth', 'Insight', 'Persuasion']
  proficiencyBonus: 2,      // derived from level: +2 at 1–4, +3 at 5–8, +4 at 9–10
},
```

---

## Anti-Patterns

- Never auto-consume inventory items — the player must choose to use them.
- Never let the player exceed inventory capacity without forcing a drop decision.
- Never state faction reputation as numbers in narrative — "the guards recognise you
  as a friend" not "your faction standing is +35".
- Never auto-complete quests — the GM marks objectives based on player actions.
- Never display precise clock times in pre-clock settings.
- Never show countdown timers for deadlines — tension is narrative, not numerical.
- Never skip the session recap when resuming from a save.
