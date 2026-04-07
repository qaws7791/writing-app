export type UserLevel = "beginner" | "intermediate" | "advanced"

export type WritingFeedback = {
  readonly strengths: string[]
  readonly improvements: string[]
  readonly question: string
}

export type RevisionComparison = {
  readonly improvements: string[]
  readonly summary: string
}

export type GenerateFeedbackInput = {
  readonly bodyPlainText: string
  readonly level: UserLevel
}

export type CompareRevisionsInput = {
  readonly originalText: string
  readonly revisedText: string
}
