# Content Troubleshooting

## Writing repository not found

Set `RSC_WRITING_ROOT` to the repository root, not the Part 1 directory.

## Approval mismatch

Confirm the exact relative path and every `requirements` field in
`content-policy/approved-sources.json`. Do not weaken the validator to admit a
file accidentally.

## Generated package is stale

Run `npm run content:build`, inspect the diff, then run
`npm run content:check:source`.

## Inventory is stale

Run `npm run content:audit:source`. The inventory must contain hashes and
metadata only.

## Duplicate ID or slug

Correct the stable-ID or slug rule before publishing. Do not append random
values.

## Broken relationship

Approve and publish the target entry or remove the relationship. Never redirect
it to an approximate match.

## Reader deep link shows unavailable

Check that the slug exists in `/api/collections/chronicles` and in the generated
package. Cloudflare assets must retain SPA `not_found_handling`.

## Snapshot changed

Verify the source package and inspect all three rendered breakpoints before
updating the baseline.
