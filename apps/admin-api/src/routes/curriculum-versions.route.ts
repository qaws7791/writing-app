import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"

import {
  adminCurriculumVersionDetailDtoSchema,
  adminCurriculumVersionListDtoSchema,
  adminCurriculumVersionSummaryDtoSchema,
  adminDatabaseUnavailableErrorDtoSchema,
  adminInvalidRequestErrorDtoSchema,
  adminNotFoundErrorDtoSchema,
} from "@workspace/core/admin"

import type { AdminApiAppDependencies } from "@/app"
import { requireAdminSession } from "@/auth/admin-session"
import { jsonErrorResponse } from "@/routes/error-response"

export function registerCurriculumVersionsRoute(
  app: Hono,
  { adminService, auth }: Pick<AdminApiAppDependencies, "adminService" | "auth">
) {
  app.get(
    "/courses/:courseId/curriculum-versions",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "코스의 관리자 커리큘럼 버전 목록입니다.",
          content: {
            "application/json": {
              schema: resolver(adminCurriculumVersionListDtoSchema),
            },
          },
        },
        401: {
          description: "관리자 로그인이 필요합니다.",
        },
        503: {
          description: "데이터베이스를 사용할 수 없습니다.",
          content: jsonErrorResponse(adminDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const result = await adminService.listCurriculumVersions(
        context.req.param("courseId")
      )

      switch (result.status) {
        case "ok":
          return context.json(result.value)
        case "unavailable":
          return context.json(result.error, 503)
      }
    }
  )

  app.post(
    "/courses/:courseId/curriculum-versions",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        201: {
          description: "관리자 커리큘럼 초안을 생성했습니다.",
          content: {
            "application/json": {
              schema: resolver(adminCurriculumVersionSummaryDtoSchema),
            },
          },
        },
        400: {
          description: "초안 생성 요청이 올바르지 않습니다.",
          content: jsonErrorResponse(adminInvalidRequestErrorDtoSchema),
        },
        401: {
          description: "관리자 로그인이 필요합니다.",
        },
        404: {
          description: "발행된 커리큘럼 버전을 찾을 수 없습니다.",
          content: jsonErrorResponse(adminNotFoundErrorDtoSchema),
        },
        503: {
          description: "데이터베이스를 사용할 수 없습니다.",
          content: jsonErrorResponse(adminDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const result = await adminService.createCurriculumDraft(
        context.req.param("courseId")
      )

      switch (result.status) {
        case "ok":
          return context.json(result.value, 201)
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
    "/curriculum-versions/:versionId",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "관리자 커리큘럼 버전 상세입니다.",
          content: {
            "application/json": {
              schema: resolver(adminCurriculumVersionDetailDtoSchema),
            },
          },
        },
        401: {
          description: "관리자 로그인이 필요합니다.",
        },
        404: {
          description: "커리큘럼 버전을 찾을 수 없습니다.",
          content: jsonErrorResponse(adminNotFoundErrorDtoSchema),
        },
        503: {
          description: "데이터베이스를 사용할 수 없습니다.",
          content: jsonErrorResponse(adminDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const result = await adminService.getCurriculumVersionDetail(
        context.req.param("versionId")
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

  app.post(
    "/curriculum-versions/:versionId/publish",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "관리자 커리큘럼 초안을 발행했습니다.",
          content: {
            "application/json": {
              schema: resolver(adminCurriculumVersionSummaryDtoSchema),
            },
          },
        },
        400: {
          description: "발행 요청이 올바르지 않습니다.",
          content: jsonErrorResponse(adminInvalidRequestErrorDtoSchema),
        },
        401: {
          description: "관리자 로그인이 필요합니다.",
        },
        404: {
          description: "커리큘럼 버전을 찾을 수 없습니다.",
          content: jsonErrorResponse(adminNotFoundErrorDtoSchema),
        },
        503: {
          description: "데이터베이스를 사용할 수 없습니다.",
          content: jsonErrorResponse(adminDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const result = await adminService.publishCurriculumVersion(
        context.req.param("versionId")
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
