// Name pool loader — reads names.md and exports themed name arrays.
// The .md file is the source of truth; this module just parses it.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type NamePool = {
  realWorldGiven: string[];
  realWorldSurname: string[];
  sciFiGiven: string[];
  sciFiSurname: string[];
  getRandomName: (theme: string) => string;
};

const SECTION_MAP: Record<string, keyof Omit<NamePool, 'getRandomName'>> = {
  'real-world given': 'realWorldGiven',
  'real-world surname': 'realWorldSurname',
  'sci-fi given': 'sciFiGiven',
  'sci-fi surname': 'sciFiSurname',
};

function parseNamesMd(raw: string): Omit<NamePool, 'getRandomName'> {
  const result: Record<string, string[]> = {
    realWorldGiven: [],
    realWorldSurname: [],
    sciFiGiven: [],
    sciFiSurname: [],
  };

  let currentSection: string | null = null;

  for (const line of raw.split('\n')) {
    const h2 = line.match(/^## (.+)/);
    if (h2) {
      const key = SECTION_MAP[h2[1]!.trim().toLowerCase()];
      currentSection = key ?? null;
      continue;
    }
    if (line.startsWith('#')) {
      currentSection = null;
      continue;
    }
    const trimmed = line.trim();
    if (trimmed && currentSection) {
      result[currentSection]!.push(trimmed);
    }
  }

  return result as Omit<NamePool, 'getRandomName'>;
}

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export const SCI_FI_THEMES = new Set([
  'sci-fi',
  'space',
  'cyberpunk',
  'post-apocalyptic',
  'station',
  'terminal',
  'neon',
  'holographic',
  'blueprint',
]);

let cachedNames: NamePool | null = null;

export function loadNames(): NamePool {
  if (cachedNames) return cachedNames;

  const mdPath = join(import.meta.dir, 'names.md');
  const raw = readFileSync(mdPath, 'utf-8');
  const pools = parseNamesMd(raw);

  function getRandomName(theme: string): string {
    const useSciFi = SCI_FI_THEMES.has(theme.toLowerCase());
    const given = useSciFi ? pools.sciFiGiven : pools.realWorldGiven;
    const surname = useSciFi ? pools.sciFiSurname : pools.realWorldSurname;
    return `${pick(given)} ${pick(surname)}`;
  }

  cachedNames = { ...pools, getRandomName };
  return cachedNames;
}
