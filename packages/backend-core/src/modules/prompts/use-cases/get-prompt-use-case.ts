import type { PromptId, UserId } from "../../../shared/brand/index"
import type {
  PromptRepository,
  PromptDetail,
} from "../../../shared/ports/index"
import { promptNotFound, type PromptModuleError } from "../errors/index"

export type GetPromptUseCaseOutput =
  | { kind: "success"; prompt: PromptDetail }
  | PromptModuleError

export type GetPromptUseCaseDependencies = {
  readonly promptRepository: PromptRepository
}

/**
 * Retrieves a single prompt by ID.
 */
export function makeGetPromptUseCase(
  dependencies: GetPromptUseCaseDependencies
) {
  return async (
    userId: UserId,
    promptId: PromptId
  ): Promise<GetPromptUseCaseOutput> => {
    const prompt = await dependencies.promptRepository.getById(userId, promptId)

    if (!prompt) {
      return promptNotFound("글감을 찾을 수 없습니다.", promptId)
    }

    return { kind: "success", prompt }
  }
}

export async function getPromptUseCase(
  userId: UserId,
  promptId: PromptId,
  promptRepository: PromptRepository
): Promise<GetPromptUseCaseOutput> {
  return makeGetPromptUseCase({
    promptRepository,
  })(userId, promptId)
}
