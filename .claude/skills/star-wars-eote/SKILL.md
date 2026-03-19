---
name: star-wars-eote
description: >
  Use this skill whenever the user wants to play a Star Wars: Edge of the Empire text adventure
  game using the narrative dice pool system. Triggers include: "Star Wars RPG", "Edge of the Empire",
  "EotE", "Star Wars text adventure", "play a Star Wars game", "narrative dice", "Escape from Mos
  Shuuta", "Long Arm of the Hutt", or any request to play a Star Wars roleplaying game using the
  FFG/Asmodee system. This skill provides the complete EotE rules adapted for solo text adventure
  play (1-5 players). It works alongside the text-adventure skill for shared widget patterns,
  progressive reveal, and visual design. Do NOT use for D&D-style Star Wars games — this is
  specifically the narrative dice pool system.
---

# Star Wars: Edge of the Empire — Text Adventure Engine

This skill runs Star Wars text adventures using the EotE narrative dice pool system via
`visualize:show_widget`. It inherits widget patterns, progressive reveal, panel system, and
the Master Storyteller output style from the `text-adventure` skill.

**Before rendering widgets, read the `text-adventure` skill's `reference.md` for shared
widget patterns (panel CSS, scene skeleton, progressive reveal).** Also read adventure
module files from `modules/` for the chosen adventure.

**Use the `frontend-design` skill if available** to elevate widget visual quality.

---

## Core Rules — Inherited from text-adventure

The following rules from the `text-adventure` skill apply fully:
- All output in widgets (`visualize:show_widget`). No prose outside widgets.
- Progressive reveal pattern (brief text → continue → full scene).
- Never advance the story without player input.
- Never editorially guide the player.
- Never reference stat names/values in narrative prose.
- British English throughout.
- `data-prompt` + `addEventListener` pattern for all sendPrompt buttons. No contractions.
- Follow the **Master Storyteller** output style for narrative craft.

---

## The Narrative Dice System

### Dice Types

| Die | Colour | Sides | Positive | Negative |
|-----|--------|-------|----------|----------|
| Ability | Green | 8 | Success, Advantage | — |
| Proficiency | Yellow | 12 | Success, Advantage, Triumph | — |
| Boost | Blue | 6 | Success, Advantage | — |
| Difficulty | Purple | 8 | — | Failure, Threat |
| Challenge | Red | 12 | — | Failure, Threat, Despair |
| Setback | Black | 6 | — | Failure, Threat |

### Building a Dice Pool

1. Determine the relevant **characteristic** and **skill**.
2. Start with green Ability dice = HIGHER of characteristic rank or skill rank.
3. Upgrade green → yellow Proficiency dice = LOWER of the two values.
4. GM adds purple Difficulty dice based on task difficulty.
5. Add blue Boost for situational advantages. Add black Setback for hindrances.

### Difficulty Levels

| Difficulty | Purple dice | Example |
|------------|------------|---------|
| Simple | 0 | Routine, trivial |
| Easy | 1 | Basic task, minor risk |
| Average | 2 | Standard task requiring skill |
| Hard | 3 | Challenging, requires expertise |
| Daunting | 4 | Extremely difficult |
| Formidable | 5 | Nearly impossible |

### Reading Results — Two Independent Axes

**Did it work?** Success vs Failure cancel one-for-one. Net Success = task succeeds.

**What else happened?** Advantage vs Threat cancel one-for-one. Independent of success/failure.
Net Advantage = something good also happens. Net Threat = something bad also happens.

**Triumph** (yellow dice): counts as Success AND triggers a dramatic positive. Cannot be
cancelled by Failure (the Triumph effect always fires).

**Despair** (red dice): counts as Failure AND triggers a dramatic negative. Cannot be
cancelled by Success (the Despair effect always fires).

### Spending Advantage

| Cost | Effect |
|------|--------|
| 1 | Recover 1 strain |
| 2 | Bonus manoeuvre immediately |
| 2 | Give ally a Boost die on next check |
| Varies | Inflict Critical Injury (weapon crit rating cost) |
| GM | Other narrative benefits |

### Spending Threat

| Cost | Effect |
|------|--------|
| 1 | Suffer 1 strain |
| 2 | Target gets a bonus manoeuvre |
| 2 | Setback die on your next check |
| 2 | Boost die on next attack targeting you |
| GM | Other narrative complications |

**Triumph** can trigger any Advantage effect plus: auto-Critical Injury, extraordinary feats.
**Despair** can trigger any Threat effect plus: weapon malfunction, major complications.

---

## Characteristics

| Characteristic | Governs |
|---------------|---------|
| Brawn | Strength, toughness, melee |
| Agility | Dexterity, reflexes, ranged combat |
| Intellect | Education, reasoning, mechanics |
| Cunning | Guile, deception, streetwise |
| Willpower | Discipline, mental resilience |
| Presence | Charisma, social influence, command |

### Derived Stats

- **Wound Threshold:** Physical damage capacity (typically 10 + Brawn).
- **Strain Threshold:** Mental/emotional stress (typically 10 + Willpower).
- **Soak:** Damage reduction (Brawn + armour).
- **Defence:** Setback dice added to attacks against character (from armour/cover).

---

## Combat

### Initiative

Roll Cool (prepared) or Vigilance (surprised). Results determine **slots**, not individual
order. PC slots can be used by any PC; NPC slots by any NPC. The player chooses which PC
slot to act in each round.

### Turn Structure

Each turn: **one Action** + **one Manoeuvre** (any order).
Second manoeuvre costs 2 strain. Max 2 manoeuvres, max 1 action per turn.

**Actions:** Attack, use skill, second manoeuvre (2 strain).
**Manoeuvres:** Move between range bands, ready/stow weapon, use stimpack, aim (+1 Boost),
take cover (attackers +1 Setback), interact with environment.

### Range Bands

| Band | Move cost |
|------|-----------|
| Engaged | Touching distance |
| Short | 1 manoeuvre |
| Medium | 1 manoeuvre from Short |
| Long | 2 manoeuvres from Medium |
| Extreme | 2 manoeuvres from Long |

### Attack Difficulty

| Range | Difficulty |
|-------|-----------|
| Short | Easy (1 purple) |
| Medium | Average (2 purple) |
| Long | Hard (3 purple) |
| Engaged, Melee | Average (2 purple) |
| Engaged, Ranged Light | Average (2 purple) |
| Engaged, Ranged Heavy | Hard (3 purple) |

Damage = weapon base + net Successes. Reduced by target's Soak. Remainder = wounds.
Wounds exceeding threshold = incapacitated + Critical Injury. NPCs typically die.
Strain exceeding threshold = unconscious. Strain recovers at end of encounter
(Presence or Cool ranks, whichever greater).

---

## Opposed Checks

Opponent's skill dice replace standard difficulty:
- Green Ability → Purple Difficulty
- Yellow Proficiency → Red Challenge

Example: Deception vs Discipline. Negotiation vs Negotiation.

---

## Minion Group Rules

Minion groups act as a single entity:
- Shared wound threshold = sum of individual thresholds.
- Members drop as wounds accumulate (one per individual threshold crossed).
- Skill ranks from group size: ranks = members beyond the first.
- No strain threshold (strain becomes wounds).
- Critical Injury = one member immediately killed.

---

## Destiny Pool

Each PC rolls one Force die at adventure start. Light pips = light Destiny tokens.
Dark pips = dark Destiny tokens.

- Player spends 1 light Destiny: upgrade one Ability → Proficiency. Token flips dark.
- GM spends 1 dark Destiny: upgrade one Difficulty → Challenge. Token flips light.
- Tokens cycle — never removed.

For solo play: GM manages both sides, spending dark for dramatic complications.

---

## Starship Combat

Same structure as personal combat. Crew stations determine available actions.

### Manoeuvres (Pilot Only)

- **Fly/Drive:** Move the ship. Range bands traversed depends on speed (Speed 0 = stationary,
  Speed 1 = 1 manoeuvre per range band, Speed 2–4 = 1 manoeuvre per range band or 2 to move
  2 bands, Speed 5–6 = more flexible movement).
- **Accelerate/Decelerate:** Change current speed by 1 (min 0, max = Speed rating).
- **Evasive Manoeuvres** (Sil 1–4, Speed 3+): Upgrade difficulty of all attacks against the
  ship by 1, but also upgrade difficulty of attacks *by* the ship by 1. Lasts until pilot's next turn.
- **Stay on Target** (Sil 1–4, Speed 3+): Upgrade all combat checks by crew by 1, but also
  upgrade all attacks targeting the ship by 1. Lasts until pilot's next turn.
- **Punch It** (Sil 1–4): Jump to max speed instantly. Ship suffers 1 system strain per speed
  point difference between current and max.

### Actions

**Pilot:**
- **Gain the Advantage** (Sil 1–4, Speed 4+): Pilot check vs enemy pilot. Difficulty based on
  relative speed (same speed = Average, faster = Easy, 1 slower = Hard, 2+ slower = Daunting).
  On success, ignore Evasive Manoeuvres penalties on both sides until enemy reclaims advantage.

**Gunner:**
- **Attack with Starship Weapon:** Gunnery check. Difficulty based on relative silhouette
  (same/1 apart = Average, 2+ smaller target = Hard, 2+ larger = Easy, 3+ larger = Daunting).
  Damage reduced by target's Armour. Excess becomes hull trauma.

**Engineer:**
- **Damage Control:** Mechanics check to repair 1 system strain or 1 hull trauma. Difficulty
  scales with current damage (under half = Easy, half = Average, over half = Hard, over
  threshold = Daunting).

### Gunnery Difficulty by Silhouette

| Silhouette difference | Difficulty |
|-----------------------|-----------|
| Same size or 1 apart | Average (2 purple) |
| Firing at 2+ smaller target | Hard (3 purple) |
| Firing at 2+ larger target | Easy (1 purple) |
| Firing at 3+ larger target | Daunting (4 purple) |

### Speed Advantage Difficulty (Gain the Advantage)

| Speed difference | Difficulty |
|-----------------|-----------|
| Same speed | Average (2 purple) |
| Initiator 1 faster | Easy (1 purple) |
| Initiator 1 slower | Hard (3 purple) |
| Initiator 2+ slower | Daunting (4 purple) |

### Starship Critical Hits

| Crit # | Repair difficulty | Effect |
|--------|------------------|--------|
| 1st | Easy | 2 system strain. No ongoing effect. |
| 2nd | Average | Engine damaged. Speed −1, handling −1. |
| 3rd | Hard | Shields disabled. Defence reduced to 0. |
| 4th+ | Hard | One component disabled (GM's choice) until repaired. |

Hull trauma repairs at dock cost ~500 credits per point. Light damage (under 25% of
threshold) takes days; heavy damage takes weeks or months.

### Starship Stats

| Stat | Description |
|------|-------------|
| Silhouette | Size (3 = fighter, 4 = freighter) |
| Speed | Vessel speed |
| Handling | +/− Boost/Setback on Pilot checks |
| Defence | Setback on attacks against ship |
| Armour | Damage reduction (like Soak) |
| Hull Trauma | Physical damage threshold |
| System Strain | Strain threshold |

---

## Adversary Bestiary

Reusable NPCs for any EotE adventure. Three threat levels: Minion (disposable groups),
Rival (individual threats, no strain), Nemesis (major antagonists with strain + crits).

### Minions

**Gamorrean Thug** — Brn 3, Agi 2, Int 1, Cun 1, Wil 1, Pre 1. Soak 3, Wounds 6.
Skills (group): Brawl, Coercion, Melee, Ranged (Light). Blaster pistol, brass knuckles.

**Aqualish Thug** — Brn 3, Agi 2, Int 2, Cun 2, Wil 1, Pre 1. Soak 3, Wounds 6.
Skills (group): Brawl, Coercion, Melee, Ranged (Light). Blaster pistol, brass knuckles.

**Stormtrooper** — Brn 3, Agi 3, Int 2, Cun 2, Wil 3, Pre 1. Soak 5, Wounds 5.
Skills (group): Athletics, Discipline, Melee, Ranged (Heavy). Blaster rifle (Long, Damage 9),
vibroknife (Engaged, Damage 4, Pierce 1). Laminate armour.

**Mynock** — Brn 1, Agi 3, Int 1, Cun 1, Wil 1, Pre 1. Soak 1, Def 1, Wounds 4.
Skills (group): Brawl, Coordination. Sucker-mouths (Damage 4, Crit 5). Vacuum dweller.
Latches onto ships: Average Coordination to attach; 1 system strain/day, −1 handling.

### Rivals

**Imperial Naval Officer** — Brn 2, Agi 3, Int 2, Cun 3, Wil 2, Pre 2. Soak 3, Wounds 13.
Skills: Discipline 3, Ranged (Light) 2, Vigilance 2. Tactical Direction ability (give
minion group a free manoeuvre or +1 Boost). Blaster pistol, heavy uniform clothing.

**Stormtrooper Sergeant** — Brn 3, Agi 3, Int 2, Cun 2, Wil 3, Pre 1. Soak 5, Wounds 14.
Skills: Athletics 2, Discipline 2, Leadership 3, Melee 2, Ranged (Heavy) 2, Ranged (Light) 2,
Resilience 2, Vigilance 2. Tactical Direction. Heavy blaster rifle (Long, Damage 10,
Auto-fire, Pierce 1, Cumbersome 3), vibroknife, 3 frag grenades. Stormtrooper armour.

**Journeyman Bounty Hunter** — Brn 3, Agi 3, Int 2, Cun 3, Wil 2, Pre 2. Soak 5, Wounds 13.
Skills: Brawl 1, Coerce 1, Coordination 1, Ranged (Heavy) 1, Ranged (Light) 1, Survival 2,
Vigilance 1. Talent: Lethal Blow 1 (first crit per day counts as 2). Heavy blaster pistol,
disruptor rifle (Long, Damage 10, Crit 2, Cumbersome 2). Laminate armour.

**Smuggler** — Brn 2, Agi 3, Int 3, Cun 3, Wil 2, Pre 3. Soak 2, Wounds 12.
Skills: Charm 1, Cool 1, Ranged (Light) 2, Piloting 3, Skulduggery 2, Streetwise 2,
Vigilance 1. Talent: Natural Jockey 2 (remove 2 Setback from Piloting). Blaster pistol.

### Nemeses

**Hutt Crime Lord** — Brn 6, Agi 1, Int 4, Cun 6, Wil 5, Pre 3. Soak 10, Wounds 30, Strain 20.
Skills: Athletics 1, Charm 2, Coerce 4, Cool 5, Deceit 5, Discipline 5, Knowledge 3,
Leadership 1, Melee 2, Negotiation 5, Ranged (Light) 2, Resilience 5. Talents: Convincing
Demeanour 2, Durable 2, Nobody's Fool 3, Resolve 2. Abilities: Awkward (3 Setback on
Brawl/Melee/Coordination), Ponderous (max 1 manoeuvre move per turn).

**Captive Rancor** — Brn 6, Agi 2, Int 1, Cun 3, Wil 3, Pre 1. Soak 12, Wounds 40, Strain 15.
Abilities: Silhouette 3, Sweep attack (Triumph on Brawl = hit all engaged targets).
Massive rending claws (Brawl, Short range, Damage 20, Crit 3, Knockdown).

---

## Experience and Advancement

10 XP per major encounter/milestone. Spent on:
- **Skill ranks:** (new rank) × 5 XP
- **Talents:** 5/10/15/20/25 XP by tier
- **New specialisations:** 10 XP in-career, 20 XP out-of-career
- Characteristics cannot be improved after creation (beginner game).

---

## Session Setup & Player Count

### Starting a New Session

At the start of every new game session, present a **Session Setup** widget:

1. **Player count** — Ask how many players (1–5). Default 1 (solo).
2. **Adventure selection** — Choose a published adventure from the module table below, or "Procedural Adventure" for a generated scenario.
3. **Character selection** — For each player in turn:
   - **Pre-generated character** (if the chosen adventure provides them) — display available pre-gens with name, species, career, and a one-line summary. A pre-gen already claimed by another player is unavailable.
   - **Create custom character** — run through species → career → specialisation → obligation using the chargen rules in `ch02a-chargen-species.md` and `ch02b-chargen-careers.md`.
4. **Destiny Pool** — Each PC rolls one Force die. Sum light/dark pips to form the shared pool.

### Multiplayer Turn Flow

- Claude addresses each player **by character name** at decision points.
- During structured encounters (combat, social), use **initiative slots** as per the rules — PC slots can be filled by any player's character.
- Outside structured encounters, present choices to the group. If players need to act independently, resolve each in turn.
- Scale encounters for party size: use the encounter scaling guidelines in the GM chapter (`ch09-gm-and-galaxy.md`).

#### Spotlight Rotation

Each player receives a **spotlight scene** per episode — a scene where their character's skills, background, or Obligation are central to the action. When designing encounters and narrative beats, distribute spotlights evenly across the party so that no single character dominates the story.

#### Parallel Actions

When the party splits, resolve each group's actions in **alternating scenes**. Cut between groups at moments of tension (e.g. just before a dice roll resolves, or as a threat appears). This maintains pacing and gives all players regular involvement even when their characters are separated.

#### Conflicting Goals

If PCs disagree on a course of action and cannot reach consensus through roleplay, resolve via **opposed social checks** (e.g. Leadership vs Discipline, Charm vs Cool) or **narrative negotiation** where each side presents their case and the group votes. Never force a resolution — let the dice or the players decide.

#### Party Size Scaling

| Party size | Encounter adjustment |
|-----------|---------------------|
| 1–2 players | Reduce minion groups by one-third (round down, minimum 1). Lower rival wound thresholds by 2. |
| 3 players | Standard encounter balance as written. |
| 4–5 players | Add 50% more minions to each group (round up). Upgrade one rival to nemesis (add strain threshold = 10 + Willpower, allow Critical Injuries). |

### Solo Play (1 Player)

- Player chooses one character; Claude plays all others as NPCs.
- Scale encounters: reduce enemy numbers, lower wound thresholds.
- Other pre-gen characters can be recruited as NPC allies.
- Obligation creates personal complications.
- Encounter flow is a guide, not a rail — the player can go anywhere.

---

## Dice Pool Widget

Never skip or combine stages. Each stage is revealed sequentially within a single widget.
Use the `data-prompt` + `addEventListener` pattern for all buttons — never inline `onclick`
with `sendPrompt`. Never use contractions in prompt strings.

### Stage 1 — Declare

Show:
- The action the player chose (in narrative terms)
- The check type (skill vs opposing skill, or skill vs difficulty)
- The pool composition with coloured dice icons — green Ability, yellow Proficiency,
  purple Difficulty, blue Boost, black Setback, red Challenge
- A large `[ ROLL DICE POOL ]` button

Do **not** reveal the difficulty reasoning. The player sees *what* they are rolling, not
*why* the GM chose that difficulty.

### Stage 2 — Roll

On button press:
- Show each die's individual symbolic result, colour-coded to its die type
- Use emoji circles (🟢 🟡 🟣 🔵 ⚫ 🔴) to identify each die
- List the symbols rolled on each die (e.g. "🟢 Success + Advantage")
- Visual, colourful, clear — the player sees the raw output of every die

The roll must be triggered by explicit player click — never auto-roll.

### Stage 3 — Resolve

Reveal in sequence:
1. **Cancellation** — Success vs Failure cancel one-for-one. Advantage vs Threat cancel
   one-for-one. Triumph and Despair effects always trigger regardless of cancellation.
2. **Net results** — the remaining symbols after cancellation.
3. **GM narrative interpretation** — what the net results mean in fiction. Describe the
   outcome, spend Advantage/Threat narratively, and resolve any Triumph/Despair effects.

### Stage 4 — Continue

A single continue button. Include a copyable fallback prompt visible below the button.

---

### Worked Example — Complete Widget

> **Scenario:** Pash attempts to fast-talk the stormtrooper checkpoint.
> **Check:** Deception (Cunning 3, Deception 1) vs Discipline (Average difficulty, 2 purple).
> **Pool:** 2 green Ability + 1 yellow Proficiency + 2 purple Difficulty.
> *(Cunning 3 is higher → 3 dice base. Deception 1 is lower → upgrade 1 green to yellow.)*

```html
<div class="root">
  <style>
    .root {
      font-family: 'IBM Plex Sans', var(--font-sans, sans-serif);
      color: var(--color-text-primary, #e0e0e0);
      background: var(--color-bg-primary, #1a1a2e);
      padding: 20px;
      border-radius: var(--border-radius-lg, 12px);
      max-width: 520px;
    }
    .widget-title {
      font-family: 'Syne', var(--font-sans, sans-serif);
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-text-tertiary, #888);
      margin: 0 0 12px 0;
    }
    .action-desc {
      font-size: 15px;
      line-height: 1.5;
      margin: 0 0 16px 0;
      color: var(--color-text-secondary, #ccc);
    }
    .action-desc strong {
      color: var(--color-text-primary, #e0e0e0);
    }
    .check-type {
      font-family: 'IBM Plex Mono', var(--font-mono, monospace);
      font-size: 11px;
      letter-spacing: 0.05em;
      color: var(--color-text-tertiary, #888);
      margin: 0 0 14px 0;
    }
    .dice-pool {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
      margin: 0 0 20px 0;
    }
    .die-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      text-shadow: 0 1px 2px rgba(0,0,0,0.4);
    }
    .die-ability    { background: #4caf50; }
    .die-proficiency { background: #fbc02d; color: #1a1a2e; text-shadow: none; }
    .die-difficulty { background: #7b1fa2; }
    .die-challenge  { background: #c62828; }
    .die-boost      { background: #29b6f6; }
    .die-setback    { background: #212121; border: 1px solid #555; }
    .pool-label {
      font-size: 11px;
      color: var(--color-text-tertiary, #888);
      margin-left: 4px;
    }

    /* Stage 2 — Roll results */
    .roll-results {
      display: none;
      margin: 0 0 20px 0;
      padding: 14px;
      background: rgba(255,255,255,0.04);
      border-radius: 8px;
      border: 0.5px solid var(--color-border-tertiary, #333);
    }
    .roll-results h3 {
      font-family: 'Syne', var(--font-sans, sans-serif);
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-text-tertiary, #888);
      margin: 0 0 10px 0;
    }
    .die-result {
      font-size: 14px;
      line-height: 1.8;
      margin: 0;
    }

    /* Stage 3 — Resolve */
    .resolve-section {
      display: none;
      margin: 0 0 20px 0;
    }
    .net-results {
      font-family: 'IBM Plex Mono', var(--font-mono, monospace);
      font-size: 13px;
      padding: 12px 14px;
      background: rgba(76, 175, 80, 0.1);
      border: 0.5px solid rgba(76, 175, 80, 0.3);
      border-radius: 8px;
      margin: 0 0 14px 0;
      color: #81c784;
    }
    .net-results.failure {
      background: rgba(198, 40, 40, 0.1);
      border-color: rgba(198, 40, 40, 0.3);
      color: #ef9a9a;
    }
    .gm-narrative {
      font-size: 14px;
      line-height: 1.6;
      color: var(--color-text-secondary, #ccc);
      margin: 0;
      font-style: italic;
    }

    /* Stage 4 — Continue */
    .continue-section {
      display: none;
    }
    .roll-btn, .continue-btn {
      font-family: 'IBM Plex Mono', var(--font-mono, monospace);
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      border: none;
      border-radius: 8px;
      padding: 12px 28px;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
      width: 100%;
    }
    .roll-btn {
      background: #fbc02d;
      color: #1a1a2e;
    }
    .roll-btn:hover { background: #f9d44a; transform: translateY(-1px); }
    .roll-btn:disabled {
      opacity: 0.4;
      cursor: default;
      transform: none;
    }
    .continue-btn {
      background: rgba(255,255,255,0.08);
      color: var(--color-text-primary, #e0e0e0);
      border: 0.5px solid var(--color-border-tertiary, #333);
    }
    .continue-btn:hover {
      background: rgba(255,255,255,0.12);
      border-color: var(--color-border-secondary, #555);
    }
    .fallback-text {
      display: none;
      font-size: 11px;
      color: var(--color-text-tertiary, #888);
      margin-top: 10px;
      line-height: 1.5;
    }
    .fallback-text code {
      display: block;
      margin-top: 4px;
      padding: 8px;
      background: rgba(255,255,255,0.04);
      border-radius: 4px;
      font-family: 'IBM Plex Mono', var(--font-mono, monospace);
      font-size: 11px;
      user-select: all;
      cursor: text;
    }
  </style>

  <!-- ═══════════ STAGE 1 — DECLARE ═══════════ -->
  <p class="widget-title">Deception Check</p>
  <p class="action-desc">
    <strong>Pash attempts to fast-talk the stormtrooper checkpoint,</strong>
    spinning a story about an urgent delivery for the Imperial garrison.
  </p>
  <p class="check-type">DECEPTION (CUNNING) vs DISCIPLINE — Average difficulty</p>

  <div class="dice-pool">
    <span class="die-icon die-ability" title="Ability (green)">A</span>
    <span class="die-icon die-ability" title="Ability (green)">A</span>
    <span class="die-icon die-proficiency" title="Proficiency (yellow)">P</span>
    <span class="pool-label">vs</span>
    <span class="die-icon die-difficulty" title="Difficulty (purple)">D</span>
    <span class="die-icon die-difficulty" title="Difficulty (purple)">D</span>
  </div>

  <button class="roll-btn" id="roll-btn">[ ROLL DICE POOL ]</button>

  <!-- ═══════════ STAGE 2 — ROLL ═══════════ -->
  <div class="roll-results" id="roll-results">
    <h3>Dice Results</h3>
    <p class="die-result">🟢 Ability 1 — Success + Advantage</p>
    <p class="die-result">🟢 Ability 2 — Advantage</p>
    <p class="die-result">🟡 Proficiency — Success + Success + Triumph</p>
    <p class="die-result">🟣 Difficulty 1 — Failure + Threat</p>
    <p class="die-result">🟣 Difficulty 2 — Failure</p>
  </div>

  <!-- ═══════════ STAGE 3 — RESOLVE ═══════════ -->
  <div class="resolve-section" id="resolve-section">
    <div class="net-results">
      Net: 1 Success, 1 Advantage, 1 Triumph
      <br>
      (3 Success − 2 Failure = 1 Success | 1 Advantage − 1 Threat = 0 … but
      Triumph adds its own Success and always triggers)
    </div>
    <p class="gm-narrative">
      The stormtrooper sergeant squints at Pash, but the story holds. He waves the
      group through with a curt nod — the Deception succeeds. The Advantage means
      Pash overhears a useful frequency code from the checkpoint comms as he passes.
      The Triumph triggers something extraordinary: the sergeant actually offers a
      patrol schedule datapad, mistaking Pash for a genuine Imperial courier. That
      information could prove invaluable later.
    </p>
  </div>

  <!-- ═══════════ STAGE 4 — CONTINUE ═══════════ -->
  <div class="continue-section" id="continue-section">
    <button class="continue-btn" id="continue-btn"
      data-prompt="Pash passed the Deception check with 1 Success, 1 Advantage, and 1 Triumph. The stormtroopers let the group through. Pash overheard a frequency code and received a patrol schedule datapad. Continue the adventure.">
      Continue
    </button>
    <p class="fallback-text" id="fallback">
      If the button above does not work, copy this text and paste it into the chat:
      <code id="fallback-prompt"></code>
    </p>
  </div>

  <script>
    /* Stage 2 — reveal roll results on button press */
    document.getElementById('roll-btn').addEventListener('click', function () {
      this.disabled = true;
      this.textContent = 'ROLLED';
      document.getElementById('roll-results').style.display = 'block';

      /* Stage 3 — reveal resolve after a brief pause */
      setTimeout(function () {
        document.getElementById('resolve-section').style.display = 'block';

        /* Stage 4 — reveal continue after resolve is visible */
        setTimeout(function () {
          document.getElementById('continue-section').style.display = 'block';
        }, 400);
      }, 600);
    });

    /* Continue button — sendPrompt with fallback */
    document.getElementById('continue-btn').addEventListener('click', function () {
      var prompt = this.dataset.prompt;
      if (typeof sendPrompt === 'function') {
        sendPrompt(prompt);
      } else {
        var fb = document.getElementById('fallback');
        var fp = document.getElementById('fallback-prompt');
        if (fb && fp) {
          fp.textContent = prompt;
          fb.style.display = 'block';
        }
      }
    });
  </script>
</div>
```

### Dice Pool Widget — Key Rules

- **Randomise at render time.** The example above shows fixed results for illustration. In
  live play, Claude must roll each die against its face table (see `ch01-playing-the-game.md`)
  when generating the widget, then embed the actual results.
- **Colour is mandatory.** Every die must be visually identifiable by its colour. Use the
  `.die-*` classes or equivalent styling.
- **Cancellation must be shown.** The player needs to see the arithmetic: raw totals, what
  cancels, and the net remainder.
- **Triumph and Despair always trigger.** Even if all Successes are cancelled, a Triumph
  still fires its dramatic positive. Even if all Failures are cancelled, a Despair still
  fires its dramatic negative.
- **GM narrative is not optional.** Stage 3 must include an in-fiction interpretation of
  every net symbol — Success/Failure for the task outcome, Advantage/Threat for side-effects,
  Triumph/Despair for dramatic moments.
- **Never reveal difficulty before commitment.** The pool composition (including difficulty
  dice) is shown only after the player has chosen their action.
- **Fallback prompt is mandatory.** Every widget must include the copyable fallback text
  for when `sendPrompt` is unavailable.
- **No contractions in prompt strings.** Use "do not" rather than "don't", "let us" rather
  than "let's".
- **`data-prompt` + `addEventListener` only.** Never use inline `onclick` with `sendPrompt`.

### Character Sheet

- Six characteristics as 1–5 values
- Wound and Strain tracks (visual bars, current/threshold)
- Soak value
- Skills with ranks and calculated dice pools
- Obligation tracker
- Equipment with damage/crit/range

---

## Module System

Adventure and reference modules in `modules/` provide campaigns, lore, and mechanical content.

### Published Adventures

| Module | File | Pre-gens | Description |
|--------|------|----------|-------------|
| Escape from Mos Shuuta | `modules/escape-from-mos-shuuta.md` | 4 (Pash, Oskara, Lowhhrick, 41-VEX) | Beginner game — flee Teemo the Hutt on Tatooine |
| Long Arm of the Hutt | `modules/long-arm-of-the-hutt.md` | Same 4 | Direct sequel — confront Teemo across multiple worlds |
| Under a Black Sun | `modules/adventures/under-a-black-sun.md` | 4 (Matwe, Jovel, Sin, Tray'Essek) | Standalone — Coruscant underworld investigation |
| Beyond the Rim | `modules/adventures/beyond-the-rim.md` | NPC companions | Three-episode salvage expedition to Raxus Prime |
| The Jewel of Yavin | `modules/adventures/the-jewel-of-yavin.md` | NPC companions | Three-episode heist on Cloud City, Bespin |

### Core Rulebook Reference

| Module | File | Content |
|--------|------|---------|
| Playing the Game | `modules/core-rulebook/ch01-playing-the-game.md` | Core concepts and dice system |
| Species | `modules/core-rulebook/ch02a-chargen-species.md` | Species stats and abilities |
| Careers | `modules/core-rulebook/ch02b-chargen-careers.md` | Careers, specialisations, talent trees |
| Talents | `modules/core-rulebook/ch02c-talents.md` | Complete talent reference with trees |
| Skills | `modules/core-rulebook/ch03-skills.md` | Skill descriptions and usage |
| Gear & Equipment | `modules/core-rulebook/ch05-gear-equipment.md` | Weapons, armour, gear, item qualities |
| Combat | `modules/core-rulebook/ch06-combat.md` | Combat rules and actions |
| Starships & Vehicles | `modules/core-rulebook/ch07-starships-vehicles.md` | Vehicle combat, ship profiles |
| The Force | `modules/core-rulebook/ch08-force-and-law.md` | Force powers, upgrade trees, law |
| GM & Galaxy | `modules/core-rulebook/ch09-gm-and-galaxy.md` | GM guidance, encounter design, pacing |
| Adversaries | `modules/core-rulebook/ch12-adversaries.md` | NPC stat blocks by tier |
| Trouble Brewing | `modules/core-rulebook/ch13-trouble-brewing.md` | Adventure design and narrative structure |
| GM Kit | `modules/core-rulebook/gm-kit.md` | Quick reference tables and extra rules |
| FAQ & Errata | `modules/core-rulebook/faq-errata.md` | Official FAQ and applied errata log |

### Sourcebooks

| Module | File | Content |
|--------|------|---------|
| Enter the Unknown | `modules/sourcebooks/enter-the-unknown.md` | Explorer career — species, specialisations, gear |
| Dangerous Covenants | `modules/sourcebooks/dangerous-covenants.md` | Hired Gun career — species, specialisations, gear |
| Far Horizons | `modules/sourcebooks/far-horizons.md` | Colonist career — species, specialisations, gear |
| Fly Casual | `modules/sourcebooks/fly-casual.md` | Smuggler career — species, specialisations, gear |
| Suns of Fortune | `modules/sourcebooks/suns-of-fortune-*.md` | Corellian Sector — locations, encounters, options |
| Lords of Nal Hutta | `modules/sourcebooks/lords-of-nal-hutta.md` | Hutt Space — locations, species, adversaries |

Load the relevant adventure module after the players select their campaign.

---

## Procedural Adventure Generation

When the players choose "Procedural Adventure" or when a published adventure concludes and the party wishes to continue, Claude generates adventures dynamically.

### Lore Constraint

**Draw ONLY from extracted module content.** Do not use general Star Wars knowledge beyond what is in the sourcebook, adventure, and core rulebook modules. This ensures consistency with the EotE mechanical framework and avoids introducing content that contradicts the extracted lore.

### Source Material for Generation

1. **Sourcebooks** — Species, locations, factions, gear, encounter tables, and career-specific adventure hooks from Enter the Unknown, Dangerous Covenants, Far Horizons, Fly Casual, Suns of Fortune, and Lords of Nal Hutta.
2. **Adventure sequel hooks** — Unresolved threads from completed published adventures:
   - *Long Arm of the Hutt* → Contact network (Rebel Alliance, Black Sun, smugglers), Jabba involvement
   - *Beyond the Rim* → CR90 corvette acquisition, Reom as patron, Imperial pursuit, Yiyar clan
   - *The Jewel of Yavin* → Corusca gem disposal, Arend Shen revenge, Wing Guard pursuit, Aris Shen
   - *Under a Black Sun* → Coruscant underworld contacts, Pyke Syndicate
3. **GM guidance** — Encounter design, pacing, and narrative structure from `ch09-gm-and-galaxy.md` and `ch13-trouble-brewing.md`.

### Generation Process

1. **Assess party state** — Review current characters (species, careers, obligations, equipment, ships), completed adventures, and unresolved threads.
2. **Select adventure seed** — Choose from:
   - An unresolved sequel hook from a completed adventure
   - A faction conflict drawn from a sourcebook (e.g. kajidic rivalry from Lords of Nal Hutta, Corellian underworld from Suns of Fortune)
   - A career-specific contract or job from a relevant sourcebook (e.g. Explorer expedition, Hired Gun contract, Colonist settlement crisis, Smuggler run)
   - An Obligation complication for one or more party members
3. **Build the adventure structure** — Following the three-episode format used in published EotE adventures:
   - **Episode I:** Establish the situation, introduce NPCs, initial encounters
   - **Episode II:** Complications, travel, investigation or action sequences
   - **Episode III:** Climax, confrontation, resolution with multiple possible outcomes
4. **Populate with content** — Draw adversaries from `ch12-adversaries.md` and sourcebooks. Use gear, vehicles, and locations from extracted modules. Create NPCs using the species and career data available.
5. **Scale for party** — Adjust encounter difficulty based on party size and experience level using GM chapter guidelines.

### Adventure Seed Generator (d10)

| Roll | Adventure type |
|------|---------------|
| 1 | **Smuggling run** — Cargo delivery under time pressure |
| 2 | **Bounty hunt** — Track and capture or eliminate a target |
| 3 | **Heist** — Steal something valuable from a secure location |
| 4 | **Exploration** — Chart unknown territory, salvage, or archaeological dig |
| 5 | **Faction conflict** — Caught between two competing organisations |
| 6 | **Rescue mission** — Extract someone from captivity |
| 7 | **Investigation** — Uncover a conspiracy or solve a mystery |
| 8 | **Defence** — Protect a location, person, or asset from attack |
| 9 | **Escape** — Flee pursuit across multiple systems |
| 10 | **Diplomatic mission** — Negotiate between hostile parties |

### Complication Generator (d8)

Roll once at the midpoint of Episode II to inject a complication. Roll again if the adventure stalls.

| Roll | Complication |
|------|-------------|
| 1 | **Imperial entanglement** — Patrol, blockade, or inspection |
| 2 | **Betrayal** — An ally switches sides or withholds critical information |
| 3 | **Equipment failure** — Ship system, weapon, or tool breaks down |
| 4 | **Rival crew** — Another party pursuing the same objective |
| 5 | **Environmental hazard** — Asteroid field, toxic atmosphere, predators |
| 6 | **Obligation trigger** — One PC's Obligation creates an urgent side problem |
| 7 | **Moral dilemma** — Completing the objective requires a questionable choice |
| 8 | **Escalation** — The stakes suddenly increase: bigger bounty, larger fleet, higher-profile target |

### Random NPC Generator

Roll once on each sub-table to create a quick NPC.

**Species (d8)**

| Roll | Species |
|------|---------|
| 1 | Human |
| 2 | Twi'lek |
| 3 | Wookiee |
| 4 | Rodian |
| 5 | Trandoshan |
| 6 | Bothan |
| 7 | Gand |
| 8 | Droid |

**Career (d6)**

| Roll | Career |
|------|--------|
| 1 | Bounty Hunter |
| 2 | Colonist |
| 3 | Explorer |
| 4 | Hired Gun |
| 5 | Smuggler |
| 6 | Technician |

**Motivation (d6)**

| Roll | Motivation |
|------|-----------|
| 1 | Credits and wealth |
| 2 | Revenge or grudge |
| 3 | Loyalty to a faction or person |
| 4 | Freedom and independence |
| 5 | Knowledge or discovery |
| 6 | Power and influence |

**Disposition toward the party (d6)**

| Roll | Disposition |
|------|-----------|
| 1 | Hostile |
| 2 | Suspicious |
| 3 | Neutral |
| 4 | Cautious |
| 5 | Friendly |
| 6 | Eager |

### Location Generator (d8)

| Roll | Location type |
|------|-------------|
| 1 | **Spaceport cantina** — Smoke-filled, crowded, information flows freely |
| 2 | **Abandoned facility** — Derelict station, factory, or outpost; scavengers and vermin |
| 3 | **Wilderness** — Jungle, desert, swamp, or tundra; survival checks required |
| 4 | **Urban underworld** — Lower levels, back alleys, gang territory |
| 5 | **Orbital station** — Docking ring, customs inspections, cramped corridors |
| 6 | **Noble estate** — Wealthy compound, droids, security systems, political intrigue |
| 7 | **Cargo bay/hangar** — Crates for cover, fuel lines, loading droids |
| 8 | **Black market bazaar** — Hidden marketplace, exotic goods, no questions asked |

### Reward Generator (d6)

| Roll | Reward |
|------|--------|
| 1 | **Credits** — 2d6 × 100 per PC |
| 2 | **Gear or weapon** — One item of Rarity 5–7 from `ch05-gear-equipment.md` |
| 3 | **Ship upgrade** — One attachment or modification from `ch07-starships-vehicles.md` |
| 4 | **Faction reputation** — Improved standing with one organisation; future jobs or discounts |
| 5 | **Information or intel** — A lead on an Obligation, a hidden location, or a valuable secret |
| 6 | **New contact or ally** — A recurring NPC who owes the party a favour |

### Continuity

- Track consequences of player choices across procedural adventures.
- NPCs introduced in procedural adventures can recur.
- Obligation changes from procedural adventures persist.
- Experience and equipment gains follow standard advancement rules.

---

## Anti-Patterns

- Never use D&D terminology (HP, AC, DC, d20) — use wounds, strain, soak, dice pools.
- Never pre-calculate dice results — show the full pool and resolve visually.
- Never ignore Advantage/Threat — every roll has narrative side-effects.
- Never forget Triumph/Despair effects always trigger regardless of cancellation.
- Never skip narrative interpretation — describe what the dice mean in fiction.
- Never reveal difficulty before the player commits to an action.
- Never treat strain as irrelevant — it limits what characters can do.
- Never let the player see NPC stat blocks — describe capabilities narratively.
- Never railroad encounters — the player can go anywhere.
- Never use inline `onclick` with sendPrompt — use `data-prompt` + `addEventListener`.
- Never use contractions in sendPrompt strings.
- Never advance the story without player input.
