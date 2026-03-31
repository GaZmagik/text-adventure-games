import { describe, test, expect } from 'bun:test';
import { getTopLevelHelp, getCommandHelp } from './help';
import { COMMAND_HELP, TOP_LEVEL_COMMANDS, WIDGET_TYPE_NAMES } from './metadata';

// ── getTopLevelHelp ──────────────────────────────────────────────────

describe('getTopLevelHelp', () => {
  test('returns ok: true', () => {
    const result = getTopLevelHelp();
    expect(result.ok).toBe(true);
  });

  test('returns command: help', () => {
    const result = getTopLevelHelp();
    expect(result.command).toBe('help');
  });

  test('data contains all top-level commands', () => {
    const result = getTopLevelHelp();
    const data = result.data as { commands: { command: string; description: string }[]; widgetTypes: string[] };
    expect(data.commands.length).toBe(TOP_LEVEL_COMMANDS.length);
  });

  test('commands include every canonical command from metadata', () => {
    const result = getTopLevelHelp();
    const data = result.data as { commands: { command: string; description: string }[]; widgetTypes: string[] };
    const commandNames = data.commands.map(c => c.command);
    for (const command of TOP_LEVEL_COMMANDS) {
      expect(commandNames).toContain(`tag ${command}`);
    }
  });

  test('each command entry has a non-empty description', () => {
    const result = getTopLevelHelp();
    const data = result.data as { commands: { command: string; description: string }[]; widgetTypes: string[] };
    for (const cmd of data.commands) {
      expect(typeof cmd.description).toBe('string');
      expect(cmd.description.length).toBeGreaterThan(0);
    }
  });

  test('data contains every canonical widget type from metadata', () => {
    const result = getTopLevelHelp();
    const data = result.data as { commands: unknown[]; widgetTypes: string[] };
    expect(data.widgetTypes).toHaveLength(WIDGET_TYPE_NAMES.length);
    expect(data.widgetTypes).toEqual([...WIDGET_TYPE_NAMES]);
  });

  test('widgetTypes includes expected in-game widgets', () => {
    const result = getTopLevelHelp();
    const data = result.data as { commands: unknown[]; widgetTypes: string[] };
    expect(data.widgetTypes).toContain('scene');
    expect(data.widgetTypes).toContain('character');
    expect(data.widgetTypes).toContain('ticker');
    expect(data.widgetTypes).toContain('dice');
    expect(data.widgetTypes).toContain('dice-pool');
    expect(data.widgetTypes).toContain('ship');
    expect(data.widgetTypes).toContain('crew');
    expect(data.widgetTypes).toContain('map');
    expect(data.widgetTypes).toContain('starchart');
    expect(data.widgetTypes).toContain('combat-turn');
    expect(data.widgetTypes).toContain('dialogue');
  });

  test('widgetTypes includes pre-game widgets', () => {
    const result = getTopLevelHelp();
    const data = result.data as { commands: unknown[]; widgetTypes: string[] };
    expect(data.widgetTypes).toContain('settings');
    expect(data.widgetTypes).toContain('scenario-select');
    expect(data.widgetTypes).toContain('character-creation');
  });

  test('data includes usage string', () => {
    const result = getTopLevelHelp();
    const data = result.data as { usage: string };
    expect(typeof data.usage).toBe('string');
    expect(data.usage).toContain('tag');
  });

  test('data includes non-empty examples array', () => {
    const result = getTopLevelHelp();
    const data = result.data as { examples: string[] };
    expect(Array.isArray(data.examples)).toBe(true);
    expect(data.examples.length).toBeGreaterThan(0);
  });
});

// ── getCommandHelp ───────────────────────────────────────────────────

describe('getCommandHelp', () => {
  test('returns ok: true for known command "state"', () => {
    const result = getCommandHelp('state');
    expect(result.ok).toBe(true);
  });

  test('returns command: help for known command', () => {
    const result = getCommandHelp('state');
    expect(result.command).toBe('help');
  });

  test('state help includes current v1.3.0 subcommands', () => {
    const result = getCommandHelp('state');
    const data = result.data as { subcommands: { name: string }[] };
    const names = data.subcommands.map(s => s.name);
    expect(names).toContain('get');
    expect(names).toContain('set');
    expect(names).toContain('create-npc');
    expect(names).toContain('codex');
    expect(names).toContain('crew');
    expect(names).toContain('ship');
    expect(names).toContain('validate');
    expect(names).toContain('reset');
    expect(names).toContain('history');
    expect(names).toContain('context');
    expect(names).toContain('schema');
    expect(names).toContain('sync');
  });

  test('each subcommand has usage and example fields', () => {
    const result = getCommandHelp('state');
    const data = result.data as { subcommands: { name: string; usage: string; example: string }[] };
    for (const sub of data.subcommands) {
      expect(typeof sub.usage).toBe('string');
      expect(sub.usage.length).toBeGreaterThan(0);
      expect(typeof sub.example).toBe('string');
      expect(sub.example.length).toBeGreaterThan(0);
    }
  });

  test('returns ok: true for all top-level commands', () => {
    for (const cmd of Object.keys(COMMAND_HELP)) {
      const result = getCommandHelp(cmd);
      expect(result.ok).toBe(true);
    }
  });

  test('compute help includes contest, hazard, encounter, levelup subcommands', () => {
    const result = getCommandHelp('compute');
    const data = result.data as { subcommands: { name: string }[] };
    const names = data.subcommands.map(s => s.name);
    expect(names).toContain('contest');
    expect(names).toContain('hazard');
    expect(names).toContain('encounter');
    expect(names).toContain('levelup');
  });

  test('quest help includes complete, add-objective, add-clue, status, list subcommands', () => {
    const result = getCommandHelp('quest');
    const data = result.data as { subcommands: { name: string }[] };
    const names = data.subcommands.map(s => s.name);
    expect(names).toContain('complete');
    expect(names).toContain('add-objective');
    expect(names).toContain('add-clue');
    expect(names).toContain('status');
    expect(names).toContain('list');
  });

  test('save help includes generate, load, validate, migrate subcommands', () => {
    const result = getCommandHelp('save');
    const data = result.data as { subcommands: { name: string }[] };
    const names = data.subcommands.map(s => s.name);
    expect(names).toContain('generate');
    expect(names).toContain('load');
    expect(names).toContain('validate');
    expect(names).toContain('migrate');
  });

  test('returns ok: false for unknown command', () => {
    const result = getCommandHelp('nonexistent');
    expect(result.ok).toBe(false);
  });

  test('returns corrective for unknown command', () => {
    const result = getCommandHelp('nonexistent');
    expect(result.error?.corrective).toBeDefined();
    expect(typeof result.error?.corrective).toBe('string');
    expect(result.error!.corrective.length).toBeGreaterThan(0);
  });

  test('error message for unknown command names the bad command', () => {
    const result = getCommandHelp('nonexistent');
    expect(result.error?.message).toContain('nonexistent');
  });

  test('corrective for unknown command lists valid commands', () => {
    const result = getCommandHelp('badcmd');
    // Corrective should list known commands so the user can self-correct
    expect(result.error?.corrective).toContain('state');
  });

  test('getCommandHelp("render") includes widget subcommand', () => {
    const result = getCommandHelp('render');
    expect(result.ok).toBe(true);
    const data = result.data as { subcommands: { name: string }[] };
    const names = data.subcommands.map(s => s.name);
    expect(names).toContain('<widget>');
  });

  test('getCommandHelp("batch") includes --commands flag', () => {
    const result = getCommandHelp('batch');
    expect(result.ok).toBe(true);
    const data = result.data as { subcommands: { name: string }[] };
    const names = data.subcommands.map(s => s.name);
    expect(names).toContain('--commands');
  });

  test('getCommandHelp("setup") includes apply subcommand', () => {
    const result = getCommandHelp('setup');
    expect(result.ok).toBe(true);
    const data = result.data as { subcommands: { name: string }[] };
    const names = data.subcommands.map(s => s.name);
    expect(names).toContain('apply');
  });

  test('getCommandHelp("rules") includes category subcommand', () => {
    const result = getCommandHelp('rules');
    expect(result.ok).toBe(true);
    const data = result.data as { subcommands: { name: string }[] };
    const names = data.subcommands.map(s => s.name);
    expect(names).toContain('<category>');
  });
});
