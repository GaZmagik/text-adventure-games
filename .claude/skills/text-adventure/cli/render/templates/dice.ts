import type { GmState, DieType } from '../../types';
import { esc } from '../../lib/html';
import { DIE_CONFIGS } from '../lib/die-geometries';
import { FONT_SCALE } from '../lib/die-textures';

const VALID_DIE_TYPES = new Set(Object.keys(DIE_CONFIGS));

export function renderDice(state: GmState | null, _styleName: string, options?: Record<string, unknown>): string {
  const comp = state?._lastComputation;
  const data = options?.data as Record<string, unknown> | undefined;
  const rollComp = comp && comp.type !== 'levelup_result' ? comp : undefined;
  const statComp = rollComp && (rollComp.type === 'contested_roll' || rollComp.type === 'hazard_save') ? rollComp : undefined;

  const rawDieType = (data?.dieType as string) ?? rollComp?.dieType ?? 'd20';
  const dieType = VALID_DIE_TYPES.has(rawDieType) ? rawDieType : 'd20';
  const stat = (data?.stat as string) ?? (data?.attribute as string) ?? (data?.checkLabel as string) ?? (statComp ? statComp.stat : rollComp?.stat) ?? '???';
  const modifier = Number.isFinite(Number(data?.modifier ?? rollComp?.modifier)) ? Number(data?.modifier ?? rollComp?.modifier) : 0;
  const rawDc = data?.dc ?? (statComp ? statComp.dc : undefined);
  const dc = rawDc !== undefined ? (Number.isFinite(Number(rawDc)) ? Number(rawDc) : undefined) : undefined;

  const config = DIE_CONFIGS[dieType as keyof typeof DIE_CONFIGS] ?? DIE_CONFIGS.d20;
  const cfg = config as any;
  const fontScale = FONT_SCALE[dieType as DieType] ?? FONT_SCALE.d20;
  const range = config.numberRange;
  const labels = cfg.assign
    ? cfg.assign.map(String)
    : Array.from({ length: config.faceCount }, (_, i) => String(range[0] + i));

  const diceConfig = {
    dieType,
    stat,
    modifier,
    dc,
    verts: cfg.customVertices ?? [],
    faces: cfg.customFaces ?? [],
    faceCount: config.faceCount,
    tpf: config.trianglesPerFace,
    labels,
    fontScale,
    mirror: config.trianglesPerFace === 1 || config.trianglesPerFace === 3,
    offY: config.trianglesPerFace === 1 ? -Math.round(0.12 * 128) : 0,
    assign: cfg.assign,
    numberRange: range,
  };

  return `<ta-dice data-config="${esc(JSON.stringify(diceConfig))}"></ta-dice>`;
}
