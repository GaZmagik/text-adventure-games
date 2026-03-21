# Character Creation — Archetypes, Stats, and Identity
> Module for text-adventure orchestrator. Always loaded — governs character creation and stat generation.

This module defines how characters are built: the archetypes available, stat generation methods,
starting equipment, and how all of this adapts to different rulebook systems and scenario themes.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: core-systems, scenarios modules.

---

## Character Creation Widget

Present a widget with:
- **Left panel:** Name input (text field), archetype selector (button grid or radio cards).
- **Right panel:** Generated stat block — populated via JS after archetype selection
  (no `sendPrompt()` round-trip — stat generation is client-side).

### Stat Block Display
- Six attributes: `[name] — [value] ([modifier])` (e.g., "STR — 16 (+3)")
- Derived stats: HP, AC, Initiative, Speed — displayed as a 2×2 metric card grid
- Equipment list: three starting items shown as tags
- Confirm button: serialises all character data into the sendPrompt string (see below)

### Stat Generation (D&D 5e)

Each archetype has a fixed base stat array. On selection:
1. Apply the base array.
2. Roll 1d4 bonus for two randomly selected non-primary stats (adds variety).
3. Calculate modifiers: `floor((stat - 10) / 2)`, display as `+N` or `−N`.
4. Calculate derived stats from the archetype template.

```js
function generateStats(archetype) {
  const stats = { ...archetype.baseStats };
  // Add 1d4 to two random non-primary stats
  const nonPrimary = Object.keys(stats).filter(k => !archetype.primaryStats.includes(k));
  const boosted = nonPrimary.sort(() => Math.random() - 0.5).slice(0, 2);
  boosted.forEach(k => { stats[k] += Math.floor(Math.random() * 4) + 1; });
  return stats;
}

function modifier(stat) {
  return Math.floor((stat - 10) / 2);
}
```

---

## D&D 5e Archetypes

### Default Archetypes

| Archetype | Primary | STR | DEX | INT | WIS | CON | CHA | HP | AC | Flavour |
|-----------|---------|-----|-----|-----|-----|-----|-----|----|----|---------|
| Soldier | STR, CON | 16 | 10 | 10 | 10 | 14 | 10 | 12 | 14 | Combat-trained, tactical instincts |
| Scout | DEX, WIS | 10 | 16 | 10 | 14 | 10 | 10 | 9 | 13 | Agile, perceptive, evasive |
| Engineer | INT, DEX | 10 | 12 | 16 | 10 | 10 | 10 | 8 | 12 | Improviser, systems expert |
| Medic | WIS, INT | 10 | 10 | 14 | 16 | 10 | 10 | 9 | 11 | Healer, calm under pressure |
| Diplomat | CHA, INT | 10 | 10 | 14 | 10 | 10 | 16 | 8 | 11 | Persuader, reads people |
| Smuggler | DEX, CHA | 10 | 16 | 10 | 10 | 10 | 14 | 10 | 13 | Slippery, charming, resourceful |

### Starting Equipment by Archetype

| Archetype | Weapon | Armour/Tool | Consumable |
|-----------|--------|-------------|------------|
| Soldier | Combat knife (1d6+STR) | Light armour (+2 AC) | Stim pack (restore 1d6 HP) |
| Scout | Short bow / sidearm (1d6+DEX) | Scout's cloak (+1 Stealth) | Ration pack (3 uses) |
| Engineer | Wrench (1d4+STR, improvised) | Repair kit (3 uses) | EMP charge (1 use) |
| Medic | Scalpel (1d4+DEX) | Medical bag (5 uses) | Antitoxin (2 uses) |
| Diplomat | Hidden blade (1d4+DEX) | Fine clothes (+1 CHA checks) | Sealed letter (key item) |
| Smuggler | Holdout pistol (1d6+DEX) | Concealed holster | Lockpick set (5 uses) |

### Theme-Adapted Names

Adapt archetype names and flavour to match the scenario theme. Stat arrays remain identical.

| Default | Sci-Fi | Fantasy | Historical | Post-Apocalyptic | Cyberpunk | Steampunk | Wuxia | Isekai | Superhero | Survival | Political |
|---------|--------|---------|------------|------------------|-----------|-----------|-------|--------|-----------|----------|-----------|
| Soldier | Security Officer | Knight / Warrior | Legionary / Man-at-Arms | Enforcer | Street Samurai | Dragoon | Sword Saint | Berserker | Brawler | Guardian | Duelist |
| Scout | Recon Specialist | Ranger / Hunter | Scout / Outrider | Stalker | Netrunner | Saboteur | Shadow | Trickster | Vigilante | Scout | Informant |
| Engineer | Systems Tech | Artificer / Smith | Mason / Siege Engineer | Mechanic | Rigger | Mechanist | Craftsman | Builder | Gadgeteer | Improviser | Quartermaster |
| Medic | Field Medic | Healer / Herbalist | Barber-Surgeon / Wise Woman | Doc | Street Doc | Apothecary | Physician | Healer | First Responder | Field Medic | Court Physician |
| Diplomat | Liaison Officer | Bard / Emissary | Herald / Envoy | Trader | Fixer | Parliamentarian | Wandering Monk | Mediator | Public Figure | Peacemaker | Courtier |
| Smuggler | Cargo Runner | Rogue / Thief | Smuggler / Fence | Scavenger | Data Analyst | Inventor | Sage | Analyst | Genius | Naturalist | Advisor |

---

## Proficiency Selection

After stat generation, present a proficiency selection step within the character creation
widget. This step appears between the stat block reveal and the final confirmation button.

1. Display the 2 fixed proficiencies granted by the chosen archetype (shown as locked tags).
2. Present the remaining 10 skills as selectable buttons. The player chooses exactly 2.
3. Each skill button shows the skill name and its governing attribute in a subtle label
   (e.g., "Stealth — AGI").
4. Once 2 skills are selected, highlight them and enable the confirmation button.
5. Track the full set of 4 proficiencies (2 fixed + 2 chosen) in widget JS state —
   these are serialised into the confirm sendPrompt string (see below).

**Widget addition — proficiency picker (inserted after the stat block):**

```html
<div class="proficiency-section">
  <h3>Proficiencies</h3>
  <p class="prof-label">Archetype grants:</p>
  <div class="prof-fixed">
    <!-- Rendered from archetype.fixedProficiencies -->
    <span class="prof-tag locked">Athletics (STR)</span>
    <span class="prof-tag locked">Intimidation (STR)</span>
  </div>
  <p class="prof-label">Choose 2 more:</p>
  <div class="prof-choices" id="prof-choices">
    <!-- Rendered from remaining skills, excluding fixed ones -->
  </div>
  <p class="prof-count" id="prof-count">0 / 2 selected</p>
</div>
```

```js
let chosenProfs = [];
const fixedProfs = archetype.fixedProficiencies; // e.g. ['Athletics', 'Intimidation']

document.querySelectorAll('.prof-choice-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const skill = btn.dataset.skill;
    if (chosenProfs.includes(skill)) {
      chosenProfs = chosenProfs.filter(s => s !== skill);
      btn.classList.remove('selected');
    } else if (chosenProfs.length < 2) {
      chosenProfs.push(skill);
      btn.classList.add('selected');
    }
    document.getElementById('prof-count').textContent = chosenProfs.length + ' / 2 selected';
    document.getElementById('confirm-btn').disabled = chosenProfs.length !== 2;
  });
});
```

**CRITICAL:** The confirmation `sendPrompt` must include ALL character data — name,
archetype, stats, proficiencies, and starting equipment. There is no persistent client-side
`gmState` between widget renders. Each widget is a fresh iframe. The ONLY data that crosses
the boundary between the player's widget and the GM is the sendPrompt string. If data is
not in the prompt, the GM does not have it.

```js
// Build the confirm prompt with all character data serialised
const name = document.getElementById('char-name').value || 'Unnamed';
const archetype = document.querySelector('[name="archetype"]:checked')?.value;
const stats = JSON.parse(document.getElementById('stat-block').dataset.stats || '{}');
const profs = Array.from(document.querySelectorAll('.prof-selected')).map(el => el.textContent);
const gear = Array.from(document.querySelectorAll('.equip-tag')).map(el => el.textContent);

const prompt = `My character is ready. Begin the adventure. `
  + `Name: ${name}. Class: ${archetype}. `
  + `STR: ${stats.STR}, DEX: ${stats.DEX}, INT: ${stats.INT}, `
  + `WIS: ${stats.WIS}, CON: ${stats.CON}, CHA: ${stats.CHA}. `
  + `Proficiencies: ${profs.join(', ')}. `
  + `Equipment: ${gear.join(', ')}.`;
```

---

## Other Game Systems

The text-adventure skill is system-agnostic. Specific game systems (such as Star Wars: Edge
of the Empire) have their own dedicated skills with tailored character creation, careers,
and attribute definitions. This module covers D&D 5e and custom rulebooks only.

---

## Custom Rulebook Characters

When using a custom rulebook:
1. Read the provided PDF or markdown for attribute definitions.
2. Present attributes in the character creation widget using the custom names and value ranges.
3. Map archetypes to the custom system's classes/careers/roles.
4. Apply the custom system's stat generation method.
5. If the custom system has no defined archetypes, present a point-buy system where the player
   allocates a fixed pool of points across attributes.

---

## Character Naming

The name input is a free text field with a **Random Name** button beside it. When clicked,
the button generates a thematically appropriate name based on the active scenario and theme.

### Random Name Button

The character creation widget includes a button next to the name input that generates a
random name on click. The button uses `addEventListener` (not inline onclick) and populates
the name input field:

```html
<div class="name-row">
  <input type="text" id="char-name" class="name-input" placeholder="Enter your name...">
  <button class="name-random-btn" id="random-name-btn">Random</button>
</div>
```

```js
document.getElementById('random-name-btn').addEventListener('click', function() {
  var input = document.getElementById('char-name');
  if (input) input.value = generateName();
});
```

The `generateName()` function is defined by the GM at render time, drawing from a name pool
appropriate to the theme:

- **Space / Sci-Fi:** Mix cultural origins — East Asian, Slavic, Latin, West African, Nordic.
  Surnames can be occupational, locational, or patronymic. Example pool: Kael Osei, Mira Sokolov,
  Renn Achebe, Suki Nakamura, Aris Johanssen.
- **Fantasy:** Follow genre conventions but avoid overused tropes (no "Shadowblade Darkfyre").
  Use phonetic patterns that feel pronounceable. Example pool: Elara Thornwood, Caius Dawnforge,
  Wren Ashvale, Theron Mossbell.
- **Historical:** Period-appropriate naming conventions. A Roman campaign uses praenomen + nomen +
  cognomen. A Victorian campaign uses formal given + surname.
- **Horror / Modern:** Ordinary names that ground the character in reality. The mundane name
  contrasts with the extraordinary situation.
- **Post-Apocalyptic:** Short, functional names — often single names or nicknames earned through
  survival. Example pool: Flint, Cinder, Patch, Rust, Wren.

The button can be clicked multiple times to cycle through options. Each click generates a
fresh name — it does not cycle through a fixed list.

If the player leaves the name input blank and proceeds, generate a name automatically using
the same theme-appropriate logic.

---

## Anti-Patterns

- Never auto-generate a character without player input — the player chooses their archetype and name.
- Never reveal the full stat array before archetype selection — show it after, as a reveal.
- Never use the same starting equipment across all archetypes — differentiation matters.
- Never skip the confirmation button — the player must explicitly approve their character.
- Never hard-code scenario-specific names into the archetype table — always adapt to theme.
- Never present more than 6 archetypes at once — choice paralysis diminishes the experience.
  If the theme demands more variety, present 6 and offer "Show more options" as a secondary action.
