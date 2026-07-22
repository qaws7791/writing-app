import { describe, expect, it } from "vitest"

import {
  createLessonSessionState,
  transitionLessonSession,
} from "@/features/lesson-session/model/lesson-session-machine"
import { learnerCompleteStepResponseSchema } from "@workspace/contracts/learning/learner-api"
import {
  learnerStepSubmissionSchema,
  stepEvaluationSchema,
} from "@workspace/contracts/learning/learner-transition"

describe("lesson session machine", () => {
  it("서버 retry 평가에서는 index를 유지한다", () => {
    const active = transitionLessonSession(createLessonSessionState(0, true), {
      payload: learnerStepSubmissionSchema.parse({
        selectedOptionId: "option-1",
        type: "MULTIPLE_CHOICE",
      }),
      stepId: "step-1",
      type: "ANSWER_PAYLOAD_CHANGED",
    })
    const submitting = transitionLessonSession(active, {
      type: "SUBMIT_REQUESTED",
    })
    const retry = transitionLessonSession(submitting, {
      evaluation: stepEvaluationSchema.parse({
        correct: false,
        correctItemIds: ["option-2"],
        explanation: "다시 시도하세요.",
        items: [
          { id: "option-1", verdict: "incorrect" },
          { id: "option-2", verdict: "missed" },
        ],
        type: "MULTIPLE_CHOICE",
      }),
      type: "STEP_RETRY",
    })

    expect(retry).toMatchObject({ currentStepIndex: 0, status: "active" })

    const retryEditing = transitionLessonSession(retry, {
      stepId: "step-1",
      type: "RETRY_EDIT_REQUESTED",
    })

    expect(retryEditing).toMatchObject({
      answerPayloads: {},
      checked: false,
      currentStepIndex: 0,
      status: "active",
    })
  })

  it("accepted 전이를 확인한 뒤 서버가 준 index로 이동한다", () => {
    const transition = learnerCompleteStepResponseSchema.parse({
      evaluation: null,
      learning: {
        completedSteps: 1,
        currentStepId: "step-2",
        currentStepIndex: 1,
        progressPercent: 50,
        status: "in_progress",
        totalSteps: 2,
        version: { curriculumVersionId: "version-1", revision: 1 },
      },
      status: "advanced",
    })
    if (transition.status === "retry") throw new Error("advanced가 필요합니다.")
    const accepted = transitionLessonSession(
      createLessonSessionState(0, true),
      { transition, type: "STEP_ACCEPTED" }
    )
    const continued = transitionLessonSession(accepted, {
      type: "ACCEPTED_CONTINUE_REQUESTED",
    })

    expect(continued).toMatchObject({ currentStepIndex: 1, status: "active" })
  })
})
