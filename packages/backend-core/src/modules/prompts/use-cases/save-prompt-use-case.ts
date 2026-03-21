import type { PromptId, UserId } from "../../../shared/brand/index"
import type { PromptRepository } from "../../../shared/ports/index"
import { promptNotFound, type PromptModuleError } from "../errors/index"

export type SavePromptUseCaseOutput =
  | { kind: "saved"; savedAt: string }
  | PromptModuleError

/**
 * Saves a prompt for the user.
 */
export async function savePromptUseCase(
  userId: UserId,
  promptId: PromptId,
  promptRepository: PromptRepository
): Promise<SavePromptUseCaseOutput> {
  const result = await promptRepository.save(userId, promptId)

  if (result.kind === "not-found") {
    return promptNotFound("글감을 찾을 수 없습니다.")
  }

  return {
    kind: "saved",
    savedAt: result.savedAt,
  }
}
