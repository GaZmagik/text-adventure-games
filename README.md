# Text Adventure Games for Claude

A modular text adventure engine for Claude Desktop, built entirely as Claude skills. Play immersive, widget-rendered adventures with full RPG mechanics, procedural generation, and multiple narrative styles.

## What's Included

### Skill

| File | Description |
|------|-------------|
| `text-adventure.zip` | Core text adventure engine — orchestrator with 15 modular expansions covering character creation, combat, ship systems, crew management, navigation, procedural world generation, and more. Supports multiple rule systems (d20, GURPS Lite, Pathfinder 2e Lite, Shadowrun 5e Lite, Narrative Engine). |

### Output Styles

Four narrative voice styles that change how the game narrates events without altering game mechanics. Browse the `.claude/output-styles/` folder to find them.

- **Master-Storyteller** — Atmospheric, genre-adaptive GM voice. Writes like a novelist, thinks like a game designer.
- **Noir-Detective** — Hard-boiled, cynical narrator. Rain-soaked prose, moral ambiguity, everyone has an angle.
- **Pulp-Adventure** — Breathless, exclamatory narrator. Larger-than-life heroes, breakneck pacing, cliffhanger endings.
- **Gothic-Horror** — Measured dread and psychological unease. The house is watching. Beauty and decay coexist.

## Installation

### Prerequisites

- [Claude Desktop](https://claude.ai/download) (macOS or Windows)

### Installing the Skill

1. Download `text-adventure.zip` from this repository.
2. Open **Claude Desktop**.
3. Click **Customise Claude** (the sliders icon in the bottom-left).
4. Under **Skills**, click **Add Skill**.
5. Drag and drop the `.zip` file onto the skill upload area, or click to browse and select it.

### Installing Output Styles

1. Navigate to the `.claude/output-styles/` folder in this repository.
2. Open the `.md` file for the style you want (e.g., `Gothic-Horror.md`).
3. Copy the entire contents of the file.
4. In **Claude Desktop**, click **Customise Claude**.
5. Under **Output Styles**, click **Add Style**.
6. Paste the contents and save.

> **Tip:** You can switch output styles between conversations to experience the same adventure with a completely different narrative voice.

## Getting Started

Once the skill and a style are installed, start a new conversation in Claude Desktop and say:

- **"Play a text adventure"** — starts the engine with genre/setting selection
- **"Run a gothic horror campaign"** — starts with the Gothic Horror style active
- **"Play a space adventure"** — starts a sci-fi themed game

The engine will guide you through settings, character creation, and into the adventure.

## Architecture

The project uses an **orchestrator + modules** pattern:

- **`text-adventure`** is the orchestrator skill — it handles the session lifecycle, widget rendering, core rules, and loads expansion modules on demand.
- **Output styles** are independent rendering layers — they change the narrative voice, pacing, and prose craft without touching game logic or mechanics.

All game output is rendered inside `visualize:show_widget` panels. No plain text output — everything is styled, interactive, and widget-based.

## Output Style Comparison

| Aspect | Master-Storyteller | Noir-Detective | Pulp-Adventure | Gothic-Horror |
|--------|-------------------|----------------|----------------|---------------|
| Tone | Confident, atmospheric | Tired, cynical | Breathless, bold | Measured, unsettling |
| Pacing | Varies by scene | Investigation-driven | Always forward | Deliberately slow |
| Failure | Complication | Data point | Dramatic escalation | Revelation |
| Success | Earned competence | Relief | Triumphant | Temporary, uneasy |
| Humour | Permitted, not default | Dry, observational | Banter and absurdity | Gallows only |
| Opening | Specific moment | Mid-complication | Explosion | Beauty that curdles |
| Ending | Epilogue by implication | Unanswered question | Hook for next adventure | Door left ajar |

## Licence

This project is provided for personal use with Claude Desktop.
