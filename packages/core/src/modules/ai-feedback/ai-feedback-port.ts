import type {
  CompareRevisionsInput,
  GenerateFeedbackInput,
  RevisionComparison,
  WritingFeedback,
} from "./ai-feedback-types"

export interface AiCoachingGateway {
  generateFeedback(input: GenerateFeedbackInput): Promise<WritingFeedback>
  compareRevisions(input: CompareRevisionsInput): Promise<RevisionComparison>
}
