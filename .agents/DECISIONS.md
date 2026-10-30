# Architecture Decision Records (ADRs)

This document records the key architectural decisions made in the **anki-b2** project, including their context, rationale, and consequences for both human operators and autonomous AI agents.

---

## ADR-001: Module-Level Singleton Composable Pattern Over Pinia

### Context
The application requires shared reactive state across disparate views and components (e.g., `vocabulary` list, filter states, `masteredIds`, `srsData` history, `studyStreak`, audio playback state). In Vue 3, typical solutions are either an external state management library like Pinia or module-level reactive state in a composable (`src/composables/useVocabulary.ts`).

### Decision
Adopted the **Module-Level Singleton Composable** pattern:
```ts
// Defined at module scope, shared across all useVocabulary() invocations
const vocabulary = ref<VocabularyItem[]>([]);
const masteredIds = ref<Set<string>>(new Set<string>());
const srsData = ref<Record<string, SrsData>>({});
```

### Rationale & Consequences
1. **Zero Bundle Overhead**: Eliminates third-party state library dependencies and runtime footprint.
2. **Type Safety & Simplicity**: Native TypeScript reactivity without action/mutation boilerplate.
3. **Testing Isolation Caveat**: State persists across tests run within the same Vitest worker thread.
   - *Mitigation*: Implemented `resetVocabularyState()` in `src/test-utils/fixtures.ts` and automated it in `src/test-setup.ts` to guarantee 100% test isolation before each test.

---

## ADR-002: Two-Tier Sanitization with Strict Inline CSS Property Whitelisting (`color` Only)

### Context
The application renders two distinct types of HTML:
1. Lexical vocabulary content with syntax highlights (`#eab308` yellow text, gender colors) and formatting tags (`<b>`, `<i>`).
2. Untrusted LLM-generated explanations from Google Gemini API.

Allowing arbitrary `style` attributes via DOMPurify exposes the application to CSS injection, clickjacking, and UI spoofing attacks (e.g., `position: fixed`, `z-index`, `opacity: 0`).

### Decision
Implemented a strict two-tier sanitization boundary (`src/utils/sanitize.ts`):
1. **`sanitizeHtml(dirty)`**:
   - Allowed tags: `<b>`, `<strong>`, `<i>`, `<em>`, `<span>`, `<p>`, `<br>`.
   - Utilizes a DOMPurify `afterSanitizeAttributes` hook to parse inline `style` and strictly preserve **only** the `color: ...;` property. All other CSS declarations are stripped.
2. **`sanitizeAiHtml(dirty)`**:
   - Parses markdown lists and backticks from LLM output.
   - Completely **disallows** inline `style` attributes (`ALLOWED_ATTR: ['class']`).

### Rationale & Consequences
- Defends against XSS, UI spoofing, and CSS overlay vectors while preserving legitimate lexical highlights.
- Verified automatically across all Vue templates by `npm run health:check`.

---

## ADR-003: Fixed Anki Note Model ID (`1607392319`) & Template Naming Stability

### Context
The deck generator `scripts/generate-anki.ts` compiles `.apkg` packages for import into Anki Desktop and AnkiMobile. Users maintain active learning progress (SRS intervals, ease factors, repetition history).

### Decision
Permanently fixed the following constants:
- `MODEL_ID = 1607392319`
- Note Model Name: `German B2 Professional (Bi-Directional)`
- Card Template Names: `Card 1: Recognition`, `Card 2: Production`
- Field Schema: New fields must be appended before `Tags`, never reordered or removed.

### Rationale & Consequences
- **Preserving Learning Progress**: Changing `MODEL_ID` or card template names forces Anki to treat notes as a new type or generate duplicate cards (e.g., 20,000+ cards instead of 7,266), resetting scheduling history.
- Enforced by golden regression tests in `scripts/generate-anki-regression.test.ts` and `scripts/health-check.ts`.

---

## ADR-004: Multi-Tier AI Assistant Cascade with In-Flight `AbortController` Protocol

### Context
The in-app AI Coach (cascade in `src/utils/ai.ts`; providers `src/utils/aiNano.ts`,
`src/utils/webllm.ts`, `src/utils/aiCloud.ts`; UI in `src/components/AIAssistant.vue`) explains words and
writes workplace dialogues. It should work offline and without an API key where possible, requests
can take seconds, users switch words quickly, and cloud quotas fluctuate.

### Decision
1. **Cascade** (`callAI`): Chrome built-in Gemini Nano (Prompt API, global `LanguageModel`, used
   only when already downloaded) → local WebLLM model via WebGPU (`src/utils/webllm.ts`; defaults:
   Gemma 3 1B on f16 GPUs, Qwen3.5 0.8B otherwise; Qwen3 "thinking" disabled) → cloud Gemini API
   with the user's key (`gemini-flash-lite-latest` first, then other models from the API list).
2. **Answer language**: prompts contain the `ANSWER_LANGUAGE` placeholder; on-device models answer
   in English (small models write it much better; Nano has no Ukrainian), the cloud in Ukrainian.
3. **Security & Injection Protection**:
   - API key validation via `isValidApiKey(key)` before request execution to prevent HTTP header injection into `x-goog-api-key`.
   - `encodeURIComponent(model)` on dynamic URL construction.
4. **In-Flight Cancellation**:
   - In-flight request cancellation via `AbortController` when the user selects a different word or triggers a new request.
   - Resource cleanup in `onUnmounted`.

---

## ADR-005: Text-to-Speech (TTS) String Normalization and Audio Cleaners

### Context
German lexical entries contain auxiliary grammatical notations:
- `der Tisch, -e` (plural ending `-e`)
- `anfangen (fängt an, fing an, hat angefangen)` (verb principal parts in parentheses)
- `jdm. etw. mitteilen` (case / pronoun abbreviations)

Passing these raw strings to the Web Speech API causes the speech synthesizer to read out punctuation and endings literally (e.g., "hyphen e"), degrading listening practice.

### Decision
Strip grammatical notation before speech, in two places:
- **Web app**: `cleanTextForSpeech(text)` in `src/utils/sanitize.ts`, used by
  `src/composables/useSpeechSynthesis.ts` (voices come from the OS via the Web Speech API; when no
  German voice exists the app shows OS-specific install steps from `src/utils/voiceHelp.ts`).
- **Anki decks**: `cleanGermanForAudio`, `cleanEnglishForAudio`, `cleanExampleForAudio` in
  `scripts/utils.ts` fill the `*_Audio` fields.

---

## ADR-006: Mandatory Test Environment Isolation in Vitest (`isolate: true`)

### Context
Vitest issues an informational hint during test execution suggesting that recreating DOM environments across multiple test files has overhead, and points to `isolate: false`. In a standard stateless utility library, disabling isolation can accelerate local test runs.

However, in this application:
1. Composables use the **Module-Level Singleton Pattern** (ADR-001) where reactive state (`vocabulary`, `masteredIds`, `srsData`, `studyStreak`, theme, audio playback) lives at the module scope.
2. Numerous tests mock global browser APIs and environment interfaces (`navigator.wakeLock`, `window.AudioContext`, `document.activeElement`, `window.localStorage`).

### Decision
Strictly preserve Vitest test environment isolation (`isolate: true`, default in Vitest). Never disable isolation or share global DOM/worker environments across test suites.

### Rationale & Consequences
- **Deterministic & Flaky-Free Tests**: Eliminates cross-suite state leakage, polluted browser mock objects, and un-reset singleton reactive objects between test files.
- **Negligible Performance Penalty**: The whole suite runs in a few seconds, so isolation is not worth trading for speed.
