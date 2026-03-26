import type { UserId } from "../../../shared/brand/index"
import type {
  WritingRepository,
  WritingSummary,
} from "../../../shared/ports/index"

export type ListWritingsUseCaseOutput = readonly WritingSummary[]

export type ListWritingsUseCaseDependencies = {
  readonly writingRepository: WritingRepository
}

/**
 * Lists user's writings.
 */
export function makeListWritingsUseCase(
  dependencies: ListWritingsUseCaseDependencies
) {
  return async (
    userId: UserId,
    limit?: number
  ): Promise<ListWritingsUseCaseOutput> =>
    dependencies.writingRepository.list(userId, limit)
}

export async function listWritingsUseCase(
  userId: UserId,
  writingRepository: WritingRepository,
  limit?: number
): Promise<ListWritingsUseCaseOutput> {
  return makeListWritingsUseCase({
    writingRepository,
  })(userId, limit)
}
