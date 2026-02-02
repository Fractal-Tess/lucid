# Alpha Study App - Agent Knowledge Base

**Generated:** 2026-01-31  
**Stack:** SvelteKit 5 + Convex + TypeScript  
**Package Manager:** Bun

---

## OVERVIEW

AI-powered study platform with document processing, flashcards, quizzes, and
summaries. Phase 1 MVP complete with SM-2 spaced repetition, LLM-generated
content via OpenRouter, and vector search.

---

## STRUCTURE

```
.
├── apps/
│   ├── web/              # SvelteKit frontend (Node adapter)
│   └── docling/          # Python document processing microservice
├── packages/
│   ├── backend/          # Convex functions + schema
│   ├── ui/               # shadcn-svelte components (~70 components)
│   ├── ai/               # LLM router + prompts
│   ├── assets/           # Logo assets
│   └── config/           # Shared TypeScript config
├── AGENTS.md             # This file
├── tasks.md              # Feature tracker
└── turbo.json            # Monorepo pipeline
```

---

## WHERE TO LOOK

| Task                      | Location                                             | Notes                        |
| ------------------------- | ---------------------------------------------------- | ---------------------------- |
| Add UI component          | `packages/ui/src/lib/components/ui/`                 | Use `bun run shadcn`         |
| Add Convex query/mutation | `packages/backend/convex/functions/`                 | Follow existing patterns     |
| Add workflow              | `packages/backend/convex/workflows/`                 | AI generation workflows      |
| Add AI prompt             | `packages/ai/src/prompts/`                           | Include Zod schema           |
| Add web route             | `apps/web/src/routes/`                               | SvelteKit file-based routing |
| Add test                  | `packages/ai/src/**/*.test.ts` or `packages/ui/e2e/` | Vitest unit, Playwright e2e  |
| Schema changes            | `packages/backend/convex/schema.ts`                  | 368 lines, comprehensive     |

---

## CONVENTIONS (Non-Standard)

### TypeScript

- **Always prefer `type` over `interface`**
- Strict mode: `noUncheckedIndexedAccess`, `noUnusedLocals`
- **NO type assertions** (`as any`, `as Type`, `as unknown`)
- **NO `@ts-*` comments** (ignore, expect-error, nocheck)

### Imports

- Use `$lib` for internal imports within a package
- Use `@lib` in `packages/ui` for cross-package imports
- Workspace deps: `workspace:*` for internal, `catalog:` for shared

### Components

- shadcn-svelte pattern: `component/` folder with `component.svelte` +
  `index.js`
- Custom components alongside shadcn in `packages/ui/src/lib/components/ui/`

### Backend

- Convex queries/mutations: export const functionName = query({...})
- Workflows for async AI processing
- Vector search: 1536-dim OpenAI embeddings in `documentChunks`

---

## ANTI-PATTERNS (Explicitly Forbidden)

```
DO NOT:
- Skip writing tests
- Use npm/yarn/pnpm (Bun only)
- Mark tasks complete before tests pass
- Work on multiple tasks simultaneously
- Use dependencies without installing first
- Commit without running `bun run build`
- Use type assertions or @ts-* comments
```

---

## TYPE SAFETY REQUIREMENTS

**CRITICAL**: Run `bun run typecheck` after EVERY single code change:

```
1. Make any edit to TypeScript/Svelte files
2. Run `bun run typecheck` immediately
3. Fix all type errors before proceeding
4. Only then run tests or build
```

This is non-negotiable. The project uses strict TypeScript settings:

- `noUncheckedIndexedAccess`
- `noUnusedLocals`
- `noUnusedParameters`

**Never** suppress type errors with `as any`, `@ts-ignore`, or
`@ts-expect-error`.

---

## COMMANDS

```bash
# Development
bun run dev              # Start all dev servers
bun run dev:web          # Web only
bun run dev:server       # Convex only
bun run dev:setup        # Configure Convex

# Build & Check
bun run build            # Build all packages
bun run typecheck        # TypeScript check
bun run check            # Lint + format (oxlint + oxfmt)

# Testing
bun run test:unit        # Vitest (in package)
bun run test:e2e         # Playwright (in packages/ui)

# UI Components
bun run shadcn add <component>   # Add shadcn component
```

---

## NOTES

- **No spec directory exists** despite AGENTS.md mentioning it
- **Single contributor** (Fractal-Tess) - no complex git workflows
- **No CI/CD** configured yet
- **progress.txt** should be created if missing
- **517 source files**, ~23k lines of TypeScript/Svelte
- **2 large files** (>500 lines): schema.ts, router.ts

---

## AGENT WORKFLOW

### Starting Work - ALWAYS DO FIRST

```
1. Search Supermemory for relevant context:
   supermemory(mode: "search", query: "<task-related keywords>", scope: "project")

2. Read tasks.md to find incomplete tasks

3. Read relevant AGENTS.md sections for the area you're working in
```

**Why**: Supermemory contains accumulated knowledge about patterns, gotchas, and
technical debt. Checking it first prevents repeating mistakes and ensures you
follow established conventions.

### During Work - Keep Memory Updated

```
When you discover new patterns, fix bugs, or learn important context:

supermemory(mode: "add",
  content: "<what you learned>",
  type: "learned-pattern" | "error-solution" | "architecture",
  scope: "project")
```

**Examples of what to save**:

- Workarounds for tricky TypeScript issues
- New patterns you established
- Gotchas you encountered
- Performance optimizations found
- Configuration fixes

### Ending Work - Capture Knowledge

```
Before finishing, update Supermemory with:
- Any new conventions you followed
- Technical debt you noticed but didn't fix
- Architecture decisions made
- Pain points encountered
```

---

## DEVELOPMENT WORKFLOW

1. Read `tasks.md`, pick incomplete task (`[ ]`)
2. **Search Supermemory for relevant context**
3. Write tests first (TDD)
4. Implement feature
5. **Run `bun run typecheck` to validate type safety**
6. Run tests to confirm pass
7. Run `bun run build` to validate
8. Update `progress.txt` with timestamp + commit hash
9. **Update Supermemory with any new learnings**
10. Mark task complete in `tasks.md`
11. Commit with conventional format: `feat:`, `fix:`, `test:`

---

## DATABASE SCHEMA (Key Tables)

| Table                   | Purpose                                              |
| ----------------------- | ---------------------------------------------------- |
| `users`                 | Auth via Better Auth                                 |
| `subjectGroups`         | Top-level organization                               |
| `subjects`              | Within groups                                        |
| `folders`               | Nested within subjects                               |
| `documents`             | Uploaded files (PDF/DOC/DOCX)                        |
| `generations`           | AI-generated content (flashcards/quiz/notes/summary) |
| `flashcardItems`        | With SM-2 algorithm fields                           |
| `quizItems`             | Multiple choice questions                            |
| `documentChunks`        | Vector embeddings (1536-dim)                         |
| `dailyStats`, `streaks` | Progress tracking                                    |

See `packages/backend/convex/schema.ts` for full schema (368 lines).
