# Content Lifecycle

## States

Application publication states:

- `private` — never exported
- `draft` — editorial work; not public without separate explicit approval
- `review` — awaiting publication decision
- `publishable` — structurally valid but not yet public
- `published` — included in the public package
- `withdrawn` — body removed; a minimal tombstone may return HTTP 410

Writing editorial status and application publication state are independent.

An editorial draft may be publicly presented when the owner explicitly approves that exact source. Canonical/internal material may remain private.

## Publication lifecycle

1. Write/revise in the Writing repository.
2. Confirm accurate author metadata, publication intent, and stable entry slug when required.
3. Add/update exact application approval and parent work registration.
4. Run the read-only source audit.
5. Build the deterministic publication package.
6. Compare the package with the intended Writing revision.
7. Review work/entry identity and public paths.
8. Run the validation tier appropriate to the change.
9. Commit approval, generated inventory/package, code/docs when applicable.
10. Run complete release validation before deployment.
11. Deploy only under `AGENTS.md`.

## Withdrawal

A withdrawn public record must not silently disappear into a 404 when a tombstone is required.

Withdrawal removes public body data and records only the minimum stable collection/slug state needed for HTTP 410 behavior.

Restoration requires renewed explicit approval and package generation.
