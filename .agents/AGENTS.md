# Project Rules & Guidelines

## TypeScript & Type Safety
- **Strict Typing in Mocks & Tests**: Never omit required properties when mocking typed objects or state (e.g., returning API responses like `AIServiceResponse`). Always ensure test mocks satisfy full TypeScript interface definitions.
- **Explicit Generic Type Parameters**: Avoid un-parameterized instantiations like `new Set()` or `new Map()` when empty, which cause `Set<unknown>` or `Set<never>` type errors. Always specify explicit type parameters (e.g., `new Set<string>()`).
- **Type Check Verification**: Run type checking (`npm run build` or `npx vue-tsc --noEmit`) to catch strict type errors before finalizing changes.

## Verification & Build Standards
- **Automated Verification**: When modifying vocabulary, generator scripts, or app components, always verify:
  1. Unit tests & typecheck: `npm run test:all`
  2. Deck generation: `npm run generate:anki`
  3. Production build: `npm run build`
- **Data Integrity**: Source vocabulary files in `source/*.txt` are the single source of truth for Anki decks and `public/data.json`. Never edit `public/data.json` directly.

## Anki Schema & Template Safety (Preserving Learning Progress)
- **Backup Reminder**: Always advise backing up Anki collection (`File -> Export -> Anki Collection Package (.colpkg)` with scheduling information) before making structural changes to note types or templates.
- **Model Stability**: Never alter `MODEL_ID` (`1607392319`) or the Note Model name (`German B2 Professional (Bi-Directional)`), otherwise Anki treats the deck as a brand new note type and won't update existing notes.
- **Card Template Names**: Keep card template names stable (`Card 1: Recognition`, `Card 2: Production`). Renaming card types causes Anki to create additional duplicate card types (e.g. 20,000+ cards instead of 7,266).
- **Field Additions**:
  - Always append new fields at the end of the schema (before `Tags`), never reorder or remove existing fields.
  - Inform users that when importing a `.apkg` with new fields, Anki Desktop requires **"Merge note types"** enabled in the import dialog, or the note type in Anki must be updated first so fields align properly.


