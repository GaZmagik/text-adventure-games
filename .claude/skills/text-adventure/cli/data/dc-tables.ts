// DC tables from modules/die-rolls.md

type BaseDcDifficulty = 'Trivial' | 'Easy' | 'Moderate' | 'Hard' | 'Very Hard' | 'Near-impossible';

export const BASE_DC: Record<BaseDcDifficulty, number> = {
  'Trivial': 5,
  'Easy': 8,
  'Moderate': 12,
  'Hard': 16,
  'Very Hard': 20,
  'Near-impossible': 25,
};

type LevelDcRow = {
  levelRange: string;
  minLevel: number;
  maxLevel: number;
  easy: number;
  moderate: number;
  hard: number;
  extreme: number;
};

// From die-rolls.md § DC by Player Level
export const DC_BY_LEVEL: LevelDcRow[] = [
  { levelRange: '1-2',  minLevel: 1, maxLevel: 2,  easy: 8,  moderate: 10, hard: 13, extreme: 16 },
  { levelRange: '3-4',  minLevel: 3, maxLevel: 4,  easy: 9,  moderate: 12, hard: 15, extreme: 18 },
  { levelRange: '5-6',  minLevel: 5, maxLevel: 6,  easy: 10, moderate: 13, hard: 16, extreme: 19 },
  { levelRange: '7-8',  minLevel: 7, maxLevel: 8,  easy: 11, moderate: 14, hard: 17, extreme: 20 },
  { levelRange: '9-10', minLevel: 9, maxLevel: 10, easy: 12, moderate: 15, hard: 18, extreme: 22 },
];

type DcDifficulty = 'easy' | 'moderate' | 'hard' | 'extreme';
type GameDifficulty = 'easy' | 'normal' | 'hard' | 'brutal';

// From die-rolls.md § Difficulty Setting Modifiers
export const DIFFICULTY_MODIFIERS: Record<GameDifficulty, number> = {
  easy: -2,
  normal: 0,
  hard: 2,
  brutal: 4,
};

export function getDcForLevel(
  level: number,
  difficulty: DcDifficulty,
  gameDifficulty?: GameDifficulty,
): number {
  const clamped = Math.max(1, Math.min(level, 10));
  const row = DC_BY_LEVEL.find(r => clamped >= r.minLevel && clamped <= r.maxLevel)
    ?? DC_BY_LEVEL[DC_BY_LEVEL.length - 1]!;
  const baseDc = row[difficulty];
  const mod = gameDifficulty ? DIFFICULTY_MODIFIERS[gameDifficulty] : 0;
  return baseDc + mod;
}
