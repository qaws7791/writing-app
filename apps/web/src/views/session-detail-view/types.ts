import type { paths } from "@workspace/api-client"
import type {
  AIComparisonStepContent,
  AIFeedbackStepContent,
  CTAConfig,
  CompletionStepContent,
  ConceptStepContent,
  ExampleStepContent,
  FillInTheBlankStepContent,
  HighlightStepContent,
  IntroStepContent,
  MultipleChoiceStepContent,
  OrderingStepContent,
  RewritingStepContent,
  SessionStepContentType,
  ShortAnswerStepContent,
  WritingStepContent,
} from "@workspace/core/modules/journeys"

export type StepContentMap = {
  INTRO: IntroStepContent
  COMPLETION: CompletionStepContent
  CONCEPT: ConceptStepContent
  EXAMPLE: ExampleStepContent
  MULTIPLE_CHOICE: MultipleChoiceStepContent
  FILL_IN_THE_BLANK: FillInTheBlankStepContent
  ORDERING: OrderingStepContent
  HIGHLIGHT: HighlightStepContent
  SHORT_ANSWER: ShortAnswerStepContent
  WRITING: WritingStepContent
  REWRITING: RewritingStepContent
  AI_FEEDBACK: AIFeedbackStepContent
  AI_COMPARISON: AIComparisonStepContent
}

export interface StepOfType<T extends SessionStepContentType> {
  id: string
  type: T
  order: number
  content: StepContentMap[T]
  cta: CTAConfig
}

export type Step = {
  [T in SessionStepContentType]: StepOfType<T>
}[SessionStepContentType]

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

export interface InteractiveStepProps<TContent, TState extends StepState> {
  content: TContent
  state: TState | undefined
  onStateChange: (state: TState) => void
}

export interface CrossReferenceStepProps<TContent> {
  content: TContent
  allStepStates: Record<string, StepState>
  isRetryingAi?: boolean
  onRetryAi?: (stepOrder: number) => Promise<void>
  sessionId: string
  step: Step
  steps: Step[]
}
