// Pre-game settings panel — emits a <ta-settings> custom element.
// Accepts --data JSON with available options.
// The component self-renders cards for rulebook, difficulty, pacing,
// visual style, modules. Confirm button fires sendPrompt.

import type { GmState } from '../../types';
import { emitRootCustomElement } from '../lib/shadow-wrapper';

type SettingsData = {
  rulebooks?: string[] | undefined;
  difficulties?: string[] | undefined;
  pacingOptions?: string[] | undefined;
  visualStyles?: string[] | undefined;
  modules?: string[] | undefined;
  defaults?: Record<string, string> | undefined;
};

const DEFAULT_RULEBOOKS = ['d20_system', 'dnd_5e', 'gurps_lite', 'pf2e_lite', 'shadowrun_lite', 'narrative_engine', 'custom'];
const DEFAULT_DIFFICULTIES = ['easy', 'normal', 'hard', 'brutal'];
const DEFAULT_PACING = ['fast', 'normal', 'slow'];
const DEFAULT_STYLES = ['station', 'terminal', 'parchment', 'neon', 'brutalist', 'art-deco', 'ink-wash', 'blueprint', 'stained-glass', 'sveltekit', 'weathered', 'holographic'];
const TIER1_MODULES = ['gm-checklist', 'prose-craft', 'core-systems', 'die-rolls', 'character-creation', 'save-codex', 'arc-patterns'];
const DEFAULT_MODULES = [...TIER1_MODULES, 'bestiary', 'story-architect', 'ship-systems', 'crew-manifest', 'star-chart', 'geo-map', 'procedural-world-gen', 'world-history', 'lore-codex', 'rpg-systems', 'ai-npc', 'atmosphere', 'audio', 'adventure-exporting', 'pre-generated-characters', 'genre-mechanics', 'scenarios', 'adventure-authoring'];

export function renderSettings(_state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  const raw = (options?.data ?? {}) as Record<string, unknown>;

  const toStringArray = (v: unknown): string[] | undefined => {
    if (!Array.isArray(v)) return undefined;
    return v.map((el: unknown) => {
      if (typeof el === 'string') return el;
      if (el && typeof el === 'object' && 'id' in el && typeof (el as Record<string, unknown>).id === 'string') return (el as Record<string, unknown>).id as string;
      if (el && typeof el === 'object' && 'label' in el && typeof (el as Record<string, unknown>).label === 'string') return (el as Record<string, unknown>).label as string;
      if (el && typeof el === 'object' && 'name' in el && typeof (el as Record<string, unknown>).name === 'string') return (el as Record<string, unknown>).name as string;
      return String(el);
    });
  };

  const data: SettingsData = {
    rulebooks: toStringArray(raw.rulebooks ?? raw.rules),
    difficulties: toStringArray(raw.difficulties ?? raw.difficulty),
    pacingOptions: toStringArray(raw.pacingOptions ?? raw.pacing),
    visualStyles: toStringArray(raw.visualStyles ?? raw.styles),
    modules: toStringArray(raw.modules ?? raw.activeModules),
    defaults: (raw.defaults !== null && typeof raw.defaults === 'object' && !Array.isArray(raw.defaults))
      ? raw.defaults as Record<string, string>
      : {},
  };

  const merge = (provided: string[] | undefined, defaults: string[]): string[] => {
    if (!provided) return defaults;
    const seen = new Set(provided);
    return [...provided, ...defaults.filter(d => !seen.has(d))];
  };

  const config = {
    rulebooks: merge(data.rulebooks, DEFAULT_RULEBOOKS),
    difficulties: merge(data.difficulties, DEFAULT_DIFFICULTIES),
    pacingOptions: merge(data.pacingOptions, DEFAULT_PACING),
    visualStyles: merge(data.visualStyles, DEFAULT_STYLES),
    modules: merge(data.modules, DEFAULT_MODULES),
    tier1Modules: TIER1_MODULES,
    defaults: data.defaults ?? {},
  };

  const cssUrls = [styleName, 'common-widget', 'pregame-design'].filter(Boolean);

  return emitRootCustomElement({
    tag: 'ta-settings',
    attrs: {
      'data-config': JSON.stringify(config),
      'data-style': styleName,
    },
    cssUrls,
    jsUrls: ['ta-components'],
  });
}
