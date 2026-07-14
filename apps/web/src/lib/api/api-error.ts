import type { HttpNetworkError } from "@workspace/http-client"

export type ApiErrorCode =
  | "account-unavailable"
  | "ai-feedback-answer-not-found"
  | "ai-feedback-target-invalid"
  | "attempt-limit-exceeded"
  | "attempt-in-progress"
  | "contract-error"
  | "invalid-request"
  | "network-error"
  | "not-found"
  | "provider-unavailable"
  | "progress-conflict"
  | "unauthorized"

export type ApiError =
  | NetworkApiError
  | {
      readonly code: Exclude<ApiErrorCode, "network-error">
      readonly message: string
      readonly status?: number
    }

export type NetworkApiError = {
  readonly code: "network-error"
  readonly message: string
  readonly network: HttpNetworkError
}

type ServerApiErrorCode = Exclude<ApiErrorCode, "network-error">

const serverCodeMap = {
  ACCOUNT_UNAVAILABLE: "account-unavailable",
  AI_FEEDBACK_ANSWER_NOT_FOUND: "ai-feedback-answer-not-found",
  AI_FEEDBACK_TARGET_INVALID: "ai-feedback-target-invalid",
  ATTEMPT_LIMIT_EXCEEDED: "attempt-limit-exceeded",
  ATTEMPT_IN_PROGRESS: "attempt-in-progress",
  HTTP_EXCEPTION: "invalid-request",
  INVALID_REQUEST: "invalid-request",
  NOT_FOUND: "not-found",
  PROVIDER_UNAVAILABLE: "provider-unavailable",
  PROGRESS_CONFLICT: "progress-conflict",
  UNAUTHORIZED: "unauthorized",
  VALIDATION_FAILED: "invalid-request",
} as const satisfies Record<string, ServerApiErrorCode>

const messageByCode = {
  "account-unavailable": "사용할 수 없는 계정입니다.",
  "ai-feedback-answer-not-found":
    "코칭할 작성 답변을 찾을 수 없습니다. 쓰기 단계로 돌아가 답변을 다시 저장해 주세요.",
  "ai-feedback-target-invalid":
    "AI 코칭 대상 설정이 올바르지 않습니다. 관리자에게 문의해 주세요.",
  "attempt-limit-exceeded": "AI 코칭 시도 횟수를 모두 사용했습니다.",
  "attempt-in-progress": "AI 코칭 요청을 처리하고 있습니다.",
  "contract-error": "API 응답을 해석할 수 없습니다.",
  "invalid-request": "요청 내용을 확인해 주세요.",
  "network-error": "네트워크 연결을 확인해 주세요.",
  "not-found": "요청한 항목을 찾을 수 없습니다.",
  "provider-unavailable": "AI 코칭을 잠시 사용할 수 없습니다.",
  "progress-conflict": "다른 요청에서 학습 진행이 갱신되었습니다.",
  unauthorized: "로그인이 필요합니다.",
} as const satisfies Record<ApiErrorCode, string>

export function toApiError(status: number, body: unknown): ApiError {
  const serverCode = readServerErrorCode(body)

  if (serverCode === null) {
    return {
      code: "contract-error",
      message: messageByCode["contract-error"],
      status,
    }
  }

  return {
    code: serverCode,
    message: messageByCode[serverCode],
    status,
  }
}

export function networkApiError(network: HttpNetworkError): ApiError {
  return {
    code: "network-error",
    message: messageByCode["network-error"],
    network,
  }
}

export function contractApiError(status?: number): ApiError {
  return {
    code: "contract-error",
    message: messageByCode["contract-error"],
    status,
  }
}

function readServerErrorCode(body: unknown): ServerApiErrorCode | null {
  if (
    typeof body !== "object" ||
    body === null ||
    !("code" in body) ||
    typeof body.code !== "string"
  ) {
    return null
  }

  if (!isServerErrorCode(body.code)) {
    return null
  }

  return serverCodeMap[body.code]
}

function isServerErrorCode(code: string): code is keyof typeof serverCodeMap {
  return code in serverCodeMap
}
