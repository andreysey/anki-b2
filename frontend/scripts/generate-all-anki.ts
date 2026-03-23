import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const dataPath = path.resolve(__dirname, '../public/data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  const levels = ['B1+', 'B2'];

  console.log('🚀 Starting Anki generation...');
  console.time('Total Generation');

  // 1. Full Levels (Matching Rust)
  console.log('📊 Generating Full Levels (B1+, B2)...');
  for (const level of levels) {
    console.log(`⏳ Generating Full ${level}...`);
    try {
      execSync(`npx tsx scripts/generate-anki.ts "${level}"`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`❌ Failed Full Level: ${level}`);
    }
  }

  // 2. Combined Deck (B1plus_B2)
  console.log('🌎 Generating Combined B1+/B2 Deck...');
  try {
    execSync(`npx tsx scripts/generate-anki.ts "B1plus_B2"`, { stdio: 'inherit' });
  } catch (e) {
    console.error(`❌ Failed Combined Deck`);
  }

  console.log('🏁 All Anki decks generated successfully!');
  console.timeEnd('Total Generation');
}

main();
