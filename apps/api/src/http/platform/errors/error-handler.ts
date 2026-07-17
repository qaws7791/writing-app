import type { ErrorHandler } from "hono"
import { HTTPException } from "hono/http-exception"
import { AppError } from "@/http/platform/errors/app-error"
import { errorJson } from "@/http/platform/errors/error-response"
import type { ErrorResponse } from "@/http/platform/errors/error-response"
import {
  getStatusMessage,
  normalizeErrorStatusCode,
} from "@/http/platform/errors/status"
import type { ErrorStatusCode } from "@/http/platform/errors/status"

type ErrorResponseResult = {
  status: ErrorStatusCode
  body: ErrorResponse
}

export type InternalErrorLogEvent = {
  readonly causeClass: string | undefined
  readonly errorClass: string
  readonly requestId: string | undefined
  readonly stack: readonly string[]
  readonly status: 500
}

export type InternalErrorLogger = (event: InternalErrorLogEvent) => void

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

export function createErrorHandler(
  logInternalError?: InternalErrorLogger
): ErrorHandler {
  return (error, context) => {
    const { status, body } = toErrorResponse(error)

    if (status === 500) {
      logInternalError?.({
        causeClass: readCauseClass(error),
        errorClass: readErrorClass(error),
        requestId: context.get("requestId"),
        stack: readRedactedStack(error),
        status,
      })
    }

    return errorJson(body, status)
  }
}

function readErrorClass(error: unknown): string {
  if (!(error instanceof Error)) return "UnknownError"
  return normalizeClassName(error.constructor.name)
}

function readCauseClass(error: unknown): string | undefined {
  if (!(error instanceof Error) || !(error.cause instanceof Error)) {
    return undefined
  }

  return normalizeClassName(error.cause.constructor.name)
}

function normalizeClassName(value: string): string {
  return /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(value) ? value : "UnknownError"
}

function readRedactedStack(error: unknown): readonly string[] {
  if (!(error instanceof Error) || error.stack === undefined) return []
  return error.stack
    .split("\n")
    .slice(1, 11)
    .map((line) => line.trim())
}
