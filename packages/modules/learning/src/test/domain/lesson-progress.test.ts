import { describe, expect, it } from "vitest"

import {
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/ids"
import {
  learnerIdSchema,
  lessonStepItemIdSchema,
} from "@workspace/contracts/learning/ids"

import { createLearningAttempt } from "#learning/domain/lesson-progress"

describe("lesson progress entity와 submission value object", () => {
  it("호출자 배열 변경이 기록된 submission을 오염시키지 않는다", () => {
    const selectedItemIds = [lessonStepItemIdSchema.parse("item-1")]
    const attempt = createLearningAttempt({
      learnerId: learnerIdSchema.parse("learner-1"),
      lessonId: lessonIdSchema.parse("lesson-1"),
      occurredAt: new Date("2026-07-22T15:00:00.000Z"),
      stepId: lessonStepIdSchema.parse("step-1"),
      submission: { selectedItemIds, type: "SELECT" },
    })
    selectedItemIds.push(lessonStepItemIdSchema.parse("item-2"))

    expect(attempt.submission).toMatchObject({ selectedItemIds: ["item-1"] })
  })
})
