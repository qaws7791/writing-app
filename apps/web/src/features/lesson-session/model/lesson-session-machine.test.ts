import { describe, expect, it } from "vitest"

import {
  createLessonSessionState,
  transitionLessonSession,
  type LessonSessionState,
} from "@/features/lesson-session/model/lesson-session-machine"
import { learnerCompleteStepResponseSchema } from "@workspace/contracts/learning/learner-api"
import {
  learnerStepSubmissionSchema,
  stepEvaluationSchema,
} from "@workspace/contracts/learning/learner-transition"

describe("lesson session machine", () => {
  it("제출 실패는 현재 step과 입력을 보존한다", () => {
    const failed = transitionLessonSession(createSubmittingSession(), {
      message: "제출을 완료하지 못했습니다.",
      type: "SUBMIT_FAILED",
    })

    expect(failed).toMatchObject({
      activity: "idle",
      answerPayloads: {
        "step-1": { selectedOptionId: "option-1", type: "MULTIPLE_CHOICE" },
      },
      currentStepIndex: 0,
      status: "active",
      submitError: "제출을 완료하지 못했습니다.",
    })
  })

  it("오답 결과는 현재 step에 머문다", () => {
    const retry = transitionLessonSession(createSubmittingSession(), {
      evaluation: createIncorrectEvaluation(),
      type: "STEP_RETRY",
    })

    expect(retry).toMatchObject({
      activity: "idle",
      currentStepIndex: 0,
      status: "active",
    })
  })

  it("계속하기는 server가 반환한 다음 step index를 적용한다", () => {
    const accepted = transitionLessonSession(
      createLessonSessionState(7, true),
      { transition: createAdvancedTransitionFixture(), type: "STEP_ACCEPTED" }
    )
    const continued = transitionLessonSession(accepted, {
      type: "ACCEPTED_CONTINUE_REQUESTED",
    })

    expect(continued).toMatchObject({
      currentStepIndex: 3,
      progressPercent: 50,
      status: "active",
    })
  })

  it("완료 계속하기는 server의 완료 결과를 세션 완료 상태에 보존한다", () => {
    const completion = createLessonCompletedTransitionFixture()
    const accepted = transitionLessonSession(
      createLessonSessionState(1, true),
      { transition: completion, type: "STEP_ACCEPTED" }
    )
    const completed = transitionLessonSession(accepted, {
      type: "ACCEPTED_CONTINUE_REQUESTED",
    })

    expect(completed).toEqual({
      completion,
      currentStepIndex: 1,
      status: "complete",
    })
  })
})

function createSubmittingSession(): LessonSessionState {
  const active = transitionLessonSession(createLessonSessionState(0, true), {
    payload: learnerStepSubmissionSchema.parse({
      selectedOptionId: "option-1",
      type: "MULTIPLE_CHOICE",
    }),
    stepId: "step-1",
    type: "ANSWER_PAYLOAD_CHANGED",
  })

  return transitionLessonSession(active, { type: "SUBMIT_REQUESTED" })
}

function createIncorrectEvaluation() {
  return stepEvaluationSchema.parse({
    correct: false,
    correctItemIds: ["option-2"],
    explanation: "다시 시도하세요.",
    items: [
      { id: "option-1", verdict: "incorrect" },
      { id: "option-2", verdict: "missed" },
    ],
    type: "MULTIPLE_CHOICE",
  })
}

function createAdvancedTransitionFixture() {
  const transition = learnerCompleteStepResponseSchema.parse({
    evaluation: null,
    learning: {
      completedSteps: 2,
      currentStepId: "step-4",
      currentStepIndex: 3,
      progressPercent: 50,
      status: "in_progress",
      totalSteps: 4,
      version: { curriculumVersionId: "version-1", revision: 1 },
    },
    status: "advanced",
  })

  if (transition.status === "retry") {
    throw new Error("advanced 전이 fixture가 필요합니다.")
  }

  return transition
}

function createLessonCompletedTransitionFixture() {
  const completedAt = "2026-08-10T00:00:00.000Z"
  const transition = learnerCompleteStepResponseSchema.parse({
    courseLearning: {
      completedAt,
      completedLessons: 1,
      lastActivityAt: completedAt,
      nextLesson: null,
      progressPercent: 100,
      status: "completed",
      totalLessons: 1,
      version: { curriculumVersionId: "version-1", revision: 1 },
    },
    evaluation: null,
    lessonCompletion: { completedAt, totalSteps: 2 },
    status: "lesson_completed",
  })

  if (transition.status !== "lesson_completed") {
    throw new Error("lesson_completed 전이 fixture가 필요합니다.")
  }

  return transition
}
