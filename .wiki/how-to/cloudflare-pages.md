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
  - scripts/pages-deploy.mjs
  - package.json
tags: [deployment, cloudflare, security]
last_checked: 2026-10-16
updated: 2026-10-16T13:33:50Z
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

The deployed project uses Direct Upload with no Git integration; pushes to
GitHub do not trigger a deployment. This section applies to a separate
Git-integrated project. A Direct Upload project cannot be switched to Git
integration in place.

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
local Wrangler version/help and provide its API token privately to the process.
`pnpm pages:deploy` builds and verifies dist/ before invoking the portable
deployment helper. The helper pins the selected account, project cpa2sub2api
and production branch main. This invokes a real remote upload; do not treat it
as a dry run or part of routine local verification. Project creation, custom
domains and account settings are separate external actions.

The owner selected the Cloudflare account associated with `momoe.org`.
`scripts/pages-deploy.mjs` pins account ID `d7bf5987a206b7ea342add617a9d9dcd`
through the deployment process environment; Pages rejects `account_id` in
`wrangler.jsonc`, even though the generic Wrangler schema includes it.
The account ID is not a credential. Keep API tokens outside the repository and
use credentials scoped to this account rather than relying on an ambient token
for another account. Read-only API checks confirmed account access before
creation; project creation and the successful upload then proved the write path.

## Initial Production Deployment

The owner explicitly authorized project creation and deployment on 2026-10-16.

| Property | Verified value |
| --- | --- |
| Project | cpa2sub2api |
| Production URL | https://cpa2sub2api-e3k.pages.dev/ |
| Deployment URL | https://a6d1a8e3.cpa2sub2api-e3k.pages.dev/ |
| Deployment ID | a6d1a8e3-bc1b-412d-a319-20fbd021b37e |
| Deployment source commit | f00a365c0b48380fb9a8e75f0cf270c79585e7a0 |
| Production branch | main |
| Completed | 2026-10-16T12:55:04Z |
| API deployment status | success |
| Git integration / Functions / Web Analytics tag | none / false / none |

HTTPS document, JS and CSS responses matched dist/ byte for byte. Actual
response headers supplied the local-only CSP and other configured security
headers. An unmodified production page passed Chromium checks for four-provider
forward and reverse conversion, masked previews, unsupported-account isolation,
individual/merged JSON and reverse ZIP downloads, no credential persistence,
reload clearing and a 390px layout. No external runtime requests or page errors
occurred. A hostile external fetch was blocked by the actual connect-src CSP.
Desktop/mobile screenshots are ignored local artifacts in test-results/.

The Git remote remains https://github.com/furedericca-lab/cpa2sub2api. No custom
domain, momoe.org DNS, Git integration, analytics, backend or unrelated account
setting was configured. Only synthetic account data was used for acceptance;
live provider OAuth acceptance was not tested.

## Interface Copy Release

The production URL now serves deployment
7ac6d1b3-e21a-4c43-829e-83e007ece410, completed at 2026-10-16T13:28:19Z from
source 80f8eb6abd2005e8ba4e88f6c7d7ae1e5ccf4a65. The immutable release URL is
https://7ac6d1b3.cpa2sub2api-e3k.pages.dev/.

This release updates task labels, import instructions, warnings and help copy.
Local checks passed 73 unit tests and 7 browser tests. Production HTML/JS/CSS
matched dist/ byte for byte, with the actual local-only security headers.
Unmodified production Chromium verified the new copy, expired-account wording,
forward JSON download, reverse conversion and mobile help, with zero external
runtime requests and page errors. Conversion behavior and CSS are unchanged.

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
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/create/

Current documentation was retrieved during implementation/deployment. Repeat
the post-deployment acceptance checks after future uploads; the evidence above
describes the recorded releases rather than all future versions.
