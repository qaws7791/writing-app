// Types
export type {
  Operation,
  SetTitleOperation,
  SetContentOperation,
  WritingTransaction,
  Writing,
  WritingSyncAccessResult,
  SyncPushInput,
  SyncPushAccepted,
  SyncPushConflict,
  SyncPushResult,
  SyncPullResult,
  WritingVersionSummary,
  WritingVersionDetail,
  StoredTransaction,
  SnapshotReason,
} from "./writing-types"

// Schemas
export {
  syncPushBodySchema,
  syncPushResponseSchema,
  syncPullQuerySchema,
  syncPullResponseSchema,
  writingVersionSummarySchema,
  writingVersionDetailSchema,
  versionListResponseSchema,
  writingIdParamSchema,
  versionParamSchema,
} from "./writing-schemas"

// Errors
export type {
  WritingModuleError,
  WritingNotFoundError,
  WritingForbiddenError,
  WritingValidationError,
  WritingConflictError,
} from "./writing-error"
export {
  writingNotFound,
  writingForbidden,
  writingValidationFailed,
  writingConflict,
} from "./writing-error"

// Ports
export type {
  WritingSyncRepository,
  WritingTransactionRepository,
  WritingVersionRepository,
} from "./writing-port"

// Operations
export {
  applyOperationsToContent,
  computeWritingMetrics,
  advanceWritingVersion,
} from "./writing-operations"

// Use Cases
export type {
  PushTransactionsDeps,
  PullDocumentDeps,
  ListVersionsDeps,
  GetVersionDeps,
} from "./use-cases/index"
export {
  makePushTransactionsUseCase,
  makePullDocumentUseCase,
  makeListVersionsUseCase,
  makeGetVersionUseCase,
} from "./use-cases/index"

// CRUD
export type {
  WritingFull,
  WritingCrudAccessResult,
  WritingDeleteResult,
  WritingDetail,
  WritingMutationResult,
  WritingPersistInput,
  WritingSummary,
} from "./writing-types"

export type { WritingRepository } from "./writing-crud-port"

export type { PromptReferenceNotFoundError } from "./writing-crud-error"

export {
  buildWriting,
  createPreview,
  updateWritingContent,
  updateWritingTitle,
} from "./writing-crud-operations"

export {
  autosaveWritingBodySchema,
  autosaveWritingResponseSchema,
  createWritingBodySchema,
  writingDetailSchema,
  writingListResponseSchema,
  writingSummarySchema,
} from "./writing-crud-schemas"

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
