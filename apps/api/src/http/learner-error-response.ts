import type { ErrorHandler, MiddlewareHandler } from "hono"
import {
  createErrorHandler,
  ErrorResponseSchema,
  type InternalErrorLogger,
} from "@workspace/http-platform/errors"
import {
  learnerApiErrorSchema,
  type LearnerApiError,
  type LearnerApiErrorCode,
} from "@workspace/contracts/learning/api-error"

import type { ApiHonoEnv } from "@/context/hono-env"

const statusByCode = {
  AI_FEEDBACK_ANSWER_NOT_FOUND: 409,
  ATTEMPT_IN_PROGRESS: 409,
  ATTEMPT_LIMIT_EXCEEDED: 429,
  COURSE_NOT_FOUND: 404,
  CURRICULUM_VERSION_CHANGED: 409,
  FORBIDDEN: 403,
  INTERNAL_SERVER_ERROR: 500,
  INVALID_CURSOR: 400,
  LESSON_LOCKED: 403,
  LESSON_NOT_FOUND: 404,
  NOT_FOUND: 404,
  PROVIDER_UNAVAILABLE: 503,
  STEP_SEQUENCE_CONFLICT: 409,
  UNAUTHENTICATED: 401,
  VALIDATION_ERROR: 400,
} as const satisfies Record<LearnerApiErrorCode, number>

const messageByCode = {
  AI_FEEDBACK_ANSWER_NOT_FOUND:
    "코칭할 작성 답변을 찾을 수 없습니다. 답변을 다시 저장해 주세요.",
  ATTEMPT_IN_PROGRESS: "AI 코칭 요청을 처리하고 있습니다.",
  ATTEMPT_LIMIT_EXCEEDED: "AI 코칭 시도 횟수를 모두 사용했습니다.",
  COURSE_NOT_FOUND: "코스를 찾을 수 없습니다.",
  CURRICULUM_VERSION_CHANGED:
    "학습 과정 버전이 변경되었습니다. 다시 시도해 주세요.",
  FORBIDDEN: "요청한 작업을 수행할 권한이 없습니다.",
  INTERNAL_SERVER_ERROR: "서버 오류가 발생했습니다.",
  INVALID_CURSOR: "목록 조회 위치가 올바르지 않습니다.",
  LESSON_LOCKED: "아직 학습할 수 없는 레슨입니다.",
  LESSON_NOT_FOUND: "레슨을 찾을 수 없습니다.",
  NOT_FOUND: "요청한 경로를 찾을 수 없습니다.",
  PROVIDER_UNAVAILABLE: "AI 코칭을 잠시 사용할 수 없습니다.",
  STEP_SEQUENCE_CONFLICT: "현재 학습 순서와 요청한 단계가 다릅니다.",
  UNAUTHENTICATED: "로그인이 필요합니다.",
  VALIDATION_ERROR: "요청 내용을 확인해 주세요.",
} as const satisfies Record<LearnerApiErrorCode, string>

export function createLearnerErrorResponseMiddleware(): MiddlewareHandler<ApiHonoEnv> {
  return async (context, next) => {
    await next()

    if (context.res.status < 400) return

    context.res = await normalizeLearnerErrorResponse({
      path: context.req.path,
      requestId: context.get("requestId"),
      response: context.res,
    })
  }
}

export function createLearnerErrorHandler(
  logInternalError?: InternalErrorLogger
): ErrorHandler {
  const defaultErrorHandler = createErrorHandler(logInternalError)

  return async (error, context) => {
    const response = await defaultErrorHandler(error, context)

    return normalizeLearnerErrorResponse({
      path: context.req.path,
      requestId: readRequestId(context.get("requestId")),
      response,
    })
  }
}

function readRequestId(value: unknown): string {
  return typeof value === "string" && value.length > 0
    ? value
    : crypto.randomUUID()
}

async function normalizeLearnerErrorResponse(input: {
  readonly path: string
  readonly requestId: string
  readonly response: Response
}): Promise<Response> {
  const body = await readJson(input.response)
  const parsedCanonicalError = learnerApiErrorSchema.safeParse(body)
  const parsedLegacyError = ErrorResponseSchema.safeParse(body)
  const error =
    input.response.status >= 500
      ? createStandardError("INTERNAL_SERVER_ERROR", input.requestId)
      : parsedCanonicalError.success
        ? parsedCanonicalError.data
        : parsedLegacyError.success
          ? mapLegacyError({
              code: parsedLegacyError.data.code,
              errors: parsedLegacyError.data.errors,
              path: input.path,
              requestId: input.requestId,
              status: input.response.status,
            })
          : input.response.status === 404
            ? createStandardError(
                mapLegacyCode("NOT_FOUND", input.path, input.response.status),
                input.requestId
              )
            : createStandardError("INTERNAL_SERVER_ERROR", input.requestId)
  const parsedError = learnerApiErrorSchema.parse(error)
  const headers = new Headers(input.response.headers)

  headers.set("Content-Type", "application/json")

  return new Response(JSON.stringify(parsedError), {
    headers,
    status: statusByCode[parsedError.code],
  })
}

function mapLegacyError(input: {
  readonly code: string
  readonly errors:
    | readonly {
        readonly message: string
        readonly path: string
      }[]
    | undefined
  readonly path: string
  readonly requestId: string
  readonly status: number
}): LearnerApiError {
  if (
    input.code === "HTTP_EXCEPTION" ||
    input.code === "VALIDATION_ERROR" ||
    input.code === "VALIDATION_FAILED"
  ) {
    return {
      code: "VALIDATION_ERROR",
      message: messageByCode.VALIDATION_ERROR,
      requestId: input.requestId,
      violations: (input.errors ?? []).map(({ message, path }) => ({
        message,
        path,
      })),
    }
  }

  const code = mapLegacyCode(input.code, input.path, input.status)

  return createStandardError(code, input.requestId)
}

function mapLegacyCode(
  code: string,
  path: string,
  status: number
): Exclude<LearnerApiErrorCode, "VALIDATION_ERROR"> {
  switch (code) {
    case "FORBIDDEN":
      return "FORBIDDEN"
    case "AI_FEEDBACK_ANSWER_NOT_FOUND":
      return "AI_FEEDBACK_ANSWER_NOT_FOUND"
    case "ATTEMPT_IN_PROGRESS":
      return "ATTEMPT_IN_PROGRESS"
    case "ATTEMPT_LIMIT_EXCEEDED":
      return "ATTEMPT_LIMIT_EXCEEDED"
    case "COURSE_NOT_FOUND":
      return "COURSE_NOT_FOUND"
    case "CURRICULUM_VERSION_CHANGED":
      return "CURRICULUM_VERSION_CHANGED"
    case "INTERNAL_SERVER_ERROR":
      return "INTERNAL_SERVER_ERROR"
    case "INVALID_CURSOR":
      return "INVALID_CURSOR"
    case "LESSON_LOCKED":
      return "LESSON_LOCKED"
    case "LESSON_NOT_FOUND":
      return "LESSON_NOT_FOUND"
    case "PROVIDER_UNAVAILABLE":
      return "PROVIDER_UNAVAILABLE"
    case "STEP_SEQUENCE_CONFLICT":
      return "STEP_SEQUENCE_CONFLICT"
    case "UNAUTHENTICATED":
      return "UNAUTHENTICATED"
    case "NOT_FOUND":
      if (path.startsWith("/courses")) return "COURSE_NOT_FOUND"
      if (path.startsWith("/lessons")) return "LESSON_NOT_FOUND"
      return "NOT_FOUND"
    default:
      return status === 401 ? "UNAUTHENTICATED" : "INTERNAL_SERVER_ERROR"
  }
}

function createStandardError(
  code: Exclude<LearnerApiErrorCode, "VALIDATION_ERROR">,
  requestId: string
): LearnerApiError {
  return {
    code,
    message: messageByCode[code],
    requestId,
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.clone().json()
  } catch {
    return null
  }
}
