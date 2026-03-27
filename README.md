# Text Adventure Games for Claude

A modular text adventure engine for Claude, built entirely as Claude skills. Works on both **claude.ai** and **Claude Desktop**. Play immersive, widget-rendered adventures with full RPG mechanics, procedural generation, and multiple narrative styles.

## What's Included

### Skill

| File | Description |
|------|-------------|
| `text-adventure.zip` | Core text adventure engine — orchestrator with 23 modular expansions covering character creation, combat, ship systems, crew management, navigation, procedural world generation, prose craft, atmosphere, audio, and more. Supports multiple rule systems (d20, D&D 5e, GURPS Lite, Pathfinder 2e Lite, Shadowrun 5e Lite, SWRPG Narrative Dice, Narrative Engine). Full save persistence for story threads, ship damage, crew morale, map state, and time tracking. |

### Output Styles

Five narrative voice styles that change how the game narrates events without altering game mechanics. Browse the `.claude/output-styles/` folder to find them.

### Visual Styles

12 visual CSS themes that change how the game looks — colours, typography, borders, and animations — without altering game logic. Found in `.claude/skills/text-adventure/styles/`.

| Style | Identity |
|-------|----------|
| **Station** (default) | Serif narrative + monospace mechanics, semantic colours, dark navy |
| **Terminal** | CRT monospace, electric accents, scanline effects |
| **Parchment** | Warm serif, paper grain, earth tones, drop caps |
| **Neon** | Saturated colours, glow effects, synthwave aesthetic |
| **Brutalist** | System fonts only, black/white/red, zero decoration |
| **Art Deco** | Gold/navy/jade, geometric serif, engraved buttons |
| **Ink Wash** | Near-monochrome, generous whitespace, vermillion seal |
| **Blueprint** | Graph-paper grid, blue/white, technical drawing |
| **Stained Glass** | Jewel tones, leaded borders, radial luminance |
| **SvelteKit** | Light-mode first, Svelte orange accent, system fonts, component cards |
| **Weathered** | Rust/olive, asymmetric padding, distressed feel |
| **Holographic** | Translucent panels, iridescent borders, glassmorphism |

The game engine selects a visual style during setup based on the genre, or the player can choose manually.

- **Master-Storyteller** — Atmospheric, genre-adaptive GM voice. Writes like a novelist, thinks like a game designer.
- **Noir-Detective** — Hard-boiled, cynical narrator. Rain-soaked prose, moral ambiguity, everyone has an angle.
- **Pulp-Adventure** — Breathless, exclamatory narrator. Larger-than-life heroes, breakneck pacing, cliffhanger endings.
- **Gothic-Horror** — Measured dread and psychological unease. The house is watching. Beauty and decay coexist.
- **Sci-Fi-Narrator** — Literary sci-fi voice inspired by Banks, Le Guin, and Chambers. Scale and intimacy coexist.

## Installation

### Prerequisites

- [claude.ai](https://claude.ai) (web) or [Claude Desktop](https://claude.ai/download) (macOS or Windows)

### Installing the Skill

#### claude.ai (web)

1. Download `text-adventure.zip` from this repository.
2. Open **claude.ai** in your browser.
3. Click **Customise Claude** (the sliders icon in the sidebar).
4. Under **Skills**, click **Add Skill**.
5. Upload the `.zip` file.

#### Claude Desktop

1. Download `text-adventure.zip` from this repository.
2. Open **Claude Desktop**.
3. Click **Customise Claude** (the sliders icon in the bottom-left).
4. Under **Skills**, click **Add Skill**.
5. Drag and drop the `.zip` file onto the skill upload area, or click to browse and select it.

### Upgrading to a New Version

If you already have an older version of the skill installed:

1. **Save your current game** — click the Save button in-game to generate a `.save.md` file.
   Download it. Your progress is safe.
2. **Download the new `text-adventure.zip`** from the
   [GitHub releases page](https://github.com/GaZmagik/text-adventure-games/releases).
3. **Upload the new zip** — in Claude Desktop or claude.ai, go to **Customise Claude** >
   **Skills** and upload the new `.zip`. When prompted, choose to **replace** the existing
   skill.
4. **Verify the version** — check the skill section shows the updated version number.
5. **Start a new conversation** — upload or paste your `.save.md` file and say
   "Resume my adventure from this save file." Your character, world, and progress
   will be restored.

> **Note:** Saves are forward-compatible. A save from any earlier version will load in v1.3.0 —
> new features (arcs, NPC pronouns/stats, story threads, ship state, crew morale, map state,
> time tracking) will activate automatically with sensible defaults.

### Installing Output Styles

1. Navigate to the `.claude/output-styles/` folder in this repository.
2. Open the `.md` file for the style you want (e.g., `Gothic-Horror.md`).
3. Copy the entire contents of the file.
4. In **claude.ai** or **Claude Desktop**, click **Customise Claude**.
5. Under **Output Styles**, click **Add Style**.
6. Paste the contents and save.

> **Tip:** You can switch output styles between conversations to experience the same adventure with a completely different narrative voice.

## Getting Started

Once the skill and a style are installed, start a new conversation and say:

- **"Play a text adventure"** — starts the engine with genre/setting selection
- **"Run a gothic horror campaign"** — starts with the Gothic Horror style active
- **"Play a space adventure"** — starts a sci-fi themed game
- **Upload a `.lore.md` file** — starts a pre-authored adventure with full world history and story structure
- **Upload a `.save.md` file** — resumes a previous session from a saved checkpoint

The engine will guide you through settings, character creation, and into the adventure.

## Architecture

The project uses an **orchestrator + modules** pattern:

- **`text-adventure`** is the orchestrator skill — it handles the session lifecycle, widget rendering, core rules, and loads expansion modules on demand.
- **`tag` CLI** (v1.3.0+) is the rendering engine — a TypeScript/Bun tool that produces deterministic HTML widgets from game state. Eight commands: `state`, `compute`, `render`, `save`, `batch`, `rules`, `quest`, `export`. Zero npm dependencies.
- **Output styles** are independent rendering layers — they change the narrative voice, pacing, and prose craft without touching game logic or mechanics.

All game output is rendered inside `visualize:show_widget` panels. No plain text output — everything is styled, interactive, and widget-based.

- **`.lore.md` files** are authored adventures — upload one to start a pre-crafted campaign with world history, NPC roster, and branching story beats.
- **`.save.md` files** are portable save states — download one during play, upload it later to resume exactly where you left off.

## Output Style Comparison

| Aspect | Master-Storyteller | Noir-Detective | Pulp-Adventure | Gothic-Horror | Sci-Fi-Narrator |
|--------|-------------------|----------------|----------------|---------------|-----------------|
| Tone | Confident, atmospheric | Tired, cynical | Breathless, bold | Measured, unsettling | Intelligent, humane, curious |
| Pacing | Varies by scene | Investigation-driven | Always forward | Deliberately slow | Multiple timescales simultaneously |
| Failure | Complication | Data point | Dramatic escalation | Revelation | Systemic, not personal |
| Success | Earned competence | Relief | Triumphant | Temporary, uneasy | Competence within constraints |
| Humour | Permitted, not default | Dry, observational | Banter and absurdity | Gallows only | Wry, observational |
| Opening | Specific moment | Mid-complication | Explosion | Beauty that curdles | A specific moment in a lived-in world |
| Ending | Epilogue by implication | Unanswered question | Hook for next adventure | Door left ajar | Gestures at futures never seen |
