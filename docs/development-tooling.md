# Development Tooling

## Formatting

- Use Prettier for formatting.
- Keep the Prettier configuration in the repository root only:
  `.prettierrc.json`.
- Run `bun run format` from the repository root to format the monorepo.
- Run `bun run format:check` from the repository root to check formatting.

## Linting

- Use ESLint for linting across the monorepo.
- Run `bun run lint` from the repository root to lint every workspace through
  Turbo.
- App and package lint scripts should stay local to the workspace and be invoked
  by Turbo from the root.

## Typechecking and Builds

- Run `bun run typecheck` from the repository root to typecheck all workspaces.
- Run `bun run build` from the repository root to build all configured
  workspaces.
- `apps/web` exposes `dev`, `build`, `start`, `lint`, and `typecheck` scripts so
  it can be validated consistently through Turbo.

## Git Hooks

- `bun lefthook run pre-commit` can be used before committing to run the
  repository pre-commit checks.
- If a hook updates files, inspect `git status --short` and keep the resulting
  changes in the matching commit.

## Runtime

- Use Bun `1.3.10`, as declared by the root `packageManager` field.
- Use Node.js `20.x`, as declared by the root `engines` field.
