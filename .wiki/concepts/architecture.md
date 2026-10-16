---
title: Browser-Local Architecture
type: concept
status: current
scope: browser-converter
related_files:
  - src/conversion/
  - front/src/App.tsx
  - front/src/components/ConversionGuide.tsx
  - front/src/tokens.css
  - front/src/styles.css
  - front/public/favicon.svg
  - front/index.html
  - front/src/lib/settings.ts
  - front/public/_headers
  - pnpm-workspace.yaml
tags: [architecture, privacy]
last_checked: 2026-10-16
updated: 2026-10-16T13:54:46Z
---

# Browser-Local Architecture

## Runtime Ownership

The deployed product is a single static page. Vite builds `front/` into root
`dist/`. The browser runs React and the pure conversion modules; no service,
remote account API, Pages Function, Worker, database or server-side session
participates. `vendor/` contains pinned Git submodules for source evidence and is
neither built nor served. Recursive checkout retrieves the original source from
its owners instead of copying upstream OAuth constants into the parent history.

`src/conversion/` owns parsing, provider mapping, safe names, validation, bundle
generation and ZIP generation. `front/src/App.tsx` owns import state, selection,
preview visibility, filtering, downloads and operator notices. No router or
global state library is needed for this one workspace.

## Data Flow

File input, directory selection, drag/drop and paste become `InputSource[]` in
React memory. Conversion validates bounded JSON then processes accounts in input
order. Each attempted account becomes an entry or an explicit issue. Valid
accounts can be selected individually. Failed accounts never become exports.
Downloads use user-triggered Blob URLs; temporary URLs are revoked afterward.

Selecting files appends to the current file batch. Pasted documents are added at
conversion time. Direction, source text and setting changes invalidate previous
results. Clear also invalidates pending asynchronous file reads with a generation
counter. Direction switching preserves input but discards previous results.

## Persistence And Privacy

Only the versioned preference key `cpa2sub2api:preferences:v1` is persisted. Its
allowlist contains exactly `concurrency` and `priority`; invalid or unavailable
storage falls back to defaults and does not block conversion. The application
does not persist source/result JSON or use IndexedDB, service workers or URLs
for account data. Reloading clears application input/result state.

Preview token fields are recursively masked by default. Displaying real tokens
requires an explicit checkbox; copying respects that state. Downloads always
contain real credentials, independently of masking. Masking is not a guarantee
that arbitrary metadata or email addresses are anonymized. Input is untrusted;
React text escaping and generic parser errors prevent HTML execution and raw
JSON snippets in error messages. JWT payload decoding is best-effort metadata
extraction, never signature verification or authentication.

Static production responses apply `_headers`, including a CSP with no network
connections, remote scripts, inline scripts, embedding or forms. This is defense
in depth, not protection from browser extensions, compromised dependencies,
clipboard history, local downloads or browser-managed recovery. Cloudflare
analytics/script injection must remain disabled. Vite HMR is development-only
and is not covered by production network guarantees.

## Interface Language

User-facing Chinese copy describes file selection, conversion, download and
import actions directly. Avoid marketing slogans, implementation terminology
and repeated privacy claims. Label results as converted accounts rather than
usable accounts. Expiry, missing refresh credentials and proxy warnings state
the next action. The guide gives each destination's import steps, supported
account types, file limits and settings that require attention after import.
Keep local processing, refresh clearing, masked clipboard behavior and sensitive
downloads explicit in their relevant contexts. These are wording conventions;
provider mappings and credential handling are unchanged.

## Visual Language

The standalone workspace follows the user's Specimen userscript reference:
warm-white surfaces, warm gray dividers, orange accents, an italic title,
numbered underline navigation, outlined secondary controls and pale code panels.
`front/src/tokens.css` owns shared colors; `front/src/styles.css` owns component
and responsive states. Keep `#ff5722` for large type, icons and accents. Primary
buttons use deeper orange `#d13d16` so small white labels exceed 4.5:1 contrast;
small orange text uses `#bc3715`. Provider colors remain identity cues rather
than a competing application theme. Fonts are local system fallbacks, with no
network font requests. The reference's payment, session and proxy behavior is
not part of this application.

Desktop uses a two-pane input/result workbench; at 680px and below the panes
stack. Numbered direction buttons retain their original accessible names and
pressed state. Disabled actions are neutral, selected accounts have pale orange
borders and keyboard focus uses a visible dark-orange outline. The help dialog
uses the same surfaces, typography and notice treatment.

## Verification

Unit tests isolate conversion and preference storage. Browser tests use compiled
production assets with the production CSP attached to document responses. They
check actual JSON/ZIP downloads, reload clearing, masked/revealed previews and
runtime request origins. A separate local Pages emulator verifies actual static
headers. Neither test implies live deployment or live account validity.
