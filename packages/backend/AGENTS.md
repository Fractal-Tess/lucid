# Backend - Agent Knowledge Base

**Generated:** 2026-01-31  
**Stack:** Convex + Better Auth + TypeScript

---

## OVERVIEW

Convex backend with serverless functions, real-time sync, and AI workflows.
Handles database, auth, and document processing orchestration.

---

## STRUCTURE

```
convex/
├── schema.ts           # Database schema (368 lines, 20+ tables)
├── auth.ts             # Better Auth integration
├── http.ts             # HTTP router for auth endpoints
├── convex.config.ts    # Convex configuration
├── functions/          # Queries & mutations (17 files)
│   ├── users.ts
│   ├── documents.ts
│   ├── generations.ts
│   ├── flashcardItems.ts
│   └── ...
└── workflows/          # Background AI jobs (7 files)
    ├── processDocument.ts
    ├── generateFlashcards.ts
    ├── generateQuiz.ts
    └── ...
```

---

## WHERE TO LOOK

| Task           | Location                     | Notes                         |
| -------------- | ---------------------------- | ----------------------------- |
| Schema changes | `convex/schema.ts`           | Define tables with validators |
| Add query      | `convex/functions/[name].ts` | Use `query({...})` pattern    |
| Add mutation   | `convex/functions/[name].ts` | Use `mutation({...})` pattern |
| Add workflow   | `convex/workflows/[name].ts` | Background AI processing      |
| Auth config    | `convex/auth.ts`             | Better Auth setup             |
| HTTP routes    | `convex/http.ts`             | Auth endpoints                |

---

## CONVENTIONS

### Functions

```typescript
export const myQuery = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.query("table").filter(...).collect();
  },
});
```

### Schema

- Use `v.union(v.literal(...))` for enums
- Index frequently queried fields
- Vector index for embeddings: `dimensions: 1536`

### Workflows

- Trigger from mutations with `ctx.scheduler.runAfter()`
- Use for AI generation (flashcards, quiz, notes, summary)
- Update generation status: `generating` → `ready`/`failed`

---

## COMMANDS

```bash
bun run dev          # Convex dev (hot reload)
bun run dev:setup    # Configure Convex project
```

---

## NOTES

- Generated types in `_generated/` (ignored by oxlint)
- Vector search on `documentChunks` table (1536-dim embeddings)
- SM-2 algorithm fields in `flashcardItems` (easeFactor, interval, repetitions,
  nextReview)
- Document processing: Convex → Docling service → Workflows
