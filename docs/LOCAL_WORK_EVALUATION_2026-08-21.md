# Local Work Evaluation — 2026-08-21

## Decision

The pre-existing Jackie’s Window scene/content work was not eligible for
`main` or production. On 2026-08-21, the owner explicitly directed that the
incompatible work be discarded. Its local and remote preservation branch was
deleted and it must not be restored or merged.

This decision follows the production mandate in the repository root. The work
must not be deployed merely because it builds; it must remain compatible with
the current application architecture and pass the public application checks.

## What was evaluated

The local work contained:

- a Writing-repository inventory and approved eight-chapter package refresh;
- new Chapter 9–10 spatial evidence without publication of those chapters;
- a revised spatial plan, generated GLB, manifests, and evidence notes;
- scene generation and validation changes;
- scene runtime, controls, styling, and browser-test changes; and
- updated Chapter 7 reader expectations because that approved chapter now
  contains prose.

## Validation findings

The original local state was internally inconsistent:

- the GLB placed the old-school reference at a coordinate different from the
  spatial plan;
- regeneration produced a 1,133,612-byte model, exceeding the 1 MB budget;
- the regenerated model contained 1,629 nodes, exceeding the 900-node budget;
  and
- the scene manifest retained the prior artifact’s ID, byte count, digest, and
  statistics.

The evaluated candidate repaired those internal scene defects by retaining the
evidence-backed additions while simplifying presentation-only terrain, road,
and route geometry. The repaired artifact validates at:

- 468,384 bytes;
- 900 nodes;
- 44 meshes and primitives;
- 8,958 base triangles and 21,042 rendered triangles;
- 12 cameras and 9 routes; and
- 0 public anchors.

The repaired local work passed type-checking, metadata audit, approved-content
validation, public-integrity validation, deterministic scene generation, scene
validation, unit tests, and a production build on its original base.

## Why it is quarantined

Recovered `main` contains the approved front-page redesign. That redesign does
not mount or route to `ExhibitScene`, `RockSpringsScene`, or `TownMapPanel`.
Applying the local bundle to recovered `main` therefore leaves the scene and map
UI unreachable.

The combined browser suite completed with 9 passing and 33 failing tests across
mobile, tablet, and desktop. Failures included missing map/scene surfaces,
front-page expectations from the superseded layout, and reader visual/text
baselines changed by the new source revision.

Reintroducing the former exhibit composition would materially change the
approved redesign. Updating visual snapshots without product review would only
hide that architectural conflict. Neither action is authorized by a content
refresh or deployment request.

## Conditions for any future replacement

Any future scene or map work must start as a deliberate change against current
`main` that:

1. decides where the scene and map belong in the current redesigned
   application;
2. makes those surfaces intentionally reachable and accessible;
3. reviews the Chapter 7 content and reader visual baseline;
4. updates browser expectations to the chosen current interface rather than a
   superseded layout;
5. passes the complete repository validation on current `main`; and
6. follows the production release procedure in `AGENTS.md`.

Until those conditions are met, production remains the recovered application
architecture plus the deployment mandate. The discarded work must not be
silently restored or deployed.
