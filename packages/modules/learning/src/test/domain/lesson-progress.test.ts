import { describe, expect, it } from "vitest"

import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/ids"
import {
  learnerIdSchema,
  lessonStepItemIdSchema,
} from "@workspace/contracts/learning/ids"

import {
  createLearningAttempt,
  createLessonProgress,
} from "#learning/domain/lesson-progress"

describe("lesson progress entity와 submission value object", () => {
  it("progress와 중첩 submission을 immutable snapshot으로 만든다", () => {
    const selectedItemIds = [lessonStepItemIdSchema.parse("item-1")]
    const attempt = createLearningAttempt({
      learnerId: learnerIdSchema.parse("learner-1"),
      lessonId: lessonIdSchema.parse("lesson-1"),
      occurredAt: new Date("2026-07-22T15:00:00.000Z"),
      stepId: lessonStepIdSchema.parse("step-1"),
      submission: { selectedItemIds, type: "SELECT" },
    })
    const progress = createLessonProgress({
      currentStepId: lessonStepIdSchema.parse("step-1"),
      kind: "in-progress",
    })

    selectedItemIds.push(lessonStepItemIdSchema.parse("item-2"))

    expect(Object.isFrozen(attempt)).toBe(true)
    expect(Object.isFrozen(attempt.submission)).toBe(true)
    expect(attempt.submission).toMatchObject({ selectedItemIds: ["item-1"] })
    expect(Object.isFrozen(progress)).toBe(true)
  })
})
