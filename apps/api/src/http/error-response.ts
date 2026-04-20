import { APIError } from "better-auth/api"
import {
  toApplicationErrorStatus,
  ValidationError,
} from "@workspace/core/shared"
import { HTTPException } from "hono/http-exception"

import type { ErrorResponse } from "./error-schema"
import { TimeoutError } from "./timeout-error"

const betterAuthStatusMap = {
  BAD_REQUEST: 400,
  CONFLICT: 409,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  UNAUTHORIZED: 401,
  UNPROCESSABLE_ENTITY: 422,
} as const

const applicationErrorCodeMap = {
  400: "validation_error",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
} as const

export function errorToResponse(error: unknown): {
  body: ErrorResponse
  status: number
} {
  const applicationStatus = toApplicationErrorStatus(error)

  if (error instanceof ValidationError) {
    return {
      body: {
        error: {
          code: applicationErrorCodeMap[applicationStatus ?? 400],
          ...(error.details && { details: error.details }),
          message: error.message,
        },
      },
      status: applicationStatus ?? 400,
    }
  }

  if (applicationStatus !== undefined) {
    return {
      body: {
        error: {
          code: applicationErrorCodeMap[applicationStatus],
          message:
            error instanceof Error
              ? error.message
              : "요청을 처리하지 못했습니다.",
        },
      },
      status: applicationStatus,
    }
  }

  if (error instanceof HTTPException) {
    return {
      body: {
        error: {
          code: "invalid_json",
          message: "JSON 본문 형식이 올바르지 않습니다.",
        },
      },
      status: error.status,
    }
  }

  if (error instanceof SyntaxError) {
    return {
      body: {
        error: {
          code: "invalid_json",
          message: "JSON 본문 형식이 올바르지 않습니다.",
        },
      },
      status: 400,
    }
  }

  if (error instanceof TimeoutError) {
    return {
      body: {
        error: {
          code: "request_timeout",
          message: error.message,
        },
      },
      status: 408,
    }
  }

  if (error instanceof APIError) {
    const errorStatus = String(error.status)
    const status =
      betterAuthStatusMap[errorStatus as keyof typeof betterAuthStatusMap] ??
      500

    return {
      body: {
        error: {
          code: errorStatus.toLowerCase(),
          message: error.message ?? "인증 처리 중 오류가 발생했습니다.",
        },
      },
      status,
    }
  }

  return {
    body: {
      error: {
        code: "internal_error",
        message: "서버 내부 오류가 발생했습니다.",
      },
    },
    status: 500,
  }
}
