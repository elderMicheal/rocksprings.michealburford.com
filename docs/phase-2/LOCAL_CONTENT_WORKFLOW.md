# Local Content Workflow

Use the existing development server on port 5150:

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5150 --strictPort
```

Keep one instance running for hot updates.

After Writing-repository changes:

```sh
npm run content:audit:source
npm run content:build
npm run content:check:source
npm run content:audit
npm run content:check
npm run public:check
```

If the Writing repository is not at the adjacent default location, set
`RSC_WRITING_ROOT` to its absolute root. Do not point it at a non-RSC
repository.

Run browser tests against the existing server:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:5150'
npm run test:e2e
```

The source audit is read-only. The build writes only generated application
artifacts.
