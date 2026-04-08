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
  PromptModuleError,
  PromptRepository,
  GetPromptDeps,
  ListPromptsDeps,
  BookmarkPromptDeps,
  UnbookmarkPromptDeps,
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
} from "./modules/prompts/index"

// Module: Journeys
export type {
  JourneyCategory,
  StepType,
  JourneySummary,
  JourneyDetail,
  JourneySessionSummary,
  JourneySessionDetail,
  StepSummary,
  JourneyModuleError,
  JourneyNotFoundError,
  SessionNotFoundError,
  JourneyRepository,
  ListJourneysDeps,
  GetJourneyDeps,
  GetSessionDetailDeps,
} from "./modules/journeys/index"
export {
  journeyNotFound,
  sessionNotFound,
  journeyCategorySchema,
  stepTypeSchema,
  journeyIdParamSchema,
  sessionIdParamSchema,
  journeySummarySchema,
  journeySessionSummarySchema,
  stepSummarySchema,
  journeyDetailSchema,
  journeySessionDetailSchema,
  journeyListResponseSchema,
  journeyFiltersQuerySchema,
  makeListJourneysUseCase,
  makeGetJourneyUseCase,
  makeGetSessionDetailUseCase,
} from "./modules/journeys/index"

// Module: Progress
export type {
  JourneyProgressStatus,
  SessionProgressStatus,
  UserJourneyProgress,
  UserSessionProgress,
  ProgressRepository,
  EnrollJourneyDeps,
  StartSessionDeps,
  SubmitStepDeps,
  SubmitStepInput,
  CompleteSessionDeps,
  CompleteSessionInput,
} from "./modules/progress/index"
export {
  journeyProgressStatusSchema,
  sessionProgressStatusSchema,
  userJourneyProgressSchema,
  userSessionProgressSchema,
  submitStepBodySchema,
  makeEnrollJourneyUseCase,
  makeStartSessionUseCase,
  makeSubmitStepUseCase,
  makeCompleteSessionUseCase,
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
