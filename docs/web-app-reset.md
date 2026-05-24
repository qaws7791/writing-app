# Web App Reset

## 2026-05-25 Start

- The current working tree removes the previous dashboard reference screen from
  `apps/web`.
- The root route is being kept as an empty Next.js App Router page.
- The web app package no longer needs its direct `lucide-react` dependency for
  the root route.
- Validation target before committing: root formatting check, lint, typecheck,
  build, Lefthook pre-commit, and `git diff --check`.

## 2026-05-25 Finish

- Root route reset is ready to commit with the dashboard reference removed.
- `packages/ui` import aliases were kept absolute where the package `tsconfig`
  already defines `@/*`.
- Validation passed: `bun run format:check`, `bun run lint`,
  `bun run typecheck`, `bun run build`, `bun lefthook run pre-commit`, and
  `git diff --check`.
- Build completed with existing warnings from docs workspace root inference,
  Storybook missing one story glob, Vite module-level directives, and chunk
  size.
