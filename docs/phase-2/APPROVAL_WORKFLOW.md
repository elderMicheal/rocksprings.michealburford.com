# Approval Workflow

Publication approval lives in `content-policy/approved-sources.json`.

Each approval must contain:

- a stable approval ID;
- target collection and publication state;
- exact repository-relative source paths;
- required front-matter values;
- approved public fields;
- approval basis and date;
- notes for exceptional mappings.

Approvals use exact paths rather than globs. A new chapter or renamed file is
not public until the manifest is deliberately updated.

The current approval records the owner's instruction to publish Part 1
Chapters 1–8. It does not approve the interlude, back matter, profiles, place
records, artifacts, timelines, or media.

Reviewers should compare:

```sh
npm run content:audit:source
npm run content:build
npm run content:check:source
git diff -- content-policy generated src/content/generated
```

Approval changes and generated output must be reviewed together.
