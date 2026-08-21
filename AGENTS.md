# Rock Springs Production Mandate

This file is binding repository policy for every human contributor, automation,
and AI agent. Read it before changing deployment, DNS, hosting, CI, or release
configuration.

## Production contract

- The production site is `https://rocksprings.michealburford.com/`.
- Production runs as the Cloudflare Worker named
  `rocksprings-michealburford-com`.
- `wrangler.jsonc` is the authoritative hosting and routing configuration.
- The React assets and the same-origin Worker API are one application and must
  be deployed together with `npm run deploy`.
- The custom domain must remain attached to that Worker. Cloudflare must serve
  both `/` and `/api/*` on the same hostname.
- GitHub Actions validates the repository. GitHub Pages is not a production,
  preview, fallback, or recovery host for this application.

## Prohibited changes

Unless the owner explicitly requests a hosting migration and approves its
cutover plan, no contributor or agent may:

- enable GitHub Pages for this repository;
- add a `pages` deployment workflow or treat a successful GitHub Pages build as
  a successful production deployment;
- point `rocksprings.michealburford.com` at `*.github.io`, a Pages project, or
  any origin other than the configured Cloudflare Worker;
- delete, replace, or repurpose the Worker's custom-domain route;
- remove the Worker/API architecture, `wrangler.jsonc`, or the authoritative
  lockfile as a deployment shortcut;
- change hosting providers, DNS ownership, Worker names, or the production
  hostname as an incidental part of UI, content, dependency, or CI work;
- deploy from an uncommitted or mixed worktree; or
- force-push `main` without the owner's explicit instruction naming the exact
  target commit.

A request to redesign the front page, update content, fix code, or "make it
deploy" is not authorization to change the hosting model.

## Required release procedure

1. Identify the exact commit intended for production and use a clean checkout
   or clean temporary worktree at that commit. Never discard or include an
   owner's unrelated local changes.
2. Install the committed dependency graph with `npm ci`.
3. Run the repository's required checks and `npm run build`.
4. Deploy with `npm run deploy`. A Git push by itself is not proof that this
   application was deployed.
5. Confirm the deployment reports the expected Worker and the custom-domain
   trigger for `rocksprings.michealburford.com`.
6. Verify through the ordinary public hostname:
   - `/` returns HTTP 200 and application HTML; and
   - `/api/health` returns HTTP 200 with `"ok": true`.
7. Report success only after the public hostname works through normal DNS. An
   uploaded Worker version, a green CI run, a direct-IP request, or a provider
   preview URL is not sufficient.

If DNS changed, recovery is not complete while the former origin can still be
reached through normal cached DNS. State plainly that propagation is pending;
do not tell the owner the site is fixed prematurely.

## Hosting migration rule

Any future migration away from Cloudflare Workers requires a separate,
owner-approved plan that names the replacement for every current responsibility:

- static assets;
- SPA fallback routing;
- the same-origin `/api/*` Worker code;
- secrets and runtime bindings;
- the custom domain and TLS certificate;
- automatic deployments;
- rollback; and
- post-cutover verification.

The replacement must be deployed and verified before DNS is changed. The old
production path must remain recoverable until the new public path is confirmed.
Never combine half of one hosting architecture with half of another.

## Incident and rollback rule

When production returns 404, determine which provider generated the response
before changing application code. Check the exact URL, response headers,
authoritative DNS, the Worker custom-domain attachment, and the deployed Worker
version. Restore routing before redesigning or restructuring the application.

The known-good recovery commit for the 2026-08-21 incident is:

`fc8bee36b6df4d8e5992129b3eb77bbf6bf46b44`

It contains the working application architecture, lockfile, Worker/API,
deployment setup, and front-page redesign. It is an emergency reference point,
not permission to erase later work. Roll back to it only when the owner directs
that action or when an approved incident plan explicitly selects it.

## Definition of done

Deployment work is done only when the intended commit is live at
`https://rocksprings.michealburford.com/`, the health endpoint succeeds, the
custom domain resolves to Cloudflare, and the owner has not lost unrelated
local or remote work. If any of those conditions is unknown, report the unknown
instead of claiming success.
