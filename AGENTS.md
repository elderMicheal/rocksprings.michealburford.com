# Rock Springs Repository Policy

This file is binding policy for work in `elderMicheal/rocksprings.michealburford.com`.

Read the current `README.md` and this file before repository, deployment, hosting, architecture, content-pipeline, map, or scene changes.

## 1. Source safety

- `elderMicheal/micheal-writes` is authoritative for manuscript prose and author-controlled writing metadata.
- Rock Springs is a consumer. It must not become a second manuscript authority.
- Do not modify manuscript prose as part of Rock Springs application work.
- Do not copy private manuscript repositories into this application.
- Derived files, caches, API responses, maps, and GLBs are never manuscript authority.

## 2. Migration boundary

The 2026-09-22 migration follows this order:

1. freeze and preserve the working baseline;
2. isolate Rock Springs from writing-platform internals;
3. separate Rock Springs Analysis from Reconstruction;
4. establish a replaceable read-only writing adapter;
5. migrate that adapter to the Draftworks API;
6. simplify the website into a consumer;
7. remove obsolete machinery only after replacement behavior is verified.

During migration, compatibility code may remain temporarily. New coupling must not be added.

Active Rock Springs application/Worker code must consume Draftworks through the runtime API boundary.

- Worker adapter: `worker/api/draftworks.ts`
- Browser boundary: `src/adapters/writing-source.ts`
- Same-origin browser resource: `/api/publication`

The local generated package and `transitional/writing-adapter/` are rollback/verification material only during this stage. They must not be imported by active application or Worker code.

Direct Writing-repository filesystem knowledge in new or active runtime code is prohibited.

## 3. Rock Springs Toolchain

Rock Springs-specific derived processing is outside the Draftworks core.

- **Analysis** produces structured, source-traced evidence.
- **Reconstruction** consumes that evidence and produces maps, spatial plans, GLBs, scene data, and other visual assets.
- The website consumes these outputs; it should not perform manuscript analysis or reconstruction generation itself.

## 4. Production contract

Production remains:

- `https://rocksprings.michealburford.com/`
- Cloudflare Worker `rocksprings-michealburford-com`
- `wrangler.jsonc` is authoritative for hosting and routing
- React assets and same-origin `/api/*` Worker deploy together
- normal production deployment is `npm run deploy`
- `package-lock.json` is authoritative and normal install is `npm ci`
- GitHub Actions validates the repository
- GitHub Pages is not a production, preview, fallback, or recovery host for Rock Springs

Changing hosting provider, DNS, production hostname, Worker identity, Wrangler architecture, lockfile policy, CI architecture, or force-pushing `main` requires explicit owner approval for that specific action.

## 5. Change discipline

- Make the smallest change needed for the active migration stage.
- Do not mix unrelated redesigns or infrastructure changes into extraction work.
- Prefer compatibility seams before destructive moves.
- Do not remove an old mechanism until its replacement is verified.
- Every migration stage must remain recoverable.
- Do not hand-edit generated files to make checks pass.

## 6. Baseline and rollback

The exact pre-migration Rock Springs state is preserved at:

`archive/pre-draftworks-2026-09-22`

The exact cross-repository baseline is recorded in `docs/MIGRATION.md`.

Do not rewrite or repoint archive branches as part of normal work.

## 7. Required validation

Use CI and the smallest relevant local validation while developing. Before production release, use a clean checkout/worktree at the exact intended commit and:

1. `npm ci`
2. run required repository checks
3. `npm run build`
4. `npm run deploy`
5. confirm the expected Worker/custom-domain trigger
6. verify public `/` returns HTTP 200 application HTML
7. verify public `/api/health` returns HTTP 200 with `"ok": true`

A push, green CI result, uploaded Worker version, or provider preview is not proof of production deployment.

## 8. Documentation rule

Current code and current documentation must agree.

The current governing documents are only:

- `README.md`
- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/MIGRATION.md`
- `docs/RSC_TOOLCHAIN.md`

Pre-2026-09-22 documentation survives only in the archive branch and must not be treated as current policy.
