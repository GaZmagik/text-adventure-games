// Dice roll widget — displays the result of the last computation.
// Shows stat, modifier, roll value, total, DC, outcome badge.
// Includes Three.js CDN script tag and a basic die canvas.

import type { GmState } from '../../types';

export function renderDice(state: GmState | null, css: string, _options?: Record<string, unknown>): string {
  const comp = state?._lastComputation;
  const stat = comp?.stat ?? '???';
  const roll = comp?.roll ?? 0;
  const modifier = comp?.modifier ?? 0;
  const total = comp?.total ?? 0;
  const dc = comp?.dc;
  const outcome = comp?.outcome ?? 'unknown';
  const margin = comp?.margin ?? 0;
  const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;

  // Determine outcome badge styling
  let badgeBg = 'var(--ta-badge-partial-bg)';
  let badgeText = 'var(--ta-badge-partial-text)';
  let badgeBorder = 'transparent';

  if (outcome === 'critical_success') {
    badgeBg = 'var(--ta-badge-success-bg)';
    badgeText = 'var(--ta-badge-success-text)';
    badgeBorder = 'var(--ta-badge-crit-success-border)';
  } else if (outcome === 'success') {
    badgeBg = 'var(--ta-badge-success-bg)';
    badgeText = 'var(--ta-badge-success-text)';
  } else if (outcome === 'failure') {
    badgeBg = 'var(--ta-badge-failure-bg)';
    badgeText = 'var(--ta-badge-failure-text)';
  } else if (outcome === 'critical_failure') {
    badgeBg = 'var(--ta-badge-failure-bg)';
    badgeText = 'var(--ta-badge-failure-text)';
    badgeBorder = 'var(--ta-badge-crit-failure-border)';
  }

  const outcomeLabel = outcome.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return `
<style>${css}
.widget-dice { font-family: var(--ta-font-body); padding: 16px; text-align: center; }
.dice-stat { font-family: var(--ta-font-heading); font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ta-color-accent); margin-bottom: 8px; }
.dice-canvas-wrap { width: 120px; height: 120px; margin: 12px auto; position: relative; }
.dice-canvas-wrap canvas { width: 100%; height: 100%; }
.dice-breakdown { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 20px; font-weight: 700; color: var(--color-text-primary); margin: 12px 0; }
.dice-roll-val { font-size: 28px; color: var(--ta-color-accent); }
.dice-mod { font-size: 16px; color: var(--color-text-secondary); }
.dice-eq { font-size: 16px; color: var(--color-text-tertiary); }
.dice-total { font-size: 28px; }
.dice-dc { font-size: 12px; color: var(--color-text-tertiary); margin: 4px 0; }
.dice-outcome {
  display: inline-block; padding: 6px 16px; border-radius: 12px;
  font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
  margin-top: 8px;
}
.dice-margin { font-size: 11px; color: var(--color-text-tertiary); margin-top: 4px; }
</style>
<div class="widget-dice">
  <div class="dice-stat">${esc(stat)} Check</div>

  <!-- Three.js die canvas -->
  <div class="dice-canvas-wrap">
    <canvas id="die-canvas" width="120" height="120"></canvas>
  </div>

  <!-- Roll breakdown -->
  <div class="dice-breakdown">
    <span class="dice-roll-val">${roll}</span>
    <span class="dice-mod">${modStr}</span>
    <span class="dice-eq">=</span>
    <span class="dice-total">${total}</span>
  </div>

  ${dc !== undefined ? `<div class="dice-dc">DC ${dc}</div>` : ''}

  <div class="dice-outcome" style="background:${badgeBg};color:${badgeText};border:1.5px solid ${badgeBorder}">
    ${outcomeLabel}
  </div>

  ${margin !== 0 ? `<div class="dice-margin">${margin > 0 ? 'Passed' : 'Failed'} by ${Math.abs(margin)}</div>` : ''}
</div>

<!-- Three.js CDN for 3D die rendering -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>
<script>
(function() {
  var canvas = document.getElementById('die-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 3.5);

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(120, 120);
  renderer.setClearColor(0x000000, 0);

  // D20 icosahedron
  var geometry = new THREE.IcosahedronGeometry(1, 0);
  var material = new THREE.MeshPhongMaterial({
    color: 0x2a2a3a,
    emissive: 0x111122,
    shininess: 80,
    flatShading: true,
  });
  var die = new THREE.Mesh(geometry, material);
  scene.add(die);

  var light = new THREE.DirectionalLight(0xffffff, 0.9);
  light.position.set(2, 3, 4);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x444466, 0.5));

  // Spin animation
  var spinDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ta-die-spin-duration')) || 0.6;
  var totalFrames = Math.round(spinDuration * 60);
  var frame = 0;

  function animate() {
    if (frame < totalFrames) {
      var t = frame / totalFrames;
      var ease = 1 - Math.pow(1 - t, 3);
      die.rotation.x = ease * Math.PI * 4;
      die.rotation.y = ease * Math.PI * 3;
      frame++;
      requestAnimationFrame(animate);
    }
    renderer.render(scene, camera);
  }
  animate();
})();
<\/script>`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
