import type { GmState, DieType } from '../../types';
import { DIE_CONFIGS, type DieConfig } from '../lib/die-geometries';
import { FONT_SCALE } from '../lib/die-textures';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

/** A group of identical dice in a pool. */
type PoolGroup = {
  dieType: DieType;
  count: number;
};

const VALID_DIE_TYPES = new Set<DieType>(Object.keys(DIE_CONFIGS) as DieType[]);
/** Maximum number of physical dice allowed in a single WebGL rendering context. */
export const MAX_DICE_POOL_TOTAL = 24;
const MAX_DICE_POOL_CANVAS_WIDTH = 900;
export const MAX_DICE_POOL_CANVAS_HEIGHT = 1320;

function isDieType(value: string): value is DieType {
  return VALID_DIE_TYPES.has(value as DieType);
}

function dieConfigFor(dieType: DieType): DieConfig {
  return DIE_CONFIGS[dieType] as DieConfig;
}

/** Clamps a die count to the valid range [1, 24]. */
function clampCount(value: unknown): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 24);
}

/**
 * Caps the total number of dice in a pool to prevent WebGL context exhaustion or
 * performance degradation.
 */
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

/**
 * Normalises raw input into a validated Dice Pool structure.
 */
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
    if (!isDieType(rawDieType)) continue;
    groups.push({ dieType: rawDieType, count: clampCount(rec.count) });
  }
  if (!groups.length) {
    return { groups: [{ dieType: 'd6', count: 2 }], omittedDice: 0, originalTotal: 2 };
  }
  return capPool(groups);
}

/** Prepares a die geometry configuration for JSON serialisation. */
function serialiseConfig(config: DieConfig): {
  faceCount: number;
  numberRange: [number, number];
  geometryType: string;
  geometryArgs: number[];
  customVertices: number[][] | null;
  customFaces: number[][] | null;
  assign: number[] | null;
  trianglesPerFace: number;
  paired: boolean;
} {
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

/**
 * Renders a multi-die pool widget.
 *
 * @param {GmState | null} _state - Current game state (unused).
 * @param {string} styleName - Visual style.
 * @param {Record<string, unknown>} [options] - Pool configuration (groups, modifier, label).
 * @returns {string} - The HTML wrapped in a <ta-dice-pool> custom element.
 *
 * @remarks
 * This is the most complex dice widget, supporting up to 24 simultaneous
 * WebGL-rendered dice across multiple types (d4, d6, d8, d10, d12, d20).
 * It automatically truncates the pool if it exceeds the `MAX_DICE_POOL_TOTAL`
 * for stability.
 */
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
  const truncationNote = omittedDice > 0 ? `Displaying ${logicalDice} of ${originalTotal} dice for stability.` : '';

  const uniqueTypes = [...new Set(pool.map(group => group.dieType))];
  const configMap = Object.fromEntries(
    uniqueTypes.map(dieType => {
      const config = dieConfigFor(dieType);
      return [dieType, serialiseConfig(config)];
    }),
  );
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
    truncationNote,
  };

  return emitStandaloneCustomElement({
    tag: 'ta-dice-pool',
    styleName,
    attrs: { 'data-config': JSON.stringify(config) },
  });
}
