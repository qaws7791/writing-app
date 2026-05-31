import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"

import { adminCurrentSessionDtoSchema } from "@workspace/core/admin"

import type { AdminApiAppDependencies } from "@/app"
import { requireAdminSession } from "@/auth/admin-session"

export function registerSessionRoute(
  app: Hono,
  { auth }: Pick<AdminApiAppDependencies, "auth">
) {
  app.get(
    "/session",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "현재 관리자 세션입니다.",
          content: {
            "application/json": {
              schema: resolver(adminCurrentSessionDtoSchema),
            },
          },
        },
        401: {
          description: "관리자 로그인이 필요합니다.",
        },
      },
    }),
    (context) => context.json(context.get("adminSession"))
  )
}
