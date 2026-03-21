import type { PromptId, UserId } from "../../../shared/brand/index"
import type {
  PromptRepository,
  PromptListFilters,
  PromptDetail,
} from "../../../shared/ports/index"
import { promptNotFound, type PromptModuleError } from "../errors/index"

export type GetPromptUseCaseOutput =
  | { kind: "success"; prompt: PromptDetail }
  | PromptModuleError

/**
 * Retrieves a single prompt by ID.
 */
export async function getPromptUseCase(
  userId: UserId,
  promptId: PromptId,
  promptRepository: PromptRepository
): Promise<GetPromptUseCaseOutput> {
  const prompt = await promptRepository.getById(userId, promptId)

  if (!prompt) {
    return promptNotFound("글감을 찾을 수 없습니다.")
  }

  return { kind: "success", prompt }
}
