# `tag` CLI — GM Manual

The `tag` CLI provides deterministic computation and rendering for game state,
dice resolution, widget HTML, and save payloads. It eliminates improvisation
errors for NPC stats, contested rolls, CSS styling, and save encoding.

---

## § Quick Start

1. Run `bash setup.sh` (once per machine — installs Bun, links `tag`).
2. Run `tag state reset` to initialise a blank game state.
3. You are ready. Use `tag` commands as described below.

---

## § Worked Example 1: Arc Setup (before first scene)

Create ALL NPCs, factions, quests, and state for the entire arc in one batch.
Do NOT create content mid-arc — plan the full cast and structure upfront.

```bash
tag batch <<'EOF'
state reset
state set visualStyle terminal
state set theme space
state set scene 1
state set currentRoom bridge
state set time '{"period":"morning","date":"Day 1","elapsed":0,"hour":8,"playerKnowsDate":false,"playerKnowsTime":true,"calendarSystem":"stardate","deadline":null}'
state set character '{"name":"Rhian","class":"Medic","hp":9,"maxHp":9,"ac":11,"level":1,"xp":0,"stats":{"STR":10,"DEX":12,"CON":10,"INT":14,"WIS":16,"CHA":10},"modifiers":{"STR":0,"DEX":1,"CON":0,"INT":2,"WIS":3,"CHA":0},"proficiencyBonus":2,"proficiencies":["Medicine","Insight","Survival","Perception"],"abilities":[],"inventory":[{"name":"Scalpel","type":"weapon","slots":1}],"conditions":[],"currency":50,"currencyName":"credits","equipment":{"weapon":"Scalpel","armour":"Light Vest"}}'
state create-npc captain_maro --tier rival --name "Captain Devlin Maro" --pronouns she/her --role captain
state create-npc fen_achara --tier rival --name "Fen Achara" --pronouns they/them --role comms
state create-npc hoss_brandt --tier minion --name "Hoss Brandt" --pronouns he/him --role engineer
state create-npc yuki_tanabe --tier minion --name "Yuki Tanabe" --pronouns she/her --role navigator
state set factions '{"survey_corp":20,"frontier_guild":0}'
state set quests '[{"id":"signal-mystery","title":"Signal Return","status":"active","objectives":[{"id":"decode","description":"Decode the signal","completed":false}]}]'
state set modulesActive '["core-systems","die-rolls","bestiary","save-codex","prose-craft","ship-systems","crew-manifest","star-chart","lore-codex","ai-npc","story-architect","atmosphere","audio"]'
EOF
```

Every NPC, faction, and quest for this arc is persisted before scene 1 renders.
The GM then calls `tag render scene --style terminal` to generate the opening.

---

## § Worked Example 2: Combat Turn

Batch heredoc showing a contested attack, HP mutation, combat widget, and save:

```bash
tag batch <<'EOF'
  compute contest STR guard_01 as attack_result;
  state set player.hp -3;
  state set guard_01.hp -$attack_result.margin;
  render combat-turn --style terminal;
  save generate
EOF
```

The `as attack_result` label captures the contest output. `$attack_result.margin`
references the margin of victory for the HP delta applied to the NPC.

---

## § Worked Example 3: Social Encounter

Batch heredoc for a CHA-based persuasion, trust mutation, and dialogue render:

```bash
tag batch <<'EOF'
  compute contest CHA merchant_01 as persuasion;
  state set merchant_01.disposition.toward_player +15;
  render dialogue --npc merchant_01 --style station;
  save generate
EOF
```

The `+15` syntax applies a delta rather than an absolute value. The dialogue
renderer reads the NPC's current disposition from state.

---

## § Command Reference

| Command | Subcommands | Key Flags | Example |
|---------|-------------|-----------|---------|
| `tag state` | `get`, `set`, `reset`, `create-npc`, `validate`, `history` | `--tier`, `--name`, `--pronouns`, `--role` | `tag state create-npc nyx_01 --tier nemesis --name "Nyx" --pronouns they/them --role antagonist` |
| `tag compute` | `contest`, `hazard`, `encounter` | None | `tag compute contest WIS spy_03` |
| `tag render` | `scene`, `combat-turn`, `dialogue`, `dice`, `character-creation`, `settings`, `character`, `ticker`, `ship`, `crew`, `codex`, `map`, `starchart`, `footer`, `save-div`, `levelup`, `recap`, `scenario-select` | `--style`, `--npc` | `tag render scene --style parchment` |
| `tag save` | `generate`, `load`, `validate`, `migrate` | None | `tag save generate` |
| `tag batch` | — | `--commands`, `--dry-run` | `tag batch --commands "state get scene; save validate"` |
| `tag rules` | (none), `<category>`, `<keyword>` | None | `tag rules output` |

---

## § Error Guide

| Error | Cause | Fix |
|-------|-------|-----|
| `NPC not found: merchant_01` | NPC not yet created in state | `tag state create-npc merchant_01 --tier rival --name "Merchant" --pronouns she/her --role trader` |
| `No game state found` | State not initialised | `tag state reset` |
| `No visual style set` | Style missing from state | `tag state set visualStyle station` |

---

## § Batch Syntax

- **Inline:** `tag batch --commands "cmd1; cmd2; cmd3"`
- **Heredoc:** `tag batch <<'EOF' ... EOF`
- **Labels:** Append `as label` to capture output; reference with `$label.field`
- **Dry run:** Add `--dry-run` to validate without executing
- Semicolons separate commands. Whitespace around semicolons is ignored.

---

## § Runtime Requirement

The `tag` CLI is the rendering engine for this skill. Module files define game
rules and narrative guidance — they do not contain widget code. If `tag` is
unavailable (Bun not installed, PATH not set), prompt the player to run
`bash setup.sh` via the Bash tool before proceeding. The GM cannot render
widgets without the CLI.
