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

## How to Import into Anki

1. **Recommended File**: Use `Anki_B2_Clean.txt` (or another `Clean` variant) for the most efficient experience.
2. **Setup**: Ensure your Anki Note Type has at least **4 fields** (e.g., *German, English, Ukrainian, Example*).
3. **Import**: Select `File` -> `Import` in Anki and choose your desired `.txt` file.
4. **Field Mapping**: Anki will automatically detect the `;` separator and map the columns thanks to the embedded headers.
5. **Card Template**: For the best results, add `{{Ukrainian}}` and `{{Example}}` to your card templates.

### Speech-to-Text (Audio)
To enable live audio during your reviews without downloading large files, add the following to your Anki card template:
```html
{{tts de_DE:German}}
```
