import { z } from "zod"

export type ApiError =
  | {
      code: "unauthorized"
      message: string
    }
  | {
      code: "not-found"
      message: string
    }
  | {
      code: "invalid-request"
      message: string
    }
  | {
      code: "retry-limit-exceeded"
      message: string
    }
  | {
      code: "unavailable"
      message: string
    }
  | {
      code: "network-error"
      message: string
    }
  | {
      code: "contract-error"
      message: string
    }

export function apiErrorFromResponseBody(
  status: number,
  body: unknown
): ApiError {
  const parsedBody = apiErrorResponseBodySchema.safeParse(body)

  if (!parsedBody.success) {
    if (status >= 500) {
      return { code: "unavailable", message: "서버를 사용할 수 없습니다." }
    }

    return contractApiError()
  }

  const { code, message } = parsedBody.data

  if (code === "unauthorized") {
    return { code: "unauthorized", message }
  }

  if (
    code === "course-not-found" ||
    code === "lesson-not-found" ||
    code === "answer-not-found" ||
    code === "feedback-step-not-found" ||
    status === 404
  ) {
    return { code: "not-found", message }
  }

  if (code === "invalid-request" || status === 400) {
    return { code: "invalid-request", message }
  }

  if (code === "feedback-retry-limit-exceeded" || status === 429) {
    return { code: "retry-limit-exceeded", message }
  }

  if (
    status >= 500 ||
    code === "database-unavailable" ||
    code === "ai-feedback-unavailable"
  ) {
    return { code: "unavailable", message: "서버를 사용할 수 없습니다." }
  }

  return {
    ...contractApiError(),
  }
}

export function networkApiError(): ApiError {
  return {
    code: "network-error",
    message: "네트워크 요청에 실패했습니다.",
  }
}

const apiErrorResponseBodySchema = z.object({
  code: z.string(),
  message: z.string(),
})

export function contractApiError(): ApiError {
  return {
    code: "contract-error",
    message: "서버 응답이 예상한 계약과 일치하지 않습니다.",
  }
}
