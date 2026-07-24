import type { ErrorHandler } from "hono"
import { HTTPException } from "hono/http-exception"
import { AppError } from "#http-platform/errors/app-error"
import { errorJson } from "#http-platform/errors/error-response"
import type { ErrorResponse } from "#http-platform/errors/error-response"
import {
  getStatusMessage,
  normalizeErrorStatusCode,
} from "#http-platform/errors/status"
import type { ErrorStatusCode } from "#http-platform/errors/status"
import {
  privateNoStoreCacheControl,
  withPrivateNoStore,
} from "#http-platform/security/private-no-store"

type ErrorResponseResult = {
  status: ErrorStatusCode
  body: Omit<ErrorResponse, "requestId">
  headers?: Readonly<Record<string, string>>
}

type InternalErrorLogEvent = {
  readonly causeClass: string | undefined
  readonly errorClass: string
  readonly requestId: string | undefined
  readonly stack: readonly string[]
  readonly status: 500
}

export type InternalErrorLogger = (event: InternalErrorLogEvent) => void

function toErrorResponse(error: unknown): ErrorResponseResult {
  if (error instanceof AppError) {
    const body: Omit<ErrorResponse, "requestId"> = {
      code: error.code,
      message: error.message,
    }

    if (error.violations !== undefined) {
      body.violations = error.violations
    }

    return {
      status: error.status,
      body,
      ...(error.headers === undefined ? {} : { headers: error.headers }),
    }
  }

  if (error instanceof HTTPException) {
    const status = normalizeErrorStatusCode(error.status)

    return {
      status,
      body: {
        code: status === 400 ? "VALIDATION_FAILED" : "HTTP_ERROR",
        message:
          status === 400
            ? "Request validation failed"
            : getStatusMessage(status),
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
    const { status, body: baseBody, headers } = toErrorResponse(error)
    const requestId = readRequestId(context.get("requestId"))
    const body: ErrorResponse = { ...baseBody, requestId }

    if (status === 500) {
      logInternalError?.({
        causeClass: readCauseClass(error),
        errorClass: readErrorClass(error),
        requestId,
        stack: readRedactedStack(error),
        status,
      })
    }

    const response = errorJson(body, status)
    response.headers.set("x-request-id", requestId)
    for (const [name, value] of Object.entries(headers ?? {})) {
      response.headers.set(name, value)
    }
    return context.res.headers.get("Cache-Control") ===
      privateNoStoreCacheControl
      ? withPrivateNoStore(response)
      : response
  }
}

function readRequestId(value: unknown): string {
  return typeof value === "string" && value.length > 0
    ? value
    : crypto.randomUUID()
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
