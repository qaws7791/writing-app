import {
  adminCourseEditorDocumentSchema,
  adminPublishCourseResultSchema,
} from "@workspace/contracts/admin"

import type { CourseId } from "@/entities/course/model/course-id"
import type {
  AdminCourseDetail,
  AdminCoursePublishResult,
} from "@/features/course-editor/model/admin-course-editor"
import type { AdminHttpTransport } from "@/shared/http/admin-http-transport"
import type { AdminApiResult } from "@/shared/http/admin-api-result"

export type AdminCourseEditorApi = {
  readonly getCourseEditor: (
    courseId: CourseId
  ) => Promise<AdminApiResult<AdminCourseDetail>>
  readonly saveCourseEditor: (
    courseId: CourseId,
    document: AdminCourseDetail
  ) => Promise<AdminApiResult<AdminCourseDetail>>
  readonly publishCourse: (
    courseId: CourseId,
    document: AdminCourseDetail
  ) => Promise<AdminApiResult<AdminCoursePublishResult>>
}

export function createAdminCourseEditorApi(
  transport: AdminHttpTransport
): AdminCourseEditorApi {
  return {
    getCourseEditor: (courseId) =>
      transport.requestJson({
        method: "GET",
        path: `/api/admin/courses/${courseId}/editor`,
        schema: adminCourseEditorDocumentSchema,
      }),
    saveCourseEditor: (courseId, document) =>
      transport.requestJson({
        body: document,
        headers: { "If-Match": `"${document.editVersion}"` },
        method: "PUT",
        path: `/api/admin/courses/${courseId}/editor`,
        schema: adminCourseEditorDocumentSchema,
      }),
    publishCourse: (courseId, document) =>
      transport.requestJson({
        headers: { "If-Match": `"${document.editVersion}"` },
        method: "POST",
        path: `/api/admin/courses/${courseId}/publish`,
        schema: adminPublishCourseResultSchema,
      }),
  }
}
