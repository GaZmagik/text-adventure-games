// Character creation widget — supports pre-generated characters and custom builds.
// Accepts --data JSON with:
//   preGeneratedCharacters[]  optional ready-made characters
//   allowCustom              optional boolean (default true)
//   archetypes[]             optional archetype cards for custom builds
//   proficiencies[]          optional selectable proficiencies for custom builds
//   defaultName              optional default custom character name

import type { GmState } from '../../types';
import { esc, serialiseInlineScriptData } from '../../lib/html';
import { COMMON_WIDGET_CSS } from '../lib/common-css';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

type Archetype = {
  name: string;
  description?: string;
  flavour?: string;
  stats?: Record<string, number>;
  baseStats?: Record<string, number>;
  abilities?: string[];
  equipment?: string[];
  primaryStats?: string[];
  fixedProficiencies?: string[];
  hp?: number;
  ac?: number;
  id?: string;
};

type PreGeneratedCharacter = {
  name: string;
  class?: string;
  hook?: string;
  background?: string;
  pronouns?: string;
  stats?: Record<string, number>;
  proficiencies?: string[];
  abilities?: string[];
  equipment?: unknown[];
  startingInventory?: unknown[];
  startingCurrency?: number;
  currency?: number;
  hp?: number;
  ac?: number;
  id?: string;
  openingLens?: string;
  prologueVariant?: string;
};

export function renderCharacterCreation(_state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  const raw = (options?.data ?? {}) as Record<string, unknown>;
  const archetypes: Archetype[] = Array.isArray(raw.archetypes) ? raw.archetypes as Archetype[] : [];
  const preGeneratedCharacters: PreGeneratedCharacter[] = Array.isArray(raw.preGeneratedCharacters)
    ? raw.preGeneratedCharacters as PreGeneratedCharacter[]
    : [];
  const allowCustom = raw.allowCustom !== false;
  const proficiencies = Array.isArray(raw.proficiencies)
    ? (raw.proficiencies as unknown[]).map(p => {
        if (typeof p === 'string') return p;
        const obj = p as Record<string, unknown>;
        const name = String(obj.name ?? '');
        const attr = obj.attr ? ` (${obj.attr})` : '';
        return name + attr;
      })
    : ['Athletics', 'Acrobatics', 'Stealth', 'Arcana', 'History', 'Investigation', 'Nature', 'Religion', 'Perception', 'Insight', 'Persuasion', 'Deception', 'Intimidation', 'Performance', 'Survival', 'Medicine', 'Animal Handling', 'Sleight of Hand'];
  const defaultName = typeof raw.defaultName === 'string' ? raw.defaultName : '';

  const namePoolRaw = (options?.namePool ?? {}) as Record<string, unknown>;
  const givenNames: string[] = Array.isArray(namePoolRaw.given) ? namePoolRaw.given as string[] : [];
  const surnames: string[] = Array.isArray(namePoolRaw.surname) ? namePoolRaw.surname as string[] : [];

  const presetCards = preGeneratedCharacters.map((preset, i) => {
    const desc = preset.hook ?? preset.background ?? '';
    const stats = preset.stats
      ? Object.entries(preset.stats).map(([k, v]) => `<span class="arch-stat">${esc(k)} ${Number(v) || 0}</span>`).join(' ')
      : '';
    const meta: string[] = [];
    if (preset.class) meta.push(esc(preset.class));
    if (preset.hp !== undefined) meta.push(`HP ${Number(preset.hp) || 0}`);
    if (preset.ac !== undefined) meta.push(`AC ${Number(preset.ac) || 0}`);

    return `
      <button class="preset-card" data-preset-index="${i}" aria-pressed="false">
        <div class="arch-name">${esc(preset.name)}</div>
        ${preset.class ? `<div class="arch-desc preset-class">${esc(preset.class)}</div>` : ''}
        ${desc ? `<div class="arch-desc">${esc(desc)}</div>` : ''}
        ${stats ? `<div class="arch-stats">${stats}</div>` : ''}
        ${meta.length > 0 ? `<div class="arch-meta">${meta.join(' · ')}</div>` : ''}
      </button>`;
  }).join('\n');

  const archetypeCards = archetypes.map((arch, i) => {
    const desc = arch.description ?? arch.flavour ?? '';
    const statMap = arch.stats ?? arch.baseStats;
    const stats = statMap
      ? Object.entries(statMap).map(([k, v]) => `<span class="arch-stat">${esc(k)} ${Number(v) || 0}</span>`).join(' ')
      : '';
    const rawGear = arch.equipment ?? arch.abilities ?? [];
    const gear = rawGear.map(a => typeof a === 'string' ? a : (a && typeof a === 'object' && 'name' in a) ? String((a as Record<string, unknown>).name) : String(a));
    const gearHtml = gear.length > 0
      ? gear.map(a => `<span class="arch-ability">${esc(a)}</span>`).join(' ')
      : '';
    const fixedProfs = arch.fixedProficiencies ?? [];
    const profsHtml = fixedProfs.length > 0
      ? `<div class="arch-profs" style="margin-top:4px;font-size:10px;color:var(--sta-text-tertiary, #545880);">Proficiencies: ${fixedProfs.map(p => esc(p)).join(', ')}</div>`
      : '';

    return `
      <button class="archetype-card" data-index="${i}" aria-pressed="false">
        <div class="arch-name">${esc(arch.name)}</div>
        ${desc ? `<div class="arch-desc">${esc(desc)}</div>` : ''}
        ${stats ? `<div class="arch-stats">${stats}</div>` : ''}
        ${gearHtml ? `<div class="arch-abilities">${gearHtml}</div>` : ''}
        ${profsHtml}
        ${arch.hp !== undefined ? `<div class="arch-meta">HP ${Number(arch.hp) || 0}${arch.ac !== undefined ? ` · AC ${Number(arch.ac) || 0}` : ''}</div>` : ''}
      </button>`;
  }).join('\n');

  const profOptions = proficiencies.map(p =>
    `<button class="prof-option" data-prof="${esc(p)}" aria-pressed="false">${esc(p)}</button>`,
  ).join('\n        ');

  const subtitle = preGeneratedCharacters.length > 0
    ? 'Choose a ready-made character or create your own'
    : 'Choose an archetype, name your character, and select proficiencies';

  return wrapInShadowDom({
    styleName,
    inlineCss: `${COMMON_WIDGET_CSS}
.widget-char-creation { font-family: var(--ta-font-body); padding: 16px; }
.selection-grid, .archetype-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.preset-card, .custom-entry-card, .archetype-card {
  padding: 14px; border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4));
  border-radius: 8px; cursor: pointer; transition: all 0.2s; background: transparent;
}
.preset-card:hover, .custom-entry-card:hover, .archetype-card:hover { border-color: var(--ta-color-accent); }
.preset-card.selected, .custom-entry-card.selected, .archetype-card.selected { border-color: var(--ta-color-accent); background: var(--ta-color-accent-bg); }
.arch-name { font-family: var(--ta-font-heading); font-size: 15px; font-weight: 700; color: var(--sta-text-primary, #EEF0FF); margin-bottom: 4px; }
.arch-desc { font-size: 11px; color: var(--sta-text-secondary, #9AA0C0); line-height: 1.4; margin-bottom: 6px; }
.preset-class { color: var(--ta-color-accent); }
.arch-stats { margin-bottom: 4px; }
.arch-stat { display: inline-block; padding: 1px 6px; font-size: 10px; border-radius: 4px; background: var(--sta-border-tertiary, rgba(84,88,128,0.4)); color: var(--sta-text-primary, #EEF0FF); margin-right: 4px; font-weight: 600; }
.arch-abilities { margin-bottom: 4px; }
.arch-ability { display: inline-block; padding: 1px 6px; font-size: 10px; border-radius: 4px; background: var(--ta-color-accent-bg); color: var(--ta-color-accent); margin-right: 4px; }
.arch-meta { font-size: 10px; color: var(--sta-text-tertiary, #545880); }
.name-input {
  width: 100%; padding: 10px 14px; font-family: var(--ta-font-body);
  font-size: 14px; background: transparent;
  border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); border-radius: 6px;
  color: var(--sta-text-primary, #EEF0FF); box-sizing: border-box;
}
.name-input:focus { border-color: var(--ta-color-accent); outline: 2px solid var(--ta-color-focus); outline-offset: 2px; }
.name-error { color: var(--ta-color-danger); font-size: 11px; margin-top: 4px; display: block; }
.prof-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.prof-option {
  padding: 8px 12px; font-size: 11px; border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4));
  border-radius: 12px; background: transparent; color: var(--sta-text-secondary, #9AA0C0);
  cursor: pointer; transition: all 0.2s; min-height: 44px;
}
.prof-option:hover { border-color: var(--ta-color-accent); }
.prof-option.selected { border-color: var(--ta-color-accent); background: var(--ta-color-accent-bg); color: var(--ta-color-accent); font-weight: 600; }
.preset-summary {
  border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4));
  border-radius: 8px; padding: 12px; background: rgba(255,255,255,0.02);
  color: var(--sta-text-secondary, #9AA0C0); font-size: 12px; line-height: 1.5;
}
.preset-summary strong { color: var(--sta-text-primary, #EEF0FF); }
.archetype-card:focus-visible, .prof-option:focus-visible, .preset-card:focus-visible, .custom-entry-card:focus-visible {
  outline: 2px solid var(--ta-color-focus);
  outline-offset: 2px;
}
.is-hidden { display: none !important; }`,
    html: `<div class="widget-char-creation">
  <div class="widget-title">Create Your Character</div>
  <div class="widget-subtitle">${esc(subtitle)}</div>

  ${preGeneratedCharacters.length > 0 ? `
  <div class="widget-section">
    <div class="widget-label">Starting Character</div>
    <div class="selection-grid">
      ${presetCards}
      ${allowCustom ? `
      <button class="custom-entry-card selected" id="custom-entry-card" aria-pressed="true">
        <div class="arch-name">Create Your Own</div>
        <div class="arch-desc">Build a custom character and let the harbour assign the opening lens that fits them best.</div>
      </button>` : ''}
    </div>
  </div>
  <div class="widget-section is-hidden" id="preset-summary-wrap">
    <div class="widget-label">Selected Character</div>
    <div class="preset-summary" id="preset-summary"></div>
  </div>` : ''}

  <div class="widget-section">
    <div class="widget-label">Pronouns</div>
    <div class="option-grid" id="pronoun-grid">
      <button class="option-card" data-pronouns="she/her" aria-pressed="false">she/her</button>
      <button class="option-card" data-pronouns="he/him" aria-pressed="false">he/him</button>
      <button class="option-card" data-pronouns="they/them" aria-pressed="false">they/them</button>
      <button class="option-card" data-pronouns="custom" aria-pressed="false">Custom</button>
    </div>
    <div id="custom-pronouns" class="is-hidden" style="display:flex;margin-top:8px;gap:8px;align-items:center">
      <select id="pronoun-subject" class="name-input" style="width:auto;padding:8px 12px;font-size:12px">
        <option value="he">he</option>
        <option value="she">she</option>
        <option value="they">they</option>
      </select>
      <span style="font-size:12px;color:var(--sta-text-tertiary, #545880)">/</span>
      <select id="pronoun-object" class="name-input" style="width:auto;padding:8px 12px;font-size:12px">
        <option value="him">him</option>
        <option value="her">her</option>
        <option value="them">them</option>
      </select>
    </div>
  </div>

  <div id="custom-character-fields"${preGeneratedCharacters.length > 0 && allowCustom ? '' : ''}>
    <div class="widget-section">
      <div class="widget-label">Name</div>
      <div style="display:flex;gap:8px;align-items:center">
        <input class="name-input" id="char-name-input" type="text" placeholder="Enter character name..." value="${esc(defaultName)}" maxlength="80" style="flex:1">
        <button class="option-card" id="randomise-name" type="button" style="white-space:nowrap;flex-shrink:0" title="Generate a random name">Randomise</button>
      </div>
      <span id="name-error" class="name-error is-hidden" role="alert"></span>
    </div>

    ${archetypes.length > 0 ? `
    <div class="widget-section">
      <div class="widget-label">Archetype</div>
      <div class="archetype-grid">
        ${archetypeCards}
      </div>
    </div>` : ''}

    <div class="widget-section">
      <div class="widget-label">Proficiencies (choose 2)</div>
      <div class="prof-grid">
        ${profOptions}
      </div>
    </div>
  </div>

  <button class="confirm-btn" id="creation-confirm" title="Create character with the selected setup">Create Character</button>
</div>`,
    script: `var preGeneratedCharacters = ${serialiseInlineScriptData(preGeneratedCharacters)};
var allowCustom = ${serialiseInlineScriptData(allowCustom)};
var selectedMode = ${serialiseInlineScriptData(preGeneratedCharacters.length > 0 && !allowCustom ? 'preset' : 'custom')};
var selectedPreset = ${serialiseInlineScriptData(preGeneratedCharacters.length > 0 && !allowCustom ? 0 : -1)};
var selectedArchetype = -1;
var selectedProfs = [];
var lockedProfs = [];
var selectedPronouns = '';
var customNameCache = ${serialiseInlineScriptData(defaultName)};
var givenPool = ${serialiseInlineScriptData(givenNames)};
var surnamePool = ${serialiseInlineScriptData(surnames)};
var archetypeProfs = ${serialiseInlineScriptData(archetypes.map(a => a.fixedProficiencies ?? []))};
var archetypeMechanics = ${serialiseInlineScriptData(archetypes.map(a => ({
  stats: a.stats ?? a.baseStats ?? {},
  hp: a.hp ?? 0,
  ac: a.ac ?? 0,
  abilities: a.abilities ?? [],
  equipment: a.equipment ?? [],
})))};

function sendOrCopyPrompt(btn, prompt) {
  btn.setAttribute('title', prompt);
  if (typeof sendPrompt === 'function') {
    sendPrompt(prompt);
  } else {
    var ta = document.createElement('textarea');
    var copied = false;
    ta.value = prompt;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try {
      copied = !!document.execCommand('copy');
    } catch (_err) {
      copied = false;
    }
    document.body.removeChild(ta);
    var orig = btn.textContent;
    btn.textContent = copied ? 'Copied! Paste as your reply.' : 'Copy the prompt from the tooltip.';
    setTimeout(function() { btn.textContent = orig; }, 3000);
  }
}

function summarisePreset(preset) {
  var lines = [];
  lines.push('<strong>' + preset.name + '</strong>' + (preset.class ? ' · ' + preset.class : ''));
  if (preset.hook) lines.push(preset.hook);
  if (preset.background && !preset.hook) lines.push(preset.background);
  return lines.join('<br>');
}

function updateSelectionCards() {
  shadow.querySelectorAll('.preset-card').forEach(function(card) {
    var idx = parseInt(card.getAttribute('data-preset-index'), 10);
    var selected = selectedMode === 'preset' && idx === selectedPreset;
    card.classList.toggle('selected', selected);
    card.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
  var customCard = shadow.getElementById('custom-entry-card');
  if (customCard) {
    var customSelected = selectedMode === 'custom';
    customCard.classList.toggle('selected', customSelected);
    customCard.setAttribute('aria-pressed', customSelected ? 'true' : 'false');
  }
}

function setCustomMode() {
  selectedMode = 'custom';
  selectedPreset = -1;
  var customFields = shadow.getElementById('custom-character-fields');
  if (customFields) customFields.classList.remove('is-hidden');
  var summaryWrap = shadow.getElementById('preset-summary-wrap');
  if (summaryWrap) summaryWrap.classList.add('is-hidden');
  var nameInput = shadow.getElementById('char-name-input');
  if (nameInput) {
    nameInput.disabled = false;
    if (!nameInput.value) nameInput.value = customNameCache || '';
  }
  var randomise = shadow.getElementById('randomise-name');
  if (randomise) randomise.disabled = false;
  updateSelectionCards();
}

function setPresetMode(index) {
  if (index < 0 || index >= preGeneratedCharacters.length) return;
  selectedMode = 'preset';
  selectedPreset = index;
  var preset = preGeneratedCharacters[index];
  var customFields = shadow.getElementById('custom-character-fields');
  if (customFields) customFields.classList.add('is-hidden');
  var summaryWrap = shadow.getElementById('preset-summary-wrap');
  var summary = shadow.getElementById('preset-summary');
  if (summaryWrap && summary) {
    summary.innerHTML = summarisePreset(preset);
    summaryWrap.classList.remove('is-hidden');
  }
  var nameInput = shadow.getElementById('char-name-input');
  if (nameInput) {
    customNameCache = nameInput.value;
    nameInput.value = preset.name || '';
    nameInput.disabled = true;
  }
  var randomise = shadow.getElementById('randomise-name');
  if (randomise) randomise.disabled = true;
  updateSelectionCards();
}

shadow.querySelectorAll('.preset-card').forEach(function(card) {
  card.addEventListener('click', function() {
    setPresetMode(parseInt(this.getAttribute('data-preset-index'), 10));
  });
});

var customEntryCard = shadow.getElementById('custom-entry-card');
if (customEntryCard) {
  customEntryCard.addEventListener('click', function() {
    setCustomMode();
  });
}

shadow.querySelectorAll('.archetype-card').forEach(function(card) {
  card.addEventListener('click', function() {
    shadow.querySelectorAll('.archetype-card').forEach(function(c) {
      c.classList.remove('selected');
      c.setAttribute('aria-pressed', 'false');
    });
    this.classList.add('selected');
    this.setAttribute('aria-pressed', 'true');
    selectedArchetype = parseInt(this.getAttribute('data-index'), 10);
    selectedProfs = [];
    lockedProfs = archetypeProfs[selectedArchetype] || [];
    shadow.querySelectorAll('.prof-option').forEach(function(btn) {
      var prof = btn.getAttribute('data-prof');
      btn.classList.remove('selected');
      btn.setAttribute('aria-pressed', 'false');
      btn.disabled = false;
      btn.style.opacity = '';
      btn.style.cursor = '';
      if (lockedProfs.indexOf(prof) >= 0) {
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.style.cursor = 'default';
      }
    });
  });
});

shadow.querySelectorAll('.prof-option').forEach(function(btn) {
  btn.addEventListener('click', function() {
    if (lockedProfs.indexOf(this.getAttribute('data-prof')) >= 0) return;
    var prof = this.getAttribute('data-prof');
    var idx = selectedProfs.indexOf(prof);
    if (idx >= 0) {
      selectedProfs.splice(idx, 1);
      this.classList.remove('selected');
      this.setAttribute('aria-pressed', 'false');
    } else if (selectedProfs.length < 2) {
      selectedProfs.push(prof);
      this.classList.add('selected');
      this.setAttribute('aria-pressed', 'true');
    }
  });
});

shadow.querySelectorAll('#pronoun-grid .option-card').forEach(function(btn) {
  btn.addEventListener('click', function() {
    shadow.querySelectorAll('#pronoun-grid .option-card').forEach(function(b) {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed', 'false');
    });
    this.classList.add('selected');
    this.setAttribute('aria-pressed', 'true');
    var value = this.getAttribute('data-pronouns');
    var customDiv = shadow.getElementById('custom-pronouns');
    if (value === 'custom') {
      customDiv.classList.remove('is-hidden');
      var subj = shadow.getElementById('pronoun-subject').value;
      var obj = shadow.getElementById('pronoun-object').value;
      selectedPronouns = subj + '/' + obj;
    } else {
      customDiv.classList.add('is-hidden');
      selectedPronouns = value;
    }
  });
});

shadow.getElementById('pronoun-subject').addEventListener('change', function() {
  selectedPronouns = this.value + '/' + shadow.getElementById('pronoun-object').value;
});
shadow.getElementById('pronoun-object').addEventListener('change', function() {
  selectedPronouns = shadow.getElementById('pronoun-subject').value + '/' + this.value;
});

shadow.getElementById('randomise-name').addEventListener('click', function() {
  if (givenPool.length > 0 && surnamePool.length > 0) {
    var g = givenPool[Math.floor(Math.random() * givenPool.length)];
    var s = surnamePool[Math.floor(Math.random() * surnamePool.length)];
    shadow.getElementById('char-name-input').value = g + ' ' + s;
    customNameCache = shadow.getElementById('char-name-input').value;
  }
  shadow.getElementById('name-error').classList.add('is-hidden');
});

shadow.getElementById('char-name-input').addEventListener('input', function() {
  customNameCache = this.value;
  shadow.getElementById('name-error').textContent = '';
  shadow.getElementById('name-error').classList.add('is-hidden');
});

shadow.getElementById('creation-confirm').addEventListener('click', function() {
  if (selectedMode === 'preset' && selectedPreset >= 0) {
    var preset = preGeneratedCharacters[selectedPreset] || {};
    var presetPayload = {
      name: preset.name || 'Unnamed',
      class: preset.class || preset.name || 'Adventurer',
      archetypeLabel: preset.class || preset.name || 'Adventurer',
      characterOrigin: 'pregen',
      openingLens: preset.openingLens || '',
      prologueVariant: preset.prologueVariant || '',
      proficiencies: Array.isArray(preset.proficiencies) ? preset.proficiencies : [],
      pronouns: selectedPronouns || preset.pronouns || 'they/them',
      stats: preset.stats || {},
      hp: preset.hp || 0,
      ac: preset.ac || 0,
      abilities: Array.isArray(preset.abilities) ? preset.abilities : [],
      equipment: Array.isArray(preset.startingInventory) ? preset.startingInventory : (Array.isArray(preset.equipment) ? preset.equipment : []),
      currency: preset.startingCurrency || preset.currency || 0
    };
    sendOrCopyPrompt(this, 'Create character: ' + JSON.stringify(presetPayload));
    return;
  }

  var name = shadow.getElementById('char-name-input').value.trim();
  if (!name) {
    shadow.getElementById('name-error').textContent = 'Please enter a character name.';
    shadow.getElementById('name-error').classList.remove('is-hidden');
    return;
  }

  var allProfs = lockedProfs.slice();
  selectedProfs.forEach(function(p) { if (allProfs.indexOf(p) < 0) allProfs.push(p); });
  var mech = selectedArchetype >= 0 ? archetypeMechanics[selectedArchetype] : {};
  var archetypeNameNode = selectedArchetype >= 0
    ? shadow.querySelector('.archetype-card[data-index="' + selectedArchetype + '"] .arch-name')
    : null;
  var archetypeName = archetypeNameNode ? archetypeNameNode.textContent : '';
  var payload = {
    name: name,
    archetypeIndex: selectedArchetype,
    archetypeLabel: archetypeName,
    characterOrigin: 'custom',
    proficiencies: allProfs,
    pronouns: selectedPronouns || 'they/them',
    stats: mech.stats || {},
    hp: mech.hp || 0,
    ac: mech.ac || 0,
    abilities: mech.abilities || [],
    equipment: mech.equipment || []
  };
  sendOrCopyPrompt(this, 'Create character: ' + JSON.stringify(payload));
});

if (preGeneratedCharacters.length > 0 && !allowCustom) {
  setPresetMode(0);
} else {
  setCustomMode();
}`,
  });
}
