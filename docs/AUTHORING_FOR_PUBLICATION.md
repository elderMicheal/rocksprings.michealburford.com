# Authoring for Publication

This document defines the author-side contract for Rock Springs material intended for presentation at `rocksprings.michealburford.com`.

Writing and publication remain separate concerns:

- the Writing repository owns manuscript prose, editorial metadata, and canon;
- the application repository owns public approval, stable web identity, normalization, routing, presentation, and deployment.

A source file is not public merely because it is canonical or marked `publish: true`.

## Author metadata

A public candidate should accurately describe itself in YAML front matter.

Common fields:

```yaml
---
publish: true
series: "The Rock Springs Chronicles"
type: "story"
title: "Example Title"
slug: "example-title"
order: 1
status: "draft"
canonical_status: "canonical"
---
```

### Common meanings

- `publish` — author intent that the source may be considered for public presentation.
- `series` — owning series.
- `type` — semantic source type.
- `title` — human-facing entry title.
- `slug` — stable public entry identifier when required.
- `order` — authored order inside its immediate work/section.
- `status` — editorial state in Writing.
- `canonical_status` — authority of the material within the writing system.

`status: published` is not application approval.

## Supported readable source types

The current generic publication builder accepts:

- `chapter`
- `interlude`
- `anthology-entry`
- `story`

Do not mislabel a source to fit the importer. If a legitimate new source type is unsupported, extend the shared publication model deliberately.

## Chapter metadata

A chapter normally includes:

```yaml
publish: true
series: "The Rock Springs Chronicles"
type: "chapter"
title: "Chapter 1"
book: 1
part: 1
order: 1
chapter: 1
status: "draft"
canonical_status: "canonical"
```

For chapters, the application may derive:

`chapter-01`

from the positive numeric `chapter` value when no explicit `slug` is present.

Authors may provide an explicit stable slug if the entry should use something else.

## Non-chapter slugs

Non-chapter readable entries must provide an explicit slug.

Use lowercase ASCII words separated by single hyphens:

```text
crosses-on-the-overpass
a-night-at-the-river
the-last-bell
```

Do not use:

- spaces;
- underscores;
- punctuation;
- smart quotes;
- file extensions;
- a complete URL.

Once a slug has shipped publicly, treat it as permanent unless a deliberate migration/redirect is approved.

## Work identity

An entry slug identifies a readable entry.

The parent **work** is registered in the application's approval manifest, not inferred from a filename.

Supported work kinds are:

- `novel`
- `anthology`
- `collection`
- `standalone`

A work registration provides:

- stable work ID;
- stable work slug;
- work kind;
- ordering within the public series.

The visible work title is derived from the source's top-level Markdown heading. Sources assigned to the same work must agree on that title.

This division is intentional:

- authors own the title and prose;
- the application owns public route identity.

## Public route shape

A registered work receives:

`/read/<work-slug>`

Entries with a numeric `part` use:

`/read/<work-slug>/part-<n>/<entry-slug>`

Entries without a numeric part use:

`/read/<work-slug>/<entry-slug>`

The site reader, navigation, and index derive these paths from the generated work registry.

Authors should not rename source files merely to manipulate public URLs.

## What elevates a source to presentation

A source becomes public only when all required layers agree:

1. **Source:** the Writing file contains the intended prose and accurate metadata.
2. **Intent:** `publish: true` reflects deliberate public intent.
3. **Canon:** `canonical_status` accurately describes source authority.
4. **Slug:** a valid stable slug exists when the source type requires one.
5. **Exact approval:** the application's `content-policy/approved-sources.json` names the exact source path.
6. **Work registration:** that approval identifies the stable parent work.
7. **Requirement match:** the approved front-matter requirements match the actual file.
8. **Supported adapter:** the generic builder recognizes the source type.
9. **Deterministic export:** the generated package records the source revision, work, route, and public entry.
10. **Validation:** the relevant content/package checks pass.

If one of these layers is missing, the source remains absent. The application must not guess.

## Adding an entry to an existing supported work

Author work:

1. put the source in its correct Writing location;
2. use the real source type;
3. set stable title/order metadata;
4. set `publish: true` only when public presentation is intended;
5. provide a slug when required;
6. commit the Writing change.

Application work:

1. add the exact path to an approval for the correct work;
2. declare requirements that match the source;
3. regenerate the source audit and publication package;
4. review the generated work/entry path;
5. run the content validation tier.

If the source type and work kind are already supported, adding another title should not require React routing code.

## Adding a new top-level work

For a new novel, anthology, collection, or standalone work using supported types, register a new work in the approval manifest.

Conceptually:

```json
{
  "id": "approval-id",
  "collection": "chronicles",
  "publicationState": "published",
  "work": {
    "id": "work:stable-id",
    "slug": "stable-work-slug",
    "kind": "anthology",
    "order": 2
  },
  "sourcePaths": [
    "exact/repository/path.md"
  ],
  "requirements": {
    "publish": true,
    "type": "anthology-entry"
  }
}
```

This is application configuration, not manuscript content.

Multiple approvals may contribute to the same work, but their work registration must agree exactly on ID, slug, kind, and order.

## What authors should not edit

Do not manually edit generated application artifacts:

- `generated/source-inventory.json`
- `src/content/generated/publication-package.json`
- generated scene GLBs;
- generator-owned scene manifest metadata.

Do not copy manuscript prose into React components, route tables, or presentation fixtures.

Do not use one-off application title checks to make a story appear.

## Editorial state versus public state

Editorial and public states remain independent.

A draft may be publicly presented when the owner explicitly approves the exact source. Canonical/internal material may remain private.

Application lifecycle states are:

- `private`
- `draft`
- `review`
- `publishable`
- `published`
- `withdrawn`

Only application state `published` is emitted into public collections.

## Author handoff checklist

Before requesting public presentation, verify:

- the file is in the correct Rock Springs subject/container;
- the prose is the intended version;
- the top-level work heading is correct;
- the metadata describes the actual source type;
- `canonical_status` is accurate;
- `publish: true` is deliberate;
- `order` is stable;
- a required slug is lowercase, hyphenated, unique within its work, and intended to remain stable;
- chapter/part metadata is present when the source is actually a chapter/interlude;
- the Writing commit containing the change is available for the application audit.

Application maintainers then follow [CONTENT_SYNC.md](CONTENT_SYNC.md).
