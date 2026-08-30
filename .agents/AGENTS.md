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

