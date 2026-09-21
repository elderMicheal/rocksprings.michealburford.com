# Publication Contract

## Scope

This contract governs Rock Springs Chronicles material exported from the Writing repository into the public application.

Writing is authoritative for manuscript text and editorial/canonical metadata.

The application repository is authoritative for explicit public approval, stable web identity, normalization, routing, presentation, validation, and deployment.

## Admission rule

A source enters the public package only when:

1. it is below `Rock Springs Chronicles/`;
2. its exact relative path appears in an active approval;
3. approval requirements match its actual front matter;
4. `publish: true` confirms author intent;
5. its source type is supported;
6. its parent work is validly registered;
7. required slug/sequence metadata is valid;
8. the complete deterministic package validates.

There is no directory-wide implicit approval.

`publish: true`, canonical status, internal `status: published`, links, mentions, and filenames do not independently grant web publication.

## Works

Every readable public entry belongs to exactly one work.

Supported work kinds:

- `novel`
- `anthology`
- `collection`
- `standalone`

Work registration lives in the approval policy and defines:

- stable ID;
- stable slug;
- kind;
- order.

The visible work title is derived from source Markdown and must agree across sources registered to the same work.

Multiple approvals may contribute to one work only when their registration is identical.

## Readable entry kinds

Supported source adapters:

- `chapter`
- `interlude`
- `anthology-entry`
- `story`

Chapter slugs may derive mechanically from chapter number.

Other supported entry kinds require an explicit author slug.

## Publication and editorial states

Source editorial state and application publication state remain independent.

Only application state `published` enters public collections.

A source may remain an editorial draft while being explicitly approved for public presentation. Conversely, canonical/internal material may remain private.

Withdrawn records retain only the minimum public tombstone required for HTTP 410 behavior.

## Stable identity and routes

Work path:

`/read/<work-slug>`

Part section:

`/read/<work-slug>/part-<n>`

Sectioned entry:

`/read/<work-slug>/part-<n>/<entry-slug>`

Unsectioned entry:

`/read/<work-slug>/<entry-slug>`

Work IDs/slugs and reader paths must be unique. Entry slugs must be unique inside their work.

Existing shipped paths must not be changed without an explicit compatibility/migration plan.

## Text safety

The exporter removes Markdown/wiki-link destinations while retaining visible labels.

The public reader supports sanitized paragraph strings with limited inline emphasis. React escapes text.

Raw HTML, scripts, embeds, manuscript images, and arbitrary manuscript URLs are not rendered from source input.

## Provenance

Every readable entry records:

- repository-relative source reference;
- complete Writing revision;
- approval ID.

Provenance remains in the generated package for build diagnostics but is removed from public entry API responses.

## Package identity

The package records:

- complete Writing revision;
- active approval IDs;
- work registry;
- collection counts;
- SHA-256 content digest.

The digest covers works, collections, relationships, and withdrawal tombstones.

## Relationships and media

Relationships require an authored typed link between approved public entries. Plain mentions do not create public relationships.

Media requires its own approved public entry/contract. No source mention automatically publishes media.

## Failure behavior

The build fails rather than guessing when it encounters:

- missing approved paths;
- approval requirement mismatch;
- unsupported source/work kind;
- invalid/missing required slug;
- conflicting work registration;
- duplicate identities/routes;
- inconsistent work membership;
- unsafe provenance;
- broken relationships;
- stale generated package.

Schema-incompatible readers must fail rather than reinterpret data.
