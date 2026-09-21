# Publication Schema

`src/content/types.ts` is the TypeScript contract.
`src/content/schema.ts` is the runtime validator.

The current package uses `schemaVersion: 2`.

## Package

```text
schemaVersion
manifest
  packageId
  sourceRevision
  contentDigest
  approvalId?          # compatibility when one approval is active
  approvalIds[]
  workCount
  world
  collection counts
works[]
collections
  chronicles
  people
  places
  events
  artifacts
  timeline
  media
relationships
withdrawn
```

## Work registry

Each published work contains:

```text
id
slug
title
kind
order
publicationState
path
sections[]
entries[]
```

Supported work kinds:

- `novel`
- `anthology`
- `collection`
- `standalone`

### Sections

Numeric manuscript parts become work sections with:

- stable section ID;
- `part-N` slug;
- title/navigation label;
- order;
- reader path;
- exact entry IDs.

Works without numeric parts may have no sections.

### Work entry descriptors

Each work descriptor contains:

- public entry ID;
- entry-local slug;
- semantic kind;
- final reader path;
- optional section ID.

The descriptor points to the actual public body in `collections.chronicles`.

Entry slugs need only be unique within their work. Reader paths are globally unique.

## Chronicle entries

Chronicle entries retain:

- stable ID/slug;
- title;
- public/editorial state;
- private build provenance;
- source ordering metadata;
- sanitized paragraph content;
- mechanically generated excerpt/word-count/reading-time data.

Sequence metadata supports numbered book/part/chapter fields when the source actually has them. Unsectioned anthology/story entries are not required to invent numeric chapter structure.

## Digest

`manifest.contentDigest` is SHA-256 over deterministic JSON containing:

- `works`;
- `collections`;
- `relationships`;
- `withdrawn`.

The package ID combines the Writing revision prefix with the digest prefix.

Changing prose, public work structure, public paths, relationships, or withdrawal state therefore changes package identity.

## Validation

Runtime/build validation rejects:

- non-published public entries/works;
- malformed work or entry slugs;
- duplicate work IDs/slugs;
- duplicate entry IDs;
- duplicate entry slugs within one work;
- duplicate reader paths;
- missing work membership;
- an entry assigned to multiple works;
- broken section membership;
- unsafe/non-RSC provenance;
- malformed body data;
- broken relationships;
- inconsistent manifest counts.

All non-`chronicles` collections remain explicit arrays even when empty.
