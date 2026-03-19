# Text Adventure Games for Claude

A modular text adventure engine and game system collection for Claude Desktop, built entirely as Claude skills. Play immersive, widget-rendered adventures with full RPG mechanics, procedural generation, and multiple narrative styles.

## What's Included

### Skills

| File | Description | Size |
|------|-------------|------|
| `text-adventure.zip` | Core text adventure engine — orchestrator with 15 modular expansions covering character creation, combat, ship systems, crew management, navigation, procedural world generation, and more. Supports multiple rule systems (d20, GURPS Lite, Pathfinder 2e Lite, Shadowrun 5e Lite, Narrative Engine). | 205 KB |
| `star-wars-eote.zip` | Star Wars: Edge of the Empire — complete FFG narrative dice pool system adapted for 1–5 player text adventure play. Includes 11 core rulebook chapters, 6 sourcebooks, and 5 published adventures. | 450 KB |

### Output Styles

| File | Contents |
|------|----------|
| `output-styles.zip` | Four narrative voice styles that change how the game narrates events without altering game mechanics. |

**Available styles:**

- **Master-Storyteller** — Atmospheric, genre-adaptive GM voice. Writes like a novelist, thinks like a game designer.
- **Noir-Detective** — Hard-boiled, cynical narrator. Rain-soaked prose, moral ambiguity, everyone has an angle.
- **Pulp-Adventure** — Breathless, exclamatory narrator. Larger-than-life heroes, breakneck pacing, cliffhanger endings.
- **Gothic-Horror** — Measured dread and psychological unease. The house is watching. Beauty and decay coexist.

## Installation

### Prerequisites

- [Claude Desktop](https://claude.ai/download) (macOS or Windows)

### Installing Skills

1. Download the `.zip` file(s) you want from this repository.
2. Open **Claude Desktop**.
3. Click **Customise Claude** (the sliders icon in the bottom-left).
4. Under **Skills**, click **Add Skill**.
5. Drag and drop the `.zip` file onto the skill upload area, or click to browse and select it.
6. The skill will appear in your skills list. Repeat for each skill you want to install.

> **Note:** `text-adventure.zip` is the core engine. Install it first. `star-wars-eote.zip` works alongside it for Star Wars-specific adventures.

### Installing Output Styles

1. Download `output-styles.zip` from this repository.
2. Extract the zip — it contains a `.claude/output-styles/` folder with four `.md` files.
3. Open **Claude Desktop**.
4. Click **Customise Claude** (the sliders icon in the bottom-left).
5. Under **Output Styles**, click **Add Style**.
6. Drag and drop each `.md` file individually onto the style upload area, or click to browse and select them.
7. Select your preferred style from the output style picker before starting a conversation.

> **Tip:** You can switch output styles between conversations to experience the same adventure with a completely different narrative voice.

## Getting Started

Once the skills and a style are installed, start a new conversation in Claude Desktop and say:

- **"Play a text adventure"** — starts the core engine with genre/setting selection
- **"Play a Star Wars Edge of the Empire game"** — starts the EotE-specific experience
- **"Run a gothic horror campaign"** — starts the core engine with the Gothic Horror style active

The engine will guide you through settings, character creation, and into the adventure.

## Architecture

The project uses an **orchestrator + modules** pattern:

- **`text-adventure`** is the orchestrator skill — it handles the session lifecycle, widget rendering, core rules, and loads expansion modules on demand.
- **`star-wars-eote`** is a standalone skill with its own complete rule system and content library, designed to work alongside the core engine.
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
