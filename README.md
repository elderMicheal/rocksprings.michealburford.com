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

## Writing boundary

Rock Springs now consumes Draftworks at runtime.

The Cloudflare Worker reads the generic Draftworks API and converts it into the Rock Springs reader model in:

`worker/api/draftworks.ts`

The browser consumes that adapted model through the same-origin endpoint:

`/api/publication`

`src/adapters/writing-source.ts` initializes the browser from that endpoint and may use a last-valid browser cache during a temporary outage.

The old generated publication package and `transitional/writing-adapter/` remain only as rollback/verification material until this migration stage is fully verified. Active application code must not read manuscripts or import the generated package.

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
