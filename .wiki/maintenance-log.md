---
title: Maintenance Log
type: maintenance-log
status: current
updated: 2026-10-16T12:09:29Z
---

# Maintenance Log

Append-only history for wiki updates caused by scope work, implementation closeout, or knowledge refresh.

## 2026-10-16T12:23:33Z [browser-converter]

- Summary: Implemented browser-local OAuth conversion, pinned complete vendor snapshots, static Pages configuration and operating guides.
- Pages: .wiki/concepts/architecture.md, .wiki/reference/conversion-contract.md, .wiki/how-to/cloudflare-pages.md, .wiki/how-to/vendor-snapshots.md
- Verification: pnpm check: PASS; pnpm verify:dist: PASS; pnpm browser:smoke: 6 passed; local Pages native headers/conversion/download/hostile-fetch probe: PASS
- Residual risk: No live OAuth account validation or Cloudflare deployment; operational settings are not a full cross-product backup.

## 2026-10-16T12:26:38Z [browser-converter]

- Summary: GitHub rejected inline upstream OAuth client constants. Preserved the same complete upstream source as pinned submodules, without bypassing push protection or editing upstream source.
- Pages: .wiki/how-to/vendor-snapshots.md
- Verification: pnpm verify:vendor: PASS; git ls-files --stage vendor/sub2api vendor/CLIProxyAPI: two mode-160000 gitlinks
- Residual risk: Fresh clones must initialize vendor submodules for source-backed tests; production Vite build does not depend on vendor checkout.
