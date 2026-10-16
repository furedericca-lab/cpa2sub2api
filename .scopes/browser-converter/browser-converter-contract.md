---
description: Local-only bidirectional CPA and sub2api conversion with static Pages deployment.
status: in-progress
---

# Browser Converter Contract

## Context

The user requested a new Git repository at `/root/work/CPA2Sub2API`, complete
sub2api and CLIProxyAPI sources under `vendor/`, bidirectional conversion informed
by gtxx3600/CPA2sub2API, and a static Vite/React/TypeScript Cloudflare Pages site.
Use the `aweb-service` documentation, source-layout and pnpm conventions without
copying its server, database or production operations.

## Findings

- The target directory was empty before `git init -b main`.
- Current `aweb-service` uses root pnpm 12.10.1, TypeScript 7.0.2, `front/`,
  `src/`, `test/`, `scripts/`, vendored sources, `.wiki/` and `.scopes/`.
- `vendor/sub2api/backend/internal/handler/admin/account_data.go` defines the version-1
  `sub2api-data` bundle and preserves arbitrary account `extra` metadata.
- CLIProxyAPI token stores and `vendor/CLIProxyAPI/sdk/auth/antigravity.go` define native
  token fields. The reference browser converter supports four OAuth providers.
- The user subsequently created `furedericca-lab/cpa2sub2api` and explicitly
  authorized commit/push after implementation. Cloudflare deployment is not requested.

## Outcome

Complete when both pinned vendors are reproducible, browser-local conversion
works in both directions with explicit errors/limitations, static output is
ready for Pages, tests exercise actual exports and privacy, and current Wiki
explains the architecture, mappings, deployment and maintenance.

## Goals / Non-goals

Goals: four-provider OAuth mapping, batch file/directory/paste input, merged
sub2api JSON, individual files and ZIP export, default-redacted preview, explicit
warnings, responsive operator UI, and nonsecret preferences only.

Non-goals: live token verification/refresh, service APIs, full configuration
backup, Worker/Functions/backend, API-key conversion, active cross-service proxy
mapping, account deduplication or Cloudflare deployment.

## Target files / modules

- `src/conversion/`
- `front/src/`, `front/public/`, `front/vite.config.ts`, `front/index.html`
- `test/fixtures/`, `test/unit/`, `test/browser/`, root build/test configs
- `scripts/`, `vendor/`, `wrangler.jsonc`, root package and lockfile
- `README.md`, `AGENTS.md`, `THIRD_PARTY.md`, `.wiki/`

## Constraints

- One root pnpm workspace; vendors are source evidence, not built dependencies.
- Credentials never persist to browser storage or logs; preview masks by default.
- Strict production CSP blocks application network connections and inline code.
- All test data is synthetic; no access to real credential exports.
- Preserve supported credential fields, order and repeated accounts; collision-safe
  filenames; bound input size, object count and nesting.
- Repository documents are English; operator-facing UI copy is Chinese.

## Boundaries

Allowed: initialize local Git; create the application and documentation; fetch
public snapshots; install project-local dependencies/browser; local tests; commit
and push the completed repository to `https://github.com/furedericca-lab/cpa2sub2api`.

Forbidden: Cloudflare/account mutation, deployment, force-push, real credentials,
vendor application startup, host configuration edits or unrelated repository edits.

## Decision Summary

| Decision | Evidence Source | Evidence Strength | Conflict | Result | Confidence Reason |
| --- | --- | --- | --- | --- | --- |
| Static local-only application | User and reference app | High | None | React memory, no server or router | One screen has no remote data requirement |
| Root pnpm and separate frontend/core/tests | Current aweb-service | High | None | pnpm 12.10.1 and TS 7.0.2 | Matches requested development habits |
| Complete pinned vendor submodules | User, upstream trees and rejected push evidence | High | Resolved | Gitlinks plus content manifest | Preserves upstream source without copying OAuth constants into parent history |
| Native mapping with explicit limitations | Pinned Go schemas | High | None | Typed core and versioned envelope | No invented full-configuration parity |
| Quiet local-workspace UI | Operator workflow | Medium | None | Off-white, forest accent, numbered panes | Import, inspect and export remain explicit |

## Verification surface

- `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm verify:vendor`.
- `pnpm verify:dist`: bundled static assets and security headers only.
- `pnpm browser:smoke`: production CSP, desktop/narrow viewports, input/errors,
  default masking, selection, real JSON/ZIP downloads, reload clearing, no remote
  requests, blocked-storage tolerance and keyboard dismissal.
- Local `pnpm pages:dev` response headers, not remote deployment.
- Wiki rebuild/lint/doctor, Scope check, Git whitespace and ignored paths.

## Escalation triggers

Only unsupported product decisions, incompatibility not resolvable from source,
destructive work, or a request requiring remote account/deployment access.
Routine local implementation and validation remain authorized.

## Rollback

No preexisting project content was changed. Stop task-owned local preview/emulator
processes. Preserve the new repository; do not remove it without user direction.
No service cutover, external resource or durable user data is involved.

## Open questions

None. The remote Git target is user-provided; Cloudflare account/deployment remain
out of scope.

## Execution log / evidence updates

- Initialized local `main` Git repository and inspected live `aweb-service`.
- Imported upstream snapshots and generated `vendor/vendor-lock.json`; 4338
  sub2api files and 1977 CLIProxyAPI files, original licenses retained.
- Implemented typed conversion, React UI, Pages headers/config, allowlisted
  preferences, JSON/ZIP export and synthetic tests.
- Initial type check, 68 unit tests, production build and static verification PASS.
- Initial browser smoke could not launch because matching Chromium was absent;
  installed the matching browser. Final acceptance now passes: 73 unit tests,
  six browser tests including directory and drag/drop imports, real downloads,
  filtering, CSP, persistence boundaries, narrow layout and keyboard dismissal.
- Inspected desktop and mobile screenshots and improved secondary-text contrast.
- `pnpm check`, `pnpm verify:dist`, vendor integrity and frozen-lock installation
  pass. Explicitly approved project-local `workerd`/`esbuild` build scripts.
- Wrangler 4.151.1 local Pages runtime served the security headers, converted and
  downloaded a synthetic account, made no external application requests, and
  blocked a hostile fetch under CSP. No Functions source is present.
- Inspected the user-provided Git remote: no existing branch heads.
- Initial push was rejected by GitHub GH013 push protection because complete
  inline upstream trees include built-in Google OAuth client constants. No
  protection bypass was used and no remote branch was created.
- Converted the unchanged local vendor trees to pinned Git submodules, retaining
  the same commits and content digests. Updated cloning/verification instructions.
  Replacing the rejected, unpublished root commit removes inline vendor content
  from the publishable history. No force-push or upstream mutation is required.
- Initial registry download reset; retried via a pnpm mirror for project
  dependencies only, without changing host-wide registry configuration.
