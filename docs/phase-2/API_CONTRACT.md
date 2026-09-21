# Content API Contract

All API endpoints are same-origin JSON served by the production Worker.

## Core endpoints

- `GET /api/health`
- `GET /api/manifest`

## Generic work endpoints

- `GET /api/works`
- `GET /api/works/:workSlug`
- `GET /api/works/:workSlug/:entrySlug`

These are the preferred generic publication endpoints.

`/api/works` returns the public work registry.

`/api/works/:workSlug` returns one published work plus its public entry descriptors and entry data.

`/api/works/:workSlug/:entrySlug` returns one public readable entry scoped to its parent work.

Work-scoped lookup remains unambiguous even when multiple works use the same local entry slug.

## Collection compatibility endpoints

- `GET /api/collections/:collection`
- `GET /api/content/:collection/:slug`
- `GET /api/relationships/:collection/:slug`

Valid collections are:

- `chronicles`
- `people`
- `places`
- `events`
- `artifacts`
- `timeline`
- `media`

The older collection-plus-slug content/relationship endpoints remain for compatibility.

If a slug becomes ambiguous because more than one work uses it in the same collection, the compatibility endpoint returns HTTP 409 with:

`content_slug_requires_work`

It does not guess.

## States

- `ready` — requested data exists
- `empty` — valid collection/relationship set has no entries
- `unavailable` — unknown work, collection, or entry; HTTP 404
- `ambiguous` — compatibility slug needs work scope; HTTP 409
- `withdrawn` — public tombstone exists; HTTP 410

Unknown API routes return a generic JSON 404.

## Privacy/provenance

The generated package retains source provenance for deterministic build validation.

Public API responses strip entry provenance.

Responses never expose local Writing paths, repository credentials, or private source material.

## Caching

Successful content responses use:

```text
Cache-Control: public, max-age=300, stale-while-revalidate=3600
X-RSC-Package: <package-id>
```

The manifest exposes the source revision, content digest, work count, and collection counts for traceability without exposing the Writing repository location.
