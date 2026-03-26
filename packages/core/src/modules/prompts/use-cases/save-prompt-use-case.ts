import type { PromptId, UserId } from "../../../shared/brand/index"
import type { PromptRepository } from "../prompt-port"
import { promptNotFound, type PromptModuleError } from "../errors/index"

export type SavePromptUseCaseOutput =
  | { kind: "saved"; savedAt: string }
  | PromptModuleError

export type SavePromptUseCaseDependencies = {
  readonly promptRepository: PromptRepository
}

/**
 * Saves a prompt for the user.
 */
export function makeSavePromptUseCase(
  dependencies: SavePromptUseCaseDependencies
) {
  return async (
    userId: UserId,
    promptId: PromptId
  ): Promise<SavePromptUseCaseOutput> => {
    const result = await dependencies.promptRepository.save(userId, promptId)

    if (result.kind === "not-found") {
      return promptNotFound("글감을 찾을 수 없습니다.", promptId)
    }

    return {
      kind: "saved",
      savedAt: result.savedAt,
    }
  }
}

export async function savePromptUseCase(
  userId: UserId,
  promptId: PromptId,
  promptRepository: PromptRepository
): Promise<SavePromptUseCaseOutput> {
  return makeSavePromptUseCase({
    promptRepository,
  })(userId, promptId)
}
