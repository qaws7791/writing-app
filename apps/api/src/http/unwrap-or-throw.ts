import { toApplicationError, type DomainError } from "@workspace/core"
import type { Result } from "neverthrow"

/**
 * @deprecated Result를 그대로 핸들러에서 반환하세요. defineRoute가 자동으로 언래핑합니다.
 *
 * ```ts
 * // 이전 (deprecated)
 * return unwrapOrThrow(await someUseCase(...))
 *
 * // 권장
 * return someUseCase(...)
 * ```
 */
export function unwrapOrThrow<TValue, TError extends DomainError>(
  result: Result<TValue, TError>
): TValue {
  if (result.isErr()) {
    throw toApplicationError(result.error)
  }

  return result.value
}
