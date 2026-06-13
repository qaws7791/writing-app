# Lesson Page

## 2026-06-14 시작 — Kwep 레슨 시작 화면 피벗

- 레슨 화면을 Kwep 피벗 기준의 `/app/lesson?lesson_id=...` route로 다시 작성한다.
- 첫 단계는 시작 화면과 첫 스텝 진행 저장 흐름으로 제한한다.
- 시작 화면은 레슨 제목, 카테고리, 설명, 예상 시간, 스텝 수를 한국어로 표시한다.
- 사용자가 `시작하기`를 누르면 첫 스텝 기준 `lesson-started` 마커를 저장하고, 실패 시 시작 화면에 한국어 오류를 표시한다.

## 2026-06-14 완료 — Kwep 레슨 시작 화면 피벗

- `/app/lesson?lesson_id=...` route가 서버에서 레슨을 조회하고 `LessonExperience` 클라이언트 컴포넌트에 lesson 데이터만 전달한다.
- `LessonExperience`는 처음 진입 시 시작 화면을 보여주고, 시작 저장이 성공하면 첫 스텝 렌더러로 진입한다.
- 시작 저장은 현재 플랫폼 API 포트의 `saveLessonAnswer`를 사용하며, answer 본문은 `{"kind":"lesson-started"}` JSON 문자열이다.
- `LessonStepRenderer`는 Step 7.1 범위에서 첫 스텝 내용을 표시하는 최소 렌더러로 두고, 퀴즈형 답변 저장과 AI 코칭 UX는 다음 Step에서 확장한다.

## 2026-06-14 시작 — Kwep 답변 자동 저장

- 답변 가능한 스텝에서 사용자가 값을 바꾸는 즉시 `saveLessonAnswer`를 호출한다.
- 저장 대상은 현재 Kwep 표준 타입에 있는 객관식, 빈칸, 단어 선택, 순서 배열, 매칭, 분류, 글쓰기다.
- 각 저장 값은 스텝 타입을 포함한 JSON 문자열로 직렬화해 API 포트 경계로 전달한다.

## 2026-06-14 완료 — Kwep 답변 자동 저장

- `LessonStepRenderer`가 답변 가능한 7개 표준 스텝 타입의 입력 컨트롤을 렌더링한다.
- 객관식은 선택 option id, 빈칸은 선택 단어 배열, 단어 선택은 선택 index 배열, 순서 배열은 선택 순서 배열, 매칭은 좌우 pair 배열, 분류는 item/category pair 배열, 글쓰기는 입력 text를 저장한다.
- `LessonExperience`는 스텝 렌더러의 답변 변경 이벤트를 받아 현재 lesson id와 step id로 `saveLessonAnswer`를 호출한다.
- 저장 실패 시 답변 영역 아래에 한국어 오류를 표시한다.

## 2026-06-14 시작 — Kwep AI 코칭 UX

- `AI_FEEDBACK` 스텝은 처음에 `AI 코칭 받기` 버튼을 보여준다.
- 코칭 요청 중에는 로딩 상태를 표시한다.
- 성공 결과는 총평, 잘된 점, 다듬을 점, 다음 시도를 보여준다.
- 남은 시도가 있으면 `다시 받기` 버튼을 보여주고, 시도 한도를 넘으면 한국어 오류를 표시한다.

## 2026-06-14 완료 — Kwep AI 코칭 UX

- `AI_FEEDBACK` 스텝은 사용자가 버튼을 누르기 전까지 코칭 요청을 보내지 않는다.
- 요청 중에는 `AI 코칭을 준비하고 있습니다.` 로딩 안내를 보여준다.
- 성공 결과에는 총평, 점수, 잘된 점, 다듬을 점, 다음 시도를 표시한다.
- `remainingAttempts`가 남아 있으면 `다시 받기` 버튼을 유지하고, API 실패는 한국어 오류로 표시한다.
- 현재 구현은 `AI_FEEDBACK.target` 값을 코칭 요청의 answer로 사용하며, 작성 답변 히스토리 연결은 이후 스텝 진행 모델 확장 시 다룬다.

## 2026-06-14 완료 — Kwep 레슨 이동과 완료 저장

- 레슨 시작 후 현재 스텝 인덱스를 클라이언트 상태로 관리해 `이전`, `다음`, `완료하기` 이동을 제공한다.
- 마지막 스텝에서 `완료하기`를 누르면 `POST /learning/lessons/{lessonId}/complete`로 완료 상태를 저장한다.
- 완료 저장이 성공하면 `레슨을 완료했습니다.` 화면과 `다음 레슨 보기` 링크를 보여주며, 링크는 현재 코스 상세로 이동해 서버 진행률 기준 다음 레슨을 이어가게 한다.
- 완료 저장이 실패하면 레슨 화면에 한국어 오류를 표시하고 현재 스텝에 머문다.

## 2026-06-14 완료 — Kwep 객관식 정답 확인

- 객관식 스텝은 선택 전에는 해설을 숨기고 선택 안내만 보여준다.
- 학습자가 선택지를 누르면 답변을 자동 저장하고, 정답이면 `정답입니다.`, 오답이면 `다시 생각해보세요.`를 표시한다.
- 정오답 메시지 아래에는 해당 객관식 스텝의 해설을 표시한다.

## 2026-06-14 완료 — Kwep 시작 마커와 write 변형 수용

- `lesson-started` 마커는 첫 스텝이 읽기여도 저장을 허용해 시작 화면에서 실제 학습 스텝으로 진입할 수 있게 했다.
- Kwep seed의 `write` 스텝은 `guide` 없이 `prompt`, `topic`, `structure`만 가진 변형도 있으므로 core DTO에서 `guide`를 선택값으로 다룬다.

## 2026-05-31 완료 — 장식성 진행 요소 제거

- 레슨 상단 헤더에서 남은 생명 표시를 제거하고, 나가기 버튼과 진행률만 남겼다.
- INTRO 콘텐츠와 DTO에서 `xpAvailable`을 제거해 시작 화면이 예상 시간과 학습 스텝만 보여준다.
- SUMMARY 콘텐츠와 UI에서 공유 문구와 공유 버튼을 제거했다.
- COMPLETE 콘텐츠와 UI에서 `celebrationStyle`, `xpEarned`, `showStreak`, `lessonStats`, 색종이, XP, 연속 학습, 완료 통계를 제거하고 완료 메시지와 다음 행동만 남겼다.
- 회귀 테스트는 레슨 화면에 생명과 XP가 렌더링되지 않는 것을 검증한다.

## 2026-05-27 시작 — 레슨 CTA 고정 레이아웃 수정

- 하단 CTA가 transform 애니메이션이 적용된 `StepFrame` 내부에 있어 스텝 진입 중 화면 중간에 배치되는 문제를 수정한다.
- 수정 범위는 `apps/web` 레슨 플레이어와 회귀 테스트, 문서 갱신으로 제한한다.

## 2026-05-27 완료 — 레슨 CTA 고정 레이아웃 수정

- `StepFrame`에서 `animate-in` 기반 진입 애니메이션을 제거해 transform 기반 containing block이 생기지 않게 했다.
- 하단 CTA는 기존 `position: fixed` 구조를 유지하면서 스텝 진입 직후부터 viewport 하단에 고정된다.
- 1차로 `slide-in-from-bottom-4`만 제거했을 때도 `animate-in`이 identity transform을 만들어 CTA 기준점을 바꾸는 것을 확인했고, 최종 수정에서는 `StepFrame`의 transform 유발 애니메이션 전체를 제거했다.
- 회귀 테스트와 브라우저 스모크로 선택형 스텝과 완료 화면의 CTA 위치를 확인했다.

## 2026-05-27 시작 — 레슨 CTA 위치 튐 원인 조사

- 다음 스텝으로 이동할 때 하단 CTA가 화면 중간에 잠깐 표시된 뒤 다시 하단으로 내려가는 현상을 조사한다.
- 조사 범위는 `/prototype`을 제외하고 `apps/web`의 레슨 플레이어 렌더링 구조와 실제 브라우저 재현으로 한정한다.
- 코드 수정 없이 원인과 재현 근거를 먼저 확인한다.

## 2026-05-27 완료 — 레슨 CTA 위치 튐 원인 조사

- 원인은 `BottomActionBar`의 `position: fixed`가 `StepFrame`의 진입 애니메이션 transform 영향을 받는 구조다.
- `StepFrame`은 `animate-in fade-in slide-in-from-bottom-4`를 사용하고, 문제 스텝들은 `BottomActionBar`를 `StepFrame` 내부에 렌더링한다.
- CSS transform이 적용된 조상은 fixed 자식의 containing block이 될 수 있어, 애니메이션 중 CTA가 viewport 하단이 아니라 `StepFrame` 하단 기준으로 배치된다.
- 브라우저 재현에서 문제 스텝 진입 직후 CTA fixed 컨테이너는 `top=289px`, `bottom=374px`에 있었고, 약 480ms 뒤 transform이 사라진 후 `top=1317px`, `bottom=1402px`로 viewport 하단에 재배치됐다.
- 완료 화면도 같은 패턴으로 `CompleteStep` 안의 `StepFrame` 내부에 `BottomActionBar`가 있어 동일 증상이 발생한다.
- 수정 방향은 CTA를 애니메이션이 걸린 `StepFrame` 밖에서 렌더링하거나, CTA를 포함하는 조상에 transform 기반 진입 애니메이션을 적용하지 않는 것이다.

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
