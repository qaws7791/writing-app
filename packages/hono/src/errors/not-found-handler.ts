import type { NotFoundHandler } from "hono"
import { errorJson } from "#hono/errors/error-response"
import type { ErrorResponse } from "#hono/errors/error-response"
import { getStatusMessage } from "#hono/errors/status"

export function createNotFoundHandler(): NotFoundHandler {
  return () => {
    const error: ErrorResponse = {
      code: "NOT_FOUND",
      message: getStatusMessage(404),
    }

    return errorJson(error, 404)
  }
}
