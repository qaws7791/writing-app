import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@workspace/backend-core"

import { UnauthorizedError } from "./unauthorized-error.js"

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
