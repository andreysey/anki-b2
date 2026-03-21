# Anki German Vocabulary (B1+ & B2)

This repository contains professional thematic vocabulary files for Anki, covering Goethe-Zertifikat B1+ and B2 levels. Each entry includes German terms, English and Ukrainian translations, and German example sentences.

## Project Structure

- `B1_plus_Thema*.txt`: Source vocabulary files for B1+ level.
- `B2_Thema*.txt`: Source vocabulary files for B2 level.
- `Anki_*_Full.txt`: Consolidated decks containing all entries (including duplicates across themes for more context).
- `Anki_*_Clean.txt`: Deduplicated decks containing only unique German words for efficient studying.
- `tools/`: Automation scripts for maintaining the repository.

## Automation Tools

We provide Python scripts in the `tools/` directory to automate common maintenance tasks:

### 1. `standardize.py`
This tool parses all source `Thema` files and ensures they strictly adhere to the expected Anki format.
- **What it does**: 
  - Validates the 4-column structure (`German;English;Ukrainian;Example`).
  - Automatically injects required Anki import headers (separator, HTML enable).
  - Normalizes whitespace and line endings.
- **Usage**: Run `python3 tools/standardize.py` from the root directory.

### 2. `build_decks.py`
This is the master orchestration script used to generate the final importable Anki decks.
- **What it does**:
  - Scans the repository for all source `Thema` files.
  - Generates consolidated "Full" decks for B1+, B2, and a combined version.
  - Generates "Clean" (deduplicated) versions for each level.
  - Ensures correct sorting (Thema 1 -> Thema 12).
- **Usage**: Run `python3 tools/build_decks.py` from the root directory.

## How to Import into Quizlet.com

1. **Select File**: Use any of the files starting with `Quizlet_*.txt`. These are optimized for Quizlet with a `Term [Tab] Definition` format.
2. **Create Set**: On Quizlet, click **"Create"** -> **"Study set"**.
3. **Import**: Click **"+ Import from Word, Excel, Google Docs, etc."**.
4. **Paste/Upload**: Copy the content of your chosen `Quizlet_*.txt` file and paste it into the box.
5. **Settings**: Ensure **"Between term and definition"** is set to **Tab** and **"Between cards"** is set to **New line**.
6. **Finalize**: Click **"Import"** and create your set!
