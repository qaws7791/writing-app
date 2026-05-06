# @workspace/web

Next.js frontend app for the writing platform.

## Scripts

```bash
bun --filter @workspace/web dev
bun --filter @workspace/web build
bun --filter @workspace/web lint
bun --filter @workspace/web typecheck
```

## Conventions

- Shared UI imports come from `@workspace/ui`.
- ESLint and TypeScript extend `@workspace/config`.
- Global styles import `@workspace/ui/globals.css`.
- Use absolute imports and keep app-only files under `src`.
