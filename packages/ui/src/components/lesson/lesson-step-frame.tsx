import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card"
import { LessonAnswerErrorMessage } from "./lesson-answer-error-message"

export function LessonStepFrame({
  answerError,
  children,
  description,
  standalone = false,
  stepId,
  stepIndex,
  title,
  totalSteps,
}: {
  readonly answerError?: null | string
  readonly children: ReactNode
  readonly description?: string
  readonly standalone?: boolean
  readonly stepId: string
  readonly stepIndex: number
  readonly title?: string
  readonly totalSteps: number
}) {
  if (standalone) {
    return (
      <>
        {children}
        <LessonAnswerErrorMessage answerError={answerError} />
      </>
    )
  }

  const headingId = `lesson-step-${stepId}`

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <p className="text-sm font-medium text-muted-foreground">
        {stepIndex + 1}/{totalSteps} 스텝
      </p>
      <Card>
        <CardHeader>
          <CardTitle as="h1" id={headingId}>
            {title}
          </CardTitle>
          {description === undefined ? null : (
            <CardDescription>{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {children}
          <LessonAnswerErrorMessage answerError={answerError} />
        </CardContent>
      </Card>
    </section>
  )
}
