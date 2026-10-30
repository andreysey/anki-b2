/**
 * ci-status.ts — shows GitHub Actions results for a commit, optionally waiting for them.
 *
 * Usage:
 *   npm run ci:status                 # status of HEAD
 *   npm run ci:status -- --wait       # wait until all runs finish (max 15 min)
 *   npm run ci:status -- <sha> --wait
 *
 * Uses the public GitHub API (60 requests/hour without a token). Set GITHUB_TOKEN for more.
 * Exit code: 0 = all runs succeeded (or still running without --wait), 1 = a run failed / timeout.
 * After the runs finish it also reports whether semantic-release pushed a release commit.
 */
import { execFileSync } from 'node:child_process';

interface Run {
  name: string;
  event: string;
  status: string;
  conclusion: string | null;
  html_url: string;
}

const POLL_MS = 30_000;
const TIMEOUT_MS = 15 * 60_000;

const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const wait = args.includes('--wait');
const sha = git('rev-parse', args.find((a) => !a.startsWith('--')) ?? 'HEAD');
const remote = git('remote', 'get-url', 'origin');
const repo = remote.match(/github\.com[:/](.+?)(?:\.git)?$/)?.[1];
if (!repo) {
  console.error(`❌ origin is not a GitHub repository: ${remote}`);
  process.exit(1);
}

async function fetchRuns(): Promise<Run[]> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${repo}/actions/runs?head_sha=${sha}`, {
    headers
  });
  if (res.status === 403 || res.status === 429) {
    const reset = Number(res.headers.get('x-ratelimit-reset')) * 1000;
    const minutes = reset ? Math.max(1, Math.ceil((reset - Date.now()) / 60_000)) : '?';
    throw new Error(
      `GitHub API rate limit reached; resets in ~${minutes} min (set GITHUB_TOKEN to raise it)`
    );
  }
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { workflow_runs: Run[] };
  return data.workflow_runs.filter((r) => r.event === 'push' || r.event === 'workflow_dispatch');
}

const icon = (r: Run) =>
  r.status !== 'completed'
    ? '⏳'
    : r.conclusion === 'success'
      ? '✅'
      : r.conclusion === 'skipped'
        ? '⏭️'
        : '❌';

async function main() {
  console.log(`${repo} @ ${sha.slice(0, 7)} — ${git('log', '-1', '--format=%s', sha)}`);
  const started = Date.now();
  let runs: Run[];
  for (;;) {
    runs = await fetchRuns();
    const done = runs.length > 0 && runs.every((r) => r.status === 'completed');
    if (done || !wait) break;
    if (Date.now() - started > TIMEOUT_MS) {
      console.error('❌ Timed out waiting for workflow runs.');
      process.exit(1);
    }
    await sleep(POLL_MS);
  }

  if (!runs.length) {
    console.log('No workflow runs for this commit (not pushed yet, or a [skip ci] commit).');
    return;
  }
  for (const r of runs)
    console.log(`  ${icon(r)} ${r.name}: ${r.conclusion ?? r.status}  ${r.html_url}`);

  const failed = runs.some(
    (r) => r.status === 'completed' && !['success', 'skipped'].includes(r.conclusion ?? '')
  );
  if (failed) process.exit(1);

  if (runs.every((r) => r.status === 'completed')) {
    git('fetch', '--quiet', 'origin');
    // semantic-release commits "chore(release): x.y.z" on top of the pushed commit
    const releaseCommit = git(
      'log',
      'origin/main',
      '--grep=^chore(release)',
      '--format=%P %h %s',
      '-n',
      '50'
    )
      .split('\n')
      .find((line) => line.startsWith(sha));
    console.log(
      releaseCommit
        ? `🚀 Released: ${releaseCommit.split(' ').slice(1).join(' ')} — run \`git pull --rebase\` before your next commit.`
        : 'ℹ️  No release for this commit (prefix chore/ci/build/docs/test, or nothing to release).'
    );
  }
}

main().catch((err: unknown) => {
  console.error('❌', err instanceof Error ? err.message : err);
  process.exit(1);
});
