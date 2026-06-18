import type { NotFoundHandler } from "hono"
import { errorJson } from "@/errors/error-response"
import type { ErrorResponse } from "@/errors/error-response"
import { getStatusMessage } from "@/errors/status"

export function createNotFoundHandler(): NotFoundHandler {
  return () => {
    const error: ErrorResponse = {
      code: "NOT_FOUND",
      message: getStatusMessage(404),
    }

    return errorJson(error, 404)
  }
}
