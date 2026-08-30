# Anki Deck Generation Invariants & Architecture

Applies to `scripts/generate-anki.ts`, `scripts/generate-all-anki.ts`, `scripts/deck-worker.ts`, and `scripts/utils.ts`.

## Deck Identifiers & Models
- **Note Model ID**: `1607392319` (German B2 Professional Bi-Directional).
- **Deck IDs**:
  - `Anki_B1plus.apkg`: `1607392320`
  - `Anki_B2.apkg`: `1607392321`
  - `Anki_B1plus_B2.apkg`: `1607392322`
- **Model Fields** (strict 8-field order):
  1. `German` (HTML with colored gender span)
  2. `German_Audio` (clean plain German for TTS)
  3. `English` (full text)
  4. `English_Audio` (clean English without slashes for TTS)
  5. `Ukrainian` (full text)
  6. `Example` (HTML with `<b style="color: #eab308;">` highlight)
  7. `Example_Audio` (clean plain text for TTS)
  8. `Tags` (e.g. `B1plus Thema1`)

## TTS Cleaning Invariants
- `cleanGermanForAudio(text)`:
  - Strips parenthetical forms: `(schläft, schlief, hat geschlafen)`.
  - Removes pipe symbols: `auf|fallen` -> `auffallen`.
  - Cleans grammar prefixes: `etw./jdn. abfertigen` -> `abfertigen`, `sich etw. merken` -> `sich merken`.
  - Resolves `der/die` compound articles: `der/die Vorgesetzte` -> `der Vorgesetzte`.
- `cleanEnglishForAudio(text)`:
  - Takes primary translation before slash or comma for natural speech.
- `cleanExampleForAudio(text)`:
  - Strips HTML tags, asterisks, and normalizes ellipses.

## Card Identification & Storage
- **Note Custom ID**: `deckId * 1000000 + currentNoteIndex` (Safe integer under `MAX_SAFE_INTEGER`).
- **GUID**: `(BigInt(deckId) * 1000000n + BigInt(currentNoteIndex)).toString()`.
- **Deduplication**: `seen.has(wordDisplay)` ensures unique cards per deck.
