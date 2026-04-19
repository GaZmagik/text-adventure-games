// Shared prose guidance constants — used by help.ts and sync.ts
// These deliver the actual rules inline so the GM gets them whether it reads modules or not.

/** The 11-item prose checklist from modules/prose-craft.md. */
export const PROSE_CHECKLIST: readonly string[] = [
  'Second person, present tense throughout — no slips to past tense or third person.',
  'Atmosphere first, then detail, then interactables — lead with sensory grounding.',
  'At least one non-visual sense per scene (sound, smell, temperature, texture, taste).',
  'No mechanical terms in narrative prose — "Your hands are steady" not "Your DEX of 16".',
  'At least one detail implying history or lived-in world — scratches, wear, repurposed objects.',
  'Exits stated without suggesting which to take — no editorial guidance.',
  'Vary sentence length — mix short punchy sentences with longer flowing ones.',
  'Specific nouns over vague ones — "the rusted bulkhead" not "the wall".',
  'Active voice — "The alarm shrieks" not "The alarm is shrieking".',
  'No cliches or stock phrases — "a chill runs down your spine" is banned.',
  'Every paragraph earns its place — cut any sentence that adds nothing new.',
];

/** Key rendering rules the GM must follow every turn. */
export const RENDERING_RULES: readonly string[] = [
  'ALL output inside visualize:show_widget — zero text in conversation.',
  'ALL widgets rendered via tag render — never hand-code HTML, CSS, or JS.',
  'Do NOT modify the html from tag render — it contains Shadow DOM, CDN CSS, JS, accessibility, light/dark mode, and soundscape.',
  'Do NOT trim, strip, or selectively include CSS — the full output is mechanically sized to fit.',
  'Do NOT hand-write CSS from memory — use tag render output which loads styles from CDN.',
];

/** Scene widget structural requirements. */
export const SCENE_STRUCTURE: readonly string[] = [
  'Location bar: location name + scene number',
  'Atmosphere strip: 3 sensory pills (at least one non-visual)',
  'Narrative block: second person, present tense',
  'Points of interest: 2-3 examine buttons via sendPrompt',
  'Action buttons: 2-5 choices via sendPrompt, no right/wrong labels',
  'Status bar: HP pips, XP progress, inventory tags, active conditions',
  'Footer: panel toggle buttons (pure JS) + module-specific buttons',
  'Scene metadata: hidden #scene-meta div with JSON scene data',
];

/** Density guidance — how many paragraphs per scene type. */
export const DENSITY_GUIDANCE = {
  actOpener: '6-10 paragraphs. Short story density. World-building, character establishment, sensory grounding, NPC introduction, tension, hook.',
  standard: '2-4 paragraphs. One sensory beat, one plot beat, one choice.',
  transition: '1-2 paragraphs. Brief and purposeful.',
} as const;
