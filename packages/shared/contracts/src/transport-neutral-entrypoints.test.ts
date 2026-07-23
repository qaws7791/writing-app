import { describe, expect, it } from "vitest"

import * as adminIdentityData from "#contracts/identity/data"
import { adminRoleSchema } from "#contracts/identity/admin-session"
import { adminUserDetailDtoSchema } from "#contracts/identity/admin-users"
import { lessonStepDtoSchema } from "#contracts/content/course"
import { learnerCourseSummarySchema } from "#contracts/learning/learner-content"
import { learnerProfileStatsDtoSchema } from "#contracts/learning/learner-read-model"
import { learnerStepSubmissionSchema } from "#contracts/learning/learner-transition"
import * as learnerReadData from "#contracts/learning/read-data"
import * as learnerStepData from "#contracts/learning/step-data"

describe("transport-neutral 공개 entrypoint", () => {
  it("기존 canonical schema를 복제하지 않고 직접 제공한다", () => {
    expect(learnerStepData.lessonStepDtoSchema).toBe(lessonStepDtoSchema)
    expect(learnerStepData.learnerStepSubmissionSchema).toBe(
      learnerStepSubmissionSchema
    )
    expect(learnerReadData.learnerCourseSummarySchema).toBe(
      learnerCourseSummarySchema
    )
    expect(learnerReadData.learnerProfileStatsDtoSchema).toBe(
      learnerProfileStatsDtoSchema
    )
    expect(adminIdentityData.adminUserDetailDtoSchema).toBe(
      adminUserDetailDtoSchema
    )
    expect(adminIdentityData.adminRoleSchema).toBe(adminRoleSchema)
  })

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
