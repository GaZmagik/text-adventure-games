# GM Checklist — Mandatory Quality Gates
> Module for text-adventure orchestrator. Always loaded — this is a core module, not optional.

This module provides mandatory checklists that the GM must work through at key moments
during gameplay. It prevents common mistakes: writing text outside widgets, skipping
character creation steps, forgetting to load modules, or breaking the click-to-roll die widget
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
   the choice and wait. Never assume what the player would choose. Auto-resolving
   removes the core loop of player agency — the game becomes a story read to them
   rather than one they shape, and they will disengage.

3. **Never reveal the DC before a roll.** The player commits to the action, THEN learns
   the difficulty. If the DC is visible beforehand, players min-max their choices based
   on numbers rather than narrative instinct, destroying the tension of uncertain outcomes.

4. **Never reveal which attribute a check tests before the player commits.** Options
   describe actions, not stats. "Speak to the guard" not "Persuade (CHA)". Showing
   the attribute turns choice selection into stat optimisation — the player picks
   whichever action maps to their highest modifier, bypassing the narrative reasoning
   the game is built around.

5. **The player clicks the die.** Never auto-roll. Never skip the roll animation.
   The click is the moment of commitment — skipping it removes the tactile tension
   that makes outcomes feel earned. A pre-resolved roll reads as predetermined, and
   the player stops trusting that results are fair.

6. **Use `addEventListener`, never inline `onclick` for sendPrompt paths.**
   Inline onclick handlers silently break when prompt text contains apostrophes or
   special characters — the button renders but does nothing when clicked, with no
   visible error.

7. **Include a copyable fallback on every sendPrompt button.** The `sendPrompt()`
   API is not available in all Claude.ai widget iframe contexts. Without a fallback,
   the player has no way to continue the game — they see a button that does nothing
   and no text to copy-paste manually.

8. **Read the active visual style file before rendering any widget.** Apply its CSS
   custom properties. Without the correct style file loaded, widgets render with wrong
   colours, broken contrast ratios, and invisible text — particularly in dark-mode
   themes where foreground defaults to black.

**If unsure about any rule, run `tag rules` via the Bash tool.** It outputs all 20 rules
with file references. Filter by topic: `tag rules output`, `tag rules agency`, `tag rules cli`.

---

## New Game Checklist

When starting a new game (player says "play a text adventure" or similar), verify each
step IN ORDER. Do not skip ahead. Do not combine steps. Skipping or merging steps
causes downstream failures: modules load without their dependencies, the visual style
renders with defaults, and the character creation widget loses its name pool and pronoun
dropdowns because the CLI pipeline was never invoked.

```
NEW GAME CHECKLIST
═══════════════════════════════════════════
□  0. Run `. ./setup.sh` if first session. Run `tag state reset` to initialise game state.
□  1. Read all Tier 1 modules IN FULL (see SKILL.md Architecture — Tiered Loading)
□  2. Present Scenario Selection widget: run `tag render scenario-select --data '<json>'` — do NOT hand-code HTML.
     The CLI output includes accessible markup, keyboard navigation, and sendPrompt
     wiring that hand-coded versions invariably omit, producing broken or inaccessible
     selection cards.
□  3. Wait for player to select a scenario — do NOT auto-select.
     The scenario choice determines which modules load, which world-history seeds
     apply, and which NPC rosters are available. Guessing wrong front-loads an
     entire arc the player did not ask for.
□  4. Present the Settings widget: run `tag render settings --data '<json>'` — do NOT hand-code HTML.
     The CLI output includes validated module toggles, difficulty presets, and
     accessibility options that hand-coded versions omit, producing incomplete
     or inconsistent settings.
     Tailor available modules and defaults to the chosen scenario.
□  5. Wait for player to confirm settings — do NOT proceed without confirmation.
     All subsequent widgets (character creation, scene rendering, save data) depend
     on the confirmed settings for module loading, difficulty values, and style
     selection. Proceeding without confirmation means every downstream widget uses
     unvalidated defaults.
□  6. Load required modules for the selected scenario and confirmed settings
□  7. Read the active visual style file from styles/
□  8. Read styles/style-reference.md for structural patterns
□  9. Present Character Creation widget: run `tag render character-creation --data '<json>'` — do NOT hand-code HTML
     The render pipeline embeds a 500+ name randomiser pool from data/names.md and
     pronoun selection with custom subject/object dropdowns. Hand-written character
     creation widgets will have NONE of this — names will be a tiny hardcoded list.
     Pass the FULL tag render output to show_widget. Do NOT extract, summarise, or
     rewrite any part of it. Rewriting strips the embedded JavaScript event listeners,
     the name randomiser pool, and the pronoun selection logic — the widget renders
     but its interactive elements are dead.
□ 10. Wait for player to confirm character — do NOT auto-generate without input.
      The character's name, class, stats, and pronouns define every subsequent
      roll modifier, dialogue option, and narrative voice line. Auto-generating
      produces a character the player feels no ownership over.
□ 11. Parse settings AND character data from the confirm prompt — the prompt contains
     both (rulebook, difficulty, pacing, style, atmosphere, audio, modules, AND
     name, class, stats, proficiencies, equipment). Apply ALL settings now.
□ 12. Store character in state: `tag state set character '<json>'`
     Run `tag state schema character` to see the exact fields. Quick reference:
     ```json
     {"name":"...","class":"...","hp":10,"maxHp":10,"ac":12,"level":1,"xp":0,
      "currency":0,"currencyName":"credits",
      "stats":{"STR":10,"DEX":10,"CON":10,"INT":10,"WIS":10,"CHA":10},
      "modifiers":{"STR":0,"DEX":0,"CON":0,"INT":0,"WIS":0,"CHA":0},
      "proficiencyBonus":2,"proficiencies":[],"abilities":[],
      "inventory":[{"name":"...","type":"weapon","slots":1,"description":"..."}],
      "conditions":[],"equipment":{"weapon":"...","armour":"..."}}
     ```
     Common mistakes: `archetype` (not a field), `pronouns` (store in worldFlags),
     `equipment` as array (must be `{weapon, armour}` object),
     `inventory[].quantity` (not a field — use `slots`).
□ 13. Set visual style AND rulebook: `tag state set visualStyle <style-name>`
     Also run: `tag state set worldFlags.rulebook <system>` (e.g. d20_system).
     Without this, dice enforcement never triggers.
□ 14. Initialise storyArchitect (see modules/story-architect.md § Seeding Threads from carryForward)
□ 15. Initialise worldHistory (see modules/world-history.md § Historical Epoch System)
□ 16. ARC SETUP — Create ALL content for this arc BEFORE the first scene.
     This is a batch operation. Do NOT create NPCs, quests, or factions mid-arc.
     Plan the arc's full cast, key locations, faction dynamics, and quest structure,
     then persist everything in one batch call.
     Run `tag state schema quests.0` and `tag state schema factions` to check shapes. Quick reference:
     - **Factions**: `{"faction_id": 0, "other_faction": 0}` — values are numbers (standing), NOT objects.
     - **Quests**: `[{"id":"...","title":"...","status":"active","objectives":[{"id":"...","description":"...","completed":false}],"clues":[]}]`
       No `type`, `text`, or `rewards` fields. Objectives use `description` not `text`.
     - **NPC tiers**: `minion`, `rival`, `nemesis` only. No `ally` or `friendly` tier.
     - **Time**: `{"period":"morning","date":"Day 1","elapsed":0,"hour":8,"playerKnowsDate":true,"playerKnowsTime":true,"calendarSystem":"standard","deadline":null}`
     ```
     tag batch --commands "state set scene 1; state set currentRoom <room>; state set time '<json>'; state create-npc <id> --name '<name>' --tier <tier> --pronouns <p> --role <role>; state set factions '<json>'; state set quests '<json>'; state set worldFlags.rulebook <system>"
     ```
     Every NPC who will appear in this arc MUST be created here — not when
     they first enter a scene. This ensures stats, pronouns, and modifiers
     are deterministic from the start and available for contested rolls.
□ 17. Generate the opening scene: run `tag render scene --style <style-name>`
     Then compose the narrative prose into the scene HTML output.
     If atmosphere module is active, effects are applied automatically by tag render scene.
     If audio module is active, the scene widget includes a soundscape player automatically.
□ 18. Save composed HTML to /tmp/scene.html, then run `tag verify /tmp/scene.html`
     The verify command checks 12 structural requirements: footer buttons, panels,
     scene-meta, narrative content, CSS size, atmosphere, action cards, status bar,
     no inline onclick, sendPrompt fallbacks, visual style set, no hand-coded dice.
     The verify marker is cryptographically signed — writing the marker file manually
     will not work. Without verification, `tag state sync --apply` will refuse to
     advance and `tag render scene` will refuse to produce the next widget.
□ 19. Pass the verified HTML to show_widget. Verify: is ALL game content inside the widget?
```

---

## Resume from Save Checklist

When resuming from a save file (player pastes a save string, uploads a `.save.md`, or
says "continue from save"), verify each step IN ORDER. The resume flow must perform the
same setup as a new game — skipping these steps causes visual style drift, missing
modules, and broken narrative tracking.

```
RESUME FROM SAVE CHECKLIST
═══════════════════════════════════════════
□  0. Run `. ./setup.sh` — resuming always starts a new conversation, so the CLI
     needs installing first. Then restore game state from the save file:
     ```
     . ./setup.sh
     tag save load /mnt/user-data/uploads/<filename>.save.md
     ```
     Uploaded files land in `/mnt/user-data/uploads/`. The load command reads the
     file, extracts the save string from the code block, validates the checksum,
     and writes the full gmState to disk. After this step, `tag state get` will
     return the restored game data — verify it before rendering.
□  1. Parse and validate the save payload (checksum, version, mode)
□  2. Warn (do not block) if skill-version differs from current version
□  3. Check for arc field — if present, load arc context and carryForward data
□  4. Determine visual style from save metadata (or use default: station)
□  5. Read the active visual style file from styles/
□  6. Read styles/style-reference.md for structural patterns
□  7. Determine required modules from save metadata (theme, mode, world flags)
□  8. Load all required modules — same set as a new game for this scenario type
□  9. Reconstruct gmState from save payload (compact: regenerate + apply deltas;
     full: restore directly)
□ 10. Run `tag state context` — verify all active modules are in context. Re-read any files listed in the `required` output.
□ 11. Verify NPC identity: apply pronouns from rosterMutations to all NPC
     definitions (see modules/ai-npc.md § NPC Definition Object for schema,
     modules/save-codex.md § compressRosterMutations for saved fields).
     If compact mode, confirm seeded pronouns match saved pronouns.
     Use saved pronouns as authoritative if they conflict.
□ 12. Reinitialise storyArchitect from worldFlags and codexMutations
□ 13. Reinitialise worldHistory context from seed/theme (if procedural)
□ 14. Render the resume scene as a widget using the active visual style
□ 15. Include: footer with panel buttons + Save ↗ + Export ↗ (if module active)
□ 16. Include: pre-computed #save-data div for save fallback
□ 17. Verify: is ALL game content inside the widget? No prose outside?
```

**Critical:** Steps 5–8 are the ones most commonly skipped on resume. Without them,
Claude falls back to default styling and missing module behaviour. Step 10 (NPC identity)
is new in v1.1.1 — without it, NPC pronouns drift on resume, breaking immersion.
The resume flow must boot the full engine, not just restore the data.

---

## Arc Transition Checklist

When the player transitions to a new arc (clicks "Continue to next arc" at adventure
conclusion), verify each step IN ORDER. An arc transition is a full engine reboot
with carried state — it is NOT a simple scene transition.

```
ARC TRANSITION CHECKLIST
═══════════════════════════════════════════
□  1. Build carryForward from current gmState (see save-codex.md)
□  2. Cap previousArcSummaries at 3 entries — drop oldest if 4th added.
     Unbounded summaries bloat the save payload and consume context window tokens
     that are needed for module instructions and narrative generation.
□  3. Derive new seed: originalSeed + '_arc' + newArcNumber
□  4. Reset gmState: clear inventory, quests, scene, room, conditions, rollHistory
□  5. Restore HP to maxHp
□  6. Apply carryForward: character stats/level/XP, faction standings, NPC dispositions
□  7. Generate starting gear based on character level (see core-systems.md table)
□  8. Seed new storyArchitect threads from carryForward.worldConsequences
□  9. If branching arc: use the player's chosen path to select scenario template
□ 10. If epic arc: verify player level >= 5 before proceeding
□ 11. Read the active visual style file from styles/ (from save metadata)
□ 12. Read styles/style-reference.md for structural patterns
□ 13. Generate new world from derived seed (procedural) or load authored content
□ 14. Present arc opening scene — reference prior arc consequences in narrative
□ 15. Embed updated save data with new arc number in #save-data div
□ 16. Verify: ALL content inside widget, no prose outside
```

---

## Turn-Start Module Checklist

Before EVERY turn — before the New Scene Checklist, before any prose is written —
verify that the correct modules are loaded for this scene. This checklist ensures
the GM never writes prose without the craft rules loaded, and never renders a scene
with missing module context.

```
TURN-START MODULE CHECKLIST
═══════════════════════════════════════════
□  1. Read modules/prose-craft.md § Prose Checklist — ALWAYS, every turn, no exceptions
□  2. Check #scene-meta from the previous widget (if any) for modules_active list
□  3. Verify all modules_active are still loaded in context
□  4. Determine if this turn introduces new module requirements:
       — Ship entering scene? → ship-systems.md, crew-manifest.md
       — Space travel? → star-chart.md
       — On-world exploration? → geo-map.md
       — Named NPC with narrative weight? → ai-npc.md (should already be loaded)
       — Genre overlay triggered? → genre-mechanics.md
       — Atmosphere/audio active? → atmosphere.md, audio.md
□  5. Load any newly required modules before proceeding
□  6. Sync state — you MUST run these before proceeding:
     `tag state set scene <N>` (increment scene counter)
     `tag state set currentRoom <room_id>` (if location changed)
     `tag state set time '<json>'` (advance time if appropriate)
     Stale scene/room/time values break narrative continuity: the save file records
     the wrong location, NPC encounters reference rooms the player left scenes ago,
     and time-of-day descriptions contradict the actual progression.
□  7. Proceed to New Scene Checklist
```

**Critical:** Step 1 is non-negotiable. The prose-craft module contains sentence-level
quality rules that degrade rapidly when not actively in context. Loading it once at
game start is not sufficient — it must be re-read before every scene to maintain
prose quality across long sessions.

**Compaction detection:** `tag state sync` automatically detects conversation compactions
by checking `/mnt/transcripts/`. When `compactionDetected` is `true` in the sync output,
context has been lost. Re-read ALL files listed in `modulesActive` before generating
the next scene. The sync warning includes the specific file paths to re-read.

---

## New Scene Checklist

Before generating EVERY scene widget, verify each item. No exceptions — not even for
"simple" scenes or transitions. The Turn-Start Module Checklist must be completed
before this checklist begins.

```
NEW SCENE CHECKLIST
═══════════════════════════════════════════
□  1. Run `tag state sync` — verify module context, quest consistency, and pending computations. If warnings appear, address them before proceeding.
     Sync detects compaction-induced context loss, stale module references, and
     quest state inconsistencies that manual state-set commands miss. Skipping it
     means the scene may reference completed quests as active or use NPC data from
     a context that was silently discarded.

  Narrative Threading (consult modules/story-architect.md § Pre-Scene)
□  2. Which thread(s) does this scene advance?
□  3. Check foreshadowing registry: any seeds to reinforce or pay off?
□  4. Check consequence chains: any pending effects to deliver?
□  5. Check pacing tracker: what scene type should this be? (action/discovery/dialogue/quiet)
□  6. Has any thread been untouched for 3+ scenes? Touch it.
□  7. Are any NPCs due for an arc beat?

  Prose Craft (consult prose-craft.md)
□  8. Determine the scene's location, atmosphere, and narrative content
□  9. Write narrative: zero meta-commentary, zero emotion labels, zero filter words
□ 10. Verify: sentence length varies, strong verbs, at least one non-visual sense
□ 11. Verify: each NPC voice is distinct, no cliché clusters, no summarising tic

  Widget Assembly — use `tag render`, do NOT hand-code HTML
□ 12. Run `tag render scene --style <style-name>` to generate the scene skeleton
      Then compose your narrative prose into the HTML output.
□ 13. For one logical die, use `tag render dice`; for grouped numeric rolls, use `tag render dice-pool` — never hand-code the roll widget.
      The CLI dice provide numbered 3D faces, settle animation, click-to-roll locking,
      and accessible result announcements. Hand-coded dice invariably produce blank
      geometry without numbered faces, missing animations, or broken lock states.
□ 14. For contested checks, FIRST run `tag compute contest <ATTR> <npc_id>`,
      THEN use the result to render the outcome. Running the render before the
      compute means the outcome is invented rather than calculated — the player's
      roll has no mechanical effect on the result.
□ 15. Include: pre-computed #save-data div for save fallback
□ 16. Save composed HTML to /tmp/scene.html, run `tag verify /tmp/scene.html`
      MANDATORY for every widget — not just scene advances. POI examinations,
      dialogue scenes, and mid-scene renders all require verification. The verify
      marker is signed — writing the file manually will not work. Without verify,
      the next `tag render scene` will refuse to produce output.

  Post-Scene State Sync — run AFTER rendering AND verifying
□ 16. Update any state that changed during this scene:
      `tag state set character.hp <new_hp>` (if damage taken)
      `tag state set character.xp += <xp_earned>` (if XP awarded)
      `tag state set factions.<id> += <delta>` (if faction changed)
      `tag state set worldFlags.<flag> true` (if discovery made)
□ 17. Include: #scene-meta hidden div (see styles/style-reference.md § Scene Metadata)
□ 18. Every interactive button uses data-prompt + addEventListener (no inline onclick)
□ 19. Every sendPrompt button has a copyable fallback
□ 20. ALL narrative content is inside the widget — NOTHING outside
□ 21. Update gmState: scene number, current room, world flags, time
□ 22. Output ONLY the widget — no text before, no text after
```

---

## Die Roll Checklist

Before generating a die roll widget, verify the current click-to-roll flow is correct.
Use `tag render dice` for one logical die and `tag render dice-pool` for grouped numeric pools.

```
DIE ROLL CHECKLIST
═══════════════════════════════════════════
□  1. The player has already committed to an action (never pre-announce the check)
□  2. The attribute was NOT revealed in the action options
□  3. The DC is set but NOT revealed to the player
□  4. Choose the correct renderer:
     `tag render dice --style <style>` for one logical die
     `tag render dice-pool --style <style> --data '<json>'` for grouped numeric rolls
□  5. Pre-roll state is visible: idle 3D die or pool, click hint shown, result hidden
□  6. The player must click to roll. Never auto-roll. Never show a pre-baked visible result.
     A visible result on load tells the player the outcome was decided before they
     acted — it breaks trust in the fairness of the dice system and removes the
     anticipation that makes rolls exciting.
□  7. After the settle animation, reveal the result:
     single die → roll breakdown and optional DC/outcome
     dice pool → grouped rolls, subtotal, optional modifier
□  8. The widget locks after reveal. No rerolls from the widget itself.
□  9. The entire roll interaction lives in a SINGLE widget — never split across messages.
     Splitting causes the click-to-roll JavaScript to lose its event listeners and
     state between widgets, so the second message cannot reference the first message's
     roll result — the player sees a disconnected outcome with no mechanical link.
□ 10. No consequences described in the roll widget — those go in the next scene.
      Mixing consequences into the roll widget robs the next scene of its narrative
      payload and forces the player to process mechanical and narrative information
      simultaneously, diluting both.
□ 11. The widget is the ONLY output — no prose before or after
□ 12. Always use `tag render dice` or `tag render dice-pool` — never hand-code dice geometry of any kind.
      Hand-coded dice produce simplified 3D geometry without numbered faces, missing
      settle physics, and no accessibility announcements — the player sees a spinning
      blank cube instead of a legible d20.
```

> **Arithmetic rule:** ALL calculations (damage totals, HP changes, currency transactions) MUST use `echo "expression" | bc` via bash. Never compute arithmetic in prose output. LLMs routinely mis-calculate multi-step arithmetic; over several scenes, HP drift accumulates — the player's character dies (or survives) based on a maths error the player can see but the GM cannot.

---

## NPC Hidden Roll Checklist

When the player attempts a contested action against an NPC or adversary (persuade,
deceive, intimidate, pickpocket, sneak past, etc.), verify each step.

```
NPC HIDDEN ROLL CHECKLIST
═══════════════════════════════════════════
□  1. Identify the contested action (persuade, deceive, intimidate, etc.)
□  2. Determine player's relevant attribute (see modules/die-rolls.md § Contested Check Attribute Pairings)
□  3. Determine NPC's opposing attribute from the same table
□  4. Look up NPC stats from definition object (see modules/ai-npc.md § NPC Definition Object)
     or threat tier (see modules/bestiary.md § Threat Tiers)
□  5. Player rolls normally — visible click-to-roll single-die widget with 3D dice
□  6. GM secretly resolves NPC roll: d20 + NPC attribute modifier
□  7. Compare totals — player result vs NPC result
□  8. Determine margin of success/failure (decisive/narrow/tie)
□  9. Show outcome badge with NARRATIVE description only
□ 10. NEVER reveal: NPC roll, NPC modifier, NPC stats, the word "contested".
      If the player sees NPC numbers, they will reverse-engineer modifier ranges and
      game their approach — choosing targets by weakness rather than narrative instinct,
      which collapses the role-playing into spreadsheet optimisation.
□ 11. Narrate outcome using modules/die-rolls.md § Outcome Badge Text for Contested Checks
□ 12. If NPC is from bestiary: use tier-based resistance modifier, not full stats
```

     For contested checks, you MUST use `tag compute contest <ATTR> <npc_id>`.
     Never invent NPC modifiers — read them from persisted state. Invented modifiers
     drift between scenes, making the same NPC easier or harder for no narrative
     reason. The player notices when a guard they barely persuaded last scene is
     suddenly a pushover.

**Common mistakes:**
- Showing "vs DC 15" on a contested check — contested checks show narrative only
- Revealing the NPC's roll value or modifier in the outcome text
- Using the word "contested" or "opposed" in player-facing text
- Applying a fixed DC when the check is against a specific NPC with stats

---

## Character Creation Checklist

Verify every element is present in the character creation widget before presenting it.

```
CHARACTER CREATION CHECKLIST
═══════════════════════════════════════════
□ 1. Name input field is present with a Random Name button
□ 2. Archetype/class selection cards are present (3–6 options)
□ 3. Stat array is NOT visible until after archetype selection.
     Showing stats first causes players to pick archetypes by numbers rather than
     fantasy — they optimise for the highest array instead of choosing the class
     that appeals to them narratively.
□ 4. Equipment differs by archetype — no identical loadouts.
     Identical gear removes the mechanical distinction between classes, making the
     archetype choice cosmetic and undermining the role-playing identity the player
     just selected.
□ 5. A Confirm button is present — never auto-confirm.
     The confirm prompt carries the full character payload (name, stats, class,
     pronouns, equipment) back to the GM. Auto-confirming skips this data transfer,
     so the GM proceeds with incomplete or default character data.
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
□ 8. Player chooses action BEFORE any resolution happens.
     Resolving before the player picks removes tactical agency — the combat
     becomes a cutscene the player watches rather than a fight they direct.
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
□ 6. The panel is part of the scene widget — never a separate message.
     A separate message creates a new widget iframe, losing the scene's JavaScript
     state, CSS custom properties, and footer button wiring. The Close button
     cannot restore a scene that exists in a different message.
```

---

## Post-Scene Verification

After generating any widget, the GM should mentally verify each item before sending.
If any check fails, fix it before the widget reaches the player.

```
POST-SCENE VERIFICATION
═══════════════════════════════════════════
□  1. Did I write ANY text outside the widget? If yes — ERROR. Move it inside.
□  2. Does the widget render the active visual style? (Check CSS custom properties)
□  3. Are all buttons wired with addEventListener? (No inline onclick on sendPrompt paths)
□  4. Do all sendPrompt buttons have fallback text?
□  5. Is the status bar present and accurate? (HP, XP, level)
□  6. Footer button audit: compare rendered footer buttons against modules_active
     using the Module Footer Button Table in style-reference.md. Every active module
     must have its button. No inactive module should have a button.
□  7. Is #save-data present with pre-computed save metadata?
□  8. Did I advance at least one story thread?
□  9. Is the gmState updated? (scene number, room, flags, time)
□ 10. Run `tag state sync` — final integrity check. Address any warnings before the next scene.
      Warnings left unresolved compound across scenes — a missed quest completion
      flag or stale NPC disposition will produce contradictory dialogue and broken
      quest-giver interactions in subsequent scenes.
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
  "Persuade" and reveal the attribute only in the die roll widget, after the
  player has already committed to the action.

- **Skipping the click-to-roll flow** — the widget must show an idle pre-roll state, wait
  for the player click, animate, reveal, and then lock. Never omit the animation. Never
  jump straight to the result.

- **Splitting a die roll across two messages** — the pre-roll, animation, and reveal are
  ONE widget. Never send "You rolled a 14" in one message and the outcome in another.

- **Describing roll consequences in the roll widget** — consequences go in the NEXT scene
  widget. The roll widget shows the mechanical result only. Nothing more.

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
