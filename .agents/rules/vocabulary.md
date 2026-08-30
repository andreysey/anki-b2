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
   - Use a pipe (`|`) to separate verb prefixes for automatic highlighting: `auf|fallen`, `ein|stellen`, `teil|nehmen`.
   - Slashes or pipes must not interfere with TTS (TTS strips `|` automatically).
3. **Grammatical Placeholders**:
   - Standard abbreviations: `etw.` (etwas), `jdn.` (jemanden), `jdm.` (jemandem), `jds.` (jemandes).
   - Slash alternatives: `etw./jdn. abfertigen`, `jdm. etw. raten`.
   - Reflexive verbs: `sich etw. merken`, `sich freuen auf (+ Akk.)`.

## Example Sentence Formatting (`Example`)
1. **Word Presence**: The example sentence MUST contain the German word or one of its conjugated/declined forms.
2. **Clean HTML**: Use standard HTML `<b>` or allow the generator's `highlightWordInExample` to dynamically apply `<b style="color: #eab308;">`.
3. **No Raw Markdown Asterisks**: Avoid leaving unrendered `**` in examples.
4. **Natural Context**: Examples should reflect professional, business, and daily German (B1+/B2 level).

## English & Ukrainian Columns
- Provide accurate, concise translations suitable for flashcard recall.
- In English, separate multiple common meanings with commas or slashes (e.g., `to agree on / coordinate`).
