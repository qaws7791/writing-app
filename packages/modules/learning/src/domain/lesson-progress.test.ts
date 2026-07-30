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
import type { LearnerStepSubmission } from "#learning/domain/learning-types"

describe("lesson progress entity와 submission value object", () => {
  it("호출자 배열 변경이 기록된 SELECT submission을 오염시키지 않는다", () => {
    const selectedItemIds = [lessonStepItemIdSchema.parse("item-1")]
    const attempt = anAttempt({ selectedItemIds, type: "SELECT" })

    selectedItemIds.push(lessonStepItemIdSchema.parse("item-2"))

    expect(attempt.submission).toMatchObject({ selectedItemIds: ["item-1"] })
  })

  it("호출자의 MATCH pair 객체 변경이 기록된 submission을 오염시키지 않는다", () => {
    const pair = {
      leftItemId: lessonStepItemIdSchema.parse("left-1"),
      rightItemId: lessonStepItemIdSchema.parse("right-1"),
    }
    const attempt = anAttempt({ pairs: [pair], type: "MATCH" })

    pair.rightItemId = lessonStepItemIdSchema.parse("right-2")

    expect(attempt.submission).toMatchObject({
      pairs: [{ leftItemId: "left-1", rightItemId: "right-1" }],
    })
  })

  it("호출자의 CATEGORIZE assignment 객체 변경이 기록된 submission을 오염시키지 않는다", () => {
    const assignment = {
      categoryId: lessonStepItemIdSchema.parse("category-1"),
      itemId: lessonStepItemIdSchema.parse("item-1"),
    }
    const attempt = anAttempt({ assignments: [assignment], type: "CATEGORIZE" })

    assignment.categoryId = lessonStepItemIdSchema.parse("category-2")

    expect(attempt.submission).toMatchObject({
      assignments: [{ categoryId: "category-1", itemId: "item-1" }],
    })
  })
})

function anAttempt(submission: LearnerStepSubmission) {
  return createLearningAttempt({
    learnerId: learnerIdSchema.parse("learner-1"),
    lessonId: lessonIdSchema.parse("lesson-1"),
    occurredAt: new Date("2026-07-22T15:00:00.000Z"),
    stepId: lessonStepIdSchema.parse("step-1"),
    submission,
  })
}
