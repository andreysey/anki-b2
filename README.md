# German Vocabulary (B1+/B2 Beruf)

🌐 **[Live Web App & Dashboard](https://andreysey.github.io/anki-b2/)**

Interactive German vocabulary training platform and native Anki packages aligned with the **telc Deutsch-Test für den Beruf B1+ & B2** exams.

---

## ✨ Features

- **3,600+ Thematic Cards**: Professional German vocabulary covering workplace scenarios, *Nomen-Verb-Verbindungen*, verbs/adjectives with prepositions, and *Redemittel*.
- **Native Anki Packages (`.apkg`)**: Bi-directional cards (Recognition & Production) with gender colorization, example highlighting, and built-in TTS audio.
- **Spaced Repetition (SRS)**: 5-stage Leitner SRS engine with keyboard shortcuts (`Space` flip, `1-4` grade).
- **AI Language Coach**: Integrated Gemini AI for instant grammatical breakdown and workplace dialogue examples.
- **Modern Web App**: Offline-ready PWA, dark/light themes, progress analytics, and JSON backup/restore.

---

## 📥 Download Anki Decks

Pre-built `.apkg` packages ready for import into Anki (Desktop, AnkiMobile, AnkiDroid):

- **[Anki_B1plus_B2.apkg](anki/Anki_B1plus_B2.apkg)** — Complete collection (B1+ & B2)
- **[Anki_B2.apkg](anki/Anki_B2.apkg)** — B2 Beruf only
- **[Anki_B1plus.apkg](anki/Anki_B1plus.apkg)** — B1+ Beruf only

---

## 🛠️ Quick Start

```bash
# Install dependencies
npm install

# Start local web app
npm run dev

# Run tests and type checks
npm run test:all

# Regenerate Anki decks & data.json from source/*.txt
npm run generate:anki

# Build for production
npm run build
```

---

---

_Source of truth: `source/*.txt` — Decks & web data are automatically built and deployed via GitHub Actions._

> **Disclaimer**: This is an independent open-source educational project. "telc" is a registered trademark of telc gGmbH. This project is not affiliated with, sponsored, or endorsed by telc gGmbH. All vocabulary is aligned with the official CEFR B1+/B2 occupational language frameworks.
