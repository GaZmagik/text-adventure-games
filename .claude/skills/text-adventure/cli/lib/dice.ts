export interface DiceNotation {
  count: number;
  sides: number;
  modifier: number;
}

export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export function rollDice(count: number, sides: number, modifier: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total + modifier;
}

export function parseDice(notation: string): DiceNotation | null {
  const match = notation.match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!match) return null;
  return {
    count: match[1] ? parseInt(match[1], 10) : 1,
    sides: parseInt(match[2], 10),
    modifier: match[3] ? parseInt(match[3], 10) : 0,
  };
}
