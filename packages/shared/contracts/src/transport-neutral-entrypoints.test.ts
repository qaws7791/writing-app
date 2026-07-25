import { describe, expect, it } from "vitest"

import * as adminIdentityData from "#contracts/identity/data"
import * as learnerReadData from "#contracts/learning/read-data"
import * as learnerStepData from "#contracts/learning/step-data"

describe("transport-neutral 공개 entrypoint", () => {
  it("HTTP body, query, page, error와 SSE wire를 노출하지 않는다", () => {
    expect(
      hasAny(learnerStepData, [
        "completeLearnerStepBodySchema",
        "completeLearnerStepResultSchema",
        "learnerAiFeedbackTransitionResultSchema",
        "startLearnerLessonBodySchema",
      ])
    ).toBe(false)
    expect(
      hasAny(learnerReadData, [
        "createCursorPageSchema",
        "learnerCourseListQuerySchema",
        "learnerCoursePageSchema",
        "learnerProgressListQuerySchema",
        "learnerProgressPageSchema",
      ])
    ).toBe(false)
    expect(
      hasAny(adminIdentityData, [
        "adminDeleteUserResultSchema",
        "adminUpdateUserStatusRequestSchema",
        "adminUserListDtoSchema",
      ])
    ).toBe(false)
  })
})

function hasAny(entrypoint: object, names: readonly string[]): boolean {
  return names.some((name) => Object.hasOwn(entrypoint, name))
}
