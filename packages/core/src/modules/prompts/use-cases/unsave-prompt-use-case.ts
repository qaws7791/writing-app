import type { PromptId, UserId } from "../../../shared/brand/index"
import type { PromptRepository } from "../prompt-port"
import { promptNotFound, type PromptModuleError } from "../errors/index"

export type UnsavePromptUseCaseOutput = { kind: "success" } | PromptModuleError

export type UnsavePromptUseCaseDependencies = {
  readonly promptRepository: PromptRepository
}

/**
 * Unsaves a prompt for the user.
 */
export function makeUnsavePromptUseCase(
  dependencies: UnsavePromptUseCaseDependencies
) {
  return async (
    userId: UserId,
    promptId: PromptId
  ): Promise<UnsavePromptUseCaseOutput> => {
    const existed = await dependencies.promptRepository.unsave(userId, promptId)

    if (!existed) {
      return promptNotFound("저장된 글감을 찾을 수 없습니다.", promptId)
    }

    return { kind: "success" }
  }
}

export async function unsavePromptUseCase(
  userId: UserId,
  promptId: PromptId,
  promptRepository: PromptRepository
): Promise<UnsavePromptUseCaseOutput> {
  return makeUnsavePromptUseCase({
    promptRepository,
  })(userId, promptId)
}
