"use client"

import type { ReactNode } from "react"

import { AiFeedbackAnswer } from "./components/ai-feedback-answer"
import { CategorizeAnswer } from "./components/categorize-answer"
import { CompareStepView } from "./components/compare-step-view"
import { FillBlankAnswer } from "./components/fill-blank-answer"
import { LessonAnswerErrorMessage } from "./components/lesson-answer-error-message"
import { MatchAnswer } from "./components/match-answer"
import { MultipleChoiceAnswer } from "./components/multiple-choice-answer"
import { OrderAnswer } from "./components/order-answer"
import { ReadingStepView } from "./components/reading-step-view"
import { SelectAnswer } from "./components/select-answer"
import type { StepProps } from "./components/step-types"
import { WriteAnswer } from "./components/write-answer"
import {
  type LessonAiFeedbackOutcome,
  type LessonAiFeedbackRequest,
  type LessonAnswerChange,
  type LessonStepAnswerPayload,
} from "./lesson-logic"
import {
  getLessonStepDescription,
  getLessonStepTitle,
  isLessonStepStandalone,
  type LessonStepCheckedState,
} from "./lesson-step-policy"
import type { LessonStep } from "./lesson-types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"

export type LessonStepRendererProps = {
  readonly step: LessonStep
  readonly stepIndex: number
  readonly totalSteps: number
  readonly answerError?: null | string
  readonly checked?: LessonStepCheckedState | false
  readonly onAiFeedbackRequest?: (
    request: LessonAiFeedbackRequest
  ) => Promise<LessonAiFeedbackOutcome>
  readonly onAnswerChange?: (change: LessonAnswerChange) => Promise<void> | void
  readonly onAnswerPayloadChange?: (change: LessonAnswerPayloadChange) => void
}

type LessonAnswerPayloadChange = {
  readonly payload: LessonStepAnswerPayload
  readonly stepId: string
}

type LessonStepContentHandlers = {
  readonly checked: LessonStepCheckedState | false
  readonly onAiFeedbackRequest: LessonStepRendererProps["onAiFeedbackRequest"]
  readonly onAnswerChange: LessonStepRendererProps["onAnswerChange"]
  readonly onAnswerPayloadChange: LessonStepRendererProps["onAnswerPayloadChange"]
}

export const STEP_COMPONENTS = {
  AI_FEEDBACK: AiFeedbackAnswer,
  CATEGORIZE: CategorizeAnswer,
  COMPARE: CompareStepView,
  FILL_BLANK: FillBlankAnswer,
  MATCH: MatchAnswer,
  MULTIPLE_CHOICE: MultipleChoiceAnswer,
  ORDER: OrderAnswer,
  READING: ReadingStepView,
  SELECT: SelectAnswer,
  WRITE: WriteAnswer,
} as const

export function LessonStepRenderer({
  answerError,
  checked = false,
  onAiFeedbackRequest,
  onAnswerChange,
  onAnswerPayloadChange,
  step,
  stepIndex,
  totalSteps,
}: LessonStepRendererProps) {
  if (isLessonStepStandalone(step)) {
    return (
      <>
        {renderStepContent(step, {
          checked,
          onAiFeedbackRequest,
          onAnswerChange,
          onAnswerPayloadChange,
        })}
        <LessonAnswerErrorMessage answerError={answerError} />
      </>
    )
  }

  const headingId = `lesson-step-${step.id}`

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <p className="text-sm font-medium text-muted-foreground">
        {stepIndex + 1}/{totalSteps} 스텝
      </p>
      <Card>
        <CardHeader>
          <CardTitle as="h1" id={headingId}>
            {getLessonStepTitle(step)}
          </CardTitle>
          <CardDescription>{getLessonStepDescription(step)}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {renderStepContent(step, {
            checked,
            onAiFeedbackRequest,
            onAnswerChange,
            onAnswerPayloadChange,
          })}
          <LessonAnswerErrorMessage answerError={answerError} />
        </CardContent>
      </Card>
    </section>
  )
}

function renderStepContent(
  step: LessonStep,
  handlers: LessonStepContentHandlers
): ReactNode {
  const Component = STEP_COMPONENTS[step.type] as React.ComponentType<
    StepProps<LessonStep>
  >

  if (Component === undefined) {
    return null
  }

  return <Component step={step} {...handlers} />
}
