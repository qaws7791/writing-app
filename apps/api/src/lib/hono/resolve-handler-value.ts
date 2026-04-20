import { toApplicationError, type DomainError } from "@workspace/core"
import type { Result } from "neverthrow"

import type { SuccessStatusCode } from "./route-status-response"
import { RouteStatusResponse } from "./route-status-response"

function isResult(value: unknown): value is Result<unknown, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "isOk" in value &&
    "isErr" in value &&
    typeof (value as { isOk: unknown }).isOk === "function"
  )
}

export function resolveHandlerValue(value: unknown): {
  data: unknown
  status?: SuccessStatusCode
} {
  if (isResult(value)) {
    if (value.isErr()) {
      const error = value.error
      if (error instanceof Error) throw error
      throw toApplicationError(error as DomainError)
    }

    return resolveHandlerValue(value.value)
  }

  if (value instanceof RouteStatusResponse) {
    return { data: value.data, status: value.status }
  }

  return { data: value }
}
