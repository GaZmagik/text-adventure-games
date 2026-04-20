import type { GmState, DieType } from '../../types';
import { esc } from '../../lib/html';
import { DIE_CONFIGS } from '../lib/die-geometries';
import { FONT_SCALE } from '../lib/die-textures';
import { wrapInShadowDom } from '../lib/shadow-wrapper';

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

function serialiseConfig(config: any) {
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

  const config = {
    label,
    expression,
    canvasW,
    canvasH,
    displayW,
    modifier,
    pool,
    configMap,
    fontMap,
    maxDice: MAX_DICE_POOL_TOTAL,
    truncationNote
  };

  const html = `<ta-dice-pool data-config="${esc(JSON.stringify(config))}"></ta-dice-pool>`;

  if (!styleName) return html;
  return wrapInShadowDom({ styleName, html });
}
