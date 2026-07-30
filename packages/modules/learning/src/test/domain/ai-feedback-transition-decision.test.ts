import { describe, expect, it } from "vitest"

import { lessonStepDtoSchema } from "@workspace/contracts/content/course"
import {
  courseIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/ids"
import {
  curriculumVersionIdSchema,
  learnerIdSchema,
} from "@workspace/contracts/learning/step-data"
import { err, ok } from "@workspace/kernel/result"

import {
  decideFinalizeAiFeedback,
  decidePrepareAiFeedbackContext,
  decidePrepareAiFeedbackTarget,
  type PrepareAiFeedbackTargetSnapshot,
} from "#learning/domain/ai-feedback-transition-decision"

const command = {
  lessonId: lessonIdSchema.parse("lesson-1"),
  stepId: lessonStepIdSchema.parse("feedback-step"),
  userId: learnerIdSchema.parse("learner-1"),
}
const completeCommand = {
  ...command,
  occurredAt: new Date("2026-07-17T00:00:00.000Z"),
}
const writeStep = {
  content: lessonStepDtoSchema.parse({
    id: "write-step",
    min: 1,
    prompt: "문장을 쓰세요.",
    sortOrder: 1,
    type: "WRITE",
  }),
  id: lessonStepIdSchema.parse("write-step"),
}
const feedbackStepContent = lessonStepDtoSchema.parse({
  allowRetry: true,
  feedback: "피드백",
  focus: "명확성",
  id: "feedback-step",
  sortOrder: 2,
  target: "write-step",
  type: "AI_FEEDBACK",
})
if (feedbackStepContent.type !== "AI_FEEDBACK") {
  throw new Error("AI feedback fixture type mismatch")
}
const feedbackStep = {
  content: feedbackStepContent,
  id: lessonStepIdSchema.parse("feedback-step"),
}

describe("AI 피드백 학습 전이 순수 결정", () => {
  it("준비 대상과 저장된 WRITE 답안으로 provider context를 만든다", () => {
    const target = decidePrepareAiFeedbackTarget(command, readySnapshot())

    expect(target).toEqual({
      focus: "명확성",
      kind: "load-context",
      targetStepId: "write-step",
    })
    if (target.kind === "rejected") throw new Error("target rejected")

    expect(
      decidePrepareAiFeedbackContext(command, target, {
        answer: { text: "저장된 답안", type: "WRITE" },
        courseId: courseIdSchema.parse("course-1"),
        curriculumVersionId: curriculumVersionIdSchema.parse("version-1"),
        lessonTitle: "레슨 제목",
      })
    ).toEqual(
      ok({
        answer: "저장된 답안",
        courseId: "course-1",
        curriculumVersionId: "version-1",
        focus: "명확성",
        lessonTitle: "레슨 제목",
      })
    )
  })

  it.each([
    {
      case: "lesson scope가 없으면",
      expectedError: { kind: "lesson-locked" },
      snapshot: {
        kind: "lesson-scope-missing" as const,
        publishedLessonExists: true,
      },
    },
    {
      case: "현재 step이 AI 피드백 step보다 앞이면",
      expectedError: { kind: "step-sequence-conflict" },
      snapshot: {
        ...readySnapshot(),
        progress: {
          currentStepId: lessonStepIdSchema.parse("write-step"),
          kind: "in-progress" as const,
        },
      },
    },
    {
      case: "target step이 레슨에 없으면",
      expectedError: {
        kind: "feedback-target-invalid",
        reason: "target-step-not-found",
      },
      snapshot: {
        ...readySnapshot(),
        steps: [
          writeStep,
          {
            ...feedbackStep,
            content: {
              ...feedbackStep.content,
              target: lessonStepIdSchema.parse("missing-step"),
            },
          },
        ],
      },
    },
  ])("$case 준비를 거절한다", ({ expectedError, snapshot }) => {
    expect(decidePrepareAiFeedbackTarget(command, snapshot)).toMatchObject({
      error: expectedError,
      kind: "rejected",
    })
  })

  it("저장된 WRITE 답안이 없으면 answer-not-found로 거절한다", () => {
    const target = decidePrepareAiFeedbackTarget(command, readySnapshot())
    if (target.kind === "rejected") throw new Error("target rejected")

    expect(
      decidePrepareAiFeedbackContext(command, target, {
        answer: null,
        courseId: courseIdSchema.parse("course-1"),
        curriculumVersionId: curriculumVersionIdSchema.parse("version-1"),
        lessonTitle: "레슨 제목",
      })
    ).toEqual(
      err({
        kind: "feedback-answer-not-found",
        targetStepId: "write-step",
      })
    )
  })

  it("finalize를 진행·완료 replay·거절 분기로 결정한다", () => {
    const advance = decideFinalizeAiFeedback(completeCommand, readySnapshot())
    expect(advance).toMatchObject({
      aggregate: { kind: "advance", requestedStepIndex: 1 },
      kind: "advance",
      requestedStepIndex: 1,
    })
    expect(
      decideFinalizeAiFeedback(completeCommand, {
        ...readySnapshot(),
        progress: {
          currentStepId: lessonStepIdSchema.parse("feedback-step"),
          kind: "completed",
        },
      })
    ).toMatchObject({
      aggregate: { kind: "replay-completed" },
      kind: "replay-completed",
    })
    expect(
      decideFinalizeAiFeedback(completeCommand, {
        ...readySnapshot(),
        isUnlocked: false,
      })
    ).toMatchObject({ error: { kind: "lesson-locked" }, kind: "rejected" })
  })
})

function readySnapshot(): Extract<
  PrepareAiFeedbackTargetSnapshot,
  { readonly kind: "lesson" }
> {
  return {
    isUnlocked: true,
    kind: "lesson",
    progress: {
      currentStepId: lessonStepIdSchema.parse("feedback-step"),
      kind: "in-progress",
    },
    steps: [writeStep, feedbackStep],
  }
}
