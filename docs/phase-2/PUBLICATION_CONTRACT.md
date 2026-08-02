# Publication Contract

## Scope

This contract governs Rock Springs Chronicles material exported from the
Writing repository into the public exhibit application.

The Writing repository is authoritative for manuscript text. The application
repository is authoritative for approval records, normalization, validation,
routing, presentation, and deployment.

## Admission Rule

A source file enters a public package only when all of these are true:

1. it is below `Rock Springs Chronicles/`;
2. its relative path exactly matches `content-policy/approved-sources.json`;
3. every approval requirement matches its front matter;
4. the exporter recognizes its type and schema;
5. the complete package passes deterministic validation.

No directory-wide implicit approval, status-only approval, or fallback content
is allowed.

## Publication and Editorial States

The application publication states are `private`, `draft`, `review`,
`publishable`, `published`, and `withdrawn`.

Source editorial status and application publication state are independent.
For the current package, the product owner's explicit approval maps the eight
Part 1 chapter paths to application state `published`; their source
`status: draft` remains exposed as `editorialStatus` and is rendered as
“Working draft.”

Only application state `published` can appear in a collection. Withdrawn
records become minimal tombstones and return HTTP 410. Every other state is
excluded.

## Stable Identity

- Entry ID: `chronicle:<book-slug>:part-<n>:chapter-<nn>`
- Public slug: lowercase ASCII words separated by hyphens
- Provenance reference: repository-relative RSC path
- Package identity: source-revision prefix plus content-digest prefix

IDs and slugs must be unique within a package. Changing a source filename does
not silently retain identity; it requires an approval-manifest update and
review.

## Public Chapter Fields

The current `chronicles` entries may expose:

- ID, slug, title, and `published` state
- source editorial status
- series, book, part, order, and chapter sequence
- approved manuscript paragraphs
- mechanically computed excerpt, word count, and reading time

The public API removes provenance paths. The package retains provenance for
build diagnostics.

## Text Safety

The exporter removes Markdown and wiki-link destinations while retaining
visible labels. The reader supports only plain text plus emphasis and strong
emphasis. React escapes all text. Raw HTML, scripts, embeds, images, and
arbitrary URLs are never rendered from manuscript input.

## Relationships and Media

Relationships require an authored, typed link between two approved public
entries. Plain mentions do not create public relationships.

Media requires a separate approved entry with descriptive alt text. The
current package contains no approved canonical media.

## Failure and Evolution

Malformed front matter, an approval mismatch, duplicate identity, unsafe
provenance, broken relationships, or an inconsistent manifest fails the build.
Schema changes increment `schemaVersion`; incompatible readers must fail rather
than guess.
