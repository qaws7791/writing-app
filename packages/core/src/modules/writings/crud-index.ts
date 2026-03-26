// Types
export type {
  WritingFull,
  WritingCrudAccessResult,
  WritingDeleteResult,
  WritingDetail,
  WritingMutationResult,
  WritingPersistInput,
  WritingSummary,
} from "./writing-types"

// Schemas
export {
  autosaveWritingBodySchema,
  autosaveWritingResponseSchema,
  createWritingBodySchema,
  writingDetailSchema,
  writingIdParamSchema,
  writingListResponseSchema,
  writingSummarySchema,
} from "./writing-schemas"

// Errors
export type {
  WritingForbiddenError,
  WritingModuleError,
  WritingNotFoundError,
  WritingValidationError,
  PromptReferenceNotFoundError,
} from "./writing-error"
export {
  writingForbidden,
  writingNotFound,
  writingValidationFailed,
  promptNotFound,
} from "./writing-error"

// Port
export type { WritingRepository } from "./writing-port"

// Operations
export {
  buildWriting,
  createPreview,
  updateWritingContent,
  updateWritingTitle,
} from "./writing-operations"

// Use Cases
export type {
  AutosaveWritingDeps,
  AutosaveWritingInput,
  CreateWritingDeps,
  CreateWritingInput,
  DeleteWritingDeps,
  GetWritingDeps,
  ListWritingsDeps,
} from "./crud-use-cases/index"
export {
  makeAutosaveWritingUseCase,
  makeCreateWritingUseCase,
  makeDeleteWritingUseCase,
  makeGetWritingUseCase,
  makeListWritingsUseCase,
} from "./crud-use-cases/index"
