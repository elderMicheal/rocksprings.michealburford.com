# Approval Workflow

Public permission lives in:

`content-policy/approved-sources.json`

The policy currently uses `schemaVersion: 2`.

## Approval record

Each active readable approval must contain:

- stable approval ID;
- target collection;
- application publication state;
- exact repository-relative source paths;
- required front-matter values;
- approved public fields;
- approval basis/date/notes;
- parent work registration.

Work registration contains:

```json
{
  "id": "work:stable-id",
  "slug": "stable-work-slug",
  "kind": "novel",
  "order": 1
}
```

Supported work kinds are `novel`, `anthology`, `collection`, and `standalone`.

Approvals use exact source paths, never globs.

## One work, multiple approvals

Multiple approval records may contribute entries to the same work.

When they do, the work's:

- ID;
- slug;
- kind;
- order

must match exactly.

This permits separate approval requirements for different entry families without creating multiple public work identities.

## Author intent is still required

Approval does not overwrite Writing metadata.

An approved readable source must still satisfy its declared requirements and carry `publish: true`.

The application fails when an exact approval and its source disagree.

## Adding content to a supported work

1. Confirm the Writing commit and source metadata.
2. Confirm the source has deliberate `publish: true`.
3. Confirm required slug/sequence data.
4. Add the exact source path to an approval for the correct work.
5. Run:

```sh
npm run content:audit:source
npm run content:build
npm run content:check:source
npm run test:unit
```

6. Review:

```sh
git diff -- content-policy generated src/content/generated
```

7. Verify generated public work/entry paths.
8. Run reader/browser validation only when presentation/routing behavior changed.

## Adding a supported top-level work

1. Choose a permanent work ID.
2. Choose a permanent lowercase-hyphen work slug.
3. Choose its semantic work kind.
4. Assign stable public ordering.
5. Create approval record(s) with exact source paths.
6. Regenerate/validate.
7. Confirm the generic index/navigation exposes the work.

If the work/source kinds are already supported, no title-specific route or React component should be required.

## Renames

A source-file rename changes provenance and requires approval review/update.

A display-title change does not automatically change a stable work or entry slug.

Once public, route slugs are treated as stable identity.

## Withdrawal

Withdrawal must use the documented application lifecycle/tombstone process.

Removing a path from an approval is not, by itself, a complete public URL retirement strategy if that URL has already shipped.

## Review principle

Approval changes and generated output are reviewed together.

Do not manually edit the generated package to make an approval appear successful.
