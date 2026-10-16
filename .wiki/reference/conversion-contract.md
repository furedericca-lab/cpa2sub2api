---
title: Conversion Contract And Compatibility
type: reference
status: current
scope: browser-converter
related_files:
  - src/conversion/converter.ts
  - src/conversion/json.ts
  - src/conversion/types.ts
  - test/unit/converter.test.ts
  - vendor/vendor-lock.json
tags: [formats, compatibility, oauth]
last_checked: 2026-10-16
updated: 2026-10-16T12:20:00Z
---

# Conversion Contract And Compatibility

## Canonical Format Evidence

Pinned source versions are in `vendor/vendor-lock.json`.

- `vendor/sub2api/backend/internal/handler/admin/account_data.go`:
  `DataPayload`, `DataAccount`, `validateDataHeader`, `validateDataAccount`.
- `vendor/CLIProxyAPI/internal/auth/codex/token.go`: `CodexTokenStorage`.
- `vendor/CLIProxyAPI/internal/auth/claude/token.go`: `ClaudeTokenStorage`.
- `vendor/CLIProxyAPI/sdk/auth/antigravity.go`: `BuildAntigravityAuth`.
- The reference project's `docs/src/converter.mjs` supplies the Gemini nested
  token mapping and four-provider workflow; reference commit is in THIRD_PARTY.

This is source/schema compatibility, not live acceptance by an authenticated
running service. The tool does not log in, probe endpoints, validate signatures,
refresh credentials, or prove that a provider will accept a converted account.

## Mapping Matrix

| CPA type | sub2api platform | Primary mapped fields |
| --- | --- | --- |
| `codex` | `openai` | access/refresh/id tokens, account/user/organization IDs, email, plan, expiry |
| `claude` | `anthropic` | access/refresh/id tokens, email_address, account/organization UUIDs, expiry |
| `gemini` | `gemini` | nested token access/refresh, expiry, scopes, token type, project ID, email |
| `antigravity` | `antigravity` | access/refresh, project ID, token type, plan, email, expiry |

Forward output has `type: sub2api-data`, `version: 1`, UTC `exported_at`,
`proxies: []` and `accounts`. Each account uses `type: oauth`, concurrency `10`
and priority `1` unless edited. OpenAI expiry is ISO text; the other providers
use Unix-second strings in credentials, matching the reference convention and
sub2api's flexible credential-time parser.

Reverse input accepts an accounts envelope, account array or a single account.
Version 1, legacy `sub2api-bundle` and unversioned envelopes are accepted.
Unknown explicit document types/versions are rejected. An account must explicitly
be `type: oauth`; absent type is not guessed. Missing CPA provider type is also
rejected instead of guessing Codex.

Reverse output produces one native CPA JSON per valid account. OpenAI maps to
`type: codex`, Anthropic to `type: claude`. Gemini recreates the nested `token`
object. Codex emits an empty `refresh_token` string if missing, preserving the
reference behavior. Other unavailable fields are omitted, not invented.

## Expiry And Validation

Expiry accepts ISO text, Unix seconds, Unix milliseconds and numeric strings.
Explicit timestamps take precedence over decoded token claims. Antigravity can
derive an absolute expiry from its recorded timestamp plus `expires_in`.
An unanchored relative lifetime is not added to the current clock: doing that
could falsely extend old credentials. Invalid timestamps are omitted with a
warning; expired tokens remain exportable with a warning. Opaque access tokens
are allowed. Missing access tokens and recognizable masked access tokens fail.
Missing refresh tokens and Google project IDs produce warnings where applicable.

JSON input is bounded to 500 files, 20 MiB total, 5000 accounts and 64 nested
levels. It supports BOM, arrays, JSONL and adjacent documents. A malformed source
file is rejected without exposing parser excerpts; other source files continue.
Account errors are isolated within otherwise valid documents. Oversized account
documents fail without silently accepting their first 5000 records.

## Deliberate Non-Parity

API-key, setup-token, upstream, unsupported-provider and active SIWC credentials
are not converted. Groups, status, billing, scheduling, proxy bindings and
service configuration are not portable OAuth credential fields. Reverse entries
always warn about sub2api operational settings. CPA disabled/proxy_url metadata
gets an explicit forward warning and never becomes active sub2api configuration.

Unknown CPA top-level fields are retained under
`extra.cpa2sub2api = { version: 1, provider, metadata }`. This preserves such
fields as prefix, custom flags and Claude device IDs if sub2api retains the
metadata. Mapped credential keys are never restored from this archive; current
credentials remain authoritative. Unknown nested Gemini token fields, arbitrary
sub2api credentials/extra, exact original timestamps and filename spelling are
not guaranteed to round trip. Do not describe the tool as a complete backup.

Duplicate accounts are not deduplicated. Safe Unicode filenames are flattened
and bounded; case-insensitive collisions receive numeric suffixes. ZIP contents
are per-account JSON with those same names. A masked preview is never the source
of downloadable credentials.
