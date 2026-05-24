# @workspace/web

Empty Next.js frontend workspace for the writing platform.

## Scripts

```bash
bun --filter @workspace/web dev
bun --filter @workspace/web build
bun --filter @workspace/web lint
bun --filter @workspace/web typecheck
```

## Structure

- `src/app/layout.tsx`: required App Router root layout.
- `src/app/page.tsx`: empty root route.
- `src/app/globals.css`: imports shared UI globals from `@workspace/ui`.

## Conventions

- Keep app-only code under `src`.
- Use absolute imports when new app code is added.
- ESLint and TypeScript extend `@workspace/config`.
