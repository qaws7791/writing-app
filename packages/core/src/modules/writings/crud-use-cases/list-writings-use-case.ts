import type { UserId } from "../../../shared/brand/index"
import type {
  CursorPage,
  CursorPageParams,
} from "../../../shared/pagination/index"
import type {
  WritingRepository,
  WritingSummary,
} from "../../../shared/ports/index"

export type ListWritingsUseCaseOutput = CursorPage<WritingSummary>

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
    params?: CursorPageParams
  ): Promise<ListWritingsUseCaseOutput> =>
    dependencies.writingRepository.list(userId, params)
}

export async function listWritingsUseCase(
  userId: UserId,
  writingRepository: WritingRepository,
  params?: CursorPageParams
): Promise<ListWritingsUseCaseOutput> {
  return makeListWritingsUseCase({
    writingRepository,
  })(userId, params)
}
