import type { CommandResult } from '../types';
import { ok, fail } from '../lib/errors';
import { COMMAND_HELP } from '../metadata';
import { PROSE_CHECKLIST, SCENE_STRUCTURE, DENSITY_GUIDANCE } from '../data/prose-guidance';

const VALID_TOPICS = ['new-game', 'scene'] as const;
type HelpTopic = (typeof VALID_TOPICS)[number];

function isValidTopic(value: string): value is HelpTopic {
  return (VALID_TOPICS as readonly string[]).includes(value);
}

// ── Quickstart (top-level help) ───────────────────────────────────

function quickstart(): CommandResult {
  return ok({
    topic: 'quickstart',
    workflow: {
      setup: 'Run via Bash tool from .claude/skills/text-adventure/: . ./setup.sh && tag state reset',
      turnLoop: [
        { step: 1, name: 'Sync', command: 'tag state sync --apply --scene <N> --room <id>', description: 'Mandatory before every scene. Validates module context, quest consistency, NPC references, pending computations.' },
        { step: 2, name: 'Read Modules', command: 'tag state context', description: 'Re-read every Tier 1 module listed in context output. prose-craft.md every turn, no exceptions.' },
        { step: 3, name: 'Render', command: 'tag render scene --style <style>', description: 'Generate complete widget HTML with Shadow DOM, CDN CSS, JS, and interactive elements. Do NOT modify the html field.' },
        { step: 4, name: 'Compose', command: '(write narrative into #narrative div)', description: 'Write prose into the skeleton. Follow craftGuidance.proseChecklist and densityGuidance exactly.' },
        { step: 5, name: 'Verify', command: 'tag verify /tmp/scene.html', description: 'Validate composed HTML before show_widget. Checks footer, panels, scene-meta, narrative, CSS, action cards.' },
        { step: 6, name: 'Post-Scene', command: 'tag state sync --apply --scene <N+1>', description: 'Update state: HP, XP, faction standings, world flags, quest progress.' },
      ],
    },
    commands: Object.values(COMMAND_HELP).map(c => ({
      command: c.command,
      description: c.description,
    })),
    cardinalRules: [
      'ALL output inside visualize:show_widget — zero text in conversation. No prose, narration, status updates, or stat breakdowns outside widgets.',
      'ALL widgets rendered via tag render — never hand-code HTML, CSS, or JS. The CLI produces deterministic, style-correct output from game state.',
      'Never auto-resolve anything requiring a player decision. Die rolls and choices wait for input.',
      'Never advance the story without player input. Every scene ends with a choice, a roll, or an action prompt.',
      'Never editorially guide the player. No "safe", "risky", or "recommended" labels on action buttons.',
      'Read styles/style-reference.md and the active visual style before rendering any widget.',
    ],
  }, 'help');
}

// ── New Game ──────────────────────────────────────────────────────

function newGame(): CommandResult {
  return ok({
    topic: 'new-game',
    steps: [
      {
        step: 1,
        name: 'Setup',
        command: '. ./setup.sh && tag state reset',
        description: 'Run via Bash tool from .claude/skills/text-adventure/. Installs Bun, links tag command, initialises blank game state. Must dot-source (not bash) so PATH persists.',
      },
      {
        step: 2,
        name: 'Scenario Select',
        command: "tag render scenario-select --data '<json>'",
        description: 'Present four scenario cards with genre badges, hooks, and selection buttons. Default theme is space; adapt to any genre the player requests.',
      },
      {
        step: 3,
        name: 'Game Settings',
        command: "tag render settings --data '<json>'",
        description: 'Interactive widget: rulebook, difficulty, pacing, visual style, active modules. Every player choice must be in the sendPrompt payload — never a static "Settings confirmed".',
      },
      {
        step: 4,
        name: 'Character Creation',
        command: "tag render character-creation --style <style> --data '<json>'",
        description: 'Name input, archetype selector, stat block. Six default archetypes adapt to theme. Name, class, stats, AND game settings must be in the sendPrompt payload.',
      },
      {
        step: 5,
        name: 'Read Tier 1 Modules',
        command: 'tag state context',
        description: 'Read every Tier 1 module in full before generating the first widget. Skipping these produces broken widgets, missing mechanics, and visual style drift.',
      },
      {
        step: 6,
        name: 'Opening Scene',
        command: 'tag state sync --apply --scene 1 --room <starting_room> && tag render scene --style <style>',
        description: 'Act opener: 6-10 paragraphs, short story density. World-building, character establishment, sensory grounding, NPC introduction, tension, hook.',
      },
    ],
    moduleTiers: [
      {
        tier: 1,
        label: 'MUST READ before rendering any widget',
        modules: [
          'gm-checklist',
          'prose-craft',
          'die-rolls',
          'character-creation',
          'core-systems',
          'save-codex',
        ],
      },
      {
        tier: 2,
        label: 'READ when scenario activates (before opening scene)',
        modules: [
          'scenarios',
          'bestiary',
          'story-architect',
          'ship-systems',
          'crew-manifest',
          'star-chart',
          'geo-map',
          'procedural-world-gen',
          'world-history',
          'lore-codex',
          'rpg-systems',
          'ai-npc',
          'atmosphere',
          'audio',
        ],
      },
      {
        tier: 3,
        label: 'READ on demand when player triggers',
        modules: [
          'adventure-exporting',
          'adventure-authoring',
          'arc-patterns',
          'genre-mechanics',
        ],
      },
    ],
  }, 'help');
}

// ── Scene Composition ────────────────────────────────────────────

function scene(): CommandResult {
  return ok({
    topic: 'scene',
    workflow: [
      {
        step: 1,
        name: 'Sync',
        command: 'tag state sync --apply --scene <N> --room <id>',
        description: 'Mandatory. Validates module context, quest consistency, NPC references. tag render refuses to produce output if sync has not been run.',
      },
      {
        step: 2,
        name: 'Read Modules',
        command: 'tag state context',
        description: 'Re-read prose-craft.md every turn. Re-read all Tier 1 modules listed in context output. After compaction, re-read everything — you have lost context.',
      },
      {
        step: 3,
        name: 'Render Skeleton',
        command: 'tag render scene --style <style>',
        description: 'Generates complete widget HTML. Do NOT modify the html field — it contains Shadow DOM, CDN CSS link, JS, accessibility, light/dark mode, and soundscape. Pass to show_widget as-is, then compose narrative into #narrative.',
      },
      {
        step: 4,
        name: 'Compose Narrative',
        command: '(write prose into #narrative div of rendered html)',
        description: 'Follow craftGuidance.proseChecklist and densityGuidance. Include all requiredElements (atmosphere strip, action cards, footer, scene-meta). All content inside the widget — nothing outside.',
      },
      {
        step: 5,
        name: 'Verify',
        command: 'tag verify /tmp/scene.html',
        description: 'Validate composed HTML before show_widget. Checks footer buttons, panels, scene-meta, narrative, CSS, action cards. The verify marker is cryptographically signed — manual bypass will not work.',
      },
      {
        step: 6,
        name: 'Post-Scene Update',
        command: 'tag state sync --apply --scene <N+1> --room <new_room>',
        description: 'Update state for the next scene: HP, XP, faction standings, world flags, quest progress. Also update any changed NPC dispositions or conditions.',
      },
    ],
    proseChecklist: [...PROSE_CHECKLIST],
    densityGuidance: { ...DENSITY_GUIDANCE },
    sceneStructure: [...SCENE_STRUCTURE],
    warnings: [
      'Do NOT modify the html from tag render — it contains Shadow DOM, CDN CSS link, JS, accessibility, light/dark mode, and soundscape. Trimming CSS or hand-writing HTML is a critical failure.',
      'Do NOT hand-code widgets. tag render produces deterministic, style-correct output. Module files define rules, not widget code.',
      'Do NOT reveal which attribute a check tests in action options — the player chooses what to do, not which stat to roll.',
      'Do NOT skip tag verify — without verification, tag render refuses to produce the next scene widget.',
    ],
  }, 'help');
}

// ── Handler ──────────────────────────────────────────────────────

export async function handleHelp(args: string[]): Promise<CommandResult> {
  const topic = args[0]?.toLowerCase();

  if (!topic) return quickstart();

  if (!isValidTopic(topic)) {
    return fail(
      `Unknown help topic: ${topic}`,
      `Valid topics: ${VALID_TOPICS.join(', ')}. Run: tag help`,
      'help',
    );
  }

  switch (topic) {
    case 'new-game': return newGame();
    case 'scene': return scene();
  }
}
