# Third-Party Sources

## Pinned Vendor Submodules

| Path | Source | License |
| --- | --- | --- |
| `vendor/sub2api` | https://github.com/Wei-Shaw/sub2api | Upstream LGPL-3.0 text in `vendor/sub2api/LICENSE` |
| `vendor/CLIProxyAPI` | https://github.com/router-for-me/CLIProxyAPI | MIT text in `vendor/CLIProxyAPI/LICENSE` |

The parent Git tree pins exact upstream commits. File counts and aggregate
content hashes are additionally recorded in `vendor/vendor-lock.json`. These
complete, unmodified submodules provide format evidence and are excluded from
the browser bundle and root pnpm workspace. Their original notices and source
remain in their respective directories after recursive checkout. Upstream OAuth
client constants are not copied into parent Git history or browser assets.

## Design And Behavioral Reference

https://github.com/gtxx3600/CPA2sub2API at
`42ff785d5f3527e4050c02a0da51d4f7eb4f1180` (MIT) informed the product workflow
and supported-provider mapping. The converter in `src/conversion/` is a new,
typed implementation checked against current vendor schemas. The reference
application, screenshots and provider artwork are not distributed in this tree.

## Browser Dependencies

React/React DOM (MIT), fflate (MIT), and lucide-react (ISC) are bundled by Vite.
The authoritative versions and transitive dependencies are in `pnpm-lock.yaml`;
their packages retain their license files in the installed dependency tree.
Toolchain packages are development-only and not deployed as source directories.
