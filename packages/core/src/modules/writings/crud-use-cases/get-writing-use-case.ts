import type { WritingId, UserId } from "../../../shared/brand/index"
import type { WritingDetail } from "../writing-types"
import type { WritingRepository } from "../writing-crud-port"
import {
  writingForbidden,
  writingNotFound,
  type WritingModuleError,
} from "../writing-error"

export type GetWritingUseCaseOutput =
  | { kind: "success"; writing: WritingDetail }
  | WritingModuleError

export type GetWritingUseCaseDependencies = {
  readonly writingRepository: WritingRepository
}

/**
 * Retrieves a single WritingFull by ID.
 */
export function makeGetWritingUseCase(
  dependencies: GetWritingUseCaseDependencies
) {
  return async (
    userId: UserId,
    writingId: WritingId
  ): Promise<GetWritingUseCaseOutput> => {
    const result = await dependencies.writingRepository.getById(
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

    return { writing: result.writing, kind: "success" }
  }
}

export async function getWritingUseCase(
  userId: UserId,
  writingId: WritingId,
  writingRepository: WritingRepository
): Promise<GetWritingUseCaseOutput> {
  return makeGetWritingUseCase({
    writingRepository,
  })(userId, writingId)
}
