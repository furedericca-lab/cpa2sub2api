# CPA2Sub2API — Developer Contract

## Source Of Truth

Start at `.wiki/index.md`. Current code and verified behavior take precedence
over scope records, Wiki, and README. Inspect Git state and preserve unrelated
work. One `.scopes/<scope>/` contract owns nontrivial implementation.

## Product Boundary

This is a browser-local OAuth account converter, deployed as static assets to
Cloudflare Pages. Do not add a server, Worker, Pages Function, remote API,
analytics, remote fonts, token validation, or token refresh without an explicit
product request. React owns transient UI state. Credentials, source text, file
contents, account labels and conversion results must never be persisted in
localStorage, IndexedDB, URLs, logs, documentation or telemetry. Only allowlisted
nonsecret numeric preferences may be saved.

Preview is redacted by default. Real credential display is explicit; downloads
contain original credentials and are user-triggered. Do not copy raw parser
exceptions into UI errors: they can contain credential snippets. User filenames
and account names are untrusted text. Keep local-only CSP in
`front/public/_headers`; it applies to production static responses, not Vite HMR.

## Layout And Toolchain

- `src/conversion/`: pure, shared TypeScript conversion, validation and export.
- `front/`: Vite + React + TypeScript UI and static Pages assets.
- `test/unit/`, `test/browser/`, `test/fixtures/`: synthetic-only verification.
- `scripts/`: portable Node.js development and verification utilities.
- `vendor/`: complete pinned upstream Git submodules, not runtime dependencies.
- `.wiki/`: current manual; `.scopes/`: bounded implementation contracts.

Use pnpm 12.10.1, TypeScript 7.0.2 and Node.js >=22.19. Keep the lockfile and
package-manager/build permissions in `pnpm-workspace.yaml`. Do not install or
run the vendor applications as part of root build or start. No router, external
state manager or backend database is needed for this single-screen tool. Plain
CSS uses shared tokens; Tailwind remains optional rather than an imposed tool.

## Conversion And Vendor Ownership

Convert only supported OAuth providers. Report every failed account; do not
guess unknown providers, account links, expiry, or cross-product proxy bindings.
Do not claim complete configuration or byte-for-byte round-trip compatibility.
Preserve input order and avoid silent deduplication. Keep deterministic,
collision-safe, flat output filenames. New mappings need synthetic fixtures and
source evidence from pinned vendors.

Do not modify vendors for application fixes. Preserve upstream licenses,
dotfiles and complete source. `.gitmodules` and the parent Git tree pin the two
submodules; `vendor/vendor-lock.json` records provenance and aggregate content
hashes. `pnpm verify:vendor` verifies both commit and content. Clone recursively
or run `git submodule update --init --recursive` before tests/vendor verification.
Never inline upstream OAuth constants into parent commits or bypass push
protection to publish them. Vendor upstreams are not authorized push targets.

## Verification And Publication

Use owner tests first, then `pnpm check`, `pnpm verify:dist`, and
`pnpm browser:smoke` for conversion/UI changes. Browser tests run against the
production build with the production CSP injected; they do not prove live Pages
deployment. Check desktop and narrow layouts, default masking, real downloads,
reload clearing, error isolation, and absence of external runtime requests.
Use synthetic data only. Do not hand-edit `dist/`, lockfiles or generated Wiki
indexes. Update affected Wiki pages and the owning scope with actual evidence.

Git commit/push, remote repository creation and deployment require user intent
authorizing those actions. `pnpm pages:deploy` is an explicit remote operation;
do not run it just to validate local static output. Repository artifacts and
technical documentation are authored in English. Do not add subagents unless
explicitly requested.

The user authorized publication to `main` at
`https://github.com/furedericca-lab/cpa2sub2api`. After authorized publication,
verify remote SHA parity, complete vendor tracking and a clean worktree. This
does not authorize a Cloudflare deployment or mutation of vendor upstreams.
