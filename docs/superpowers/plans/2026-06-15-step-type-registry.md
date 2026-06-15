# 스텝 타입 Registry 정리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** LOL-24에서 지적한 스텝 타입별 UI/진행 분기 중 중복 정책을 registry/definition으로 응집하고, core/API 계약 영역은 명시적으로 유지한다.

**Architecture:** 학습자 웹은 `LessonStep` 타입별 화면 정책을 `lesson-step-policy.ts`로 분리해 `LessonExperience`와 `LessonStepRenderer`가 같은 정책을 읽게 한다. 어드민은 폼 선택 switch를 typed mapping으로 바꾸되 알 수 없는 타입은 기존 `GenericStepForm` fallback을 유지한다. core DTO, OpenAPI, DB seed, 서버 answerable policy는 공개 계약이므로 이번 작업에서 registry 뒤로 숨기지 않는다.

**Tech Stack:** Bun 1.3.10, Node 24, TypeScript, React 19, Next.js 16, Vitest, Testing Library

---

## 파일 구조

- Create: `apps/web/src/features/lessons/lesson-step-policy.ts`
  - 학습자 레슨 진행 정책을 담당한다.
  - 제목, 설명, full-bleed 여부, CTA 문구, 제출 가능 여부, 채점 결과, 해설/오답 문구를 한 곳에서 제공한다.
- Create: `apps/web/src/features/lessons/lesson-step-policy.test.ts`
  - 새 policy 모듈의 타입별 동작을 고정한다.
- Modify: `apps/web/src/features/lessons/lesson-step-renderer.tsx`
  - `getStepTitle`, `getStepDescription`, standalone layout 조건을 policy 호출로 대체한다.
  - 콘텐츠 렌더링 JSX는 타입별 컴포넌트 narrowing이 필요하므로 이번 단계에서는 기존 구조를 유지한다.
- Modify: `apps/web/src/features/lessons/lesson-experience.tsx`
  - `getCanSubmit`, `isCheckStep`, `getCheckResult`, `getStepExplanation`, `getStepWrongText`, `getStepActionLabel`를 policy 호출로 대체한다.
- Modify: `apps/web/src/features/lessons/lesson-experience.test.tsx`
  - 기존 확인 흐름 테스트를 유지하고, CTA 문구/채점 정책이 policy 이동 후에도 유지되는지 필요한 최소 assertion만 보강한다.
- Modify: `apps/admin/src/features/courses/course-editor/step-form-registry.tsx`
  - switch를 `Partial<Record<EditorStep["type"], StepFormComponent>>` mapping으로 바꾼다.
- Modify: `apps/admin/src/features/courses/course-editor/course-editor-shell.test.tsx`
  - 10개 전용 폼 렌더링 회귀를 유지하고, fallback generic 폼이 깨지지 않는 테스트를 추가한다.
- Modify: `docs/linear-lol-24-step-type-registry-research.md`
  - 구현 완료 후 실제 변경 내용을 반영한다.
- Modify: `docs/codebase-improvement-progress.md`
  - 현재 코드에 없는 `step-definitions.ts` 완료 기록을 이번 registry 정리 결과에 맞춰 바로잡는다.

---

### Task 1: 학습자 스텝 정책 모듈 추가

**Files:**

- Create: `apps/web/src/features/lessons/lesson-step-policy.ts`
- Create: `apps/web/src/features/lessons/lesson-step-policy.test.ts`

- [ ] **Step 1: 실패하는 policy 테스트 작성**

Create `apps/web/src/features/lessons/lesson-step-policy.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import {
  getLessonStepActionLabel,
  getLessonStepCheckedResult,
  getLessonStepDescription,
  getLessonStepTitle,
  isLessonStepCheckable,
  isLessonStepStandalone,
  isLessonStepSubmittable,
} from "@/features/lessons/lesson-step-policy"
import type { LessonStepAnswerPayload } from "@/features/lessons/lesson-logic"
import type { LessonStep } from "@/features/lessons/lesson-types"

describe("lesson-step-policy", () => {
  it("읽기 스텝의 제목, 설명, standalone layout, CTA 정책을 반환한다", () => {
    const step: LessonStep = {
      body: "본문",
      guide: "읽기 안내",
      id: "reading-1",
      order: 1,
      title: "읽기 제목",
      type: "READING",
    }

    expect(getLessonStepTitle(step)).toBe("읽기 제목")
    expect(getLessonStepDescription(step)).toBe("읽기 안내")
    expect(getLessonStepActionLabel(step)).toBe("이해했어요")
    expect(isLessonStepStandalone(step)).toBe(true)
    expect(isLessonStepCheckable(step)).toBe(false)
    expect(isLessonStepSubmittable(step, undefined)).toBe(true)
  })

  it("객관식 스텝의 제출 가능 여부와 정답 확인 결과를 반환한다", () => {
    const step: LessonStep = {
      correct: "b",
      explanation: "정답 해설",
      id: "mc-1",
      options: [
        { id: "a", text: "A" },
        { id: "b", text: "B" },
      ],
      order: 1,
      question: "정답은?",
      type: "MULTIPLE_CHOICE",
      wrong: "오답 안내",
    }
    const emptyPayload: LessonStepAnswerPayload = {
      selectedOptionId: "",
      type: "MULTIPLE_CHOICE",
    }
    const correctPayload: LessonStepAnswerPayload = {
      selectedOptionId: "b",
      type: "MULTIPLE_CHOICE",
    }

    expect(getLessonStepTitle(step)).toBe("정답은?")
    expect(getLessonStepDescription(step)).toBe(
      "답을 선택하면 해설을 확인합니다."
    )
    expect(getLessonStepActionLabel(step)).toBe("확인하기")
    expect(isLessonStepStandalone(step)).toBe(true)
    expect(isLessonStepCheckable(step)).toBe(true)
    expect(isLessonStepSubmittable(step, emptyPayload)).toBe(false)
    expect(isLessonStepSubmittable(step, correctPayload)).toBe(true)
    expect(getLessonStepCheckedResult(step, correctPayload)).toBe("correct")
  })

  it("분류 스텝은 모든 item이 분류되어야 제출 가능하다", () => {
    const step: LessonStep = {
      categories: [{ id: "topic", label: "주제문" }],
      explanation: "분류 해설",
      guide: "문장을 분류하세요.",
      id: "categorize-1",
      items: [
        {
          categoryId: "topic",
          id: "item-1",
          text: "꾸준한 글쓰기는 사고를 정돈한다.",
        },
      ],
      order: 1,
      title: "문장 분류",
      type: "CATEGORIZE",
    }

    expect(isLessonStepCheckable(step)).toBe(false)
    expect(isLessonStepSubmittable(step, undefined)).toBe(false)
    expect(
      isLessonStepSubmittable(step, {
        items: [{ categoryId: "topic", itemId: "item-1" }],
        type: "CATEGORIZE",
      })
    ).toBe(true)
  })
})
```

- [ ] **Step 2: 실패 확인**

Run:

```powershell
bun --filter @workspace/web test -- src/features/lessons/lesson-step-policy.test.ts
```

Expected: FAIL. `Cannot find module '@/features/lessons/lesson-step-policy'` 또는 export 누락 오류가 나야 한다.

- [ ] **Step 3: policy 모듈 구현**

Create `apps/web/src/features/lessons/lesson-step-policy.ts`:

```ts
import type { LessonStepAnswerPayload } from "@/features/lessons/lesson-logic"
import type { LessonStep } from "@/features/lessons/lesson-types"

export type LessonStepCheckedState =
  | "correct"
  | "wrong"
  | {
      readonly explanation?: string
      readonly missed: readonly number[]
      readonly wrong: readonly number[]
    }

export function isLessonStepStandalone(step: LessonStep): boolean {
  return (
    step.type === "CATEGORIZE" ||
    step.type === "MATCH" ||
    step.type === "MULTIPLE_CHOICE" ||
    step.type === "READING" ||
    step.type === "WRITE"
  )
}

export function getLessonStepTitle(step: LessonStep): string {
  switch (step.type) {
    case "AI_FEEDBACK":
      return "AI 코칭"
    case "CATEGORIZE":
    case "COMPARE":
    case "MATCH":
    case "ORDER":
    case "READING":
      return step.title
    case "FILL_BLANK":
      return "빈칸 채우기"
    case "MULTIPLE_CHOICE":
    case "SELECT":
      return step.question
    case "WRITE":
      return step.title ?? "직접 써보기"
  }
}

export function getLessonStepDescription(step: LessonStep): string {
  switch (step.type) {
    case "AI_FEEDBACK":
      return step.focus
    case "CATEGORIZE":
    case "MATCH":
    case "READING":
    case "WRITE":
      return step.guide
    case "COMPARE":
      return step.analysis
    case "FILL_BLANK":
    case "ORDER":
    case "SELECT":
      return step.explanation
    case "MULTIPLE_CHOICE":
      return "답을 선택하면 해설을 확인합니다."
  }
}

export function isLessonStepSubmittable(
  step: LessonStep,
  payload: LessonStepAnswerPayload | undefined
): boolean {
  switch (step.type) {
    case "AI_FEEDBACK":
      return false
    case "CATEGORIZE":
      return (
        payload?.type === "CATEGORIZE" &&
        payload.items.length === step.items.length
      )
    case "FILL_BLANK":
      return (
        payload?.type === "FILL_BLANK" &&
        payload.selectedWords.filter(Boolean).length === step.answer.length
      )
    case "MATCH":
      return (
        payload?.type === "MATCH" &&
        payload.pairs.length === step.pairs.length &&
        payload.pairs.every((pair) => pair.right !== "")
      )
    case "MULTIPLE_CHOICE":
      return (
        payload?.type === "MULTIPLE_CHOICE" && payload.selectedOptionId !== ""
      )
    case "ORDER":
      return (
        payload?.type === "ORDER" &&
        payload.orderedItems.length === step.items.length
      )
    case "SELECT":
      return payload?.type === "SELECT" && payload.selectedIndexes.length > 0
    case "WRITE":
      return (
        payload?.type === "WRITE" && payload.text.length >= (step.min || 20)
      )
    case "COMPARE":
    case "READING":
      return true
  }
}

export function isLessonStepCheckable(step: LessonStep): boolean {
  return (
    step.type === "FILL_BLANK" ||
    step.type === "MATCH" ||
    step.type === "MULTIPLE_CHOICE" ||
    step.type === "ORDER" ||
    step.type === "SELECT"
  )
}

export function getLessonStepCheckedResult(
  step: LessonStep,
  payload: LessonStepAnswerPayload | undefined
): LessonStepCheckedState {
  switch (step.type) {
    case "FILL_BLANK":
      return payload?.type === "FILL_BLANK" &&
        JSON.stringify(payload.selectedWords) === JSON.stringify(step.answer)
        ? "correct"
        : "wrong"
    case "MATCH":
      return payload?.type === "MATCH" &&
        step.pairs.every((pair) =>
          payload.pairs.some(
            (selectedPair) =>
              selectedPair.left === pair.left &&
              selectedPair.right === pair.right
          )
        )
        ? "correct"
        : "wrong"
    case "MULTIPLE_CHOICE":
      return payload?.type === "MULTIPLE_CHOICE" &&
        payload.selectedOptionId === step.correct
        ? "correct"
        : "wrong"
    case "ORDER":
      return payload?.type === "ORDER" &&
        JSON.stringify(payload.orderedItems) === JSON.stringify(step.correct)
        ? "correct"
        : "wrong"
    case "SELECT": {
      const selected =
        payload?.type === "SELECT"
          ? new Set(payload.selectedIndexes)
          : new Set<number>()
      const correct = new Set(step.correct)
      const missed = [...correct].filter((index) => !selected.has(index))
      const wrong = [...selected].filter((index) => !correct.has(index))

      return {
        explanation: step.explanation,
        missed,
        wrong,
      }
    }
    default:
      return "correct"
  }
}

export function getLessonStepExplanation(step: LessonStep): string {
  switch (step.type) {
    case "CATEGORIZE":
    case "FILL_BLANK":
    case "MATCH":
    case "MULTIPLE_CHOICE":
    case "ORDER":
    case "SELECT":
      return step.explanation
    case "AI_FEEDBACK":
    case "COMPARE":
    case "READING":
    case "WRITE":
      return ""
  }
}

export function getLessonStepWrongText(step: LessonStep): string | undefined {
  return step.type === "MULTIPLE_CHOICE" ? step.wrong : undefined
}

export function getLessonStepActionLabel(step: LessonStep): string {
  if (step.type === "READING" || step.type === "COMPARE") {
    return "이해했어요"
  }

  if (isLessonStepCheckable(step)) {
    return "확인하기"
  }

  return "다음으로 →"
}
```

- [ ] **Step 4: policy 테스트 통과 확인**

Run:

```powershell
bun --filter @workspace/web test -- src/features/lessons/lesson-step-policy.test.ts
```

Expected: PASS.

---

### Task 2: 학습자 화면에서 policy 사용

**Files:**

- Modify: `apps/web/src/features/lessons/lesson-step-renderer.tsx`
- Modify: `apps/web/src/features/lessons/lesson-experience.tsx`
- Modify: `apps/web/src/features/lessons/lesson-experience.test.tsx`

- [ ] **Step 1: 기존 회귀 테스트 실행**

Run:

```powershell
bun --filter @workspace/web test -- src/features/lessons/lesson-step-renderer.test.tsx src/features/lessons/lesson-experience.test.tsx
```

Expected: PASS. 이 단계에서 실패하면 refactor 전에 원인을 먼저 분리한다.

- [ ] **Step 2: renderer의 제목/설명/layout 정책을 교체**

Modify imports in `apps/web/src/features/lessons/lesson-step-renderer.tsx`:

```ts
import {
  getLessonStepDescription,
  getLessonStepTitle,
  isLessonStepStandalone,
} from "@/features/lessons/lesson-step-policy"
```

Replace the standalone condition in `LessonStepRenderer`:

```ts
if (isLessonStepStandalone(step)) {
  return renderStepContent(step, {
    checked,
    onAiFeedbackRequest,
    onAnswerChange,
    onAnswerPayloadChange,
  })
}
```

Replace title/description calls:

```tsx
          <CardTitle as="h1" id={headingId}>
            {getLessonStepTitle(step)}
          </CardTitle>
          <CardDescription>{getLessonStepDescription(step)}</CardDescription>
```

Delete local `getStepTitle` and `getStepDescription` from `lesson-step-renderer.tsx`.

- [ ] **Step 3: experience의 진행/채점 정책을 교체**

Modify imports in `apps/web/src/features/lessons/lesson-experience.tsx`:

```ts
import {
  getLessonStepActionLabel,
  getLessonStepCheckedResult,
  getLessonStepExplanation,
  getLessonStepWrongText,
  isLessonStepCheckable,
  isLessonStepSubmittable,
} from "@/features/lessons/lesson-step-policy"
```

Replace call sites:

```ts
const canSubmit = currentStep
  ? isLessonStepSubmittable(currentStep, answerPayloadByStepId[currentStep.id])
  : false
```

```ts
if (isLessonStepCheckable(currentStep)) {
  setChecked(
    getLessonStepCheckedResult(
      currentStep,
      answerPayloadByStepId[currentStep.id]
    )
  )
  return
}
```

```ts
body: getLessonStepWrongText(step) ??
  getLessonStepExplanation(step) ??
  "다시 생각해보세요."
```

```tsx
{
  getLessonStepActionLabel(currentStep)
}
```

Delete local `getCanSubmit`, `isCheckStep`, `getCheckResult`, `getStepExplanation`, `getStepWrongText`, `getStepActionLabel` after all call sites are replaced.

- [ ] **Step 4: 필요한 import/type 오류 정리**

Run:

```powershell
bun --filter @workspace/web typecheck
```

Expected: PASS. If TypeScript reports unused imports from deleted helpers, remove only those imports.

- [ ] **Step 5: 웹 회귀 테스트 실행**

Run:

```powershell
bun --filter @workspace/web test -- src/features/lessons/lesson-step-policy.test.ts src/features/lessons/lesson-step-renderer.test.tsx src/features/lessons/lesson-experience.test.tsx
```

Expected: PASS.

---

### Task 3: 어드민 step form registry를 mapping으로 전환

**Files:**

- Modify: `apps/admin/src/features/courses/course-editor/step-form-registry.tsx`
- Modify: `apps/admin/src/features/courses/course-editor/course-editor-shell.test.tsx`

- [ ] **Step 1: fallback 회귀 테스트 추가**

Append to `describe("CourseEditorShell", ...)` in `apps/admin/src/features/courses/course-editor/course-editor-shell.test.tsx`:

```tsx
it("전용 폼이 없는 스텝 타입은 generic content JSON 폼으로 렌더링한다", () => {
  const courseWithUnknownStep: AdminCourseDetailDto = {
    ...course,
    units: [
      {
        ...course.units[0],
        lessons: [
          {
            ...course.units[0]!.lessons[0]!,
            steps: [
              step("s99", "VOICE_RECOGNITION", {
                prompt: "문장을 읽어보세요.",
              }),
            ],
          },
        ],
      },
    ],
  }

  render(<CourseEditorShell course={courseWithUnknownStep} />)

  expect(screen.getByText("VOICE_RECOGNITION")).toBeVisible()
  expect(screen.getByText("content JSON")).toBeVisible()
  expect(
    screen.getByDisplayValue('{"prompt":"문장을 읽어보세요."}')
  ).toBeVisible()
})
```

- [ ] **Step 2: 실패 확인**

Run:

```powershell
bun --filter @workspace/admin test -- src/features/courses/course-editor/course-editor-shell.test.tsx
```

Expected: PASS일 수 있다. 현재 switch의 `default`가 이미 fallback을 제공하기 때문이다. 이 테스트는 refactor 중 fallback 보존을 고정하는 characterization test다.

- [ ] **Step 3: switch를 typed mapping으로 교체**

Modify `apps/admin/src/features/courses/course-editor/step-form-registry.tsx`:

```tsx
type StepFormComponent = (props: {
  readonly step: EditorStep
}) => React.ReactNode

const stepFormByType = {
  AI_FEEDBACK: AiFeedbackStepForm,
  CATEGORIZE: CategorizeStepForm,
  COMPARE: CompareStepForm,
  FILL_BLANK: FillBlankStepForm,
  MATCH: MatchStepForm,
  MULTIPLE_CHOICE: MultipleChoiceStepForm,
  ORDER: OrderStepForm,
  READING: ReadingStepForm,
  SELECT: SelectStepForm,
  WRITE: WriteStepForm,
} satisfies Partial<Record<EditorStep["type"], StepFormComponent>>

export function renderStepForm(step: EditorStep) {
  const StepForm = stepFormByType[step.type] ?? GenericStepForm

  return <StepForm step={step} />
}
```

Keep `GenericStepForm`, `readStepContent`, and `StepFormShell` unchanged.

- [ ] **Step 4: 어드민 테스트와 타입체크 실행**

Run:

```powershell
bun --filter @workspace/admin test -- src/features/courses/course-editor/course-editor-shell.test.tsx
bun --filter @workspace/admin typecheck
```

Expected: both PASS.

---

### Task 4: 문서 정리

**Files:**

- Modify: `docs/linear-lol-24-step-type-registry-research.md`
- Modify: `docs/codebase-improvement-progress.md`

- [ ] **Step 1: LOL-24 조사 문서에 구현 계획/결과 반영**

Append to `docs/linear-lol-24-step-type-registry-research.md`:

```md
## 2026-06-15 실행 계획

- 학습자 웹의 제목, 설명, standalone layout, 제출 가능 여부, 채점, CTA 문구 정책을 `lesson-step-policy.ts`로 분리한다.
- `LessonStepRenderer`는 layout/title/description 정책을 policy에서 읽고, 타입별 JSX content는 기존 컴포넌트 구조를 유지한다.
- `LessonExperience`는 진행 가능 여부와 채점 정책을 policy에서 읽는다.
- 어드민 `step-form-registry.tsx`는 switch 대신 typed mapping을 사용하고, 전용 폼이 없는 타입은 `GenericStepForm`으로 표시한다.
- core DTO, OpenAPI, DB seed, 서버 answerable policy는 공개 계약이므로 이번 작업에서 자동 registry로 숨기지 않는다.
```

- [ ] **Step 2: 기존 progress 문서 불일치 수정**

In `docs/codebase-improvement-progress.md`, replace the DOMAIN-02 completion line that mentions missing `step-definitions.ts` with:

```md
- 완료 내용: 어드민 스텝 폼 선택은 `step-form-registry.tsx`로 모았고, LOL-24 후속 작업에서 mapping 기반 registry와 fallback generic form으로 다시 정리한다. 현재 코드에는 별도 `step-definitions.ts` 파일이 없으므로 이 문서는 실제 구조를 기준으로 유지한다.
```

- [ ] **Step 3: 문서 diff 확인**

Run:

```powershell
git diff -- docs/linear-lol-24-step-type-registry-research.md docs/codebase-improvement-progress.md
```

Expected: 문서 변경이 LOL-24 계획/결과와 기존 불일치 수정에만 한정된다.

---

### Task 5: 최종 검증

**Files:**

- Verify only

- [ ] **Step 1: 웹 전체 검증**

Run:

```powershell
bun --filter @workspace/web test
bun --filter @workspace/web typecheck
bun --filter @workspace/web lint
```

Expected: all PASS.

- [ ] **Step 2: 어드민 전체 검증**

Run:

```powershell
bun --filter @workspace/admin test
bun --filter @workspace/admin typecheck
bun --filter @workspace/admin lint
```

Expected: all PASS.

- [ ] **Step 3: 가능한 경우 pre-commit 검증**

Run:

```powershell
bun lefthook run pre-commit
```

Expected: PASS. 환경 시간이 과도하게 걸리거나 외부 상태 때문에 실패하면, 실패한 hook 이름과 로그의 핵심 원인을 최종 보고에 남긴다.

- [ ] **Step 4: 작업 범위 확인**

Run:

```powershell
git status --short
git diff --stat
```

Expected: 변경 파일은 이 계획에 적힌 웹/어드민/문서 파일로 제한된다. 기존에 있던 `.gitignore` 변경은 이 작업의 변경으로 포함하지 않는다.

---

## Self-Review

- Spec coverage: LOL-24의 핵심인 학습자 렌더러와 어드민 폼 선택 분기를 다룬다. 새 스텝 타입 추가 시 반드시 바뀌어야 하는 core/API/server 계약은 명시적으로 범위 제외했다.
- Placeholder scan: 이 계획에는 `TBD`, `TODO`, `implement later` 지시가 없다. 각 코드 변경 단계는 실제 파일 경로, 코드 조각, 검증 명령을 포함한다.
- Type consistency: policy 함수는 `LessonStep`과 `LessonStepAnswerPayload`를 입력으로 받고, 기존 `LessonExperience` helper의 반환 형태와 맞춘다. 어드민 mapping은 `EditorStep["type"]`와 현재 fallback UX를 유지한다.
