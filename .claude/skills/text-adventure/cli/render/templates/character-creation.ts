// Character creation widget — emits a <ta-character-creation> custom element.
// Accepts --data JSON with preGeneratedCharacters[], archetypes[], proficiencies[].
// The component self-renders the multi-step form and event wiring.

import type { GmState } from '../../types';
import { emitRootCustomElement } from '../lib/shadow-wrapper';

type Archetype = {
  name: string;
  description?: string;
  flavour?: string;
  stats?: Record<string, number>;
  baseStats?: Record<string, number>;
  abilities?: string[];
  equipment?: string[];
  primaryStats?: string[];
  fixedProficiencies?: string[];
  hp?: number;
  ac?: number;
  id?: string;
};

type PreGeneratedCharacter = {
  name: string;
  class?: string;
  hook?: string;
  background?: string;
  pronouns?: string;
  stats?: Record<string, number>;
  proficiencies?: string[];
  abilities?: string[];
  equipment?: unknown[];
  startingInventory?: unknown[];
  startingCurrency?: number;
  currency?: number;
  hp?: number;
  ac?: number;
  id?: string;
  openingLens?: string;
  prologueVariant?: string;
};

export function renderCharacterCreation(_state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  const raw = (options?.data ?? {}) as Record<string, unknown>;
  const archetypes: Archetype[] = Array.isArray(raw.archetypes) ? raw.archetypes as Archetype[] : [];
  const preGeneratedCharacters: PreGeneratedCharacter[] = Array.isArray(raw.preGeneratedCharacters)
    ? raw.preGeneratedCharacters as PreGeneratedCharacter[]
    : [];
  const allowCustom = raw.allowCustom !== false;
  const proficiencies = Array.isArray(raw.proficiencies)
    ? (raw.proficiencies as unknown[]).map(p => {
        if (typeof p === 'string') return p;
        const obj = p as Record<string, unknown>;
        const name = String(obj.name ?? '');
        const attr = obj.attr ? ` (${obj.attr})` : '';
        return name + attr;
      })
    : ['Athletics', 'Acrobatics', 'Stealth', 'Arcana', 'History', 'Investigation', 'Nature', 'Religion', 'Perception', 'Insight', 'Persuasion', 'Deception', 'Intimidation', 'Performance', 'Survival', 'Medicine', 'Animal Handling', 'Sleight of Hand'];
  const defaultName = typeof raw.defaultName === 'string' ? raw.defaultName : '';

  const namePoolRaw = (options?.namePool ?? {}) as Record<string, unknown>;
  const givenNames: string[] = Array.isArray(namePoolRaw.given) ? namePoolRaw.given as string[] : [];
  const surnames: string[] = Array.isArray(namePoolRaw.surname) ? namePoolRaw.surname as string[] : [];

  const config = {
    archetypes,
    preGeneratedCharacters,
    allowCustom,
    proficiencies,
    defaultName,
    namePool: { given: givenNames, surname: surnames },
  };

  const cssUrls = [styleName, 'common-widget', 'pregame-design'].filter(Boolean);

  return emitRootCustomElement({
    tag: 'ta-character-creation',
    attrs: {
      'data-config': JSON.stringify(config),
      'data-style': styleName,
    },
    cssUrls,
    jsUrls: ['ta-components'],
  });
}
