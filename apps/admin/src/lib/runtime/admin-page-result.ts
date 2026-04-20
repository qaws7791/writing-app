import { notFound } from "next/navigation"
import type { DomainError } from "@workspace/core/shared"
import type { ResultAsync } from "neverthrow"

export async function unwrapAdminPageResult<TValue>(
  result: ResultAsync<TValue, DomainError>
): Promise<TValue> {
  return (await result).match(
    (value) => value,
    () => notFound()
  )
}
