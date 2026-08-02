# Publication Rollback

The committed package is the rollback unit.

1. Identify the last reviewed commit containing a known-good approval manifest,
   inventory, package, and snapshots.
2. Revert the later publication commit with a normal Git revert.
3. Run `npm ci`, `npm run content:audit`, `npm run content:check`,
   `npm test`, and `npm run build`.
4. Deploy the reverted commit.

Do not regenerate from the current Writing worktree during rollback; doing so
would produce a new package rather than restore the reviewed one.

The package ID, source revision, and content digest in `/api/manifest` verify
which publication is live.
