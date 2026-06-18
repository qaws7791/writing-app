import type { ErrorHandler } from "hono"
import { HTTPException } from "hono/http-exception"
import { AppError } from "./app-error"
import { errorJson } from "./error-response"
import type { ErrorResponse } from "./error-response"
import { getStatusMessage, normalizeErrorStatusCode } from "./status"
import type { ErrorStatusCode } from "./status"

type ErrorResponseResult = {
  status: ErrorStatusCode
  body: ErrorResponse
}

export function toErrorResponse(error: unknown): ErrorResponseResult {
  if (error instanceof AppError) {
    const body: ErrorResponse = {
      code: error.code,
      message: error.message,
    }

    if (error.errors !== undefined) {
      body.errors = error.errors
    }

    return {
      status: error.status,
      body,
    }
  }

  if (error instanceof HTTPException) {
    const status = normalizeErrorStatusCode(error.status)

    return {
      status,
      body: {
        code: "HTTP_EXCEPTION",
        message: getStatusMessage(status),
      },
    }
  }

  return {
    status: 500,
    body: {
      code: "INTERNAL_SERVER_ERROR",
      message: getStatusMessage(500),
    },
  }
}

export function createErrorHandler(): ErrorHandler {
  return (error) => {
    const { status, body } = toErrorResponse(error)

    return errorJson(body, status)
  }
}
