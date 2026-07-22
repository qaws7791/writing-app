import { describe, expect, it } from "vitest"

import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/ids"

import {
  classifyLearningTransitionError,
  createAnswerRejectedFailure,
} from "#learning/domain/learning-error"

describe("learning expected failure union", () => {
  it("answer rejected, not-found, conflict와 invalid transition을 구분한다", () => {
    const lessonId = lessonIdSchema.parse("lesson-1")
    const stepId = lessonStepIdSchema.parse("step-1")

    expect(
      createAnswerRejectedFailure({ accepted: true, type: "WRITE" }).kind
    ).toBe("answer-rejected")
    expect(
      classifyLearningTransitionError({ kind: "lesson-not-found", lessonId })
    ).toEqual({ kind: "not-found", resource: "lesson" })
    expect(
      classifyLearningTransitionError({
        kind: "step-sequence-conflict",
        lessonId,
        stepId,
      })
    ).toEqual({ conflict: "step-sequence", kind: "conflict" })
    expect(
      classifyLearningTransitionError({ kind: "lesson-locked", lessonId })
    ).toEqual({ kind: "invalid-transition", reason: "lesson-locked" })
  })
})
