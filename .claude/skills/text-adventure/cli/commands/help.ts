// Help command content centralizes quickstart, scene workflow, and command metadata guidance.
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
  return ok(
    {
      topic: 'quickstart',
      workflow: {
        setup: 'Run via Bash tool from .claude/skills/text-adventure/: . ./setup.sh && tag state reset',
        turnLoop: [
          {
            step: 1,
            name: 'Sync',
            command: 'tag state sync --apply --scene <N> --room <id>',
            description:
              'Mandatory before every scene. Validates module context, quest consistency, NPC references, pending computations.',
          },
          {
            step: 2,
            name: 'Load Modules',
            command: 'tag module activate-tier 1',
            description:
              'Load all Tier 1 modules into context. After compaction, re-run to reload. Scene rendering is gated on _modulesRead.',
          },
          {
            step: 3,
            name: 'Refresh Style',
            command: 'tag style activate',
            description:
              'Run after setup, after a visual style change, and after compaction. Scene rendering is gated on _styleReadEpoch.',
          },
          {
            step: 4,
            name: 'Render',
            command: 'tag render scene --style <style>',
            description:
              'Generate complete widget HTML with the custom-element shell, CDN CSS, JS, and interactive elements. Do not hand-alter the shell/runtime scaffolding.',
          },
          {
            step: 5,
            name: 'Compose',
            command: '(write narrative into #narrative or .scene-phase .narrative)',
            description:
              'Write prose into the skeleton. Follow craftGuidance.proseChecklist and densityGuidance exactly.',
          },
          {
            step: 6,
            name: 'Verify',
            command: 'tag verify /tmp/scene.html',
            description:
              'Validate composed HTML before show_widget. Checks footer, panels, scene-meta, narrative, CSS, action cards.',
          },
          {
            step: 7,
            name: 'Prose Gate',
            command: 'tag prose-check /tmp/scene.html',
            description:
              'Run prose review, then clear the gate with `tag prose-gate --manual` or `tag prose-gate --llm /tmp/prose-check-result.json` before show_widget.',
          },
          {
            step: 8,
            name: 'Post-Scene',
            command: 'tag state sync --apply --scene <N+1>',
            description: 'Update state: HP, XP, faction standings, world flags, quest progress.',
          },
        ],
      },
      commands: Object.values(COMMAND_HELP).map(c => ({
        command: c.command,
        description: c.description,
      })),
      cardinalRules: [
        'ALL output inside visualize:show_widget — zero text in conversation. No prose, narration, status updates, or stat breakdowns outside widgets.',
        'ALL widgets rendered via tag render — never hand-code HTML, CSS, or JS. The CLI produces deterministic, style-correct output from game state.',
        'Run tag verify and tag prose-check/tag prose-gate before every scene show_widget.',
        'Never auto-resolve anything requiring a player decision. Die rolls and choices wait for input.',
        'Never advance the story without player input. Every scene ends with a choice, a roll, or an action prompt.',
        'Never editorially guide the player. No "safe", "risky", or "recommended" labels on action buttons.',
        'Read styles/style-reference.md and the active visual style before rendering any widget.',
      ],
    },
    'help',
  );
}

// ── New Game ──────────────────────────────────────────────────────

function newGame(): CommandResult {
  return ok(
    {
      topic: 'new-game',
      steps: [
        {
          step: 1,
          name: 'Setup',
          command: '. ./setup.sh && tag state reset',
          description:
            'Run via Bash tool from .claude/skills/text-adventure/. Installs Bun, links tag command, initialises blank game state. Must dot-source (not bash) so PATH persists.',
        },
        {
          step: 2,
          name: 'Scenario Select',
          command: "tag render scenario-select --data '<json>'",
          description:
            'Render scenario cards. Save HTML to file, run tag verify scenario /tmp/scenario.html, then pass to show_widget.',
        },
        {
          step: 3,
          name: 'Verify Scenario',
          command: 'tag verify scenario /tmp/scenario.html',
          description:
            'MANDATORY. Checks card count, select buttons, CSS variables. tag render settings will REFUSE to run until this passes.',
        },
        {
          step: 4,
          name: 'Game Settings',
          command: "tag render settings --data '<json>'",
          description:
            'Render settings widget. Save HTML, run tag verify rules /tmp/settings.html, then pass to show_widget.',
        },
        {
          step: 5,
          name: 'Verify Settings',
          command: 'tag verify rules /tmp/settings.html',
          description:
            'MANDATORY. Checks option groups, confirm button, no [object Object]. tag render character-creation will REFUSE to run until this passes.',
        },
        {
          step: 6,
          name: 'Character Creation',
          command: "tag render character-creation --style <style> --data '<json>'",
          description:
            'Render character creation widget. Save HTML, run tag verify character /tmp/character.html, then pass to show_widget.',
        },
        {
          step: 7,
          name: 'Verify Character',
          command: 'tag verify character /tmp/character.html',
          description:
            'MANDATORY. Checks name input, confirm mechanism. tag render scene will REFUSE to run until this passes.',
        },
        {
          step: 8,
          name: 'Apply Setup Payload',
          command: "tag setup apply --settings '<json>' --character '<json>'",
          description:
            'After the player confirms character creation, apply the captured settings + character payload in one call. This replaces the old manual state set flow and persists style, rulebook, modules, pronouns, and computed modifiers.',
        },
        {
          step: 9,
          name: 'Activate Visual Style',
          command: 'tag style activate',
          description:
            'Read the active visual style file plus style-reference.md and stamp _styleReadEpoch. tag render scene refuses to run until style guidance is fresh.',
        },
        {
          step: 10,
          name: 'Load Tier 1 Modules',
          command: 'tag module activate-tier 1',
          description:
            'Load all Tier 1 module content into GM context. Scene rendering is gated — tag render scene refuses until all Tier 1 modules are in _modulesRead.',
        },
        {
          step: 11,
          name: 'Load Scenario Modules',
          command: 'tag module activate-tier 2',
          description:
            'Load Tier 2 modules for the chosen scenario and initialise world state from the seed. For each active module, populate the corresponding state: procedural world data, map/nav state, ship/crew rosters, world history, story architect threads, NPCs, quests, factions, and any codex seeds.',
        },
        {
          step: 12,
          name: 'Opening Scene',
          command: 'tag state sync --apply --scene 1 --room <starting_room> && tag render scene --style <style>',
          description:
            'sync MUST come before render — sync writes the marker that render requires. ' +
            'State is at scene 0 after setup, so the verify gate is skipped; this is safe to run before any scene exists. ' +
            'After composition, run tag verify plus tag prose-check/tag prose-gate before show_widget. ' +
            'Act opener: 6-10 paragraphs, short story density. World-building, character establishment, sensory grounding, NPC introduction, tension, hook.',
        },
      ],
      moduleTiers: [
        {
          tier: 1,
          label: 'MUST READ before rendering any widget',
          modules: ['gm-checklist', 'prose-craft', 'die-rolls', 'character-creation', 'core-systems', 'save-codex'],
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
          modules: ['adventure-exporting', 'adventure-authoring', 'arc-patterns', 'genre-mechanics'],
        },
      ],
    },
    'help',
  );
}

// ── Scene Composition ────────────────────────────────────────────

function scene(): CommandResult {
  return ok(
    {
      topic: 'scene',
      workflow: [
        {
          step: 1,
          name: 'Sync',
          command: 'tag state sync --apply --scene <N> --room <id>',
          description:
            'Mandatory. Validates module context, quest consistency, NPC references. tag render refuses to produce output if sync has not been run.',
        },
        {
          step: 2,
          name: 'Load Modules',
          command: 'tag module activate-tier 1',
          description:
            'Load all Tier 1 modules into context. After compaction, re-run — _modulesRead resets and tag render scene will refuse until modules are reloaded.',
        },
        {
          step: 3,
          name: 'Refresh Style',
          command: 'tag style activate',
          description:
            'Run after any visual style change or compaction. tag render scene refuses to run when _styleReadEpoch is stale.',
        },
        {
          step: 4,
          name: 'Render Skeleton',
          command: 'tag render scene --style <style>',
          description:
            'Generates complete widget HTML. Keep the custom-element shell, CDN links, JS, and panel/footer scaffolding intact. Compose only inside #narrative, .scene-phase .narrative, and the designated action/POI placeholders before verify.',
        },
        {
          step: 5,
          name: 'Compose Narrative',
          command: '(write prose into #narrative or .scene-phase .narrative blocks)',
          description:
            'Follow craftGuidance.proseChecklist and densityGuidance. Include all requiredElements (atmosphere strip, action cards, footer, scene-meta). All content inside the widget — nothing outside.',
        },
        {
          step: 6,
          name: 'Verify',
          command: 'tag verify /tmp/scene.html',
          description:
            'Validate composed HTML before show_widget. Checks footer buttons, panels, scene-meta, narrative, CSS, and action cards. The verify marker is a signed workflow gate — manual bypass is unsupported and will fail validation.',
        },
        {
          step: 7,
          name: 'Prose Gate',
          command: 'tag prose-check /tmp/scene.html',
          description:
            'Run prose review, then clear the scene with `tag prose-gate --manual` or `tag prose-gate --llm /tmp/prose-check-result.json`. If the scene HTML changes, rerun tag prose-check first.',
        },
        {
          step: 8,
          name: 'Post-Scene Update',
          command: 'tag state sync --apply --scene <N+1> --room <new_room>',
          description:
            'Update state for the next scene: HP, XP, faction standings, world flags, quest progress. Also update any changed NPC dispositions or conditions.',
        },
      ],
      proseChecklist: [...PROSE_CHECKLIST],
      densityGuidance: { ...DENSITY_GUIDANCE },
      sceneStructure: [...SCENE_STRUCTURE],
      warnings: [
        'Do NOT hand-alter the rendered shell from tag render. Compose only inside the designated narrative/action placeholders; trimming CSS, removing JS, or hand-writing replacement HTML is a critical failure.',
        'Do NOT hand-code widgets. tag render produces deterministic, style-correct output. Module files define rules, not widget code.',
        'Do NOT reveal which attribute a check tests in action options — the player chooses what to do, not which stat to roll.',
        'Do NOT skip tag verify — without verification, tag render refuses to produce the next scene widget.',
        'Do NOT skip tag prose-check/tag prose-gate — prose clearance is a hard gate before show_widget.',
      ],
    },
    'help',
  );
}

// ── Handler ──────────────────────────────────────────────────────

export async function handleHelp(args: string[]): Promise<CommandResult> {
  const topic = args[0]?.toLowerCase();

  if (!topic) return quickstart();

  if (!isValidTopic(topic)) {
    return fail(`Unknown help topic: ${topic}`, `Valid topics: ${VALID_TOPICS.join(', ')}. Run: tag help`, 'help');
  }

  switch (topic) {
    case 'new-game':
      return newGame();
    case 'scene':
      return scene();
  }
}
