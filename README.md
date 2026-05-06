# Writing App UI Workspace

This repository has been reset to a Storybook and UI package workspace.

## Current structure

- `apps/storybook`: Storybook workbench for `@workspace/ui`
- `packages/ui`: shared UI components, styles, and utilities
- `packages/config`: shared ESLint and TypeScript configuration

## Adding components

To add components to the UI package, run the following command from the repository root:

```bash
bunx shadcn@latest add button -c packages/ui
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button"
```

## Scripts

`bun storybook` runs the Storybook development server.
`bun build-storybook` builds the static Storybook output.
`bun typecheck` typechecks the remaining workspaces.
`bun lint` runs lint for the remaining workspaces.

## use bun

use `@types/bun` instead of `@types/node`

## packs repository for agent

```
npx repomix@latest -i ".agent, .agents, .claude, .tmp, .vscode, docs, **/*.d.ts, **/*.test.ts, apps/storybook, packages/ui, packages/config, **/*.spec.ts"
```
