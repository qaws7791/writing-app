import type { DraftId, UserId } from "../../../shared/brand/index"
import type { DraftRepository } from "../../../shared/ports/index"
import {
  draftForbidden,
  draftNotFound,
  type DraftModuleError,
} from "../errors/index"

export type DeleteDraftUseCaseOutput = { kind: "success" } | DraftModuleError

export type DeleteDraftUseCaseDependencies = {
  readonly draftRepository: DraftRepository
}

/**
 * Deletes a draft.
 */
export function makeDeleteDraftUseCase(
  dependencies: DeleteDraftUseCaseDependencies
) {
  return async (
    userId: UserId,
    draftId: DraftId
  ): Promise<DeleteDraftUseCaseOutput> => {
    const result = await dependencies.draftRepository.delete(userId, draftId)

    if (result.kind === "not-found") {
      return draftNotFound("초안을 찾을 수 없습니다.", draftId)
    }

    if (result.kind === "forbidden") {
      return draftForbidden(
        "다른 사용자의 초안에는 접근할 수 없습니다.",
        result.ownerId
      )
    }

    return { kind: "success" }
  }
}

export async function deleteDraftUseCase(
  userId: UserId,
  draftId: DraftId,
  draftRepository: DraftRepository
): Promise<DeleteDraftUseCaseOutput> {
  return makeDeleteDraftUseCase({
    draftRepository,
  })(userId, draftId)
}
