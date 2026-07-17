import { describe, expect, it } from "vitest"

import * as adminAiChatData from "@workspace/contracts/admin/ai-chat-data"
import * as adminContentData from "@workspace/contracts/admin/content-data"
import * as adminDashboardAnalyticsData from "@workspace/contracts/admin/dashboard-analytics-data"
import * as adminIdentityData from "@workspace/contracts/admin/identity-data"
import * as adminResourceLibraryData from "@workspace/contracts/admin/resource-library-data"
import * as adminSettingsData from "@workspace/contracts/admin/settings-data"
import { adminAiChatMessageDtoSchema } from "@workspace/contracts/admin/admin-ai-chat"
import { adminCourseEditorDocumentSchema } from "@workspace/contracts/admin/admin-courses"
import { adminDashboardDtoSchema } from "@workspace/contracts/admin/admin-dashboard"
import { adminRoleSchema } from "@workspace/contracts/admin/admin-session"
import { adminSettingsDtoSchema } from "@workspace/contracts/admin/admin-settings"
import { adminUserDetailDtoSchema } from "@workspace/contracts/admin/admin-users"
import { adminResourceDocumentDtoSchema } from "@workspace/contracts/admin/admin-resource-documents"
import { lessonStepDtoSchema } from "@workspace/contracts/content"
import { learnerCourseSummarySchema } from "@workspace/contracts/learning/learner-content"
import { learnerProfileStatsDtoSchema } from "@workspace/contracts/learning/learner-read-model"
import { learnerStepSubmissionSchema } from "@workspace/contracts/learning/learner-transition"
import * as learnerReadData from "@workspace/contracts/learning/read-data"
import * as learnerStepData from "@workspace/contracts/learning/step-data"

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
