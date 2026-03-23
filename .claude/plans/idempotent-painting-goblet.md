# v1.3.0 — `tag` CLI: Game Engine Backbone

## Context

The text-adventure skill (v1.2.4, ~19,225 lines across 40 .md files) suffers from three proven hallucination problems when the LLM acts as GM:

1. **CSS hallucination** — the GM invents inline CSS instead of using the style file's pre-defined classes and custom properties
2. **State drift** — NPC stats, trust scores, faction standings drift because the GM tracks them mentally instead of from persisted data. NPC levels were observed being computed at roll time instead of creation time.
3. **Contested roll fabrication** — hidden NPC rolls use improvised modifiers instead of reading from stored stat blocks

The `tag` CLI moves all mechanical operations into deterministic TypeScript code. The GM calls `tag` via bash for state, computation, rendering, and saves. Narrative and creative decisions remain with the LLM.

## Architecture: Four Commands + Batch Mode

```
tag state    — game state CRUD + NPC creation (source of truth)
tag compute  — probabilistic operations reading from state (contested rolls, hazards)
tag render   — deterministic HTML widget generation with real CSS from style files
tag save     — persistence (generate, load, validate, migrate save files)
tag batch    — execute multiple commands in one call (stdin, newline-separated)
```

All output is JSON. Errors include corrective examples. Every command supports `--help` which outputs its usage pattern as JSON.

### Help System
- `tag` (no args) — print top-level help: list of 4 commands + batch, version, state file location
- `tag <command> --help` — print command-specific help: subcommands, required/optional flags, one example per subcommand
- `tag version` — print `{ ok: true, data: { tag: "1.3.0", skill: "1.3.0", bun: "1.3.11", stateFile: "~/.tag/state.json" } }`
- Help output is JSON (consistent with all other output), concise enough that the LLM doesn't waste context tokens reading it

### Output Format
- All commands return JSON: `{ ok: true, data: {...} }` or `{ ok: false, error: { message, corrective } }`
- `tag render` wraps HTML in JSON by default: `{ ok: true, widget: "ticker", html: "<div>...</div>" }`
- `tag render --raw` outputs raw HTML (no JSON wrapper) for direct embedding
- Batch mode always returns JSON regardless of `--raw` on individual render steps

### Style Resolution
- The active visual style is stored in `gmState.visualStyle` (e.g. `"terminal"`)
- Set at game init via `tag state set visualStyle terminal`
- `tag render <widget>` reads from state by default
- `tag render <widget> --style <name>` overrides for a single call
- If neither is set, render returns an error with corrective: `"tag state set visualStyle terminal"`

### State File Location
- Default: `$TAG_STATE_DIR/state.json` where `$TAG_STATE_DIR` defaults to `~/.tag/`
- Env var `TAG_STATE_DIR` overrides the location (useful for sandboxed environments)
- The CLI creates the directory on first write if it doesn't exist
- If the state file is missing, commands that read state return a clear error: `"No game state found. Run: tag state reset"`

### First-Run Experience
- `tag state reset` is the entry point — creates `~/.tag/state.json` with a valid empty gmState (no character, no NPCs, default time, empty factions)
- `setup.sh` runs `bun link` but does NOT auto-run `state reset` (the GM controls when a new game starts)
- The GM Checklist (gm-checklist.md) gains a new "§ CLI Setup" step at the top of the New Game Checklist: "Run `bash setup.sh` if first session. Run `tag state reset` to initialise game state."
- Every command gracefully handles missing state file — returns `{ ok: false, error: { message: "No game state found", corrective: "tag state reset" } }`

### Batch Mode Input on Claude.ai
- Primary method: heredoc via bash tool
  ```bash
  tag batch <<'EOF'
  state get character.stats.STR as player_str
  compute contest STR guard_captain as attack
  state set npc.guard_captain.hp -= $attack.margin
  render combat-turn --style terminal
  save generate
  EOF
  ```
- Alternative: `tag batch --commands "state get character.hp; compute contest CHA merchant_01"` (semicolon-separated, for simple sequences)
- Both produce identical JSON output

## Directory Structure

```
.claude/skills/text-adventure/
  SKILL.md                          (existing — add § CLI Reference section)
  package.json                      (NEW — bin: { "tag": "./cli/tag.ts" })
  setup.sh                          (NEW — installs Bun, runs bun link)
  modules/                          (existing, unchanged)
  styles/                           (existing, unchanged)
  cli/
    tag.ts                          (entry point, shebang #!/usr/bin/env bun, command dispatch, --help, version)
    types.ts                        (all interfaces: GmState, NPC, Command, BatchProtocol)
    help.ts                         (help text generator — JSON-formatted usage for each command)
    commands/
      state.ts                      (get, set, create-npc, validate, reset, history)
      compute.ts                    (contest, hazard, encounter)
      render.ts                     (widget dispatch, CSS injection, template composition)
      save.ts                       (generate, load, validate, migrate)
      batch.ts                      (parse, label/reference resolution, sequential execution)
    data/
      archetypes.ts                 (base stat arrays from character-creation.md)
      bestiary-tiers.ts             (minion/rival/nemesis HP/damage/resistance from bestiary.md)
      dc-tables.ts                  (DC by level, difficulty modifiers from die-rolls.md)
      xp-tables.ts                  (level thresholds, HP gains from core-systems.md)
      faction-thresholds.ts         (standing ranges from core-systems.md)
      contested-pairings.ts         (attribute pairings from die-rolls.md)
    render/
      css-extractor.ts              (parse :root block from style .md files)
      templates/
        scene.ts                    (full scene skeleton with progressive reveal)
        ticker.ts                   (time/date display)
        character.ts                (stat block panel)
        dice.ts                     (3D dice with Three.js CDN)
        ship.ts                     (7-system integrity display)
        crew.ts                     (crew manifest with morale bars)
        codex.ts                    (lore entry browser)
        map.ts                      (geo-map with fog of war)
        starchart.ts                (SVG star chart)
        footer.ts                   (module footer button table)
        save-div.ts                 (hidden save payload div)
        levelup.ts                  (level-up notification)
        recap.ts                    (session recap / "previously on...")
        combat-turn.ts              (parameterised 1v1 / NvM combat)
        dialogue.ts                 (NPC conversation widget)
        settings.ts                 (game settings panel — rulebook, difficulty, pacing, style, modules)
        scenario-select.ts          (scenario selection cards with genre pills)
        character-creation.ts       (archetype selection, stat generation, proficiency picker)
    lib/
      state-store.ts                (JSON file read/write via Bun.file)
      fnv32.ts                      (FNV-1a hash, checksum from save-codex.md)
      dice.ts                       (d4-d20 random, modifier calc)
      modifier.ts                   (floor((stat-10)/2), proficiency bonus)
      validator.ts                  (schema validation for gmState, NPC, saves)
      errors.ts                     (structured error responses with corrective examples)
    manual.md                       (instruction manual for LLM consumption, ~100 lines)
```

**Estimated:** ~42 production files, ~4,200 lines TypeScript + ~100 lines manual.
Colocated `.spec.ts` files for TDD alongside lib/, data/, and commands/ (state, compute, save, batch).
Render templates added to `.tddignore` — tested via integration/e2e instead.

## Implementation Phases

### Phase 0 — Scaffolding
**Files:** package.json, setup.sh, cli/tag.ts, cli/types.ts, cli/help.ts, cli/lib/errors.ts, cli/lib/state-store.ts, cli/lib/modifier.ts
**Why first:** Everything else depends on the entry point, type system, and state store.
- `tag.ts`: shebang + arg dispatch to command handlers. Handles `tag` (no args) → help, `tag version` → version info, `tag <cmd> --help` → command help. Creates `$TAG_STATE_DIR` directory on first write if missing.
- `help.ts`: JSON-formatted help generator. Each command registers its usage pattern (subcommands, required/optional flags, one example each). Top-level help lists all 4 commands + batch + version.
- `types.ts`: GmState interface (mirrors save-codex.md § Full gmState Contract exactly), NPC types (pronouns mandatory), command/batch types
- `state-store.ts`: Bun.file JSON read/write to `$TAG_STATE_DIR/state.json` (env var `TAG_STATE_DIR`, defaults to `~/.tag/`). Returns structured error if state file missing.
- `errors.ts`: `{ ok: false, error: { message, corrective } }` factory

### Phase 1 — `tag state`
**Files:** cli/commands/state.ts, cli/data/archetypes.ts, cli/data/bestiary-tiers.ts, cli/data/faction-thresholds.ts, cli/data/xp-tables.ts, cli/lib/validator.ts
**Why second:** All other commands read from state.
- `state get <dot.path>` — navigate gmState JSON by dot-path
- `state set <dot.path> <value>` — set, increment (`+=`), decrement (`-=`)
- `state create-npc <id> --name <n> --tier <minion|rival|nemesis> --role <r> --pronouns <p>` — generate complete stat block from bestiary tier rules, persist immediately. Pronouns is mandatory (gotcha fix). Stats include: level, all ability scores, modifiers, HP, AC, soak, damage dice, disposition seed.
- `state validate` — check gmState against schema, report issues
- `state reset` — initialise fresh gmState with defaults
- `state history` — return recent state mutations log

**NPC creation rejection:** `tag compute contest CHA guard_01` on an undefined NPC returns:
```json
{"ok":false,"error":{"message":"NPC guard_01 not found in state","corrective":"tag state create-npc guard_01 --tier rival --name \"Guard Captain\" --pronouns he/him --role guard"}}
```

### Phase 2 — `tag compute`
**Files:** cli/commands/compute.ts, cli/lib/dice.ts, cli/data/dc-tables.ts, cli/data/contested-pairings.ts
**Why third:** Depends on state for NPC lookups.
- `compute contest <ATTR> <npc_id>` — look up NPC's opposing attribute modifier from state, roll d20 + modifier, compute margin, determine outcome badge. Write result to `state._lastComputation`.
- `compute hazard <type> --dc <N>` — roll save, apply difficulty modifier
- `compute encounter --escalation <N>` — roll against encounter table

**Key design:** compute NEVER mutates game state beyond `_lastComputation`. The GM decides whether to apply results via `state set`.

### Phase 3 — `tag save`
**Files:** cli/commands/save.ts, cli/lib/fnv32.ts
**Why fourth:** Depends on state + types. Ports existing save-codex.md encoding.
- `save generate` — read gmState, produce SC1:/SF2: save string with FNV-1a checksum. **v1.3.0 uses base64 only (no LZ compression)** — new SF2: header distinguishes from compressed SF1: payloads. LZ compression deferred to v1.3.x.
- `save load <string|file>` — validate checksum, decode (handles both SF1: compressed and SF2: uncompressed), restore gmState
- `save validate <string|file>` — checksum + schema check without loading
- `save migrate <string|file>` — forward migration for version changes (including SF1:→SF2: format upgrade)

### Phase 4 — `tag render`
**Files:** cli/commands/render.ts, cli/render/css-extractor.ts, all 20 template files
**Why fifth:** Depends on state + compute results (_lastComputation).
- `css-extractor.ts` — parse ALL fenced CSS code blocks from style .md files (not just `:root`). Captures custom properties, `@media (prefers-color-scheme: dark)` overrides, `@keyframes` animations, and `@supports` queries. Concatenates into a single `<style>` block.
- Each template: function `(state: GmState | null, css: string, options?) => string` — returns complete HTML including embedded `<script>` blocks with event listeners, Three.js setup, sendPrompt fallback, and panel toggle logic (verbatim from existing .md code blocks).
- `render` command reads `_lastComputation` from state for dice/combat widgets (the compute→render bridge)
- Default output: JSON-wrapped `{ ok: true, widget: "ticker", html: "<div>...</div>" }`
- `--raw` flag: outputs raw HTML string only (no JSON wrapper) for direct embedding
- Style resolution: reads `gmState.visualStyle` by default, `--style <name>` overrides per-call
- Build order: footer.ts + save-div.ts first (composed into other widgets), then pre-game widgets (settings, scenario-select, character-creation — these accept `--data` JSON, work without gmState), then simple widgets (ticker, character), then complex (scene, combat-turn, dice)

**Pre-game widgets:** `settings.ts`, `scenario-select.ts`, and `character-creation.ts` render before game state exists. They accept configuration via `--data '{...}'` JSON argument rather than reading from gmState. After the player confirms character creation, the GM runs `tag state set character <json>` to persist the result.

**CSS extraction is the ONLY runtime .md parsing.** All other game data (stat tables, DC tables, tier rules) is encoded as TypeScript constants in data/ files. This avoids the dual-consumer coupling trap.

### Phase 5 — Batch Mode
**Files:** cli/commands/batch.ts
**Why last:** Depends on all four commands.
- Input: newline-separated commands via stdin or `--batch` flag
- Labels: `compute contest CHA merchant_01 as roll`
- References: `state set npc.merchant_01.trust -= $roll.margin`
- Execution: sequential, continue on failure
- Dry-run: `--dry-run` flag validates all commands without executing
- Response: single JSON with results keyed by label, state_snapshot after all mutations, errors array

Example batch (combat turn):
```
state get character.stats.STR as player_str
compute contest STR guard_captain as attack
state set npc.guard_captain.hp -= $attack.margin
render combat-turn --style terminal
save generate
```

### Phase 6 — Integration
**Files:** SKILL.md (add § CLI Reference), cli/manual.md, modules/gm-checklist.md, module notes

**SKILL.md § CLI Reference (~30 lines):**
- Brief overview: what tag is, the four commands, batch mode
- Points to `cli/manual.md` for full reference
- Inserted between Architecture and Core Mandate sections

**cli/manual.md (~100 lines) — the GM's instruction manual:**
Structure (60/20/20 split):
- **Worked Example 1: New Game Setup** (~15 lines) — `tag state reset` → `tag state set visualStyle terminal` → `tag render settings --data '{...}'` → `tag render scenario-select --data '{...}'` → `tag state create-npc` for starting NPCs → `tag render scene --style terminal`
- **Worked Example 2: Combat Turn** (~15 lines) — batch heredoc showing: state get player stats → compute contest for NPC attack → state set HP mutation → render combat-turn → save generate
- **Worked Example 3: Social Encounter with Contested Roll** (~15 lines) — batch heredoc showing: state get NPC → compute contest CHA → state set trust delta → render dialogue → save generate
- **Command Reference Table** (~20 lines) — four rows (state/compute/render/save), subcommands, required flags, one-line descriptions
- **Error Guide** (~10 lines) — three common errors: NPC not found (run create-npc), no state file (run state reset), style not set (run state set visualStyle)
- **Batch Syntax Quick Reference** (~5 lines) — heredoc template, `as label`, `$label.field`, semicolon alternative

**gm-checklist.md updates:**
- New Game Checklist gains step 0: "Run `bash setup.sh` if first session. Run `tag state reset` to initialise game state."
- Resume from Save Checklist gains step: "Run `tag save load <file>` to restore game state before rendering."
- Die Roll Checklist gains note: "For contested checks, use `tag compute contest <ATTR> <npc_id>` — never invent NPC modifiers."

**Module notes (non-breaking additions):**
- `die-rolls.md` — note on `tag compute contest` for hidden rolls
- `ai-npc.md` — note on `tag state create-npc` for stat persistence
- `save-codex.md` — note on `tag save generate/load/validate`
- `style-reference.md` — note on `tag render` for deterministic HTML

**Build and release:**
- Update zip build to include cli/ (excluding __tests__/)
- Add package.json as 4th version-bump file
- Update release workflow in memory: now bumps 4 files, zip includes .ts files

## Key Design Decisions

1. **Data tables are TypeScript constants, not parsed from .md.** Avoids dual-consumer coupling. Changes to game rules require updating both .md and .ts — conscious trade-off for reliability.

2. **CSS extraction IS runtime .md parsing** (the one exception). 13 style files are purely declarative `:root` blocks. Simple regex extraction. Low risk, avoids duplicating 13 colour palettes.

3. **`_lastComputation` bridges compute→render.** Compute writes to it. Render reads from it. The GM never manually copies numbers between commands.

4. **Pronouns mandatory on NPC creation.** `--pronouns` is a required flag. Enforces the known gotcha.

5. **Zero npm dependencies (with one exception).** FNV-1a ported from save-codex.md. CSS parsing is regex. Dice rolling is trivial. **LZ-String is NOT reimplemented** — v1.3.0 uses base64 encoding only (no LZ compression). Save files are slightly larger but always correct. A new save format version (SF2:) distinguishes uncompressed payloads. LZ compression deferred to v1.3.x — either vendor lz-string (~8kb) or accept one dependency.

6. **State file location:** `$TAG_STATE_DIR/state.json` (env var, defaults to `~/.tag/`). State file includes `_version: 1` field for forward migration between CLI versions.

7. **Graceful degradation.** Tag is an enhancement, not a replacement. All .md files remain fully functional. If tag is unavailable or crashes, the GM falls back to reading .md files directly — exactly as v1.2.4 works. The manual documents this explicitly.

8. **CSS extractor captures ALL CSS**, not just `:root` blocks. Style .md files also contain `@media (prefers-color-scheme: dark)` overrides, `@keyframes` animations, and `@supports` queries. The extractor concatenates all fenced CSS code blocks into a single `<style>` block.

9. **Render templates include embedded `<script>` blocks.** The JS is part of the template string — verbatim from existing .md code blocks. Templates automate the copy-paste pattern, not invent a new architecture. The Three.js die widget, panel toggle listeners, and sendPrompt fallback are all emitted as-is.

10. **GM enforcement is structural, not suggestive.** Module notes use MUST language ("You MUST use `tag compute contest` for hidden rolls"). gm-checklist.md mandates tag calls at specific checkpoints. Manual examples are tested against actual CLI output before shipping.

## Testing Strategy

### TDD — Colocated Spec Files (Red → Green → Refactor)
Tests written FIRST, colocated alongside source files. Run via `bun test`.

**lib/ specs (pure functions, trivially testable):**
- `lib/modifier.spec.ts` — floor((stat-10)/2) edge cases: 8→-1, 10→0, 11→0, 20→+5
- `lib/dice.spec.ts` — d20 range 1-20, modifier application, seeded determinism
- `lib/fnv32.spec.ts` — known hash values from save-codex.md examples
- `lib/state-store.spec.ts` — read/write round-trip, missing file handling, _version check
- `lib/validator.spec.ts` — valid gmState passes, missing fields caught, invalid types rejected
- `lib/errors.spec.ts` — error factory includes corrective field

**data/ specs (constants validation):**
- `data/bestiary-tiers.spec.ts` — minion HP 4-8, rival HP 12-20, nemesis HP 25-40
- `data/dc-tables.spec.ts` — DC values match die-rolls.md tables
- `data/xp-tables.spec.ts` — level thresholds match core-systems.md
- `data/archetypes.spec.ts` — all 6 archetypes have valid stat arrays
- `data/faction-thresholds.spec.ts` — standing ranges cover -100 to +100
- `data/contested-pairings.spec.ts` — all player attributes map to NPC opposing attributes

**commands/ specs:**
- `commands/state.spec.ts` — get dot-path, set with +=/-=, create-npc tier enforcement, validate catches malformed state, reset produces valid default, undefined NPC returns corrective error
- `commands/compute.spec.ts` — contest reads correct NPC modifier from state, hazard applies DC, encounter respects escalation
- `commands/save.spec.ts` — round-trip generate→load, checksum detects single-char corruption, SF2: base64 encoding
- `commands/batch.spec.ts` — label/reference resolution, dry-run catches bad refs, continue-on-failure, state_snapshot in response

**Render templates — .tddignore:**
- All files in `cli/render/templates/` added to `.tddignore`
- Tested via integration tests (see below) not colocated specs

### Integration Tests
- `cli/integration.spec.ts` — runs `tag` as a subprocess via `Bun.spawn`, validates JSON output end-to-end
- Tests: full game setup sequence, combat batch, social encounter batch, render with each of 3-4 representative styles
- CSS extractor: `cli/render/css-extractor.spec.ts` — reads real style .md files, validates all `--ta-*` vars extracted, dark mode overrides present

### Smoke Tests (manual, on Claude.ai)
1. File persistence: write JSON, read it back in next tool call
2. Latency: `bun run cli/tag.ts state reset` — target <2s
3. Full chain: create state → create NPC → compute contest → render scene
4. Batch heredoc: verify heredoc input works in Claude.ai's bash tool

## Verification

After implementation, verify end-to-end:
1. `bash setup.sh` succeeds, `tag` command is available
2. `tag state reset` initialises valid gmState
3. `tag state create-npc merchant_01 --tier rival --name "Greel" --pronouns they/them --role merchant` persists complete stat block
4. `tag compute contest CHA merchant_01` returns margin + outcome using Greel's real WIS modifier
5. `tag render ticker --style terminal` outputs HTML with terminal.md's actual CSS custom properties (not invented ones)
6. `tag save generate` produces valid SC1:/SF2: string that `tag save validate` accepts
7. Batch mode: pipe 5-command combat sequence, get single JSON response
8. Rebuild zip, upload to Claude.ai, play a game — verify the GM uses `tag` commands as instructed
