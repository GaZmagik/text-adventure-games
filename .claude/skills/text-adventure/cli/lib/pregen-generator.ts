// tag CLI — Pre-Generated Character Generator
// Deterministic generation of three distinct ready-made characters from theme/seed.

import type { PreGeneratedCharacter } from '../types';

export type PregenInput = {
  theme: string;
  tone?: string;
  rulebook?: string;
  seed?: string | undefined;
  scenarioHook?: string;
};

// ── Seeded RNG ──────────────────────────────────────────────────────

function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function createRng(seed: string): () => number {
  let state = hashString(seed);
  return () => {
    state |= 0;
    state = state + 0x6D2B79F5 | 0;
    const t = Math.imul(state ^ (state >>> 15), 1 | state);
    const u = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((u ^ (u >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function shuffled<T>(arr: readonly T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

// ── Archetype Data ──────────────────────────────────────────────────

type ArchetypeTemplate = {
  id: string;
  role: 'physical' | 'technical' | 'social';
  stats: Record<string, number>;
  hp: number; ac: number;
  proficiencies: string[];
  weapon: string; armour: string; consumable: string;
};

const ARCHETYPES: ArchetypeTemplate[] = [
  { id: 'soldier', role: 'physical',
    stats: { STR: 16, DEX: 10, CON: 14, INT: 10, WIS: 10, CHA: 10 },
    hp: 12, ac: 14, proficiencies: ['Athletics', 'Intimidation'],
    weapon: 'Combat knife (1d6+STR)', armour: 'Light armour (+2 AC)', consumable: 'Stim pack (restore 1d6 HP)' },
  { id: 'scout', role: 'physical',
    stats: { STR: 10, DEX: 16, CON: 10, INT: 10, WIS: 14, CHA: 10 },
    hp: 9, ac: 13, proficiencies: ['Stealth', 'Perception'],
    weapon: 'Short bow (1d6+DEX)', armour: "Scout's cloak (+1 Stealth)", consumable: 'Ration pack (3 uses)' },
  { id: 'engineer', role: 'technical',
    stats: { STR: 10, DEX: 12, CON: 10, INT: 16, WIS: 10, CHA: 10 },
    hp: 8, ac: 12, proficiencies: ['Investigation', 'Repair'],
    weapon: 'Wrench (1d4+STR)', armour: 'Repair kit (3 uses)', consumable: 'EMP charge (1 use)' },
  { id: 'medic', role: 'technical',
    stats: { STR: 10, DEX: 10, CON: 10, INT: 14, WIS: 16, CHA: 10 },
    hp: 9, ac: 11, proficiencies: ['Medicine', 'Insight'],
    weapon: 'Scalpel (1d4+DEX)', armour: 'Medical bag (5 uses)', consumable: 'Antitoxin (2 uses)' },
  { id: 'diplomat', role: 'social',
    stats: { STR: 10, DEX: 10, CON: 10, INT: 14, WIS: 10, CHA: 16 },
    hp: 8, ac: 11, proficiencies: ['Persuasion', 'Deception'],
    weapon: 'Hidden blade (1d4+DEX)', armour: 'Fine clothes (+1 CHA checks)', consumable: 'Sealed letter (key item)' },
  { id: 'smuggler', role: 'social',
    stats: { STR: 10, DEX: 16, CON: 10, INT: 10, WIS: 10, CHA: 14 },
    hp: 10, ac: 13, proficiencies: ['Sleight of Hand', 'Streetwise'],
    weapon: 'Holdout pistol (1d6+DEX)', armour: 'Concealed holster', consumable: 'Lockpick set (5 uses)' },
];

// ── Theme Adaptation ────────────────────────────────────────────────

// Index order: [soldier, scout, engineer, medic, diplomat, smuggler]
const THEME_CLASSES: Record<string, string[]> = {
  'sci-fi':           ['Security Officer', 'Recon Specialist', 'Systems Tech', 'Field Medic', 'Liaison Officer', 'Runner'],
  'fantasy':          ['Knight', 'Ranger', 'Artificer', 'Herbalist', 'Bard', 'Rogue'],
  'historical':       ['Man-at-Arms', 'Outrider', 'Siege Engineer', 'Wise Woman', 'Envoy', 'Highwayman'],
  'post-apocalyptic': ['Enforcer', 'Stalker', 'Mechanic', 'Doc', 'Trader', 'Scavenger'],
  'cyberpunk':        ['Street Samurai', 'Netrunner', 'Rigger', 'Street Doc', 'Fixer', 'Ghost Runner'],
  'steampunk':        ['Dragoon', 'Saboteur', 'Mechanist', 'Apothecary', 'Parliamentarian', 'Privateer'],
  'wuxia':            ['Sword Saint', 'Shadow', 'Craftsman', 'Physician', 'Wandering Monk', 'Shadow Broker'],
  'isekai':           ['Berserker', 'Trickster', 'Builder', 'Healer', 'Mediator', 'Fence'],
  'superhero':        ['Brawler', 'Vigilante', 'Gadgeteer', 'First Responder', 'Public Figure', 'Antihero'],
  'survival':         ['Guardian', 'Pathfinder', 'Improviser', 'Field Medic', 'Peacemaker', 'Scrounger'],
  'political':        ['Duelist', 'Informant', 'Quartermaster', 'Court Physician', 'Courtier', 'Broker'],
};

const NAME_POOLS: Record<string, string[]> = {
  'sci-fi': [
    'Kael Voss', 'Nyx Chen', 'Orion Patel', 'Zara Webb', 'Dex Moreno', 'Lyra Okafor',
    'Cass Dubois', 'Renn Takashi', 'Mira Koslov', 'Jace Adler', 'Suri Navarro', 'Thane Bishop',
  ],
  'fantasy': [
    'Aldric Thornwood', 'Lyra Moonwhisper', 'Gareth Ironhold', 'Seraphina Vale', 'Rowan Ashford', 'Elara Duskmantle',
    'Bran Hearthstone', 'Isadora Windhelm', 'Cedric Hollowmere', 'Miri Brightwater', 'Theron Blackthorn', 'Wren Silverbough',
  ],
  'historical': [
    'Marcus Aurelius', 'Helena of Tyre', 'Aelred the Steady', 'Matilda Beaufort', 'Godwin Ealdorman', 'Eleanor de Clare',
    'Tomas the Red', 'Agnes Blackwell', 'Hugh Mortimer', 'Ysabel of Castile', 'Wulfric Ironside', 'Beatrice Fawley',
  ],
  'default': [
    'Alex Morgan', 'Sam Rivera', 'Jordan Blake', 'Casey Hartwell', 'Quinn Ashworth', 'Riley Chen',
    'Avery Dunn', 'Taylor Knox', 'Morgan Frost', 'Jamie Vance', 'Drew Callister', 'Reese Tanaka',
  ],
};

function resolveNamePool(theme: string): string[] {
  if (theme in NAME_POOLS) return NAME_POOLS[theme]!;
  if (['cyberpunk', 'superhero'].includes(theme)) return NAME_POOLS['sci-fi']!;
  if (['steampunk', 'historical', 'political'].includes(theme)) return NAME_POOLS['historical']!;
  if (['wuxia', 'isekai'].includes(theme)) return NAME_POOLS['fantasy']!;
  return NAME_POOLS['default']!;
}

// ── Hooks ───────────────────────────────────────────────────────────

const HOOKS: Record<string, string[]> = {
  physical: [
    'Carries scars from a battle they refuse to discuss.',
    'Keeps a tally of debts owed — and debts paid.',
    'Was on the losing side of the last conflict.',
    'Promised someone they would come back alive.',
  ],
  technical: [
    'Keeps a journal of things that should not have worked but did.',
    'Once fixed something that was never supposed to break.',
    'Asks too many questions about things others want to forget.',
    'Built something dangerous and hid it where no one would look.',
  ],
  social: [
    'Knows a secret that could ruin three powerful people.',
    'Has never lost a negotiation, but the last one cost them a friend.',
    'Speaks five languages and lies fluently in all of them.',
    'Carries a letter of introduction from someone who is now dead.',
  ],
};

// ── Triples (one physical, one technical, one social) ───────────────

const TRIPLES: [number, number, number][] = [
  [0, 2, 4], [1, 3, 4], [0, 3, 5], [1, 2, 5],
  [0, 2, 5], [1, 3, 5], [0, 3, 4], [1, 2, 4],
];

const PRONOUN_POOL = ['she/her', 'he/him', 'they/them'] as const;

// ── Generator ───────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generatePregenCharacters(input: PregenInput): PreGeneratedCharacter[] {
  const seed = `${input.seed ?? 'default'}:${input.theme}`;
  const rng = createRng(seed);

  const tripleIdx = Math.floor(rng() * TRIPLES.length);
  const triple = TRIPLES[tripleIdx]!;

  const theme = input.theme.toLowerCase();
  const classNames = THEME_CLASSES[theme] ?? null;
  const namePool = resolveNamePool(theme);
  const names = shuffled(namePool, rng).slice(0, 3);
  const pronouns = shuffled(PRONOUN_POOL, rng);

  const usedHooks = new Set<string>();

  return triple.map((arcIdx, i) => {
    const arch = ARCHETYPES[arcIdx]!;
    const className = classNames ? classNames[arcIdx]! : capitalize(arch.id);

    const hookPool = HOOKS[arch.role]!;
    let hook = pick(hookPool, rng);
    let attempts = 0;
    while (usedHooks.has(hook) && attempts < hookPool.length * 2) {
      hook = pick(hookPool, rng);
      attempts++;
    }
    usedHooks.add(hook);

    return {
      name: names[i]!,
      class: className,
      pronouns: pronouns[i % pronouns.length]!,
      hook,
      stats: { ...arch.stats },
      hp: arch.hp,
      ac: arch.ac,
      proficiencies: [...arch.proficiencies],
      startingInventory: [
        { name: arch.weapon },
        { name: arch.armour },
        { name: arch.consumable },
      ],
    };
  });
}
