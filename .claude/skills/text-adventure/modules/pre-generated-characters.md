# Pre-Generated Characters — Ready-Made Adventurers for Quick Starts
> Optional module for text-adventure orchestrator. Offers three ready-made characters alongside the custom creation path.

This module enhances the character-creation flow by presenting three pre-built characters
that are theme-appropriate, mechanically valid, and distinct in role. A fourth "Create your own"
option preserves the full custom archetype/name/proficiency workflow.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: character-creation module.

---

## § CLI Commands for This Module

| Action | Command | Tool |
|--------|---------|------|
| Generate pre-built characters | `tag compute pregen --theme <theme> --rulebook <rulebook>` | Run via Bash tool |

---

## Two Operating Modes

### Generic Scenario Mode

When no authored characters exist, generate three ready-made characters from:
- **theme** — drives archetype naming and flavour
- **tone** — influences hook severity and gear style
- **rulebook** — determines stat generation method and derived values
- **active modules** — may add domain-specific gear or abilities

### Authored-World Mode

If a `.lore.md` file defines `pre-generated-characters` in its frontmatter, those entries
take priority over generated characters. The module passes them through to the character
creation widget without modification. `Create your own` remains available by default.

**Precedence order:**
1. Authored characters from `.lore.md` frontmatter
2. Generated characters from this module
3. Default custom-only flow (module inactive)

---

## Character Shape

Each pre-generated character (authored or generated) must include:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | Theme-appropriate name |
| `class` | string | yes | Archetype or class label |
| `pronouns` | string | yes | e.g. she/her, he/him, they/them |
| `hook` | string | yes | One sentence linking character to scenario pressure |
| `background` | string | no | Short paragraph of backstory |
| `stats` | object | yes | Six ability scores: STR, DEX, CON, INT, WIS, CHA |
| `hp` | number | yes | Starting hit points |
| `ac` | number | yes | Armour class |
| `proficiencies` | string[] | yes | Skill or tool proficiencies |
| `startingInventory` | array | no | Items with name, type, effect, description |
| `abilities` | string[] | no | Special abilities or features |
| `startingCurrency` | number | no | Starting gold/credits |
| `openingLens` | string | no | Authored-world only — scene framing hint |
| `prologueVariant` | string | no | Authored-world only — prologue selection |

---

## Generation Rules

### Archetype Contrast

Generate exactly three characters with clear role distinction:
- **Physical / Survivor** — high STR or CON, frontline gear, survival-oriented hook
- **Technical / Investigator** — high INT or WIS, tools or knowledge, puzzle-oriented hook
- **Social / Support** — high CHA or WIS, diplomatic gear, relationship-oriented hook

### Distinctiveness Constraints

Each generated set must differ across:
- primary stat emphasis (no two characters share the same highest stat)
- proficiency focus
- first-scene problem orientation
- gear emphasis

### Stat Generation

Use the same method as the character-creation module for the active rulebook:
- D&D 5e: fixed base arrays per archetype with 1d4 bonus on two non-primary stats
- Other systems: adapt to rulebook stat ranges and modifier formulae

### Determinism

Generation should be reproducible from `seed + theme` when a seed is set on state.
When no seed is set, per-render variation is acceptable.

### Fallback

If generation inputs are too thin (no theme, no tone):
- use the existing six archetypes from character-creation as the source pool
- pick three that maximise contrast
- generate simple but recognisable hooks and names

---

## Integration with Character Creation Widget

This module feeds data into the existing character-creation widget. It does not replace the widget.

When the GM reaches character setup:
1. Check if authored `.lore.md` provides `pre-generated-characters` entries
2. Else check if this module is active and generate three characters
3. Else show the default custom-only creation flow

The widget receives:
- `preGeneratedCharacters`: array of character objects (authored or generated)
- `allowCustom`: boolean (default `true`)
- `characterOrigin`: set to `"pregen"` or `"custom"` on confirm

The confirm payload remains compatible with `setup apply` — pre-generated picks send the
full character payload; custom characters still go through inference and normalisation.

---

## When to Activate

- Activate for new players who want to start quickly without building a character
- Activate for authored worlds that ship curated starting characters
- Leave inactive for campaigns where character creation is part of the experience
- This module is Tier 2 — loaded on demand, not forced for every game
