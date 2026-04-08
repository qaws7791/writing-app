// Types
export type {
  UserLevel,
  WritingFeedback,
  RevisionComparison,
  GenerateFeedbackInput,
  CompareRevisionsInput,
} from "./ai-feedback-types"

// Schemas
export {
  userLevelSchema,
  writingFeedbackSchema,
  revisionComparisonSchema,
  generateFeedbackBodySchema,
  generateTextFeedbackBodySchema,
  compareRevisionsBodySchema,
} from "./ai-feedback-schemas"

// Port
export type { AiCoachingGateway } from "./ai-feedback-port"

// Use Cases
export type {
  GenerateFeedbackDeps,
  GenerateFeedbackInput as GenerateFeedbackUseCaseInput,
  CompareRevisionsDeps,
  CompareRevisionsInput as CompareRevisionsUseCaseInput,
} from "./use-cases/index"
export {
  makeGenerateFeedbackUseCase,
  makeCompareRevisionsUseCase,
} from "./use-cases/index"
