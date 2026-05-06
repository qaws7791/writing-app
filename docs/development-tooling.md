# Development Tooling

## Formatting

- Use Prettier for formatting.
- Keep the Prettier configuration in the repository root only:
  `.prettierrc.json`.
- Run `bun run format` from the repository root to format the monorepo.
- Run `bun run format:check` from the repository root to check formatting.

## Linting

- Use ESLint for linting.
- Shared ESLint rules live in `packages/config/eslint`.
- Each app or package keeps a local `eslint.config.*` file and imports the
  shared config that matches its runtime.
- Run `bun run lint` from the repository root to lint every workspace through
  Turbo.

## Git Hooks

- `bun lefthook run pre-commit` formats staged files with Prettier and runs the
  relevant workspace ESLint tasks.
- The previous formatter and secondary linter binaries are no longer part of
  the toolchain.

## Next.js Apps

- `apps/web` uses the package name `@workspace/web` and is managed through Bun
  workspace filters.
- Next.js apps extend `@workspace/config/typescript/nextjs.json` and
  `@workspace/config/eslint/next-js`.
- App-level Tailwind entry files import `@workspace/ui/globals.css` instead of
  duplicating design tokens.
- Shared components, styles, and utilities are imported from `@workspace/ui`.
- Each Next.js app should expose `dev`, `build`, `start`, `lint`, and
  `typecheck` scripts so Turbo can validate the workspace consistently.
