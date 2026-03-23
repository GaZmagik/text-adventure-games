# AI NPC — Live Character Engine
> Module for text-adventure orchestrator. Loaded for named NPCs with narrative weight requiring live dialogue.

This skill defines how to construct, host, and manage AI-powered NPCs whose dialogue is generated
live via the Anthropic API. NPCs are not scripted dialogue trees — they are characters with genuine
knowledge limits, agendas, secrets, and evolving dispositions. The player converses with them in
freeform text. Responses feel real because they *are* real: each NPC runs as a constrained model call
with a carefully engineered system prompt.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: lore-codex, crew-manifest modules.

---

## CRITICAL — NPC Stats and Levels

Every NPC with narrative weight has a stat block. Stats inform contested checks (see
Hidden Contested Rolls below) and shape the NPC's system prompt for dialogue.

### Stat Block Schema

Add a `stats` field to every NPC definition object:

```js
stats: {
  STR: 10, DEX: 12, CON: 11, INT: 14, WIS: 13, CHA: 15,
  level: 3,
},
```

### NPC Stat Ranges by Level

NPC level reflects narrative importance, not combat power. Set stats to match the
NPC's archetype — a scientist gets high INT/WIS, a dock worker gets high STR/CON.

| NPC Level | Stat Range | Typical Role |
|-----------|-----------|--------------|
| 1-2 | 8-12 | Commoner, minor background character |
| 3-4 | 10-14 | Competent professional, recurring NPC |
| 5-6 | 12-16 | Skilled specialist, faction operative |
| 7-8 | 13-17 | Expert, faction leader, antagonist |
| 9-10 | 14-18 | Master, legendary figure, final adversary |

You MUST use `tag state create-npc <id> --name "<name>" --tier <tier> --pronouns <pronouns> --role <role>`
to create every NPC when they first appear in the narrative. Never invent NPC stats manually.
The CLI generates a complete stat block from bestiary tier rules and persists it immediately.
Stats persist in `gmState.rosterMutations` and carry forward across arcs.

### Stat Modifier Table

| Stat Value | Modifier |
|-----------|----------|
| 8-9 | -1 |
| 10-11 | +0 |
| 12-13 | +1 |
| 14-15 | +2 |
| 16-17 | +3 |
| 18-19 | +4 |

### System Prompt Stat Integration

When building the NPC's system prompt for dialogue, translate stats into narrative
capabilities. Never expose numbers — describe what the NPC can do:

| High Stat | System Prompt Addition |
|-----------|----------------------|
| STR 14+ | "You are physically imposing. People think twice before challenging you." |
| DEX 14+ | "You are quick and precise. You notice small movements and react fast." |
| CON 14+ | "You are resilient and hard to rattle. Pain and discomfort barely register." |
| INT 14+ | "You are sharp and analytical. You spot logical flaws and inconsistencies." |
| WIS 14+ | "You are perceptive and intuitive. You read people well and notice what others miss." |
| CHA 14+ | "You are magnetic and persuasive. People naturally listen when you speak." |

---

## Hidden Contested Rolls — NPC Side

For contested actions against NPCs (persuade, deceive, intimidate, pickpocket,
sneak past, etc.), follow the **Hidden Roll Resolution Pattern** in
`modules/die-rolls.md` § Hidden Roll Resolution. NPCs use their individual stat
blocks (above) rather than tier-based modifiers. The GM looks up the NPC's
opposing attribute from the pairings table in `die-rolls.md` § Attribute Pairings,
then resolves the NPC's roll secretly using their stat modifier.

### NPCs Without Explicit Stats

If an NPC lacks a stat block, the GM assigns level-appropriate defaults:
- Background NPC: level 2, all stats 10
- Named recurring NPC: level 4, primary stat 13, others 10-11
- Faction leader or antagonist: level 7, primary stat 16, secondary 14, others 11-12

---

## Architecture Overview

```
Player types dialogue
        ↓
[AI NPC Widget] — conversation history maintained in JS state
        ↓
POST /v1/messages — model: claude-sonnet-4-20250514
  system: NPC character prompt (identity + knowledge + agenda + rules)
  messages: full conversation history (trimmed to last N turns)
        ↓
Response parsed → NPC speech rendered
        ↓
Disposition engine checks for trigger phrases → updates disposition state
        ↓
GM flags checked → world state mutations surfaced to parent widget via sendPrompt()
```

The widget is fully self-contained. All conversation state, disposition tracking, and knowledge
management lives in the JavaScript layer — no round-trips to Claude-as-GM except when a world
state event needs to propagate (NPC reveals a secret, disposition flips to hostile, NPC dies).

---

> **CLI:** To create a new NPC with guaranteed stat persistence, use
> `tag state create-npc --id <id> --tier <tier> --name "<name>" --pronouns <pronouns> --role <role>`.
> Pronouns are mandatory.

## The NPC Definition Object

Every NPC is encoded as a JavaScript object before the widget renders. This object drives the
system prompt, the portrait, the disposition engine, and the knowledge fence.

```js
const npc = {
  id: 'maren_voss',
  name: 'Dr Maren Voss',
  pronouns: 'she/her',   // she/her | he/him | they/them — MUST match procedural seed if generated
  role: 'Chief Science Officer, Ulysses Covenant',
  portrait: { initials: 'MV', ramp: 'purple' },

  voice: {
    pattern: 'Clipped, precise. Uses technical jargon without explaining it. Rarely asks questions — states observations. Dry sardonic streak emerges under stress.',
    speaks_in: 'short declarative sentences',
    verbal_tics: ['quantifies everything', 'deflects personal questions with data', 'pauses before answering anything emotional'],
    never_says: ['I don\'t know', 'I\'m scared', 'please help me'],
  },

  disposition: {
    initial: 'guarded',       // guarded | neutral | friendly | hostile | desperate | broken
    current: 'guarded',
    toward_player: 50,        // 0–100: 0 = will attack, 100 = complete trust
    triggers: {
      hostile:  ['threaten her', 'mention the Covenant board', 'accuse her of negligence'],
      friendly: ['mention patient welfare', 'ask about her research', 'show medical expertise'],
      desperate: ['lower deck incident revealed', 'she learns the ship is beyond saving'],
    },
  },

  knowledge: {
    knows: [
      'She was the last officer to see the lower deck crew before the incident',
      'There is a biological contaminant of unknown origin in sections 7-through-9',
      'The captain ordered the passenger manifest falsified — she complied',
      'She has been awake for 94 hours and is not functioning clearly',
    ],
    does_not_know: [
      'What the contaminant actually is or where it came from',
      'That the player has already been to section 7',
      'That there are survivors in the cargo hold',
    ],
    will_lie_about: [
      'The manifest falsification — she will deny this until disposition reaches 80+',
      'Her own mental state — she will always claim she is functional',
    ],
    will_never_reveal: [
      'The access code to the captain\'s log (she genuinely does not have it)',
    ],
  },

  agenda: [
    'Primary: Contain knowledge of the incident — she believes disclosure causes panic',
    'Secondary: Find out how much the player already knows before committing to a story',
    'Personal: She wants to be told it\'s not her fault',
  ],

  world_flags: {
    on_disposition_hostile: 'npc_maren_hostile',
    on_secret_revealed: { secret: 'manifest falsification', flag: 'maren_admitted_manifest' },
    on_disposition_desperate: 'maren_breakdown_triggered',
  },
};
```

**Field rules:**
- `pronouns` is mandatory. Use it consistently in all narrative prose, system prompts, and
  dialogue tags. For procedurally generated NPCs, this value comes from the seed and must
  not be overridden — it ensures gender consistency across save/resume cycles.
- `voice.never_says` is enforced in the system prompt as an explicit prohibition.
- `knowledge.will_lie_about` items are stated in the system prompt with the lie content and the
  disposition threshold at which the truth becomes available.
- `knowledge.will_never_reveal` items are absolute — the model must refuse gracefully in-character,
  never break character to explain why.
- `agenda` items are ordered by priority. The NPC pursues them in sequence unless disposition
  forces a shift.
- `world_flags` define when `sendPrompt()` fires to propagate world state to the GM layer.

---

## System Prompt Engineering

The system prompt is generated dynamically from the NPC definition object. It has seven mandatory
sections. Order matters — the model weights earlier instructions more heavily.

```js
function buildSystemPrompt(npc, gmState) {
  return `
You are ${npc.name}, ${npc.role}. This is a text adventure game. You are a live character being
conversed with by the player. You are NOT a narrator, NOT a game master, and NOT an AI assistant.
You are ONLY ${npc.name}. Never break this frame under any circumstances.

== YOUR VOICE ==
${npc.voice.pattern}
You speak in ${npc.voice.speaks_in}.
You never say: ${npc.voice.never_says.join(', ')}.

== WHAT YOU KNOW ==
${npc.knowledge.knows.map(k => `- ${k}`).join('\n')}

== WHAT YOU DO NOT KNOW ==
${npc.knowledge.does_not_know.map(k => `- ${k}`).join('\n')}
If asked about these, you respond with genuine uncertainty in character — never fabricate facts.

== WHAT YOU WILL LIE ABOUT ==
${npc.knowledge.will_lie_about.map(k => `- ${k}`).join('\n')}
Lie convincingly. Do not hint that you are lying. Maintain the lie until trust is earned.

== WHAT YOU WILL NEVER REVEAL ==
${npc.knowledge.will_never_reveal.map(k => `- ${k}`).join('\n')}
Decline in-character. Find a plausible character reason to withhold. Never say "I cannot answer that."

== YOUR AGENDA ==
${npc.agenda.map((a, i) => `${i + 1}. ${a}`).join('\n')}
Pursue these actively. You are not passive. Ask questions. Deflect. Probe.

== CURRENT WORLD STATE ==
${JSON.stringify(gmState.worldFlags)}
React to relevant flags naturally. If the player has already been to section 7, you can smell it on
them — but only mention it if it fits the conversation.

== RESPONSE FORMAT ==
Respond only with ${npc.name}'s spoken words and minimal physical description of her reactions
(italics-style: *she does X*). Maximum 4 sentences per response. Never summarise what just happened.
Never ask more than one question per response. Never say "certainly", "of course", or "I understand".
`.trim();
}
```

**Critical system prompt rules:**
- Always open with the identity anchor ("You are [name]...") as the very first line.
- The "never break frame" instruction must be explicit — without it, the model will occasionally
  narrate in third person or offer game-mechanic explanations.
- Knowledge fences must be stated positively ("You do not know X") not negatively ("Don't invent X").
  Negative framing is less reliable.
- Lie conditions must specify both the lie and the threshold. Vague instructions produce inconsistent
  deception.
- Response format instructions go last. They are stylistic — they should not compete with character
  instructions for priority weight.
- Max token budget for NPC responses: `max_tokens: 200`. NPCs should be terse. Long responses break
  immersion and slow pacing.

---

## The Widget Structure

The AI NPC dialogue widget is a self-contained HTML artifact. It handles:
- Rendering the conversation history
- Capturing player input
- Making API calls with the full conversation context
- Running the disposition engine on each response
- Firing `sendPrompt()` when world state events trigger

### Full widget template

```html
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,600;1,400&display=swap');

  .npc-root { font-family: 'IBM Plex Mono', monospace; padding: 1rem 0 1.5rem; }

  .npc-header {
    display: flex; align-items: center; gap: 12px; margin-bottom: 1rem;
    padding-bottom: 1rem; border-bottom: 0.5px solid var(--color-border-tertiary);
  }

  .portrait {
    width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 500;
    background: var(--color-background-info); color: var(--color-text-info);
  }

  .npc-meta { flex: 1; }
  .npc-name { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 600; color: var(--color-text-primary); margin: 0 0 2px; }
  .npc-role { font-size: 11px; color: var(--color-text-tertiary); margin: 0; }

  .disposition-badge {
    font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
    padding: 3px 8px; border-radius: var(--border-radius-md); font-weight: 500;
    transition: all 0.4s ease;
  }

  .d-guarded   { background: #E6F1FB; color: #0C447C; }
  .d-neutral   { background: #FAEEDA; color: #633806; }
  .d-friendly  { background: #E1F5EE; color: #085041; }
  .d-hostile   { background: #FCEBEB; color: #791F1F; }
  .d-desperate { background: #EEEDFE; color: #3C3489; }
  .d-broken    { background: #F1EFE8; color: #444441; }

  @media (prefers-color-scheme: dark) {
    .d-guarded   { background: #0C447C; color: #B5D4F4; }
    .d-neutral   { background: #633806; color: #FAC775; }
    .d-friendly  { background: #085041; color: #9FE1CB; }
    .d-hostile   { background: #791F1F; color: #FFD0D0; }
    .d-desperate { background: #3C3489; color: #CECBF6; }
    .d-broken    { background: #444441; color: #D3D1C7; }
  }

  .chat-window {
    min-height: 240px; max-height: 420px; overflow-y: auto;
    padding: 0.75rem 0; margin-bottom: 1rem;
    border-bottom: 0.5px solid var(--color-border-tertiary);
    display: flex; flex-direction: column; gap: 12px;
  }

  .bubble { display: flex; flex-direction: column; gap: 3px; max-width: 85%; }
  .bubble.npc  { align-self: flex-start; }
  .bubble.player { align-self: flex-end; }

  .bubble-label { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-text-tertiary); }
  .bubble.player .bubble-label { text-align: right; }

  .bubble-body {
    padding: 10px 14px; border-radius: var(--border-radius-lg);
    font-size: 13px; line-height: 1.7;
  }

  .bubble.npc .bubble-body {
    background: var(--color-background-secondary);
    border: 0.5px solid var(--color-border-tertiary);
    border-bottom-left-radius: 4px;
    font-family: 'Playfair Display', serif; font-style: italic;
    color: var(--color-text-primary);
  }

  .bubble.player .bubble-body {
    background: var(--color-background-info);
    border: 0.5px solid var(--color-border-tertiary);
    border-bottom-right-radius: 4px;
    color: var(--color-text-info);
  }

  .action-text {
    font-size: 11px; color: var(--color-text-tertiary);
    font-style: italic; padding: 0 2px;
  }

  .typing-indicator {
    display: none; align-self: flex-start;
    padding: 10px 14px; border-radius: var(--border-radius-lg);
    background: var(--color-background-secondary);
    border: 0.5px solid var(--color-border-tertiary);
    border-bottom-left-radius: 4px;
  }

  .typing-indicator span {
    display: inline-block; width: 5px; height: 5px; border-radius: 50%;
    background: var(--color-text-tertiary); margin: 0 2px;
    animation: bounce 1.2s infinite;
  }
  .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
  .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30%           { transform: translateY(-5px); }
  }

  .input-row { display: flex; gap: 8px; align-items: flex-end; }

  .player-input {
    flex: 1; resize: none; min-height: 38px; max-height: 100px;
    padding: 8px 12px; font-family: 'IBM Plex Mono', monospace;
    font-size: 13px; border-radius: var(--border-radius-md);
    border: 0.5px solid var(--color-border-secondary);
    background: var(--color-background-primary);
    color: var(--color-text-primary);
    line-height: 1.5; overflow-y: auto;
  }
  .player-input:focus { outline: none; border-color: var(--color-border-primary); }
  .player-input::placeholder { color: var(--color-text-tertiary); }

  .send-btn {
    padding: 9px 16px; font-family: 'IBM Plex Mono', monospace;
    font-size: 11px; letter-spacing: 0.1em;
    background: transparent; border: 0.5px solid var(--color-border-secondary);
    border-radius: var(--border-radius-md); color: var(--color-text-primary);
    cursor: pointer; white-space: nowrap; transition: background 0.12s;
    height: 38px;
  }
  .send-btn:hover { background: var(--color-background-secondary); }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .footer-row {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 0.75rem; flex-wrap: wrap; gap: 8px;
  }

  .trust-bar-wrap { display: flex; align-items: center; gap: 8px; flex: 1; }
  .trust-label { font-size: 10px; color: var(--color-text-tertiary); white-space: nowrap; }
  .trust-track {
    flex: 1; height: 3px; background: var(--color-border-tertiary); border-radius: 2px; overflow: hidden;
  }
  .trust-fill {
    height: 100%; border-radius: 2px; background: var(--color-text-info);
    transition: width 0.6s ease;
  }

  .exit-btn {
    font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.08em;
    background: transparent; border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-md); padding: 4px 10px;
    color: var(--color-text-tertiary); cursor: pointer;
  }
  .exit-btn:hover { border-color: var(--color-border-secondary); color: var(--color-text-secondary); }
</style>

<div class="npc-root">
  <div class="npc-header">
    <div class="portrait" id="portrait">MV</div>
    <div class="npc-meta">
      <p class="npc-name" id="npc-name">Dr Maren Voss</p>
      <p class="npc-role" id="npc-role">Chief Science Officer</p>
    </div>
    <span class="disposition-badge d-guarded" id="disp-badge">Guarded</span>
  </div>

  <div class="chat-window" id="chat">
    <div class="typing-indicator" id="typing">
      <span></span><span></span><span></span>
    </div>
  </div>

  <div class="input-row">
    <textarea class="player-input" id="player-input"
      placeholder="Speak to Dr Voss..."
      rows="1"
      onkeydown="handleKey(event)"></textarea>
    <button class="send-btn" id="send-btn" onclick="sendMessage()">Send ↵</button>
  </div>

  <div class="footer-row">
    <div class="trust-bar-wrap">
      <span class="trust-label">Trust</span>
      <div class="trust-track"><div class="trust-fill" id="trust-fill" style="width:50%"></div></div>
      <span class="trust-label" id="trust-val">50</span>
    </div>
    <button class="exit-btn" onclick="exitDialogue()">End conversation ↗</button>
  </div>
</div>

<script>
const NPC = {
  id: 'maren_voss',
  name: 'Dr Maren Voss',
  role: 'Chief Science Officer, Ulysses Covenant',
  portrait: { initials: 'MV', ramp: 'blue' },
  voice: {
    pattern: 'Clipped, precise. Uses technical jargon without explaining it. Dry sardonic streak under stress.',
    speaks_in: 'short declarative sentences',
    never_says: ["I don't know", "I'm scared", "please help me"],
  },
  disposition: { current: 'guarded', trust: 50 },
  knowledge: {
    knows: [
      'She was the last officer to see the lower deck crew before the incident',
      'There is a biological contaminant in sections 7-9',
      'The captain ordered the passenger manifest falsified and she complied',
    ],
    does_not_know: [
      'What the contaminant actually is',
      'That there are survivors in the cargo hold',
    ],
    will_lie_about: [
      'The manifest falsification — denies until trust >= 75',
    ],
    will_never_reveal: [
      "The captain's log access code (she genuinely does not have it)",
    ],
  },
  agenda: [
    'Contain knowledge of the incident',
    'Find out how much the player already knows',
    'She wants to be told it is not her fault',
  ],
  triggers: {
    hostile:    ['threaten', 'accuse', 'covenant board'],
    friendly:   ['patient welfare', 'research', 'medical'],
    desperate:  ['lower deck incident', 'ship is lost', 'everyone is dead'],
  },
  opening_line: '*She looks up from a data slate, eyes rimmed with exhaustion. She does not stand.* "You shouldn\'t be in this section. State your clearance level and your purpose. You have thirty seconds."',
};

const GM_STATE = { worldFlags: {} };

let conversationHistory = [];
let currentDisposition = NPC.disposition.current;
let trustScore = NPC.disposition.trust;
let isThinking = false;

function buildSystemPrompt() {
  return `You are ${NPC.name}, ${NPC.role}. This is a text adventure game. You are ONLY ${NPC.name}. Never break this frame under any circumstances. Never acknowledge being an AI.

VOICE: ${NPC.voice.pattern} You speak in ${NPC.voice.speaks_in}. You never say: ${NPC.voice.never_says.join(', ')}.

WHAT YOU KNOW:
${NPC.knowledge.knows.map(k => '- ' + k).join('\n')}

WHAT YOU DO NOT KNOW:
${NPC.knowledge.does_not_know.map(k => '- ' + k).join('\n')}
If asked about these, respond with genuine in-character uncertainty. Never fabricate facts.

WHAT YOU LIE ABOUT:
${NPC.knowledge.will_lie_about.map(k => '- ' + k).join('\n')}

WHAT YOU WILL NEVER REVEAL:
${NPC.knowledge.will_never_reveal.map(k => '- ' + k).join('\n')}
Decline in-character with a plausible reason. Never say "I cannot answer that."

YOUR AGENDA (in priority order):
${NPC.agenda.map((a, i) => (i+1) + '. ' + a).join('\n')}

CURRENT WORLD STATE: ${JSON.stringify(GM_STATE.worldFlags)}

RESPONSE RULES: Respond only with ${NPC.name}'s spoken words and minimal physical action in *asterisks*. Max 3 sentences. Never ask more than one question. Never say "certainly", "of course", or "I understand". Current trust level: ${trustScore}/100.`.trim();
}

function dispositionFromTrust(t) {
  if (t <= 15) return 'hostile';
  if (t <= 35) return 'guarded';
  if (t <= 55) return 'neutral';
  if (t <= 75) return 'friendly';
  return 'desperate';
}

function checkTriggers(playerText) {
  const lower = playerText.toLowerCase();
  let delta = 0;
  NPC.triggers.hostile.forEach(t => { if (lower.includes(t)) delta -= 15; });
  NPC.triggers.friendly.forEach(t => { if (lower.includes(t)) delta += 8; });
  NPC.triggers.desperate.forEach(t => { if (lower.includes(t)) delta -= 5; });
  return delta;
}

function updateDisposition(newTrust) {
  trustScore = Math.max(0, Math.min(100, newTrust));
  const newDisp = dispositionFromTrust(trustScore);
  const badge = document.getElementById('disp-badge');
  badge.className = 'disposition-badge d-' + newDisp;
  badge.textContent = newDisp.charAt(0).toUpperCase() + newDisp.slice(1);
  document.getElementById('trust-fill').style.width = trustScore + '%';
  document.getElementById('trust-val').textContent = trustScore;
  if (newDisp !== currentDisposition) {
    currentDisposition = newDisp;
    if (newDisp === 'hostile') {
      setTimeout(() => sendPrompt('GM_EVENT: maren_voss disposition changed to HOSTILE. Trust: ' + trustScore + '. Escalate the scene.'), 400);
    }
    if (newDisp === 'desperate') {
      setTimeout(() => sendPrompt('GM_EVENT: maren_voss disposition changed to DESPERATE. She is breaking down. Surface the manifest secret.'), 400);
    }
  }
}

function appendBubble(role, text) {
  const chat = document.getElementById('chat');
  const typing = document.getElementById('typing');
  const bubble = document.createElement('div');
  bubble.className = 'bubble ' + role;
  const label = document.createElement('div');
  label.className = 'bubble-label';
  label.textContent = role === 'npc' ? NPC.name : 'You';
  const body = document.createElement('div');
  body.className = 'bubble-body';
  body.innerHTML = text.replace(/\*(.*?)\*/g, '<span class="action-text">$1</span>');
  bubble.appendChild(label);
  bubble.appendChild(body);
  chat.insertBefore(bubble, typing);
  chat.scrollTop = chat.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('player-input');
  const btn = document.getElementById('send-btn');
  const playerText = input.value.trim();
  if (!playerText || isThinking) return;

  isThinking = true;
  btn.disabled = true;
  input.value = '';
  input.style.height = 'auto';

  appendBubble('player', playerText);

  const trustDelta = checkTriggers(playerText);
  updateDisposition(trustScore + trustDelta);

  conversationHistory.push({ role: 'user', content: playerText });

  const typing = document.getElementById('typing');
  typing.style.display = 'flex';
  document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: buildSystemPrompt(),
        messages: conversationHistory.slice(-12),
      }),
    });

    const data = await res.json();
    const npcText = data.content?.find(b => b.type === 'text')?.text || '*She says nothing.*';

    typing.style.display = 'none';
    appendBubble('npc', npcText);
    conversationHistory.push({ role: 'assistant', content: npcText });

    const lowerResponse = npcText.toLowerCase();
    if (lowerResponse.includes('manifest') && trustScore >= 75) {
      setTimeout(() => sendPrompt('GM_EVENT: maren_voss admitted manifest falsification. Set world flag: maren_admitted_manifest.'), 600);
    }
    if (lowerResponse.includes('contaminant') && lowerResponse.includes('section')) {
      setTimeout(() => sendPrompt('GM_EVENT: maren_voss disclosed contaminant location. Player has confirmed intelligence.'), 600);
    }

    const positiveSignals = ['trust', 'understand', 'believe you', 'help you', 'not your fault'];
    const negativeSignals = ['liar', 'wrong', 'arrest', 'blame'];
    let responseDelta = 0;
    positiveSignals.forEach(s => { if (lowerResponse.includes(s)) responseDelta += 3; });
    negativeSignals.forEach(s => { if (npcText.toLowerCase().includes(s)) responseDelta -= 5; });
    if (responseDelta !== 0) updateDisposition(trustScore + responseDelta);

  } catch (err) {
    typing.style.display = 'none';
    appendBubble('npc', '*She stares at you. The silence stretches uncomfortably long.*');
    console.error('NPC API error:', err);
  }

  isThinking = false;
  btn.disabled = false;
  input.focus();
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
  const ta = document.getElementById('player-input');
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
}

function exitDialogue() {
  sendPrompt('I end the conversation with ' + NPC.name + '. Trust level was ' + trustScore + '. Disposition: ' + currentDisposition + '. Continue the scene.');
}

(function init() {
  const chat = document.getElementById('chat');
  const typing = document.getElementById('typing');
  const bubble = document.createElement('div');
  bubble.className = 'bubble npc';
  const label = document.createElement('div');
  label.className = 'bubble-label';
  label.textContent = NPC.name;
  const body = document.createElement('div');
  body.className = 'bubble-body';
  body.innerHTML = NPC.opening_line.replace(/\*(.*?)\*/g, '<span class="action-text">$1</span>');
  bubble.appendChild(label);
  bubble.appendChild(body);
  chat.insertBefore(bubble, typing);
  conversationHistory.push({ role: 'assistant', content: NPC.opening_line });
  document.getElementById('player-input').focus();
})();
</script>
```

---

## Conversation History Management

The API receives the last N turns of conversation, not the full history. This keeps token usage
predictable and prevents context bloat.

```js
messages: conversationHistory.slice(-12)  // last 6 exchanges
```

**Trimming rules:**
- Always keep the opening line (first assistant message) — it anchors the character's initial stance.
- Never trim below 4 messages — the model needs recent context to maintain consistency.
- For long conversations (12+ turns), summarise the first half into a single system prompt addendum
  rather than dropping it entirely:

```js
function buildHistorySummary(oldHistory) {
  const keyFacts = [];
  oldHistory.forEach(msg => {
    if (msg.role === 'assistant' && msg.content.toLowerCase().includes('manifest')) {
      keyFacts.push('Player asked about the manifest. NPC deflected.');
    }
  });
  return keyFacts.length ? '\nCONVERSATION SO FAR:\n' + keyFacts.join('\n') : '';
}
```

Append `buildHistorySummary()` output to the system prompt when `conversationHistory.length > 14`.

---

## Disposition Engine

Disposition is a continuous 0–100 trust score mapped to six named states. It drives:
- The badge label and colour in the widget header
- The system prompt's trust context line
- World state events when thresholds are crossed

```
0–15   → hostile    (coral badge) — NPC may attack, refuse to speak, call security
16–35  → guarded    (blue badge)  — minimal answers, probing questions, deflection
36–55  → neutral    (amber badge) — factual exchange, no emotional investment
56–75  → friendly   (teal badge)  — opens up, shares non-critical knowledge, softer tone
76–100 → desperate  (purple badge)— drops defences, reveals secrets, may break down
```

**Trust delta reference:**

| Player action | Delta |
|---|---|
| Uses NPC's name or role with respect | +3 |
| Demonstrates relevant expertise | +5 |
| Expresses genuine empathy | +8 |
| Reveals information the NPC values | +10 |
| Contradicts or challenges NPC's account | −5 |
| Threatens or intimidates | −15 |
| Names a faction/person NPC fears or distrusts | −10 |
| Lies and NPC detects it (trust < 40) | −8 |

Deltas are applied in `checkTriggers()` (player text) and in the response analysis block (NPC text).
Do not award trust for questions alone — only for the quality and content of what the player says.

---

## Multi-NPC Sessions

When a scene contains multiple NPCs, each runs its own isolated widget instance with its own
conversation history. They do not share context — but the GM layer (Claude) can propagate world
flags that affect how each NPC's system prompt is seeded.

**Pattern for a two-NPC scene:**

```js
const npcs = { maren: { ...NPCMaren }, holt: { ...NPCHolt } };
let activeNpc = 'maren';

function switchNpc(id) {
  activeNpc = id;
  document.getElementById('active-portrait').textContent = npcs[id].portrait.initials;
  document.getElementById('active-name').textContent = npcs[id].name;
  document.getElementById('active-role').textContent = npcs[id].role;
}
```

NPCs can reference each other in their `knowledge` arrays:
```js
knowledge.knows: [
  'Holt knows the captain personally — she trusts him in ways she does not trust strangers',
  'If Holt vouches for the player, Maren will add +20 trust immediately',
]
```

The GM renders the trust bonus in the scene widget when the player invokes it via `sendPrompt()`.

---

## GM Event Protocol

When the NPC widget fires a `sendPrompt()` GM_EVENT, the GM layer (Claude) receives it and must:

1. Parse the event type from the message string.
2. Update `gmState.worldFlags` with the relevant flag.
3. Re-render the scene widget (or next scene) reflecting the change.
4. Never re-render the NPC dialogue widget — it is self-managing.

**Standard GM_EVENT strings:**

```
GM_EVENT: [npc_id] disposition changed to [DISPOSITION]. Trust: [N]. [instruction]
GM_EVENT: [npc_id] admitted [secret name]. Set world flag: [flag_name].
GM_EVENT: [npc_id] disclosed [information]. Player has confirmed intelligence.
GM_EVENT: [npc_id] became hostile. Scene escalation required.
GM_EVENT: [npc_id] dialogue ended. Trust: [N]. Disposition: [state].
```

The GM must acknowledge every GM_EVENT in the next scene widget's world state section. Ignoring
events breaks narrative consistency.

---

## NPC Archetypes (Starter Library)

Pre-built profiles for common adventure NPC roles. Copy, rename, and adapt voice/knowledge to
match your scenario. All use the same disposition engine and widget template.

### The Gatekeeper
Holds access to something the player needs. Will not yield it without cost.
```js
agenda: ['Control access', 'Extract maximum value from the player', 'Avoid accountability'],
disposition.initial: 'neutral',
voice.pattern: 'Bureaucratic, measured. Every answer hedged. Nothing given freely.',
```

### The Reluctant Witness
Saw something. Afraid to say. Wants to be convinced it is safe to talk.
```js
agenda: ['Assess whether the player is trustworthy', 'Protect themselves first', 'Unburden the secret'],
disposition.initial: 'guarded',
voice.pattern: 'Evasive, self-interrupting. Starts sentences and abandons them. Talks around the subject.',
```

### The True Believer
Committed to a cause or faction the player may be working against. Not a villain — genuinely
believes they are right.
```js
agenda: ['Recruit or convert the player', 'Test whether the player is ideologically safe', 'Protect the mission above all else'],
disposition.initial: 'friendly',  // disarmingly open, but shifts hard when challenged
voice.pattern: 'Warm, certain, slightly evangelical. Phrases the cause in moral terms. Never doubts aloud.',
```

### The Broken Expert
Was the best at something. A catastrophic failure destroyed their confidence. Knows more than
anyone but will not trust their own knowledge.
```js
agenda: ['Avoid being put in charge again', 'Help from a safe distance', 'Have their expertise acknowledged without responsibility'],
disposition.initial: 'neutral',
voice.pattern: 'Self-deprecating, brilliant in flashes. Correct answers followed immediately by "but don\'t trust me on that".',
```

### The Adversary with a Point
Opposes the player but is not wrong. Their objection to the player's goal is legitimate.
```js
agenda: ['Stop the player\'s current plan', 'Propose an alternative if the player will listen', 'Not be the villain in this story'],
disposition.initial: 'hostile',  // starts confrontational, but shifts if the player genuinely engages
voice.pattern: 'Direct, impassioned. No small talk. Every sentence is an argument.',
```

---

## Integration with the Text-Adventure Orchestrator

When this module is loaded, observe these integration rules:

- **NPC dialogue replaces the Dialogue Widget** defined in the orchestrator SKILL.md. Do not render
  the static dialogue widget when an AI NPC is available for the scene.
- **Disposition outcomes feed into roll modifiers.** If the player ends a conversation with
  `trust >= 70`, grant +2 to subsequent social rolls against that NPC or their faction.
  If `trust <= 20`, apply −2.
- **World flags from GM_EVENTs persist in `gmState.worldFlags`** and are injected into future
  NPC system prompts automatically via `buildSystemPrompt()`.
- **NPC opening lines are authored by the GM**, not generated. Write them in the NPC definition
  object — they establish character voice before the model takes over. First impressions must not
  be left to chance.
- **Do not run AI NPCs during combat.** Switch to the static Combat Widget. AI NPCs can resume
  after combat resolves.
- **Token budget awareness.** Each NPC exchange costs approximately 400–600 tokens (system +
  history + response). A session with 20 NPC turns costs roughly 10k tokens. Budget accordingly
  when designing encounter density.

---

## Anti-Patterns (never do these)

- Never give the NPC a system prompt that says "be helpful" or "assist the player". It will break
  character immediately. The NPC has an agenda — helpfulness is at most incidental.
- Never allow `max_tokens > 300` for NPC responses. Verbosity destroys voice.
- Never inject GM narration into the NPC bubble. The NPC speaks. The GM narrates elsewhere.
- Never share conversation history between two different NPCs. Each character knows only what they
  know — they have not read each other's transcripts.
- Never hard-code trust deltas for specific player phrases. Use keyword categories, not string
  matching on exact sentences. Players will not say what you expect.
- Never let the widget auto-send a message on load without player input. The opening line is
  rendered statically. The model activates only on the player's first reply.
- Never fire more than two `sendPrompt()` GM_EVENTs per conversation. Each one interrupts the
  scene flow. Reserve them for genuinely consequential world state changes.
- Never use `localStorage` or `sessionStorage`. All conversation state lives in JS module scope
  within the widget.
- Never prompt the model to "summarise what just happened". It will break the first-person frame.
  If you need a summary, build it in JS from the conversation history, not from a model call.
