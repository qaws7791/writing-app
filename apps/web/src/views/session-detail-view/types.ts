// ─── 안내 계열 (Guide) ───────────────────────────────────────────────────

export interface IntroContent {
  type: "INTRO"
  title: string
  description: string
  keywords?: string[]
  estimatedMinutes: number
}

export interface CompletionContent {
  type: "COMPLETION"
  congratsMessage: string
  summaryPoints: string[]
  nextSessionPreview?: {
    title: string
    teaser: string
  }
}

// ─── 콘텐츠 계열 (Content) ──────────────────────────────────────────────

export interface ConceptContent {
  type: "CONCEPT"
  title: string
  body: string
  keyTakeaway?: string
  imageUrl?: string
}

export interface ExampleContent {
  type: "EXAMPLE"
  title: string
  examples: Array<{
    label?: string
    text: string
    highlights?: Array<{
      startOffset: number
      endOffset: number
      comment: string
    }>
  }>
  commentary?: string
}

// ─── 선택 계열 (Selection) ──────────────────────────────────────────────

export interface MultipleChoiceContent {
  type: "MULTIPLE_CHOICE"
  question: string
  passage?: string
  options: Array<{ id: string; text: string }>
  correctOptionIds: string[]
  multiSelect: boolean
  explanations: Record<string, string>
}

export interface FillInTheBlankContent {
  type: "FILL_IN_THE_BLANK"
  instruction: string
  sentence: string
  blanks: Array<{
    id: string
    options: Array<{ id: string; text: string }>
    correctOptionId: string
  }>
  explanation: string
}

export interface OrderingContent {
  type: "ORDERING"
  instruction: string
  items: Array<{ id: string; text: string }>
  correctOrder: string[]
  explanation: string
}

export interface HighlightContent {
  type: "HIGHLIGHT"
  instruction: string
  passage: string
  selectableRanges: Array<{
    id: string
    startOffset: number
    endOffset: number
  }>
  correctRangeIds: string[]
  explanations: Record<string, string>
}

// ─── 입력 계열 (Input) ──────────────────────────────────────────────────

export interface ShortAnswerContent {
  type: "SHORT_ANSWER"
  question: string
  context?: string
  placeholder?: string
  minLength: number
  maxLength: number
}

export interface WritingContent {
  type: "WRITING"
  prompt: string
  guideline?: string
  minLength: number
  recommendedLength: number
  timeLimitSeconds: number
}

export interface RewritingContent {
  type: "REWRITING"
  instruction: string
  originalWritingStepId: string
  feedbackStepId: string
}

// ─── 피드백 계열 (Feedback) ─────────────────────────────────────────────

export interface AIFeedbackContent {
  type: "AI_FEEDBACK"
  targetStepId: string
  loadingMessage: string
}

export interface AIComparisonContent {
  type: "AI_COMPARISON"
  originalStepId: string
  rewritingStepId: string
  loadingMessage: string
}

// ─── Discriminated Union ────────────────────────────────────────────────

export type StepContent =
  | IntroContent
  | CompletionContent
  | ConceptContent
  | ExampleContent
  | MultipleChoiceContent
  | FillInTheBlankContent
  | OrderingContent
  | HighlightContent
  | ShortAnswerContent
  | WritingContent
  | RewritingContent
  | AIFeedbackContent
  | AIComparisonContent

export type StepType = StepContent["type"]

export interface CTAConfig {
  label: string
  variant: "primary" | "secondary"
}

export interface Step {
  id: string
  type: StepType
  order: number
  content: StepContent
  cta: CTAConfig
}

export interface Session {
  id: string
  order: number
  title: string
  description: string
  steps: Step[]
}

// ─── Step State ─────────────────────────────────────────────────────────

export interface SelectionStepState {
  hasSelection: boolean
  checked: boolean
}

export interface MultipleChoiceState extends SelectionStepState {
  selected: string[]
}

export interface FillInTheBlankState extends SelectionStepState {
  selections: Record<string, string>
}

export interface OrderingState extends SelectionStepState {
  order: string[]
}

export interface HighlightState extends SelectionStepState {
  selected: string[]
}

export interface InputStepState {
  text: string
  hasInput: boolean
}

export interface WritingFeedbackResult {
  strengths: string[]
  improvements: string[]
  question: string
}

export interface RevisionComparisonResult {
  improvements: string[]
  summary: string
}

export interface SessionAiStepState {
  kind: "feedback" | "comparison"
  status: "pending" | "succeeded" | "failed"
  sourceStepOrder: number
  attemptCount: number
  resultJson: WritingFeedbackResult | RevisionComparisonResult | null
  errorMessage: string | null
  updatedAt: string
}

export type StepState =
  | MultipleChoiceState
  | FillInTheBlankState
  | OrderingState
  | HighlightState
  | InputStepState
  | SessionAiStepState
  | undefined

// ─── Step Component Props ───────────────────────────────────────────────

export interface InteractiveStepProps<
  TContent extends StepContent,
  TState extends StepState,
> {
  content: TContent
  state: TState | undefined
  onStateChange: (state: TState) => void
}

export interface CrossReferenceStepProps<TContent extends StepContent> {
  content: TContent
  allStepStates: Record<string, StepState>
  isRetryingAi?: boolean
  onRetryAi?: (stepOrder: number) => Promise<void>
  sessionId: string
  step: Step
  steps: Step[]
}
