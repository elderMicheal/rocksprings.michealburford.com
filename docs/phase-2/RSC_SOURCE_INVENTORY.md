# Rock Springs Chronicles Source Inventory

## Audit Record

- Source repository: `https://github.com/elderMicheal/micheal-writes.git`
- Source branch: `primary`
- Audited revision: `00350c94f1152116e1d27250dfb0674c5ccfea37`
- Revision date: `2026-07-26T05:04:12-04:00`
- Audited subtree: `Rock Springs Chronicles/`
- RSC subtree status during audit: clean
- Audit behavior: read-only
- Manuscript bodies copied into the metadata inventory: no
- Generated inventory: `generated/source-inventory.json`
- Approval manifest: `content-policy/approved-sources.json`

Git reported no changes inside the audited RSC subtree.

## Publication Rule

Inventory metadata does not grant publication approval. Public eligibility
requires an exact path match in the versioned approval manifest and a match
against every declared front-matter requirement.

The current approval records the product owner's directive to make Part 1
Chapters 1–8 available. The source `status: draft` value remains visible as
editorial metadata, but the approval assigns those exact files the independent
application publication state `published`.

Result: **eight chapter entries are eligible for the public content package.**

All other files remain excluded, including back matter carrying an internal
`published` label. Chapter 7 is eligible as a sequence record but contains no
prose; the reader reports that absence without filling it.

## File Inventory

| Group | Files |
| --- | ---: |
| Anthologies | 8 |
| Assets | 4 |
| Back Matter | 16 |
| Book 1 — Jackie's Window | 15 |
| Book 2 — Hunter's Hunted | 11 |
| Book 3 — Three Little Witches | 11 |
| Book 4 — The Feud of the Vampires | 11 |
| Book 5 — Paradox | 11 |
| Book 6 — Shaman | 12 |
| Series Introduction | 1 |
| Series Overview | 1 |
| Templates | 1 |
| Obsidian base file | 1 |
| **Total** | **103** |

File formats:

| Format | Files |
| --- | ---: |
| Markdown | 101 |
| PNG | 1 |
| Obsidian base | 1 |

## Source-Kind Inventory

| Audit classification | Files | Notes |
| --- | ---: | --- |
| Manuscript | 53 | Chapter and interlude source files |
| Book structure | 16 | Book and part README files |
| Back matter | 14 | Synopsis, outline, character-short, author, and reference material |
| Anthology | 8 | Two anthology structures with page files |
| Series metadata | 2 | Root series introduction and overview |
| Recovered draft | 2 | Explicit recovered-draft directories |
| Snippet | 2 | Assets/snippets Markdown |
| Asset document | 2 | Asset README files |
| Research | 1 | Recovered development conversations |
| Template | 1 | Chapter template |

## Front-Matter Coverage

- 88 Markdown files contain front matter.
- 13 Markdown files contain no front matter.
- 80 files contain `publish: true`.
- 18 files contain an explicit `status`.
- Observed statuses are only `draft` and `published`.
- The Phase 2-required states `private`, `review`, `publishable`, and `withdrawn` are not currently represented.

Observed type values:

| Type | Files |
| --- | ---: |
| chapter | 42 |
| interlude | 12 |
| part | 10 |
| anthology-page | 6 |
| book | 6 |
| fiction | 5 |
| non-fiction | 3 |
| anthology | 2 |
| author | 1 |
| series-overview | 1 |
| no type | 13 |

The existing types primarily model books and manuscripts. They do not provide the proposed Phase 2 collections for people, places, events, artifacts, timeline records, or media entries.

## Publication-State Findings

| Audit classification | Files | Public eligibility |
| --- | ---: | --- |
| Ambiguous `publish: true` without status | 70 | No |
| Explicit owner approval | 8 | Yes |
| Unapproved lifecycle conflict | 2 | No |
| Explicit draft | 5 | No |
| Published status without publish flag | 3 | No |
| Unclassified | 13 | No |

### Approved paths

- `Book 1 - Jackie's Window/Part 1/Chapter 01.md`
- `Book 1 - Jackie's Window/Part 1/Chapter 02.md`
- `Book 1 - Jackie's Window/Part 1/Chapter 03.md`
- `Book 1 - Jackie's Window/Part 1/Chapter 04.md`
- `Book 1 - Jackie's Window/Part 1/Chapter 05.md`
- `Book 1 - Jackie's Window/Part 1/Chapter 06.md`
- `Book 1 - Jackie's Window/Part 1/Chapter 07.md`
- `Book 1 - Jackie's Window/Part 1/Chapter 08.md`

The remaining two `publish: true` plus `status: draft` conflicts are not
allowlisted and remain private to the writing workflow.

### Published status without publish flag

- `Back Matter/Bestiary.md`
- `Back Matter/Series Synopsis 1.md`
- `Back Matter/Series Synopsis.md`

These files require explicit review. In particular, a `published` label on back matter does not establish that every contained fact, development note, or worldbuilding statement is approved for the public exhibit.

### Explicit drafts without publish flag

- `Back Matter/Character Shorts/Dvorak.md`
- `Back Matter/Character Shorts 1/Dvorak.md`
- `Back Matter/Final Complete Outline.md`
- `Back Matter/Questions a Reader Might Ask.md`
- `Templates/chapter.md`

## Collection Support

### Strongly represented

- series overview
- books
- parts
- chapters
- interludes
- anthologies
- anthology pages
- back-matter documents

### Mentioned but not structurally represented

- people
- places
- events
- creatures or entities
- chronology
- media

Recurring names and place terms appear in prose and Obsidian links, but the RSC subtree does not currently contain normalized, independently publishable entries for the proposed collections.

### Not established as collections

- Chronicle newspaper articles
- artifacts or evidence records
- town-map coordinates
- timeline entries
- geographic districts or routes
- case files
- issue records
- weather or town-status records

These collections cannot be populated merely by extracting prose mentions. They require approved source records or a publication contract that explicitly permits deterministic derived indexes.

## Link and Relationship Findings

The audit found 557 Obsidian wiki links:

| Resolution | Links |
| --- | ---: |
| Resolved by exact normalized path | 178 |
| Resolved by unique filename | 17 |
| Ambiguous | 6 |
| Unresolved | 356 |

Frequent unresolved targets include recurring character names and legacy `RSC/Back Matter/...` paths. Examples include Jackie, Rebecca, Stephenson, Sheryl, Abby, and missing character-short paths for McMurtry and Bobbi.

These links are relationship candidates, not approved public relationships. The publication contract must distinguish:

- authored links to existing source entries;
- authored links to missing or legacy entries;
- plain mentions;
- ambiguous aliases;
- mechanically derived mention indexes.

No public relationship graph should be built until alias and missing-target behavior are defined.

## Media Findings

The RSC subtree contains one PNG outside the `Assets` directory. Markdown references also identify:

- an author headshot path that is not present in the audited subtree;
- a fault-map path using a legacy `RSC/...` location;
- external research diagrams in recovered development conversations.

No audited media entry currently provides:

- approved town-scene artwork;
- approved map artwork;
- verified map coordinates;
- approved person portraits;
- structured alt text;
- a media publication state.

The Phase 1.5 generated night scene must remain classified as presentation media. It is not evidence of canonical geography or landmarks.

## Metadata and Schema Gaps

The current source does not consistently provide:

- stable source IDs independent of paths;
- public slugs;
- the six required lifecycle states;
- aliases;
- relationship types;
- provenance fields;
- updated dates;
- media records;
- media alt text;
- withdrawal behavior;
- public summaries for most manuscript entries;
- structured people, places, events, artifacts, or timeline entries.

File paths and hashes can provide audit identity, but the publication contract must decide whether they may serve as stable IDs.

## Phase 2B Decisions

1. `publish: true` is a required source signal but is not sufficient approval.
2. The versioned approval manifest controls application publication eligibility;
   source `status` remains separate editorial metadata.
3. Internal `status: published` does not independently authorize web publication.
4. The current allowlist contains exactly Part 1 Chapters 1–8.
5. Those eight chapters are approved for full-text publication.
6. Plain mentions and links do not create public people or place profiles.
7. No back matter is currently approved.
8. Legacy links remain audit findings and are not emitted publicly.
9. A public relationship must be authored, typed, and connect two approved entries.
10. No writing-repository media is currently approved; scene and map media remain
    labelled presentation material.

## Audit Exit Assessment

Phase 2A discovery is complete for the current revision:

- all RSC files have been inventoried;
- each file has a publication classification;
- lifecycle conflicts and missing states are documented;
- unsupported Phase 1.5 fixtures are recorded separately;
- no source manuscript was modified by the audit;
- eight exact source paths have explicit approval;
- all unresolved or unapproved material remains excluded.

Phase 2A and 2B exit gates are satisfied for the current publication scope.
