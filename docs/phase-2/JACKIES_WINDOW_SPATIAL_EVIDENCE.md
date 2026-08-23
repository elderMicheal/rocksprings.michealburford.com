# Jackie's Window spatial evidence

This document defines the source boundary for the Rock Springs geography used by
both the 3D GLB and the 2D front-page map. It covers *Jackie's Window*, Part 1,
Chapters 1–8 at Writing-repository revision
`3fd095b8f3e36215deef39e7de899c278a147e94`.

The Writing repository is authoritative. The public scene remains restricted to
the site's existing `jackies-window-part-one-chapters` approval allowlist. Current
Chapter 9 and Chapter 10 drafts are deliberately excluded from the public map.

Both public spatial surfaces render the same plan:
`scene-data/jackies-window-spatial-plan.json`.

## Current manuscript audit

The current Part One writing materially changes the old spatial baseline:

- Chapter 3 still places Abby on the fourth floor at the southeast edge of downtown, with the river south of her and New Beginnings roughly 1,800 feet to the northwest beyond the old school and staging area.
- Chapter 5 places Jeremy in the old-school parking lot across the street from Jackie's ugly red house, less than 100 feet away, with a view toward her bedroom window.
- Chapter 6 names Partridge Street, Oak Street and Amity Street; establishes eight houses on the west side of Partridge with four belonging to New Beginnings; places Main Street one block away; adds the rear alley, the Oak Street sound barrier and nearby trainyard; and describes the five-road Providence/Main intersection with a small triangular founder-statue island.
- Chapter 7 adds Mark Ledford's south-side home and Jefferson route, south-side mills/docks/smokestacks, a bridge to the north side, the east-side diner and L-shaped strip mall, and two twenty-story Stanford towers with one on each side of the river. The diner is nearly two miles from the parade, with downtown between them.
- Chapter 8 supplies regional approach distances on a highway sign. Those values are represented only as regional context, not as a surveyed road alignment.

## Coordinate contract

- `+X` is east, `+Z` is north, and `+Y` is elevation.
- One horizontal plan unit equals ten feet (`3.048` meters).
- The GLB converts horizontal plan coordinates to meters.
- Absolute coordinates and unstated bearings are presentation choices.
- Source-stated distance constraints are machine checked.

The current plan preserves these source constraints:

- Abby to New Beginnings: approximately 1,800 feet, northwest.
- Jackie's house to the old-school staging lot: less than 100 feet at the closest modeled footprints.
- The river remains south of Abby.
- The old school and staging lot remain between Abby and New Beginnings.
- Main Street, the staging lot and Jackie's house retain the required local south-to-north order used by the shared map.

## New Beginnings block

The updated blockout models the Chapter 6 relationship without asserting a surveyed lot plan. Partridge is represented as the street separating the New Beginnings side from the deteriorated old-school side. The west side contains eight presentation houses. Four consecutive houses represent the campus; the separately traced Jackie house is the fourth and last campus house and the fifth house on the modeled street. Three additional houses continue toward the Oak Street intersection, reflecting the prose statement that the campus house is three doors down from the intersection.

The exact lot widths, architectural forms, tree placement and street bearing are not canon.

## Chapter 6 route

`PATH_Monte_Perimeter` preserves the prose sequence rather than claiming a surveyed route: north from the house on Partridge, left at Oak, past the rear alley choice, toward Oak's T-intersection and trainyard sound barrier, around onto Amity, then back toward the Providence/Main intersection and the old school.

The scene also traces the named Partridge, Oak and Amity street evidence. The unusual angle of Providence is not converted into a false orthogonal street; the founder-statue intersection is retained as a source-established landmark and the route expresses the sequence.

## Chapter 7 expansion

The 3D scene now extends east and south beyond the compact front-page 2D map so that Chapter 7 can be represented without compressing the original local relationships. It includes:

- Ledford's home south of the river and a Jefferson segment;
- an interpretive south-side industrial volume for the mills and docks;
- a north-side bridge crossing;
- the diner and L-shaped strip-mall relationship;
- one Stanford tower north of the river and one south of it; and
- `PATH_Ledford_Southside_To_Diner` for the source sequence.

The compact 2D map intentionally keeps its existing local extent and eleven reviewed public labels. The new far-east/south geometry is available in the 3D scene through dedicated authored viewpoints instead of shrinking the readable front-page diagram.

## Inferred and presentation-only geometry

The following remain interpretive unless explicitly stated in the writing:

- compass bearings of streets and blocks;
- exact road widths, block lengths and property lines;
- building footprints, architecture, materials, windows and landscaping;
- the exact bridge structure, river course, docks and trainyard layout;
- the exact diner/strip-mall dimensions and parking-lot geometry;
- the Stanford tower footprints beyond their stated twenty-story scale;
- the exact route from downtown to the Chapter 7 diner;
- the highway approach alignment from Chapter 8; and
- all generic connective terrain and unnamed structures.

## Integrity rules

- The 2D map imports the shared spatial-plan JSON directly.
- The deterministic GLB generator reads the same landmark, road, camera, route and relationship records.
- Every public scene source reference must resolve only to Chapters 1–8.
- The scene source manifest pins the current Writing revision and the exact eight approved chapter blobs.
- The scene revision may advance independently of the full publication package only because each artifact is separately revision-consistent and both remain constrained by the same exact approval allowlist. The repository-wide source inventory is not falsely relabeled as current when it has not been rebuilt.
- GLB landmark-reference nodes must match the plan's meter-converted coordinates.
- Deterministic regeneration, model hash, model byte count, node counts, camera nodes, route nodes, source-stated distance constraints and size budgets are validated in CI.

## Node naming contract

- `CANON_*` identifies a location, feature, street or relationship established in the approved source.
- `INFERRED_*` identifies a useful placement derived from incomplete evidence.
- `PRESENTATION_*` identifies connective, architectural or atmospheric geometry.
- A `CANON_*` node does not make its unstated shape, material, bearing or exact coordinate canonical.
