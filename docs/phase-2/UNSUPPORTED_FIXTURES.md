# Unsupported Phase 1.5 Fixtures

## Purpose

This report compares the accepted Phase 1.5 exhibit fixtures with the RSC writing subtree at revision `e77b82fb830b5211cee2bb7dc0c1cb70a98b8366`.

Classification:

- **Supported identity:** directly supported as series identity.
- **Mentioned only:** the term appears in RSC source, but the current public description, metadata, relationship, or state is not supported.
- **Unsupported:** no matching support was found in the audited RSC subtree.
- **Presentation media:** application artwork that must not be presented as canonical source material.
- **Computed later:** permitted only when calculated from a validated public content package.

No mention is treated as publication approval.

## Masthead and Global Status

| Fixture | Classification | Finding | Phase 2 action |
| --- | --- | --- | --- |
| The Rock Springs Chronicles | Supported identity | Series title appears in source metadata | Retain |
| “A living record of our town…” slogan | Unsupported | No source attribution established | Replace with neutral application label or approved source text |
| Monday / September 2, 2024 | Unsupported | No edition record establishes this date | Remove |
| Rock Springs, Iowa | Unsupported | Exact fixture string not found | Remove unless approved source metadata establishes it |
| 68°F / river fog | Unsupported | No weather source | Remove |
| Town status: Watchful | Unsupported | No status source | Remove |
| Labor Day Edition | Unsupported as edition metadata | Labor Day appears in draft chapters, but no Chronicle edition exists | Remove |
| Morning Edition / Vol. 114 / No. 247 | Unsupported | No issue record | Remove |
| Search and navigation labels | Permitted application content | Neutral interface controls | Retain |

## Town-View Scene

| Fixture | Classification | Finding | Phase 2 action |
| --- | --- | --- | --- |
| Generated river-town night image | Unsupported presentation media | Generated for the interface; not in writing repository | Removed from the public site |
| Water tower and bridge shown in the generated image | Unsupported geography | Neither structure appears in approved Chapters 1–8 | Removed with the image |
| “Descend over Rock Springs” | Presentation copy | Not manuscript language | Replaced with source-scoped interface copy |
| Scene status and reduced-motion label | Permitted application content | Application behavior, not canon | Retain |

## Featured Chronicle

Every content-bearing field in the current featured panel is unsupported:

| Fixture | Classification | Finding |
| --- | --- | --- |
| “Town Prepares for Parade as Questions Remain About New Beginnings Resident” | Unsupported | Exact headline not found |
| Marlena Dove | Unsupported | No occurrence found |
| Staff Reporter | Unsupported attribution | No author record supports it |
| September 1, 2024 / 7:15 PM / 12 min read | Unsupported | No Chronicle publication record |
| Current deck and summary | Unsupported as Chronicle copy | No approved Chronicle entry maps to this text |
| Comment count | Unsupported | No comment record |

Labor Day, a parade, and New Beginnings appear in source material, but those mentions do not support a fabricated newspaper article.

Phase 2 action: remove the fixture and leave the panel in a neutral unavailable state until an approved Chronicle entry exists.

## Developing Reports

| Fixture | Classification | Finding |
| --- | --- | --- |
| Police investigate overnight incident near Riverside Park | Unsupported | Exact report and location not found |
| Bakery fire under control | Unsupported | Exact event not found |
| Parade lineup / grand marshal | Mentioned only at theme level | Parade appears; report does not |
| School board review | Unsupported | No matching source found |
| Relative times | Unsupported | No event timestamps |

Phase 2 action: replace only with validated recent Chronicles or remove the module's content. Do not retain “developing” status unless source metadata supports it.

## Archive Files and Artifacts

| Fixture | Classification | Finding |
| --- | --- | --- |
| Flood of ’58 | Unsupported | No matching source found |
| Chalmers Mill | Unsupported | No matching source found |
| R.S.P.D. Case File 76-214-A | Unsupported | No matching source or case number |
| Artifact and evidence classification | Unsupported as current content | No structured artifact collection |

Phase 2 action: remove all three records. Retain the module only as a neutral empty state until approved artifacts exist.

## People

| Fixture | Classification | Finding | Unsupported portion |
| --- | --- | --- | --- |
| Abby Hubbard | Mentioned only | Full name appears in one explicit draft; Abby links recur | Current biography and public status |
| Jackie French | Mentioned only | Appears in two files; one unclassified character-short path exists | Current occupation and biography |
| Detective Stephenson | Mentioned only | Appears in draft and research-related files | Current occupation and biography |
| Bobbi | Mentioned only | Appears in several files and legacy links | Current occupation and biography |

Phase 2 action: do not publish profiles until a public people-entry contract and approved source entries exist. Plain manuscript mentions are insufficient.

## Places and Map

| Fixture | Classification | Finding |
| --- | --- | --- |
| New Beginnings | Mentioned only | Appears in multiple source files |
| St. Thomas Cathedral | Mentioned only | Appears in a snippet and a draft chapter |
| Main Street | Mentioned only | Appears in research and draft chapters |
| The Woods | Mentioned only | Appears in synopsis and draft material |
| Downtown | Mentioned only | Appears in snippets, synopsis, research, and drafts |
| Chalmers Farm | Unsupported | No matching source found |
| Riverside Park | Unsupported | No matching source found |
| Riverside district | Unsupported | No matching source found |
| The Chronicle location | Unsupported | No established place entry or coordinate |

All current marker coordinates, road lines, district relationships, and spatial placement are unsupported.

Phase 2 action:

- remove unsupported markers;
- do not present CSS marker positions as canonical coordinates;
- retain the panel as a non-geographic place index only after approved place entries exist;
- provide identical place access outside the visual map.

## Timeline

| Fixture | Classification | Finding |
| --- | --- | --- |
| 1893 town charter | Unsupported | No matching source found |
| 1936 water tower dedication | Unsupported | No matching source found |
| 1964 Chronicle address change | Unsupported | No matching source found |
| 2001 Riverside Park restoration | Unsupported | No matching source found |

Phase 2 action: remove the entire fabricated timeline. A timeline module may return only after approved event or chronology records exist.

## Footer

| Fixture | Classification | Finding |
| --- | --- | --- |
| 111 Main Street | Unsupported | No matching source found |
| Rock Springs, IA 50670 | Unsupported | No approved address record |
| “We don’t just report the news. We keep the record.” | Unsupported attribution | No source attribution established |
| RSC seal treatment | Permitted presentation identity | Interface emblem, not historical artifact |
| MichealBurford.com link | Permitted application link | Real application navigation |

Phase 2 action: replace fictional address and quotation with neutral application/footer information.

## Status Strip

Current status values are derived from fixture-array lengths, not source collections.

| Fixture | Classification | Phase 2 action |
| --- | --- | --- |
| Morning edition | Unsupported | Remove |
| Open records | Unsupported status language | Rename neutrally if a collection exists |
| Three indexed records | Fixture-derived | Replace with validated public artifact count |
| Six mapped places | Fixture-derived | Replace with validated public place count |
| Four active reports | Unsupported status language | Replace with public Chronicle count |
| Four profiles | Fixture-derived | Replace with validated public people count |

Counts are **computed later** only from entries admitted to the validated public package.

## Fixture Infrastructure Scheduled for Removal

- `src/content/chronicleFixtures.ts`
- all canonical copy embedded in Chronicle components
- legacy fixture map-marker array and arbitrary CSS positions (removed; the current
  2D evidence map imports the audited Jackie’s Window spatial plan)
- current timeline array
- current archive-record array
- current people descriptions
- current place descriptions
- current issue, weather, town-status, address, and publication metadata

The file must not remain as a production fallback after Phase 2 integration.

## Implementation Status

Fixture removal is complete:

- `src/content/chronicleFixtures.ts` has been deleted;
- masthead and footer display neutral application and package information;
- Chapter 1 supplies the featured written record;
- the lower chapter module uses approved collection entries;
- unavailable collections and their navigation are absent from the public interface;
- the remaining chapter status counts come from the validated package;
- every public map landmark, route, road, and scene view is required to carry
  Part One source references by `npm run public:check`.

## Removal Order

1. Replace masthead metadata with neutral application state.
2. Convert feature, lower modules, and status strip to neutral unavailable or empty states.
3. Remove fabricated timeline, artifact records, map markers, and address.
4. Introduce validated collection data only after the publication contract is approved.
5. Delete `chronicleFixtures.ts`.
6. Add regression tests that search production source and rendered output for rejected fixture strings.

## Exit Assessment

Every Phase 1.5 content fixture is now classified.

The visual shell remains locked. No Phase 1.5 fixture content remains in the
production content path.
The legacy fixture map has been removed. The current 2D map and generated GLB may
represent source-established relationships only when they are tied to the audited
spatial plan; their unstated bearings, absolute coordinates, architecture, and
connective geometry remain interpretive presentation media.
