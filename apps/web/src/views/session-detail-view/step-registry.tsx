import type { ReactNode } from "react"
import type { paths } from "@workspace/api-client"
import type { StepType } from "@workspace/core/modules/journeys"

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
  FillInTheBlankState,
  HighlightState,
  InputStepState,
  MultipleChoiceState,
  OrderingState,
  Step,
  StepOfType,
  StepState,
} from "@/views/session-detail-view/types"

type SessionStepResponse =
  paths["/sessions/{sessionId}/steps/{stepOrder}/submit"]["post"]["requestBody"]["content"]["application/json"]["response"]

type StepResponse = Exclude<SessionStepResponse, undefined>

type StepResponseFor<T extends StepType> = Extract<StepResponse, { type: T }>

type StepRenderContext<T extends StepType = StepType> = {
  allStepStates: Record<string, StepState>
  isRetryingAi?: boolean
  onRetryAi?: (stepOrder: number) => Promise<void>
  onStateChange: (state: StepState) => void
  sessionId: string
  step: StepOfType<T>
  stepState: StepState
  steps: Step[]
}

type StepCtaState = {
  action: () => void
  enabled: boolean
  label: string
}

type StepCtaContext<T extends StepType = StepType> = {
  handleNext: () => void
  isSubmitting: boolean
  state: StepState
  step: StepOfType<T>
  updateState: (state: StepState) => void
}

type StepRenderInput = Omit<StepRenderContext, "step"> & {
  step: Step
}

type StepCtaInput = Omit<StepCtaContext, "step"> & {
  step: Step
}

type StepDefinition<T extends StepType> = {
  deserialize?: (response: StepResponseFor<T>) => StepState | undefined
  getCta: (context: StepCtaContext<T>) => StepCtaState
  render: (context: StepRenderContext<T>) => ReactNode
  serialize?: (state: StepState) => StepResponseFor<T> | undefined
}

function createDefaultCta<T extends StepType>({
  handleNext,
  isSubmitting,
  step,
}: StepCtaContext<T>): StepCtaState {
  return {
    label: step.cta.label,
    enabled: !isSubmitting,
    action: handleNext,
  }
}

function createSelectionCta<T extends StepType>({
  handleNext,
  isSubmitting,
  state,
  step,
  updateState,
}: StepCtaContext<T>): StepCtaState {
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

function createInputCta<T extends StepType>({
  handleNext,
  isSubmitting,
  state,
  step,
}: StepCtaContext<T>): StepCtaState {
  const inputState = isInputStepState(state) ? state : undefined

  return {
    label: step.cta.label,
    enabled: inputState?.hasInput === true && !isSubmitting,
    action: handleNext,
  }
}

function createAiCta<T extends StepType>({
  handleNext,
  isSubmitting,
  state,
  step,
}: StepCtaContext<T>): StepCtaState {
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

function isSelectedListState(
  value: StepState
): value is MultipleChoiceState | HighlightState {
  return (
    isSelectionStepState(value) &&
    "selected" in value &&
    Array.isArray(value.selected)
  )
}

function isOrderingStepState(value: StepState): value is OrderingState {
  return (
    isSelectionStepState(value) &&
    "order" in value &&
    Array.isArray(value.order)
  )
}

function isFillInTheBlankStepState(
  value: StepState
): value is FillInTheBlankState {
  return (
    isSelectionStepState(value) &&
    "selections" in value &&
    value.selections !== null &&
    typeof value.selections === "object"
  )
}

function toTypedStateChange<T extends Exclude<StepState, undefined>>(
  onStateChange: (state: StepState) => void
) {
  return (state: T) => onStateChange(state)
}

const stepRegistry = {
  INTRO: {
    getCta: createDefaultCta,
    render: ({ step }) => <IntroStep content={step.content} />,
  },
  COMPLETION: {
    getCta: createDefaultCta,
    render: ({ step }) => <CompletionStep content={step.content} />,
  },
  CONCEPT: {
    getCta: createDefaultCta,
    render: ({ step }) => <ConceptStep content={step.content} />,
  },
  EXAMPLE: {
    getCta: createDefaultCta,
    render: ({ step }) => <ExampleStep content={step.content} />,
  },
  MULTIPLE_CHOICE: {
    deserialize: (response) => ({
      selected: response.selected,
      hasSelection: response.selected.length > 0,
      checked: true,
    }),
    getCta: createSelectionCta,
    render: ({ onStateChange, step, stepState }) => (
      <MultipleChoiceStep
        content={step.content}
        state={isSelectedListState(stepState) ? stepState : undefined}
        onStateChange={toTypedStateChange(onStateChange)}
      />
    ),
    serialize: (state) =>
      isSelectedListState(state)
        ? {
            type: "MULTIPLE_CHOICE",
            selected: state.selected,
          }
        : undefined,
  },
  FILL_IN_THE_BLANK: {
    deserialize: (response) => ({
      selections: response.selections,
      hasSelection: Object.keys(response.selections).length > 0,
      checked: true,
    }),
    getCta: createSelectionCta,
    render: ({ onStateChange, step, stepState }) => (
      <FillInTheBlankStep
        content={step.content}
        state={isFillInTheBlankStepState(stepState) ? stepState : undefined}
        onStateChange={toTypedStateChange(onStateChange)}
      />
    ),
    serialize: (state) =>
      isFillInTheBlankStepState(state)
        ? {
            type: "FILL_IN_THE_BLANK",
            selections: state.selections,
          }
        : undefined,
  },
  ORDERING: {
    deserialize: (response) => ({
      order: response.order,
      hasSelection: response.order.length > 0,
      checked: true,
    }),
    getCta: createSelectionCta,
    render: ({ onStateChange, step, stepState }) => (
      <OrderingStep
        content={step.content}
        state={isOrderingStepState(stepState) ? stepState : undefined}
        onStateChange={toTypedStateChange(onStateChange)}
      />
    ),
    serialize: (state) =>
      isOrderingStepState(state)
        ? {
            type: "ORDERING",
            order: state.order,
          }
        : undefined,
  },
  HIGHLIGHT: {
    deserialize: (response) => ({
      selected: response.selected,
      hasSelection: response.selected.length > 0,
      checked: true,
    }),
    getCta: createSelectionCta,
    render: ({ onStateChange, step, stepState }) => (
      <HighlightStep
        content={step.content}
        state={isSelectedListState(stepState) ? stepState : undefined}
        onStateChange={toTypedStateChange(onStateChange)}
      />
    ),
    serialize: (state) =>
      isSelectedListState(state)
        ? {
            type: "HIGHLIGHT",
            selected: state.selected,
          }
        : undefined,
  },
  SHORT_ANSWER: {
    deserialize: (response) => createInputState(response.text),
    getCta: createInputCta,
    render: ({ onStateChange, step, stepState }) => (
      <ShortAnswerStep
        content={step.content}
        state={isInputStepState(stepState) ? stepState : undefined}
        onStateChange={toTypedStateChange(onStateChange)}
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
    deserialize: (response) => createInputState(response.text),
    getCta: createInputCta,
    render: ({ onStateChange, step, stepState }) => (
      <WritingStep
        content={step.content}
        state={isInputStepState(stepState) ? stepState : undefined}
        onStateChange={toTypedStateChange(onStateChange)}
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
    deserialize: (response) => createInputState(response.text),
    getCta: createInputCta,
    render: ({ allStepStates, onStateChange, step, stepState, steps }) => (
      <RewritingStep
        content={step.content}
        state={isInputStepState(stepState) ? stepState : undefined}
        onStateChange={toTypedStateChange(onStateChange)}
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
        content={step.content}
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
        content={step.content}
        allStepStates={allStepStates}
        isRetryingAi={isRetryingAi}
        onRetryAi={onRetryAi}
        sessionId={sessionId}
        step={step}
        steps={steps}
      />
    ),
  },
} as const satisfies { [T in StepType]: StepDefinition<T> }

export function getStepCta(context: StepCtaInput): StepCtaState {
  const step = context.step

  switch (step.type) {
    case "INTRO":
      return stepRegistry.INTRO.getCta({ ...context, step })
    case "COMPLETION":
      return stepRegistry.COMPLETION.getCta({ ...context, step })
    case "CONCEPT":
      return stepRegistry.CONCEPT.getCta({ ...context, step })
    case "EXAMPLE":
      return stepRegistry.EXAMPLE.getCta({ ...context, step })
    case "MULTIPLE_CHOICE":
      return stepRegistry.MULTIPLE_CHOICE.getCta({ ...context, step })
    case "FILL_IN_THE_BLANK":
      return stepRegistry.FILL_IN_THE_BLANK.getCta({ ...context, step })
    case "ORDERING":
      return stepRegistry.ORDERING.getCta({ ...context, step })
    case "HIGHLIGHT":
      return stepRegistry.HIGHLIGHT.getCta({ ...context, step })
    case "SHORT_ANSWER":
      return stepRegistry.SHORT_ANSWER.getCta({ ...context, step })
    case "WRITING":
      return stepRegistry.WRITING.getCta({ ...context, step })
    case "REWRITING":
      return stepRegistry.REWRITING.getCta({ ...context, step })
    case "AI_FEEDBACK":
      return stepRegistry.AI_FEEDBACK.getCta({ ...context, step })
    case "AI_COMPARISON":
      return stepRegistry.AI_COMPARISON.getCta({ ...context, step })
  }
}

export function renderStep(context: StepRenderInput): ReactNode {
  const step = context.step

  if (step.type === "INTRO") {
    return stepRegistry.INTRO.render({ ...context, step })
  }
  if (step.type === "COMPLETION") {
    return stepRegistry.COMPLETION.render({ ...context, step })
  }
  if (step.type === "CONCEPT") {
    return stepRegistry.CONCEPT.render({ ...context, step })
  }
  if (step.type === "EXAMPLE") {
    return stepRegistry.EXAMPLE.render({ ...context, step })
  }
  if (step.type === "MULTIPLE_CHOICE") {
    return stepRegistry.MULTIPLE_CHOICE.render({ ...context, step })
  }
  if (step.type === "FILL_IN_THE_BLANK") {
    return stepRegistry.FILL_IN_THE_BLANK.render({ ...context, step })
  }
  if (step.type === "ORDERING") {
    return stepRegistry.ORDERING.render({ ...context, step })
  }
  if (step.type === "HIGHLIGHT") {
    return stepRegistry.HIGHLIGHT.render({ ...context, step })
  }
  if (step.type === "SHORT_ANSWER") {
    return stepRegistry.SHORT_ANSWER.render({ ...context, step })
  }
  if (step.type === "WRITING") {
    return stepRegistry.WRITING.render({ ...context, step })
  }
  if (step.type === "REWRITING") {
    return stepRegistry.REWRITING.render({ ...context, step })
  }
  if (step.type === "AI_FEEDBACK") {
    return stepRegistry.AI_FEEDBACK.render({ ...context, step })
  }

  return stepRegistry.AI_COMPARISON.render({ ...context, step })
}

export function serializeStepState(
  step: Step,
  state: StepState
): StepResponse | undefined {
  switch (step.type) {
    case "MULTIPLE_CHOICE":
      return stepRegistry.MULTIPLE_CHOICE.serialize?.(state)
    case "FILL_IN_THE_BLANK":
      return stepRegistry.FILL_IN_THE_BLANK.serialize?.(state)
    case "ORDERING":
      return stepRegistry.ORDERING.serialize?.(state)
    case "HIGHLIGHT":
      return stepRegistry.HIGHLIGHT.serialize?.(state)
    case "SHORT_ANSWER":
      return stepRegistry.SHORT_ANSWER.serialize?.(state)
    case "WRITING":
      return stepRegistry.WRITING.serialize?.(state)
    case "REWRITING":
      return stepRegistry.REWRITING.serialize?.(state)
    case "INTRO":
    case "COMPLETION":
    case "CONCEPT":
    case "EXAMPLE":
    case "AI_FEEDBACK":
    case "AI_COMPARISON":
      return undefined
  }
}

export function deserializeStepResponse(
  response: StepResponse
): StepState | undefined {
  switch (response.type) {
    case "MULTIPLE_CHOICE":
      return stepRegistry.MULTIPLE_CHOICE.deserialize?.(response)
    case "FILL_IN_THE_BLANK":
      return stepRegistry.FILL_IN_THE_BLANK.deserialize?.(response)
    case "ORDERING":
      return stepRegistry.ORDERING.deserialize?.(response)
    case "HIGHLIGHT":
      return stepRegistry.HIGHLIGHT.deserialize?.(response)
    case "SHORT_ANSWER":
      return stepRegistry.SHORT_ANSWER.deserialize?.(response)
    case "WRITING":
      return stepRegistry.WRITING.deserialize?.(response)
    case "REWRITING":
      return stepRegistry.REWRITING.deserialize?.(response)
  }
}
