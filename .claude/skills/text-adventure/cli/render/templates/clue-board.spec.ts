import { describe, expect, test } from 'bun:test';
import { createDefaultState } from '../../lib/state-store';
import { extractJsonTagAttr } from '../../tests/support/rendered-widget';
import { renderClueBoard } from './clue-board';

type ClueBoardPayload = {
  quests: Array<{ id: string; label: string; status: string }>;
  clues: Array<{ id: string; text: string; source: string; important: boolean; questId: string }>;
  locations: Array<{ id: string; label: string }>;
  edges: Array<{ from: string; to: string; label: string }>;
};

function readBoard(html: string): ClueBoardPayload {
  return extractJsonTagAttr<ClueBoardPayload>(html, 'ta-clue-board', 'data-clues');
}

describe('renderClueBoard', () => {
  test('normalizes string and object clues into quest-linked clue nodes', () => {
    const state = createDefaultState();
    state.quests = [
      {
        id: 'main',
        title: 'Find the Beacon',
        status: 'active',
        objectives: [],
        clues: [
          'The signal repeats every nine minutes.',
          { id: 'manifest', text: 'Cargo was diverted.', source: 'Cargo manifest', important: true },
        ],
        relatedLocationIds: ['cargo_hold'],
      },
    ];

    const board = readBoard(renderClueBoard(state, ''));

    expect(board.quests).toEqual([{ id: 'quest:main', label: 'Find the Beacon', status: 'active' }]);
    expect(board.clues[0]).toMatchObject({
      id: 'clue:main:clue-1',
      text: 'The signal repeats every nine minutes.',
      important: false,
      questId: 'main',
    });
    expect(board.clues[1]).toMatchObject({
      id: 'clue:main:manifest',
      source: 'Cargo manifest',
      important: true,
    });
  });

  test('links clues to quests and quests to related locations', () => {
    const state = createDefaultState();
    state.quests = [
      {
        id: 'main',
        title: 'Find the Beacon',
        status: 'active',
        objectives: [],
        clues: ['The signal repeats every nine minutes.'],
        relatedLocationIds: ['cargo_hold'],
      },
    ];

    const board = readBoard(renderClueBoard(state, ''));

    expect(board.locations).toEqual([{ id: 'location:cargo_hold', label: 'cargo_hold' }]);
    expect(board.edges).toContainEqual({ from: 'clue:main:clue-1', to: 'quest:main', label: 'supports' });
    expect(board.edges).toContainEqual({ from: 'quest:main', to: 'location:cargo_hold', label: 'points to' });
  });
});
