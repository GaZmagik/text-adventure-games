// Faction command handlers expose generated-world faction state without revealing locked codex secrets.
import type { CommandResult, GmState } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState } from '../lib/state-store';

const VALID_SUBCOMMANDS = ['inspect'] as const;

function standingLabel(value: number): string {
  if (value <= -50) return 'hostile';
  if (value < -15) return 'tense';
  if (value <= 15) return 'neutral';
  if (value < 50) return 'friendly';
  return 'allied';
}

function visibleCodex(state: GmState, factionId: string) {
  const entry = state.codexMutations.find(item => item.id === `faction_${factionId}`);
  const visible = entry?.state === 'partial' || entry?.state === 'discovered' || entry?.state === 'redacted';
  return { entry, visible };
}

async function handleInspect(args: string[]): Promise<CommandResult> {
  const factionId = args[0];
  if (!factionId) {
    return fail('No faction id provided.', 'Usage: tag faction inspect <faction-id>', 'faction inspect');
  }

  const state = await tryLoadState();
  if (!state) return noState('faction');

  const worldFaction = state.worldData?.factions.factions.find(faction => faction.id === factionId);
  const standingValue = state.factions[factionId] ?? worldFaction?.disposition;
  if (!worldFaction && standingValue === undefined) {
    return fail(
      `Faction "${factionId}" not found.`,
      'Check faction IDs with: tag state get factions or tag render faction-board',
      'faction inspect',
    );
  }

  const standing = Number(standingValue ?? 0);
  const { entry, visible } = visibleCodex(state, factionId);
  const knownFactionIds = new Set([
    ...Object.keys(state.factions ?? {}),
    ...(state.worldData?.factions.factions ?? []).map(faction => faction.id),
  ]);
  const relations = Object.entries(state.worldData?.factions.relations ?? {})
    .filter(([pair]) => pair === factionId || pair.startsWith(`${factionId}_`) || pair.endsWith(`_${factionId}`))
    .map(([pair, status]) => {
      let other = pair.startsWith(`${factionId}_`)
        ? pair.slice(factionId.length + 1)
        : pair.endsWith(`_${factionId}`)
          ? pair.slice(0, Math.max(0, pair.length - factionId.length - 1))
          : '';
      if (!knownFactionIds.has(other)) {
        other =
          [...knownFactionIds].find(
            id => id !== factionId && (pair === `${factionId}_${id}` || pair === `${id}_${factionId}`),
          ) ?? other;
      }
      const otherFaction = state.worldData?.factions.factions.find(faction => faction.id === other);
      return { pair, other, otherLabel: otherFaction?.name ?? other, status };
    });
  const territory = (worldFaction?.territory ?? []).map(
    id => state.worldData?.rooms?.[id]?.name ?? state.mapState?.zones?.find(zone => zone.id === id)?.name ?? id,
  );
  const relatedQuests = state.quests
    .filter(quest => quest.relatedFactionIds?.includes(factionId))
    .map(quest => ({ id: quest.id, title: quest.title, status: quest.status }));

  return ok(
    {
      id: factionId,
      name: visible ? (entry?.title ?? worldFaction?.name ?? factionId) : 'Unknown faction',
      visible,
      standing,
      standingLabel: standingLabel(standing),
      ideology: visible ? (worldFaction?.ideology ?? '') : '',
      territory,
      relations,
      relatedQuests,
      codex: entry ?? null,
    },
    'faction inspect',
  );
}

export async function handleFaction(args: string[]): Promise<CommandResult> {
  const subcommand = args[0];
  if (!subcommand) {
    return fail(
      'No subcommand provided.',
      `Valid subcommands: ${VALID_SUBCOMMANDS.join(', ')}. Run: tag faction --help`,
      'faction',
    );
  }

  switch (subcommand) {
    case 'inspect':
      return handleInspect(args.slice(1));
    default:
      return fail(
        `Unknown subcommand: "${subcommand}".`,
        `Valid subcommands: ${VALID_SUBCOMMANDS.join(', ')}`,
        'faction',
      );
  }
}
