# Web Components And Worldgen Status

This tracks the implemented follow-up web components that build on the map/worldgen slice.

## Implemented

- `ta-world-preview` via `tag render world-preview --style <style> --data '{"seed":"...","theme":"space"}'`
  - Renders a deterministic generated-world preview with a compact SVG map, seed/theme summary, hooks, and an apply prompt.
- `ta-route-planner` via `tag render route-planner --style <style> --data '{"from":"...","to":"..."}'`
  - Uses `tag map route <from> <to>` logic to show shortest known unlocked routes, blockers, travel time, and supply cost.
- Route overlays inside `ta-map` via `tag render map --data '{"route":{"from":"...","to":"..."}}'`
  - Highlights active route segments directly in the main map surface while leaving `ta-route-planner` as the detailed route view.
- `ta-faction-board` via `tag render faction-board --style <style>`
  - Reads `worldData.factions`, `gmState.factions`, map territories, and codex visibility; locked factions stay unnamed. Visible factions expose inspect prompts.
- `ta-relationship-web` via `tag render relationship-web --style <style>`
  - Builds an SVG graph from NPCs, factions, quests, locations, and faction relations. Nodes expose click/keyboard prompts for inspection or travel review.
- `ta-world-atlas` via `tag render world-atlas --style <style>`
  - Browses generated rooms without revealing hidden room descriptions, loot, encounters, or exits.
- `ta-clue-board` via `tag render clue-board --style <style>`
  - Links discovered quest clues to quests and related locations.
- `tag faction inspect <id>` and `tag quest inspect <id>`
  - Provide CLI inspection surfaces for boards, graph prompts, and manual workflows.
