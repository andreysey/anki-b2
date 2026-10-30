/**
 * diff-data.ts — shows which cards changed in public/data.json compared with a git revision.
 *
 * Usage: npm run diff:data [-- <rev>]      (default rev: HEAD)
 *
 * Example highlights are printed as [word] so a reviewer can check each change at a glance.
 * Exit code is 0 either way; this is a review aid, not a gate.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface Card {
  german_audio?: string;
  german?: string;
  example?: string;
  [key: string]: unknown;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_PATH = 'public/data.json';
const rev = process.argv[2] ?? 'HEAD';

const markHighlights = (html = ''): string =>
  html.replace(/<b style="color: #eab308;">(.*?)<\/b>/g, '[$1]').replace(/<[^>]+>/g, '');

const oldCards: Card[] = JSON.parse(
  execFileSync('git', ['show', `${rev}:${DATA_PATH}`], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  })
);
const newCards: Card[] = JSON.parse(fs.readFileSync(path.join(ROOT, DATA_PATH), 'utf8'));

if (oldCards.length !== newCards.length) {
  console.log(
    `⚠️  Card count changed: ${oldCards.length} → ${newCards.length} (cards compared by position)`
  );
}

let changed = 0;
const count = Math.min(oldCards.length, newCards.length);
for (let i = 0; i < count; i++) {
  const before = oldCards[i];
  const after = newCards[i];
  if (!before || !after) continue;
  const fields = Object.keys({ ...before, ...after }).filter(
    (k) => JSON.stringify(before[k]) !== JSON.stringify(after[k])
  );
  if (!fields.length) continue;
  changed++;
  console.log(`\n--- ${after.german_audio || after.german}`);
  for (const field of fields) {
    if (field === 'example') {
      console.log(`  was: ${markHighlights(before.example)}`);
      console.log(`  now: ${markHighlights(after.example)}`);
    } else {
      console.log(`  ${field}: ${JSON.stringify(before[field])} → ${JSON.stringify(after[field])}`);
    }
  }
}

console.log(`\n${changed} of ${count} cards changed compared with ${rev}.`);
