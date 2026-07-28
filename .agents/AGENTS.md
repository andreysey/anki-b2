# Project Rules & Guidelines

## TypeScript & Type Safety
- **Strict Typing in Mocks & Tests**: Never omit required properties when mocking typed objects or state (e.g., returning API responses like `AIServiceResponse`). Always ensure test mocks satisfy full TypeScript interface definitions.
- **Explicit Generic Type Parameters**: Avoid un-parameterized instantiations like `new Set()` or `new Map()` when empty, which cause `Set<unknown>` or `Set<never>` type errors. Always specify explicit type parameters (e.g., `new Set<string>()`).
- **Type Check Verification**: Run type checking (`npm run build` or `npx vue-tsc --noEmit`) to catch strict type errors before finalizing changes.
