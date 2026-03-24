# Die Rolls — Resolution Mechanics
> Module for text-adventure orchestrator. Always loaded — governs all mechanical resolution.

This module defines how uncertain actions are resolved: the dice mechanics, the widget
stages, DC calibration, attribute variety, difficulty scaling, and the critical rule that
the player must never know which attribute is being tested before they commit to an action.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: core-systems, character-creation modules.

---

## § CLI Commands for This Module

| Action | Command | Tool |
|--------|---------|------|
| Render die roll widget | `tag render dice --style <style>` | Run via Bash tool |
| Hidden contested roll | `tag compute contest <STAT> <npc_id>` | Run via Bash tool |
| Hazard save | `tag compute hazard <type> --dc <N>` | Run via Bash tool |
| Random encounter | `tag compute encounter --escalation <N>` | Run via Bash tool |

> **All die roll widgets are rendered via the `tag` CLI.** The GM must never hand-code HTML, CSS, or JS for dice. Use the commands above via the Bash tool.

---

## The Hidden Attribute Rule

**Never reveal which attribute a check will test in the action options.**

The player chooses what to *do*, not which stat to roll. The GM determines the relevant
attribute after the player commits. This prevents the player from gaming their choices
toward their strongest stat.

```
BAD:
  Option A — Persuade the guard (CHA)
  Option B — Sneak past (DEX)
  Option C — Force the door (STR)

GOOD:
  Option A — Speak to the guard
  Option B — Find another way around
  Option C — Force the door open
```

The player should be making narrative decisions, not mechanical ones. A player who chooses
"Speak to the guard" might face a CHA check — or a WIS check if the guard is testing *them*.
A player who chooses "Find another way around" might face DEX (stealth) or INT (navigation)
or WIS (perception to spot an alternative route). The GM decides based on *how* the player
describes their approach, not based on a pre-assigned attribute.

**When the roll widget renders,** the attribute and modifier are revealed — but only after
the player has already committed to the action. This is the moment of truth, not the moment
of optimisation.

---

## CRITICAL — Hidden Roll Resolution Pattern

When the GM resolves a **contested check** against an NPC or adversary, the opposing
roll is resolved internally. The player never sees the NPC's roll, modifier, stats, or
the word "contested". This applies to all player-vs-NPC interactions: persuade, deceive,
intimidate, pickpocket, sneak past, outwit, read intentions, arm wrestle, etc.

### How It Works

The player's die roll widget works identically to a standard check — four stages, 3D
dice, visible result. The difference is in **Stage 3 (Resolve)**:

| Check Type | Stage 3 Display |
|------------|----------------|
| Standard (vs DC) | Player total + "vs DC 15" + outcome badge |
| Contested (vs NPC) | Player total + outcome badge + **narrative line only** |

The player sees:
- Stage 1: Their action, their attribute, their modifier
- Stage 2: Their 3D die roll (animated as normal)
- Stage 3: Their total — but instead of "vs DC 15", show ONLY the outcome badge
  with a narrative description
- Stage 4: Continue button as normal

The player **NEVER** sees:
- The NPC's roll value
- The NPC's modifier or stats
- The competing total
- The words "contested", "opposed", or "vs NPC"

### Outcome Badge Text for Contested Checks

| Margin | Outcome | Example Narration |
|--------|---------|-------------------|
| Player wins by 5+ | Decisive success | "Your words land with precision. Their resistance crumbles." |
| Player wins by 1-4 | Narrow success | "They hesitate — for a moment you are not sure — but they relent." |
| Tie (NPC favoured) | Narrow failure | "They study you carefully. Something in your delivery does not quite land." |
| NPC wins by 1-4 | Failure | "They see right through your opening gambit, but you notice a flicker of doubt." |
| NPC wins by 5+ | Decisive failure | "Your attempt falls flat. They were expecting exactly this." |

> **CLI:** For contested checks, use `tag compute contest <ATTR> <npc_id>` to ensure
> the NPC's modifier is read from persisted state rather than improvised.

### GM Internal Resolution

The GM resolves the NPC's check silently:

1. Look up the NPC's relevant stat modifier (from `ai-npc.md` stat block or `bestiary.md` tier)
2. Internally compute: `d20 + NPC modifier` (use a mental random number, do NOT show dice)
3. Compare: `player_total` vs `npc_total`
4. Determine margin and select outcome badge + narrative from the table above
5. Render the outcome in the die roll widget as if it were a standard check — the player
   cannot tell whether this was a contested or fixed-DC check

### Contested Check Attribute Pairings

| Player Action | Player Attribute | NPC Opposing Attribute |
|---------------|-----------------|----------------------|
| Persuade | CHA | WIS |
| Deceive | CHA | WIS or INT |
| Intimidate | STR or CHA | WIS or CHA |
| Pickpocket | DEX | WIS |
| Sneak past | DEX | WIS |
| Arm wrestle | STR | STR |
| Outwit | INT | INT or WIS |
| Read intentions | WIS | CHA |
| Resist charm | WIS | CHA |
| Spot deception | WIS or INT | CHA |

---

## D&D 5e — Four Progressive Stages

Never skip or combine stages. Each stage is revealed sequentially within a single widget.

### Stage 1 — Declare

Show:
- The action the player chose (in narrative terms, not mechanical)
- The relevant attribute (revealed now, after commitment)
- The modifier value
- A large `[ ROLL 1d20 ]` button

Do **not** reveal the DC. The player knows what they are attempting and how good they are
at it. They do not know how hard the task is.

### Stage 2 — Animate

On button press:
- CSS keyframe spin animation (0.6s duration)
- Land on a random number 1–20
- Display the raw roll prominently (36px, bold)
- Brief pause (0.3s) before proceeding to resolve

The roll must be triggered by explicit player click — never auto-roll.

### Stage 3 — Resolve

Reveal in sequence:
1. Modified total: `raw roll + modifier = total`. When the check involves a skill the
   character is proficient in, display the proficiency bonus as a separate line item in
   the breakdown — e.g., "Roll: 14 + AGI +2 + Proficiency +2 = 18 vs DC 15". When
   unproficient, omit the proficiency line entirely.
2. The DC (revealed now for the first time)
3. Outcome badge:

| Result | Condition |
|--------|-----------|
| CRITICAL SUCCESS | Natural 20 |
| SUCCESS | Total meets or exceeds DC |
| PARTIAL SUCCESS | Missed DC by 1–3, or beat DC by exactly 1 |
| FAILURE | Total below DC by 4+ |
| CRITICAL FAILURE | Natural 1 |

### Stage 4 — Continue

A single continue prompt. No consequences described in the roll widget itself — the outcome
widget handles narrative consequences separately.

The continue button and fallback prompt are rendered automatically by the `tag render dice` command. The GM does not need to hand-code button HTML.

---

## DC Table

| Task | DC |
|------|----|
| Trivial | 5 |
| Easy | 8 |
| Moderate | 12 |
| Hard | 16 |
| Very Hard | 20 |
| Near-impossible | 25 |

Apply difficulty setting modifier: Easy (−2), Normal (0), Hard (+2), Brutal (+4).

---

## Critical Rules

- **Natural 20:** Always succeeds, regardless of modifier or DC. The outcome includes a
  bonus — something extra the player did not expect. A critical success on a Persuasion
  check does not just convince the guard; the guard volunteers information.
- **Natural 1:** Always fails, regardless of modifier. The failure includes a complication —
  something gets worse. A critical failure on a Stealth check does not just alert the guard;
  it alerts the guard and you drop something important.
- **Partial success:** The action partially works but at a cost. You pick the lock, but it
  takes longer than expected and someone heard you. You persuade the merchant, but they
  remember your face. Partial results are narratively richer than binary pass/fail.

---

## Die Roll Variety

Use all six attributes across the adventure — not just the player's primary stats.

A high-DEX character should still face:
- **INT checks** — deciphering codes, understanding mechanisms, recalling knowledge
- **WIS checks** — reading people, sensing danger, resisting manipulation
- **CHA checks** — persuasion under pressure, intimidation, deception
- **CON checks** — enduring hardship, resisting poison, staying conscious
- **STR checks** — forcing doors, climbing, carrying, grappling

Design encounters that specifically target the player's weaker stats. A dump stat that
never gets tested is a missed opportunity for drama. The player should feel genuinely
uncertain about some rolls — not confident that their +5 modifier will carry them.

### Encounter Design for Variety

Each act should include checks across at least four different attributes:

| Act | Minimum attribute variety |
|-----|--------------------------|
| Act 1 (scenes 1–2) | At least 3 different attributes tested |
| Act 2 (scenes 3–8) | All 6 attributes tested at least once |
| Act 3 (scenes 9+) | Emphasis on the player's weakest 2 stats for maximum tension |

---

## DC Escalation

DCs scale with the player's level to maintain tension as modifiers grow. Use the table below
to set DCs based on player level and intended difficulty.

### DC by Player Level

| Player Level | Easy DC | Moderate DC | Hard DC | Extreme DC |
|-------------|---------|-------------|---------|------------|
| 1–2 | 8 | 10 | 13 | 16 |
| 3–4 | 9 | 12 | 15 | 18 |
| 5–6 | 10 | 13 | 16 | 19 |
| 7–8 | 11 | 14 | 17 | 20 |
| 9–10 | 12 | 15 | 18 | 22 |

Use **Moderate** for most checks. **Easy** for trivial tasks where failure is still possible.
**Hard** for specialist tasks. **Extreme** for near-impossible feats.

### Difficulty Setting Modifiers

These modifiers are applied on top of the DC values above, based on the difficulty chosen
in Game Settings:

| Setting | DC Modifier |
|---------|-------------|
| Easy mode | −2 to all DCs |
| Normal mode | Standard (no modifier) |
| Hard mode | +2 to all DCs |
| Brutal mode | +4 to all DCs |

### Escalation Techniques

Beyond the table, maintain tension through:

- **Disadvantage conditions** — fatigue, injury, time pressure, hostile environment,
  emotional distress. Disadvantage (roll twice, take lower) is a powerful tension tool.
- **Complication rolls** — checks where high rolls produce *complications* alongside success.
  You pick the lock, but the mechanism triggers an alarm. You persuade the captain, but she
  suspects your motives.
- **Contested checks** — the enemy rolls too. Use `tag compute contest <ATTR> <npc_id>` to
  resolve. A persuasion check against a suspicious NPC is not DC 15; it is your CHA vs
  their WIS.
- **Stacking pressure** — never let modified totals routinely exceed 20. If they do, the
  difficulty curve is broken. Introduce harder challenges, not bigger bonuses.

---

## sendPrompt Reliability

The `sendPrompt()` function in Claude.ai widget iframes is not always available due to timing
and sandboxing. For die roll widgets:

- Display the roll result and a copyable prompt string alongside the sendPrompt button
  (e.g., "I rolled 14 + 3 = 17. Continue.")
- Show a clear "Copy and paste this to continue" instruction
- Never rely solely on sendPrompt for progression — the player must always have a manual path
- Use the `data-prompt` + `addEventListener` pattern, never inline `onclick`
- Avoid contractions in prompt strings — "Let us" not "Let's"

### Fallback Pattern

The `tag render dice` command automatically includes:
- A `sendPrompt`-wired continue button using the `data-prompt` + `addEventListener` pattern
- A copyable fallback prompt displayed when `sendPrompt` is unavailable
- Correct escaping (no contractions or apostrophes in prompt strings)

The GM does not need to hand-code the fallback pattern. The CLI template handles all of this.

---

## Alternative Rulebook Systems

This module defines the D&D 5e d20 resolution system. The text-adventure skill is
system-agnostic — specific game systems (such as Star Wars: Edge of the Empire) have their
own dedicated skills with tailored dice mechanics.

- **Custom rulebooks** — the player provides a PDF or markdown document. The GM reads and
  applies the custom resolution mechanic. The four-stage widget pattern (Declare → Animate →
  Resolve → Continue) adapts to any system.

---

## 3D Dice Rendering (WebGL)

The die roll widget renders proper 3D polyhedra using an inline WebGL renderer (no external
dependencies). Each die type uses its correct geometric shape with numbered faces, idle
floating animation, and a tumble-and-settle roll animation. The rolled value is
predetermined, then the die rotates to land with that face pointing at the camera.

The renderer is a hand-rolled WebGL implementation (~16KB inline) that uses a texture atlas
for numbered faces and quaternion-based landing animation. No CDN loads, no external scripts.

### DieType Union

All die types are represented by the `DieType` union: `d2 | d4 | d6 | d8 | d10 | d12 | d20 | d100`.

### Die Shapes

| Die | Geometry | Faces | Opposite sum |
|-----|----------|-------|-------------|
| d2 | Coin (flat cylinder) | 2 | 3 |
| d4 | Tetrahedron | 4 triangles | N/A |
| d6 | Cube | 6 squares (12 triangles) | 7 |
| d8 | Octahedron | 8 triangles | 9 |
| d10 | Pentagonal trapezohedron | 10 kite faces | 11 |
| d12 | Dodecahedron | 12 pentagons (36 triangles) | 13 |
| d20 | Icosahedron | 20 triangles | 21 |
| d100 | Paired d10s (tens + units) | 10 + 10 | N/A |

### Style-Aware Colouring

The die face colour and number colour adapt to the active visual style via
`prefers-color-scheme`. Visual styles can override these defaults by setting
CSS custom properties on the widget root:

- `--die-face-color` — the die body colour (default: dark `#35353e`, light `#f0efe7`)
- `--die-number-color` — the face number colour (default: dark `#c8c8d0`, light `#333340`)
- `--die-edge-color` — the wireframe edge colour (default: dark `#606070`, light `#9898a0`)
- `--die-crit-success-color` — flash colour for natural max (default: `#4ade80`)
- `--die-crit-fail-color` — flash colour for natural 1 (default: `#f87171`)

### Architecture

The 3D die system uses:
- **Hand-rolled WebGL** (~16KB inline, no external dependencies) — all geometry, shading, and animation are self-contained
- **Texture atlas** — a single canvas texture with all face numbers in a grid, UV-mapped to each face
- **Face clustering** — triangles grouped by normal direction (dot product > 0.93) to identify logical faces on compound shapes (d6 squares, d12 pentagons)
- **Opposite-face pairing** — faces with opposing normals (dot product closest to -1) are paired and assigned values that sum to the traditional total
- **Quaternion animation** — chaotic tumble via slerp through 8 random orientations, then easeOutBack settle onto the target face

### Rendering a Single Die

When the GM needs a die roll, render a single die of the appropriate type. The widget
includes the narrative context, check breakdown, the 3D die, and the continue button.
The die type is determined by the game system — d20 for D&D 5e, other types for
alternative systems or damage rolls.

### Rendering Dice

The 3D dice widget is rendered by `tag render dice --style <style>` via the Bash tool. The template handles WebGL setup, polyhedra geometry, numbered faces, tumble animation, and graceful degradation automatically.

Supported die types: d2, d4, d6, d8, d10, d12, d20, d100. For a standard ability check, the CLI renders a single d20. For damage rolls or alternative systems, specify the die type via the `--die` flag.

The GM must never hand-code WebGL, canvas elements, or dice HTML. Always use the CLI command.

---

## Anti-Patterns

- Never reveal which attribute a check will test before the player commits to an action.
- Never auto-roll — the player must click the roll button.
- Never describe consequences in the roll widget — use the outcome widget.
- Never reveal the DC before the roll — only after, during the resolve stage.
- Never skip the animation stage — the moment of uncertainty is part of the experience.
- Never let the same attribute dominate the checks across an entire act.
- Never hand-code HTML, CSS, or JS for dice widgets — use `tag render dice` via the Bash tool.
- Never hand-code sendPrompt buttons or fallback prompts — the CLI template handles these.
- Never label action options with the attribute they test (e.g., "Persuade (CHA)").
- Never let modified totals routinely exceed 20 without escalating DCs.
