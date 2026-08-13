/**
 * generate-all-anki.ts — Multi-threaded Anki Deck Generator
 *
 * Discovers source .txt files, generates B1+, B2, and Combined Anki decks
 * concurrently across multiple Worker Threads (multi-core parallelization).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import type { GenerateResult } from './generate-anki.js';
import { getThemaNum } from './utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../');

function runDeckWorker(files: string[], baseName: string, outputDir: string): Promise<GenerateResult> {
  return new Promise((resolve, reject) => {
    const workerPath = path.join(__dirname, 'deck-worker.ts');
    const worker = new Worker(workerPath, {
      workerData: { files, baseName, outputDir },
      execArgv: process.execArgv,
    });

    worker.on('message', (msg) => {
      if (msg.success) {
        resolve(msg.result);
      } else {
        reject(new Error(msg.error));
      }
    });

    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker for ${baseName} stopped with exit code ${code}`));
      }
    });
  });
}

async function main() {
  const sourceDir = path.join(root, 'source');
  const outputDir = path.join(root, 'anki');
  fs.mkdirSync(outputDir, { recursive: true });
  
  const dataJsonDocs    = path.join(root, 'dist', 'data.json');
  const dataJsonPublic  = path.join(root, 'public', 'data.json');

  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ ERROR: 'source' directory not found at ${sourceDir}`);
    process.exit(1);
  }

  // Discover and sort files
  const allFiles = fs.readdirSync(sourceDir)
    .filter(f => f.endsWith('.txt'))
    .map(f => path.join(sourceDir, f));

  const b1Files = allFiles
    .filter(f => path.basename(f).includes('B1_plus_Thema'))
    .sort((a, b) => getThemaNum(path.basename(a)) - getThemaNum(path.basename(b)));

  const b2Files = allFiles
    .filter(f => path.basename(f).startsWith('B2_'))
    .sort((a, b) => getThemaNum(path.basename(a)) - getThemaNum(path.basename(b)));

  const combined = [...b1Files, ...b2Files];

  console.log('🚀 Starting multi-threaded Anki deck generation across worker threads...');
  console.time('Total Generation');

  // Spawn separate worker threads for each deck to utilize multiple CPU cores
  const [r1, r2, rc] = await Promise.all([
    runDeckWorker(b1Files, 'B1plus', outputDir),
    runDeckWorker(b2Files, 'B2', outputDir),
    runDeckWorker(combined, 'B1plus_B2', outputDir),
  ]);

  console.log(`✅ Anki: B1+ deck generated (${r1.uniqueCards} unique cards from ${r1.totalEntries} total entries)`);
  if (r1.warnings.length > 0) r1.warnings.forEach(w => console.warn(`  ⚠️  ${w}`));

  console.log(`✅ Anki: B2 deck generated (${r2.uniqueCards} unique cards from ${r2.totalEntries} total entries)`);
  if (r2.warnings.length > 0) r2.warnings.forEach(w => console.warn(`  ⚠️  ${w}`));

  console.log(`✅ Anki: Combined deck generated (${rc.uniqueCards} unique cards from ${rc.totalEntries} total entries)`);
  if (rc.warnings.length > 0) rc.warnings.forEach(w => console.warn(`  ⚠️  ${w}`));

  // Write data.json
  const json = JSON.stringify(rc.webData, null, 2);
  fs.mkdirSync(path.dirname(dataJsonDocs), { recursive: true });
  fs.writeFileSync(dataJsonDocs, json);
  console.log(`✅ Web data written to dist/data.json (${rc.webData.length} unique entries)`);

  // Sync to public/data.json (so the web app uses latest data)
  fs.copyFileSync(dataJsonDocs, dataJsonPublic);
  console.log(`✅ Copied to public/data.json`);

  // Summary
  const totalWarnings = r1.warnings.length + r2.warnings.length + rc.warnings.length;
  console.timeEnd('Total Generation');
  if (totalWarnings > 0) {
    console.log(`⚠️  Completed with ${totalWarnings} warnings.`);
  } else {
    console.log('✨ Build completed successfully with 0 errors!');
  }
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
