import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '../source');

let errorCount = 0;
let warningCount = 0;

export interface ValidationIssue {
  type: 'error' | 'warning';
  category: string;
  message: string;
}

export function validateLine(line: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const trimmed = line.trim();

  // Skip metadata headers and empty lines
  if (!trimmed || trimmed.startsWith('#')) return issues;

  // 1. Validate Delimiters (must have exactly 3 semicolons)
  const semicolonCount = (trimmed.match(/;/g) || []).length;
  if (semicolonCount !== 3) {
    issues.push({
      type: 'error',
      category: 'Format',
      message: `Expected exactly 3 delimiters (found ${semicolonCount})`
    });
  }

  const parts = trimmed.split(';');
  const german = parts[0]?.trim() || '';
  const english = parts[1]?.trim() || '';
  const ukrainian = parts[2]?.trim() || '';
  const example = parts[3]?.trim() || '';

  if (!german) {
    issues.push({
      type: 'error',
      category: 'Missing German Term',
      message: 'German term is required'
    });
  }

  if (!ukrainian) {
    issues.push({
      type: 'error',
      category: 'Missing Ukrainian',
      message: `Missing Ukrainian: "${german}"`
    });
  }

  if (!english) {
    issues.push({
      type: 'warning',
      category: 'Missing English',
      message: `Missing English: "${german}"`
    });
  }

  // 3. Find Cyrillic characters in German/English columns
  // Range \u0400-\u04FF covers Cyrillic characters
  const cyrillicRegex = /[\u0400-\u04FF]/;
  if (cyrillicRegex.test(german)) {
    issues.push({
      type: 'error',
      category: 'Cyrillic in German',
      message: `Cyrillic in German: "${german}"`
    });
  }
  if (cyrillicRegex.test(english)) {
    issues.push({
      type: 'error',
      category: 'Cyrillic in English',
      message: `Cyrillic in English: "${english}"`
    });
  }
  if (cyrillicRegex.test(example)) {
    issues.push({
      type: 'warning',
      category: 'Cyrillic in Example',
      message: `Cyrillic in Example: "${example}"`
    });
  }

  // 4. Check for abbreviations in example that are in parentheses in German
  const parenMatch = german.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    const abbr = parenMatch[1].trim();
    if (/^[A-Z]{2,4}$/.test(abbr)) {
      const wordPattern = new RegExp(`\\b${abbr}\\b`);
      if (
        wordPattern.test(example) &&
        !example.toLowerCase().includes(german.split('(')[0].trim().toLowerCase().slice(0, 5))
      ) {
        issues.push({
          type: 'warning',
          category: 'Abbreviation Alert',
          message: `Example uses "${abbr}", consider using full word from "${german}"`
        });
      }
    }
  }

  return issues;
}

function checkFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const baseName = path.basename(filePath);

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const issues = validateLine(line);
    issues.forEach((issue) => {
      if (issue.type === 'error') {
        console.error(`❌ ${baseName}:${lineNum} [${issue.category}]: ${issue.message}`);
        errorCount++;
      } else {
        console.warn(`⚠️  ${baseName}:${lineNum} [${issue.category}]: ${issue.message}`);
        warningCount++;
      }
    });
  });
}

function run() {
  const startTime = performance.now();
  console.log('🔍 Starting validation of data files...');
  if (!fs.existsSync(sourceDir)) {
    console.error(`Error: Directory ${sourceDir} does not exist.`);
    process.exit(1);
  }

  const files = fs.readdirSync(sourceDir).filter((f) => f.endsWith('.txt'));
  files.forEach((f) => checkFile(path.join(sourceDir, f)));

  const durationMs = (performance.now() - startTime).toFixed(1);

  if (errorCount > 0) {
    console.error(
      `\n❌ Validation failed: ${errorCount} error(s), ${warningCount} warning(s) found in ${durationMs}ms.`
    );
    process.exit(1);
  } else if (warningCount > 0) {
    console.log(`\n⚠️  Validation passed with ${warningCount} warning(s) in ${durationMs}ms.`);
  } else {
    console.log(`\n✅ Validation passed with zero errors/warnings in ${durationMs}ms.`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  run();
}
