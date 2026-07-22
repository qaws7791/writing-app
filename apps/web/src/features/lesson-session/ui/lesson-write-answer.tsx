"use client"

import { useEffect, useRef, useState } from "react"

import type { LearnerLessonStep as LessonStep } from "@workspace/contracts/learning/learner-content"
import { WriteAnswer } from "@workspace/ui/components/lesson/write-answer"
import type { LessonStepCheckedVisual } from "@workspace/ui/components/lesson/lesson-step-checked-visual"

import { writeLessonDraftText } from "@/features/lesson-session/api/lesson-draft-storage"
import { useLessonDraftText } from "@/features/lesson-session/hooks/use-lesson-draft-text"
import type { LessonStepAnswerPayload } from "@/features/lesson-session/model/lesson-logic"

type WriteLessonStep = Extract<LessonStep, { readonly type: "WRITE" }>

export function LessonWriteAnswer({
  checked,
  emitAnswer,
  learnerId,
  step,
}: {
  readonly checked: LessonStepCheckedVisual
  readonly emitAnswer: (payload: LessonStepAnswerPayload) => void
  readonly learnerId: string
  readonly step: WriteLessonStep
}) {
  const storedDraftText = useLessonDraftText(learnerId, step.id)
  const [editedText, setEditedText] = useState<null | string>(null)
  const emittedRestoredText = useRef<null | string>(null)
  const text = editedText ?? storedDraftText
  const guide = step.guide ?? step.context

  useEffect(() => {
    if (
      editedText !== null ||
      storedDraftText === "" ||
      emittedRestoredText.current === storedDraftText
    ) {
      return
    }

    emittedRestoredText.current = storedDraftText
    emitAnswer({ text: storedDraftText, type: "WRITE" })
  }, [editedText, emitAnswer, storedDraftText])

  return (
    <WriteAnswer
      {...(step.badge === undefined ? {} : { badge: step.badge })}
      checked={checked}
      {...(step.claim === undefined ? {} : { claim: step.claim })}
      {...(step.draft === undefined ? {} : { draft: step.draft })}
      {...(step.goal === undefined ? {} : { goal: step.goal })}
      {...(guide === undefined ? {} : { guide })}
      {...(step.max === undefined ? {} : { max: step.max })}
      {...(step.min === undefined ? {} : { min: step.min })}
      onChange={(text) => {
        setEditedText(text)
        writeLessonDraftText(learnerId, step.id, text)
        emitAnswer({ text, type: "WRITE" })
      }}
      onDraftSave={(text) => writeLessonDraftText(learnerId, step.id, text)}
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
