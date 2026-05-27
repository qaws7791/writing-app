# 레슨 CTA 고정 레이아웃 수정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 레슨 스텝 전환 시 하단 CTA가 화면 중간에 잠깐 나타났다가 하단으로 내려가는 현상을 제거한다.

**Architecture:** 원인은 `position: fixed` CTA가 transform 애니메이션이 적용된 `StepFrame` 내부에 렌더링되는 구조다. 가장 작은 수정은 `StepFrame`의 transform 기반 `animate-in` 진입 애니메이션을 제거해 fixed 자식의 containing block이 viewport로 유지되게 하는 것이다. 개별 콘텐츠 내부의 slide 애니메이션은 그대로 둔다.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Vitest, Testing Library, Bun

---

## 파일 구조

- Modify: `apps/web/src/features/lessons/lesson-experience.tsx`
  - `StepFrame`의 `animate-in` 기반 진입 애니메이션을 제거한다.
- Create: `apps/web/src/features/lessons/lesson-experience.test.tsx`
  - `StepFrame`이 transform을 유발하는 `animate-in`/`slide-in-from-bottom-*` 클래스를 갖지 않는다는 회귀 테스트를 추가한다.
- Modify: `docs/lesson-page.md`
  - 작업 시작과 완료 기록을 한국어로 추가한다.

## 구현 원칙

- `/prototype`은 수정하지 않는다.
- CTA 컴포넌트 구조를 대규모로 바꾸지 않는다.
- 전역 CSS나 Tailwind 설정을 건드리지 않는다.
- 커밋은 사용자가 명시적으로 요청한 경우에만 수행한다.

### Task 1: 실패하는 회귀 테스트 추가

**Files:**

- Create: `apps/web/src/features/lessons/lesson-experience.test.tsx`

- [ ] **Step 1: 테스트 파일을 추가한다**

`apps/web/src/features/lessons/lesson-experience.test.tsx`를 다음 내용으로 생성한다.

```tsx
import * as React from "react"
import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { getDefaultLesson } from "@/features/lessons/lesson-data"
import { LessonExperience } from "@/features/lessons/lesson-experience"
import { apiOk } from "@/lib/api/api-result"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock("@workspace/ui/components/ui/progress-bar", () => ({
  ProgressBar: ({ value }: { value: number }) => (
    <div aria-label="레슨 진행률" data-value={value} />
  ),
}))

const icon = () => <span aria-hidden="true" />

vi.mock("@workspace/ui/components/icons", () => ({
  CheckIcon: icon,
  GripVerticalIcon: icon,
  HeartIcon: icon,
  SparklesIcon: icon,
  XIcon: icon,
}))

const api: Pick<
  WritingAppApi,
  | "saveLessonProgress"
  | "saveLessonAnswer"
  | "completeLesson"
  | "createAiFeedback"
> = {
  saveLessonProgress: vi.fn(async () => apiOk(undefined)),
  saveLessonAnswer: vi.fn(async () => apiOk(undefined)),
  completeLesson: vi.fn(async () => apiOk(undefined)),
  createAiFeedback: vi.fn(async () =>
    apiOk({
      overallComment: "좋은 초안입니다.",
      rubric: [],
      suggestions: [],
      revisedDraft: "다듬은 문장입니다.",
    })
  ),
}

describe("LessonExperience", () => {
  it("does not apply transform-based entrance motion to the step frame", () => {
    const { container } = render(
      <LessonExperience lesson={getDefaultLesson()} api={api} />
    )

    const stepFrame = container.querySelector("section")

    expect(stepFrame).toBeTruthy()
    expect(stepFrame?.className).not.toContain("animate-in")
    expect(stepFrame?.className).not.toContain("slide-in-from-bottom")
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run:

```bash
bun --filter @workspace/web test -- src/features/lessons/lesson-experience.test.tsx
```

Expected:

```text
FAIL src/features/lessons/lesson-experience.test.tsx
AssertionError: expected 'animate-in fade-in slide-in-from-bottom-4 ...' not to contain 'animate-in'
```

### Task 2: StepFrame transform 유발 애니메이션 제거

**Files:**

- Modify: `apps/web/src/features/lessons/lesson-experience.tsx`
- Test: `apps/web/src/features/lessons/lesson-experience.test.tsx`

- [ ] **Step 1: `StepFrame`의 `animate-in` 계열 클래스를 제거한다**

`apps/web/src/features/lessons/lesson-experience.tsx`의 `StepFrame` 반환부를 다음처럼 바꾼다.

```tsx
function StepFrame({
  children,
  centered = false,
}: {
  children: React.ReactNode
  centered?: boolean
}) {
  return (
    <section className="px-5 pt-6 pb-28">
      <div
        className={cn(
          lessonMaxWidthClassName,
          "flex flex-col gap-5",
          centered && "items-center text-center"
        )}
      >
        {children}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: 회귀 테스트가 통과하는지 확인한다**

Run:

```bash
bun --filter @workspace/web test -- src/features/lessons/lesson-experience.test.tsx
```

Expected:

```text
Test Files  1 passed
Tests  1 passed
```

### Task 3: 브라우저에서 원 증상 재검증

**Files:**

- Read: `apps/web/src/features/lessons/lesson-experience.tsx`

- [ ] **Step 1: fake API 모드로 웹 개발 서버를 실행한다**

PowerShell에서 실행한다.

```powershell
$env:WEB_API_MODE = "fake"
$env:NEXT_PUBLIC_API_MODE = "fake"
bun --filter @workspace/web dev -- --port 3210
```

Expected:

```text
Local: http://localhost:3210
Ready
```

- [ ] **Step 2: 브라우저에서 문제 스텝까지 이동한다**

브라우저에서 `http://localhost:3210/app/lesson?lesson_id=expression-05`를 연다.

다음 순서로 CTA를 클릭한다.

```text
시작하기
이해했어요
다음
다음
```

Expected:

```text
선택형 문제 화면이 보이고 하단 CTA는 진입 직후부터 화면 하단에 고정된다.
CTA가 콘텐츠 영역 중간에 나타나는 프레임이 없어야 한다.
```

- [ ] **Step 3: 완료 화면도 확인한다**

레슨을 끝까지 진행해 `레슨 완료!` 화면에 도달한다.

Expected:

```text
홈으로 / 계속하기 CTA가 진입 직후부터 화면 하단에 고정된다.
완료 화면 콘텐츠와 confetti는 표시되고 CTA 위치 튐은 없다.
```

- [ ] **Step 4: 개발 서버를 종료한다**

터미널에서 `Ctrl+C`로 종료한다.

Expected:

```text
3210 포트에서 실행 중인 Next.js 개발 서버가 남지 않는다.
```

### Task 4: 문서 갱신

**Files:**

- Modify: `docs/lesson-page.md`

- [ ] **Step 1: 작업 시작/완료 기록을 추가한다**

`docs/lesson-page.md` 상단에 다음 섹션을 추가한다.

```md
## 2026-05-27 시작 — 레슨 CTA 고정 레이아웃 수정

- 하단 CTA가 transform 애니메이션이 적용된 `StepFrame` 내부에 있어 스텝 진입 중 화면 중간에 배치되는 문제를 수정한다.
- 수정 범위는 `apps/web` 레슨 플레이어와 회귀 테스트, 문서 갱신으로 제한한다.

## 2026-05-27 완료 — 레슨 CTA 고정 레이아웃 수정

- `StepFrame`에서 `animate-in` 기반 진입 애니메이션을 제거해 transform 기반 containing block이 생기지 않게 했다.
- 하단 CTA는 기존 `position: fixed` 구조를 유지하면서 스텝 진입 직후부터 viewport 하단에 고정된다.
- 1차로 `slide-in-from-bottom-4`만 제거했을 때도 `animate-in`이 identity transform을 만들어 CTA 기준점을 바꾸는 것을 확인했고, 최종 수정에서는 `StepFrame`의 transform 유발 애니메이션 전체를 제거했다.
- 회귀 테스트와 브라우저 스모크로 선택형 스텝과 완료 화면의 CTA 위치를 확인했다.
```

- [ ] **Step 2: 문서 포맷을 확인한다**

Run:

```bash
bunx prettier --check docs/lesson-page.md docs/superpowers/plans/2026-05-27-lesson-cta-fixed-layout.md
```

Expected:

```text
All matched files use Prettier code style!
```

### Task 5: 최종 검증

**Files:**

- Read: `apps/web/src/features/lessons/lesson-experience.tsx`
- Read: `apps/web/src/features/lessons/lesson-experience.test.tsx`
- Read: `docs/lesson-page.md`

- [ ] **Step 1: 웹 테스트를 실행한다**

Run:

```bash
bun --filter @workspace/web test
```

Expected:

```text
Test Files  passed
Tests  passed
```

- [ ] **Step 2: 타입체크를 실행한다**

Run:

```bash
bun --filter @workspace/web typecheck
```

Expected:

```text
exit code 0
```

- [ ] **Step 3: 린트를 실행한다**

Run:

```bash
bun --filter @workspace/web lint
```

Expected:

```text
exit code 0
```

- [ ] **Step 4: 전체 포맷 검사를 실행한다**

Run:

```bash
bun run format:check
```

Expected:

```text
All matched files use Prettier code style!
```

- [ ] **Step 5: diff 공백 오류를 확인한다**

Run:

```bash
git diff --check
```

Expected:

```text
exit code 0
```

- [ ] **Step 6: 남은 프로세스를 확인한다**

PowerShell에서 실행한다.

```powershell
Get-NetTCPConnection -LocalPort 3210 -State Listen -ErrorAction SilentlyContinue
```

Expected:

```text
출력이 없어야 한다.
```

## Self-Review

- Spec coverage: 원인 조사에서 확인한 transform containing block 문제를 직접 제거하고, 선택형 스텝과 완료 화면을 브라우저로 확인한다.
- Placeholder scan: TBD, TODO, 나중에 처리 같은 미정 항목은 없다.
- Type consistency: 새 테스트는 기존 `LessonExperience` props와 `WritingAppApi` 타입을 그대로 사용한다.
