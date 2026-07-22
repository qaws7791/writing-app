import type { RouteHandler } from "@hono/zod-openapi"
import type { AnyRouteConfig } from "@workspace/http-platform/core"
import { defineRouteForEnv } from "@workspace/http-platform/core"
import type { AuthenticatedSession } from "@workspace/identity/sessions"
import type { HttpPlatformEnv } from "@workspace/http-platform/context"

import type { ApiRequestContext } from "@/context/create-request-context"

export type ApiHonoEnv = HttpPlatformEnv<{
  activeSession: AuthenticatedSession
  requestContext: ApiRequestContext
}>

export const defineApiRoute = defineRouteForEnv<ApiHonoEnv>()

export type ApiRouteHandler<TRoute extends AnyRouteConfig> = RouteHandler<
  TRoute,
  ApiHonoEnv
>
