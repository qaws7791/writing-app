import type { UserId } from "../../../shared/brand/index"
import type {
  PromptRepository,
  PromptListFilters,
  PromptSummary,
} from "../../../shared/ports/index"

export type ListPromptsUseCaseOutput = readonly PromptSummary[]

export type ListPromptsUseCaseDependencies = {
  readonly promptRepository: PromptRepository
}

/**
 * Lists prompts with optional filters.
 */
export function makeListPromptsUseCase(
  dependencies: ListPromptsUseCaseDependencies
) {
  return async (
    userId: UserId,
    filters: PromptListFilters
  ): Promise<ListPromptsUseCaseOutput> =>
    dependencies.promptRepository.list(userId, filters)
}

export async function listPromptsUseCase(
  userId: UserId,
  filters: PromptListFilters,
  promptRepository: PromptRepository
): Promise<ListPromptsUseCaseOutput> {
  return makeListPromptsUseCase({
    promptRepository,
  })(userId, filters)
}
