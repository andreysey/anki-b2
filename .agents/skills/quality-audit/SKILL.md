---
name: quality-audit
description: Autonomous security, code hygiene, and Anki schema integrity audit for anki-b2. Trigger this skill whenever conducting security reviews, refactorings, checking sanitization boundaries, inspecting CSP, or validating full build pipelines.
---

# Code & Security Quality Audit Runbook

Use this skill when auditing the project for security vulnerabilities, memory leaks, Anki schema regressions, or before publishing releases.

## 1. Automated Health & Security Guard
Run the dedicated health check CLI:
```bash
npm run health:check
```
This automatically verifies:
- All `v-html` instances in `.vue` files are wrapped in `sanitizeHtml` or `sanitizeAiHtml`.
- No direct `localStorage` access exists in `src/` outside `safeStorage.ts`.
- Anki `MODEL_ID` (`1607392319`) and card template names are preserved.
- Content Security Policy directives in `index.html` remain hardened (`base-uri 'self'`, `object-src 'none'`, `form-action 'self'`, `img-src 'self' data:`).

## 2. Fast Static Verification
```bash
npm run check:quick
```
Runs Vue 3 TypeScript strict typecheck and vocabulary data validation in under 5 seconds.

## 3. Security Boundary Checklist
When reviewing or writing code, manually verify these critical security invariants:
1. **HTML Sanitization**:
   - For vocabulary terms / examples: `sanitizeHtml(text)` — strictly allows only `<b>`, `<strong>`, `<i>`, `<em>`, `<span>`, `<p>`, `<br>` and restricts inline styles to `color` only.
   - For LLM / AI coach outputs: `sanitizeAiHtml(text)` — strictly disallows all `style` attributes to prevent CSS injection and UI redressing.
2. **API Key Safety**:
   - Validate API keys using `isValidApiKey(key)` before adding them to HTTP headers (`x-goog-api-key`).
   - Dynamic model names in Google URLs must always be encoded: `encodeURIComponent(model)`.
3. **Data Ingestion & Backup Safety**:
   - `parseAndValidateBackup`: must check `Number.isFinite` on `level` and `lastReview`.
   - Never import more than `MAX_BACKUP_ENTRIES` (25,000) to prevent DoS.
   - Guard against prototype pollution (`__proto__`, `constructor`, `prototype`).
4. **Lifecycle & Memory Leaks**:
   - In-flight AI calls must support `AbortSignal` / `AbortController` and abort on unmount or word change.
   - Speech synthesis must cancel (`stopAudio()`) on unmount.
   - Keyboard event listeners must unregister on unmount.

## 4. Full Pipeline Verification
Always conclude an audit or major feature work with the complete verification chain:
```bash
npm run test:all
npm run generate:anki
npm run build
```
