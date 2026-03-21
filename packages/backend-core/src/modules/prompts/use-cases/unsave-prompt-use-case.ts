import type { PromptId, UserId } from "../../../shared/brand/index"
import type { PromptRepository } from "../../../shared/ports/index"
import { promptNotFound, type PromptModuleError } from "../errors/index"

export type UnsavePromptUseCaseOutput = { kind: "success" } | PromptModuleError

/**
 * Unsaves a prompt for the user.
 */
export async function unsavePromptUseCase(
  userId: UserId,
  promptId: PromptId,
  promptRepository: PromptRepository
): Promise<UnsavePromptUseCaseOutput> {
  const existed = await promptRepository.unsave(userId, promptId)

  if (!existed) {
    return promptNotFound("저장된 글감을 찾을 수 없습니다.")
  }

  return { kind: "success" }
}
