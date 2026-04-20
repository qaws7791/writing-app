import type { DomainError } from "../../../shared/error/index"
import { createValidationError } from "../../../shared/error/index"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isDomainError(error: unknown): error is DomainError {
  return (
    isRecord(error) &&
    typeof error.code === "string" &&
    typeof error.message === "string"
  )
}

export function normalizeSubmitStepError(error: unknown): DomainError {
  if (isDomainError(error)) {
    return error
  }

  return createValidationError("세션 스텝을 처리하지 못했습니다.", "session")
}
