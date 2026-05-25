# Course Detail Page

## 2026-05-25 Start

- Porting the course detail prototype from `sonnet-to-react` into
  `apps/web`.
- The implementation will keep the existing shared app shell and add the
  `/courses/[id]` route.
- All course IDs currently linked from home and courses pages will receive
  manually authored detail data.
- The page will use `@workspace/ui` primitives and semantic Tailwind tokens
  instead of prototype-only CSS tokens.
- Validation target: web typecheck, web lint, web build, root formatting check,
  `git diff --check`, and a local browser smoke check when possible.

## 2026-05-25 Finish

- Added `/courses/[id]` with static params for all 11 course IDs currently
  linked from the home and courses pages.
- Added manually authored course detail data with matching lesson totals and
  progress for in-progress courses.
- Ported the prototype detail layout with `@workspace/ui` primitives,
  semantic Tailwind tokens, `next/image`, and a client-side collapsible
  curriculum.
- Added route-level not-found UI for unknown course IDs.
- Validation passed: `bun --filter @workspace/web typecheck`,
  `bun --filter @workspace/web lint`, `bun --filter @workspace/web build`,
  `bun run format:check`, and `git diff --check`.
- Additional monorepo check: `bun run typecheck` passed. `bun run lint`
  still fails on pre-existing generated files under `apps/docs/out`.
- Browser smoke check passed on the temporary dev server:
  `/courses` 200, `/courses/reading-comprehension` 200,
  `/courses/basic-sentence-writing` 200, and `/courses/not-real` 404.
