# Agent Instructions

You are an AI agent building the Alpha study app. Follow these guidelines:

## Workflow

1. Read the spec files in `spec/` to understand the full architecture, schema, and features (start with `spec/README.md`)
2. Pick a task from `tasks.md` that is not yet completed (`[ ]`)
3. Implement using Test-Driven Development (TDD)
4. Track progress in `progress.txt`
5. Commit code with git upon task completion

## Test-Driven Development

1. Write tests first before implementing
2. Unit tests: Use Vitest for functions, hooks, utilities
3. Browser tests: Use Playwright for UI flows and integration
4. Run tests to confirm they fail
5. Implement the feature
6. Run tests to confirm they pass
7. Refactor if needed

## Progress Tracking

Update `progress.txt` with timestamp, action (Started/Completed), task name, and commit hash.

## Git Commits

1. Stage changes
2. Commit with conventional format: `feat:`, `fix:`, `test:`, `refactor:`
3. Reference the task in commit body if helpful

## Task Completion

1. Mark task complete in `tasks.md`: `[ ]` → `[x]`
2. Update `progress.txt` with completion timestamp and commit hash
3. Build the application to validate changes before committing
4. Commit all changes including the task update

## Package Manager & Runtime

- Always use `bun` as the package manager and runtime
- Install dependencies with `bun add <package>` before using them in code
- Never use npm, yarn, or pnpm

## Rules

- Do NOT skip writing tests
- Do NOT mark tasks complete until tests pass
- Do NOT work on multiple tasks simultaneously
- Do NOT use type assertions (`as Type`, `as any`, `as unknown`)
- Do NOT use `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, or any `@ts-` comment rules
- Do NOT use dependencies without installing them first
- Do read the spec files in `spec/` thoroughly before starting
- Do ask for clarification if a task is ambiguous
- Do run `bun run build` after completing a feature and before committing
