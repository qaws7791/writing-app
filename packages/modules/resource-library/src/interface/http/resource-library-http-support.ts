import type { RouteHandler } from "@hono/zod-openapi"
import type { Env, Handler, Input, TypedResponse } from "hono"
import type { AnyRouteConfig } from "@workspace/http-platform/core"
import { defineRouteForEnv } from "@workspace/http-platform/core"
import { ErrorResponseSchema } from "@workspace/http-platform/errors"
import {
  jsonResponse,
  markdownResponse,
} from "@workspace/http-platform/openapi"

import type { ResourceLibraryHonoEnv } from "#resource-library/interface/http/resource-library-http-auth"

export const defineResourceLibraryRoute =
  defineRouteForEnv<ResourceLibraryHonoEnv>()

export type ResourceLibraryRouteHandler<TRoute extends AnyRouteConfig> =
  RouteHandler<TRoute, ResourceLibraryHonoEnv> extends Handler<
    infer TEnv extends Env,
    infer TPath extends string,
    infer TInput extends Input,
    infer _TResponse
  >
    ? Handler<TEnv, TPath, TInput, ResourceLibraryHandlerResponse>
    : never

type ResourceLibraryHandlerResponse =
  | Promise<Response | TypedResponse<unknown>>
  | Promise<void>
  | Response
  | TypedResponse<unknown>

export function resourceLibraryErrorJsonResponse(description: string) {
  return jsonResponse(description, ErrorResponseSchema)
}

export function resourceLibraryAuthenticatedResponses(
  successResponse:
    | ReturnType<typeof jsonResponse>
    | ReturnType<typeof markdownResponse>
) {
  return {
    200: successResponse,
    401: resourceLibraryErrorJsonResponse("관리자 인증이 필요합니다."),
    403: resourceLibraryErrorJsonResponse("자료실 접근 권한이 필요합니다."),
  }
}
