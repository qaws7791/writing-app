import { APIError } from "better-auth/api"
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@workspace/core"

import { UnauthorizedError } from "./unauthorized-error.js"

const betterAuthStatusMap = {
  BAD_REQUEST: 400,
  CONFLICT: 409,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  UNAUTHORIZED: 401,
  UNPROCESSABLE_ENTITY: 422,
} as const

export type ErrorPayload = {
  error: {
    code: string
    details?: unknown
    message: string
  }
}

export function toErrorResponse(error: unknown): {
  body: ErrorPayload
  status: number
} {
  if (error instanceof ValidationError) {
    return {
      body: {
        error: {
          code: "validation_error",
          message: error.message,
        },
      },
      status: 400,
    }
  }

  if (error instanceof NotFoundError) {
    return {
      body: {
        error: {
          code: "not_found",
          message: error.message,
        },
      },
      status: 404,
    }
  }

  if (error instanceof ForbiddenError) {
    return {
      body: {
        error: {
          code: "forbidden",
          message: error.message,
        },
      },
      status: 403,
    }
  }

  if (error instanceof ConflictError) {
    return {
      body: {
        error: {
          code: "conflict",
          message: error.message,
        },
      },
      status: 409,
    }
  }

  if (error instanceof UnauthorizedError) {
    return {
      body: {
        error: {
          code: "unauthorized",
          message: error.message,
        },
      },
      status: 401,
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
