import type { DraftId, UserId } from "../../../shared/brand/index"
import type { DraftRepository } from "../../../shared/ports/index"
import {
  draftForbidden,
  draftNotFound,
  type DraftModuleError,
} from "../errors/index"

export type DeleteDraftUseCaseOutput = { kind: "success" } | DraftModuleError

/**
 * Deletes a draft.
 */
export async function deleteDraftUseCase(
  userId: UserId,
  draftId: DraftId,
  draftRepository: DraftRepository
): Promise<DeleteDraftUseCaseOutput> {
  const result = await draftRepository.delete(userId, draftId)

  if (result.kind === "not-found") {
    return draftNotFound("초안을 찾을 수 없습니다.")
  }

  if (result.kind === "forbidden") {
    return draftForbidden(
      "다른 사용자의 초안에는 접근할 수 없습니다.",
      result.ownerId
    )
  }

  return { kind: "success" }
}
