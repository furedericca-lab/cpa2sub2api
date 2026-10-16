---
description: Create and verify the first static Cloudflare Pages deployment.
status: completed
---

# Pages Deployment Contract

## Context

The owner authorized project creation and deployment after selecting the
Cloudflare account associated with momoe.org. Application source is published
on main; the static build is dist/.

## Findings

- wrangler.jsonc names project cpa2sub2api; scripts/pages-deploy.mjs pins account
  d7bf5987a206b7ea342add617a9d9dcd through the deployment process environment.
- Production output contains an HTML entry, local JS/CSS assets and _headers.
- The account previously returned an empty Pages project list.

## Outcome

Created and deployed the static project to https://cpa2sub2api-e3k.pages.dev/.
Live API, HTTPS artifact, effective-header and real-browser checks passed.

## Goals / Non-goals

Create cpa2sub2api with production branch main, deploy dist/, and verify HTTPS,
response security headers, synthetic conversion, downloads and browser privacy.
Do not configure custom domains, DNS, GitHub integration, billing, analytics,
Functions, Workers, or unrelated account settings.

## Target Files / Modules

wrangler.jsonc, package.json, scripts/pages-deploy.mjs, dist/ (generated only), README.md,
.wiki/how-to/cloudflare-pages.md, and this contract.

## Constraints

Use cloudflare-use guidance and the selected account's existing private token.
Never print or persist credentials. Upload only verified static build assets.

## Boundaries

Remote mutations are limited to project creation and production deployment.
Git publication remains authorized to the existing origin main.

## Decision Summary

Use Direct Upload of the existing production build. Do not link GitHub or
change momoe.org DNS. The Pages-generated domain is the initial public URL.

## Verification Surface

Build and dist validation; account/project API checks; deployment success;
HTTPS HTML and asset hashes; effective CSP; real-browser bidirectional synthetic
conversion and JSON/ZIP downloads; no external runtime requests; reload clearing.

## Escalation Triggers

Missing write permissions, conflicting existing project ownership/settings,
or account-required external approval. Report actual remote state on failure.

## Rollback

No prior production deployment exists to restore. A newly created project can
be removed only with explicit deletion authorization; do not delete it as
automatic cleanup after a failed upload. Do not alter existing account resources.

## Open Questions

None blocking the authorized initial deployment.

## Execution Log / Evidence Updates

- pnpm build and pnpm verify:dist passed before remote mutation.
- Current official Direct Upload and Pages project-creation documentation retrieved.
- Project-pinned Wrangler 4.151.1 and exact create/deploy help inspected.
- Project creation succeeded; Cloudflare assigned cpa2sub2api-e3k.pages.dev.
- First upload stopped at local validation: Pages rejects account_id in
  wrangler.jsonc. Removed the unsupported property and added a portable
  deployment helper that pins CLOUDFLARE_ACCOUNT_ID instead.
- pnpm typecheck and 73 unit tests passed; both pinned vendors verified.
- pnpm pages:deploy passed using the selected account's private API token;
  no credential was printed or added to repository files.
- Deployment a6d1a8e3-bc1b-412d-a319-20fbd021b37e finished at
  2026-10-16T12:55:04Z from source f00a365c0b48380fb9a8e75f0cf270c79585e7a0.
  The API confirms success, production/main, no Functions and no analytics tag.
- Production HTML/JS/CSS bytes match dist/; SHA-256 evidence:
  - index.html: 4056790a11204fa5dd394c200eff0b79667b4f4aa00f158e017eebd6faebcfa0
  - JS: 548564b05f161ba5893007177b1a1d8959964114eca6e2caca0821200e2f1845
  - CSS: b9a53f0347a5421d96746843daf125e176d582380f1fde2859e7ca3e20c90eff
- Native production headers contain connect-src none, self-only script/style,
  frame-ancestors none, nosniff, DENY and no-referrer.
- Unmodified production Chromium acceptance passed four-provider forward/reverse
  conversion, masked preview, unsupported-account isolation, individual/merged
  JSON and ZIP downloads, no credential persistence, reload clearing, desktop
  and 390px layout, zero external runtime requests and zero page errors.
  Actual connect-src CSP blocked a hostile fetch. Screenshots were inspected.
- Residual limits: synthetic credentials only; live OAuth acceptance, custom
  domains and automatic Git-based deployments were not configured or tested.


## Archive Record

- Archived on 2026-10-16 under `.scopes/archive/pages-deployment/`.
- Archive purpose: preserve the completed pages-deployment audit trail.
- Future enhancements should use a new scope under `.scopes/<enhancement-scope>/`.
- Archived docs should only change for factual errata or path-maintenance updates.
