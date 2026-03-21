import type { UserId } from "../../../shared/brand/index"
import type { DraftRepository, DraftSummary } from "../../../shared/ports/index"

export type ListDraftsUseCaseOutput = readonly DraftSummary[]

/**
 * Lists user's drafts.
 */
export async function listDraftsUseCase(
  userId: UserId,
  draftRepository: DraftRepository,
  limit?: number
): Promise<ListDraftsUseCaseOutput> {
  const summaries = await draftRepository.list(userId, limit)
  return summaries
}
