import type { NotFoundHandler } from "hono"
import { errorJson } from "@/http/platform/errors/error-response"
import type { ErrorResponse } from "@/http/platform/errors/error-response"
import { getStatusMessage } from "@/http/platform/errors/status"

export function createNotFoundHandler(): NotFoundHandler {
  return () => {
    const error: ErrorResponse = {
      code: "NOT_FOUND",
      message: getStatusMessage(404),
    }

    return errorJson(error, 404)
  }
}
