import { describe, expect, it } from "vitest"

import { lessonStepDtoSchema } from "@workspace/contracts/content"
import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/content.ids"
import { learnerIdSchema } from "@workspace/contracts/learning/step-data"
import { aiFeedbackPayloadSchema } from "@workspace/contracts/ai-feedback"

import {
  decideFinalizeAiFeedback,
  decidePrepareAiFeedbackContext,
  decidePrepareAiFeedbackTarget,
  type FinalizeAiFeedbackSnapshot,
  type PrepareAiFeedbackTargetSnapshot,
} from "#core/modules/learning/domain/ai-feedback-transition-decision"

const command = {
  lessonId: lessonIdSchema.parse("lesson-1"),
  stepId: lessonStepIdSchema.parse("feedback-step"),
  userId: learnerIdSchema.parse("learner-1"),
}
const completeCommand = {
  ...command,
  attemptId: "attempt-1",
  feedback: aiFeedbackPayloadSchema.parse({
    improvements: ["개선점"],
    nextAction: "다음 행동",
    score: 0,
    scoreRange: [0, 100],
    showScore: false,
    strengths: ["강점"],
    summary: "요약",
  }),
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
  score: 80,
  scoreMax: 100,
  showScore: true,
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
        lessonTitle: "레슨 제목",
      })
    ).toEqual({
      kind: "ok",
      value: {
        answer: "저장된 답안",
        focus: "명확성",
        lessonTitle: "레슨 제목",
      },
    })
  })

  it("잠금·순서·잘못된 target·답안 부재를 명시적 오류로 거절한다", () => {
    expect(
      decidePrepareAiFeedbackTarget(command, {
        kind: "lesson-scope-missing",
        publishedLessonExists: true,
      })
    ).toMatchObject({ error: { kind: "lesson-locked" }, kind: "rejected" })
    expect(
      decidePrepareAiFeedbackTarget(command, {
        ...readySnapshot(),
        progress: {
          currentStepId: lessonStepIdSchema.parse("write-step"),
          kind: "in-progress",
        },
      })
    ).toMatchObject({
      error: { kind: "step-sequence-conflict" },
      kind: "rejected",
    })

    const invalidTargetSnapshot = readySnapshot()
    const invalidFeedbackStep = {
      ...feedbackStep,
      content: {
        ...feedbackStep.content,
        target: lessonStepIdSchema.parse("missing-step"),
      },
    }
    expect(
      decidePrepareAiFeedbackTarget(command, {
        ...invalidTargetSnapshot,
        steps: [writeStep, invalidFeedbackStep],
      })
    ).toMatchObject({
      error: {
        kind: "feedback-target-invalid",
        reason: "target-step-not-found",
      },
      kind: "rejected",
    })

    const target = decidePrepareAiFeedbackTarget(command, readySnapshot())
    if (target.kind === "rejected") throw new Error("target rejected")
    expect(
      decidePrepareAiFeedbackContext(command, target, {
        answer: null,
        lessonTitle: "레슨 제목",
      })
    ).toEqual({
      error: {
        kind: "feedback-answer-not-found",
        targetStepId: "write-step",
      },
      kind: "err",
    })
  })

  it("finalize를 진행·완료 replay·거절 분기로 결정한다", () => {
    expect(
      decideFinalizeAiFeedback(completeCommand, finalizableSnapshot())
    ).toEqual({ kind: "advance", requestedStepIndex: 1 })
    expect(
      decideFinalizeAiFeedback(completeCommand, {
        ...finalizableSnapshot(),
        progress: {
          currentStepId: lessonStepIdSchema.parse("feedback-step"),
          kind: "completed",
        },
      })
    ).toEqual({ kind: "replay-completed" })
    expect(
      decideFinalizeAiFeedback(completeCommand, {
        ...finalizableSnapshot(),
        attempt: "not-finalizable",
      })
    ).toMatchObject({ error: { kind: "invalid-request" }, kind: "rejected" })
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

function finalizableSnapshot(): Extract<
  FinalizeAiFeedbackSnapshot,
  { readonly kind: "lesson" }
> {
  const snapshot = readySnapshot()
  return {
    attempt: "finalizable",
    isUnlocked: snapshot.isUnlocked,
    kind: snapshot.kind,
    progress: snapshot.progress,
    steps: snapshot.steps,
  }
}
