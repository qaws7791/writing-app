import type { ApiError } from "@workspace/contracts/api-error"
import {
  GeneratedApiClientError,
  type GeneratedApiClientErrorDetail,
} from "@workspace/http-client/generated-fetch"
import {
  httpApiFailure,
  httpApiOk,
  type HttpApiFailure,
  type HttpApiResult,
} from "@workspace/http-client/api-result"

export type AdminRequestError =
  | Readonly<
      ApiError & {
        kind: "http"
        retryAfterSeconds: number | null
        status: number
      }
    >
  | Readonly<{
      code: "CONTRACT_ERROR"
      kind: "contract"
      message: string
      requestId: "client"
      retryAfterSeconds: null
      status: number | null
    }>
  | Readonly<{
      code: "NETWORK_ERROR"
      kind: "network"
      message: string
      requestId: "client"
      retryAfterSeconds: null
      status: null
    }>
  | Readonly<{
      code: "REQUEST_ABORTED"
      kind: "aborted"
      message: string
      requestId: "client"
      retryAfterSeconds: null
      status: null
    }>

export type AdminRequestResult<TValue> = HttpApiResult<
  TValue,
  AdminRequestError
>

export async function settleAdminApiRequest<TValue>(
  request: Promise<TValue>
): Promise<AdminRequestResult<TValue>> {
  try {
    return httpApiOk(await request)
  } catch (cause) {
    if (!(cause instanceof GeneratedApiClientError)) throw cause
    return httpApiFailure(toAdminRequestError(cause.detail))
  }
}

export function invalidAdminRequestFailure(): HttpApiFailure<AdminRequestError> {
  return httpApiFailure({
    code: "VALIDATION_FAILED",
    kind: "http",
    message: "요청 내용을 확인해 주세요.",
    requestId: "client",
    retryAfterSeconds: null,
    status: 400,
  })
}

export function unauthenticatedAdminRequestFailure(): HttpApiFailure<AdminRequestError> {
  return httpApiFailure({
    code: "UNAUTHORIZED",
    kind: "http",
    message: "관리자 로그인이 필요합니다.",
    requestId: "client",
    retryAfterSeconds: null,
    status: 401,
  })
}

export function isAdminRequestAuthenticationError(
  error: AdminRequestError
): boolean {
  return (
    error.kind === "http" &&
    (error.status === 401 ||
      error.status === 403 ||
      error.code === "UNAUTHORIZED" ||
      error.code === "FORBIDDEN")
  )
}

function toAdminRequestError(
  detail: GeneratedApiClientErrorDetail
): AdminRequestError {
  switch (detail.kind) {
    case "aborted":
      return {
        code: "REQUEST_ABORTED",
        kind: "aborted",
        message: "API 요청이 중단되었습니다.",
        requestId: "client",
        retryAfterSeconds: null,
        status: null,
      }
    case "contract":
      return {
        code: "CONTRACT_ERROR",
        kind: "contract",
        message: "API 계약을 해석할 수 없습니다.",
        requestId: "client",
        retryAfterSeconds: null,
        status: detail.status,
      }
    case "http":
      return {
        ...detail.error,
        kind: "http",
        retryAfterSeconds: detail.retryAfterSeconds,
        status: detail.status,
      }
    case "network":
      return {
        code: "NETWORK_ERROR",
        kind: "network",
        message: "네트워크 연결을 확인해 주세요.",
        requestId: "client",
        retryAfterSeconds: null,
        status: null,
      }
  }
}
