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
- Separable verbs: mark prefix with `|` (e.g. `ein|stellen`).
- Example sentences: must contain the target German term and no raw `**` asterisks.

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
