---
name: text-adventure
description: Interactive text adventure game engine. Triggers on "text adventure", "play a game", "tabletop RPG", "interactive fiction", "dungeon crawl", or any narrative game request. Also for resuming prior sessions. CARDINAL RULE — Do NOT write ANY text in the conversation. No prose, narration, analysis, status updates, check descriptions, DC values, or stat breakdowns. ALL game output goes inside visualize:show_widget. ALL deliberation goes in the thinking tool. The player sees ONLY widgets. Exception — brief responses to out-of-character questions. Do NOT use for creative writing without player agency. Loads modules from modules/ directory as needed.
metadata:
  version: "1.3.0"
---

# Text Adventure Game — Core Engine v1.3.0

## Step 0 — Setup (run once per session via Bash tool)

The skill directory must be copied to a writable location before setup:

```bash
cp -r /mnt/skills/user/text-adventure /home/claude/text-adventure && cd /home/claude/text-adventure && . ./setup.sh && tag state reset
```

To resume from a save file:
```bash
cp -r /mnt/skills/user/text-adventure /home/claude/text-adventure && cd /home/claude/text-adventure && . ./setup.sh && tag save load /mnt/user-data/uploads/<filename>.save.md
```

To load a `.lore.md` adventure file:
```bash
cp -r /mnt/skills/user/text-adventure /home/claude/text-adventure && cd /home/claude/text-adventure && . ./setup.sh && tag export load /mnt/user-data/uploads/<filename>.lore.md
```

## Step 1 — Run `tag help` for the complete workflow

```bash
tag help
```

All operational guides, checklists, and rules are delivered via CLI commands:

| Command | What it returns |
|---------|-----------------|
| `tag help` | Quick-start workflow, turn loop, command summary, cardinal rules |
| `tag help new-game` | Step-by-step new game setup: scenario select through opening scene |
| `tag help scene` | Scene composition workflow, prose checklist, density guidance, scene structure |
| `tag state sync` | Pre-scene validation — returns prose checklist and rendering rules inline |
| `tag rules` | Quick-reference cheat sheet of all 20+ game rules |

## Cardinal Rules

1. **ALL output inside `visualize:show_widget`** — zero text in conversation. No prose, narration, status updates, or stat breakdowns outside widgets.
2. **ALL widgets rendered via `tag render`** — never hand-code HTML, CSS, or JS. Run commands via the Bash tool.
3. **Never auto-resolve player decisions** — die rolls and choices wait for input.
4. **Never advance story without player input** — every scene ends with a choice, roll, or action prompt.
5. **Run `tag state sync` before EVERY scene** — sync returns the prose checklist and key rules inline.
6. **Run `tag verify` before EVERY `show_widget`** — verify checks ALL widget types:
   - `tag verify scenario /tmp/scenario.html` — before showing scenario select
   - `tag verify rules /tmp/settings.html` — before showing settings
   - `tag verify character /tmp/character.html` — before showing character creation
   - `tag verify /tmp/scene.html` — before showing every scene

## Module Architecture

Tier 1 modules (MUST be active): `gm-checklist`, `prose-craft`, `core-systems`, `die-rolls`, `character-creation`, `save-codex`.
Tier 2/3 modules load based on scenario. Run `tag help new-game` for the full tier list.

Visual styles live in `styles/`. Run `tag help scene` for rendering workflow.
