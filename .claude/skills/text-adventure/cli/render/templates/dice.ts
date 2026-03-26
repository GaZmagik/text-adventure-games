// Dice roll widget — displays the result of the last computation.
// Shows stat, modifier, roll value, total, DC, outcome badge.
// Includes inline WebGL renderer with numbered 3D die for all standard RPG die types.

import type { GmState, DieType, RollOutcome } from '../../types';
import { esc } from '../../lib/html';
import { DIE_CONFIGS, type DieConfig } from '../lib/die-geometries';
import { FONT_SCALE } from '../lib/die-textures';
import { WEBGL_DICE_CODE } from '../lib/webgl-dice';
import { outcomeBadgeStyle } from '../lib/outcome-badge';

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
  const roll = Number.isFinite(Number(data?.roll ?? rollComp?.roll)) ? Number(data?.roll ?? rollComp?.roll) : 0;
  const modifier = Number.isFinite(Number(data?.modifier ?? rollComp?.modifier)) ? Number(data?.modifier ?? rollComp?.modifier) : 0;
  const total = Number.isFinite(Number(data?.total ?? rollComp?.total)) ? Number(data?.total ?? rollComp?.total) : 0;
  const rawDc = data?.dc ?? (statComp ? statComp.dc : undefined);
  const dc = rawDc !== undefined ? (Number.isFinite(Number(rawDc)) ? Number(rawDc) : undefined) : undefined;
  const outcome: RollOutcome | 'unknown' = (data?.outcome as RollOutcome | undefined) ?? rollComp?.outcome ?? 'unknown';
  const rawMargin = data?.margin ?? (statComp ? statComp.margin : undefined);
  const margin = Number.isFinite(Number(rawMargin)) ? Number(rawMargin) : 0;
  const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;

  // Outcome badge styling
  const badge = outcomeBadgeStyle(outcome);
  const badgeBg = badge.bg;
  const badgeText = badge.text;
  const badgeBorder = badge.border;

  const outcomeLabel = outcome.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Die config — fall back to d20
  const config: DieConfig = DIE_CONFIGS[dieType as keyof typeof DIE_CONFIGS] ?? DIE_CONFIGS.d20;
  const fontScale = FONT_SCALE[dieType as DieType] ?? FONT_SCALE.d20;
  const isD100 = dieType === 'd100';
  const isD2 = dieType === 'd2';
  const canvasW = isD100 ? 880 : 440;
  const canvasH = 440;

  // Serialise config for inline script
  const configJson = JSON.stringify({
    faceCount: config.faceCount,
    numberRange: [...config.numberRange],
    geometryType: config.geometryType,
    geometryArgs: config.geometryArgs ?? [],
    customVertices: config.customVertices ?? null,
    customFaces: config.customFaces ?? null,
    trianglesPerFace: config.trianglesPerFace,
    paired: !!config.paired,
  });

  const webglCode = WEBGL_DICE_CODE;

  return `<style>${css}
.widget-dice { font-family: var(--ta-font-body); padding: 16px; text-align: center; }
.dice-stat { font-family: var(--ta-font-heading); font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ta-color-accent); margin-bottom: 8px; }
.dice-canvas-wrap { width: ${canvasW}px; height: ${canvasH}px; margin: 12px auto; position: relative; }
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
  <div class="dice-stat">${esc(stat)} Check${dieType !== 'd20' ? ` (${esc(dieType)})` : ''}</div>

  <div class="dice-canvas-wrap">
    <canvas id="die-canvas" width="${canvasW}" height="${canvasH}" role="img"
      aria-label="${esc(stat)} check — rolled ${roll}${modStr} = ${total}"></canvas>
  </div>

  <div class="dice-breakdown">
    <span class="dice-roll-val">${roll}</span>
    <span class="dice-mod">${modStr}</span>
    <span class="dice-eq">=</span>
    <span class="dice-total">${total}</span>
  </div>

  ${dc !== undefined ? `<div class="dice-dc">DC ${dc}</div>` : ''}

  <div class="dice-outcome" style="background:${badgeBg};color:${badgeText};border:1.5px solid ${badgeBorder}">
    ${esc(outcomeLabel)}
  </div>

  ${margin !== 0 ? `<div class="dice-margin">${margin > 0 ? 'Passed' : 'Failed'} by ${Math.abs(margin)}</div>` : ''}
</div>
<script>
var CONFIG=${configJson};
var ROLL=${roll};
var FONT_SCALE=${fontScale};
var IS_D2=${isD2};
var IS_D100=${isD100};
${webglCode}
<\/script>`;
}
