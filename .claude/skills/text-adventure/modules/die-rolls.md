# Die Rolls — Resolution Mechanics
> Module for text-adventure orchestrator. Always loaded — governs all mechanical resolution.

This module defines how uncertain actions are resolved: the dice mechanics, the widget
stages, DC calibration, attribute variety, difficulty scaling, and the critical rule that
the player must never know which attribute is being tested before they commit to an action.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: core-systems, character-creation modules.

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

Use the `data-prompt` + `addEventListener` pattern:
```html
<button class="action-btn" data-prompt="Continue.">Continue</button>
```

Include a copyable fallback prompt visible below the button.

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
- **Contested checks** — the enemy rolls too. A persuasion check against a suspicious NPC is
  not DC 15; it is your CHA vs their WIS. Both rolls shown to the player.
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

```html
<button class="action-btn" data-prompt="I rolled 14 plus 3 equals 17. Continue.">
  Continue
</button>
<p class="fallback-text" id="fallback" style="display:none; font-size:11px; color:var(--color-text-tertiary); margin-top:8px;">
  If the button above does not work, copy this text and paste it into the chat:
  <code id="fallback-prompt"></code>
</p>
<script>
document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const prompt = btn.dataset.prompt;
    if (typeof sendPrompt === 'function') {
      sendPrompt(prompt);
    } else {
      const fb = document.getElementById('fallback');
      const fp = document.getElementById('fallback-prompt');
      if (fb && fp) {
        fp.textContent = prompt;
        fb.style.display = 'block';
      }
    }
  });
});
</script>
```

---

## Alternative Rulebook Systems

This module defines the D&D 5e d20 resolution system. The text-adventure skill is
system-agnostic — specific game systems (such as Star Wars: Edge of the Empire) have their
own dedicated skills with tailored dice mechanics.

- **Custom rulebooks** — the player provides a PDF or markdown document. The GM reads and
  applies the custom resolution mechanic. The four-stage widget pattern (Declare → Animate →
  Resolve → Continue) adapts to any system.

---

## Anti-Patterns

- Never reveal which attribute a check will test before the player commits to an action.
- Never auto-roll — the player must click the roll button.
- Never describe consequences in the roll widget — use the outcome widget.
- Never reveal the DC before the roll — only after, during the resolve stage.
- Never skip the animation stage — the moment of uncertainty is part of the experience.
- Never let the same attribute dominate the checks across an entire act.
- Never use inline `onclick` with sendPrompt — use `data-prompt` + `addEventListener`.
- Never use contractions (apostrophes) in sendPrompt strings.
- Never omit the copyable fallback prompt from any widget with a sendPrompt button.
- Never label action options with the attribute they test (e.g., "Persuade (CHA)").
- Never let modified totals routinely exceed 20 without escalating DCs.
