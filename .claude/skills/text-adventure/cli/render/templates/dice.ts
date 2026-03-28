// Dice roll widget — single-use click-to-roll die with inline WebGL renderer.

import type { GmState, DieType } from '../../types';
import { esc } from '../../lib/html';
import { DIE_CONFIGS, type DieConfig } from '../lib/die-geometries';
import { FONT_SCALE } from '../lib/die-textures';
import { generateWebGLDiceCode } from '../lib/webgl-dice';

const VALID_DIE_TYPES = new Set(Object.keys(DIE_CONFIGS));

export function renderDice(state: GmState | null, css: string, options?: Record<string, unknown>): string {
  const comp = state?._lastComputation;
  const data = options?.data as Record<string, unknown> | undefined;

  // Narrow out levelup_result — it lacks roll/modifier/total/outcome/stat fields
  const rollComp = comp && comp.type !== 'levelup_result' ? comp : undefined;

  // Further narrow for stat-specific fields (dc, margin)
  const statComp = rollComp && (rollComp.type === 'contested_roll' || rollComp.type === 'hazard_save') ? rollComp : undefined;

  // Allow --data overrides for testing — with runtime validation for script safety
  const rawDieType = (data?.dieType as string) ?? rollComp?.dieType ?? 'd20';
  const dieType = VALID_DIE_TYPES.has(rawDieType) ? rawDieType : 'd20';
  const stat = (data?.stat as string) ?? (statComp ? statComp.stat : rollComp?.stat) ?? '???';
  const modifier = Number.isFinite(Number(data?.modifier ?? rollComp?.modifier)) ? Number(data?.modifier ?? rollComp?.modifier) : 0;
  const rawDc = data?.dc ?? (statComp ? statComp.dc : undefined);
  const dc = rawDc !== undefined ? (Number.isFinite(Number(rawDc)) ? Number(rawDc) : undefined) : undefined;

  // Die config — fall back to d20
  const config: DieConfig = DIE_CONFIGS[dieType as keyof typeof DIE_CONFIGS] ?? DIE_CONFIGS.d20;
  const fontScale = FONT_SCALE[dieType as DieType] ?? FONT_SCALE.d20;
  const isD100 = dieType === 'd100';
  const isD2 = dieType === 'd2';
  const canvasW = 440;
  const canvasH = 440;
  const title = isD2 ? 'Coin Flip' : `${stat} Check${dieType !== 'd20' ? ` (${dieType.toUpperCase()})` : ''}`;
  const hint = isD100 ? 'CLICK TO ROLL' : isD2 ? 'CLICK THE COIN TO FLIP' : 'CLICK THE DIE TO ROLL';
  const resultMarkup = isD2
    ? `<div class="ra" id="ra">
    <div class="rv" id="xv"></div>
    <div class="ob" id="xo"></div>
  </div>`
    : isD100
      ? `<div class="ra" id="ra">
    <div class="bd">
      <span class="rv" id="xvT"></span>
      <span class="re">+</span>
      <span class="rv" id="xvU"></span>
      <span class="re">=</span>
      <span class="rt" id="xt"></span>
    </div>
  </div>`
      : `<div class="ra" id="ra">
    <div class="bd">
      <span class="rv" id="xv"></span>
      <span class="rm" id="xm"></span>
      <span class="re">=</span>
      <span class="rt" id="xt"></span>
    </div>
    <div class="dc" id="xd"></div>
    <div class="ob" id="xo"></div>
    <div class="mg" id="xg"></div>
  </div>`;

  const webglCode = generateWebGLDiceCode({
    dieType: dieType as DieType,
    config,
    fontScale,
    modifier,
    dc: dc ?? null,
  });

  return `<style>${css}
.widget-dice {
  --dbg: var(--ta-die-bg, #2a2a3a);
  --dfg: var(--ta-die-text-color, #e8e8f0);
  --acc: var(--ta-color-accent);
  --t1: var(--color-text-primary);
  --t2: var(--color-text-secondary);
  --t3: var(--color-text-tertiary);
  --sbg: var(--ta-badge-success-bg);
  --sfg: var(--ta-badge-success-text);
  --sbd: var(--ta-badge-crit-success-border);
  --fbg: var(--ta-badge-failure-bg);
  --ffg: var(--ta-badge-failure-text);
  --fbd: var(--ta-badge-crit-failure-border);
  --pbg: var(--ta-badge-partial-bg);
  --pfg: var(--ta-badge-partial-text);
}
.widget-dice .w { font-family: var(--ta-font-body); padding: 20px 16px; text-align: center; max-width: ${isD100 ? 500 : 440}px; margin: 0 auto; }
.widget-dice .tt { font-family: var(--ta-font-heading); font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--acc); margin-bottom: 12px; }
.widget-dice .cz { width: 220px; height: 220px; margin: 0 auto 10px; cursor: pointer; }
.widget-dice .cz canvas { width: 100%; height: 100%; display: block; }
.widget-dice .hi { font-size: 10px; color: var(--t3); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; min-height: 1.4em; transition: opacity 0.3s; }
.widget-dice .hi.hd { opacity: 0; }
.widget-dice .ra { opacity: 0; transition: opacity 0.4s; }
.widget-dice .ra.v { opacity: 1; }
.widget-dice .bd { display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; color: var(--t1); margin: 6px 0; }
.widget-dice .rv { font-size: 32px; color: var(--acc); }
.widget-dice.widget-dice-d2 .rv { font-size: 40px; font-weight: 700; margin: 6px 0; letter-spacing: 0.08em; }
.widget-dice.widget-dice-d100 .bd { align-items: baseline; }
.widget-dice.widget-dice-d100 .rv { font-size: 26px; color: var(--t2); }
.widget-dice .rm { font-size: 15px; color: var(--t2); }
.widget-dice .re { font-size: 15px; color: var(--t3); }
.widget-dice .rt { font-size: 32px; }
.widget-dice.widget-dice-d100 .dr { display: flex; gap: 16px; justify-content: center; cursor: pointer; }
.widget-dice.widget-dice-d100 .dw { flex: 0 0 auto; }
.widget-dice.widget-dice-d100 .cz { width: 200px; height: 200px; margin: 0; cursor: default; }
.widget-dice.widget-dice-d100 .dl { font-size: 9px; color: var(--t3); text-align: center; margin-top: 4px; letter-spacing: 0.12em; text-transform: uppercase; }
.widget-dice.widget-dice-d100 .hi { margin: 10px 0 12px; }
.widget-dice.widget-dice-d100 .rt { font-size: 40px; color: var(--acc); }
.widget-dice .dc { font-size: 11px; color: var(--t3); margin: 2px 0; letter-spacing: 0.06em; }
.widget-dice .ob {
  display: inline-block; padding: 5px 16px; border-radius: 8px;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
  margin-top: 6px; border: 1.5px solid transparent;
}
.widget-dice .mg { font-size: 10px; color: var(--t3); margin-top: 4px; display: none; }
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0s !important; animation-duration: 0s !important; }
}
</style>
<div class="widget-dice widget-dice-${esc(dieType) /* dieType validated by VALID_DIE_TYPES whitelist */}">
  <div class="w">
    <div class="tt">${esc(title)}</div>
    ${isD100 ? `<div class="dr" id="rollArea">
      <div class="dw">
        <div class="cz"><canvas id="cvT" width="${canvasW}" height="${canvasH}"></canvas></div>
        <div class="dl">Tens</div>
      </div>
      <div class="dw">
        <div class="cz"><canvas id="cvU" width="${canvasW}" height="${canvasH}"></canvas></div>
        <div class="dl">Units</div>
      </div>
    </div>` : `<div class="cz" id="cz"><canvas id="cv" width="${canvasW}" height="${canvasH}"></canvas></div>`}
    <div class="hi" id="hi">${hint}</div>
    ${resultMarkup}
  </div>
</div>
<script>
${webglCode}
<\/script>`;
}
