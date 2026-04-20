import type { paths } from "@workspace/api-client"
import type {
  AIComparisonStepContent as AIComparisonContent,
  AIFeedbackStepContent as AIFeedbackContent,
  CTAConfig as StepCTAConfig,
  CompletionStepContent as CompletionContent,
  ConceptStepContent as ConceptContent,
  ExampleStepContent as ExampleContent,
  FillInTheBlankStepContent as FillInTheBlankContent,
  HighlightStepContent as HighlightContent,
  IntroStepContent as IntroContent,
  MultipleChoiceStepContent as MultipleChoiceContent,
  OrderingStepContent as OrderingContent,
  RewritingStepContent as RewritingContent,
  SessionStepContent,
  SessionStepContentType as SessionStepType,
  ShortAnswerStepContent as ShortAnswerContent,
  WritingStepContent as WritingContent,
} from "@workspace/core/modules/journeys"

export type CTAConfig = StepCTAConfig
export type StepContent = SessionStepContent
export type StepType = SessionStepType
export type {
  IntroContent,
  CompletionContent,
  ConceptContent,
  ExampleContent,
  MultipleChoiceContent,
  FillInTheBlankContent,
  OrderingContent,
  HighlightContent,
  ShortAnswerContent,
  WritingContent,
  RewritingContent,
  AIFeedbackContent,
  AIComparisonContent,
}

export type StepContentMap = {
  INTRO: IntroContent
  COMPLETION: CompletionContent
  CONCEPT: ConceptContent
  EXAMPLE: ExampleContent
  MULTIPLE_CHOICE: MultipleChoiceContent
  FILL_IN_THE_BLANK: FillInTheBlankContent
  ORDERING: OrderingContent
  HIGHLIGHT: HighlightContent
  SHORT_ANSWER: ShortAnswerContent
  WRITING: WritingContent
  REWRITING: RewritingContent
  AI_FEEDBACK: AIFeedbackContent
  AI_COMPARISON: AIComparisonContent
}

export interface StepOfType<T extends StepType> {
  id: string
  type: T
  order: number
  content: StepContentMap[T]
  cta: CTAConfig
}

export type Step = {
  [T in StepType]: StepOfType<T>
}[StepType]

export type NonEmptyArray<T> = [T, ...T[]]

export interface Session {
  id: string
  order: number
  title: string
  description: string
  steps: NonEmptyArray<Step>
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

export type SessionAiStepState =
  paths["/sessions/{sessionId}"]["get"]["responses"][200]["content"]["application/json"]["stepAiStates"][number]

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
