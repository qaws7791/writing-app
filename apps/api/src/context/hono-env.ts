import type { RouteHandler } from "@hono/zod-openapi"
import type { AnyRouteConfig } from "@workspace/hono/core"
import { defineRouteForEnv } from "@workspace/hono/core"
import type { AuthenticatedSession } from "@workspace/core/auth"

import type { ApiRequestContext } from "@/context/create-request-context"

export type ApiHonoEnv = {
  Variables: {
    activeSession: AuthenticatedSession
    requestContext: ApiRequestContext
    requestId: string
  }
}

export const defineApiRoute = defineRouteForEnv<ApiHonoEnv>()

export type ApiRouteHandler<TRoute extends AnyRouteConfig> = RouteHandler<
  TRoute,
  ApiHonoEnv
>
