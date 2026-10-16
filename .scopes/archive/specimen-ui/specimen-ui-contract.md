# Specimen UI Contract

## Context

Restyle the existing browser-local converter using the user's Specimen
userscript as a visual reference, not a source of new runtime features.

## Findings

The current React workspace uses sage/green tokens and hardcoded colors.
Conversion, file inputs, downloads and the help dialog already have browser tests.

## Outcome

Completed: implemented and locally verified a warm-white, orange-accented
conversion workspace. Publication and deployment remain outside this task.

## Goals / Non-goals

Match the reference's italic heading, numbered navigation, outlined controls,
account cards, pale code preview and notice strips. Preserve all conversion
behavior and concise Chinese copy. Do not add payment, session or proxy features.

## Target Files / Modules

`front/src/tokens.css`, `front/src/styles.css`, `front/src/App.tsx`,
`front/public/favicon.svg`, `test/browser/converter.spec.ts`,
`.wiki/concepts/architecture.md`.

## Constraints

Use local system fonts, existing dependencies and production CSP. Credentials
remain transient and previews masked by default. Use synthetic test data only.

## Boundaries

No converter/vendor changes, new services, remote fonts, credential storage,
Git publication or Cloudflare deployment as part of this local UI task.

## Decision Summary

Keep the standalone two-pane workbench. Use white surfaces, warm gray dividers,
`#ff5722` primary actions, pale orange icon tiles, numbered underline navigation,
6–12px radii and restrained shadows. Retain provider-specific identity colors.
Use a darker orange for small foreground text and `#d13d16` behind small white
button labels to preserve at least 4.5:1 contrast.

## Verification Surface

Run `pnpm check`, `pnpm verify:dist`, and `pnpm browser:smoke`.
Inspect desktop/mobile empty, results and help screenshots. Test computed colors,
selection/disabled/focus states and overflow at 320, 390, 768 and 1440px.
Existing tests cover download contents, masking, clearing and request isolation.

## Escalation Triggers

Only a required new external resource or conversion behavior change warrants a
scope decision. Ordinary reversible styling and layout fixes proceed locally.

## Rollback

Restore only this task's frontend, test and documentation changes. No data or
host changes are needed.

## Open Questions

None. The reference supplies the visual direction.

## Execution Log / Evidence Updates

- Inspected clean `main`, current components, styles, tests and repository rules.
- Updated shared tokens, all workspace states, title, numbered direction
  navigation, account cards, preview, help dialog and favicon. Conversion logic,
  credential persistence rules, dependencies and CSP are unchanged.
- `pnpm check`: typecheck, 73 unit tests, production build and both pinned vendor
  content/commit checks passed.
- After the final contrast adjustment, `pnpm build`, `pnpm verify:dist` and
  `pnpm browser:smoke` passed; all 8 browser tests passed.
- New browser assertions cover 320, 390, 768 and 1440px, direction pressed state,
  neutral disabled controls, orange enabled controls, at least 4.5:1 primary
  label contrast, keyboard outline, selected account border, code-panel color,
  responsive pane arrangement, dialog overflow and result invalidation.
- Inspected `test-results/desktop-empty.png`, `desktop-results.png`,
  `mobile-empty.png`, `mobile-results.png`, `desktop-guide.png` and
  `mobile-guide.png`. No clipped controls or horizontal overflow observed;
  long guide content scrolls inside the dialog. Screenshots use synthetic data
  and remain ignored local test artifacts.
- Existing browser coverage passed for actual JSON/ZIP downloads, both
  directions, clipboard masking/reveal, reload clearing, partial failures and
  absence of external runtime requests.
- Wiki alignment: updated `.wiki/concepts/architecture.md` with the visual
  system and accessibility adjustments. No production deployment was attempted.


## Archive Record

- Archived on 2026-10-16 under `.scopes/archive/specimen-ui/`.
- Archive purpose: preserve the completed specimen-ui audit trail.
- Future enhancements should use a new scope under `.scopes/<enhancement-scope>/`.
- Archived docs should only change for factual errata or path-maintenance updates.
