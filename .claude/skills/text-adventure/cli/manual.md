# `tag` CLI — GM Manual

The `tag` CLI provides deterministic computation and rendering for game state,
dice resolution, widget HTML, and save payloads. It eliminates improvisation
errors for NPC stats, contested rolls, CSS styling, and save encoding.

---

## § Quick Start

1. Run `. ./setup.sh` (once per machine — installs Bun, links `tag`).
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

Batch showing a contested attack, HP mutation, sync, combat widget, and save.
NPC fields use `rosterMutations.<index>.<field>` paths (guard_01 is index 0):

```bash
tag batch --commands "compute contest STR guard_01 as attack_result; state set character.hp -= 3; state set rosterMutations.0.hp -= $attack_result.margin; state sync --apply; render combat-turn --style terminal; save generate"
```

The `as attack_result` label captures the contest output. `$attack_result.margin`
references the margin of victory. The `-=` operator applies the delta to the
current value. Sync must run before render.

---

## § Worked Example 3: Social Encounter

Batch for a CHA-based persuasion, disposition mutation, sync, and dialogue render.
NPC disposition is a number — use `+=` to apply a delta:

```bash
tag batch --commands "compute contest CHA merchant_01 as persuasion; state set rosterMutations.0.disposition += 15; state sync --apply; render dialogue --data '{\"npc\":\"merchant_01\"}' --style station; save generate"
```

The `+=` operator adds to the NPC's existing disposition value. Sync must
run before render to pass the sync gate.

---

## § Command Reference

| Command | Subcommands | Key Flags | Example |
|---------|-------------|-----------|---------|
| `tag state` | `get`, `set`, `reset`, `create-npc`, `codex`, `crew`, `ship`, `validate`, `history`, `context`, `schema`, `sync` | `--tier`, `--name`, `--pronouns`, `--role`, `--apply`, `--scene`, `--room` | `tag state ship init --name "Wayfarer"` |
| `tag compute` | `contest`, `hazard`, `encounter`, `levelup` | `--dc` (required for hazard) | `tag compute contest WIS spy_03` / `tag compute hazard CON --dc 14` |
| `tag render` | `scene`, `combat-turn`, `dialogue`, `dice`, `dice-pool`, `character-creation`, `settings`, `character`, `ticker`, `ship`, `crew`, `codex`, `map`, `starchart`, `footer`, `save-div`, `levelup`, `recap`, `scenario-select` | `--style`, `--data` | `tag render scene --style parchment` |
| `tag save` | `generate`, `load`, `validate`, `migrate` | None | `tag save generate` |
| `tag quest` | `complete`, `add-objective`, `add-clue`, `status`, `list` | `--id`, `--desc` | `tag quest complete main_quest_01 find_base` |
| `tag batch` | — | `--commands`, `--dry-run` | `tag batch --commands "state get scene; save validate"` |
| `tag rules` | (none), `<category>`, `<keyword>` | None | `tag rules output` |
| `tag export` | `generate`, `load`, `validate` | None | `tag export generate` / `tag export load /path/to/world.lore.md` |
| `tag build-css` | — | `--output-dir` | `tag build-css` |
| `tag setup` | `apply` | `--settings`, `--character` | `tag setup apply --settings '{...}' --character '{...}'` |

### `--data` Flag (render)

The `--data '<json>'` flag passes a JSON object to widget templates for
pre-game configuration, mixed dice pools, or test data overrides. Values in
the object are merged into the template context before rendering.

```bash
tag render dice --style terminal --data '{"dieType":"d20","stat":"Perception","modifier":5,"dc":16}'
tag render dice-pool --style terminal --data '{"label":"Storm Volley","pool":[{"dieType":"d6","count":2},{"dieType":"d8","count":2},{"dieType":"d10","count":3},{"dieType":"d20","count":1}],"modifier":4}'
```

Notes:
- `dice` renders a single-use 3D die, coin, or d100 widget. The visible result is generated client-side on click, revealed after the settle animation, and then locked.
- `dice-pool` renders grouped numeric dice on one shared canvas. `pool` is an array of `{ "dieType": "...", "count": N }` objects; `label` and `modifier` are optional.
- Scene widgets accept `atmosphereEffects` to scope CSS to specific effects:
  ```bash
  tag render scene --style station --data '{"atmosphereEffects":["dust","rain"]}'
  ```
  Only the named particle effects (plus core utilities like shake/flash/toast) are included. Omitting `atmosphereEffects` includes all atmosphere CSS (backward compatible).

### `tag state sync` Output Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"clean"` \| `"warnings"` | Overall game state health |
| `diff` | object | Pending field changes (scene, room, time) |
| `warnings` | string[] | Validation issues — missing modules, NPC gaps, quest/flag mismatches, compaction alerts |
| `compactionDetected` | boolean | `true` if conversation was compacted since last sync — context may be lost |
| `featureChecklist` | string[] | Active module reminders for the current turn |
| `applied` | boolean | Whether `--apply` was used to persist changes |
| `rollHistoryCount` | number | Total rolls recorded in state |
| `errors` | string[] | Structural validation errors (empty when state is valid) |
| `stateHistoryCount` | number | Undo history depth |

When `compactionDetected` is **true**, re-read all files listed in `modulesActive` before generating the next scene. The warning message includes the specific file paths. Run `tag state context` for the full module digest.

---

## § State Schema

The `tag state set` command only permits writes to allowlisted dot-paths from the game-state schema. Known nested paths such as `time.hour`, `character.hp`, and `quests.0.status` are valid. Unknown nested keys are rejected immediately, so typos cannot create silent schema drift.

If you need to store custom metadata (flags, counters, notes), use the `worldFlags` object — it is the intentional free-form key-value store for GM-defined data:

```bash
tag state set worldFlags.quest_accepted true
tag state set worldFlags.tension_level 3
```

On `tag save load` and `tag export load`, unexpected nested keys outside the allowlisted schema are stripped and returned as warnings. The CLI does not preserve polluted nested state.

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
- Semicolons separate commands. Semicolons inside quoted strings or JSON payloads are preserved.
- Mutating commands run against one in-memory state snapshot, validate after each mutation, and flush once at the end of the batch.

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

## § tag build-css

Extract, minify, and hash CSS from all style `.md` files.

**Usage:** `tag build-css [--output-dir <path>]`

Reads all `styles/*.md` files plus `styles/style-reference.md`, extracts CSS code blocks,
combines theme + structural CSS, minifies, and writes per-style `.css` files to `assets/css/`.
Generates `assets/cdn-manifest.ts` with FNV32 content hashes for cache-busting.

Widget templates call `wrapInShadowDom()` which bootstraps a Shadow DOM root with a `<link>`
to the CDN-hosted CSS file for the active style. This eliminates inline CSS from widget output,
reducing token cost by ~95%.

The CDN base is generated into `assets/cdn-manifest.ts` and points at jsDelivr:
`https://cdn.jsdelivr.net/gh/GaZmagik/text-adventure-games@<ref>/.claude/skills/text-adventure/assets`.
Feature branches use the current branch ref for testing; the final release cut swaps that ref to
the immutable release tag. The `assets/` directory is excluded from the skill zip because those
files are served from the CDN, not bundled into the delivery archive.

Run automatically by `scripts/zip.sh` before building the skill zip.

---

## Prerequisites

The tag CLI requires **Bun** runtime (v1.1.0+). It uses Bun-specific APIs (`import.meta.dir`, `Bun.file()`) and is not compatible with Node.js.

---

## § Runtime Requirement

The `tag` CLI is the rendering engine for this skill. Module files define game
rules and narrative guidance — they do not contain widget code. If `tag` is
unavailable (Bun not installed, PATH not set), prompt the player to run
`. ./setup.sh` via the Bash tool before proceeding. The GM cannot render
widgets without the CLI.
