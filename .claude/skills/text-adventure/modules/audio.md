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

## Web Audio API Implementation

### Audio Engine

```js
class SoundscapeEngine {
  constructor() {
    this.ctx = null;
    this.nodes = [];
    this.playing = false;
    this.timeout = null;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  play(type, duration) {
    this.init();
    this.stop();
    duration = Math.min(duration || 30, 30); // cap at 30 seconds

    const generators = {
      'ship-engine': () => this.genDrone(45, 0.3, duration),
      'rain': () => this.genNoise('bandpass', 800, 0.2, duration),
      'wind': () => this.genNoise('lowpass', 400, 0.15, duration),
      'heartbeat': () => this.genPulse(1.1, 80, 0.25, duration),
      'station-ambience': () => this.genDrone(55, 0.15, duration),
      'forest': () => this.genNoise('bandpass', 2000, 0.08, duration),
      'underwater': () => this.genNoise('lowpass', 200, 0.2, duration),
      'alarm': () => this.genAlarm(440, 880, 0.2, duration),
      'silence': () => this.genNoise('lowpass', 100, 0.02, duration),
      'mechanical': () => this.genMechanical(0.15, duration),
      'fire': () => this.genNoise('highpass', 300, 0.12, duration),
      'terminal': () => this.genTerminal(0.08, duration),
    };

    const gen = generators[type] || generators['silence'];
    gen();
    this.playing = true;

    this.timeout = setTimeout(() => this.stop(), duration * 1000);
  }

  stop() {
    this.nodes.forEach(n => { try { n.stop(); } catch(e) {} try { n.disconnect(); } catch(e) {} });
    this.nodes = [];
    this.playing = false;
    if (this.timeout) { clearTimeout(this.timeout); this.timeout = null; }
  }

  genDrone(freq, vol, dur) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;
    lfo.type = 'sine';
    lfo.frequency.value = 0.2;
    lfoGain.gain.value = 3;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.gain.value = vol;
    gain.connect(this.ctx.destination);

    // Fade in/out
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 2);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + dur);

    osc.start(); lfo.start();
    this.nodes.push(osc, lfo);
  }

  genNoise(filterType, freq, vol, dur) {
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;

    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 1);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + dur);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
    this.nodes.push(source);
  }

  genPulse(rate, freq, vol, dur) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0;

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const interval = 1 / rate;
    const pulses = Math.floor(dur * rate);
    for (let i = 0; i < pulses; i++) {
      const t = this.ctx.currentTime + i * interval;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.05);
      gain.gain.linearRampToValueAtTime(0, t + 0.3);
    }

    osc.start();
    this.nodes.push(osc);
  }

  genAlarm(f1, f2, vol, dur) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    gain.gain.value = vol;

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const cycles = Math.floor(dur);
    for (let i = 0; i < cycles; i++) {
      osc.frequency.setValueAtTime(i % 2 === 0 ? f1 : f2, this.ctx.currentTime + i);
    }
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + dur);

    osc.start();
    this.nodes.push(osc);
  }

  genMechanical(vol, dur) {
    // Low rumble drone at audible frequency
    this.genDrone(80, vol * 0.6, dur);
    // Rhythmic clicking via short noise bursts
    const clickRate = 4; // clicks per second
    const clicks = Math.floor(dur * clickRate);
    for (let i = 0; i < clicks; i++) {
      const t = this.ctx.currentTime + i / clickRate;
      const bufSize = this.ctx.sampleRate * 0.02; // 20ms click
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let j = 0; j < bufSize; j++) data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufSize * 0.3));
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const g = this.ctx.createGain();
      g.gain.value = vol * 0.4;
      src.connect(g);
      g.connect(this.ctx.destination);
      src.start(t);
      this.nodes.push(src);
    }
  }
  genTerminal(vol, dur) { this.genNoise('highpass', 3000, vol, dur); }
}
```

### Footer Button

```html
<button class="footer-btn" id="audio-btn" style="font-family:var(--ta-font-body);
  font-size:10px; letter-spacing:0.08em; background:transparent;
  border:0.5px solid var(--ta-color-accent-bg); border-radius:4px;
  padding:4px 10px; color:var(--ta-color-accent); cursor:pointer;">
  ♫ Play
</button>

<script>
var soundscape = new SoundscapeEngine();
var audioBtn = document.getElementById('audio-btn');
var soundType = 'ship-engine'; // GM sets per scene
var soundDuration = 25;        // GM sets per scene (max 30)

audioBtn.addEventListener('click', function() {
  if (soundscape.playing) {
    soundscape.stop();
    audioBtn.textContent = '♫ Play';
  } else {
    soundscape.play(soundType, soundDuration);
    audioBtn.textContent = '■ Stop';
    setTimeout(function() {
      if (!soundscape.playing) return;
      soundscape.stop();
      audioBtn.textContent = '♫ Play';
    }, soundDuration * 1000);
  }
});
</script>
```

---

## GM Integration

The GM selects the soundscape type based on the scene's location and atmosphere:

1. Determine the primary environment (ship, station, exterior, etc.)
2. Set `soundType` in the widget's script block
3. Set `soundDuration` (10-30 seconds, shorter for tense scenes, longer for calm)
4. Include the `SoundscapeEngine` class and footer button in the widget

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
