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
  PushWritePlan,
  PushWritePlanTransaction,
  PushWritePlanWriting,
  PushWritePlanSnapshot,
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
  syncPushBodySchema,
  syncPushResponseSchema,
  syncPullQuerySchema,
  syncPullResponseSchema,
  writingVersionSummarySchema,
  writingVersionDetailSchema,
  versionListResponseSchema,
  writingIdParamSchema,
  versionParamSchema,
  autosaveWritingBodySchema,
  autosaveWritingResponseSchema,
  createWritingBodySchema,
  writingDetailSchema,
  writingListResponseSchema,
  writingSummarySchema,
} from "./writing-schemas"

// Errors
export type {
  WritingModuleError,
  WritingNotFoundError,
  WritingForbiddenError,
  WritingValidationError,
  WritingConflictError,
  PromptReferenceNotFoundError,
} from "./writing-error"
export {
  writingNotFound,
  writingForbidden,
  writingValidationFailed,
  writingConflict,
  promptNotFound,
} from "./writing-error"

// Ports
export type {
  WritingRepository,
  WritingSyncRepository,
  WritingSyncWriter,
  WritingTransactionRepository,
  WritingVersionRepository,
} from "./writing-port"

// Operations
export {
  applyOperationsToContent,
  computeWritingMetrics,
  advanceWritingVersion,
  buildWriting,
  createPreview,
  updateWritingContent,
  updateWritingTitle,
} from "./writing-operations"

// Use Cases
export type {
  PushTransactionsDeps,
  PullDocumentDeps,
  ListVersionsDeps,
  GetVersionDeps,
  AutosaveWritingDeps,
  AutosaveWritingInput,
  CreateWritingDeps,
  CreateWritingInput,
  DeleteWritingDeps,
  GetWritingDeps,
  ListWritingsDeps,
} from "./use-cases/index"
export {
  makePushTransactionsUseCase,
  makePullDocumentUseCase,
  makeListVersionsUseCase,
  makeGetVersionUseCase,
  makeAutosaveWritingUseCase,
  makeCreateWritingUseCase,
  makeDeleteWritingUseCase,
  makeGetWritingUseCase,
  makeListWritingsUseCase,
} from "./use-cases/index"
