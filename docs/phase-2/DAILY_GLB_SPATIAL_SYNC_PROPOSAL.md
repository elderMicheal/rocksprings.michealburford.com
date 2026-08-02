# Proposal: Daily RSC Written-Material-to-GLB Sync

**Status:** Proposed
**Date:** July 24, 2026
**Scope:** Rock Springs Chronicles material only
**Target repositories:**

- Writing source: `elderMicheal/micheal-writes`
- Exhibit application: `elderMicheal/rocksprings.michealburford.com`

## 1. Summary

Create a daily automation that checks the writing repository for new Rock Springs Chronicles material, identifies spatially meaningful changes, proposes corresponding scene-plan updates, regenerates the town GLB, validates the result, and opens a pull request for review.

The automation must not silently reinterpret prose and replace the production scene. Narrative geography often contains ambiguity, and the existing GLB deliberately distinguishes canon from inferred and presentation geometry. A human-reviewed pull request is therefore the publication boundary.

The recommended lifecycle is:

> New RSC writing → spatial change proposal → candidate spatial plan → generated GLB → automated validation → human-reviewed pull request

Production changes occur only after that pull request is approved and merged.

## 2. Current Baseline

The current GLB is generated deterministically from:

```text
scene-data/jackies-window-spatial-plan.json
```

The plan records:

- the writing revision on which the scene is based
- source work and chapter coverage
- named landmarks
- canon and inference classifications
- approximate positions
- authored cameras
- authored paths
- stable Three.js node names

The generator:

```text
scripts/generate-town-scene.mjs
```

does not currently read prose or infer geography. It turns the reviewed spatial plan into:

```text
public/assets/rock-springs-jackies-window.glb
```

This separation is intentional and should be preserved.

## 3. Objectives

The daily task should:

1. Read only Rock Springs Chronicles material.
2. Detect writing changes since the scene's recorded source revision.
3. Distinguish spatial changes from ordinary narrative edits.
4. Produce traceable proposals rather than silently inventing geometry.
5. Preserve the distinction among canon, inference, and presentation.
6. Regenerate the GLB deterministically when the candidate plan changes.
7. Run all scene and application quality gates.
8. Open or update a reviewable pull request.
9. Avoid exposing manuscript content in the public application repository, workflow logs, or build artifacts.
10. Remain idempotent when rerun against the same source revision.

## 4. Non-Goals

The task will not:

- copy the writing repository into the application repository
- process non-RSC writing
- treat every prose revision as a scene revision
- convert ambiguous prose directly into canon
- invent distances, directions, buildings, or landmarks to fill gaps
- auto-merge, auto-deploy, or modify the production GLB without review
- rewrite source manuscripts
- expose private drafts or long manuscript excerpts in reports
- replace the existing deterministic scene generator

## 5. Source Boundary

The writing repository remains authoritative for narrative material and canon. The application repository remains authoritative for spatial interpretation, generated geometry, presentation, validation, and deployment.

The automation must use an allowlisted writing root:

```text
Rock Springs Chronicles/
```

Within that root, each scene plan must declare its narrower source contract. The current plan is limited to *Jackie's Window*, Part 1, Chapters 1–8. New books, parts, or chapters must not affect that GLB until the scene's source declaration is intentionally expanded.

The application repository should retain source references and revision identifiers, not manuscript copies. Public reports should use chapter references, stable source identifiers, and concise spatial-fact paraphrases. They should not reproduce unpublished passages.

## 6. Proposed Daily Pipeline

### Phase 1: Detect and Classify Source Changes

The workflow checks out both repositories and compares the current writing revision with the revision recorded by the spatial plan.

The scanner should:

- restrict itself to the allowlisted RSC root
- restrict each scene to its declared work and chapter coverage
- enumerate changed Markdown and approved metadata files
- ignore formatting-only and unrelated changes where possible
- identify candidate references to places, directions, adjacency, routes, elevation, visibility, structures, and environmental features
- produce a machine-readable drift report

Example output:

```json
{
  "sceneId": "jackies-window-canonical-geography-v4",
  "previousRevision": "00350c94f1152116e1d27250dfb0674c5ccfea37",
  "candidateRevision": "<writing-commit>",
  "spatialChangesDetected": true,
  "changedSourceIds": [
    "jackies-window/chapter-07"
  ],
  "proposalsRequired": 2
}
```

If no spatially relevant changes are found, the workflow exits successfully without regenerating the GLB or opening a new pull request.

The authoritative scene revision advances only through a merged spatial-sync pull request. Re-scanning accumulated non-spatial changes is acceptable and safer than maintaining an unaudited external cursor.

### Phase 2: Produce a Candidate Spatial Plan

The most stable long-term input is structured spatial metadata stored with, or adjacent to, the writing material. For example:

```yaml
spatial:
  facts:
    - subject: new-beginnings
      relation: northeast_of
      object: downtown
      classification: canon
      source: chapter-07
```

A deterministic adapter can validate these facts and translate them into a candidate scene plan.

If the source remains prose-only, a schema-constrained language model may be used to propose facts. That model must:

- return structured data conforming to an approved JSON schema
- cite a source identifier and chapter location for every proposal
- use `unknown` when the text does not establish a relationship
- distinguish explicit statements from inference
- never promote an inference to canon
- never directly edit the production branch
- produce a pull request for human review

Using a hosted model with unpublished writing requires a separate privacy decision covering the provider, data retention, and repository secrets. Until that decision is approved, the automation should stop at a deterministic drift report or rely on structured source metadata.

Every proposed scene element must retain one of these meanings:

- `CANON_*`: the location, feature, or relationship exists in the source
- `INFERRED_*`: placement or geometry is reasoned from incomplete evidence
- `PRESENTATION_*`: geometry exists to make the scene coherent but is not established by the source

The candidate output should include:

- updated spatial-plan JSON
- updated source revision
- updated spatial-evidence documentation
- a concise uncertainty report
- a list of added, changed, and removed landmarks, paths, cameras, and relationships

### Phase 3: Generate, Validate, and Open a Pull Request

When the candidate plan changes, the workflow runs:

```sh
npm ci
npm run scene:generate
npm run scene:check
npm test
npm run build
```

It should also verify:

- deterministic GLB generation
- stable selectable node names
- required scene groups
- valid cameras and paths
- no unexpected geometry loss
- browser rendering without runtime errors
- responsive scene behavior at mobile, tablet, and desktop viewports
- the scene container's established maximum height

If all checks pass, the task opens or updates a bot-owned pull request, using a branch such as:

```text
automation/rsc-spatial-sync
```

The pull request should contain:

- previous and candidate writing revisions
- changed RSC source identifiers
- spatial facts added, changed, or removed
- canon/inferred/presentation classifications
- unresolved questions
- spatial-plan diff
- regenerated GLB
- scene validation summary
- geometry and file-size changes
- responsive scene screenshots as workflow artifacts
- test and production-build results

The pull request must not be automatically merged.

## 7. Proposed Commands and Files

The implementation should add scripts with separate responsibilities:

```text
npm run spatial:scan
npm run spatial:propose
npm run spatial:sync
```

Suggested files:

```text
scripts/scan-rsc-spatial-drift.mjs
scripts/propose-spatial-plan.mjs
scripts/run-spatial-sync.mjs
scene-data/spatial-fact.schema.json
generated/spatial-sync-report.json
generated/spatial-sync-report.md
```

Responsibilities:

- `spatial:scan` performs read-only source comparison and emits the drift report.
- `spatial:propose` validates structured facts or creates a schema-constrained candidate proposal.
- `spatial:sync` updates candidate files, generates the GLB, and runs scene validation.

Pull-request creation belongs to the GitHub workflow, not the scene-generation scripts.

## 8. GitHub Actions Schedule

The recommended schedule is 5:17 AM Eastern each day. Running away from the top of the hour reduces exposure to periods when scheduled workflows are more likely to be delayed.

The workflow should also support manual execution:

```yaml
name: Daily RSC spatial sync

on:
  workflow_dispatch:
  schedule:
    - cron: "17 5 * * *"
      timezone: "America/New_York"

concurrency:
  group: rsc-spatial-sync
  cancel-in-progress: false
```

The completed workflow should:

1. Check out the application repository.
2. Create a narrowly scoped GitHub App installation token.
3. Check out the writing repository into a separate directory.
4. Install the pinned Node and npm toolchain with `npm ci`.
5. Run the spatial scan.
6. Exit cleanly if no scene proposal is required.
7. Generate and validate candidate changes.
8. Commit only the intended generated and planning files to the bot-owned branch.
9. Open or update one spatial-sync pull request.

The workflow file must be present on the application's default branch for scheduled runs to occur.

All referenced GitHub Actions must be pinned to full commit SHAs rather than mutable version tags.

GitHub reference material:

- [Scheduled workflow behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
- [GITHUB_TOKEN scope and behavior](https://docs.github.com/en/actions/concepts/security/github_token)
- [Using GITHUB_TOKEN in workflows](https://docs.github.com/en/actions/tutorials/authenticate-with-github_token)

## 9. Authentication and Permissions

The application repository's normal `GITHUB_TOKEN` is scoped to that repository and should not be treated as cross-repository credentials.

The preferred durable solution is a GitHub App installed only on the two relevant repositories.

Minimum proposed access:

| Repository | Permission | Access |
| --- | --- | --- |
| Writing | Contents | Read |
| Application | Contents | Write |
| Application | Pull requests | Write |

The App ID and private key must be stored as GitHub Actions configuration and secrets. They must never be committed or printed in workflow output.

A fine-grained personal access token is an acceptable temporary alternative, but it is less desirable because it is tied to an individual account and lifecycle.

The workflow-level `permissions` block should grant only the capabilities required by each job.

## 10. Review Policy

Human review is required whenever the proposal:

- adds or removes a named location
- changes a canon relationship
- moves a named landmark
- changes a sightline or route
- changes the source coverage of the scene
- changes a stable public node name
- resolves a previous uncertainty
- increases the specificity of inferred geometry

Reviewers should verify:

1. The cited writing establishes the proposed fact.
2. The classification is accurate.
3. The scene interpretation does not overstate the prose.
4. Existing spatial relationships still make sense.
5. Generated geometry remains readable and performant.
6. The responsive screenshots remain acceptable.

The merge of the pull request records acceptance of both the candidate plan and its source revision.

## 11. Failure and Recovery Behavior

The task must fail without changing production when:

- either repository cannot be checked out
- source scope cannot be proven
- structured facts fail schema validation
- prose extraction returns uncited or ambiguous claims
- a stable node name unexpectedly changes
- scene generation is nondeterministic
- GLB validation fails
- tests or the production build fail
- the candidate branch contains files outside the approved output set

Failures should leave:

- a concise GitHub Actions summary
- no manuscript excerpts in logs
- no production deployment
- the previous production GLB intact

Rerunning the workflow against the same source revision must produce the same candidate result.

## 12. Local Scheduling Fallback

GitHub Actions can process only writing that has been pushed to GitHub.

If new chapters routinely remain in the local writing working tree, a Windows Scheduled Task can run the same Node scripts locally. That task should:

- use the existing local writing repository as read-only input
- use the application repository as generated output
- never commit or push manuscript changes
- use a lock file or process check so only one sync runs at a time
- run the same validation commands as CI
- open a pull request only after the writing revision has been pushed and can be referenced reproducibly

GitHub Actions remains preferable because it does not depend on a particular computer being awake and provides centralized logs, review history, and reproducible repository revisions.

## 13. Rollout Plan

### Stage A: Deterministic Drift Detection

- implement the source allowlist and revision comparison
- add the spatial drift report
- run manually against known writing changes
- do not invoke a language model
- do not change the GLB

### Stage B: Candidate Plan Generation

- approve the spatial-fact schema
- prefer structured writing metadata
- optionally add privacy-approved prose extraction
- generate candidate plan and evidence changes
- verify deterministic output

### Stage C: Daily Pull-Request Automation

- create and install the GitHub App
- add the scheduled workflow
- generate and validate the GLB
- add responsive scene artifacts
- open or update one bot-owned pull request
- retain mandatory human approval

## 14. Completion Criteria

This proposal is complete when:

- daily runs inspect only declared RSC source material
- unchanged or non-spatial writing creates no GLB churn
- every proposed spatial fact is source-traceable
- canon, inference, and presentation remain distinguishable
- the GLB is generated only from a validated candidate plan
- generated changes pass scene validation, tests, and production build
- one reviewable pull request represents each pending spatial update
- no automation can auto-merge or auto-deploy a spatial reinterpretation
- no unpublished manuscript content leaks into the application repository or workflow logs
- the process works both on schedule and through manual dispatch

## 15. Recommended Decision

Approve Stage A first: deterministic daily drift detection and reporting.

After its reports are accurate, adopt structured spatial metadata as the primary update mechanism. Add prose-based model extraction only as a human-reviewed proposal layer and only after its privacy and credential lifecycle have been approved.

This preserves the writing repository as the canonical narrative source while allowing the Three.js town scene to evolve reliably as Rock Springs Chronicles grows.
