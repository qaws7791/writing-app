import type {
  PromptId,
  PromptListFilters,
  PromptRepository,
  UserId,
} from "@workspace/domain"

import { NotFoundError } from "./errors.js"

export function createPromptUseCases(promptRepository: PromptRepository) {
  return {
    async getPrompt(userId: UserId, promptId: PromptId) {
      const prompt = await promptRepository.getById(userId, promptId)

      if (!prompt) {
        throw new NotFoundError("글감을 찾을 수 없습니다.")
      }

      return prompt
    },

    async listPrompts(userId: UserId, filters: PromptListFilters) {
      return promptRepository.list(userId, filters)
    },

    async savePrompt(userId: UserId, promptId: PromptId) {
      const result = await promptRepository.save(userId, promptId)

      if (result.kind === "not-found") {
        throw new NotFoundError("글감을 찾을 수 없습니다.")
      }

      return result
    },

    async unsavePrompt(userId: UserId, promptId: PromptId) {
      const existed = await promptRepository.unsave(userId, promptId)

      if (!existed) {
        throw new NotFoundError("저장된 글감을 찾을 수 없습니다.")
      }
    },
  }
}
