import type { AdminId } from "@workspace/types/ids"
import { err, ok, type Result } from "@workspace/kernel/result"

import type { ContentError } from "#content/domain/content-error"

export type ContentActor = Readonly<{
  adminId: AdminId
  mutation: "allowed" | "forbidden"
}>

export type ContentRuntimeEnvironment = "development" | "production" | "test"

export function authorizeContentMutation(
  actor: ContentActor
): Result<void, ContentError> {
  return actor.mutation === "allowed"
    ? ok(undefined)
    : err({ kind: "content-forbidden" })
}

export function authorizeContentReset(input: {
  readonly confirmed: boolean
  readonly environment: ContentRuntimeEnvironment
}): Result<void, ContentError> {
  return input.confirmed && input.environment !== "production"
    ? ok(undefined)
    : err({ kind: "content-reset-forbidden" })
}
