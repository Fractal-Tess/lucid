# Web App - Agent Knowledge Base

**Generated:** 2026-01-31  
**Stack:** SvelteKit 5 + Better Auth + Convex

---

## OVERVIEW

SvelteKit frontend for Alpha study app. Handles routing, authentication, and UI
composition using @alpha/ui components.

---

## STRUCTURE

```
src/
├── routes/           # File-based routing
│   ├── +layout.svelte
│   ├── +page.svelte
│   ├── auth/
│   ├── dashboard/
│   ├── folders/
│   ├── generations/
│   └── documents/
├── lib/
│   ├── auth-client.ts    # Better Auth client
│   └── auth.server.ts    # Server auth instance
├── components/       # App-specific components
└── hooks.server.ts   # Auth token extraction
```

---

## WHERE TO LOOK

| Task          | Location                           | Notes                      |
| ------------- | ---------------------------------- | -------------------------- |
| Add page      | `src/routes/[path]/+page.svelte`   | File-based routing         |
| Add API route | `src/routes/api/[path]/+server.ts` | SvelteKit handlers         |
| Auth client   | `src/lib/auth-client.ts`           | Uses better-auth/svelte    |
| Server auth   | `src/lib/auth.server.ts`           | Token validation           |
| Layout        | `src/routes/+layout.svelte`        | Root layout with providers |

---

## CONVENTIONS

### Routing

- Use `(group)` for layout groups
- Dynamic params: `[id]/+page.svelte`
- API routes: `+server.ts` with GET/POST handlers

### Auth

- Client: `createAuthClient()` from better-auth/svelte
- Server: Extract token in `hooks.server.ts`, validate in `locals`
- Protected routes: Check auth in `+page.ts` load function

### Imports

- `@alpha/ui` for components
  (`import { Button } from '@alpha/ui/shadcn/button'`)
- `@alpha/backend` for Convex API
- `$lib` for internal utilities

---

## COMMANDS

```bash
bun run dev          # Start dev server (port 5173)
bun run build        # Production build
bun run check        # Type check with svelte-check
```

---

## NOTES

- Uses `@sveltejs/adapter-node` for Docker deployment
- `@lib` alias maps to `../../packages/ui/src/lib` for cross-package imports
- Auth API handler at `routes/api/auth/[...all]/+server.ts`
