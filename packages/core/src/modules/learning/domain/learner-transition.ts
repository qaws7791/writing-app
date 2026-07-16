import type {
  LessonId,
  LessonStepId,
} from "@workspace/contracts/content/content.ids"
import type {
  CompleteLearnerStepBody,
  CompleteLearnerStepResult,
  CurriculumVersionId,
  LearnerId,
  LessonLearningState,
} from "@workspace/contracts/learning"
import type { AiFeedbackPayload } from "@workspace/contracts/ai-feedback"

export type StartLearnerLessonCommand = {
  readonly expectedCurriculumVersionId: CurriculumVersionId
  readonly lessonId: LessonId
  readonly occurredAt: Date
  readonly userId: LearnerId
}

export type CompleteLearnerStepCommand = {
  readonly lessonId: LessonId
  readonly occurredAt: Date
  readonly request: CompleteLearnerStepBody
  readonly stepId: LessonStepId
  readonly userId: LearnerId
}

export type CompleteLearnerAiFeedbackCommand = {
  readonly attemptId: string
  readonly feedback: AiFeedbackPayload
  readonly lessonId: LessonId
  readonly occurredAt: Date
  readonly stepId: LessonStepId
  readonly userId: LearnerId
}

export type PrepareLearnerAiFeedbackCommand = Pick<
  CompleteLearnerAiFeedbackCommand,
  "lessonId" | "stepId" | "userId"
>

export type LearnerAiFeedbackContext = {
  readonly answer: string
  readonly focus: string
  readonly lessonTitle: string
}

export type LearnerTransitionError =
  | { readonly kind: "lesson-not-found"; readonly lessonId: LessonId }
  | { readonly kind: "lesson-locked"; readonly lessonId: LessonId }
  | {
      readonly kind: "curriculum-version-changed"
      readonly lessonId: LessonId
    }
  | {
      readonly kind: "step-sequence-conflict"
      readonly lessonId: LessonId
      readonly stepId: LessonStepId
    }
  | {
      readonly kind: "invalid-request"
      readonly lessonId: LessonId
      readonly stepId: LessonStepId
    }
  | {
      readonly kind: "feedback-answer-not-found"
      readonly targetStepId: LessonStepId
    }
  | {
      readonly kind: "feedback-target-invalid"
      readonly reason:
        | "target-step-not-before-feedback"
        | "target-step-not-found"
        | "target-step-not-write"
      readonly stepId: LessonStepId
    }

export type StartLearnerLessonResult = LessonLearningState
export type CompleteLearnerStepTransitionResult = CompleteLearnerStepResult
