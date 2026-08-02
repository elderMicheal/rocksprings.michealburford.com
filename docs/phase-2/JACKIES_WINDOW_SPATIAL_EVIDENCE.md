# Jackie's Window spatial evidence

This document defines the canonical source boundary for the Rock Springs geography
used by both the 3D GLB and the 2D front-page map. It covers *Jackie's Window*,
Part 1, Chapters 1–8 at writing-repository revision
`00350c94f1152116e1d27250dfb0674c5ccfea37`.

The two maps are renderings of the same spatial plan:
`scene-data/jackies-window-spatial-plan.json`. They must not maintain independent
landmark coordinates.

## Current manuscript audit

- Chapters 1–4 contain the town, surveillance, Abby sightline, and Chalmers-route
  geography.
- Chapter 5 now contains a New Beginnings staff member walking the perimeter. It
  confirms that the complex can be walked around as a block-scale site, but does
  not establish a new street, building, or bearing.
- Chapter 6 takes place on the road 110 miles outside Rock Springs. Its fields,
  highway, and sign are not part of the town maps.
- Chapter 7 remains an empty draft placeholder and contributes no spatial facts.
- Chapter 8 establishes the parade-staging relationship among Jackie's house, the
  street, the old-school lot, Main Street, and the park event.

## Coordinate contract

- `+X` is east, `+Z` is north, and `+Y` is elevation.
- North is up on the 2D map.
- One horizontal plan unit equals ten feet.
- The GLB converts horizontal plan coordinates to meters and uses one meter per
  GLB unit. Building dimensions therefore remain physically plausible instead of
  being enlarged independently of inter-district distances.
- Absolute coordinates and unstated bearings remain presentation choices.
- Source-stated distances are machine-checked:
  - Abby to New Beginnings: approximately 1,800 feet.
  - Jackie's house to the old-school staging lot: less than 100 feet at the
    closest building/lot footprints.
  - Detective position to the park: approximately one quarter mile.

## Confirmed relationships

| Relationship | Current evidence |
| --- | --- |
| New Beginnings consists of four renovated turn-of-the-century houses in a row in the northeast sector, one block from the main thoroughfare. | Chapter 1, line 17; Chapter 3, lines 81–83 |
| Jackie's house is the ugly red New Beginnings house opposite the old-school staging lot. | Chapter 8, lines 18–20 |
| Jackie's front approach includes a sinking fence, broken sidewalk, pothole-ridden street, and porch with chipped black paint. | Chapter 8, line 20 |
| Jackie's room has a street-facing window and a sidewalk below it. | Chapter 1, lines 17–19 and 39 |
| The old-school staging lot is across the street and less than 100 feet from Jackie. | Chapter 8, lines 18–20 |
| Jackie's bedroom window overlooks the staging activity and serves as a crow's-nest view of the lot. | Chapter 8, lines 30, 48–50, and 92–94 |
| The old school has concrete stairs leading to a side entrance beside the staging area. | Chapter 8, line 84 |
| Main Street contains parade crowds, press trucks, floats, bands, and participants. | Chapter 8, line 52 |
| The Labor Day circus has large tents at a park. | Chapter 8, line 56 |
| Abby occupies a four-story apartment at the southeast edge of downtown and uses a rooftop garden. | Chapter 3, lines 15 and 33 |
| The river is south of Abby and its basin flattens the view. | Chapter 3, line 33 |
| Herbie's bakery storefront is directly across the street from Abby's window. | Chapter 3, lines 37–47 |
| Abby can see downtown, Main Street, the police station, the old school, and New Beginnings to the northwest. | Chapter 3, lines 33, 69–73, and 81–83 |
| The old school, staging lot, and empty lots intervene between Abby and New Beginnings. | Chapter 3, lines 69–71 and 81–83 |
| Abby's sightline to New Beginnings is approximately 1,800 feet. | Chapter 3, lines 81–83 |
| The downtown edge abruptly changes from buildings no taller than six stories to 1950s houses. | Chapter 2, line 23 |
| The detectives see the sheriff's son's entire front elevation from a block over and two blocks away. | Chapter 2, line 23 |
| The surveillance street has parking lots and businesses on one side and residences on the other. | Chapter 2, line 57 |
| A park is approximately a quarter mile behind the detectives. | Chapter 2, line 63 |
| The last downtown block includes a diner, pawn shop/bail bondsman, salon, accountant, and hobby store. | Chapter 2, line 67 |
| The bicycle route crosses farmland on the Chalmers property, passes through a fence gap, reaches the tree line, and descends more than ten degrees into the woods. | Chapter 4, lines 15–17 and 43–63 |
| Chalmers watches from the porch of a massive old white farmhouse. | Chapter 4, line 65 |
| The old ruins lie in or beyond the woods and cannot be seen from Abby's normal vantage point. | Chapter 3, lines 33–35 |

## Required south-to-north sequence

The source supports this local ordering:

1. Abby at the southeast edge of downtown.
2. Main Street and the downtown-facing side of the parade district.
3. The old school and its asphalt staging lot.
4. The street crossed by Jeremy.
5. Jackie's house and the New Beginnings row.

The old school and staging lot must remain between Abby and New Beginnings. New
Beginnings must remain northwest of Abby. The river must remain south of Abby.

## Inferred placements

- Main Street is modeled east–west. The prose establishes its role and relative
  neighbors, but not its compass bearing.
- The old school is attached to the staging lot on its eastern side. The text
  establishes attachment and a side entrance, but not which side.
- The sheriff's son's house and detective position straddle the modeled
  downtown/residential seam. Their exact compass bearing is not stated.
- The park bearing from the detectives is inferred; only the quarter-mile distance
  and the word “behind” are stated.
- Chapter 8's circus tents are placed in City Park because Chapter 3 identifies
  that park as the Labor Day concert and fireworks site. The identity is strongly
  inferred, not explicit in Chapter 8.
- The Chalmers property, the woods, and the ruins are placed northwest of Abby because her
  northwest view extends toward a forest that blocks the ruins. Their exact route
  from downtown is not stated.
- St. Thomas is placed within downtown because its bells carry across downtown.
  Its block and relationship to Main Street are not stated.
- Jackie's view toward the shadow-casting downtown structures is retained, but the
  former unsupported `PATH_Jackie_Westward_View` has been removed.

## Shared-map integrity rules

- The 2D map imports the spatial-plan JSON directly.
- The GLB generator reads the same landmark, road, camera, route, and relationship
  records.
- The scene validator checks that every GLB landmark reference resolves to the
  plan's meter-converted coordinate.
- 2D map road, route, and marker ids must resolve to records in the shared plan.
- Source-stated distance and direction constraints fail validation when violated.
- Named building footprints must not intersect modeled road and sidewalk
  corridors.
- Procedural houses and trees are rejected when they enter road or named-site
  reservations.

## Presentation-only geometry

The following remain interpretive:

- unnamed street grid, alleys, curbs, drains, and industrial parcels;
- generic residential lots and modular houses;
- exact building footprints, architecture, materials, windows, and landscaping;
- exact fence lean, sidewalk cracks, pothole shapes, and porch damage;
- exact locations and forms of parade vehicles, news vans, and Scout proxies;
- exact river bends, bridges, retaining walls, and shoreline;
- terrain between stated elevation cues;
- decorative utility poles, fences, trees, weeds, and parked vehicles.

## Node naming contract

- `CANON_*` identifies a location, feature, event, or relationship present in the
  audited chapters.
- `INFERRED_*` identifies a useful position derived from incomplete evidence.
- `PRESENTATION_*` identifies connective or atmospheric geometry.
- A `CANON_*` node does not make unstated architecture or bearings canonical.
- Named landmark nodes, authored cameras, and authored routes remain separate in
  the GLB.
