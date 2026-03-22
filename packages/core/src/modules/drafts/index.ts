// Types
export type {
  Draft,
  DraftAccessResult,
  DraftDeleteResult,
  DraftDetail,
  DraftMutationResult,
  DraftPersistInput,
  DraftSummary,
} from "./draft-types"

// Errors
export type {
  DraftForbiddenError,
  DraftModuleError,
  DraftNotFoundError,
  DraftValidationError,
  PromptReferenceNotFoundError,
} from "./draft-error"
export {
  draftForbidden,
  draftNotFound,
  draftValidationFailed,
  promptNotFound,
} from "./draft-error"

// Port
export type { DraftRepository } from "./draft-port"

// Operations
export {
  buildDraft,
  createPreview,
  updateDraftContent,
  updateDraftTitle,
} from "./draft-operations"

// Use Cases
export type {
  AutosaveDraftDeps,
  AutosaveDraftInput,
  CreateDraftDeps,
  CreateDraftInput,
  DeleteDraftDeps,
  GetDraftDeps,
  ListDraftsDeps,
} from "./use-cases/index"
export {
  makeAutosaveDraftUseCase,
  makeCreateDraftUseCase,
  makeDeleteDraftUseCase,
  makeGetDraftUseCase,
  makeListDraftsUseCase,
} from "./use-cases/index"
