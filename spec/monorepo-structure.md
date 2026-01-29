# Monorepo Structure

```
alpha/
 ├── apps/
│   ├── web/                  # SvelteKit app
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── lib/
│   │   │   │   └── components/
│   │   │   └── app.html
│   │   ├── convex/           # Convex client config
│   │   ├── svelte.config.js
│   │   └── package.json
│   │
│   └── docling/              # Python FastAPI service
│       ├── main.py
│       ├── requirements.txt
│       └── Dockerfile
│
├── packages/
│   ├── ui/                   # Shared shadcn-svelte components
│   │   ├── src/
│   │   │   └── components/
│   │   └── package.json
│   │
│   ├── convex/               # Convex backend
│   │   ├── schema.ts
│   │   ├── functions/
│   │   │   ├── documents.ts
│   │   │   ├── flashcards.ts
│   │   │   ├── quizzes.ts
│   │   │   ├── sessions.ts
│   │   │   └── users.ts
│   │   ├── workflows/
│   │   │   ├── processDocument.ts
│   │   │   └── generateContent.ts
│   │   └── package.json
│   │
│   └── ai/                   # LLM router + prompts
│       ├── src/
│       │   ├── router.ts
│       │   ├── router.config.ts
│       │   ├── classifier.ts
│       │   └── prompts/
│       │       ├── flashcards.ts
│       │       ├── quizzes.ts
│       │       └── summaries.ts
│       └── package.json
│
├── docker-compose.yml
├── turbo.json
├── package.json
└── bun.lockb
```
