# Rock Springs shared spatial evidence

The public 2D diagram and interactive 3D scene are two renderings of one model:
`scene-data/jackies-window-spatial-plan.json`. They may not maintain separate
roads, landmark coordinates, cameras, routes, or relationships.

The map model is audited against Writing revision
`3fd095b8f3e36215deef39e7de899c278a147e94`. Immutable source blobs and
paraphrased facts are recorded in
`scene-data/rock-springs-map-evidence.json`.

## Two separate approval boundaries

Reader publication and map evidence are intentionally independent:

- The public reader remains limited to the exact paths in
  `content-policy/approved-sources.json`.
- Canonical unpublished writing may inform derived geography, architecture
  categories, and city character.
- Using an unpublished source as map evidence does not publish that source,
  admit it to the reader, or permit manuscript prose to be copied into this
  repository.
- Every unpublished evidence source must be canonical, pinned to a Git blob,
  represented only by paraphrased facts, and identified as `publish: false`.

## Coordinate contract

- `+X` is east, `+Z` is north, and `+Y` is elevation.
- North is up on the 2D map.
- One horizontal plan unit equals ten feet.
- Main Street is Highway 13 through Rock Springs and is fixed north-south.
- Broad Street crosses Main Street east-west.
- Source-stated distances and relative directions are machine-checked.
- Exact coordinates and dimensions remain interpretive unless the evidence
  catalog explicitly classifies them as confirmed.

## Confirmed city structure

The shared model must preserve these source-derived facts:

- Main Street/Highway 13 runs north-south.
- Broad Street intersects Main.
- A railroad trestle over Highway 13 marks the informal metro/rural transition.
- Downtown reaches a normal maximum of six stories before transitioning
  abruptly to 1950s residential development.
- Main Street and parts of downtown show cracked pavement, sparse greenery,
  deteriorating storefronts, and invasive weeds.
- The final downtown block includes maintained Eisenhower-era gray-brick local
  storefronts.
- New Beginnings occupies four renovated turn-of-the-century houses.
- Partridge Street separates a maintained homeowner side from a deteriorated
  rental and old-school side; Oak intersects Partridge.
- A sound barrier separates that neighborhood from a nearby industrial
  trainyard.
- The south side contains mills, docks, smokestacks, and industrial pollution.
- A diner and L-shaped strip mall occupy a large asphalt commercial lot.
- Two twenty-story brutalist Stanford towers dominate the skyline, one on each
  side of the river, despite the ordinary six-story cap.

## Inference boundary

The writing does not provide a surveyed city plan. The following remain
presentation choices and must be labeled as inferred:

- which edge of the city contains the trestle and rural transition;
- exact block lengths, street offsets, and river bends;
- exact district footprints and the placement of unnamed streets;
- exact locations of the south-side industry, diner complex, and Stanford
  towers beyond their stated relationships;
- exact building dimensions, window patterns, roof forms, and materials within
  source-confirmed architectural categories; and
- terrain, vegetation, parked vehicles, utility details, and connective
  geometry.

## Integrity and delivery rules

- Every map record cites either an approved Chapter 1–8 locator or an
  `Evidence:<fact-id>` entry from the evidence catalog.
- Both renderers import the shared spatial-plan JSON.
- The GLB generator writes the model and synchronizes its hash, byte count,
  statistics, views, routes, and required landmark contract into the scene
  manifest in the same operation.
- Validation fails if Main Street is not north-south, Broad does not cross it,
  evidence references are missing, unpublished evidence lacks the no-prose
  boundary, a GLB coordinate differs from the shared plan, or the artifact
  exceeds its size/complexity budgets.
- The public 3D scene lives at `/map` and is linked from the front-page 2D map.
- No map update is complete until the regenerated GLB and synchronized manifests
  are committed and revalidated from the intended branch.

## Node naming contract

- `CANON_*` identifies a source-established feature or relationship.
- `INFERRED_*` identifies a useful placement derived from incomplete evidence.
- `PRESENTATION_*` identifies connective or atmospheric geometry.
- A `CANON_*` node does not make an unstated coordinate or dimension canonical.
