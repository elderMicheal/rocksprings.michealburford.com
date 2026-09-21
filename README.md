# RockSprings.MichealBurford.com

The full-stack reader and world application for [The Rock Springs Chronicles](https://rocksprings.michealburford.com).

The separate Writing repository is the source of truth for manuscript and canonical source material. This repository owns public presentation: approval records, deterministic content exports, React routes and components, the same-origin Cloudflare Worker API, map/scene presentation data, validation, and deployment.

The current `main` branch is the application baseline. Historical planning documents describe how the current system was reached; they do not override the current application, [architecture](docs/ARCHITECTURE.md), [authoring contract](docs/AUTHORING_FOR_PUBLICATION.md), [synchronization contract](docs/CONTENT_SYNC.md), or binding [production mandate](AGENTS.md).

## Start here

Different contributors have different responsibilities:

- **Authors:** read [Authoring for Publication](docs/AUTHORING_FOR_PUBLICATION.md).
- **Application/content maintainers:** read [Content Synchronization and Change Discipline](docs/CONTENT_SYNC.md).
- **Deployment, DNS, hosting, CI, or release work:** read [AGENTS.md](AGENTS.md) before doing anything else.
- **Map or scene work:** also read [Jackie's Window Spatial Evidence](docs/phase-2/JACKIES_WINDOW_SPATIAL_EVIDENCE.md).

A source file does **not** appear on the site merely because it exists in the Writing repository, has `publish: true`, or has a useful filename. Publication is an explicit handoff from authored source to an approved application package.

## Current public surface

The application currently exposes:

- the Rock Springs front page;
- the approved _Jackie's Window_ Part One reader;
- stable chapter routes beneath `/read/jackies-window/part-1`;
- the source-traced 2D map on the front page;
- the interactive 3D map at `/map`; and
- same-origin content and health APIs.

The currently approved reader package contains the exact source paths admitted by `content-policy/approved-sources.json`. Other canonical stories, anthologies, books, notes, characters, places, or world material remain absent until the publication workflow deliberately admits and presents them.

### Important limitation

The current content builder is still specialized for _Jackie's Window_, Book 1, Part 1. It derives chapter slugs such as `chapter-01` and does not yet provide a generic "set a slug and it appears" mechanism for arbitrary stories or new top-level works.

That limitation is part of the current baseline and must be addressed deliberately. Do not work around it by adding one-off title-specific routes or copying manuscript prose into application code. See [Authoring for Publication](docs/AUTHORING_FOR_PUBLICATION.md) for the author-side contract and [Content Synchronization](docs/CONTENT_SYNC.md) for the maintainer-side elevation process.

## Repository boundaries

### Writing repository

Authoritative for:

- manuscript prose;
- canonical source material;
- editorial metadata;
- author-controlled publication intent; and
- the Git revision from which public material is derived.

### This application repository

Authoritative for:

- explicit publication approvals;
- normalization and safe export;
- public IDs and routes;
- presentation and navigation;
- the generated publication package;
- the shared 2D/3D spatial model and evidence catalog;
- API behavior;
- validation; and
- Cloudflare Worker deployment.

Runtime access to the Writing repository is prohibited. Public content is a deterministic build-time export.

## Development

Use Node.js 22.12 or newer. The pinned development runtime is in `.nvmrc`.

```sh
npm ci
npm run types
npm run dev
```

`package-lock.json` is authoritative. Normal development and CI use `npm ci`.

If the Writing repository is not available in the default local location, set `RSC_WRITING_ROOT` to its absolute path.

## Publishing and synchronizing writing

The current source-to-site commands are:

```sh
npm run content:audit:source
npm run content:build
npm run content:check:source
```

They perform three separate jobs:

1. audit the Rock Springs source tree without copying private manuscript bodies into the metadata inventory;
2. generate the explicitly approved public package; and
3. prove that the committed package matches the intended Writing revision.

`content:sync` is an alias for `content:build`.

Do not hand-edit:

- `generated/source-inventory.json`; or
- `src/content/generated/publication-package.json`.

They are generated artifacts and must agree with their source revision and approval policy.

The current approval manifest is:

`content-policy/approved-sources.json`

Exact paths, not directory globs or inferred status, determine public eligibility.

## Shared map and scene

The 2D front-page map and the 3D scene at `/map` are two views of:

`scene-data/jackies-window-spatial-plan.json`

A second coordinate model is not permitted.

Reader publication and map evidence are separate trust boundaries. Canonical unpublished writing may contribute pinned, paraphrased geographic or visual facts to the map without becoming reader content and without copying unpublished prose into this repository.

Map/scene synchronization commands:

```sh
npm run scene:generate
npm run scene:check
npm run public:check
```

`scene:generate` owns both the GLB and its synchronized manifest metadata.

## API

Current same-origin API routes are:

- `GET /api/health`
- `GET /api/manifest`
- `GET /api/collections/:collection`
- `GET /api/content/:collection/:slug`
- `GET /api/relationships/:collection/:slug`

Unknown API routes return JSON 404 responses. Non-API requests fall through to the SPA asset binding.

## Validation without wasting resources

Use the smallest validation tier that proves the change is correct. Full browser and release validation is not the default author workflow.

### Author/source editing

Writing-only work that is not being published does not require this application's browser suite.

### Publication-package work

For an approved source update:

```sh
npm run content:audit:source
npm run content:build
npm run content:check:source
npm run test:unit
```

Run browser tests only when the reader, routing, layout, or presentation behavior changed.

### Map/scene work

Use:

```sh
npm run scene:generate
npm run scene:check
npm run public:check
```

Add targeted browser coverage when map interaction or rendering behavior changed.

### Application UI/API work

Use type checking and the tests relevant to the surface changed. Run the complete suite before release.

### Release

The release gate remains:

```sh
npm run check
npm test
npm run build
npm run deploy
```

The current GitHub Actions workflow is intentionally stricter than these local tiers and still runs the complete validation matrix for application changes. Test-cost optimization should be made as a deliberate CI change, not by silently skipping required release checks.

## Deployment

All hosting and deployment changes are governed by [AGENTS.md](AGENTS.md).

Production is:

`https://rocksprings.michealburford.com/`

It runs as the Cloudflare Worker:

`rocksprings-michealburford-com`

`wrangler.jsonc` is authoritative for hosting and routing. GitHub Pages is not a deployment, preview, fallback, or recovery target.

A push, green CI run, uploaded Worker version, or provider preview is not proof of production deployment. The public hostname and `/api/health` must pass the release verification in `AGENTS.md`.

## Dependency note

The root `package.json` currently contains a narrow Miniflare/Sharp security override. Do not remove or broaden it casually. Dependency changes must preserve the authoritative lockfile and pass the applicable repository checks.

## Current documentation

- [Production mandate](AGENTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Authoring for Publication](docs/AUTHORING_FOR_PUBLICATION.md)
- [Content Synchronization and Change Discipline](docs/CONTENT_SYNC.md)
- [Publication Contract](docs/phase-2/PUBLICATION_CONTRACT.md)
- [Approval Workflow](docs/phase-2/APPROVAL_WORKFLOW.md)
- [Content Lifecycle](docs/phase-2/CONTENT_LIFECYCLE.md)
- [Shared Spatial Evidence](docs/phase-2/JACKIES_WINDOW_SPATIAL_EVIDENCE.md)
- [Phase 2 Completion Report](docs/phase-2/PHASE_2_COMPLETION_REPORT.md)

`docs/PHASE_2_OVERVIEW_PLAN.md` and other planning records remain useful historical context, but completed architecture and current contracts take precedence when they differ.
