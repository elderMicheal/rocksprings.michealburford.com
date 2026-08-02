# Rock Springs Architecture

RockSprings.MichealBurford.com is the interactive world site for The Rock Springs Chronicles.

It is not a manuscript repository.

It is not an editing environment.

It is a deployed reader/explorer application with a same-origin server-side API.

## Repositories

### Writing repo

The Writing repo is the authoritative source for Rock Springs Markdown and related source material.

It remains writing-only.

### Rock Springs app repo

This repo contains the application that powers rocksprings.michealburford.com.

It contains UI, routes, server-side API code, content adapter code, styling, and deployment configuration.

It contains a deterministic publication package for exact manuscript paths
explicitly approved for the public reader. It does not contain the private
Writing repository, unapproved manuscripts, notes, or research.

## Phase 2

The app deploys and serves:

- frontend UI
- same-origin API responses
- revision-traced approved content
- deterministic collection and relationship indexes

The current delivery strategy is a build-time approved export. Runtime access
to the Writing repository is prohibited.
