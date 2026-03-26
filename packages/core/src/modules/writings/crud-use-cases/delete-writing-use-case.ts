import type { WritingId, UserId } from "../../../shared/brand/index"
import type { WritingRepository } from "../../../shared/ports/index"
import {
  writingForbidden,
  writingNotFound,
  type WritingModuleError,
} from "../writing-error"

export type DeleteWritingUseCaseOutput =
  | { kind: "success" }
  | WritingModuleError

export type DeleteWritingUseCaseDependencies = {
  readonly writingRepository: WritingRepository
}

/**
 * Deletes a writing.
 */
export function makeDeleteWritingUseCase(
  dependencies: DeleteWritingUseCaseDependencies
) {
  return async (
    userId: UserId,
    writingId: WritingId
  ): Promise<DeleteWritingUseCaseOutput> => {
    const result = await dependencies.writingRepository.delete(
      userId,
      writingId
    )

    if (result.kind === "not-found") {
      return writingNotFound("글을 찾을 수 없습니다.", writingId)
    }

    if (result.kind === "forbidden") {
      return writingForbidden(
        "다른 사용자의 글에는 접근할 수 없습니다.",
        result.ownerId
      )
    }

    return { kind: "success" }
  }
}

export async function deleteWritingUseCase(
  userId: UserId,
  writingId: WritingId,
  writingRepository: WritingRepository
): Promise<DeleteWritingUseCaseOutput> {
  return makeDeleteWritingUseCase({
    writingRepository,
  })(userId, writingId)
}
