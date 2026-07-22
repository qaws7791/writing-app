import type { RouteHandler } from "@hono/zod-openapi"
import type { Env, Handler, Input, TypedResponse } from "hono"
import type { AdminActor } from "@workspace/core/admin"
import type { HttpPlatformEnv } from "@workspace/http-platform/context"
import type { AnyRouteConfig } from "@workspace/http-platform/core"
import { defineRouteForEnv } from "@workspace/http-platform/core"

import type { AdminAuthenticatedSession } from "@workspace/auth/admin/server"

export type AdminHonoEnv = HttpPlatformEnv<{
  activeAdminSession: AdminAuthenticatedSession
  adminActor: AdminActor
}>

export const defineAdminRoute = defineRouteForEnv<AdminHonoEnv>()

export type AdminRouteHandler<TRoute extends AnyRouteConfig> =
  RouteHandler<TRoute, AdminHonoEnv> extends Handler<
    infer TEnv extends Env,
    infer TPath extends string,
    infer TInput extends Input,
    infer _TResponse
  >
    ? Handler<TEnv, TPath, TInput, AdminHandlerResponse>
    : never

type AdminHandlerResponse =
  | Promise<Response | TypedResponse<unknown>>
  | Promise<void>
  | Response
  | TypedResponse<unknown>
