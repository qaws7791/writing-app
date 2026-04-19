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

// Shared: Pagination
export * from "./shared/pagination/index"

// Shared: Utilities
export * from "./shared/utilities/index"

// Module: Writings
export type {
  WritingSummary,
  WritingDetail,
  WritingCreateInput,
  WritingUpdateInput,
  WritingAccessResult,
  WritingUpdateResult,
  WritingDeleteResult,
  WritingModuleError,
  WritingNotFoundError,
  WritingForbiddenError,
  WritingValidationError,
  WritingRepository,
  CreateWritingInput,
  CreateWritingDeps,
  AutosaveWritingInput,
  AutosaveWritingDeps,
  GetWritingDeps,
  ListWritingsDeps,
  ListWritingsParams,
  DeleteWritingDeps,
  PublicWritingSummary,
  ListPromptWritingsDeps,
  ListPromptWritingsParams,
} from "./modules/writings/index"
export {
  createPreview,
  writingNotFound,
  writingForbidden,
  writingValidationFailed,
  writingSummarySchema,
  writingDetailSchema,
  writingIdParamSchema,
  createWritingBodySchema,
  autosaveWritingBodySchema,
  writingListResponseSchema,
  autosaveWritingResponseSchema,
  publicWritingSummarySchema,
  promptWritingsQuerySchema,
  promptWritingsResponseSchema,
  makeCreateWritingUseCase,
  makeAutosaveWritingUseCase,
  makeGetWritingUseCase,
  makeListWritingsUseCase,
  makeDeleteWritingUseCase,
  makeListPromptWritingsUseCase,
} from "./modules/writings/index"

// Module: Prompts
export type {
  PromptType,
  PromptSummary,
  PromptListFilters,
  PromptListPage,
  PromptCategory,
  PromptBookmarkResult,
  CreatePromptInput,
  UpdatePromptInput,
  PromptModuleError,
  PromptRepository,
  GetPromptDeps,
  ListPromptsDeps,
  BookmarkPromptDeps,
  UnbookmarkPromptDeps,
  CreatePromptDeps,
  UpdatePromptDeps,
  DeletePromptDeps,
} from "./modules/prompts/index"
export {
  PROMPT_CATEGORIES,
  promptNotFound,
  promptTypeSchema,
  promptSummarySchema,
  promptListPageResponseSchema,
  promptIdParamSchema,
  promptFiltersQuerySchema,
  promptCategorySchema,
  promptCategoriesResponseSchema,
  promptBookmarkResponseSchema,
  makeGetPromptUseCase,
  makeListPromptsUseCase,
  makeBookmarkPromptUseCase,
  makeUnbookmarkPromptUseCase,
  makeCreatePromptUseCase,
  makeUpdatePromptUseCase,
  makeDeletePromptUseCase,
} from "./modules/prompts/index"

// Module: Journeys
export type {
  JourneyCategory,
  StepType,
  JourneySummary,
  JourneyDetail,
  JourneyFullDetail,
  JourneyDetailWithProgress,
  JourneySessionSummary,
  JourneySessionDetail,
  StepSummary,
  CreateJourneyInput,
  UpdateJourneyInput,
  CreateSessionInput,
  UpdateSessionInput,
  CreateStepInput,
  UpdateStepInput,
  JourneyModuleError,
  JourneyNotFoundError,
  SessionNotFoundError,
  StepNotFoundError,
  JourneyRepository,
  ListJourneysDeps,
  GetJourneyDeps,
  GetJourneyFullDeps,
  GetSessionDetailDeps,
  ListSessionsDeps,
  CreateJourneyDeps,
  UpdateJourneyDeps,
  DeleteJourneyDeps,
  CreateSessionDeps,
  UpdateSessionDeps,
  DeleteSessionDeps,
  CreateStepDeps,
  UpdateStepDeps,
  DeleteStepDeps,
} from "./modules/journeys/index"
export {
  journeyNotFound,
  sessionNotFound,
  stepNotFound,
  journeyCategorySchema,
  stepTypeSchema,
  journeyIdParamSchema,
  sessionIdParamSchema,
  journeySummarySchema,
  journeySessionSummarySchema,
  stepSummarySchema,
  journeyDetailSchema,
  journeyDetailWithProgressSchema,
  journeySessionDetailSchema,
  journeyListResponseSchema,
  journeyFiltersQuerySchema,
  makeListJourneysUseCase,
  makeGetJourneyUseCase,
  makeGetJourneyFullUseCase,
  makeGetSessionDetailUseCase,
  makeListSessionsUseCase,
  makeCreateJourneyUseCase,
  makeUpdateJourneyUseCase,
  makeDeleteJourneyUseCase,
  makeCreateSessionUseCase,
  makeUpdateSessionUseCase,
  makeDeleteSessionUseCase,
  makeCreateStepUseCase,
  makeUpdateStepUseCase,
  makeDeleteStepUseCase,
} from "./modules/journeys/index"

// Module: Progress
export type {
  JourneyProgressStatus,
  SessionProgressStatus,
  SessionAiStateKind,
  SessionAiStateStatus,
  SessionAiResult,
  UserJourneyProgress,
  UserSessionProgress,
  UserSessionStepAiState,
  SessionStepAiState,
  SessionRuntime,
  ProgressRepository,
  GetSessionRuntimeDeps,
  EnrollJourneyDeps,
  StartSessionDeps,
  SubmitStepDeps,
  SubmitStepInput,
  SubmitStepResult,
  RetrySessionStepAiDeps,
  RetrySessionStepAiInput,
  CompleteSessionDeps,
  CompleteSessionInput,
  CompletedJourneySummary,
  ListCompletedJourneysDeps,
  ListUserJourneysDeps,
} from "./modules/progress/index"
export {
  journeyProgressStatusSchema,
  sessionProgressStatusSchema,
  sessionAiStateKindSchema,
  sessionAiStateStatusSchema,
  sessionAiResultSchema,
  sessionStepAiStateSchema,
  sessionRuntimeSchema,
  userJourneyProgressSchema,
  userSessionProgressSchema,
  submitStepBodySchema,
  makeGetSessionRuntimeUseCase,
  makeEnrollJourneyUseCase,
  makeStartSessionUseCase,
  makeSubmitStepUseCase,
  makeRetrySessionStepAiUseCase,
  makeCompleteSessionUseCase,
  makeListCompletedJourneysUseCase,
  makeListUserJourneysUseCase,
} from "./modules/progress/index"

// Module: AI Feedback
export type {
  UserLevel,
  WritingFeedback,
  RevisionComparison,
  GenerateFeedbackInput,
  CompareRevisionsInput,
  AiCoachingGateway,
  GenerateFeedbackDeps,
  GenerateFeedbackUseCaseInput,
  CompareRevisionsDeps,
  CompareRevisionsUseCaseInput,
} from "./modules/ai-feedback/index"
export {
  userLevelSchema,
  writingFeedbackSchema,
  revisionComparisonSchema,
  generateFeedbackBodySchema,
  generateTextFeedbackBodySchema,
  compareRevisionsBodySchema,
  makeGenerateFeedbackUseCase,
  makeCompareRevisionsUseCase,
} from "./modules/ai-feedback/index"

// Module: Home
export type {
  HomeSnapshot,
  ActiveJourneySummary,
  GetHomeDeps,
} from "./modules/home/index"
export {
  homeSnapshotSchema,
  activeJourneySummarySchema,
  makeGetHomeUseCase,
} from "./modules/home/index"
