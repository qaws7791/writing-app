// Types
export type {
  WritingSummary,
  WritingDetail,
  WritingCreateInput,
  WritingUpdateInput,
  WritingAccessResult,
  WritingUpdateResult,
  WritingDeleteResult,
} from "./writing-types"

// Schemas
export {
  writingSummarySchema,
  writingDetailSchema,
  writingIdParamSchema,
  createWritingBodySchema,
  autosaveWritingBodySchema,
  writingListResponseSchema,
  autosaveWritingResponseSchema,
} from "./writing-schemas"

// Errors
export type {
  WritingModuleError,
  WritingNotFoundError,
  WritingForbiddenError,
  WritingValidationError,
} from "./writing-error"
export {
  writingNotFound,
  writingForbidden,
  writingValidationFailed,
} from "./writing-error"

// Port
export type { WritingRepository } from "./writing-port"

// Operations
export { createPreview } from "./writing-operations"

// Use Cases
export type {
  CreateWritingInput,
  CreateWritingDeps,
  AutosaveWritingInput,
  AutosaveWritingDeps,
  GetWritingDeps,
  ListWritingsDeps,
  ListWritingsParams,
  DeleteWritingDeps,
} from "./use-cases/index"
export {
  makeCreateWritingUseCase,
  makeAutosaveWritingUseCase,
  makeGetWritingUseCase,
  makeListWritingsUseCase,
  makeDeleteWritingUseCase,
} from "./use-cases/index"
