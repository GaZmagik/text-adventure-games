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

| Command | Purpose |
|---------|---------|
| `tag help` | Workflow guides: quickstart, new-game, scene |
| `tag state` | Game state CRUD, NPC creation, sync, context, schema |
| `tag compute` | Hidden rolls: contest, hazard, encounter, levelup |
| `tag render` | Deterministic HTML widget generation |
| `tag save` | Generate, load, validate, migrate save files |
| `tag quest` | Quest lifecycle: complete, add-objective, add-clue, status, list |
| `tag batch` | Multiple commands in one call |
| `tag rules` | Quick-reference cheat sheet with file/line refs |
| `tag export` | World-sharing via .lore.md files |
| `tag verify` | Validate composed HTML before show_widget |
| `tag build-css` | Extract, minify, and hash CDN CSS from style sources |

Run `tag <command> --help` for subcommand details.

## Turn Loop

Every scene follows this sequence. No exceptions.

1. **Sync** — `tag state sync --apply --scene <N> --room <id>`
2. **Read Modules** — Re-read prose-craft.md every turn. Re-read all Tier 1 modules from `tag state context`.
3. **Render** — `tag render scene --style <style>` — do NOT modify the html output.
4. **Compose** — Write narrative into the `#narrative` div. Follow `craftGuidance` from render output.
5. **Verify** — `tag verify /tmp/scene.html` — blocks progression until all checks pass.
6. **Post-Scene** — `tag state sync --apply --scene <N+1>` — update HP, XP, flags, quests.

## New Game Setup

1. **Setup** — `. ./setup.sh && tag state reset`
2. **Scenario Select** — `tag render scenario-select --data '<json>'`
3. **Game Settings** — `tag render settings --data '<json>'` — every choice in sendPrompt payload
4. **Character Creation** — `tag render character-creation --style <style> --data '<json>'`
5. **Read Tier 1 Modules** — `tag state context` then read every listed file
6. **Opening Scene** — `tag state sync --apply --scene 1` then `tag render scene --style <style>`

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
`rpg-systems`, `ai-npc`, `atmosphere`, `audio`

### Tier 3 — Load on demand when player triggers
`adventure-exporting`, `adventure-authoring`, `arc-patterns`, `genre-mechanics`

## Visual Styles

| Style | Best for |
|-------|----------|
| Station (default) | Sci-fi, space opera, thriller, mystery |
| Terminal | Cyberpunk, hacking, military sci-fi |
| Parchment | Fantasy, gothic horror, historical |
| Neon | Pulp adventure, action, cyberpunk |
| Brutalist | Post-apocalyptic, horror, survival |
| Art Deco | Noir, 1920s, political intrigue |
| Ink Wash | Wuxia, meditation, literary fiction |
| Blueprint | Engineering, military, heist |
| Stained Glass | Dark fantasy, religious, medieval |
| SvelteKit | Contemporary, urban, heist, comedy |
| Weathered | Survival, dystopian, dieselpunk |
| Holographic | Space opera, far-future, AI themes |

## Widget Inventory

| Widget | Command | When |
|--------|---------|------|
| Settings | `tag render settings --data '<json>'` | Game setup |
| Scenario Select | `tag render scenario-select --data '<json>'` | Pre-game |
| Character Creation | `tag render character-creation --style <s> --data '<json>'` | Pre-game |
| Scene | `tag render scene --style <s>` | Every scene |
| Dice | `tag render dice --style <s>` | Single die roll |
| Dice Pool | `tag render dice-pool --style <s> --data '<json>'` | Mixed/repeated rolls |
| Combat Turn | `tag render combat-turn --style <s>` | Combat outcome |
| Dialogue | `tag render dialogue --style <s>` | NPC conversation |
| Character | `tag render character --style <s>` | Character sheet |
| Ship | `tag render ship --style <s>` | Ship status |
| Crew | `tag render crew --style <s>` | Crew manifest |
| Codex | `tag render codex --style <s>` | Lore codex |
| Map | `tag render map --style <s>` | World map |
| Star Chart | `tag render starchart --style <s>` | Navigation |
| Ticker | `tag render ticker --style <s>` | Clock/time |
| Footer | `tag render footer --style <s>` | Module-aware footer |
| Level Up | `tag render levelup --style <s>` | Level-up celebration |
| Recap | `tag render recap --style <s>` | Session summary |
| Save Div | `tag render save-div` | Save data container |

## Scene Structure

Every scene widget contains (inside `#reveal-full` > `#scene-content`):

1. **Location bar** — location name + scene number
2. **Atmosphere strip** — 3 sensory pills (at least one non-visual)
3. **Narrative block** — second person, present tense
4. **Points of interest** — 2-3 examine buttons via sendPrompt
5. **Action buttons** — 2-5 choices via sendPrompt, no right/wrong labels
6. **Status bar** — HP pips, XP progress, inventory tags, conditions
7. **Footer** — panel toggles (pure JS) + module buttons (sendPrompt)
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

## Bun Runtime

The tag CLI requires Bun (`Bun.file()`, `import.meta.dir`). `setup.sh` installs it.
Tests: `bun test`. Type check: `bun run typecheck`.
