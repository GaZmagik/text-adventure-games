# Text Adventure Game — Operational Guide

This document is the full reference for the text-adventure skill. The GM accesses
this content via `tag help` commands — it does not need to read this file directly.

## Quick Start

```bash
cd .claude/skills/text-adventure && . ./setup.sh && tag state reset
```

Resume from save:

```bash
cd .claude/skills/text-adventure && . ./setup.sh && tag save load /mnt/user-data/uploads/<file>.save.md
```

## CLI Commands

| Command         | Purpose                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| `tag help`      | Workflow guides: quickstart, new-game, scene                                                              |
| `tag module`    | Load compact module contracts into GM context and populate `_modulesRead`; use `--full` for full markdown |
| `tag state`     | Game state CRUD, NPC creation, sync, context, schema                                                      |
| `tag compute`   | Hidden rolls: contest, hazard, encounter, levelup                                                         |
| `tag render`    | Deterministic HTML widget generation                                                                      |
| `tag save`      | Generate, load, validate, migrate save files                                                              |
| `tag quest`     | Quest lifecycle: create, inspect, track, complete, add-objective, add-clue, status, list                  |
| `tag faction`   | Inspect faction standing, relations, quests, and codex links                                              |
| `tag batch`     | Multiple commands in one call                                                                             |
| `tag rules`     | Quick-reference cheat sheet with file/line refs                                                           |
| `tag export`    | World-sharing via .lore.md files                                                                          |
| `tag verify`    | Validate composed HTML before show_widget                                                                 |
| `tag build-css` | Extract, minify, and hash CDN CSS from style sources                                                      |
| `tag setup`     | Apply settings + character payloads in one step                                                           |
| `tag style`     | Load compact visual style contracts into GM context; use `--full` for full markdown                       |

Run `tag <command> --help` for subcommand details.

## Turn Loop

Every scene follows this sequence. No exceptions.

1. **Sync** — `tag state sync --apply --scene <N> --room <id>`
2. **Load Modules** — Run `tag module activate-tier 1` before scene work. After compaction, use `tag state context` to see which active modules need reloading, then re-run `tag module activate-tier 1` plus any required Tier 2/3 activations.
3. **Render** — `tag render scene --style <style> --data '<json>'` for the compact scene path, or omit fields for manual composition. Keep the Shadow DOM shell/runtime intact.
4. **Compose** — JSON `actions` and `pois` render deterministic cards/buttons. For omitted fields, write narrative into `#narrative` or each `.scene-phase .narrative` block, and add actions/POIs only in the designated scene-content area. Follow `craftGuidance` from render output.
5. **Verify** — `tag verify /tmp/scene.html` — blocks progression until all checks pass.
6. **Post-Scene** — `tag state sync --apply --scene <N+1>` — update HP, XP, flags, quests.

## New Game Setup

1. **Setup** — `. ./setup.sh && tag state reset`
2. **Scenario Select** — `tag render scenario-select --data '<json>'`
3. **Verify Scenario** — `tag verify scenario /tmp/scenario.html` before `show_widget`
4. **Game Settings** — `tag render settings --data '<json>'`
5. **Verify Settings** — `tag verify rules /tmp/settings.html` before `show_widget`
6. **Character Creation** — `tag render character-creation --style <style> --data '<json>'`
7. **Verify Character** — `tag verify character /tmp/character.html` before `show_widget`
8. **Apply Setup Payload** — `tag setup apply --settings '<json>' --character '<json>'`
9. **Read Tier 1 Modules** — `tag module activate-tier 1`
10. **Load Scenario Modules** — `tag module activate-tier 2` or targeted `tag module activate <name>` calls
11. **Opening Scene** — `tag state sync --apply --scene 1 --room <starting_room>` then `tag render scene --style <style>`

## Module Tiers

### Tier 1 — MUST be active before rendering any widget

- `gm-checklist` — Mandatory quality gates
- `prose-craft` — Read EVERY turn. Sentence-level narrative quality
- `core-systems` — HP, stats, inventory, economy, factions, quests, time, XP
- `die-rolls` — Resolution mechanics, dice widgets, DC calibration
- `character-creation` — Archetypes, stat generation, starting equipment
- `save-codex` — Session persistence

### Tier 2 — Load when scenario activates (before opening scene)

`scenarios`, `bestiary`, `story-architect`, `ship-systems`, `crew-manifest`,
`star-chart`, `geo-map`, `procedural-world-gen`, `world-history`, `lore-codex`,
`rpg-systems`, `ai-npc`, `atmosphere`, `audio`, `pre-generated-characters`

### Tier 3 — Load on demand when player triggers

`adventure-exporting`, `adventure-authoring`, `arc-patterns`, `genre-mechanics`

## Visual Styles

| Style             | Best for                               |
| ----------------- | -------------------------------------- |
| Station (default) | Sci-fi, space opera, thriller, mystery |
| Terminal          | Cyberpunk, hacking, military sci-fi    |
| Parchment         | Fantasy, gothic horror, historical     |
| Neon              | Pulp adventure, action, cyberpunk      |
| Brutalist         | Post-apocalyptic, horror, survival     |
| Art Deco          | Noir, 1920s, political intrigue        |
| Ink Wash          | Wuxia, meditation, literary fiction    |
| Blueprint         | Engineering, military, heist           |
| Stained Glass     | Dark fantasy, religious, medieval      |
| SvelteKit         | Contemporary, urban, heist, comedy     |
| Weathered         | Survival, dystopian, dieselpunk        |
| Holographic       | Space opera, far-future, AI themes     |

## Widget Inventory

| Widget             | Command                                                                         | When                           |
| ------------------ | ------------------------------------------------------------------------------- | ------------------------------ |
| Settings           | `tag render settings --data '<json>'`                                           | Game setup                     |
| Scenario Select    | `tag render scenario-select --data '<json>'`                                    | Pre-game                       |
| Character Creation | `tag render character-creation --style <s> --data '<json>'`                     | Pre-game                       |
| Scene              | `tag render scene --style <s> --data '<json>'`                                  | Every scene                    |
| Dice               | `tag render dice --style <s>`                                                   | Single die roll                |
| Dice Pool          | `tag render dice-pool --style <s> --data '<json>'`                              | Mixed/repeated rolls           |
| Combat Turn        | `tag render combat-turn --style <s>`                                            | Combat outcome                 |
| Dialogue           | `tag render dialogue --style <s>`                                               | NPC conversation               |
| Character          | `tag render character --style <s>`                                              | Character sheet                |
| Ship               | `tag render ship --style <s>`                                                   | Ship status                    |
| Crew               | `tag render crew --style <s>`                                                   | Crew manifest                  |
| Codex              | `tag render codex --style <s>`                                                  | Lore codex                     |
| Quest Log          | `tag render quest-log --style <s>`                                              | Objectives, clues, and rewards |
| Map                | `tag render map --style <s> --data '{"route":{"from":"room_a","to":"room_b"}}'` | World map                      |
| World Preview      | `tag render world-preview --style <s> --data '<json>'`                          | Generated-world preview        |
| Route Planner      | `tag render route-planner --style <s> --data '<json>'`                          | Known route planning           |
| Faction Board      | `tag render faction-board --style <s>`                                          | Factions and standing          |
| Relationship Web   | `tag render relationship-web --style <s>`                                       | NPC/faction/quest graph        |
| World Atlas        | `tag render world-atlas --style <s>`                                            | Generated location browser     |
| Clue Board         | `tag render clue-board --style <s>`                                             | Quest clues and links          |
| Star Chart         | `tag render starchart --style <s>`                                              | Navigation                     |
| Ticker             | `tag render ticker --style <s>`                                                 | Clock/time                     |
| Footer             | `tag render footer --style <s>`                                                 | Module-aware footer            |
| Level Up           | `tag render levelup --style <s>`                                                | Level-up celebration           |
| Recap              | `tag render recap --style <s>`                                                  | Session summary                |
| Arc Complete       | `tag render arc-complete --style <s>`                                           | Act boundary / transition      |
| Save Div           | `tag render save-div`                                                           | Save data container            |

## Verification

- `tag verify scenario /tmp/scenario.html` for scenario select
- `tag verify rules /tmp/settings.html` for settings
- `tag verify character /tmp/character.html` for character creation
- `tag verify /tmp/scene.html` for scenes
- `tag verify <widget> /tmp/widget.html` for standalone/in-game widgets such as `dice`, `dice-pool`, `dialogue`, `combat-turn`, `levelup`, `recap`, `arc-complete`, `ticker`, `ship`, `crew`, `codex`, `quest-log`, `map`, `world-preview`, `route-planner`, `faction-board`, `relationship-web`, `world-atlas`, `clue-board`, `starchart`, `footer`, and `save-div`

Every widget should be verified before `show_widget`. Scene verification also gates the next render/sync cycle.

## Scene Structure

Every scene widget contains (inside `#reveal-full` > `#scene-content`):

1. **Location bar** — location name + optional time/date
2. **Atmosphere strip** — 3 sensory pills (at least one non-visual)
3. **Narrative block(s)** — `#narrative` or `.scene-phase .narrative`, second person, present tense
4. **Points of interest** — optional `data-poi` buttons that share the scene POI budget
5. **Action buttons** — 2-5 choices via `data-prompt`, no right/wrong labels
6. **Status bar** — HP pips, AC, and level when character state exists
7. **Footer** — panel toggles (pure JS) + save/export/audio actions
8. **Scene metadata** — hidden `#scene-meta` div with JSON

## Session Lifecycle

```
[Scenario Select] → [Settings] → [Character Creation] → [Opening Scene]
  → [Explore/Decide] → [Roll] → [Outcome] → [State Update]
  → [Next Scene] → ... → [Level Up] → [Climax]
  → [Arc Conclusion] → [Continue | Save | Export | New Game]
  → [Arc Transition] → [New Arc Opening] → ...
```

## Arithmetic

Never compute arithmetic in prose — use `echo "expression" | bc` via Bash tool.

## Optional: Claude Code integration (LLM prose review)

By default, `tag prose-check` runs in **manual mode** — the GM self-reviews against a checklist. For independent LLM review (harder gate, no conflict of interest), configure `tag` to use a live `claude -p` subprocess via the Claude Code MCP server.

### One-time setup

**Mac / Linux** — add to `~/.config/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "claude-code": { "command": "claude", "args": ["mcp", "serve"] }
  }
}
```

**Windows (WSL)** — add to `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "claude-code": { "command": "wsl", "args": ["bash", "-lc", "claude mcp serve"] }
  }
}
```

### Activation

Once Claude Code MCP is connected, run once per campaign:

```
tag settings prose llm
```

Subsequent `tag prose-check` calls output a ready-to-run `claude -p` command. Execute it via `claude-code:Bash` (ignore "Tool execution failed" — it runs server-side). Then pass the result to `tag prose-gate --llm /tmp/prose-check-result.json`.

### Degradation

If Claude Code MCP is not connected, `tag settings prose manual` reverts to checklist mode. No game-breaking behaviour either way.

## Bun Runtime

The tag CLI requires Bun (`Bun.file()`, `import.meta.dir`). `setup.sh` installs it.
Tests: `bun test`. Type check: `bun run typecheck`.
