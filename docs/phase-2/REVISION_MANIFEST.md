# Source-Revision Manifest

Every publication package manifest contains:

- `packageId`: short source and content identity
- `sourceRevision`: full Writing Git commit
- `contentDigest`: SHA-256 of collections, relationships, and tombstones
- `approvalId`: approval record used for admission
- `world`: stable world identity and source-backed title
- collection counts

The digest excludes wall-clock time and local absolute paths. Two builds from
the same source files, approval policy, and exporter must be byte-identical.

The metadata inventory separately records repository, branch, revision,
revision date, RSC worktree status, source hashes, front matter, and link
resolution without manuscript bodies.
