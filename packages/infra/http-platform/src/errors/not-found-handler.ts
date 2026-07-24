import type { NotFoundHandler } from "hono"
import { errorJson } from "#http-platform/errors/error-response"
import type { ErrorResponse } from "#http-platform/errors/error-response"
import { getStatusMessage } from "#http-platform/errors/status"

export function createNotFoundHandler(): NotFoundHandler {
  return (context) => {
    const requestId = readRequestId(context.get("requestId"))
    const error: ErrorResponse = {
      code: "NOT_FOUND",
      message: getStatusMessage(404),
      requestId,
    }

    const response = errorJson(error, 404)
    response.headers.set("x-request-id", requestId)
    return response
  }
}

function readRequestId(value: unknown): string {
  return typeof value === "string" && value.length > 0
    ? value
    : crypto.randomUUID()
}
