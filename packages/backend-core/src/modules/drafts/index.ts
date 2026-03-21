// Public API for drafts module
export type * from "./contracts/index"
export type { Draft } from "./model/index"
export {
  autosaveDraftUseCase,
  createDraftUseCase,
  deleteDraftUseCase,
  getDraftUseCase,
  listDraftsUseCase,
} from "./use-cases/index"
export type {
  AutosaveDraftInput,
  AutosaveDraftUseCaseOutput,
  CreateDraftInput,
  CreateDraftUseCaseOutput,
  DeleteDraftUseCaseOutput,
  GetDraftUseCaseOutput,
  ListDraftsUseCaseOutput,
} from "./use-cases/index"
export type { DraftModuleError } from "./errors/index"
export { DraftFixtureBuilder, createTestDraft } from "./fixtures/index"
// Compatibility adapter for migration
export { createDraftUseCasesAdapter } from "./adapters/application-compatibility"
