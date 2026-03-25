// Types
export type {
  Operation,
  SetTitleOperation,
  SetContentOperation,
  WritingTransaction,
  Writing,
  WritingAccessResult,
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
  WritingRepository,
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
