import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"

import {
  adminDatabaseUnavailableErrorDtoSchema,
  adminUserListDtoSchema,
} from "@workspace/core/admin"

import type { AdminApiAppDependencies } from "@/app"
import { requireAdminSession } from "@/auth/admin-session"
import { jsonErrorResponse } from "@/routes/error-response"

export function registerUsersRoute(
  app: Hono,
  { adminService, auth }: Pick<AdminApiAppDependencies, "adminService" | "auth">
) {
  app.get(
    "/users",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "관리자 사용자 목록입니다.",
          content: {
            "application/json": {
              schema: resolver(adminUserListDtoSchema),
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
      const result = await adminService.listUsers()

      switch (result.status) {
        case "ok":
          return context.json(result.value)
        case "unavailable":
          return context.json(result.error, 503)
      }
    }
  )
}
