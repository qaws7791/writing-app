import type { ReactNode } from "react"

import { LessonAnswerErrorMessage } from "#ui/components/lesson/lesson-answer-error-message"

export function LessonStepFrame({
  answerError,
  children,
  stepId,
}: {
  readonly answerError?: null | string
  readonly children: ReactNode
  readonly stepId: string
}) {
  const headingId = `lesson-step-${stepId}`

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      {children}
      <LessonAnswerErrorMessage
        {...(answerError === undefined ? {} : { answerError })}
      />
    </section>
  )
}
