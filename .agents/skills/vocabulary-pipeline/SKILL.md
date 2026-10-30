---
name: vocabulary-pipeline
description: Workflow for adding, editing, linting, and regenerating German B1+/B2 vocabulary decks and web data. Use when modifying source/*.txt, fixing vocabulary errors, or rebuilding Anki .apkg packages.
---

# Vocabulary Pipeline & Quality Runbook

This skill outlines the step-by-step workflow for maintaining the German B1+/B2 vocabulary database and regenerating distribution packages.

## 1. Modifying Source Vocabulary
Source files are located in `source/*.txt`:
- `B1_plus_Thema*.txt` (B1+ topics)
- `B2_Thema*.txt` (B2 topics)
- `B2_Redemittel.txt`, `B2_Nomen_Verb_Verbindungen.txt`, `B2_Adjektive_Praepositionen.txt`, `B2_Verben_Praepositionen.txt`, `B2_Verben.txt`

### Entry Format:
```text
German;English;Ukrainian;Example
```

### Key Formatting Requirements:
- Nouns: must include article `der`/`die`/`das` (check compound noun endings like `-urlaub` $\rightarrow$ `der`, `-verfahren` $\rightarrow$ `das`, `-vereinbarung` $\rightarrow$ `die`).
- Separable verbs: `|` before the prefix (e.g. `ein|stellen`) is optional; the generator detects common prefixes itself.
- Example sentences: must contain the target German term (any conjugated form). Existing `**` marks are stripped by the generator; don't add new ones.
- After regenerating, review highlight changes with `npm run diff:data`.

## 2. Validation & Linting
Run the vocabulary linter to check for missing columns, missing examples, or broken formatting:
```bash
npm run lint:data
```

## 3. Automated Tests & Type Checking
Run the full test suite and TypeScript verification:
```bash
npm run test:all
```

## 4. Deck & Web Data Generation
Rebuild all Anki packages (`.apkg`) and web data (`public/data.json` and `dist/data.json`):
```bash
npm run generate:anki
```

## 5. Web App Build Verification
Ensure the Vue 3 web application compiles without errors:
```bash
npm run build
```

## 6. Improving Example Highlighting

The generator highlights the learned word in each example (`highlightWordInExample` in
`scripts/utils.ts`). Cards it cannot highlight show up as warnings in `npm run generate:anki`
("could not be matched/highlighted"). Work through them like this:

1. **Group the warnings by cause** before writing code (separable verb split in the sentence,
   irregular form, ge-participle, phrase alternatives, wording that simply differs).
2. **Know the pipeline order** — first match wins:
   card's own forms in parentheses → stems of the card's words → verb forms from the lexicon
   (`scripts/verb-lexicon.ts`, built from every `verb (3sg, prät, hat P2)` entry in `source/`)
   → `" / "` phrase alternatives. Then the separated particle is added at the clause end
   (`steht … zu`).
   Single-verb cards (`sich einsetzen für`) try verb forms first so a preposition or a noun
   sharing the stem doesn't win; multi-word cards (`eine Absprache treffen`, `treu bleiben`)
   keep the noun/phrase first.
3. **Add new logic late in the chain** so already-correct cards stay unchanged.
4. **Review every changed card**: `npm run generate:anki && npm run diff:data`. A wrong highlight
   is worse than none. Known traps:
   - prepositions ending in `-en` (`gegen`, `wegen`) look like infinitives;
   - short forms (`kam`) must not match inside other words (`Kamera`) — forms only allow verb
     endings after them;
   - entries with two verbs (`ausreden lassen`, `sich leisten können`).
5. **Add a test per case** in `scripts/utils.test.ts` or `scripts/verb-lexicon.test.ts`.
6. Cards that only need different wording (e.g. a Redemittel template whose example uses other
   words) are fixed in `source/*.txt`, not in code.
