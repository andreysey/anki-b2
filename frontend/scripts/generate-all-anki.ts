/**
 * generate-all-anki.ts — Port of Rust src/main.rs
 *
 * Discovers source .txt files, generates B1+, B2, and Combined Anki decks,
 * writes docs/data.json, and copies it to frontend/public/data.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateAnkiDeck } from './generate-anki.js';
import { getThemaNum, getLevelFromFilename } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Resolve repo root (same logic as Rust main.rs)
const root = path.resolve(__dirname, '../../');

async function main() {
  const sourceDir = path.join(root, 'source');
  const outputDir = path.join(root, 'docs', 'anki');
  const dataJsonDocs    = path.join(root, 'docs', 'data.json');
  const dataJsonPublic  = path.join(root, 'frontend', 'public', 'data.json');

  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ ERROR: 'source' directory not found at ${sourceDir}`);
    process.exit(1);
  }

  // Discover and sort files — same as Rust main.rs
  const allFiles = fs.readdirSync(sourceDir)
    .filter(f => f.endsWith('.txt'))
    .map(f => path.join(sourceDir, f));

  const b1Files = allFiles
    .filter(f => path.basename(f).includes('B1_plus_Thema'))
    .sort((a, b) => getThemaNum(path.basename(a)) - getThemaNum(path.basename(b)));

  const b2Files = allFiles
    .filter(f => path.basename(f).includes('B2_Thema'))
    .sort((a, b) => getThemaNum(path.basename(a)) - getThemaNum(path.basename(b)));

  const combined = [...b1Files, ...b2Files];

  console.log('🚀 Starting Anki generation...');
  console.time('Total Generation');

  // 1. B1+ deck
  console.log('⏳ Generating B1+...');
  const r1 = await generateAnkiDeck(b1Files, 'B1plus', outputDir);
  console.log(`✅ Anki: B1+ deck generated (${r1.uniqueCards} unique cards from ${r1.totalEntries} total entries)`);
  if (r1.warnings.length > 0) r1.warnings.forEach(w => console.warn(`  ⚠️  ${w}`));

  // 2. B2 deck
  console.log('⏳ Generating B2...');
  const r2 = await generateAnkiDeck(b2Files, 'B2', outputDir);
  console.log(`✅ Anki: B2 deck generated (${r2.uniqueCards} unique cards from ${r2.totalEntries} total entries)`);
  if (r2.warnings.length > 0) r2.warnings.forEach(w => console.warn(`  ⚠️  ${w}`));

  // 3. Combined deck + data.json
  console.log('⏳ Generating Combined B1+/B2...');
  const rc = await generateAnkiDeck(combined, 'B1plus_B2', outputDir);
  console.log(`✅ Anki: Combined deck generated (${rc.uniqueCards} unique cards from ${rc.totalEntries} total entries)`);
  if (rc.warnings.length > 0) rc.warnings.forEach(w => console.warn(`  ⚠️  ${w}`));

  // 4. Write data.json (same as Rust: docs/data.json)
  const json = JSON.stringify(rc.webData, null, 2);
  fs.mkdirSync(path.dirname(dataJsonDocs), { recursive: true });
  fs.writeFileSync(dataJsonDocs, json);
  console.log(`✅ Web data written to docs/data.json (${rc.webData.length} unique entries)`);

  // 5. Sync to frontend/public/data.json (so the web app uses latest data)
  fs.copyFileSync(dataJsonDocs, dataJsonPublic);
  console.log(`✅ Copied to frontend/public/data.json`);

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
