# Authoring for Publication

This document is for writers working in the separate Writing repository who want Rock Springs material to be eligible for presentation at `rocksprings.michealburford.com`.

It describes the **author-side contract**. It does not grant publication approval and it does not replace application-side work when a new content type or top-level work needs presentation support.

## The central rule

Writing and publication are separate concerns.

The Writing repository owns the words and their editorial state. The application repository decides what may cross the public boundary and how approved material is presented.

A source file does not appear on the site simply because:

- it exists under `Rock Springs Chronicles/`;
- its filename looks like a route;
- it is canonical;
- it contains `publish: true`; or
- it is linked from another note.

Those signals may establish author intent or editorial authority. They are not, by themselves, public approval.

## What an author controls

Authors should make the source file internally coherent and stable enough for a maintainer to approve without inventing metadata.

For publishable prose, preserve these concepts in YAML front matter:

```yaml
---
publish: true
series: "The Rock Springs Chronicles"
type: "..."
title: "..."
order: 1
status: "draft"
canonical_status: "canonical"
---
```

Additional fields depend on the source family. Existing chapter files use fields such as `book`, `part`, and `chapter`. Anthology material may use a named container instead of a numeric book. Follow the established convention for the family you are writing; do not falsify a numeric book or chapter merely to fit the current reader.

### Meaning of the common fields

- `publish`: author intent that this source may be considered for public presentation. It is necessary for the current chapter importer but is not final approval.
- `series`: owning series.
- `type`: semantic source kind, such as `chapter` or `anthology-entry`.
- `title`: human-facing title.
- `order`: authored ordering within its immediate container.
- `status`: editorial lifecycle in the Writing repository.
- `canonical_status`: authority of the material within the writing system.

Do not use `status: published` as a substitute for application approval.

## Slugs

A public slug is a stable route identifier, not a display title.

Use lowercase ASCII words separated by single hyphens:

```text
crosses-on-the-overpass
the-feud-of-the-vampires
chapter-01
```

Do not use spaces, punctuation, underscores, smart quotes, file extensions, or a full URL.

### Current implementation warning

The current application does **not** yet read an arbitrary author-supplied `slug` and automatically publish the file.

The existing _Jackie's Window_ Part One importer derives chapter slugs mechanically:

```text
chapter-01
chapter-02
...
```

For material outside that specialized pipeline, an author may record a proposed stable slug in front matter for future presentation work:

```yaml
slug: "crosses-on-the-overpass"
```

but that field is currently **publication intent metadata**, not an automatic switch. A maintainer must still admit the exact source path and provide presentation support for its content family.

Once a public slug has shipped, treat it as permanent unless there is a deliberate redirect/migration plan.

## What actually elevates a source to presentation

A source reaches the public site only when all applicable layers agree:

1. **Authored source:** the Writing file contains valid metadata and the intended prose.
2. **Publication intent:** the author marks the source appropriately, including `publish: true` when public presentation is intended.
3. **Explicit approval:** the exact source path is added to `content-policy/approved-sources.json` in the application repository.
4. **Supported source type:** an application adapter knows how to normalize that source family safely.
5. **Stable identity:** the application assigns/accepts a unique public ID and slug.
6. **Package generation:** the deterministic publication package contains the entry and records the Writing revision.
7. **Presentation registration:** the reader/index/router exposes the supported entry without duplicating its content in application code.
8. **Validation:** the appropriate source, package, routing, and presentation checks pass.

If any layer is missing, the material should remain absent rather than being guessed into place.

## Adding another story to an existing collection

Author-side work:

1. Put the file in the correct Writing subject/container.
2. Use the source family's established front matter.
3. Give it a stable title and order.
4. If public presentation is intended, set `publish: true`.
5. If a future public route is known, reserve a stable lowercase-hyphen `slug`.
6. Commit the Writing change normally.

Application-side work is still required unless that source family already has a generic importer and presentation index.

Do not rename files merely to make the site notice them. File names are provenance; public routes are application identities.

## Adding a new top-level work or volume

A new book, anthology, collection, or comparable top-level work is not just another route.

Before it can appear, the application must have a generic representation for:

- the work's stable identity;
- its title and kind;
- its ordering within the series;
- child entries and their ordering;
- the public route shape;
- index/home-page presentation;
- approval behavior;
- withdrawal behavior; and
- provenance back to Writing.

The correct implementation is to extend the shared content model/registry so later works of the same kind use the same path.

The incorrect implementation is to add a title-specific `if` statement, hard-code prose, or create a one-off route that only understands one story.

## Editorial state versus public state

These are intentionally separate.

A working draft may be publicly presented when the owner explicitly approves that exact source. Conversely, canonical or internally "published" back matter may remain private.

The public application currently understands these application lifecycle states:

- `private`
- `draft`
- `review`
- `publishable`
- `published`
- `withdrawn`

Only application state `published` appears in public collections.

## What authors should not edit

Authors should not manually edit generated site artifacts to publish prose:

- `generated/source-inventory.json`
- `src/content/generated/publication-package.json`
- scene manifests or generated GLBs

Authors also should not copy unpublished prose into React components, JSON presentation fixtures, or route code.

If the site cannot express a legitimate source type, that is an application-model gap to fix explicitly.

## Author handoff checklist

Before asking for a source to appear publicly, verify:

- the file is in the correct Rock Springs source location;
- the prose is the intended version;
- the metadata describes what the file actually is;
- `canonical_status` is accurate;
- `publish: true` reflects deliberate public intent;
- ordering metadata is stable;
- any proposed slug is lowercase, hyphenated, unique, and intended to remain stable; and
- the Writing commit containing the change is available for the application audit.

The application maintainer can then perform the approval, package, route/index, and validation steps described in [CONTENT_SYNC.md](CONTENT_SYNC.md).
