# UI Package - Agent Knowledge Base

**Generated:** 2026-01-31  
**Stack:** Svelte 5 + shadcn-svelte + TailwindCSS 4

---

## OVERVIEW

Shared component library with ~70 shadcn-svelte components plus custom
study-focused components (flashcards, quizzes, notes, summaries).

---

## STRUCTURE

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/              # 60+ shadcn components
│   │   │   ├── button/
│   │   │   ├── dialog/
│   │   │   ├── flashcard-editor/   # Custom
│   │   │   ├── quiz-viewer/        # Custom
│   │   │   └── ...
│   │   └── dark-veil/       # Custom component
│   ├── hooks/               # Svelte hooks
│   ├── styles/              # CSS files
│   └── utils.ts             # cn() utility
├── routes/                  # Test routes (isolated dev)
└── e2e/                     # Playwright tests
```

---

## WHERE TO LOOK

| Task           | Location                         | Notes                |
| -------------- | -------------------------------- | -------------------- |
| Add shadcn     | `src/lib/components/ui/[name]/`  | Use `bun run shadcn` |
| Add custom     | `src/lib/components/ui/[name]/`  | Follow same pattern  |
| Test component | `src/routes/[name]/+page.svelte` | Isolated dev route   |
| E2E test       | `e2e/[name].test.ts`             | Playwright tests     |
| Export         | `package.json` exports           | Add to exports field |

---

## CONVENTIONS

### Component Structure

```
component-name/
├── component-name.svelte   # Main component
└── index.ts                # Barrel export
```

### Exports (package.json)

```json
{
  "./shadcn/*": "./src/lib/components/ui/*/index.js",
  "./styles/*": "./src/lib/styles/*.css",
  "./dark-veil": "./src/lib/components/dark-veil/index.js"
}
```

### Import Aliases

- **Within package:** Use `@lib` (NOT `$lib`)
- **Why:** `$lib` resolves to importing package's lib, not this one
- **Config:** `svelte.config.js` defines `@lib`: `./src/lib`

### Styling

- TailwindCSS 4 with `@tailwindcss/vite`
- `cn()` utility from `src/lib/utils.ts` for conditional classes
- `mode-watcher` for dark mode

---

## COMMANDS

```bash
bun run shadcn add [component]   # Add shadcn component
bun run dev                      # Dev server (port 5174)
bun run test:unit                # Vitest
bun run test:e2e                 # Playwright
```

---

## NOTES

- **~70 components** total (60 shadcn + 10 custom)
- Custom: flashcard-editor, flashcard-viewer, quiz-editor, quiz-viewer,
  notes-editor, notes-viewer, summary-editor, summary-viewer, file-tree,
  dark-veil
- Test routes in `src/routes/` for isolated component development (not exported)
- Uses `bits-ui` primitives under the hood
