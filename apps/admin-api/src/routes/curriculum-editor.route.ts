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
import { jsonServiceResult, parseJsonBody } from "@/routes/route-helpers"

const adminEditorStatusCodes = {
  conflict: 409,
  "invalid-request": 400,
  "not-found": 404,
  unavailable: 503,
} as const

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

      return jsonServiceResult(context, result, adminEditorStatusCodes)
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
      const input = await parseJsonBody(
        context,
        adminCourseEditorSaveRequestDtoSchema,
        "코스 편집 저장 요청 본문이 올바르지 않습니다."
      )

      if (input.status !== "ok") {
        return input.response
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

      return jsonServiceResult(context, result, adminEditorStatusCodes)
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

      return jsonServiceResult(context, result, adminEditorStatusCodes)
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

      return jsonServiceResult(context, result, adminEditorStatusCodes)
    }
  )
}
