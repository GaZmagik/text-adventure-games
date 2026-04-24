import type { GmState, QuestObjectiveState, QuestPriority, QuestType } from '../../types';
import { esc } from '../../lib/html';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

type NormalizedObjective = {
  id: string;
  description: string;
  state: QuestObjectiveState;
  completed: boolean;
  optional: boolean;
  blockedReason?: string;
  npcId?: string;
  locationId?: string;
};

type NormalizedClue = {
  id: string;
  text: string;
  source?: string;
  scene?: number;
  important?: boolean;
};

type NormalizedReward = {
  label: string;
  known: boolean;
  received: boolean;
};

type NormalizedQuest = {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'failed';
  type: QuestType;
  priority: QuestPriority;
  summary: string;
  currentObjectiveId: string;
  objectives: NormalizedObjective[];
  clues: NormalizedClue[];
  relatedNpcIds: string[];
  relatedFactionIds: string[];
  relatedLocationIds: string[];
  rewards: NormalizedReward[];
  consequences: string[];
  discoveredAtScene: number | null;
  updatedAtScene: number | null;
};

const VALID_STATUS = new Set(['active', 'completed', 'failed']);
const VALID_TYPE = new Set<QuestType>(['main', 'side', 'crew', 'faction', 'rumour']);
const VALID_PRIORITY = new Set<QuestPriority>(['low', 'normal', 'urgent']);
const VALID_OBJECTIVE_STATE = new Set<QuestObjectiveState>([
  'active',
  'completed',
  'failed',
  'optional',
  'blocked',
  'hidden',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(item => stringValue(item)).filter(Boolean);
}

function numberOrNull(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function inferQuestType(quest: Record<string, unknown>, index: number): QuestType {
  const type = stringValue(quest.type);
  if (VALID_TYPE.has(type as QuestType)) return type as QuestType;
  if (index === 0) return 'main';
  const id = stringValue(quest.id).toLowerCase();
  if (id.includes('crew')) return 'crew';
  if (id.includes('faction')) return 'faction';
  if (id.includes('rumour') || id.includes('rumor') || id.includes('lead')) return 'rumour';
  return 'side';
}

function normalizeObjective(raw: unknown, index: number): NormalizedObjective {
  const obj = isRecord(raw) ? raw : {};
  const explicitState = stringValue(obj.state);
  const completed = obj.completed === true || obj.done === true;
  const state = VALID_OBJECTIVE_STATE.has(explicitState as QuestObjectiveState)
    ? (explicitState as QuestObjectiveState)
    : completed
      ? 'completed'
      : obj.blocked === true
        ? 'blocked'
        : obj.hidden === true
          ? 'hidden'
          : obj.optional === true
            ? 'optional'
            : 'active';
  const description = stringValue(obj.description, stringValue(obj.text, `Objective ${index + 1}`));
  const normalized: NormalizedObjective = {
    id: stringValue(obj.id, `objective-${index + 1}`),
    description,
    state,
    completed: state === 'completed' || completed,
    optional: state === 'optional' || obj.optional === true,
  };
  const blockedReason = stringValue(obj.blockedReason);
  if (blockedReason) normalized.blockedReason = blockedReason;
  const npcId = stringValue(obj.npcId);
  if (npcId) normalized.npcId = npcId;
  const locationId = stringValue(obj.locationId);
  if (locationId) normalized.locationId = locationId;
  return normalized;
}

function normalizeClue(raw: unknown, index: number): NormalizedClue {
  if (typeof raw === 'string') {
    return { id: `clue-${index + 1}`, text: raw };
  }
  const obj = isRecord(raw) ? raw : {};
  const clue: NormalizedClue = {
    id: stringValue(obj.id, `clue-${index + 1}`),
    text: stringValue(obj.text, stringValue(obj.description, `Clue ${index + 1}`)),
  };
  const source = stringValue(obj.source);
  if (source) clue.source = source;
  const scene = numberOrNull(obj.scene);
  if (scene !== null) clue.scene = scene;
  if (obj.important === true) clue.important = true;
  return clue;
}

function normalizeReward(raw: unknown): NormalizedReward | null {
  if (typeof raw === 'string') {
    return { label: raw, known: true, received: false };
  }
  if (!isRecord(raw)) return null;
  const label = stringValue(raw.label, stringValue(raw.name));
  if (!label) return null;
  return {
    label,
    known: raw.known !== false,
    received: raw.received === true,
  };
}

function normalizeQuest(raw: unknown, index: number, currentScene: number): NormalizedQuest | null {
  if (!isRecord(raw)) return null;
  const title = stringValue(raw.title, stringValue(raw.id, `Quest ${index + 1}`));
  const rawStatus = stringValue(raw.status, 'active');
  const status = VALID_STATUS.has(rawStatus) ? (rawStatus as 'active' | 'completed' | 'failed') : 'active';
  const rawPriority = stringValue(raw.priority, 'normal');
  const priority = VALID_PRIORITY.has(rawPriority as QuestPriority) ? (rawPriority as QuestPriority) : 'normal';
  const objectives = Array.isArray(raw.objectives) ? raw.objectives.map(normalizeObjective) : [];
  const currentObjective =
    stringValue(raw.currentObjectiveId) ||
    objectives.find(objective => objective.state === 'active')?.id ||
    objectives.find(objective => objective.state === 'optional')?.id ||
    objectives[0]?.id ||
    '';
  const clues = Array.isArray(raw.clues) ? raw.clues.map(normalizeClue) : [];
  const rewards = Array.isArray(raw.rewards)
    ? raw.rewards.map(normalizeReward).filter((reward): reward is NormalizedReward => reward !== null)
    : [];
  const discoveredAtScene = numberOrNull(raw.discoveredAtScene);
  const updatedAtScene = numberOrNull(raw.updatedAtScene);

  return {
    id: stringValue(raw.id, `quest-${index + 1}`),
    title,
    status,
    type: inferQuestType(raw, index),
    priority,
    summary: stringValue(raw.summary, stringValue(raw.description)),
    currentObjectiveId: currentObjective,
    objectives,
    clues,
    relatedNpcIds: stringArray(raw.relatedNpcIds),
    relatedFactionIds: stringArray(raw.relatedFactionIds),
    relatedLocationIds: stringArray(raw.relatedLocationIds),
    rewards,
    consequences: stringArray(raw.consequences),
    discoveredAtScene: discoveredAtScene ?? currentScene,
    updatedAtScene,
  };
}

function buildQuestLogFallback(quests: NormalizedQuest[]): string {
  const active = quests.filter(quest => quest.status === 'active').length;
  return `<div class="widget-quest-log"><div class="widget-title">Quest Log</div><p class="quest-summary">${esc(active)} active / ${esc(quests.length)} total</p></div>`;
}

function readTrackedQuestId(state: GmState | null): string {
  const flags = state?.worldFlags ?? {};
  const tracked = flags.trackedQuestId ?? flags.trackedQuest;
  return typeof tracked === 'string' ? tracked : '';
}

/**
 * Renders the quest log widget.
 *
 * @param state - Current game state.
 * @param styleName - Visual style.
 * @param options - Optional data override containing quests[].
 * @returns HTML wrapped in a <ta-quest-log> custom element.
 */
export function renderQuestLog(state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  const rawData = isRecord(options?.data) ? options.data : {};
  const source = Array.isArray(rawData.quests) ? rawData.quests : (state?.quests ?? []);
  const currentScene = Number(state?.scene) || 0;
  const quests = source
    .map((quest, index) => normalizeQuest(quest, index, currentScene))
    .filter((quest): quest is NormalizedQuest => quest !== null);

  return emitStandaloneCustomElement({
    tag: 'ta-quest-log',
    styleName,
    html: buildQuestLogFallback(quests),
    attrs: {
      'data-quests': JSON.stringify(quests),
      'data-current-scene': String(currentScene),
      'data-tracked-quest': readTrackedQuestId(state),
    },
  });
}
