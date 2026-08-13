import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '../source');

let errorCount = 0;
let warningCount = 0;

function checkFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const baseName = path.basename(filePath);

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Skip metadata headers and empty lines
    if (!trimmed || trimmed.startsWith('#')) return;

    // 1. Validate Delimiters (must have exactly 3 semicolons)
    const semicolonCount = (trimmed.match(/;/g) || []).length;
    if (semicolonCount !== 3) {
      console.error(`❌ ${baseName}:${lineNum} [Format]: Expected exactly 3 delimiters (found ${semicolonCount})`);
      errorCount++;
    }

    const parts = trimmed.split(';');
    const german = parts[0]?.trim() || '';
    const english = parts[1]?.trim() || '';
    const ukrainian = parts[2]?.trim() || '';
    const example = parts[3]?.trim() || '';

    if (!german) {
      console.error(`❌ ${baseName}:${lineNum} [Missing German Term]`);
      errorCount++;
    }

    if (!ukrainian) {
      console.error(`❌ ${baseName}:${lineNum} [Missing Ukrainian]: "${german}"`);
      errorCount++;
    }

    if (!english) {
      console.warn(`⚠️  ${baseName}:${lineNum} [Missing English]: "${german}"`);
      warningCount++;
    }

    // 3. Find Cyrillic characters in German/English columns
    // Range \u0400-\u04FF covers Cyrillic characters
    const cyrillicRegex = /[\u0400-\u04FF]/;
    if (cyrillicRegex.test(german)) {
      console.error(`❌ ${baseName}:${lineNum} [Cyrillic in German]: "${german}"`);
      errorCount++;
    }
    if (cyrillicRegex.test(english)) {
      console.error(`❌ ${baseName}:${lineNum} [Cyrillic in English]: "${english}"`);
      errorCount++;
    }
    if (cyrillicRegex.test(example)) {
      console.warn(`⚠️  ${baseName}:${lineNum} [Cyrillic in Example]: "${example}"`);
      warningCount++;
    }

    // 4. Check for abbreviations in example that are in parentheses in German
    // matches e.g. "die Berufsgenossenschaft (BG)"
    const parenMatch = german.match(/\(([^)]+)\)/);
    if (parenMatch && parenMatch[1]) {
      const abbr = parenMatch[1].trim();
      // Ensure it looks like an abbreviation (2-4 uppercase characters)
      if (/^[A-Z]{2,4}$/.test(abbr)) {
        // If example uses the abbreviation instead of a full word, warn about it
        const wordPattern = new RegExp(`\\b${abbr}\\b`);
        if (wordPattern.test(example) && !example.toLowerCase().includes(german.split('(')[0].trim().toLowerCase().slice(0, 5))) {
          console.warn(`⚠️  ${baseName}:${lineNum} [Abbreviation Alert]: Example uses "${abbr}", consider using full word from "${german}"`);
          warningCount++;
        }
      }
    }
  });
}

function run() {
  console.log('🔍 Starting validation of data files...');
  if (!fs.existsSync(sourceDir)) {
    console.error(`Error: Directory ${sourceDir} does not exist.`);
    process.exit(1);
  }

  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.txt'));
  files.forEach(f => checkFile(path.join(sourceDir, f)));

  if (errorCount > 0) {
    console.error(`\n❌ Validation failed: ${errorCount} error(s), ${warningCount} warning(s) found.`);
    process.exit(1);
  } else if (warningCount > 0) {
    console.log(`\n⚠️  Validation passed with ${warningCount} warning(s).`);
  } else {
    console.log('\n✅ Validation passed with zero errors/warnings.');
  }
}

run();
