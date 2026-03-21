import type { UserId } from "../../../shared/brand/index"
import type { DraftRepository, DraftSummary } from "../../../shared/ports/index"

export type ListDraftsUseCaseOutput = readonly DraftSummary[]

export type ListDraftsUseCaseDependencies = {
  readonly draftRepository: DraftRepository
}

/**
 * Lists user's drafts.
 */
export function makeListDraftsUseCase(
  dependencies: ListDraftsUseCaseDependencies
) {
  return async (
    userId: UserId,
    limit?: number
  ): Promise<ListDraftsUseCaseOutput> =>
    dependencies.draftRepository.list(userId, limit)
}

export async function listDraftsUseCase(
  userId: UserId,
  draftRepository: DraftRepository,
  limit?: number
): Promise<ListDraftsUseCaseOutput> {
  return makeListDraftsUseCase({
    draftRepository,
  })(userId, limit)
}
