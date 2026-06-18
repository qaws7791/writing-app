import type { NotFoundHandler } from "hono"
import { errorJson } from "./error-response"
import type { ErrorResponse } from "./error-response"
import { getStatusMessage } from "./status"

export function createNotFoundHandler(): NotFoundHandler {
  return () => {
    const error: ErrorResponse = {
      code: "NOT_FOUND",
      message: getStatusMessage(404),
    }

    return errorJson(error, 404)
  }
}
