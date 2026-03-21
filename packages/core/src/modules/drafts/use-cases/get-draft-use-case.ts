import type { DraftId, UserId } from "../../../shared/brand/index"
import type { DraftDetail, DraftRepository } from "../../../shared/ports/index"
import {
  draftForbidden,
  draftNotFound,
  type DraftModuleError,
} from "../errors/index"

export type GetDraftUseCaseOutput =
  | { kind: "success"; draft: DraftDetail }
  | DraftModuleError

export type GetDraftUseCaseDependencies = {
  readonly draftRepository: DraftRepository
}

/**
 * Retrieves a single draft by ID.
 */
export function makeGetDraftUseCase(dependencies: GetDraftUseCaseDependencies) {
  return async (
    userId: UserId,
    draftId: DraftId
  ): Promise<GetDraftUseCaseOutput> => {
    const result = await dependencies.draftRepository.getById(userId, draftId)

    if (result.kind === "not-found") {
      return draftNotFound("초안을 찾을 수 없습니다.", draftId)
    }

    if (result.kind === "forbidden") {
      return draftForbidden(
        "다른 사용자의 초안에는 접근할 수 없습니다.",
        result.ownerId
      )
    }

    return { draft: result.draft, kind: "success" }
  }
}

export async function getDraftUseCase(
  userId: UserId,
  draftId: DraftId,
  draftRepository: DraftRepository
): Promise<GetDraftUseCaseOutput> {
  return makeGetDraftUseCase({
    draftRepository,
  })(userId, draftId)
}
