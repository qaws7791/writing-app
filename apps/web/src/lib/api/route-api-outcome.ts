import type { ApiError } from "@/lib/api/api-error"
import type { ApiResult } from "@/lib/api/api-result"

export type RouteApiFailureKind =
  | "authentication"
  | "network"
  | "not-found"
  | "server"

export type RouteApiFailure = {
  readonly error: ApiError
  readonly kind: RouteApiFailureKind
}

export type RouteApiOutcome<TValue> =
  | {
      readonly status: "ok"
      readonly value: TValue
    }
  | {
      readonly failure: RouteApiFailure
      readonly status: "error"
    }

export function toRouteApiOutcome<TValue>(
  result: ApiResult<TValue>
): RouteApiOutcome<TValue> {
  if (result.status === "ok") {
    return {
      status: "ok",
      value: result.value,
    }
  }

  return {
    failure: classifyRouteApiFailure(result.error),
    status: "error",
  }
}

export function readOptionalRouteApiValue<TValue>(
  result: ApiResult<TValue>
): TValue | undefined {
  return result.status === "ok" ? result.value : undefined
}

export function describeRouteApiFailure(failure: RouteApiFailure): string {
  switch (failure.kind) {
    case "authentication":
      return "로그인이 필요합니다."
    case "network":
      return "네트워크 연결을 확인한 뒤 다시 시도해 주세요."
    case "not-found":
      return "요청한 항목을 찾을 수 없습니다."
    case "server":
      return failure.error.message
  }
}

function classifyRouteApiFailure(error: ApiError): RouteApiFailure {
  switch (error.code) {
    case "unauthorized":
      return {
        error,
        kind: "authentication",
      }
    case "not-found":
      return {
        error,
        kind: "not-found",
      }
    case "network-error":
      return {
        error,
        kind: "network",
      }
    default:
      return {
        error,
        kind: "server",
      }
  }
}
