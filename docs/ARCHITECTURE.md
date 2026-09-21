# Rock Springs Architecture

RockSprings.MichealBurford.com is the deployed reader/explorer application for _The Rock Springs Chronicles_.

It is not the manuscript repository and it is not an editing environment.

## Repository boundary

### Writing repository

Authoritative for:

- manuscript prose;
- source organization;
- editorial metadata;
- canonical source material.

### Rock Springs application repository

Authoritative for:

- exact public approvals;
- stable public work identity;
- normalization and validation;
- deterministic publication package;
- React reader/index routing;
- same-origin Worker API;
- map/scene presentation data;
- deployment configuration.

Runtime access to Writing is prohibited. Public prose is exported at build time from an explicitly approved Writing revision.

## Publication architecture

The package schema separates **works** from readable **entries**.

A work is a public container such as a novel, anthology, collection, or standalone work.

Readable entries remain in the `chronicles` collection. The work registry provides:

- stable work ID/slug;
- kind/order;
- work path;
- optional part/section paths;
- entry membership;
- entry kind;
- final reader paths.

This lets UI/navigation resolve approved material generically without branching on titles.

### Approval boundary

`content-policy/approved-sources.json` is the permission boundary.

An active approval contains exact source paths, metadata requirements, public state, and work registration.

The publication builder iterates approvals and dispatches by supported source type. It does not scan a directory and publish whatever looks eligible.

`publish: true` is author intent, not public permission.

### Generated package

`src/content/generated/publication-package.json` contains:

- schema/manifest;
- source revision;
- approval IDs;
- work registry;
- public collections;
- relationships;
- withdrawal tombstones;
- digest covering works and public package content.

The generated package is application data, not a second manuscript source.

## Reader routing

Generic reader paths are carried by the work registry.

Work:

`/read/<work-slug>`

Part/section:

`/read/<work-slug>/part-<n>`

Entry:

`/read/<work-slug>/part-<n>/<entry-slug>`

or, for unsectioned work:

`/read/<work-slug>/<entry-slug>`

The current _Jackie's Window_ Part One paths remain stable.

The front page, masthead navigation, footer, lead story, and reader use package-derived work/path information rather than title-specific route constants.

## API architecture

The same-origin Worker exposes both generic work-scoped routes and compatibility collection routes.

Work-scoped API is unambiguous even when separate works use the same local entry slug.

The collection-plus-slug route remains for compatibility and refuses ambiguous matches rather than selecting one arbitrarily.

## Map architecture

The publication trust boundary and map-evidence trust boundary remain separate.

The 2D front-page map and interactive 3D scene at `/map` are two views of:

`scene-data/jackies-window-spatial-plan.json`

A second coordinate model is not permitted.

Canonical unpublished writing may contribute pinned, paraphrased map facts under `scene-data/rock-springs-map-evidence.json`. That does not add those source files to the reader and does not permit their prose to be copied into the application.

The deterministic scene generator owns the GLB and synchronized scene-manifest metadata.

## CI architecture

CI classifies affected repository surfaces before installing dependencies.

One validation job then conditionally runs the checks required by those surfaces, so dependencies are installed once per validation run.

Playwright and scene generation are not executed for changes that cannot affect them.

A manual full-validation path remains available before release.

CI optimization does not alter the production release contract in `AGENTS.md`.

## Production architecture

Production remains one Cloudflare Worker application containing:

- React static assets;
- SPA fallback;
- same-origin `/api/*` Worker routes.

`wrangler.jsonc` is authoritative.

GitHub Actions validates the repository. GitHub Pages is not a deployment target.
