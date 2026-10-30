# anki-b2

German B1+/B2 Beruf vocabulary trainer: a Vue 3 + Vite PWA (GitHub Pages) and Anki `.apkg` decks,
both generated from `source/*.txt`. Node.js 26 LTS (see `.nvmrc`).

Shared agent rules live in `.agents/` so every tool reads the same files:

@.agents/AGENTS.md

Architecture decisions (ADRs): `.agents/DECISIONS.md` — read before changing state management,
progress keys, sanitization, the Anki model, the AI cascade, TTS or test isolation.
Vocabulary file format: `.agents/rules/vocabulary.md` (when editing `source/*.txt`).
Deck generator invariants: `.agents/rules/anki-decks.md` (when editing `scripts/generate-*`).

## Commands

| Task                                   | Command                                     |
| -------------------------------------- | ------------------------------------------- |
| Fast full check before committing      | `npm run agent:ready`                       |
| Everything CI runs                     | `npm run validate` + `npm run format:check` |
| Regenerate decks + `public/data.json`  | `npm run generate:anki`                     |
| What changed in example highlights     | `npm run diff:data`                         |
| UI audit (screens, contrast, a11y)     | `npm run build && npm run audit:ui`         |
| Browser tests (progress, backup, PWA)  | `npm run build && npm run test:e2e`         |
| CI / release status of a pushed commit | `npm run ci:status -- --wait`               |

To commit, push and verify a change, follow the `ship` skill (`.agents/skills/ship/SKILL.md`).
