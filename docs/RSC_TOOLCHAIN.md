# Rock Springs Toolchain

The Rock Springs Toolchain is a specialized consumer of Draftworks. It is not part of the Draftworks core.

It has two responsibilities.

## 1. Analysis

Analysis reads permitted Rock Springs source material through Draftworks API v1 and produces structured, source-traced evidence.

The active read boundary is:

`toolchain/analysis/draftworks-source.mjs`

Analysis code must not read `micheal-writes` paths directly.

Typical outputs include:

- people;
- places;
- roads;
- buildings;
- districts;
- events;
- chronology;
- routes;
- spatial relationships;
- explicit versus inferred facts;
- confidence/source references.

Analysis does not generate final maps or GLBs and does not modify manuscripts.

### Current Analysis-like material

The current repository already contains derived evidence that belongs conceptually on this side of the boundary:

- `scene-data/rock-springs-map-evidence.json`
- `toolchain/analysis/evidence.mjs` owns the shared evidence validation contract used by Reconstruction and public-integrity checks

During migration, existing files may remain in place until their interfaces are stable.

## 2. Reconstruction

Reconstruction consumes structured evidence and produces spatial/visual interpretations.

Current Reconstruction-like material includes:

- `scene-data/jackies-window-spatial-plan.json`
- `toolchain/reconstruction/generate-town-scene.mjs`
- `toolchain/reconstruction/validate-scene.mjs`
- compatibility wrappers remain at `scripts/generate-town-scene.mjs` and `scripts/validate-scene.mjs` during migration
- `public/assets/scenes/**`

Reconstruction must preserve distinctions among:

- canon;
- inference;
- presentation-only geometry.

Reconstruction does not modify manuscripts.

## 3. Website presentation

The following are presentation responsibilities, not Analysis/Reconstruction authority:

- `src/components/chronicle/TownMapPanel.tsx`
- `src/components/scene/**`
- `src/scenes/**`
- related presentation styles and browser interactions.

The website consumes toolchain outputs.

## 4. Migration rule

Do not physically move working files merely to match the diagram.

First introduce clear interfaces and ownership. Move files only when doing so reduces coupling without breaking current behavior.

The final desired data flow is:

```text
Draftworks API
    |
    v
Rock Springs Analysis
    |
    v
Structured Evidence
    |
    v
Rock Springs Reconstruction
    |
    +--> Maps
    +--> GLBs
    '--> Scene Data
            |
            v
    Rock Springs Website
```


## Website consumer seam

Presentation code consumes Rock Springs Toolchain output through:

`src/adapters/rock-springs-toolchain.ts`

The 2D map and interactive scene must not bind directly to `scene-data/` or hard-code the scene-manifest storage path. This keeps Reconstruction storage separate from website presentation.
