import type { RouteHandler } from "@hono/zod-openapi"
import type { AnyRouteConfig } from "@workspace/hono/core"
import { defineRouteForEnv } from "@workspace/hono/core"

import type { AdminAuthenticatedSession } from "@/auth/admin-session"

export type AdminHonoEnv = {
  Variables: {
    activeAdminSession: AdminAuthenticatedSession
  }
}

export const defineAdminRoute = defineRouteForEnv<AdminHonoEnv>()

export type AdminRouteHandler<TRoute extends AnyRouteConfig> = RouteHandler<
  TRoute,
  AdminHonoEnv
>
