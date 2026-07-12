import type { AdminHttpTransport } from "@/lib/api/admin-http-transport"
import type { AdminApiResult } from "@/lib/api/api-result"
import {
  adminArchiveCourseResultSchema,
  adminCourseDetailDtoSchema,
  adminCourseListDtoSchema,
  type AdminCourseDetailDto,
  type AdminCourseListDto,
} from "@workspace/contracts/admin"

export type AdminCourseStatus = "active" | "archived"
export type ReadAdminCoursesInput = {
  readonly category: string
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly status: "all" | AdminCourseStatus
}
export type AdminCourseStep = {
  readonly contentJson: string
  readonly id: string
  readonly sortOrder: number
  readonly status: AdminCourseStatus
  readonly type: string
}
export type AdminCourseLesson = {
  readonly category: string | null
  readonly description: string | null
  readonly estimatedMinutes: number
  readonly id: string
  readonly sortOrder: number
  readonly status: AdminCourseStatus
  readonly summary: readonly string[]
  readonly steps: readonly AdminCourseStep[]
  readonly title: string
}
export type AdminCourseUnit = {
  readonly id: string
  readonly lessons: readonly AdminCourseLesson[]
  readonly sortOrder: number
  readonly status: AdminCourseStatus
  readonly title: string
}
export type AdminCourseDetail = {
  readonly category: string
  readonly description: string
  readonly id: string
  readonly revision: number
  readonly status: AdminCourseStatus
  readonly title: string
  readonly units: readonly AdminCourseUnit[]
}
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
export type AdminCoursesApi = {
  readonly archiveCourse: (
    courseId: string
  ) => Promise<AdminApiResult<AdminArchiveCourseResult>>
  readonly createCourse: () => Promise<AdminApiResult<AdminCourseDetail>>
  readonly getCourseEditor: (
    courseId: string
  ) => Promise<AdminApiResult<AdminCourseDetail>>
  readonly getCourses: (
    input: ReadAdminCoursesInput
  ) => Promise<AdminApiResult<AdminCourseList>>
}

export function createAdminCoursesApi(
  transport: AdminHttpTransport
): AdminCoursesApi {
  const requestCourse = async (method: "GET" | "POST", path: string) => {
    const result = await transport.requestJson({
      method,
      path,
      schema: adminCourseDetailDtoSchema,
    })
    return result.status === "error"
      ? result
      : { status: "ok" as const, value: toCourse(result.value) }
  }
  return {
    archiveCourse: (courseId) =>
      transport.requestJson({
        method: "DELETE",
        path: `/courses/${courseId}`,
        schema: adminArchiveCourseResultSchema,
      }),
    createCourse: () => requestCourse("POST", "/courses"),
    getCourseEditor: (courseId) =>
      requestCourse("GET", `/courses/${courseId}/editor`),
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
  }
}

function toCourse(dto: AdminCourseDetailDto): AdminCourseDetail {
  return {
    ...dto,
    units: dto.units.map((unit) => ({
      ...unit,
      lessons: unit.lessons.map((lesson) => ({
        ...lesson,
        steps: lesson.steps.map((step) => ({ ...step })),
        summary: [...lesson.summary],
      })),
    })),
  }
}
