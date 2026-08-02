# Content API Contract

All endpoints are same-origin JSON.

## Endpoints

- `GET /api/health`
- `GET /api/manifest`
- `GET /api/collections/:collection`
- `GET /api/content/:collection/:slug`
- `GET /api/relationships/:collection/:slug`

Valid collections are `chronicles`, `people`, `places`, `events`, `artifacts`,
`timeline`, and `media`.

## States

- `ready`: requested data exists
- `empty`: a valid collection or relationship set has no entries
- `unavailable`: unknown collection or entry; HTTP 404
- `withdrawn`: a public tombstone exists; HTTP 410

Unknown API routes return a generic JSON 404. Responses never expose local
paths, repository credentials, or entry provenance. Public Chronicle bodies
contain only approved safe paragraph strings.

Successful content responses use:

```text
Cache-Control: public, max-age=300, stale-while-revalidate=3600
X-RSC-Package: <package-id>
```

The manifest exposes the source revision and content digest for traceability,
but not the Writing repository location.
