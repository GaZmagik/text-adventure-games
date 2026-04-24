# Die Rolls — Resolution Mechanics

> Module for text-adventure orchestrator. Always loaded — governs all mechanical resolution.

```json tag-contract
{
  "id": "die-rolls",
  "kind": "module",
  "version": "1.4.0",
  "summary": "Resolution mechanics for hidden checks, pending rolls, DC calibration, dice widgets, and post-roll consequence delivery.",
  "mustRead": [
    "Never reveal stat or DC in action prompts before player commitment.",
    "Use CLI dice widgets; never hand-code dice HTML, CSS, or JS."
  ],
  "commands": [
    "tag compute contest <STAT> <npc_id>",
    "tag compute hazard <STAT> --dc <N>",
    "tag compute encounter --escalation <N>",
    "tag render dice --style <style>",
    "tag render dice-pool --style <style> --data '<json>'"
  ],
  "state": [
    "_pendingRolls stores roll metadata from scene action cards.",
    "rollHistory records completed contest, hazard, and encounter rolls."
  ]
}
```

This module defines how uncertain actions are resolved: the dice mechanics, the widget
stages, DC calibration, attribute variety, difficulty scaling, and the critical rule that
the player must never know which attribute is being tested before they commit to an action.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: core-systems, character-creation modules.

---

## § CLI Commands for This Module

| Action                   | Command                                                | Tool              |
| ------------------------ | ------------------------------------------------------ | ----------------- |
| Render single-die widget | `tag render dice --style <style>`                      | Run via Bash tool |
| Render mixed dice pool   | `tag render dice-pool --style <style> --data '<json>'` | Run via Bash tool |
| Hidden contested roll    | `tag compute contest <STAT> <npc_id>`                  | Run via Bash tool |
| Hazard save              | `tag compute hazard <ATTR> --dc <N>`                   | Run via Bash tool |
| Random encounter         | `tag compute encounter --escalation <N>`               | Run via Bash tool |

> **All die roll widgets are rendered via the `tag` CLI.** The GM must never hand-code HTML, CSS, or JS for dice — hand-coded dice invariably omit the WebGL renderer, quaternion-based landing animation, collision detection, and deterministic seeding that the CLI template provides; the result is a flat, non-interactive placeholder that the player cannot click to roll. Use `tag render dice` for one logical die and `tag render dice-pool` for grouped numeric rolls on one shared canvas.

---

## The Hidden Attribute Rule

**Never reveal which attribute a check will test in the action options.**

The player chooses what to _do_, not which stat to roll. The GM determines the relevant
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
"Speak to the guard" might face a CHA check — or a WIS check if the guard is testing _them_.
A player who chooses "Find another way around" might face DEX (stealth) or INT (navigation)
or WIS (perception to spot an alternative route). The GM decides based on _how_ the player
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

The player's single-die widget works like a standard click-to-roll check — idle pre-roll
state, 3D die, hidden result, click-to-roll reveal, then locked final state. The
difference is in the reveal:

| Check Type         | Reveal                                                        |
| ------------------ | ------------------------------------------------------------- |
| Standard (vs DC)   | Player total + DC line + outcome badge                        |
| Contested (vs NPC) | Player total only; the NPC contest resolution remains GM-side |

The player sees:

- The attribute/modifier context already established for the check
- Their 3D die roll, triggered by their click
- Their own roll breakdown after the die settles

The player **NEVER** sees:

- The NPC's roll value
- The NPC's modifier or stats
- The competing total
- The words "contested", "opposed", or "vs NPC"

### Outcome Badge Text for Contested Checks

| Margin             | Outcome          | Example Narration                                                                |
| ------------------ | ---------------- | -------------------------------------------------------------------------------- |
| Player wins by 5+  | Decisive success | "Your words land with precision. Their resistance crumbles."                     |
| Player wins by 1-4 | Narrow success   | "They hesitate — for a moment you are not sure — but they relent."               |
| Tie (NPC favoured) | Narrow failure   | "They study you carefully. Something in your delivery does not quite land."      |
| NPC wins by 1-4    | Failure          | "They see right through your opening gambit, but you notice a flicker of doubt." |
| NPC wins by 5+     | Decisive failure | "Your attempt falls flat. They were expecting exactly this."                     |

> **CLI:** For contested checks, use `tag compute contest <ATTR> <npc_id>` to ensure
> the NPC's modifier is read from persisted state rather than improvised.

### GM Internal Resolution

The GM resolves the NPC's check silently:

1. Look up the NPC's relevant stat modifier (from `ai-npc.md` stat block or `bestiary.md` tier)
2. Internally compute: `d20 + NPC modifier` (use a mental random number, do NOT show dice)
3. Compare: `player_total` vs `npc_total`
4. Determine margin and select outcome badge + narrative from the table above
5. Render the player-facing die widget normally, then apply the contested outcome in the
   following narrative/widget flow without exposing the NPC math

### Contested Check Attribute Pairings

| Player Action   | Player Attribute | NPC Opposing Attribute |
| --------------- | ---------------- | ---------------------- |
| Persuade        | CHA              | WIS                    |
| Deceive         | CHA              | WIS or INT             |
| Intimidate      | STR or CHA       | WIS or CHA             |
| Pickpocket      | DEX              | WIS                    |
| Sneak past      | DEX              | WIS                    |
| Arm wrestle     | STR              | STR                    |
| Outwit          | INT              | INT or WIS             |
| Read intentions | WIS              | CHA                    |
| Resist charm    | WIS              | CHA                    |
| Spot deception  | WIS or INT       | CHA                    |

---

## Single-Die Widget Flow

The current CLI single-die widget is a one-shot click-to-roll interaction. It starts in an
idle pre-roll state, hides the result until the player clicks, then reveals the result and
locks permanently.

### Pre-Roll

Show:

- The check context (for example `Perception Check` or `Coin Flip`)
- An idle 3D die, coin, or paired percentile dice
- A click hint such as `CLICK THE DIE TO ROLL`
- No visible result text

Do **not** reveal the visible outcome before the click. The widget must not show a
pre-baked rolled face, total, or outcome badge. If the result is visible before the player clicks, the moment of uncertainty — the entire reason the widget exists — is removed, and the roll becomes a formality the player has no reason to engage with.

### Roll

On player click:

- Generate the result client-side at click time
- Animate the die or dice to the rolled face
- Keep the result hidden until the settle animation completes

The roll must be triggered by explicit player click — never auto-roll.

### Reveal and Lock

After the settle animation:

1. Show the roll breakdown
2. If a DC was supplied, reveal the DC and outcome badge now
3. Lock the widget so the result cannot be rerolled

No consequences are described in the die widget itself — outcome delivery must come after the roll, in the next scene or follow-up widget. If consequences appear inside the die widget, the player reads the narrative outcome before they have finished processing the number, collapsing the dramatic beat into a single glance and robbing the result of its weight. Continue the narrative in the next
scene or follow-up widget.

---

## DC Table

| Task            | DC  |
| --------------- | --- |
| Trivial         | 5   |
| Easy            | 8   |
| Moderate        | 12  |
| Hard            | 16  |
| Very Hard       | 20  |
| Near-impossible | 25  |

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

| Act                | Minimum attribute variety                                    |
| ------------------ | ------------------------------------------------------------ |
| Act 1 (scenes 1–2) | At least 3 different attributes tested                       |
| Act 2 (scenes 3–8) | All 6 attributes tested at least once                        |
| Act 3 (scenes 9+)  | Emphasis on the player's weakest 2 stats for maximum tension |

---

## DC Escalation

DCs scale with the player's level to maintain tension as modifiers grow. Use the table below
to set DCs based on player level and intended difficulty.

### DC by Player Level

| Player Level | Easy DC | Moderate DC | Hard DC | Extreme DC |
| ------------ | ------- | ----------- | ------- | ---------- |
| 1–2          | 8       | 10          | 13      | 16         |
| 3–4          | 9       | 12          | 15      | 18         |
| 5–6          | 10      | 13          | 16      | 19         |
| 7–8          | 11      | 14          | 17      | 20         |
| 9–10         | 12      | 15          | 18      | 22         |

Use **Moderate** for most checks. **Easy** for trivial tasks where failure is still possible.
**Hard** for specialist tasks. **Extreme** for near-impossible feats.

### Difficulty Setting Modifiers

These modifiers are applied on top of the DC values above, based on the difficulty chosen
in Game Settings:

| Setting     | DC Modifier            |
| ----------- | ---------------------- |
| Easy mode   | −2 to all DCs          |
| Normal mode | Standard (no modifier) |
| Hard mode   | +2 to all DCs          |
| Brutal mode | +4 to all DCs          |

### Escalation Techniques

Beyond the table, maintain tension through:

- **Disadvantage conditions** — fatigue, injury, time pressure, hostile environment,
  emotional distress. Disadvantage (roll twice, take lower) is a powerful tension tool.
- **Complication rolls** — checks where high rolls produce _complications_ alongside success.
  You pick the lock, but the mechanism triggers an alarm. You persuade the captain, but she
  suspects your motives.
- **Contested checks** — the enemy rolls too. Use `tag compute contest <ATTR> <npc_id>` to
  resolve. A persuasion check against a suspicious NPC is not DC 15; it is your CHA vs
  their WIS.
- **Stacking pressure** — never let modified totals routinely exceed 20. If they do, the
  difficulty curve breaks: the DC table tops out at 25, so a player rolling 20+ before the die even lands will pass nearly every check automatically, rolls become meaningless confirmation clicks, and all tension drains from the adventure. Introduce harder challenges, not bigger bonuses.

---

## Follow-Up Interaction

The current dice widgets do **not** include a built-in continue button or `sendPrompt`
handoff. They end on a locked result state.

- Render the die widget first
- Let the player click and see the result
- Then continue play in the next scene/widget as needed

Do not hand-code a second roll interaction into the dice widget itself. Embedding a second roll breaks the single-widget pattern the CLI enforces, doubles the inline JS payload (pushing toward the token budget ceiling), and creates an untested code path with no animation, seeding, or lock-after-reveal guarantee.

---

## Alternative Rulebook Systems

This module defines the default d20 resolution system. The text-adventure skill is
system-agnostic — specific game systems (such as Star Wars: Edge of the Empire) have their
own dedicated skills with tailored dice mechanics.

- **Custom rulebooks** — the player provides a PDF or markdown document. The GM reads and
  applies the custom resolution mechanic. The click-to-roll widget flow adapts to any
  system-specific breakdown the GM needs to present.

---

## 3D Dice Rendering (WebGL)

The die roll widget renders proper 3D polyhedra using an inline WebGL renderer (no external
dependencies). Each die type uses its correct geometric shape with numbered faces, idle
floating animation, and a tumble-and-settle roll animation. The visible result is chosen
client-side on click, then the die rotates to land with that face pointing at the camera.
The widget begins in a pre-roll state and locks after the reveal.

The renderer is a hand-rolled WebGL implementation (~16KB inline) that uses a texture atlas
for numbered faces and quaternion-based landing animation. No CDN loads, no external scripts.

### DieType Union

All die types are represented by the `DieType` union: `d2 | d4 | d6 | d8 | d10 | d12 | d20 | d100`.

### Die Shapes

| Die  | Geometry                                    | Faces                       | Opposite sum |
| ---- | ------------------------------------------- | --------------------------- | ------------ |
| d2   | Coin (flat cylinder)                        | 2                           | 3            |
| d4   | Tetrahedron                                 | 4 triangles                 | N/A          |
| d6   | Cube                                        | 6 squares (12 triangles)    | 7            |
| d8   | Octahedron                                  | 8 triangles                 | 9            |
| d10  | Pentagonal trapezohedron                    | 10 kite faces               | 11           |
| d12  | Dodecahedron                                | 12 pentagons (36 triangles) | 13           |
| d20  | Icosahedron                                 | 20 triangles                | 21           |
| d100 | Two independent d10 canvases (Tens + Units) | 10 + 10                     | N/A          |

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
includes the check context, the 3D die, and the post-roll breakdown. The die type is
determined by the game system — d20 for D&D 5e, other types for alternative systems or
damage rolls.

### Rendering Dice

The single-die widget is rendered by `tag render dice --style <style>` via the Bash tool.
The template handles WebGL setup, polyhedra geometry, numbered faces, tumble animation, and
graceful degradation automatically.

Supported die types: d2, d4, d6, d8, d10, d12, d20, d100. For a standard ability check, the CLI renders a single d20. For damage rolls or alternative systems, specify the die type via the `--data` flag:

```bash
tag render dice --style terminal --data '{"dieType":"d6"}'
```

For mixed or repeated numeric rolls on one shared canvas, use `tag render dice-pool`:

```bash
tag render dice-pool --style terminal --data '{"label":"Storm Volley","pool":[{"dieType":"d6","count":2},{"dieType":"d8","count":2},{"dieType":"d10","count":3},{"dieType":"d20","count":1}],"modifier":4}'
```

The GM must never hand-code WebGL, canvas elements, or dice HTML. Hand-coded dice consistently omit quaternion-based tumble animation, the texture atlas for numbered faces, opposite-face pairing, and the lock-after-reveal state machine — producing a bare geometric shape with no visible numbers that the player cannot meaningfully interact with. Always use the CLI command.

---

## Anti-Patterns

- Never reveal which attribute a check will test before the player commits to an action. If the player knows which stat is being tested, they will always pick the option that targets their highest modifier — eliminating meaningful choice and turning every decision into arithmetic.
- Never auto-roll — the player must click the roll button. An auto-rolled result robs the player of agency; they see a number they had no part in triggering, which feels like reading someone else's story rather than playing their own.
- Never pre-fill the visible result or pre-determine the shown face before the click. If the face is visible before the click, the tumble animation is cosmetic theatre over a known outcome — the player notices immediately and disengages.
- Never describe consequences in the roll widget — use the outcome widget. Embedding narrative consequences alongside the number collapses two distinct dramatic beats (the result and its meaning) into one, and the player skims past both.
- Never reveal the DC before the roll — only after, during the resolve stage. If the player sees the DC first, they can calculate their odds before clicking; a roll they know they will probably pass (or certainly fail) carries no suspense.
- Never skip the animation stage — the moment of uncertainty is part of the experience. Without the tumble-and-settle animation, the result appears instantly and the roll feels like a static label rather than a physical event the player participated in.
- Never offer rerolls from the widget itself — the current dice widgets are one-shot and lock after reveal. A reroll button inside the widget bypasses the lock-after-reveal state machine, creates an untested second interaction path, and teaches the player that bad rolls are disposable rather than consequential.
- Never let the same attribute dominate the checks across an entire act. If one attribute carries every check, players who dumped that stat face a wall of failures while those who invested in it breeze through — both outcomes flatten the drama and waste the other five attributes entirely.
- Never hand-code HTML, CSS, or JS for dice widgets — use `tag render dice` or `tag render dice-pool` via the Bash tool. Hand-coded widgets omit the ~16KB WebGL renderer, numbered-face texture atlas, quaternion animation, and lock state machine; the player receives a non-functional or visually broken placeholder.
- Never label action options with the attribute they test (e.g., "Persuade (CHA)"). Labelling turns narrative choices into stat optimisation — the player stops reading the fiction and starts scanning for the highest modifier, defeating the purpose of the hidden attribute rule.
- Never let modified totals routinely exceed 20 without escalating DCs. When modifiers push totals past 20, the DC table (which caps at 25) can no longer create meaningful failure chances — every roll becomes a guaranteed success and the dice are reduced to a loading animation with no stakes.
