import type {
  Step,
  StepState,
  MultipleChoiceState,
  FillInTheBlankState,
  OrderingState,
  HighlightState,
  InputStepState,
  MultipleChoiceContent,
  FillInTheBlankContent,
  OrderingContent,
  HighlightContent,
  ShortAnswerContent,
  WritingContent,
  RewritingContent,
  AIFeedbackContent,
  AIComparisonContent,
  IntroContent,
  CompletionContent,
  ConceptContent,
  ExampleContent,
} from "@/views/session-detail-view/types"

import { IntroStep } from "@/views/session-detail-view/steps/intro-step"
import { CompletionStep } from "@/views/session-detail-view/steps/completion-step"
import { ConceptStep } from "@/views/session-detail-view/steps/concept-step"
import { ExampleStep } from "@/views/session-detail-view/steps/example-step"
import { MultipleChoiceStep } from "@/views/session-detail-view/steps/multiple-choice-step"
import { FillInTheBlankStep } from "@/views/session-detail-view/steps/fill-in-the-blank-step"
import { OrderingStep } from "@/views/session-detail-view/steps/ordering-step"
import { HighlightStep } from "@/views/session-detail-view/steps/highlight-step"
import { ShortAnswerStep } from "@/views/session-detail-view/steps/short-answer-step"
import { WritingStep } from "@/views/session-detail-view/steps/writing-step"
import { RewritingStep } from "@/views/session-detail-view/steps/rewriting-step"
import { AIFeedbackStep } from "@/views/session-detail-view/steps/ai-feedback-step"
import { AIComparisonStep } from "@/views/session-detail-view/steps/ai-comparison-step"

interface StepRendererProps {
  isRetryingAi?: boolean
  onRetryAi?: (stepOrder: number) => Promise<void>
  sessionId: string
  step: Step
  stepState: StepState
  onStateChange: (state: StepState) => void
  allStepStates: Record<string, StepState>
  steps: Step[]
}

export function StepRenderer({
  isRetryingAi,
  onRetryAi,
  sessionId,
  step,
  stepState,
  onStateChange,
  allStepStates,
  steps,
}: StepRendererProps) {
  switch (step.type) {
    case "INTRO":
      return <IntroStep content={step.content as IntroContent} />
    case "COMPLETION":
      return <CompletionStep content={step.content as CompletionContent} />
    case "CONCEPT":
      return <ConceptStep content={step.content as ConceptContent} />
    case "EXAMPLE":
      return <ExampleStep content={step.content as ExampleContent} />
    case "MULTIPLE_CHOICE":
      return (
        <MultipleChoiceStep
          content={step.content as MultipleChoiceContent}
          state={stepState as MultipleChoiceState | undefined}
          onStateChange={onStateChange as (state: MultipleChoiceState) => void}
        />
      )
    case "FILL_IN_THE_BLANK":
      return (
        <FillInTheBlankStep
          content={step.content as FillInTheBlankContent}
          state={stepState as FillInTheBlankState | undefined}
          onStateChange={onStateChange as (state: FillInTheBlankState) => void}
        />
      )
    case "ORDERING":
      return (
        <OrderingStep
          content={step.content as OrderingContent}
          state={stepState as OrderingState | undefined}
          onStateChange={onStateChange as (state: OrderingState) => void}
        />
      )
    case "HIGHLIGHT":
      return (
        <HighlightStep
          content={step.content as HighlightContent}
          state={stepState as HighlightState | undefined}
          onStateChange={onStateChange as (state: HighlightState) => void}
        />
      )
    case "SHORT_ANSWER":
      return (
        <ShortAnswerStep
          content={step.content as ShortAnswerContent}
          state={stepState as InputStepState | undefined}
          onStateChange={onStateChange as (state: InputStepState) => void}
        />
      )
    case "WRITING":
      return (
        <WritingStep
          content={step.content as WritingContent}
          state={stepState as InputStepState | undefined}
          onStateChange={onStateChange as (state: InputStepState) => void}
        />
      )
    case "REWRITING":
      return (
        <RewritingStep
          content={step.content as RewritingContent}
          state={stepState as InputStepState | undefined}
          onStateChange={onStateChange as (state: InputStepState) => void}
          allStepStates={allStepStates}
          steps={steps}
        />
      )
    case "AI_FEEDBACK":
      return (
        <AIFeedbackStep
          content={step.content as AIFeedbackContent}
          allStepStates={allStepStates}
          isRetryingAi={isRetryingAi}
          onRetryAi={onRetryAi}
          sessionId={sessionId}
          step={step}
          steps={steps}
        />
      )
    case "AI_COMPARISON":
      return (
        <AIComparisonStep
          content={step.content as AIComparisonContent}
          allStepStates={allStepStates}
          isRetryingAi={isRetryingAi}
          onRetryAi={onRetryAi}
          sessionId={sessionId}
          step={step}
          steps={steps}
        />
      )
    default:
      return <p className="text-muted">알 수 없는 스탭 유형입니다.</p>
  }
}
