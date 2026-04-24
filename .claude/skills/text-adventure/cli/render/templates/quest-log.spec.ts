import { describe, expect, test } from 'bun:test';
import { renderQuestLog } from './quest-log';
import { createDefaultState } from '../../lib/state-store';
import { extractJsonTagAttr } from '../../tests/support/rendered-widget';

type QuestLogConfig = Array<{
  id: string;
  title: string;
  status: string;
  type: string;
  priority: string;
  currentObjectiveId: string;
  objectives: Array<{ id: string; description: string; state: string; completed: boolean }>;
  clues: Array<{ id: string; text: string; source?: string; important?: boolean }>;
  rewards: Array<{ label: string; known: boolean; received: boolean }>;
  relatedLocationIds: string[];
}>;

function readQuests(html: string): QuestLogConfig {
  return extractJsonTagAttr<QuestLogConfig>(html, 'ta-quest-log', 'data-quests');
}

describe('renderQuestLog', () => {
  test('emits a ta-quest-log custom element with CDN runtime for standalone use', () => {
    const state = createDefaultState();
    state.quests = [];

    const html = renderQuestLog(state, 'station');

    expect(html).toContain('<ta-quest-log');
    expect(html).toContain('ta-components.js');
    expect(html).toContain('station.css');
  });

  test('normalizes legacy quest objectives and string clues', () => {
    const state = createDefaultState();
    state.scene = 7;
    state.quests = [
      {
        id: 'main',
        title: 'Find the Beacon',
        status: 'active',
        objectives: [
          { id: 'scan', description: 'Scan the ruins', completed: true },
          { id: 'enter', description: 'Enter the lower vault', completed: false },
        ],
        clues: ['The signal repeats every nine minutes.'],
      },
    ];

    const quests = readQuests(renderQuestLog(state, ''));

    expect(quests).toHaveLength(1);
    expect(quests[0]!.type).toBe('main');
    expect(quests[0]!.currentObjectiveId).toBe('enter');
    expect(quests[0]!.objectives[0]!.state).toBe('completed');
    expect(quests[0]!.objectives[1]!.state).toBe('active');
    expect(quests[0]!.clues[0]!.text).toBe('The signal repeats every nine minutes.');
  });

  test('preserves richer quest metadata when present', () => {
    const html = renderQuestLog(null, '', {
      data: {
        quests: [
          {
            id: 'crew_mara',
            title: 'Mara Needs Parts',
            status: 'active',
            type: 'crew',
            priority: 'urgent',
            summary: 'Mara can fix the shields if you recover a regulator.',
            objectives: [{ id: 'regulator', text: 'Recover a regulator', state: 'optional' }],
            clues: [
              { id: 'scrap', text: 'A regulator was logged in cargo.', source: 'Cargo manifest', important: true },
            ],
            relatedNpcIds: ['mara'],
            relatedLocationIds: ['cargo_hold'],
            rewards: [{ label: 'Shield repair', known: true }],
            consequences: ['Shields remain degraded if ignored.'],
          },
        ],
      },
    });

    const quests = readQuests(html);

    expect(quests[0]!.type).toBe('crew');
    expect(quests[0]!.priority).toBe('urgent');
    expect(quests[0]!.objectives[0]!.state).toBe('optional');
    expect(quests[0]!.clues[0]!.source).toBe('Cargo manifest');
    expect(quests[0]!.clues[0]!.important).toBe(true);
    expect(quests[0]!.relatedLocationIds).toEqual(['cargo_hold']);
    expect(quests[0]!.rewards[0]!.label).toBe('Shield repair');
  });

  test('escapes fallback quest counts and hostile text remains in JSON attribute only', () => {
    const state = createDefaultState();
    state.quests = [
      {
        id: 'x',
        title: '<img src=x onerror=alert(1)>',
        status: 'active',
        objectives: [],
        clues: [],
      },
    ];

    const html = renderQuestLog(state, '');

    expect(html).toContain('<ta-quest-log');
    expect(html).not.toContain('<img src=x');
    expect(readQuests(html)[0]!.title).toBe('<img src=x onerror=alert(1)>');
  });
});
