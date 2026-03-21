export {
  getPromptUseCase,
  listPromptsUseCase,
  makeGetPromptUseCase,
  makeListPromptsUseCase,
  makeSavePromptUseCase,
  makeUnsavePromptUseCase,
  savePromptUseCase,
  unsavePromptUseCase,
} from "./use-cases/index"
export type {
  GetPromptUseCaseDependencies,
  GetPromptUseCaseOutput,
  ListPromptsUseCaseDependencies,
  ListPromptsUseCaseOutput,
  SavePromptUseCaseDependencies,
  SavePromptUseCaseOutput,
  UnsavePromptUseCaseDependencies,
  UnsavePromptUseCaseOutput,
} from "./use-cases/index"
export type { PromptModuleError } from "./errors/index"
// Compatibility adapter for migration
export { createPromptUseCasesAdapter } from "./adapters/application-compatibility"
