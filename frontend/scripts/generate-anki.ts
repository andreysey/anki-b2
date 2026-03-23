/**
 * generate-anki.ts — Port of Rust src/builder.rs::generate_decks()
 *
 * Reads source .txt files directly (not data.json) and generates .apkg files.
 * Called from generate-all-anki.ts.
 */

import { Package, Deck, Note, Model } from 'genankjs';
import fs from 'fs';
import path from 'path';
import {
  cleanGermanForAudio,
  colorizeGender,
  highlightWordInExample,
  getThemaNum,
  getLevelFromFilename,
} from './utils.js';

// MODEL_ID matches Rust exactly
const MODEL_ID = 1607392319;

const model = new Model({
  modelId: MODEL_ID,
  name: 'German B2 Professional (Bi-Directional)',
  fields: [
    { name: 'German' },
    { name: 'German_Audio' },
    { name: 'English' },
    { name: 'English_Audio' },
    { name: 'Ukrainian' },
    { name: 'Example' },
    { name: 'Example_Audio' },
    { name: 'Tags' },
  ],
  templates: [
    {
      name: 'Card 1: Recognition',
      qfmt: `<div style='font-family: "Outfit", sans-serif; text-align: center; color: #f8fafc; background-color: #0f172a; padding: 40px; border-radius: 20px;'>
              <div style='font-size: 32px; font-weight: 600;'>{{German}}</div>
              <div style='display: none;'>{{tts de_DE:German_Audio}}</div>
             </div>`,
      afmt: `{{FrontSide}}<hr id='answer'>
             <div style='font-family: "Outfit", sans-serif; text-align: center; color: #f8fafc; background-color: #1e293b; padding: 40px; border-radius: 20px;'>
              <div style='font-size: 24px; color: #00d2ff; margin-bottom: 15px;'>{{English}}</div>
              <div style='display: none;'>{{tts en_US:English_Audio}}</div>
              <div style='font-size: 24px; color: #22c55e; margin-bottom: 25px;'>{{Ukrainian}}</div>
              <div style='font-style: italic; color: #cbd5e1; font-size: 18px; border-top: 1px solid #334155; padding-top: 20px;'>{{Example}}</div>
              <div style='margin-top: 25px;'>
                  <div style='display: inline-block; margin: 0 10px;'>{{tts de_DE:Example_Audio}}</div>
              </div>
             </div>`,
    },
    {
      name: 'Card 2: Production',
      qfmt: `<div style='font-family: "Outfit", sans-serif; text-align: center; color: #f8fafc; background-color: #0f172a; padding: 40px; border-radius: 20px;'>
              <div style='font-size: 24px; color: #00d2ff; margin-bottom: 10px;'>{{English}}</div>
              <div style='font-size: 24px; color: #22c55e;'>{{Ukrainian}}</div>
              <div style='display: none;'>{{tts en_US:English_Audio}}</div>
             </div>`,
      afmt: `{{FrontSide}}<hr id='answer'>
             <div style='font-family: "Outfit", sans-serif; text-align: center; color: #f8fafc; background-color: #1e293b; padding: 40px; border-radius: 20px;'>
              <div style='font-size: 32px; font-weight: 600; color: #f8fafc; margin-bottom: 20px;'>{{German}}</div>
              <div style='display: none;'>{{tts de_DE:German_Audio}}</div>
              <div style='font-style: italic; color: #cbd5e1; font-size: 18px; border-top: 1px solid #334155; padding-top: 20px;'>{{Example}}</div>
              <div style='margin-top: 25px;'>
                  <div style='display: inline-block; margin: 0 10px;'>{{tts de_DE:German_Audio}}</div>
                  <div style='display: inline-block; margin: 0 10px;'>{{tts de_DE:Example_Audio}}</div>
              </div>
             </div>`,
    },
  ],
  css: `.card { font-family: 'Outfit', sans-serif; background-color: #0f172a; }`,
});

// Unique sequential note IDs (avoids UNIQUE constraint in SQLite)
let globalNoteId = Date.now();
const originalToSqlValues = Note.prototype.toSqlValues;
Note.prototype.toSqlValues = function () {
  const values = originalToSqlValues.call(this);
  values.id = globalNoteId++;
  return values;
};

export interface EntryData {
  level: string;
  levels: string[];
  thema: number;
  german: string;
  german_audio: string;
  english: string;
  ukrainian: string;
  example: string;
}

export interface GenerateResult {
  totalEntries: number;
  uniqueCards: number;
  webData: EntryData[];
  warnings: string[];
}

/**
 * Port of Rust builder.rs::generate_decks() for Anki output.
 *
 * @param files     Absolute paths to source .txt files
 * @param baseName  "B1plus" | "B2" | "B1plus_B2"
 * @param outputDir Absolute path to output directory for .apkg
 */
export async function generateAnkiDeck(
  files: string[],
  baseName: string,
  outputDir: string,
): Promise<GenerateResult> {
  const deckId =
    baseName === 'B1plus' ? 1607392320 :
    baseName === 'B2'     ? 1607392321 :
                            1607392322;

  const deckName = `German ${baseName.replace('plus', '+')}`;
  const deck = new Deck({ deckId, name: deckName });

  const seen = new Map<string, boolean>();
  // For web_data: preserve insertion order, track extra levels
  const webDataMap = new Map<string, EntryData>();
  const webDataOrder: string[] = [];
  const warnings: string[] = [];
  let totalEntries = 0;
  let noteIndex = 0;

  for (const filePath of files) {
    const fname = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const level = getLevelFromFilename(fname);
    const thema = getThemaNum(fname);
    const entryTag = `${level} Thema${thema}`.replace('+', 'plus');

    for (const [lineIdx, rawLine] of content.split('\n').entries()) {
      const line = rawLine.trim();

      // Skip header comments and empty lines (same as Rust)
      if (!line || line.startsWith('#')) continue;

      const parts = line.split(';').map((s) => s.trim());
      if (parts.length < 3) {
        warnings.push(`${fname}:${lineIdx + 1}: Less than 3 columns`);
        continue;
      }

      const wordDisplay = parts[0];
      const english    = parts[1];
      const ukrainian  = parts[2];
      const exampleRaw = parts[3] ?? '';

      const wordAudio     = cleanGermanForAudio(wordDisplay);   // German_Audio
      const germanColored = colorizeGender(wordDisplay);        // German (with <span>)
      const exampleHtml   = highlightWordInExample(wordAudio, exampleRaw); // Example

      totalEntries++;

      const note = new Note({
        guid: (BigInt(deckId) * 10000n + BigInt(noteIndex++)).toString(),
        modelId: MODEL_ID,
        fields: [
          germanColored,  // German
          wordAudio,      // German_Audio (clean, for TTS)
          english,        // English
          english,        // English_Audio
          ukrainian,      // Ukrainian
          exampleHtml,    // Example (with <b> highlight)
          exampleRaw,     // Example_Audio (plain text, for TTS)
          entryTag,       // Tags
        ],
        tags: [level, `Thema${thema}`],
      });

      if (!seen.has(wordDisplay)) {
        deck.addNote(note);
        seen.set(wordDisplay, true);

        if (baseName === 'B1plus_B2') {
          webDataMap.set(wordDisplay, {
            level,
            levels: [level],
            thema,
            german: germanColored,
            german_audio: wordAudio,
            english,
            ukrainian,
            example: exampleHtml,
          });
          webDataOrder.push(wordDisplay);
        }
      } else if (baseName === 'B1plus_B2') {
        // Word already seen in another level — append current level to levels[]
        const existing = webDataMap.get(wordDisplay)!;
        if (!existing.levels.includes(level)) {
          existing.levels.push(level);
        }
      }
    }
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const apkgName = `Anki_${baseName}.apkg`;
  const pkg = new Package();
  pkg.addDeck(deck);
  await pkg.writeToFile(path.join(outputDir, apkgName));

  const uniqueCards = seen.size;
  const webData = webDataOrder.map((k) => webDataMap.get(k)!);

  return { totalEntries, uniqueCards, webData, warnings };
}
