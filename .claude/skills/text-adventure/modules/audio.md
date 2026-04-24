# Audio — Acoustic Identity & Soundscapes

> Module for text-adventure orchestrator. Optional — selected at game start in Settings widget.

Adds audio to scene widgets using the Web Audio API. Two distinct layers work together:

- **Acoustic identity** — recipe-based drone that starts automatically when a scene loads, giving each location a sonic signature. Opt-in per scene via a single attribute.
- **Soundscape effects** — player-triggered one-shot sounds via the footer Play/Stop button (existing SoundscapeEngine).

No external audio files. All sound is synthesised from oscillators and noise generators.

---

## Philosophy

Audio should define a location, not decorate it. A tense interrogation room sounds different from a serene observation deck — not because a sound effect plays, but because the ambient texture is woven into the scene before the player reads a word. Each scene type has an acoustic identity: a set of frequency, modulation, and filter parameters that give it a distinctive feel.

Use acoustic recipes to establish identity. Use soundscape effects for discrete events the player triggers.

---

## Acoustic Identity — Recipe System

The recipe system auto-starts ambient audio when a scene loads, using `data-audio-recipe` on the scene root element. The GM selects a recipe keyword matching the scene's emotional register.

**Usage:**

```html
<div class="root" data-audio-recipe="tension" ...></div>
```

**Behaviour:**

- Starts automatically on scene load (no player click required)
- Respects `prefers-reduced-motion: reduce` — if set, no audio starts
- Silently no-ops if the browser does not support Web Audio API
- Unknown recipe keywords are ignored (no error, no audio)

### Recipe Catalogue

| Keyword   | Emotional register             | Sonic character                             | Suggested contexts                                |
| --------- | ------------------------------ | ------------------------------------------- | ------------------------------------------------- |
| `tension` | Dread, pressure, confrontation | Low growl (55Hz), slow LFO, tight stereo    | Interrogation, standoff, approaching danger       |
| `wonder`  | Awe, discovery, scale          | High shimmer (440Hz), wide stereo           | First contact, ancient ruins, orbital view        |
| `dread`   | Horror, wrongness, the unknown | Sub drone (40Hz), almost-still, very narrow | Void, body horror, deep space silence             |
| `calm`    | Safety, reflection, breath     | Mid warmth (220Hz), gentle sway             | Camp, safe house, flashback                       |
| `action`  | Urgency, movement, stakes      | Percussive pulse (110Hz), fast LFO          | Chase, escape, firefight                          |
| `mystery` | Ambiguity, secrets, intrigue   | Narrow bandpass (330Hz), medium stereo      | Investigation, hidden passage, NPC with an agenda |

### Recipe Parameters (reference)

| Keyword   | base_freq | mod_rate | mod_depth | layers | filter   | filter_freq | stereo |
| --------- | --------- | -------- | --------- | ------ | -------- | ----------- | ------ |
| `tension` | 55Hz      | 0.3Hz    | 0.4       | 3      | lowpass  | 400Hz       | 0.2    |
| `wonder`  | 440Hz     | 0.8Hz    | 0.3       | 2      | highpass | 800Hz       | 0.9    |
| `dread`   | 40Hz      | 0.1Hz    | 0.6       | 4      | lowpass  | 200Hz       | 0.1    |
| `calm`    | 220Hz     | 0.5Hz    | 0.2       | 2      | bandpass | 600Hz       | 0.5    |
| `action`  | 110Hz     | 2.0Hz    | 0.5       | 3      | bandpass | 900Hz       | 0.6    |
| `mystery` | 330Hz     | 0.4Hz    | 0.3       | 2      | bandpass | 700Hz       | 0.4    |

---

## Soundscape Effects — Player-Triggered

The existing `SoundscapeEngine` provides one-shot soundscape effects started by the player clicking the footer Play/Stop button (`#audio-btn`). This system is active when the `audio` module is enabled in game settings.

### Rules (soundscape effects only)

1. **No auto-play.** The player must click Play. The recipe system (above) is the only exception.
2. **No looping.** Each soundscape plays once for up to 30 seconds, then stops.
3. **One sound per widget.** Only one soundscape active at a time.
4. **Ephemeral.** When a new widget renders, previous audio stops naturally.

### Soundscape Types

| Soundscape         | Context                          | Character                                 |
| ------------------ | -------------------------------- | ----------------------------------------- |
| `ship-engine`      | Vessel, engine room, corridors   | Low hum (40–60Hz), subtle oscillation     |
| `rain`             | Exterior, storm, wet environment | Filtered white noise, irregular rhythm    |
| `wind`             | Open spaces, desert, mountaintop | Noise with slow LFO modulation            |
| `heartbeat`        | Tension, horror, near death      | Low sine pulse, accelerating              |
| `station-ambience` | Space station, busy hub          | Low hum + high-frequency pings            |
| `forest`           | Woodland, calm exterior          | Layered noise + sine chirps               |
| `underwater`       | Submerged, flooded               | Low-pass noise + slow bubble oscillations |
| `alarm`            | Emergency, red alert             | Square wave alternating frequencies       |
| `silence`          | Void, suspense, isolation        | Faint noise floor only                    |
| `mechanical`       | Factory, machinery, clockwork    | Rhythmic clicks + low drone               |
| `fire`             | Campfire, burning, volcanic      | Crackle bursts + low roar                 |
| `terminal`         | Hacking, data, computer          | High-frequency sweeps + digital noise     |

### Selection Guide

| Location type         | Recommended soundscape | Duration |
| --------------------- | ---------------------- | -------- |
| Ship corridor / cabin | `ship-engine`          | 25–30s   |
| Space station hub     | `station-ambience`     | 25–30s   |
| Planet surface        | `wind` or `forest`     | 20–30s   |
| Combat / heartbeat    | `heartbeat`            | 15–20s   |
| Emergency / alarm     | `alarm`                | 10–15s   |
| Computer terminal     | `terminal`             | 15–20s   |

### Volume

All volumes are pre-set in the engine and intentionally quiet. Ambient sound should be a texture, not a feature.

---

## Spatial Audio — Stereo & Future 3D

The recipe system uses `StereoPanner` for left/right stereo spread (0 = mono, 1 = fully separated). Off-screen NPCs can be positioned in the stereo field:

- **Left field** (`stereo: 0.1`) — off-screen NPC speaking from the left
- **Right field** (`stereo: 0.9`) — off-screen NPC speaking from the right
- **Centre** (`stereo: 0.5`) — on-screen or ambient

**True 3D spatial audio** (Web Audio API `PannerNode` with distance model, azimuth, and elevation) is deferred to v1.5.0 pending broader browser support maturity.

---

## Accessibility

Both audio systems check `prefers-reduced-motion: reduce` before starting. Users who have set this preference receive no audio. This is enforced at the JavaScript level — the GM does not need to handle it.
