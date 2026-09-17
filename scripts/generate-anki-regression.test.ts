import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

describe('Anki Generation & Data Golden Regression', () => {
  it('preserves Anki MODEL_ID and Card Templates in generate-anki.ts', () => {
    const scriptPath = path.join(ROOT_DIR, 'scripts', 'generate-anki.ts');
    const content = fs.readFileSync(scriptPath, 'utf8');

    // 1. Model ID must be strictly 1607392319
    expect(content).toContain('1607392319');

    // 2. Note Model Name
    expect(content).toContain('German B2 Professional (Bi-Directional)');

    // 3. Card Template Names
    expect(content).toContain('Card 1: Recognition');
    expect(content).toContain('Card 2: Production');

    // 4. Expected Fields in schema (ordering & naming must be preserved)
    const expectedFields = [
      'German',
      'German_Audio',
      'English',
      'English_Audio',
      'Ukrainian',
      'Example',
      'Example_Audio',
      'Grammar_Tenses',
      'Tags'
    ];
    for (const field of expectedFields) {
      expect(content).toContain(`name: '${field}'`);
    }
  });

  it('validates production public/data.json entry count and schema integrity', () => {
    const dataJsonPath = path.join(ROOT_DIR, 'public', 'data.json');
    expect(fs.existsSync(dataJsonPath)).toBe(true);

    const raw = fs.readFileSync(dataJsonPath, 'utf8');
    const data = JSON.parse(raw);

    expect(Array.isArray(data)).toBe(true);
    // Baseline is 3633 entries
    expect(data.length).toBeGreaterThanOrEqual(3600);

    const ids = new Set<string>();
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      expect(typeof item.german).toBe('string');
      expect(item.german.length).toBeGreaterThan(0);
      expect(typeof item.english).toBe('string');
      expect(item.english.length).toBeGreaterThan(0);
      expect(typeof item.ukrainian).toBe('string');
      expect(item.ukrainian.length).toBeGreaterThan(0);
      expect(typeof item.thema).toBe('number');
      expect(typeof item.level).toBe('string');

      // ID uniqueness
      if (item.id) {
        expect(ids.has(item.id)).toBe(false);
        ids.add(item.id);
      }

      // Ensure no raw markdown bold remains in production data
      if (item.example) {
        expect(item.example).not.toContain('**');
      }
    }
  });
});
