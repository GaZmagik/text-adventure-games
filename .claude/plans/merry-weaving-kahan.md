# Plan: Determinism Gap Closure — tag CLI v1.3.0

## Context

The text adventure skill's GM (Claude on claude.ai) loses module content after conversation compaction, causing rule drift and non-deterministic state management. A 6-agent deliberation concluded: **don't add more CLI commands to remember — make state management invisible**. This plan closes the mechanical determinism gaps with zero-friction automation and post-compaction recovery.

**Principle:** If a value affects a dice roll outcome, it must flow through the CLI. If it only affects prose, it's the GM's creative domain.

**Platform constraint:** Skill targets Claude Desktop/claude.ai — no Claude Code hooks available.

---

## Phase 0: Type Foundation

All other phases depend on this. Must come first.

**`cli/types.ts`:**
- Make `RollRecord.stat`, `.modifier`, `.total`, `.dc` optional (encounter_roll lacks these)
- Expand `RollOutcome` union: add `'quiet' | 'alert' | 'hostile'` (encounter outcomes)
- Add `LevelupResult` type to `ComputationResult` discriminated union
- Add `'levelup_result'` to `RollType`

**`cli/lib/constants.ts`:**
- Add `KNOWN_MODULES` — 23 module filenames as const tuple
- Add `TIER1_MODULES` — 6 always-load modules as const tuple

**Tests:** constants.spec.ts — KNOWN_MODULES length, TIER1_MODULES subset check

---

## Phase 0.5: SKILL.md amendments

**Why:** The CLI improvements are only as good as the instructions that trigger them. Post-compaction, the GM doesn't know it's degraded. The SKILL.md must contain hard rules that survive in the system prompt and force the GM to call recovery commands.

**`SKILL.md`** (~15 lines of additions):
- **Per-scene hard rule** (add to Step 0 / CLI section): "At the start of every scene, run `tag state sync`. No exceptions. This checks module context, quest/worldFlag consistency, level-up eligibility, and pending computation. Run it before `tag render scene`."
- **Post-compaction rule** (add to architecture / module loading section): "If you cannot see the full contents of any module file listed in `modulesActive`, run `tag state context` and re-read every file in the `required` output. The `moduleDigest` field shows what each module requires — if your last widget is missing any of these features, you have lost context."
- **Per-render rule** (add to widget render section): "Every `tag render` output includes a `featureChecklist`. Before writing narrative content into the widget, verify every checklist item is present in the widget structure."

**`modules/gm-checklist.md`** (~10 lines of additions):
- Add `tag state sync` as Step 1 of the New Scene Checklist (before reading prose-craft)
- Add `tag state context` as Step 1 of the Resume from Save Checklist (after save load)
- Add `tag state sync` to Post-Scene Verification as the final step

**Tests:** None (documentation-only changes)

---

## Phase 1: Auto-append rollHistory from compute

**Why:** `rollHistory` is declared in GmState but NEVER populated. GM must manually record rolls. After compaction, they don't.

**`cli/commands/compute.ts`** (~15 lines):
- After each contest/hazard/encounter computation, build `RollRecord` and push to `state.rollHistory`
- `saveState()` already caps at MAX_ROLL_HISTORY (50) — no extra cap needed
- Contest: stat, roll, modifier, total, outcome (no dc)
- Hazard: stat, roll, modifier, total, dc, outcome
- Encounter: roll, outcome only (stat/modifier/total/dc omitted)

**Tests:** compute.spec.ts — 8 tests (append per type, correct fields, cap behaviour)

---

## Phase 2: Persist _stateHistory in saves

**Why:** Audit trail is session-only. On resume, GM has no record of WHY state is what it is.

**`cli/commands/save.ts`** (~5 lines):
- Line 84: Remove `_stateHistory` from destructuring exclusion (keep `_lastComputation` excluded)
- Line 150: Don't reset `_stateHistory = []` on load — preserve from save, cap at MAX_STATE_HISTORY
- Trade-off: ~5KB save size increase. Acceptable.

**Tests:** save.spec.ts — 3 tests (round-trip, cap on load, _lastComputation still excluded)

---

## Phase 3: Invariant enforcement in validateState

**Why:** The Security-Auditor agent said it best: "The audit trail is a false sense of security. It tells you what mutations happened, not whether the world is still coherent."

**`cli/lib/validator.ts`** (~80 lines):
- **Upgrade warnings to errors:** `hp < 0`, `maxHp <= 0`, `hp > maxHp` — impossible states should be rejected
- **NPC ID uniqueness:** Duplicate IDs in rosterMutations produce error
- **rollHistory validation:** Entries checked for valid RollType and StatName (warnings)
- **modulesActive validation:** Unknown module names produce warnings (uses KNOWN_MODULES)

**`cli/commands/save.ts`** — HP clamping on load (migration path for existing saves with hp < 0):
```
state.character.hp = Math.max(0, Math.min(state.character.hp, state.character.maxHp))
```

**Tests:** validator.spec.ts — 10 tests (hp bounds, NPC uniqueness, rollHistory, modulesActive)

---

## Phase 4: `tag state context` command

**Why:** After compaction, GM needs to know which modules to re-read. Currently: no mechanism. Critically, the GM doesn't know it's lost context — it silently degrades by copying recent widget output instead of re-reading specs.

**`cli/commands/state.ts`** (~40 lines):
- New subcommand: `tag state context`
- Reads `modulesActive` from state, maps to file paths
- Outputs:
  - `required`: array of module file paths the GM should have in context
  - `tier1`: always-load modules that should always be present
  - `missing_hint`: flags missing Tier 1 modules
  - `moduleDigest`: a map of module name → one-line implementation requirement, e.g.:
    - `"audio"`: `"Web Audio API soundscape: oscillator + noise layers + play/stop button in footer"`
    - `"atmosphere"`: `"Atmosphere pill strip: 3-5 sensory phrases in .atmosphere-strip div"`
    - `"prose-craft"`: `"Read EVERY turn. Sentence-level narrative quality rules."`
  - The digest provides enough detail to make the GM realise its current implementation is incomplete — not just "re-read audio.md" but what audio.md actually requires

**`cli/data/module-digests.ts`** (NEW FILE, ~50 lines):
- A const record mapping module names to one-line implementation summaries
- Sourced from reading each module's key requirements
- Used by `tag state context` and `tag render` (Phase 5)

**Tests:** state.spec.ts — 6 tests (paths, tier1, missing detection, digest present, no state, empty modulesActive). module-digests.spec.ts (NEW) — 2 tests (every KNOWN_MODULES entry has a digest, every digest entry has a corresponding module file on disk — catches stale digests)

---

## Phase 5: Render-time module checklist

**Why:** Every render should remind the GM what modules should be in context. Runs per-turn. After compaction, the GM silently degrades by copying recent widget output — the render output must include enough spec detail to break this pattern.

**`cli/commands/render.ts`** (~30 lines):
- Add `modulesRequired: string[]` to render output (all widget types, not just scene)
- Always includes `modules/prose-craft.md`
- Maps `state.modulesActive` to file paths
- Add `featureChecklist: string[]` — a list of expected widget features based on active modules, e.g.:
  - `"audio ON → scene must include Web Audio soundscape with play/stop button"`
  - `"atmosphere ON → scene must include .atmosphere-strip div with 3-5 sensory pills"`
  - `"prose-craft ON → re-read modules/prose-craft.md this turn"`
- Uses `MODULE_DIGESTS` from `data/module-digests.ts` (Phase 4) to generate the checklist
- This turns the render output into a mini-spec that survives in the conversation even after compaction

**Tests:** render.spec.ts — 6 tests (modulesRequired present, prose-craft always included, correct paths, featureChecklist present, featureChecklist includes audio when active, non-scene widget)

---

## Phase 6: `tag compute levelup`

**Why:** XP thresholds exist in data tables but level-ups are manual. GM forgets thresholds after compaction.

**`cli/commands/compute.ts`** (~50 lines):
- New subcommand: `tag compute levelup`
- Reads `character.xp` and `character.level`, checks against `XP_THRESHOLDS`
- If eligible: increments level, applies `LEVEL_REWARDS[newLevel].hpGain`, stores in `_lastComputation`
- If not: returns current XP, next threshold, XP needed
- Does NOT append to rollHistory (not a roll)

**Tests:** compute.spec.ts — 9 tests (eligible, hp gain, improvement text, insufficient XP, max level, no character, _lastComputation, not in rollHistory, state persistence)

---

## Phase 7: `tag quest` convenience commands

**Why:** Playtest data from a 10-scene campaign showed quest objectives fell behind worldFlags after Scene 3. Root cause: worldFlags are a flat key-value store (cheap to update), quest objectives require nested array surgery (expensive). Under cognitive load, the GM abandoned the expensive path. The quest array showed `investigate-ship: false` even after `core_chip_recovered: true` was in worldFlags.

**`cli/commands/quest.ts`** (NEW FILE, ~120 lines):
- New top-level command: `tag quest <subcommand>`
- Subcommands:
  - `tag quest complete <quest-id> <objective-id>` — marks a single objective as completed (surgical update, no full array rewrite)
  - `tag quest add-objective <quest-id> --id <obj-id> --desc "text"` — appends a new objective to an existing quest
  - `tag quest add-clue <quest-id> "clue text"` — appends a clue string to a quest's clues array
  - `tag quest status [quest-id]` — returns quest progress summary (completed/total objectives, clue count)
  - `tag quest list` — returns all quests with completion percentages
- Each mutation calls `recordHistory()` and `saveState()`
- **Two-way worldFlags binding:** `tag quest complete <quest-id> <obj-id>` also sets `worldFlags["quest:<questId>:<objId>:complete"] = true`. When all objectives for a quest are complete, also sets `worldFlags["quest:<questId>:complete"] = true`. This makes the quest/worldFlag cross-validation in Phase 8 deterministic (canonical flag names) rather than heuristic (pattern matching). Removes Risk 7 from the risks section.
- Validation: quest-id must exist, objective-id must exist for complete, no duplicates

**`cli/tag.ts`** (~3 lines):
- Add `quest` to the top-level command dispatch (alongside state, compute, render, save, batch, rules)

**`cli/types.ts`** — No changes needed; `Quest` and `QuestObjective` types already exist

**Tests:** quest.spec.ts (NEW FILE) — 12 tests (complete objective, complete sets canonical worldFlag, completing final objective sets quest-level worldFlag, add objective, add clue, status output, list output, missing quest-id, missing objective-id, duplicate clue handling, full round-trip, state persistence)

---

## Phase 8: `tag state sync`

**Why:** This is the highest-value single change. Automates the Post-Scene Verification checklist from gm-checklist.md. One command per scene instead of 5-10 manual state mutations.

**`cli/commands/state.ts`** (~100 lines):
- New subcommand: `tag state sync [--apply] [--scene N] [--room id] [--time json]`
- Dry-run by default: shows diff of expected changes (scene increment, room, time)
- `--apply` flag: applies all mutations atomically
- Checks:
  - Pending computation not in rollHistory
  - Missing Tier 1 modules
  - **Quest/worldFlag cross-validation** — reads canonical `quest:<questId>:<objId>:complete` flags in worldFlags (set by Phase 7's two-way binding) and verifies the corresponding quest objective is marked complete in the quests array. Also checks the reverse: if a quest objective is complete but no canonical worldFlag exists, warns that `tag quest complete` was not used. Flags mismatches as warnings, suggests running `tag quest complete` to fix — does NOT auto-resolve (the GM may have set the worldFlag intentionally via `tag state set`).
  - **Level-up eligibility** — checks `character.xp` against thresholds and warns if level-up is available but not applied
  - **NPC creation gaps** — checks if any NPC IDs referenced in worldFlags (pattern: `npc_<id>_*`) don't have a corresponding entry in rosterMutations. Flags as warnings.
  - **Feature degradation check** — compares active modules against `MODULE_DIGESTS` and outputs a `featureChecklist` (same format as Phase 5 render output) listing what each active module requires. This is the primary anti-compaction measure: even if module files have been evicted from context, the sync output tells the GM exactly what features should be present in the next widget. Since `tag state sync` is called per-scene (Phase 0.5 hard rule), this checklist fires at every scene transition regardless of render type — covering roll widgets, dialogue panels, and other non-scene renders that Phase 5 alone would miss.
- **Output structure** — top-level `status: 'clean' | 'warnings' | 'errors'` field. When clean, output is minimal: `{ status: 'clean', scene: 7, warnings: 0 }`. When dirty, detail sections expand with actionable items. This prevents the GM from ignoring a wall of "ok" lines after every scene transition.
- **`--apply` behaviour** — warnings allow apply to proceed (stale quest, missing module); errors block apply (HP invariant violation, invalid state). A scene increment shouldn't be prevented by a stale quest objective, but an impossible HP state must block.
- Returns: status, diff, warnings, errors, featureChecklist, applied status, rollHistory/stateHistory counts
- **Distinction from Phase 5:** `featureChecklist` (Phases 5/8) is the WHAT ("audio ON → include soundscape"). `requiredElements` (Phase 11) is the DOM-level HOW (`<button id='audio-toggle'>` in footer). Intent vs implementation — complementary layers, not redundant.

**Tests:** state.spec.ts — 12 tests (diff output, stale scene, apply succeeds with warnings, apply blocked by errors, dry run, pending computation, module verification, quest/worldFlag canonical mismatch, reverse direction mismatch, levelup warning, NPC reference gap, no state)

---

## Phase 9: Fix `tag state create-npc` parsing + error messages

**Why:** During the playtest, NPC creation for Maren Dray and Cpl. Reng failed with "Missing --name flag" despite `--name` being present. The likely root cause is the flag parser (`cli/lib/args.ts`) silently dropping flags when values contain spaces or flags appear in unexpected order — not just a messaging issue but a code bug.

**`cli/lib/args.ts`** (~20 lines — audit + fix):
- Audit `parseArgs()` for multi-word flag value handling: does `--name "Maren Dray"` work? Does `--name Maren Dray` (unquoted) consume both words or just "Maren"?
- Audit flag ordering: does the parser require `--name` before `--tier`, or is order-independent?
- Fix: ensure flags with quoted multi-word values parse correctly. If the shell splits `"Maren Dray"` into two tokens before reaching the parser, the parser must rejoin them or the SKILL.md must document the quoting requirement clearly.
- Add defensive handling: if a known flag (--name, --pronouns, --tier, --role) is followed by another flag token instead of a value, produce a clear error: `"--name requires a value. Usage: --name 'Maren Dray'"`

**`cli/commands/state.ts`** (~10 lines):
- Improve `handleCreateNpc` error messages to state which flag was invalid and what format is expected
- Add examples in corrective hints: `--pronouns "she/her"` (with quotes), `--tier rival` (valid values: minion, rival, nemesis)
- If `--name` is missing but other flags are present, suggest quoting: `"Did you mean --name 'Multi Word Name'?"`

**Tests:** args.spec.ts — 5 new tests (multi-word flag value, unquoted multi-word, flag ordering, flag without value, flag followed by another flag). state.spec.ts — 3 tests (clear error for bad pronouns, clear error for bad tier, helpful corrective message for missing name)

---

## Phase 10: State schema versioning

**Why:** The plan includes one migration (HP clamping on load), but doesn't establish a pattern for future migrations. If v1.4.0 changes the state shape, saves from v1.3.0 need a migration path. Five lines now saves a painful retrofit later.

**`cli/types.ts`** (~2 lines):
- Add `_schemaVersion: string` to GmState (e.g., `'1.3.0'`)
- Set in `createDefaultState()` in state-store.ts

**`cli/lib/state-store.ts`** (~3 lines):
- Set `_schemaVersion` to current skill version in `createDefaultState()`

**`cli/commands/save.ts`** (~15 lines):
- On load: read `_schemaVersion` from payload (or default to `'1.2.0'` if missing)
- Run migrations sequentially: if `< '1.3.0'`, apply HP clamping and any other v1.3.0 shape changes
- Future-proof pattern: a `migrations` array of `{ from: string, apply: (state) => void }` that runs in order

**`cli/lib/constants.ts`** (~1 line):
- Add `SCHEMA_VERSION = '1.3.0' as const`

**Tests:** save.spec.ts — 3 tests (missing version defaults to 1.2.0, migration applies HP clamp, current version round-trips cleanly)

---

## Phase 11: Widget structural skeleton in render output

**Why:** The single largest source of post-compaction degradation was widget structure — the GM reconstructed 200+ line HTML/CSS/JS widgets from memory, losing features with each copy. Audio buttons, atmosphere strips, panel containers, and action cards were silently dropped. The featureChecklist (Phases 5/8) warns about this, but a structural skeleton prevents it.

**`cli/commands/render.ts`** (~20 lines):
- Add `requiredElements: string[]` to the render output — a list of DOM element descriptions that MUST be present in the widget:
  - `"<div class='atmosphere-strip'> with 3-5 sensory pills"` (if atmosphere active)
  - `"<button id='audio-toggle'> play/stop in footer"` (if audio active)
  - `"<div class='footer-row'> with buttons per modulesActive"` (always)
  - `"<div id='scene-meta' data-meta='...'> hidden JSON"` (always for scene)
  - `"<div class='action-cards'> with 3-4 player choices"` (for scene)
- Sourced from `MODULE_DIGESTS` element requirements (extend module-digests.ts to include expected DOM elements per module)
- This is a checklist the GM can mechanically verify against the widget output — it catches structural omissions before the widget is sent to the player

Additionally, extend the render templates to output a **structural HTML skeleton** as a separate field in the render output — the complete DOM scaffolding (CSS classes, panel structure, footer buttons, audio placeholder, atmosphere strip, action card container) WITHOUT narrative prose. The GM fills in narrative content but cannot accidentally drop structural elements.

**`cli/commands/render.ts`** (~40 additional lines for skeleton generation):
- Add `skeleton: string` to scene render output — the full HTML structure with placeholder comments where prose goes
- Generated from the same template that produces the full HTML, but with narrative content replaced by `<!-- [NARRATIVE: brief description] -->` markers
- **Style-agnostic:** The skeleton uses semantic class names (`scene-atmosphere`, `scene-footer`, `scene-actions`, `scene-audio-toggle`) that map to any visual theme. The GM's CSS (from `--style`) maps these semantic names to themed styling. This ensures the skeleton survives a theme change — it describes structure, not presentation.
- Other widget types (dice, character, settings) don't need skeletons — they're fully data-driven already

**Tests:** render.spec.ts — 6 tests (requiredElements present, includes atmosphere when active, includes audio when active, skeleton is valid HTML, skeleton contains placeholder markers, skeleton preserves all structural classes)

---

## Dependency Order

```
Phase 0 (types + constants)
  │
  ├── Phase 0.5 (SKILL.md amendments) ── independent, do alongside Phase 0
  │
  ├── Phase 1 (rollHistory auto-append)      ─┐
  ├── Phase 2 (save _stateHistory)            │
  ├── Phase 3 (invariant enforcement)         │ can parallelise
  ├── Phase 4 (state context + digests)       │
  ├── Phase 5 (render modulesRequired)        │
  ├── Phase 6 (compute levelup)              ─┘
  │
  ├── Phase 7 (quest commands) ── independent
  │
  ├── Phase 8 (state sync) ── depends on 1, 2, 4, 7
  │
  ├── Phase 9 (create-npc parsing) ── independent
  ├── Phase 10 (schema versioning) ── independent
  └── Phase 11 (widget element checklist) ── depends on 4 (module-digests.ts)
```

---

## Summary

| Phase | File(s) | Lines | Tests |
|-------|---------|-------|-------|
| 0 | types.ts, constants.ts | ~30 | 2 |
| 0.5 | SKILL.md, gm-checklist.md | ~25 | 0 |
| 1 | compute.ts | ~15 | 8 |
| 2 | save.ts | ~5 | 3 |
| 3 | validator.ts, save.ts | ~80 | 10 |
| 4 | state.ts, module-digests.ts (NEW) | ~90 | 8 |
| 5 | render.ts | ~30 | 6 |
| 6 | compute.ts | ~50 | 9 |
| 7 | quest.ts (NEW), tag.ts | ~140 | 12 |
| 8 | state.ts | ~110 | 12 |
| 9 | args.ts, state.ts | ~30 | 8 |
| 10 | types.ts, state-store.ts, save.ts, constants.ts | ~21 | 3 |
| 11 | render.ts, module-digests.ts, 23 module .md files | ~80 | 6 |
| **Total** | **13+ files** | **~706 lines** | **87 tests** |

Final test count: ~586 (499 existing + 87 new)

---

## Verification

1. `npx tsc --noEmit` — zero errors
2. `bun test` — all ~586 tests pass
3. Manual smoke test: `tag compute contest STR npc_01` → verify rollHistory auto-appended
4. Manual smoke test: `tag save generate` → `tag save load` → verify _stateHistory survives and _schemaVersion round-trips
5. Manual smoke test: `tag state context` → verify module paths, digest, and missing Tier 1 warnings
6. Manual smoke test: `tag compute levelup` → verify level increment and HP gain
7. Manual smoke test: `tag quest complete empty-stool find-attacker` → verify surgical update + worldFlag auto-set
8. Manual smoke test: `tag quest status empty-stool` → verify progress summary with completion percentage
9. Manual smoke test: `tag state sync` → verify diff, featureChecklist, quest/worldFlag mismatch warnings, levelup eligibility
10. Manual smoke test: `tag state sync --apply` → verify atomic mutations
11. Manual smoke test: `tag state create-npc test_npc --name "Multi Word Name" --tier rival --pronouns "she/her" --role scout` → verify multi-word parsing works
12. Manual smoke test: `tag render scene --style station` → verify modulesRequired, featureChecklist, requiredElements in output
13. Verify SKILL.md contains "run `tag state sync` every scene" hard rule
14. Verify gm-checklist.md has `tag state sync` in New Scene and Post-Scene checklists
15. Rebuild zip via `./scripts/zip.sh` — verify no .spec.ts in archive

---

## Risks

1. **HP warning→error upgrade breaks existing saves with hp < 0** — Mitigated by hp clamping on save load (Phase 3) and schema versioning migration runner (Phase 10)
2. **RollRecord optional fields** — Strict TS already forces null checks everywhere
3. **Encounter outcomes ('quiet'/'alert'/'hostile') expand RollOutcome** — No exhaustive switches exist in codebase
4. **state sync complexity** — Kept deliberately simple: diff + apply, no HTML parsing. Quest/worldFlag cross-validation uses canonical flag names from Phase 7's two-way binding (deterministic, not heuristic)
5. **GM adoption** — Phase 0.5 adds hard rules to SKILL.md ("run `tag state sync` every scene, no exceptions"). Phases 4+5 put module info directly in render/sync output. Quest commands reduce friction. The gap between "CLI can do this" and "GM will call it" is closed by SKILL.md instructions, not hope.
6. **New top-level command (quest)** — Adds to the command surface but replaces a harder workflow (manual JSON surgery), so net cognitive load decreases. Surfaced in `tag --help` and `tag state sync` warnings.
7. **Module digest staleness** — `<!-- digest: ... -->` comments in each module `.md` file are the **source of truth**. `module-digests.ts` must match them. Workflow: update the module `.md` comment first, then sync `module-digests.ts`. The verification test (Phase 4) reads each module file's `<!-- digest: ... -->` comment and compares it against the corresponding entry in `module-digests.ts` — catching both missing files AND content drift. If someone updates the module but forgets `module-digests.ts`, the test fails.
8. **Schema versioning is minimal** — Phase 10 establishes the pattern (`_schemaVersion` + migration runner) but only includes one migration (HP clamping). Future versions add migrations to the array. Risk is low — establishing the pattern is the hard part.
9. **Widget skeleton adds render output size** — Phase 11's `skeleton` field duplicates the widget structure without prose. Adds ~1-2KB per scene render. Acceptable trade-off for preventing structural degradation post-compaction.
