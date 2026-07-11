import type { RouteHandler } from "@hono/zod-openapi"
import type { Env, Handler, Input, TypedResponse } from "hono"
import type { AnyRouteConfig } from "@workspace/hono/core"
import { defineRouteForEnv } from "@workspace/hono/core"
import type { AdminActor } from "@workspace/core/admin"

import type { AdminAuthenticatedSession } from "@/auth/admin-session"

export type AdminHonoEnv = {
  Variables: {
    activeAdminSession: AdminAuthenticatedSession
    adminActor: AdminActor
  }
}

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
