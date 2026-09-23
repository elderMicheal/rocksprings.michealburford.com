# Transitional Writing Adapter

This directory preserves the current Rock Springs source-ingestion behavior while Draftworks API v1 is being built.

It may read the local `micheal-writes` checkout to audit Rock Springs metadata and generate the current compatibility publication package.

It must not modify manuscript files, become the long-term writing API, or be called directly by website presentation code.

The stable application boundary is `src/adapters/writing-source.ts`. When Draftworks API v1 supplies equivalent permitted content, this directory is a retirement candidate.
