import type { GmState, DieType } from '../../types';
import { esc, serialiseInlineScriptData } from '../../lib/html';
import { DIE_CONFIGS, type DieConfig } from '../lib/die-geometries';
import { FONT_SCALE } from '../lib/die-textures';
import { WEBGL_DICE_POOL_CODE } from '../lib/webgl-dice-pool';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

/** Adapt WebGL pool code for Shadow DOM — replace document.getElementById/querySelector
 *  with shadow equivalents, but keep document.createElement as-is. */
function shadowAdaptPoolCode(code: string): string {
  return code
    .replace(/document\.getElementById\(/g, 'shadow.getElementById(')
    .replace(/document\.querySelector\(/g, 'shadow.querySelector(')
    .replace(/document\.querySelectorAll\(/g, 'shadow.querySelectorAll(');
}

type PoolGroup = {
  dieType: DieType;
  count: number;
};

const VALID_DIE_TYPES = new Set(Object.keys(DIE_CONFIGS));
export const MAX_DICE_POOL_TOTAL = 24;
export const MAX_DICE_POOL_CANVAS_WIDTH = 900;
export const MAX_DICE_POOL_CANVAS_HEIGHT = 1320;

function clampCount(value: unknown): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 24);
}

function capPool(groups: PoolGroup[]): {
  groups: PoolGroup[];
  omittedDice: number;
  originalTotal: number;
} {
  const originalTotal = groups.reduce((sum, group) => sum + group.count, 0);
  let remaining = MAX_DICE_POOL_TOTAL;
  const capped: PoolGroup[] = [];

  for (const group of groups) {
    if (remaining <= 0) break;
    const allowed = Math.min(group.count, remaining);
    if (allowed > 0) {
      capped.push({ dieType: group.dieType, count: allowed });
      remaining -= allowed;
    }
  }

  const fallback: PoolGroup[] = capped.length > 0 ? capped : [{ dieType: 'd6', count: 2 }];
  const keptTotal = fallback.reduce((sum, group) => sum + group.count, 0);
  return {
    groups: fallback,
    omittedDice: Math.max(originalTotal - keptTotal, 0),
    originalTotal: originalTotal || keptTotal,
  };
}

function normalisePool(raw: unknown): {
  groups: PoolGroup[];
  omittedDice: number;
  originalTotal: number;
} {
  if (!Array.isArray(raw)) {
    return { groups: [{ dieType: 'd6', count: 2 }], omittedDice: 0, originalTotal: 2 };
  }
  const groups: PoolGroup[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const rawDieType = String(rec.dieType ?? rec.type ?? '').trim();
    if (!VALID_DIE_TYPES.has(rawDieType)) continue;
    groups.push({ dieType: rawDieType as DieType, count: clampCount(rec.count) });
  }
  if (!groups.length) {
    return { groups: [{ dieType: 'd6', count: 2 }], omittedDice: 0, originalTotal: 2 };
  }
  return capPool(groups);
}

function serialiseConfig(config: DieConfig) {
  return {
    faceCount: config.faceCount,
    numberRange: [...config.numberRange],
    geometryType: config.geometryType,
    geometryArgs: config.geometryArgs ?? [],
    customVertices: config.customVertices ?? null,
    customFaces: config.customFaces ?? null,
    assign: config.assign ?? null,
    trianglesPerFace: config.trianglesPerFace,
    paired: !!config.paired,
  };
}

export function renderDicePool(_state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  const data = options?.data as Record<string, unknown> | undefined;
  const { groups: pool, omittedDice, originalTotal } = normalisePool(data?.pool);
  const label = typeof data?.label === 'string' && data.label.trim() ? data.label.trim() : 'Dice Pool';
  const modifier = Number.isFinite(Number(data?.modifier)) ? Number(data?.modifier) : 0;

  const logicalDice = pool.reduce((sum, group) => sum + group.count, 0);
  const cols = logicalDice <= 2 ? logicalDice : Math.min(4, Math.ceil(Math.sqrt(logicalDice)));
  const rows = Math.ceil(logicalDice / Math.max(cols, 1));
  const canvasW = Math.min(MAX_DICE_POOL_CANVAS_WIDTH, Math.max(440, cols * 220));
  const canvasH = Math.min(MAX_DICE_POOL_CANVAS_HEIGHT, Math.max(220, rows * 220));
  const displayW = Math.min(canvasW, MAX_DICE_POOL_CANVAS_WIDTH);
  const expression = pool.map(group => `${group.count}${group.dieType}`).join(' + ');
  const truncationNote = omittedDice > 0
    ? `Displaying ${logicalDice} of ${originalTotal} dice for stability.`
    : '';

  const uniqueTypes = [...new Set(pool.map(group => group.dieType))];
  const configMap = Object.fromEntries(uniqueTypes.map(dieType => {
    const config = DIE_CONFIGS[dieType];
    return [dieType, serialiseConfig(config)];
  }));
  const fontMap = Object.fromEntries(uniqueTypes.map(dieType => [dieType, FONT_SCALE[dieType] ?? FONT_SCALE.d20]));

  return wrapInShadowDom({
    styleName,
    inlineCss: `.widget-dice-pool { font-family: var(--ta-font-body); padding: 20px 16px; text-align: center; max-width: 920px; margin: 0 auto; }
.dice-pool-label { font-family: var(--ta-font-heading); font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--ta-color-accent); margin-bottom: 6px; }
.dice-pool-expression { font-size: 11px; color: var(--sta-text-tertiary, #545880); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 14px; }
.dice-pool-clickzone { width: min(100%, ${displayW}px); margin: 0 auto; cursor: pointer; }
.dice-pool-canvas-wrap { width: 100%; margin: 0 auto 10px; }
.dice-pool-canvas-wrap canvas { width: 100%; height: auto; display: block; }
.dice-pool-hint { font-size: 10px; color: var(--sta-text-tertiary, #545880); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; min-height: 1.4em; transition: opacity 0.3s; }
.dice-pool-hint.is-hidden { opacity: 0; }
.dice-pool-note { font-size: 10px; color: var(--sta-text-secondary, #9AA0C0); margin-bottom: 10px; }
.dice-pool-result { opacity: 0; transition: opacity 0.4s; max-width: 760px; margin: 0 auto; }
.dice-pool-result.is-visible { opacity: 1; }
.dice-pool-total { font-size: 42px; line-height: 1; font-weight: 700; color: var(--ta-color-accent); margin-bottom: 6px; }
.dice-pool-modifier { font-size: 13px; color: var(--sta-text-secondary, #9AA0C0); margin-bottom: 14px; }
.dice-pool-groups { display: grid; gap: 8px; }
.dice-pool-group { display: grid; grid-template-columns: minmax(72px, auto) 1fr; gap: 10px; align-items: baseline; justify-content: center; padding: 8px 12px; border: 1px solid rgba(128, 128, 128, 0.2); border: 1px solid color-mix(in srgb, var(--ta-color-accent) 20%, transparent); border-radius: 12px; background: rgba(42, 42, 58, 0.18); background: color-mix(in srgb, var(--ta-die-bg, #2a2a3a) 18%, transparent); }
.dice-pool-group-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--sta-text-tertiary, #545880); text-align: right; }
.dice-pool-group-values { font-size: 16px; font-weight: 700; color: var(--sta-text-primary, #EEF0FF); text-align: left; }
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0s !important; animation-duration: 0s !important; }
}`,
    html: `<div class="widget-dice-pool">
  <div class="dice-pool-label">${esc(label)}</div>
  <div class="dice-pool-expression">${esc(expression)}</div>
  <div class="dice-pool-clickzone" id="dice-pool-target">
    <div class="dice-pool-canvas-wrap">
      <canvas id="dice-pool-canvas" width="${canvasW}" height="${canvasH}" role="img" aria-label="${esc(label)}. Click to roll the dice pool."></canvas>
    </div>
  </div>
  <div class="dice-pool-hint" id="dice-pool-hint">CLICK THE POOL TO ROLL</div>
  ${truncationNote ? `<div class="dice-pool-note">${esc(truncationNote)}</div>` : ''}
  <div class="dice-pool-result" id="dice-pool-result">
    <div class="dice-pool-total" id="dice-pool-total"></div>
    <div class="dice-pool-modifier" id="dice-pool-modifier"></div>
    <div class="dice-pool-groups" id="dice-pool-groups"></div>
  </div>
</div>`,
    script: `var POOL_LABEL=${serialiseInlineScriptData(label)};
var POOL_GROUPS=${serialiseInlineScriptData(pool)};
var POOL_MODIFIER=${modifier};
var POOL_CONFIG_MAP=${serialiseInlineScriptData(configMap)};
var POOL_FONT_MAP=${serialiseInlineScriptData(fontMap)};
var POOL_MAX_DICE=${MAX_DICE_POOL_TOTAL};
${shadowAdaptPoolCode(WEBGL_DICE_POOL_CODE)}`,
  });
}
