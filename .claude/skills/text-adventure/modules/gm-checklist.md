# GM Checklist — Mandatory Quality Gates
> Module for text-adventure orchestrator. Always loaded — this is a core module, not optional.

This module provides mandatory checklists that the GM must work through at key moments
during gameplay. It prevents common mistakes: writing text outside widgets, skipping
character creation steps, forgetting to load modules, or breaking the four-stage die roll
pattern. Think of it as a pilot's pre-flight checklist — every item must be confirmed
before takeoff.

**This module should be read FIRST, before any other module.**

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: every other module.
This module defines no widget patterns, CSS, or JS. It is purely procedural guidance — a
set of checklists the GM follows internally. The checklists are never shown to the player.
They are internal GM discipline.

---

## The Golden Rules

These rules apply at ALL times, no exceptions. They are never overridden by any other
module, scenario, or player request.

1. **ALL output lives inside `visualize:show_widget`.** Never write prose, narration,
   descriptions, game text, dialogue, or any narrative content as plain text in the
   conversation. If it is part of the game, it goes in a widget. The ONLY text outside
   widgets should be brief system messages such as "Loading scenario..." or responses to
   out-of-character questions.

2. **Never auto-resolve player decisions.** If the player has a choice to make, present
   the choice and wait. Never assume what the player would choose.

3. **Never reveal the DC before a roll.** The player commits to the action, THEN learns
   the difficulty.

4. **Never reveal which attribute a check tests before the player commits.** Options
   describe actions, not stats. "Speak to the guard" not "Persuade (CHA)".

5. **The player clicks the die.** Never auto-roll. Never skip the roll animation.

6. **Use `addEventListener`, never inline `onclick` for sendPrompt paths.**

7. **Include a copyable fallback on every sendPrompt button.**

8. **Read the active visual style file before rendering any widget.** Apply its CSS
   custom properties.

---

## New Game Checklist

When starting a new game (player says "play a text adventure" or similar), verify each
step IN ORDER. Do not skip ahead. Do not combine steps.

```
NEW GAME CHECKLIST
═══════════════════════════════════════════
□  1. Present the Settings widget (rulebook, difficulty, pacing, visual style, modules)
□  2. Wait for player to confirm settings — do NOT proceed without confirmation
□  3. Present Scenario Selection widget (3–4 scenario cards with genre pills)
□  4. Wait for player to select a scenario — do NOT auto-select
□  5. Load required modules for the selected scenario
□  6. Read the active visual style file from styles/
□  7. Read styles/style-reference.md for structural patterns
□  8. Present Character Creation widget (name input with Random button, archetype selection)
□  9. Wait for player to confirm character — do NOT auto-generate without input
□ 10. Initialise gmState with all module-specific state properties
□ 11. Initialise storyArchitect with seeded threads for the scenario
□ 12. Initialise worldHistory with epochs and power structures
□ 13. Generate the opening scene as a widget — NOT as plain text
□ 14. Verify: is ALL game content inside the widget? No prose outside?
```

---

## New Scene Checklist

Before generating EVERY scene widget, verify each item. No exceptions — not even for
"simple" scenes or transitions.

```
NEW SCENE CHECKLIST
═══════════════════════════════════════════
□  1. Consult storyArchitect: which thread(s) does this scene advance?
□  2. Check foreshadowing registry: any seeds to reinforce or pay off?
□  3. Check consequence chains: any pending effects to deliver?
□  4. Check pacing tracker: what scene type should this be? (action/discovery/dialogue/quiet)
□  5. Has any thread been untouched for 3+ scenes? Touch it.
□  6. Are any NPCs due for an arc beat?
□  7. Determine the scene's location, atmosphere, and narrative content
□  8. Build the widget HTML with the active visual style's CSS
□  9. Include: loc-bar, atmo-strip, narrative, POIs, actions, status bar
□ 10. Include: footer with panel buttons + Save ↗ + Export ↗ (if module active)
□ 11. Include: pre-computed #save-data div for save fallback
□ 12. Every interactive button uses data-prompt + addEventListener (no inline onclick)
□ 13. Every sendPrompt button has a copyable fallback
□ 14. ALL narrative content is inside the widget — NOTHING outside
□ 15. Update gmState: scene number, current room, world flags, time
□ 16. Output ONLY the widget — no text before, no text after
```

---

## Die Roll Checklist

Before generating a die roll widget, verify every stage is present and correctly ordered.
All four stages (Declare → Animate → Resolve → Continue) must appear in a SINGLE widget.

```
DIE ROLL CHECKLIST
═══════════════════════════════════════════
□  1. The player has already committed to an action (never pre-announce the check)
□  2. The attribute was NOT revealed in the action options
□  3. The DC is set but NOT revealed to the player
□  4. Use the 3D Three.js die — load from CDN, render the correct polyhedron
     for the die type (d20=icosahedron, d6=cube, d8=octahedron, etc.)
□  5. Stage 1 (Declare): show action, attribute, modifier — NOT the DC
□  6. Stage 2 (Animate): 3D die button is clickable, NOT auto-rolled — tumble animation
□  7. Stage 3 (Resolve): show raw roll + modifier + proficiency (if applicable) = total,
     THEN reveal DC, THEN outcome badge
□  8. Stage 4 (Continue): proceed button with sendPrompt + fallback
□  9. All four stages are in a SINGLE widget — never split across messages
□ 10. No consequences described in the roll widget — those go in the next scene
□ 11. The widget is the ONLY output — no prose before or after
□ 12. Never use flat CSS circles or rectangles for dice — always 3D polyhedra
```

---

## Character Creation Checklist

Verify every element is present in the character creation widget before presenting it.

```
CHARACTER CREATION CHECKLIST
═══════════════════════════════════════════
□ 1. Name input field is present with a Random Name button
□ 2. Archetype/class selection cards are present (3–6 options)
□ 3. Stat array is NOT visible until after archetype selection
□ 4. Equipment differs by archetype — no identical loadouts
□ 5. A Confirm button is present — never auto-confirm
□ 6. The widget is the ONLY output — no descriptive text outside it
```

---

## Combat Checklist

Before generating a combat encounter widget, verify the following.

```
COMBAT CHECKLIST
═══════════════════════════════════════════
□ 1. Initiative order is determined and displayed
□ 2. Enemy cards show name, role, HP pips (with sr-only text)
□ 3. Player status shows HP, conditions
□ 4. Action panel presents options: Attack, Skill, Item, Retreat
□ 5. Each action uses data-prompt + addEventListener
□ 6. Each action has a copyable fallback
□ 7. The combat widget is the ONLY output — no narration outside it
□ 8. Player chooses action BEFORE any resolution happens
```

---

## Save/Export Checklist

When generating save or export artefacts, verify completeness.

```
SAVE/EXPORT CHECKLIST
═══════════════════════════════════════════
□ 1. Save ↗ button uses sendPrompt to ask Claude to generate .save.md
□ 2. Export ↗ button uses sendPrompt to ask Claude to generate .lore.md
□ 3. When generating .save.md: YAML frontmatter includes version, skill-version,
     character, scene, location, title, theme, seed, mode
□ 4. When generating .lore.md: strip player character, reset discoveries,
     convert resolved threads to history
□ 5. Present the file content as a downloadable artefact
□ 6. Include inline copyable fallback text
```

---

## Panel Checklist

Before rendering any panel (inventory, quest log, map, etc.), verify the overlay pattern.

```
PANEL CHECKLIST
═══════════════════════════════════════════
□ 1. Panel opens as overlay — scene content hides, footer stays
□ 2. Panel has a Close button (wired with addEventListener, not onclick)
□ 3. Panel title gets focus on open (tabindex="-1", focus() called)
□ 4. Footer buttons have aria-expanded toggled
□ 5. Panel close restores scene content
□ 6. The panel is part of the scene widget — never a separate message
```

---

## Post-Scene Verification

After generating any widget, the GM should mentally verify each item before sending.
If any check fails, fix it before the widget reaches the player.

```
POST-SCENE VERIFICATION
═══════════════════════════════════════════
□ 1. Did I write ANY text outside the widget? If yes — ERROR. Move it inside.
□ 2. Does the widget render the active visual style? (Check CSS custom properties)
□ 3. Are all buttons wired with addEventListener? (No inline onclick on sendPrompt paths)
□ 4. Do all sendPrompt buttons have fallback text?
□ 5. Is the status bar present and accurate? (HP, XP, level)
□ 6. Does the footer have the correct panel buttons for active modules?
□ 7. Is #save-data present with pre-computed save metadata?
□ 8. Did I advance at least one story thread?
□ 9. Is the gmState updated? (scene number, room, flags, time)
```

---

## Common Mistakes to Avoid

The following errors are observed frequently during gameplay. Each entry describes the
mistake and the correct approach.

- **Writing narrative text outside widgets** — the number one most common error. ALL game
  content goes inside `visualize:show_widget`. The only text outside should be brief system
  messages such as "Loading scenario..." or "Reading style files...".

- **Describing the scene in plain text, then showing a widget** — NO. The widget IS the
  scene. Never duplicate content. Never summarise what is about to appear.

- **Showing a widget and then adding "flavour text" after it** — NO. Everything goes in
  the widget. No prose before, no prose after.

- **Auto-selecting a scenario or character** — always present choices and wait for the
  player. Never skip ahead because the choice "seems obvious".

- **Revealing the DC in the action options** — "Persuade the guard (DC 15)" is WRONG.
  Present "Talk to the guard" and determine the DC internally.

- **Revealing the attribute before commitment** — "Persuade (CHA)" is WRONG. Present
  "Persuade" and reveal the attribute only in Stage 1 of the die roll widget, after the
  player has already committed to the action.

- **Skipping die roll stages** — all four stages (Declare → Animate → Resolve → Continue)
  must appear in sequence in a single widget. Never omit the animation. Never jump straight
  to the result.

- **Splitting a die roll across two messages** — the declare, animate, resolve, and
  continue stages are ONE widget. Never send "You rolled a 14" in one message and the
  outcome in another.

- **Describing roll consequences in the roll widget** — consequences go in the NEXT scene
  widget. The roll widget shows the mechanical result and a continue button. Nothing more.

- **Forgetting the sendPrompt fallback** — every button that calls sendPrompt must have a
  copyable text alternative. The `sendPrompt()` function is not always available in the
  Claude.ai widget iframe.

- **Using inline onclick for sendPrompt** — always use `data-prompt` + `addEventListener`.
  Inline handlers cause escaping issues with apostrophes and other special characters.

- **Generating a scene without consulting storyArchitect** — check threads, foreshadowing,
  and consequences before every scene. A scene that advances zero threads is a wasted scene.

- **Forgetting to update gmState** — scene number, current room, world flags, and time
  must update after every scene. Stale state causes continuity errors.

---

## Integration Notes

This module is purely procedural guidance. It defines no widget patterns, no CSS, no
JavaScript, and no state structures. It works alongside every other module without
conflict.

The checklists are not shown to the player. They are internal GM discipline — a
self-audit performed before and after every widget render. The goal is consistency:
every scene, every roll, every panel follows the same quality standard regardless of
which model is running the session.

When in doubt, return to the Golden Rules. They are the foundation everything else
builds upon.
