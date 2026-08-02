# Phase 2 Overview Plan

## Rock Springs Chronicles Content Integration

**Status:** Complete at Writing revision `00350c94f1152116e1d27250dfb0674c5ccfea37`
**Prerequisite:** Phase 1 foundation complete; Phase 1.5 exhibit interface locked at `phase-1.5-exhibit-shell`
**Primary objective:** Replace display fixtures with approved Rock Springs Chronicles material from the writing repository while preserving repository boundaries, editorial intent, responsive quality, and a reliable deployment lifecycle.

## 1. Scope

Phase 2 is concerned only with Rock Springs Chronicles material from the writing repository.

In scope:

- Chronicle stories and articles
- approved people and character profiles
- established places and landmarks
- verified events and timeline entries
- approved artifacts, records, and evidence objects
- relationships among those entries
- publication metadata required by the exhibit interface
- build-time or runtime adapters needed to present that material
- routes, loading states, error states, accessibility, and tests for integrated content

Out of scope:

- non-RSC material from the writing repository
- editing or manuscript-authoring features
- copying the writing repository wholesale into this application
- presenting drafts, notes, research, or private material without explicit publication approval
- inventing facts, dates, institutions, locations, case numbers, relationships, or character details
- treating generated interface imagery as canonical evidence
- a full production Three.js experience before verified place and scene data exist
- unrelated platform, account, commerce, community, or administration features

## 2. Source-of-Truth Rules

1. The writing repository is authoritative for RSC narrative material and canon.
2. This repository is authoritative for presentation, routing, content adapters, deployment, and application behavior.
3. Source manuscripts remain in the writing repository.
4. Only explicitly publishable RSC material may cross the repository boundary.
5. Normalization must preserve source identity so every published entry can be traced to its source.
6. Generated images, fixture records, interface labels, and visual placeholders must never silently become canon.
7. Missing source data must produce an explicit incomplete or unavailable state; it must not be filled through invention.

## 3. Target Content Model

The Phase 2 model follows:

> World → Collections → Entries → Relationships

Initial collections:

- `chronicles`
- `people`
- `places`
- `events`
- `artifacts`
- `timeline`
- `media`

Every publishable entry should have:

- stable source identifier
- stable public slug
- collection type
- title or display name
- publication status
- concise summary
- source path or source reference
- updated date
- structured metadata appropriate to its collection
- relationship references
- optional approved media references

No field becomes required merely because the interface currently contains a corresponding fixture. The source audit determines which fields are real and available.

## 4. Delivery Strategy Decision

Phase 2 must select a stable content-delivery lifecycle after inspecting the writing repository.

Preferred decision order:

1. **Build-time approved export**  
   Generate a versioned, validated publication package from approved RSC sources. The application consumes the package during its build.

2. **Build-time repository adapter**  
   Read approved RSC source paths during a controlled build step and produce normalized application data without committing manuscript copies.

3. **Server-side content service**  
   Store a prepared publication package in an appropriate Cloudflare service and retrieve it through the same-origin Worker API.

Direct browser access to the writing repository is not acceptable. Runtime dependency on raw GitHub files should be avoided unless the source audit proves it necessary and its availability, authentication, caching, and failure behavior are documented.

The selected mechanism must support:

- deterministic builds
- explicit publication approval
- schema validation
- source traceability
- safe handling of unavailable content
- local development without duplicate servers
- automated tests
- rollback to a known publication package

## 5. Phase 2 Workstreams

### 2A. RSC Source Audit

Goal: identify the exact publishable RSC surface before designing adapters or routes.

Tasks:

- locate the writing repository and record its current revision
- identify directories and files containing RSC material
- separate manuscript, notes, research, private, draft, and publishable material
- inventory established people, places, stories, events, artifacts, and media
- record existing identifiers, front matter, links, and naming conventions
- identify conflicting, duplicate, incomplete, or ambiguous entries
- create a publication inventory without modifying source manuscripts
- flag every interface fixture that lacks confirmed source support

Deliverable:

- `docs/phase-2/RSC_SOURCE_INVENTORY.md`
- machine-readable inventory or audit output if practical

Exit gate:

- every candidate public entry has an identified source and publication status
- unresolved canon questions are documented instead of assumed

### 2B. Publication Contract and Schema

Goal: define the stable boundary between the writing repository and the application.

Tasks:

- define collection schemas
- define required and optional fields by collection
- define stable ID and slug rules
- define relationship types
- define media metadata and alt-text requirements
- define draft, private, publishable, and withdrawn states
- define date handling and provenance fields
- define validation errors and failure behavior
- document schema evolution and backward compatibility

Deliverables:

- TypeScript publication types
- runtime schema validation
- example normalized entries derived only from approved sources
- `docs/phase-2/PUBLICATION_CONTRACT.md`

Exit gate:

- invalid or private source content cannot enter the public package
- all public relationships resolve or are explicitly marked unavailable

### 2C. Deterministic Content Pipeline

Goal: produce a repeatable publication package from approved RSC sources.

Tasks:

- implement the selected delivery strategy
- normalize source data without altering manuscript meaning
- generate collection indexes and relationship indexes
- generate a content manifest with revision and build metadata
- validate slugs, identifiers, dates, links, media, and relationships
- provide useful error messages tied to source references
- add an explicit command for content preparation
- ensure `npm ci` plus documented preparation steps reproduce the same output
- prevent private or unapproved files from being copied to build output

Expected commands:

```sh
npm run content:audit
npm run content:build
npm run content:check
```

Exact command names may change during implementation, but audit, build, and validation responsibilities must remain separate.

Deliverables:

- content adapter or exporter
- validated publication package
- generated manifest
- pipeline tests
- lifecycle documentation

Exit gate:

- identical source revision and toolchain produce identical normalized output
- package generation fails safely when source material violates the contract

### 2D. API and Route Integration

Goal: replace the V1 content placeholder with usable same-origin content endpoints and application routes.

Tasks:

- replace the `/api/content/:slug` 501 response
- add collection and entry retrieval where required
- define cache behavior and response metadata
- return structured 404, unavailable, and validation-error responses
- add routes for Chronicle entries, people, places, timeline, and archive records
- preserve direct-link and refresh behavior through the Worker asset fallback
- add loading, empty, error, and unavailable states
- ensure public routes expose only approved publication fields

Candidate API surface:

- `GET /api/manifest`
- `GET /api/collections/:collection`
- `GET /api/content/:collection/:slug`
- `GET /api/relationships/:collection/:slug`

The final API should remain as small as the interface actually requires.

Exit gate:

- every implemented route works by direct navigation and refresh
- missing or withdrawn entries fail clearly without exposing source details

### 2E. Exhibit Interface Integration

Goal: replace Phase 1.5 fixtures with verified RSC material without weakening the exhibit art direction.

Tasks:

- map the current masthead, feature, scene, map, status strip, and editorial modules to confirmed source fields
- remove unsupported fixture copy
- mark generated scene artwork as presentation media unless approved as canonical art
- populate people, places, stories, artifacts, and timeline modules from normalized collections
- connect feature, scene, and map context through verified relationships
- implement semantic active, selected, loading, disabled, and error states
- tune information density independently for mobile, tablet, and desktop
- maintain useful first-viewport content at all breakpoints
- add media fallbacks that preserve layout without implying nonexistent content

Exit gate:

- no public fixture is presented as canon
- no interface region requires invented source data
- mobile, tablet, and desktop remain readable and free of horizontal overflow

### 2F. Relationship and Discovery Layer

Goal: let visitors move through Rock Springs as an interconnected record rather than a flat list.

Initial relationship examples:

- story → people
- story → places
- story → events
- event → timeline entry
- place → stories
- person → stories
- artifact → story or event
- media → approved entry

Tasks:

- generate relationship indexes
- add related-record navigation
- add collection filtering only where source metadata supports it
- make map markers and place actions resolve to established entries
- expose provenance or source context internally for debugging
- test circular, missing, and withdrawn relationships

Exit gate:

- every visible relationship resolves to an approved public entry
- navigation remains usable without relying on the map or visual scene

## 6. Testing and Quality Gates

Phase 2 must extend the existing automated baseline.

Required checks:

- `npm audit --audit-level=high`
- generated Worker types
- TypeScript
- content schema validation
- private/unapproved-content exclusion tests
- slug and relationship integrity tests
- Worker API tests
- route-level Playwright tests
- mobile, tablet, and desktop geometry assertions
- reviewed visual snapshots
- production build

Additional required cases:

- missing content package
- malformed source entry
- duplicate slug
- broken relationship
- missing media
- withdrawn entry
- unavailable API
- empty collection
- direct route refresh
- keyboard navigation and visible focus
- reduced-motion behavior

Visual snapshots are candidates until reviewed. They must not be labelled approved solely because Playwright generated them.

## 7. Security and Privacy

- never publish repository credentials or tokens
- never expose private repository paths in public error responses
- do not ship research notes, drafts, or private metadata in client bundles
- allowlist publishable source locations; do not rely only on deny rules
- validate and sanitize rendered Markdown or rich content
- reject unsafe URLs and unsupported embedded markup
- record the source revision used for each publication build
- keep dependency versions explicit and retain the lockfile

## 8. Documentation Deliverables

Phase 2 should leave behind:

- RSC source inventory
- publication contract
- selected delivery-strategy decision record
- local content-development workflow
- content lifecycle and approval workflow
- API contract
- relationship model
- troubleshooting guide
- publication rollback procedure
- fixture-removal checklist

## 9. Proposed Execution Order

1. Audit RSC sources.
2. Resolve publication-status and canon questions.
3. Approve the publication contract.
4. Select and document the delivery strategy.
5. Implement and test the deterministic content pipeline.
6. Implement the smallest required API and route surface.
7. Replace exhibit fixtures collection by collection.
8. Add verified relationships and discovery navigation.
9. Complete accessibility, responsive, failure-state, and visual review.
10. Remove superseded fixtures.
11. Run the full CI-equivalent validation.
12. Commit Phase 2 as intentional, reviewable units.

## 10. Completion Criteria

Phase 2 is complete when:

- the public application uses approved RSC material from the writing repository
- the writing repository remains the canonical manuscript source
- no private or non-RSC writing material is published
- no fixture is silently presented as canon
- content builds are deterministic and traceable to a source revision
- implemented API and routes have automated coverage
- relationships resolve only among approved public entries
- mobile, tablet, and desktop layouts pass reviewed responsive tests
- loading, empty, error, unavailable, and withdrawn states are usable
- the production build and security audit pass
- the content lifecycle and rollback procedure are documented

## 11. First Phase 2 Action

Begin with a read-only RSC source audit. Do not implement a transport mechanism or copy content into this application until the source layout, publication states, identifiers, and privacy boundary are understood.
