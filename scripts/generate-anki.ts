/**
 * generate-anki.ts — Anki Deck and Package Generator
 *
 * Reads source .txt files directly (not data.json) and generates .apkg files.
 * Called from generate-all-anki.ts.
 */

import { Package, Deck, Note, Model } from 'genankjs';
import fs from 'node:fs';
import path from 'node:path';
import {
  cleanGermanForAudio,
  cleanEnglishForAudio,
  cleanExampleForAudio,
  colorizeGender,
  highlightWordInExample,
  getThemaNum,
  getThemaTag,
  getLevelFromFilename
} from './utils.js';
import { buildVerbTenses, formatTensesHtml } from './verb-grammar.js';

// ── Stable Note Model Configuration ──────────────────────────────────────────
// CRITICAL SAFETY NOTICE:
// 1. Never change MODEL_ID or Model name: Anki relies on them to update existing notes.
//    Changing them will create a second note type and prevent merging with user progress.
// 2. Never rename Card templates: Renaming 'Card 1: Recognition' / 'Card 2: Production'
//    causes Anki to generate duplicate cards (e.g. 20k+ cards instead of 7,266).
// 3. Adding fields: Always append new fields before 'Tags'. Never reorder existing fields.
// ─────────────────────────────────────────────────────────────────────────────
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
    { name: 'Grammar_Tenses' },
    { name: 'Tags' }
  ],
  templates: [
    {
      name: 'Card 1: Recognition',
      qfmt: `<div class="card-container front-side">
              <div class="card-title clickable-audio">{{German}}<span class="audio-trigger">{{tts de_DE:German_Audio}}</span></div>
             </div>`,
      afmt: `{{FrontSide}}<hr id="answer">
             <div class="card-container back-side">
              <div class="card-subtitle-english m-15">{{English}}</div>
              <div style="display: none;">{{tts en_US:English_Audio}}</div>
              <div class="card-subtitle-ukrainian m-25">{{Ukrainian}}</div>
              <div class="card-example clickable-audio">{{Example}}<span class="audio-trigger">{{tts de_DE:Example_Audio}}</span></div>
              {{#Grammar_Tenses}}
              {{Grammar_Tenses}}
              {{/Grammar_Tenses}}
             </div>`
    },
    {
      name: 'Card 2: Production',
      qfmt: `<div class="card-container front-side">
              <div class="card-subtitle-english m-10">{{English}}</div>
              <div class="card-subtitle-ukrainian">{{Ukrainian}}</div>
              <div style="display: none;">{{tts en_US:English_Audio}}</div>
             </div>`,
      afmt: `{{FrontSide}}<hr id="answer">
             <div class="card-container back-side">
              <div class="card-title clickable-audio m-20">{{German}}<span class="audio-trigger">{{tts de_DE:German_Audio}}</span></div>
              <div class="card-example clickable-audio">{{Example}}<span class="audio-trigger">{{tts de_DE:Example_Audio}}</span></div>
              {{#Grammar_Tenses}}
              {{Grammar_Tenses}}
              {{/Grammar_Tenses}}
             </div>`
    }
  ],
  css: `
    .card {
      font-family: "Outfit", sans-serif;
      background-color: #0f172a;
    }
    .card-container {
      text-align: center;
      color: #f8fafc;
      padding: 24px;
      border-radius: 20px;
    }
    .front-side {
      background-color: #0f172a;
    }
    .back-side {
      background-color: #1e293b;
    }
    .card-title {
      font-size: 32px;
      font-weight: 600;
      position: relative;
    }
    .card-subtitle-english {
      font-size: 24px;
      color: #00d2ff;
    }
    .card-subtitle-ukrainian {
      font-size: 24px;
      color: #22c55e;
    }
    .card-example {
      font-style: italic;
      color: #cbd5e1;
      font-size: 18px;
      border-top: 1px solid #334155;
      padding-top: 20px;
      position: relative;
    }
    .clickable-audio {
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    .clickable-audio:hover {
      opacity: 0.92;
    }
    .clickable-audio:active {
      transform: scale(0.99);
    }
    .audio-trigger {
      display: inline-block;
      vertical-align: middle;
      margin-left: 8px;
    }
    .audio-trigger .replay-button,
    .audio-trigger a.replay-button,
    .audio-trigger svg {
      opacity: 0.35;
      transition: opacity 0.2s ease, transform 0.2s ease;
      width: 22px;
      height: 22px;
      vertical-align: middle;
    }
    .clickable-audio:hover .audio-trigger .replay-button,
    .clickable-audio:hover .audio-trigger a.replay-button,
    .clickable-audio:hover .audio-trigger svg {
      opacity: 0.85;
      transform: scale(1.1);
    }
    .m-10 {
      margin-bottom: 10px;
    }
    .m-15 {
      margin-bottom: 15px;
    }
    .m-20 {
      margin-bottom: 20px;
    }
    .m-25 {
      margin-bottom: 25px;
    }
    /* ── B2 Zeitformen & Grammatik Accordion ── */
    .tense-spoiler {
      margin-top: 18px;
      border-top: 1px dashed #334155;
      padding-top: 12px;
      text-align: left;
    }
    .tense-summary {
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
      outline: none;
      user-select: none;
      transition: color 0.2s ease, background 0.2s ease;
      display: inline-block;
      padding: 5px 10px;
      border-radius: 8px;
      background: rgba(51, 65, 85, 0.4);
    }
    .tense-summary:hover {
      color: #38bdf8;
      background: rgba(51, 65, 85, 0.7);
    }
    .tense-grid {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 7px;
    }
    .tense-row {
      display: grid;
      grid-template-columns: 88px 1fr;
      align-items: center;
      gap: 10px;
      line-height: 1.35;
      padding: 3px 0;
      border-bottom: 1px solid rgba(51, 65, 85, 0.2);
    }
    .tense-text {
      color: #e2e8f0;
      font-size: 13px;
      word-break: normal;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      padding: 3px 4px;
      border-radius: 4px;
      width: 88px;
      text-align: center;
      flex-shrink: 0;
      box-sizing: border-box;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .badge.praes { background: #0284c7; color: #fff; }
    .badge.praet { background: #2563eb; color: #fff; }
    .badge.perf { background: #059669; color: #fff; }
    .badge.plusq { background: #0d9488; color: #fff; }
    .badge.fut1 { background: #d97706; color: #fff; }
    .badge.fut2 { background: #ea580c; color: #fff; }
    .badge.pass { background: #dc2626; color: #fff; }
    .badge.pass-alt { background: #b91c1c; color: #fff; }
    .badge.konj1 { background: #7c3aed; color: #fff; }
    .badge.konj2 { background: #db2777; color: #fff; }
  `
});

// Thread-safe / Concurrency-safe Note subclass with instance-scoped ID
class SequentialNote extends Note {
  private customId: number;

  constructor(options: ConstructorParameters<typeof Note>[0] & { customId: number }) {
    super(options);
    this.customId = options.customId;
  }

  override toSqlValues() {
    const values = super.toSqlValues();
    values.id = this.customId;
    return values;
  }
}

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
 * Generates Anki deck (.apkg) from raw source vocabulary files.
 *
 * @param files     Absolute paths to source .txt files
 * @param baseName  "B1plus" | "B2" | "B1plus_B2"
 * @param outputDir Absolute path to output directory for .apkg
 */
export async function generateAnkiDeck(
  files: string[],
  baseName: string,
  outputDir: string
): Promise<GenerateResult> {
  const deckId = baseName === 'B1plus' ? 1607392320 : baseName === 'B2' ? 1607392321 : 1607392322;

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
    const themaTag = getThemaTag(thema);
    const entryTag = `${level} ${themaTag}`.replace('+', 'plus');

    for (const [lineIdx, rawLine] of content.split('\n').entries()) {
      const line = rawLine.trim();

      // Skip header comments and empty lines
      if (!line || line.startsWith('#')) continue;

      const parts = line.split(';').map((s) => s.trim());
      if (parts.length < 3) {
        warnings.push(`${fname}:${lineIdx + 1}: Less than 3 columns`);
        continue;
      }

      const wordDisplay = parts[0];
      const english = parts[1];
      const ukrainian = parts[2];
      const exampleRaw = parts[3] ?? '';

      const wordAudio = cleanGermanForAudio(wordDisplay); // German_Audio
      const germanColored = colorizeGender(wordDisplay); // German (with <span>)
      const exampleHtml = highlightWordInExample(wordAudio, exampleRaw, wordDisplay); // Example
      const verbTenses = buildVerbTenses(wordDisplay, exampleRaw);
      const grammarTensesHtml = formatTensesHtml(verbTenses);

      // Check if translation is missing
      if (!english) {
        warnings.push(`${fname}:${lineIdx + 1}: Missing English translation for "${wordDisplay}"`);
      }
      if (!ukrainian) {
        warnings.push(
          `${fname}:${lineIdx + 1}: Missing Ukrainian translation for "${wordDisplay}"`
        );
      }

      // Check if the example is missing entirely, or if the main word wasn't highlighted in it
      if (!exampleRaw) {
        warnings.push(`${fname}:${lineIdx + 1}: Missing example sentence for "${wordDisplay}"`);
      } else if (exampleRaw && !exampleHtml.includes('</b>')) {
        warnings.push(
          `${fname}:${lineIdx + 1}: Word "${wordAudio}" could not be matched/highlighted inside the example: "${exampleRaw}"`
        );
      }

      totalEntries++;
      const currentNoteIndex = noteIndex++;

      const levelTag = level.replace('+', 'plus');

      const note = new SequentialNote({
        customId: deckId * 1000000 + currentNoteIndex,
        guid: (BigInt(deckId) * 1000000n + BigInt(currentNoteIndex)).toString(),
        modelId: MODEL_ID,
        fields: [
          germanColored, // German
          wordAudio, // German_Audio (clean, for TTS)
          english, // English
          cleanEnglishForAudio(english), // English_Audio (clean, without slash/alternative clutter for TTS)
          ukrainian, // Ukrainian
          exampleHtml, // Example (clean HTML with <b> highlight)
          cleanExampleForAudio(exampleRaw), // Example_Audio (clean plain text without asterisks/tags, for TTS)
          grammarTensesHtml, // Grammar_Tenses (B2 interactive details accordion)
          entryTag // Tags
        ],
        tags: [levelTag, themaTag]
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
            example: exampleHtml
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
  pkg.addModel(model);
  await pkg.writeToFile(path.join(outputDir, apkgName));

  const uniqueCards = seen.size;
  const webData = webDataOrder.map((k) => webDataMap.get(k)!);

  return { totalEntries, uniqueCards, webData, warnings };
}
