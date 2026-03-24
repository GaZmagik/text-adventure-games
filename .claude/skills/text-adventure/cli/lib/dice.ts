import { MAX_DICE_COUNT } from './constants';

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollD4(): number { return rollDie(4); }
export function rollD6(): number { return rollDie(6); }
export function rollD8(): number { return rollDie(8); }
export function rollD10(): number { return rollDie(10); }
export function rollD12(): number { return rollDie(12); }
export function rollD20(): number { return rollDie(20); }
export function rollD100(): number { return (rollDie(10) - 1) * 10 + rollDie(10); }

export function rollDice(count: number, sides: number, modifier: number): number {
  const safeCt = Math.min(Math.max(0, count), MAX_DICE_COUNT);
  let total = 0;
  for (let i = 0; i < safeCt; i++) {
    total += rollDie(sides);
  }
  return total + modifier;
}
