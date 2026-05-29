import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"
import { z } from "zod"

import {
  adminCreateCurriculumMigrationRequestDtoSchema,
  adminCurriculumMigrationApplicationDtoSchema,
  adminCurriculumMigrationDetailDtoSchema,
  adminDatabaseUnavailableErrorDtoSchema,
  adminInvalidRequestErrorDtoSchema,
  adminNotFoundErrorDtoSchema,
} from "@workspace/core/admin"

import type { AdminApiAppDependencies } from "@/app"
import { requireAdminSession } from "@/auth/admin-session"
import { jsonErrorResponse } from "@/routes/error-response"

const applyCurriculumMigrationBodySchema = z.object({
  userId: z.string().min(1),
})

export function registerCurriculumMigrationsRoute(
  app: Hono,
  { adminService, auth }: Pick<AdminApiAppDependencies, "adminService" | "auth">
) {
  app.post(
    "/curriculum-migrations",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        201: {
          description: "관리자 커리큘럼 마이그레이션 맵을 생성했습니다.",
          content: {
            "application/json": {
              schema: resolver(adminCurriculumMigrationDetailDtoSchema),
            },
          },
        },
        400: {
          description: "마이그레이션 요청이 올바르지 않습니다.",
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
      const body = await readJsonBody(context.req.raw)
      const input =
        adminCreateCurriculumMigrationRequestDtoSchema.safeParse(body)

      if (!input.success) {
        return context.json(
          {
            code: "invalid-request",
            message: "마이그레이션 요청 본문이 올바르지 않습니다.",
          },
          400
        )
      }

      const result = await adminService.createCurriculumMigration(input.data)

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
    "/curriculum-migrations/:migrationId",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "관리자 커리큘럼 마이그레이션 맵입니다.",
          content: {
            "application/json": {
              schema: resolver(adminCurriculumMigrationDetailDtoSchema),
            },
          },
        },
        401: {
          description: "관리자 로그인이 필요합니다.",
        },
        404: {
          description: "커리큘럼 마이그레이션을 찾을 수 없습니다.",
          content: jsonErrorResponse(adminNotFoundErrorDtoSchema),
        },
        503: {
          description: "데이터베이스를 사용할 수 없습니다.",
          content: jsonErrorResponse(adminDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const result = await adminService.getCurriculumMigration(
        context.req.param("migrationId")
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
    "/curriculum-migrations/:migrationId/apply",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "관리자 커리큘럼 마이그레이션 맵을 적용했습니다.",
          content: {
            "application/json": {
              schema: resolver(adminCurriculumMigrationApplicationDtoSchema),
            },
          },
        },
        400: {
          description: "마이그레이션 적용 요청이 올바르지 않습니다.",
          content: jsonErrorResponse(adminInvalidRequestErrorDtoSchema),
        },
        401: {
          description: "관리자 로그인이 필요합니다.",
        },
        404: {
          description:
            "커리큘럼 마이그레이션 또는 학습자 진행을 찾을 수 없습니다.",
          content: jsonErrorResponse(adminNotFoundErrorDtoSchema),
        },
        503: {
          description: "데이터베이스를 사용할 수 없습니다.",
          content: jsonErrorResponse(adminDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const body = await readJsonBody(context.req.raw)
      const input = applyCurriculumMigrationBodySchema.safeParse(body)

      if (!input.success) {
        return context.json(
          {
            code: "invalid-request",
            message: "마이그레이션 적용 요청 본문이 올바르지 않습니다.",
          },
          400
        )
      }

      const result = await adminService.applyCurriculumMigration({
        migrationId: context.req.param("migrationId"),
        userId: input.data.userId,
      })

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
