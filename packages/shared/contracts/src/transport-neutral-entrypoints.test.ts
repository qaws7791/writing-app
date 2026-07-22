import { describe, expect, it } from "vitest"

import * as adminAiChatData from "#contracts/operations/ai-chat-data"
import * as adminContentData from "#contracts/content/admin-data"
import * as adminDashboardAnalyticsData from "#contracts/operations/dashboard-analytics-data"
import * as adminIdentityData from "#contracts/identity/data"
import * as adminResourceLibraryData from "#contracts/resource-library/data"
import * as adminSettingsData from "#contracts/operations/settings-data"
import { adminAiChatMessageDtoSchema } from "#contracts/operations/admin-ai-chat"
import { adminCourseEditorDocumentSchema } from "#contracts/content/admin-courses"
import { adminDashboardDtoSchema } from "#contracts/operations/admin-dashboard"
import { adminRoleSchema } from "#contracts/identity/admin-session"
import { adminSettingsDtoSchema } from "#contracts/operations/admin-settings"
import { adminUserDetailDtoSchema } from "#contracts/identity/admin-users"
import { adminResourceDocumentDtoSchema } from "#contracts/resource-library/admin-resource-documents"
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
    expect(adminContentData.adminCourseEditorDocumentSchema).toBe(
      adminCourseEditorDocumentSchema
    )
    expect(adminIdentityData.adminUserDetailDtoSchema).toBe(
      adminUserDetailDtoSchema
    )
    expect(adminIdentityData.adminRoleSchema).toBe(adminRoleSchema)
    expect(adminDashboardAnalyticsData.adminDashboardDtoSchema).toBe(
      adminDashboardDtoSchema
    )
    expect(adminSettingsData.adminSettingsDtoSchema).toBe(
      adminSettingsDtoSchema
    )
    expect(adminAiChatData.adminAiChatMessageDtoSchema).toBe(
      adminAiChatMessageDtoSchema
    )
    expect(adminResourceLibraryData.adminResourceDocumentDtoSchema).toBe(
      adminResourceDocumentDtoSchema
    )
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
      hasAny(adminContentData, [
        "adminArchiveCourseResultSchema",
        "adminCourseListDtoSchema",
      ])
    ).toBe(false)
    expect(
      hasAny(adminIdentityData, [
        "adminDeleteUserResultSchema",
        "adminUpdateUserStatusRequestSchema",
        "adminUserListDtoSchema",
      ])
    ).toBe(false)
    expect(
      hasAny(adminDashboardAnalyticsData, ["adminLessonAnalyticsPageDtoSchema"])
    ).toBe(false)
    expect(
      hasAny(adminSettingsData, [
        "adminLegalSettingsRequestSchema",
        "adminNoticeSettingsRequestSchema",
      ])
    ).toBe(false)
    expect(
      hasAny(adminAiChatData, [
        "adminAiChatConversationDetailDtoSchema",
        "adminAiChatConversationListDtoSchema",
        "adminAiChatMessageRequestSchema",
        "adminAiChatStreamEventSchema",
      ])
    ).toBe(false)
    expect(
      hasAny(adminResourceLibraryData, [
        "adminCreateResourceNodeRequestSchema",
        "adminImportResourceDocumentRequestSchema",
        "adminResourceSearchDtoSchema",
        "adminResourceTreeDtoSchema",
        "adminSaveResourceDocumentRequestSchema",
      ])
    ).toBe(false)
  })
})

function hasAny(entrypoint: object, names: readonly string[]): boolean {
  return names.some((name) => Object.hasOwn(entrypoint, name))
}
