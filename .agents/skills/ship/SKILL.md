---
name: ship
description: Commit, push and verify a change in anki-b2 end to end — choosing the commit prefix (which decides whether a release goes live), handling the release bot's commit, waiting for CI and confirming the release/deploy. Use whenever finishing a task that should be committed and pushed.
---

# Ship a Change

Every push to `main` runs one **CI** workflow: checks → release → deploy. The release and deploy
jobs start only after every check passed. semantic-release reads the commit prefixes since the
last release: `feat`/`fix` publish a new version; other prefixes redeploy the same version.

## 1. Verify locally

```bash
npm run agent:ready          # type-check, data lint, health checks, tests
npm run format:check         # CI fails on formatting
```

Also, depending on what changed:

- Generator / `source/*.txt` → `npm run generate:anki && npm run diff:data`, review every card.
  Commit `anki/*.apkg` + `public/data.json` only if `data.json` changed.
- UI → `npm run build && npm run audit:ui` (must report zero problems).
- Progress, backup, storage, service worker or navigation → `npm run build && npm run test:e2e`
  (CI runs it too; first time locally: `npx playwright install chromium`).

The pre-commit and pre-push hooks run these checks again; never bypass them with `--no-verify`
for code changes.

## 2. Pick the prefix

| Change                                           | Prefix                     | Release? |
| ------------------------------------------------ | -------------------------- | -------- |
| New user-visible feature                         | `feat(scope):`             | minor    |
| Bug fix, data/deck fix users should get          | `fix(scope):`              | patch    |
| Agent rules, docs                                | `docs:`                    | no       |
| Tooling, scripts for developers, deps not shipped | `chore:` / `build:`        | no       |
| CI workflows                                     | `ci:`                      | no       |
| Tests only                                       | `test:`                    | no       |

Split a mixed change into separate commits so only the user-facing part releases.
Use a body that explains *why*; end with the attribution trailer the session requires.

## 3. Push

```bash
git push origin main
```

Rejected with "fetch first"? The release bot pushed `chore(release): x.y.z` after your previous
push. Rebase on it — never force-push `main`:

```bash
git pull --rebase && git push origin main
```

## 4. Wait for CI and the release

```bash
npm run ci:status -- --wait
```

It prints each workflow with ✅/❌, exits 1 on failure, and says whether a release commit was
created. Then `git pull --rebase` so the next commit starts from the release commit.

- `ci:status` uses the GitHub CLI login (`gh auth login`, 5000 requests/hour); without it the
  public API allows only 60/hour. If it reports the rate limit, wait or log in with `gh`.
- On failure it prints `gh run view <id> --log-failed` — run that to read the failing step's log.
  `gh run rerun <id> --failed` retries a flaky job without a new commit.
- If `build-and-test` fails, nothing was released or deployed: fix and push again.

## 5. Confirm the deploy (for `feat`/`fix`)

The header shows the version (`vX.Y.Z`). After the deploy job finishes, the live site at
https://andreysey.github.io/anki-b2/ should reference the new build; the PWA updates itself on the
next visit.
