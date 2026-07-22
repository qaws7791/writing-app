import type { LessonStepDto } from "@workspace/contracts/content/course"
import type { CourseId, LessonStepId } from "@workspace/contracts/content/ids"
import type {
  CurriculumVersionId,
  LearnerStepSubmission,
} from "@workspace/contracts/learning/step-data"

import type {
  CompleteLearnerAiFeedbackCommand,
  LearnerAiFeedbackContext,
  LearnerTransitionError,
  PrepareLearnerAiFeedbackCommand,
} from "#core/modules/learning/domain/learner-transition"
import { err, ok, type Result } from "@workspace/kernel/result"

type AiFeedbackStepSnapshot = {
  readonly content: LessonStepDto
  readonly id: LessonStepId
}

type AiFeedbackProgressSnapshot =
  | { readonly kind: "not-started" }
  | {
      readonly currentStepId: LessonStepId
      readonly kind: "completed" | "in-progress"
    }

type AiFeedbackLessonSnapshot =
  | {
      readonly kind: "lesson-scope-missing"
      readonly publishedLessonExists: boolean
    }
  | {
      readonly isUnlocked: boolean
      readonly kind: "lesson"
      readonly progress: AiFeedbackProgressSnapshot
      readonly steps: readonly AiFeedbackStepSnapshot[]
    }

export type PrepareAiFeedbackTargetSnapshot = AiFeedbackLessonSnapshot

export type PrepareAiFeedbackTargetDecision =
  | { readonly error: LearnerTransitionError; readonly kind: "rejected" }
  | {
      readonly focus: string
      readonly kind: "load-context"
      readonly showScore: boolean
      readonly targetStepId: LessonStepId
    }

export type PrepareAiFeedbackContextSnapshot = {
  readonly answer: LearnerStepSubmission | null
  readonly courseId: CourseId
  readonly curriculumVersionId: CurriculumVersionId
  readonly lessonTitle: string | null
}

export type FinalizeAiFeedbackSnapshot =
  | { readonly kind: "lesson-locked" }
  | Extract<AiFeedbackLessonSnapshot, { readonly kind: "lesson" }>

export type FinalizeAiFeedbackDecision =
  | { readonly error: LearnerTransitionError; readonly kind: "rejected" }
  | { readonly kind: "advance"; readonly requestedStepIndex: number }
  | { readonly kind: "replay-advanced" }
  | { readonly kind: "replay-completed" }

export function decidePrepareAiFeedbackTarget(
  command: PrepareLearnerAiFeedbackCommand,
  snapshot: PrepareAiFeedbackTargetSnapshot
): PrepareAiFeedbackTargetDecision {
  if (snapshot.kind === "lesson-scope-missing") {
    return reject(
      snapshot.publishedLessonExists ? "lesson-locked" : "lesson-not-found",
      command
    )
  }
  if (!snapshot.isUnlocked) return reject("lesson-locked", command)

  const requestedStepIndex = snapshot.steps.findIndex(
    (step) => step.id === command.stepId
  )
  const requestedStep = snapshot.steps[requestedStepIndex]
  if (requestedStepIndex < 0 || requestedStep === undefined) {
    return reject("invalid-request", command)
  }
  if (requestedStep.content.type !== "AI_FEEDBACK") {
    return reject("invalid-request", command)
  }
  if (snapshot.progress.kind === "not-started") {
    return reject("step-sequence-conflict", command)
  }

  const currentStepId = snapshot.progress.currentStepId
  const currentStepIndex = snapshot.steps.findIndex(
    (step) => step.id === currentStepId
  )
  if (
    snapshot.progress.kind !== "completed" &&
    requestedStepIndex > currentStepIndex
  ) {
    return reject("step-sequence-conflict", command)
  }

  const aiStep = requestedStep.content
  const targetStepIndex = snapshot.steps.findIndex(
    (step) => step.id === aiStep.target
  )
  const targetStep = snapshot.steps[targetStepIndex]
  if (targetStep === undefined) {
    return {
      error: {
        kind: "feedback-target-invalid",
        reason: "target-step-not-found",
        stepId: command.stepId,
      },
      kind: "rejected",
    }
  }
  if (targetStep.content.type !== "WRITE") {
    return {
      error: {
        kind: "feedback-target-invalid",
        reason: "target-step-not-write",
        stepId: command.stepId,
      },
      kind: "rejected",
    }
  }
  if (targetStepIndex >= requestedStepIndex) {
    return {
      error: {
        kind: "feedback-target-invalid",
        reason: "target-step-not-before-feedback",
        stepId: command.stepId,
      },
      kind: "rejected",
    }
  }

  return {
    focus: aiStep.focus,
    kind: "load-context",
    showScore: aiStep.showScore,
    targetStepId: targetStep.content.id,
  }
}

export function decidePrepareAiFeedbackContext(
  command: PrepareLearnerAiFeedbackCommand,
  target: Extract<PrepareAiFeedbackTargetDecision, { kind: "load-context" }>,
  snapshot: PrepareAiFeedbackContextSnapshot
): Result<LearnerAiFeedbackContext, LearnerTransitionError> {
  if (snapshot.answer === null || snapshot.answer.type !== "WRITE") {
    return err({
      kind: "feedback-answer-not-found",
      targetStepId: target.targetStepId,
    })
  }
  if (snapshot.lessonTitle === null) {
    return err({ kind: "lesson-not-found", lessonId: command.lessonId })
  }

  return ok({
    answer: snapshot.answer.text,
    courseId: snapshot.courseId,
    curriculumVersionId: snapshot.curriculumVersionId,
    focus: target.focus,
    lessonTitle: snapshot.lessonTitle,
    showScore: target.showScore,
  })
}

export function decideFinalizeAiFeedback(
  command: CompleteLearnerAiFeedbackCommand,
  snapshot: FinalizeAiFeedbackSnapshot
): FinalizeAiFeedbackDecision {
  if (snapshot.kind === "lesson-locked" || !snapshot.isUnlocked) {
    return reject("lesson-locked", command)
  }

  const requestedStepIndex = snapshot.steps.findIndex(
    (step) => step.id === command.stepId
  )
  const requestedStep = snapshot.steps[requestedStepIndex]
  if (requestedStepIndex < 0 || requestedStep === undefined) {
    return reject("invalid-request", command)
  }
  if (requestedStep.content.type !== "AI_FEEDBACK") {
    return reject("invalid-request", command)
  }
  if (snapshot.progress.kind === "not-started") {
    return reject("step-sequence-conflict", command)
  }

  const currentStepId = snapshot.progress.currentStepId
  const currentStepIndex = snapshot.steps.findIndex(
    (step) => step.id === currentStepId
  )
  if (
    snapshot.progress.kind !== "completed" &&
    requestedStepIndex > currentStepIndex
  ) {
    return reject("step-sequence-conflict", command)
  }
  if (snapshot.progress.kind === "completed") {
    return { kind: "replay-completed" }
  }
  if (requestedStepIndex < currentStepIndex) {
    return { kind: "replay-advanced" }
  }
  return { kind: "advance", requestedStepIndex }
}

function reject(
  kind:
    | "invalid-request"
    | "lesson-locked"
    | "lesson-not-found"
    | "step-sequence-conflict",
  command: PrepareLearnerAiFeedbackCommand
): { readonly error: LearnerTransitionError; readonly kind: "rejected" } {
  return {
    error:
      kind === "lesson-locked" || kind === "lesson-not-found"
        ? { kind, lessonId: command.lessonId }
        : {
            kind,
            lessonId: command.lessonId,
            stepId: command.stepId,
          },
    kind: "rejected",
  }
}
