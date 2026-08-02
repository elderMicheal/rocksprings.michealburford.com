# RockSprings.MichealBurford.com

The full-stack reader and world application for [The Rock Springs Chronicles](https://rocksprings.michealburford.com).

This repository contains the React interface, same-origin Cloudflare Workers API, styling, deployment configuration, and a generated publication package for manuscript text explicitly marked `publish: true`. The Writing repository remains the source of truth; private and unpublished writing material is not copied here.

## Development

Use Node.js 22.12 or newer. The project pins the current development
runtime in `.nvmrc`.

```sh
npm ci
npm run types
npm run dev
```

The Vite development server provides hot module replacement for the React
interface and runs the Worker API in the local Cloudflare runtime.

### Publishing Part One chapters

The Part One reader is generated from `Book 1 - Jackie's Window/Part 1` in the
separate Writing repository:

```sh
npm run content:audit:source
npm run content:build
npm run content:check:source
```

`content:build` copies only Chapters 1–8 admitted by the versioned approval
manifest into `src/content/generated/publication-package.json`. It records both
the Writing repository revision and a digest of the exact published text. The
`content:sync` command is retained as a convenience alias. Set
`RSC_WRITING_ROOT` to the absolute Writing repository path when it is not in
the default adjacent `Obsidian Vaults/Writing` location.

CI uses `npm run content:audit` and `npm run content:check` to validate the
committed metadata inventory and generated package without requiring access to
the private Writing repository.

The initial API endpoints are:

- `GET /api/health`
- `GET /api/manifest`
- `GET /api/content/:slug` (not configured in V1)

## Checks and deployment

```sh
npm run check
npm test
npm run build
npm run deploy
```

`package-lock.json` is authoritative. Use `npm ci` for normal development and
CI so every environment installs the reviewed dependency graph.

## Temporary Miniflare security override

Cloudflare's current stable Miniflare release pins `sharp@0.34.5`, which is
affected by inherited libvips security advisories. The root `package.json`
temporarily and narrowly overrides only Miniflare's Sharp dependency to the
patched `sharp@0.35.3`.

Cloudflare has already prepared an upstream Miniflare update that uses a
patched Sharp release. Dependabot checks npm dependencies weekly. Remove the
override as soon as a stable Miniflare release resolves Sharp to `0.35.0` or
newer and the complete CI suite passes without it.

- Upstream package:
  <https://github.com/cloudflare/workers-sdk/blob/main/packages/miniflare/package.json>
- Sharp releases: <https://www.npmjs.com/package/sharp>

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the repository boundaries and application design.

See [docs/PHASE_2_OVERVIEW_PLAN.md](docs/PHASE_2_OVERVIEW_PLAN.md) for the proposed Rock Springs Chronicles content-integration plan.

See [docs/phase-2/PHASE_2_COMPLETION_REPORT.md](docs/phase-2/PHASE_2_COMPLETION_REPORT.md)
for the completed publication scope, evidence, and honest absences.
