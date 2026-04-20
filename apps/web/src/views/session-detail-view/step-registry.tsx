import type { ReactNode } from "react"
import type { paths } from "@workspace/api-client"
import type {
  AIComparisonContent,
  AIFeedbackContent,
  CompletionContent,
  ConceptContent,
  ExampleContent,
  FillInTheBlankContent,
  FillInTheBlankState,
  HighlightContent,
  HighlightState,
  IntroContent,
  MultipleChoiceContent,
  MultipleChoiceState,
  OrderingContent,
  OrderingState,
  RewritingContent,
  ShortAnswerContent,
  WritingContent,
} from "@/views/session-detail-view/types"

import { AIComparisonStep } from "@/views/session-detail-view/steps/ai-comparison-step"
import { AIFeedbackStep } from "@/views/session-detail-view/steps/ai-feedback-step"
import { CompletionStep } from "@/views/session-detail-view/steps/completion-step"
import { ConceptStep } from "@/views/session-detail-view/steps/concept-step"
import { ExampleStep } from "@/views/session-detail-view/steps/example-step"
import { FillInTheBlankStep } from "@/views/session-detail-view/steps/fill-in-the-blank-step"
import { HighlightStep } from "@/views/session-detail-view/steps/highlight-step"
import { IntroStep } from "@/views/session-detail-view/steps/intro-step"
import { MultipleChoiceStep } from "@/views/session-detail-view/steps/multiple-choice-step"
import { OrderingStep } from "@/views/session-detail-view/steps/ordering-step"
import { RewritingStep } from "@/views/session-detail-view/steps/rewriting-step"
import { ShortAnswerStep } from "@/views/session-detail-view/steps/short-answer-step"
import { WritingStep } from "@/views/session-detail-view/steps/writing-step"
import {
  isInputStepState,
  isSelectionStepState,
  isSessionAiStepState,
} from "@/views/session-detail-view/step-state"
import type {
  InputStepState,
  Step,
  StepState,
} from "@/views/session-detail-view/types"

type SessionStepResponse =
  paths["/sessions/{sessionId}/steps/{stepOrder}/submit"]["post"]["requestBody"]["content"]["application/json"]["response"]

type StepResponse = Exclude<SessionStepResponse, undefined>

type StepRenderContext = {
  allStepStates: Record<string, StepState>
  isRetryingAi?: boolean
  onRetryAi?: (stepOrder: number) => Promise<void>
  onStateChange: (state: StepState) => void
  sessionId: string
  step: Step
  stepState: StepState
  steps: Step[]
}

type StepCtaState = {
  action: () => void
  enabled: boolean
  label: string
}

type StepCtaContext = {
  handleNext: () => void
  isSubmitting: boolean
  state: StepState
  step: Step
  updateState: (state: StepState) => void
}

type StepDefinition = {
  deserialize?: (response: StepResponse) => StepState | undefined
  getCta: (context: StepCtaContext) => StepCtaState
  render: (context: StepRenderContext) => ReactNode
  serialize?: (state: StepState) => StepResponse | undefined
}

function createDefaultCta({
  handleNext,
  isSubmitting,
  step,
}: StepCtaContext): StepCtaState {
  return {
    label: step.cta.label,
    enabled: !isSubmitting,
    action: handleNext,
  }
}

function createSelectionCta({
  handleNext,
  isSubmitting,
  state,
  step,
  updateState,
}: StepCtaContext): StepCtaState {
  const selectionState = isSelectionStepState(state) ? state : undefined

  if (selectionState?.checked) {
    return {
      label: "다음",
      enabled: true,
      action: handleNext,
    }
  }

  return {
    label: step.cta.label,
    enabled: selectionState?.hasSelection === true && !isSubmitting,
    action: () => {
      if (!selectionState) {
        return
      }

      updateState({
        ...selectionState,
        checked: true,
      })
    },
  }
}

function createInputCta({
  handleNext,
  isSubmitting,
  state,
  step,
}: StepCtaContext): StepCtaState {
  const inputState = isInputStepState(state) ? state : undefined

  return {
    label: step.cta.label,
    enabled: inputState?.hasInput === true && !isSubmitting,
    action: handleNext,
  }
}

function createAiCta({
  handleNext,
  isSubmitting,
  state,
  step,
}: StepCtaContext): StepCtaState {
  const aiState = isSessionAiStepState(state) ? state : undefined

  return {
    label: step.cta.label,
    enabled: aiState?.status === "succeeded" && !isSubmitting,
    action: handleNext,
  }
}

function createInputState(text: string): InputStepState {
  return {
    text,
    hasInput: text.length > 0,
  }
}

function isMultipleChoiceState(value: StepState): value is MultipleChoiceState {
  return (
    isSelectionStepState(value) &&
    "selected" in value &&
    Array.isArray(value.selected)
  )
}

function isFillInTheBlankState(value: StepState): value is FillInTheBlankState {
  return (
    isSelectionStepState(value) &&
    "selections" in value &&
    value.selections !== null &&
    typeof value.selections === "object"
  )
}

function isOrderingState(value: StepState): value is OrderingState {
  return (
    isSelectionStepState(value) &&
    "order" in value &&
    Array.isArray(value.order)
  )
}

function isHighlightState(value: StepState): value is HighlightState {
  return (
    isSelectionStepState(value) &&
    "selected" in value &&
    Array.isArray(value.selected)
  )
}

function getStepDefinition(step: Step): StepDefinition {
  return stepRegistry[step.type]
}

const stepRegistry = {
  INTRO: {
    getCta: createDefaultCta,
    render: ({ step }) => <IntroStep content={step.content as IntroContent} />,
  },
  COMPLETION: {
    getCta: createDefaultCta,
    render: ({ step }) => (
      <CompletionStep content={step.content as CompletionContent} />
    ),
  },
  CONCEPT: {
    getCta: createDefaultCta,
    render: ({ step }) => (
      <ConceptStep content={step.content as ConceptContent} />
    ),
  },
  EXAMPLE: {
    getCta: createDefaultCta,
    render: ({ step }) => (
      <ExampleStep content={step.content as ExampleContent} />
    ),
  },
  MULTIPLE_CHOICE: {
    deserialize: (response) =>
      response.type === "MULTIPLE_CHOICE"
        ? {
            selected: response.selected,
            hasSelection: response.selected.length > 0,
            checked: true,
          }
        : undefined,
    getCta: createSelectionCta,
    render: ({ onStateChange, step, stepState }) => (
      <MultipleChoiceStep
        content={step.content as MultipleChoiceContent}
        state={isMultipleChoiceState(stepState) ? stepState : undefined}
        onStateChange={onStateChange as (state: MultipleChoiceState) => void}
      />
    ),
    serialize: (state) =>
      isSelectionStepState(state) && "selected" in state
        ? {
            type: "MULTIPLE_CHOICE",
            selected: state.selected,
          }
        : undefined,
  },
  FILL_IN_THE_BLANK: {
    deserialize: (response) =>
      response.type === "FILL_IN_THE_BLANK"
        ? {
            selections: response.selections,
            hasSelection: Object.keys(response.selections).length > 0,
            checked: true,
          }
        : undefined,
    getCta: createSelectionCta,
    render: ({ onStateChange, step, stepState }) => (
      <FillInTheBlankStep
        content={step.content as FillInTheBlankContent}
        state={isFillInTheBlankState(stepState) ? stepState : undefined}
        onStateChange={onStateChange as (state: FillInTheBlankState) => void}
      />
    ),
    serialize: (state) =>
      state !== undefined &&
      typeof state === "object" &&
      state !== null &&
      "selections" in state &&
      state.selections !== null &&
      typeof state.selections === "object"
        ? {
            type: "FILL_IN_THE_BLANK",
            selections: state.selections,
          }
        : undefined,
  },
  ORDERING: {
    deserialize: (response) =>
      response.type === "ORDERING"
        ? {
            order: response.order,
            hasSelection: response.order.length > 0,
            checked: true,
          }
        : undefined,
    getCta: createSelectionCta,
    render: ({ onStateChange, step, stepState }) => (
      <OrderingStep
        content={step.content as OrderingContent}
        state={isOrderingState(stepState) ? stepState : undefined}
        onStateChange={onStateChange as (state: OrderingState) => void}
      />
    ),
    serialize: (state) =>
      state !== undefined &&
      typeof state === "object" &&
      state !== null &&
      "order" in state &&
      Array.isArray(state.order)
        ? {
            type: "ORDERING",
            order: state.order,
          }
        : undefined,
  },
  HIGHLIGHT: {
    deserialize: (response) =>
      response.type === "HIGHLIGHT"
        ? {
            selected: response.selected,
            hasSelection: response.selected.length > 0,
            checked: true,
          }
        : undefined,
    getCta: createSelectionCta,
    render: ({ onStateChange, step, stepState }) => (
      <HighlightStep
        content={step.content as HighlightContent}
        state={isHighlightState(stepState) ? stepState : undefined}
        onStateChange={onStateChange as (state: HighlightState) => void}
      />
    ),
    serialize: (state) =>
      isSelectionStepState(state) && "selected" in state
        ? {
            type: "HIGHLIGHT",
            selected: state.selected,
          }
        : undefined,
  },
  SHORT_ANSWER: {
    deserialize: (response) =>
      response.type === "SHORT_ANSWER"
        ? createInputState(response.text)
        : undefined,
    getCta: createInputCta,
    render: ({ onStateChange, step, stepState }) => (
      <ShortAnswerStep
        content={step.content as ShortAnswerContent}
        state={isInputStepState(stepState) ? stepState : undefined}
        onStateChange={onStateChange}
      />
    ),
    serialize: (state) =>
      isInputStepState(state)
        ? {
            type: "SHORT_ANSWER",
            text: state.text,
          }
        : undefined,
  },
  WRITING: {
    deserialize: (response) =>
      response.type === "WRITING" ? createInputState(response.text) : undefined,
    getCta: createInputCta,
    render: ({ onStateChange, step, stepState }) => (
      <WritingStep
        content={step.content as WritingContent}
        state={isInputStepState(stepState) ? stepState : undefined}
        onStateChange={onStateChange}
      />
    ),
    serialize: (state) =>
      isInputStepState(state)
        ? {
            type: "WRITING",
            text: state.text,
          }
        : undefined,
  },
  REWRITING: {
    deserialize: (response) =>
      response.type === "REWRITING"
        ? createInputState(response.text)
        : undefined,
    getCta: createInputCta,
    render: ({ allStepStates, onStateChange, step, stepState, steps }) => (
      <RewritingStep
        content={step.content as RewritingContent}
        state={isInputStepState(stepState) ? stepState : undefined}
        onStateChange={onStateChange}
        allStepStates={allStepStates}
        steps={steps}
      />
    ),
    serialize: (state) =>
      isInputStepState(state)
        ? {
            type: "REWRITING",
            text: state.text,
          }
        : undefined,
  },
  AI_FEEDBACK: {
    getCta: createAiCta,
    render: ({
      allStepStates,
      isRetryingAi,
      onRetryAi,
      sessionId,
      step,
      steps,
    }) => (
      <AIFeedbackStep
        content={step.content as AIFeedbackContent}
        allStepStates={allStepStates}
        isRetryingAi={isRetryingAi}
        onRetryAi={onRetryAi}
        sessionId={sessionId}
        step={step}
        steps={steps}
      />
    ),
  },
  AI_COMPARISON: {
    getCta: createAiCta,
    render: ({
      allStepStates,
      isRetryingAi,
      onRetryAi,
      sessionId,
      step,
      steps,
    }) => (
      <AIComparisonStep
        content={step.content as AIComparisonContent}
        allStepStates={allStepStates}
        isRetryingAi={isRetryingAi}
        onRetryAi={onRetryAi}
        sessionId={sessionId}
        step={step}
        steps={steps}
      />
    ),
  },
} as const satisfies Record<Step["type"], StepDefinition>

export function getStepCta(context: StepCtaContext): StepCtaState {
  return getStepDefinition(context.step).getCta(context)
}

export function renderStep(context: StepRenderContext): ReactNode {
  return getStepDefinition(context.step).render(context)
}

export function serializeStepState(
  step: Step,
  state: StepState
): StepResponse | undefined {
  return getStepDefinition(step).serialize?.(state)
}

export function deserializeStepResponse(
  response: StepResponse
): StepState | undefined {
  return stepRegistry[response.type].deserialize?.(response)
}
