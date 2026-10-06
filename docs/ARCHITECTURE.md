# Current Architecture

## Core rule

**Write once. Draftworks provides structured access. Consumers decide what to do with it.**

Rock Springs is a consumer.

## Authority and responsibility

```text
micheal-writes
    |
    v
Draftworks
    |- Telemetry
    |- Library
    |- Read-only API
    '- Editorial Tools
          |
          +--------------------+
          |                    |
          v                    v
Writing Monitor        Rock Springs Toolchain
web + desktop              |
                           |- Analysis
                           '- Reconstruction
                                  |
                                  v
                         Rock Springs Website
```

## Rock Springs application boundary

The Rock Springs website may consume:

- permitted writing content and metadata from Draftworks;
- maps, GLBs, scene data, and other derived assets from the Rock Springs Toolchain.

The website should not own:

- manuscript parsing;
- general publication eligibility for the writing platform;
- direct Writing repository synchronization;
- evidence extraction;
- spatial interpretation;
- GLB generation.

## Draftworks runtime consumption

Draftworks API v1 is the active writing-data boundary.

The Worker fetches Draftworks server-side in `worker/api/draftworks.ts`, converts generic Draftworks resources into the Rock Springs reader model, and exposes that adapted model at `/api/publication`.

The browser initializes `src/adapters/writing-source.ts` from the same-origin publication endpoint before loading the React application.

The Worker keeps a short in-memory cache and may serve its last valid package during a temporary Draftworks failure. The browser may similarly use its last valid public package as a resilience cache.

The legacy generated package is no longer runtime authority.

## Toolchain boundary

Rock Springs Analysis and Reconstruction are specialized consumers, not Draftworks components.

See `docs/RSC_TOOLCHAIN.md`.

## Hosting

The architecture migration does not change the production hosting model. The React application and same-origin Worker remain one Cloudflare Worker deployment.


## Presentation adapters

The website must not know the storage layout of upstream/derived data.

Current presentation seams:

- `src/adapters/writing-source.ts` — transitional writing-data boundary.
- `src/adapters/rock-springs-toolchain.ts` — website-facing boundary for map/scene outputs.

`npm run boundary:check` enforces these seams and prevents presentation/Worker code from reaching around them.
