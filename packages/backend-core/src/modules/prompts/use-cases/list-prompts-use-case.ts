import type { UserId } from "../../../shared/brand/index"
import type {
  PromptRepository,
  PromptListFilters,
  PromptSummary,
} from "../../../shared/ports/index"

export type ListPromptsUseCaseOutput = readonly PromptSummary[]

/**
 * Lists prompts with optional filters.
 */
export async function listPromptsUseCase(
  userId: UserId,
  filters: PromptListFilters,
  promptRepository: PromptRepository
): Promise<ListPromptsUseCaseOutput> {
  return promptRepository.list(userId, filters)
}
