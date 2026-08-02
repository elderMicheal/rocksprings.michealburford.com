# Content Lifecycle

## States

- `private`: never exported
- `draft`: editorial work, not exported without a separate explicit approval
- `review`: awaiting publication decision
- `publishable`: structurally valid but not yet public
- `published`: included in the public package
- `withdrawn`: body removed; a minimal tombstone may return HTTP 410

The current chapters are editorial drafts with an independent `published`
application state granted by the product owner. The reader identifies them as
working drafts.

## Lifecycle

1. Write and revise in the Writing repository.
2. Add or update an exact approval record.
3. Run the read-only source audit.
4. Build the deterministic package.
5. Compare the package with the source.
6. Review browser snapshots and validation output.
7. Commit the approval, inventory, package, code, and reviewed snapshots.
8. Deploy the committed package.

Withdrawal removes an entry body from collections and adds only its collection
and slug to `withdrawn`. Restoration requires a new approval and package build.
