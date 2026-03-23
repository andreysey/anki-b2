import { Package, Deck, Note, Model, generateUniqueGuid } from 'genankjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Monkey-patch genankjs Note to ensure unique incremental IDs (fixes UNIQUE constraint failed: notes.id)
let globalNoteId = Date.now();
const originalToSqlValues = Note.prototype.toSqlValues;
Note.prototype.toSqlValues = function() {
  const values = originalToSqlValues.call(this);
  values.id = globalNoteId++;
  return values;
};

// Define the Model (Note Type) exactly as in Rust
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

// 64-bit deterministic numeric hash for GUIDs (safe for SQLite 64-bit signed INTEGER)
function hashString(str: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0xdeadbeef;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ char, 16777619);
    h2 = Math.imul(h2 ^ char, 0x5bd1e995);
  }
  // Combine two 32-bit hashes into a 64-bit equivalent numeric string
  // Ensure it's positive and fits within signed 64-bit (max ~9e18)
  const high = BigInt(Math.abs(h1));
  const low = BigInt(Math.abs(h2));
  return ((high << 32n) | low).toString().slice(0, 18); // 18 digits is safe
}

async function main() {
  const [,, levelArg, themaArg] = process.argv;
  
  if (!levelArg) {
    console.log('Usage: tsx generate-anki.ts <level> [thema]');
    process.exit(1);
  }

  const dataPath = path.resolve(__dirname, '../public/data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  let topicData;
  let deckName;
  let filename;

  if (levelArg === 'B1plus_B2') {
    topicData = data;
    deckName = 'German B1+/B2 Professional';
    filename = 'Anki_B1plus_B2.apkg';
  } else if (themaArg) {
    // Use levels[] array to catch cross-level words (same as Rust per-level seen map)
    topicData = data.filter((item: any) =>
      (item.levels ?? [item.level]).includes(levelArg) && item.thema === parseInt(themaArg)
    );
    deckName = `German ${levelArg} - Topic ${themaArg}`;
    filename = `Anki_${levelArg.replace('+', 'plus')}_Thema${themaArg}.apkg`;
  } else {
    // Use levels[] array to catch cross-level words (same as Rust per-level seen map)
    topicData = data.filter((item: any) =>
      (item.levels ?? [item.level]).includes(levelArg)
    );
    deckName = `German ${levelArg} Professional`;
    filename = `Anki_${levelArg.replace('+', 'plus')}.apkg`;
  }

  if (topicData.length === 0) {
    console.log(`No data found for ${levelArg} ${themaArg ? `Topic ${themaArg}` : ''}`);
    return;
  }

  // Use the same Deck IDs as in Rust
  let deckId;
  if (levelArg === 'B1+') deckId = 1607392320;
  else if (levelArg === 'B2') deckId = 1607392321;
  else deckId = 1607392322;

  const deck = new Deck({
    deckId: deckId + (themaArg ? parseInt(themaArg) : 0),
    name: deckName
  });

  // Deduplicate by clean word (german_audio) — same as Rust's word_display key
  const seenItems = new Set<string>();
  let noteIndex = 0;

  for (const item of topicData) {
    const itemKey = item.german_audio || item.german;
    if (seenItems.has(itemKey)) continue;
    seenItems.add(itemKey);

    const entryTag = `${item.level} Thema${item.thema}`.replace('+', 'plus');
    
    // Use a guaranteed unique numeric GUID based on deckId and index
    const guid = (BigInt(deckId) * 10000n + BigInt(noteIndex++)).toString();

    // Strip HTML tags from example for plain-text TTS (Example_Audio field)
    const examplePlainText = (item.example || '').replace(/<[^>]*>/g, '');

    const note = new Note({
      guid: guid,
      modelId: MODEL_ID,
      fields: [
        item.german,                        // German (with <span> color)
        item.german_audio || item.german,   // German_Audio (clean text for TTS)
        item.english,                       // English
        item.english,                       // English_Audio
        item.ukrainian,                     // Ukrainian
        item.example || '',                 // Example (with <b> highlight)
        examplePlainText,                   // Example_Audio (plain text for TTS)
        entryTag                            // Tags
      ],
      tags: [item.level, `Thema${item.thema}`]
    });

    deck.addNote(note);
  }

  const pkg = new Package();
  pkg.addDeck(deck);
  
  const outputDir = path.resolve(__dirname, '../../docs/anki');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const buffer = await pkg.writeToFile(path.join(outputDir, filename));
  
  console.log(`✅ Generated: docs/anki/${filename} (${topicData.length * 2} cards)`);
}

main().catch(console.error);
