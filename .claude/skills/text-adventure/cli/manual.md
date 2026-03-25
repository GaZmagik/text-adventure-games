# `tag` CLI — GM Manual

The `tag` CLI provides deterministic computation and rendering for game state,
dice resolution, widget HTML, and save payloads. It eliminates improvisation
errors for NPC stats, contested rolls, CSS styling, and save encoding.

---

## § Quick Start

1. Run `. setup.sh` (once per machine — installs Bun, links `tag`).
2. Run `tag state reset` to initialise a blank game state.
3. You are ready. Use `tag` commands as described below.

---

## § Worked Example 1: Arc Setup (before first scene)

Create ALL NPCs, factions, quests, and state for the entire arc in one batch.
Do NOT create content mid-arc — plan the full cast and structure upfront.

```bash
tag batch --commands "state reset; state set visualStyle terminal; state set theme space; state set scene 1; state set currentRoom bridge; state set time '{\"period\":\"morning\",\"date\":\"Day 1\",\"elapsed\":0,\"hour\":8,\"playerKnowsDate\":false,\"playerKnowsTime\":true,\"calendarSystem\":\"stardate\",\"deadline\":null}'; state set character '{\"name\":\"Rhian\",\"class\":\"Medic\",\"hp\":9,\"maxHp\":9,\"ac\":11,\"level\":1,\"xp\":0,\"stats\":{\"STR\":10,\"DEX\":12,\"CON\":10,\"INT\":14,\"WIS\":16,\"CHA\":10},\"modifiers\":{\"STR\":0,\"DEX\":1,\"CON\":0,\"INT\":2,\"WIS\":3,\"CHA\":0},\"proficiencyBonus\":2,\"proficiencies\":[\"Medicine\",\"Insight\",\"Survival\",\"Perception\"],\"abilities\":[],\"inventory\":[{\"name\":\"Scalpel\",\"type\":\"weapon\",\"slots\":1}],\"conditions\":[],\"currency\":50,\"currencyName\":\"credits\",\"equipment\":{\"weapon\":\"Scalpel\",\"armour\":\"Light Vest\"}}'; state create-npc captain_maro --tier rival --name 'Captain Devlin Maro' --pronouns she/her --role captain; state create-npc fen_achara --tier rival --name 'Fen Achara' --pronouns they/them --role comms; state create-npc hoss_brandt --tier minion --name 'Hoss Brandt' --pronouns he/him --role engineer; state create-npc yuki_tanabe --tier minion --name 'Yuki Tanabe' --pronouns she/her --role navigator; state set factions '{\"survey_corp\":20,\"frontier_guild\":0}'; state set quests '[{\"id\":\"signal-mystery\",\"title\":\"Signal Return\",\"status\":\"active\",\"objectives\":[{\"id\":\"decode\",\"description\":\"Decode the signal\",\"completed\":false}]}]'; state set modulesActive '[\"core-systems\",\"die-rolls\",\"bestiary\",\"save-codex\",\"prose-craft\",\"ship-systems\",\"crew-manifest\",\"star-chart\",\"lore-codex\",\"ai-npc\",\"story-architect\",\"atmosphere\",\"audio\"]'"
```

Every NPC, faction, and quest for this arc is persisted before scene 1 renders.
The GM then calls `tag render scene --style terminal` to generate the opening.

---

## § Worked Example 2: Combat Turn

Batch showing a contested attack, HP mutation, combat widget, and save:

```bash
tag batch --commands "compute contest STR guard_01 as attack_result; state set character.hp -= 3; state set guard_01.hp -= $attack_result.margin; render combat-turn --style terminal; save generate"
```

The `as attack_result` label captures the contest output. `$attack_result.margin`
references the margin of victory for the HP delta applied to the NPC.

---

## § Worked Example 3: Social Encounter

Batch for a CHA-based persuasion, trust mutation, and dialogue render:

```bash
tag batch --commands "compute contest CHA merchant_01 as persuasion; state set merchant_01.disposition.toward_player += 15; render dialogue --data '{\"npc\":\"merchant_01\"}' --style station; save generate"
```

The `+15` syntax applies a delta rather than an absolute value. The dialogue
renderer reads the NPC's current disposition from state.

---

## § Command Reference

| Command | Subcommands | Key Flags | Example |
|---------|-------------|-----------|---------|
| `tag state` | `get`, `set`, `reset`, `create-npc`, `validate`, `history`, `context`, `sync` | `--tier`, `--name`, `--pronouns`, `--role`, `--apply`, `--scene`, `--room` | `tag state create-npc nyx_01 --tier nemesis --name "Nyx" --pronouns they/them --role antagonist` |
| `tag compute` | `contest`, `hazard`, `encounter` | `--dc` (required for hazard) | `tag compute contest WIS spy_03` / `tag compute hazard CON --dc 14` |
| `tag render` | `scene`, `combat-turn`, `dialogue`, `dice`, `character-creation`, `settings`, `character`, `ticker`, `ship`, `crew`, `codex`, `map`, `starchart`, `footer`, `save-div`, `levelup`, `recap`, `scenario-select` | `--style`, `--data` | `tag render scene --style parchment` |
| `tag save` | `generate`, `load`, `validate`, `migrate` | None | `tag save generate` |
| `tag quest` | `complete`, `add-objective`, `add-clue`, `status`, `list` | `--id`, `--desc` | `tag quest complete main_quest_01 find_base` |
| `tag batch` | — | `--commands`, `--dry-run` | `tag batch --commands "state get scene; save validate"` |
| `tag rules` | (none), `<category>`, `<keyword>` | None | `tag rules output` |

### `--data` Flag (render)

The `--data '<json>'` flag passes a JSON object to widget templates for
pre-game configuration or test data overrides. Values in the object are
merged into the template context before rendering.

```bash
tag render dice --data '{"dieType":"d6","roll":4,"outcome":"success"}'
```

---

## § State Schema

The `tag state set` command only permits writes to known top-level keys of the game state. Arbitrary key creation is not allowed — this prevents state corruption from typos or unintended expansion.

If you need to store custom metadata (flags, counters, notes), use the `worldFlags` object — it is a free-form key-value store designed for GM-defined data:

```bash
tag state set worldFlags.quest_accepted true
tag state set worldFlags.tension_level 3
```

---

## § Error Guide

| Error | Cause | Fix |
|-------|-------|-----|
| `NPC not found: merchant_01` | NPC not yet created in state | `tag state create-npc merchant_01 --tier rival --name "Merchant" --pronouns she/her --role trader` |
| `No game state found` | State not initialised | `tag state reset` |
| `No visual style set` | Style missing from state | `tag state set visualStyle station` |
| `Invalid attribute: FOO. Must be one of: STR, DEX, CON, INT, WIS, CHA` | Attribute name is not a valid stat | Use a valid stat name: `tag compute contest STR merchant_01` |
| `Missing required flag: --dc <number>` | `--dc` flag omitted from hazard command | Add the DC: `tag compute hazard CON --dc 14` |
| `NPC not found: nonexistent_npc` | NPC id does not exist in the current roster | Create the NPC first with `tag state create-npc`, or check the id with `tag state get rosterMutations` |

---

## § Batch Syntax

- **Inline:** `tag batch --commands "cmd1; cmd2; cmd3"`
- **Labels:** Append `as label` to capture output; reference with `$label.field`
- **Dry run:** Add `--dry-run` to validate without executing
- Semicolons separate commands. Whitespace around semicolons is ignored.

### Label Reference

When a command is labelled with `as <label>`, its output fields can be
referenced in subsequent commands via `$label.field`.

| Source Command | Field | Description |
|----------------|-------|-------------|
| `compute contest` | `$label.margin` | Absolute difference between totals |
| | `$label.outcome` | `"decisive_success"`, `"narrow_success"`, `"narrow_failure"`, `"failure"`, or `"decisive_failure"` |
| | `$label.roll` | Raw d20 result |
| | `$label.total` | Roll + modifier |
| | `$label.modifier` | Stat modifier used |
| `compute hazard` | `$label.outcome` | `"critical_success"`, `"success"`, `"partial_success"`, `"failure"`, or `"critical_failure"` |
| | `$label.roll` | Raw d20 result |
| | `$label.total` | Roll + modifier |
| | `$label.dc` | Difficulty class |
| `compute encounter` | `$label.roll` | Raw d20 result |
| | `$label.escalation` | Escalation modifier passed via `--escalation` |
| | `$label.encounter` | `"quiet"`, `"alert"`, or `"hostile"` |
| `state get` | `$label` | The retrieved value itself (no sub-fields) |

---

## Prerequisites

The tag CLI requires **Bun** runtime (v1.0+). It uses Bun-specific APIs (`import.meta.dir`, `Bun.file()`) and is not compatible with Node.js.

---

## § Runtime Requirement

The `tag` CLI is the rendering engine for this skill. Module files define game
rules and narrative guidance — they do not contain widget code. If `tag` is
unavailable (Bun not installed, PATH not set), prompt the player to run
`. setup.sh` via the Bash tool before proceeding. The GM cannot render
widgets without the CLI.
