# Lesson Page

## 2026-05-25 Start

- Porting the 20-step lesson prototype from `sonnet-to-react/prototype.html`
  into `apps/web`.
- The implementation will add `/lesson` as a Next.js App Router page that
  accepts an optional `lesson_id` search parameter.
- The first pass uses a single static prototype lesson and local client state
  for progress, answers, writing input, mock AI feedback, and completion UI.
- The lesson route will use a fullscreen dark learning shell while preserving
  the existing app shell outside `/lesson`.
- Validation target: web typecheck, web lint, web build, formatting check,
  `git diff --check`, Lefthook pre-commit when possible, and a browser smoke
  check.

## 2026-05-25 Finish

- Added `/lesson` with Next.js async `searchParams`; `lesson_id` is accepted
  but v1 renders the single static prototype lesson.
- Added `@/features/lessons` with branded lesson IDs, discriminated union step
  types for all 20 prototype steps, static lesson data, pure lesson helpers,
  and the client-side fullscreen lesson player.
- Hid the shared app navigation on `/lesson` so the prototype-style fixed
  header, progress bar, hearts, content area, bottom action bar, and exit modal
  own the screen.
- Used `@workspace/ui` primitives and semantic Tailwind tokens for the dark
  learning UI; added only neutral lucide icon exports to `packages/ui`.
- Implemented local-only interactions for choices, fill blanks, word select,
  reorder, matching, classification, writing, mock AI feedback, revision,
  checklist, reflection, summary sharing state, transcription match rate, and
  completion XP/confetti.
- Validation passed: `bun --filter @workspace/web typecheck`,
  `bun --filter @workspace/web lint`, `bun --filter @workspace/web build`,
  `bun --filter @workspace/ui typecheck`, `bun run format:check`,
  `git diff --check`, and `bun lefthook run pre-commit` completed with no
  staged files to inspect.
- Browser smoke passed on `http://localhost:3210`: entered from
  `/courses/expression`, checked the exit dialog, completed all 20 steps,
  exercised AI feedback revision, and reached the completion screen.
- The temporary dev server and related processes were terminated after smoke
  testing.
