# German Vocabulary Formatting Rules

Applies to all files in `source/*.txt`.

## File Format & Structure
- **Encoding**: UTF-8 without BOM.
- **Header**: File must start with `#columns:German;English;Ukrainian;Example`.
- **Delimiter**: Semicolon (`;`). Exactly 4 columns per entry:
  `German;English;Ukrainian;Example`

## German Column Formatting (`German`)
1. **Noun Articles**:
   - All German nouns MUST include their grammatical article: `der`, `die`, or `das`.
   - In compound nouns, the article is determined by the last element (e.g. `der Resturlaub`, `das SEPA-Lastschriftmandat`, `das Scoring-Verfahren`, `die Betriebsvereinbarung`).
   - Plural forms: `die Betriebsferien (Pl.)`, `die Treuhänder, - / die Treuhänderin, -nen`.
2. **Separable Verbs**:
   - Optional: a pipe (`|`) marks the separable prefix explicitly (`auf|fallen`, `ein|stellen`).
     The generator also detects common prefixes on its own (`zustehen` → `steht … zu`), so `|` is
     only needed for unusual prefixes. TTS and display strip `|` automatically.
   - Principal forms in parentheses help highlighting of irregular verbs:
     `treffen (trifft, traf, hat getroffen)`; they are also reused for other cards with the same verb.
3. **Grammatical Placeholders**:
   - Standard abbreviations: `etw.` (etwas), `jdn.` (jemanden), `jdm.` (jemandem), `jds.` (jemandes).
   - Slash alternatives: `etw./jdn. abfertigen`, `jdm. etw. raten`.
   - Reflexive verbs: `sich etw. merken`, `sich freuen auf (+ Akk.)`.

## Example Sentence Formatting (`Example`)
1. **Word Presence**: The example sentence MUST contain the German word or one of its conjugated/declined forms.
2. **Clean HTML**: Use standard HTML `<b>` or allow the generator's `highlightWordInExample` to dynamically apply `<b style="color: #eab308;">`.
3. **Markdown Asterisks**: Many examples contain `**…**` around parts of the sentence. The
   generator strips them, so they are harmless and don't affect highlighting. Don't add new ones;
   no need to remove existing ones.
4. **Natural Context**: Examples should reflect professional, business, and daily German (B1+/B2 level).

## English & Ukrainian Columns
- Provide accurate, concise translations suitable for flashcard recall.
- In English, separate multiple common meanings with commas or slashes (e.g., `to agree on / coordinate`).
