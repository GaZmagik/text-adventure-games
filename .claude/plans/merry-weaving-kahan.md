# Plan: Per-Widget CSS Scoping

## Context

Every widget render includes ALL 31 `@extract` blocks from style-reference.md (~34KB) plus the full visual style CSS (~36-50KB). A scene widget includes 11 die-shape blocks it never uses. A dice widget includes 15 atmosphere blocks it never uses. Total CSS per widget: 69-84KB when most need 20-35KB.

## Approach: Labelled @extract blocks

Add scope labels to `/* @extract */` comments: `/* @extract:shared */`, `/* @extract:dice */`, `/* @extract:scene */`, etc. The extractor filters by widget type, always including `shared` blocks.

## Changes

### 1. Update `@extract` labels in `styles/style-reference.md` (~31 edits)

Replace each `/* @extract */` with a scoped label:

| Block(s) | Current | New label | Used by |
|----------|---------|-----------|---------|
| Panel overlay + close btn | `@extract` | `@extract:shared` | scene, character, all panel-using widgets |
| Die custom properties | `@extract` | `@extract:dice` | dice widget |
| Die size modifiers | `@extract` | `@extract:dice` | dice widget |
| Die base styles | `@extract` | `@extract:dice` | dice widget |
| Die d4-d100 shapes (7 blocks) | `@extract` | `@extract:dice` | dice widget |
| Check panel | `@extract` | `@extract:dice` | dice widget |
| Observation cards | `@extract` | `@extract:scene` | scene widget |
| Action cards | `@extract` | `@extract:shared` | scene, combat-turn, dialogue |
| Atmosphere particles (7 blocks) | `@extract` | `@extract:atmosphere` | scene widget (when atmosphere module active) |
| Atmosphere effects (shake, flash, letterbox) | `@extract` | `@extract:atmosphere` | scene widget |
| Atmosphere lighting | `@extract` | `@extract:atmosphere` | scene widget |
| Atmosphere degrade | `@extract` | `@extract:atmosphere` | scene widget |
| Time classes | `@extract` | `@extract:atmosphere` | scene widget |
| Status bar styles | `@extract` | `@extract:atmosphere` | scene widget |
| Toast notifications | `@extract` | `@extract:shared` | any widget |
| Handwritten/redacted | `@extract` | `@extract:scene` | scene widget |

### 2. Update `css-extractor.ts` (~20 lines)

Add optional `scopes` parameter to `extractAllCss`:

```typescript
export async function extractAllCss(
  filePath: string,
  scopes?: readonly string[],
): Promise<string>
```

**Extraction logic change:**
- Parse `/* @extract:SCOPE */` label from each block (regex: `/^\/\* @extract(?::(\w+))? \*\//`)
- If `scopes` is provided: include block if its scope is in `scopes` OR scope is `shared` OR scope is empty (backwards compat)
- If `scopes` is undefined: include all `@extract` blocks (backwards compatible — no change for existing callers)
- Cache key becomes `filePath + ':' + (scopes?.join(',') ?? '*')` to handle different scope requests for the same file

### 3. Update `render.ts` (~15 lines)

Add a `WIDGET_CSS_SCOPES` mapping:

```typescript
const WIDGET_CSS_SCOPES: Record<string, readonly string[]> = {
  scene:              ['shared', 'scene', 'atmosphere'],
  dice:               ['shared', 'dice'],
  'combat-turn':      ['shared', 'dice', 'scene'],
  character:          ['shared'],
  'character-creation': ['shared'],
  settings:           ['shared'],
  'scenario-select':  ['shared'],
  ship:               ['shared'],
  crew:               ['shared'],
  codex:              ['shared'],
  map:                ['shared'],
  starchart:          ['shared'],
  ticker:             ['shared'],
  footer:             ['shared'],
  'save-div':         ['shared'],
  levelup:            ['shared'],
  recap:              ['shared', 'dice'],
  dialogue:           ['shared'],
};
```

Pass scopes to `extractAllCss`:

```typescript
const scopes = WIDGET_CSS_SCOPES[widgetType];
const [styleCss, refCss] = await Promise.all([
  extractAllCss(styleFilePath),         // visual style: always full (theme vars needed)
  extractAllCss(styleRefPath, scopes),  // style-reference: scoped by widget type
]);
```

Note: Visual style files are NOT scoped — they contain theme-wide custom properties and class definitions that all widgets need. Only style-reference.md is scoped, since its blocks are functionally independent.

### 4. Update `css-extractor.spec.ts` (~5 tests)

- `extractAllCss with scopes filters to matching blocks` — pass `['dice']`, verify die CSS present, atmosphere absent
- `extractAllCss with scopes always includes shared` — pass `['scene']`, verify shared blocks present
- `extractAllCss without scopes returns all blocks (backwards compat)` — no scopes param, same as before
- `extractAllCss scopes use separate cache entries` — call with different scopes, verify different results
- `unlabelled @extract blocks included when scopes provided` — backwards compat for blocks without labels

## Expected size reduction

| Widget | Before | After (estimated) | Reduction |
|--------|--------|-------------------|-----------|
| scene | ~34KB ref | ~22KB (shared+scene+atmo) | ~35% |
| dice | ~34KB ref | ~16KB (shared+dice) | ~53% |
| character | ~34KB ref | ~5KB (shared only) | ~85% |
| settings | ~34KB ref | ~5KB (shared only) | ~85% |

Visual style CSS unchanged (~36-50KB). Total widget CSS drops from 69-84KB to 41-72KB for scene, 52-66KB for dice, and 41-55KB for simple widgets.

## Files modified

| File | Changes |
|------|---------|
| `styles/style-reference.md` | 31 `@extract` → `@extract:scope` labels |
| `cli/render/css-extractor.ts` | Add `scopes` param, parse labels, scope-aware caching |
| `cli/commands/render.ts` | Add `WIDGET_CSS_SCOPES` map, pass to extractor |
| `cli/render/css-extractor.spec.ts` | 5 new tests |

## Verification

1. `npx tsc --noEmit` — zero errors
2. `bun test` — all tests pass (existing + 5 new)
3. Manual: `tag render scene --style station` — verify scene CSS includes atmosphere but NOT dice shapes
4. Manual: `tag render dice --style station` — verify dice CSS includes die shapes but NOT atmosphere
5. Manual: `tag render character --style station` — verify minimal CSS (shared only)
6. Rebuild zip
