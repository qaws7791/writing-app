import type { RouteHandler } from "@hono/zod-openapi"
import type { Env, Handler, Input, TypedResponse } from "hono"
import type { AnyRouteConfig } from "@workspace/http-platform/core"
import { defineRouteForEnv } from "@workspace/http-platform/core"
import { AppError } from "@workspace/http-platform/errors"
import { adminApiErrorSchema } from "@workspace/contracts/operations/admin-api-error"
import { jsonResponse } from "@workspace/http-platform/openapi"

import type { OperationsError } from "#operations/domain/operations-error"
import type { OperationsHonoEnv } from "#operations/interface/http/operations-http-auth"

export const defineOperationsRoute = defineRouteForEnv<OperationsHonoEnv>()

export type OperationsRouteHandler<TRoute extends AnyRouteConfig> =
  RouteHandler<TRoute, OperationsHonoEnv> extends Handler<
    infer TEnv extends Env,
    infer TPath extends string,
    infer TInput extends Input,
    infer _TResponse
  >
    ? Handler<TEnv, TPath, TInput, OperationsHandlerResponse>
    : never

type OperationsHandlerResponse =
  | Promise<Response | TypedResponse<unknown>>
  | Promise<void>
  | Response
  | TypedResponse<unknown>

export function operationsErrorResponse(description: string) {
  return jsonResponse(description, adminApiErrorSchema)
}

export function operationsAuthenticatedResponses(
  successResponse: ReturnType<typeof jsonResponse>
) {
  return {
    200: successResponse,
    401: operationsErrorResponse("관리자 인증이 필요합니다."),
    403: operationsErrorResponse("관리자 권한이 필요합니다."),
  }
}

export function mapOperationsError(error: OperationsError): AppError {
  switch (error.kind) {
    case "permission-denied":
      return operationError(403, "FORBIDDEN", "Forbidden")
    case "quota-exceeded":
      return operationError(
        429,
        "AI_CHAT_RATE_LIMITED",
        "AI chat rate limit exceeded"
      )
    case "provider-unavailable":
      return operationError(
        503,
        "AI_PROVIDER_UNAVAILABLE",
        "AI provider is unavailable"
      )
    case "validation-failed":
      return operationError(422, "VALIDATION_FAILED", "Invalid request")
    case "conflict":
      return operationError(409, "OPERATIONS_CONFLICT", "Operations conflict")
    case "not-found":
      return operationError(404, "NOT_FOUND", "Not Found")
    case "reporting-unavailable":
      return operationError(
        503,
        "OPERATIONS_REPORTING_UNAVAILABLE",
        "Operations reporting is unavailable"
      )
    case "persistence-failed":
      return operationError(
        503,
        "OPERATIONS_UNAVAILABLE",
        "Operations service is unavailable"
      )
    case "provider-failed":
      return operationError(502, "AI_PROVIDER_FAILED", "AI provider failed")
  }
}

function operationError(
  status: 403 | 404 | 409 | 422 | 429 | 502 | 503,
  code: string,
  message: string
): AppError {
  return new AppError({ code, message, status })
}
