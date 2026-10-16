---
title: Deploy Static Assets To Cloudflare Pages
type: how-to
status: current
scope: browser-converter
related_files:
  - wrangler.jsonc
  - front/public/_headers
  - front/vite.config.ts
  - scripts/verify-dist.mjs
  - package.json
tags: [deployment, cloudflare, security]
last_checked: 2026-10-16
updated: 2026-10-16T12:49:04Z
---

# Deploy Static Assets To Cloudflare Pages

## Local Build And Emulation

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm verify:dist
pnpm pages:dev
```

The project-local pinned Wrangler reads `wrangler.jsonc`, serves `dist/` and
applies Pages `_headers` locally. It binds loopback; it does not deploy or require
an account mutation. Do not use Vite preview to prove Pages header processing:
Vite serves `_headers` as a file rather than interpreting it.

## Git Integration

After explicitly authorizing creation/publication of the Git remote, connect it
through Cloudflare Workers & Pages → Create application → Pages → Import an
existing Git repository. Use repository root, production branch `main`, build
command `pnpm build` and output `dist`. Set `NODE_VERSION=22.19.0` or a newer
compatible version and `PNPM_VERSION=12.10.1`; use the current Pages build image.
The vendor package managers and vendor Go modules must not be executed.
The Vite build needs no initialized vendor submodules. Source-backed tests and
`pnpm check` require `git submodule update --init --recursive` in environments
that do not clone submodules automatically.

For reproducible explicit dependency installation, Pages also supports
`SKIP_DEPENDENCY_INSTALL=1` with the build command
`pnpm install --frozen-lockfile && pnpm build`. Do not put account credentials,
OAuth tokens or input files in build environment variables or repository files.

## Direct Upload

Only after the owner authorizes a target Cloudflare account/project, check the
local Wrangler version/help, authenticate locally without printing credentials,
and change `name` in `wrangler.jsonc` to the intended project. Then the owner
can run `pnpm pages:deploy`. This invokes a real remote upload; do not treat it
as a dry run or part of routine local verification. Project creation, custom
domains and account settings are separate external actions.

The owner selected the Cloudflare account associated with `momoe.org`.
`wrangler.jsonc` pins account ID `d7bf5987a206b7ea342add617a9d9dcd`;
the account ID is not a credential. Keep API tokens outside the repository and
use credentials scoped to this account rather than relying on an ambient token
for another account. Read-only Cloudflare API checks confirmed account access
and an empty Pages project list on 2026-10-16. This does not prove deployment
write permissions.

No deployment has occurred. The user-provided Git remote is
`https://github.com/furedericca-lab/cpa2sub2api`. Account selection alone does
not authorize project creation, upload, or domain changes; no Pages URL is
assumed.

## Post-Deployment Acceptance

1. Confirm the document and versioned JS/CSS assets load over HTTPS.
2. Check response CSP includes `connect-src 'none'`, `frame-ancestors 'none'`,
   `object-src 'none'`, and self-only script/style sources; verify no inline or
   external runtime scripts are injected.
3. Keep Cloudflare Web Analytics and automatic third-party script injection off.
   Strict CSP may block such scripts, but do not rely on blocking alone.
4. In browser developer tools, convert synthetic data and prove that no account
   API, remote font, analytics request or upload occurs. Verify JSON and ZIP
   downloads and that reloading clears input/results.
5. Ensure only built assets are published: no vendor sources, raw input, tests,
   private files, source maps, Functions or `_worker.js`.

Cloudflare Pages parses `_headers` for static responses; those rules do not
protect future Pages Functions. Adding a backend changes the privacy contract
and requires a separate design. This site needs no SPA redirects for nested
routes because it has only a root workspace.

## Official References Checked

- https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/
- https://developers.cloudflare.com/pages/configuration/build-image/
- https://developers.cloudflare.com/pages/configuration/headers/
- https://developers.cloudflare.com/pages/functions/wrangler-configuration/

Current documentation was retrieved during implementation. Runtime verification
of a live deployment is still a separate operation.
