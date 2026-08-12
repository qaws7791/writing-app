import type { ReactNode } from "react"

import { LessonAnswerErrorMessage } from "#ui/components/learning/lesson-answer-error-message"
import { Step } from "#ui/components/learning/step"

export function LessonStepFrame({
  answerError,
  children,
  stepId,
}: {
  readonly answerError?: null | string
  readonly children: ReactNode
  readonly stepId: string
}) {
  return (
    <Step data-step-id={stepId}>
      {children}
      <LessonAnswerErrorMessage
        {...(answerError === undefined ? {} : { answerError })}
      />
    </Step>
  )
}
