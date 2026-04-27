# Security Audit

Last reviewed: 2026-04-25

## Dependency Audit

- Command: `bun audit`
- Package root: `.claude/skills/text-adventure`
- Result on 2026-04-25: `No vulnerabilities found`
- Accepted risks on 2026-04-25: none recorded

## Package Surface Review

The reviewed distribution surface is the skill zip built by [scripts/zip.sh](/home/gareth/.vs/text-adventure-games/scripts/zip.sh).

Reviewed on 2026-04-25:

- `text-adventure.zip` excludes test trees, browser-test output, local scripts, docs, coverage, and `node_modules`
- required runtime assets remain present:
  - `SKILL.md`
  - `README.md`
  - `package.json`
  - `setup.sh`
  - `cli/tag.ts`
  - `assets/cdn-manifest.ts`
  - `assets/data/names/*.json`
- shipped text assets are checked for local-machine path leakage (`/home/`, `/Users/`, `file://`, Windows drive paths, and local preview URLs)

The repeatable audit coverage for this review lives in [package-surface.spec.ts](/home/gareth/.vs/text-adventure-games/.claude/skills/text-adventure/cli/tests/quality/package-surface.spec.ts).

## Path And File IO Review

Representative safe-path and traversal coverage already exists in the CLI tests, including:

- [save.spec.ts](/home/gareth/.vs/text-adventure-games/.claude/skills/text-adventure/cli/commands/save.spec.ts)
- [prose-check.spec.ts](/home/gareth/.vs/text-adventure-games/.claude/skills/text-adventure/cli/commands/prose-check.spec.ts)
- [path-security.ts](/home/gareth/.vs/text-adventure-games/.claude/skills/text-adventure/cli/lib/path-security.ts)

These cover home-directory resolution, traversal rejection, missing-file handling, and symlink-aware state storage behaviour.

## HTML And SVG Sanitisation Review

Direct sanitisation coverage remains under test for:

- SVG sprite generation and hostile SVG rejection in [build-css.spec.ts](/home/gareth/.vs/text-adventure-games/.claude/skills/text-adventure/cli/commands/build-css.spec.ts)
- HTML verification and SVG structural checks in [verify-checks.spec.ts](/home/gareth/.vs/text-adventure-games/.claude/skills/text-adventure/cli/lib/verify-checks.spec.ts)
- scenario logo sanitisation and client-side fallback handling in [scenario-select.spec.ts](/home/gareth/.vs/text-adventure-games/.claude/skills/text-adventure/cli/render/templates/scenario-select.spec.ts)
