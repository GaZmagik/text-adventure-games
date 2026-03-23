# `tag` CLI — GM Manual

The `tag` CLI provides deterministic computation and rendering for game state,
dice resolution, widget HTML, and save payloads. It eliminates improvisation
errors for NPC stats, contested rolls, CSS styling, and save encoding.

---

## § Quick Start

1. Run `bash setup.sh` (once per machine — installs Bun, links `tag`).
2. Run `tag state reset` to initialise a blank game state.
3. You are ready. Use `tag` commands as described below.

---

## § Worked Example 1: New Game Setup

Full command sequence from blank state to first scene:

```bash
tag batch --commands "\
  state reset; \
  state set visualStyle terminal; \
  state set theme space; \
  state set difficulty standard; \
  state set seed pale-threshold-7; \
  state create-npc guard_01 --tier grunt --name 'Dock Guard' --pronouns he/him --role guard; \
  state create-npc maren_voss --tier rival --name 'Dr Maren Voss' --pronouns she/her --role scientist; \
  render scene --style terminal"
```

Each command executes sequentially. The final `render scene` reads the populated
state and the `terminal.md` style file to produce self-contained HTML.

---

## § Worked Example 2: Combat Turn

Batch heredoc showing a contested attack, HP mutation, combat widget, and save:

```bash
tag batch <<'EOF'
  compute contest STR guard_01 as attack_result;
  state set player.hp -3;
  state set guard_01.hp -$attack_result.margin;
  render combat-turn --style terminal;
  save generate
EOF
```

The `as attack_result` label captures the contest output. `$attack_result.margin`
references the margin of victory for the HP delta applied to the NPC.

---

## § Worked Example 3: Social Encounter

Batch heredoc for a CHA-based persuasion, trust mutation, and dialogue render:

```bash
tag batch <<'EOF'
  compute contest CHA merchant_01 as persuasion;
  state set merchant_01.disposition.toward_player +15;
  render dialogue --npc merchant_01 --style station;
  save generate
EOF
```

The `+15` syntax applies a delta rather than an absolute value. The dialogue
renderer reads the NPC's current disposition from state.

---

## § Command Reference

| Command | Subcommands | Key Flags | Example |
|---------|-------------|-----------|---------|
| `tag state` | `get`, `set`, `reset`, `create-npc`, `validate`, `history` | `--tier`, `--name`, `--pronouns`, `--role` | `tag state create-npc nyx_01 --tier boss --name "Nyx" --pronouns they/them --role antagonist` |
| `tag compute` | `contest`, `hazard`, `encounter` | `--advantage`, `--disadvantage` | `tag compute contest WIS spy_03` |
| `tag render` | `scene`, `combat-turn`, `dialogue`, `die-roll`, `character-creation`, `settings`, `panel` | `--style`, `--npc` | `tag render scene --style parchment` |
| `tag save` | `generate`, `load`, `validate`, `migrate` | `--mode compact\|full` | `tag save generate --mode compact` |
| `tag batch` | — | `--commands`, `--dry-run` | `tag batch --commands "state get scene; save validate"` |

---

## § Error Guide

| Error | Cause | Fix |
|-------|-------|-----|
| `NPC not found: merchant_01` | NPC not yet created in state | `tag state create-npc merchant_01 --tier rival --name "Merchant" --pronouns she/her --role trader` |
| `No game state found` | State not initialised | `tag state reset` |
| `No visual style set` | Style missing from state | `tag state set visualStyle station` |

---

## § Batch Syntax

- **Inline:** `tag batch --commands "cmd1; cmd2; cmd3"`
- **Heredoc:** `tag batch <<'EOF' ... EOF`
- **Labels:** Append `as label` to capture output; reference with `$label.field`
- **Dry run:** Add `--dry-run` to validate without executing
- Semicolons separate commands. Whitespace around semicolons is ignored.

---

## § Fallback

If `tag` is unavailable (Bun not installed, PATH not set, or running in an
environment without CLI access), the GM reads `.md` files directly and performs
all computation manually — exactly as v1.2.4 works. The CLI is an accelerator,
not a dependency. All module files remain the authoritative source of truth.
