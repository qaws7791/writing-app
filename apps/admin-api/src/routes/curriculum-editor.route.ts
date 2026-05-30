import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"

import {
  adminConflictErrorDtoSchema,
  adminCourseEditorDetailDtoSchema,
  adminCourseEditorSaveRequestDtoSchema,
  adminCourseDetailDtoSchema,
  adminDatabaseUnavailableErrorDtoSchema,
  adminEditorLessonDetailDtoSchema,
  adminInvalidRequestErrorDtoSchema,
  adminNotFoundErrorDtoSchema,
} from "@workspace/core/admin"

import type { AdminApiAppDependencies } from "@/app"
import { requireAdminSession } from "@/auth/admin-session"
import { jsonErrorResponse } from "@/routes/error-response"

export function registerCurriculumEditorRoute(
  app: Hono,
  { adminService, auth }: Pick<AdminApiAppDependencies, "adminService" | "auth">
) {
  app.get(
    "/courses/:courseId/editor",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "관리자 코스 편집 문서입니다.",
          content: {
            "application/json": {
              schema: resolver(adminCourseEditorDetailDtoSchema),
            },
          },
        },
        401: {
          description: "관리자 로그인이 필요합니다.",
        },
        404: {
          description: "코스 편집 문서를 찾을 수 없습니다.",
          content: jsonErrorResponse(adminNotFoundErrorDtoSchema),
        },
        503: {
          description: "데이터베이스를 사용할 수 없습니다.",
          content: jsonErrorResponse(adminDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const result = await adminService.getCourseEditorDocument(
        context.req.param("courseId")
      )

      switch (result.status) {
        case "ok":
          return context.json(result.value)
        case "not-found":
          return context.json(result.error, 404)
        case "invalid-request":
          return context.json(result.error, 400)
        case "unavailable":
          return context.json(result.error, 503)
      }
    }
  )

  app.put(
    "/courses/:courseId/editor",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "관리자 코스 편집 문서를 저장했습니다.",
          content: {
            "application/json": {
              schema: resolver(adminCourseEditorDetailDtoSchema),
            },
          },
        },
        400: {
          description: "편집 저장 요청이 올바르지 않습니다.",
          content: jsonErrorResponse(adminInvalidRequestErrorDtoSchema),
        },
        401: {
          description: "관리자 로그인이 필요합니다.",
        },
        404: {
          description: "코스 편집 문서를 찾을 수 없습니다.",
          content: jsonErrorResponse(adminNotFoundErrorDtoSchema),
        },
        409: {
          description: "다른 관리자가 먼저 저장한 편집 문서입니다.",
          content: jsonErrorResponse(adminConflictErrorDtoSchema),
        },
        503: {
          description: "데이터베이스를 사용할 수 없습니다.",
          content: jsonErrorResponse(adminDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const body = await readJsonBody(context.req.raw)
      const input = adminCourseEditorSaveRequestDtoSchema.safeParse(body)

      if (!input.success) {
        return context.json(
          {
            code: "invalid-request",
            message: "코스 편집 저장 요청 본문이 올바르지 않습니다.",
          },
          400
        )
      }

      if (input.data.courseId !== context.req.param("courseId")) {
        return context.json(
          {
            code: "invalid-request",
            message: "경로 매개변수와 요청 본문이 일치해야 합니다.",
          },
          400
        )
      }

      const result = await adminService.saveCourseEditorDocument(input.data)

      switch (result.status) {
        case "ok":
          return context.json(result.value)
        case "invalid-request":
          return context.json(result.error, 400)
        case "not-found":
          return context.json(result.error, 404)
        case "conflict":
          return context.json(result.error, 409)
        case "unavailable":
          return context.json(result.error, 503)
      }
    }
  )

  app.get(
    "/courses/:courseId",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "편집기용 관리자 코스 상세입니다.",
          content: {
            "application/json": {
              schema: resolver(adminCourseDetailDtoSchema),
            },
          },
        },
        401: {
          description: "관리자 로그인이 필요합니다.",
        },
        404: {
          description: "코스를 찾을 수 없습니다.",
          content: jsonErrorResponse(adminNotFoundErrorDtoSchema),
        },
        503: {
          description: "데이터베이스를 사용할 수 없습니다.",
          content: jsonErrorResponse(adminDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const result = await adminService.getCourseDetail(
        context.req.param("courseId")
      )

      switch (result.status) {
        case "ok":
          return context.json(result.value)
        case "invalid-request":
          return context.json(result.error, 400)
        case "not-found":
          return context.json(result.error, 404)
        case "unavailable":
          return context.json(result.error, 503)
      }
    }
  )

  app.get(
    "/courses/:courseId/lessons/:lessonId",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "관리자 레슨 상세입니다.",
          content: {
            "application/json": {
              schema: resolver(adminEditorLessonDetailDtoSchema),
            },
          },
        },
        401: {
          description: "관리자 로그인이 필요합니다.",
        },
        404: {
          description: "레슨을 찾을 수 없습니다.",
          content: jsonErrorResponse(adminNotFoundErrorDtoSchema),
        },
        503: {
          description: "데이터베이스를 사용할 수 없습니다.",
          content: jsonErrorResponse(adminDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const result = await adminService.getCourseLessonDetail(
        context.req.param("courseId"),
        context.req.param("lessonId")
      )

      switch (result.status) {
        case "ok":
          return context.json(result.value)
        case "invalid-request":
          return context.json(result.error, 400)
        case "not-found":
          return context.json(result.error, 404)
        case "unavailable":
          return context.json(result.error, 503)
      }
    }
  )
}

async function readJsonBody(request: Request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}
