import type {
  LearnerProgressListQuery,
  LearnerProgressPage,
} from "@workspace/contracts/learning"
import { learnerProgressPageSchema } from "@workspace/contracts/learning"

import type { LearnerCursorCodec } from "#core/modules/learning/application/learner-cursor"
import type { LearnerReadModelRepository } from "#core/modules/learning/application/ports/learner-read-model.repository"
import { err, ok, type Result } from "#core/shared/result"

export type ProgressServiceError = { readonly kind: "invalid-cursor" }

export type ProgressService = {
  readonly readProgress: (
    userId: string,
    query: LearnerProgressListQuery
  ) => Promise<Result<LearnerProgressPage, ProgressServiceError>>
}

export function createProgressService({
  cursorCodec,
  readModelRepository,
}: {
  readonly cursorCodec: LearnerCursorCodec
  readonly readModelRepository: LearnerReadModelRepository
}): ProgressService {
  return {
    async readProgress(userId, query) {
      const fingerprint = cursorCodec.createFingerprint({
        status: query.status,
      })
      const learnerScope = cursorCodec.createLearnerScope(userId)
      const after =
        query.cursor === undefined
          ? undefined
          : cursorCodec.decode(query.cursor, {
              endpoint: "progress",
              fingerprint,
              learnerScope,
            })

      if (query.cursor !== undefined && after === null) {
        return err({ kind: "invalid-cursor" })
      }

      const page = await readModelRepository.listProgress({
        after: after ?? undefined,
        limit: query.limit,
        status: query.status,
        userId,
      })

      return ok(
        learnerProgressPageSchema.parse({
          items: page.items,
          nextCursor:
            page.nextPosition === null
              ? null
              : cursorCodec.encode({
                  endpoint: "progress",
                  fingerprint,
                  learnerScope,
                  position: page.nextPosition,
                }),
        })
      )
    },
  }
}
