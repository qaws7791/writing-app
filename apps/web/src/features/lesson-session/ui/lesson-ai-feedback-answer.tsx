"use client"

import { AiFeedbackAnswer } from "@workspace/ui/components/lesson/ai-feedback-answer"

import type {
  LessonAiFeedbackOutcome,
  LessonAiFeedbackRequest,
  LessonAiFeedbackSkipOutcome,
} from "@/features/lesson-session/model/lesson-logic"
import type { LearnerLessonStepDto as LessonStep } from "@/shared/http/learner-api-client"

type AiFeedbackLessonStep = Extract<
  LessonStep,
  { readonly type: "AI_FEEDBACK" }
>

export function LessonAiFeedbackAnswer({
  draftText,
  onAiFeedbackRequest,
  onAiFeedbackSkip,
  step,
}: {
  readonly draftText: string
  readonly onAiFeedbackRequest?: (
    request: LessonAiFeedbackRequest
  ) => Promise<LessonAiFeedbackOutcome>
  readonly onAiFeedbackSkip?: (
    request: LessonAiFeedbackRequest
  ) => Promise<LessonAiFeedbackSkipOutcome>
  readonly step: AiFeedbackLessonStep
}) {
  return (
    <AiFeedbackAnswer
      allowRetry
      draftText={draftText}
      focus={step.focus}
      {...(onAiFeedbackSkip === undefined
        ? {}
        : {
            onContinueWithoutFeedback: () =>
              onAiFeedbackSkip({ stepId: step.id }),
          })}
      onRequest={async () =>
        onAiFeedbackRequest === undefined
          ? {
              kind: "fatal",
              message: "AI 코칭을 사용할 수 없습니다.",
              status: "error",
            }
          : onAiFeedbackRequest({ stepId: step.id })
      }
    />
  )
}
