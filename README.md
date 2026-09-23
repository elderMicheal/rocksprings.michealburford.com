# Rock Springs Chronicles

This repository is the production web application for **The Rock Springs Chronicles** at:

`https://rocksprings.michealburford.com/`

## Current product boundary

Rock Springs is a **consumer** of writing data. It is not the authority for manuscripts, editorial files, or the general writing platform.

The target system has three separate concerns:

1. **Draftworks** — the writing platform that understands and serves writing.
2. **Rock Springs Toolchain** — a specialized consumer split into Analysis and Reconstruction.
3. **Rock Springs Website** — the presentation application that consumes writing and reconstruction output.

The canonical manuscript source remains `elderMicheal/micheal-writes`.

## Migration status

A controlled architecture migration began on 2026-09-22.

The pre-migration state is frozen in the archive branch:

`archive/pre-draftworks-2026-09-22`

Exact baseline and rollback revisions are recorded in [docs/MIGRATION.md](docs/MIGRATION.md).

The active migration begins by isolating Rock Springs-specific behavior before Draftworks is restructured.

## Transitional writing boundary

The application currently still uses the generated publication package. During migration, direct access to that package is isolated behind:

`src/adapters/writing-source.ts`

That adapter is temporary. Its purpose is to give the Rock Springs application one replaceable writing-data boundary. The intended replacement is the Draftworks read-only API.

Legacy source inspection/export is now boxed under `transitional/writing-adapter/`. The old script paths remain compatibility entry points only.

New application code must not import the generated publication package directly or inspect the Writing repository directly.

## Rock Springs Toolchain

Rock Springs-specific derived work is divided into:

- **Analysis** — extracts structured evidence from permitted Rock Springs writing.
- **Reconstruction** — turns structured evidence into maps, spatial plans, GLBs, and scene assets.

See [docs/RSC_TOOLCHAIN.md](docs/RSC_TOOLCHAIN.md).

## Production

Production remains unchanged during this migration:

- Hostname: `rocksprings.michealburford.com`
- Cloudflare Worker: `rocksprings-michealburford-com`
- Hosting/routing authority: `wrangler.jsonc`
- React application and same-origin `/api/*` Worker remain one deployment
- Deployment command: `npm run deploy`
- Dependency installation: `npm ci`
- GitHub Actions validates the repository
- GitHub Pages is not a Rock Springs deployment target

## Development

Use Node.js 22.12 or newer.

```sh
npm ci
npm run types
npm run check
npm run test:unit
npm run build
```

Scene/reconstruction checks remain available during extraction:

```sh
npm run scene:generate
npm run scene:check
```

## Current documentation

These are the only current architecture/governance documents:

- [AGENTS.md](AGENTS.md) — binding repository operating policy
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — current target architecture
- [docs/MIGRATION.md](docs/MIGRATION.md) — migration state, snapshots, and rollback
- [docs/RSC_TOOLCHAIN.md](docs/RSC_TOOLCHAIN.md) — Analysis/Reconstruction boundary

All earlier documentation was preserved in the pre-migration archive branch and is not current policy.
