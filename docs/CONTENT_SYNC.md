# Content Synchronization and Change Discipline

This document defines how Writing, public approvals, the generated publication package, application routing, map evidence, generated scene artifacts, CI, and deployment remain aligned.

The rule is: **one concern, one authority**. Derived copies must never become competing sources of truth.

## Sources of truth

| Concern | Authority | Derived copies must not override it |
| --- | --- | --- |
| Manuscript prose and canon | Writing repository | Site code, generated package |
| Author editorial metadata | Writing repository | UI labels invented in code |
| Public publication permission | `content-policy/approved-sources.json` | `publish: true`, filenames, links |
| Public work identity | approval `work` registration | inferred title-specific routing |
| Normalized public package | generic publication builder + approved Writing revision | hand-edited JSON |
| Reader routing/presentation | generated work registry + generic reader | source filenames |
| 2D/3D spatial model | `scene-data/jackies-window-spatial-plan.json` | component-local coordinates |
| Map evidence | `scene-data/rock-springs-map-evidence.json` | unpinned prose recollection |
| Generated scene | scene generator + shared plan | hand-edited GLB/manifest metadata |
| Hosting/routing | `wrangler.jsonc` + `AGENTS.md` | CI/provider workarounds |

When two layers disagree, fix the authoritative layer and regenerate. Do not patch a derived artifact around the disagreement.

## Publication pipeline

The publication system is work-driven and approval-driven.

```text
Writing source
  -> exact approval
  -> work registration
  -> source-type adapter
  -> deterministic package
  -> generic work/index routing
  -> public reader
```

The builder:

1. reads all active exact-path approvals;
2. validates approval requirements against Writing front matter;
3. merges approvals that register the same work;
4. normalizes supported source types;
5. creates stable work/section/entry paths;
6. builds the package;
7. validates identities and memberships;
8. records the Writing revision and active approval IDs;
9. hashes works, collections, relationships, and withdrawals into the content digest.

No title is application architecture.

## Current supported publication model

Work kinds:

- `novel`
- `anthology`
- `collection`
- `standalone`

Entry/source kinds:

- `chapter`
- `interlude`
- `anthology-entry`
- `story`

A new entry using an existing supported kind should normally require source metadata, approval, regeneration, and review — not new React routing.

A genuinely new source kind may require a new generic adapter and schema work.

## Generated files

Do not hand-edit:

- `generated/source-inventory.json`;
- `src/content/generated/publication-package.json`;
- generated scene GLBs;
- generator-owned scene manifest fields.

Regenerate them from their owning source and review the diff.

The publication package is reproducible only when:

- its source revision matches the intended Writing commit;
- its approval IDs are current;
- its work registry matches approvals;
- its digest matches works/public data;
- the committed JSON matches `content:check:source`.

## Change classes

### 1. Writing only, not being published

Examples: drafting, private notes, editorial cleanup.

Application action: none.

Do not rebuild this application merely because Writing changed.

### 2. Existing approved prose changed; identity unchanged

Use:

```sh
npm run content:audit:source
npm run content:build
npm run content:check:source
npm run test:unit
```

Expected changes are generated metadata/package data. Route code should not change because prose changed.

### 3. New entry in an existing supported work

Required:

1. verify author metadata and slug;
2. add the exact path to the appropriate approval;
3. ensure the work registration is unchanged/correct;
4. regenerate audit/package;
5. verify order and generated path;
6. run content validation.

No title-specific UI code should be needed.

### 4. New supported top-level work

For a new novel/anthology/collection/standalone using supported entry kinds:

1. add an approval with a unique stable work ID/slug/kind/order;
2. approve exact source paths;
3. regenerate;
4. verify the work appears in the generated work registry and index/navigation;
5. verify reader paths;
6. run content + relevant reader validation.

This is primarily a content/configuration operation now.

### 5. New source kind or presentation behavior

This is architecture work.

Define:

- source metadata;
- adapter validation;
- work/entry semantics;
- route behavior;
- API representation;
- withdrawal behavior;
- author documentation;
- focused tests.

Do not implement it as a title-specific exception.

### 6. Map evidence or spatial change

Reader publication and map evidence remain separate.

Use:

```sh
npm run scene:generate
npm run scene:check
npm run public:check
```

Every map update must preserve the shared 2D/3D spatial plan and the unpublished-prose boundary.

### 7. UI/API behavior change

Run type checking, unit tests, relevant browser tests, and build according to the affected surface.

### 8. Release/deployment

Follow `AGENTS.md` exactly. Production deployment still requires the complete release procedure and public-hostname health verification.

## Change-aware CI

CI performs a lightweight path classification before installing dependencies.

The classifier distinguishes:

- documentation;
- content/publication;
- map/scene;
- application/UI/API;
- shared toolchain/configuration;
- lockfile/dependency changes.

For non-documentation changes, dependencies are installed once in the validation job.

### Documentation-only

No Node install, Playwright install, scene regeneration, application tests, or build.

The classification/completion gates still run.

### Content/package

Runs package/source-integrity validation and focused unit tests.

Browser tests are selected only if reader/presentation code changed.

### Map/scene

Runs deterministic scene generation, scene validation, and public-integrity validation.

Browser map/scene specs are selected when interactive/presentation code changed.

### UI/API

Runs Worker type generation, TypeScript checking, unit tests, relevant browser specs, and production build.

### Shared toolchain/configuration

Runs broad validation because the change may affect multiple surfaces.

### Dependency audit

`npm audit --audit-level=high` is tied to lockfile/full-release validation rather than every ordinary source change. Dependabot remains the recurring dependency update mechanism.

### Full release validation

A manual GitHub Actions `workflow_dispatch` classifies the run as full release validation and selects the complete validation matrix.

This is not deployment. Deployment remains governed by `AGENTS.md`.

### Run cancellation

CI uses concurrency cancellation so a new push supersedes an older in-progress run for the same branch/PR.

## Validation tiers

### Tier A — documentation

Check current contracts/links/commands. No application suite.

### Tier B — publication content

Audit/build/source-compare + focused unit validation.

### Tier C — map/scene

Generator + deterministic diff + scene/public-integrity checks; targeted browser validation only when behavior changed.

### Tier D — application

Type checking + unit tests + targeted E2E + build.

### Tier E — release

Complete repository validation and build before deployment.

Use the smallest tier that proves the requested change. Never claim a broader property than the checks actually proved.

## Synchronization invariants

After every merged application change:

1. README, authoring docs, architecture, approval workflow, schema, and code describe the same behavior.
2. No source becomes public without exact approval.
3. `publish: true` alone never grants public eligibility.
4. Every public chronicle entry belongs to exactly one published work.
5. Work IDs/slugs are unique.
6. Entry slugs are unique within their work.
7. Reader paths are globally unique.
8. Existing shipped URLs remain stable unless an explicit migration is approved.
9. Generated package revision, approval IDs, work registry, and digest agree.
10. Navigation/index presentation derives from package work data rather than title lists where practical.
11. 2D and 3D maps use one spatial plan.
12. Unpublished map evidence remains paraphrased/pinned and outside reader prose.
13. Generated artifacts are reproducible.
14. Production remains the Cloudflare Worker defined by `wrangler.jsonc`.

## Before starting work

Read:

1. `AGENTS.md`;
2. `README.md`;
3. this file;
4. `AUTHORING_FOR_PUBLICATION.md` for publication changes;
5. the relevant specialized contract.

Inspect the current branch/package before relying on an older conversation, report, screenshot, or planning document.

## Before merging

Confirm:

- requested scope was respected;
- no unrelated generated artifacts changed;
- new content uses generic work/type behavior;
- author docs changed if metadata behavior changed;
- schema/API docs changed if contracts changed;
- the correct validation tier ran;
- existing public URLs are preserved;
- the release gate remains available;
- no hosting/DNS/deployment architecture changed.

A green build proves the build. It does not by itself prove Writing approval, package synchronization, map evidence, or production deployment.
