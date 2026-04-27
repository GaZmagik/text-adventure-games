/**
 * Definitions and runtime wrappers for reviewed render fixtures.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CDN_BASE } from '../../../assets/cdn-manifest.ts';
import { handleRender } from '../../commands/render';
import { clearStateDirCache, signMarker } from '../../commands/verify';
import { TIER1_MODULES } from '../../lib/constants';
import { applyWorldSeedPayload, buildWorldSeedPayload } from '../../lib/map-adapter';
import { createDefaultState, saveState } from '../../lib/state-store';
import { generateWorld } from '../../lib/worldgen';
import type { GmState, Quest } from '../../types';

export type ReviewedRenderFixtureDefinition = {
  title: string;
  widget: string;
  args?: string[];
  buildState: () => GmState;
};

function baseState(): GmState {
  const state = createDefaultState();
  state.visualStyle = 'terminal';
  state.scene = 12;
  state.currentRoom = 'Needle Gate';
  state.visitedRooms = ['Docking Ring', 'Needle Gate', 'Archive Row'];
  state._modulesRead = [...TIER1_MODULES];
  state._proseCraftEpoch = 0;
  state._styleReadEpoch = 0;
  state._turnCount = 4;
  state.time = {
    period: 'second watch',
    date: 'Day 18',
    elapsed: 18,
    hour: 22,
    playerKnowsDate: true,
    playerKnowsTime: true,
    calendarSystem: 'shipboard',
    deadline: { label: 'Quarantine breach', remainingScenes: 3 },
  };
  state.character = {
    name: 'Kira Vale',
    class: 'Scout',
    hp: 22,
    maxHp: 28,
    ac: 15,
    level: 5,
    xp: 5400,
    currency: 380,
    currencyName: 'credits',
    stats: { STR: 11, DEX: 17, CON: 13, INT: 14, WIS: 12, CHA: 10 },
    modifiers: { STR: 0, DEX: 3, CON: 1, INT: 2, WIS: 1, CHA: 0 },
    proficiencyBonus: 3,
    proficiencies: ['Piloting', 'Perception', 'Stealth', 'Hacking'],
    abilities: ['Quick Draw', 'Ghost Step', 'Patch Kit'],
    inventory: [
      { name: 'Silenced sidearm', type: 'weapon', slots: 1, description: 'Low-signature boarding pistol.' },
      { name: 'Breacher kit', type: 'tool', slots: 2, description: 'Foam charges and bypass shims.' },
      { name: 'Field scanner', type: 'gear', slots: 1, description: 'Reads power bleed and sealed compartments.' },
    ],
    conditions: ['Winded'],
    equipment: { weapon: 'Silenced sidearm', armour: 'Scout rig' },
    poiMax: 3,
  };
  return state;
}

function applyGeneratedWorld(state: GmState): void {
  applyWorldSeedPayload(state, buildWorldSeedPayload(generateWorld('budget-seed', 'space')));
  state.currentRoom = state.worldData?.startRoom ?? state.currentRoom;
  state.visitedRooms = [
    state.currentRoom,
    ...(state.mapState?.revealedZones?.slice(0, 2) ?? []).filter(zone => zone !== state.currentRoom),
  ];
}

function addQuestLogLoad(state: GmState): void {
  const quests: Quest[] = [
    {
      id: 'main_signal',
      title: 'Trace the signal lattice',
      status: 'active',
      type: 'main',
      priority: 'urgent',
      summary: 'Find the relay that is spoofing the quarantine beacon before the patrol window closes.',
      currentObjectiveId: 'relay',
      objectives: [
        { id: 'manifest', description: 'Recover the cargo manifest from customs.', completed: true },
        {
          id: 'relay',
          description: 'Reach the relay tower on Needle Gate.',
          completed: false,
          locationId: 'needle_gate',
        },
        {
          id: 'uplink',
          description: 'Patch the field scanner into the tower uplink.',
          completed: false,
          blockedReason: 'Requires a clean access card.',
          state: 'blocked',
        },
      ],
      clues: [
        {
          id: 'clue-1',
          text: 'The spoofed beacon keys off old customs frequencies.',
          source: 'Traffic archive',
          important: true,
        },
        { id: 'clue-2', text: 'Dockmaster Ilan logs a maintenance crawlspace behind the relay room.', scene: 11 },
        { id: 'clue-3', text: 'A Union patrol is due back before dawn.', source: 'Intercepted dispatch' },
      ],
      relatedNpcIds: ['ilan', 'mara'],
      relatedFactionIds: ['union'],
      relatedLocationIds: ['needle_gate', 'customs'],
      rewards: [
        { label: 'Cleared transit corridor', known: true, received: false },
        { label: 'Union access keys', known: true, received: false },
      ],
      consequences: ['If the patrol arrives first, the dock will lock down.'],
      discoveredAtScene: 9,
      updatedAtScene: 12,
    },
    {
      id: 'crew_mara',
      title: 'Mara wants the regulator cache',
      status: 'active',
      type: 'crew',
      priority: 'normal',
      summary: 'Recover the spare regulator stack before the next burn cycle.',
      objectives: [
        {
          id: 'locker',
          description: 'Open Locker C-19 in the maintenance spine.',
          completed: false,
          locationId: 'maintenance_spine',
        },
        { id: 'extract', description: 'Bring the regulator stack back to Mara.', completed: false, npcId: 'mara' },
      ],
      clues: [
        { id: 'clue-4', text: 'Locker C-19 was signed out to a ghost technician.', source: 'Maintenance ledger' },
        { id: 'clue-5', text: 'Mara keeps a bypass coil hidden in the med locker.' },
      ],
      relatedNpcIds: ['mara'],
      relatedLocationIds: ['maintenance_spine', 'engine_bay'],
      rewards: [{ label: 'Shield repair', known: true, received: false }],
      consequences: ['The ship stays vulnerable if the regulator is lost.'],
      discoveredAtScene: 10,
      updatedAtScene: 11,
    },
    {
      id: 'faction_broker',
      title: 'Broker leverage',
      status: 'active',
      type: 'faction',
      priority: 'normal',
      summary: 'Trade the customs manifest to the broker without exposing your route.',
      objectives: [
        { id: 'meet', description: 'Meet the broker in Archive Row.', completed: false, locationId: 'archive_row' },
        { id: 'price', description: 'Negotiate payment or passage.', completed: false, npcId: 'broker' },
      ],
      clues: [{ id: 'clue-6', text: 'The broker answers only to a sealed channel marked with a white slash.' }],
      relatedFactionIds: ['broker-guild'],
      relatedLocationIds: ['archive_row'],
      rewards: ['Smuggling route'],
      discoveredAtScene: 8,
      updatedAtScene: 12,
    },
    {
      id: 'rumour_hull',
      title: 'Hull whisper',
      status: 'active',
      type: 'rumour',
      priority: 'low',
      summary: 'Find out why the lower hull keeps venting warm air after curfew.',
      objectives: [
        { id: 'listen', description: 'Survey the lower hull after curfew.', completed: false, state: 'optional' },
        { id: 'report', description: 'Decide whether to tell the station watch.', completed: false },
      ],
      clues: [
        { id: 'clue-7', text: 'The venting began right after the audit team disappeared.', important: true },
        { id: 'clue-8', text: 'The lower hull routes near an abandoned shrine bay.' },
      ],
      rewards: [{ label: 'Hidden cache coordinates', known: false, received: false }],
      discoveredAtScene: 7,
      updatedAtScene: 10,
    },
    {
      id: 'side_patrol',
      title: 'Spoof the patrol log',
      status: 'completed',
      type: 'side',
      priority: 'normal',
      summary: 'Insert false timestamps into the patrol ledger.',
      objectives: [
        { id: 'tap', description: 'Gain access to the patrol terminal.', completed: true },
        { id: 'forge', description: 'Write the false shift log.', completed: true },
      ],
      clues: [{ id: 'clue-9', text: 'The patrol terminal still runs on the old slate build.' }],
      rewards: [{ label: 'One clear travel window', known: true, received: true }],
      discoveredAtScene: 6,
      updatedAtScene: 9,
    },
    {
      id: 'side_medbay',
      title: 'Quiet the medbay alarms',
      status: 'failed',
      type: 'side',
      priority: 'normal',
      summary: 'Stop the medbay alerts before security traces them.',
      objectives: [
        { id: 'mute', description: 'Mute the alert tree from the triage console.', completed: false, state: 'failed' },
      ],
      clues: [{ id: 'clue-10', text: 'The alerts were tied to an unauthorised bioscan.' }],
      consequences: ['Security logged your entry pattern.'],
      discoveredAtScene: 5,
      updatedAtScene: 8,
    },
  ];

  state.quests = quests;
  state.worldFlags.trackedQuestId = 'main_signal';
  state.worldFlags.questToast = 'Quest updated: Trace the signal lattice';
}

function addShipAndCrew(state: GmState): void {
  state.shipState = {
    name: 'Borrowed Tide',
    systems: {
      hull: { integrity: 82, status: 'operational', conditions: [] },
      engines: { integrity: 67, status: 'degraded', conditions: ['power ripple'] },
      power_core: { integrity: 74, status: 'operational', conditions: [] },
      life_support: { integrity: 91, status: 'operational', conditions: [] },
      weapons: { integrity: 58, status: 'degraded', conditions: ['misaligned'] },
      sensors: { integrity: 61, status: 'degraded', conditions: ['ghosting'] },
      shields: { integrity: 49, status: 'critical', conditions: ['unstable lattice'] },
    },
    powerAllocations: {
      engines: 3,
      life_support: 2,
      sensors: 2,
      shields: 3,
      weapons: 1,
    },
    repairParts: 11,
    scenesSinceRepair: 2,
  };
  state.crewMutations = [
    {
      id: 'mara',
      name: 'Mara',
      pronouns: 'she/her',
      role: 'engineer',
      morale: 71,
      stress: 34,
      loyalty: 82,
      status: 'injured',
      task: 'Rebuilding the shield relays',
    },
    {
      id: 'torv',
      name: 'Torv',
      pronouns: 'he/him',
      role: 'pilot',
      morale: 64,
      stress: 48,
      loyalty: 58,
      status: 'active',
      task: 'Holding the burn window',
    },
    {
      id: 'selen',
      name: 'Selen',
      pronouns: 'they/them',
      role: 'broker',
      morale: 52,
      stress: 41,
      loyalty: 60,
      status: 'active',
      task: 'Monitoring the dock feeds',
    },
  ];
  state.navPlottedCourse = ['Needle Gate', 'Harlow Drift', 'Morrow Span', 'Glass Reef'];
}

function createSceneBudgetState(): GmState {
  const state = baseState();
  applyGeneratedWorld(state);
  addQuestLogLoad(state);
  addShipAndCrew(state);
  state.modulesActive = [
    'core-systems',
    'lore-codex',
    'ship-systems',
    'crew-manifest',
    'star-chart',
    'geo-map',
    'atmosphere',
    'audio',
  ];
  state.codexMutations = state.codexMutations.map((entry, index) =>
    index < 4 ? { ...entry, state: index < 2 ? 'discovered' : 'partial', discoveredAt: 10 + index } : entry,
  );
  return state;
}

function createQuestLogBudgetState(): GmState {
  const state = baseState();
  addQuestLogLoad(state);
  return state;
}

function createMapBudgetState(): GmState {
  const state = baseState();
  applyGeneratedWorld(state);
  addQuestLogLoad(state);
  state.mapState = {
    activeMapType: 'settlement',
    mapId: 'needle-gate',
    mapName: 'Needle Gate Concourse',
    currentZone: 'needle_gate',
    visitedZones: ['needle_gate', 'customs', 'archive_row', 'lockyard'],
    revealedZones: ['needle_gate', 'customs', 'archive_row', 'lockyard', 'relay_spine', 'market_wake', 'outer_dock'],
    doorStates: {
      'needle_gate:customs': 'locked',
      'archive_row:relay_spine': 'sealed',
    },
    supplies: { rations: 5, water: 7 },
    zones: [
      {
        id: 'needle_gate',
        name: 'Needle Gate',
        x: 44,
        y: 44,
        width: 108,
        height: 48,
        status: 'current',
        description: 'Checkpoint ring with mirrored customs glass and a patchwork sensor arch.',
        encounters: ['customs sweep'],
        loot: ['dropped access chit'],
      },
      {
        id: 'customs',
        name: 'Customs Vault',
        x: 194,
        y: 44,
        width: 108,
        height: 48,
        status: 'locked',
        description: 'Ledger vault and sealed evidence lockers.',
        icon: 'objective',
      },
      {
        id: 'archive_row',
        name: 'Archive Row',
        x: 344,
        y: 44,
        width: 108,
        height: 48,
        status: 'visited',
        description: 'Broker stalls, vacuum-file kiosks, and quiet side booths.',
        encounters: ['broker contact'],
      },
      {
        id: 'lockyard',
        name: 'Lockyard',
        x: 44,
        y: 148,
        width: 108,
        height: 48,
        status: 'visited',
        description: 'Dockside cranes and cold-freight hooks.',
        threat: 'medium',
        loot: ['ion cutters'],
      },
      {
        id: 'relay_spine',
        name: 'Relay Spine',
        x: 194,
        y: 148,
        width: 108,
        height: 48,
        status: 'danger',
        description: 'Maintenance crawlspace behind the quarantine relay.',
        encounters: ['patrol sweep', 'shock hazard'],
        icon: 'danger',
      },
      {
        id: 'market_wake',
        name: 'Market Wake',
        x: 344,
        y: 148,
        width: 108,
        height: 48,
        status: 'safe',
        description: 'Open stalls and food steam under hanging guide lights.',
      },
      {
        id: 'outer_dock',
        name: 'Outer Dock',
        x: 494,
        y: 96,
        width: 108,
        height: 48,
        status: 'revealed',
        description: 'A wind-scoured docking arm facing the dark.',
        icon: 'exit',
      },
      {
        id: 'sealed_shrine',
        name: 'Sealed Shrine',
        x: 194,
        y: 252,
        width: 108,
        height: 48,
        status: 'unexplored',
        description: 'Abandoned shrine bay beneath the hull.',
      },
    ],
    connections: [
      { id: 'a', from: 'needle_gate', to: 'customs', type: 'door', travelTime: '2 min', status: 'locked' },
      { id: 'b', from: 'customs', to: 'archive_row', type: 'path', travelTime: '1 min', status: 'open' },
      { id: 'c', from: 'needle_gate', to: 'lockyard', type: 'path', travelTime: '3 min', status: 'open' },
      { id: 'd', from: 'lockyard', to: 'relay_spine', type: 'stairs', travelTime: '4 min', status: 'open' },
      { id: 'e', from: 'archive_row', to: 'relay_spine', type: 'door', travelTime: '2 min', status: 'sealed' },
      { id: 'f', from: 'archive_row', to: 'market_wake', type: 'path', travelTime: '2 min', status: 'open' },
      { id: 'g', from: 'market_wake', to: 'outer_dock', type: 'path', travelTime: '5 min', status: 'open' },
      { id: 'h', from: 'relay_spine', to: 'sealed_shrine', type: 'hidden', discovered: false, travelTime: '3 min' },
    ],
    travelLog: [{ from: 'lockyard', to: 'needle_gate', scene: 11 }],
  };
  return state;
}

function createFactionBoardBudgetState(): GmState {
  const state = baseState();
  applyGeneratedWorld(state);
  state.codexMutations = state.codexMutations.map(entry =>
    entry.category === 'faction' ? { ...entry, state: 'partial', discoveredAt: 12 } : entry,
  );
  return state;
}

function createRelationshipBudgetState(): GmState {
  const state = baseState();
  applyGeneratedWorld(state);
  addQuestLogLoad(state);
  state.quests = [
    ...state.quests,
    ...Array.from({ length: 12 }, (_, index) => ({
      id: `lead_${index + 1}`,
      title: `Lead ${index + 1}`,
      status: 'active' as const,
      type: 'rumour' as const,
      priority: 'normal' as const,
      objectives: [{ id: `lead_obj_${index + 1}`, description: `Follow lead ${index + 1}`, completed: false }],
      clues: [{ id: `lead_clue_${index + 1}`, text: `Clue thread ${index + 1}` }],
      relatedLocationIds: [state.worldData?.startRoom ?? 'needle_gate'],
    })),
  ];
  return state;
}

function createWorldPreviewState(): GmState {
  const state = baseState();
  applyGeneratedWorld(state);
  return state;
}

function createWorldAtlasState(): GmState {
  return createSceneBudgetState();
}

function createClueBoardState(): GmState {
  return createSceneBudgetState();
}

function createRoutePlannerState(): GmState {
  return createMapBudgetState();
}

function createDicePoolState(): GmState {
  return baseState();
}

export const REVIEWED_RENDER_FIXTURES = {
  'scene-rich-panels': {
    title: 'Scene Rich Panels',
    widget: 'scene',
    args: [
      '--data',
      JSON.stringify({
        brief: 'A pressure siren stutters once, then the concourse drops into a listening hush.',
        text: 'The relay tower sits behind smoked glass and customs mesh. Every second the spoofed beacon pulses through the deck under your boots. Mara keeps one hand on the scanner while the dock crowds ebb around the checkpoint, pretending not to watch you. A warm draft leaks from the maintenance seam behind the tower and carries the smell of ionised dust.',
        atmosphere: [
          'Ionised dust hangs under the customs lights.',
          'A siren dies away into station hum.',
          'Cold air leaks through the relay seam.',
          'The crowd keeps glancing at the tower and then away.',
        ],
        pois: [
          {
            id: 'mesh-window',
            title: 'Relay mesh',
            description: 'Study the smoked glass and the crawlspace hidden behind it.',
            prompt: 'Inspect the relay mesh and any hidden service access.',
          },
          {
            id: 'crowd-flow',
            title: 'Crowd flow',
            description: 'Read who is avoiding the customs line on purpose.',
            prompt: 'Watch the crowd flow and identify anyone signalling fear or recognition.',
          },
          {
            id: 'scanner-read',
            title: 'Field scanner',
            description: 'Let Mara sweep the tower casing for live current.',
            prompt: 'Have Mara scan the tower casing for bleed-off and maintenance gaps.',
          },
        ],
        actions: [
          {
            title: 'Slip through the crawlspace',
            description: 'Move now while the checkpoint rotates staff.',
            prompt: 'I slip through the crawlspace behind the relay before the checkpoint resets.',
            type: 'stealth',
            tone: 'risky',
            roll: { type: 'hazard', stat: 'DEX', dc: 14 },
          },
          {
            title: 'Lean on the broker contact',
            description: 'Force a fast answer on who is paying for the spoof.',
            prompt: 'I pressure the broker contact for the name behind the spoofed signal.',
            type: 'social',
            tone: 'tense',
            roll: { type: 'contest', stat: 'CHA', npc: 'broker', skill: 'Persuasion' },
          },
          {
            title: 'Spoof a maintenance order',
            description: 'Use the manifest to open the tower legally.',
            prompt: 'I spoof a maintenance order and walk straight to the relay access hatch.',
            type: 'tech',
            tone: 'bold',
            roll: { type: 'hazard', stat: 'INT', dc: 13 },
          },
          {
            title: 'Back off and map the exits',
            description: 'Keep the patrol window while you plan a cleaner line.',
            prompt: 'I back off, mark every exit route, and preserve the patrol window.',
            type: 'investigate',
            tone: 'careful',
          },
        ],
        audioRecipe: 'station_hum+warning_tone+footfall_echo',
        panelMode: 'compact',
      }),
    ],
    buildState: createSceneBudgetState,
  },
  'quest-log-rich': {
    title: 'Quest Log Rich',
    widget: 'quest-log',
    buildState: createQuestLogBudgetState,
  },
  'map-route-overlay': {
    title: 'Map Route Overlay',
    widget: 'map',
    args: ['--data', JSON.stringify({ route: { from: 'needle_gate', to: 'outer_dock' } })],
    buildState: createMapBudgetState,
  },
  'faction-board-worldgen': {
    title: 'Faction Board Worldgen',
    widget: 'faction-board',
    buildState: createFactionBoardBudgetState,
  },
  'relationship-web-worldgen': {
    title: 'Relationship Web Worldgen',
    widget: 'relationship-web',
    buildState: createRelationshipBudgetState,
  },
} satisfies Record<string, ReviewedRenderFixtureDefinition>;

export const PLAYWRIGHT_RENDER_FIXTURES = {
  ...REVIEWED_RENDER_FIXTURES,
  'route-planner-rich': {
    title: 'Route Planner Rich',
    widget: 'route-planner',
    args: ['--data', JSON.stringify({ from: 'needle_gate', to: 'outer_dock' })],
    buildState: createRoutePlannerState,
  },
  'world-preview-generated': {
    title: 'World Preview Generated',
    widget: 'world-preview',
    args: ['--data', JSON.stringify({ seed: 'preview-seed', theme: 'dungeon' })],
    buildState: createWorldPreviewState,
  },
  'world-atlas-worldgen': {
    title: 'World Atlas Worldgen',
    widget: 'world-atlas',
    buildState: createWorldAtlasState,
  },
  'clue-board-rich': {
    title: 'Clue Board Rich',
    widget: 'clue-board',
    buildState: createClueBoardState,
  },
  'dice-pool-volley': {
    title: 'Dice Pool Volley',
    widget: 'dice-pool',
    args: [
      '--data',
      JSON.stringify({
        label: 'Volley',
        pool: [
          { dieType: 'd6', count: 2 },
          { dieType: 'd8', count: 1 },
        ],
        modifier: 2,
      }),
    ],
    buildState: createDicePoolState,
  },
  'dialogue-faction': {
    title: 'Dialogue Faction',
    widget: 'dialogue',
    args: [
      '--data',
      JSON.stringify({
        text: 'The Survey Corp requires a contribution to the mission fund. Or perhaps you can use your influence?',
        npcName: 'Commander Vane',
        factionId: 'survey_corp',
        factionName: 'Survey Corp',
        choices: [
          { label: 'Pay Entry Fee', prompt: 'Pay 50 credits', requirements: { currency: 50 } },
          { label: 'Use Authority', prompt: 'I command you', requirements: { minStanding: 50 } },
          { label: 'Locked - Expensive', prompt: 'Too much', requirements: { currency: 500 } },
          { label: 'Locked - High Rank', prompt: 'Not enough rank', requirements: { minStanding: 100 } },
        ],
      }),
    ],
    buildState: () => {
      const state = baseState();
      state.factions = { survey_corp: 60 };
      if (state.character) state.character.currency = 100;
      return state;
    },
  },
} satisfies Record<string, ReviewedRenderFixtureDefinition>;

export type ReviewedRenderFixtureName = keyof typeof REVIEWED_RENDER_FIXTURES;
export type PlaywrightRenderFixtureName = keyof typeof PLAYWRIGHT_RENDER_FIXTURES;

export const REVIEWED_RENDER_FIXTURE_NAMES = Object.keys(
  REVIEWED_RENDER_FIXTURES,
).sort() as ReviewedRenderFixtureName[];
export const PLAYWRIGHT_RENDER_FIXTURE_NAMES = Object.keys(
  PLAYWRIGHT_RENDER_FIXTURES,
).sort() as PlaywrightRenderFixtureName[];

export async function withIsolatedRenderStateDir<T>(prefix: string, fn: () => Promise<T>): Promise<T> {
  const tempDir = mkdtempSync(join(tmpdir(), prefix));
  const originalEnv = process.env.TAG_STATE_DIR;
  process.env.TAG_STATE_DIR = tempDir;
  clearStateDirCache();
  writeFileSync(join(tempDir, '.last-sync'), signMarker(999), 'utf-8');
  writeFileSync(join(tempDir, '.verified-scenario'), signMarker(0), 'utf-8');
  writeFileSync(join(tempDir, '.verified-rules'), signMarker(0), 'utf-8');
  writeFileSync(join(tempDir, '.verified-character'), signMarker(0), 'utf-8');

  try {
    return await fn();
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
    if (originalEnv !== undefined) {
      process.env.TAG_STATE_DIR = originalEnv;
    } else {
      delete process.env.TAG_STATE_DIR;
    }
    clearStateDirCache();
  }
}

export async function renderPlaywrightFixture(name: PlaywrightRenderFixtureName): Promise<{
  title: string;
  widget: string;
  html: string;
}> {
  const fixture: ReviewedRenderFixtureDefinition = PLAYWRIGHT_RENDER_FIXTURES[name];
  return withIsolatedRenderStateDir('tag-reviewed-render-', async () => {
    await saveState(fixture.buildState());
    const result = await handleRender([fixture.widget, ...(fixture.args ?? []), '--raw']);
    if (!result.ok) {
      throw new Error(result.error?.message ?? `Render failed for ${name}.`);
    }
    return {
      title: fixture.title,
      widget: fixture.widget,
      html: result.data as string,
    };
  });
}

export async function renderReviewedFixture(name: ReviewedRenderFixtureName): Promise<{
  title: string;
  widget: string;
  html: string;
}> {
  return renderPlaywrightFixture(name);
}

export function localiseFixtureAssetUrls(html: string): string {
  return html.split(CDN_BASE).join('/assets');
}
