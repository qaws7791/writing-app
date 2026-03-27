import { toApplicationError, type DomainError } from "@workspace/core"
import type { Result } from "neverthrow"

export function unwrapOrThrow<TValue, TError extends DomainError>(
  result: Result<TValue, TError>
): TValue {
  if (result.isErr()) {
    throw toApplicationError(result.error)
  }

  return result.value
}
