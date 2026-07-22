import type { RouteHandler } from "@hono/zod-openapi"
import type { Env, Handler, Input, TypedResponse } from "hono"
import type { AnyRouteConfig } from "@workspace/http-platform/core"
import { defineRouteForEnv } from "@workspace/http-platform/core"
import { jsonResponse } from "@workspace/http-platform/openapi"
import { contentApiErrorSchema } from "@workspace/contracts/content/api-error"

import type { ContentAdminHonoEnv } from "#content/interface/http/content-http-auth"

export const defineContentRoute = defineRouteForEnv<ContentAdminHonoEnv>()

export type ContentRouteHandler<TRoute extends AnyRouteConfig> =
  RouteHandler<TRoute, ContentAdminHonoEnv> extends Handler<
    infer TEnv extends Env,
    infer TPath extends string,
    infer TInput extends Input,
    infer _TResponse
  >
    ? Handler<TEnv, TPath, TInput, ContentHandlerResponse>
    : never

type ContentHandlerResponse =
  | Promise<Response | TypedResponse<unknown>>
  | Promise<void>
  | Response
  | TypedResponse<unknown>

export function contentErrorJsonResponse(description: string) {
  return jsonResponse(description, contentApiErrorSchema)
}

export function contentAuthenticatedResponses(
  successResponse: ReturnType<typeof jsonResponse>
) {
  return {
    200: successResponse,
    401: contentErrorJsonResponse("관리자 인증이 필요합니다."),
    403: contentErrorJsonResponse("소유자 권한이 필요합니다."),
  }
}
