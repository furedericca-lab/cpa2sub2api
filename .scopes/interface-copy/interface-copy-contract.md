---
description: Rewrite user-facing copy around file conversion and import tasks.
status: in_progress
---

# Interface Copy Contract

## Context

The owner requested natural, concise, task-focused Chinese website copy after
real-file compatibility verification. The existing site is published on Pages.

## Findings

The interface repeats privacy slogans, exposes implementation terminology,
labels converted accounts as usable, and describes limitations abstractly.

## Outcome

Pending copy changes and browser acceptance.

## Goals / Non-goals

Clarify file selection, conversion results, import steps, account warnings and
credential handling. Preserve layout, mappings, state, storage and export behavior.
Do not use real credentials in tests, snapshots, logs or documentation.

## Target Files / Modules

front/src/App.tsx, front/src/components/ConversionGuide.tsx, front/index.html,
src/conversion/converter.ts, adjacent unit/browser tests and architecture Wiki.

## Constraints

Use concrete language and actionable guidance; keep security facts accurate.
Converted output is not evidence of active provider credentials. Keep the
existing visual hierarchy and keyboard-accessible controls.

## Boundaries

No conversion or authentication behavior changes. Publish source to the existing
origin main and update the previously authorized Pages project/account only.

## Decision Summary

Keep the quiet two-pane workspace. Replace slogans and repeated qualifiers with
task labels, next actions and one relevant safety reminder per context.

## Verification Surface

pnpm check, pnpm verify:dist and browser:smoke. Inspect desktop/mobile and guide
screenshots, expiry feedback, download/copy guidance and actual Pages responses.

## Escalation Triggers

Unrelated worktree edits or deployment/access failures outside this target.

## Rollback

Restore the affected copy commit and redeploy its prior static build if needed.
Do not mutate DNS, account settings, vendor sources or private user files.

## Open Questions

None.

## Execution Log / Evidence Updates

- Inspected the page, guide, conversion warnings, existing tests and clean Git state.
- Rewrote the title, file/import instructions, result labels, empty state,
  settings/storage feedback, preview/copy/download notices and help guide.
- Converted account counts now describe conversion rather than token usability.
- Rephrased warnings for expired/missing credentials, disabled status, proxies
  and source-service management settings; no conversion branches changed.
- React review: hook ordering, state transitions, list keys, controlled inputs,
  escaping, dialog focus handling and accessible control labels preserved.
- pnpm check: typecheck, 73 unit tests, production build and vendors passed.
- pnpm verify:dist passed; browser:smoke passed all 7 tests, including the new
  import/expiry/clipboard guidance and modal keyboard-navigation regression.
- Inspected desktop/mobile conversion and mobile guide screenshots. Layout and
  controls remain readable; no horizontal overflow in the tested narrow viewport.
