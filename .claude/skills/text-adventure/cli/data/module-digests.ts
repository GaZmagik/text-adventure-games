// Module Digests — one-line implementation requirements for each module.
// Used by `tag state context` to give the GM a quick reference for active modules.

export const MODULE_DIGESTS: Record<string, string> = {
  'adventure-authoring':
    'Parse and run .lore.md adventure files: structured templates with rooms, NPCs, and triggers.',
  'adventure-exporting':
    'Export live game world to .lore.md format: serialise state into shareable adventure template.',
  'ai-npc':
    'Live AI-powered NPC dialogue via Anthropic API: personality, memory, disposition tracking.',
  'atmosphere':
    'Visual immersion effects: particles, screen shake, colour flash, letterboxing, day/night cycling.',
  'audio':
    'Web Audio API soundscape: oscillator + noise layers + play/stop button in footer.',
  'bestiary':
    'Reusable adversary templates across all genres: tier-based stat blocks and abilities.',
  'character-creation':
    'Archetypes, stat generation, starting equipment, and identity — adapts to any rulebook system.',
  'core-systems':
    'HP, stats, inventory, economy, factions, quests, time, XP tracking — fundamental gameplay.',
  'crew-manifest':
    'Living crew engine: morale, stress, loyalty, task assignment, crew-member lifecycle.',
  'die-rolls':
    'Resolution mechanics: dice widgets, DC calibration, attribute variety, difficulty scaling.',
  'genre-mechanics':
    'Optional rule overlays: genre-specific systems layered on top of core-systems.',
  'geo-map':
    'On-world navigation: settlements, wilderness, dungeons, interiors with zone-based movement.',
  'gm-checklist':
    'Mandatory quality gates: checklists at key moments preventing common GM mistakes.',
  'lore-codex':
    'Living encyclopaedia: faction histories, NPC dossiers, location notes, discovered secrets.',
  'procedural-world-gen':
    'Deterministic world generation from seed string: layouts, NPCs, factions, loot, encounters.',
  'prose-craft':
    'Read EVERY turn. Sentence-level narrative quality rules.',
  'rpg-systems':
    'Alternative rule systems: replace or overlay default D&D 5e-lite mechanics.',
  'save-codex':
    'Session persistence: encode full game state into copyable save string, resume from paste.',
  'scenarios':
    'Starter scenarios and theme adaptation: scenario selection and genre/setting rules.',
  'ship-systems':
    'Vessel integrity engine: system damage, power allocation, repair parts, cascading failures.',
  'star-chart':
    'Sector navigation: 14 star systems, jump routes, fuel, travel time, hazards.',
  'story-architect':
    'Narrative tracking: branching plotlines, consequence propagation, foreshadowing, pacing.',
  'world-history':
    'Pre-adventure world building: empires, wars, institutions, deep lore seeding.',
};
