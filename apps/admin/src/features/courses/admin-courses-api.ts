import type { AdminHttpTransport } from "@/lib/api/admin-http-transport"
import type { AdminApiResult } from "@/lib/api/api-result"
import {
  adminArchiveCourseResultSchema,
  adminCourseDetailDtoSchema,
  adminCourseEditorDocumentSchema,
  adminCourseListDtoSchema,
  adminPublishCourseResultSchema,
  type AdminCourseDetailDto,
  type AdminCourseEditorDocument,
  type AdminCourseListDto,
  type AdminPublishCourseResult,
} from "@workspace/contracts/admin"

export type AdminCourseStatus = "active" | "archived"
export type ReadAdminCoursesInput = {
  readonly category: string
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly status: "all" | AdminCourseStatus
}
export type AdminCourseDetail = AdminCourseEditorDocument
export type AdminCreatedCourse = AdminCourseDetailDto
export const adminCourseEditorSchema = adminCourseEditorDocumentSchema
export type AdminCourseListItem = {
  readonly category: string
  readonly id: string
  readonly lessonCount: number
  readonly revision: number
  readonly status: AdminCourseStatus
  readonly title: string
  readonly unitCount: number
  readonly visualKey:
    | "basic-sentence-writing"
    | "creative-writing"
    | "essay-writing"
    | "expression"
    | "grammar-complete"
}
export type AdminCourseList = {
  readonly items: readonly AdminCourseListItem[]
  readonly pagination: AdminCourseListDto["pagination"]
}
export type AdminArchiveCourseResult = { readonly archived: true }
export type AdminCoursePublishResult = AdminPublishCourseResult
export type AdminCoursesApi = {
  readonly archiveCourse: (
    courseId: string
  ) => Promise<AdminApiResult<AdminArchiveCourseResult>>
  readonly createCourse: () => Promise<AdminApiResult<AdminCreatedCourse>>
  readonly getCourseEditor: (
    courseId: string
  ) => Promise<AdminApiResult<AdminCourseDetail>>
  readonly getCourses: (
    input: ReadAdminCoursesInput
  ) => Promise<AdminApiResult<AdminCourseList>>
  readonly saveCourseEditor: (
    courseId: string,
    document: AdminCourseEditorDocument
  ) => Promise<AdminApiResult<AdminCourseEditorDocument>>
  readonly publishCourse: (
    courseId: string,
    document: AdminCourseEditorDocument
  ) => Promise<AdminApiResult<AdminCoursePublishResult>>
}

export function createAdminCoursesApi(
  transport: AdminHttpTransport
): AdminCoursesApi {
  return {
    archiveCourse: (courseId) =>
      transport.requestJson({
        method: "DELETE",
        path: `/courses/${courseId}`,
        schema: adminArchiveCourseResultSchema,
      }),
    createCourse: () =>
      transport.requestJson({
        method: "POST",
        path: "/courses",
        schema: adminCourseDetailDtoSchema,
      }),
    getCourseEditor: (courseId) =>
      transport.requestJson({
        method: "GET",
        path: `/courses/${courseId}/editor`,
        schema: adminCourseEditorDocumentSchema,
      }),
    async getCourses(input) {
      const params = new URLSearchParams()
      params.set("category", input.category)
      params.set("page", String(input.page))
      params.set("pageSize", String(input.pageSize))
      params.set("query", input.query)
      params.set("status", input.status)
      const result = await transport.requestJson({
        method: "GET",
        path: `/courses?${params.toString()}`,
        schema: adminCourseListDtoSchema,
      })
      return result.status === "error"
        ? result
        : {
            status: "ok",
            value: {
              items: result.value.items.map((item) => ({ ...item })),
              pagination: { ...result.value.pagination },
            },
          }
    },
    saveCourseEditor: (courseId, document) =>
      transport.requestJson({
        body: document,
        headers: { "If-Match": `"${document.editVersion}"` },
        method: "PUT",
        path: `/courses/${courseId}/editor`,
        schema: adminCourseEditorDocumentSchema,
      }),
    publishCourse: (courseId, document) =>
      transport.requestJson({
        headers: { "If-Match": `"${document.editVersion}"` },
        method: "POST",
        path: `/courses/${courseId}/publish`,
        schema: adminPublishCourseResultSchema,
      }),
  }
}
