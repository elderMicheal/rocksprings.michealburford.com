# RockSprings.MichealBurford.com

The full-stack reader and world application for [The Rock Springs Chronicles](https://rocksprings.michealburford.com).

The separate Writing repository is the source of truth for manuscript prose and canonical source material. This repository owns public approval, deterministic export, public identity and routing, React presentation, the same-origin Cloudflare Worker API, map/scene presentation data, validation, and deployment.

The current `main` branch is the application baseline. Historical planning and completion reports remain useful records, but they do not override the current application, [architecture](docs/ARCHITECTURE.md), [authoring contract](docs/AUTHORING_FOR_PUBLICATION.md), [synchronization contract](docs/CONTENT_SYNC.md), or binding [production mandate](AGENTS.md).

## Start here

- **Authors:** [Authoring for Publication](docs/AUTHORING_FOR_PUBLICATION.md)
- **Application/content maintainers:** [Content Synchronization and Change Discipline](docs/CONTENT_SYNC.md)
- **Deployment, DNS, hosting, CI, or release work:** [AGENTS.md](AGENTS.md)
- **Map or scene work:** [Shared Spatial Evidence](docs/phase-2/JACKIES_WINDOW_SPATIAL_EVIDENCE.md)

A source file does **not** become public merely because it exists in Writing, is canonical, has `publish: true`, or has a useful filename. Publication requires an exact application approval and successful deterministic export.

## Publication model

The public package now has two levels:

1. **works** — novels, anthologies, collections, or standalone works;
2. **entries** — readable chapters, interludes, anthology entries, or stories belonging to those works.

Publication approval lives in:

`content-policy/approved-sources.json`

Every approval identifies exact Writing paths and registers the work those sources belong to. The builder iterates the active approvals; it does not recognize individual titles in application code.

Currently supported work kinds:

- `novel`
- `anthology`
- `collection`
- `standalone`

Currently supported readable source types:

- `chapter`
- `interlude`
- `anthology-entry`
- `story`

For non-chapter entries, an explicit author slug is required. Chapters may continue to derive `chapter-NN` from their chapter number when no explicit slug is supplied.

### Public paths

Every registered work has:

`/read/<work-slug>`

Entries with a numeric part use:

`/read/<work-slug>/part-<n>/<entry-slug>`

Unsectioned entries use:

`/read/<work-slug>/<entry-slug>`

Existing _Jackie's Window_ Part One URLs remain valid.

The home page, reader navigation, and generic reader resolve their published works from the generated package rather than from title-specific route conditions.

## Current public scope

The approval manifest currently admits only _Jackie's Window_, Part One, Chapters 1–8. Seven contain prose; the empty chapter remains an explicit unavailable-text position in the sequence.

The generic architecture can now represent additional approved works without new title-specific React routing. Material that is canonical but not approved remains absent.

## Development

Use Node.js 22.12 or newer. The pinned runtime is in `.nvmrc`.

```sh
npm ci
npm run types
npm run dev
```

`package-lock.json` is authoritative.

If Writing is not in the default local location, set `RSC_WRITING_ROOT` to its absolute repository path.

## Content synchronization

The current source-to-site commands are:

```sh
npm run content:audit:source
npm run content:build
npm run content:check:source
```

They:

1. create a metadata-only audit of the Rock Springs source tree;
2. build all active exact-path approvals into one deterministic package; and
3. prove that the committed package matches the intended Writing revision.

`content:sync` aliases `content:build`.

Do not hand-edit:

- `generated/source-inventory.json`
- `src/content/generated/publication-package.json`

The generated package records:

- the Writing revision;
- active approval IDs;
- the public work registry;
- normalized public entries;
- a SHA-256 digest covering works, public collections, relationships, and withdrawals.

## Shared map and scene

The 2D front-page map and the 3D scene at `/map` are two views of:

`scene-data/jackies-window-spatial-plan.json`

Reader publication and map evidence are separate trust boundaries. Canonical unpublished writing may contribute pinned, paraphrased geographic or visual facts to the map without becoming reader prose.

Map/scene synchronization:

```sh
npm run scene:generate
npm run scene:check
npm run public:check
```

The scene generator owns the generated GLB and synchronized manifest metadata.

## API

Current same-origin API routes include:

- `GET /api/health`
- `GET /api/manifest`
- `GET /api/works`
- `GET /api/works/:workSlug`
- `GET /api/works/:workSlug/:entrySlug`
- `GET /api/collections/:collection`
- `GET /api/content/:collection/:slug`
- `GET /api/relationships/:collection/:slug`

The work-scoped routes are the unambiguous generic reader API. The older collection-plus-slug content route remains for compatibility while a slug is unique within that collection; if future works make it ambiguous, it returns a structured conflict instead of guessing.

## Change-aware CI

CI first classifies the files changed and then installs/runs only the validation relevant to the affected surfaces.

Typical behavior:

- documentation-only: classification and completion gate only;
- content/package: content integrity + focused unit validation;
- map/scene: deterministic scene and public-integrity validation;
- UI/API: type checking, unit tests, relevant browser tests, and build;
- shared toolchain/configuration: broad validation;
- lockfile changes: dependency audit in addition to broad validation.

Playwright Chromium is installed only when browser tests are selected.

Superseded runs on the same branch/PR are cancelled.

A manual `workflow_dispatch` run selects the complete release-validation matrix.

This optimization does not weaken the release requirements in `AGENTS.md`.

## Deployment

Production is:

`https://rocksprings.michealburford.com/`

Production runs as the Cloudflare Worker:

`rocksprings-michealburford-com`

`wrangler.jsonc` is authoritative for hosting/routing. GitHub Pages is not a deployment, preview, fallback, or recovery target.

The required production release procedure remains in [AGENTS.md](AGENTS.md). A push, green CI run, uploaded Worker version, or provider preview is not proof of deployment.

## Current contracts

- [Production mandate](AGENTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Authoring for Publication](docs/AUTHORING_FOR_PUBLICATION.md)
- [Content Synchronization](docs/CONTENT_SYNC.md)
- [Publication Contract](docs/phase-2/PUBLICATION_CONTRACT.md)
- [Approval Workflow](docs/phase-2/APPROVAL_WORKFLOW.md)
- [Publication Schema](docs/phase-2/SCHEMA.md)
- [Content API Contract](docs/phase-2/API_CONTRACT.md)
- [Content Lifecycle](docs/phase-2/CONTENT_LIFECYCLE.md)
- [Shared Spatial Evidence](docs/phase-2/JACKIES_WINDOW_SPATIAL_EVIDENCE.md)

Historical Phase 2 planning/completion documents are retained as history. When they describe an older implementation, the current contracts and code take precedence.
