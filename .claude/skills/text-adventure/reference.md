# Text Adventure — Implementation Reference

> **This file is mandatory reading before rendering any widget.**
> The orchestrator (SKILL.md) defines rules and inlines the critical patterns (progressive
> reveal, panel toggle, PANEL_DATA). This file provides supplementary implementation code:
> panel CSS, scene skeleton, and loading messages.

---

## Panel Styling — CSS

Use `#panel-overlay` (ID selector) to match the HTML element.

```css
#panel-overlay { display: none; padding: 0; }
.panel-header {
  display: flex; align-items: baseline; justify-content: space-between;
  padding-bottom: 10px; margin-bottom: 12px;
  border-bottom: 0.5px solid var(--color-border-tertiary);
}
.panel-title {
  font-family: 'Syne', 'Segoe UI', system-ui, sans-serif;
  font-size: 18px; font-weight: 600; color: var(--color-text-primary);
}
.panel-close-btn {
  font-family: 'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 11px; letter-spacing: 0.08em;
  background: transparent; border: 0.5px solid var(--color-border-tertiary);
  border-radius: var(--border-radius-md); padding: 8px 14px;
  min-height: 44px; min-width: 44px; box-sizing: border-box;
  color: var(--color-text-tertiary); cursor: pointer;
}
.panel-close-btn:hover { border-color: var(--color-border-secondary); color: var(--color-text-secondary); }
.panel-content { display: none; }
```

---

## Scene Widget — HTML Skeleton

This is a structural guide, not a rigid template. Claude generates the full markup
dynamically for each scene. The key requirements are:
- `id="panel-overlay"` and `id="scene-content"` for the panel toggle system.
- `id="reveal-brief"` and `id="reveal-full"` for progressive reveal.
- Panel toggle buttons use `onclick="togglePanel('...')"` — never `sendPrompt()`.
- The `↗` suffix on footer buttons indicates `sendPrompt()` (currently only Save).

### Canonical Scene Footer

The scene footer is defined once here and must not be redefined in module files.
Every scene widget includes this footer outside the progressive reveal wrapper.

**Structure:**
- **Left side:** Panel toggle buttons — one per loaded module panel. Only render
  buttons for modules active in the current session. Use `onclick="togglePanel('...')"`.
- **Right side:** Save button using `data-prompt` + `addEventListener` pattern.
  Label: `Save ↗` (the `↗` suffix indicates `sendPrompt()`).

**Available panel buttons (render only when the corresponding module is loaded):**
- `Character` — always present (core)
- `Codex` — lore-codex module
- `Ship` — ship-systems module
- `Crew` — crew-manifest module
- `Nav chart` — star-chart module
- `Map` — geo-map module
- `Quests` — core-systems module (if quest tracking is active)

**Rule: Panel widgets are overlays, not standalone pages.** Crew manifest, ship
status, codex, and other panel widgets are overlays opened from footer buttons.
They have their own Close button that returns to the scene. They do **not** have
their own footer — the scene footer remains underneath. Module widget files
(ship-systems, crew-manifest, lore-codex, etc.) define the overlay content and
Close button only; the scene footer is not their responsibility.

```html
<div class="root">
  <!-- Progressive reveal wrapper -->
  <div id="reveal-brief">
    <p class="brief-text">Brief confirmation text</p>
    <button class="continue-btn" onclick="...">Continue</button>
  </div>
  <div id="reveal-full" style="display:none">
    <div id="scene-content">
      <!-- loc-bar, atmo-strip, narrative (id="narrative"), POIs, actions, status bar -->
    </div>
    <div id="panel-overlay" style="display:none">
      <div class="panel-header">
        <span class="panel-title"></span>
        <button class="panel-close-btn" onclick="closePanel()">Close</button>
      </div>
      <div class="panel-content" data-panel="character"></div>
      <div class="panel-content" data-panel="codex"></div>
      <div class="panel-content" data-panel="ship"></div>
      <div class="panel-content" data-panel="nav"></div>
    </div>
  </div>
  <!-- Footer (always visible, outside reveal) -->
  <div class="footer-row">
    <button class="footer-btn" onclick="togglePanel('character')">Character</button>
    <!-- Add per active module: -->
    <!-- <button class="footer-btn" onclick="togglePanel('codex')">Codex</button> -->
    <!-- <button class="footer-btn" onclick="togglePanel('ship')">Ship</button> -->
    <!-- <button class="footer-btn" onclick="togglePanel('nav')">Nav chart</button> -->
    <!-- <button class="footer-btn" onclick="togglePanel('map')">Map</button> -->
    <!-- <button class="footer-btn" onclick="togglePanel('quests')">Quests</button> -->
    <!-- <button class="footer-btn" data-prompt="Save the game.">Save ↗</button> -->
  </div>
</div>
```

**Note:** Widget types not templated here (die roll, character creation, settings, scenario
select, map, combat, outcome, level-up, death/down) are generated dynamically by the GM
following the rules in SKILL.md. They do not need fixed templates — Claude builds them fresh
each time, following the structural and visual rules defined in the orchestrator.

---

## Die Roll Guidance

### Die Roll Variety

Use all six attributes across the adventure — not just the player's primary stats. A high-DEX
character should still face INT checks (deciphering codes), WIS checks (reading people), CHA
checks (persuasion under pressure), and CON checks (enduring hardship). Design encounters that
specifically target the player's weaker stats to create genuine tension. A dump stat that never
gets tested is a missed opportunity for drama.

### DC Escalation

DCs must scale with the player's growing power. As the player gains levels, proficiencies, and
equipment bonuses, maintain tension by:
- Raising baseline DCs for recurring challenge types (Act 1: Moderate 12, Act 3: Hard 16).
- Introducing disadvantage conditions (fatigue, injury, time pressure, hostile environment).
- Designing checks where high rolls produce *complications* alongside success (you pick the
  lock, but the mechanism triggers an alarm).
- Never letting bonus stacking trivialise rolls — if modified totals routinely exceed 20,
  the difficulty curve is broken.

### sendPrompt Reliability

The `sendPrompt()` function in Claude.ai widget iframes is not always available due to timing
and sandboxing. For die roll widgets, always include a fallback:
- Display the roll result and a copyable prompt string (e.g., "I rolled 14 + 3 = 17. Continue.")
- Show a clear "Copy and paste this to continue" instruction alongside the sendPrompt button.
- Never rely solely on sendPrompt for progression — the player must always have a manual path.

---

## Loading Messages

Use these as placeholder text while widgets generate:

| Widget | Example messages |
|--------|-----------------|
| Scene | "Painting the shadows...", "Setting the stage...", "World is breathing..." |
| Roll | "Fate loading dice...", "Probability consulting gravity...", "The numbers decide..." |
| Map | "Charting the unknown...", "Surveying the dark...", "Corridors taking shape..." |
| Combat | "Enemies sizing you up...", "Initiative calculating...", "Tension escalating..." |
| Character | "Forging your identity...", "Stats crystallising...", "Sheet materialising..." |
| Outcome | "Consequences assembling...", "Reality settling...", "The world reacts..." |

---

## Worked Examples

Five complete HTML widget examples demonstrating the core patterns. Each is
renderable as-is inside `visualize:show_widget`. CSS variables (e.g.
`var(--color-text-primary)`) reference the Claude.ai host theme.

---

### Example 1 — Opening Scene

A first-scene widget with progressive reveal, location bar, atmosphere strip,
three POI buttons, three action buttons, status bar, and panel footer.

```html
<style>
  /* Google Fonts may be CSP-blocked in Claude.ai sandbox — fallback stack must produce acceptable results. */
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

  .root { font-family: 'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', monospace; padding: 1rem 0 1.5rem; }

  /* Progressive reveal */
  .brief-text {
    font-size: 14px; line-height: 1.7; color: var(--color-text-primary);
    margin: 0 0 1rem;
  }
  .continue-btn {
    font-family: 'IBM Plex Mono', var(--font-mono); font-size: 11px;
    letter-spacing: 0.1em; padding: 8px 20px; min-height: 44px; min-width: 44px; box-sizing: border-box;
    background: transparent; border: 0.5px solid var(--color-border-secondary);
    border-radius: var(--border-radius-md); color: var(--color-text-primary);
    cursor: pointer;
  }
  .continue-btn:hover { background: var(--color-background-secondary); }
  button:focus-visible, [data-prompt]:focus-visible { outline: 2px solid var(--color-border-primary, #4a90d9); outline-offset: 2px; }

  /* Location bar */
  .loc-bar {
    display: flex; justify-content: space-between; align-items: baseline;
    padding-bottom: 8px; margin-bottom: 12px;
    border-bottom: 0.5px solid var(--color-border-tertiary);
  }
  .loc-name {
    font-family: 'Syne', 'Segoe UI', system-ui, sans-serif; font-size: 16px; font-weight: 700;
    color: var(--color-text-primary); margin: 0;
  }
  .scene-num {
    font-size: 10px; letter-spacing: 0.12em; color: var(--color-text-tertiary);
    text-transform: uppercase;
  }

  /* Atmosphere strip */
  .atmo-strip { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
  .atmo-pill {
    font-size: 10px; letter-spacing: 0.08em; padding: 3px 10px;
    border-radius: 999px; border: 0.5px solid var(--color-border-tertiary);
    color: var(--color-text-tertiary);
  }

  /* Narrative */
  .narrative {
    font-size: 13px; line-height: 1.8; color: var(--color-text-primary);
    margin: 0 0 16px;
  }

  /* POI + action buttons */
  .section-label {
    font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--color-text-tertiary); margin: 16px 0 8px;
  }
  .btn-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }

  /* POI/explore buttons — outlined style, no fill */
  .poi-btn, .btn-poi {
    font-family: 'IBM Plex Mono', var(--font-mono); font-size: 11px;
    letter-spacing: 0.06em; padding: 7px 14px;
    background: transparent; border: 1px dashed var(--color-border-secondary);
    border-radius: var(--border-radius-md); color: var(--color-text-secondary);
    cursor: pointer; transition: background 0.12s;
  }
  .poi-btn:hover, .btn-poi:hover {
    background: var(--color-background-secondary);
    border-style: solid;
  }

  /* Action/advance buttons — solid fill with accent colour */
  .action-btn, .btn-action {
    font-family: 'IBM Plex Mono', var(--font-mono); font-size: 11px;
    letter-spacing: 0.06em; padding: 7px 14px;
    background: rgba(231, 111, 81, 0.09); border: 0.5px solid #E76F51;
    border-radius: var(--border-radius-md); color: var(--color-text-primary);
    cursor: pointer; transition: background 0.12s;
  }
  .action-btn:hover, .btn-action:hover { background: rgba(231, 111, 81, 0.18); }
  @media (prefers-color-scheme: dark) {
    .action-btn, .btn-action {
      background: rgba(231, 111, 81, 0.12); border-color: #E76F51;
    }
    .action-btn:hover, .btn-action:hover { background: rgba(231, 111, 81, 0.24); }
  }

  /* Status bar */
  .status-bar {
    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
    padding: 10px 0; margin-top: 8px;
    border-top: 0.5px solid var(--color-border-tertiary);
    font-size: 10px; color: var(--color-text-tertiary);
    letter-spacing: 0.06em;
  }
  .hp-pips { display: flex; gap: 4px; align-items: center; }
  .pip {
    width: 8px; height: 8px; border-radius: 50%;
    background: #2BA882; border: 0.5px solid #1F8A6A;
  }
  .pip.empty { background: transparent; border-color: var(--color-border-tertiary); }
  .xp-track {
    width: 60px; height: 3px; background: var(--color-border-tertiary);
    border-radius: 2px; overflow: hidden;
  }
  .xp-fill { height: 100%; width: 0%; background: #7C6BF0; border-radius: 2px; }

  /* Footer */
  .footer-row {
    display: flex; justify-content: flex-start; gap: 8px; flex-wrap: wrap;
    margin-top: 14px; padding-top: 10px;
    border-top: 0.5px solid var(--color-border-tertiary);
  }
  .footer-btn {
    font-family: 'IBM Plex Mono', var(--font-mono); font-size: 10px;
    letter-spacing: 0.08em; padding: 8px 14px;
    min-height: 44px; min-width: 44px; box-sizing: border-box;
    background: transparent; border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-md); color: var(--color-text-tertiary);
    cursor: pointer;
  }
  .footer-btn:hover { border-color: var(--color-border-secondary); color: var(--color-text-secondary); }

  /* Panels */
  #panel-overlay { display: none; padding: 0; }
  .panel-header {
    display: flex; align-items: baseline; justify-content: space-between;
    padding-bottom: 10px; margin-bottom: 12px;
    border-bottom: 0.5px solid var(--color-border-tertiary);
  }
  .panel-title {
    font-family: 'Syne', 'Segoe UI', system-ui, sans-serif; font-size: 18px; font-weight: 600;
    color: var(--color-text-primary);
  }
  .panel-close-btn {
    font-family: 'IBM Plex Mono', var(--font-mono); font-size: 10px;
    letter-spacing: 0.08em; background: transparent;
    border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-md); padding: 8px 14px;
    min-height: 44px; min-width: 44px; box-sizing: border-box;
    color: var(--color-text-tertiary); cursor: pointer;
  }
  .panel-close-btn:hover { border-color: var(--color-border-secondary); color: var(--color-text-secondary); }
  .panel-content { display: none; font-size: 12px; line-height: 1.7; color: var(--color-text-secondary); }

  .fallback-text { font-size: 11px; color: var(--color-text-tertiary); margin-top: 8px; display: none; }
</style>

<div class="root">
  <!-- Progressive reveal — brief -->
  <div id="reveal-brief">
    <p class="brief-text">The airlock seals behind you with a slow, pressurised hiss. You are aboard the station.</p>
    <button class="continue-btn" id="continue-reveal-btn">Continue</button>
  </div>

  <!-- Progressive reveal — full scene -->
  <div id="reveal-full" style="display:none">
    <div id="scene-content">
      <!-- Location bar -->
      <div class="loc-bar">
        <h2 class="loc-name">Docking Ring — Bay 7</h2>
        <span class="scene-num">Scene 1</span>
      </div>

      <!-- Atmosphere strip -->
      <div class="atmo-strip">
        <span class="atmo-pill">Recycled air, faintly metallic</span>
        <span class="atmo-pill">Low hum of generators</span>
        <span class="atmo-pill">Cold strip-lighting overhead</span>
      </div>

      <!-- Narrative -->
      <p class="narrative">
        You step off the boarding ramp into a wide, grey corridor. The docking bay is quiet
        — too quiet for a station of this size. Cargo crates are stacked haphazardly along the
        far wall, several bearing shipping stamps you do not recognise. A console near the inner
        door blinks an amber warning cycle, and beyond it a corridor stretches deeper into the
        station. A figure in a patched flight jacket leans against the bulkhead, watching you
        with studied disinterest.
      </p>

      <!-- Points of interest — outlined (btn-poi) with search icon prefix -->
      <p class="section-label">Points of interest</p>
      <div class="btn-row">
        <button class="btn-poi" data-prompt="I examine the blinking console.">&#x1F50D; Investigate the console</button>
        <button class="btn-poi" data-prompt="I look down the corridor beyond the inner door.">&#x1F50D; Check the corridor</button>
        <button class="btn-poi" data-prompt="I approach the stranger in the flight jacket.">&#x1F50D; Talk to the stranger</button>
      </div>

      <!-- Actions — solid fill (btn-action) -->
      <p class="section-label">What do you do?</p>
      <div class="btn-row">
        <button class="btn-action" data-prompt="I head straight through the inner door into the station.">Push deeper into the station</button>
        <button class="btn-action" data-prompt="I search the cargo crates for useful supplies.">Search the cargo crates</button>
        <button class="btn-action" data-prompt="I wait here and observe the bay before moving on.">Wait and observe</button>
      </div>

      <!-- Fallback prompt -->
      <p class="fallback-text" id="fallback">
        If the buttons above do not work, copy one of these prompts and paste it into the chat:<br>
        <code id="fallback-prompt"></code>
      </p>

      <!-- Status bar -->
      <div class="status-bar">
        <span>HP</span>
        <div class="hp-pips">
          <span class="pip"></span><span class="pip"></span><span class="pip"></span>
          <span class="pip"></span><span class="pip"></span><span class="pip"></span>
        </div>
        <span>XP</span>
        <div class="xp-track"><div class="xp-fill" style="width:0%"></div></div>
        <span>LVL 1</span>
      </div>
    </div>

    <!-- Panel overlay -->
    <div id="panel-overlay" style="display:none">
      <div class="panel-header">
        <span class="panel-title" id="panel-title-text"></span>
        <button class="panel-close-btn" onclick="closePanel()">Close</button>
      </div>
      <div class="panel-content" data-panel="character">
        <p><strong>Kael — Soldier</strong><br>Level 1 &middot; 0 / 100 XP</p>
        <p>STR 16 (+3) &middot; DEX 12 (+1) &middot; CON 14 (+2)<br>INT 10 (+0) &middot; WIS 8 (-1) &middot; CHA 11 (+0)</p>
        <p>Equipped: Pulse Rifle (+3 ranged) &middot; Flak Vest (AC 13)</p>
        <p>Inventory: Ration pack, med-stim x2, torch</p>
      </div>
      <div class="panel-content" data-panel="codex">
        <p><em>No lore entries discovered yet.</em></p>
      </div>
      <div class="panel-content" data-panel="ship">
        <p><strong>The Vagrant</strong> — Light Freighter<br>Hull: 10 / 10 &middot; Fuel: 8 / 10</p>
      </div>
      <div class="panel-content" data-panel="nav">
        <p>Current location: Kellos Station, outer ring<br>No destinations charted.</p>
      </div>
    </div>
  </div>

  <!-- Footer — always visible -->
  <div class="footer-row">
    <button class="footer-btn" onclick="togglePanel('character')">Character</button>
    <button class="footer-btn" onclick="togglePanel('codex')">Codex</button>
    <button class="footer-btn" onclick="togglePanel('ship')">Ship</button>
    <button class="footer-btn" onclick="togglePanel('nav')">Nav chart</button>
  </div>
</div>

<script>
/* Progressive reveal — continue button */
document.getElementById('continue-reveal-btn').addEventListener('click', function() {
  document.getElementById('reveal-brief').style.display = 'none';
  document.getElementById('reveal-full').style.display = 'block';
});

/* Panel toggle system */
let activePanel = null;
function togglePanel(panelId) {
  const overlay = document.getElementById('panel-overlay');
  const scene = document.getElementById('scene-content');
  const title = document.getElementById('panel-title-text');
  if (activePanel === panelId) {
    overlay.style.display = 'none'; scene.style.display = 'block';
    activePanel = null; return;
  }
  overlay.style.display = 'block'; scene.style.display = 'none';
  activePanel = panelId;
  title.textContent = panelId.charAt(0).toUpperCase() + panelId.slice(1);
  document.querySelectorAll('.panel-content').forEach(p =>
    p.style.display = p.dataset.panel === panelId ? 'block' : 'none');
}
function closePanel() {
  document.getElementById('panel-overlay').style.display = 'none';
  document.getElementById('scene-content').style.display = 'block';
  activePanel = null;
}

/* sendPrompt with fallback — all data-prompt buttons */
document.querySelectorAll('[data-prompt]').forEach(btn => {
  btn.addEventListener('click', () => {
    const prompt = btn.dataset.prompt;
    if (typeof sendPrompt === 'function') {
      sendPrompt(prompt);
    } else {
      const fb = document.getElementById('fallback');
      const fp = document.getElementById('fallback-prompt');
      if (fb && fp) {
        fp.textContent = prompt;
        fb.style.display = 'block';
      }
    }
  });
});
</script>
```

---

### Example 2 — Combat Encounter

A combat widget with initiative bar, enemy HP pips, player status, and an
action panel with four options. Uses `data-prompt` + `addEventListener`.

```html
<style>
  /* Google Fonts may be CSP-blocked in Claude.ai sandbox — fallback stack must produce acceptable results. */
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

  .combat-root { font-family: 'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', monospace; padding: 1rem 0 1.5rem; }

  /* Initiative bar */
  .init-bar {
    display: flex; gap: 6px; align-items: center; margin-bottom: 14px;
    padding-bottom: 10px; border-bottom: 0.5px solid var(--color-border-tertiary);
  }
  .init-label {
    font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--color-text-tertiary); margin-right: 4px;
  }
  .init-chip {
    font-size: 10px; letter-spacing: 0.06em; padding: 3px 10px;
    border-radius: var(--border-radius-md); border: 0.5px solid var(--color-border-tertiary);
    color: var(--color-text-secondary);
  }
  .init-chip.active {
    border-color: #2BA882; color: #2BA882; font-weight: 500;
  }

  /* Encounter heading */
  .encounter-heading {
    font-family: 'Syne', 'Segoe UI', system-ui, sans-serif; font-size: 16px; font-weight: 700;
    color: var(--color-text-primary); margin: 0 0 4px;
  }
  .encounter-sub {
    font-size: 11px; color: var(--color-text-tertiary); margin: 0 0 16px;
  }

  /* Enemy cards */
  .enemy-row { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 18px; }
  .enemy-card {
    flex: 1; min-width: 140px; padding: 10px 12px;
    border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-md);
  }
  .enemy-name {
    font-size: 12px; font-weight: 500; color: var(--color-text-primary);
    margin: 0 0 6px;
  }
  .enemy-role {
    font-size: 10px; color: var(--color-text-tertiary); margin: 0 0 8px;
  }
  .hp-row { display: flex; gap: 4px; align-items: center; }
  .hp-label { font-size: 9px; color: var(--color-text-tertiary); margin-right: 4px; }
  .pip {
    width: 8px; height: 8px; border-radius: 50%;
    border: 0.5px solid #C0392B; background: #E74C3C;
  }
  .pip.empty { background: transparent; border-color: var(--color-border-tertiary); }

  /* Player status */
  .player-status {
    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
    padding: 10px 0; margin-bottom: 14px;
    border-top: 0.5px solid var(--color-border-tertiary);
    border-bottom: 0.5px solid var(--color-border-tertiary);
    font-size: 11px; color: var(--color-text-primary);
  }
  .player-pip {
    width: 8px; height: 8px; border-radius: 50%;
    background: #2BA882; border: 0.5px solid #1F8A6A;
  }
  .player-pip.empty { background: transparent; border-color: var(--color-border-tertiary); }
  .player-pips { display: flex; gap: 4px; align-items: center; }
  .condition-tag {
    font-size: 9px; letter-spacing: 0.08em; padding: 2px 8px;
    border-radius: 999px; border: 0.5px solid var(--color-border-tertiary);
    color: var(--color-text-tertiary);
  }

  /* Action panel */
  .section-label {
    font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--color-text-tertiary); margin: 0 0 8px;
  }
  .action-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
  .action-btn {
    font-family: 'IBM Plex Mono', var(--font-mono); font-size: 11px;
    letter-spacing: 0.06em; padding: 8px 16px;
    background: transparent; border: 0.5px solid var(--color-border-secondary);
    border-radius: var(--border-radius-md); color: var(--color-text-primary);
    cursor: pointer; transition: background 0.12s;
  }
  .action-btn:hover { background: var(--color-background-secondary); }
  .action-btn.attack { border-color: #E74C3C; color: #E74C3C; }
  .action-btn.attack:hover { background: rgba(231,76,60,0.08); }
  .action-btn.retreat { border-color: var(--color-text-tertiary); color: var(--color-text-tertiary); }

  .fallback-text { font-size: 11px; color: var(--color-text-tertiary); margin-top: 8px; display: none; }
</style>

<div class="combat-root">
  <!-- Initiative bar -->
  <div class="init-bar">
    <span class="init-label">Turn order</span>
    <span class="init-chip active">Kael (You)</span>
    <span class="init-chip">Pirate — Blade</span>
    <span class="init-chip">Pirate — Pistol</span>
    <span class="init-chip">Pirate — Heavy</span>
  </div>

  <!-- Encounter heading -->
  <h2 class="encounter-heading">Ambush in Cargo Hold C</h2>
  <p class="encounter-sub">Three figures emerge from behind the crates, weapons drawn.</p>

  <!-- Enemy cards -->
  <div class="enemy-row">
    <div class="enemy-card">
      <p class="enemy-name">Pirate — Blade</p>
      <p class="enemy-role">Melee &middot; DEF 11</p>
      <div class="hp-row">
        <span class="hp-label">HP</span>
        <span class="pip"></span><span class="pip"></span>
        <span class="pip"></span><span class="pip"></span>
      </div>
    </div>
    <div class="enemy-card">
      <p class="enemy-name">Pirate — Pistol</p>
      <p class="enemy-role">Ranged &middot; DEF 12</p>
      <div class="hp-row">
        <span class="hp-label">HP</span>
        <span class="pip"></span><span class="pip"></span>
        <span class="pip"></span><span class="pip"></span>
      </div>
    </div>
    <div class="enemy-card">
      <p class="enemy-name">Pirate — Heavy</p>
      <p class="enemy-role">Ranged &middot; DEF 13</p>
      <div class="hp-row">
        <span class="hp-label">HP</span>
        <span class="pip"></span><span class="pip"></span>
        <span class="pip"></span><span class="pip"></span>
      </div>
    </div>
  </div>

  <!-- Player status -->
  <div class="player-status">
    <span>Kael</span>
    <span>HP</span>
    <div class="player-pips">
      <span class="player-pip"></span><span class="player-pip"></span>
      <span class="player-pip"></span><span class="player-pip"></span>
      <span class="player-pip"></span><span class="player-pip"></span>
    </div>
    <span>6 / 6</span>
    <span class="condition-tag">No conditions</span>
  </div>

  <!-- Action panel -->
  <p class="section-label">Your turn — choose an action</p>
  <div class="action-row">
    <button class="action-btn attack" data-prompt="I attack the Pirate with the blade using my Pulse Rifle.">Attack</button>
    <button class="action-btn" data-prompt="I use a skill. Show me my available abilities.">Skill</button>
    <button class="action-btn" data-prompt="I use an item from my inventory.">Item</button>
    <button class="action-btn retreat" data-prompt="I attempt to retreat from the fight.">Retreat</button>
  </div>

  <!-- Fallback -->
  <p class="fallback-text" id="combat-fallback">
    If the buttons above do not work, copy one of these prompts and paste it into the chat:<br>
    <code id="combat-fallback-prompt"></code>
  </p>
</div>

<script>
document.querySelectorAll('[data-prompt]').forEach(btn => {
  btn.addEventListener('click', () => {
    const prompt = btn.dataset.prompt;
    if (typeof sendPrompt === 'function') {
      sendPrompt(prompt);
    } else {
      const fb = document.getElementById('combat-fallback');
      const fp = document.getElementById('combat-fallback-prompt');
      if (fb && fp) {
        fp.textContent = prompt;
        fb.style.display = 'block';
      }
    }
  });
});
</script>
```

---

### Example 3 — Dice Roll Resolution (Four Stages)

A complete four-stage dice roll widget: Declare, Roll (animate), Resolve, and
Continue. Demonstrates a D&D 5e Stealth check (DEX, DC 14). Each stage is
revealed sequentially via button clicks — never combined or skipped.

```html
<style>
  /* Google Fonts may be CSP-blocked in Claude.ai sandbox — fallback stack must produce acceptable results. */
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

  .roll-root { font-family: 'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', monospace; padding: 1rem 0 1.5rem; }

  .roll-heading {
    font-family: 'Syne', 'Segoe UI', system-ui, sans-serif; font-size: 16px; font-weight: 700;
    color: var(--color-text-primary); margin: 0 0 4px;
  }
  .roll-action {
    font-size: 12px; color: var(--color-text-secondary); margin: 0 0 16px;
    line-height: 1.6;
  }

  /* Attribute reveal */
  .attr-row {
    display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px;
    padding: 10px 14px; border-radius: var(--border-radius-md);
    background: var(--color-background-secondary);
    border: 0.5px solid var(--color-border-tertiary);
  }
  .attr-name {
    font-size: 13px; font-weight: 500; color: var(--color-text-primary);
  }
  .attr-mod {
    font-size: 11px; color: var(--color-text-tertiary);
  }

  /* Roll button */
  .roll-btn {
    font-family: 'IBM Plex Mono', var(--font-mono); font-size: 14px;
    font-weight: 500; letter-spacing: 0.12em; padding: 12px 32px;
    background: transparent; border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius-md); color: var(--color-text-primary);
    cursor: pointer; display: block; margin: 0 auto 16px;
    transition: background 0.12s;
  }
  .roll-btn:hover { background: var(--color-background-secondary); }
  .roll-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  /* Die display */
  .die-display {
    display: none; text-align: center; margin-bottom: 16px;
  }
  .die-value {
    font-size: 36px; font-weight: 700; color: var(--color-text-primary);
    display: inline-block;
  }
  @keyframes die-spin {
    0%   { transform: rotateX(0deg);   opacity: 0.4; }
    50%  { transform: rotateX(180deg); opacity: 0.7; }
    100% { transform: rotateX(360deg); opacity: 1;   }
  }
  .die-value.spinning { animation: die-spin 0.6s ease-out; }

  /* Reduced motion — disable die animation and all transitions */
  @media (prefers-reduced-motion: reduce) {
    .die-value.spinning { animation: none; opacity: 1; }
    * { transition-duration: 0.01ms !important; }
  }

  /* Resolve block */
  .resolve-block {
    display: none; padding: 12px 14px; margin-bottom: 16px;
    border-radius: var(--border-radius-md);
    border: 0.5px solid var(--color-border-tertiary);
    background: var(--color-background-secondary);
  }
  .resolve-row {
    display: flex; justify-content: space-between; align-items: baseline;
    font-size: 12px; color: var(--color-text-secondary); margin-bottom: 6px;
  }
  .resolve-row:last-child { margin-bottom: 0; }
  .resolve-label { color: var(--color-text-tertiary); }

  /* Outcome badge */
  .outcome-badge {
    display: none; text-align: center; margin-bottom: 16px;
  }
  .badge {
    display: inline-block; font-size: 11px; font-weight: 500;
    letter-spacing: 0.14em; text-transform: uppercase;
    padding: 5px 16px; border-radius: var(--border-radius-md);
  }
  .badge.success     { background: #E1F5EE; color: #085041; }
  .badge.partial     { background: #FAEEDA; color: #633806; }
  .badge.failure     { background: #FCEBEB; color: #791F1F; }
  .badge.crit-success { background: #E1F5EE; color: #085041; border: 1px solid #2BA882; }
  .badge.crit-failure { background: #FCEBEB; color: #791F1F; border: 1px solid #E74C3C; }
  @media (prefers-color-scheme: dark) {
    .badge.success     { background: #085041; color: #9FE1CB; }
    .badge.partial     { background: #633806; color: #FAC775; }
    .badge.failure     { background: #791F1F; color: #FFD0D0; }
    .badge.crit-success { background: #085041; color: #9FE1CB; border-color: #2BA882; }
    .badge.crit-failure { background: #791F1F; color: #FFD0D0; border-color: #E74C3C; }
  }

  /* Continue stage */
  .continue-stage { display: none; text-align: center; }
  .continue-btn {
    font-family: 'IBM Plex Mono', var(--font-mono); font-size: 11px;
    letter-spacing: 0.1em; padding: 8px 20px;
    background: transparent; border: 0.5px solid var(--color-border-secondary);
    border-radius: var(--border-radius-md); color: var(--color-text-primary);
    cursor: pointer;
  }
  .continue-btn:hover { background: var(--color-background-secondary); }
  .fallback-text {
    font-size: 11px; color: var(--color-text-tertiary); margin-top: 8px; display: none;
  }
</style>

<div class="roll-root">
  <!-- Stage 1: Declare -->
  <h2 class="roll-heading">Stealth Check</h2>
  <p class="roll-action">
    You press yourself against the cold bulkhead and edge past the open doorway,
    willing your boots to stay silent on the grated flooring.
  </p>
  <div class="attr-row">
    <span class="attr-name">DEX</span>
    <span class="attr-mod">Modifier: +1</span>
  </div>
  <button class="roll-btn" id="roll-btn">[ ROLL 1d20 ]</button>

  <!-- Stage 2: Animate + display -->
  <div class="die-display" id="die-display">
    <span class="die-value" id="die-value"></span>
  </div>

  <!-- Stage 3: Resolve -->
  <div class="resolve-block" id="resolve-block">
    <div class="resolve-row">
      <span class="resolve-label">Raw roll</span>
      <span id="raw-roll"></span>
    </div>
    <div class="resolve-row">
      <span class="resolve-label">Modifier</span>
      <span>+1 (DEX)</span>
    </div>
    <div class="resolve-row">
      <span class="resolve-label">Total</span>
      <span id="total-roll" style="font-weight:500"></span>
    </div>
    <div class="resolve-row">
      <span class="resolve-label">DC</span>
      <span>14</span>
    </div>
  </div>
  <div class="outcome-badge" id="outcome-badge">
    <span class="badge" id="badge-text"></span>
  </div>

  <!-- Stage 4: Continue -->
  <div class="continue-stage" id="continue-stage">
    <button class="continue-btn" id="continue-btn" data-prompt="">Continue</button>
    <p class="fallback-text" id="roll-fallback">
      If the button above does not work, copy this prompt and paste it into the chat:<br>
      <code id="roll-fallback-prompt"></code>
    </p>
  </div>
</div>

<script>
(function() {
  const MODIFIER = 1;
  const DC = 14;
  let rolled = false;

  document.getElementById('roll-btn').addEventListener('click', function() {
    if (rolled) return;
    rolled = true;
    this.disabled = true;

    const raw = Math.floor(Math.random() * 20) + 1;
    const total = raw + MODIFIER;

    /* Stage 2: Animate */
    const dieDisplay = document.getElementById('die-display');
    const dieValue = document.getElementById('die-value');
    dieDisplay.style.display = 'block';

    /* Spin through random numbers for 0.6s */
    let spinCount = 0;
    const spinInterval = setInterval(() => {
      dieValue.textContent = Math.floor(Math.random() * 20) + 1;
      spinCount++;
      if (spinCount >= 12) {
        clearInterval(spinInterval);
        dieValue.textContent = raw;
        dieValue.classList.add('spinning');

        /* Stage 3: Resolve — after brief pause */
        setTimeout(() => {
          document.getElementById('raw-roll').textContent = raw;
          document.getElementById('total-roll').textContent = total;
          document.getElementById('resolve-block').style.display = 'block';

          /* Determine outcome */
          let badgeClass, badgeText;
          if (raw === 20) {
            badgeClass = 'crit-success'; badgeText = 'Critical Success';
          } else if (raw === 1) {
            badgeClass = 'crit-failure'; badgeText = 'Critical Failure';
          } else if (total >= DC) {
            if (total - DC <= 1) {
              badgeClass = 'partial'; badgeText = 'Partial Success';
            } else {
              badgeClass = 'success'; badgeText = 'Success';
            }
          } else if (DC - total <= 3) {
            badgeClass = 'partial'; badgeText = 'Partial Success';
          } else {
            badgeClass = 'failure'; badgeText = 'Failure';
          }

          const badgeEl = document.getElementById('badge-text');
          badgeEl.className = 'badge ' + badgeClass;
          badgeEl.textContent = badgeText;
          document.getElementById('outcome-badge').style.display = 'block';

          /* Stage 4: Continue */
          const promptText = 'I rolled ' + raw + ' plus ' + MODIFIER + ' equals ' + total + ' against DC ' + DC + '. ' + badgeText + '. Continue.';
          const continueBtn = document.getElementById('continue-btn');
          continueBtn.dataset.prompt = promptText;

          const fallbackPrompt = document.getElementById('roll-fallback-prompt');
          fallbackPrompt.textContent = promptText;

          document.getElementById('continue-stage').style.display = 'block';
        }, 300);
      }
    }, 50);
  });

  /* Continue button — sendPrompt with fallback */
  document.getElementById('continue-btn').addEventListener('click', function() {
    const prompt = this.dataset.prompt;
    if (typeof sendPrompt === 'function') {
      sendPrompt(prompt);
    } else {
      document.getElementById('roll-fallback').style.display = 'block';
    }
  });
})();
</script>
```

---

### Example 4 — Shop/Merchant Widget

A merchant widget with buy/sell tabs, item grid, barter option, and leave button.
Demonstrates the shop interaction pattern with credit display, item type badges,
and tab switching via pure JS (no `sendPrompt` for tab toggle). All purchase,
barter, and leave buttons use `data-prompt` + `addEventListener`.

```html
<style>
  /* Google Fonts may be CSP-blocked in Claude.ai sandbox — fallback stack must produce acceptable results. */
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

  .shop-root { font-family: 'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', monospace; padding: 1rem 0 1.5rem; }

  /* Merchant header */
  .merchant-header {
    display: flex; justify-content: space-between; align-items: baseline;
    padding-bottom: 8px; margin-bottom: 4px;
    border-bottom: 0.5px solid var(--color-border-tertiary);
  }
  .merchant-name {
    font-family: 'Syne', 'Segoe UI', system-ui, sans-serif; font-size: 16px; font-weight: 700;
    color: var(--color-text-primary); margin: 0;
  }
  .credits-display {
    font-size: 12px; font-weight: 500; letter-spacing: 0.06em;
    color: #2BA882;
  }
  .merchant-flavour {
    font-size: 11px; color: var(--color-text-tertiary); margin: 4px 0 14px;
    line-height: 1.6;
  }

  /* Tab bar */
  .tab-bar {
    display: flex; gap: 0; margin-bottom: 14px;
    border-bottom: 0.5px solid var(--color-border-tertiary);
  }
  .tab-btn {
    font-family: 'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
    font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
    padding: 8px 16px; background: transparent; border: none;
    border-bottom: 2px solid transparent;
    color: var(--color-text-tertiary); cursor: pointer;
    transition: color 0.12s, border-color 0.12s;
  }
  .tab-btn:hover { color: var(--color-text-secondary); }
  .tab-btn.active {
    color: var(--color-text-primary);
    border-bottom-color: #E76F51;
  }
  .tab-panel { display: none; }
  .tab-panel.active { display: block; }

  /* Item grid */
  .item-grid { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
  .item-card {
    display: flex; align-items: center; justify-content: space-between;
    gap: 10px; padding: 10px 12px;
    border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-md);
    flex-wrap: wrap;
  }
  .item-info { flex: 1; min-width: 160px; }
  .item-name {
    font-size: 12px; font-weight: 500; color: var(--color-text-primary);
    margin: 0 0 2px;
  }
  .item-type-badge {
    display: inline-block; font-size: 9px; letter-spacing: 0.08em;
    text-transform: uppercase; padding: 2px 8px;
    border-radius: 999px; border: 0.5px solid var(--color-border-tertiary);
    color: var(--color-text-tertiary); margin-right: 6px;
  }
  .item-effect {
    font-size: 10px; color: var(--color-text-tertiary); margin: 4px 0 0;
    line-height: 1.5;
  }
  .item-price {
    font-size: 12px; font-weight: 500; color: var(--color-text-primary);
    white-space: nowrap; margin-right: 8px;
  }
  .item-actions { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }

  /* Button styles — action (buy/barter) and poi (inspect) */
  .btn-action {
    font-family: 'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
    font-size: 10px; letter-spacing: 0.06em; padding: 6px 12px;
    background: rgba(231, 111, 81, 0.09); border: 0.5px solid #E76F51;
    border-radius: var(--border-radius-md); color: var(--color-text-primary);
    cursor: pointer; transition: background 0.12s;
  }
  .btn-action:hover { background: rgba(231, 111, 81, 0.18); }
  @media (prefers-color-scheme: dark) {
    .btn-action { background: rgba(231, 111, 81, 0.12); border-color: #E76F51; }
    .btn-action:hover { background: rgba(231, 111, 81, 0.24); }
  }
  .btn-poi {
    font-family: 'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
    font-size: 10px; letter-spacing: 0.06em; padding: 6px 12px;
    background: transparent; border: 1px dashed var(--color-border-secondary);
    border-radius: var(--border-radius-md); color: var(--color-text-secondary);
    cursor: pointer; transition: background 0.12s;
  }
  .btn-poi:hover { background: var(--color-background-secondary); border-style: solid; }

  /* Footer actions row */
  .shop-footer {
    display: flex; justify-content: space-between; align-items: center;
    gap: 8px; flex-wrap: wrap; margin-top: 14px; padding-top: 10px;
    border-top: 0.5px solid var(--color-border-tertiary);
  }

  /* Sell tab — empty state */
  .sell-empty {
    font-size: 11px; color: var(--color-text-tertiary); padding: 16px 0;
    text-align: centre;
  }

  /* Focus-visible for keyboard navigation */
  button:focus-visible {
    outline: 2px solid #7C6BF0; outline-offset: 2px;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    * { transition-duration: 0.01ms !important; }
  }

  .fallback-text { font-size: 11px; color: var(--color-text-tertiary); margin-top: 8px; display: none; }
</style>

<div class="shop-root">
  <!-- Merchant header -->
  <div class="merchant-header">
    <h2 class="merchant-name">Vex's Salvage Emporium</h2>
    <span class="credits-display">Credits: 340</span>
  </div>
  <p class="merchant-flavour">A cluttered stall wedged between two cargo bays, reeking of solder and engine grease.</p>

  <!-- Tab bar -->
  <div class="tab-bar">
    <button class="tab-btn active" id="tab-buy-btn" data-tab="buy">Buy</button>
    <button class="tab-btn" id="tab-sell-btn" data-tab="sell">Sell</button>
  </div>

  <!-- Buy tab -->
  <div class="tab-panel active" id="tab-buy">
    <div class="item-grid">
      <!-- Stim Pack -->
      <div class="item-card">
        <div class="item-info">
          <p class="item-name">Stim Pack</p>
          <span class="item-type-badge">Consumable</span>
          <p class="item-effect">Restores 2d6 HP</p>
        </div>
        <span class="item-price">25 cr</span>
        <div class="item-actions">
          <button class="btn-poi" data-prompt="I ask Vex about the Stim Pack.">Inspect</button>
          <button class="btn-action" data-prompt="I buy the Stim Pack for 25 credits.">Buy</button>
        </div>
      </div>
      <!-- Reinforced Vest -->
      <div class="item-card">
        <div class="item-info">
          <p class="item-name">Reinforced Vest</p>
          <span class="item-type-badge">Armour</span>
          <p class="item-effect">+2 Soak, Heavy</p>
        </div>
        <span class="item-price">120 cr</span>
        <div class="item-actions">
          <button class="btn-poi" data-prompt="I ask Vex about the Reinforced Vest.">Inspect</button>
          <button class="btn-action" data-prompt="I buy the Reinforced Vest for 120 credits.">Buy</button>
        </div>
      </div>
      <!-- Signal Jammer -->
      <div class="item-card">
        <div class="item-info">
          <p class="item-name">Signal Jammer</p>
          <span class="item-type-badge">Gear</span>
          <p class="item-effect">+2 to Stealth checks near electronics</p>
        </div>
        <span class="item-price">80 cr</span>
        <div class="item-actions">
          <button class="btn-poi" data-prompt="I ask Vex about the Signal Jammer.">Inspect</button>
          <button class="btn-action" data-prompt="I buy the Signal Jammer for 80 credits.">Buy</button>
        </div>
      </div>
      <!-- Plasma Cutter -->
      <div class="item-card">
        <div class="item-info">
          <p class="item-name">Plasma Cutter</p>
          <span class="item-type-badge">Weapon</span>
          <p class="item-effect">2d8 damage, Pierce 1</p>
        </div>
        <span class="item-price">200 cr</span>
        <div class="item-actions">
          <button class="btn-poi" data-prompt="I ask Vex about the Plasma Cutter.">Inspect</button>
          <button class="btn-action" data-prompt="I buy the Plasma Cutter for 200 credits.">Buy</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Sell tab -->
  <div class="tab-panel" id="tab-sell">
    <p class="sell-empty">Your inventory items would appear here with sell prices and SELL buttons.</p>
  </div>

  <!-- Footer: Barter + Leave -->
  <div class="shop-footer">
    <button class="btn-action" data-prompt="I attempt to barter with Vex. Attempt CHA check to haggle.">Barter</button>
    <button class="btn-action" data-prompt="I leave the shop.">Leave</button>
  </div>

  <!-- Fallback -->
  <p class="fallback-text" id="shop-fallback">
    If the buttons above do not work, copy one of these prompts and paste it into the chat:<br>
    <code id="shop-fallback-prompt"></code>
  </p>
</div>

<script>
(function() {
  /* Tab switching — pure JS, no sendPrompt */
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tabId = this.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
      this.classList.add('active');
      var targetPanel = document.getElementById('tab-' + tabId);
      if (targetPanel) { targetPanel.classList.add('active'); }
    });
  });

  /* sendPrompt with fallback — showFallback helper */
  function showFallback(promptText) {
    var fb = document.getElementById('shop-fallback');
    var fp = document.getElementById('shop-fallback-prompt');
    if (fb && fp) {
      fp.textContent = promptText;
      fb.style.display = 'block';
    }
  }

  document.querySelectorAll('[data-prompt]').forEach(function(btn) {
    /* Skip tab buttons — they use data-tab, not data-prompt for action */
    if (btn.classList.contains('tab-btn')) { return; }
    btn.addEventListener('click', function() {
      var prompt = this.dataset.prompt;
      if (typeof sendPrompt === 'function') {
        sendPrompt(prompt);
      } else {
        showFallback(prompt);
      }
    });
  });
})();
</script>
```

---

### Example 5 — Social Encounter Widget

A social encounter widget with NPC header, disposition badge, conviction meter,
approach buttons, round indicator, and NPC reaction area. Demonstrates the
structured negotiation pattern with multiple approach options tied to attributes.
All approach buttons use `data-prompt` + `addEventListener`.

```html
<style>
  /* Google Fonts may be CSP-blocked in Claude.ai sandbox — fallback stack must produce acceptable results. */
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

  .social-root { font-family: 'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', monospace; padding: 1rem 0 1.5rem; }

  /* NPC header */
  .npc-header {
    display: flex; justify-content: space-between; align-items: baseline;
    padding-bottom: 8px; margin-bottom: 4px;
    border-bottom: 0.5px solid var(--color-border-tertiary);
  }
  .npc-name {
    font-family: 'Syne', 'Segoe UI', system-ui, sans-serif; font-size: 16px; font-weight: 700;
    color: var(--color-text-primary); margin: 0;
  }
  .disposition-badge {
    display: inline-block; font-size: 9px; font-weight: 500;
    letter-spacing: 0.1em; text-transform: uppercase;
    padding: 3px 12px; border-radius: 999px;
  }
  .disposition-badge.suspicious {
    background: rgba(243, 156, 18, 0.12); color: #D4860B;
    border: 0.5px solid rgba(243, 156, 18, 0.4);
  }
  @media (prefers-color-scheme: dark) {
    .disposition-badge.suspicious {
      background: rgba(243, 156, 18, 0.15); color: #F5B742;
      border-color: rgba(243, 156, 18, 0.5);
    }
  }

  /* Stakes text */
  .stakes-text {
    font-size: 12px; line-height: 1.7; color: var(--color-text-secondary);
    margin: 8px 0 16px; padding: 10px 14px;
    border-radius: var(--border-radius-md);
    background: var(--color-background-secondary);
    border: 0.5px solid var(--color-border-tertiary);
  }
  .stakes-label {
    font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--color-text-tertiary); display: block; margin-bottom: 4px;
  }

  /* Conviction meter */
  .conviction-row {
    display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
  }
  .conviction-label {
    font-size: 10px; letter-spacing: 0.08em; color: var(--color-text-tertiary);
  }
  .conviction-pips { display: flex; gap: 6px; align-items: center; }
  .conviction-pip {
    width: 10px; height: 10px; border-radius: 50%;
    border: 0.5px solid #1A9E8F;
    background: transparent;
  }
  .conviction-pip.filled {
    background: #2BBCAB; border-color: #1A9E8F;
  }
  @media (prefers-color-scheme: dark) {
    .conviction-pip { border-color: #1A9E8F; }
    .conviction-pip.filled { background: #2BBCAB; border-color: #23A899; }
  }

  /* Round indicator */
  .round-indicator {
    font-size: 10px; letter-spacing: 0.08em; color: var(--color-text-tertiary);
    margin-bottom: 16px;
  }

  /* Approach buttons */
  .section-label {
    font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--color-text-tertiary); margin: 0 0 8px;
  }
  .approach-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .btn-action {
    font-family: 'IBM Plex Mono', 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
    font-size: 11px; letter-spacing: 0.06em; padding: 8px 14px;
    background: rgba(231, 111, 81, 0.09); border: 0.5px solid #E76F51;
    border-radius: var(--border-radius-md); color: var(--color-text-primary);
    cursor: pointer; transition: background 0.12s;
  }
  .btn-action:hover { background: rgba(231, 111, 81, 0.18); }
  @media (prefers-color-scheme: dark) {
    .btn-action { background: rgba(231, 111, 81, 0.12); border-color: #E76F51; }
    .btn-action:hover { background: rgba(231, 111, 81, 0.24); }
  }
  .approach-stat {
    font-size: 9px; color: var(--color-text-tertiary); margin-left: 4px;
  }

  /* NPC reaction area */
  .npc-reaction {
    font-size: 12px; line-height: 1.7; color: var(--color-text-secondary);
    margin: 0 0 16px; padding: 12px 14px;
    border-radius: var(--border-radius-md);
    border: 0.5px solid var(--color-border-tertiary);
    background: var(--color-background-secondary);
    font-style: italic;
  }

  /* Focus-visible for keyboard navigation */
  button:focus-visible {
    outline: 2px solid #7C6BF0; outline-offset: 2px;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    * { transition-duration: 0.01ms !important; }
  }

  .fallback-text { font-size: 11px; color: var(--color-text-tertiary); margin-top: 8px; display: none; }
</style>

<div class="social-root">
  <!-- NPC header -->
  <div class="npc-header">
    <h2 class="npc-name">Captain Voss</h2>
    <span class="disposition-badge suspicious">Suspicious</span>
  </div>

  <!-- Stakes -->
  <div class="stakes-text">
    <span class="stakes-label">Stakes</span>
    Convince Captain Voss to let you dock without inspection.
  </div>

  <!-- Conviction meter -->
  <div class="conviction-row">
    <span class="conviction-label">Conviction</span>
    <div class="conviction-pips">
      <span class="conviction-pip filled"></span>
      <span class="conviction-pip"></span>
      <span class="conviction-pip"></span>
      <span class="conviction-pip"></span>
    </div>
  </div>

  <!-- Round indicator -->
  <p class="round-indicator">Round 2 of 5</p>

  <!-- NPC reaction -->
  <p class="npc-reaction">
    Voss narrows her eyes, arms folded across a battered flight harness. "Everybody
    has a reason to skip inspection. Most of those reasons interest my security team
    a great deal." She tilts her head, waiting.
  </p>

  <!-- Approach buttons -->
  <p class="section-label">Choose your approach</p>
  <div class="approach-row">
    <button class="btn-action" data-prompt="I attempt Persuasion. I appeal to reason and explain why an inspection is unnecessary.">Persuasion <span class="approach-stat">(CHA)</span></button>
    <button class="btn-action" data-prompt="I attempt Deception. I fabricate a convincing cover story to avoid the inspection.">Deception <span class="approach-stat">(CHA)</span></button>
    <button class="btn-action" data-prompt="I attempt Intimidation. I make it clear that delaying us would be unwise.">Intimidation <span class="approach-stat">(STR)</span></button>
    <button class="btn-action" data-prompt="I attempt Insight. I read Captain Voss to find leverage or understand her true concern.">Insight <span class="approach-stat">(INT)</span></button>
    <button class="btn-action" data-prompt="I attempt Performance. I put on a show to distract and charm Captain Voss.">Performance <span class="approach-stat">(CHA)</span></button>
  </div>

  <!-- Fallback -->
  <p class="fallback-text" id="social-fallback">
    If the buttons above do not work, copy one of these prompts and paste it into the chat:<br>
    <code id="social-fallback-prompt"></code>
  </p>
</div>

<script>
(function() {
  /* sendPrompt with fallback — showFallback helper */
  function showFallback(promptText) {
    var fb = document.getElementById('social-fallback');
    var fp = document.getElementById('social-fallback-prompt');
    if (fb && fp) {
      fp.textContent = promptText;
      fb.style.display = 'block';
    }
  }

  document.querySelectorAll('[data-prompt]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var prompt = this.dataset.prompt;
      if (typeof sendPrompt === 'function') {
        sendPrompt(prompt);
      } else {
        showFallback(prompt);
      }
    });
  });
})();
</script>
```
