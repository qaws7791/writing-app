import type { ReactNode } from "react"

import { LessonAnswerErrorMessage } from "./lesson-answer-error-message"

export function LessonStepFrame({
  answerError,
  children,
  stepId,
  stepIndex,
  totalSteps,
}: {
  readonly answerError?: null | string
  readonly children: ReactNode
  readonly stepId: string
  readonly stepIndex: number
  readonly totalSteps: number
}) {
  const headingId = `lesson-step-${stepId}`

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <p className="text-sm font-medium text-muted-foreground">
        {stepIndex + 1}/{totalSteps} 스텝
      </p>
      {children}
      <LessonAnswerErrorMessage answerError={answerError} />
    </section>
  )
}
