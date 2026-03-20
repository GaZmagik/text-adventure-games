# Die Rolls — Resolution Mechanics
> Module for text-adventure orchestrator. Always loaded — governs all mechanical resolution.

This module defines how uncertain actions are resolved: the dice mechanics, the widget
stages, DC calibration, attribute variety, difficulty scaling, and the critical rule that
the player must never know which attribute is being tested before they commit to an action.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: core-systems, character-creation modules.

---

## The Hidden Attribute Rule

**Never reveal which attribute a check will test in the action options.**

The player chooses what to *do*, not which stat to roll. The GM determines the relevant
attribute after the player commits. This prevents the player from gaming their choices
toward their strongest stat.

```
BAD:
  Option A — Persuade the guard (CHA)
  Option B — Sneak past (DEX)
  Option C — Force the door (STR)

GOOD:
  Option A — Speak to the guard
  Option B — Find another way around
  Option C — Force the door open
```

The player should be making narrative decisions, not mechanical ones. A player who chooses
"Speak to the guard" might face a CHA check — or a WIS check if the guard is testing *them*.
A player who chooses "Find another way around" might face DEX (stealth) or INT (navigation)
or WIS (perception to spot an alternative route). The GM decides based on *how* the player
describes their approach, not based on a pre-assigned attribute.

**When the roll widget renders,** the attribute and modifier are revealed — but only after
the player has already committed to the action. This is the moment of truth, not the moment
of optimisation.

---

## D&D 5e — Four Progressive Stages

Never skip or combine stages. Each stage is revealed sequentially within a single widget.

### Stage 1 — Declare

Show:
- The action the player chose (in narrative terms, not mechanical)
- The relevant attribute (revealed now, after commitment)
- The modifier value
- A large `[ ROLL 1d20 ]` button

Do **not** reveal the DC. The player knows what they are attempting and how good they are
at it. They do not know how hard the task is.

### Stage 2 — Animate

On button press:
- CSS keyframe spin animation (0.6s duration)
- Land on a random number 1–20
- Display the raw roll prominently (36px, bold)
- Brief pause (0.3s) before proceeding to resolve

The roll must be triggered by explicit player click — never auto-roll.

### Stage 3 — Resolve

Reveal in sequence:
1. Modified total: `raw roll + modifier = total`. When the check involves a skill the
   character is proficient in, display the proficiency bonus as a separate line item in
   the breakdown — e.g., "Roll: 14 + AGI +2 + Proficiency +2 = 18 vs DC 15". When
   unproficient, omit the proficiency line entirely.
2. The DC (revealed now for the first time)
3. Outcome badge:

| Result | Condition |
|--------|-----------|
| CRITICAL SUCCESS | Natural 20 |
| SUCCESS | Total meets or exceeds DC |
| PARTIAL SUCCESS | Missed DC by 1–3, or beat DC by exactly 1 |
| FAILURE | Total below DC by 4+ |
| CRITICAL FAILURE | Natural 1 |

### Stage 4 — Continue

A single continue prompt. No consequences described in the roll widget itself — the outcome
widget handles narrative consequences separately.

Use the `data-prompt` + `addEventListener` pattern:
```html
<button class="action-btn" data-prompt="Continue.">Continue</button>
```

Include a copyable fallback prompt visible below the button.

---

## DC Table

| Task | DC |
|------|----|
| Trivial | 5 |
| Easy | 8 |
| Moderate | 12 |
| Hard | 16 |
| Very Hard | 20 |
| Near-impossible | 25 |

Apply difficulty setting modifier: Easy (−2), Normal (0), Hard (+2), Brutal (+4).

---

## Critical Rules

- **Natural 20:** Always succeeds, regardless of modifier or DC. The outcome includes a
  bonus — something extra the player did not expect. A critical success on a Persuasion
  check does not just convince the guard; the guard volunteers information.
- **Natural 1:** Always fails, regardless of modifier. The failure includes a complication —
  something gets worse. A critical failure on a Stealth check does not just alert the guard;
  it alerts the guard and you drop something important.
- **Partial success:** The action partially works but at a cost. You pick the lock, but it
  takes longer than expected and someone heard you. You persuade the merchant, but they
  remember your face. Partial results are narratively richer than binary pass/fail.

---

## Die Roll Variety

Use all six attributes across the adventure — not just the player's primary stats.

A high-DEX character should still face:
- **INT checks** — deciphering codes, understanding mechanisms, recalling knowledge
- **WIS checks** — reading people, sensing danger, resisting manipulation
- **CHA checks** — persuasion under pressure, intimidation, deception
- **CON checks** — enduring hardship, resisting poison, staying conscious
- **STR checks** — forcing doors, climbing, carrying, grappling

Design encounters that specifically target the player's weaker stats. A dump stat that
never gets tested is a missed opportunity for drama. The player should feel genuinely
uncertain about some rolls — not confident that their +5 modifier will carry them.

### Encounter Design for Variety

Each act should include checks across at least four different attributes:

| Act | Minimum attribute variety |
|-----|--------------------------|
| Act 1 (scenes 1–2) | At least 3 different attributes tested |
| Act 2 (scenes 3–8) | All 6 attributes tested at least once |
| Act 3 (scenes 9+) | Emphasis on the player's weakest 2 stats for maximum tension |

---

## DC Escalation

DCs scale with the player's level to maintain tension as modifiers grow. Use the table below
to set DCs based on player level and intended difficulty.

### DC by Player Level

| Player Level | Easy DC | Moderate DC | Hard DC | Extreme DC |
|-------------|---------|-------------|---------|------------|
| 1–2 | 8 | 10 | 13 | 16 |
| 3–4 | 9 | 12 | 15 | 18 |
| 5–6 | 10 | 13 | 16 | 19 |
| 7–8 | 11 | 14 | 17 | 20 |
| 9–10 | 12 | 15 | 18 | 22 |

Use **Moderate** for most checks. **Easy** for trivial tasks where failure is still possible.
**Hard** for specialist tasks. **Extreme** for near-impossible feats.

### Difficulty Setting Modifiers

These modifiers are applied on top of the DC values above, based on the difficulty chosen
in Game Settings:

| Setting | DC Modifier |
|---------|-------------|
| Easy mode | −2 to all DCs |
| Normal mode | Standard (no modifier) |
| Hard mode | +2 to all DCs |
| Brutal mode | +4 to all DCs |

### Escalation Techniques

Beyond the table, maintain tension through:

- **Disadvantage conditions** — fatigue, injury, time pressure, hostile environment,
  emotional distress. Disadvantage (roll twice, take lower) is a powerful tension tool.
- **Complication rolls** — checks where high rolls produce *complications* alongside success.
  You pick the lock, but the mechanism triggers an alarm. You persuade the captain, but she
  suspects your motives.
- **Contested checks** — the enemy rolls too. A persuasion check against a suspicious NPC is
  not DC 15; it is your CHA vs their WIS. Both rolls shown to the player.
- **Stacking pressure** — never let modified totals routinely exceed 20. If they do, the
  difficulty curve is broken. Introduce harder challenges, not bigger bonuses.

---

## sendPrompt Reliability

The `sendPrompt()` function in Claude.ai widget iframes is not always available due to timing
and sandboxing. For die roll widgets:

- Display the roll result and a copyable prompt string alongside the sendPrompt button
  (e.g., "I rolled 14 + 3 = 17. Continue.")
- Show a clear "Copy and paste this to continue" instruction
- Never rely solely on sendPrompt for progression — the player must always have a manual path
- Use the `data-prompt` + `addEventListener` pattern, never inline `onclick`
- Avoid contractions in prompt strings — "Let us" not "Let's"

### Fallback Pattern

```html
<button class="action-btn" data-prompt="I rolled 14 plus 3 equals 17. Continue.">
  Continue
</button>
<p class="fallback-text" id="fallback" style="display:none; font-size:11px; color:var(--color-text-tertiary); margin-top:8px;">
  If the button above does not work, copy this text and paste it into the chat:
  <code id="fallback-prompt"></code>
</p>
<script>
document.querySelectorAll('.action-btn').forEach(btn => {
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

## Alternative Rulebook Systems

This module defines the D&D 5e d20 resolution system. The text-adventure skill is
system-agnostic — specific game systems (such as Star Wars: Edge of the Empire) have their
own dedicated skills with tailored dice mechanics.

- **Custom rulebooks** — the player provides a PDF or markdown document. The GM reads and
  applies the custom resolution mechanic. The four-stage widget pattern (Declare → Animate →
  Resolve → Continue) adapts to any system.

---

## 3D Dice Rendering (Three.js)

The die roll widget renders proper 3D polyhedra using Three.js (loaded from CDN). Each die
type uses its correct geometric shape with numbered faces, idle floating animation, and a
tumble-and-settle roll animation. The rolled value is predetermined, then the die rotates
to land with that face pointing at the camera.

### Die Shapes

| Die | Geometry | Faces | Opposite sum |
|-----|----------|-------|-------------|
| d4 | TetrahedronGeometry | 4 triangles | N/A |
| d6 | BoxGeometry | 6 squares (12 triangles) | 7 |
| d8 | OctahedronGeometry | 8 triangles | 9 |
| d12 | DodecahedronGeometry | 12 pentagons (36 triangles) | 13 |
| d20 | IcosahedronGeometry | 20 triangles | 21 |

### Style-Aware Colouring

The die face colour and number colour adapt to the active visual style via
`prefers-color-scheme`. Visual styles can override these defaults by setting
CSS custom properties on the widget root:

- `--die-face-color` — the die body colour (default: dark `#35353e`, light `#f0efe7`)
- `--die-number-color` — the face number colour (default: dark `#c8c8d0`, light `#333340`)
- `--die-edge-color` — the wireframe edge colour (default: dark `#606070`, light `#9898a0`)
- `--die-crit-success-color` — flash colour for natural max (default: `#4ade80`)
- `--die-crit-fail-color` — flash colour for natural 1 (default: `#f87171`)

### Architecture

The 3D die system uses:
- **Three.js r128** via CDN (`https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`)
- **Texture atlas** — a single canvas texture with all face numbers in a grid, UV-mapped to each face
- **Face clustering** — triangles grouped by normal direction (dot product > 0.93) to identify logical faces on compound shapes (d6 squares, d12 pentagons)
- **Opposite-face pairing** — faces with opposing normals (dot product closest to -1) are paired and assigned values that sum to the traditional total
- **Quaternion animation** — chaotic tumble via slerp through 8 random orientations, then easeOutBack settle onto the target face

### Rendering a Single Die

When the GM needs a die roll, render a single die of the appropriate type. The widget
includes the narrative context, check breakdown, the 3D die, and the continue button.
The die type is determined by the game system — d20 for D&D 5e, other types for
alternative systems or damage rolls.

### Complete 3D Die Widget

The following HTML renders a complete 3D die tray with all standard polyhedrals.
For a single-die check widget, extract only the relevant die type and embed it
within the check panel layout (see style-reference.md Die Roll Widget Pattern).

```html
<style>
:root { --ta-font-body: var(--font-sans); }
.tray { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 1rem 0; }
.die-card { background: var(--color-background-secondary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); padding: 12px; text-align: center; }
.die-card canvas { cursor: pointer; display: block; margin: 0 auto; }
.die-card-label { font-family: var(--ta-font-body); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-text-tertiary); margin-top: 6px; }
.die-card-val { font-family: var(--ta-font-body); font-size: 28px; font-weight: 500; color: var(--color-text-primary); min-height: 36px; line-height: 36px; }
.die-card-hint { font-family: var(--ta-font-body); font-size: 11px; color: var(--color-text-tertiary); margin-top: 2px; min-height: 18px; }
.reset-row { text-align: center; margin-top: 12px; }
.reset-btn { font-family: var(--ta-font-body); font-size: 12px; color: var(--color-text-tertiary); background: transparent; border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-md); padding: 6px 14px; cursor: pointer; min-height: 44px; min-width: 44px; box-sizing: border-box; }
.reset-btn:hover { border-color: var(--color-border-secondary); color: var(--color-text-secondary); }
</style>

<div class="tray">
  <div class="die-card"><canvas id="d4" width="160" height="160" role="button" aria-label="Roll d4" tabindex="0"></canvas><div class="die-card-label">d4</div><div class="die-card-val" id="d4-val" aria-live="polite"></div><div class="die-card-hint" id="d4-hint">Click to roll</div></div>
  <div class="die-card"><canvas id="d6" width="160" height="160" role="button" aria-label="Roll d6" tabindex="0"></canvas><div class="die-card-label">d6</div><div class="die-card-val" id="d6-val" aria-live="polite"></div><div class="die-card-hint" id="d6-hint">Click to roll</div></div>
  <div class="die-card"><canvas id="d8" width="160" height="160" role="button" aria-label="Roll d8" tabindex="0"></canvas><div class="die-card-label">d8</div><div class="die-card-val" id="d8-val" aria-live="polite"></div><div class="die-card-hint" id="d8-hint">Click to roll</div></div>
  <div class="die-card"><canvas id="d12" width="160" height="160" role="button" aria-label="Roll d12" tabindex="0"></canvas><div class="die-card-label">d12</div><div class="die-card-val" id="d12-val" aria-live="polite"></div><div class="die-card-hint" id="d12-hint">Click to roll</div></div>
</div>
<div class="reset-row"><button class="reset-btn" id="resetAll">Reset all</button></div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
  onerror="document.querySelectorAll('.die-card canvas').forEach(function(c){c.style.display='none';c.parentElement.querySelector('.die-card-hint').textContent='3D dice unavailable — use CSS dice from style-reference.md';})"></script>
<script>
if (typeof THREE === 'undefined') { /* Three.js failed to load — fallback handled by onerror above */ }
else (function(){
  var isDk = matchMedia('(prefers-color-scheme:dark)').matches;
  var root = document.documentElement;
  var cs = getComputedStyle(root);
  var FC = cs.getPropertyValue('--die-face-color').trim() || (isDk ? '#35353e' : '#f0efe7');
  var NC = cs.getPropertyValue('--die-number-color').trim() || (isDk ? '#c8c8d0' : '#333340');
  var EC = isDk ? 0x606070 : 0x9898a0;
  var AL = isDk ? 0.5 : 0.7;
  var DL = isDk ? 0.7 : 0.9;

  var DEFS = [
    {id:'d4', sides:4, r:1.5, geo:function(r){return new THREE.TetrahedronGeometry(r,0)}},
    {id:'d6', sides:6, r:0.95, geo:function(r){return new THREE.BoxGeometry(r*1.55,r*1.55,r*1.55)}},
    {id:'d8', sides:8, r:1.35, geo:function(r){return new THREE.OctahedronGeometry(r,0)}},
    {id:'d12', sides:12, r:1.35, geo:function(r){return new THREE.DodecahedronGeometry(r,0)}}
  ];

  var allDice = [];

  function makeDie(def) {
    var cv = document.getElementById(def.id);
    var W = 160, H = 160;
    var ren = new THREE.WebGLRenderer({canvas:cv, antialias:true, alpha:true});
    ren.setPixelRatio(Math.min(devicePixelRatio,2));
    ren.setSize(W,H);

    var sc = new THREE.Scene();
    var cam = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    cam.position.set(0, 1.5, 5.5);
    cam.lookAt(0,0,0);
    var cd = new THREE.Vector3(); cam.getWorldDirection(cd);

    sc.add(new THREE.AmbientLight(0xffffff, AL));
    var dl = new THREE.DirectionalLight(0xffffff, DL);
    dl.position.set(3,5,4); sc.add(dl);

    var grp = new THREE.Group(); sc.add(grp);

    var baseGeo = def.geo(def.r);
    var geo = baseGeo.toNonIndexed();
    var pos = geo.attributes.position;
    var tc = pos.count / 3;

    // Compute per-triangle data
    var td = [];
    for (var t = 0; t < tc; t++) {
      var a = new THREE.Vector3(pos.getX(t*3),pos.getY(t*3),pos.getZ(t*3));
      var b = new THREE.Vector3(pos.getX(t*3+1),pos.getY(t*3+1),pos.getZ(t*3+1));
      var c = new THREE.Vector3(pos.getX(t*3+2),pos.getY(t*3+2),pos.getZ(t*3+2));
      var cen = a.clone().add(b).add(c).divideScalar(3);
      var ab = b.clone().sub(a), ac = c.clone().sub(a);
      var n = new THREE.Vector3().crossVectors(ab, ac).normalize();
      if (n.dot(cen) < 0) n.negate();
      td.push({a:a,b:b,c:c,cen:cen,n:n});
    }

    // Cluster triangles into logical faces by normal direction
    var asgn = new Array(tc).fill(false);
    var faces = [];
    for (var t = 0; t < tc; t++) {
      if (asgn[t]) continue;
      var f = {tris:[t]}; asgn[t] = true;
      for (var t2 = t+1; t2 < tc; t2++) {
        if (!asgn[t2] && td[t].n.dot(td[t2].n) > 0.93) {
          f.tris.push(t2); asgn[t2] = true;
        }
      }
      var fc = new THREE.Vector3(), fn = new THREE.Vector3(), vc = 0;
      for (var i = 0; i < f.tris.length; i++) {
        var d = td[f.tris[i]];
        fc.add(d.a).add(d.b).add(d.c); fn.add(d.n); vc += 3;
      }
      fc.divideScalar(vc); fn.normalize();
      f.center = fc; f.normal = fn;
      faces.push(f);
    }

    // Assign face values with proper opposite-face conventions
    var targetSum = def.sides === 6 ? 7 : def.sides === 8 ? 9 : def.sides === 12 ? 13 : 0;
    var fv = new Array(faces.length).fill(0);

    if (targetSum > 0 && faces.length === def.sides) {
      var paired = new Array(faces.length).fill(false);
      var pairs = [];
      for (var fi = 0; fi < faces.length; fi++) {
        if (paired[fi]) continue;
        var bestJ = -1, bestDot = -0.5;
        for (var fj = fi+1; fj < faces.length; fj++) {
          if (paired[fj]) continue;
          var dp = faces[fi].normal.dot(faces[fj].normal);
          if (dp < bestDot) { bestDot = dp; bestJ = fj; }
        }
        if (bestJ >= 0) {
          pairs.push([fi, bestJ]);
          paired[fi] = true; paired[bestJ] = true;
        }
      }
      for (var s = pairs.length-1; s > 0; s--) {
        var j = Math.floor(Math.random()*(s+1));
        var tmp = pairs[s]; pairs[s] = pairs[j]; pairs[j] = tmp;
      }
      for (var pi = 0; pi < pairs.length; pi++) {
        var lo = pi + 1, hi = targetSum - lo;
        if (Math.random() < 0.5) {
          fv[pairs[pi][0]] = lo; fv[pairs[pi][1]] = hi;
        } else {
          fv[pairs[pi][0]] = hi; fv[pairs[pi][1]] = lo;
        }
      }
    } else {
      var vals = [];
      for (var i = 1; i <= def.sides; i++) vals.push(i);
      for (var s = vals.length-1; s > 0; s--) {
        var j = Math.floor(Math.random()*(s+1));
        var tmp = vals[s]; vals[s] = vals[j]; vals[j] = tmp;
      }
      fv = vals.slice(0, faces.length);
    }

    // Build texture atlas
    var cols = Math.ceil(Math.sqrt(def.sides));
    var rows = Math.ceil(def.sides / cols);
    var ATS = 512, cW = ATS/cols, cH = ATS/rows;
    var ac2 = document.createElement('canvas');
    ac2.width = ATS; ac2.height = ATS;
    var ax = ac2.getContext('2d');
    ax.fillStyle = FC; ax.fillRect(0,0,ATS,ATS);
    var fs = def.sides <= 4 ? 72 : def.sides <= 6 ? 60 : def.sides <= 8 ? 50 : 38;
    ax.font = '500 '+fs+'px sans-serif';
    ax.textAlign = 'center'; ax.textBaseline = 'middle';
    ax.fillStyle = NC;
    for (var n = 0; n < def.sides; n++) {
      var co = n % cols, ro = Math.floor(n / cols);
      ax.fillText(String(n+1), co*cW+cW/2, ro*cH+cH/2);
      if (n+1===6||n+1===9) ax.fillRect(co*cW+cW/2-14, ro*cH+cH/2+fs*0.38, 28, 2);
    }
    var tex = new THREE.CanvasTexture(ac2);
    tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;

    // UV mapping — project face vertices onto atlas cells
    var uvA = new Float32Array(pos.count * 2);
    for (var fi = 0; fi < faces.length && fi < def.sides; fi++) {
      var face = faces[fi], val = fv[fi], idx = val-1;
      var co = idx % cols, ro = Math.floor(idx / cols);
      var uC = (co+0.5)/cols, vC = 1-(ro+0.5)/rows;

      var N = face.normal;
      var up = Math.abs(N.y) < 0.99 ? new THREE.Vector3(0,1,0) : new THREE.Vector3(1,0,0);
      var T = new THREE.Vector3().crossVectors(up, N).normalize();
      var B = new THREE.Vector3().crossVectors(N, T).normalize();

      var maxR = 0.001;
      for (var ti = 0; ti < face.tris.length; ti++) {
        var d2 = td[face.tris[ti]];
        var verts = [d2.a, d2.b, d2.c];
        for (var vi = 0; vi < 3; vi++) {
          var dv = verts[vi].clone().sub(face.center);
          var dt2 = dv.dot(T), db2 = dv.dot(B);
          var ext = Math.sqrt(dt2*dt2 + db2*db2);
          if (ext > maxR) maxR = ext;
        }
      }

      var cScale = Math.min(1/cols, 1/rows);
      var uvS = 0.38 * cScale / maxR;

      for (var ti = 0; ti < face.tris.length; ti++) {
        var triIdx = face.tris[ti];
        var d3 = td[triIdx];
        var verts2 = [d3.a, d3.b, d3.c];
        for (var vi = 0; vi < 3; vi++) {
          var dv2 = verts2[vi].clone().sub(face.center);
          var ai = (triIdx*3+vi)*2;
          uvA[ai] = uC + dv2.dot(T) * uvS;
          uvA[ai+1] = vC + dv2.dot(B) * uvS;
        }
      }
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uvA, 2));

    var mat = new THREE.MeshStandardMaterial({map:tex, flatShading:true, metalness:0.05, roughness:0.6, side:THREE.DoubleSide});
    grp.add(new THREE.Mesh(geo, mat));
    grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(baseGeo), new THREE.LineBasicMaterial({color:EC})));

    grp.rotation.x = 0.35; grp.rotation.z = 0.08;

    return {
      ren:ren, sc:sc, cam:cam, cd:cd, grp:grp,
      faces:faces, fv:fv,
      rolled:false, rolling:false, settled:false,
      idle: Math.random()*6.28, rClk:0, rDur:2.0,
      chaos:[], tgtQ:new THREE.Quaternion(), rawVal:0,
      valEl: document.getElementById(def.id+'-val'),
      hintEl: document.getElementById(def.id+'-hint'),
      def:def, cv:cv
    };
  }

  function easeOB(t) {
    var c1=1.70158, c3=c1+1;
    return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);
  }

  function getQ(die, fi) {
    var n = die.faces[fi].normal.clone();
    var tgt = die.cd.clone().negate();
    return new THREE.Quaternion().setFromUnitVectors(n, tgt);
  }

  function startRoll(die) {
    if (die.rolled || die.rolling) return;
    die.rawVal = Math.floor(Math.random()*die.def.sides)+1;
    var fi = 0;
    for (var i = 0; i < die.fv.length; i++) { if (die.fv[i]===die.rawVal){fi=i;break;} }
    die.tgtQ = getQ(die, fi);
    die.chaos = [die.grp.quaternion.clone()];
    for (var i = 0; i < 8; i++) {
      die.chaos.push(new THREE.Quaternion().setFromEuler(new THREE.Euler(
        (Math.random()-0.5)*Math.PI*4,(Math.random()-0.5)*Math.PI*4,(Math.random()-0.5)*Math.PI*3
      )));
    }
    die.rolling = true; die.rClk = 0;
    die.hintEl.textContent = 'Rolling...';
  }

  function finishRoll(die) {
    die.rolled = true; die.rolling = false; die.settled = true;
    die.grp.scale.setScalar(1); die.grp.position.y = 0;
    die.grp.quaternion.copy(die.tgtQ);
    die.valEl.textContent = die.rawVal;
    die.hintEl.textContent = 'Rolled: ' + die.rawVal;
  }

  // Animation loop
  function tick() {
    requestAnimationFrame(tick);
    for (var i = 0; i < allDice.length; i++) {
      var d = allDice[i];
      if (!d.rolling && !d.settled) {
        d.idle += 0.012;
        d.grp.position.y = Math.sin(d.idle)*0.04;
        d.grp.rotation.y += 0.003;
      }
      if (d.rolling) {
        d.rClk += 1/60;
        var p = Math.min(d.rClk/d.rDur, 1);
        if (p < 0.5) {
          var sp = p/0.5;
          var ci = Math.min(Math.floor(sp*d.chaos.length), d.chaos.length-1);
          var ni = Math.min(ci+1, d.chaos.length-1);
          var lt = (sp*d.chaos.length)-ci;
          var q = new THREE.Quaternion(); q.slerpQuaternions(d.chaos[ci], d.chaos[ni], lt);
          d.grp.quaternion.copy(q);
          d.grp.scale.setScalar(1+Math.sin(sp*Math.PI)*0.15);
          d.grp.position.y = Math.sin(sp*Math.PI)*0.35;
        } else {
          var sp2 = (p-0.5)/0.5;
          var e = easeOB(sp2);
          var last = d.chaos[d.chaos.length-1];
          var q2 = new THREE.Quaternion(); q2.slerpQuaternions(last, d.tgtQ, e);
          d.grp.quaternion.copy(q2);
          d.grp.scale.setScalar(1+(1-e)*0.04);
          d.grp.position.y = (1-e)*0.08;
        }
        if (p >= 1) finishRoll(d);
      }
      d.ren.render(d.sc, d.cam);
    }
  }

  for (var i = 0; i < DEFS.length; i++) {
    var d = makeDie(DEFS[i]);
    d.cv.addEventListener('click', (function(die){return function(){startRoll(die)}})(d));
    allDice.push(d);
  }
  tick();

  document.getElementById('resetAll').addEventListener('click', function() {
    for (var i = 0; i < allDice.length; i++) {
      var d = allDice[i];
      d.rolled = false; d.settled = false; d.rolling = false; d.rawVal = 0;
      d.idle = Math.random()*6.28;
      d.grp.quaternion.set(0,0,0,1);
      d.grp.rotation.set(0.35,0,0.08);
      d.grp.scale.setScalar(1); d.grp.position.y = 0;
      d.valEl.textContent = '';
      d.hintEl.textContent = 'Click to roll';
    }
  });
})();
</script>
```

### Adding d20 and d10

To add a d20, add to the DEFS array:
```js
{id:'d20', sides:20, r:1.35, geo:function(r){return new THREE.IcosahedronGeometry(r,0)}}
```
Opposite faces sum to 21. The face clustering and UV mapping work identically.

The d10 (pentagonal trapezohedron) is not a built-in Three.js geometry. For d10/d100
rolls, use the CSS die shapes from style-reference.md instead, or create custom geometry
in a future iteration.

### Single Die for Checks

For a standard ability check, the GM renders only the relevant die (typically d20).
Extract the single die definition from DEFS, render one canvas in the check panel,
and wire the result to the sendPrompt continue button. The tray layout above is for
reference and testing — in gameplay, only one die appears at a time.

---

## Anti-Patterns

- Never reveal which attribute a check will test before the player commits to an action.
- Never auto-roll — the player must click the roll button.
- Never describe consequences in the roll widget — use the outcome widget.
- Never reveal the DC before the roll — only after, during the resolve stage.
- Never skip the animation stage — the moment of uncertainty is part of the experience.
- Never let the same attribute dominate the checks across an entire act.
- Never use inline `onclick` with sendPrompt — use `data-prompt` + `addEventListener`.
- Never use contractions (apostrophes) in sendPrompt strings.
- Never omit the copyable fallback prompt from any widget with a sendPrompt button.
- Never label action options with the attribute they test (e.g., "Persuade (CHA)").
- Never let modified totals routinely exceed 20 without escalating DCs.
