---
title: Maintain Pinned Vendor Submodules
type: how-to
status: current
scope: browser-converter
related_files:
  - vendor/vendor-lock.json
  - .gitmodules
  - scripts/vendor.mjs
  - THIRD_PARTY.md
  - pnpm-workspace.yaml
tags: [vendor, provenance]
last_checked: 2026-10-16
updated: 2026-10-16T12:20:00Z
---

# Maintain Pinned Vendor Submodules

## Ownership

`vendor/sub2api` and `vendor/CLIProxyAPI` are complete pinned Git submodules of
the public upstreams. They have no root workspace membership or runtime startup.
Root `pnpm install/build` processes only the converter. Keep both projects'
original dotfiles and license texts intact. The parent Git tree stores only
gitlinks, not copies of upstream OAuth client constants. Initial inline-vendor
publication was blocked by GitHub push protection; the repair deliberately used
submodules rather than bypassing protection or editing upstream source.

`vendor/vendor-lock.json` records each URL, full commit, file count and SHA-256
aggregate. The aggregate hashes sorted relative paths plus each file's content
hash, excluding `.git` metadata. Verification checks both the initialized
submodule HEAD and content digest. It does not establish upstream authenticity,
Git executable-bit parity or third-party security. Recorded commits pin the
inspected format evidence even if upstream later changes.

## Verification

```bash
git submodule update --init --recursive
pnpm verify:vendor
git submodule status
```

Fresh clones should use `git clone --recurse-submodules`. Source-backed unit tests
and `pnpm check` require initialized vendors, but `pnpm build` does not. Parent
`git ls-tree HEAD vendor/sub2api vendor/CLIProxyAPI` must show mode `160000`.
Never force-add source files from inside a vendor into the parent repository.

## Authorized Refresh

1. Confirm the worktree and explicit vendor-refresh scope. Preserve unrelated
   edits; do not overwrite modified vendor trees.
2. Fetch the authorized public upstream in its submodule and record the exact
   intended commit. Review changes to credential types and data import/export.
3. With the submodule worktree clean, check out that exact commit detached. Do
   not follow floating branch HEAD or overwrite unrelated local vendor edits.
4. Adapt application mappings and synthetic tests for any accepted format changes.
5. From the root, run `node scripts/vendor.mjs record vendor` for the selected
   submodule HEADs. Review `.gitmodules`, parent gitlinks and the manifest together;
   recording a digest alone does not authorize a pin change.
6. Run `pnpm check`, `pnpm verify:dist`, and affected browser acceptance. Update
   mapping notes, provenance and maintenance evidence. Stage the submodule
   gitlinks and manifest, inspect the diff and publish only when requested.

Do not fix application behavior by editing vendor source. A vendor update is
separate from a routine converter UI/core change and never requires running
the vendor services or introducing their secrets into this repository.
