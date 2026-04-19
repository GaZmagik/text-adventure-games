---
name: text-adventure
description: Interactive text adventure game engine. Triggers on "text adventure", "play a game", "tabletop RPG", "interactive fiction", "dungeon crawl", or any narrative game request. Also for resuming prior sessions. CARDINAL RULE — Do NOT write ANY text in the conversation. No prose, narration, analysis, status updates, check descriptions, DC values, or stat breakdowns. ALL game output goes inside visualize:show_widget. ALL deliberation goes in the thinking tool. The player sees ONLY widgets. Exception — brief responses to out-of-character questions. Do NOT use for creative writing without player agency. Loads modules from modules/ directory as needed.
metadata:
  version: "1.3.0"
---

# Text Adventure Game — Core Engine v1.3.0

## Step 1 — Setup (run once per session via Bash tool)

The skill directory must be copied to a writable location before setup:

```bash
cp -r /mnt/skills/user/text-adventure /home/claude/text-adventure && cd /home/claude/text-adventure && . ./setup.sh && tag state reset && tag style activate
```

To resume from a save file:
```bash
cp -r /mnt/skills/user/text-adventure /home/claude/text-adventure && cd /home/claude/text-adventure && . ./setup.sh && tag save load /mnt/user-data/uploads/<filename>.save.md
```

To load a `.lore.md` adventure file:
```bash
cp -r /mnt/skills/user/text-adventure /home/claude/text-adventure && cd /home/claude/text-adventure && . ./setup.sh && tag export load /mnt/user-data/uploads/<filename>.lore.md
```

## Step 2 — Run `tag help` for the complete workflow

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
| `tag compact restore` | Compaction recovery — clears block, resets freshness epochs, returns recovery steps |

## Cardinal Rules

1. **ALL output inside `visualize:show_widget`** — zero text in conversation. No prose, narration, status updates, or stat breakdowns outside widgets.
2. **ALL widgets rendered via `tag render`** — never hand-code HTML, CSS, or JS. Run commands via the Bash tool.
3. **Widget-to-screen pipeline — follow these steps exactly, in order, every time:**
   1. **Render:** `tag render <widget> --data '<json>' --out /tmp/<widget>.html` — renders HTML and writes it directly to file.
   2. **Verify:** `tag verify <type> /tmp/<widget>.html` — must report `verified: true`. If it fails, fix and re-render. Do NOT hand-edit the file (this invalidates the render-origin hash).
   3. **Read:** `cat /tmp/<widget>.html` — read the ENTIRE file. Not `head`. Not `tail`. Not a partial read. The complete file.
   4. **Show:** Pass the COMPLETE `cat` output as `widget_code` to `show_widget`. Copy it verbatim — do NOT reconstruct from memory, do NOT paraphrase, do NOT abbreviate.
   - If you cannot recall the full `cat` output, run `cat` again. Never guess what the HTML looked like.

   **Scene pipeline — 5 mandatory steps in this exact order:**
   1. **Sync:** `tag state sync --apply --scene <N> --room <id>` — writes the marker that render requires. For scene 1, use `--scene 1`; state is at scene 0 so the verify gate is skipped. **Do NOT skip this step or render will block.**
   2. **Render:** `tag render scene --style <style> --out /tmp/scene.html` — produces a skeleton with `<!-- [NARRATIVE] -->` and `<!-- [BRIEF] -->` placeholders.
   3. **Fill prose placeholders:** Edit ONLY the placeholder comments. Do NOT alter any structural HTML, CSS, or JS. If you find yourself writing `<div>`, `<script>`, or `<style>` tags from scratch, you are doing this wrong — stop and re-render.
   4. **Verify:** `tag verify /tmp/scene.html` — must return `verified: true`. If it detects hand-coded HTML, **discard the file and restart from step 2** — do not attempt to patch hand-coded output.
   5. **Read + Show:** `cat /tmp/scene.html` → `show_widget`.

   **Failure modes:**
   - Render blocked by "State sync required" → run step 1 first, then retry step 2.
   - Verify detects "hand-coded" → discard the HTML. Re-run `tag render scene` and compose into the skeleton.
   - Verify fails on prose → run `tag verify prose /tmp/scene.html` to check prose in isolation and iterate before re-running full verify.
4. **Never auto-resolve player decisions** — die rolls and choices wait for input.
5. **Never advance story without player input** — every scene ends with a choice, roll, or action prompt.
6. **Run `tag state sync` before EVERY scene** — sync returns the prose checklist and key rules inline.
7. **Run `tag verify` before EVERY `show_widget` — if verify FAILS, DO NOT show the widget.** Fix every failure and re-run `tag verify` until it passes. A failed verification is a hard block — never bypass it, never rationalise that the widget is "close enough". Verify checks ALL widget types:
   - `tag verify scenario /tmp/scenario.html` — before showing scenario select
   - `tag verify rules /tmp/settings.html` — before showing settings
   - `tag verify character /tmp/character.html` — before showing character creation
   - `tag verify /tmp/scene.html` — before showing every scene
   - `tag verify <type> /tmp/widget.html` — before showing other widgets such as `dice`, `dice-pool`, `dialogue`, `combat-turn`, `levelup`, `recap`, `arc-complete`, `ticker`, `ship`, `crew`, `codex`, `map`, `starchart`, `footer`, or `save-div`
8. **Run `tag prose-check` + `tag prose-gate` before EVERY scene `show_widget`** — both `tag verify` AND `tag prose-gate` must show their clearance phrase. Neither can be skipped or rationalised away:
   ```
   tag prose-check /tmp/scene.html
   ```
   Follow the `nextStep` from the response exactly:
   - **manual mode** → review prose against each checklist item; address any concerns; then run: `tag prose-gate --manual`
   - **llm mode** → run the `command` string via `claude-code:Bash` (ignore "Tool execution failed" — it executes); then run: `tag prose-gate --llm /tmp/prose-check-result.json`

   Both gates must output their clearance phrase before `show_widget` is permitted. The prose gate is **not advisory** — a failed LLM gate blocks the scene.

   **Gate file mechanics** — `prose-check` writes `/tmp/prose-check.gate` containing the scene hash, deterministic errors, deterministic warnings, and `warningsAcknowledged: false`. `prose-gate` reads this file and behaves as follows:
   - **Errors present** → hard-block regardless of acknowledgement; fix and re-run `prose-check`.
   - **Warnings present, first call** → blocks with the warning list and updates the gate to `warningsAcknowledged: true`; re-run `prose-gate` to proceed.
   - **Warnings present, second call** → warnings acknowledged; gate passes through.
   - **Scene changed** → if the scene HTML hash no longer matches the gate file, `prose-gate` rejects with "scene has changed" — re-run `prose-check` against the updated file.
   - **Successful clearance** → gate file is deleted; a subsequent `prose-gate` call without a fresh `prose-check` will fail.

## Module Architecture

Tier 1 modules load via `tag module activate-tier 1` — this delivers all module content into GM context and gates scene rendering.
Tier 2/3 modules load based on scenario via `tag module activate-tier 2` or `tag module activate <name>`. Run `tag help new-game` for the full tier list.

Visual styles live in `styles/`. Run `tag help scene` for rendering workflow.

## Audio — Acoustic Identity

Every scene has a sonic character. Set it by adding `data-audio-recipe` to the scene root element:

```html
<div class="root" data-audio-recipe="tension" ...>
```

Six named recipes define the ambient texture:

| Keyword | Register | Use when |
|---|---|---|
| `tension` | Low growl, tight stereo | Interrogation, standoff, danger approaching |
| `wonder` | High shimmer, wide stereo | Discovery, ancient ruins, orbital view |
| `dread` | Sub drone, almost still | Void, horror, deep-space silence |
| `calm` | Mid warmth, gentle sway | Safe house, camp, reflection |
| `action` | Percussive pulse, fast LFO | Chase, escape, firefight |
| `mystery` | Narrow bandpass, medium stereo | Investigation, hidden passage, agenda |

Audio starts on first user interaction (click or keypress) and respects `prefers-reduced-motion`. Unknown keywords are silently ignored. See `modules/audio.md` for full recipe parameters and the SoundscapeEngine (player-triggered effects) system.

## SVG Usage

SVG must be used proactively in scenes — not just for maps. Three named patterns to reach for first:

**Porthole viewport** — circular frame clipping a background image or scene illustration:
```html
<svg viewBox="0 0 200 200">
  <defs><clipPath id="port"><circle cx="100" cy="100" r="95"/></clipPath></defs>
  <image href="..." clip-path="url(#port)" width="200" height="200"/>
</svg>
```

**Starfield with proximity distortion** — dots that scale or shift on hover, suggesting depth:
```html
<svg viewBox="0 0 400 400">
  <!-- N circles, r varies by depth layer, CSS :hover scales transform-origin -->
</svg>
```

**Status arc** — SVG arc segment as a health or stamina progress indicator:
```html
<svg viewBox="0 0 100 100">
  <circle class="arc-track" cx="50" cy="50" r="40" fill="none" stroke-width="8"/>
  <circle class="arc-fill" cx="50" cy="50" r="40" fill="none" stroke-width="8"
    stroke-dasharray="251" stroke-dashoffset="63"/>
</svg>
```

**Rules:**
- Every `<svg>` MUST include a `viewBox` attribute — `tag verify` enforces this.
- Prefer inline SVG over `<img src="*.svg">` — inline SVG inherits CSS variables and is scriptable.
- Keep SVG self-contained: no external `href` references to files or URLs.
- SVG is not only for maps — use it for status indicators, atmospheric borders, spatial diagrams, and any data that benefits from scalable vector rendering.
