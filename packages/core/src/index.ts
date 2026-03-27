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

// Modules (use module-specific exports to avoid naming collisions)
export type {
  WritingFull,
  WritingCrudAccessResult,
  WritingDeleteResult,
  WritingDetail,
  WritingModuleError,
  WritingMutationResult,
  WritingPersistInput,
  WritingRepository,
  WritingSummary,
  AutosaveWritingDeps,
  AutosaveWritingInput,
  CreateWritingDeps,
  CreateWritingInput,
  DeleteWritingDeps,
  GetWritingDeps,
  ListWritingsDeps,
} from "./modules/writings/index"
export {
  buildWriting,
  createPreview,
  updateWritingContent,
  updateWritingTitle,
  makeAutosaveWritingUseCase,
  makeCreateWritingUseCase,
  makeDeleteWritingUseCase,
  makeGetWritingUseCase,
  makeListWritingsUseCase,
  autosaveWritingBodySchema,
  autosaveWritingResponseSchema,
  createWritingBodySchema,
  writingDetailSchema,
  writingIdParamSchema,
  writingListResponseSchema,
  writingSummarySchema,
} from "./modules/writings/index"

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
  promptDetailSchema,
  promptFiltersQuerySchema,
  promptIdParamSchema,
  promptListResponseSchema,
  promptSaveResponseSchema,
  promptSummarySchema,
} from "./modules/prompts/index"

export type { HomeSnapshot, GetHomeDeps } from "./modules/home/index"
export { makeGetHomeUseCase } from "./modules/home/index"
export { homeSnapshotSchema } from "./modules/home/index"

export type {
  DailyRecommendation,
  DailyRecommendationRepository,
  EnsureTodayRecommendationsDeps,
  RecommendationHistoryEntry,
} from "./modules/daily-recommendation/index"
export {
  getKstDateString,
  makeEnsureTodayRecommendationsUseCase,
  selectWeightedPrompts,
} from "./modules/daily-recommendation/index"

// AI Assistant
export type {
  AIFeatureType,
  AIReviewParagraph,
  AISuggestion,
  AISuggestionInput,
  AIDocumentReviewInput,
  AIFlowReviewInput,
  ReviewItem,
  ReviewItemType,
} from "./modules/ai-assistant/index"
export {
  aiFeatureTypeSchema,
  aiSuggestionSchema,
  aiSuggestionInputSchema,
  aiDocumentReviewInputSchema,
  aiFlowReviewInputSchema,
  aiSuggestionResponseSchema,
  aiReviewResponseSchema,
  aiReviewParagraphSchema,
  reviewItemSchema,
  reviewItemTypeSchema,
} from "./modules/ai-assistant/index"
