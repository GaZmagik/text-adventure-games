# AI NPC — Live Character Engine
> Module for text-adventure orchestrator. Loaded for named NPCs with narrative weight requiring live dialogue.

This skill defines how to construct, host, and manage AI-powered NPCs whose dialogue is generated
live via the Anthropic API. NPCs are not scripted dialogue trees — they are characters with genuine
knowledge limits, agendas, secrets, and evolving dispositions. The player converses with them in
freeform text. Responses feel real because they *are* real: each NPC runs as a constrained model call
with a carefully engineered system prompt.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: lore-codex, crew-manifest modules.

---

## § CLI Commands

| Action | Command | Tool |
|--------|---------|------|
| Render NPC dialogue | `tag render dialogue --style <style>` | Run via Bash tool |
| Create NPC | `tag state create-npc <id> --tier <tier> --name "<name>" --pronouns <p> --role <role>` | Run via Bash tool |
| Hidden contested roll | `tag compute contest <STAT> <npc_id>` | Run via Bash tool |

---

## CRITICAL — NPC Stats and Levels

Every NPC with narrative weight has a stat block. Stats inform contested checks (see
Hidden Contested Rolls below) and shape the NPC's system prompt for dialogue.

### Stat Block Schema

Add a `stats` field to every NPC definition object:

<!-- CLI implementation detail — do not hand-code -->
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
to create every NPC when they first appear in the narrative. Never invent NPC stats manually —
hand-picked stats bypass the bestiary tier rules, produce inconsistent power levels across NPCs
of the same tier, and are not written to `gmState.rosterMutations`, so the NPC loses their
stats on save/resume and contested rolls silently fall back to defaults.
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

<!-- CLI implementation detail — do not hand-code -->
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

<!-- CLI implementation detail — do not hand-code -->
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

The AI NPC dialogue widget is a self-contained HTML artifact produced by the CLI. It handles:
- Rendering the conversation history
- Capturing player input
- Making API calls with the full conversation context
- Running the disposition engine on each response
- Firing `sendPrompt()` when world state events trigger

Run `tag render dialogue --style <style>` via Bash tool to produce the full NPC dialogue widget.
Never hand-code the dialogue HTML/CSS/JS. The CLI handles portrait rendering, disposition
badge colours, chat bubbles, typing indicator, trust bar, API call wiring, trigger detection,
history trimming, trust calculation, the disposition state machine, world flag event firing,
and sendPrompt GM_EVENT dispatch automatically from the NPC definition object. Hand-coding
any of these means reimplementing tested behaviour from scratch — every missed edge case
(malformed API payload, uncapped trust delta, orphaned GM_EVENT, un-trimmed history bloating
token costs) becomes a silent bug the player experiences as broken dialogue or frozen widgets.

---

## Conversation History Management

The API receives the last N turns of conversation, not the full history. This keeps token usage
predictable and prevents context bloat.

<!-- CLI implementation detail — do not hand-code -->
```js
messages: conversationHistory.slice(-12)  // last 6 exchanges
```

**Trimming rules:**
- Always keep the opening line (first assistant message) — it anchors the character's initial stance.
- Never trim below 4 messages — the model needs recent context to maintain consistency. Below
  this threshold the NPC loses track of what was just said, contradicts its own statements from
  two turns ago, and re-asks questions the player already answered. The player perceives this as
  the character having amnesia mid-conversation.
- For long conversations (12+ turns), summarise the first half into a single system prompt addendum
  rather than dropping it entirely:

<!-- CLI implementation detail — do not hand-code -->
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
If questions earn trust, the player can reach maximum disposition by asking anything repeatedly,
bypassing the entire social challenge. The disposition arc flattens into "keep talking until
friendly" and the NPC's agenda, secrets, and lie conditions become irrelevant.

---

## Multi-NPC Sessions

When a scene contains multiple NPCs, each runs its own isolated widget instance with its own
conversation history. They do not share context — but the GM layer (Claude) can propagate world
flags that affect how each NPC's system prompt is seeded.

**Pattern for a two-NPC scene:** Each NPC runs its own isolated dialogue widget instance.
Run `tag render dialogue --style <style>` via Bash tool once per NPC. The CLI handles
NPC switching UI automatically when multiple NPCs are present.

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
events means the NPC revealed a secret or changed disposition but the world does not react —
the player sees the NPC admit to the cover-up yet the next scene proceeds as though it never
happened. This is the single most visible continuity failure in multi-widget play.

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
  after combat resolves. Running a live dialogue widget alongside combat creates two competing
  interaction models — the player cannot tell whether typing affects the fight or the
  conversation, API calls add latency to combat rounds, and GM_EVENTs from the NPC can mutate
  world flags mid-combat, invalidating the combat widget's state.
- **Token budget awareness.** Each NPC exchange costs approximately 400–600 tokens (system +
  history + response). A session with 20 NPC turns costs roughly 10k tokens. Budget accordingly
  when designing encounter density.

---

## Anti-Patterns (never do these)

- Never give the NPC a system prompt that says "be helpful" or "assist the player". The model's
  RLHF training already biases it toward helpfulness — adding this instruction amplifies that
  bias until the NPC abandons its agenda, answers every question openly, and behaves like a
  customer service agent rather than a character. The player loses all reason to earn trust or
  navigate the disposition system.
- Never allow `max_tokens > 300` for NPC responses. Verbosity destroys voice — the NPC starts
  hedging, elaborating, and padding sentences with qualifiers. Short responses force the model
  to commit to a position and maintain the character's speech pattern. Long responses regress
  toward generic assistant prose, and the player notices the character "stopped sounding like
  themselves" within two or three exchanges.
- Never inject GM narration into the NPC bubble. The NPC speaks. The GM narrates elsewhere.
  Mixing the two voices inside a single chat bubble breaks the spatial contract of the dialogue
  widget — the player can no longer tell what the character said aloud versus what the GM is
  editorialising, and the NPC's distinct voice dissolves into omniscient narrator prose.
- Never share conversation history between two different NPCs. Each character knows only what they
  know — they have not read each other's transcripts. If histories leak, NPCs reference things
  they were never told, the player's deception and information-brokering strategies collapse, and
  the knowledge fence system becomes meaningless — destroying the core tension of multi-NPC scenes.
- Never hard-code trust deltas for specific player phrases. Use keyword categories, not string
  matching on exact sentences. Players will not say what you expect. Hard-coded string matches
  silently fail for any phrasing the author did not anticipate — the player performs the right
  action, trust does not move, and the disposition engine appears broken with no error or feedback.
- Never let the widget auto-send a message on load without player input. The opening line is
  rendered statically. The model activates only on the player's first reply. Auto-sending on
  load burns an API call the player never requested, produces a generic greeting that undercuts
  the GM-authored opening line, and — because the widget renders before the player has oriented
  themselves — the response arrives before they have read the scene, breaking pacing entirely.
- Never fire more than two `sendPrompt()` GM_EVENTs per conversation. Each one interrupts the
  scene flow. Reserve them for genuinely consequential world state changes. Excess GM_EVENTs
  cause the GM layer to re-render mid-conversation, the player sees the scene flicker or reset
  around the dialogue widget, and the cascade of world flag updates can trigger contradictory
  narrative branches — the player experiences the story stuttering and contradicting itself.
- Never use `localStorage` or `sessionStorage`. All conversation state lives in JS module scope
  within the widget. There is no persistent client-side state between renders — the artifact
  sandbox is ephemeral. Data written to storage silently vanishes on the next render, so any
  feature that depends on it (conversation resume, preference persistence, trust carry-over)
  will work once during testing and fail every time in production play.
- Never prompt the model to "summarise what just happened". It will break the first-person frame
  — the NPC shifts from speaking as a character to narrating as an observer, and the player
  instantly feels the difference. The illusion of a real person collapses into an obvious AI
  recap. If you need a summary, build it in JS from the conversation history, not from a model
  call.
