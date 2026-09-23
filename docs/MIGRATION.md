# Draftworks / Rock Springs Migration

## Baseline freeze — 2026-09-22

Before migration, the current working state was frozen in all repositories directly involved in the writing/monitor/Rock Springs flow.

| Repository | Normal branch | Frozen commit | Archive branch |
| --- | --- | --- | --- |
| `elderMicheal/rocksprings.michealburford.com` | `main` | `d754824313bffdf5de00897a12e2221c89f07321` | `archive/pre-draftworks-2026-09-22` |
| `elderMicheal/micheal-writes` | `primary` | `98cf506e67cd2f17c1a2a748505b0ba295cc770f` | `archive/pre-draftworks-2026-09-22` |
| `elderMicheal/writing-metrics` | `Primary` | `ae858683f4df752a7bbbe3e1ffb3c148347a6ba0` | `archive/pre-draftworks-2026-09-22` |
| `elderMicheal/MichealBurford.com` | `main` | `512f5512c286b6b8fb2b1c17210b921db9215e61` | `archive/pre-draftworks-2026-09-22` |

These branches are recovery snapshots. Normal migration work must not rewrite them.

## Active migration branch

Rock Springs extraction begins on:

`migration/draftworks-rsc-extraction`

## Migration order

### Phase 1 — Box Rock Springs

- replace contradictory governing documentation;
- centralize current writing-data access behind one transitional adapter;
- box legacy Writing-repository inspection/export under `transitional/writing-adapter/`;
- identify Analysis, Reconstruction, and Website responsibilities;
- stop adding new direct Writing/package coupling.

### Phase 2 — Separate the Rock Springs Toolchain

- isolate Analysis responsibilities;
- isolate Reconstruction responsibilities;
- preserve current output while boundaries are introduced;
- give Analysis a temporary read-only source adapter until Draftworks API exists.

### Phase 3 — Restructure Draftworks

Outside this repository:

- separate Telemetry;
- separate Library;
- define Editorial Tools mutation boundary;
- build read-only versioned API.

### Phase 4 — Migrate consumers

- point Rock Springs Analysis at Draftworks API;
- point Writing Monitor web/desktop consumer at Draftworks API;
- reduce Rock Springs website to presentation consumption.

### Phase 5 — Cleanup

Only after replacements are verified:

- remove temporary adapters;
- remove obsolete generated-publication authority;
- remove duplicate approval/publication rules;
- remove direct repository coupling;
- remove title-specific core assumptions.

## Rollback

At any point before migration completion, the frozen branches identify the exact pre-migration state.

Rollback must restore code/configuration from those known commits without overwriting newer manuscript work.

Never use downstream generated data to reconstruct or overwrite the Writing repository.
