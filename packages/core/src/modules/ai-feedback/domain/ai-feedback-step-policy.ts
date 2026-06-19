import type {
  LessonDto,
  LessonStepDto,
} from "@workspace/core/modules/content/domain/content.dto"
import type { LessonStepId } from "@workspace/core/modules/content/domain/content.ids"

export type AiFeedbackLessonStep = Extract<
  LessonStepDto,
  { readonly type: "AI_FEEDBACK" }
>

export type AiFeedbackStepPolicyRejectionReason =
  | "step-feedback-not-supported"
  | "step-not-found-in-lesson"

export type AiFeedbackStepPolicyResult =
  | {
      readonly kind: "accepted"
      readonly step: AiFeedbackLessonStep
    }
  | {
      readonly kind: "rejected"
      readonly reason: AiFeedbackStepPolicyRejectionReason
      readonly stepId: LessonStepId
    }

export function resolveAiFeedbackStep({
  lesson,
  stepId,
}: {
  readonly lesson: LessonDto
  readonly stepId: LessonStepId
}): AiFeedbackStepPolicyResult {
  const step = lesson.steps.find((candidate) => candidate.id === stepId)

  if (step === undefined) {
    return {
      kind: "rejected",
      reason: "step-not-found-in-lesson",
      stepId,
    }
  }

  if (step.type !== "AI_FEEDBACK") {
    return {
      kind: "rejected",
      reason: "step-feedback-not-supported",
      stepId,
    }
  }

  return {
    kind: "accepted",
    step,
  }
}
