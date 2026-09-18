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
- **Test Environment Isolation (Vitest)**: Always preserve full test suite isolation (`isolate: true`). Never disable isolation (`isolate: false`) to prevent module-level singleton state leakage and mock contamination across tests.

## Anki Schema & Template Safety (Preserving Learning Progress)
- **Backup Reminder**: Always advise backing up Anki collection (`File -> Export -> Anki Collection Package (.colpkg)` with scheduling information) before making structural changes to note types or templates.
- **Model Stability**: Never alter `MODEL_ID` (`1607392319`) or the Note Model name (`German B2 Professional (Bi-Directional)`), otherwise Anki treats the deck as a brand new note type and won't update existing notes.
- **Card Template Names**: Keep card template names stable (`Card 1: Recognition`, `Card 2: Production`). Renaming card types causes Anki to create additional duplicate card types (e.g. 20,000+ cards instead of 7,266).
- **Field Additions**:
  - Always append new fields at the end of the schema (before `Tags`), never reorder or remove existing fields.
  - Inform users that when importing a `.apkg` with new fields, Anki Desktop requires **"Merge note types"** enabled in the import dialog, or the note type in Anki must be updated first so fields align properly.

## Security & Sanitization Standards
- **HTML Sanitization Boundary**:
  - Use `sanitizeHtml` for vocabulary terms and example sentences. It strictly allows formatting tags (`<b>`, `<strong>`, `<i>`, `<em>`, `<span>`, `<p>`, `<br>`) and restricts inline CSS properties to `color` only (needed for `#eab308` highlighting). Never allow unrestricted `style` attributes.
  - Use `sanitizeAiHtml` for LLM generated text. It parses markdown bullet lists and code tags while strictly disallowing any inline `style` attributes to prevent UI spoofing and CSS overlay attacks.
- **API Key & Cloud Requests**:
  - Validate Gemini API keys via `isValidApiKey(key)` before network requests to prevent HTTP header injection into `x-goog-api-key`.
  - Always URL-encode dynamic model identifiers when formatting Google API URLs (e.g., `encodeURIComponent(model)`).
  - Always support request cancellation via `AbortSignal` in long-running or network-bound AI calls.
- **LocalStorage & Data Ingestion**:
  - Never access `window.localStorage` directly in application logic; always use the `safeStorage` wrapper to handle exceptions, JSON parse failures, and schema validations.
  - When importing JSON backups, strictly validate that numbers are finite (`Number.isFinite`), reject `NaN`/`Infinity`, and enforce `MAX_BACKUP_ENTRIES` (25,000) to prevent memory exhaustion (DoS).

## Composables & State Management Patterns
- **Module-Level Singletons**: State that must be shared across disparate views (e.g. `vocabulary`, `masteredIds`, `srsData`, `studyStreak` in `useVocabulary`, or audio states in `useSpeechSynthesis`) is defined at the module level in the composable. Do not duplicate singleton state inside individual components.
- **Async Resource Cleanup**: Any component or composable initiating continuous activities (e.g., speech synthesis, AI generation streams, keyboard shortcut event listeners) MUST cleanly terminate them on unmount (`onUnmounted`) or when navigating away (`visibilitychange`, route changes).
