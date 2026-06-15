# 몰입형 레슨 레이아웃 구현 계획

> **에이전트 작업자 필수 사항:** 이 계획을 작업 단위로 구현할 때는 `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans`를 사용한다. 단계는 추적을 위해 체크박스(`- [ ]`) 문법을 사용한다.

**목표:** `/app/lesson`을 글로벌 네비게이션 없는 몰입형 레슨 화면으로 만들고 중앙 콘텐츠만 스크롤되게 한다.

**구조:** 일반 앱 route는 `AppShell` route group에 남기고 레슨 route는 별도 route group으로 분리한다. `LessonExperience`는 공통 `LessonShell`을 통해 시작 화면과 스텝 화면의 고정 헤더, 스크롤 콘텐츠, 고정 CTA 구조를 공유한다.

**기술 스택:** Next.js App Router, React 19, Tailwind CSS, Vitest, Testing Library.

---

### 작업 1: 레슨 셸 구조 테스트

**파일:**

- 수정: `apps/web/src/features/lessons/lesson-experience.test.tsx`

- [ ] **1단계: 실패하는 테스트 작성**

`LessonExperience` 시작 화면 테스트에 다음 검증을 추가한다.

```tsx
const shell = screen.getByRole("main", { name: "레슨 콘텐츠" }).parentElement
expect(shell).toHaveClass("h-dvh", "overflow-hidden")
expect(screen.getByRole("banner", { name: "레슨 진행" })).toHaveClass(
  "shrink-0"
)
expect(screen.getByRole("main", { name: "레슨 콘텐츠" })).toHaveClass(
  "min-h-0",
  "flex-1",
  "overflow-y-auto"
)
expect(screen.getByRole("contentinfo", { name: "레슨 행동" })).toHaveClass(
  "shrink-0"
)
expect(
  screen.getByRole("progressbar", { name: "레슨 진행률" })
).toHaveAttribute("aria-valuenow", "0")
```

- [ ] **2단계: 테스트 실패 확인**

실행: `bun --filter @workspace/web test -- lesson-experience.test.tsx`

예상: 현재 컴포넌트에는 의미 있는 레슨 셸 role이 없고 페이지 전체 `overflow-y-auto`를 사용하므로 실패한다.

### 작업 2: 레슨 셸 구현

**파일:**

- 수정: `apps/web/src/features/lessons/lesson-experience.tsx`
- 수정: `apps/web/src/features/lessons/lesson-experience.test.tsx`

- [ ] **1단계: 셸 구현**

내부 헬퍼 `LessonShell`, `LessonProgressHeader`를 추가한다. 셸에는 `h-dvh overflow-hidden flex flex-col`, 헤더와 푸터에는 `shrink-0`, 콘텐츠에는 `min-h-0 flex-1 overflow-y-auto`를 사용한다.

- [ ] **2단계: 시작 화면과 학습 스텝 화면에 셸 적용**

시작 화면은 진행률 `0/lesson.steps.length`로 렌더링한다. 학습 스텝 화면은 기존 진행률 계산을 유지해 렌더링한다.

- [ ] **3단계: 테스트 통과 확인**

실행: `bun --filter @workspace/web test -- lesson-experience.test.tsx`

예상: 통과한다.

### 작업 3: 레슨 route를 앱 셸에서 분리

**파일:**

- 이동: `apps/web/src/app/app/page.tsx`에서 `apps/web/src/app/(learner)/app/page.tsx`
- 이동: `apps/web/src/app/app/courses`에서 `apps/web/src/app/(learner)/app/courses`
- 이동: `apps/web/src/app/app/profile`에서 `apps/web/src/app/(learner)/app/profile`
- 이동: `apps/web/src/app/app/layout.tsx`에서 `apps/web/src/app/(learner)/app/layout.tsx`
- 이동: `apps/web/src/app/app/lesson`에서 `apps/web/src/app/(lesson)/app/lesson`

- [ ] **1단계: URL 변경 없이 파일 이동**

Next.js route group을 사용해 `(learner)`와 `(lesson)`이 공개 URL에 영향을 주지 않게 한다.

- [ ] **2단계: 타입체크 실행**

실행: `bun --filter @workspace/web typecheck`

예상: 통과하고 `/app/lesson`은 생성된 route로 유지된다.

### 작업 4: 문서와 검증

**파일:**

- 수정: `docs/lesson-page.md`

- [ ] **1단계: 완료 기록 추가**

route group 분리, 고정 헤더/푸터 셸, 콘텐츠 전용 스크롤 동작을 기록한다.

- [ ] **2단계: 최종 검증 실행**

실행:

```powershell
bun --filter @workspace/web test -- lesson-experience.test.tsx
bun --filter @workspace/web typecheck
bun --filter @workspace/web lint
bunx prettier --check apps/web/src/app apps/web/src/features/lessons/lesson-experience.tsx apps/web/src/features/lessons/lesson-experience.test.tsx docs/lesson-page.md docs/superpowers/specs/2026-06-15-immersive-lesson-layout-design.md docs/superpowers/plans/2026-06-15-immersive-lesson-layout.md
```

예상: 모든 명령이 종료 코드 0으로 끝난다.
