"use client"

import type { LearnerLessonStep as LessonStep } from "@workspace/contracts/learning"
import { AiFeedbackAnswer } from "@workspace/ui/components/lesson/ai-feedback-answer"

import { useLessonDraftText } from "@/features/lesson-session/hooks/use-lesson-draft-text"
import type {
  LessonAiFeedbackOutcome,
  LessonAiFeedbackRequest,
} from "@/features/lesson-session/model/lesson-logic"

type AiFeedbackLessonStep = Extract<
  LessonStep,
  { readonly type: "AI_FEEDBACK" }
>

export function LessonAiFeedbackAnswer({
  learnerId,
  onAiFeedbackRequest,
  step,
}: {
  readonly learnerId: string
  readonly onAiFeedbackRequest?: (
    request: LessonAiFeedbackRequest
  ) => Promise<LessonAiFeedbackOutcome>
  readonly step: AiFeedbackLessonStep
}) {
  const draftText = useLessonDraftText(learnerId, step.target)

  return (
    <AiFeedbackAnswer
      allowRetry
      draftText={draftText}
      focus={step.focus}
      onRequest={async () =>
        onAiFeedbackRequest === undefined
          ? { message: "AI 코칭을 사용할 수 없습니다.", status: "error" }
          : onAiFeedbackRequest({ stepId: step.id })
      }
    />
  )
}
