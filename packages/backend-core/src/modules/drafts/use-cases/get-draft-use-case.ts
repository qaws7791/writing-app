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

/**
 * Retrieves a single draft by ID.
 */
export async function getDraftUseCase(
  userId: UserId,
  draftId: DraftId,
  draftRepository: DraftRepository
): Promise<GetDraftUseCaseOutput> {
  const result = await draftRepository.getById(userId, draftId)

  if (result.kind === "not-found") {
    return draftNotFound("초안을 찾을 수 없습니다.")
  }

  if (result.kind === "forbidden") {
    return draftForbidden(
      "다른 사용자의 초안에는 접근할 수 없습니다.",
      result.ownerId
    )
  }

  return { draft: result.draft, kind: "success" }
}
