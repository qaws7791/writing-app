# Lesson Page

## 2026-05-25 Start — Full Course Lesson Data

- Expanding `/lesson` from the single prototype lesson to lesson-specific
  rendering for every lesson reachable from the 11 routed course detail pages.
- The implementation will generate authored static lesson data for all 139
  course lesson IDs, keep the existing 20-step renderer model, and validate
  that course curriculum IDs and lesson data stay in sync.
- The route will resolve `lesson_id` from async `searchParams`, render a
  default lesson when omitted, and show a route-level not-found UI for unknown
  lesson IDs.
- The lesson player will keep writing responses by step ID so AI feedback and
  revision jumps target the correct writing step in each lesson.
- Validation target: web typecheck, web lint, web build, formatting check,
  `git diff --check`, and a browser smoke check.

## 2026-05-25 Finish — Full Course Lesson Data

- Replaced the single prototype lesson data source with a generated lesson
  catalog for all 139 lesson IDs reachable from the 11 routed course detail
  pages.
- Added course-specific learning profiles and per-lesson authored step flows
  using the existing lesson step renderer types; catalog validation now checks
  curriculum coverage, duplicate IDs, step order, intro totals, complete steps,
  and AI feedback source references.
- Updated `/lesson` to resolve `lesson_id` from async `searchParams`, render
  the default lesson when omitted, and show a lesson-specific not-found screen
  for unknown IDs.
- Updated the lesson player to store writing responses by step ID, feed
  `AI_FEEDBACK` from its declared `sourceStepId`, jump revision back to the
  correct source writing step, and continue to the next lesson when available.
- Synced home lesson IDs and links to the same `/lesson?lesson_id=...` route
  used by course detail pages.
- Validation passed: catalog import check returned 139 lessons,
  `bun --filter @workspace/web typecheck`, `bun --filter @workspace/web lint`,
  `bun --filter @workspace/web build`, `bun run format:check`,
  `git diff --check`, and `bun lefthook run pre-commit`.
- Browser smoke passed on `http://localhost:3210`: verified
  `/lesson?lesson_id=expression-05`, `/lesson?lesson_id=business-email-18`,
  `/lesson?lesson_id=not-real`, and `/home` lesson links. The temporary dev
  server was terminated after testing.

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
