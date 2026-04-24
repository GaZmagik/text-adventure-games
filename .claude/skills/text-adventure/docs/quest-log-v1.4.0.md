# Quest Log v1.4.0 Implementation Status

## Goal

Make quests feel like an active game system instead of a static checklist. The v1.4.0 slice adds a first-class `quest-log` widget that can render standalone through the CLI and inside the existing scene footer panel.

The implementation must keep widget HTML small by using the existing CDN-backed custom element runtime:

- `tag render quest-log` emits a compact `<ta-quest-log>` element with JSON data attributes.
- Runtime rendering, layout, tabs, and click handling live in `assets/js/ta-components.js`.
- CSS comes from CDN theme assets through the existing `emitStandaloneCustomElement` path.
- Scene embeds use the bare custom element because `ta-scene` already loads `ta-components.js`.

## Scope

### Included in v1.4.0

- `tag render quest-log --style <style>`.
- `ta-quest-log` in the custom element runtime.
- Compact scene quest panel backed by `<ta-quest-log>`.
- Older `gmState.quests` normalization so existing saves keep working.
- Tabs for active, completed, failed, and leads.
- Quest type, status, priority, current objective, objective progress, clues, rewards, and related NPC/location/faction chips.
- Prompt buttons for tracking, reviewing clues, asking about a quest, travelling toward a related location, and turning in completed-objective quests.
- Dedicated quest update toast component.
- Tracked quest badge in the scene status bar.
- Quest authoring helpers through `tag quest create`.
- Stateful client-side quest expansion across renders.
- Verification and tests for the new widget.
- CDN JS/CSS manifests rebuilt for v1.4.0.

### Related v1.4.0 Surfaces

- `tag quest inspect <quest-id>` returns quest progress, tracking state, and canonical flags.
- `tag quest track <quest-id>` stores `worldFlags.trackedQuestId` and emits a quest toast.
- `tag quest create --id <id> --title "<title>" --objective-id <id> --objective "<text>"` creates a save-compatible quest without migration.
- `tag faction inspect <faction-id>` and `ta-faction-board` cover the faction standing surface that was originally listed as deferred.

## Data Compatibility

The current quest shape remains valid:

```ts
type Quest = {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'failed';
  objectives: Array<{ id: string; description: string; completed: boolean }>;
  clues: string[];
};
```

The renderer accepts richer optional fields when present:

```ts
type QuestType = 'main' | 'side' | 'crew' | 'faction' | 'rumour';
type QuestPriority = 'low' | 'normal' | 'urgent';
type QuestObjectiveState = 'active' | 'completed' | 'failed' | 'optional' | 'blocked' | 'hidden';
```

Older objective forms such as `{ text, done }` are normalized into the new display shape. String clues are normalized into clue objects.

## CLI Integration

Files to update:

- `cli/render/templates/quest-log.ts`
- `cli/render/templates/quest-log.spec.ts`
- `cli/commands/render.ts`
- `cli/render/templates/scene.ts`
- `cli/types.ts`
- `cli/metadata.ts`
- `cli/lib/verify-checks.ts`
- `cli/commands/verify.ts`
- `cli/manual.md`
- `README.md`
- `SKILL.md`

## Runtime Integration

`TaQuestLog` lives in `cli/render/lib/ta-components.ts`, then `tag build-css --release v1.4.0` regenerates:

- `assets/js/ta-components.js`
- `assets/cdn-manifest.ts`

This keeps the rendered HTML payload small and cacheable.

## UX Notes

The quest log is an in-game tool surface, so it should be compact, scannable, and action-oriented:

- No marketing copy.
- No explanatory onboarding text.
- Tabs are functional filters.
- The selected quest detail panel should expose the next useful player action.
- Prompt buttons must remain copyable when `sendPrompt()` is unavailable.
