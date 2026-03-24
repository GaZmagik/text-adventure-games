// Game rules quick-reference data for `tag rules` command.
// File/line references point to the authoritative source for each rule.

export interface Rule {
  id: number;
  category: Category;
  rule: string;
  ref: string;
}

export const CATEGORIES = ['output', 'agency', 'cli', 'prose', 'technical'] as const;
export type Category = typeof CATEGORIES[number];

export const RULES: Rule[] = [
  // ── OUTPUT ──────────────────────────────────────────────────────────
  {
    id: 1,
    category: 'output',
    rule: 'All game output MUST be inside visualize:show_widget — never plain text in the conversation',
    ref: 'SKILL.md:188, gm-checklist.md:24',
  },
  {
    id: 2,
    category: 'output',
    rule: 'Use the thinking tool for all internal deliberation (loading modules, planning scenes, reading files) — the player sees only widgets',
    ref: 'SKILL.md:13',
  },
  {
    id: 3,
    category: 'output',
    rule: 'All widgets MUST be rendered via tag render — never hand-code HTML, CSS, or JS',
    ref: 'SKILL.md:36, SKILL.md:195',
  },
  {
    id: 4,
    category: 'output',
    rule: 'Every scene widget must use progressive reveal (brief text + continue button before full content)',
    ref: 'SKILL.md:194',
  },

  // ── PLAYER AGENCY ──────────────────────────────────────────────────
  {
    id: 5,
    category: 'agency',
    rule: 'Never auto-resolve player decisions — present choices and wait for input',
    ref: 'SKILL.md:189, gm-checklist.md:30',
  },
  {
    id: 6,
    category: 'agency',
    rule: 'Never advance the story without player input — every scene ends with a choice, roll, or action prompt',
    ref: 'SKILL.md:190',
  },
  {
    id: 7,
    category: 'agency',
    rule: 'Never editorially guide the player — no "safe", "risky", or "recommended" labels on choices',
    ref: 'SKILL.md:193',
  },
  {
    id: 8,
    category: 'agency',
    rule: 'Never reveal the DC before a roll — the player commits first, then learns the difficulty',
    ref: 'gm-checklist.md:33',
  },
  {
    id: 9,
    category: 'agency',
    rule: 'Never reveal which attribute a check tests before commitment — "Speak to the guard" not "Persuade (CHA)"',
    ref: 'gm-checklist.md:36',
  },
  {
    id: 10,
    category: 'agency',
    rule: 'The player clicks the die — never auto-roll, never skip the animation',
    ref: 'gm-checklist.md:39',
  },

  // ── CLI ─────────────────────────────────────────────────────────────
  {
    id: 11,
    category: 'cli',
    rule: 'Use tag state create-npc for all NPCs — never invent stats or modifiers manually',
    ref: 'SKILL.md:36, modules/ai-npc.md § CLI Commands',
  },
  {
    id: 12,
    category: 'cli',
    rule: 'Use tag compute contest for hidden contested rolls — never improvise NPC roll results',
    ref: 'SKILL.md:36, modules/die-rolls.md § CLI Commands for This Module',
  },
  {
    id: 13,
    category: 'cli',
    rule: 'Use tag save generate for saves — never hand-build save payloads',
    ref: 'SKILL.md:36, modules/save-codex.md § CLI Commands for This Module',
  },
  {
    id: 14,
    category: 'cli',
    rule: 'Sync state after every scene — tag state set for HP, XP, factions, worldFlags, scene number, currentRoom',
    ref: 'gm-checklist.md:200',
  },

  // ── PROSE ───────────────────────────────────────────────────────────
  {
    id: 15,
    category: 'prose',
    rule: 'Never reference stat names or values in narrative prose — "Your hands are steady" not "Your DEX of 16 means..."',
    ref: 'SKILL.md:204',
  },
  {
    id: 16,
    category: 'prose',
    rule: 'Read prose-craft.md before EVERY scene — not once at start, every single turn',
    ref: 'gm-checklist.md:189',
  },
  {
    id: 17,
    category: 'prose',
    rule: 'Show, do not tell — never name emotions, reveal through physical manifestation and action',
    ref: 'modules/prose-craft.md § Show, Don\'t Tell',
  },

  // ── TECHNICAL ───────────────────────────────────────────────────────
  {
    id: 18,
    category: 'technical',
    rule: 'Use addEventListener with data-prompt attributes — never inline onclick for sendPrompt paths',
    ref: 'gm-checklist.md:41',
  },
  {
    id: 19,
    category: 'technical',
    rule: 'Include a copyable fallback prompt on every sendPrompt button',
    ref: 'gm-checklist.md:43',
  },
  {
    id: 20,
    category: 'technical',
    rule: 'Read the active visual style file before rendering any widget — apply its CSS custom properties',
    ref: 'gm-checklist.md:45',
  },
];
