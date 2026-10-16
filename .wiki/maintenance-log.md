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

## 2026-10-16T12:28:02Z [browser-converter]

- Summary: Completed source publication and recursive fresh-clone verification; archived the single browser-converter implementation contract.
- Pages: .wiki/concepts/architecture.md, .wiki/reference/conversion-contract.md, .wiki/how-to/cloudflare-pages.md, .wiki/how-to/vendor-snapshots.md
- Verification: Implementation 151b6537b4cdf7caa79327fd90005a1c162a2559: remote SHA parity PASS; fresh recursive clone frozen install/check/verify:dist PASS; 73 unit tests and 6 browser tests PASS; Wiki and Scope checks PASS
- Residual risk: No live OAuth account acceptance or Cloudflare deployment. Vendors require recursive checkout for source-backed tests.

## 2026-10-16T12:58:33Z [pages-deployment]

- Summary: Created and deployed the first static Pages production release; fixed unsupported account_id configuration by pinning the account in the portable deployment process.
- Pages: .wiki/how-to/cloudflare-pages.md
- Verification: pnpm typecheck/test/verify:vendor and pages:deploy PASS; production API success; HTTPS HTML/JS/CSS byte parity; native CSP and real-browser four-provider bidirectional conversion/download/privacy acceptance PASS
- Residual risk: Synthetic OAuth data only; Direct Upload has no automatic Git deployment; custom domains were not configured.
