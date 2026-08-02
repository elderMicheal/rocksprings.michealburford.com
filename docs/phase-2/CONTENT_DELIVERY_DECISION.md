# Content Delivery Decision

## Decision

Use a build-time approved export committed as a deterministic publication
package.

The exporter reads only exact allowlisted Writing-repository paths, validates
their front matter, normalizes safe public fields, and writes:

`src/content/generated/publication-package.json`

The browser and same-origin Worker consume that package. Neither accesses the
Writing repository at runtime.

## Why This Strategy

- deployment does not require private repository credentials;
- identical source, approval policy, and exporter produce identical bytes;
- a reviewed package can be rolled back with Git;
- content remains available if the Writing repository or network is offline;
- public fields can be separated from internal provenance at the API boundary.

The package intentionally contains approved manuscript text because the product
owner authorized full-text publication for Part 1 Chapters 1–8. The metadata
inventory never contains manuscript bodies.

## Rejected Alternatives

- Direct browser reads: exposes repository access and weakens availability.
- Runtime raw-file fetches: couples page reliability to repository layout.
- Content service storage: unnecessary operational complexity for the current
  eight-entry scope.

Reconsider server-side storage only when package size or update frequency makes
the build-time export materially impractical.

## Determinism

No wall-clock timestamp enters the package. Its identity derives from the
Writing Git revision and a SHA-256 digest of collections, relationships, and
withdrawn tombstones.
