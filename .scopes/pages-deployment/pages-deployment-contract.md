---
description: Create and verify the first static Cloudflare Pages deployment.
status: in_progress
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

Pending deployment and live verification.

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
