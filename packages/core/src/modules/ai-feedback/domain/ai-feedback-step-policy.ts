import type {
  LessonDto,
  LessonStepDto,
} from "#core/modules/content/domain/content.dto"
import type { LessonStepId } from "#core/modules/content/domain/content.ids"

export type AiFeedbackLessonStep = Extract<
  LessonStepDto,
  { readonly type: "AI_FEEDBACK" }
>

export type AiFeedbackTargetStep = Extract<
  LessonStepDto,
  { readonly type: "WRITE" }
>

export type AiFeedbackStepPolicyRejectionReason =
  | "step-feedback-not-supported"
  | "step-not-found-in-lesson"
  | "target-step-not-before-feedback"
  | "target-step-not-found"
  | "target-step-not-write"

export type AiFeedbackStepPolicyResult =
  | {
      readonly kind: "accepted"
      readonly step: AiFeedbackLessonStep
      readonly targetStep: AiFeedbackTargetStep
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

  const targetStep = lesson.steps.find(
    (candidate) => candidate.id === step.target
  )

  if (targetStep === undefined) {
    return {
      kind: "rejected",
      reason: "target-step-not-found",
      stepId,
    }
  }

  if (targetStep.type !== "WRITE") {
    return {
      kind: "rejected",
      reason: "target-step-not-write",
      stepId,
    }
  }

  if (targetStep.sortOrder >= step.sortOrder) {
    return {
      kind: "rejected",
      reason: "target-step-not-before-feedback",
      stepId,
    }
  }

  return {
    kind: "accepted",
    step,
    targetStep,
  }
}
