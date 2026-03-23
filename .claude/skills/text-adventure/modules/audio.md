# Audio — Procedural Soundscapes
> Module for text-adventure orchestrator. Optional — selected at game start in Settings widget.

Adds procedural ambient soundscapes to scene widgets using the Web Audio API.
All sounds are synthesised using oscillators and noise generators — no external
audio files, no network requests. Sounds are one-shot (max 30 seconds), never
auto-loop, and require player interaction to start.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: all visual
style files, atmosphere module (visual + audio complement each other).

---

## CRITICAL — Audio Rules

1. **No auto-play.** Sound NEVER starts automatically. The player must click Play.
2. **No looping.** Each soundscape plays once for up to 30 seconds, then stops.
3. **Play/Stop button in footer.** Every scene widget with audio includes a
   visible Play/Stop toggle in the widget footer.
4. **One sound per widget.** Only one soundscape active at a time. Starting a new
   sound stops the previous one.
5. **Sounds are ephemeral.** When a new widget renders (new iframe), the previous
   widget's audio stops naturally. No persistence, no stacking.
6. **Respect user preference.** If the player has not enabled the audio module in
   game settings, no audio code is included in widgets.

---

## Soundscape Types

Each scene can specify one soundscape type. The GM selects based on location and
atmosphere.

| Soundscape | Context | Sonic Character |
|-----------|---------|-----------------|
| `ship-engine` | Aboard a vessel, engine room, corridors | Low-frequency hum (40-60Hz), subtle oscillation |
| `rain` | Exterior, storm, wet environment | White noise filtered through bandpass, irregular rhythm |
| `wind` | Open spaces, mountaintop, desert | Filtered noise with slow LFO modulation |
| `heartbeat` | Tension, horror, chase, near death | Low sine wave pulse (60-80 BPM), increasing in speed |
| `station-ambience` | Space station, busy environment | Mixed low hum + occasional high-frequency pings |
| `forest` | Woodland, nature, calm exterior | Layered filtered noise (leaves) + sine chirps (birds) |
| `underwater` | Submerged, deep sea, flooded | Low-pass filtered noise + slow bubble oscillations |
| `alarm` | Emergency, red alert, danger | Square wave alternating between two frequencies |
| `silence` | Deliberately quiet, void, suspense | Very faint noise floor only — almost nothing |
| `mechanical` | Factory, machinery, clockwork | Rhythmic clicking (short noise bursts) + low drone |
| `fire` | Campfire, burning, volcanic | Crackle (random noise bursts) + low roar |
| `terminal` | Computer interface, hacking, data | High-frequency sine sweeps + digital noise |

---

## Audio Engine

The audio engine (`SoundscapeEngine`) and footer Play/Stop button are embedded in the
scene template (`scene.ts`). The GM does not hand-code audio — the scene template handles
all Web Audio API synthesis, oscillator routing, and button wiring automatically.

The scene template reads the `data-soundscape` and `data-sound-duration` attributes from
the scene widget root to determine which soundscape to play and for how long.

---

## GM Integration

The GM selects the soundscape type based on the scene's location and atmosphere:

1. Determine the primary environment (ship, station, exterior, etc.)
2. Set the soundscape type via `data-soundscape` attribute on the scene widget
3. Set duration via `data-sound-duration` attribute (10-30 seconds, shorter for tense scenes, longer for calm)
4. The scene template renders the Play/Stop footer button and wires the audio engine automatically

### Soundscape Selection Guide

| Location Type | Recommended Soundscape | Duration |
|--------------|----------------------|----------|
| Ship corridor / cabin | `ship-engine` | 25-30s |
| Space station hub | `station-ambience` | 25-30s |
| Planet surface | `wind` or `forest` | 20-30s |
| Storm / rain scene | `rain` | 20-25s |
| Combat encounter | `heartbeat` | 15-20s |
| Horror / suspense | `heartbeat` or `silence` | 10-15s |
| Emergency / alarm | `alarm` | 10-15s |
| Underwater / flooded | `underwater` | 20-25s |
| Computer terminal | `terminal` | 15-20s |
| Fire / explosion aftermath | `fire` | 15-20s |

### Volume Guidelines

All volumes are pre-set in the engine and intentionally quiet. Ambient sound
should be barely noticeable — a texture, not a feature. If the player notices
the sound consciously, it's too loud.
