# Specimen UI Release Contract

## Context

Publish the completed Specimen-inspired UI redesign to the existing `main`
branch and redeploy the authorized Cloudflare Pages project `cpa2sub2api`.

## Findings

The worktree contains the reviewed redesign and wiki updates. The remote `main`
branch is still `4e2804a3c2b64338cfa538670f83ed8a26ecc7e5`. Cloudflare account
`d7bf5987a206b7ea342add617a9d9dcd` reports project `cpa2sub2api`, production
subdomain `cpa2sub2api-e3k.pages.dev`, no Functions, and successful deployment
`7ac6d1b3-e21a-4c43-829e-83e007ece410` from the previous source commit.

## Outcome

Pending repository verification, publication, deployment and production checks.

## Goals / Non-goals

Commit and push the intended redesign, deploy that exact commit to the existing
production project, and verify runtime assets and browser behavior. Do not
change DNS, project settings, vendor repositories, domains, analytics or account
credentials.

## Target files / modules

The authorized UI changes, `.wiki/`, `.scopes/`, and existing
`scripts/pages-deploy.mjs` deployment flow.

## Constraints

Preserve unmodified vendor submodules and local-only CSP. Use the selected
account's private token only in child-process memory. Do not expose credentials.

## Boundaries

Only the existing `main` branch and Cloudflare Pages production project are
authorized. No Git history rewrite or unrelated external resource changes.

## Decision Summary

Run full repository and browser checks against synthetic fixtures, create a
normal commit, push `main`, deploy through `pnpm pages:deploy`, then compare the
live project source SHA and deployed bytes/headers with the committed build.

## Verification surface

`pnpm check`, `pnpm verify:dist`, `pnpm browser:smoke`, remote Git SHA parity,
Cloudflare deployment API status/source SHA, HTTP asset/header comparisons, and
live Chromium conversion, download, privacy, responsive and request checks.

## Escalation triggers

Stop before deployment if branch/worktree state, target account/project, source
commit or build output differs from this contract.

## Rollback

Pages retains previous immutable deployments. If the deployed app fails
acceptance, stop claiming success and restore the prior successful deployment
through an authorized rollback flow after checking its exact ID.

## Open questions

None. User explicitly requested commit, push and redeployment.

## Execution log / evidence updates

- Initial Git and Cloudflare read-only checks confirmed the requested branch,
  existing account/project and previous production deployment.
- Repository verification and release actions are pending.
