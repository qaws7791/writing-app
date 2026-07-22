import { err, type Result } from "@workspace/kernel/result"

import {
  authorizeContentMutation,
  type ContentActor,
} from "#content/domain/content-admin-policy"
import type { ContentError } from "#content/domain/content-error"
import type {
  ContentApplicationDependencies,
  ContentResetResult,
} from "#content/application/ports/content-ports"

export type ResetContentUseCase = (command: {
  readonly actor: ContentActor
}) => Promise<Result<ContentResetResult, ContentError>>

export function createResetContentUseCase(
  dependencies: ContentApplicationDependencies
): ResetContentUseCase {
  return async (command) => {
    const authorization = authorizeContentMutation(command.actor)
    if (authorization.isErr()) return err(authorization.error)

    const guard = dependencies.resetGuard.authorize()
    if (guard.isErr()) return err(guard.error)

    return dependencies.repository.resetContent({
      now: dependencies.clock.now(),
    })
  }
}
