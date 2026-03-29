import { describe, test, expect } from 'bun:test';
import { handleHelp } from './help';

describe('handleHelp', () => {
  describe('top-level (no args)', () => {
    test('returns ok with command "help"', async () => {
      const result = await handleHelp([]);
      expect(result.ok).toBe(true);
      expect(result.command).toBe('help');
    });

    test('returns workflow section with setup and turn loop', async () => {
      const result = await handleHelp([]);
      const data = result.data as {
        topic: string;
        workflow: { setup: string; turnLoop: { step: number; name: string; command: string }[] };
        commands: { command: string; description: string }[];
      };
      expect(data.topic).toBe('quickstart');
      expect(data.workflow.setup).toContain('setup.sh');
      expect(data.workflow.turnLoop.length).toBeGreaterThanOrEqual(5);
      expect(data.workflow.turnLoop[0].name).toBe('Sync');
    });

    test('includes command summary list', async () => {
      const result = await handleHelp([]);
      const data = result.data as { commands: { command: string; description: string }[] };
      expect(data.commands.length).toBeGreaterThanOrEqual(6);
      const commandNames = data.commands.map(c => c.command);
      expect(commandNames).toContain('tag state');
      expect(commandNames).toContain('tag render');
      expect(commandNames).toContain('tag verify');
    });

    test('includes cardinal rules', async () => {
      const result = await handleHelp([]);
      const data = result.data as { cardinalRules: string[] };
      expect(data.cardinalRules.length).toBeGreaterThanOrEqual(3);
      expect(data.cardinalRules.some(r => r.includes('show_widget'))).toBe(true);
    });
  });

  describe('new-game subcommand', () => {
    test('returns ok with command "help"', async () => {
      const result = await handleHelp(['new-game']);
      expect(result.ok).toBe(true);
      expect(result.command).toBe('help');
    });

    test('returns ordered setup steps', async () => {
      const result = await handleHelp(['new-game']);
      const data = result.data as {
        topic: string;
        steps: { step: number; name: string; command: string; description: string }[];
      };
      expect(data.topic).toBe('new-game');
      expect(data.steps.length).toBeGreaterThanOrEqual(4);
      // Steps must be in order
      for (let i = 1; i < data.steps.length; i++) {
        expect(data.steps[i].step).toBe(data.steps[i - 1].step + 1);
      }
    });

    test('first step is setup.sh', async () => {
      const result = await handleHelp(['new-game']);
      const data = result.data as {
        steps: { step: number; name: string; command: string }[];
      };
      expect(data.steps[0].name).toContain('Setup');
      expect(data.steps[0].command).toContain('setup.sh');
    });

    test('includes scenario select, settings, and character creation steps', async () => {
      const result = await handleHelp(['new-game']);
      const data = result.data as {
        steps: { name: string }[];
      };
      const names = data.steps.map(s => s.name);
      expect(names.some(n => n.includes('Scenario'))).toBe(true);
      expect(names.some(n => n.includes('Settings'))).toBe(true);
      expect(names.some(n => n.includes('Character'))).toBe(true);
    });

    test('includes module tier list', async () => {
      const result = await handleHelp(['new-game']);
      const data = result.data as {
        moduleTiers: { tier: number; label: string; modules: string[] }[];
      };
      expect(data.moduleTiers.length).toBe(3);
      expect(data.moduleTiers[0].tier).toBe(1);
      expect(data.moduleTiers[0].modules).toContain('prose-craft');
      expect(data.moduleTiers[0].modules).toContain('gm-checklist');
    });
  });

  describe('scene subcommand', () => {
    test('returns ok with command "help"', async () => {
      const result = await handleHelp(['scene']);
      expect(result.ok).toBe(true);
      expect(result.command).toBe('help');
    });

    test('returns scene composition workflow', async () => {
      const result = await handleHelp(['scene']);
      const data = result.data as {
        topic: string;
        workflow: { step: number; name: string; description: string }[];
      };
      expect(data.topic).toBe('scene');
      expect(data.workflow.length).toBeGreaterThanOrEqual(5);
    });

    test('workflow starts with sync and ends with post-scene', async () => {
      const result = await handleHelp(['scene']);
      const data = result.data as {
        workflow: { step: number; name: string }[];
      };
      expect(data.workflow[0].name).toContain('Sync');
      expect(data.workflow[data.workflow.length - 1].name).toContain('Post');
    });

    test('includes prose checklist', async () => {
      const result = await handleHelp(['scene']);
      const data = result.data as {
        proseChecklist: string[];
      };
      expect(data.proseChecklist.length).toBeGreaterThanOrEqual(8);
    });

    test('includes density guidance', async () => {
      const result = await handleHelp(['scene']);
      const data = result.data as {
        densityGuidance: { actOpener: string; standard: string; transition: string };
      };
      expect(data.densityGuidance.actOpener).toContain('6');
      expect(data.densityGuidance.standard).toContain('2');
      expect(data.densityGuidance.transition).toContain('1');
    });

    test('includes scene structure reference', async () => {
      const result = await handleHelp(['scene']);
      const data = result.data as {
        sceneStructure: string[];
      };
      expect(data.sceneStructure.length).toBeGreaterThanOrEqual(5);
      expect(data.sceneStructure.some(s => s.includes('Location'))).toBe(true);
      expect(data.sceneStructure.some(s => s.includes('Narrative'))).toBe(true);
      expect(data.sceneStructure.some(s => s.includes('Footer'))).toBe(true);
    });

    test('includes mandatory warnings', async () => {
      const result = await handleHelp(['scene']);
      const data = result.data as {
        warnings: string[];
      };
      expect(data.warnings.length).toBeGreaterThanOrEqual(2);
      expect(data.warnings.some(w => w.includes('tag render'))).toBe(true);
    });
  });

  describe('unknown subcommand', () => {
    test('returns error for unknown topic', async () => {
      const result = await handleHelp(['banana']);
      expect(result.ok).toBe(false);
      expect(result.error?.message).toContain('banana');
      expect(result.error?.corrective).toContain('new-game');
      expect(result.error?.corrective).toContain('scene');
    });
  });
});
