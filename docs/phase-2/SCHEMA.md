# Publication Schema

`src/content/types.ts` is the TypeScript contract.
`src/content/schema.ts` is the runtime validator.

## Package

```text
schemaVersion
manifest
  packageId
  sourceRevision
  contentDigest
  approvalId
  world
  collection counts
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

The current package has eight `chronicles` entries and explicit empty arrays
for every other collection. Empty collections are data, not missing keys.

Each Chronicle entry contains stable identity, sequence, public state,
editorial state, provenance, safe paragraph content, and mechanically derived
presentation metadata.

Runtime validation rejects non-published collection entries, duplicate IDs or
slugs, unsafe source references, malformed bodies, broken relationships, and
inconsistent collection counts.
