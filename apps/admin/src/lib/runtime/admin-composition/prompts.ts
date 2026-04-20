import {
  makeCreatePromptUseCase,
  makeDeletePromptUseCase,
  makeGetPromptUseCase,
  makeListPromptsUseCase,
  makeUpdatePromptUseCase,
} from "@workspace/core"
import type { createWritingPromptRepository } from "@workspace/database"

type PromptRepository = ReturnType<typeof createWritingPromptRepository>

export type PromptAdminUseCases = {
  readonly listPrompts: ReturnType<typeof makeListPromptsUseCase>
  readonly getPrompt: ReturnType<typeof makeGetPromptUseCase>
  readonly createPrompt: ReturnType<typeof makeCreatePromptUseCase>
  readonly updatePrompt: ReturnType<typeof makeUpdatePromptUseCase>
  readonly deletePrompt: ReturnType<typeof makeDeletePromptUseCase>
}

export function createPromptAdminUseCases({
  promptRepository,
}: {
  promptRepository: PromptRepository
}): PromptAdminUseCases {
  return {
    listPrompts: makeListPromptsUseCase({ promptRepository }),
    getPrompt: makeGetPromptUseCase({ promptRepository }),
    createPrompt: makeCreatePromptUseCase({ promptRepository }),
    updatePrompt: makeUpdatePromptUseCase({ promptRepository }),
    deletePrompt: makeDeletePromptUseCase({ promptRepository }),
  }
}
