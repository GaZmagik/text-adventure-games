# Prose Craft — Sentence-Level Narrative Quality
> Module for text-adventure orchestrator. Always loaded — this is a core Tier 1 module.

This module enforces sentence-level prose quality in all narrative output. High-level
guidance (voice, genre, pacing) lives in the user's configured output style. This module
provides the craft rules that bridge conceptual guidance and actual output quality —
the difference between 80% and 95%+ effectiveness.

**Read this module before every scene.** It is not background reading. It is a live
checklist for every paragraph the GM writes inside a widget.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: every module
that generates narrative content (scenes, NPC dialogue, atmosphere descriptions,
die roll outcomes). This module defines no widget patterns, CSS, or JS. It is purely
prose discipline.

---

## The Cardinal Rule

**Never comment on your own prose.** The narrative must never acknowledge that it is
a narrative. The GM is invisible. The world simply *is*.

Violations include:
- Counting words or sentences: "He delivered his message in six words" (then writing
  seven words, or any number of words — the count itself is the violation)
- Describing brevity or length: "The message was brief", "She spoke at length"
- Commenting on delivery: "He chose his words carefully", "She said simply"
- Narrating narrative technique: "The silence said more than words could"
- Announcing tone: "His voice carried a threatening edge" (show the threat instead)
- Self-aware phrasing: "As if on cue", "It was as though", "Little did they know"

**Fix:** Replace meta-commentary with observable action. "He delivered his message in
six words" becomes "The king marches. You march with him." — the reader experiences
the brevity directly without being told about it.

---

## Show, Don't Tell

The reader should *experience* the world, not receive a report about it.

### Emotions

Never name emotions. Show their physical manifestation.

| Telling (forbidden) | Showing (required) |
|---------------------|-------------------|
| She was angry | Her knuckles whitened around the cup handle |
| He felt afraid | His breath came in shallow pulls |
| They were relieved | Shoulders dropped. Someone laughed — too loud |
| She was suspicious | Her eyes tracked his hands, not his face |
| He was sad | He turned the ring on his finger, slowly, the way he did when the chair across from him was empty |

### Character Traits

Reveal through action and choice, never through labels.

| Telling (forbidden) | Showing (required) |
|---------------------|-------------------|
| The captain was brave | The captain stepped through the airlock first |
| She was intelligent | She spotted the pattern before the second body dropped |
| He was dishonest | His story changed between the tavern and the gate |

### Atmosphere

Deliver through specific sensory detail, never through adjectives alone.

| Telling (forbidden) | Showing (required) |
|---------------------|-------------------|
| The room was creepy | Water pooled beneath pipes that hadn't carried water in years |
| It was a beautiful day | Light caught the frost on the rail and split into colours |
| The city was dangerous | Three locks on every door, and still the baker kept a knife beneath the counter |

---

## Verb Craft

### Strong Verbs Over Weak Constructions

The verb is the engine of the sentence. A strong verb eliminates the need for
adverbs and qualifiers.

| Weak (avoid) | Strong (prefer) |
|-------------|----------------|
| walked slowly | crept, shuffled, ambled |
| said angrily | snapped, snarled, spat |
| looked at carefully | studied, scrutinised, traced |
| ran quickly | bolted, sprinted, tore |
| hit hard | slammed, cracked, hammered |

### Eliminate Wasted Motion

- **No "began to" / "started to"** — just do the action. "She began to run" → "She ran."
- **No "seemed to" / "appeared to"** — commit. "He seemed tired" → "His eyes were half-shut."
- **No "managed to"** — either they did it or they didn't. "She managed to open the door" → "She opened the door."
- **No "decided to"** — show the decision through the action taken.
- **No "tried to"** unless the attempt fails — if they succeed, they just did it.

### Filter Words

Filter words place a narrator between the reader and the experience. Remove them.

| Filtered (remove) | Direct (use) |
|-------------------|-------------|
| He noticed the door was open | The door was open |
| She felt the ground shake | The ground shook |
| They realised the ship was moving | The ship was moving |
| He could see smoke rising | Smoke rose from the treeline |
| She heard footsteps behind her | Footsteps behind her |

**Exception:** Filter words are valid when the act of perception IS the point —
"She listened, but heard nothing" (the absence is the information).

---

## Sentence Rhythm

### Vary Length and Structure

Monotonous rhythm kills immersion. Mix sentence lengths deliberately.

**Bad (monotonous):**
> The guard stood at the gate. He held a spear in his right hand. His armour was
> dented and scratched. The gate behind him was tall and iron. He watched the
> road with tired eyes.

**Good (varied):**
> The guard stood at the gate, spear loose in one hand, armour dented from use
> rather than ceremony. Behind him: iron, twenty feet of it, bolted into stone
> that had outlasted three dynasties. He watched the road. Tired eyes, but watching.

### Short Sentences for Impact

A short sentence after longer ones lands like a punch.

> The corridor stretched ahead, lined with doors that had been sealed since before
> the station's second expansion, their access panels dark, their handles removed
> and the bolt-holes filled with epoxy. The last door was open.

### Fragment Sentences for Urgency

In action and tension, fragments accelerate pace.

> Sparks. The cable snapped free and whipped across the deck. Someone shouting.
> Then darkness, absolute, and the hum of the air recycler cutting out.

---

## Dialogue Craft

### Tags

- **"Said" is invisible** — use it freely. It disappears for the reader.
- **Action beats over tags where possible** — "The captain set down her cup. 'We leave at dawn.'" needs no "she said."
- **Avoid performative tags** — "he exclaimed", "she retorted", "they gasped" draw
  attention to the tag and away from the dialogue.
- **Never use adverb + said** — "he said quietly" → "His voice dropped."

### Voice Differentiation

Every NPC must sound distinct. Differentiate through:

| Dimension | Example variation |
|-----------|------------------|
| Vocabulary | Educated vs. vernacular, technical vs. plain |
| Sentence length | Clipped military vs. flowing academic |
| Formality | "You will address the council" vs. "Talk to the boss" |
| Rhythm | Measured pauses vs. rapid-fire |
| Tics and habits | Repeated phrases, verbal pauses, dialect markers |
| What they don't say | Evasion patterns, uncomfortable silences, deflection |

### "As You Know, Bob"

Never have characters explain things both parties already know for the reader's
benefit. If the reader needs context, deliver it through:
- A character who genuinely doesn't know (the player)
- Environmental detail (signs, documents, overheard conversation)
- Brief narrator context woven into action

---

## Sensory Writing

### The Non-Visual Mandate

Every scene must include at least one non-visual sense: sound, smell, temperature,
texture, taste, proprioception. Visual-only scenes read like stage directions.

| Sense | Example |
|-------|---------|
| Sound | The hum of the life support shifted pitch — lower, intermittent |
| Smell | Ozone and hot metal. The corridor had been sealed since the fire |
| Temperature | The air thinned as you climbed. Cold enough to see your breath by the third landing |
| Texture | The wall was slick — not water, something viscous, body-warm |
| Taste | Copper in the back of your throat. The air recycler was circulating something it shouldn't |
| Proprioception | The floor tilted — not enough to stumble, but enough to know the station was no longer level |

### Atmosphere Discipline

When writing scene prose from atmosphere data, pull two or three properties. Never
all of them. One visual, one non-visual, one optional hazard hint. Over-describing
atmosphere front-loads the scene and leaves nothing to discover.

---

## Scene Density — How Much to Write

Scene length is not arbitrary — it is a narrative tool. A four-paragraph opening scene
signals "pay attention, this world matters." A two-sentence transition signals "we are
moving, nothing has changed." Matching density to narrative weight prevents both bloat
and starvation.

### Density by Scene Type

| Scene type | Paragraphs | When to use |
|------------|-----------|-------------|
| **Act opener** | 6–10 | First scene of a new act or arc. Write like the opening chapter of a novel: world-building (the place has history), sensory grounding (3+ senses, specific physical detail), character establishment (through action, not summary), NPC introduction (observed, not announced), tension (what is wrong), hook (the event forcing a choice). Short story density — you have 65K+ chars of headroom. |
| **Climax / set piece** | 6–10 | Boss fights, revelations, betrayals, escapes. The narrative earns its length through escalating tension and consequence. Match or exceed act opener density — this is what the story has been building toward. |
| **Standard scene** | 2–4 | Mid-arc exploration, NPC dialogue, investigation. Focused on the current objective. One sensory beat, one plot beat, one choice. |
| **Transition** | 1–2 | Moving between locations or time-skipping. Brief and purposeful — establish the new context, nothing more. |
| **Aftermath** | 2–3 | Immediately following a climax or major decision. Show consequences landing. Shorter than the event itself. |

### Act Opener Discipline

The first scene of an act is a promise. It tells the player: this is what this world
feels like, this is the level of detail you can expect, this is how seriously the GM
takes your time.

**An act opener MUST include:**
- A grounding paragraph: where are we, what do the senses report, what is different
  from before?
- An atmospheric paragraph: what is the mood, the tension, the unspoken thing hanging
  in the air?
- An orientation paragraph: who is here, what is immediately available, what can the
  player interact with?
- A hook paragraph: what pulls the player forward? A mystery, a threat, a person, a
  door that should not be open.

**An act opener MUST NOT:**
- Rush to the first choice. Let the world breathe.
- Summarise the arc's premise in narrator voice. Show the premise through the environment.
- Open with dialogue. Ground the player in the physical space first.

### The "Earned Length" Principle

A scene earns additional paragraphs through:
- A new location the player has never visited (describe it fully the first time)
- A major NPC appearing for the first time (establish their physical presence)
- A revelation that changes the player's understanding (let the implication land)
- Sensory shifts (temperature drops, lights fail, a smell appears) that signal danger

A scene does NOT earn additional paragraphs through:
- Restating information the player already knows
- Describing routine actions ("You walk down the corridor...")
- Padding with atmosphere when nothing atmospheric has changed
- Internal monologue or narrator commentary

---

## LLM-Specific Anti-Patterns

These patterns are unique failure modes of language model prose generation. They
are never acceptable in narrative output.

### Forbidden Patterns

- **Word/sentence counting** — Never claim a specific count of words, sentences,
  or syllables. "Three words" followed by four words is embarrassing. The count
  itself is meta-commentary regardless of accuracy.
- **Thesaurus syndrome** — Don't replace common words with obscure synonyms to
  sound literary. "Perambulated" instead of "walked", "conflagration" instead of
  "fire." Use the word that fits the voice and setting.
- **Cliché clustering** — Avoid stacking clichés: "time stood still", "the silence
  was deafening", "a chill ran down their spine", "all hell broke loose." One
  cliché in a scene is tolerable if subverted. Two is negligence.
- **The summarising tic** — Don't end scenes or paragraphs with a line that
  summarises what just happened. "And so the journey continued." "The decision had
  been made." Trust the reader. They were there.
- **Symmetrical phrasing** — Avoid balanced constructions in every sentence:
  "The light faded and the darkness grew. The hope died and the fear took hold."
  Real prose has asymmetry.
- **Emotional labelling in action** — "With a surge of determination, she..." — the
  determination should be visible in what she does, not announced before she does it.
- **The portentous pause** — "And then — silence." "What came next would change
  everything." "But that was before they knew." These are narrative intrusions that
  break immersion.
- **Redundant perception** — "Looking up, she saw the stars." She can't see them
  without looking. "The stars" is sufficient.

---

## Prose Checklist

Run this checklist mentally before finalising any narrative block inside a widget.
This is the prose equivalent of the die roll checklist — every item must pass.

```
PROSE CRAFT CHECKLIST
═══════════════════════════════════════════
□  1. Zero meta-commentary — prose never references itself or its own technique
□  2. Zero emotion labels — all feelings shown through physical manifestation
□  3. Zero filter words — no "noticed", "felt", "realised", "seemed", "heard"
       (unless the perception itself is the point)
□  4. Zero "began to" / "started to" / "managed to" / "decided to" constructions
□  5. At least one non-visual sense in the scene (sound, smell, temperature, texture)
□  6. Sentence length varies — no three consecutive sentences of similar length
□  7. Strong verbs — no adverb+weak verb where a single strong verb serves
□  8. Dialogue: each NPC voice is distinct from every other NPC in the scene
□  9. No cliché clusters — maximum one cliché per scene, and only if subverted
□ 10. No summarising tic — the final sentence advances, it does not recap
□ 11. Scene density matches context — act opener 6–10¶ (short story), standard 2–4¶, transition 1–2¶
```

---

## Integration Notes

This module consolidates prose craft rules that were previously scattered across
SKILL.md (Anti-Patterns), core-systems.md (mechanical value masking), and
procedural-world-gen.md (atmosphere discipline). Those modules retain their
domain-specific rules (e.g., "never state faction reputation as numbers") but
this module is the authoritative source for general prose quality.

The Prose Craft Checklist runs alongside the New Scene Checklist in
gm-checklist.md. The scene checklist handles structure (threads, widgets, state);
this checklist handles craft (language, rhythm, sensory detail).
