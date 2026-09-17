/**
 * Automated Health & Security Guard CLI for anki-b2
 * Run via: npm run health:check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

interface CheckResult {
  name: string;
  passed: boolean;
  details?: string[];
}

const results: CheckResult[] = [];

function getAllFiles(dir: string, extensions: string[]): string[] {
  let files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        files = files.concat(getAllFiles(fullPath, extensions));
      }
    } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

// 1. Audit v-html directives for mandatory sanitization
function checkVHtmlSanitization(): CheckResult {
  const vueFiles = getAllFiles(SRC_DIR, ['.vue']);
  const violations: string[] = [];

  for (const file of vueFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(ROOT_DIR, file);
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      if (line.includes('v-html=')) {
        const isSanitized =
          line.includes('sanitizeHtml(') || line.includes('sanitizeAiHtml(');
        if (!isSanitized) {
          violations.push(`${relativePath}:${index + 1} -> ${line.trim()}`);
        }
      }
    });
  }

  return {
    name: 'v-html Sanitization Boundary',
    passed: violations.length === 0,
    details: violations
  };
}

// 2. Audit for direct window.localStorage calls outside safeStorage
function checkDirectLocalStorageUsage(): CheckResult {
  const srcFiles = getAllFiles(SRC_DIR, ['.ts', '.vue']).filter(
    (file) =>
      !file.endsWith('storage.ts') &&
      !file.endsWith('.test.ts') &&
      !file.endsWith('vite-env.d.ts')
  );
  const violations: string[] = [];

  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(ROOT_DIR, file);
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Ignore comments
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

      if (
        /\b(?:window\.)?localStorage\.(?:getItem|setItem|removeItem|clear)\b/.test(line)
      ) {
        violations.push(`${relativePath}:${index + 1} -> ${trimmed}`);
      }
    });
  }

  return {
    name: 'SafeStorage Abstraction (No Direct localStorage)',
    passed: violations.length === 0,
    details: violations
  };
}

// 3. Verify Anki Model ID and Card Template stability
function checkAnkiModelStability(): CheckResult {
  const genAnkiPath = path.join(ROOT_DIR, 'scripts', 'generate-anki.ts');
  const violations: string[] = [];

  if (!fs.existsSync(genAnkiPath)) {
    return {
      name: 'Anki Model Stability',
      passed: false,
      details: ['scripts/generate-anki.ts not found']
    };
  }

  const content = fs.readFileSync(genAnkiPath, 'utf8');

  // Verify MODEL_ID = 1607392319
  if (!content.includes('1607392319')) {
    violations.push('MODEL_ID has been altered from 1607392319');
  }

  // Verify Card 1 & Card 2 names
  if (!content.includes('Card 1: Recognition')) {
    violations.push('Missing card template "Card 1: Recognition"');
  }
  if (!content.includes('Card 2: Production')) {
    violations.push('Missing card template "Card 2: Production"');
  }

  return {
    name: 'Anki Model ID & Template Stability',
    passed: violations.length === 0,
    details: violations
  };
}

// 4. Verify Content Security Policy hardening in index.html
function checkCspHardening(): CheckResult {
  const indexHtmlPath = path.join(ROOT_DIR, 'index.html');
  const violations: string[] = [];

  if (!fs.existsSync(indexHtmlPath)) {
    return {
      name: 'CSP Hardening in index.html',
      passed: false,
      details: ['index.html not found']
    };
  }

  const content = fs.readFileSync(indexHtmlPath, 'utf8');

  if (!content.includes("base-uri 'self'")) {
    violations.push('Missing "base-uri \'self\'" directive in CSP');
  }
  if (!content.includes("object-src 'none'")) {
    violations.push('Missing "object-src \'none\'" directive in CSP');
  }
  if (!content.includes("form-action 'self'")) {
    violations.push('Missing "form-action \'self\'" directive in CSP');
  }
  if (content.includes("img-src 'self' data: https:;")) {
    violations.push('Wildcard "https:" found in img-src; should be restricted to \'self\' data:');
  }

  return {
    name: 'Content Security Policy Directives',
    passed: violations.length === 0,
    details: violations
  };
}

// Run All Checks
console.log('\n🛡️  Starting Automated Health & Security Guard...\n');

results.push(checkVHtmlSanitization());
results.push(checkDirectLocalStorageUsage());
results.push(checkAnkiModelStability());
results.push(checkCspHardening());

let hasFailures = false;

for (const res of results) {
  if (res.passed) {
    console.log(`  ✅ [PASS] ${res.name}`);
  } else {
    hasFailures = true;
    console.error(`  ❌ [FAIL] ${res.name}`);
    if (res.details && res.details.length) {
      res.details.forEach((d) => console.error(`      - ${d}`));
    }
  }
}

console.log('');

if (hasFailures) {
  console.error('🚫 Health & Security Guard found issues. Please fix them before committing.\n');
  process.exit(1);
} else {
  console.log('🎉 All health and security checks passed successfully!\n');
  process.exit(0);
}
