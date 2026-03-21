export {
  getPromptUseCase,
  listPromptsUseCase,
  savePromptUseCase,
  unsavePromptUseCase,
} from "./use-cases/index"
export type {
  GetPromptUseCaseOutput,
  ListPromptsUseCaseOutput,
  SavePromptUseCaseOutput,
  UnsavePromptUseCaseOutput,
} from "./use-cases/index"
export type { PromptModuleError } from "./errors/index"
// Compatibility adapter for migration
export { createPromptUseCasesAdapter } from "./adapters/application-compatibility"
