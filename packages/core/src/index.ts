// Shared: Brand types
export * from "./shared/brand/index"

// Shared: Domain errors
export type {
  ConflictError as DomainConflictError,
  DomainError,
  ForbiddenError as DomainForbiddenError,
  NotFoundError as DomainNotFoundError,
  ValidationError as DomainValidationError,
} from "./shared/error/index"
export {
  createConflictError,
  createForbiddenError,
  createNotFoundError,
  createValidationError,
  toHttpStatus,
} from "./shared/error/index"

// Shared: Schemas
export * from "./shared/schema/index"

// Shared: Utilities
export * from "./shared/utilities/index"

// Modules (use module-specific exports to avoid naming collisions)
export type {
  Draft,
  DraftAccessResult,
  DraftDeleteResult,
  DraftDetail,
  DraftModuleError,
  DraftMutationResult,
  DraftPersistInput,
  DraftRepository,
  DraftSummary,
  AutosaveDraftDeps,
  AutosaveDraftInput,
  CreateDraftDeps,
  CreateDraftInput,
  DeleteDraftDeps,
  GetDraftDeps,
  ListDraftsDeps,
} from "./modules/drafts/index"
export {
  buildDraft,
  createPreview,
  updateDraftContent,
  updateDraftTitle,
  makeAutosaveDraftUseCase,
  makeCreateDraftUseCase,
  makeDeleteDraftUseCase,
  makeGetDraftUseCase,
  makeListDraftsUseCase,
} from "./modules/drafts/index"

export type {
  PromptDetail,
  PromptListFilters,
  PromptModuleError,
  PromptRepository,
  PromptSaveResult,
  PromptSummary,
  GetPromptDeps,
  ListPromptsDeps,
  SavePromptDeps,
  UnsavePromptDeps,
} from "./modules/prompts/index"
export {
  makeGetPromptUseCase,
  makeListPromptsUseCase,
  makeSavePromptUseCase,
  makeUnsavePromptUseCase,
} from "./modules/prompts/index"

export type { HomeSnapshot, GetHomeDeps } from "./modules/home/index"
export { makeGetHomeUseCase } from "./modules/home/index"
