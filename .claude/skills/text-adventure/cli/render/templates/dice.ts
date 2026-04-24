import type { GmState, DieType } from '../../types';
import { DIE_CONFIGS, type DieConfig } from '../lib/die-geometries';
import { FONT_SCALE } from '../lib/die-textures';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

const VALID_DIE_TYPES = new Set<DieType>(Object.keys(DIE_CONFIGS) as DieType[]);

function isDieType(value: string): value is DieType {
  return VALID_DIE_TYPES.has(value as DieType);
}

function dieConfigFor(dieType: DieType): DieConfig {
  return DIE_CONFIGS[dieType] as DieConfig;
}

/**
 * Renders the interactive 3D dice widget.
 *
 * @param {GmState | null} state - Current game state (used to extract the last roll).
 * @param {string} styleName - Visual style.
 * @param {Record<string, unknown>} [options] - Configuration data (used for manual overrides).
 * @returns {string} - The HTML wrapped in a <ta-dice> custom element.
 *
 * @remarks
 * This widget provides a high-fidelity 3D dice roll experience.
 * It automatically attempts to resolve the roll context (stat, modifier, DC)
 * from the most recent computation in `state._lastComputation`.
 *
 * The `data-config` attribute contains the full geometry and texture
 * mapping required by the WebGL renderer in `ta-components.js`.
 */
export function renderDice(state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  const comp = state?._lastComputation;
  const data = options?.data as Record<string, unknown> | undefined;
  const rollComp = comp && comp.type !== 'levelup_result' ? comp : undefined;
  const statComp =
    rollComp && (rollComp.type === 'contested_roll' || rollComp.type === 'hazard_save') ? rollComp : undefined;

  const rawDieType = (data?.dieType as string) ?? rollComp?.dieType ?? 'd20';
  const dieType = isDieType(rawDieType) ? rawDieType : 'd20';
  const stat =
    (data?.stat as string) ??
    (data?.attribute as string) ??
    (data?.checkLabel as string) ??
    (statComp ? statComp.stat : rollComp?.stat) ??
    '???';
  const modifier = Number.isFinite(Number(data?.modifier ?? rollComp?.modifier))
    ? Number(data?.modifier ?? rollComp?.modifier)
    : 0;
  const rawDc = data?.dc ?? (statComp ? statComp.dc : undefined);
  const dc = rawDc !== undefined ? (Number.isFinite(Number(rawDc)) ? Number(rawDc) : undefined) : undefined;

  const config = dieConfigFor(dieType);
  const fontScale = FONT_SCALE[dieType] ?? FONT_SCALE.d20;
  const range = config.numberRange;
  const labels = config.assign
    ? config.assign.map(String)
    : Array.from({ length: config.faceCount }, (_, i) => String(range[0] + i));

  const diceConfig = {
    dieType,
    stat,
    modifier,
    dc,
    verts: config.customVertices ?? [],
    faces: config.customFaces ?? [],
    faceCount: config.faceCount,
    tpf: config.trianglesPerFace,
    labels,
    fontScale,
    mirror: config.trianglesPerFace === 1 || config.trianglesPerFace === 3,
    offY: config.trianglesPerFace === 1 ? -Math.round(0.12 * 128) : 0,
    assign: config.assign,
    numberRange: range,
  };

  return emitStandaloneCustomElement({
    tag: 'ta-dice',
    styleName,
    attrs: { 'data-config': JSON.stringify(diceConfig) },
  });
}
