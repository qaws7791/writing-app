"use client"

import { WriteAnswer } from "@workspace/ui/components/lesson/write-answer"
import type { LessonStepCheckedVisual } from "@workspace/ui/components/lesson/lesson-step-checked-visual"

import type { LessonStepAnswerPayload } from "@/features/lesson-session/model/lesson-logic"
import type { LearnerLessonStepDto as LessonStep } from "@/shared/http/learner-api-client"

type WriteLessonStep = Extract<LessonStep, { readonly type: "WRITE" }>

export function LessonWriteAnswer({
  checked,
  emitAnswer,
  step,
  text,
}: {
  readonly checked: LessonStepCheckedVisual
  readonly emitAnswer: (payload: LessonStepAnswerPayload) => void
  readonly step: WriteLessonStep
  readonly text: string
}) {
  const guide = step.guide ?? step.context

  return (
    <WriteAnswer
      {...(step.badge === undefined ? {} : { badge: step.badge })}
      checked={checked}
      {...(step.claim === undefined ? {} : { claim: step.claim })}
      {...(step.goal === undefined ? {} : { goal: step.goal })}
      {...(guide === undefined ? {} : { guide })}
      {...(step.max === undefined ? {} : { max: step.max })}
      {...(step.min === undefined ? {} : { min: step.min })}
      onChange={(text) => {
        emitAnswer({ text, type: "WRITE" })
      }}
      {...(step.placeholder === undefined
        ? {}
        : { placeholder: step.placeholder })}
      {...(step.reference === undefined ? {} : { reference: step.reference })}
      {...(step.sample === undefined ? {} : { sample: step.sample })}
      {...(step.structure === undefined ? {} : { structure: step.structure })}
      text={text}
      title={step.title ?? step.prompt ?? ""}
    />
  )
}
