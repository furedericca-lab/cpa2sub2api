# CPA ⇄ sub2api

A browser-local, bidirectional OAuth account converter for
[CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI) and
[sub2api](https://github.com/Wei-Shaw/sub2api), informed by
[gtxx3600/CPA2sub2API](https://github.com/gtxx3600/CPA2sub2API).

Vite + React + TypeScript, static Cloudflare Pages deployment, React state,
and localStorage for numeric preferences only. No backend, account login,
credential upload, telemetry, remote fonts, or cloud storage. The interface
uses Chinese operator copy. Technical documentation is in English.

## Quick Start

Requires Node.js >=22.19 and pnpm 12.10.1. The repository pins the package
manager and provides `.node-version` for compatible build runners.

```bash
git clone --recurse-submodules https://github.com/furedericca-lab/cpa2sub2api.git
cd cpa2sub2api
pnpm install --frozen-lockfile
pnpm dev
```

For an existing checkout, initialize pinned vendors with
`git submodule update --init --recursive`. They are needed for source-backed
tests and integrity checks, but not for the static Vite production build.

Open the loopback URL printed by Vite. `pnpm start` is an alias for local
development; it never starts the vendor services. Production build and preview:

```bash
pnpm build
pnpm verify:dist
pnpm preview
```

## Workflow

1. Choose **CPA → sub2api** or **sub2api → CPA**.
2. Drop/select JSON files, select a directory, or paste JSON/JSONL. Files and
   pasted input are combined; use Clear to discard the current session.
3. Convert and inspect successful accounts, skipped items, warnings, and the
   default-redacted JSON preview. Choose individual accounts or filter by platform.
4. For sub2api, download the merged JSON and import it through account data
   import. For CPA, download ZIP and extract individual JSON files into auth-dir.
   Individual JSON download and ZIP export are available in both directions.

Use the sub2api **administrator account data export**, not a redacted account
listing. Downloaded files contain real credentials even when the preview is
masked. Clipboard copy matches the currently masked/revealed preview; masked
copies are not importable credentials.

Supported OAuth mappings: Codex/OpenAI, Claude/Anthropic, Gemini, Antigravity.
Defaults for newly generated sub2api accounts: concurrency `10`, priority `1`.
Limits: 500 JSON files, 20 MiB combined input, 5000 accounts, 64 nesting levels.
JSON arrays, JSONL and concatenated JSON documents are supported. ZIP input is
not supported; extract archives first. Duplicate accounts remain explicit;
duplicate output filenames receive numeric suffixes.

This is **not a full configuration backup or lossless migration tool**. API
Key, setup-token, upstream, SIWC, and unsupported platforms are reported as
skipped. Scheduling, group membership, billing, service status and proxy bindings
do not transfer as active settings. Unknown CPA top-level fields are retained in
namespaced sub2api `extra` metadata for a later reverse conversion, not activated
by sub2api. See [mapping and limitations](.wiki/reference/conversion-contract.md).

## Cloudflare Pages

The only deployable directory is **`dist/`**, never the repository root or
`vendor/`. Do not add Pages Functions or switch this project to a Worker.

For Pages Git integration:

| Setting | Value |
| --- | --- |
| Root directory | Repository root |
| Production branch | `main` |
| Build command | `pnpm build` |
| Build output directory | `dist` |
| `NODE_VERSION` | `22.19.0` or a compatible newer version |
| `PNPM_VERSION` | `12.10.1` |

The provided `wrangler.jsonc` describes a static Pages project named
`cpa2sub2api`. It has no bindings, secrets or Functions. Edit the name to match
your own Pages project before an authorized deployment.

```bash
pnpm build
pnpm pages:dev
```

`pages:dev` runs a local Cloudflare Pages emulator. When you explicitly decide
to publish to your own authenticated Cloudflare account, `pnpm pages:deploy`
builds and uploads `dist/`. The source repository is published at
`https://github.com/furedericca-lab/cpa2sub2api`; publishing source does not
authenticate to Cloudflare or deploy anything automatically. See the
[deployment guide](.wiki/how-to/cloudflare-pages.md) for security headers and
post-deployment checks.

## Project Structure

```text
front/                  React UI, Vite config, static assets
src/conversion/         Pure TypeScript conversion and export core
test/unit/              Mapping, validation, archive and privacy tests
test/browser/           Production-build browser acceptance
test/fixtures/          Synthetic data only
scripts/                Browser install and verification helpers
vendor/sub2api/         Complete pinned upstream Git submodule
vendor/CLIProxyAPI/     Complete pinned upstream Git submodule
vendor/vendor-lock.json Upstream commits and snapshot hashes
.wiki/                  Current architecture and operator manual
.scopes/                Durable implementation records
```

This follows the `aweb-service` separation of source, frontend, tests, scripts,
vendor, Wiki and Scope without importing its backend/runtime architecture.

## Development

```bash
pnpm check
pnpm verify:dist
pnpm browser:install
pnpm browser:smoke
git diff --check
```

`pnpm check` runs type checking, unit tests, production build and vendor integrity.
Browser smoke uses loopback preview with the production CSP injected and synthetic
fixtures. Test output is ignored under `test-results/`. The browser installer
does not install operating-system packages or garbage-collect other browser caches.
If the browser CDN is unavailable, set a trusted `PLAYWRIGHT_DOWNLOAD_HOST`
for that installation command.

Both vendors are pinned Git submodules, not root workspace packages. Their
Go/frontend builds are deliberately excluded. This preserves complete upstream
source without copying upstream OAuth client constants into the parent history
or bypassing GitHub push protection. Preserve upstream licenses and source. See
[vendor maintenance](.wiki/how-to/vendor-snapshots.md).

Start with [AGENTS.md](AGENTS.md) and the [Wiki](.wiki/index.md).
The owning implementation record is
[browser-converter](.scopes/browser-converter/browser-converter-contract.md).

## Privacy Boundary

Credentials exist only in the active tab's React memory and explicit download
or clipboard output. Reload, Clear or closing the tab discards that memory; the
application cannot erase browser extensions, operating-system clipboard history,
downloads, swap, or browser-managed form/session recovery. Masking hides token
fields, not account email/identity or all arbitrary third-party metadata.
Use a trusted browser and do not share credential-bearing files or screenshots.

Production CSP blocks fetch/XHR/WebSocket connections (`connect-src 'none'`).
Do not enable Cloudflare Web Analytics, automatic script injection or third-party
scripts for this credential-processing page. Vite development uses its own HMR
connection and is not the production privacy boundary.

## Third-Party Sources

Upstream vendors retain their own licenses and attribution; they are not bundled
into the website. See [THIRD_PARTY.md](THIRD_PARTY.md) and
`vendor/vendor-lock.json`. This repository does not select a license for original
application code on behalf of its owner.
