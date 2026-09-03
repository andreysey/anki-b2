import { describe, it, expect, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { generateAnkiDeck } from './generate-anki.js';

describe('generateAnkiDeck', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('generates a valid .apkg package and correctly dedupes and tags cards', async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anki-test-'));

    // Create mock source txt files
    const sourceFile1 = path.join(tempDir, 'B2_Thema1.txt');
    const content1 = [
      '# Comment line',
      'etw. anfordern (fordert an, forderte an, hat angefordert);to request;вимагати;Wir möchten das Angebot **anfordern**.',
      'das Haus, "-er;house;будинок;Das ist ein großes **Haus**.'
    ].join('\n');
    fs.writeFileSync(sourceFile1, content1, 'utf8');

    const sourceFile2 = path.join(tempDir, 'B1_plus_Thema2.txt');
    const content2 = [
      // Duplicate word in different level
      'etw. anfordern (fordert an, forderte an, hat angefordert);to request;вимагати;Wir möchten das Angebot **anfordern**.',
      'der Tisch, -e;table;стіл;Der **Tisch** ist neu.'
    ].join('\n');
    fs.writeFileSync(sourceFile2, content2, 'utf8');

    const result = await generateAnkiDeck(
      [sourceFile1, sourceFile2],
      'B1plus_B2',
      tempDir
    );

    // 1. Check statistics
    expect(result.totalEntries).toBe(4);
    expect(result.uniqueCards).toBe(3); // 'an|rufen' should be deduplicated
    expect(result.warnings.length).toBe(0);

    // 2. Check generated file existence
    const expectedApkg = path.join(tempDir, 'Anki_B1plus_B2.apkg');
    expect(fs.existsSync(expectedApkg)).toBe(true);
    const stats = fs.statSync(expectedApkg);
    expect(stats.size).toBeGreaterThan(1000);

    // 3. Verify web data structure and merged levels
    expect(result.webData.length).toBe(3);
    const anfordernEntry = result.webData.find((w) => w.german.includes('anfordern'));
    expect(anfordernEntry).toBeDefined();
    expect(anfordernEntry?.levels).toContain('B2');
    expect(anfordernEntry?.levels).toContain('B1+');
    expect(anfordernEntry?.ukrainian).toBe('вимагати');
  });

  it('collects warnings when examples or translations are missing', async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anki-test-'));

    const sourceFile = path.join(tempDir, 'B2_Thema3.txt');
    const content = [
      'das Auto, -s;car;;Das Auto ist rot.', // missing ukrainian
      'das Buch, "-er;;книга;Das Buch ist gut.', // missing english
      'die Lampe, -n;lamp;лампа;' // missing example
    ].join('\n');
    fs.writeFileSync(sourceFile, content, 'utf8');

    const result = await generateAnkiDeck([sourceFile], 'B2', tempDir);

    expect(result.warnings.length).toBe(3);
    expect(result.warnings.some((w) => w.includes('Missing Ukrainian translation'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('Missing English translation'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('Missing example sentence'))).toBe(true);
  });
});
