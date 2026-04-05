import { describe, test, expect } from 'bun:test';
import {
  checkCodexEntryCount,
  checkShipPanelContent,
  checkCrewPanelContent,
  checkQuestPanelIntegrity,
  checkMapPanelContent,
  checkLevelUpIntegrity,
} from './panel-checks';
import type { GmState } from '../types';

/* ------------------------------------------------------------------ */
/*  HTML helpers                                                       */
/* ------------------------------------------------------------------ */

/** Wrap inner HTML in a panel-content div with the given data-panel. */
function panel(name: string, inner: string): string {
  return `<div class="panel-content" data-panel="${name}">${inner}</div>`;
}

function codexEntry(title: string): string {
  return `<div class="codex-entry"><div class="codex-header"><span class="codex-id">${title}</span></div></div>`;
}

function codexPanel(discovered: number, totalEntries: number, entries: string[]): string {
  return panel('codex', `
    <div class="widget-codex">
      <div class="codex-title">Lore Codex</div>
      <div class="codex-summary">${discovered} of ${totalEntries} entries discovered</div>
      ${entries.join('\n')}
    </div>
  `);
}

function shipSystemCard(name: string, pct: number): string {
  return `<div class="system-card"><div class="system-header"><span class="system-name">${name}</span></div><div class="system-pct">${pct}%</div></div>`;
}

function crewRow(name: string, role: string): string {
  return `<tr class="crew-row"><td class="crew-name">${name}</td><td class="crew-role">${role}</td></tr>`;
}

function questCard(title: string, progress: string, objectives: string[]): string {
  const objs = objectives.map(o => `<li class="quest-objective">${o}</li>`).join('');
  return `<div class="quest-card"><div class="quest-card-header"><span class="quest-title">${title}</span><span class="quest-progress">${progress}</span></div><ul class="quest-objectives">${objs}</ul></div>`;
}

/* ------------------------------------------------------------------ */
/*  Codex entry count                                                  */
/* ------------------------------------------------------------------ */

describe('checkCodexEntryCount', () => {
  test('passes when no codex panel present', () => {
    const failures: string[] = [];
    checkCodexEntryCount('<div>no codex here</div>', failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when discovered count is 0 with no entries', () => {
    const html = codexPanel(0, 40, []);
    const failures: string[] = [];
    checkCodexEntryCount(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when entry count matches discovered count', () => {
    const html = codexPanel(3, 40, [
      codexEntry('Charter of Soundings'),
      codexEntry('Callis Dray'),
      codexEntry('Borrowed Tide'),
    ]);
    const failures: string[] = [];
    checkCodexEntryCount(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('fails when discovered > 0 but no entries rendered', () => {
    const html = codexPanel(3, 40, []);
    const failures: string[] = [];
    checkCodexEntryCount(html, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/3 entries discovered/);
    expect(failures[0]).toMatch(/0.*codex-entry/);
  });

  test('fails when entry count mismatches discovered count', () => {
    const html = codexPanel(3, 40, [codexEntry('Only One')]);
    const failures: string[] = [];
    checkCodexEntryCount(html, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/3 entries discovered/);
    expect(failures[0]).toMatch(/1.*codex-entry/);
  });

  test('passes when singular "entry" used with count 1', () => {
    const html = panel('codex', `
      <div class="widget-codex">
        <div class="codex-summary">1 of 40 entry discovered</div>
        ${codexEntry('First Entry')}
      </div>
    `);
    const failures: string[] = [];
    checkCodexEntryCount(html, failures);
    expect(failures).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ */
/*  Ship panel spoiler                                                 */
/* ------------------------------------------------------------------ */

describe('checkShipPanelContent', () => {
  test('passes when no ship panel present', () => {
    const failures: string[] = [];
    checkShipPanelContent('<div>no ship here</div>', failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when ship panel has system cards', () => {
    const html = panel('ship', `
      <div class="widget-ship">
        <div class="ship-title">Borrowed Tide</div>
        ${shipSystemCard('hull', 84)}
        ${shipSystemCard('engines', 78)}
      </div>
    `);
    const failures: string[] = [];
    checkShipPanelContent(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when ship panel has placeholder message', () => {
    const html = panel('ship', `
      <div class="widget-ship">
        <p>Not currently aboard a ship.</p>
      </div>
    `);
    const failures: string[] = [];
    checkShipPanelContent(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('passes with "no vessel" placeholder', () => {
    const html = panel('ship', `
      <div class="widget-ship"><p>No vessel assigned.</p></div>
    `);
    const failures: string[] = [];
    checkShipPanelContent(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when ship panel is empty scaffold from template', () => {
    const html = '<div class="panel-content" data-panel="ship"></div>';
    const failures: string[] = [];
    checkShipPanelContent(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when ship panel has empty-state placeholder', () => {
    const html = panel('ship', '<p class="empty-state">No ship data.</p>');
    const failures: string[] = [];
    checkShipPanelContent(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('fails when ship panel is empty shell', () => {
    const html = panel('ship', `
      <div class="widget-ship">
        <div class="ship-title">Borrowed Tide</div>
        <div class="ship-meta">Repair parts: 6</div>
      </div>
    `);
    const failures: string[] = [];
    checkShipPanelContent(html, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/spoil/i);
    expect(failures[0]).toMatch(/system-card/);
  });

  test('fails when ship panel has only title — no cards or placeholder', () => {
    const html = panel('ship', `
      <div class="widget-ship"><div class="ship-title">My Ship</div></div>
    `);
    const failures: string[] = [];
    checkShipPanelContent(html, failures);
    expect(failures).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ */
/*  Crew panel spoiler                                                 */
/* ------------------------------------------------------------------ */

describe('checkCrewPanelContent', () => {
  test('passes when no crew panel present', () => {
    const failures: string[] = [];
    checkCrewPanelContent('<div>no crew here</div>', failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when crew panel has crew rows', () => {
    const html = panel('crew', `
      <div class="widget-crew">
        <div class="crew-title">Crew Manifest</div>
        <table class="crew-table"><tbody>
          ${crewRow('Venn Salo', 'pilot')}
          ${crewRow('Ruk', 'engineer')}
        </tbody></table>
      </div>
    `);
    const failures: string[] = [];
    checkCrewPanelContent(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when crew panel has placeholder', () => {
    const html = panel('crew', `
      <div class="widget-crew"><p>No crew recruited yet.</p></div>
    `);
    const failures: string[] = [];
    checkCrewPanelContent(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('passes with "travelling alone" placeholder', () => {
    const html = panel('crew', `
      <div class="widget-crew"><p>You are travelling alone.</p></div>
    `);
    const failures: string[] = [];
    checkCrewPanelContent(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when crew panel is empty scaffold from template', () => {
    const html = '<div class="panel-content" data-panel="crew"></div>';
    const failures: string[] = [];
    checkCrewPanelContent(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when crew panel has empty-state placeholder', () => {
    const html = panel('crew', '<p class="empty-state">No crew data.</p>');
    const failures: string[] = [];
    checkCrewPanelContent(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('fails when crew panel is empty shell', () => {
    const html = panel('crew', `
      <div class="widget-crew">
        <div class="crew-title">Crew Manifest</div>
        <table class="crew-table"><thead><tr><th>Name</th><th>Role</th></tr></thead><tbody></tbody></table>
      </div>
    `);
    const failures: string[] = [];
    checkCrewPanelContent(html, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/spoil/i);
    expect(failures[0]).toMatch(/crew-row/);
  });
});

/* ------------------------------------------------------------------ */
/*  Quest panel integrity                                              */
/* ------------------------------------------------------------------ */

describe('checkQuestPanelIntegrity', () => {
  test('passes when no quest panel present', () => {
    const failures: string[] = [];
    checkQuestPanelIntegrity('<div>no quests</div>', failures);
    expect(failures).toHaveLength(0);
  });

  test('passes with well-formed quest cards using fractions', () => {
    const html = panel('quests', `
      <div class="panel-quests">
        <div class="quests-title">Active Quests</div>
        ${questCard('Atlas of the Drowned Sky', '1/3', ['Find the chart', 'Visit the reef', 'Return'])}
        ${questCard('Borrowed Tide', '0/2', ['Talk to Quill', 'Recover the log'])}
      </div>
    `);
    const failures: string[] = [];
    checkQuestPanelIntegrity(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('passes with percentage progress format', () => {
    const html = panel('quests', `
      <div class="panel-quests">
        ${questCard('Main Quest', '33%', ['Step one'])}
        ${questCard('Side Quest', '50%', ['Step two'])}
      </div>
    `);
    const failures: string[] = [];
    checkQuestPanelIntegrity(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when quest panel is empty scaffold from template', () => {
    const html = '<div class="panel-content" data-panel="quests"></div>';
    const failures: string[] = [];
    checkQuestPanelIntegrity(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when quest panel has empty-state placeholder', () => {
    const html = panel('quests', '<div class="panel-quests"><p class="empty-state">No active quests.</p></div>');
    const failures: string[] = [];
    checkQuestPanelIntegrity(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('fails when quest panel has no quest cards', () => {
    const html = panel('quests', `
      <div class="panel-quests">
        <div class="quests-title">Active Quests</div>
      </div>
    `);
    const failures: string[] = [];
    checkQuestPanelIntegrity(html, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/no quest cards/i);
  });

  test('fails when quest card missing title', () => {
    const html = panel('quests', `
      <div class="panel-quests">
        <div class="quest-card">
          <div class="quest-card-header">
            <span class="quest-progress">0/3</span>
          </div>
          <ul class="quest-objectives"><li class="quest-objective">Do a thing</li></ul>
        </div>
      </div>
    `);
    const failures: string[] = [];
    checkQuestPanelIntegrity(html, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/quest-title/);
  });

  test('fails when quest card missing progress', () => {
    const html = panel('quests', `
      <div class="panel-quests">
        <div class="quest-card">
          <div class="quest-card-header">
            <span class="quest-title">My Quest</span>
          </div>
          <ul class="quest-objectives"><li class="quest-objective">Do a thing</li></ul>
        </div>
      </div>
    `);
    const failures: string[] = [];
    checkQuestPanelIntegrity(html, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/quest-progress/);
  });

  test('fails when progress formats are mixed (fraction + percentage)', () => {
    const html = panel('quests', `
      <div class="panel-quests">
        ${questCard('Quest A', '1/3', ['Obj'])}
        ${questCard('Quest B', '50%', ['Obj'])}
      </div>
    `);
    const failures: string[] = [];
    checkQuestPanelIntegrity(html, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/mixed format/i);
  });

  test('passes when all quests use same format', () => {
    const html = panel('quests', `
      <div class="panel-quests">
        ${questCard('Quest A', '0/3', ['Obj'])}
        ${questCard('Quest B', '1/2', ['Obj'])}
      </div>
    `);
    const failures: string[] = [];
    checkQuestPanelIntegrity(html, failures);
    expect(failures).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ */
/*  Map panel completeness                                             */
/* ------------------------------------------------------------------ */

describe('checkMapPanelContent', () => {
  test('passes when no map panel present', () => {
    const failures: string[] = [];
    checkMapPanelContent('<div>no map</div>', failures);
    expect(failures).toHaveLength(0);
  });

  test('passes with complete map panel', () => {
    const html = panel('map', `
      <div class="widget-map">
        <div class="map-title">Map</div>
        <div class="map-current">Choir Steps</div>
        <div class="map-summary">3 visited · 8 unexplored</div>
      </div>
    `);
    const failures: string[] = [];
    checkMapPanelContent(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when map panel is empty scaffold from template', () => {
    const html = '<div class="panel-content" data-panel="map"></div>';
    const failures: string[] = [];
    checkMapPanelContent(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when map panel has empty-state placeholder', () => {
    const html = panel('map', '<p class="empty-state">No map data.</p>');
    const failures: string[] = [];
    checkMapPanelContent(html, failures);
    expect(failures).toHaveLength(0);
  });

  test('fails when map-current is missing', () => {
    const html = panel('map', `
      <div class="widget-map">
        <div class="map-title">Map</div>
        <div class="map-summary">3 visited · 8 unexplored</div>
      </div>
    `);
    const failures: string[] = [];
    checkMapPanelContent(html, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/map-current/);
  });

  test('fails when map-summary is missing', () => {
    const html = panel('map', `
      <div class="widget-map">
        <div class="map-title">Map</div>
        <div class="map-current">Choir Steps</div>
      </div>
    `);
    const failures: string[] = [];
    checkMapPanelContent(html, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/map-summary/);
  });

  test('fails when both map-current and map-summary are missing', () => {
    const html = panel('map', `
      <div class="widget-map"><div class="map-title">Map</div></div>
    `);
    const failures: string[] = [];
    checkMapPanelContent(html, failures);
    expect(failures).toHaveLength(2);
  });
});

/* ------------------------------------------------------------------ */
/*  Level-up integrity                                                 */
/* ------------------------------------------------------------------ */

function makeState(level: number, computedLevel?: number): GmState {
  return {
    character: {
      name: 'Rian', class: 'Cartographer', hp: 10, maxHp: 10,
      ac: 12, level, xp: 0, currency: 0, currencyName: 'credits',
      stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      proficiencyBonus: 2, proficiencies: [], abilities: [],
      inventory: [], conditions: [], equipment: { weapon: 'knife', armour: 'vest' },
    },
    _computedLevel: computedLevel,
  } as unknown as GmState;
}

describe('checkLevelUpIntegrity', () => {
  test('passes when character is level 1 (no compute needed)', () => {
    const failures: string[] = [];
    checkLevelUpIntegrity(makeState(1), failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when no character exists', () => {
    const state = {} as GmState;
    const failures: string[] = [];
    checkLevelUpIntegrity(state, failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when character.level matches _computedLevel', () => {
    const failures: string[] = [];
    checkLevelUpIntegrity(makeState(3, 3), failures);
    expect(failures).toHaveLength(0);
  });

  test('passes when character.level 2 and _computedLevel 2', () => {
    const failures: string[] = [];
    checkLevelUpIntegrity(makeState(2, 2), failures);
    expect(failures).toHaveLength(0);
  });

  test('fails when character.level > _computedLevel', () => {
    const failures: string[] = [];
    checkLevelUpIntegrity(makeState(2, 1), failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/tag compute levelup/);
    expect(failures[0]).toMatch(/level 2/);
    expect(failures[0]).toMatch(/level 1/);
  });

  test('fails when character is level 2 and _computedLevel is undefined', () => {
    const failures: string[] = [];
    checkLevelUpIntegrity(makeState(2, undefined), failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/tag compute levelup/);
  });

  test('fails when character is level 4 but only computed to 2', () => {
    const failures: string[] = [];
    checkLevelUpIntegrity(makeState(4, 2), failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/level 4/);
    expect(failures[0]).toMatch(/level 2/);
  });
});
