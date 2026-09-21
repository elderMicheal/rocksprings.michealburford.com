# Content Synchronization and Change Discipline

This document defines how the Writing repository, publication package, application, map, and generated artifacts stay aligned.

The goal is simple: one change should have one owner and one authoritative source. Generated or derived copies must never quietly become competing sources of truth.

## Sources of truth

| Concern | Authority | Derived copies must not override it |
| --- | --- | --- |
| Manuscript prose and canonical writing | Writing repository | Site code, generated package |
| Author editorial metadata | Writing repository | UI labels invented in code |
| Public publication permission | `content-policy/approved-sources.json` | `publish: true`, filename, links |
| Public normalized package | Content build scripts + approved Writing revision | Hand-edited JSON |
| Public route/presentation behavior | Application content model and router | Source filenames |
| 2D/3D map coordinates and relationships | `scene-data/jackies-window-spatial-plan.json` | Component-local coordinates |
| Map evidence | `scene-data/rock-springs-map-evidence.json` | Unpinned prose recollection |
| Generated scene artifact | `scripts/generate-town-scene.mjs` from the shared plan | Hand-edited GLB/manifest metadata |
| Hosting/routing | `wrangler.jsonc` + `AGENTS.md` | CI/provider workarounds |

When two sources disagree, stop and resolve the disagreement at the authoritative layer. Do not "fix" a derived artifact around it.

## Current baseline behavior

The current reader builder is specialized for _Jackie's Window_, Book 1, Part 1. It:

- reads a fixed source directory;
- requires exactly approved Book 1 / Part 1 chapter metadata;
- derives `chapter-NN` slugs;
- requires eight chapter positions; and
- emits them into the `chronicles` collection.

That is a known implementation boundary, not a general authoring rule.

New content families and top-level works must not be forced through that specialized shape. Generalizing presentation requires an explicit content-model change.

## Generated files

Do not hand-edit:

- `generated/source-inventory.json`;
- `src/content/generated/publication-package.json`;
- generated scene GLBs; or
- generator-owned scene manifest fields such as hash, byte count, statistics, views, and routes.

Regenerate them from their owning source and review the resulting diff.

A generated artifact without its source revision/digest is stale until proven otherwise.

## Change classes

Before changing the site, classify the work. This determines both what may change and how much validation is justified.

### 1. Writing only, not being published

Examples: drafting, editorial cleanup, private canon notes.

Application action: none.

Do not rebuild the site merely because the Writing repository changed.

### 2. Existing approved prose changed, structure unchanged

Examples: edits to an already approved chapter.

Application action:

```sh
npm run content:audit:source
npm run content:build
npm run content:check:source
npm run test:unit
```

Expected changes are generally the source inventory and publication package. Route code should not change merely because prose changed.

### 3. New entry in an already supported content family

Application action:

1. verify author metadata;
2. add the exact source path to the approval manifest;
3. regenerate the source inventory;
4. regenerate the public package;
5. verify the stable ID/slug and ordering;
6. verify that the existing generic index/router presents it; and
7. run the targeted tests for that content family.

If step 6 requires a title-specific condition, the content family is not actually generic yet. Fix the model instead of adding a one-off exception.

### 4. New top-level work or new source kind

Examples: another book reader, an anthology reader, a short-story collection.

This is a model/presentation change, not just a content sync.

Required design decisions include:

- stable work ID and public slug;
- source metadata contract;
- approval shape;
- deterministic normalization;
- parent/child ordering;
- route shape;
- home/index presentation;
- withdrawal behavior;
- provenance;
- API representation; and
- tests for the generic behavior.

Update [AUTHORING_FOR_PUBLICATION.md](AUTHORING_FOR_PUBLICATION.md) in the same change if author-facing metadata or slug behavior changes.

Do not add a one-off route or hard-code the title into the front page as a shortcut.

### 5. Map evidence or spatial change

Reader approval and map evidence are separate.

For map work:

1. pin source evidence;
2. update paraphrased facts or the shared spatial plan;
3. do not copy unpublished prose;
4. regenerate the scene;
5. validate the scene and public evidence rules; and
6. verify both 2D and 3D views derive from the same plan.

Commands:

```sh
npm run scene:generate
npm run scene:check
npm run public:check
```

### 6. UI/API behavior change

Run type checking plus unit/browser tests relevant to the changed surface. Add full browser coverage when shared routing, responsive layout, public navigation, reader behavior, map interaction, or API contracts change.

### 7. Release/deployment

Release validation is deliberately broader than normal editing validation.

Follow `AGENTS.md` exactly, including the full repository checks, production build, Worker deployment, and public hostname health checks.

## Validation tiers

The project should not spend release-level resources proving a documentation or prose-only change.

### Tier A — documentation/authoring

No application test suite is required for Markdown-only documentation changes. Check links, commands, and consistency with current code/contracts.

### Tier B — content package

Use source audit, build, source comparison, and focused unit tests. Do not run responsive screenshots merely because prose changed.

### Tier C — map/scene

Run the scene generator, scene validation, public-integrity checks, and only the map browser tests affected by interaction/presentation changes.

### Tier D — UI/API

Run type checking and targeted unit/E2E tests. Expand to the complete browser suite when shared behavior is affected.

### Tier E — release

Run the complete required suite and production build before deployment.

The current GitHub Actions workflow still executes the broad validation matrix for application PRs. This document does not silently weaken that gate. CI optimization should be a separate, visible change that preserves Tier E before deployment while avoiding expensive jobs for changes that cannot affect them.

## Synchronization invariants

These should remain true after every merged application change:

1. README, authoring docs, architecture, and code describe the same publication behavior.
2. No public source path exists without explicit approval.
3. No approved source silently fails because an adapter only recognizes an unrelated title.
4. Public IDs/slugs are stable and unique.
5. Generated package revision/digest matches its source.
6. UI navigation is derived from or validated against the public package rather than duplicated content lists where practical.
7. 2D and 3D maps use the same spatial plan.
8. Unpublished map evidence remains paraphrased, pinned, and outside the reader package.
9. Generated files are reproducible.
10. Deployment architecture remains the Cloudflare Worker defined by `wrangler.jsonc`.

## Before starting work

Read, in order:

1. root `AGENTS.md`;
2. root `README.md`;
3. this synchronization contract;
4. `AUTHORING_FOR_PUBLICATION.md` for content metadata/publication work; and
5. the relevant specialized contract (publication, map evidence, API, etc.).

Then inspect the current branch and current generated package before making assumptions from an older conversation, plan, screenshot, or historical report.

## Before merging work

Confirm:

- the change stayed within its requested scope;
- no unrelated generated files moved;
- any new source kind is handled generically;
- author-facing docs changed when the author contract changed;
- application docs changed when routing/publication behavior changed;
- only the validation tier required by the change was run locally; and
- release-level checks are still available and required before deployment.

A green build is evidence about the build. It is not evidence that the Writing source, approval policy, routes, generated package, map evidence, and production deployment are all synchronized unless the checks for those layers were actually run.
