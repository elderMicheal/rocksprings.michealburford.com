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

## Transitional state

Draftworks API v1 does not yet exist.

For compatibility, Rock Springs currently consumes its existing generated publication package through one replaceable adapter:

`src/adapters/writing-source.ts`

No other application module should bind directly to that generated package.

Once Draftworks API v1 exists, the adapter changes implementation while the Rock Springs consumer-facing code remains stable.

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
